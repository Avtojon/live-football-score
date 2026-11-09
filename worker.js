/* LIVE FOOTBALL — ESPN proxy (Cloudflare Worker).
   API kalit ham, KV ham KERAK EMAS. Ma'lumot ESPN'ning ochiq (rasmiy bo'lmagan) manbasidan olinadi,
   Worker uni qisqa vaqt keshlaydi (ESPN'ga zo'riqish tushmasligi va sayt tez ishlashi uchun) va ixcham shaklga keltiradi.
   Keyinchalik pullik API'ga o'tsangiz, faqat normMatch/parseSummary/parseTable funksiyalari o'zgaradi. */

const ESPN = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const ESPN_V2 = 'https://site.api.espn.com/apis/v2/sports/soccer';
const TTL_LIVE = 25;      // bugungi va kechagi (jonli) kunlar (soniya)
const TTL_FUTURE = 600;   // kelgusi kunlar
const TTL_PAST = 3600;    // o'tgan kunlar
const TTL_MATCH = 600;    // o'yin tafsilotlari (jonli bo'lmasa)
const TTL_TABLE = 1800;   // turnir jadvali
const MAX_AHEAD = 10, MAX_BACK = 7;   // ruxsat etilgan kunlar oralig'i (UTC bugundan)

/* [ESPN slug, nomi, davlat/hudud, nufuz balli]  — ro'yxat tartibi emas, ball tartibni belgilaydi */
const LEAGUES = [
  ['uefa.champions', 'Champions League', 'Europe', 60],
  ['eng.1', 'Premier League', 'England', 55],
  ['esp.1', 'La Liga', 'Spain', 54],
  ['ita.1', 'Serie A', 'Italy', 48],
  ['ger.1', 'Bundesliga', 'Germany', 47],
  ['uefa.europa', 'Europa League', 'Europe', 46],
  ['fra.1', 'Ligue 1', 'France', 42],
  ['uefa.europa.conf', 'Conference League', 'Europe', 36],
  ['fifa.world', 'World Cup', 'World', 70],
  ['uefa.nations', 'Nations League', 'Europe', 45],
  ['fifa.worldq.uefa', 'World Cup Qualifying · UEFA', 'Europe', 44],
  ['fifa.friendly', 'International Friendly', 'World', 15],
  ['conmebol.libertadores', 'Copa Libertadores', 'South America', 40],
  ['eng.fa', 'FA Cup', 'England', 40],
  ['esp.copa_del_rey', 'Copa del Rey', 'Spain', 38],
  ['ita.coppa_italia', 'Coppa Italia', 'Italy', 34],
  ['ger.dfb_pokal', 'DFB-Pokal', 'Germany', 34],
  ['eng.league_cup', 'EFL Cup', 'England', 34],
  ['fra.coupe_de_france', 'Coupe de France', 'France', 30],
  ['eng.2', 'Championship', 'England', 33],
  ['ned.1', 'Eredivisie', 'Netherlands', 33],
  ['por.1', 'Primeira Liga', 'Portugal', 34],
  ['tur.1', 'Süper Lig', 'Türkiye', 30],
  ['sco.1', 'Scottish Premiership', 'Scotland', 26],
  ['usa.1', 'MLS', 'USA', 28],
  ['bra.1', 'Brasileirão', 'Brazil', 32],
  ['arg.1', 'Liga Argentina', 'Argentina', 30],
  ['ksa.1', 'Saudi Pro League', 'Saudi Arabia', 28],
  ['mex.1', 'Liga MX', 'Mexico', 26],
  ['afc.champions', 'AFC Champions League Elite', 'Asia', 30]
];
const LG = Object.fromEntries(LEAGUES.map(l => [l[0], { n: l[1], c: l[2], w: l[3] }]));

