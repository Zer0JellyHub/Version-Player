// ==UserScript==
// @name         Jellyfin Medien-Versionen (Filme & Serien)
// @match        *://*/web/*
// @match        *://*/web/index.html*
// @grant        none
// @inject-into  page
// @run-at       document-idle
// ==/UserScript==

(function(){
'use strict';

if (window.__vsfCombinedLoaded) return;
window.__vsfCombinedLoaded = true;

const style = document.createElement('style');
style.textContent = `
  #vsf-popup {
    position: fixed;
    bottom: 90px;
    right: 20px;
    width: 320px;
    background: #1e1e1e;
    border: 1px solid #444;
    border-radius: 12px;
    z-index: 999999;
    box-shadow: 0 16px 60px rgba(0,0,0,.95);
    overflow: hidden;
    display: none;
    flex-direction: column;
    font-family: inherit;
  }
  #vsf-popup.open { display: flex; }
  #vsf-popup .hdr {
    padding: 12px 16px;
    background: rgba(0,164,220,.1);
    border-bottom: 1px solid #444;
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #00a4dc;
  }
  #vsf-popup .list { max-height: 280px; overflow-y: auto; padding: 6px; }
  #vsf-popup .item {
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    border: 1px solid transparent;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    color: #fff;
    transition: background .15s;
  }
  #vsf-popup .item:hover { background: rgba(255,255,255,.07); }
  #vsf-popup .item.active {
    background: rgba(0,164,220,.15);
    border-color: rgba(0,164,220,.4);
  }
  #vsf-popup .item.active .iname { color: #00a4dc; }
  #vsf-popup .iname { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
  #vsf-popup .imeta { font-size: 10px; color: #888; }
  #vsf-popup .chk {
    width: 18px; height: 18px; border-radius: 50%;
    background: #00dc7d; display: flex; align-items: center;
    justify-content: center; font-size: 10px; flex-shrink: 0;
  }
  #vsf-popup .unchk {
    width: 18px; height: 18px; border-radius: 50%;
    border: 1.5px solid #555; flex-shrink: 0;
  }
  #vsf-toast {
    position: fixed; bottom: 140px; left: 50%;
    transform: translateX(-50%) translateY(10px);
    background: rgba(0,0,0,.92);
    border: 1px solid rgba(0,220,125,.45);
    color: #00dc7d;
    padding: 9px 18px; border-radius: 8px;
    font-size: 12px; font-weight: 700;
    z-index: 999999; opacity: 0;
    pointer-events: none;
    transition: all .3s ease;
    white-space: nowrap;
  }
  #vsf-toast.show {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
  #vsf-btn svg { width: 1.35em; height: 1.35em; fill: currentColor; }
`;
document.head.appendChild(style);

function toast(m){
  let t = document.getElementById('vsf-toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'vsf-toast';
    document.body.appendChild(t);
  }
  clearTimeout(t._t);
  t.textContent = m;
  t.classList.add('show');
  t._t = setTimeout(() => t.classList.remove('show'), 2500);
}

function api(){
  return window.ApiClient || window.parent?.ApiClient || null;
}

function isPlaybackManager(obj){
  return !!(obj && typeof obj.play === 'function' && typeof obj.getCurrentPlayer === 'function');
}

function hookPlaybackManager(){
  const Ev = window.Events;
  if(Ev && !Ev.__vsfHooked && typeof Ev.trigger === 'function'){
    Ev.__vsfHooked = true;
    const orig = Ev.trigger.bind(Ev);
    Ev.trigger = function(obj, type, args){
      if(isPlaybackManager(obj)) window.__vsfPM = obj;
      return orig(obj, type, args);
    };
  }

  const req = window.require;
  if(typeof req === 'function' && !window.__vsfPM){
    try{
      req(['playbackManager'], pm => {
        const inst = pm?.playbackManager || pm;
        if(isPlaybackManager(inst)) window.__vsfPM = inst;
      });
    }catch(e){}
  }
}

function getPlaybackManager(){
  hookPlaybackManager();
  if(isPlaybackManager(window.__vsfPM)) return window.__vsfPM;
  if(isPlaybackManager(window.playbackManager)) return window.playbackManager;
  return null;
}

function waitForPlaybackManager(ms){
  return new Promise(resolve => {
    const found = getPlaybackManager();
    if(found) return resolve(found);
    const start = Date.now();
    const i = setInterval(() => {
      const pm = getPlaybackManager();
      if(pm || Date.now() - start > ms){
        clearInterval(i);
        resolve(pm);
      }
    }, 150);
  });
}

function getItemId(){
  const v = document.querySelector('video');
  if(v && v.src){
    const m = v.src.match(/\/Videos\/([a-zA-Z0-9_-]+)\//i) || v.src.match(/[\/&]id=([a-zA-Z0-9_-]+)/i);
    if(m && m[1] && m[1] !== 'stream'){
      localStorage.setItem('vsf_last_item_id', m[1]);
      return m[1];
    }
  }
  const full = location.href + location.hash;
  const match = full.match(/[?&\/]id[=\/]([a-zA-Z0-9_-]+)/i);
  if(match && match[1]){
    localStorage.setItem('vsf_last_item_id', match[1]);
    return match[1];
  }
  const domEl = document.querySelector('[data-item-id]');
  if(domEl){
    const val = domEl.getAttribute('data-item-id');
    if(val){
      localStorage.setItem('vsf_last_item_id', val);
      return val;
    }
  }
  return localStorage.getItem('vsf_last_item_id');
}

function getActiveMsId(){
  const v = document.querySelector('video');
  if(!v || !v.src) return null;
  const m = v.src.match(/mediaSourceId=([a-zA-Z0-9_-]+)/i) || v.src.match(/\/([a-zA-Z0-9_-]+)\/stream/i);
  return m ? m[1] : null;
}

function verName(s, i, isMovie){
  if(isMovie){
    let r = (s.Name || '').trim().replace(/\btt\d{5,}\b/gi, '').replace(/\s{2,}/g, ' ').trim();
    if(r && !/^\d+$/.test(r)) return r;
    if(s.Path){
      const f = s.Path.split(/[/\\]/).pop().replace(/\.[^.]+$/, '').replace(/\btt\d{5,}\b/gi, '').trim();
      const p = f.split(' - ');
      return p.length > 1 ? p[p.length - 1].trim() : f;
    }
  } else {
    if(s.Path){
      const parts = s.Path.replace(/\\/g, '/').split('/').filter(Boolean);
      if(parts.length >= 2){
        return parts[parts.length - 2];
      }
    }
  }
  return 'Version ' + (i + 1);
}

async function getPlaybackInfo(id, extra, bodyExtra){
  const c = api();
  if(!c) throw new Error('ApiClient fehlt');
  const u = c.getCurrentUserId();
  const opts = {
    UserId: u,
    EnableDirectStream: true,
    EnableDirectPlay: true,
    ...(bodyExtra || {})
  };

  if(typeof c.getPlaybackInfo === 'function'){
    return c.getPlaybackInfo(id, { ...opts, ...(extra || {}) });
  }

  const qs = new URLSearchParams({ userId: u, ...(extra || {}) });
  const url = `${c.serverAddress() || ''}/Items/${id}/PlaybackInfo?${qs}`;
  const req = {
    type: 'POST',
    url,
    data: JSON.stringify(opts),
    contentType: 'application/json',
    dataType: 'json'
  };

  if(typeof c.ajax === 'function') return c.ajax(req);
  if(typeof c.fetch === 'function') return c.fetch(req);
  throw new Error('Kein ApiClient.ajax');
}

async function getItemType(id){
  if(!id) return null;
  try {
    const c = api();
    if(!c) return null;
    const item = await c.getItem(c.getCurrentUserId(), id);
    return item ? item.Type : null;
  } catch(e) {
    return null;
  }
}

async function switchVersion(msId){
  document.getElementById('vsf-popup')?.classList.remove('open');
  const vid = document.querySelector('video');
  const ticks = vid ? vid.currentTime : 0;
  const id = getItemId();
  const c = api();

  if(!id || !c){ toast('⚠ ID oder ApiClient fehlt'); return; }

  try{
    const info = await getPlaybackInfo(id, { mediaSourceId: msId }, { MediaSourceId: msId });
    const src = info.MediaSources?.find(s => s.Id === msId) || info.MediaSources?.[0];
    if(!src){ toast('⚠ Version nicht gefunden'); return; }

    const itemType = await getItemType(id);

    if(itemType === 'Movie'){
      const item = await c.getItem(c.getCurrentUserId(), id);
      const pm = await waitForPlaybackManager(5000);
      if(!pm){
        toast('⚠ Player nicht bereit – einmal Pause/Play, dann erneut wechseln');
        return;
      }
      await pm.play({
        items: [item],
        mediaSourceId: src.Id,
        startPositionTicks: Math.floor(ticks * 10000000),
        fullscreen: true
      });
    } else {
      // Serien / Episoden (Direkte URL-Ersetzung wie im ursprünglichen Serien-Skript)
      if(!vid){ toast('⚠ Kein Video-Element gefunden'); return; }
      const base = c.serverAddress() || '';
      const tok = c.accessToken();
      const url = src.SupportsDirectStream ? 
        `${base}/Videos/${id}/stream.${src.Container || 'mp4'}?MediaSourceId=${msId}&Static=true&api_key=${tok}` : 
        src.TranscodingUrl ? base + src.TranscodingUrl : 
        `${base}/Videos/${id}/stream?MediaSourceId=${msId}&api_key=${tok}`;
        
      vid.src = url;
      vid.load();
      
      const onReady = () => {
        vid.currentTime = ticks;
        vid.play().catch(function(){});
        vid.removeEventListener('loadedmetadata', onReady);
      };
      vid.addEventListener('loadedmetadata', onReady);
    }
    toast('✓ Version gewechselt');
  }catch(e){
    console.error('[vsf] switch failed', e);
    toast('⚠ ' + (e.message || 'Fehler beim Wechsel'));
  }
}

async function openPopup(){
  const pp = document.getElementById('vsf-popup');
  if(pp?.classList.contains('open')){
    pp.classList.remove('open');
    clearTimeout(pp._autoClose);
    return;
  }
  hookPlaybackManager();
  const id = getItemId();
  if(!id){ toast('⚠ Kein Video gefunden'); return; }
  if(!api()){ toast('⚠ ApiClient nicht verfügbar'); return; }

  let sources = [];
  try{
    const info = await getPlaybackInfo(id);
    sources = info.MediaSources || [];
  }catch(e){}

  if(!sources.length){
    try{
      const c = api();
      const item = await c.getItem(c.getCurrentUserId(), id);
      if(item && item.MediaSources) sources = item.MediaSources;
    }catch(err){}
  }

  if(!sources.length){ toast('⚠ Keine Versionen gefunden'); return; }
  if(sources.length === 1){ toast('ℹ Nur eine Version verfügbar'); return; }

  const itemType = await getItemType(id);
  const isMovie = (itemType === 'Movie');
  const activeId = getActiveMsId() || sources[0].Id;

  let p = document.getElementById('vsf-popup');
  if(!p){
    p = document.createElement('div');
    p.id = 'vsf-popup';
    document.body.appendChild(p);
    document.addEventListener('click', e => {
      const b = document.getElementById('vsf-btn');
      if(!p.contains(e.target) && (!b || !b.contains(e.target))){
        p.classList.remove('open');
        clearTimeout(p._autoClose);
      }
    });
  }

  const titleText = isMovie ? '🎬 Film-Versionen' : '📺 Serien-Versionen';
  p.innerHTML = `<div class="hdr">${titleText} <span style="opacity:.5;font-weight:400;letter-spacing:0;margin-left:6px">${sources.length} verfügbar</span></div>` +
    '<div class="list">' + sources.map((s, i) => {
      const a = s.Id === activeId;
      const streams = s.MediaStreams || [];
      let height = '';
      for(let j = 0; j < streams.length; j++){
        if(streams[j].Type === 'Video' && streams[j].Height){ height = streams[j].Height + 'p'; break; }
      }
      const sizeStr = s.Size ? (s.Size / 1073741824).toFixed(1) + ' GB' : '';
      const meta = [height, sizeStr].filter(Boolean).join(' · ');

      return `<div class="item${a ? ' active' : ''}" data-ms="${s.Id}">` +
        `<div style="min-width:0"><div class="iname">${verName(s, i, isMovie)}</div>${meta ? `<div class="imeta">${meta}</div>` : ''}</div>` +
        (a ? '<div class="chk">✓</div>' : '<div class="unchk"></div>') +
      '</div>';
    }).join('') + '</div>';

  p.querySelectorAll('.item').forEach(el => {
    el.addEventListener('click', () => switchVersion(el.getAttribute('data-ms')));
  });

  p.classList.add('open');
  clearTimeout(p._autoClose);
  p._autoClose = setTimeout(() => p.classList.remove('open'), 8000);
}

let _btn = null;

function getOrCreateBtn(){
  if(!_btn){
    _btn = document.createElement('button');
    _btn.id = 'vsf-btn';
    _btn.setAttribute('is', 'paper-icon-button-light');
    _btn.className = 'autoSize paper-icon-button-light';
    _btn.title = 'Version wählen';
    _btn.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8 12.5v-9l6 4.5-6 4.5z"/></svg>`;
    _btn.addEventListener('click', e => {
      e.stopPropagation();
      openPopup();
    });
  }
  return _btn;
}

let _lastCheckedId = null;
let _hasMultipleSourcesCache = false;

async function tryInject(){
  hookPlaybackManager();
  const controls = document.querySelector('.buttons.focuscontainer-x') || document.querySelector('[data-type="video-osd"]:not(.hide) .buttons');
  const video = document.querySelector('video');

  if(!controls || !video){
    if(_btn && _btn.parentNode) _btn.parentNode.removeChild(_btn);
    return;
  }

  const id = getItemId();
  if(!id){
    if(_btn && _btn.parentNode) _btn.parentNode.removeChild(_btn);
    return;
  }

  // Optional optimierte Caching-Abfrage, damit der Button nur erscheint, wenn wirklich mehrere Versionen da sind
  if(id !== _lastCheckedId){
    _lastCheckedId = id;
    try {
      const info = await getPlaybackInfo(id);
      const sources = info.MediaSources || [];
      _hasMultipleSourcesCache = sources.length > 1;
    } catch(e) {
      _hasMultipleSourcesCache = true; // Fallback im Fehlerfall anzeigen
    }
  }

  if(!_hasMultipleSourcesCache){
    if(_btn && _btn.parentNode) _btn.parentNode.removeChild(_btn);
    return;
  }

  if(_btn && _btn.parentNode === controls) return;
  const btn = getOrCreateBtn();
  const cc = controls.querySelector('.btnSubtitles');
  if(cc) cc.before(btn);
  else controls.appendChild(btn);
}

setInterval(tryInject, 500);
window.addEventListener('hashchange', tryInject);
hookPlaybackManager();

let _mmT = 0;
document.addEventListener('mousemove', () => {
  const now = Date.now();
  if(now - _mmT < 2000) return;
  _mmT = now;
  tryInject();
}, {passive: true});

let _moT = null;
new MutationObserver(() => {
  clearTimeout(_moT);
  _moT = setTimeout(tryInject, 300);
}).observe(document.body, {childList: true, subtree: true});

})();
