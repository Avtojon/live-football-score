(() => {
  'use strict';
  /* ================= Sozlamalar ================= */
  const CFG = window.LIVE_FOOTBALL_CONFIG || {};
  const API = String(window.LIVE_FOOTBALL_API_BASE || '').replace(/\/$/, '');
  const Q = new URLSearchParams(location.search);
  const STREAM = Q.get('stream') === '1';           // stream rejimi: video, reklama, cookie banner YO'Q
  let ADMIN = false;
  try {
    if (Q.get('admin') === '1') localStorage.setItem('lf_admin', '1');
    if (Q.get('admin') === '0') localStorage.removeItem('lf_admin');
    ADMIN = localStorage.getItem('lf_admin') === '1';
  } catch (_) {}
  if (STREAM) document.body.classList.add('stream');

  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const HOUR = 3600e3;
  const PAGE = 6;                                    // har ligadan boshida nechta o'yin ko'rsatiladi

  /* ================= Holat ================= */
  const S = { matches: new Map(), leagues: {}, sel: null, tab: null, lg: 'all', q: '', dtab: 'timeline', detail: new Map(), table: new Map(), open: new Set(), gen: null, videos: null, userTab: false };

  /* ================= Yordamchilar ================= */
  const T = m => Date.parse(m.d) || 0;
  const isLive = m => m.s === 'in' || m.s === 'ht';
  const fmtTime = d => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dkey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const fmtDay = d => new Date(d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  const ymd = d => d.toISOString().slice(0, 10).replace(/-/g, '');
  const addDays = (d, n) => new Date(d.getTime() + n * 864e5);
  const minNum = m => parseInt(String(m).replace(/\D.*/, ''), 10) || 0;
  const fm = s => { s = String(s || '').replace("'+", '+'); return /'$/.test(s) ? s : (s ? s + "'" : ''); };
  const lgInfo = id => S.leagues[id] || { n: id, c: '', w: 20 };
  const crest = (t, cls) => t && t.l ? `<img class="${cls}" src="${esc(t.l)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'">` : '<span class="mini-crest">⚽</span>';

  async function api(path) {
    const r = await fetch(API + path, { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (j && j.ok === false) throw new Error(j.message || 'API error');
    return j;
  }

  /* ================= Ma'lumot yuklash ================= */
  function merge(js) {
    Object.assign(S.leagues, js.leagues || {});
    for (const m of js.matches || []) S.matches.set(m.id, m);
    S.gen = js.generatedAt || S.gen;
  }
  async function loadWeek() {
    const now = new Date();
    merge(await api(`/api/matches?from=${ymd(addDays(now, -1))}&to=${ymd(addDays(now, Number(CFG.daysAhead) || 6))}`));
  }
  async function pollLive() {
    const now = new Date();
    merge(await api(`/api/matches?from=${ymd(addDays(now, -1))}&to=${ymd(now)}`));
  }
  async function loadDetail(m, force) {
    const old = S.detail.get(m.id);
    const ttl = isLive(m) ? 25e3 : 300e3;
    if (!force && old && Date.now() - old.t < ttl) return;
    try {
      const d = await api(`/api/match?id=${encodeURIComponent(m.id)}${isLive(m) ? '&live=1' : ''}`);
      S.detail.set(m.id, { t: Date.now(), d });
    } catch (_) { S.detail.set(m.id, { t: Date.now(), d: null }); }
    const cur = mainMatch();
    if (cur && cur.id === m.id) renderCentre();
  }
  async function loadTable(lg) {
    const old = S.table.get(lg);
    if (old && Date.now() - old.t < 600e3) return;
    try { S.table.set(lg, { t: Date.now(), d: await api(`/api/table?lg=${encodeURIComponent(lg)}`) }); }
    catch (_) { S.table.set(lg, { t: Date.now(), d: null }); }
    renderSideTable();
    if (S.dtab === 'table') renderCentre();
  }

  /* ================= Nufuz bo'yicha tanlash ================= */
  const better = (a, b) => (b.pr - a.pr) || (T(a) - T(b));
  function pickBest(excludeLg) {
    const all = [...S.matches.values()].filter(m => m.lg !== excludeLg && m.s !== 'pp');
    const now = Date.now();
    const pools = [
      all.filter(isLive),
      all.filter(m => m.s === 'pre' && T(m) - now <= 24 * HOUR && T(m) - now >= -2 * HOUR),
      all.filter(m => m.s === 'post' && now - T(m) <= 24 * HOUR),
      all.filter(m => m.s === 'pre' && T(m) > now).sort((a, b) => T(a) - T(b)).slice(0, 12)
    ];
    for (const p of pools) if (p.length) return p.sort(better)[0];
    return null;
  }
  const mainMatch = () => (S.sel && S.matches.get(S.sel)) || pickBest(null);
  const spotMatch = () => { const mm = mainMatch(); return pickBest(mm ? mm.lg : null); };

  /* ================= Asosiy panel ================= */
  function badge(m) {
    if (m.s === 'in') return `<span class="realtime-badge is-live"><i class="live-dot"></i>${esc(m.c || 'LIVE')}</span>`;
    if (m.s === 'ht') return '<span class="realtime-badge is-ht">HALF-TIME</span>';
    if (m.s === 'post') return `<span class="realtime-badge is-done">${esc(m.sd || 'FT')}</span>`;
    if (m.s === 'pp') return '<span class="realtime-badge is-done">POSTPONED</span>';
    return `<span class="realtime-badge is-upcoming">KICK-OFF ${esc(fmtTime(m.d))}</span>`;
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
  function renderMain() {
    const m = mainMatch(), el = $('featuredMatch');
    if (!m) { el.innerHTML = '<div class="empty-state featured-empty"><strong>No major match right now</strong><span>Check the fixtures below for the next big game.</span></div>'; $('centre').hidden = true; return; }
    const li = lgInfo(m.lg), h = m.h, a = m.a;
    const score = (m.s === 'pre' || m.s === 'pp') ? `<span>${esc(fmtTime(m.d))}</span>` : `<span>${h.g} – ${a.g}</span>`;
    const venue = [m.v, m.ct].filter(Boolean).join(' · ');
    const mine = !!S.sel;
    el.innerHTML = `<div class="featured-league"><span class="league-badge-box">${esc(li.n)}${m.nt ? ' · ' + esc(String(m.nt).toUpperCase()) : ''}</span></div>
      <div class="hero-placeholder">
        <div class="placeholder-team">${h.l ? `<img class="team-logo" src="${esc(h.l)}" alt="${esc(h.n)} logo">` : '<div class="placeholder-crest">⚽</div>'}<div class="placeholder-team-name">${esc(h.n)}</div>${scorers(m, 'h')}</div>
        <div class="placeholder-score">${score}<div class="status-line">${badge(m)}</div><small>${esc(new Date(m.d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' }))} · ${esc(fmtTime(m.d))}</small></div>
        <div class="placeholder-team">${a.l ? `<img class="team-logo" src="${esc(a.l)}" alt="${esc(a.n)} logo">` : '<div class="placeholder-crest">⚽</div>'}<div class="placeholder-team-name">${esc(a.n)}</div>${scorers(m, 'a')}</div>
      </div>
      ${venue ? `<div class="featured-venue">🏟 ${esc(venue)}</div>` : ''}
      <div class="slot-actions"><button type="button" id="copyLink">🔗 Copy match link</button>${mine ? '<button type="button" id="resetMain">↺ Back to biggest match</button>' : ''}${ADMIN && !STREAM ? `<a class="admin-chip" href="${esc(CFG.controlUrl || '#')}" target="_blank" rel="noopener">🎛 Stream control</a>` : ''}</div>`;
    $('mainHint').textContent = mine ? 'YOUR SELECTED MATCH' : 'BIGGEST MATCH RIGHT NOW';
    $('copyLink').onclick = () => { const u = `${location.origin}${location.pathname}?m=${encodeURIComponent(m.id)}`; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => { $('copyLink').textContent = '✓ Copied'; }).catch(() => prompt('Copy this link:', u)); };
    if ($('resetMain')) $('resetMain').onclick = () => { S.sel = null; renderAll(); };
    $('centre').hidden = false;
  }

  /* ================= Match Centre ================= */
  const CTABS = [['timeline', 'Timeline'], ['stats', 'Stats'], ['lineups', 'Line-ups'], ['table', 'Table'], ['video', 'Video']];
  function renderCentreTabs() {
    $('centreTabs').innerHTML = CTABS.map(([k, n]) => `<button type="button" role="tab" class="filter${S.dtab === k ? ' active' : ''}" data-ct="${k}" aria-pressed="${S.dtab === k}">${n}</button>`).join('');
  }
  function evHTML(e) {
    const ic = { g: '⚽', y: '🟨', r: '🟥', s: '🔁' }[e.k] || '•';
    const extra = e.q === 'p' ? ' <small>(pen)</small>' : e.q === 'o' ? ' <small>(own goal)</small>' : '';
    const txt = e.k === 's' ? `${ic} ${esc(e.p)} <small>for ${esc(e.o)}</small>` : `${ic} ${esc(e.p)}${extra}`;
    return txt;
  }
  function tlHTML(m, d) {
    // ikkala manba birlashtiriladi: scoreboard (gol/kartochka) + summary (almashtirish ham); takrorlar olib tashlanadi
    const seen = new Set(), evs = [];
    for (const e of [].concat(d && d.events || [], m.e || [])) {
      const key = e.k === 's' ? `s|${e.p}|${e.o}` : `${e.k}|${minNum(e.m)}|${e.t}`;
      if (!seen.has(key)) { seen.add(key); evs.push(e); }
    }
    evs.sort((x, y) => minNum(x.m) - minNum(y.m));
    if (!evs.length) return `<div class="empty-state">${m.s === 'pre' ? 'The match has not started yet.' : 'No key events recorded yet.'}</div>`;
    const rows = evs.map(e => `<div class="tl-row"><div class="tl-h">${e.t === 'h' ? evHTML(e) : ''}</div><div class="tl-m">${esc(fm(e.m))}</div><div class="tl-a">${e.t === 'a' ? evHTML(e) : ''}</div></div>`).join('');
    const i = d && d.info ? d.info : {};
    const info = [i.venue || m.v, i.city || m.ct, i.att ? 'Attendance ' + Number(i.att).toLocaleString() : '', i.ref ? 'Referee ' + i.ref : ''].filter(Boolean).join(' · ');
    return rows + (info ? `<div class="info-line">${esc(info)}</div>` : '');
  }
  function statsHTML(m) {
    if (!m.st) return '<div class="empty-state">Statistics appear when the match starts.</div>';
    const N = [['p', 'Possession', v => Math.round(v) + '%'], ['sh', 'Shots', v => v], ['ot', 'Shots on target', v => v], ['co', 'Corners', v => v], ['fo', 'Fouls', v => v]];
    return N.map(([k, n, f]) => { const [a, b] = m.st[k] || [0, 0], t = (a + b) || 1; return `<div class="sbar"><div class="l"><b>${f(a)}</b><span>${n}</span><b>${f(b)}</b></div><div class="b"><i style="width:${a || b ? a / t * 100 : 50}%"></i></div></div>`; }).join('');
  }
  const W = n => n >= 4 ? 72 : n === 3 ? 64 : 40;
  function place(xi, form) {
    const f = String(form || '').split('-').map(Number).filter(n => n > 0);
    let rows;
    if (f.length >= 2 && f.reduce((x, y) => x + y, 0) === 10) { rows = [[xi[0]]]; let i = 1; f.forEach(n => { rows.push(xi.slice(i, i + n)); i += n; }); }
    else {
      const g = p => /^G/.test(p.pos) ? 0 : /^(D|CB|LB|RB|WB|SW)/.test(p.pos) ? 1 : /^(F|ST|CF|LW|RW|SS)/.test(p.pos) ? 3 : 2;
      rows = [[], [], [], []]; xi.forEach(p => rows[g(p)].push(p)); rows = rows.filter(r => r.length);
    }
    const out = [], n = rows.length;
    rows.forEach((r, ri) => r.forEach((p, k) => out.push({ p, x: r.length === 1 ? 50 : 50 - W(r.length) / 2 + k * W(r.length) / (r.length - 1), y: 88 - ri * (76 / Math.max(n - 1, 1)) })));
    return out;
  }
  const fg = c => { const n = parseInt(String(c).replace('#', ''), 16) || 0; return (0.299 * (n >> 16) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) > 150 ? '#111' : '#fff'; };
  function pitchHTML(t, side, name) {
    if (!t) return '';
    const col = side === 'h' ? '#2df58a' : '#159cff';
    const dots = place(t.xi, t.form).map(o => `<div class="pl" style="left:${o.x}%;top:${o.y}%"><i style="background:${col};color:${fg(col)}">${esc(o.p.num)}</i><span>${esc(o.p.n)}</span></div>`).join('');
    const bench = t.bench && t.bench.length ? `<div class="bench"><b>Substitutes:</b> ${t.bench.map(p => esc((p.num ? p.num + ' ' : '') + p.n)).join(' · ')}</div>` : '';
    return `<div class="pitch ${side === 'h' ? 'home' : 'away'}"><h4>${esc(name)}<span>${esc(t.form || '')}</span></h4><div class="fld">${dots}</div>${bench}</div>`;
  }
  function lineupHTML(m, d) {
    const L = d && d.lineup;
    if (!L || (!L.h && !L.a)) return '<div class="empty-state">Line-ups are usually published about an hour before kick-off.</div>';
    return `<div class="pitches">${pitchHTML(L.h, 'h', m.h.n)}${pitchHTML(L.a, 'a', m.a.n)}</div>`;
  }
  function tableHTML(m, limit) {
    const rec = S.table.get(m.lg);
    if (!rec) { loadTable(m.lg); return '<div class="empty-state">Loading table…</div>'; }
    if (!rec.d || !rec.d.groups || !rec.d.groups.length) return '<div class="empty-state">No standings table is available for this competition.</div>';
    const ids = [m.h.i, m.a.i];
    return rec.d.groups.map(g => {
      let rows = g.rows;
      if (limit) rows = rows.slice(0, limit);
      else if (rec.d.groups.length > 1 && !g.rows.some(r => ids.includes(r.i))) return '';
      return `${g.name && rec.d.groups.length > 1 ? `<div class="grp-name">${esc(g.name)}</div>` : ''}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>#</th><th>Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GD</th><th>Pts</th></tr></thead><tbody>${rows.map(r => `<tr class="${ids.includes(r.i) ? 'hl' : ''}"><td>${r.r}</td><td class="t">${r.l ? `<img src="${esc(r.l)}" alt="" loading="lazy">` : ''}${esc(r.n)}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.lo}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><b>${r.pts}</b></td></tr>`).join('')}</tbody></table></div>`;
    }).join('');
  }
  function ytId(u) {
    const m = String(u || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/))([\w-]{11})/);
    return m ? m[1] : '';
  }
  function videoHTML(m) {
    if (STREAM) return '<div class="empty-state">Video is disabled in stream mode.</div>';   // stream paytida video HECH QACHON yuklanmaydi
    if (S.videos === null) { fetch('videos.json', { cache: 'no-cache' }).then(r => r.json()).catch(() => ({})).then(j => { S.videos = j || {}; if (S.dtab === 'video') renderCentre(); }); return '<div class="empty-state">Loading…</div>'; }
    const id = ytId(S.videos[m.id]);
    if (!id) return '<div class="empty-state">No video is available for this match yet.</div>';
    return `<iframe class="vid" src="https://www.youtube-nocookie.com/embed/${id}?rel=0" title="Match video" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  }
  function renderCentre() {
    const m = mainMatch(); if (!m) return;
    renderCentreTabs();
    const rec = S.detail.get(m.id), d = rec && rec.d;
    const body = { timeline: () => tlHTML(m, d), stats: () => statsHTML(m), lineups: () => lineupHTML(m, d), table: () => tableHTML(m, 0), video: () => videoHTML(m) }[S.dtab];
    $('centreBody').innerHTML = body ? body() : '';
    if (!rec) loadDetail(m);
  }

  /* ================= Yon panel ================= */
  function renderSpot() {
    const m = spotMatch(), body = $('spotBody');
    if (!m) { $('spotLeague').textContent = ''; body.innerHTML = '<div class="empty-state">No other competition to highlight right now.</div>'; return; }
    const li = lgInfo(m.lg);
    $('spotLeague').textContent = li.n.toUpperCase();
    const center = (m.s === 'pre' || m.s === 'pp') ? `<div class="vs">VS</div>` : `<div class="vs">${m.h.g} – ${m.a.g}</div>`;
    body.innerHTML = `<div class="vs-row" data-id="${esc(m.id)}" title="Show in the main scoreboard"><div class="vs-team">${m.h.l ? `<img class="mini-logo" style="width:46px;height:46px;margin-bottom:6px" src="${esc(m.h.l)}" alt="" loading="lazy">` : '<span class="vs-logo">⚽</span>'}${esc(m.h.n)}</div><div class="vs-center">${center}${badge(m)}</div><div class="vs-team">${m.a.l ? `<img class="mini-logo" style="width:46px;height:46px;margin-bottom:6px" src="${esc(m.a.l)}" alt="" loading="lazy">` : '<span class="vs-logo">⚽</span>'}${esc(m.a.n)}</div></div><div class="kickoff">${esc(fmtDay(m.d))} · ${esc(fmtTime(m.d))}<small>Local time</small></div>`;
  }
  function renderSideTable() {
    const m = mainMatch(), card = $('tableCard');
    if (!m) { card.hidden = true; return; }
    if (!S.table.has(m.lg)) { loadTable(m.lg); card.hidden = true; return; }
    const rec = S.table.get(m.lg);
    if (!rec || !rec.d || !rec.d.groups || !rec.d.groups.length || rec.d.groups.length > 4) { card.hidden = true; return; }
    const li = lgInfo(m.lg);
    $('tableCountry').textContent = li.c.toUpperCase(); $('tableName').textContent = li.n.toUpperCase();
    card.hidden = false;
    $('tableBody').innerHTML = tableHTML(m, 8);
  }
  function renderComp() {
    const counts = {};
    for (const m of S.matches.values()) counts[m.lg] = (counts[m.lg] || 0) + 1;
    $('compList').innerHTML = Object.keys(counts).sort((a, b) => lgInfo(b).w - lgInfo(a).w).map(id => `<button type="button" data-lg="${esc(id)}">${esc(lgInfo(id).n)}<small>${counts[id]}</small></button>`).join('') || '<div class="empty-state">No competitions loaded.</div>';
  }

  /* ================= Ro'yxatlar (takrorsiz, ligalar bo'yicha guruhlangan) ================= */
  function days() {
    const now = new Date(), out = [];
    for (let i = -1; i <= (Number(CFG.daysAhead) || 6); i++) {
      const d = addDays(now, i);
      out.push({ key: dkey(d), label: i === -1 ? 'Yesterday' : i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : fmtDay(d) });
    }
    return out;
  }
  function searchHit(m) {
    const q = S.q.toLowerCase();
    return (m.h.n + ' ' + m.h.f + ' ' + m.a.n + ' ' + m.a.f + ' ' + lgInfo(m.lg).n + ' ' + lgInfo(m.lg).c).toLowerCase().includes(q);
  }
  function viewList() {
    const all = [...S.matches.values()];
    if (S.q.length >= 2) return all.filter(searchHit);
    if (S.tab === 'live') return all.filter(isLive);
    return all.filter(m => dkey(m.d) === S.tab);
  }
  function rowHTML(m) {
    const sel = mainMatch() && mainMatch().id === m.id && !!S.sel;
    const pre = m.s === 'pre' || m.s === 'pp';
    const sc = pre ? `<span class="row-time">${esc(fmtTime(m.d))}</span>` : `${m.h.g} – ${m.a.g}`;
    const st = m.s === 'in' ? esc(m.c || 'LIVE') : m.s === 'ht' ? 'HT' : m.s === 'post' ? esc(m.sd || 'FT') : m.s === 'pp' ? 'POSTP.' : '';
    return `<button type="button" class="match-row compact${sel ? ' selected' : ''}" data-id="${esc(m.id)}" aria-pressed="${sel}"><div class="teamcell home">${crest(m.h, 'mini-logo')}<span class="teamlabel">${esc(m.h.n)}</span></div><div class="row-score${isLive(m) ? ' live' : ''}">${sc}${st ? `<span class="row-status">${st}</span>` : ''}</div><div class="teamcell away">${crest(m.a, 'mini-logo')}<span class="teamlabel">${esc(m.a.n)}</span></div><div class="arrow">›</div></button>`;
  }
  function renderLists() {
    const days_ = days();
    if (!S.tab) {                                  // birinchi ochilish: jonli bor bo'lsa "Live Now", aks holda "Today"
      const anyLive = [...S.matches.values()].some(isLive);
      S.tab = anyLive ? 'live' : days_.find(d => d.label === 'Today').key;
    }
    const all = [...S.matches.values()];
    const liveCount = all.filter(isLive).length;
    const cnt = k => all.filter(m => dkey(m.d) === k).length;
    $('viewTabs').innerHTML = `<button type="button" class="filter${S.tab === 'live' && S.q.length < 2 ? ' active' : ''}" data-tab="live">Live Now<span class="cnt">${liveCount}</span></button>` +
      days_.map(d => `<button type="button" class="filter${S.tab === d.key && S.q.length < 2 ? ' active' : ''}" data-tab="${d.key}">${esc(d.label)}<span class="cnt">${cnt(d.key)}</span></button>`).join('');
    let list = viewList();
    // liga filtri tugmalari: shu ko'rinishdagi ligalar
    const lgCount = {};
    list.forEach(m => lgCount[m.lg] = (lgCount[m.lg] || 0) + 1);
    const lgIds = Object.keys(lgCount).sort((a, b) => lgInfo(b).w - lgInfo(a).w);
    if (S.lg !== 'all' && !lgCount[S.lg]) S.lg = 'all';
    $('leagueChips').innerHTML = lgIds.length > 1 ? `<button type="button" class="filter${S.lg === 'all' ? ' active' : ''}" data-lg="all">All<span class="cnt">${list.length}</span></button>` + lgIds.map(id => `<button type="button" class="filter${S.lg === id ? ' active' : ''}" data-lg="${esc(id)}">${esc(lgInfo(id).n)}<span class="cnt">${lgCount[id]}</span></button>`).join('') : '';
    if (S.lg !== 'all') list = list.filter(m => m.lg === S.lg);
    $('matchCount').textContent = `${list.length} MATCH${list.length === 1 ? '' : 'ES'}`;
    if (!list.length) {
      $('matchList').innerHTML = `<div class="empty-state">${S.q.length >= 2 ? 'No matches found for your search.' : S.tab === 'live' ? 'No live matches right now. Pick a day above to see fixtures.' : 'No matches in the tracked competitions on this day.'}</div>`;
      return;
    }
    const groups = new Map();
    list.sort((a, b) => T(a) - T(b)).forEach(m => { if (!groups.has(m.lg)) groups.set(m.lg, []); groups.get(m.lg).push(m); });
    let html = '';
    [...groups].sort((a, b) => lgInfo(b[0]).w - lgInfo(a[0]).w).forEach(([lg, ms]) => {
      const key = S.tab + '|' + lg, open = S.open.has(key), shown = open ? ms : ms.slice(0, PAGE), li = lgInfo(lg);
      const liveN = ms.filter(isLive).length;
      html += `<div class="league-group-banner"><span class="league-group-title">${esc(li.n)} <small style="color:#9db6cc;letter-spacing:.6px">${esc(li.c)}</small></span><span class="league-group-date${liveN ? ' live-date' : ''}">${liveN ? '● ' + liveN + ' LIVE · ' : ''}${ms.length}</span></div>` + shown.map(rowHTML).join('');
      if (ms.length > PAGE && !open) html += `<button type="button" class="more-btn" data-more="${esc(key)}">Show ${ms.length - PAGE} more ${esc(li.n)} matches</button>`;
    });
    $('matchList').innerHTML = html;
  }

  /* ================= Chizish va hodisalar ================= */
  function renderFresh() {
    const t = S.gen ? new Date(S.gen).toLocaleTimeString() : '';
    $('dataFreshness').textContent = t ? `Updated ${t} · refreshes automatically` : 'Connecting to live match data…';
  }
  function renderAll() { renderMain(); renderCentre(); renderSpot(); renderSideTable(); renderComp(); renderLists(); renderFresh(); }

  function select(id) {
    if (!S.matches.has(id)) return;
    S.sel = id; S.dtab = 'timeline';
    renderAll();
    const el = $('mainScoreboard'), r = el.getBoundingClientRect();
    if (r.top < 0 || r.top > innerHeight * 0.5) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-id],[data-tab],[data-lg],[data-more],[data-ct]');
    if (!t) return;
    if (t.dataset.id) { select(t.dataset.id); return; }
    if (t.dataset.tab) { S.tab = t.dataset.tab; S.userTab = true; if (S.q) clearSearch(true); S.lg = 'all'; renderLists(); return; }
    if (t.dataset.ct) { S.dtab = t.dataset.ct; renderCentre(); return; }
    if (t.dataset.more) { S.open.add(t.dataset.more); renderLists(); return; }
    if (t.dataset.lg && t.closest('#compList')) { S.lg = t.dataset.lg; if (S.tab === 'live' || !viewList().some(m => m.lg === S.lg)) { const d = days().find(x => [...S.matches.values()].some(m => m.lg === S.lg && dkey(m.d) === x.key && x.label !== 'Yesterday')); if (d) S.tab = d.key; } renderLists(); $('fixtures').scrollIntoView({ behavior: 'smooth' }); return; }
    if (t.dataset.lg) { S.lg = t.dataset.lg; renderLists(); }
  });
  $('openTableBtn').addEventListener('click', () => { S.dtab = 'table'; renderCentre(); $('centre').scrollIntoView({ behavior: 'smooth' }); });

  /* Qidiruv */
  const sIn = $('siteSearch'), sTog = $('searchToggle'), sClr = $('searchClear');
  function clearSearch(keepOpen) { S.q = ''; sIn.value = ''; if (!keepOpen) toggleSearch(false); }
  function toggleSearch(force) {
    const open = typeof force === 'boolean' ? force : sIn.hidden;
    sIn.hidden = !open; sClr.hidden = !open;
    sTog.setAttribute('aria-expanded', String(open));
    if (open) sIn.focus(); else { S.q = ''; sIn.value = ''; renderLists(); }
  }
  sTog.addEventListener('click', () => toggleSearch());
  sClr.addEventListener('click', () => { S.q = ''; sIn.value = ''; renderLists(); sIn.focus(); });
  sIn.addEventListener('input', () => { S.q = sIn.value.trim(); S.lg = 'all'; renderLists(); });
  sIn.addEventListener('keydown', e => { if (e.key === 'Escape') toggleSearch(false); });

  /* YouTube kanal havolasi */
  const vl = $('videoHighlightsLink');
  if (CFG.youtubeChannelUrl) { vl.href = CFG.youtubeChannelUrl; vl.target = '_blank'; vl.rel = 'noopener noreferrer'; }

  /* ================= Yuklash va yangilash ================= */
  async function start() {
    try {
      await loadWeek();
      const want = Q.get('m');
      if (want && S.matches.has(want)) S.sel = want;
    } catch (err) {
      $('dataFreshness').textContent = 'Live data is temporarily unavailable. Retrying…';
      $('featuredMatch').innerHTML = '<div class="empty-state featured-empty"><strong>Live data is temporarily unavailable</strong><span>We are retrying automatically.</span></div>';
      $('matchList').innerHTML = '<div class="empty-state">Could not load matches. Please try again in a moment.</div>';
    }
    renderAll();
    schedule();
  }
  let timer;
  function schedule() {
    clearTimeout(timer);
    const soon = [...S.matches.values()].some(m => isLive(m) || (m.s === 'pre' && T(m) - Date.now() < HOUR));
    timer = setTimeout(tick, soon ? 30e3 : 120e3);
  }
  async function tick() {
    if (document.visibilityState === 'visible') {
      try {
        if (S.matches.size) await pollLive(); else await loadWeek();
        const m = mainMatch();
        renderMain(); renderSpot(); renderLists(); renderFresh(); renderComp();
        if (m && isLive(m)) loadDetail(m, true); else renderCentre();
      } catch (_) {}
    }
    schedule();
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { clearTimeout(timer); tick(); } });

  /* ================= Cookie va rozilik (avvalgi sayt mantig'i saqlangan) ================= */
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
