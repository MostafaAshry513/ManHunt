/* ============================================================================
   ManHunt — animated social short · deterministic timeline renderer
   Direction: PICKUP (chalk on asphalt) · provisional copy per brand platform §6.1
   ----------------------------------------------------------------------------
   window.renderAt(t) paints the frame for virtual time t (seconds).
   window.MH_TIMELINES exposes MASTER (15.0 s) and CUT (6.0 s loop) beat tables.
   window.MH_COPY holds every on-screen string — edit once, re-render, rebrand.
   ============================================================================ */
(function () {
  'use strict';

  /* ── copy (single source of truth) ──────────────────────────────────────
     Provisional lock: PICKUP positioning, primary slogan "No gear. No fee.
     Just players." If the owner keeps "Hide. Hunt. Survive.", change
     sloganLines to ['Hide. Hunt.', 'Survive.'] and re-render. */
  const COPY = {
    sloganLines: ['No gear. No fee.', 'Just players.'],
    cta: 'Install free for Android',
    url: 'http://74.208.99.178/',
    micro: 'free APK · Android 8+ · not on Play Store',
    captions: {
      hook: 'your street has<br>rules now',
      teams: '<span class="coral">two</span> teams',
      clock: 'one clock',
      map: 'the map<br>already knows',
      tagged: '<span class="violet">tagged</span>'
    },
    altSloganLines: ['Hide. Hunt.', 'Survive.'],
    trust: 'Play with people you trust.'
  };
  window.MH_COPY = COPY;

  /* ── approved identity lockup (task-37, owner-approved 2026-11-01) ───────
     PICKUP · mark "01 Open Zone" · slogan "No gear. No fee. Just players."
     Canonical package: design/brand/identity/final/ (LOCKUP.md is the source
     of truth). Motion uses the light-on-dark set because the end card is navy:
       final/lockup/lockup-stacked-light-on-dark.svg  (630×376, end card)
       final/lockup/wordmark-light-on-dark.svg        (530×100, cover + hook)
     LOCKUP.md §1 says to inline the SVG markup rather than loading it as a
     file, so the official vectors are inlined verbatim in src/index.html as
     #endLockupSvg / #coverWordmarkSvg / #hookWordmarkSvg (paths, transforms
     and fills unchanged — never retyped, never letter-spaced). This constant
     is the single provenance/swap point for motion. */
  const LOCKUP = {
    canonicalLockupSvg: 'design/brand/identity/final/lockup/lockup-stacked-light-on-dark.svg',
    canonicalWordmarkSvg: 'design/brand/identity/final/lockup/wordmark-light-on-dark.svg',
    sha256: {
      lockup: 'BF72BFDF1175CA9DCDEC44FA7F22CB94D1D60975B1DE825E72399BA69FBB859B',
      wordmark: 'BF6E14937B34DDCD27DE3FE21B83726A7DAC7324746882121F1CDCBE0964600D'
    },
    fill: '#E6EDF7',
    slogan: 'No gear. No fee. Just players.',
    render: 'inline SVG markup in src/index.html (LOCKUP.md §1)'
  };
  window.MH_LOCKUP = LOCKUP;

  const $ = (id) => document.getElementById(String(id).replace(/^#/, ''));
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const inv = (a, b, v) => clamp01((v - a) / (b - a));
  const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
  const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
  const easeOutQuart = (t) => 1 - Math.pow(1 - clamp01(t), 4);
  const easeInCubic = (t) => Math.pow(clamp01(t), 3);
  const easeInOutCubic = (t) => { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };

  /* ── timelines ─────────────────────────────────────────────────────────── */
  const MASTER = {
    id: 'master', fps: 30, duration: 15.0, clockStart: 4.0,
    beats: [
      { id: 'hook',   start: 0.0,  dur: 1.5 },
      { id: 'teams',  start: 1.5,  dur: 2.5 },
      { id: 'clock',  start: 4.0,  dur: 3.0 },
      { id: 'map',    start: 7.0,  dur: 3.0 },
      { id: 'tagged', start: 10.0, dur: 2.0 },
      { id: 'end',    start: 12.0, dur: 3.0 }
    ]
  };
  const CUT = {
    id: 'cut', fps: 15, duration: 6.0, clockStart: 1.6,
    beats: [
      { id: 'teams',  start: 0.0, dur: 1.6 },
      { id: 'map',    start: 1.6, dur: 1.7 },
      { id: 'tagged', start: 3.3, dur: 1.1 },
      { id: 'end',    start: 4.4, dur: 1.6 }
    ]
  };
  window.MH_TIMELINES = { MASTER: MASTER, CUT: CUT };

  /* ── geometry ─────────────────────────────────────────────────────────── */
  const ZC = { x: 540, y: 960, r: 336 };
  const FIELD_INSET = 64;
  const PREY_START = [286, 1178];
  const HUNTER_A0 = [806, 512];
  const HUNTER_B0 = [874, 606];
  const PREY_PATH = [[286, 1178], [344, 1102], [428, 1042], [518, 980], [596, 930], [650, 896]];
  const TAG_PREY = [540, 862];

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  /* ── dom refs ─────────────────────────────────────────────────────────── */
  const stage = $('stage');
  const world = $('world');
  const mapArt = $('mapArt');
  const tokens = $('tokens');
  const appPanel = $('appPanel');
  const clockEl = $('clock');
  const clockNum = $('clockNum');
  const endcard = $('endcard');
  const hookLine = $('hookLine');
  const hookBrand = $('hookBrand');
  const coverEl = $('cover');
  const blackout = $('blackout');
  const invertEl = $('invert');
  const captions = [$('cap1'), $('cap2'), $('cap3'), $('cap4'), $('cap5')];
  const capIndex = { hook: 0, teams: 1, clock: 2, map: 3, tagged: 4 };

  const preyDot = $('preyDot');
  const hunterA = $('hunterA');
  const hunterB = $('hunterB');
  const labelPrey = $('labelPrey');
  const labelHunters = $('labelHunters');
  const tokenEls = [preyDot, hunterA, hunterB];
  const labelEls = [labelPrey, labelHunters];

  const mk = {
    touchline: $('touchline'), halfway: $('halfway'),
    cornerA: $('cornerA'), cornerB: $('cornerB'),
    zoneRing: $('zoneRing'), zoneDash: $('zoneDash'), zoneDot: $('zoneDot'),
    trail: $('trail'),
    snapRing: $('snapRing'), snapRing2: $('snapRing2')
  };
  const marks = Object.values(mk);

  const stagePings = $('stagePings');
  const spings = [$('sping1'), $('sping2'), $('sping3')];
  const pinHalo = $('pinHalo');

  /* ── init ─────────────────────────────────────────────────────────────── */
  const params = new URLSearchParams(location.search);
  const CAPTURE = params.get('capture') === '1';
  const COVER = params.get('cover') === '1';
  const GUIDES = params.get('guides') === '1';
  const TIMELINE = params.get('cut') === '1' ? CUT : MASTER;

  let field = null;
  const lengths = {};

  function setStageScale() {
    const s = Math.min(window.innerWidth / 1080, window.innerHeight / 1920);
    stage.style.transform =
      'translate(' + ((window.innerWidth - 1080 * s) / 2) + 'px,' +
      ((window.innerHeight - 1920 * s) / 2) + 'px) scale(' + s + ')';
  }

  function buildScene() {
    MHMap.build(mapArt, { seed: 20261101 });
    field = MHField.create($('field'), { seed: 1409, count: 132, dust: 84 });

    /* chalk geometry — dimensions set once, drawn with dash offsets */
    const fieldPath = 'M' + FIELD_INSET + ' ' + FIELD_INSET +
      ' H' + (1080 - FIELD_INSET) + ' V' + (1920 - FIELD_INSET) + ' H' + FIELD_INSET + ' Z';
    mk.touchline.setAttribute('d', fieldPath);
    mk.halfway.setAttribute('d', 'M' + FIELD_INSET + ' 960 H' + (1080 - FIELD_INSET));
    mk.cornerA.setAttribute('d', 'M' + (1080 - FIELD_INSET) + ' ' + (FIELD_INSET + 74) + ' A74 74 0 0 0 ' + (1080 - FIELD_INSET - 74) + ' ' + FIELD_INSET);
    mk.cornerB.setAttribute('d', 'M' + FIELD_INSET + ' ' + (1920 - FIELD_INSET - 74) + ' A74 74 0 0 0 ' + (FIELD_INSET + 74) + ' ' + (1920 - FIELD_INSET));
    mk.trail.setAttribute('d', 'M' + PREY_START[0] + ' ' + PREY_START[1]);

    lengths.touchline = mk.touchline.getTotalLength();
    lengths.cornerA = mk.cornerA.getTotalLength();
    lengths.cornerB = mk.cornerB.getTotalLength();
    lengths.zone = 2 * Math.PI * ZC.r;
    mk.zoneRing.setAttribute('stroke-dasharray', lengths.zone);
    mk.zoneRing.setAttribute('stroke-dashoffset', lengths.zone);

    /* static dash patterns that are only faded in */
    mk.halfway.style.strokeDasharray = '14 18';
    mk.zoneDash.style.strokeDasharray = '8 20';
    mk.snapRing2.style.strokeDasharray = '10 14';

    /* ping rings: fixed stage coordinates of the app panel's prey marker */
    // (app panel: left 210 / top 483, image 660×685, pin at 756×539 of 1117×1162)
    spings.forEach((p) => { p.setAttribute('cx', 657); p.setAttribute('cy', 801); });

    $('#imgMap').addEventListener('load', () => {});
    $('#endSlogan').innerHTML = COPY.sloganLines.join('<br>');
    const coverLines = COPY.sloganLines
      .flatMap((l) => l.split(/(?<=\.)\s+/))
      .map((l) => l.toUpperCase());
    $('#coverSlogan').innerHTML = coverLines.map((l, i) =>
      i === coverLines.length - 1 ? '<span class="cyan">' + l + '</span>' : l
    ).join('<br>');
    $('#endCta').textContent = COPY.cta;
    $('#endUrl').textContent = COPY.url;
    $('#endMicro').textContent = COPY.micro;
    $('#endTrust').textContent = COPY.trust;
    /* validate the approved identity lockup is the inlined official vector and
       that the approved slogan has not drifted (brand/copy guard) */
    ['endLockupSvg', 'coverWordmarkSvg', 'hookWordmarkSvg'].forEach((id) => {
      if (!document.getElementById(id)) console.warn('[lockup] missing inlined SVG #' + id);
    });
    if (COPY.sloganLines.join(' ') !== LOCKUP.slogan) {
      console.warn('[lockup] slogan drift: COPY.sloganLines is not the approved slogan');
    }
    $('#coverCta').textContent = COPY.cta;
    $('#coverUrl').textContent = COPY.url;
    $('#coverMicro').textContent = COPY.micro;
    document.querySelectorAll('.cap-text').forEach((el) => {
      const key = el.closest('.cap').id.replace('cap', '');
      const map = { 1: 'hook', 2: 'teams', 3: 'clock', 4: 'map', 5: 'tagged' };
      el.innerHTML = COPY.captions[map[key]];
    });
  }

  /* ── helpers ──────────────────────────────────────────────────────────── */
  function show(el, on) { el.style.display = on ? 'block' : 'none'; }
  function place(el, x, y, scale, opacity, rot) {
    el.style.display = 'block';
    el.style.opacity = opacity == null ? 1 : opacity;
    el.style.transform = 'translate(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px) scale(' +
      (scale == null ? 1 : scale).toFixed(3) + ') rotate(' + (rot || 0) + 'deg)';
  }
  function drawPath(el, len, p) {
    p = clamp01(p);
    el.style.opacity = p > 0.001 ? '' : '0';
    el.setAttribute('stroke-dashoffset', (len * (1 - p)).toFixed(2));
  }
  function polyline(points) {
    return points.map((pt, i) => (i ? 'L' : 'M') + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1)).join(' ');
  }
  function pointAlong(points, p) {
    const n = points.length - 1;
    const f = clamp01(p) * n;
    const i = Math.min(n - 1, Math.floor(f));
    const u = f - i;
    return [lerp(points[i][0], points[i + 1][0], u), lerp(points[i][1], points[i + 1][1], u)];
  }
  function trailD(points, p) {
    const n = points.length - 1;
    const f = clamp01(p) * n;
    const i = Math.min(n - 1, Math.floor(f));
    const u = f - i;
    const head = [lerp(points[i][0], points[i + 1][0], u), lerp(points[i][1], points[i + 1][1], u)];
    return polyline(points.slice(0, i + 1).concat([head]));
  }
  function fmtClock(remeasured) {
    const total = Math.max(0, Math.floor(remeasured));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function cap(idx, localT, dur, instant) {
    captions.forEach((c, i) => { if (i !== idx) c.style.opacity = '0'; });
    const el = captions[idx];
    if (!el) return;
    el.style.display = 'block';
    const tIn = instant ? 1 : easeOutQuart(inv(0, 0.14, localT));
    const tOut = 1 - inv(dur - 0.10, dur, localT);
    const o = Math.min(tIn, tOut);
    el.style.opacity = o.toFixed(3);
    const y = (1 - tIn) * 26 - (1 - tOut) * 10;
    const s = 1 + (1 - tIn) * 0.012;
    el.style.transform = 'translateY(' + y.toFixed(2) + 'px) scale(' + s.toFixed(4) + ')';
  }
  function showClock(globalT, tl) {
    show(clockEl, true);
    const elapsed = Math.max(0, globalT - tl.clockStart);
    clockNum.textContent = fmtClock(3600 - elapsed);
    const tick = (globalT - tl.clockStart) % 1;
    const pulse = tick < 0.10 ? 1 + 0.045 * (1 - tick / 0.10) : 1;
    clockNum.style.transform = 'scale(' + pulse.toFixed(4) + ')';
  }
  function drawFieldFrame(p) {
    drawPath(mk.touchline, lengths.touchline, p.touch);
    drawPath(mk.cornerA, lengths.cornerA, p.corners);
    drawPath(mk.cornerB, lengths.cornerB, p.corners);
    mk.halfway.style.opacity = clamp01(p.halfway).toFixed(3);
    drawPath(mk.zoneRing, lengths.zone, p.zone);
    mk.zoneDash.style.opacity = (0.30 * clamp01(p.zoneDash)).toFixed(3);
    mk.zoneDot.style.opacity = clamp01(p.zoneDot).toFixed(3);
  }
  function hideMarks() {
    marks.forEach((m) => { m.style.opacity = '0'; });
  }

  /* ── beats ────────────────────────────────────────────────────────────── */
  function beatHook(t, dur) {
    show(world, true);
    mapArt.style.opacity = '0.55';
    hideMarks();
    tokenEls.forEach((el) => { el.style.display = 'none'; });
    labelEls.forEach((el) => { el.style.display = 'none'; });
    field.render(t + 6.0, { intensity: 0.22, speed: 0.8 });

    show(hookLine, true);
    show(hookBrand, true);
    const p = easeInOutCubic(inv(0.02, 0.88, t));
    const w = 1080 * p;
    $('hookMain').style.width = w.toFixed(1) + 'px';
    $('hookGhost').style.width = (w * 0.94).toFixed(1) + 'px';
    $('hookHead').style.transform = 'translateX(' + (w - 6).toFixed(1) + 'px)';
    hookLine.style.opacity = (1 - inv(dur - 0.16, dur, t) * 0.85).toFixed(3);

    cap(0, t, dur, true);
  }

  function beatTeams(t, dur) {
    show(world, true);
    mapArt.style.opacity = '1';
    field.render(t + 2.0, { intensity: 0.48, speed: 0.85 });
    show(hookLine, false);

    // chalk: touchlines and corners draw; official zone circle draws
    drawFieldFrame({
      touch: easeOutCubic(inv(0.02 * dur, 0.34 * dur, t)),
      corners: easeOutCubic(inv(0.10 * dur, 0.38 * dur, t)),
      halfway: inv(0.12 * dur, 0.36 * dur, t),
      zone: easeInOutCubic(inv(0.16 * dur, 0.62 * dur, t)),
      zoneDash: inv(0.46 * dur, 0.70 * dur, t),
      zoneDot: inv(0.52 * dur, 0.64 * dur, t)
    });
    mk.trail.style.opacity = '0';

    // the two sides arrive at opposite corners, then breathe
    const pPrey = inv(0.12 * dur, 0.30 * dur, t);
    const pHa = inv(0.18 * dur, 0.36 * dur, t);
    const pHb = inv(0.24 * dur, 0.42 * dur, t);
    const sPrey = easeInCubic(pPrey) * 0.18 + (easeOutQuart(pPrey) * 1.0) * 0.82;
    const breathe = 1 + 0.016 * Math.sin(t * 2.4);
    const drift = 7 * Math.sin(t * 1.7);
    place(preyDot, PREY_START[0] + drift, PREY_START[1] - drift * 0.5, sPrey * breathe, pPrey > 0 ? 1 : 0);
    place(hunterA, HUNTER_A0[0] - drift * 0.6, HUNTER_A0[1] + drift * 0.4, sPrey * breathe, pHa > 0 ? 1 : 0);
    place(hunterB, HUNTER_B0[0] - drift * 0.4, HUNTER_B0[1] + drift * 0.6, sPrey * breathe, pHb > 0 ? 1 : 0);

    const lp = easeOutCubic(inv(0.34 * dur, 0.52 * dur, t));
    place(labelPrey, PREY_START[0] + 26 + drift, PREY_START[1] - 50 - drift * 0.5, 1, lp);
    place(labelHunters, HUNTER_A0[0] + 26 - drift * 0.6, HUNTER_A0[1] - 48 + drift * 0.4, 1, lp);

    show(clockEl, false);
    cap(1, t, dur, false);
  }

  function beatClock(t, dur, globalT, tl) {
    show(world, true);
    mapArt.style.opacity = '1';
    show(hookLine, false);
    drawFieldFrame({ touch: 1, corners: 1, halfway: 1, zone: 1, zoneDash: 1, zoneDot: 1 });

    // prey runs the pursuit line; the coral trail draws behind it
    const pMove = easeInOutCubic(inv(0.08 * dur, 0.84 * dur, t));
    const pos = pointAlong(PREY_PATH, pMove);
    mk.trail.setAttribute('d', pMove > 0.005 ? trailD(PREY_PATH, pMove) : 'M' + pos[0] + ' ' + pos[1]);
    mk.trail.style.opacity = pMove > 0.005 ? '1' : '0';

    // the violet pair closes in
    const pClose = easeInOutCubic(inv(0.06 * dur, 0.96 * dur, t));
    const ha = [lerp(HUNTER_A0[0], 686, pClose), lerp(HUNTER_A0[1], 802, pClose)];
    const hb = [lerp(HUNTER_B0[0], 722, pClose), lerp(HUNTER_B0[1], 866, pClose)];

    place(preyDot, pos[0], pos[1], 1.04, 1);
    place(hunterA, ha[0], ha[1], 1, 1);
    place(hunterB, hb[0], hb[1], 1, 1);
    place(labelPrey, pos[0] + 26, pos[1] - 50, 1, 0.85);
    place(labelHunters, ha[0] + 24, ha[1] - 46, 1, 0.85);

    field.render(t + 4.0, {
      intensity: 0.55, speed: 1.0, converge: 0.30,
      attractors: [{ x: pos[0], y: pos[1], weight: 1.2 }]
    });

    showClock(globalT, tl);
    cap(2, t, dur, false);
  }

  function beatMap(t, dur, globalT, tl) {
    show(world, false);
    show(hookLine, false);
    show(clockEl, true);
    show(appPanel, true);
    appPanel.style.opacity = '1';
    appPanel.style.transform = 'translateY(0px)';

    // the map pings: flat coral rings leave the prey marker, held inside the map
    // shot so they never cut across the caption (readability beats literalism)
    show(stagePings, true);
    pinHalo.style.opacity = '0.9';
    const offsets = [0.05, 0.44, 0.83];
    const life = 0.58;
    spings.forEach((pin, i) => {
      const p = inv(offsets[i], offsets[i] + life, t);
      if (p <= 0 || p >= 1) { pin.style.opacity = '0'; return; }
      pin.setAttribute('r', (34 + 386 * easeOutCubic(p)).toFixed(1));
      pin.style.opacity = (0.85 * (1 - p) * clamp01(p / 0.02)).toFixed(3);
    });
    // slow push-in keeps the shot alive without breaking the flat language
    const push = 1 + 0.028 * easeInOutCubic(inv(0, 1, t / Math.max(dur, 0.001)));
    appPanel.style.transform = 'scale(' + push.toFixed(4) + ')';
    showClock(globalT, tl);
    field.render(0, { intensity: 0 });
    cap(3, t, dur, false);
  }

  function beatTagged(t, dur, globalT, tl) {
    show(world, true);
    show(hookLine, false);
    show(appPanel, false);
    mapArt.style.opacity = '0.85';
    drawFieldFrame({ touch: 1, corners: 1, halfway: 1, zone: 0, zoneDash: 0, zoneDot: 0 });

    // the coral dot (Prey) holds the middle of the field
    place(preyDot, TAG_PREY[0], TAG_PREY[1], 1.15, 1);
    hunterA.style.display = 'none';
    hunterB.style.display = 'none';
    labelPrey.style.display = 'none';
    labelHunters.style.display = 'none';
    mk.trail.style.opacity = '0';

    // the violet ring (Hunters) snaps onto it
    const pSnap = easeInCubic(inv(0.02 * dur, 0.18 * dur, t));
    const r = lerp(700, 52, pSnap);
    const pulse = pSnap >= 1 ? Math.sin((t - 0.18 * dur) * 9) * 2.2 : 0;
    [mk.snapRing, mk.snapRing2].forEach((ring, i) => {
      ring.setAttribute('cx', TAG_PREY[0]);
      ring.setAttribute('cy', TAG_PREY[1]);
      ring.setAttribute('r', (r + i * 20 + pulse).toFixed(1));
      ring.style.opacity = (0.95 * (0.35 + 0.65 * pSnap)).toFixed(3);
    });

    showClock(globalT, tl);
    field.render(t + 8.0, { intensity: 0.30, speed: 1.1, converge: 0.14, attractors: [{ x: TAG_PREY[0], y: TAG_PREY[1], weight: 1 }] });
    cap(4, t, dur, false);
  }

  function beatEnd(t, dur) {
    show(world, false);
    show(hookLine, false);
    show(clockEl, false);
    show(appPanel, false);
    show(endcard, true);
    field.render(t + 10.0, { intensity: 0 });

    const pRule = easeOutCubic(inv(0.02, 0.22, t));
    $('#endRuleTop').style.transform = 'scaleX(' + pRule.toFixed(3) + ')';
    $('#endRuleBottom').style.transform = 'scaleX(' + pRule.toFixed(3) + ')';
    $('#endRuleTop').style.transformOrigin = '0 50%';
    $('#endRuleBottom').style.transformOrigin = '100% 50%';

    const pSlogan = easeOutCubic(inv(0.04, 0.26, t));
    const sl = $('#endSlogan');
    sl.style.opacity = pSlogan.toFixed(3);
    sl.style.transform = 'translateY(' + ((1 - pSlogan) * 26).toFixed(2) + 'px)';

    const pWm = easeOutQuart(inv(0.14, 0.42, t));
    const wm = $('#endWordmark');
    wm.style.opacity = pWm > 0.02 ? '1' : '0';
    wm.style.clipPath = 'inset(0 ' + ((1 - pWm) * 100).toFixed(2) + '% 0 0)';
    wm.style.transform = 'translateX(' + ((1 - pWm) * 26).toFixed(2) + 'px)';

    const pCta = easeOutCubic(inv(0.30, 0.46, t));
    const cta = $('#endCta');
    cta.style.opacity = pCta.toFixed(3);
    cta.style.transform = 'scale(' + (0.96 + 0.04 * pCta).toFixed(4) + ')';

    const pUrl = easeOutCubic(inv(0.38, 0.54, t));
    const url = $('#endUrl');
    url.style.opacity = pUrl.toFixed(3);
    url.style.transform = 'translateY(' + ((1 - pUrl) * 18).toFixed(2) + 'px)';

    const pMicro = easeOutCubic(inv(0.46, 0.60, t));
    $('#endMicro').style.opacity = pMicro.toFixed(3);

    /* brand-required line: confidence, not a warning banner */
    const pTrust = easeOutCubic(inv(0.52, 0.66, t));
    $('#endTrust').style.opacity = pTrust.toFixed(3);

    captions.forEach((c) => { c.style.opacity = '0'; });
  }

  /* ── cover still (?cover=1) ───────────────────────────────────────────── */
  function renderCover() {
    resetFrame();
    show(world, true);
    mapArt.style.opacity = '1';
    field.render(2.4, { intensity: 0.42, speed: 0.6 });
    drawFieldFrame({ touch: 1, corners: 1, halfway: 1, zone: 1, zoneDash: 1, zoneDot: 1 });

    // poster composition: geometry + type only, no tokens in the type area
    mk.trail.style.opacity = '0';

    show(clockEl, false);
    show(endcard, false);
    show(hookLine, false);
    show(appPanel, false);
    show(coverEl, true);
  }

  /* ── frame reset ──────────────────────────────────────────────────────── */
  function resetFrame() {
    show(world, false);
    show(appPanel, false);
    show(stagePings, false);
    show(clockEl, false);
    show(endcard, false);
    show(hookLine, false);
    show(hookBrand, false);
    show(coverEl, false);
    captions.forEach((c) => { c.style.opacity = '0'; });
    $('#endTrust').style.opacity = '0';
    tokenEls.forEach((el) => { el.style.display = 'none'; });
    labelEls.forEach((el) => { el.style.display = 'none'; });
    inventReset(mk);
    blackout.style.opacity = '0';
    invertEl.style.opacity = '0';
  }
  function inventReset(mk) {
    for (const k in mk) mk[k].style.opacity = '0';
    mk.trail.setAttribute('d', 'M' + PREY_START[0] + ' ' + PREY_START[1]);
  }

  /* ── main render entry point ──────────────────────────────────────────── */
  function renderAt(time) {
    const tl = TIMELINE;
    const t = clamp(time, 0, tl.duration - 0.0001);
    let beat = tl.beats[tl.beats.length - 1];
    for (let i = 0; i < tl.beats.length; i++) {
      const b = tl.beats[i];
      if (t >= b.start && (t < b.start + b.dur || i === tl.beats.length - 1)) { beat = b; break; }
    }
    const local = t - beat.start;
    resetFrame();

    /* one-frame hard cut to black at the end of the map beat */
    const mapBeat = tl.beats.find((b) => b.id === 'map');
    if (mapBeat) {
      const blackStart = mapBeat.start + mapBeat.dur - 1 / tl.fps;
      if (t >= blackStart && t < mapBeat.start + mapBeat.dur) blackout.style.opacity = '1';
    }

    /* two-frame coral inversion at the tag snap */
    const tagBeat = tl.beats.find((b) => b.id === 'tagged');
    if (tagBeat) {
      const snap = tagBeat.start + 0.18 * tagBeat.dur;
      const f0 = Math.round(snap * tl.fps) / tl.fps;
      if (t >= f0 && t < f0 + 2 / tl.fps) invertEl.style.opacity = '1';
    }

    switch (beat.id) {
      case 'hook': beatHook(local, beat.dur); break;
      case 'teams': beatTeams(local, beat.dur); break;
      case 'clock': beatClock(local, beat.dur, t, tl); break;
      case 'map': beatMap(local, beat.dur, t, tl); break;
      case 'tagged': beatTagged(local, beat.dur, t, tl); break;
      case 'end': beatEnd(local, beat.dur); break;
    }
    return t;
  }
  window.renderAt = renderAt;
  window.MH_RENDER_COVER = renderCover;

  /* ── safe-area guides ─────────────────────────────────────────────────── */
  function buildGuides() {
    document.body.classList.add('guides');
    const g = $('guides');
    const add = (cls, style, text) => {
      const d = document.createElement('div');
      d.className = cls;
      Object.assign(d.style, style);
      if (text) d.textContent = text;
      g.appendChild(d);
      return d;
    };
    add('g', { left: '84px', right: '84px', top: '0px', bottom: '320px' });
    add('gl', { left: '88px', top: '330px' }, 'SAFE AREA (bottom 320 / sides 84)');
    add('g', { left: '84px', right: '84px', top: '100px', bottom: '1820px' });
    const c = add('gl', { left: '88px', top: '120px' }, 'TOP CHROME ~100px');
    c.style.color = '#22D3EE';
  }

  /* ── boot ─────────────────────────────────────────────────────────────── */
  function startPreview() {
    let start = null;
    const loop = (now) => {
      if (start === null) start = now;
      const t = ((now - start) / 1000) % TIMELINE.duration;
      renderAt(t);
      window.__mhRAF = requestAnimationFrame(loop);
    };
    window.__mhRAF = requestAnimationFrame(loop);
  }

  async function boot() {
    setStageScale();
    window.addEventListener('resize', setStageScale);
    buildScene();
    if (GUIDES) buildGuides();

    try { await document.fonts.ready; } catch (e) {}
    const imgs = Array.from(document.images);
    await Promise.all(imgs.map((img) => img.complete ? Promise.resolve() :
      new Promise((res) => { img.onload = res; img.onerror = res; })));

    if (COVER) {
      renderCover();
    } else {
      const tParam = params.get('t');
      renderAt(tParam != null ? parseFloat(tParam) : 0);
      if (!CAPTURE && tParam == null) startPreview();
    }
    window.MH_READY = true;
    document.documentElement.dataset.ready = '1';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
