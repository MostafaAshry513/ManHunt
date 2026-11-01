/* ============================================================================
   ManHunt — generated "borrowed pitch" block map (flat, chalk-on-asphalt)
   Seeded, deterministic, no external assets: dot grid + flat city blocks +
   street centre-lines. Decoration only; the field itself is public ground.
   ============================================================================ */
(function () {
  'use strict';

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    const e = document.createElementNS(NS, name);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function build(host, opts) {
    opts = opts || {};
    const rnd = mulberry32(opts.seed == null ? 20261101 : opts.seed);
    const W = 1080, H = 1920;
    const svg = el('svg', { viewBox: '0 0 1080 1920', width: W, height: H });

    /* flat asphalt base */
    svg.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: '#0B1220' }));

    /* dot grid — the block map's survey marks */
    const defs = el('defs');
    const minor = el('pattern', { id: 'dotGrid', width: 54, height: 54, patternUnits: 'userSpaceOnUse' });
    minor.appendChild(el('circle', { cx: 27, cy: 27, r: 1.5, fill: '#22D3EE', 'fill-opacity': 0.11 }));
    defs.appendChild(minor);
    const major = el('pattern', { id: 'dotGridMajor', width: 270, height: 270, patternUnits: 'userSpaceOnUse' });
    major.appendChild(el('circle', { cx: 135, cy: 135, r: 2.5, fill: '#22D3EE', 'fill-opacity': 0.18 }));
    defs.appendChild(major);
    svg.appendChild(defs);
    svg.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#dotGrid)' }));
    svg.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#dotGridMajor)' }));

    /* street grid: irregular avenues and cross-streets, flat fills only */
    const cols = [-60, 170, 430, 690, 950, 1140];
    const rows = [-80, 240, 610, 980, 1350, 1740, 2000];
    const blocks = el('g');
    let parkPlaced = false;

    for (let ci = 0; ci < cols.length - 1; ci++) {
      for (let ri = 0; ri < rows.length - 1; ri++) {
        // street corridors are the gaps between blocks
        const gap = 26 + rnd() * 26;
        const x = cols[ci] + gap / 2 + rnd() * 12;
        const y = rows[ri] + gap / 2 + rnd() * 12;
        const w = cols[ci + 1] - cols[ci] - gap - rnd() * 22;
        const h = rows[ri + 1] - rows[ri] - gap - rnd() * 18;
        if (w < 60 || h < 60) continue;
        if (rnd() < 0.10) continue; // open lot

        const isPark = !parkPlaced && rnd() < 0.10;
        if (isPark) parkPlaced = true;

        const r = el('rect', {
          x: x.toFixed(1), y: y.toFixed(1), width: w.toFixed(1), height: h.toFixed(1),
          rx: 10,
          fill: isPark ? '#0C2026' : '#0E1727',
          'fill-opacity': isPark ? 0.9 : 0.72,
          stroke: isPark ? '#22D3EE' : '#E6EDF7',
          'stroke-opacity': isPark ? 0.16 : 0.075,
          'stroke-width': 2
        });
        blocks.appendChild(r);

        /* one flat inner mark so blocks are not empty rectangles */
        if (!isPark && rnd() < 0.28) {
          const iw = w * (0.22 + rnd() * 0.18);
          const ih = h * (0.22 + rnd() * 0.18);
          blocks.appendChild(el('rect', {
            x: (x + w * 0.5 - iw / 2).toFixed(1),
            y: (y + h * 0.5 - ih / 2).toFixed(1),
            width: iw.toFixed(1), height: ih.toFixed(1), rx: 4,
            fill: '#E6EDF7', 'fill-opacity': 0.035
          }));
        }
      }
    }
    svg.appendChild(blocks);

    /* street centre-lines (chalk hairlines) */
    const streets = el('g', { stroke: '#E6EDF7', 'stroke-opacity': 0.10, 'stroke-width': 2 });
    cols.slice(1, -1).forEach((x, i) => {
      streets.appendChild(el('line', { x1: x, y1: 0, x2: x + (i % 2 ? 26 : -22), y2: H, 'stroke-dasharray': '18 26' }));
    });
    rows.slice(1, -1).forEach((y, i) => {
      streets.appendChild(el('line', { x1: 0, y1: y, x2: W, y2: y + (i % 2 ? -18 : 16), 'stroke-dasharray': '18 26' }));
    });
    svg.appendChild(streets);

    /* chalk specks — asphalt texture, flat dots */
    const specks = el('g', { fill: '#E6EDF7' });
    for (let i = 0; i < 90; i++) {
      specks.appendChild(el('circle', {
        cx: (rnd() * W).toFixed(1), cy: (rnd() * H).toFixed(1),
        r: (0.6 + rnd() * 1.5).toFixed(2), 'fill-opacity': (0.03 + rnd() * 0.05).toFixed(3)
      }));
    }
    svg.appendChild(specks);

    /* small north mark, bottom-left, chalk */
    const north = el('g', { stroke: '#E6EDF7', 'stroke-opacity': 0.34, 'stroke-width': 2.5, fill: 'none' });
    north.appendChild(el('line', { x1: 118, y1: 1798, x2: 118, y2: 1850 }));
    north.appendChild(el('path', { d: 'M111 1812 L118 1798 L125 1812' }));
    north.appendChild(el('line', { x1: 40, y1: 1850, x2: 196, y2: 1850, 'stroke-dasharray': '2 8' }));
    const nlabel = el('text', {
      x: 142, y: 1824, fill: '#E6EDF7', 'fill-opacity': 0.4,
      'font-family': "'Red Hat Mono', monospace", 'font-size': 20, 'letter-spacing': 3
    });
    nlabel.textContent = 'N';
    north.appendChild(nlabel);
    svg.appendChild(north);

    host.innerHTML = '';
    host.appendChild(svg);
  }

  window.MHMap = { build: build };
})();
