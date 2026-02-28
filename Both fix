/* ================================================================
   Jellyfin Version Selector v3.1 – UNIFIED (Filme + Serien)

   FIXES in dieser Version:
   ✓ Ein Script für beide Typen → kein Race Condition mehr
   ✓ ID-Leakage: Film-ID wird nicht mehr bei Serien-Seiten verwendet
   ✓ IMDB-IDs (tt31050594) werden aus dem Versionsnamen gefiltert
   ✓ Aktive Version nach Wechsel sofort korrekt markiert (kein URL-Lag)
   ✓ Button-Injektion in Browser + Jellyfin-App (WebView)
   ✓ Film-Button erscheint nicht mehr bei Serien (und umgekehrt)
   ✓ Episoden: Button erscheint auch wenn URL gleich bleibt
   ✓ Episoden: Erkennt Episodenwechsel über Video-src-Änderung
   ================================================================ */
(function () {
  'use strict';

  const CSS = `
    #vsf-popup {
      position: fixed; bottom: 90px; right: 20px; width: 320px;
      background: #1e1e1e; border: 1px solid #444; border-radius: 12px;
      z-index: 999999; box-shadow: 0 16px 60px rgba(0,0,0,0.95);
      overflow: hidden; display: none; flex-direction: column;
    }
    #vsf-popup.open { display: flex; }
    #vsf-popup .hdr {
      padding: 12px 16px; background: rgba(0,164,220,0.1);
      border-bottom: 1px solid #444; font-size: 11px; font-weight: 800;
      letter-spacing: 1.5px; text-transform: uppercase; color: #00a4dc;
    }
    #vsf-popup .list { max-height: 300px; overflow-y: auto; padding: 6px; }
    #vsf-popup .item {
      padding: 10px 12px; border-radius: 8px; cursor: pointer;
      border: 1px solid transparent; display: flex; align-items: center;
      justify-content: space-between; gap: 8px; color: #fff; transition: background 0.15s;
    }
    #vsf-popup .item:hover { background: rgba(255,255,255,0.07); }
    #vsf-popup .item.active { background: rgba(0,164,220,0.15); border-color: rgba(0,164,220,0.4); }
    #vsf-popup .item.active .iname { color: #00a4dc; }
    #vsf-popup .iname {
      font-size: 13px; font-weight: 600; margin-bottom: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    #vsf-popup .imeta { font-size: 10px; color: #888; }
    #vsf-popup .chk {
      width: 20px; height: 20px; border-radius: 50%; background: #00dc7d;
      display: flex; align-items: center; justify-content: center;
      font-size: 11px; flex-shrink: 0;
    }
    #vsf-popup .unchk {
      width: 20px; height: 20px; border-radius: 50%;
      border: 1.5px solid #555; flex-shrink: 0;
    }
    #vsf-popup .ftr {
      padding: 8px 16px; border-top: 1px solid #444;
      font-size: 10px; color: #666; text-align: center;
    }
    #vsf-toast {
      position: fixed; bottom: 140px; left: 50%;
      transform: translateX(-50%) translateY(10px);
      background: rgba(0,0,0,0.92); border: 1px solid rgba(0,220,125,0.45);
      color: #00dc7d; padding: 9px 18px; border-radius: 8px;
      font-size: 12px; font-weight: 700; z-index: 999999;
      opacity: 0; pointer-events: none; transition: all 0.3s ease; white-space: nowrap;
    }
    #vsf-toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  `;
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: CSS }));

  // ── Toast ──────────────────────────────────────────────────────────────────
  function toast(msg) {
    let t = document.getElementById('vsf-toast');
    if (!t) { t = document.createElement('div'); t.id = 'vsf-toast'; document.body.appendChild(t); }
    clearTimeout(t._t);
    t.textContent = msg; t.classList.add('show');
    t._t = setTimeout(() => t.classList.remove('show'), 2500);
  }

  // ── State ──────────────────────────────────────────────────────────────────
  let _pendingMs    = null;
  let _pendingTicks = 0;
  let _lastChosenMsId = null; // Sofort-Cache nach Versionswechsel
  let _lastSeenItemId = null; // Zuletzt gesehene Item-ID – Episodenwechsel erkennen

  // ── Item-ID aus der aktuellen Seite lesen ──────────────────────────────────
  // Nie aus Cache – immer frisch aus URL oder Video-src
  function getCurrentItemId() {
    // 1. Laufendes Video (zuverlässigste Quelle)
    const vid = document.querySelector('video');
    if (vid && vid.src) {
      const m = vid.src.match(/\/Videos\/([a-f0-9]{20,})\//i);
      if (m) return m[1];
    }
    // 2. URL-Hash / Query
    const hashMatch = (location.hash + location.search).match(/[?&]id=([a-f0-9]{20,})/i);
    if (hashMatch) return hashMatch[1];
    return null;
  }

  // ── Aktive MediaSource-ID ermitteln ────────────────────────────────────────
  function getActiveMsId(sources) {
    // Sofort-Cache hat Vorrang – Video-URL hinkt nach selectSource-Wechsel nach
    if (_lastChosenMsId && sources.find(s => s.Id === _lastChosenMsId)) {
      return _lastChosenMsId;
    }
    const vid = document.querySelector('video');
    if (vid && vid.src) {
      const m = vid.src.match(/[Mm]edia[Ss]ource[Ii]d=([a-f0-9]{20,})/);
      if (m) return m[1];
      for (const s of sources) if (vid.src.includes(s.Id)) return s.Id;
    }
    return sources[0]?.Id;
  }

  // ── Versionsname bereinigen ────────────────────────────────────────────────
  // Filtert: IMDB-IDs (tt31050594), reine Zahlen, interne Hex-IDs
  function versionName(src, i) {
    const raw = (src.Name || '').trim();
    const useless = !raw
      || /^\d+$/.test(raw)
      || /^tt\d{5,}$/i.test(raw)
      || /^[a-f0-9]{20,}$/i.test(raw);

    if (!useless) return raw;

    if (src.Path) {
      const filename = src.Path.split(/[/\\]/).pop().replace(/\.[^.]+$/, '');
      const parts = filename.split(' - ');
      if (parts.length > 1) return parts[parts.length - 1].trim();
      return filename;
    }
    return 'Version ' + (i + 1);
  }

  // ── DOM-Element abwarten ───────────────────────────────────────────────────
  function waitFor(sel, ms = 6000) {
    return new Promise((res, rej) => {
      const el = document.querySelector(sel);
      if (el) return res(el);
      const ob = new MutationObserver(() => {
        const found = document.querySelector(sel);
        if (found) { ob.disconnect(); res(found); }
      });
      ob.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { ob.disconnect(); rej(new Error('timeout: ' + sel)); }, ms);
    });
  }

  // ── Autoplay nach Hash-Navigation ─────────────────────────────────────────
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
          if (v && v.readyState >= 2 && v.duration >= target) {
            v.currentTime = target; clearInterval(iv);
          }
          if (++n > 40) clearInterval(iv);
        }, 500);
      }
    } catch(e) {}
  }

  window.addEventListener('hashchange', () => {
    _lastChosenMsId = null;
    setTimeout(tryAutoPlay, 200);
  });

  // ── Popup öffnen ───────────────────────────────────────────────────────────
  async function openPopup() {
    const pp = document.getElementById('vsf-popup');
    if (pp?.classList.contains('open')) { pp.classList.remove('open'); return; }

    const id = getCurrentItemId();
    if (!id) { toast('⚠ Kein Titel erkannt'); return; }

    let item;
    try { item = await ApiClient.getItem(ApiClient.getCurrentUserId(), id); } catch(e) { return; }

    const isMovie   = item.Type === 'Movie';
    const isEpisode = item.Type === 'Episode';
    if (!isMovie && !isEpisode) return;

    const sources = item.MediaSources || [];
    if (sources.length <= 1) { toast('ℹ Nur eine Version verfügbar'); return; }

    const activeId = getActiveMsId(sources);
    const icon = isMovie ? '🎬' : '📺';

    let p = document.getElementById('vsf-popup');
    if (!p) {
      p = document.createElement('div'); p.id = 'vsf-popup'; document.body.appendChild(p);
      document.addEventListener('click', e => {
        const b = document.getElementById('vsf-btn');
        if (!p.contains(e.target) && !b?.contains(e.target)) p.classList.remove('open');
      });
    }

    p.innerHTML = `
      <div class="hdr">${icon} Versionen
        <span style="opacity:0.5;font-weight:400;letter-spacing:0;margin-left:6px">
          ${sources.length} verfügbar
        </span>
      </div>
      <div class="list">
        ${sources.map((s, i) => {
          const active = s.Id === activeId;
          const vs = (s.MediaStreams || []).find(x => x.Type === 'Video');
          const meta = [
            vs?.Height ? vs.Height + 'p' : '',
            (vs?.VideoCodec || vs?.Codec || '').toUpperCase(),
            s.Size ? (s.Size / 1073741824).toFixed(1) + ' GB' : ''
          ].filter(Boolean).join(' · ');
          return `
            <div class="item${active ? ' active' : ''}" data-ms="${s.Id}" data-id="${item.Id}">
              <div style="min-width:0">
                <div class="iname">${versionName(s, i)}</div>
                ${meta ? `<div class="imeta">${meta}</div>` : ''}
              </div>
              ${active ? '<div class="chk">✓</div>' : '<div class="unchk"></div>'}
            </div>`;
        }).join('')}
      </div>
      <div class="ftr">▶ Startet an gleicher Position</div>`;

    p.querySelectorAll('.item').forEach(el => {
      el.addEventListener('click', () => {
        const msId = el.dataset.ms, iId = el.dataset.id;
        if (msId === activeId) { p.classList.remove('open'); return; }
        p.classList.remove('open');
        _lastChosenMsId = msId;

        const sel = document.querySelector('select.selectSource');
        if (sel && [...sel.options].find(o => o.value === msId)) {
          sel.value = msId;
          sel.dispatchEvent(new Event('change', { bubbles: true }));
          setTimeout(() => document.querySelector('button.btnPlay')?.click(), 400);
          toast('✓ Version gewechselt');
          return;
        }

        const vid = document.querySelector('video');
        _pendingTicks = vid ? Math.floor(vid.currentTime * 10000000) : 0;
        _pendingMs = msId;
        toast('⏳ Wechsle Version...');
        location.replace(location.href.split('#')[0] + '#/details?id=' + iId);
      });
    });

    p.classList.add('open');
  }

  // ── Button erstellen ───────────────────────────────────────────────────────
  function makeButton() {
    const btn = document.createElement('button');
    btn.id = 'vsf-btn';
    btn.setAttribute('is', 'paper-icon-button-light');
    btn.className = 'autoSize paper-icon-button-light';
    btn.title = 'Version wählen';
    btn.innerHTML = `<span class="material-icons" style="font-size:1.4em;vertical-align:middle">video_library</span>`;
    btn.style.cssText = 'position:relative;';
    btn.addEventListener('click', e => { e.stopPropagation(); openPopup(); });
    return btn;
  }

  // ── Button-Container suchen ────────────────────────────────────────────────
  // Mehrere Selektoren für Browser-UI und Jellyfin-App-WebView
  function findButtonContainer() {
    return (
      document.querySelector('.buttons.focuscontainer-x')   ||
      document.querySelector('.detailPageContent .buttons')  ||
      document.querySelector('.detailRibbon .buttons')       ||
      document.querySelector('[data-role="page"] .buttons')  ||
      document.querySelector('.itemDetailPage .buttons')
    );
  }

  // ── Button entfernen und State zurücksetzen ────────────────────────────────
  function resetButton() {
    document.getElementById('vsf-btn')?.remove();
    _injecting = false;
    _lastChosenMsId = null;
    _lastSeenItemId = null;
  }

  // ── Injection ─────────────────────────────────────────────────────────────
  let _lastUrl   = '';
  let _injecting = false;

  function tryInject() {
    const url = location.href;

    // URL-Wechsel → immer neu starten
    if (url !== _lastUrl) {
      _lastUrl = url;
      resetButton();
    }

    // FIX für Episoden: Auch wenn die URL gleich bleibt, kann sich
    // die angezeigte Episode durch Klick in der Episodenliste ändern.
    // Wir erkennen das daran dass sich die Item-ID im DOM geändert hat.
    const currentId = getCurrentItemId();
    if (currentId && currentId !== _lastSeenItemId) {
      // ID hat sich geändert (neue Episode gewählt ohne URL-Wechsel)
      document.getElementById('vsf-btn')?.remove();
      _injecting = false;
      _lastChosenMsId = null;
      _lastSeenItemId = currentId;
    }

    // Schon injiziert oder läuft gerade
    if (document.getElementById('vsf-btn') || _injecting) return;

    const container = findButtonContainer();
    if (!container) return;

    const id = getCurrentItemId();
    if (!id) return;

    _injecting = true;
    _lastSeenItemId = id;

    ApiClient.getItem(ApiClient.getCurrentUserId(), id)
      .then(item => {
        const valid = item.Type === 'Movie' || item.Type === 'Episode';
        if (!valid) { _injecting = false; return; }
        if (!item.MediaSources || item.MediaSources.length <= 1) { _injecting = false; return; }

        // URL/ID könnte sich während des async Calls geändert haben
        if (location.href !== _lastUrl) { _injecting = false; return; }
        if (getCurrentItemId() !== id) { _injecting = false; return; }
        if (document.getElementById('vsf-btn')) { _injecting = false; return; }

        const c = findButtonContainer();
        if (!c) { _injecting = false; return; }

        const btn = makeButton();
        const heart = c.querySelector('.btnUserRating') || c.querySelector('.btnFavorite');
        if (heart) heart.after(btn);
        else c.appendChild(btn);

        _injecting = false;
      })
      .catch(() => { _injecting = false; });
  }

  // ── Interval + MutationObserver (Doppelabsicherung für Episoden) ───────────
  // Der Interval allein reicht nicht: Bei Episodenwechsel über die Episodenliste
  // (kein Hash-Wechsel, kein Video-src-Wechsel) ändert sich der DOM ohne URL-Änderung.
  // Der MutationObserver triggert tryInject wenn neue Buttons-Container auftauchen.
  setInterval(tryInject, 800);

  const domObserver = new MutationObserver(() => {
    // Nur reagieren wenn noch kein Button da ist
    if (!document.getElementById('vsf-btn')) {
      tryInject();
    }
  });
  domObserver.observe(document.body, { childList: true, subtree: true });

})();
