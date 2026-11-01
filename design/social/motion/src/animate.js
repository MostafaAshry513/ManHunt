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
     Copy family v2 (design/brand/strategy/slogan-v2.md + script-v2.md):
       hook            "Your friends are hunting you."
       permanent/short "Hide from your friends."
       end-card CTA    "Create a hunt. Send the code. Hide."
     Owner approval PENDING for all explainer copy; the 15s film copy was
     reviewed by brand-director. Sentence case, full stops, no exclamation.
     `sloganLines` is the cover line (permanent short form); `endLinesHook` is
     the hook end-card line; `endLinesShort` is the permanent line used on the
     explainer/cutdown end cards. */
  const COPY = {
    sloganLines: ['Hide from', 'your friends.'],
    endLinesHook: ['Your friends are', 'hunting you.'],
    endLinesShort: ['Hide from', 'your friends.'],
    ctaInstall: 'Install free for Android',
    ctaInvite: 'Create a hunt. Send the code. Hide.',
    url: 'http://74.208.99.178/',
    micro: 'free APK · Android 8+ · not on Play Store',
    captions: {
      hook: 'Your friends are<br>hunting you.',
      teams: 'One of you is<br>the prey.',
      clock: 'Your phone tells<br>them where<br>you are.',
      chase: 'Move.<br>Or get tagged.',
      tagged: 'Tagged.<br>You\u2019re out.'
    },
    /* explainer beat lines (provisional; owner approval pending) */
    longCaptions: {
      hook: 'Your friends are<br>hunting you.',
      what: "It's hide-and-seek<br>in the real world.",
      sidesHide: 'One team hides.',
      sidesHunt: 'One team hunts.',
      phones: 'Your phone reports<br>your position.',
      track: 'Hunters see your<br>last report.',
      tagFind: 'Find them.',
      tagTouch: 'Touch them to tag.',
      tagTagged: 'Tagged. They\u2019re out.',
      rules: 'The server keeps<br>the clock.',
      setupMake: 'Create a hunt.',
      setupShare: 'Share the code.',
      install: 'Free Android APK.<br>Not on Play Store.'
    },
    trust: 'Play with people you trust.'
  };
  window.MH_COPY = COPY;

  /* ── approved identity lockup (task-37, owner-approved 2026-11-01) ───────
     PICKUP · mark "01 Open Zone" · permanent line "Hide from your friends."
     (the earlier PICKUP positioning line was rejected by the owner and must
     never ship again — see brand-director stop-ship, task-43.)
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
    slogan: 'Hide from your friends.',
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
    id: 'master', fps: 30, duration: 15.0, clockStart: 4.2, endLine: 'hook',
    beats: [
      { id: 'hook',   start: 0.0,  dur: 1.5 },
      { id: 'teams',  start: 1.5,  dur: 2.7 },
      { id: 'clock',  start: 4.2,  dur: 2.6 },
      { id: 'chase',  start: 6.8,  dur: 2.6 },
      { id: 'tagged', start: 9.4,  dur: 2.2 },
      { id: 'end',    start: 11.6, dur: 3.4 }
    ]
  };
  const CUT = {
    id: 'cut', fps: 15, duration: 6.0, clockStart: 1.6, endLine: 'hook',
    beats: [
      { id: 'teams',  start: 0.0, dur: 1.6 },
      { id: 'chase',  start: 1.6, dur: 1.7 },
      { id: 'tagged', start: 3.3, dur: 1.1 },
      { id: 'end',    start: 4.4, dur: 1.6 }
    ]
  };
  /* ── longform explainer timelines (task-43) ─────────────────────────────
     Same chalk-field grammar, no screenshot. Ten beats: hook → what → sides →
     phones report → hunters track → find/touch/tag → server clock/zone/trails →
     two phones + code → install honesty → end card. */
  const LONGFORM = {
    id: 'long60', fps: 30, duration: 60.0, clockStart: 40.0, endLine: 'hook', invertFrac: 0.62,
    beats: [
      { id: 'l-hook',    start: 0.0,  dur: 2.5 },
      { id: 'l-what',    start: 2.5,  dur: 6.0 },
      { id: 'l-sides',   start: 8.5,  dur: 7.5 },
      { id: 'l-phones',  start: 16.0, dur: 8.0 },
      { id: 'l-track',   start: 24.0, dur: 8.0 },
      { id: 'l-tag',     start: 32.0, dur: 8.0 },
      { id: 'l-rules',   start: 40.0, dur: 7.0 },
      { id: 'l-setup',   start: 47.0, dur: 6.0 },
      { id: 'l-install', start: 53.0, dur: 4.0 },
      { id: 'end',       start: 57.0, dur: 3.0 }
    ]
  };
  const SHORT30 = {
    id: 'short30', fps: 30, duration: 30.0, clockStart: 20.5, endLine: 'hook', invertFrac: 0.62,
    beats: [
      { id: 'l-hook',    start: 0.0,  dur: 1.5 },
      { id: 'l-what',    start: 1.5,  dur: 2.5 },
      { id: 'l-sides',   start: 4.0,  dur: 4.0 },
      { id: 'l-phones',  start: 8.0,  dur: 4.0 },
      { id: 'l-track',   start: 12.0, dur: 4.0 },
      { id: 'l-tag',     start: 16.0, dur: 4.5 },
      { id: 'l-rules',   start: 20.5, dur: 4.0 },
      { id: 'l-setup',   start: 24.5, dur: 2.5 },
      { id: 'l-install', start: 27.0, dur: 1.5 },
      { id: 'end',       start: 28.5, dur: 1.5 }
    ]
  };
  const GIF6 = {
    id: 'gif6', fps: 15, duration: 6.0, clockStart: 99, endLine: 'hook', invertFrac: 0.62,
    beats: [
      { id: 'l-hook', start: 0.0, dur: 2.2 },
      { id: 'l-tag',  start: 2.2, dur: 2.0 },
      { id: 'end',    start: 4.2, dur: 1.8 }
    ]
  };
  window.MH_TIMELINES = { MASTER: MASTER, CUT: CUT, LONGFORM: LONGFORM, SHORT30: SHORT30, GIF6: GIF6 };

  /* ── geometry ─────────────────────────────────────────────────────────── */
  const ZC = { x: 540, y: 960, r: 336 };
  const FIELD_INSET = 64;
  const PREY_START = [286, 1178];
  const HUNTER_A0 = [806, 512];
  const HUNTER_B0 = [874, 606];
  const PREY_PATH = [[286, 1178], [344, 1102], [428, 1042], [518, 980], [596, 930], [650, 896]];
  /* v4: the Prey keeps running after the clock beat — the animated chase that
     fills the old screenshot slot (7.0–10.0 s). Starts exactly where PREY_PATH ends. */
  const CHASE_TAIL = [[650, 896], [700, 938], [736, 1000], [712, 1066], [636, 1094], [578, 1066]];
  const CHASE_HUNTER_A = [618, 1018];
  const CHASE_HUNTER_B = [692, 1056];
  const CHASE_HUNTER_A0 = [686, 802];   // beat-3 end positions (continuity)
  const CHASE_HUNTER_B0 = [722, 866];
  /* the closing net (K7): three more Hunters fade into the chase, so the film
     shows all five Hunters converging on the Prey in original geometry */
  const CHASE_NET = [
    { c0: [212, 618], c1: [430, 898] },
    { c0: [960, 1160], c1: [706, 962] },
    { c0: [302, 1512], c1: [534, 1122] }
  ];
  const TAG_PREY = [540, 862];

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

  /* ── dom refs ─────────────────────────────────────────────────────────── */
  const stage = $('stage');
  const world = $('world');
  const mapArt = $('mapArt');
  const tokens = $('tokens');
  const clockEl = $('clock');
  const clockNum = $('clockNum');
  const endcard = $('endcard');
  const hookLine = $('hookLine');
  const hookBrand = $('hookBrand');
  const coverEl = $('cover');
  const blackout = $('blackout');
  const invertEl = $('invert');
  const captions = [$('cap1'), $('cap2'), $('cap3'), $('cap4'), $('cap5')];
  const capIndex = { hook: 0, teams: 1, clock: 2, chase: 3, tagged: 4 };

  /* longform explainer elements */
  const phonesEl = $('phones'), phoneBig = $('phoneBig'), phoneLeft = $('phoneLeft'), phoneRight = $('phoneRight');
  const labelsEl = $('diagramLabels');
  const dls = { zone: $('dlZone'), clock: $('dlClock'), trail: $('dlTrail'), map: $('dlMap') };
  const codeChip = $('codeChip'), installCard = $('installCard');
  const captionsL = $('captionsL'), capL = $('capL'), capLRule = $('capLRule'), capLText = $('capLText');

  const preyDot = $('preyDot');
  const hunterA = $('hunterA');
  const hunterB = $('hunterB');
  const hunterC = $('hunterC');
  const hunterD = $('hunterD');
  const hunterE = $('hunterE');
  const labelPrey = $('labelPrey');
  const labelHunters = $('labelHunters');
  const tokenEls = [preyDot, hunterA, hunterB, hunterC, hunterD, hunterE];
  const labelEls = [labelPrey, labelHunters];

  const mk = {
    touchline: $('touchline'), halfway: $('halfway'),
    cornerA: $('cornerA'), cornerB: $('cornerB'),
    zoneRing: $('zoneRing'), zoneDash: $('zoneDash'), zoneDot: $('zoneDot'),
    trail: $('trail'),
    chasePing1: $('chasePing1'), chasePing2: $('chasePing2'), chasePing3: $('chasePing3'),
    hunterTraceA: $('hunterTraceA'), hunterTraceB: $('hunterTraceB'),
    reportLine: $('reportLine'),
    snapRing: $('snapRing'), snapRing2: $('snapRing2')
  };
  const marks = Object.values(mk);
  const chasePings = [mk.chasePing1, mk.chasePing2, mk.chasePing3];

  /* ── init ─────────────────────────────────────────────────────────────── */
  const params = new URLSearchParams(location.search);
  const CAPTURE = params.get('capture') === '1';
  const COVER = params.get('cover') === '1';
  const GUIDES = params.get('guides') === '1';
  const TIMELINE = (() => {
    const p = params.get('timeline');
    if (p === 'long60') return LONGFORM;
    if (p === 'short30') return SHORT30;
    if (p === 'gif6') return GIF6;
    if (params.get('cut') === '1') return CUT;
    return MASTER;
  })();

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

    /* ping rings removed: the chase beat renders pings in world space (mk.chasePing*) */
    $('#endSlogan').innerHTML = COPY.endLinesHook.join('<br>');
    const coverLines = COPY.sloganLines
      .flatMap((l) => l.split(/(?<=\.)\s+/))
      .map((l) => l.toUpperCase());
    $('#coverSlogan').innerHTML = coverLines.map((l, i) =>
      i === coverLines.length - 1 ? '<span class="cyan">' + l + '</span>' : l
    ).join('<br>');
    $('#endCta').textContent = COPY.ctaInstall;
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
    $('#coverCta').textContent = COPY.ctaInvite;
    $('#coverUrl').textContent = COPY.url;
    $('#coverMicro').textContent = COPY.micro;
    /* install card uses the official wordmark vector (cloned, id stripped —
       never retyped as text) */
    const officialWm = document.getElementById('coverWordmarkSvg');
    if (officialWm) {
      const clone = officialWm.cloneNode(true);
      clone.removeAttribute('id');
      $('#installWordmark').appendChild(clone);
    }
    document.querySelectorAll('.cap-text').forEach((el) => {
      const key = el.closest('.cap').id.replace('cap', '');
      const map = { 1: 'hook', 2: 'teams', 3: 'clock', 4: 'chase', 5: 'tagged' };
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
  function trailDIndex(points, f) {
    const n = points.length - 1;
    const clamped = clamp(f, 0, n);
    const i = Math.min(n - 1, Math.floor(clamped));
    const u = clamped - i;
    const head = [lerp(points[i][0], points[i + 1][0], u), lerp(points[i][1], points[i + 1][1], u)];
    return polyline(points.slice(0, i + 1).concat([head]));
  }
  function trailD(points, p) {
    return trailDIndex(points, clamp01(p) * (points.length - 1));
  }
  /* continue the beat-3 coral trail into the chase tail without restarting it */
  function trailDContinue(prev, tail, p) {
    const full = prev.concat(tail.slice(1));
    const start = prev.length - 1;                       // joint index in `full`
    const f = start + clamp01(p) * (full.length - 1 - start);
    return trailDIndex(full, f);
  }
  function fmtClock(remeasured) {
    const total = Math.max(0, Math.floor(remeasured));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function cap(idx, localT, dur, instant) {
    captions.forEach((c, i) => { if (i !== idx) c.style.opacity = '0'; });
    capL.style.opacity = '0';
    captionsL.style.display = 'none';
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
  /* longform caption band (same position/type as the film captions) */
  function lcap(html, size, ruleColor, t, dur, instant) {
    captionsL.style.display = 'block';
    captions.forEach((c) => { c.style.opacity = '0'; });
    if (capLText.innerHTML !== html) capLText.innerHTML = html;
    capLText.style.fontSize = size + 'px';
    capLRule.style.background = ruleColor || 'var(--chalk)';
    capL.style.display = 'block';
    const tIn = instant ? 1 : easeOutQuart(inv(0, 0.14, t));
    const tOut = 1 - inv(dur - 0.12, dur, t);
    const o = Math.min(tIn, tOut);
    capL.style.opacity = o.toFixed(3);
    const y = (1 - tIn) * 26 - (1 - tOut) * 12;
    capL.style.transform = 'translateY(' + y.toFixed(2) + 'px)';
  }
  function hideLcap() {
    captionsL.style.display = 'none';
    capL.style.opacity = '0';
  }
  function placePhone(el, x, y, w, opacity, rot) {
    show(phonesEl, true);
    show(el, true);
    el.style.opacity = (opacity == null ? 1 : opacity).toFixed(3);
    el.style.width = w + 'px';
    el.style.height = (w * 2) + 'px';
    el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) rotate(' + (rot || 0) + 'deg)';
  }
  function placeDl(el, x, y, opacity, reversed) {
    show(labelsEl, true);
    if (opacity <= 0.01) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.style.opacity = opacity.toFixed(3);
    el.classList.toggle('rev', !!reversed);
    el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
  }
  function drawFieldFrame(p) {
    /* the chase beat shrinks the zone in place; restore the canonical radius and
       draw-in dash pattern every time the frame is drawn by an earlier beat */
    mk.zoneRing.setAttribute('r', ZC.r);
    mk.zoneDash.setAttribute('r', ZC.r + 24);
    mk.zoneRing.setAttribute('stroke-dasharray', lengths.zone);
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

  /* v4 · 7.0–10.0 s: pure chalk-field chase. The former app-screenshot beat is
     gone; the zone closes, the Prey runs a new line, the Hunters close in and
     coral pings leave the Prey — all in the original asphalt/chalk language. */
  function beatChase(t, dur, globalT, tl) {
    const D = Math.max(dur, 0.001);
    show(world, true);
    show(hookLine, false);
    mapArt.style.opacity = '1';
    drawFieldFrame({ touch: 1, corners: 1, halfway: 1, zone: 1, zoneDash: 1, zoneDot: 1 });

    // the official zone closes in: cyan ring only — no glow, no new copy
    const pZone = easeInOutCubic(inv(0.03 * D, 0.90 * D, t));
    const zoneR = lerp(ZC.r, 246, pZone);
    mk.zoneRing.setAttribute('r', zoneR.toFixed(1));
    mk.zoneRing.setAttribute('stroke-dasharray', 'none');
    mk.zoneRing.setAttribute('stroke-dashoffset', '0');
    mk.zoneRing.style.opacity = '1';
    mk.zoneDash.setAttribute('r', (zoneR + 24).toFixed(1));
    mk.zoneDash.style.opacity = (0.30 * (1 - 0.4 * pZone)).toFixed(3);
    mk.zoneDot.style.opacity = (0.75 + 0.25 * Math.abs(Math.sin(t * 6.2))).toFixed(3);

    // Prey keeps running; the coral trail continues from where beat 3 left it
    const pRun = easeInOutCubic(inv(0.02 * D, 0.88 * D, t));
    const pos = pointAlong(CHASE_TAIL, pRun);
    mk.trail.setAttribute('d', trailDContinue(PREY_PATH, CHASE_TAIL, pRun));
    mk.trail.style.opacity = '1';

    // Hunters close the distance, leaving violet dashed pursuit traces
    const pClose = easeInOutCubic(inv(0.04 * D, 0.86 * D, t));
    const ha = [lerp(CHASE_HUNTER_A0[0], CHASE_HUNTER_A[0], pClose), lerp(CHASE_HUNTER_A0[1], CHASE_HUNTER_A[1], pClose)];
    const hb = [lerp(CHASE_HUNTER_B0[0], CHASE_HUNTER_B[0], pClose), lerp(CHASE_HUNTER_B0[1], CHASE_HUNTER_B[1], pClose)];
    place(preyDot, pos[0], pos[1], 1.04, 1);
    place(hunterA, ha[0], ha[1], 1, 1);
    place(hunterB, hb[0], hb[1], 1, 1);
    /* labels are only useful while the sides are still legible; fade them as
       the net closes so PREY/HUNTERS never overlap at the end of the chase */
    const labelOp = 0.8 * (1 - smooth(inv(0.52 * D, 0.78 * D, t)));
    if (labelOp > 0.01) {
      place(labelPrey, pos[0] + 26, pos[1] - 50, 1, labelOp);
      place(labelHunters, ha[0] + 24, ha[1] - 46, 1, labelOp);
    } else {
      labelPrey.style.display = 'none';
      labelHunters.style.display = 'none';
    }
    [mk.hunterTraceA, mk.hunterTraceB].forEach((tr, i) => {
      const a = i === 0 ? CHASE_HUNTER_A0 : CHASE_HUNTER_B0;
      const b = i === 0 ? ha : hb;
      tr.setAttribute('x1', a[0]); tr.setAttribute('y1', a[1]);
      tr.setAttribute('x2', b[0]); tr.setAttribute('y2', b[1]);
      tr.style.opacity = (0.55 * clamp01(pClose * 3)).toFixed(3);
    });

    // the closing net: the other three Hunters fade in and converge (5 violet dots)
    [hunterC, hunterD, hunterE].forEach((el, i) => {
      const n = CHASE_NET[i];
      const p = easeInOutCubic(inv(0.10 * D, 0.92 * D, t));
      place(el, lerp(n.c0[0], n.c1[0], p), lerp(n.c0[1], n.c1[1], p), 1, clamp01(p * 2.4) * 0.95);
    });

    // coral pings leave the Prey dot; radius capped so they stay clear of captions
    const offsets = [0.08, 0.36, 0.64];
    const life = 0.34;
    chasePings.forEach((pin, i) => {
      const t0 = offsets[i] * D;
      const pi = (t - t0) / (life * D);
      if (pi <= 0 || pi >= 1) { pin.style.opacity = '0'; return; }
      const origin = pointAlong(CHASE_TAIL, easeInOutCubic(inv(0.02 * D, 0.88 * D, t0)));
      pin.setAttribute('cx', origin[0].toFixed(1));
      pin.setAttribute('cy', origin[1].toFixed(1));
      pin.setAttribute('r', (18 + 190 * easeOutCubic(pi)).toFixed(1));
      pin.style.opacity = (0.60 * (1 - pi) * clamp01(pi / 0.04)).toFixed(3);
    });

    field.render(t + 6.6, {
      intensity: 0.62, speed: 1.05, converge: 0.34,
      attractors: [{ x: pos[0], y: pos[1], weight: 1.3 }]
    });

    showClock(globalT, tl);
    cap(3, t, dur, false);
  }

  function beatTagged(t, dur, globalT, tl) {
    show(world, true);
    show(hookLine, false);
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

  function beatEnd(t, dur, tl) {
    show(world, false);
    show(hookLine, false);
    show(clockEl, false);
    show(endcard, true);
    /* end-card line follows the copy family: hook on the 15s film, permanent
       short form on the explainer/cutdown end cards */
    const endLine = COPY.endLinesShort;
    $('#endSlogan').innerHTML = endLine.join('<br>');
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

  /* ── longform explainer scenes (60 s master + 30 s cut) ─────────────────
     Pure animated field/map diagrams: chalk, block grid, zone, dots, pings,
     phone schematics (flat vector, not the app UI). No screenshots. */
  const LF_PREY = [360, 1150];
  const LF_HUNTERS = [
    { c0: [844, 470], c1: [704, 972] },
    { c0: [934, 604], c1: [762, 1032] },
    { c0: [178, 566], c1: [520, 1030] },
    { c0: [984, 1166], c1: [792, 1074] },
    { c0: [222, 1436], c1: [566, 1140] }
  ];
  const LF_HUNTER_ELS = [hunterA, hunterB, hunterC, hunterD, hunterE];

  function beatLHook(t, dur) {
    show(world, true);
    mapArt.style.opacity = '0.55';
    hideMarks();
    tokenEls.forEach((el) => { el.style.display = 'none'; });
    labelEls.forEach((el) => { el.style.display = 'none'; });
    field.render(t + 2.0, { intensity: 0.22, speed: 0.8 });
    show(hookLine, true);
    show(hookBrand, true);
    const p = easeInOutCubic(inv(0.02, 0.88, t));
    const w = 1080 * p;
    $('hookMain').style.width = w.toFixed(1) + 'px';
    $('hookGhost').style.width = (w * 0.94).toFixed(1) + 'px';
    $('hookHead').style.transform = 'translateX(' + (w - 6).toFixed(1) + 'px)';
    hookLine.style.opacity = (1 - inv(dur - 0.16, dur, t) * 0.85).toFixed(3);
    lcap(COPY.captions.hook, 124, 'var(--chalk)', t, dur, true);
  }

  function beatLWhat(t, dur) {
    show(world, true);
    mapArt.style.opacity = '1';
    show(hookLine, false);
    show(hookBrand, false);
    tokenEls.forEach((el) => { el.style.display = 'none'; });
    labelEls.forEach((el) => { el.style.display = 'none'; });
    drawFieldFrame({
      touch: easeOutCubic(inv(0.02, 0.40, t)),
      corners: easeOutCubic(inv(0.10, 0.48, t)),
      halfway: inv(0.12, 0.44, t),
      zone: easeInOutCubic(inv(0.18, 0.74, t)),
      zoneDash: inv(0.56, 0.80, t),
      zoneDot: inv(0.62, 0.76, t)
    });
    field.render(t + 3.0, { intensity: 0.42, speed: 0.9 });
    lcap(COPY.longCaptions.what, 112, 'var(--chalk)', t, dur, false);
  }

  function beatLSides(t, dur) {
    show(world, true);
    mapArt.style.opacity = '1';
    tokenEls.forEach((el) => { el.style.display = 'none'; });
    labelEls.forEach((el) => { el.style.display = 'none'; });
    drawFieldFrame({ touch: 1, corners: 1, halfway: 1, zone: 1, zoneDash: 1, zoneDot: 1 });
    field.render(t + 4.0, { intensity: 0.50, speed: 0.9 });
    const pHide = easeOutQuart(inv(0.02 * dur, 0.24 * dur, t));
    place(preyDot, LF_PREY[0], LF_PREY[1], 0.96 + 0.04 * pHide, pHide);
    const pShow = easeOutCubic(inv(0.30 * dur, 0.52 * dur, t));
    LF_HUNTERS.forEach((h, i) => {
      const drift = easeInOutCubic(inv(0.45 * dur, 0.90 * dur, t)) * 0.22;
      const x = lerp(h.c0[0], h.c1[0], drift);
      const y = lerp(h.c0[1], h.c1[1], drift);
      place(LF_HUNTER_ELS[i], x, y, 1, clamp01(pShow - i * 0.06));
    });
    const lp = easeOutCubic(inv(0.34 * dur, 0.52 * dur, t));
    place(labelPrey, LF_PREY[0] + 26, LF_PREY[1] - 50, 1, lp * 0.85);
    place(labelHunters, LF_HUNTERS[0].c0[0] + 24, LF_HUNTERS[0].c0[1] - 46, 1, lp * 0.85);
    const hiding = t < 0.44 * dur;
    lcap(hiding ? COPY.longCaptions.sidesHide : COPY.longCaptions.sidesHunt, 120, hiding ? 'var(--coral)' : 'var(--violet)', t, dur, false);
  }

  function beatLPhones(t, dur, globalT, tl) {
    show(world, true);
    mapArt.style.opacity = '1';
    tokenEls.forEach((el) => { el.style.display = 'none'; });
    labelEls.forEach((el) => { el.style.display = 'none'; });
    drawFieldFrame({ touch: 1, corners: 1, halfway: 1, zone: 1, zoneDash: 1, zoneDot: 1 });
    field.render(t + 5.0, { intensity: 0.45, speed: 0.9 });
    place(preyDot, 400, 1160, 1.05, 1);
    const pp = easeOutCubic(inv(0.04 * dur, 0.24 * dur, t));
    placePhone(phoneBig, 604, 620, 330, pp);
    const pingDot = phoneBig.querySelector('.ps-ping');
    if (pingDot) pingDot.style.opacity = ((Math.sin(t * 7) + 1) / 2 * pp).toFixed(3);
    const rl = mk.reportLine;
    rl.setAttribute('x1', 708); rl.setAttribute('y1', 1120);
    rl.setAttribute('x2', 432); rl.setAttribute('y2', 1156);
    rl.style.opacity = (0.55 * pp).toFixed(3);
    chasePings.forEach((pin, i) => {
      const p = (((t / 1.6) + i / 3) % 1);
      pin.setAttribute('cx', 400);
      pin.setAttribute('cy', 1160);
      pin.setAttribute('r', (22 + 150 * easeOutCubic(p)).toFixed(1));
      pin.style.opacity = (0.55 * (1 - p) * pp).toFixed(3);
    });
    show(clockEl, false);
    lcap(COPY.longCaptions.phones, 112, 'var(--coral)', t, dur, false);
  }

  function beatLTrack(t, dur) {
    show(world, true);
    mapArt.style.opacity = '1';
    tokenEls.forEach((el) => { el.style.display = 'none'; });
    labelEls.forEach((el) => { el.style.display = 'none'; });
    drawFieldFrame({ touch: 1, corners: 1, halfway: 1, zone: 1, zoneDash: 1, zoneDot: 1 });
    field.render(t + 6.0, { intensity: 0.55, speed: 1.0, converge: 0.18, attractors: [{ x: LF_PREY[0], y: LF_PREY[1], weight: 1 }] });
    const pDraw = easeInOutCubic(inv(0.05 * dur, 0.62 * dur, t));
    mk.trail.setAttribute('d', trailD(PREY_PATH, pDraw));
    mk.trail.style.opacity = '1';
    const pos = pointAlong(PREY_PATH, pDraw);
    place(preyDot, pos[0], pos[1], 1.04, 1);
    const starts = [[884, 470], [964, 640], [198, 540]];
    const pTrack = easeInOutCubic(inv(0.05 * dur, 0.92 * dur, t));
    starts.forEach((s, i) => {
      const x = lerp(s[0], pos[0] + 120 * (i - 1) + 30, pTrack);
      const y = lerp(s[1], pos[1] + 90 + i * 26, pTrack);
      place(LF_HUNTER_ELS[i], x, y, 1, clamp01(pTrack * 2));
    });
    placeDl(dls.map, 690, 430, easeOutCubic(inv(0.42 * dur, 0.60 * dur, t)), true);
    lcap(COPY.longCaptions.track, 112, 'var(--violet)', t, dur, false);
  }

  function beatLTag(t, dur, globalT, tl) {
    show(world, true);
    mapArt.style.opacity = '0.85';
    tokenEls.forEach((el) => { el.style.display = 'none'; });
    labelEls.forEach((el) => { el.style.display = 'none'; });
    drawFieldFrame({ touch: 1, corners: 1, halfway: 1, zone: 0, zoneDash: 0, zoneDot: 0 });
    field.render(t + 7.0, { intensity: 0.35, speed: 1.0 });
    const snapFrac = 0.62;
    const pClose = easeInOutCubic(inv(0.03 * dur, 0.58 * dur, t));
    const prey = [540, 900];
    place(preyDot, prey[0], prey[1], 1.14, 1);
    LF_HUNTERS.forEach((h, i) => {
      const ang = (i / LF_HUNTERS.length) * Math.PI * 2 - Math.PI / 2;
      const tx = prey[0] + Math.cos(ang) * 118;
      const ty = prey[1] + Math.sin(ang) * 118;
      place(LF_HUNTER_ELS[i], lerp(h.c0[0], tx, pClose), lerp(h.c0[1], ty, pClose), 1, 1);
    });
    const pSnap = easeInCubic(inv((snapFrac - 0.06) * dur, snapFrac * dur, t));
    const r = lerp(620, 54, pSnap);
    [mk.snapRing, mk.snapRing2].forEach((ring, i) => {
      ring.setAttribute('cx', prey[0]); ring.setAttribute('cy', prey[1]);
      ring.setAttribute('r', (r + i * 20).toFixed(1));
      ring.style.opacity = (0.95 * (0.30 + 0.70 * pSnap)).toFixed(3);
    });
    show(clockEl, false);
    if (t < 0.34 * dur) lcap(COPY.longCaptions.tagFind, 148, 'var(--chalk)', t, dur, false);
    else if (t < snapFrac * dur) lcap(COPY.longCaptions.tagTouch, 148, 'var(--violet)', t, dur, false);
    else lcap(COPY.longCaptions.tagTagged, 160, 'var(--violet)', t, dur, false);
  }

  function beatLRules(t, dur, globalT, tl) {
    show(world, true);
    mapArt.style.opacity = '1';
    tokenEls.forEach((el) => { el.style.display = 'none'; });
    labelEls.forEach((el) => { el.style.display = 'none'; });
    drawFieldFrame({ touch: 1, corners: 1, halfway: 1, zone: 1, zoneDash: 1, zoneDot: 1 });
    field.render(t + 8.0, { intensity: 0.5, speed: 1.0 });
    const zr = lerp(ZC.r, 272, easeInOutCubic(inv(0.05 * dur, 0.75 * dur, t)));
    mk.zoneRing.setAttribute('r', zr.toFixed(1));
    mk.zoneRing.setAttribute('stroke-dasharray', 'none');
    mk.zoneRing.setAttribute('stroke-dashoffset', '0');
    mk.zoneRing.style.opacity = '1';
    mk.zoneDash.setAttribute('r', (zr + 24).toFixed(1));
    mk.zoneDash.style.opacity = '0.30';
    mk.trail.setAttribute('d', trailD(PREY_PATH, 1));
    mk.trail.style.opacity = '1';
    place(preyDot, PREY_PATH[5][0], PREY_PATH[5][1], 1.04, 1);
    placeDl(dls.zone, 742, 690, easeOutCubic(inv(0.10 * dur, 0.30 * dur, t)), false);
    placeDl(dls.clock, 292, 252, easeOutCubic(inv(0.28 * dur, 0.48 * dur, t)), true);
    placeDl(dls.trail, 236, 1004, easeOutCubic(inv(0.46 * dur, 0.66 * dur, t)), false);
    showClock(globalT, tl);
    lcap(COPY.longCaptions.rules, 120, 'var(--cyan)', t, dur, false);
  }

  function beatLSetup(t, dur) {
    show(world, true);
    mapArt.style.opacity = '0.55';
    tokenEls.forEach((el) => { el.style.display = 'none'; });
    labelEls.forEach((el) => { el.style.display = 'none'; });
    hideMarks();
    field.render(t + 9.0, { intensity: 0.28, speed: 0.8 });
    const p = easeOutCubic(inv(0.06 * dur, 0.34 * dur, t));
    placePhone(phoneLeft, 148, 700, 268, p, -4);
    placePhone(phoneRight, 640, 700, 268, p, 4);
    const rl = mk.reportLine;
    rl.setAttribute('x1', 416); rl.setAttribute('y1', 1000);
    rl.setAttribute('x2', 640); rl.setAttribute('y2', 1000);
    rl.style.opacity = (0.55 * p).toFixed(3);
    show(codeChip, true);
    codeChip.style.opacity = p.toFixed(3);
    codeChip.style.transform = 'translateX(-50%) translateY(' + ((1 - p) * 18).toFixed(1) + 'px)';
    const makePhase = t < 0.55 * dur;
    lcap(makePhase ? COPY.longCaptions.setupMake : COPY.longCaptions.setupShare, 120, 'var(--cyan)', t, dur, false);
  }

  function beatLInstall(t, dur) {
    show(world, false);
    field.render(t + 10.0, { intensity: 0 });
    show(installCard, true);
    const p = easeOutCubic(inv(0.02, 0.28, t));
    installCard.style.opacity = p.toFixed(3);
    installCard.style.transform = 'translateX(-50%) translateY(' + ((1 - p) * 26).toFixed(1) + 'px)';
    lcap(COPY.longCaptions.install, 112, 'var(--cyan)', t, dur, false);
  }


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
    show(coverEl, true);
  }

  /* ── frame reset ──────────────────────────────────────────────────────── */
  function resetFrame() {
    show(world, false);
    show(clockEl, false);
    show(endcard, false);
    show(hookLine, false);
    show(hookBrand, false);
    show(coverEl, false);
    show(phonesEl, false);
    show(phoneBig, false);
    show(phoneLeft, false);
    show(phoneRight, false);
    show(labelsEl, false);
    show(codeChip, false);
    show(installCard, false);
    hideLcap();
    for (const k in dls) { dls[k].style.opacity = '0'; dls[k].style.display = 'none'; }
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

    /* one-frame hard cut to black at the end of the chase beat */
    const chaseBeat = tl.beats.find((b) => b.id === 'chase');
    if (chaseBeat) {
      const blackStart = chaseBeat.start + chaseBeat.dur - 1 / tl.fps;
      if (t >= blackStart && t < chaseBeat.start + chaseBeat.dur) blackout.style.opacity = '1';
    }
    /* longform: one black frame on the tag contact before the coral invert */
    const lTag = tl.beats.find((b) => b.id === 'l-tag');
    if (lTag) {
      const frac = tl.invertFrac == null ? 0.62 : tl.invertFrac;
      const blackStart = lTag.start + frac * lTag.dur - 1 / tl.fps;
      if (t >= blackStart && t < blackStart + 1 / tl.fps) blackout.style.opacity = '1';
    }

    /* two-frame coral inversion at the tag snap (15s film and longform cut) */
    const tagBeat = tl.beats.find((b) => b.id === 'tagged' || b.id === 'l-tag');
    if (tagBeat) {
      const frac = tl.invertFrac == null ? 0.18 : tl.invertFrac;
      const snap = tagBeat.start + frac * tagBeat.dur;
      const startFrame = Math.round(snap * tl.fps);          // exact 2 frames
      const frame = Math.round(t * tl.fps);
      if (frame >= startFrame && frame < startFrame + 2) invertEl.style.opacity = '1';
    }

    switch (beat.id) {
      case 'hook': beatHook(local, beat.dur); break;
      case 'teams': beatTeams(local, beat.dur); break;
      case 'clock': beatClock(local, beat.dur, t, tl); break;
      case 'chase': beatChase(local, beat.dur, t, tl); break;
      case 'tagged': beatTagged(local, beat.dur, t, tl); break;
      case 'l-hook': beatLHook(local, beat.dur); break;
      case 'l-what': beatLWhat(local, beat.dur); break;
      case 'l-sides': beatLSides(local, beat.dur); break;
      case 'l-phones': beatLPhones(local, beat.dur, t, tl); break;
      case 'l-track': beatLTrack(local, beat.dur); break;
      case 'l-tag': beatLTag(local, beat.dur, t, tl); break;
      case 'l-rules': beatLRules(local, beat.dur, t, tl); break;
      case 'l-setup': beatLSetup(local, beat.dur); break;
      case 'l-install': beatLInstall(local, beat.dur); break;
      case 'end': beatEnd(local, beat.dur, tl); break;
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