const norm = s => String(s || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const TIERS = [
  [30, ['Real Madrid', 'Barcelona', 'Manchester City', 'Man City', 'Liverpool', 'Bayern Munich', 'Bayern', 'Paris Saint-Germain', 'PSG', 'Arsenal', 'Inter Milan', 'Inter', 'Internazionale', 'Manchester United', 'Man United', 'Brazil', 'Argentina', 'France', 'England', 'Spain', 'Germany']],
  [22, ['Chelsea', 'Atletico Madrid', 'Atletico', 'Juventus', 'AC Milan', 'Milan', 'Napoli', 'Tottenham Hotspur', 'Tottenham', 'Borussia Dortmund', 'Dortmund', 'Bayer Leverkusen', 'Leverkusen', 'Newcastle United', 'Newcastle', 'Aston Villa', 'Roma', 'AS Roma', 'Portugal', 'Netherlands', 'Italy', 'Belgium', 'Croatia', 'Uruguay', 'Colombia', 'Morocco']],
  [14, ['Atalanta', 'Lazio', 'Fiorentina', 'Sevilla', 'Villarreal', 'Real Sociedad', 'Athletic Club', 'RB Leipzig', 'Leipzig', 'Marseille', 'Olympique Marseille', 'Monaco', 'AS Monaco', 'Lyon', 'Olympique Lyonnais', 'Lille', 'Benfica', 'Porto', 'FC Porto', 'Sporting CP', 'Sporting', 'Ajax', 'PSV Eindhoven', 'PSV', 'Feyenoord', 'West Ham United', 'West Ham', 'Brighton', 'Everton', 'Nottingham Forest', 'Fenerbahce', 'Galatasaray', 'Al Hilal', 'Al Nassr', 'Inter Miami', 'Celtic', 'Rangers', 'Real Betis', 'Betis', 'Eintracht Frankfurt', 'Stuttgart', 'VfB Stuttgart', 'Crystal Palace', 'Flamengo', 'Palmeiras', 'Boca Juniors', 'River Plate', 'Uzbekistan']]
].map(([p, a]) => [p, new Set(a.map(norm))]);
const clubPts = names => { const ns = names.filter(Boolean).map(norm); for (const [p, set] of TIERS) if (ns.some(n => set.has(n))) return p; return 6; };

/* ---------- kichik xotira keshi (bir isolate ichida) ---------- */
const mem = new Map();
const health = {};
async function cached(key, ttlSec, fn) {
  const e = mem.get(key);
  if (e && Date.now() - e.t < ttlSec * 1000) return e.v;
  try {
    const v = await fn();
    mem.set(key, { t: Date.now(), v });
    if (mem.size > 120) mem.delete(mem.keys().next().value);
    return v;
  } catch (err) {
    if (e) return e.v;           // xato bo'lsa, eski nusxani beramiz
    throw err;
  }
}
async function espn(url, ttl) {
  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (LiveFootballProxy)', 'Accept': 'application/json' }, cf: { cacheTtl: ttl, cacheEverything: true } });
  if (!r.ok) throw new Error('ESPN HTTP ' + r.status);
  return r.json();
}

/* ---------- normalizatsiya ---------- */
const safeImg = u => (/^https:\/\/[a-z0-9.-]+\/[^\s"'<>]{1,300}$/i.test(String(u || '')) ? String(u) : '');
const hex = c => (/^[0-9a-f]{6}$/i.test(String(c || '')) ? '#' + c : '');
const sv = (c, k) => { const x = (c.statistics || []).find(y => y.name === k); return x ? parseFloat(x.displayValue) || 0 : 0; };
function normMatch(lg, ev) {
  const comp = ev.competitions && ev.competitions[0];
  const cs = comp && comp.competitors;
  if (!cs || cs.length < 2) return null;
  const h = cs.find(c => c.homeAway === 'home') || cs[0], a = cs.find(c => c.homeAway === 'away') || cs[1];
  const st = ev.status || comp.status || {}, ty = st.type || {}, name = ty.name || '';
  let s = 'pre';
  if (/POSTPONED|CANCEL|ABANDON|SUSPEND/.test(name)) s = 'pp';
  else if (/HALFTIME/.test(name)) s = 'ht';
  else if (ty.state === 'in') s = 'in';
  else if (ty.state === 'post') s = 'post';
  const team = c => { const t = c.team || {}; return { i: String(t.id || ''), n: String(t.shortDisplayName || t.name || '?').slice(0, 40), f: String(t.displayName || t.name || '').slice(0, 60), l: safeImg(t.logo), k: hex(t.color), g: s === 'pre' || s === 'pp' ? null : (parseInt(c.score, 10) || 0) }; };
  const e = [];
  for (const d of comp.details || []) {
    const k = d.redCard ? 'r' : d.yellowCard ? 'y' : d.scoringPlay ? 'g' : '';
    if (!k) continue;
    e.push({ m: (d.clock && d.clock.displayValue) || '', k, t: String(d.team && d.team.id) === String(h.team && h.team.id) ? 'h' : 'a',
      p: (d.athletesInvolved && d.athletesInvolved[0] && d.athletesInvolved[0].displayName) || '', q: d.penaltyKick ? 'p' : d.ownGoal ? 'o' : '' });
  }
  const stats = (s === 'pre' || s === 'pp') ? null : {
    p: [sv(h, 'possessionPct'), sv(a, 'possessionPct')], sh: [sv(h, 'totalShots'), sv(a, 'totalShots')], ot: [sv(h, 'shotsOnTarget'), sv(a, 'shotsOnTarget')],
    co: [sv(h, 'wonCorners'), sv(a, 'wonCorners')], fo: [sv(h, 'foulsCommitted'), sv(a, 'foulsCommitted')] };
  const H = team(h), A = team(a), meta = LG[lg] || { w: 25 };
  const note = comp.notes && comp.notes[0] && comp.notes[0].headline;
  return { id: lg + ':' + ev.id, lg, d: ev.date || comp.date || '', s, c: st.displayClock || '', sd: ty.shortDetail || '',
    v: (comp.venue && comp.venue.fullName) || '', ct: (comp.venue && comp.venue.address && comp.venue.address.city) || '', nt: note || '',
    h: H, a: A, e, st: stats, pr: meta.w + clubPts([H.n, H.f]) + clubPts([A.n, A.f]) };
}

const SUB_RE = /Substitution,?\s*(.+?)\.\s*(.+?)\s+replaces\s+(.+?)(?:\.|$)/i;
const minNum = m => parseInt(String(m).replace(/\D.*/, ''), 10) || 0;
function parseSummary(js) {
  const comp = (js.header && js.header.competitions && js.header.competitions[0]) || {};
  const cs = comp.competitors || [];
  const hc = cs.find(c => c.homeAway === 'home') || cs[0] || {}, ac = cs.find(c => c.homeAway === 'away') || cs[1] || {};
  const tid = c => String((c.team && c.team.id) || c.id || '');
  const hid = tid(hc), aid = tid(ac);
  const hn = norm(hc.team && (hc.team.displayName || hc.team.name)), an = norm(ac.team && (ac.team.displayName || ac.team.name));
  const gi = js.gameInfo || {};
  const info = { venue: (gi.venue && gi.venue.fullName) || '', city: (gi.venue && gi.venue.address && gi.venue.address.city) || '',
    att: gi.attendance || null, ref: (gi.officials && gi.officials[0] && gi.officials[0].displayName) || '' };
  const ev = [], seen = new Set();
  const push = o => { const key = o.k + '|' + o.p + '|' + o.m + '|' + (o.o || ''); if (!seen.has(key)) { seen.add(key); ev.push(o); } };
  for (const it of js.keyEvents || []) {
    const ty = String((it.type && (it.type.type || it.type.text)) || '').toLowerCase(), text = it.text || it.shortText || '';
    const m = (it.clock && it.clock.displayValue) || '';
    const tt = String(it.team && it.team.id);
    const side = tt === hid ? 'h' : tt === aid ? 'a' : '';
    const who = (it.participants && it.participants[0] && it.participants[0].athlete && it.participants[0].athlete.displayName) || '';
    if (it.scoringPlay) push({ m, k: 'g', t: side, p: who, q: /penalty/.test(ty + text.toLowerCase()) ? 'p' : /own goal/.test(ty + text.toLowerCase()) ? 'o' : '' });
    else if (/yellow/.test(ty)) push({ m, k: 'y', t: side, p: who });
    else if (/red/.test(ty)) push({ m, k: 'r', t: side, p: who });
  }
  for (const it of [].concat(js.keyEvents || [], js.commentary || [])) {
    const r = SUB_RE.exec(it.text || it.shortText || '');
    if (!r) continue;
    const nt = norm(r[1]);
    const side = nt && (hn.includes(nt) || nt.includes(hn)) ? 'h' : nt && (an.includes(nt) || nt.includes(an)) ? 'a' : (String(it.team && it.team.id) === hid ? 'h' : 'a');
    push({ m: (it.clock && it.clock.displayValue) || (it.time && it.time.displayValue) || '', k: 's', t: side, p: r[2].trim(), o: r[3].trim() });
  }
  ev.sort((x, y) => minNum(x.m) - minNum(y.m));
  const lineup = {};
  for (const r of js.rosters || []) {
    const side = r.homeAway === 'home' ? 'h' : r.homeAway === 'away' ? 'a' : '';
    if (!side) continue;
    let form = r.formation; if (form && typeof form === 'object') form = form.name || form.summary || form.abbreviation;
    const xi = [], bench = [];
    for (const p of r.roster || []) {
      const at = p.athlete || {};
      const o = { n: String(at.displayName || at.shortName || '').split(' ').slice(-1)[0], f: at.displayName || '', num: String(p.jersey || at.jersey || ''), pos: (p.position && p.position.abbreviation) || (at.position && at.position.abbreviation) || '', fp: parseInt(p.formationPlace, 10) || 0 };
      (p.starter ? xi : bench).push(o);
    }
    if (xi.length >= 11) { xi.sort((x, y) => (x.fp || 99) - (y.fp || 99)); lineup[side] = { form: String(form || ''), xi: xi.slice(0, 11), bench: bench.slice(0, 12) }; }
  }
  return { info, events: ev, lineup };
}

function parseTable(js) {
  const groups = [];
  const walk = node => {
    (node.children || []).forEach(walk);
    const entries = node.standings && node.standings.entries;
    if (!entries) return;
    const rows = entries.map((en, i) => {
      const st = {}; (en.stats || []).forEach(x => { if (x && x.name) st[x.name] = x.value; });
      const t = en.team || {};
      return { r: st.rank != null ? Math.round(st.rank) : i + 1, i: String(t.id || ''), n: t.shortDisplayName || t.displayName || t.name || '?', l: safeImg((t.logos && t.logos[0] && t.logos[0].href) || t.logo),
        p: Math.round(st.gamesPlayed || 0), w: Math.round(st.wins || 0), d: Math.round(st.ties || 0), lo: Math.round(st.losses || 0), gd: Math.round(st.pointDifferential || 0), pts: Math.round(st.points || 0) };
    }).sort((x, y) => x.r - y.r);
    groups.push({ name: node.name || '', rows });
  };
  walk(js);
  return { groups };
}

/* ---------- Sharhlar (admin yozadi, hamma o'qiydi). KV kerak: binding nomi NOTES (yoki eski MATCH_CACHE) ---------- */
const enc = new TextEncoder();
function safeEq(a, b) { a = enc.encode(String(a)); b = enc.encode(String(b)); let d = a.length ^ b.length; const n = Math.max(a.length, b.length); for (let i = 0; i < n; i++) d |= (a[i] || 0) ^ (b[i] || 0); return d === 0; }
const kvOf = env => (env && (env.NOTES || env.MATCH_CACHE)) || null;
const cleanText = (t, n = 280) => String(t || '').replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
async function translateUz(text) {
  try {
    const r = await fetch('https://api.mymemory.translated.net/get?langpair=uz|en&q=' + encodeURIComponent(text));
    const j = await r.json(); const x = j && j.responseData && j.responseData.translatedText;
    if (x && j.responseStatus == 200 && !/MYMEMORY/i.test(x)) return cleanText(x);
  } catch (_) {}
  try {
    const r = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=uz&tl=en&dt=t&q=' + encodeURIComponent(text));
    const j = await r.json(); const x = (j[0] || []).map(a => a[0]).join('');
    if (x) return cleanText(x);
  } catch (_) {}
  return null;
}
const noteKey = id => 'notes:' + id;
async function readNotes(kv, id) { try { const v = await kv.get(noteKey(id), 'json'); return v && Array.isArray(v.notes) ? v : { notes: [], pin: '' }; } catch (_) { return { notes: [], pin: '' }; } }
const saveNotes = (kv, id, v) => kv.put(noteKey(id), JSON.stringify(v), { expirationTtl: 14 * 86400 });
const validMatchId = id => /^[a-z0-9.]{2,30}:\d{1,12}$/.test(String(id || ''));

/* ---------- HTTP ---------- */
const ORIGIN_LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
function corsHeaders(origin, env) {
  const list = String((env && env.ALLOWED_ORIGIN) || '*').split(',').map(x => x.trim()).filter(Boolean);
  const any = list.includes('*');
  const ok = any || list.includes(origin) || ORIGIN_LOCAL.test(origin);
  return { 'Access-Control-Allow-Origin': ok ? (any ? '*' : origin) : 'null', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Accept, X-Admin-Token', 'Access-Control-Max-Age': '86400', 'Vary': 'Origin' };
}
const SEC = { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cross-Origin-Resource-Policy': 'cross-origin', 'Content-Security-Policy': "default-src 'none'" };
const json = (payload, status, cors, maxAge = 0) => new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': maxAge ? `public, max-age=${maxAge}` : 'no-store', ...SEC, ...cors } });
const utcDay = (d = new Date()) => d.toISOString().slice(0, 10).replace(/-/g, '');
const dayNum = s => Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8)) / 864e5;
const validDay = s => /^\d{8}$/.test(s) && Number.isFinite(dayNum(s)) && new Date(dayNum(s) * 864e5).toISOString().slice(0, 10).replace(/-/g, '') === s;
const tokenOk = (q, env) => !!(env && env.ADMIN_TOKEN) && q.get('key') === env.ADMIN_TOKEN;

/* Bitta liga, bitta kun. ESPN sana ORALIG'IGA (YYYYMMDD-YYYYMMDD) ba'zan HTTP 400 beradi, shuning uchun faqat BITTA kun so'raymiz.
   400 qaytsa va bu bugungi kun bo'lsa, sana parametrisiz (ESPN'ning standart oynasi) so'rov bilan qayta urinamiz. */
async function leagueDay(slug, day, ttl) {
  try {
    const js = await espn(`${ESPN}/${slug}/scoreboard?dates=${day}`, ttl);
    health[slug] = { ok: true, variant: 'day', n: (js.events || []).length };
    return js.events || [];
  } catch (err) {
    const bad = /HTTP 400|HTTP 404/.test(String(err.message));
    if (bad && day === utcDay()) {
      try {
        const js = await espn(`${ESPN}/${slug}/scoreboard`, ttl);
        health[slug] = { ok: true, variant: 'default', n: (js.events || []).length };
        return js.events || [];
      } catch (e2) { err = e2; }
    }
    health[slug] = { ok: false, error: String(err.message).slice(0, 60) };
    throw err;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url), q = url.searchParams;
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeaders(origin, env);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...cors, ...SEC } });
    const isNotePost = request.method === 'POST' && /^\/api\/note(\/(del|clear))?$/.test(url.pathname);
    if (request.method !== 'GET' && !isNotePost) return json({ ok: false, message: 'Method not allowed.' }, 405, cors);
    if (request.url.length > 600) return json({ ok: false, message: 'URL too long.' }, 414, cors);
    const list = String((env && env.ALLOWED_ORIGIN) || '*').split(',').map(x => x.trim()).filter(Boolean);
    if (!list.includes('*') && origin && !list.includes(origin) && !ORIGIN_LOCAL.test(origin)) return json({ ok: false, message: 'Origin not allowed.' }, 403, cors);

    try {
      if (url.pathname === '/api/health') return json({ ok: true, service: 'LIVE FOOTBALL ESPN proxy', version: 3, leagues: LEAGUES.map(l => ({ id: l[0], n: l[1], c: l[2], w: l[3] })), lastStatus: health }, 200, cors);

      /* /api/matches?days=YYYYMMDD  — BITTA kun (Cloudflare bepul tarifi: bir chaqiruvda ≤ 50 ichki so'rov; liga soni ≈ 30) */
      if (url.pathname === '/api/matches') {
        const days = String(q.get('days') || '').split(',').filter(Boolean);
        const today = dayNum(utcDay());
        if (!days.length || days.length > 1 || !days.every(validDay) || days.some(d => dayNum(d) - today > MAX_AHEAD || today - dayNum(d) > MAX_BACK))
          return json({ ok: false, message: 'Use ?days=YYYYMMDD (one UTC day, from ' + MAX_BACK + ' days ago to ' + MAX_AHEAD + ' days ahead).' }, 400, cors);
        const live = days.some(d => Math.abs(dayNum(d) - today) <= 1 && dayNum(d) <= today);
        const ttl = live ? TTL_LIVE : (dayNum(days[0]) > today ? TTL_FUTURE : TTL_PAST);
        const data = await cached(`m|${days.join(',')}`, ttl, async () => {
          const jobs = [];
          for (const d of days) for (const l of LEAGUES) jobs.push([l[0], d]);
          const res = await Promise.allSettled(jobs.map(([slug, d]) => leagueDay(slug, d, ttl)));
          const matches = [], leagues = {};
          res.forEach((r, i) => {
            if (r.status !== 'fulfilled') return;
            const slug = jobs[i][0];
            for (const ev of r.value) { const m = normMatch(slug, ev); if (m) { matches.push(m); leagues[slug] = LG[slug]; } }
          });
          if (!matches.length && res.every(r => r.status === 'rejected')) throw new Error('ESPN unreachable (see /api/health)');
          const seen = new Set();
          return { ok: true, generatedAt: new Date().toISOString(), days, leagues, matches: matches.filter(m => !seen.has(m.id) && seen.add(m.id)) };
        });
        return json(data, 200, cors, 15);
      }

      if (url.pathname === '/api/match') {
        const id = q.get('id') || '';
        const mm = /^([a-z0-9.]+):(\d{1,12})$/.exec(id);
        if (!mm || !LG[mm[1]]) return json({ ok: false, message: 'Bad match id.' }, 400, cors);
        const ttl = q.get('live') === '1' ? TTL_LIVE : TTL_MATCH;
        const data = await cached('s|' + id, ttl, async () => ({ ok: true, id, generatedAt: new Date().toISOString(), ...parseSummary(await espn(`${ESPN}/${mm[1]}/summary?event=${mm[2]}`, ttl)) }));
        return json(data, 200, cors, 15);
      }

      if (url.pathname === '/api/table') {
        const lg = q.get('lg') || '';
        if (!LG[lg]) return json({ ok: false, message: 'Unknown league.' }, 400, cors);
        const data = await cached('t|' + lg, TTL_TABLE, async () => ({ ok: true, lg, generatedAt: new Date().toISOString(), ...parseTable(await espn(`${ESPN_V2}/${lg}/standings`, TTL_TABLE)) }));
        return json(data, 200, cors, 300);
      }

      /* TASHXIS (faqat ADMIN_TOKEN o'rnatilgan va ?key= to'g'ri bo'lsa): ESPN qaysi so'rov shaklini qabul qilishini ko'rsatadi */
      if (url.pathname === '/api/diag') {
        if (!tokenOk(q, env)) return json({ ok: false, message: 'Disabled. Set ADMIN_TOKEN in the Worker and pass ?key=...' }, 403, cors);
        const lg = LG[q.get('lg') || 'eng.1'] ? (q.get('lg') || 'eng.1') : 'eng.1';
        const t = utcDay(), tm = utcDay(new Date(Date.now() + 864e5));
        const variants = { 'no params': '', 'today': `?dates=${t}`, 'tomorrow': `?dates=${tm}`, 'month': `?dates=${t.slice(0, 6)}`, 'dash range': `?dates=${t}-${tm}`, 'dash range + limit': `?dates=${t}-${tm}&limit=300`, 'limit only': '?limit=50' };
        const out = {};
        for (const [name, qs] of Object.entries(variants)) {
          try { const r = await fetch(`${ESPN}/${lg}/scoreboard${qs}`, { headers: { 'User-Agent': 'Mozilla/5.0 (LiveFootballProxy)' } }); const b = await r.text(); let n = null; try { n = (JSON.parse(b).events || []).length; } catch (_) {} out[name] = { status: r.status, bytes: b.length, events: n }; }
          catch (e) { out[name] = { error: String(e.message).slice(0, 80) }; }
        }
        return json({ ok: true, league: lg, results: out }, 200, cors);
      }

      /* Sharhlarni o'qish (hamma uchun) */
      if (url.pathname === '/api/notes') {
        const id = q.get('id') || '';
        if (!validMatchId(id)) return json({ ok: false, message: 'Bad match id.' }, 400, cors);
        const kv = kvOf(env);
        if (!kv) return json({ ok: true, kv: false, notes: [], pin: '' }, 200, cors, 10);
        const data = await cached('n|' + id, 8, async () => { const v = await readNotes(kv, id); return { ok: true, kv: true, notes: v.notes.slice(-60), pin: v.pin || '' }; });
        return json(data, 200, cors, 8);
      }

      /* Sharh yozish / o'chirish (faqat ADMIN_TOKEN bilan) */
      if (isNotePost) {
        if (!env || !env.ADMIN_TOKEN) return json({ ok: false, message: 'ADMIN_TOKEN is not set in the Worker.' }, 503, cors);
        if (!safeEq(request.headers.get('X-Admin-Token') || '', env.ADMIN_TOKEN)) { await new Promise(r => setTimeout(r, 500)); return json({ ok: false, message: 'Wrong admin token.' }, 401, cors); }
        const kv = kvOf(env);
        if (!kv) return json({ ok: false, message: 'KV namespace is not bound (name it NOTES).' }, 503, cors);
        const raw = await request.text();
        if (raw.length > 4000) return json({ ok: false, message: 'Body too large.' }, 413, cors);
        let b; try { b = JSON.parse(raw); } catch (_) { return json({ ok: false, message: 'Bad JSON.' }, 400, cors); }
        if (!b || !validMatchId(b.id)) return json({ ok: false, message: 'Bad match id.' }, 400, cors);
        const v = await readNotes(kv, b.id);
        const done = async extra => { await saveNotes(kv, b.id, v); mem.delete('n|' + b.id); return json({ ok: true, notes: v.notes.slice(-60), pin: v.pin || '', ...extra }, 200, cors); };
        if (url.pathname === '/api/note/clear') { v.notes = []; v.pin = ''; return done({}); }
        if (url.pathname === '/api/note/del') { if (b.nid === 'pin') v.pin = ''; else v.notes = v.notes.filter(n => n.id !== String(b.nid)); return done({}); }
        const text = cleanText(b.text);
        if (!text) return json({ ok: false, message: 'Empty text.' }, 400, cors);
        let en = text;
        if (!b.noTr) { en = await translateUz(text); if (!en) return json({ ok: false, message: 'Translation failed. Try again or tick "no translation".' }, 502, cors); }
        if (b.pin) v.pin = en;
        else { v.notes.push({ id: 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t: cleanText(b.t, 12), x: en, o: b.noTr ? '' : text.slice(0, 120), at: new Date().toISOString() }); v.notes = v.notes.slice(-60); }
        return done({ en });
      }

      return json({ ok: false, message: 'Use /api/health, /api/matches?days=, /api/match?id=, /api/table?lg=, /api/notes?id=.' }, 404, cors);
    } catch (err) {
      return json({ ok: false, message: String(err && err.message || err).slice(0, 160) }, 502, cors);
    }
  }
};
