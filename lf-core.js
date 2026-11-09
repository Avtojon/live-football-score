/* LIVE FOOTBALL — umumiy ma'lumot qatlami (sayt va stream sahifasi shuni ishlatadi, takrorlanish yo'q). */
window.LF = (() => {
  'use strict';
  const CFG = window.LIVE_FOOTBALL_CONFIG || {};
  const API = String(window.LIVE_FOOTBALL_API_BASE || '').replace(/\/$/, '');
  const HOUR = 3600e3;
  const store = { matches: new Map(), leagues: {}, gen: null, err: '', okAt: 0, detail: new Map(), table: new Map(), videos: {} };

  /* ---------- sozlamalar (faqat shu brauzerda, localStorage) ---------- */
  const PREF_KEY = 'lf_prefs_v1';
  const VID_LOCAL_KEY = 'lf_videos_v1';
  let prefs = { off: [], ahead: Number(CFG.daysAhead) || 6, back: Number(CFG.daysBack) || 1 };
  try {
    const p = JSON.parse(localStorage.getItem(PREF_KEY) || 'null');
    if (p && Array.isArray(p.off)) prefs = { off: p.off.filter(x => /^[a-z0-9.]{2,30}$/.test(x)), ahead: Math.min(9, Math.max(1, parseInt(p.ahead, 10) || prefs.ahead)), back: Math.min(7, Math.max(1, parseInt(p.back, 10) || prefs.back)) };
    const lv = JSON.parse(localStorage.getItem(VID_LOCAL_KEY) || 'null');
    if (lv && typeof lv === 'object') Object.assign(store.videos, lv);
  } catch (_) {}
  const setPrefs = p => { prefs = { off: (p.off || []).filter(x => /^[a-z0-9.]{2,30}$/.test(x)), ahead: Math.min(9, Math.max(1, parseInt(p.ahead, 10) || 6)), back: Math.min(7, Math.max(1, parseInt(p.back, 10) || 1)) }; try { localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch (_) {} };

  /* ---------- yordamchilar ---------- */
  const T = m => Date.parse(m.d) || 0;
  const isLive = m => m.s === 'in' || m.s === 'ht';
  const ymd = d => d.toISOString().slice(0, 10).replace(/-/g, '');
  const addDays = (d, n) => new Date(d.getTime() + n * 864e5);
  const dkey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
  const minNum = m => parseInt(String(m).replace(/\D.*/, ''), 10) || 0;
  const fm = s => { s = String(s || '').replace("'+", '+'); return /'$/.test(s) ? s : (s ? s + "'" : ''); };
  const lgInfo = id => store.leagues[id] || { n: id, c: '', w: 20 };
  const safeUrl = u => (/^https:\/\/[a-z0-9.-]+\/[^\s"'<>]{1,300}$/i.test(String(u || '')) ? String(u) : '');
  const validId = id => /^[a-z0-9.]{2,30}:\d{1,12}$/.test(String(id || ''));
  const ytId = u => { const m = String(u || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/))([\w-]{11})/); return m ? m[1] : (/^[\w-]{11}$/.test(String(u || '').trim()) ? String(u).trim() : ''); };

  /* ---------- API ---------- */
  const inflight = new Map();
  async function api(path) {
    if (!API) throw new Error('LIVE_FOOTBALL_API_BASE is not set');
    if (inflight.has(path)) return inflight.get(path);
    const p = (async () => {
      const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 15000);
      try {
        const r = await fetch(API + path, { cache: 'no-store', signal: ctl.signal, credentials: 'omit' });
        let j = null; try { j = await r.json(); } catch (_) {}
        if (!r.ok || !j || j.ok === false) {
          if (j && j.service === 'LIVE FOOTBALL API proxy') {
            throw new Error('Cloudflare Worker hali eski (API-Football) kodda turibdi. Yangi worker.js ni Cloudflare Worker ichiga joylab Deploy qiling.');
          }
          throw new Error((j && j.message) || 'HTTP ' + r.status);
        }
        if (j.service === 'LIVE FOOTBALL API proxy') {
          throw new Error('Cloudflare Worker hali eski (API-Football) kodda turibdi. Yangi worker.js ni Cloudflare Worker ichiga joylab Deploy qiling.');
        }
        return j;
      } finally {
        clearTimeout(t);
        inflight.delete(path);
      }
    })();
    inflight.set(path, p);
    return p;
  }

  function merge(js) {
    Object.assign(store.leagues, js.leagues || {});
    for (const m of js.matches || []) if (m && validId(m.id)) store.matches.set(m.id, m);
    store.gen = js.generatedAt || store.gen; store.okAt = Date.now(); store.err = '';
  }
  const all = () => [...store.matches.values()].filter(m => !prefs.off.includes(m.lg));
  const get = id => { const m = store.matches.get(id); return m && !prefs.off.includes(m.lg) ? m : null; };

  /* Videolar ro'yxatini videos.json va Worker /api/videos dan yuklash */
  async function loadVideos() {
    const merged = {};
    try {
      const r = await fetch('videos.json', { cache: 'no-cache' });
      if (r.ok) { const j = await r.json(); if (j && typeof j === 'object') Object.assign(merged, j); }
    } catch (_) {}
    try {
      const w = await api('/api/videos');
      if (w && w.videos && typeof w.videos === 'object') Object.assign(merged, w.videos);
    } catch (_) {}
    try {
      const lv = JSON.parse(localStorage.getItem(VID_LOCAL_KEY) || 'null');
      if (lv && typeof lv === 'object') Object.assign(merged, lv);
    } catch (_) {}
    store.videos = merged;
    return store.videos;
  }
  const videoFor = id => store.videos[id] || '';
  function setLocalVideo(id, url) {
    if (!validId(id)) return;
    let lv = {};
    try { lv = JSON.parse(localStorage.getItem(VID_LOCAL_KEY) || '{}') || {}; } catch (_) {}
    const y = ytId(url);
    if (y) {
      const clean = 'https://youtu.be/' + y;
      lv[id] = clean;
      store.videos[id] = clean;
    } else {
      delete lv[id];
      delete store.videos[id];
    }
    try { localStorage.setItem(VID_LOCAL_KEY, JSON.stringify(lv)); } catch (_) {}
  }

  /* Oyna: bugundan -back..+ahead kun. Har kun ALOHIDA so'rov, 2 tadan parallel (ESPN yuklamasini kamaytirish uchun) */
  async function loadWindow(onProgress) {
    loadVideos().then(() => { if (onProgress) onProgress(); }).catch(() => {});
    const now = new Date(), order = [0, 1, -1];
    for (let i = 2; i <= prefs.ahead; i++) order.push(i);
    const maxBackUtc = Math.min(7, prefs.back + 1);
    for (let i = 2; i <= maxBackUtc; i++) order.push(-i);
    const jobs = order.map(n => ymd(addDays(now, n)));
    let ok = 0, lastErr = null, idx = 0;
    const worker = async () => {
      while (idx < jobs.length) {
        const d = jobs[idx++];
        try { merge(await api('/api/matches?days=' + d)); ok++; if (onProgress) onProgress(); } catch (e) { lastErr = e; }
      }
    };
    await Promise.all([worker(), worker()]);
    if (!ok) { store.err = String(lastErr && lastErr.message || 'unknown error'); throw lastErr || new Error('failed'); }
    store.err = lastErr ? 'Some days failed: ' + String(lastErr.message).slice(0, 80) : '';
  }

  async function pollLive() {
    const now = new Date();
    merge(await api('/api/matches?days=' + ymd(now)));
    const lateLive = [...store.matches.values()].some(m => isLive(m) && Date.parse(m.d) < now.getTime() - 3 * HOUR) || now.getUTCHours() < 6;
    if (lateLive) { try { merge(await api('/api/matches?days=' + ymd(addDays(now, -1)))); } catch (_) {} }
  }
  async function reset(onProgress) { store.matches.clear(); store.detail.clear(); store.table.clear(); store.err = ''; await loadWindow(onProgress); }

  async function loadDetail(m, force) {
    const old = store.detail.get(m.id), ttl = isLive(m) ? 30e3 : 300e3;
    if (!force && old && Date.now() - old.t < ttl) return old.d;
    let d = null;
    try { d = await api(`/api/match?id=${encodeURIComponent(m.id)}${isLive(m) ? '&live=1' : ''}`); } catch (_) {}
    store.detail.set(m.id, { t: Date.now(), d });
    return d;
  }
  async function loadTable(lg) {
    const old = store.table.get(lg);
    if (old && Date.now() - old.t < 600e3) return old.d;
    let d = null;
    try { d = await api('/api/table?lg=' + encodeURIComponent(lg)); } catch (_) {}
    store.table.set(lg, { t: Date.now(), d });
    return d;
  }
  const health = () => api('/api/health');

  /* ---------- sharhlar va video saqlash (admin) ---------- */
  const TOK = 'lf_admin_token';
  const token = () => { try { return localStorage.getItem(TOK) || ''; } catch (_) { return ''; } };
  const setToken = t => { try { t ? localStorage.setItem(TOK, t) : localStorage.removeItem(TOK); } catch (_) {} };
  async function notes(id) { try { return await api('/api/notes?id=' + encodeURIComponent(id)); } catch (_) { return { ok: false, notes: [], pin: '' }; } }
  async function postNote(path, body) {
    if (!API) throw new Error('API base is not set');
    const r = await fetch(API + path, { method: 'POST', cache: 'no-store', credentials: 'omit', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': token() }, body: JSON.stringify(body) });
    let j = null; try { j = await r.json(); } catch (_) {}
    if (!r.ok || !j || j.ok === false) throw new Error((j && j.message) || 'HTTP ' + r.status);
    return j;
  }
  async function saveVideo(id, url) {
    setLocalVideo(id, url);
    if (token()) {
      const j = await postNote('/api/video', { id, url });
      if (j && j.videos) Object.assign(store.videos, j.videos);
      return j;
    }
    return { ok: true, localOnly: true, videos: store.videos };
  }

  /* ---------- nufuz bo'yicha tanlash ---------- */
  const better = (a, b) => (b.pr - a.pr) || (T(a) - T(b));
  function pickBest(excludeLg) {
    const list = all().filter(m => m.lg !== excludeLg && m.s !== 'pp'), now = Date.now();
    const pools = [
      list.filter(isLive),
      list.filter(m => m.s === 'pre' && T(m) - now <= 24 * HOUR && T(m) - now >= -2 * HOUR),
      list.filter(m => m.s === 'post' && now - T(m) <= 24 * HOUR),
      list.filter(m => m.s === 'pre' && T(m) > now).sort((a, b) => T(a) - T(b)).slice(0, 12)
    ];
    for (const p of pools) if (p.length) return p.sort(better)[0];
    return null;
  }

  return {
    CFG, API, store, prefs: () => prefs, setPrefs, api, all, get, loadWindow, pollLive, reset,
    loadDetail, loadTable, loadVideos, videoFor, setLocalVideo, saveVideo, health, pickBest, token, setToken, notes, postNote,
    h: { T, isLive, ymd, addDays, dkey, minNum, fm, lgInfo, safeUrl, validId, ytId, HOUR }
  };
})();
