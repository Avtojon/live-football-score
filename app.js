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
  const { T, isLive, ymd, addDays, dkey, minNum, fm, lgInfo, safeUrl, validId, HOUR } = LF.h;
  const PAGE = 8;                                    // har ligadan boshida nechta o'yin ko'rsatiladi
  const fmtTime = d => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });
  const fmtDay = d => new Date(d).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

  /* ================= Holat ================= */
  const S = { tab: null, status: 'all', lg: 'all', q: '', open: null, heroOpen: false, dtab: 'timeline', collapsed: new Set(), more: new Set(), videos: null, notes: new Map(), hero: null, pick: null };
  try { S.hero = ADMIN ? localStorage.getItem('lf_hero') : null; } catch (_) {}
  if (STREAM && Q.get('m') && validId(Q.get('m'))) S.hero = Q.get('m');

  /* ================= Tanlash ================= */
  const heroMatch = () => (S.pick && LF.get(S.pick)) || (S.hero && LF.get(S.hero)) || LF.pickBest(null);
  const spotMatch = () => { const h = heroMatch(); return LF.pickBest(h ? h.lg : null); };
  const byId = id => LF.get(id);

  /* ================= Umumiy: badge, gol urganlar ================= */
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
  const crest = (t, cls) => t && safeUrl(t.l) ? `<img class="${cls}" src="${esc(safeUrl(t.l))}" alt="" loading="lazy">` : '<span class="mini-crest">⚽</span>';

  /* ================= Tafsilotlar komponenti (hero va ro'yxat uchun bitta) ================= */
  const DT = [['timeline', 'Timeline'], ['stats', 'Stats'], ['lineups', 'Line-ups'], ['table', 'Table'], ['comments', 'Commentary'], ['video', 'Video']];
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
    return e.k === 's' ? `${ic} ${esc(e.p)} <small>for ${esc(e.o)}</small>` : `${ic} ${esc(e.p)}${extra}`;
  }
  function tlHTML(m, d) {
    const evs = mergedEvents(m, d);
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
    else { const g = p => /^G/.test(p.pos) ? 0 : /^(D|CB|LB|RB|WB|SW)/.test(p.pos) ? 1 : /^(F|ST|CF|LW|RW|SS)/.test(p.pos) ? 3 : 2; rows = [[], [], [], []]; xi.forEach(p => rows[g(p)].push(p)); rows = rows.filter(r => r.length); }
    const out = [], n = rows.length;
    rows.forEach((r, ri) => r.forEach((p, k) => out.push({ p, x: r.length === 1 ? 50 : 50 - W(r.length) / 2 + k * W(r.length) / (r.length - 1), y: 88 - ri * (76 / Math.max(n - 1, 1)) })));
    return out;
  }
  function pitchHTML(t, side, name) {
    if (!t) return '';
    const col = side === 'h' ? '#2df58a' : '#159cff';
    const dots = place(t.xi, t.form).map(o => `<div class="pl" style="left:${o.x}%;top:${o.y}%"><i style="background:${col};color:#04210f">${esc(o.p.num)}</i><span>${esc(o.p.n)}</span></div>`).join('');
    const bench = t.bench && t.bench.length ? `<div class="bench"><b>Substitutes:</b> ${t.bench.map(p => esc((p.num ? p.num + ' ' : '') + p.n)).join(' · ')}</div>` : '';
    return `<div class="pitch ${side === 'h' ? 'home' : 'away'}"><h4>${esc(name)}<span>${esc(t.form || '')}</span></h4><div class="fld">${dots}</div>${bench}</div>`;
  }
  function lineupHTML(m, d) {
    const L = d && d.lineup;
    if (!L || (!L.h && !L.a)) return '<div class="empty-state">Line-ups are usually published about an hour before kick-off.</div>';
    return `<div class="pitches">${pitchHTML(L.h, 'h', m.h.n)}${pitchHTML(L.a, 'a', m.a.n)}</div>`;
  }
  function tableAround(m) {          // yuqori 3 qator + har ikki jamoa atrofidagi qatorlar
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
  function autoLines(m, evs) {
    let h = 0, a = 0; const out = [];
    for (const e of evs) {
      if (e.k === 'g') { e.t === 'h' ? h++ : a++; out.push({ m: e.m, x: `⚽ GOAL! ${e.p || '?'}${e.q === 'p' ? ' (pen)' : e.q === 'o' ? ' (own goal)' : ''} · ${m.h.n} ${h}–${a} ${m.a.n}` }); }
      else if (e.k === 'y') out.push({ m: e.m, x: `🟨 Yellow card: ${e.p}` });
      else if (e.k === 'r') out.push({ m: e.m, x: `🟥 Red card: ${e.p}` });
      else if (e.k === 's') out.push({ m: e.m, x: `🔁 Substitution: ${e.p} for ${e.o}` });
    }
    return out.reverse();
  }
  function commentsHTML(m, d) {
    const rec = S.notes.get(m.id);
    if (!rec || Date.now() - rec.t > 20e3) {
      if (!rec || !rec.busy) { S.notes.set(m.id, { t: rec ? rec.t : 0, d: rec ? rec.d : null, busy: true }); LF.notes(m.id).then(j => { S.notes.set(m.id, { t: Date.now(), d: j }); refreshDetails(m.id); }); }
    }
    const n = rec && rec.d, evs = mergedEvents(m, d), auto = autoLines(m, evs);
    const manual = (n && n.notes || []).slice().reverse();
    let h = '';
    if (n && n.pin) h += `<div class="cm-pin">📌 ${esc(n.pin)}</div>`;
    if (manual.length) h += manual.map(x => `<div class="cm-note"><small>${esc(x.t || '')}</small>${esc(x.x)}</div>`).join('');
    else if (n && n.kv === false) h += '<div class="info-line">Live commentary is not enabled on this site yet.</div>';
    else if (n) h += '<div class="info-line">No commentary has been posted for this match yet.</div>';
    else h += '<div class="info-line">Loading…</div>';
    if (auto.length) h += `<div class="cm-h">Match events feed</div>` + auto.map(x => `<div class="cm-auto"><b>${esc(fm(x.m))}</b>${esc(x.x)}</div>`).join('');
    return h;
  }
  function ytId(u) { const m = String(u || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/))([\w-]{11})/); return m ? m[1] : ''; }
  function videoHTML(m) {
    if (STREAM) return '<div class="empty-state">Video is disabled in stream mode.</div>';   // stream paytida video HECH QACHON yuklanmaydi
    if (S.videos === null) { fetch('videos.json', { cache: 'no-cache' }).then(r => r.json()).catch(() => ({})).then(j => { S.videos = j || {}; refreshDetails(m.id); }); return '<div class="empty-state">Loading…</div>'; }
    const id = ytId(S.videos[m.id]);
    if (!id) return '<div class="empty-state">No video is available for this match yet.</div>';
    return `<iframe class="vid" src="https://www.youtube-nocookie.com/embed/${id}?rel=0" title="Match video" loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  }
  function mdBody(m) {
    const rec = LF.store.detail.get(m.id), d = rec && rec.d;
    if (!rec) loadDetail(m);
    return { timeline: () => tlHTML(m, d), stats: () => statsHTML(m), lineups: () => lineupHTML(m, d), table: () => tableHTML(m, 0), comments: () => commentsHTML(m, d), video: () => videoHTML(m) }[S.dtab]();
  }
  const mdShell = (m, inHero) => `<div class="mdetail" data-for="${esc(m.id)}"><div class="md-tabs" role="tablist">${DT.map(([k, n]) => `<button type="button" role="tab" class="filter${S.dtab === k ? ' active' : ''}" data-dt="${k}" aria-pressed="${S.dtab === k}">${n}</button>`).join('')}${inHero ? '' : `<button type="button" class="md-pick" data-pick="${esc(m.id)}" title="Show this match in the main panel">📌 Show in main panel</button>`}</div><div class="md-grid"><div class="md-body">${mdBody(m)}</div><aside class="md-aside">${asideHTML(m)}</aside></div></div>`;
  async function loadDetail(m, force) { await LF.loadDetail(m, force); refreshDetails(m.id); }
  function refreshDetails(id) {
    const m = byId(id); if (!m) return;
    document.querySelectorAll(`.mdetail[data-for="${CSS.escape(id)}"]`).forEach(el => {
      el.querySelectorAll('.md-tabs .filter').forEach(b => { const on = b.dataset.dt === S.dtab; b.classList.toggle('active', on); b.setAttribute('aria-pressed', String(on)); });
      el.querySelector('.md-body').innerHTML = mdBody(m);
      el.querySelector('.md-aside').innerHTML = asideHTML(m);
    });
  }

  /* ================= Asosiy panel va Spotlight ================= */
  function renderHero() {
    const m = heroMatch(), el = $('featuredMatch');
    if (!m) { el.innerHTML = '<div class="empty-state featured-empty"><strong>No major match right now</strong><span>Check the fixtures below for the next big game.</span></div>'; $('heroDetail').innerHTML = ''; return; }
    const li = lgInfo(m.lg), h = m.h, a = m.a, pre = m.s === 'pre' || m.s === 'pp';
    const venue = [m.v, m.ct].filter(Boolean).join(' · ');
    const logo = (t) => safeUrl(t.l) ? `<img class="team-logo" src="${esc(safeUrl(t.l))}" alt="${esc(t.n)} logo">` : '<div class="placeholder-crest">⚽</div>';
    el.innerHTML = `<div class="featured-league"><span class="league-badge-box">${esc(li.n)}${m.nt ? ' · ' + esc(String(m.nt).toUpperCase()) : ''}</span></div>
      <div class="hero-placeholder">
        <div class="placeholder-team">${logo(h)}<div class="placeholder-team-name">${esc(h.n)}</div>${scorers(m, 'h')}</div>
        <div class="placeholder-score"><span>${pre ? esc(fmtTime(m.d)) : `${h.g} – ${a.g}`}</span><div class="status-line">${badge(m)}</div><small>${esc(fmtDay(m.d))} · ${esc(fmtTime(m.d))}</small></div>
        <div class="placeholder-team">${logo(a)}<div class="placeholder-team-name">${esc(a.n)}</div>${scorers(m, 'a')}</div>
      </div>
      ${venue ? `<div class="featured-venue">🏟 ${esc(venue)}</div>` : ''}
      <div class="slot-actions"><button type="button" id="heroToggle" aria-expanded="${S.heroOpen}">${S.heroOpen ? '▲ Hide match details' : '▼ Match details'}</button><button type="button" id="copyLink">🔗 Copy match link</button>${S.pick ? '<button type="button" id="resetMain">↺ Back to biggest match</button>' : ''}</div>`;
    $('mainHint').textContent = S.pick ? 'YOUR SELECTED MATCH' : S.hero ? 'SELECTED BY ADMIN' : 'AUTO · BIGGEST MATCH';
    if ($('resetMain')) $('resetMain').onclick = () => { S.pick = null; S.heroOpen = false; renderAll(); };
    $('heroToggle').onclick = () => { S.heroOpen = !S.heroOpen; renderHero(); };
    $('copyLink').onclick = () => { const u = `${location.origin}${location.pathname}?m=${encodeURIComponent(m.id)}`; (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => { $('copyLink').textContent = '✓ Copied'; }).catch(() => prompt('Copy this link:', u)); };
    const hd = $('heroDetail');
    if (S.heroOpen) { if (!hd.firstChild || hd.dataset.id !== m.id) { hd.dataset.id = m.id; hd.innerHTML = mdShell(m, true); } } else { hd.innerHTML = ''; hd.dataset.id = ''; }
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
  const statusOK = m => S.status === 'all' || (S.status === 'live' && isLive(m)) || (S.status === 'fin' && m.s === 'post') || (S.status === 'up' && (m.s === 'pre' || m.s === 'pp'));
  function rowHTML(m) {
    const pre = m.s === 'pre' || m.s === 'pp', open = S.open === m.id;
    const st = m.s === 'in' ? esc(m.c || 'LIVE') : m.s === 'ht' ? 'HT' : m.s === 'post' ? esc(m.sd || 'FT') : m.s === 'pp' ? 'POSTP.' : esc(fmtTime(m.d));
    const stc = isLive(m) ? ' live' : '';
    const dayPrefix = (S.q.length >= 2 || S.tab === 'live') && m.s !== 'in' && m.s !== 'ht' ? `${esc(fmtDay(m.d))} · ` : '';
    const sc = pre ? '–' : `${m.h.g} – ${m.a.g}`;
    return `<div class="lrow-wrap"><button type="button" class="lrow${open ? ' open' : ''}" data-id="${esc(m.id)}" aria-expanded="${open}"><span class="lr-st${stc}">${dayPrefix}${st}</span><span class="lr-t home"><b>${esc(m.h.n)}</b>${crest(m.h, 'mini-logo')}</span><span class="lr-sc${stc}">${sc}</span><span class="lr-sh">${pre ? '' : m.h.g}</span><span class="lr-t away">${crest(m.a, 'mini-logo')}<b>${esc(m.a.n)}</b></span><span class="lr-sa">${pre ? '' : m.a.g}</span><span class="lr-ch">⌄</span></button>${open ? mdShell(m) : ''}</div>`;
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
    $('lsFilters').innerHTML = (S.tab === 'live' && !searching ? '' : `<div class="seg" role="group" aria-label="Status filter">${[['all', 'All', base.length], ['live', 'Live', c(isLive)], ['fin', 'Finished', c(m => m.s === 'post')], ['up', 'Upcoming', c(m => m.s === 'pre' || m.s === 'pp')]].map(([k, n, v]) => `<button type="button" data-st="${k}" class="${S.status === k ? 'active' : ''}">${n}<span class="cnt">${v}</span></button>`).join('')}</div>`) +
      (S.lg !== 'all' ? `<button type="button" class="pill-x" data-lg="all">${esc(lgInfo(S.lg).n)} ✕</button>` : '') + (searching ? '<button type="button" class="pill-x" id="clearQ">Search: “' + esc(S.q) + '” ✕</button>' : '');
  }
  function renderList() {
    renderStrip();
    const all = LF.all();
    let list = all.filter(inView).filter(m => S.lg === 'all' || m.lg === S.lg);
    if (!(S.tab === 'live' && S.q.length < 2)) list = list.filter(statusOK);
    $('matchCount').textContent = `${list.length} MATCH${list.length === 1 ? '' : 'ES'}`;
    if (!list.length) { $('matchList').innerHTML = `<div class="empty-state">${S.q.length >= 2 ? 'No matches found for your search.' : S.tab === 'live' ? 'No live matches right now. Pick a day above to see fixtures.' : 'No matches for this selection.'}</div>`; return; }
    const groups = new Map();
    list.sort((a, b) => T(a) - T(b)).forEach(m => { if (!groups.has(m.lg)) groups.set(m.lg, []); groups.get(m.lg).push(m); });
    let html = '';
    [...groups].sort((a, b) => lgInfo(b[0]).w - lgInfo(a[0]).w).forEach(([lg, ms]) => {
      const li = lgInfo(lg), key = S.tab + '|' + lg, folded = S.collapsed.has(lg), expanded = S.more.has(key) || ms.some(m => m.id === S.open);
      const shown = expanded ? ms : ms.slice(0, PAGE), liveN = ms.filter(isLive).length;
      html += `<section class="lg-block"><button type="button" class="lg-head" data-fold="${esc(lg)}" aria-expanded="${!folded}"><span>🏆</span><b>${esc(li.n)}</b><small>${esc(li.c)}</small><span class="lg-n${liveN ? ' live' : ''}">${liveN ? '● ' + liveN + ' LIVE · ' : ''}${ms.length}</span><span class="lg-c">${folded ? '▸' : '▾'}</span></button>`;
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
  function focusMatch(id) {          // spotlight / admin: ro'yxatda o'sha o'yinni topib ochadi
    const m = byId(id); if (!m) return;
    S.q = ''; $('siteSearch').value = ''; S.lg = 'all'; S.status = 'all'; S.tab = isLive(m) ? 'live' : dkey(m.d); S.open = id;
    renderAll();
    const el = document.querySelector(`.lrow[data-id="${CSS.escape(id)}"]`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  document.addEventListener('click', e => {
    if (e.target.closest('#admDrawer, #admBtn')) return;        // admin paneli ichidagi bosishlar sayt ro'yxatiga tegmaydi
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
    timer = setTimeout(tick, soon ? 30e3 : 120e3);
  }
  async function tick() {
    if (document.visibilityState === 'visible') {
      try {
        if (LF.all().length) await LF.pollLive(); else await LF.loadWindow(progress);
        renderHero(); renderSpot(); renderList(); renderFresh(); renderComp();
        const ids = new Set([S.open, S.heroOpen && heroMatch() && heroMatch().id].filter(Boolean));
        for (const id of ids) { const m = byId(id); if (m && isLive(m)) { await LF.loadDetail(m, true); S.notes.delete(id); refreshDetails(id); } else if (m && S.dtab === 'comments') { S.notes.delete(id); refreshDetails(id); } }
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
