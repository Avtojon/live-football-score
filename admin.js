/* Admin / Site control. FAQAT ?admin=1 bilan bir marta ochilgan brauzerda yuklanadi.
   Himoya haqida: ?admin=1 faqat tugmani ko'rsatadi, XAVFSIZLIK emas. Haqiqiy himoya — Worker'dagi ADMIN_TOKEN:
   sharh va video yozish/o'chirish faqat token bilan ishlaydi (token kodda saqlanmaydi, faqat shu brauzerning localStorage'ida). */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const base = () => location.origin + location.pathname.replace(/[^/]*$/, '');
  const H = LF.h;
  let tab = 'video', cm = { id: '', notes: [], pin: '', msg: '' }, vm = { id: '', msg: '' }, leagues = [], status = {}, msg = '';

  const QK = [
    ['⚽ Goal', [['⚽ Gol', '⚽ GOAL! What a strike!'], ['🎯 Penalti', '🎯 Penalty awarded!'], ['🔥 Jamoaviy', '🔥 Brilliant team goal!'], ['😬 Avtogol', '😬 Own goal!']]],
    ['🧤 Keeper', [['🧤 Seyv', '🧤 Great save!'], ['🧱 Devor', '🧱 Solid as a wall! The keeper stands firm'], ['🚫 Penalti urdi', '🚫 Penalty saved!'], ['🥅 Shtanga', '🥅 Off the post!']]],
    ['🟨 Discipline', [['🟨 Sariq', '🟨 Yellow card'], ['🟥 Qizil', '🟥 RED CARD!'], ['📺 VAR', '📺 VAR check…'], ['🚑 Jarohat', '🚑 Injury stoppage']]],
    ['🔄 Game', [['🔄 Almashtirish', '🔄 Substitution'], ['🚩 Ofsayd', '🚩 Offside'], ['📐 Burchak', '📐 Corner kick'], ['😮 Xavfli', '😮 Big chance!'], ['⏸ Tanaffus', '⏸ Half-time'], ['🏁 Yakun', '🏁 Full-time']]]
  ];

  const btn = document.createElement('button'); btn.id = 'admBtn'; btn.type = 'button'; btn.textContent = '🎛 CONTROL';
  const dr = document.createElement('div'); dr.id = 'admDrawer'; dr.hidden = true;
  document.body.append(btn, dr);
  btn.onclick = () => {
    dr.hidden = !dr.hidden;
    if (!dr.hidden) {
      const h = window.LF_APP.hero();
      if (!cm.id && h) cm.id = h.id;
      if (!vm.id && h) vm.id = h.id;
      render();
      if (tab === 'comment') loadNotes();
    }
  };

  const options = (selected, withAuto, onlyFinishedFirst) => {
    const by = {};
    LF.all().filter(m => m.s !== 'pp').forEach(m => (by[m.lg] = by[m.lg] || []).push(m));
    const label = m => {
      const hasV = LF.videoFor(m.id) ? '▶ ' : '';
      const score = (m.s === 'pre' || m.s === 'pp') ? 'vs' : `${m.h.g}–${m.a.g}`;
      const st = m.s === 'in' ? '🔴 ' + esc(m.c) : m.s === 'ht' ? '🔴 HT' : m.s === 'post' ? '✔ FT' : esc(new Date(m.d).toLocaleString('en-GB', { weekday: 'short', hour: '2-digit', minute: '2-digit' }));
      return `${hasV}${st} · ${esc(m.h.n)} ${score} ${esc(m.a.n)}`;
    };
    return (withAuto ? '<option value="">Auto — biggest match</option>' : '') + Object.keys(by).sort((a, b) => H.lgInfo(b).w - H.lgInfo(a).w).map(lg =>
      `<optgroup label="${esc(H.lgInfo(lg).n)}">${by[lg].sort((a, b) => {
        if (onlyFinishedFirst && (a.s === 'post') !== (b.s === 'post')) return a.s === 'post' ? -1 : 1;
        return (H.isLive(b) - H.isLive(a)) || (H.T(b) - H.T(a));
      }).slice(0, 40).map(m => `<option value="${esc(m.id)}"${m.id === selected ? ' selected' : ''}>${label(m)}</option>`).join('')}</optgroup>`).join('');
  };

  function tabVideo() {
    if (!vm.id) { const h = window.LF_APP.hero(); vm.id = h ? h.id : (LF.all()[0] ? LF.all()[0].id : ''); }
    const curUrl = LF.videoFor(vm.id);
    const allVids = Object.entries(LF.store.videos || {});
    return `<div class="adm-s">
      <h4>🎬 Attach YouTube Video to Match</h4>
      <div class="adm-mut">Select a finished (✔ FT) or live match below and paste its YouTube highlight link. A green <b>▶</b> badge will immediately appear on that match!</div>
      <select id="admVidMatch">${options(vm.id, false, true)}</select>
      <input id="admVidUrl" type="url" placeholder="https://youtu.be/XXXXXXXXXXX or YouTube watch URL" value="${esc(curUrl)}" style="width:100%;padding:9px;border:1px solid #2c4b63;border-radius:9px;background:#0d2133;color:#fff">
      <div class="adm-row">
        <button type="button" data-a="vidsave">💾 Save Video</button>
        ${curUrl ? '<button type="button" data-a="viddel">🗑 Remove</button>' : ''}
        <button type="button" data-a="vidcopy">📋 Copy videos.json</button>
      </div>
      <div class="adm-mut">${esc(vm.msg || (LF.token() ? 'Saves to Worker & this browser.' : '💡 Tip: Set ADMIN_TOKEN in Setup tab to publish videos for all visitors, or click "Copy videos.json" to paste into GitHub.'))}</div>
    </div>
    <div class="adm-s">
      <h4>Linked Videos (${allVids.length})</h4>
      ${allVids.length ? allVids.map(([id, u]) => {
        const m = LF.get(id);
        const title = m ? `${m.h.n} ${m.s === 'pre' ? 'vs' : m.h.g + '–' + m.a.g} ${m.a.n}` : id;
        return `<div class="adm-note"><span><b>▶ ${esc(title)}</b><small>${esc(id)} · ${esc(u)}</small></span><button type="button" data-vdel="${esc(id)}">✕</button></div>`;
      }).join('') : '<div class="adm-mut">No videos attached yet.</div>'}
    </div>`;
  }

  function tabComment() {
    const m = LF.get(cm.id);
    return `<div class="adm-s"><h4>Live Pinned Note (shown in Timeline)</h4><select id="admCm">${options(cm.id, false, false)}</select>
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
    return `<div class="adm-s"><h4>Main scoreboard (this browser)</h4><select id="admHero">${options(sel, true, false)}</select>
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
    const TB = [['video', '🎬 Video'], ['comment', '💬 Notes'], ['stream', '📡 Stream'], ['data', '🗂 Data'], ['setup', '🔐 Setup']];
    dr.innerHTML = `<div class="adm-h"><span>🎛 STREAM / SITE CONTROL</span><button type="button" data-a="close">✕</button></div><div class="adm-tabs">${TB.map(([k, n]) => `<button type="button" class="${tab === k ? 'on' : ''}" data-tab="${k}">${n}</button>`).join('')}</div>${{ video: tabVideo, comment: tabComment, stream: tabStream, data: tabData, setup: tabSetup }[tab]()}`;
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
  dr.addEventListener('change', e => {
    if (e.target.id === 'admCm') { cm.id = e.target.value; cm.msg = ''; loadNotes(); }
    if (e.target.id === 'admVidMatch') { vm.id = e.target.value; vm.msg = ''; render(); }
  });
  dr.addEventListener('click', async e => {
    const el = e.target.closest('button'); if (!el) return;
    const d = el.dataset;
    if (d.tab) { tab = d.tab; msg = ''; render(); if (tab === 'data' && !leagues.length) { await loadLeagues(); render(); } if (tab === 'comment') loadNotes(); return; }
    if (d.q) { if (e.shiftKey) { $('admTx').value += d.q + ' '; $('admTx').focus(); } else await publish(d.q, false, true); return; }
    if (d.del) { try { const j = await LF.postNote('/api/note/del', { id: cm.id, nid: d.del }); cm.notes = j.notes || []; cm.pin = j.pin || ''; window.LF_APP.refreshNotes(cm.id); } catch (er) { cm.msg = '❌ ' + er.message; } render(); return; }
    if (d.vdel) {
      try { await LF.saveVideo(d.vdel, ''); vm.msg = 'Removed video for ' + d.vdel; } catch (er) { vm.msg = 'Removed locally · ' + er.message; }
      window.LF_APP.refresh(); render(); return;
    }
    const a = d.a; if (!a) return;
    if (a === 'close') dr.hidden = true;
    else if (a === 'vidsave') {
      const u = ($('admVidUrl') ? $('admVidUrl').value : '').trim();
      if (u && !H.ytId(u)) { vm.msg = '❌ Invalid YouTube link.'; render(); return; }
      vm.msg = 'Saving…'; render();
      try {
        const r = await LF.saveVideo(vm.id, u);
        vm.msg = r.localOnly ? '✅ Saved in browser! (Set ADMIN_TOKEN in Setup tab to save on Worker, or click Copy videos.json).' : '✅ Video published!';
      } catch (er) { vm.msg = '✅ Saved in browser · Worker: ' + er.message; }
      window.LF_APP.refresh(); render();
    }
    else if (a === 'viddel') {
      try { await LF.saveVideo(vm.id, ''); vm.msg = '🗑 Video removed.'; } catch (_) {}
      window.LF_APP.refresh(); render();
    }
    else if (a === 'vidcopy') {
      const txt = JSON.stringify(LF.store.videos || {}, null, 2);
      try { await navigator.clipboard.writeText(txt); vm.msg = '📋 Copied videos.json to clipboard! Paste it into videos.json in GitHub.'; } catch (_) { prompt('Copy videos.json:', txt); }
      render();
    }
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
