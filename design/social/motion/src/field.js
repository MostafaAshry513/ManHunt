/* ============================================================================
   Search Field — deterministic generative layer for the ManHunt short.
   Philosophy: docs/algorithmic-philosophy.md
   Every position is a closed-form function of virtual time t, so a frame at
   t = 7.42 s is always identical. No wall clock, no unseeded randomness.
   ============================================================================ */
(function () {
  'use strict';

  /* ── seeded rng (mulberry32) ─────────────────────────────────────────── */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const TAU = Math.PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };

  const TONES = [
    { rgb: '34,211,238', weight: 0.84 },  // cyan  — the scanner
    { rgb: '255,122,89', weight: 0.09 },  // coral — prey heat
    { rgb: '167,155,255', weight: 0.07 }  // violet — hunter intent
  ];

  function pickTone(r) {
    let x = r();
    for (let i = 0; i < TONES.length; i++) {
      x -= TONES[i].weight;
      if (x <= 0) return i;
    }
    return 0;
  }

  function create(canvas, opts) {
    opts = opts || {};
    const W = canvas.width;
    const H = canvas.height;
    const ctx = canvas.getContext('2d');
    const rnd = mulberry32(opts.seed == null ? 20261101 : opts.seed);

    /* ── searchers ───────────────────────────────────────────────────────
       Each searcher: a home position, two noise octaves, a persistence and
       a personal pull toward whatever beacon is currently declared. */
    const N = opts.count || 540;
    const searchers = [];
    for (let i = 0; i < N; i++) {
      searchers.push({
        x: rnd() * W,
        y: rnd() * H,
        amp: 26 + rnd() * 118,
        phase: rnd() * TAU,
        speed: 0.16 + rnd() * 0.62,
        sway: 0.4 + rnd() * 0.9,
        tone: pickTone(rnd),
        pull: 0.45 + rnd() * 0.9,
        len: 0.8 + rnd() * 1.5
      });
    }

    /* ── dust: evidence of the field, not searchers ────────────────────── */
    const D = opts.dust == null ? 220 : opts.dust;
    const dust = [];
    for (let i = 0; i < D; i++) {
      dust.push({
        x: rnd() * W,
        y: rnd() * H,
        amp: 10 + rnd() * 40,
        phase: rnd() * TAU,
        speed: 0.08 + rnd() * 0.3,
        tone: pickTone(rnd),
        size: rnd() < 0.74 ? 1.4 : 2.4
      });
    }

    function searcherPos(p, t, attractors, converge) {
      // Two-octave noise: slow field + personal hesitation.
      const o1x = Math.sin(p.phase + t * p.speed * 1.7) * p.amp;
      const o1y = Math.cos(p.phase * 1.31 + t * p.speed * 1.13) * p.amp * 1.18;
      const o2x = Math.cos(p.phase * 2.37 + t * p.speed * 0.53) * p.amp * 0.42;
      const o2y = Math.sin(p.phase * 1.77 + t * p.speed * 0.71) * p.amp * 0.36;
      let x = p.x + o1x + o2x;
      let y = p.y + o1y + o2y;

      if (attractors && attractors.length && converge > 0) {
        // Weighted pull toward declared beacons; nearer beacons pull harder.
        let bx = 0, by = 0, bw = 0;
        for (let k = 0; k < attractors.length; k++) {
          const a = attractors[k];
          const dx = a.x - x, dy = a.y - y;
          const d = Math.sqrt(dx * dx + dy * dy) + 1;
          const w = (a.weight || 1) / d;
          bx += a.x * w; by += a.y * w; bw += w;
        }
        if (bw > 0) {
          bx /= bw; by /= bw;
          const f = clamp01(converge * p.pull);
          x = lerp(x, bx, f);
          y = lerp(y, by, f);
        }
      }
      return [x, y];
    }

    function render(t, state) {
      state = state || {};
      const intensity = state.intensity == null ? 1 : state.intensity;
      const converge = state.converge == null ? 0 : state.converge;
      const attractors = state.attractors || null;
      const speedScale = state.speed == null ? 1 : state.speed;
      const t2 = t * speedScale;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);

      /* dust first */
      for (let i = 0; i < dust.length; i++) {
        const p = dust[i];
        const x = p.x + Math.sin(p.phase + t2 * p.speed * 1.4) * p.amp;
        const y = p.y + Math.cos(p.phase * 1.7 + t2 * p.speed * 1.1) * p.amp * 1.2;
        ctx.fillStyle = 'rgba(' + TONES[p.tone].rgb + ',' + (0.05 * intensity).toFixed(3) + ')';
        ctx.fillRect(x, y, p.size, p.size);
      }

      /* searchers: three fading trail passes, batched per tone */
      const STEP = 0.085;
      const PASSES = 3;
      for (let pass = 0; pass < PASSES; pass++) {
        const alpha = (pass === 0 ? 0.24 : pass === 1 ? 0.13 : 0.06) * intensity;
        if (alpha <= 0.003) continue;
        for (let tone = 0; tone < TONES.length; tone++) {
          const path = new Path2D();
          let any = false;
          for (let i = 0; i < searchers.length; i++) {
            const p = searchers[i];
            if (p.tone !== tone) continue;
            const ta = t2 - pass * STEP * p.len;
            const tb = ta - STEP * p.len;
            const a = searcherPos(p, ta, attractors, converge);
            const b = searcherPos(p, tb, attractors, converge);
            path.moveTo(a[0], a[1]);
            path.lineTo(b[0], b[1]);
            any = true;
          }
          if (!any) continue;
          ctx.strokeStyle = 'rgba(' + TONES[tone].rgb + ',' + alpha.toFixed(3) + ')';
          ctx.lineWidth = pass === 0 ? 2.0 : 1.4;
          ctx.lineCap = 'round';
          ctx.stroke(path);
        }
      }

      /* heads: a brighter point on the newest position of every searcher */
      for (let tone = 0; tone < TONES.length; tone++) {
        const path = new Path2D();
        for (let i = 0; i < searchers.length; i++) {
          const p = searchers[i];
          if (p.tone !== tone) continue;
          const a = searcherPos(p, t2, attractors, converge);
          path.moveTo(a[0] + 0.8, a[1] + 0.8);
          path.lineTo(a[0] - 0.8, a[1] - 0.8);
        }
        ctx.strokeStyle = 'rgba(' + TONES[tone].rgb + ',' + (0.42 * intensity).toFixed(3) + ')';
        ctx.lineWidth = 2.6;
        ctx.stroke(path);
      }
    }

    return { render: render, width: W, height: H };
  }

  window.MHField = { create: create, RNG: mulberry32 };
})();
