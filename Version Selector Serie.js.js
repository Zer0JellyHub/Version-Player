/* Jellyfin Version Selector - SERIEN/EPISODEN */
(function () {
  'use strict';

  const CSS = `
    #vsf-ep-popup {
      position: fixed; bottom: 90px; right: 20px; width: 320px;
      background: #1e1e1e; border: 1px solid #444; border-radius: 12px;
      z-index: 999999; box-shadow: 0 16px 60px rgba(0,0,0,0.95);
      overflow: hidden; display: none; flex-direction: column;
    }
    #vsf-ep-popup.open { display: flex; }
    #vsf-ep-popup .hdr { padding: 12px 16px; background: rgba(0,164,220,0.1); border-bottom: 1px solid #444; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: #00a4dc; }
    #vsf-ep-popup .list { max-height: 300px; overflow-y: auto; padding: 6px; }
    #vsf-ep-popup .item { padding: 10px 12px; border-radius: 8px; cursor: pointer; border: 1px solid transparent; display: flex; align-items: center; justify-content: space-between; gap: 8px; color: #fff; transition: background 0.15s; }
    #vsf-ep-popup .item:hover { background: rgba(255,255,255,0.07); }
    #vsf-ep-popup .item.active { background: rgba(0,164,220,0.15); border-color: rgba(0,164,220,0.4); }
    #vsf-ep-popup .item.active .iname { color: #00a4dc; }
    #vsf-ep-popup .iname { font-size: 13px; font-weight: 600; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    #vsf-ep-popup .imeta { font-size: 10px; color: #888; }
    #vsf-ep-popup .chk { width: 20px; height: 20px; border-radius: 50%; background: #00dc7d; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; }
    #vsf-ep-popup .unchk { width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid #555; flex-shrink: 0; }
    #vsf-ep-popup .ftr { padding: 8px 16px; border-top: 1px solid #444; font-size: 10px; color: #666; text-align: center; }
    #vsf-ep-toast { position: fixed; bottom: 140px; left: 50%; transform: translateX(-50%) translateY(10px); background: rgba(0,0,0,0.92); border: 1px solid rgba(0,220,125,0.45); color: #00dc7d; padding: 9px 18px; border-radius: 8px; font-size: 12px; font-weight: 700; z-index: 999999; opacity: 0; pointer-events: none; transition: all 0.3s ease; white-space: nowrap; }
    #vsf-ep-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  `;
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: CSS }));

  function toast(msg) {
    let t = document.getElementById('vsf-ep-toast');
    if (!t) { t = document.createElement('div'); t.id = 'vsf-ep-toast'; document.body.appendChild(t); }
    clearTimeout(t._t);
    t.textContent = msg; t.classList.add('show');
    t._t = setTimeout(() => t.classList.remove('show'), 2500);
  }

  let _itemId = null, _pendingMs = null, _pendingTicks = 0;

  function getItemId() {
    const vid = document.querySelector('video');
    if (vid && vid.src) {
      const m = vid.src.match(/[/]Videos[/]([a-f0-9]{20,})[/]/i);
      if (m) { _itemId = m[1]; return m[1]; }
    }
    const mu = (location.hash + location.search).match(/[?&]id=([a-f0-9]{20,})/i);
    if (mu) { _itemId = mu[1]; return mu[1]; }
    return _itemId;
  }

  function getActiveMsId(sources) {
    const vid = document.querySelector('video');
    if (vid && vid.src) {
      const m = vid.src.match(/[Mm]edia[Ss]ource[Ii]d=([a-f0-9]{20,})/);
      if (m) return m[1];
      for (const s of sources) if (vid.src.includes(s.Id)) return s.Id;
    }
    return sources[0]?.Id;
  }

  function versionName(src, i) {
    if (src.Name && !/^\d+$/.test(src.Name.trim())) return src.Name;
    if (src.Path) return src.Path.split(/[/\\]/).pop().replace(/\.[^.]+$/, '');
    return 'Version ' + (i + 1);
  }

  function waitFor(sel, ms = 6000) {
    return new Promise((res, rej) => {
      const el = document.querySelector(sel);
      if (el) return res(el);
      const ob = new MutationObserver(() => {
        const el = document.querySelector(sel);
        if (el) { ob.disconnect(); res(el); }
      });
      ob.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { ob.disconnect(); rej(); }, ms);
    });
  }

  async function tryAutoPlay() {
    if (!_pendingMs || !location.hash.includes('details')) return;
    const msId = _pendingMs, ticks = _pendingTicks;
    _pendingMs = null; _pendingTicks = 0;
    try {
      const sel = await waitFor('select.selectSource');
      await new Promise(r => setTimeout(r, 500));
      sel.value = msId;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 400));
      (await waitFor('button.btnPlay')).click();
      if (ticks > 0) {
        const target = ticks / 10000000;
        let n = 0;
        const iv = setInterval(() => {
          const v = document.querySelector('video');
          if (v && v.readyState >= 2 && v.duration >= target) { v.currentTime = target; clearInterval(iv); }
          if (++n > 40) clearInterval(iv);
        }, 500);
      }
    } catch(e) {}
  }

  window.addEventListener('hashchange', () => { getItemId(); setTimeout(tryAutoPlay, 200); });

  async function openPopup() {
    const pp = document.getElementById('vsf-ep-popup');
    if (pp?.classList.contains('open')) { pp.classList.remove('open'); return; }
    const id = getItemId();
    if (!id) return;
    let item;
    try { item = await ApiClient.getItem(ApiClient.getCurrentUserId(), id); } catch(e) { return; }
    if (item.Type !== 'Episode') return;
    const sources = item.MediaSources || [];
    if (sources.length <= 1) { toast('ℹ Nur eine Version'); return; }
    const activeId = getActiveMsId(sources);

    let p = document.getElementById('vsf-ep-popup');
    if (!p) {
      p = document.createElement('div'); p.id = 'vsf-ep-popup'; document.body.appendChild(p);
      document.addEventListener('click', e => {
        const b = document.getElementById('vsf-ep-btn');
        if (!p.contains(e.target) && !b?.contains(e.target)) p.classList.remove('open');
      });
    }
    p.innerHTML = `
      <div class="hdr">📺 Versionen <span style="opacity:0.5;font-weight:400;letter-spacing:0">${sources.length} verfügbar</span></div>
      <div class="list">${sources.map((s, i) => {
        const active = s.Id === activeId;
        const vs = (s.MediaStreams||[]).find(x => x.Type==='Video');
        const meta = [vs?.Height?vs.Height+'p':'', (vs?.VideoCodec||vs?.Codec||'').toUpperCase(), s.Size?(s.Size/1073741824).toFixed(1)+' GB':''].filter(Boolean).join(' · ');
        return `<div class="item${active?' active':''}" data-ms="${s.Id}" data-id="${item.Id}">
          <div style="min-width:0"><div class="iname">${versionName(s,i)}</div>${meta?`<div class="imeta">${meta}</div>`:''}</div>
          ${active?'<div class="chk">✓</div>':'<div class="unchk"></div>'}
        </div>`;
      }).join('')}</div>
      <div class="ftr">▶ Startet an gleicher Position</div>`;

    p.querySelectorAll('.item').forEach(el => {
      el.addEventListener('click', () => {
        const msId = el.dataset.ms, iId = el.dataset.id;
        if (msId === activeId) { p.classList.remove('open'); return; }
        p.classList.remove('open');
        const sel = document.querySelector('select.selectSource');
        if (sel && [...sel.options].find(o => o.value === msId)) {
          sel.value = msId; sel.dispatchEvent(new Event('change', { bubbles: true }));
          setTimeout(() => document.querySelector('button.btnPlay')?.click(), 400);
          return;
        }
        const vid = document.querySelector('video');
        _pendingTicks = vid ? Math.floor(vid.currentTime * 10000000) : 0;
        _pendingMs = msId; _itemId = iId;
        toast('⏳ Wechsle...');
        location.replace(location.href.split('#')[0] + '#/details?id=' + iId);
      });
    });
    p.classList.add('open');
  }

  // Jellyfin-nativer Button: gleiche Klassen wie andere Player-Buttons
  function makeButton(id) {
    const btn = document.createElement('button');
    btn.id = id;
    btn.setAttribute('is', 'paper-icon-button-light');
    btn.className = 'autoSize paper-icon-button-light';
    btn.title = 'Version wählen';
    btn.innerHTML = `<span class="material-icons" style="font-size:1.4em;vertical-align:middle">video_library</span>`;
    btn.style.cssText = 'position:relative;';
    return btn;
  }

  let _lastUrl = '', _btnReady = false;

  function tryInject() {
    const url = location.href;
    if (url !== _lastUrl) {
      _lastUrl = url; _btnReady = false;
      document.getElementById('vsf-ep-btn')?.remove();
      getItemId();
    }
    if (_btnReady || document.getElementById('vsf-ep-btn')) { _btnReady = true; return; }
    const c = document.querySelector('.buttons.focuscontainer-x');
    if (!c) return;
    const id = getItemId();
    if (!id) return;
    _btnReady = true;
    ApiClient.getItem(ApiClient.getCurrentUserId(), id).then(item => {
      if (item.Type !== 'Episode') return;
      if (!item.MediaSources || item.MediaSources.length <= 1) return;
      if (document.getElementById('vsf-ep-btn')) return;
      const c2 = document.querySelector('.buttons.focuscontainer-x');
      if (!c2) return;
      const btn = makeButton('vsf-ep-btn');
      btn.addEventListener('click', e => { e.stopPropagation(); openPopup(); });
      // Nach dem Herz-Button einfügen damit es natürlich aussieht
      const heart = c2.querySelector('.btnUserRating') || c2.querySelector('.btnFavorite');
      if (heart) heart.after(btn);
      else c2.insertBefore(btn, c2.firstChild);
    }).catch(() => { _btnReady = false; });
  }

  setInterval(tryInject, 800);
})();
