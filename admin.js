/* Admin / Site control paneli. FAQAT ?admin=1 bilan bir marta ochilgan brauzerda yuklanadi.
   DIQQAT: bu xavfsizlik himoyasi EMAS, faqat qulaylik. Panel hech qanday maxfiy ma'lumot ushlamaydi va serverga yozmaydi:
   u faqat shu brauzerning sozlamalarini (localStorage) o'zgartiradi va saytni qayta chizadi. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const base = () => location.origin + location.pathname.replace(/[^/]*$/, '');
  let leagues = [], status = {};

  const btn = document.createElement('button');
  btn.id = 'admBtn'; btn.type = 'button'; btn.textContent = '🎛 CONTROL';
  const dr = document.createElement('div');
  dr.id = 'admDrawer'; dr.hidden = true;
  document.body.append(btn, dr);
  btn.onclick = () => { dr.hidden = !dr.hidden; if (!dr.hidden) open(); };

  function matchOptions() {
    const by = {};
    LF.all().filter(m => m.s !== 'pp').forEach(m => (by[m.lg] = by[m.lg] || []).push(m));
    const cur = (window.LF_APP.main() || {}).id;
    return Object.keys(by).sort((a, b) => LF.h.lgInfo(b).w - LF.h.lgInfo(a).w).map(lg =>
      `<optgroup label="${esc(LF.h.lgInfo(lg).n)}">${by[lg].sort((a, b) => LF.h.T(a) - LF.h.T(b)).slice(0, 25).map(m =>
        `<option value="${esc(m.id)}"${m.id === cur ? ' selected' : ''}>${m.s === 'in' ? '🔴 ' + esc(m.c) : m.s === 'ht' ? '🔴 HT' : m.s === 'post' ? '✔ ' : new Date(m.d).toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })} · ${esc(m.h.n)} – ${esc(m.a.n)}</option>`).join('')}</optgroup>`).join('');
  }
  function render() {
    const st = LF.store, p = LF.prefs();
    const err = st.err ? `<div class="adm-err">⚠ ${esc(st.err)}</div>` : '<div class="adm-ok">✓ No errors</div>';
    const known = leagues.length ? leagues : Object.entries(st.leagues).map(([id, v]) => ({ id, n: v.n, c: v.c, w: v.w }));
    dr.innerHTML = `<div class="adm-h"><span>🎛 STREAM / SITE CONTROL</span><button type="button" data-a="close">✕</button></div>
    <div class="adm-s"><h4>Data source</h4>
      <div>ESPN via Worker · <b>${LF.all().length}</b> matches · ${st.gen ? 'updated ' + esc(new Date(st.gen).toLocaleTimeString()) : 'not loaded'}</div>
      <div class="adm-mut">${esc(LF.API || 'API base is not set')}</div>${err}
      <div class="adm-row"><button type="button" data-a="reload">↻ Reload all data now</button><button type="button" data-a="diag">Diagnostics</button></div>
      <div id="admDiag" class="adm-mut"></div></div>
    <div class="adm-s"><h4>Main scoreboard</h4>
      <select id="admMatch"><option value="auto">Auto — biggest match</option>${matchOptions()}</select>
      <div class="adm-row"><button type="button" data-a="apply">📌 Apply</button><button type="button" data-a="copy">🔗 Copy stream URL</button><button type="button" data-a="stream">▶ Open stream mode</button></div>
      <div class="adm-mut" id="admMsg">Stream page: <code>${esc(base())}stream.html</code></div></div>
    <div class="adm-s"><h4>Competitions &amp; days</h4>
      <div class="adm-row"><button type="button" data-a="all">All</button><button type="button" data-a="none">None</button><label>Days ahead <input id="admAhead" type="number" min="1" max="9" value="${p.ahead}" style="width:70px"></label><button type="button" data-a="save">Save &amp; reload</button></div>
      <div class="adm-grid">${known.sort((a, b) => b.w - a.w).map(l => `<label><input type="checkbox" data-lg="${esc(l.id)}"${p.off.includes(l.id) ? '' : ' checked'}> ${esc(l.n)}</label>`).join('') || '<span class="adm-mut">Open Diagnostics once to load the competition list.</span>'}</div></div>
    <div class="adm-s"><h4>Local stream tools</h4><div class="adm-mut">Manual commentary, voice and news cards run in the local Python control panel.</div>
      <div class="adm-row"><a class="admin-chip" href="${esc(LF.CFG.controlUrl || '#')}" target="_blank" rel="noopener">🎛 Open local stream control</a><button type="button" data-a="off">Disable admin mode</button></div></div>`;
  }
  async function loadLeagues() {
    try { const h = await LF.health(); leagues = h.leagues || []; status = h.lastStatus || {}; } catch (e) { status = { _error: { ok: false, error: String(e.message).slice(0, 80) } }; }
  }
  async function open() { render(); if (!leagues.length) { await loadLeagues(); render(); } }

  dr.addEventListener('click', async e => {
    const a = e.target.dataset && e.target.dataset.a;
    if (!a) return;
    const sel = () => $('admMatch').value;
    const url = () => base() + 'stream.html?m=' + encodeURIComponent(sel());
    if (a === 'close') dr.hidden = true;
    else if (a === 'reload') { $('admMsg').textContent = 'Reloading…'; await window.LF_APP.reload(); await loadLeagues(); render(); }
    else if (a === 'diag') {
      await loadLeagues();
      $('admDiag').innerHTML = Object.entries(status).map(([k, v]) => `<div>${v.ok ? '✓' : '✗'} <b>${esc(k)}</b> ${v.ok ? esc(v.variant + ' · ' + v.n + ' matches') : '<span class="adm-err">' + esc(v.error) + '</span>'}</div>`).join('') || 'No data yet.';
      render();
    }
    else if (a === 'apply') { const v = sel(); if (v === 'auto') window.LF_APP.clearSel(); else window.LF_APP.select(v); $('admMsg').textContent = 'Applied: ' + (v === 'auto' ? 'automatic (biggest match)' : v); }
    else if (a === 'copy') { try { await navigator.clipboard.writeText(url()); $('admMsg').textContent = 'Copied: ' + url(); } catch (_) { prompt('Stream URL:', url()); } }
    else if (a === 'stream') window.open(url(), '_blank', 'noopener');
    else if (a === 'all' || a === 'none') dr.querySelectorAll('input[data-lg]').forEach(c => { c.checked = a === 'all'; });
    else if (a === 'save') {
      const off = [...dr.querySelectorAll('input[data-lg]')].filter(c => !c.checked).map(c => c.dataset.lg);
      LF.setPrefs({ off, ahead: $('admAhead').value });
      $('admMsg').textContent = 'Saved. Reloading…';
      await window.LF_APP.reload(); render();
    }
    else if (a === 'off') { try { localStorage.removeItem('lf_admin'); } catch (_) {} location.search = '?admin=0'; }
  });
})();
