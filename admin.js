/* Admin / Site control. FAQAT ?admin=1 bilan bir marta ochilgan brauzerda yuklanadi.
   Himoya haqida: ?admin=1 faqat tugmani ko'rsatadi, XAVFSIZLIK emas. Haqiqiy himoya — Worker'dagi ADMIN_TOKEN:
   sharh yozish/o'chirish faqat token bilan ishlaydi (token kodda saqlanmaydi, faqat shu brauzerning localStorage'ida). */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const base = () => location.origin + location.pathname.replace(/[^/]*$/, '');
  const H = LF.h;
  let tab = 'comment', cm = { id: '', notes: [], pin: '', msg: '' }, leagues = [], status = {}, msg = '';

  const QK = [['⚽ Goal', [['⚽ Gol', '⚽ GOAL! What a strike!'], ['🎯 Penalti', '🎯 Penalty awarded!'], ['🔥 Jamoaviy', '🔥 Brilliant team goal!'], ['😬 Avtogol', '😬 Own goal!']]],
    ['🧤 Keeper', [['🧤 Seyv', '🧤 Great save!'], ['🧱 Devor', '🧱 Solid as a wall! The keeper stands firm'], ['🚫 Penalti urdi', '🚫 Penalty saved!'], ['🥅 Shtanga', '🥅 Off the post!']]],
    ['🟨 Discipline', [['🟨 Sariq', '🟨 Yellow card'], ['🟥 Qizil', '🟥 RED CARD!'], ['📺 VAR', '📺 VAR check…'], ['🚑 Jarohat', '🚑 Injury stoppage']]],
    ['🔄 Game', [['🔄 Almashtirish', '🔄 Substitution'], ['🚩 Ofsayd', '🚩 Offside'], ['📐 Burchak', '📐 Corner kick'], ['😮 Xavfli', '😮 Big chance!'], ['⏸ Tanaffus', '⏸ Half-time'], ['🏁 Yakun', '🏁 Full-time']]]];

  const btn = document.createElement('button'); btn.id = 'admBtn'; btn.type = 'button'; btn.textContent = '🎛 CONTROL';
  const dr = document.createElement('div'); dr.id = 'admDrawer'; dr.hidden = true;
  document.body.append(btn, dr);
  btn.onclick = () => { dr.hidden = !dr.hidden; if (!dr.hidden) { if (!cm.id) { const h = window.LF_APP.hero(); cm.id = h ? h.id : ''; } render(); if (tab === 'comment') loadNotes(); } };

  const options = (selected, withAuto) => {
    const by = {};
    LF.all().filter(m => m.s !== 'pp').forEach(m => (by[m.lg] = by[m.lg] || []).push(m));
    const label = m => `${m.s === 'in' ? '🔴 ' + esc(m.c) : m.s === 'ht' ? '🔴 HT' : m.s === 'post' ? '✔ FT' : esc(new Date(m.d).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' }))} · ${esc(m.h.n)} – ${esc(m.a.n)}`;
    return (withAuto ? '<option value="">Auto — biggest match</option>' : '') + Object.keys(by).sort((a, b) => H.lgInfo(b).w - H.lgInfo(a).w).map(lg =>
      `<optgroup label="${esc(H.lgInfo(lg).n)}">${by[lg].sort((a, b) => (H.isLive(b) - H.isLive(a)) || (H.T(a) - H.T(b))).slice(0, 30).map(m => `<option value="${esc(m.id)}"${m.id === selected ? ' selected' : ''}>${label(m)}</option>`).join('')}</optgroup>`).join('');
  };

  function tabComment() {
    const m = LF.get(cm.id);
    return `<div class="adm-s"><h4>Match</h4><select id="admCm">${options(cm.id, false)}</select>
      <textarea id="admTx" rows="3" maxlength="280" placeholder="Write in Uzbek — it is published in English (Enter = send)"></textarea>
      <label class="adm-row"><input type="checkbox" id="admNoTr"> No translation (publish exactly as typed)</label>
      <div class="adm-row"><button type="button" data-a="send">📤 Send</button><button type="button" data-a="pin">📌 Pin</button><button type="button" data-a="clear">🗑 Clear all</button></div>
      <div id="admCmMsg" class="adm-mut">${esc(cm.msg || (LF.token() ? '' : '⚠ Enter the admin token in the Setup tab first.'))}</div></div>
    <div class="adm-s"><h4>Quick messages — one tap publishes (Shift+tap = insert into text)</h4>${QK.map(g => `<div class="adm-mut">${esc(g[0])}</div><div class="adm-qg">${g[1].map(b => `<button type="button" data-q="${esc(b[1])}">${esc(b[0])}</button>`).join('')}</div>`).join('')}</div>
    <div class="adm-s"><h4>Published${m ? ' · ' + esc(m.h.n) + ' – ' + esc(m.a.n) : ''}</h4>
      ${cm.pin ? `<div class="adm-note"><span>📌 ${esc(cm.pin)}</span><button type="button" data-del="pin">✕</button></div>` : ''}
      ${cm.notes.slice().reverse().map(n => `<div class="adm-note"><span><b>${esc(n.t)}</b> ${esc(n.x)}${n.o ? `<small>${esc(n.o)}</small>` : ''}</span><button type="button" data-del="${esc(n.id)}">✕</button></div>`).join('') || '<div class="adm-mut">Nothing published yet.</div>'}</div>`;
  }
  function tabStream() {
    const cur = (window.LF_APP.hero() || {}).id || '';
    let sel = ''; try { sel = localStorage.getItem('lf_hero') || ''; } catch (_) {}
    return `<div class="adm-s"><h4>Main scoreboard (this browser)</h4><select id="admHero">${options(sel, true)}</select>
      <div class="adm-row"><button type="button" data-a="apply">📌 Apply</button><button type="button" data-a="copy">🔗 Copy stream URL</button><button type="button" data-a="stream">▶ Open stream mode</button></div>
      <div class="adm-mut">Stream mode hides ads, the cookie banner and the VIDEO player, and opens the match details. Current: ${esc(cur || '—')}</div><div class="adm-mut" id="admMsg">${esc(msg)}</div></div>
    <div class="adm-s"><h4>Local stream tools (your PC)</h4><div class="adm-mut">OBS overlay, voice and news cards run in the local Python control panel.</div>
      <a class="admin-chip" href="${esc(LF.CFG.controlUrl || '#')}" target="_blank" rel="noopener">🎛 Open local stream control</a></div>`;
  }
  function tabData() {
    const st = LF.store, p = LF.prefs();
    const known = leagues.length ? leagues : Object.entries(st.leagues).map(([id, v]) => ({ id, n: v.n, c: v.c, w: v.w }));
    const stat = id => { const s = status[id]; return s ? (s.ok ? '<span class="adm-ok">✓</span>' : '<span class="adm-err" title="' + esc(s.error) + '">✗</span>') : ''; };
    return `<div class="adm-s"><h4>Data source</h4><div>ESPN via Worker · <b>${LF.all().length}</b> matches · ${st.gen ? 'updated ' + esc(new Date(st.gen).toLocaleTimeString()) : 'not loaded'}</div>
      <div class="adm-mut">${esc(LF.API || 'API base is not set')}</div>${st.err ? `<div class="adm-err">⚠ ${esc(st.err)}</div>` : '<div class="adm-ok">✓ No errors</div>'}
      <div class="adm-mut">An ✗ next to a competition means ESPN rejected it (HTTP 400/404 = unknown league code). The other competitions keep working.</div>
      <div class="adm-row"><button type="button" data-a="reload">↻ Reload all data</button><button type="button" data-a="diag">Check competitions</button></div></div>
    <div class="adm-s"><h4>Days</h4><div class="adm-row"><label>Back <input id="admBack" type="number" min="1" max="7" value="${p.back}" style="width:64px"></label><label>Ahead <input id="admAhead" type="number" min="1" max="9" value="${p.ahead}" style="width:64px"></label>
      <button type="button" data-a="video">🎞 Video archive (5 back + 8 ahead)</button></div></div>
    <div class="adm-s"><h4>Competitions</h4><div class="adm-row"><button type="button" data-a="all">All</button><button type="button" data-a="none">None</button><button type="button" data-a="save">Save &amp; reload</button></div>
      <div class="adm-grid">${known.sort((a, b) => b.w - a.w).map(l => `<label><input type="checkbox" data-lg="${esc(l.id)}"${p.off.includes(l.id) ? '' : ' checked'}> ${esc(l.n)} ${stat(l.id)}</label>`).join('') || '<span class="adm-mut">Press “Check competitions” once.</span>'}</div></div>`;
  }
  function tabSetup() {
    return `<div class="adm-s"><h4>Admin token</h4><div class="adm-mut">The same value as <code>ADMIN_TOKEN</code> in the Cloudflare Worker. Stored only in this browser.</div>
      <input id="admTok" type="password" autocomplete="off" placeholder="paste token" value="${esc(LF.token())}" style="width:100%">
      <div class="adm-row"><button type="button" data-a="tok">💾 Save &amp; test</button><button type="button" data-a="tokdel">Remove</button></div><div id="admMsg" class="adm-mut">${esc(msg)}</div></div>
    <div class="adm-s"><h4>Admin mode</h4><div class="adm-mut">This button is visible only in browsers where you opened the site with <code>?admin=1</code>.</div><button type="button" data-a="off">Disable admin mode in this browser</button></div>`;
  }
  function render() {
    const TB = [['comment', '💬 Commentary'], ['stream', '📡 Stream'], ['data', '🗂 Data'], ['setup', '🔐 Setup']];
    dr.innerHTML = `<div class="adm-h"><span>🎛 STREAM / SITE CONTROL</span><button type="button" data-a="close">✕</button></div><div class="adm-tabs">${TB.map(([k, n]) => `<button type="button" class="${tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>${{ comment: tabComment, stream: tabStream, data: tabData, setup: tabSetup }[tab]()}`;
  }
  async function loadNotes() { if (!cm.id) return; const j = await LF.notes(cm.id); cm.notes = j.notes || []; cm.pin = j.pin || ''; if (!dr.hidden && tab === 'comment') render(); }
  async function loadLeagues() { try { const h = await LF.health(); leagues = h.leagues || []; status = h.lastStatus || {}; } catch (e) { status = {}; msg = String(e.message).slice(0, 80); } }

  async function publish(text, pin, noTrForce) {
    const m = LF.get(cm.id);
    if (!m) { cm.msg = 'Select a match first.'; return render(); }
    if (!LF.token()) { cm.msg = '⚠ Enter the admin token in the Setup tab.'; return render(); }
    const noTr = !!noTrForce || !!($('admNoTr') && $('admNoTr').checked);
    cm.msg = 'Publishing…'; const el = $('admCmMsg'); if (el) el.textContent = cm.msg;
    try {
      const j = await LF.postNote('/api/note', { id: m.id, text, pin: !!pin, noTr, t: m.s === 'in' ? m.c : m.s === 'ht' ? 'HT' : '' });
      cm.notes = j.notes || []; cm.pin = j.pin || ''; cm.msg = '✅ Published: ' + (j.en || text);
      window.LF_APP.refreshNotes(m.id);
      render(); if ($('admTx')) $('admTx').value = '';
      return;
    } catch (e) { cm.msg = '❌ ' + e.message; }
    const keep = $('admTx') ? $('admTx').value : '';
    render(); if ($('admTx')) $('admTx').value = keep;
  }

  dr.addEventListener('keydown', e => { if (e.target.id === 'admTx' && e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); const t = e.target.value.trim(); if (t) publish(t, false); } });
  dr.addEventListener('change', e => { if (e.target.id === 'admCm') { cm.id = e.target.value; cm.msg = ''; loadNotes(); } });
  dr.addEventListener('click', async e => {
    const el = e.target.closest('button'); if (!el) return;
    const d = el.dataset;
    if (d.tab) { tab = d.tab; msg = ''; render(); if (tab === 'data' && !leagues.length) { await loadLeagues(); render(); } if (tab === 'comment') loadNotes(); return; }
    if (d.q) { if (e.shiftKey) { $('admTx').value += d.q + ' '; $('admTx').focus(); } else await publish(d.q, false, true); return; }
    if (d.del) { try { const j = await LF.postNote('/api/note/del', { id: cm.id, nid: d.del }); cm.notes = j.notes || []; cm.pin = j.pin || ''; window.LF_APP.refreshNotes(cm.id); } catch (er) { cm.msg = '❌ ' + er.message; } render(); return; }
    const a = d.a; if (!a) return;
    if (a === 'close') dr.hidden = true;
    else if (a === 'send') { const t = $('admTx').value.trim(); if (t) publish(t, false); }
    else if (a === 'pin') { const t = $('admTx').value.trim(); if (t) publish(t, true); }
    else if (a === 'clear') { if (confirm('Delete ALL published commentary for this match?')) { try { const j = await LF.postNote('/api/note/clear', { id: cm.id }); cm.notes = j.notes || []; cm.pin = ''; window.LF_APP.refreshNotes(cm.id); cm.msg = 'Cleared.'; } catch (er) { cm.msg = '❌ ' + er.message; } render(); } }
    else if (a === 'apply') { window.LF_APP.setHero($('admHero').value || null); msg = 'Applied.'; render(); }
    else if (a === 'copy' || a === 'stream') {
      const v = $('admHero').value, url = base() + 'index.html?stream=1' + (v ? '&m=' + encodeURIComponent(v) : '');
      if (a === 'stream') window.open(url, '_blank', 'noopener'); else { try { await navigator.clipboard.writeText(url); msg = 'Copied: ' + url; } catch (_) { prompt('Stream URL:', url); } render(); }
    }
    else if (a === 'reload') { msg = 'Reloading…'; render(); await window.LF_APP.reload(); await loadLeagues(); render(); }
    else if (a === 'diag') { await loadLeagues(); render(); }
    else if (a === 'all' || a === 'none') dr.querySelectorAll('input[data-lg]').forEach(c => { c.checked = a === 'all'; });
    else if (a === 'video') { $('admBack').value = 5; $('admAhead').value = 8; }
    else if (a === 'save') { LF.setPrefs({ off: [...dr.querySelectorAll('input[data-lg]')].filter(c => !c.checked).map(c => c.dataset.lg), ahead: $('admAhead').value, back: $('admBack').value }); msg = 'Saved. Reloading…'; render(); await window.LF_APP.reload(); render(); }
    else if (a === 'tok') {
      LF.setToken($('admTok').value.trim()); msg = 'Testing…'; render();
      try { await LF.postNote('/api/note', { id: 'x:0', text: 'test' }); msg = '✅ Token accepted'; } catch (er) { msg = /Bad match id/i.test(er.message) ? '✅ Token accepted' : '❌ ' + er.message; }
      render();
    }
    else if (a === 'tokdel') { LF.setToken(''); msg = 'Token removed.'; render(); }
    else if (a === 'off') { try { localStorage.removeItem('lf_admin'); } catch (_) {} location.search = '?admin=0'; }
  });
})();
