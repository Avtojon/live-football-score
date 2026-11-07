/* LIVE FOOTBALL — Cloudflare Worker (ESPN Public API Proxy & Edge Cache)
   Hech qanday pullik API kalit (API_FOOTBALL_KEY) yoki majburiy KV talab qilmaydi! */

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer";
const ESPN_V2 = "https://site.api.espn.com/apis/v2/sports/soccer";

const LEAGUES = {
  "uefa.champions": { n: "Champions League", c: "Europe", w: 99 },
  "eng.1": { n: "Premier League", c: "England", w: 100 },
  "esp.1": { n: "La Liga", c: "Spain", w: 95 },
  "ger.1": { n: "Bundesliga", c: "Germany", w: 90 },
  "ita.1": { n: "Serie A", c: "Italy", w: 90 },
  "fra.1": { n: "Ligue 1", c: "France", w: 85 },
  "uefa.europa": { n: "Europa League", c: "Europe", w: 84 },
  "uefa.europa.conf": { n: "Conference League", c: "Europe", w: 70 },
  "fifa.world": { n: "World Cup", c: "World", w: 100 },
  "uefa.nations": { n: "Nations League", c: "Europe", w: 75 },
  "conmebol.libertadores": { n: "Copa Libertadores", c: "South America", w: 65 },
  "eng.2": { n: "Championship", c: "England", w: 60 },
  "eng.fa": { n: "FA Cup", c: "England", w: 66 },
  "eng.league_cup": { n: "EFL Cup", c: "England", w: 55 },
  "esp.copa_del_rey": { n: "Copa del Rey", c: "Spain", w: 55 },
  "ita.coppa_italia": { n: "Coppa Italia", c: "Italy", w: 50 },
  "ger.dfb_pokal": { n: "DFB-Pokal", c: "Germany", w: 50 },
  "fra.coupe_de_france": { n: "Coupe de France", c: "France", w: 45 },
  "ned.1": { n: "Eredivisie", c: "Netherlands", w: 55 },
  "por.1": { n: "Primeira Liga", c: "Portugal", w: 55 },
  "tur.1": { n: "Süper Lig", c: "Türkiye", w: 50 },
  "sco.1": { n: "Scottish Premiership", c: "Scotland", w: 40 },
  "usa.1": { n: "MLS", c: "USA", w: 50 },
  "bra.1": { n: "Brasileirão", c: "Brazil", w: 50 },
  "arg.1": { n: "Liga Argentina", c: "Argentina", w: 45 },
  "sau.1": { n: "Saudi Pro League", c: "Saudi Arabia", w: 45 },
  "mex.1": { n: "Liga MX", c: "Mexico", w: 40 }
};

const BIG = new Set([
  "real madrid", "barcelona", "manchester city", "manchester united", "liverpool",
  "arsenal", "chelsea", "tottenham hotspur", "bayern munich", "paris saint-germain",
  "juventus", "inter milan", "ac milan", "atlético madrid", "atletico madrid",
  "borussia dortmund", "napoli"
]);

function corsHeaders(origin, env) {
  const allowed = (env && env.ALLOWED_ORIGIN ? env.ALLOWED_ORIGIN : "*").trim();
  const permitted = allowed === "*" || !origin || origin === allowed || origin.startsWith("http://localhost");
  return {
    "Access-Control-Allow-Origin": permitted ? (allowed === "*" ? "*" : origin) : "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Vary": "Origin"
  };
}

function json(payload, status, cors) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...cors }
  });
}

async function fetchESPN(url, ttlSeconds) {
  const cache = caches.default;
  const cacheKey = new Request(url, { method: "GET" });
  let res = await cache.match(cacheKey);
  if (res) return res.json();

  const upstream = await fetch(url, { headers: { "Accept": "application/json", "User-Agent": "LiveFootballWorker/2.0" } });
  if (!upstream.ok) throw new Error(`HTTP ${upstream.status}`);
  const data = await upstream.json();
  const cachedRes = new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json", "Cache-Control": `public, max-age=${ttlSeconds}` }
  });
  try { await cache.put(cacheKey, cachedRes); } catch (_) {}
  return data;
}

const teamObj = (x, score) => ({
  n: x.team.shortDisplayName || x.team.displayName || x.team.name || "",
  f: x.team.displayName || "",
  i: String(x.team.id || ""),
  l: x.team.logo || "",
  g: Number(score) || 0
});

