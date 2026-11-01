/* ============================================================================
   ManHunt motion kit — stage builder + deterministic renderer
   ----------------------------------------------------------------------------
   One artboard per surface. Every frame is a pure function of loop phase, so
   frames are reproducible and loop seamlessly:
       window.renderAt(tSeconds)   -> paints the frame (t wraps by MH_LOOP_SECONDS)
       window.MH_READY === true    -> fonts loaded, first frame painted, capturable
   The official Open Zone lockup is injected from src/generated/lockup.js
   (verbatim from design/brand/identity/final/lockup/ — never retyped).
   ============================================================================ */
(async function () {
  'use strict';

  const C = window.MHCore;
  if (!C) throw new Error('motion-core.js failed to load');
  const NS = 'http://www.w3.org/2000/svg';
  const q = new URLSearchParams(location.search);
  const ART_NAME = q.get('art') || 'readme-hero';
  const WITH_SLOGAN = q.get('slogan') !== '0';
  const LOCK = window.MH_LOCKUP_SVG || {};

  const stage = document.getElementById('stage');
  const artHost = document.getElementById('artHost');
  const ui = document.getElementById('ui');

  /* ── helpers ────────────────────────────────────────────────────────────── */
  function el(name, attrs) {
    const node = document.createElementNS(NS, name);
    if (attrs) for (const key in attrs) node.setAttribute(key, attrs[key]);
    return node;
  }
  function div(cls, css) {
    const node = document.createElement('div');
    node.className = cls;
    if (css) node.style.cssText = css;
    return node;
  }
  function inlineSvg(markup) {
    const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw new Error('lockup SVG failed to parse');
    const svg = document.importNode(doc.documentElement, true);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    if (!svg.getAttribute('viewBox')) throw new Error('lockup SVG has no viewBox');
    return svg;
  }

  /* ── artboards ───────────────────────────────────────────────────────────
     Sizes are the surfaces' real pixel sizes. Copy is provisional brand
     copy v2 (design/brand/strategy/slogan-v2.md): flagship hook
     "Your friends are hunting you." — install-page surfaces use the short
     form instead and live in site-hero/. Slogan=0 renders the fallback. */
  const ARTS = {
    'readme-hero': {
      w: 1280, h: 480, seed: 20261101,
      radar: { cx: 946, cy: 244, r: 184, hunters: 5, squash: 0.94 },
      markings: { inset: 22, corner: 46, halfway: false },
      ui: {
        x: 64,
        lockup: { key: 'horizontal', w: 330, y: 50 },
        hook: { size: 54, y: 168, lines: ['Your friends are', 'hunting you.'] },
        desc: { size: 15.5, y: 298, text: 'Real-world GPS hide-and-seek for Android.' },
        legend: { size: 11.5, y: 334 },
        micro: { size: 12.5, y: 440, text: 'free APK · Android 8+ · not on Play Store' },
        alt: { descY: 232, legendY: 276 },
      },
    },
    'gh-social': {
      w: 1280, h: 640, seed: 20261101,
      radar: { cx: 952, cy: 326, r: 248, hunters: 5, squash: 0.94 },
      markings: { inset: 24, corner: 52, halfway: false },
      ui: {
        x: 64,
        lockup: { key: 'horizontal', w: 360, y: 56 },
        hook: { size: 60, y: 196, lines: ['Your friends are', 'hunting you.'] },
        desc: { size: 16.5, y: 354, text: 'Real-world GPS hide-and-seek for Android.' },
        legend: { size: 12, y: 392 },
        cta: { size: 15, y: 432, text: 'Create a hunt. Send the code. Hide.' },
        url: { size: 13, y: 550, text: 'github.com/MostafaAshry513/ManHunt' },
        micro: { size: 12.5, y: 580, text: 'free APK · Android 8+ · not on Play Store' },
        alt: { descY: 250, legendY: 294 },
      },
    },
    'x-header': {
      w: 1500, h: 500, seed: 20261101,
      radar: { cx: 1200, cy: 250, r: 180, hunters: 5, squash: 0.94 },
      markings: { inset: 24, corner: 48, halfway: false },
      ui: {
        x: 190,
        lockup: { key: 'horizontal', w: 300, y: 74 },
        hook: { size: 54, y: 188, lines: ['Your friends are', 'hunting you.'] },
        desc: { size: 15.5, y: 300, text: 'Real-world GPS hide-and-seek for Android.' },
        legend: { size: 11, y: 334 },
        cta: { size: 14, y: 368, text: 'Create a hunt. Send the code. Hide.' },
        micro: { size: 11, y: 462, align: 'right', x: 1420, text: 'free APK · Android 8+ · not on Play Store' },
        alt: { descY: 188, legendY: 230 },
      },
    },
    'youtube': {
      w: 2560, h: 1440, seed: 20261101,
      radar: { cx: 2000, cy: 720, r: 240, hunters: 5, squash: 0.94 },
      markings: { inset: 46, corner: 110, halfway: true },
      ui: {
        x: 560,
        lockup: { key: 'horizontal', w: 420, y: 548 },
        hook: { size: 72, y: 688, lines: ['Your friends are hunting you.'] },
        desc: { size: 24, y: 806, text: 'Real-world GPS hide-and-seek for Android.' },
        legend: { size: 18, y: 848 },
        micro: { size: 18, y: 884, text: 'free APK · Android 8+ · not on Play Store' },
        alt: { descY: 688, legendY: 730 },
      },
    },
    'discord': {
      w: 960, h: 540, seed: 20261101,
      radar: { cx: 712, cy: 278, r: 152, hunters: 5, squash: 0.94 },
      markings: { inset: 20, corner: 40, halfway: false },
      ui: {
        x: 52,
        lockup: { key: 'horizontal', w: 250, y: 52 },
        hook: { size: 38, y: 146, lines: ['Your friends are', 'hunting you.'] },
        desc: { size: 13.5, y: 244, text: 'Real-world GPS hide-and-seek for Android.' },
        legend: { size: 10.5, y: 274 },
        cta: { size: 12.5, y: 308, text: 'Create a hunt. Send the code. Hide.' },
        micro: { size: 11, y: 500, text: 'free APK · Android 8+ · not on Play Store' },
        alt: { descY: 148, legendY: 190 },
      },
    },
    'app-banner': {
      w: 1080, h: 480, seed: 20261101,
      radar: { cx: 742, cy: 240, r: 168, hunters: 2, squash: 0.92 },
      markings: { inset: 22, corner: 44, halfway: false },
      ui: null,
    },
  };

  const art = ARTS[ART_NAME];
  if (!art) throw new Error('unknown art: ' + ART_NAME);
  const LOOP = 5.0;

  /* ── field: borrowed pitch + block map ──────────────────────────────────── */
  function addBlocks(svg, w, h, seed, fade) {
    const rnd = C.mulberry32(seed ^ 0x9e3779b9);
    const cell = Math.max(104, Math.min(240, w / 8.5));
    const cols = [];
    const rows = [];
    for (let x = -cell * 0.5; x < w + cell; x += cell * (0.82 + rnd() * 0.42)) cols.push(x);
    for (let y = -cell * 0.55; y < h + cell; y += cell * (0.66 + rnd() * 0.38)) rows.push(y);
    const g = el('g');
    for (let i = 0; i < cols.length - 1; i++) {
      for (let j = 0; j < rows.length - 1; j++) {
        const gap = 10 + rnd() * 16;
        const bx = cols[i] + gap / 2 + rnd() * 8;
        const by = rows[j] + gap / 2 + rnd() * 8;
        const bw = cols[i + 1] - cols[i] - gap - rnd() * 16;
        const bh = rows[j + 1] - rows[j] - gap - rnd() * 12;
        if (bw < 54 || bh < 40) continue;
        if (rnd() < 0.13) continue;
        const park = rnd() < 0.055;
        g.appendChild(el('rect', {
          x: bx.toFixed(1), y: by.toFixed(1), width: bw.toFixed(1), height: bh.toFixed(1), rx: 7,
          fill: park ? '#0C2026' : '#0E1727',
          'fill-opacity': (park ? 0.9 : 0.7) * fade,
          stroke: park ? '#22D3EE' : '#E6EDF7',
          'stroke-opacity': (park ? 0.15 : 0.065) * fade,
          'stroke-width': 1.5,
        }));
      }
    }
    svg.appendChild(g);
  }

  function addChalkSpecks(svg, w, h, seed) {
    const rnd = C.mulberry32(seed ^ 0x51ed270b);
    const g = el('g', { fill: '#E6EDF7' });
    const count = Math.round((w * h) / 9000);
    for (let i = 0; i < count; i++) {
      g.appendChild(el('circle', {
        cx: (rnd() * w).toFixed(1), cy: (rnd() * h).toFixed(1),
        r: (0.5 + rnd() * 1.5).toFixed(2),
        'fill-opacity': (0.03 + rnd() * 0.055).toFixed(3),
      }));
    }
    svg.appendChild(g);
  }

  function addMarkings(svg, w, h, cfg) {
    const inset = cfg.inset;
    const g = el('g', { fill: 'none', stroke: '#E6EDF7', 'stroke-linecap': 'round' });
    /* touchline frame — the borrowed pitch */
    g.appendChild(el('rect', {
      x: inset, y: inset, width: w - inset * 2, height: h - inset * 2,
      'stroke-opacity': 0.30, 'stroke-width': 2.5,
    }));
    /* corner arcs */
    const arcR = cfg.corner;
    const corners = [
      `M${inset + 2},${inset + arcR} A${arcR},${arcR} 0 0 1 ${inset + arcR},${inset + 2}`,
      `M${w - inset - 2},${inset + arcR} A${arcR},${arcR} 0 0 0 ${w - inset - arcR},${inset + 2}`,
      `M${inset + 2},${h - inset - arcR} A${arcR},${arcR} 0 0 0 ${inset + arcR},${h - inset - 2}`,
      `M${w - inset - 2},${h - inset - arcR} A${arcR},${arcR} 0 0 1 ${w - inset - arcR},${h - inset - 2}`,
    ];
    const arcs = el('g', { 'stroke-opacity': 0.22, 'stroke-width': 2.5 });
    corners.forEach((d) => arcs.appendChild(el('path', { d })));
    g.appendChild(arcs);
    if (cfg.halfway) {
      g.appendChild(el('line', {
        x1: w / 2, y1: inset, x2: w / 2, y2: h - inset,
        'stroke-opacity': 0.16, 'stroke-width': 2, 'stroke-dasharray': '16 22',
      }));
    }
    /* registration ticks at the plate edge (print-feeling, chalk) */
    const ticks = el('g', { 'stroke-opacity': 0.26, 'stroke-width': 2 });
    const t = 16;
    const pad = 8;
    [
      `M${pad},${pad + t} L${pad},${pad} L${pad + t},${pad}`,
      `M${w - pad - t},${pad} L${w - pad},${pad} L${w - pad},${pad + t}`,
      `M${pad},${h - pad - t} L${pad},${h - pad} L${pad + t},${h - pad}`,
      `M${w - pad - t},${h - pad} L${w - pad},${h - pad} L${w - pad},${h - pad - t}`,
    ].forEach((d) => ticks.appendChild(el('path', { d })));
    g.appendChild(ticks);
    svg.appendChild(g);
  }

  function buildField(w, h, seed, markings) {
    const svg = el('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}` });
    svg.appendChild(el('rect', { x: 0, y: 0, width: w, height: h, fill: '#0B1220' }));
    addBlocks(svg, w, h, seed, 1);
    /* survey dot grid — the block map's marks */
    const defs = el('defs');
    const spacing = Math.max(34, Math.min(54, Math.round(Math.min(w, h) / 11)));
    const minor = el('pattern', { id: 'mhDots', width: spacing, height: spacing, patternUnits: 'userSpaceOnUse' });
    minor.appendChild(el('circle', { cx: spacing / 2, cy: spacing / 2, r: 1.4, fill: '#22D3EE', 'fill-opacity': 0.1 }));
    const major = el('pattern', { id: 'mhDotsMajor', width: spacing * 5, height: spacing * 5, patternUnits: 'userSpaceOnUse' });
    major.appendChild(el('circle', { cx: (spacing * 5) / 2, cy: (spacing * 5) / 2, r: 2.4, fill: '#22D3EE', 'fill-opacity': 0.17 }));
    defs.appendChild(minor);
    defs.appendChild(major);
    svg.appendChild(defs);
    svg.appendChild(el('rect', { x: 0, y: 0, width: w, height: h, fill: 'url(#mhDots)' }));
    svg.appendChild(el('rect', { x: 0, y: 0, width: w, height: h, fill: 'url(#mhDotsMajor)' }));
    addChalkSpecks(svg, w, h, seed);
    addMarkings(svg, w, h, markings);
    return svg;
  }

  /* ── the Open Zone radar (the signature element) ────────────────────────── */
  const TAU = Math.PI * 2;

  function chalkCirclePath(cx, cy, r, seed) {
    const rnd = C.mulberry32(seed ^ 0x2545f491);
    const pts = [];
    const n = 72;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      const wob = 1 + (rnd() - 0.5) * 0.014 + Math.sin(a * 3 + 1.7) * 0.006 + Math.sin(a * 7 + 0.4) * 0.004;
      pts.push([cx + r * wob * Math.cos(a), cy + r * wob * Math.sin(a) * 0.985]);
    }
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) d += `L${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`;
    return d + 'Z';
  }

  function buildRadar(svg, cfg, seed) {
    const refs = {};
    const g = el('g');
    const { cx, cy, r } = cfg;

    /* scope: a flat, slightly darker disc so the radar reads over the blocks */
    g.appendChild(el('circle', { cx, cy, r: r * 1.17, fill: '#07101C', 'fill-opacity': 0.62 }));

    /* crosshair hairlines + bearing ticks */
    const hair = el('g', { stroke: '#22D3EE', 'stroke-opacity': 0.09, 'stroke-width': 1 });
    hair.appendChild(el('line', { x1: cx - r * 1.17, y1: cy, x2: cx + r * 1.17, y2: cy }));
    hair.appendChild(el('line', { x1: cx, y1: cy - r * 1.17, x2: cx, y2: cy + r * 1.17 }));
    g.appendChild(hair);
    const ticks = el('g', { stroke: '#22D3EE', 'stroke-opacity': 0.26, 'stroke-width': 1.4 });
    for (let i = 0; i < 36; i++) {
      const deg = i * 10;
      const a = C.polar(cx, cy, r * 1.105, deg);
      const b = C.polar(cx, cy, r * (i % 9 === 0 ? 1.155 : 1.13), deg);
      ticks.appendChild(el('line', { x1: a.x.toFixed(1), y1: a.y.toFixed(1), x2: b.x.toFixed(1), y2: b.y.toFixed(1) }));
    }
    g.appendChild(ticks);
    g.appendChild(el('circle', {
      cx, cy, r: r * 1.115, fill: 'none', stroke: '#22D3EE',
      'stroke-opacity': 0.2, 'stroke-width': 1.5, 'stroke-dasharray': '2 10',
    }));

    /* bearing rings — the radar's own distance scale */
    refs.zoneInner = el('circle', {
      cx, cy, r: r * 0.68, fill: 'none', stroke: '#22D3EE', 'stroke-opacity': 0.1, 'stroke-width': 1,
      'stroke-dasharray': '2 12',
    });
    g.appendChild(refs.zoneInner);

    /* the zone was drawn on the ground in chalk; the radar is its overlay */
    g.appendChild(el('path', {
      d: chalkCirclePath(cx, cy, r, seed), fill: 'none', stroke: '#E6EDF7',
      'stroke-opacity': 0.19, 'stroke-width': 2.4, 'stroke-linecap': 'round',
    }));

    /* official zone ring: cyan, drawn with the Open Zone gap */
    refs.zone = el('path', { fill: 'none', stroke: '#22D3EE', 'stroke-width': 4 });
    g.appendChild(refs.zone);

    /* radar sweep (two flat cones + leading edge + tip dot) */
    const sweepWrap = el('g', { transform: `translate(${cx} ${cy})` });
    refs.sweep = el('g');
    refs.sweep.appendChild(el('path', { d: C.sweepWedge(r * 0.995, 42), fill: '#22D3EE', 'fill-opacity': 0.042 }));
    refs.sweep.appendChild(el('path', { d: C.sweepWedge(r * 0.995, 104), fill: '#22D3EE', 'fill-opacity': 0.018 }));
    refs.sweep.appendChild(el('line', {
      x1: 0, y1: 0, x2: r * 1.1, y2: 0, stroke: '#22D3EE', 'stroke-opacity': 0.5, 'stroke-width': 1.6,
    }));
    refs.sweep.appendChild(el('circle', { cx: r * 1.1, cy: 0, r: 3, fill: '#22D3EE', 'fill-opacity': 0.9 }));
    sweepWrap.appendChild(refs.sweep);
    g.appendChild(sweepWrap);

    /* coral pursuit trail */
    refs.trail = el('polyline', {
      fill: 'none', stroke: '#FF7A59', 'stroke-width': 4,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-opacity': 0.6,
    });
    g.appendChild(refs.trail);

    /* report pings */
    refs.pings = [];
    for (let i = 0; i < 3; i++) {
      const ping = el('circle', { cx: 0, cy: 0, r: 0, fill: 'none', stroke: '#FF7A59', 'stroke-width': 2.6, 'stroke-opacity': 0 });
      refs.pings.push(ping);
      g.appendChild(ping);
    }

    /* hunters: violet dot + flat ring + sweep blip ring */
    refs.hunters = [];
    for (let i = 0; i < cfg.hunters; i++) {
      const wrap = el('g');
      const blip = el('circle', { r: 0, fill: 'none', stroke: '#A79BFF', 'stroke-width': 1.4, 'stroke-opacity': 0 });
      const ring = el('circle', { r: 13, fill: 'none', stroke: '#A79BFF', 'stroke-opacity': 0.4, 'stroke-width': 1.6 });
      const dot = el('circle', { r: 7, fill: '#A79BFF' });
      wrap.appendChild(blip);
      wrap.appendChild(ring);
      wrap.appendChild(dot);
      g.appendChild(wrap);
      refs.hunters.push({ wrap, blip, ring, dot });
    }

    /* prey: coral dot + ring + sweep blip ring */
    refs.prey = el('g');
    refs.preyBlip = el('circle', { r: 0, fill: 'none', stroke: '#FF7A59', 'stroke-width': 2, 'stroke-opacity': 0 });
    refs.preyRing = el('circle', { r: 17, fill: 'none', stroke: '#FF7A59', 'stroke-opacity': 0.5, 'stroke-width': 2 });
    refs.preyDot = el('circle', { r: 9.5, fill: '#FF7A59' });
    refs.prey.appendChild(refs.preyBlip);
    refs.prey.appendChild(refs.preyRing);
    refs.prey.appendChild(refs.preyDot);
    g.appendChild(refs.prey);

    svg.appendChild(g);
    return refs;
  }

  function updateRadar(refs, cfg, tau) {
    const f = C.radarFrame(cfg, tau);
    const px = (v) => v.toFixed(2);
    refs.zone.setAttribute('d', f.zonePath);
    refs.sweep.setAttribute('transform', `rotate(${px(f.sweep)})`);
    refs.trail.setAttribute('points', f.trail.map((p) => px(p.x) + ',' + px(p.y)).join(' '));
    refs.trail.setAttribute('stroke-opacity', '0.58');

    refs.prey.setAttribute('transform', `translate(${px(f.prey.x)} ${px(f.prey.y)})`);
    const pb = f.preyBlip;
    refs.preyDot.setAttribute('r', px(9.5 * (1 + 0.2 * pb)));
    refs.preyRing.setAttribute('r', px(17 + 7 * pb));
    refs.preyRing.setAttribute('stroke-opacity', (0.48 + 0.4 * pb).toFixed(3));
    refs.preyBlip.setAttribute('r', px(12 + 30 * pb));
    refs.preyBlip.setAttribute('stroke-opacity', (0.4 * pb).toFixed(3));

    refs.hunters.forEach((h, i) => {
      const pose = f.hunters[i];
      h.wrap.setAttribute('transform', `translate(${px(pose.x)} ${px(pose.y)})`);
      const b = f.hunterBlips[i] || 0;
      h.dot.setAttribute('r', px(7 * (1 + 0.16 * b)));
      h.ring.setAttribute('r', px(13 + 5 * b));
      h.ring.setAttribute('stroke-opacity', (0.38 + 0.3 * b).toFixed(3));
      h.blip.setAttribute('r', px(10 + 22 * b));
      h.blip.setAttribute('stroke-opacity', (0.3 * b).toFixed(3));
    });

    refs.pings.forEach((ping, i) => {
      const p = f.pings[i];
      if (!p) {
        ping.setAttribute('r', 0);
        ping.setAttribute('stroke-opacity', 0);
        return;
      }
      ping.setAttribute('cx', px(p.x));
      ping.setAttribute('cy', px(p.y));
      ping.setAttribute('r', px(p.r));
      ping.setAttribute('stroke-opacity', p.o.toFixed(3));
    });
  }

  /* ── type layer ─────────────────────────────────────────────────────────── */
  function buildUI() {
    const cfg = art.ui;
    if (!cfg) return;
    const slogan = WITH_SLOGAN && cfg.hook;
    const descY = slogan ? cfg.desc.y : cfg.alt.descY;
    const legendY = slogan ? cfg.legend.y : cfg.alt.legendY;

    if (cfg.lockup && LOCK[cfg.lockup.key]) {
      const wrap = div('mh-lockup', `left:${cfg.x}px;top:${cfg.lockup.y}px;width:${cfg.lockup.w}px`);
      wrap.appendChild(inlineSvg(LOCK[cfg.lockup.key].svg));
      wrap.firstChild.setAttribute('role', 'img');
      wrap.firstChild.setAttribute('aria-label', 'ManHunt');
      ui.appendChild(wrap);
    }

    if (slogan) {
      const h = cfg.hook;
      const barH = Math.max(4, Math.round(h.size * 0.085));
      const ruleY = h.y - Math.round(h.size * 0.56);
      const barW = Math.round(h.size * 1.32);
      ui.appendChild(div('mh-rule', `left:${cfg.x}px;top:${ruleY}px;width:${barW}px;height:${barH}px`));
      ui.appendChild(div('mh-rule', `left:${cfg.x + barW + 8}px;top:${ruleY}px;width:${Math.round(h.size * 0.46)}px;height:${barH}px;background:#22D3EE;opacity:.9`));
      const hook = div('mh-hook', `left:${cfg.x}px;top:${h.y}px;font-size:${h.size}px`);
      hook.innerHTML = h.lines.join('<br>');
      ui.appendChild(hook);
    }

    if (cfg.desc) {
      const d = div('mh-desc', `left:${cfg.x}px;top:${descY}px;font-size:${cfg.desc.size}px`);
      d.textContent = cfg.desc.text;
      ui.appendChild(d);
    }

    if (cfg.legend) {
      const lg = div('mh-legend', `left:${cfg.x}px;top:${legendY}px;font-size:${cfg.legend.size}px`);
      const dot = Math.max(7, Math.round(cfg.legend.size * 0.82));
      lg.innerHTML =
        `<span class="lg"><i class="dot" style="width:${dot}px;height:${dot}px;background:#FF7A59"></i>PREY</span>` +
        `<span class="lg"><i class="dot" style="width:${dot}px;height:${dot}px;background:#A79BFF"></i>HUNTERS</span>`;
      ui.appendChild(lg);
    }

    if (cfg.cta) {
      const c = div('mh-cta', `left:${cfg.x}px;top:${cfg.cta.y}px;font-size:${cfg.cta.size}px`);
      c.textContent = cfg.cta.text;
      ui.appendChild(c);
    }

    if (cfg.url) {
      const u = div('mh-url', `left:${cfg.x}px;top:${cfg.url.y}px;font-size:${cfg.url.size}px`);
      u.textContent = cfg.url.text;
      ui.appendChild(u);
    }

    if (cfg.micro) {
      const m = cfg.micro;
      const pos = m.align === 'right' ? `right:${art.w - m.x}px;` : `left:${cfg.x}px;`;
      const micro = div('mh-micro', `${pos}top:${m.y}px;font-size:${m.size}px`);
      micro.textContent = m.text;
      ui.appendChild(micro);
    }
  }

  /* ── assemble ───────────────────────────────────────────────────────────── */
  stage.style.width = art.w + 'px';
  stage.style.height = art.h + 'px';
  const svg = buildField(art.w, art.h, art.seed, art.markings);
  const radarRefs = buildRadar(svg, art.radar, art.seed);
  artHost.appendChild(svg);
  buildUI();

  function renderAt(tSeconds) {
    const tau = (((tSeconds / LOOP) % 1) + 1) % 1;
    updateRadar(radarRefs, art.radar, tau);
    return tau;
  }
  window.renderAt = renderAt;
  window.MH_LOOP_SECONDS = LOOP;
  window.MH_ART = ART_NAME;
  window.MH_WITH_SLOGAN = WITH_SLOGAN;

  renderAt(0);
  try { await document.fonts.ready; } catch (err) { /* fonts still render */ }
  renderAt(0);
  window.MH_READY = true;
})().catch((err) => {
  console.error('[stage] ' + (err && err.stack ? err.stack : err));
  window.MH_ERROR = String(err);
});
