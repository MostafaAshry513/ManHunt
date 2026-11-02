/* ManHunt — MATCHDAY social film
   Deterministic virtual-clock renderer: window.renderAt(t) paints one frame.
   Real premium app captures only; all overlays are brand graphics (no fake UI).
   COPY STATUS: provisional — owner approval pending. */

(() => {
  'use strict';

  const $ = (id) => document.getElementById(String(id).replace(/^#/, ''));
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const inv = (a, b, t) => clamp01((t - a) / (b - a));
  const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);
  const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const lerp = (a, b, p) => a + (b - a) * p;

  /* ── copy (provisional; brand copy family v2) ─────────────────────────── */
  const COPY = {
    hookLines: ['YOUR FRIENDS', 'ARE HUNTING', 'YOU.'],
    homeHead: 'CREATE A HUNT.',
    homeSub: 'SEND THE CODE. HIDE.',
    lobbyHead: 'PICK A SIDE.',
    lobbySub: '5 / 5 READY · ROOM VMJYBU',
    huntHead: 'THE MAP HAS<br>YOUR LAST REPORT.',
    huntSub: 'LATEST REPORTS · © OpenStreetMap contributors',
    claimHead: 'TOUCH TO TAG.',
    claimSub: 'THE PREY CONFIRMS THE TAG · © OpenStreetMap contributors',
    chatHead: 'TALK WHILE<br>YOU MOVE.',
    chatSub: 'IN-GAME CHAT · CAPTURED MATCH',
    resultHead: 'HUNT OVER.',
    resultSub: 'FULL TIME · 18:48 PLAYED · PREY 0 / 2',
    endLines: ['HIDE FROM', 'YOUR FRIENDS.'],
    cta: 'Install free for Android',
    url: 'http://74.208.99.178/',
    micro: 'free APK · Android 8+ · not on Play Store',
    trust: 'Play with people you trust.'
  };
  window.MH_COPY = COPY;

  /* ── timelines (fps mirrored in tools/capture.mjs) ────────────────────── */
  const TIMELINES = {
    reel15: {
      id: 'reel15', fps: 30, duration: 15.0, strip: true,
      beats: [
        { id: 'hook', start: 0.00, dur: 1.40 },
        { id: 'home', start: 1.40, dur: 2.90 },
        { id: 'lobby', start: 4.30, dur: 3.30 },
        { id: 'hunt', start: 7.60, dur: 3.10 },
        { id: 'claim', start: 10.70, dur: 0.90 },
        { id: 'result', start: 11.60, dur: 1.60 },
        { id: 'end', start: 13.20, dur: 1.80 }
      ]
    },
    reel30: {
      id: 'reel30', fps: 30, duration: 30.0, strip: true,
      beats: [
        { id: 'hook', start: 0.00, dur: 2.20 },
        { id: 'home', start: 2.20, dur: 4.80 },
        { id: 'lobby', start: 7.00, dur: 5.40 },
        { id: 'hunt', start: 12.40, dur: 5.20 },
        { id: 'claim', start: 17.60, dur: 1.40 },
        { id: 'chat', start: 19.00, dur: 4.00 },
        { id: 'result', start: 23.00, dur: 3.60 },
        { id: 'end', start: 26.60, dur: 3.40 }
      ]
    },
    gif6: {
      id: 'gif6', fps: 15, duration: 6.0, strip: true,
      beats: [
        { id: 'hook', start: 0.00, dur: 1.50 },
        { id: 'home', start: 1.50, dur: 1.30 },
        { id: 'hunt', start: 2.80, dur: 1.60 },
        { id: 'end', start: 4.40, dur: 1.60 }
      ]
    }
  };
  window.MH_TIMELINES = TIMELINES;

  const STRIP_META = {
    hook: { idx: '00', label: 'MATCHDAY', right: 'THE APP FILM' },
    home: { idx: '01', label: 'HOME', right: 'RIVERSIDE RUN' },
    lobby: { idx: '02', label: 'LOBBY', right: '5 / 5 READY' },
    hunt: { idx: '03', label: 'HUNTING', right: 'ZONE 240 M' },
    claim: { idx: '03', label: 'HUNTING', right: 'TAG CLAIM' },
    chat: { idx: '03', label: 'HUNTING', right: 'CHAT' },
    result: { idx: '04', label: 'RESULT', right: 'FULL TIME' },
    end: { idx: '04', label: 'RESULT', right: 'MANHUNT' }
  };

  const SCENES = ['scHook', 'scHome', 'scLobby', 'scHunt', 'scClaim', 'scChat', 'scResult', 'scEnd'];
  let shown = null;

  function show(sceneId) {
    if (shown === sceneId) return;
    for (const id of SCENES) $('#' + id).style.display = id === sceneId ? 'block' : 'none';
    shown = sceneId;
  }

  function set(el, opacity, tx, ty, scale, origin) {
    if (!el) return;
    if (opacity == null) el.style.opacity = '1';
    else el.style.opacity = String(opacity);
    const parts = [];
    if (tx != null || ty != null) parts.push(`translate3d(${tx || 0}px,${ty || 0}px,0)`);
    if (scale != null) parts.push(`scale(${scale})`);
    el.style.transform = parts.length ? parts.join(' ') : 'none';
    if (origin) el.style.transformOrigin = origin;
  }

  /* ── scenes ───────────────────────────────────────────────────────────── */

  function renderHook(t, dur) {
    show('scHook');
    const p = clamp01(t / dur);
    /* slow push on the type block — the composition is complete at frame 0 */
    set($('#hookLine'), 1, 0, lerp(0, -18, p), lerp(1.0, 1.018, p), 'left top');
    set($('#hookBrand'), 1, 0, lerp(0, -8, p), 1);
    set($('#hookKicker'), 1, 0, lerp(0, -6, p), 1);
    /* chalk rule draws under the hook */
    const rp = easeOutCubic(inv(0.04, 0.34, t));
    $('#hookRule').style.transform = `scaleX(${rp.toFixed(4)})`;
    $('#hookRule').style.transformOrigin = 'left center';
    set($('#hookFoot'), 1, 0, lerp(0, -4, p), 1);
    set($('#hookCorner'), 1, 0, 0, 1);
  }

  function renderWindowScene(sceneId, t, dur, cfg) {
    show(sceneId);
    const head = $('#' + cfg.headId);
    const sub = $('#' + cfg.subId);
    const win = $('#' + cfg.winId);
    const img = $('#' + cfg.imgId);
    const foot = $('#' + cfg.footId);

    const intro = easeOutCubic(inv(0, 0.42, t));
    set(head, 1, 0, lerp(16, 0, intro), 1, 'left top');
    set(sub, 1, 0, lerp(12, 0, inv(0.03, 0.5, t)), 1);

    const e = easeInOutCubic(clamp01(t / dur));
    const pan = lerp(cfg.panFrom, cfg.panTo, e);
    const zoom = lerp(cfg.zoomFrom, cfg.zoomTo, e);
    img.style.transform = `translate3d(0,${(-pan).toFixed(2)}px,0) scale(${zoom.toFixed(4)})`;
    img.style.transformOrigin = '50% 42%';

    const winIn = easeOutCubic(inv(0, 0.55, t));
    set(win, 1, 0, lerp(14, 0, winIn), lerp(0.985, 1, winIn), '50% 50%');
    set(foot, 1, 0, 0, 1);
  }

  function renderBleedScene(sceneId, t, dur, cfg) {
    show(sceneId);
    const img = $('#' + cfg.imgId);
    const e = easeInOutCubic(clamp01(t / dur));
    const s = lerp(cfg.s0, cfg.s1, e);
    const tx = lerp(cfg.tx0, cfg.tx1, e);
    const ty = lerp(cfg.ty0, cfg.ty1, e);
    img.style.width = (1080 * s).toFixed(2) + 'px';
    img.style.left = tx.toFixed(2) + 'px';
    img.style.top = ty.toFixed(2) + 'px';

    const lower = $('#' + sceneId + ' .lower');
    const p = easeOutCubic(inv(0, 0.34, t));
    set(lower, 1, 0, lerp(16, 0, p), 1, 'left bottom');
    const head = $('#' + sceneId + ' .lowerhead');
    set(head, 1, 0, 0, 1, 'left bottom');
  }

  function renderEnd(t, dur) {
    show('scEnd');
    const p = clamp01(t / dur);
    set($('#endBrandTop'), 1, 0, lerp(0, -4, p), 1);
    set($('#endTagTop'), 1, 0, 0, 1);
    set($('#endLine'), 1, 0, lerp(8, 0, easeOutCubic(inv(0, 0.4, t))), 1, 'left top');
    const l = easeOutCubic(inv(0.06, 0.5, t));
    set($('#endLockup'), 1, 0, lerp(10, 0, l), lerp(0.985, 1, l), '50% 50%');
    set($('#endCta'), 1, 0, lerp(8, 0, easeOutCubic(inv(0.12, 0.52, t))), 1);
    set($('#endUrl'), 1, 0, 0, 1);
    set($('#endMicro'), 1, 0, 0, 1);
    set($('#endTrust'), 1, 0, 0, 1);
    set($('#endFoot'), 1, 0, 0, 1);
  }

  /* ── beat strip overlay ──────────────────────────────────────────────── */
  function renderStrip(beat, local, tl) {
    const strip = $('#beatStrip');
    const meta = STRIP_META[beat.id] || STRIP_META.hook;
    $('#bsIndex').textContent = meta.idx;
    $('#bsLabel').textContent = meta.label;
    $('#bsRight').textContent = meta.right;
    const bleed = beat.id === 'hunt' || beat.id === 'claim' || beat.id === 'chat';
    strip.style.top = bleed ? '150px' : '0px';
    const visible = tl.strip && beat.id !== 'end' && beat.id !== 'hook' && beat.id !== 'claim' && beat.id !== 'chat';
    if (!visible) { strip.style.transform = 'translateX(-112%)'; return; }
    const inP = easeOutCubic(inv(0.0, 0.22, local));
    let x = -112 + 112 * inP;
    if (local > 0.62) {
      const outP = easeInOutCubic(inv(0.62, 0.82, local));
      x = 0 - 112 * outP;
    }
    strip.style.transform = `translateX(${x.toFixed(2)}%)`;
  }

  /* ── frame renderer ──────────────────────────────────────────────────── */
  function resetFrame() {
    $('#beatStrip').style.transform = 'translateX(-112%)';
    shown = null;
  }

  function renderAt(t) {
    const tl = window.MH_ACTIVE;
    const tt = Math.max(0, Math.min(tl.duration - 1e-6, t));
    const beat = tl.beats.find((b) => tt >= b.start && tt < b.start + b.dur) || tl.beats[tl.beats.length - 1];
    const local = tt - beat.start;

    resetFrame();

    switch (beat.id) {
      case 'hook': renderHook(local, beat.dur); break;
      case 'home': renderWindowScene('scHome', local, beat.dur, {
        headId: 'homeHead', subId: 'homeSub', winId: 'homeWin', imgId: 'homeImg', footId: 'homeFoot',
        panFrom: 0, panTo: 250, zoomFrom: 1.0, zoomTo: 1.035
      }); break;
      case 'lobby': renderWindowScene('scLobby', local, beat.dur, {
        headId: 'lobbyHead', subId: 'lobbySub', winId: 'lobbyWin', imgId: 'lobbyImg', footId: 'lobbyFoot',
        panFrom: 0, panTo: 430, zoomFrom: 1.0, zoomTo: 1.03
      }); break;
      case 'hunt': renderBleedScene('scHunt', local, beat.dur, {
        imgId: 'huntImg', s0: 1.24, s1: 1.33, tx0: -130, ty0: -861, tx1: -176, ty1: -933
      }); break;
      case 'claim': renderBleedScene('scClaim', local, beat.dur, {
        imgId: 'claimImg', s0: 1.02, s1: 1.09, tx0: -10, ty0: -812, tx1: -34, ty1: -900
      }); break;
      case 'chat': renderBleedScene('scChat', local, beat.dur, {
        imgId: 'chatImg', s0: 1.02, s1: 1.08, tx0: -20, ty0: -540, tx1: -42, ty1: -612
      }); break;
      case 'result': renderWindowScene('scResult', local, beat.dur, {
        headId: 'resultHead', subId: 'resultSub', winId: 'resultWin', imgId: 'resultImg', footId: 'resultFoot',
        panFrom: 0, panTo: 120, zoomFrom: 1.0, zoomTo: 1.03
      }); break;
      case 'end': renderEnd(local, beat.dur); break;
      default: break;
    }
    renderStrip(beat, local, tl);
    return tt;
  }

  /* ── boot ─────────────────────────────────────────────────────────────── */
  const q = new URLSearchParams(location.search);
  const tlId = q.get('timeline') || 'reel15';
  window.MH_ACTIVE = TIMELINES[tlId] || TIMELINES.reel15;
  if (q.get('guides') === '1') document.body.classList.add('guides');
  window.renderAt = renderAt;

  const imgs = Array.from(document.images);
  const ready = Promise.all(imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = res; }))));

  Promise.all([document.fonts.ready, ready]).then(() => {
    renderAt(0);
    window.MH_READY = true;
    const tArg = q.get('t');
    if (tArg != null) { renderAt(Number(tArg) || 0); return; }
    if (q.get('capture') === '1') return;
    let start = null;
    function loop(now) {
      if (start == null) start = now;
      const t = ((now - start) / 1000) % window.MH_ACTIVE.duration;
      renderAt(t);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  });
})();