function mapEvent(ev, lg) {
  const c = (ev.competitions || [])[0];
  if (!c) return null;
  const cs = c.competitors || [];
  const H = cs.find(x => x.homeAway === "home") || cs[0];
  const A = cs.find(x => x.homeAway === "away") || cs[1];
  if (!H || !A || !H.team || !A.team) return null;
  const st = c.status || ev.status || {}, ty = st.type || {}, nm = ty.name || "";
  let s = ty.state === "in" ? "in" : ty.state === "post" ? "post" : "pre";
  if (nm === "STATUS_HALFTIME") s = "ht";
  if (/POSTPONED|CANCEL|ABANDON/.test(nm)) s = "pp";
  const hid = String(H.team.id), e = [];
  for (const d of c.details || []) {
    const k = d.scoringPlay ? "g" : d.yellowCard ? "y" : d.redCard ? "r" : "";
    if (!k) continue;
    const a = d.athletesInvolved && d.athletesInvolved[0];
    e.push({
      k,
      m: (d.clock && d.clock.displayValue) || "",
      t: String(d.team && d.team.id) === hid ? "h" : "a",
      p: (a && (a.displayName || a.fullName)) || "",
      q: d.penaltyKick ? "p" : d.ownGoal ? "o" : ""
    });
  }
  const li = LEAGUES[lg] || { w: 20 };
  const bonus = ([H, A].filter(x => BIG.has(String(x.team.displayName || "").toLowerCase())).length) * 30;
  const note = c.notes && c.notes[0] && c.notes[0].headline;
  return {
    id: String(ev.id), lg, d: ev.date || c.date, s,
    c: st.displayClock || "", sd: ty.shortDetail || ty.detail || "",
    v: (c.venue && c.venue.fullName) || "",
    ct: (c.venue && c.venue.address && c.venue.address.city) || "",
    nt: note || "", pr: li.w * 10 + bonus,
    h: teamObj(H, H.score), a: teamObj(A, A.score), e
  };
}

