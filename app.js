(() => {
  'use strict';
  /* ================= Sozlamalar ================= */
  const CFG = window.LIVE_FOOTBALL_CONFIG || {};
  const Q = new URLSearchParams(location.search);
  const STREAM = Q.get('stream') === '1';           // stream rejimi: video, reklama, cookie banner YO'Q
  let ADMIN = false;
  try {
    if (Q.get('admin') === '1') localStorage.setItem('lf_admin', '1');
    if (Q.get('admin') === '0') localStorage.removeItem('lf_admin');
    ADMIN = localStorage.getItem('lf_admin') === '1';
  } catch (_) {}
  if (STREAM) document.body.classList.add('stream');
  document.addEventListener('error', e => { if (e.target && e.target.tagName === 'IMG') e.target.style.visibility = 'hidden'; }, true);

  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const { T, isLive, ymd, addDays, dkey, minNum, fm, lgInfo, safeUrl, validId, ytId, HOUR } = LF.h;
  const PAGE = 8;                                    // har ligadan boshida nechta o'yin ko'rsatiladi
  const fmtTime = d => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const fmtDay = d => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtShortDate = d => {
    const dt = new Date(d);
    return isNaN(dt) ? String(d || '') : dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  /* ================= Sevimli o'yinlar (faqat localStorage, hech qayerga uzatilmaydi) ================= */
  const FAV_KEY = 'lf_favs_v1';
  const favs = new Set();
  try { (JSON.parse(localStorage.getItem(FAV_KEY) || '[]') || []).forEach(id => { if (validId(id)) favs.add(id); }); } catch (_) {}
  function toggleFav(id) {
    if (!validId(id)) return;
    favs.has(id) ? favs.delete(id) : favs.add(id);
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...favs].slice(-100))); } catch (_) {}
  }

  /* ================= Holat ================= */
  const S = { tab: null, status: 'all', lg: 'all', q: '', open: null, heroOpen: false, dtab: 'timeline', collapsed: new Set(), more: new Set(), notes: new Map(), hero: null, pick: null };
  try { S.hero = ADMIN ? localStorage.getItem('lf_hero') : null; } catch (_) {}
  if (STREAM && Q.get('m') && validId(Q.get('m'))) S.hero = Q.get('m');

  /* ================= Tanlash ================= */
  const heroMatch = () => (S.pick && LF.get(S.pick)) || (S.hero && LF.get(S.hero)) || LF.pickBest(null);
  const spotMatch = () => { const h = heroMatch(); return LF.pickBest(h ? h.lg : null); };
  const byId = id => LF.get(id);
  const hasVideo = id => !STREAM && !!ytId(LF.videoFor(id));

  /* ================= Umumiy: badge, gol urganlar ================= */
  function badge(m) {
    if (m.s === 'in') return `<span class="realtime-badge is-live"><i class="live-dot"></i>LIVE · ${esc(m.c || 'IN PLAY')}</span>`;
    if (m.s === 'ht') return '<span class="realtime-badge is-ht">⏸ HALF-TIME</span>';
    if (m.s === 'post') return `<span class="realtime-badge is-done">🏁 FULL-TIME (${esc(m.sd || 'FT')}) · FINISHED</span>`;
    if (m.s === 'pp') return '<span class="realtime-badge is-done">⚠ POSTPONED</span>';
    return `<span class="realtime-badge is-upcoming">🕒 KICK-OFF ${esc(fmtTime(m.d))}</span>`;
  }
  function scorers(m, side) {
    const g = new Map();
    for (const e of m.e || []) if (e.k === 'g' && e.t === side) {
      const k = e.p || '?';
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(fm(e.m) + (e.q === 'p' ? ' (P)' : e.q === 'o' ? ' (OG)' : ''));
    }
    return g.size ? `<div class="scorers">${[...g].map(([p, ms]) => `<span>⚽ ${esc(p)} <em>${esc(ms.join(', '))}</em></span>`).join('')}</div>` : '';
  }
  const crest = (t, cls) => t && safeUrl(t.l) ? `<img class="${cls}" src="${esc(safeUrl(t.l))}" alt="" loading="lazy">` : '<span class="mini-crest">⚽</span>';

  /* ================= Tafsilotlar komponenti (hero va ro'yxat uchun bitta) ================= */
  const DT = [
    ['timeline', 'Timeline'],
    ['stats', 'Stats'],
    ['lineups', 'Line-ups'],
    ['h2h', 'H2H & Form'],
    ['table', 'Table'],
    ['video', 'Video']
  ];

  function mergedEvents(m, d) {
    const seen = new Set(), evs = [];
    for (const e of [].concat(d && d.events || [], m.e || [])) {
      const key = e.k === 's' ? `s|${e.p}|${e.o}` : `${e.k}|${minNum(e.m)}|${e.t}`;
      if (!seen.has(key)) { seen.add(key); evs.push(e); }
    }
    return evs.sort((x, y) => minNum(x.m) - minNum(y.m));
  }
  function evHTML(e) {
    const ic = { g: '⚽', y: '🟨', r: '🟥', s: '🔁' }[e.k] || '•';
    const extra = e.q === 'p' ? ' <small>(pen)</small>' : e.q === 'o' ? ' <small>(own goal)</small>' : '';
    return e.k === 's' ? `${ic} <b>${esc(e.p)}</b> <small>in for ${esc(e.o)}</small>` : `${ic} <b>${esc(e.p)}</b>${extra}`;
  }

  function tlHTML(m, d) {
    const evs = mergedEvents(m, d);
    const rec = S.notes.get(m.id);
    if (!rec && ! STREAM) {
      S.notes.set(m.id, { t: Date.now(), d: null, busy: true });
      LF.notes(m.id).then(j => { S.notes.set(m.id, { t: Date.now(), d: j }); refreshDetails(m.id); });
    }
    const n = rec && rec.d;
    const pinHtml = n && n.pin ? `<div class="cm-pin">📌 ${esc(n.pin)}</div>` : '';
    const manualNotes = (n && n.notes || []).slice(-3).reverse().map(x => `<div class="cm-note"><small>${esc(x.t || 'LIVE NOTE')}</small>${esc(x.x)}</div>`).join('');
    if (!evs.length && !pinHtml && !manualNotes) {
      return `<div class="empty-state">${m.s === 'pre' ? `Kick-off at ${esc(fmtTime(m.d))}. Check the H2H & Form tab for team comparison and recent results!` : 'No key match events recorded yet.'}</div>`;
    }
    const rows = evs.map(e => `<div class="tl-row${e.k === 'g' ? ' is-goal' : ''}"><div class="tl-h">${e.t === 'h' ? evHTML(e) : ''}</div><div class="tl-m">${esc(fm(e.m))}</div><div class="tl-a">${e.t === 'a' ? evHTML(e) : ''}</div></div>`).join('');
    const i = d && d.info ? d.info : {};
    const info = [i.venue || m.v ? '🏟 ' + (i.venue || m.v) : '', i.city || m.ct, i.att ? '👥 Attendance ' + Number(i.att).toLocaleString() : '', i.ref ? '⚖️ Referee: ' + i.ref : ''].filter(Boolean).join(' · ');
    return pinHtml + manualNotes + rows + (info ? `<div class="info-line">${esc(info)}</div>` : '');
  }

  function statsHTML(m, d) {
    const ext = d && d.extStats;
    if (ext && ext.length) {
      return `<div class="stats-head"><span>${crest(m.h, 'mini-logo')} <b>${esc(m.h.n)}</b></span><span>TECHNICAL STATS</span><span><b>${esc(m.a.n)}</b> ${crest(m.a, 'mini-logo')}</span></div>` +
        ext.map(s => {
          const a = Number(s.h) || 0, b = Number(s.a) || 0, tot = (a + b) || 1;
          const pct = (a === 0 && b === 0) ? 50 : Math.round((a / tot) * 100);
          const fa = (s.u === '%' ? Math.round(a) + '%' : a), fb = (s.u === '%' ? Math.round(b) + '%' : b);
          return `<div class="sbar"><div class="l"><b class="${a > b ? 'hi' : ''}">${esc(fa)}</b><span>${esc(s.l)}</span><b class="${b > a ? 'hi' : ''}">${esc(fb)}</b></div><div class="b"><i style="width:${pct}%"></i></div></div>`;
        }).join('');
    }
    if (!m.st) return '<div class="empty-state">Live technical statistics appear as soon as the match kicks off.</div>';
    const N = [['p', 'Ball Possession', v => Math.round(v) + '%'], ['sh', 'Total Shots', v => v], ['ot', 'Shots on Target', v => v], ['co', 'Corner Kicks', v => v], ['fo', 'Fouls Committed', v => v]];
    return `<div class="stats-head"><span>${crest(m.h, 'mini-logo')} <b>${esc(m.h.n)}</b></span><span>TECHNICAL STATS</span><span><b>${esc(m.a.n)}</b> ${crest(m.a, 'mini-logo')}</span></div>` +
      N.map(([k, n, f]) => {
        const [a, b] = m.st[k] || [0, 0], t = (a + b) || 1;
        return `<div class="sbar"><div class="l"><b class="${a > b ? 'hi' : ''}">${f(a)}</b><span>${n}</span><b class="${b > a ? 'hi' : ''}">${f(b)}</b></div><div class="b"><i style="width:${a || b ? a / t * 100 : 50}%"></i></div></div>`;
      }).join('');
  }

  /* ================= Line-ups: O'yinchi silueti (Squard.png uslubida) + Zaxira + Hakamlar ================= */
  const W = n => n >= 4 ? 76 : n === 3 ? 64 : 42;
  function place(xi, form) {
    const f = String(form || '').split('-').map(Number).filter(n => n > 0);
    let rows;
    if (f.length >= 2 && f.reduce((x, y) => x + y, 0) === 10) {
      rows = [[xi[0]]];
      let i = 1;
      f.forEach(n => { rows.push(xi.slice(i, i + n)); i += n; });
    } else {
      const g = p => /^G/.test(p.pos) ? 0 : /^(D|CB|LB|RB|WB|SW)/.test(p.pos) ? 1 : /^(F|ST|CF|LW|RW|SS)/.test(p.pos) ? 3 : 2;
      rows = [[], [], [], []];
      xi.forEach(p => rows[g(p)].push(p));
      rows = rows.filter(r => r.length);
    }
    const out = [], n = rows.length;
    rows.forEach((r, ri) => r.forEach((p, k) => out.push({
      p,
      isGK: ri === 0 || /^G/i.test(p.pos || ''),
      x: r.length === 1 ? 50 : 50 - W(r.length) / 2 + k * W(r.length) / (r.length - 1),
      y: 88 - ri * (74 / Math.max(n - 1, 1))
    })));
    return out;
  }

  /* O'yinchi hodisalari (gol, kartochka, almashtirish) ni siluet ustida ko'rsatish */
  function playerBadges(p, evs) {
    if (!evs || !evs.length) return '';
    const fn = String(p.f || p.n || '').toLowerCase(), sn = String(p.n || '').toLowerCase();
    const matchName = who => {
      const w = String(who || '').toLowerCase();
      return w && (w === fn || w === sn || (sn.length >= 3 && w.endsWith(sn)));
    };
    const b = [];
    let goals = 0;
    for (const e of evs) {
      if (e.k === 'g' && matchName(e.p)) goals++;
      else if (e.k === 'y' && matchName(e.p)) b.push('<span class="pl-b yc" title="Yellow card">🟨</span>');
      else if (e.k === 'r' && matchName(e.p)) b.push('<span class="pl-b rc" title="Red card">🟥</span>');
      else if (e.k === 's' && matchName(e.o)) b.push('<span class="pl-b sub" title="Substituted off">🔻</span>');
    }
    if (goals === 1) b.unshift('<span class="pl-b gl" title="Goal">⚽</span>');
    else if (goals > 1) b.unshift(`<span class="pl-b gl" title="${goals} Goals">⚽×${goals}</span>`);
    return b.length ? `<div class="pl-badges">${b.slice(0, 3).join('')}</div>` : '';
  }

  /* Broadcast-uslubidagi futbolchi silueti (Squard.png referensiga mos: bosh + yelka + ko'krakda raqam + neon kontur) */
  function playerSilhouetteSVG(kitClass) {
    return `<svg class="pl-svg ${kitClass}" viewBox="0 0 64 58" aria-hidden="true" focusable="false">
      <path class="sil-glow" d="M32 4c6.2 0 11 4.8 11 11 0 4.3-2.2 8-5.6 9.8 1.2 1.8 3.2 3 6.2 3.8l8.8 2.4c4.8 1.3 8.1 5.6 8.6 10.6L62 54H2l1-12.4c.5-5 3.8-9.3 8.6-10.6l8.8-2.4c3-.8 5-2 6.2-3.8C23.2 23 21 19.3 21 15c0-6.2 4.8-11 11-11z"/>
      <path class="sil-collar" d="M24 27.5c2.4 2.5 5.1 3.7 8 3.7s5.6-1.2 8-3.7"/>
    </svg>`;
  }

  function pitchHTML(t, side, teamObj, evs) {
    if (!t) return '';
    const dots = place(t.xi, t.form).map(o => {
      const kitClass = o.isGK ? (side === 'h' ? 'kit-gk-h' : 'kit-gk-a') : (side === 'h' ? 'kit-home' : 'kit-away');
      return `<div class="pl ${kitClass}" style="left:${o.x}%;top:${o.y}%" title="${esc((o.p.num ? '#' + o.p.num + ' ' : '') + (o.p.f || o.p.n) + (o.p.pos ? ' (' + o.p.pos + ')' : ''))}">
        <div class="pl-fig">
          ${playerSilhouetteSVG(kitClass)}
          <span class="pl-num">${esc(o.p.num || '•')}</span>
          ${playerBadges(o.p, evs)}
        </div>
        <div class="pl-tag"><span>${esc(o.p.n)}</span></div>
      </div>`;
    }).join('');

    const benchChips = (t.bench && t.bench.length)
      ? `<div class="bench"><div class="bench-title">🔄 SUBSTITUTES BENCH</div><div class="bench-grid">${t.bench.map(p => {
          const subbedIn = (evs || []).some(e => e.k === 's' && String(e.p || '').toLowerCase().endsWith(String(p.n || '').toLowerCase()));
          return `<span class="bench-chip${subbedIn ? ' came-on' : ''}">${p.num ? `<b>#${esc(p.num)}</b>` : ''}${esc(p.n)}${p.pos ? `<small>${esc(p.pos)}</small>` : ''}${subbedIn ? ' <em>🔼</em>' : ''}</span>`;
        }).join('')}</div></div>`
      : '';

    return `<div class="pitch ${side === 'h' ? 'home' : 'away'}">
      <h4><span class="pitch-team">${crest(teamObj, 'mini-logo')} ${esc(teamObj.n)}</span><span class="pitch-form">${esc(t.form || 'XI')}</span></h4>
      <div class="fld">
        <div class="fld-markings-top"></div>
        <div class="fld-midline"></div>
        <div class="fld-circle"></div>
        ${dots}
      </div>
      ${benchChips}
    </div>`;
  }

  function lineupHTML(m, d) {
    const L = d && d.lineup;
    const evs = mergedEvents(m, d);
    const i = (d && d.info) || {};
    const officials = (i.officials && i.officials.length)
      ? i.officials
      : (i.ref ? [{ n: i.ref, r: 'Main Referee' }] : []);

    const officialsHTML = `<div class="officials-card">
      <div class="officials-head"><span>⚖️ MATCH OFFICIALS &amp; VENUE INFO</span></div>
      <div class="officials-grid">
        ${officials.length
          ? officials.map(o => `<div class="off-item"><span class="off-role"> whistle · ${esc(o.r)}</span><strong class="off-name">${esc(o.n)}</strong></div>`).join('')
          : '<div class="off-item"><span class="off-role">Main Referee</span><strong class="off-name">To be confirmed (TBC)</strong></div>'}
        ${(i.venue || m.v) ? `<div class="off-item"><span class="off-role">🏟 Stadium / Venue</span><strong class="off-name">${esc(i.venue || m.v)}${(i.city || m.ct) ? ' · ' + esc(i.city || m.ct) : ''}</strong></div>` : ''}
        ${i.att ? `<div class="off-item"><span class="off-role">👥 Attendance</span><strong class="off-name">${Number(i.att).toLocaleString()} spectators</strong></div>` : ''}
      </div>
    </div>`;

    if (!L || (!L.h && !L.a)) {
      return `<div class="empty-state">Starting line-ups are usually confirmed about 60 minutes before kick-off.</div>${officialsHTML}`;
    }
    return `<div class="pitches">${pitchHTML(L.h, 'h', m.h, evs)}${pitchHTML(L.a, 'a', m.a, evs)}</div>${officialsHTML}`;
  }

  /* ================= H2H & Form (Commentary o'rniga qiziqarli tahlil bo'limi) ================= */
  function findTeamRow(lg, teamId, teamName) {
    const rec = LF.store.table.get(lg);
    if (!rec || !rec.d || !rec.d.groups) return null;
    const tn = String(teamName || '').toLowerCase();
    for (const g of rec.d.groups) {
      for (const r of g.rows || []) {
        if (r.i === teamId || String(r.n || '').toLowerCase() === tn) return r;
      }
    }
    return null;
  }

  function h2hHTML(m, d) {
    if (!LF.store.table.has(m.lg)) {
      LF.loadTable(m.lg).then(() => { refreshDetails(m.id); renderSideTable(); });
    }
    const hRow = findTeamRow(m.lg, m.h.i, m.h.n);
    const aRow = findTeamRow(m.lg, m.a.i, m.a.n);
    const form = (d && d.form) || { h: [], a: [] };
    const h2h = (d && d.h2h) || [];

    /* O'zaro o'yinlar (H2H) hisob-kitobi */
    let hWins = 0, aWins = 0, draws = 0, totalGoals = 0;
    h2h.forEach(g => {
      totalGoals += (g.hg || 0) + (g.ag || 0);
      if (g.hg === g.ag) draws++;
      else {
        const homeWon = g.hg > g.ag;
        const hIsHome = String(g.hn || '').toLowerCase() === String(m.h.n || '').toLowerCase();
        if ((homeWon && hIsHome) || (!homeWon && !hIsHome)) hWins++;
        else aWins++;
      }
    });

    /* G'alaba ehtimoli / Jamoalar kuchi (Predictor yoki Jadval+Forma asosida) */
    let pred = d && d.pred;
    if (!pred) {
      const formPts = arr => (arr || []).reduce((s, x) => s + (x.r === 'W' ? 3 : x.r === 'D' ? 1 : 0), 0);
      const hScore = 36 + formPts(form.h) * 2.2 + (hRow ? Math.max(0, 22 - hRow.r) * 1.2 : 10);
      const aScore = 30 + formPts(form.a) * 2.2 + (aRow ? Math.max(0, 22 - aRow.r) * 1.2 : 10);
      const tot = hScore + aScore + 26;
      const hp = Math.round((hScore / tot) * 100);
      const ap = Math.round((aScore / tot) * 100);
      pred = { h: hp, d: Math.max(10, 100 - hp - ap), a: ap };
    }

    /* Qiziqarli faktlar (Match Insights) */
    const facts = [];
    if (hRow && aRow) {
      const diff = Math.abs(hRow.pts - aRow.pts);
      if (diff <= 3) facts.push(`🔥 <b>Six-pointer clash:</b> Only <b>${diff} point${diff === 1 ? '' : 's'}</b> separate ${esc(m.h.n)} (#${hRow.r}) and ${esc(m.a.n)} (#${aRow.r}) in the ${esc(lgInfo(m.lg).n)} standings.`);
      else facts.push(`📊 <b>Table positions:</b> ${esc(m.h.n)} sit <b>#${hRow.r}</b> (${hRow.pts} pts, GD ${hRow.gd > 0 ? '+' + hRow.gd : hRow.gd}) while ${esc(m.a.n)} are <b>#${aRow.r}</b> (${aRow.pts} pts, GD ${aRow.gd > 0 ? '+' + aRow.gd : aRow.gd}).`);
      if (hRow.p > 0 && aRow.p > 0) {
        const hPpg = (hRow.pts / hRow.p).toFixed(2), aPpg = (aRow.pts / aRow.p).toFixed(2);
        facts.push(`⚡ <b>Season pace:</b> ${esc(m.h.n)} average <b>${hPpg} pts/game</b> (${hRow.w}W-${hRow.d}D-${hRow.lo}L) vs ${esc(m.a.n)}'s <b>${aPpg} pts/game</b> (${aRow.w}W-${aRow.d}D-${aRow.lo}L).`);
      }
    }
    if (h2h.length) {
      const avgG = (totalGoals / h2h.length).toFixed(1);
      facts.push(`⚔️ <b>Head-to-Head trend:</b> Their last <b>${h2h.length}</b> meetings produced <b>${totalGoals} goals</b> (<b>${avgG} goals per match</b>) — ${esc(m.h.n)} won ${hWins}, ${draws} draws, ${esc(m.a.n)} won ${aWins}.`);
    }
    const countW = arr => (arr || []).filter(x => x.r === 'W').length;
    if (form.h.length || form.a.length) {
      facts.push(`📈 <b>Recent momentum:</b> Over their last ${Math.max(form.h.length, form.a.length)} outings, ${esc(m.h.n)} claimed <b>${countW(form.h)} win${countW(form.h) === 1 ? '' : 's'}</b> while ${esc(m.a.n)} recorded <b>${countW(form.a)} win${countW(form.a) === 1 ? '' : 's'}</b>.`);
    }
    if (!facts.length) {
      facts.push(`🏆 <b>Featured ${esc(lgInfo(m.lg).n)} fixture:</b> ${esc(m.h.f || m.h.n)} vs ${esc(m.a.f || m.a.n)}${m.v ? ' at ' + esc(m.v) : ''}.`);
    }

    const formPills = arr => (arr && arr.length)
      ? `<div class="form-strip">${arr.map(x => `<span class="f-pill is-${x.r.toLowerCase()}" title="${esc((x.h ? 'vs ' : '@ ') + x.opp + ' (' + x.sc + ')')}">${esc(x.r)}</span>`).join('')}</div>`
      : '<span class="adm-mut">No recent form data</span>';

    const formList = (arr, teamObj) => `
      <div class="h2h-col">
        <div class="h2h-col-head">${crest(teamObj, 'mini-logo')} <b>${esc(teamObj.n)} · Last 5 Matches</b></div>
        ${(arr && arr.length) ? arr.map(x => `
          <div class="form-row">
            <span class="f-pill is-${x.r.toLowerCase()}">${esc(x.r)}</span>
            <span class="form-date">${esc(fmtShortDate(x.d))}</span>
            <span class="form-opp">${x.h ? 'vs' : '@'} ${x.l ? `<img src="${esc(x.l)}" alt="" class="mini-logo-xs">` : ''}<b>${esc(x.opp)}</b></span>
            <span class="form-sc">${esc(x.sc)}</span>
          </div>
        `).join('') : '<div class="empty-state">Recent matches will appear once loaded.</div>'}
      </div>`;

    return `<div class="h2h-wrap">
      <!-- 1. Match Insights & Key Facts -->
      <div class="insight-box">
        <div class="insight-title">💡 MATCH INSIGHTS &amp; PRE-MATCH FACTS</div>
        <ul class="insight-list">${facts.map(f => `<li>${f}</li>`).join('')}</ul>
      </div>

      <!-- 2. Team Power / Win Probability Bar -->
      <div class="pred-card">
        <div class="pred-head">
          <span><b>${esc(m.h.n)}</b> ${pred.h}%</span>
          <span class="pred-mid">MATCH MOMENTUM · DRAW ${pred.d}%</span>
          <span>${pred.a}% <b>${esc(m.a.n)}</b></span>
        </div>
        <div class="pred-bar">
          <i class="pb-h" style="width:${pred.h}%"></i>
          <i class="pb-d" style="width:${pred.d}%"></i>
          <i class="pb-a" style="width:${pred.a}%"></i>
        </div>
      </div>

      <!-- 3. Tale of the Tape (2 Jamoa solishtirmasi) -->
      <div class="tape-grid">
        <div class="tape-side home">
          <div class="tape-team">${crest(m.h, 'mini-logo')} <b>${esc(m.h.n)}</b></div>
          ${formPills(form.h)}
          <div class="tape-meta">${hRow ? `Rank <b>#${hRow.r}</b> · <b>${hRow.pts}</b> pts · GD <b>${hRow.gd > 0 ? '+' + hRow.gd : hRow.gd}</b>` : esc(lgInfo(m.lg).n)}</div>
        </div>
        <div class="tape-vs">VS</div>
        <div class="tape-side away">
          <div class="tape-team"><b>${esc(m.a.n)}</b> ${crest(m.a, 'mini-logo')}</div>
          ${formPills(form.a)}
          <div class="tape-meta">${aRow ? `Rank <b>#${aRow.r}</b> · <b>${aRow.pts}</b> pts · GD <b>${aRow.gd > 0 ? '+' + aRow.gd : aRow.gd}</b>` : esc(lgInfo(m.lg).n)}</div>
        </div>
      </div>

      <!-- 4. O'zaro o'yinlar (H2H History) -->
      <div class="h2h-section">
        <div class="h2h-sec-head">
          <span>⚔️ HEAD-TO-HEAD (PREVIOUS MEETINGS)</span>
          ${h2h.length ? `<span class="h2h-summary"><b>${esc(m.h.n)}: ${hWins}W</b> · <b>Draws: ${draws}</b> · <b>${esc(m.a.n)}: ${aWins}W</b></span>` : ''}
        </div>
        ${h2h.length ? `<div class="h2h-list">${h2h.map(g => {
          const hw = g.hg > g.ag, aw = g.ag > g.hg;
          return `<div class="h2h-item">
            <span class="h2h-date">${esc(fmtShortDate(g.d))}${g.lg ? ` <small>· ${esc(g.lg)}</small>` : ''}</span>
            <span class="h2h-t home${hw ? ' win' : ''}">${esc(g.hn)} ${g.hl ? `<img src="${esc(g.hl)}" alt="" class="mini-logo-xs">` : ''}</span>
            <span class="h2h-sc">${g.hg} – ${g.ag}</span>
            <span class="h2h-t away${aw ? ' win' : ''}">${g.al ? `<img src="${esc(g.al)}" alt="" class="mini-logo-xs">` : ''} ${esc(g.an)}</span>
          </div>`;
        }).join('')}</div>` : '<div class="empty-state">No recent head-to-head meetings recorded in ESPN archive for this pair.</div>'}
      </div>

      <!-- 5. Har ikki jamoaning oxirgi 5 o'yini -->
      <div class="h2h-cols">${formList(form.h, m.h)}${formList(form.a, m.a)}</div>
    </div>`;
  }

  function tableAround(m) {
    const rec = LF.store.table.get(m.lg);
    if (!rec || !rec.d || !rec.d.groups || !rec.d.groups.length) return '';
    const ids = [m.h.i, m.a.i], g = rec.d.groups.find(x => x.rows.some(r => ids.includes(r.i))) || rec.d.groups[0], rows = g.rows;
    const keep = new Set([0, 1, 2]);
    rows.forEach((r, i) => { if (ids.includes(r.i)) [i - 1, i, i + 1].forEach(k => { if (k >= 0 && k < rows.length) keep.add(k); }); });
    const idx = [...keep].sort((a, b) => a - b); let html = '', prev = -1;
    for (const i of idx) {
      const r = rows[i];
      if (prev >= 0 && i - prev > 1) html += '<tr class="gap"><td colspan="4">⋯</td></tr>';
      html += `<tr class="${ids.includes(r.i) ? 'hl' : ''}"><td>${r.r}</td><td class="t">${safeUrl(r.l) ? `<img src="${esc(safeUrl(r.l))}" alt="" loading="lazy">` : ''}${esc(r.n)}</td><td>${r.p}</td><td><b>${r.pts}</b></td></tr>`;
      prev = i;
    }
    return `<div class="md-aside-t">${esc(lgInfo(m.lg).n)}${g.name && rec.d.groups.length > 1 ? ' · ' + esc(g.name) : ''}</div><table class="tbl"><thead><tr><th>#</th><th>Team</th><th>P</th><th>Pts</th></tr></thead><tbody>${html}</tbody></table>`;
  }
  function asideHTML(m) {
    if (S.dtab === 'table') return '';
    if (!LF.store.table.has(m.lg)) { LF.loadTable(m.lg).then(() => { refreshDetails(m.id); renderSideTable(); }); return '<div class="md-aside-t">Loading table…</div>'; }
    return tableAround(m);
  }
  function tableHTML(m, limit) {
    const rec = LF.store.table.get(m.lg);
    if (!rec) { LF.loadTable(m.lg).then(() => { refreshDetails(m.id); renderSideTable(); }); return '<div class="empty-state">Loading table…</div>'; }
    if (!rec.d || !rec.d.groups || !rec.d.groups.length) return '<div class="empty-state">No standings table is available for this competition.</div>';
    const ids = [m.h.i, m.a.i], gs = rec.d.groups;
    return gs.map(g => {
      let rows = g.rows;
      if (limit) rows = rows.slice(0, limit);
      else if (gs.length > 1 && !g.rows.some(r => ids.includes(r.i))) return '';
      return `${g.name && gs.length > 1 ? `<div class="grp-name">${esc(g.name)}</div>` : ''}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>${rows.map(r => `<tr class="${ids.includes(r.i) ? 'hl' : ''}"><td>${r.r}</td><td class="t">${safeUrl(r.l) ? `<img src="${esc(safeUrl(r.l))}" alt="" loading="lazy">` : ''}${esc(r.n)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.lo}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join('')}</tbody></table></div>`;
    }).join('');
  }

  function videoHTML(m) {
    if (STREAM) return '<div class="empty-state">Video is disabled in stream mode.</div>';
    const curUrl = LF.videoFor(m.id);
    const id = ytId(curUrl);
    const adminBox = ADMIN ? `<div class="vid-admin-box">
      <div class="vid-admin-title">🎬 <b>Admin · Attach YouTube Video / Highlights</b> <small>(Match ID: <code>${esc(m.id)}</code>)</small></div>
      <div class="vid-admin-row">
        <input type="url" class="vid-url-in" data-vid-input="${esc(m.id)}" placeholder="Paste YouTube link (e.g. https://youtu.be/xxxxxxxxxxx)" value="${esc(curUrl)}">
        <button type="button" class="filter active" data-vid-save="${esc(m.id)}">💾 Save Video</button>
        ${id ? `<button type="button" class="filter" data-vid-del="${esc(m.id)}">🗑 Remove</button>` : ''}
      </div>
      <div class="adm-mut" data-vid-msg="${esc(m.id)}">Saved videos show a green ▶ icon on the match row for visitors.</div>
    </div>` : '';

    if (!id) return adminBox + '<div class="empty-state">No video highlight has been linked for this match yet.</div>';
    return adminBox + `<iframe class="vid" src="https://www.youtube-nocookie.com/embed/${id}?rel=0" title="Match video" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  }

  function mdBody(m) {
    const rec = LF.store.detail.get(m.id), d = rec && rec.d;
    if (!rec) loadDetail(m);
    return {
      timeline: () => tlHTML(m, d),
      stats: () => statsHTML(m, d),
      lineups: () => lineupHTML(m, d),
      h2h: () => h2hHTML(m, d),
      table: () => tableHTML(m, 0),
      video: () => videoHTML(m)
    }[S.dtab]();
  }

  const mdShell = (m, inHero) => {
    const vOn = hasVideo(m.id);
    return `<div class="mdetail" data-for="${esc(m.id)}"><div class="md-tabs" role="tablist">${DT.map(([k, n]) => {
      const label = k === 'video' && vOn ? `▶ ${n} ●` : n;
      return `<button type="button" role="tab" class="filter${S.dtab === k ? ' active' : ''}${k === 'video' && vOn ? ' has-vid' : ''}" data-dt="${k}" aria-pressed="${S.dtab === k}">${label}</button>`;
    }).join('')}${inHero ? '' : `<button type="button" class="md-pick" data-pick="${esc(m.id)}" title="Show this match in the main panel">📌 Show in main panel</button>`}</div><div class="md-grid"><div class="md-body">${mdBody(m)}</div><aside class="md-aside">${asideHTML(m)}</aside></div></div>`;
  };

  async function loadDetail(m, force) { await LF.loadDetail(m, force); refreshDetails(m.id); }
  function refreshDetails(id) {
    const m = byId(id); if (!m) return;
    document.querySelectorAll(`.mdetail[data-for="${CSS.escape(id)}"]`).forEach(el => {
      el.querySelectorAll('.md-tabs .filter').forEach(b => {
        if (!b.dataset.dt) return;
        const on = b.dataset.dt === S.dtab;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', String(on));
        if (b.dataset.dt === 'video') {
          const vOn = hasVideo(m.id);
          b.classList.toggle('has-vid', vOn);
          b.textContent = vOn ? '▶ Video ●' : 'Video';
        }
      });
      el.querySelector('.md-body').innerHTML = mdBody(m);
      el.querySelector('.md-aside').innerHTML = asideHTML(m);
    });
  }

  /* ================= Asosiy panel va Spotlight ================= */
  function renderHero() {
    const m = heroMatch(), el = $('featuredMatch');
    if (!m) { el.innerHTML = '<div class="empty-state featured-empty"><strong>No major match right now</strong><span>Check the fixtures below for the next big game.</span></div>'; $('heroDetail').innerHTML = ''; return; }
    const li = lgInfo(m.lg), h = m.h, a = m.a, pre = m.s === 'pre' || m.s === 'pp', fin = m.s === 'post';
    const venue = [m.v, m.ct].filter(Boolean).join(' · ');
    const logo = t => safeUrl(t.l) ? `<img class="team-logo" src="${esc(safeUrl(t.l))}" alt="${esc(t.n)} logo">` : '<div class="placeholder-crest">⚽</div>';
    const vBadge = hasVideo(m.id) ? `<button type="button" class="hero-vid-btn" data-hero-vid="${esc(m.id)}">▶ WATCH HIGHLIGHTS</button>` : '';
    const hWin = fin && h.g > a.g, aWin = fin && a.g > h.g;
    el.innerHTML = `<div class="featured-league"><span class="league-badge-box">${esc(li.n)}${m.nt ? ' · ' + esc(String(m.nt).toUpperCase()) : ''}</span></div>
      <div class="hero-placeholder${fin ? ' is-finished-hero' : ''}">
        <div class="placeholder-team${hWin ? ' is-winner' : aWin ? ' is-loser' : ''}">${logo(h)}<div class="placeholder-team-name">${esc(h.n)}${hWin ? ' <span class="win-check" title="Winner">✓</span>' : ''}</div>${scorers(m, 'h')}</div>
        <div class="placeholder-score"><span>${pre ? esc(fmtTime(m.d)) : `${h.g} – ${a.g}`}</span><div class="status-line">${badge(m)}</div><small>🕒 ${esc(fmtDay(m.d))} · ${esc(fmtTime(m.d))} (Local time)</small>${vBadge}</div>
        <div class="placeholder-team${aWin ? ' is-winner' : hWin ? ' is-loser' : ''}">${logo(a)}<div class="placeholder-team-name">${esc(a.n)}${aWin ? ' <span class="win-check" title="Winner">✓</span>' : ''}</div>${scorers(m, 'a')}</div>
      </div>
      ${venue ? `<div class="featured-venue">🏟 ${esc(venue)}</div>` : ''}
      <div class="slot-actions"><button type="button" id="heroToggle" aria-expanded="${S.heroOpen}">${S.heroOpen ? '▲ Hide match details' : '▼ Match details (Line-ups, H2H, Stats)'}</button><button type="button" id="copyLink">🔗 Copy match link</button>${ADMIN ? `<button type="button" id="heroAddVid">🎬 ${hasVideo(m.id) ? 'Edit video link' : 'Add video link'}</button>` : ''}${S.pick ? '<button type="button" id="resetMain">↺ Back to biggest match</button>' : ''}</div>`;
    $('mainHint').textContent = S.pick ? 'YOUR SELECTED MATCH' : S.hero ? 'SELECTED BY ADMIN' : 'AUTO · BIGGEST MATCH';
    if ($('resetMain')) $('resetMain').onclick = () => { S.pick = null; S.heroOpen = false; renderAll(); };
    $('heroToggle').onclick = () => { S.heroOpen = !S.heroOpen; renderHero(); };
    if ($('heroAddVid')) $('heroAddVid').onclick = () => { S.heroOpen = true; S.dtab = 'video'; renderHero(); };
    $('copyLink').onclick = () => { const u = `${location.origin}${location.pathname}?m=${encodeURIComponent(m.id)}`; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => { $('copyLink').textContent = '✓ Copied'; }).catch(() => prompt('Copy this link:', u)); };
    const hd = $('heroDetail');
    if (S.heroOpen) { if (!hd.firstChild || hd.dataset.id !== m.id) { hd.dataset.id = m.id; hd.innerHTML = mdShell(m, true); } else refreshDetails(m.id); } else { hd.innerHTML = ''; hd.dataset.id = ''; }
  }

  function renderSpot() {
    const m = spotMatch(), body = $('spotBody');
    if (!m) { $('spotLeague').textContent = ''; body.innerHTML = '<div class="empty-state">No other competition to highlight right now.</div>'; return; }
    $('spotLeague').textContent = lgInfo(m.lg).n.toUpperCase();
    const pre = m.s === 'pre' || m.s === 'pp';
    const lg = t => safeUrl(t.l) ? `<img class="mini-logo" style="width:46px;height:46px;margin-bottom:6px" src="${esc(safeUrl(t.l))}" alt="" loading="lazy">` : '<span class="vs-logo">⚽</span>';
    body.innerHTML = `<div class="vs-row" data-focus="${esc(m.id)}" title="Open this match in the list"><div class="vs-team">${lg(m.h)}${esc(m.h.n)}</div><div class="vs-center"><div class="vs">${pre ? 'VS' : `${m.h.g} – ${m.a.g}`}</div>${badge(m)}</div><div class="vs-team">${lg(m.a)}${esc(m.a.n)}</div></div><div class="kickoff">${esc(fmtDay(m.d))} · ${esc(fmtTime(m.d))}<small>Local time</small></div>`;
  }

  function renderSideTable() {
    const open = S.open && byId(S.open), m = open || heroMatch(), card = $('tableCard');
    if (!m) { card.hidden = true; return; }
    if (!LF.store.table.has(m.lg)) { LF.loadTable(m.lg).then(renderSideTable); card.hidden = true; return; }
    const rec = LF.store.table.get(m.lg);
    if (!rec.d || !rec.d.groups || !rec.d.groups.length || rec.d.groups.length > 4) { card.hidden = true; return; }
    const li = lgInfo(m.lg);
    $('tableCountry').textContent = li.c.toUpperCase(); $('tableName').textContent = li.n.toUpperCase();
    card.hidden = false;
    $('tableBody').innerHTML = tableHTML(m, 8);
  }

  /* ================= Ro'yxat: sana tasmasi, filtrlar, liga bloklari ================= */
  function dayList() {
    const p = LF.prefs(), now = new Date(), out = [];
    for (let i = -p.back; i <= p.ahead; i++) { const d = addDays(now, i); out.push({ key: dkey(d), top: i === -1 ? 'Yesterday' : i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'short' }), sub: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), today: i === 0 }); }
    return out;
  }
  const searchHit = m => (m.h.n + ' ' + m.h.f + ' ' + m.a.n + ' ' + m.a.f + ' ' + lgInfo(m.lg).n + ' ' + lgInfo(m.lg).c).toLowerCase().includes(S.q.toLowerCase());
  const inView = m => S.q.length >= 2 ? searchHit(m) : (S.tab === 'live' ? isLive(m) : dkey(m.d) === S.tab);
  const statusOK = m => S.status === 'all' || (S.status === 'live' && isLive(m)) || (S.status === 'fin' && m.s === 'post') || (S.status === 'up' && (m.s === 'pre' || m.s === 'pp')) || (S.status === 'fav' && favs.has(m.id));

  /* O'yin qatori: 2-skrinshotdagi kabi vaqt + FT aniq ajratilgan, g'olib jamoa yorqin, video bo'lsa yashil ▶ tugmasi */
  function rowHTML(m) {
    const pre = m.s === 'pre' || m.s === 'pp', fin = m.s === 'post', live = isLive(m), open = S.open === m.id;
    const koTime = esc(fmtTime(m.d));
    const dayPrefix = (S.q.length >= 2 || S.tab === 'live') && !live ? `<span class="lr-day">${esc(fmtDay(m.d))}</span>` : '';

    let statusCell = '';
    if (m.s === 'in') {
      statusCell = `<span class="lr-time">${koTime}</span><span class="st-badge is-live">● ${esc(m.c || 'LIVE')}</span>`;
    } else if (m.s === 'ht') {
      statusCell = `<span class="lr-time">${koTime}</span><span class="st-badge is-ht">HT</span>`;
    } else if (fin) {
      statusCell = `${dayPrefix}<span class="lr-time">${koTime}</span><span class="st-badge is-ft" title="Match Finished">✔ ${esc(m.sd || 'FT')}</span>`;
    } else if (m.s === 'pp') {
      statusCell = `${dayPrefix}<span class="lr-time">${koTime}</span><span class="st-badge is-pp">POSTP.</span>`;
    } else {
      statusCell = `${dayPrefix}<span class="lr-time is-ko">${koTime}</span><span class="st-badge is-up">SOON</span>`;
    }

    const hWin = fin && m.h.g > m.a.g, aWin = fin && m.a.g > m.h.g;
    const vOn = hasVideo(m.id);
    const favOn = favs.has(m.id);
    const sc = pre ? 'VS' : `${m.h.g} – ${m.a.g}`;

    return `<div class="lrow-wrap">
      <div class="lrow${open ? ' open' : ''}${fin ? ' is-fin' : ''}${live ? ' is-live-row' : ''}" data-id="${esc(m.id)}" role="button" tabindex="0" aria-expanded="${open}">
        <span class="lr-st">${statusCell}</span>
        <span class="lr-t home${hWin ? ' is-winner' : aWin ? ' is-loser' : ''}"><b>${esc(m.h.n)}</b>${crest(m.h, 'mini-logo')}</span>
        <span class="lr-sc${live ? ' live' : ''}${fin ? ' fin' : ''}">
          <span class="sc-nums">${sc}</span>
          ${fin ? '<small class="sc-sub">ENDED</small>' : live ? `<small class="sc-sub live-sub">${esc(m.s === 'ht' ? 'HT' : m.c || 'LIVE')}</small>` : ''}
        </span>
        <span class="lr-sh${hWin ? ' is-winner' : ''}">${pre ? '' : m.h.g}</span>
        <span class="lr-t away${aWin ? ' is-winner' : hWin ? ' is-loser' : ''}">${crest(m.a, 'mini-logo')}<b>${esc(m.a.n)}</b></span>
        <span class="lr-sa${aWin ? ' is-winner' : ''}">${pre ? '' : m.a.g}</span>
        <span class="lr-actions">
          ${vOn ? `<button type="button" class="vid-pill" data-open-vid="${esc(m.id)}" title="Watch match video">▶</button>` : ''}
          <button type="button" class="fav-btn${favOn ? ' on' : ''}" data-fav="${esc(m.id)}" title="Pin / Save match" aria-label="Favorite match">${favOn ? '★' : '☆'}</button>
          <span class="lr-ch">⌄</span>
        </span>
      </div>
      ${open ? mdShell(m) : ''}
    </div>`;
  }

  function renderStrip() {
    const all = LF.all(), days = dayList();
    if (!S.tab) S.tab = all.some(isLive) ? 'live' : days.find(d => d.today).key;
    const liveN = all.filter(isLive).length, cnt = k => all.filter(m => dkey(m.d) === k).length;
    const searching = S.q.length >= 2;
    $('dateStrip').innerHTML = `<button type="button" class="ds-btn live${S.tab === 'live' && !searching ? ' active' : ''}" data-tab="live">● LIVE<small>${liveN} now</small></button>` +
      days.map(d => `<button type="button" class="ds-btn${S.tab === d.key && !searching ? ' active' : ''}" data-tab="${d.key}" data-today="${d.today ? 1 : 0}">${esc(d.top)}<small>${esc(d.sub)} · ${cnt(d.key)}</small></button>`).join('');
    const base = all.filter(inView).filter(m => S.lg === 'all' || m.lg === S.lg);
    const c = f => base.filter(f).length;
    $('lsFilters').innerHTML = (S.tab === 'live' && !searching ? '' : `<div class="seg" role="group" aria-label="Status filter">${[
      ['all', 'All', base.length],
      ['live', 'Live', c(isLive)],
      ['fin', '✔ Finished', c(m => m.s === 'post')],
      ['up', 'Upcoming', c(m => m.s === 'pre' || m.s === 'pp')],
      ['fav', '★ Saved', c(m => favs.has(m.id))]
    ].map(([k, n, v]) => `<button type="button" data-st="${k}" class="${S.status === k ? 'active' : ''}">${n}<span class="cnt">${v}</span></button>`).join('')}</div>`) +
      (S.lg !== 'all' ? `<button type="button" class="pill-x" data-lg="all">${esc(lgInfo(S.lg).n)} ✕</button>` : '') + (searching ? '<button type="button" class="pill-x" id="clearQ">Search: “' + esc(S.q) + '” ✕</button>' : '');
  }

  function renderList() {
    renderStrip();
    const all = LF.all();
    let list = all.filter(inView).filter(m => S.lg === 'all' || m.lg === S.lg);
    if (!(S.tab === 'live' && S.q.length < 2)) list = list.filter(statusOK);
    $('matchCount').textContent = `${list.length} MATCH${list.length === 1 ? '' : 'ES'}`;
    if (!list.length) {
      $('matchList').innerHTML = `<div class="empty-state">${S.q.length >= 2 ? 'No matches found for your search.' : S.status === 'fav' ? 'No saved matches in this view yet. Tap ☆ on any match row to pin it here.' : S.tab === 'live' ? 'No live matches right now. Pick a day above to see fixtures.' : 'No matches for this selection.'}</div>`;
      return;
    }
    const groups = new Map();
    list.sort((a, b) => (favs.has(b.id) - favs.has(a.id)) || (isLive(b) - isLive(a)) || (T(a) - T(b))).forEach(m => {
      if (!groups.has(m.lg)) groups.set(m.lg, []);
      groups.get(m.lg).push(m);
    });
    let html = '';
    [...groups].sort((a, b) => lgInfo(b[0]).w - lgInfo(a[0]).w).forEach(([lg, ms]) => {
      const li = lgInfo(lg), key = S.tab + '|' + lg, folded = S.collapsed.has(lg), expanded = S.more.has(key) || ms.some(m => m.id === S.open);
      const shown = expanded ? ms : ms.slice(0, PAGE), liveN = ms.filter(isLive).length, finN = ms.filter(m => m.s === 'post').length;
      const lgHasVid = ms.some(m => hasVideo(m.id));
      html += `<section class="lg-block"><button type="button" class="lg-head" data-fold="${esc(lg)}" aria-expanded="${!folded}"><span>🏆</span><b>${esc(li.n)}</b><small>${esc(li.c)}</small>${lgHasVid ? '<span class="lg-vid-dot" title="Video highlights available">▶</span>' : ''}<span class="lg-n${liveN ? ' live' : ''}">${liveN ? '● ' + liveN + ' LIVE · ' : finN === ms.length ? '✔ ALL FT · ' : ''}${ms.length}</span><span class="lg-c">${folded ? '▸' : '▾'}</span></button>`;
      if (!folded) { html += shown.map(rowHTML).join(''); if (ms.length > PAGE && !expanded) html += `<button type="button" class="more-btn" data-more="${esc(key)}">Show ${ms.length - PAGE} more</button>`; }
      html += '</section>';
    });
    $('matchList').innerHTML = html;
  }

  function renderComp() {
    const base = LF.all().filter(inView), counts = {};
    base.forEach(m => counts[m.lg] = (counts[m.lg] || 0) + 1);
    const ids = Object.keys(counts).sort((a, b) => lgInfo(b).w - lgInfo(a).w);
    $('compList').innerHTML = (S.lg !== 'all' ? '<button type="button" data-lg="all">Show all competitions<small>✕</small></button>' : '') + (ids.map(id => `<button type="button" data-lg="${esc(id)}"${S.lg === id ? ' style="border-color:var(--green)"' : ''}>${esc(lgInfo(id).n)}<small>${counts[id]}</small></button>`).join('') || '<div class="empty-state">No competitions in this view.</div>');
  }
  function renderFresh() {
    const st = LF.store, t = st.gen ? new Date(st.gen).toLocaleTimeString() : '';
    $('dataFreshness').textContent = t ? `Updated ${t} · refreshes automatically` : 'Connecting to live match data…';
  }
  function renderAll() { renderHero(); renderSpot(); renderList(); renderSideTable(); renderComp(); renderFresh(); }

  /* ================= Hodisalar ================= */
  function focusMatch(id) {
    const m = byId(id); if (!m) return;
    S.q = ''; $('siteSearch').value = ''; S.lg = 'all'; S.status = 'all'; S.tab = isLive(m) ? 'live' : dkey(m.d); S.open = id;
    renderAll();
    const el = document.querySelector(`.lrow[data-id="${CSS.escape(id)}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  document.addEventListener('click', async e => {
    if (e.target.closest('#admDrawer, #admBtn')) return;

    /* 1. Sevimlilarga qo'shish (☆ / ★) */
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.stopPropagation();
      toggleFav(favBtn.dataset.fav);
      renderList();
      return;
    }

    /* 2. Qatordagi yashil ▶ video tugmasi */
    const vidBtn = e.target.closest('[data-open-vid]');
    if (vidBtn) {
      e.stopPropagation();
      const id = vidBtn.dataset.openVid;
      S.open = id;
      S.dtab = 'video';
      renderList();
      renderSideTable();
      return;
    }

    /* 3. Hero'dagi Watch Highlights tugmasi */
    const heroVid = e.target.closest('[data-hero-vid]');
    if (heroVid) {
      S.heroOpen = true;
      S.dtab = 'video';
      renderHero();
      return;
    }

    /* 4. Admin: Video tab ichidan YouTube havolani saqlash / o'chirish */
    const vidSave = e.target.closest('[data-vid-save]');
    if (vidSave) {
      const id = vidSave.dataset.vidSave;
      const inp = document.querySelector(`input[data-vid-input="${CSS.escape(id)}"]`);
      const msgEl = document.querySelector(`[data-vid-msg="${CSS.escape(id)}"]`);
      const url = inp ? inp.value.trim() : '';
      if (url && !ytId(url)) {
        if (msgEl) msgEl.textContent = '❌ Please enter a valid YouTube link (https://youtu.be/... or youtube.com/watch?v=...).';
        return;
      }
      if (msgEl) msgEl.textContent = 'Saving video…';
      try {
        const res = await LF.saveVideo(id, url);
        renderAll();
        const mAfter = document.querySelector(`[data-vid-msg="${CSS.escape(id)}"]`);
        if (mAfter) mAfter.textContent = res.localOnly ? '✅ Saved in this browser! (Enter Admin Token in Control -> Setup to publish for all visitors).' : '✅ Video published for all visitors!';
      } catch (err) {
        if (msgEl) msgEl.textContent = '✅ Saved locally · Worker note: ' + err.message;
        renderAll();
      }
      return;
    }
    const vidDel = e.target.closest('[data-vid-del]');
    if (vidDel) {
      const id = vidDel.dataset.vidDel;
      try { await LF.saveVideo(id, ''); } catch (_) {}
      renderAll();
      return;
    }

    const t = e.target.closest('[data-id],[data-tab],[data-lg],[data-more],[data-dt],[data-st],[data-fold],[data-focus],[data-ds],[data-pick],#clearQ');
    if (!t) return;
    if (t.id === 'clearQ') { S.q = ''; $('siteSearch').value = ''; renderAll(); return; }
    if (t.dataset.pick) { S.pick = t.dataset.pick; S.heroOpen = false; S.open = t.dataset.pick; renderAll(); $('mainScoreboard').scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    if (t.dataset.dt) { S.dtab = t.dataset.dt; const w = t.closest('.mdetail'); refreshDetails(w.dataset.for); return; }
    if (t.dataset.id) { S.open = S.open === t.dataset.id ? null : t.dataset.id; const m = byId(S.open); renderList(); renderSideTable(); if (m && isLive(m)) LF.loadDetail(m, true).then(() => refreshDetails(m.id)); return; }
    if (t.dataset.tab) { S.tab = t.dataset.tab; S.q = ''; $('siteSearch').value = ''; S.status = 'all'; S.open = null; renderAll(); return; }
    if (t.dataset.st) { S.status = t.dataset.st; renderList(); return; }
    if (t.dataset.fold) { const k = t.dataset.fold; S.collapsed.has(k) ? S.collapsed.delete(k) : S.collapsed.add(k); renderList(); return; }
    if (t.dataset.more) { S.more.add(t.dataset.more); renderList(); return; }
    if (t.dataset.focus) { focusMatch(t.dataset.focus); return; }
    if (t.dataset.ds) { $('dateStrip').scrollBy({ left: 240 * Number(t.dataset.ds), behavior: 'smooth' }); return; }
    if (t.dataset.lg) { S.lg = t.dataset.lg; renderList(); renderComp(); if (S.lg !== 'all') $('fixtures').scrollIntoView({ behavior: 'smooth' }); }
  });

  $('openTableBtn').addEventListener('click', () => { S.heroOpen = true; S.dtab = 'table'; renderHero(); $('mainScoreboard').scrollIntoView({ behavior: 'smooth' }); });

  /* Qidiruv */
  const sIn = $('siteSearch'), sTog = $('searchToggle'), sClr = $('searchClear');
  function toggleSearch(force) {
    const open = typeof force === 'boolean' ? force : sIn.hidden;
    sIn.hidden = !open; sClr.hidden = !open;
    sTog.setAttribute('aria-expanded', String(open));
    if (open) sIn.focus(); else { S.q = ''; sIn.value = ''; renderList(); renderComp(); }
  }
  sTog.addEventListener('click', () => toggleSearch());
  sClr.addEventListener('click', () => { S.q = ''; sIn.value = ''; renderList(); renderComp(); sIn.focus(); });
  sIn.addEventListener('input', () => { S.q = sIn.value.trim(); S.lg = 'all'; S.status = 'all'; renderList(); renderComp(); });
  sIn.addEventListener('keydown', e => { if (e.key === 'Escape') toggleSearch(false); });

  const vl = $('videoHighlightsLink');
  if (CFG.youtubeChannelUrl) { vl.href = CFG.youtubeChannelUrl; vl.target = '_blank'; vl.rel = 'noopener noreferrer'; }

  /* ================= Yuklash va yangilash ================= */
  const progress = () => renderAll();
  async function start() {
    try {
      await LF.loadWindow(progress);
      const want = Q.get('m');
      if (want && validId(want) && LF.get(want) && !STREAM) focusMatch(want);
    } catch (err) {
      const why = esc(LF.store.err || String(err && err.message || err));
      $('dataFreshness').textContent = 'Live data is temporarily unavailable. Retrying…';
      $('featuredMatch').innerHTML = `<div class="empty-state featured-empty"><strong>Live data is temporarily unavailable</strong><span>We are retrying automatically.${ADMIN ? ' · ' + why : ''}</span></div>`;
      $('matchList').innerHTML = '<div class="empty-state">Could not load matches. Please try again in a moment.</div>';
    }
    renderAll();
    schedule();
  }
  let timer;
  function schedule() {
    clearTimeout(timer);
    const soon = LF.all().some(m => isLive(m) || (m.s === 'pre' && T(m) - Date.now() < HOUR));
    timer = setTimeout(tick, soon ? 35e3 : 120e3);
  }
  async function tick() {
    if (document.visibilityState === 'visible') {
      try {
        if (LF.all().length) await LF.pollLive(); else await LF.loadWindow(progress);
        renderHero(); renderSpot(); renderList(); renderFresh(); renderComp();
        const ids = new Set([S.open, S.heroOpen && heroMatch() && heroMatch().id].filter(Boolean));
        for (const id of ids) { const m = byId(id); if (m && isLive(m)) { await LF.loadDetail(m, true); S.notes.delete(id); refreshDetails(id); } }
      } catch (_) {}
    }
    schedule();
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { clearTimeout(timer); tick(); } });

  /* Admin paneli bilan aloqa (faqat ?admin=1 ochilgan brauzerda yuklanadi) */
  window.LF_APP = {
    hero: () => heroMatch(), focus: id => focusMatch(id), refresh: () => renderAll(),
    setHero: id => { S.hero = id || null; try { id ? localStorage.setItem('lf_hero', id) : localStorage.removeItem('lf_hero'); } catch (_) {} renderAll(); },
    reload: async () => { try { await LF.reset(progress); } catch (_) {} renderAll(); },
    refreshNotes: id => { S.notes.delete(id); refreshDetails(id); }
  };
  if (ADMIN && !STREAM) { const sc = document.createElement('script'); sc.src = 'admin.js'; document.body.appendChild(sc); }

  /* ================= Cookie va rozilik (roziliksiz hech qayerga ma'lumot uzatilmaydi) ================= */
  const consentKey = 'liveFootball.cookieConsent.v1';
  function startOptionalTools(choice) {
    const cfg = window.LIVE_FOOTBALL_CONFIG || {};
    if (choice.analytics && /^G-[A-Z0-9]+$/i.test(cfg.gaMeasurementId || '')) {
      if (!document.querySelector('script[data-ga-loaded]')) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: choice.ads ? 'granted' : 'denied', ad_user_data: choice.ads ? 'granted' : 'denied', ad_personalization: choice.ads ? 'granted' : 'denied', wait_for_update: 500 });
        const g = document.createElement('script');
        g.async = true;
        g.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.gaMeasurementId)}`;
        g.dataset.gaLoaded = 'true';
        document.head.appendChild(g);
        window.gtag('js', new Date());
        window.gtag('config', cfg.gaMeasurementId, { anonymize_ip: true });
      }
    }
    if (choice.ads && /^ca-pub-\d+$/.test(cfg.adsensePublisherId || '') && cfg.adsensePublisherId !== 'ca-pub-0000000000000000') {
      if (!document.querySelector('script[data-adsense-loaded]')) {
        const a = document.createElement('script');
        a.async = true; a.crossOrigin = 'anonymous';
        a.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(cfg.adsensePublisherId)}`;
        a.dataset.adsenseLoaded = 'true';
        document.head.appendChild(a);
      }
      const slots = Array.isArray(cfg.adsenseSlots) ? cfg.adsenseSlots : [];
      document.querySelectorAll('main .ad').forEach((ad, index) => {
        const slot = String(slots[index] || '');
        if (!/^\d+$/.test(slot) || ad.querySelector('.adsbygoogle')) return;
        const ins = document.createElement('ins');
        ins.className = 'adsbygoogle'; ins.style.display = 'block'; ins.style.minWidth = '250px'; ins.style.width = '100%'; ins.style.minHeight = '90px';
        ins.dataset.adClient = cfg.adsensePublisherId; ins.dataset.adSlot = slot; ins.dataset.adFormat = 'auto'; ins.dataset.fullWidthResponsive = 'true';
        const content = ad.querySelector('div');
        if (content) content.replaceChildren(ins); else ad.appendChild(ins);
        try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (_) {}
      });
    }
  }
  function saveConsent(choice) {
    try { localStorage.setItem(consentKey, JSON.stringify({ ...choice, savedAt: new Date().toISOString() })); } catch (_) {}
    if (typeof window.gtag === 'function') window.gtag('consent', 'update', { analytics_storage: choice.analytics ? 'granted' : 'denied', ad_storage: choice.ads ? 'granted' : 'denied', ad_user_data: choice.ads ? 'granted' : 'denied', ad_personalization: choice.ads ? 'granted' : 'denied' });
    $('cookieBanner') && $('cookieBanner').remove();
    $('cookieSettingsPanel') && $('cookieSettingsPanel').remove();
    startOptionalTools(choice);
  }
  function openCookieSettings() {
    $('cookieSettingsPanel') && $('cookieSettingsPanel').remove();
    const panel = document.createElement('div');
    panel.id = 'cookieSettingsPanel'; panel.className = 'cookie-settings-panel';
    panel.innerHTML = '<div class="cookie-settings-card" role="dialog" aria-modal="true" aria-labelledby="cookieSettingsTitle"><h3 id="cookieSettingsTitle">Privacy & Cookie Settings</h3><p>Necessary storage keeps the site’s basic features working. Optional analytics and advertising are off unless you choose to enable them.</p><label><input type="checkbox" checked disabled> Necessary storage (always active)</label><label><input id="consentAnalytics" type="checkbox"> Analytics cookies (Google Analytics)</label><label><input id="consentAds" type="checkbox"> Advertising cookies (Google AdSense)</label><button id="saveCookieSettings">Save choices</button><button id="cancelCookieSettings">Cancel</button></div>';
    document.body.appendChild(panel);
    let existing = {};
    try { existing = JSON.parse(localStorage.getItem(consentKey) || '{}'); } catch (_) {}
    panel.querySelector('#consentAnalytics').checked = Boolean(existing.analytics);
    panel.querySelector('#consentAds').checked = Boolean(existing.ads);
    panel.querySelector('#saveCookieSettings').onclick = () => saveConsent({ analytics: panel.querySelector('#consentAnalytics').checked, ads: panel.querySelector('#consentAds').checked });
    panel.querySelector('#cancelCookieSettings').onclick = () => panel.remove();
    panel.addEventListener('click', e => { if (e.target === panel) panel.remove(); });
  }
  function showCookieBanner() {
    if (STREAM) return;
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(consentKey) || 'null'); } catch (_) {}
    if (saved && typeof saved === 'object') { startOptionalTools(saved); return; }
    const banner = document.createElement('section');
    banner.id = 'cookieBanner'; banner.className = 'cookie-banner';
    banner.innerHTML = '<strong>Privacy & Cookie Choices</strong><p>We use necessary storage to operate this website. With your permission, optional analytics can help us understand visits and advertising tools may display relevant ads. You can change your choice at any time in the footer. Read our <a href="about.html">About &amp; Privacy information</a>.</p><div class="cookie-actions"><button class="accept" id="acceptAllCookies">Accept all</button><button id="rejectOptionalCookies">Reject optional</button><button id="customizeCookies">Settings</button></div>';
    document.body.appendChild(banner);
    banner.querySelector('#acceptAllCookies').onclick = () => saveConsent({ analytics: true, ads: true });
    banner.querySelector('#rejectOptionalCookies').onclick = () => saveConsent({ analytics: false, ads: false });
    banner.querySelector('#customizeCookies').onclick = openCookieSettings;
  }
  $('privacySettingsLink').addEventListener('click', e => { e.preventDefault(); openCookieSettings(); });
  showCookieBanner();

  start();
})();