const sv = (arr, name) => {
  const x = (arr || []).find(s => s.name === name);
  return x ? parseFloat(x.displayValue != null ? x.displayValue : x.value) || 0 : 0;
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);

    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "GET") return json({ ok: false, message: "Only GET requests are supported." }, 405, cors);

    if (url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "LIVE FOOTBALL ESPN Worker v2",
        leagues: Object.entries(LEAGUES).map(([id, v]) => ({ id, n: v.n, c: v.c, w: v.w }))
      }, 200, cors);
    }

    if (url.pathname === "/api/matches") {
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const daysParam = url.searchParams.get("days") || url.searchParams.get("from") || todayStr;
      const days = daysParam.split(",").map(s => s.trim()).filter(s => /^\d{8}$/.test(s)).slice(0, 1);
      if (!days.length) days.push(todayStr);

      const lgParam = url.searchParams.get("leagues") || "";
      const ids = lgParam
        ? lgParam.split(",").map(s => s.trim()).filter(s => LEAGUES[s])
        : Object.keys(LEAGUES);

      const day = days[0];
      const ttl = day === todayStr ? 45 : 600;
      const res = await Promise.allSettled(ids.map(lg => fetchESPN(`${ESPN}/${lg}/scoreboard?dates=${day}`, ttl)));
      const matches = [];
      res.forEach((r, i) => {
        if (r.status === "fulfilled") {
          const evs = (r.value.events || []).map(ev => mapEvent(ev, ids[i])).filter(Boolean);
          matches.push(...evs);
        }
      });
      return json({ ok: true, matches, leagues: LEAGUES, generatedAt: new Date().toISOString() }, 200, cors);
    }

    if (url.pathname === "/api/match") {
      const rawId = String(url.searchParams.get("id") || "").trim();
      let lg = String(url.searchParams.get("lg") || "").trim();
      let eventId = rawId;
      if (rawId.includes(":")) {
        const parts = rawId.split(":");
        lg = parts[0];
        eventId = parts[1];
      }
      if (!lg || !/^\d+$/.test(eventId)) return json({ ok: false, message: "Valid lg and numeric id required." }, 400, cors);
      const ttl = url.searchParams.get("live") === "1" ? 25 : 300;
      try {
        const j = await fetchESPN(`${ESPN}/${encodeURIComponent(lg)}/summary?event=${encodeURIComponent(eventId)}`, ttl);
        const comp = (j.header && j.header.competitions && j.header.competitions[0]) || {};
        const H = (comp.competitors || []).find(x => x.homeAway === "home") || (comp.competitors || [])[0] || {};
        const hid = String((H.team && H.team.id) || "");
        const out = { ok: true, events: [], info: {}, lineup: {}, st: null };
        for (const k of j.keyEvents || []) {
          const tx = String((k.type && (k.type.text || k.type.type)) || "").toLowerCase();
          const kind = (k.scoringPlay || /^(goal|own goal)/.test(tx)) ? "g" : /yellow/.test(tx) ? "y" : /red card/.test(tx) ? "r" : /substitution/.test(tx) ? "s" : "";
          if (!kind) continue;
          const pa = k.participants || [], nm = i => (pa[i] && pa[i].athlete && pa[i].athlete.displayName) || "";
          out.events.push({
            k: kind, m: (k.clock && k.clock.displayValue) || "",
            t: String(k.team && k.team.id) === hid ? "h" : "a",
            p: nm(0), o: nm(1),
            q: /own goal/.test(tx) ? "o" : /penalty/.test(tx) ? "p" : ""
          });
        }
        const gi = j.gameInfo || {};
        out.info = {
          venue: gi.venue && gi.venue.fullName,
          city: gi.venue && gi.venue.address && gi.venue.address.city,
          att: gi.attendance,
          ref: gi.officials && gi.officials[0] && gi.officials[0].fullName
        };
        const bt = (j.boxscore && j.boxscore.teams) || [];
        if (bt.length >= 2) {
          const th = bt.find(t => String(t.team && t.team.id) === hid) || bt[0];
          const ta = bt.find(t => t !== th) || bt[1];
          const pair = n => [sv(th.statistics, n), sv(ta.statistics, n)];
          const st = { p: pair("possessionPct"), sh: pair("totalShots"), ot: pair("shotsOnTarget"), co: pair("wonCorners"), fo: pair("foulsCommitted") };
          if (Object.values(st).some(p => p[0] || p[1])) out.st = st;
        }
        for (const r of j.rosters || []) {
          const side = (String(r.team && r.team.id) === hid || r.homeAway === "home") ? "h" : "a";
          const pl = (r.roster || []).map(p => ({
            n: (p.athlete && (p.athlete.shortName || p.athlete.displayName)) || "",
            num: p.jersey || "",
            pos: (p.position && p.position.abbreviation) || "",
            fp: Number(p.formationPlace) || 0,
            starter: !!p.starter
          }));
          const xi = pl.filter(p => p.starter).sort((a, b) => a.fp - b.fp);
          if (!xi.length) continue;
          const f = r.formation;
          out.lineup[side] = { form: typeof f === "string" ? f : (f && (f.name || f.formationName)) || "", xi, bench: pl.filter(p => !p.starter) };
        }
        return json(out, 200, cors);
      } catch (e) {
        return json({ ok: false, message: e.message || "Failed to load match summary" }, 502, cors);
      }
    }

    if (url.pathname === "/api/table") {
      const lg = String(url.searchParams.get("lg") || "").trim();
      if (!lg) return json({ ok: false, message: "lg parameter required" }, 400, cors);
      try {
        const j = await fetchESPN(`${ESPN_V2}/${encodeURIComponent(lg)}/standings`, 600);
        const kids = j.children && j.children.length ? j.children : (j.standings ? [j] : []);
        const groups = kids.map(ch => ({
          name: ch.name || "",
          rows: ((ch.standings && ch.standings.entries) || []).map(en => {
            const g = n => { const s = (en.stats || []).find(x => x.name === n); return s ? Number(s.value) || 0 : 0; };
            const t = en.team || {};
            return {
              i: String(t.id || ""),
              n: t.shortDisplayName || t.displayName || "",
              l: (t.logos && t.logos[0] && t.logos[0].href) || "",
              r: g("rank"), p: g("gamesPlayed"), w: g("wins"), d: g("ties"), lo: g("losses"), gd: g("pointDifferential"), pts: g("points")
            };
          }).sort((a, b) => a.r - b.r)
        })).filter(g => g.rows.length);
        return json({ ok: true, groups }, 200, cors);
      } catch (e) {
        return json({ ok: false, message: e.message || "Failed to load standings" }, 502, cors);
      }
    }

    return json({ ok: false, message: "Endpoint not found. Use /api/health, /api/matches, /api/match, or /api/table." }, 404, cors);
  }
};
