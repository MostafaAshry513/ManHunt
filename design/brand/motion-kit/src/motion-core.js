/* ============================================================================
   ManHunt — motion core: "Perpetual Pursuit"
   ----------------------------------------------------------------------------
   Pure, deterministic, seeded maths for the Open Zone radar. No DOM, no clock:
   every value is a function of loop phase tau ∈ [0,1). Frame 0 and frame 1 are
   identical, so any loop renders seamlessly.

   Loaded three ways:
     - browser stage   (window.MHCore)
     - site-hero build (Node evaluates this file and reads globalThis.MHCore)
     - docs / tests    (same)
   ============================================================================ */
(function (root) {
  'use strict';

  const TAU = Math.PI * 2;
  const DEG = Math.PI / 180;

  /** Deterministic 32-bit PRNG (mulberry32). */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const mod = (a, n) => ((a % n) + n) % n;
  const fract = (v) => v - Math.floor(v);
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  /** Phases that make one seed's chase feel different from another's. */
  function seedPhases(seed) {
    const rnd = mulberry32(seed);
    return { ph0: rnd() * TAU, ph1: rnd() * TAU, ph2: rnd() * TAU, jitter: rnd() };
  }

  /**
   * The Prey's closed evasion orbit. One full revolution per loop, with a
   * two-harmonic radial wobble so the line never reads as a perfect ellipse
   * (the chase should look run, not animated).
   */
  function preyPose(tau, cfg) {
    const a = -Math.PI / 2 + TAU * tau;
    const wob = 1 + 0.13 * Math.sin(3 * a + cfg.ph0) + 0.06 * Math.sin(5 * a + cfg.ph1);
    const rr = cfg.r * 0.60 * wob;
    const sq = cfg.squash == null ? 0.94 : cfg.squash;
    return {
      x: cfg.cx + rr * Math.cos(a),
      y: cfg.cy + rr * Math.sin(a) * sq,
      a: Math.atan2(rr * Math.sin(a) * sq, rr * Math.cos(a)),
    };
  }

  /** Hunters fan out behind the Prey's own line — a closing net, not a queue. */
  function hunterPose(tau, cfg, i) {
    const lag = 0.055 + i * 0.035;
    const lateral = (i % 2 === 0 ? -1 : 1) * (6 + i * 2.2) * DEG;
    const a = -Math.PI / 2 + TAU * (tau - lag) + lateral;
    const wob = 1 + 0.13 * Math.sin(3 * a + cfg.ph0) + 0.06 * Math.sin(5 * a + cfg.ph1);
    const close = 0.74 + 0.035 * Math.sin(i * 2.3 + 0.4) + i * 0.006 + 0.028 * Math.sin(TAU * tau + i * 1.7 + cfg.ph2);
    const rr = cfg.r * 0.60 * wob * close;
    const sq = cfg.squash == null ? 0.94 : cfg.squash;
    return {
      x: cfg.cx + rr * Math.cos(a),
      y: cfg.cy + rr * Math.sin(a) * sq,
      a: Math.atan2(rr * Math.sin(a) * sq, rr * Math.cos(a)),
    };
  }

  /** Last `len` fractions of the Prey's run, newest last — the coral trail. */
  function preyTrail(tau, cfg, n, span) {
    const out = [];
    for (let k = 0; k <= n; k++) {
      const back = (k / n) * span;
      const p = preyPose(tau - back, cfg);
      out.push({ x: p.x, y: p.y, age: 1 - k / n });
    }
    return out;
  }

  /**
   * Report pings: each pings from the Prey's position when it was sent, so the
   * ring stays where the report happened while the dot runs on.
   */
  function pingStates(tau, cfg, count, period, life) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const local = fract(tau - (i * period) / count);
      const age = local / life;
      if (age >= 1) continue;
      const origin = preyPose(tau - local, cfg);
      out.push({
        x: origin.x,
        y: origin.y,
        age,
        r: cfg.r * (0.09 + age * 0.42),
        o: 0.55 * Math.pow(1 - age, 1.35),
      });
    }
    return out;
  }

  /** Radar sweep: `turns` revolutions per loop, so the loop closes exactly. */
  function sweepDeg(tau, turns) {
    return mod(tau * (turns == null ? 1 : turns) * 360, 360);
  }

  /** How recently the sweep crossed a dot's bearing (1 = just crossed). */
  function blipFor(dot, sweep, sharp) {
    const dotDeg = mod((dot.a / DEG), 360);
    const d = mod(sweep - dotDeg, 360);
    return Math.exp(-d / (sharp == null ? 24 : sharp));
  }

  /** Point on a circle at `deg` (0° = 3 o'clock, growing clockwise). */
  function polar(cx, cy, r, deg) {
    const a = deg * DEG;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  /** SVG arc path for a ring with a deliberate Open Zone gap. */
  function arcPath(cx, cy, r, startDeg, endDeg) {
    const s = polar(cx, cy, r, startDeg);
    const e = polar(cx, cy, r, endDeg);
    const sweep = mod(endDeg - startDeg, 360);
    const large = sweep > 180 ? 1 : 0;
    return `M${s.x.toFixed(2)},${s.y.toFixed(2)}A${r.toFixed(2)},${r.toFixed(2)} 0 ${large} 1 ${e.x.toFixed(2)},${e.y.toFixed(2)}`;
  }

  /** The sweep wedge: a flat cone of light plus its leading edge. */
  function sweepWedge(r, widthDeg) {
    const half = (widthDeg == null ? 58 : widthDeg) / 2;
    const a = polar(0, 0, r, -half);
    const b = polar(0, 0, r, half);
    const large = (half * 2) > 180 ? 1 : 0;
    return `M0,0L${a.x.toFixed(1)},${a.y.toFixed(1)}A${r},${r} 0 ${large} 1 ${b.x.toFixed(1)},${b.y.toFixed(1)}Z`;
  }

  /**
   * One complete radar frame for a loop phase. Everything the stage needs.
   * cfg: { cx, cy, r, squash, hunters, seed, gapDeg }
   */
  function radarFrame(cfg, tau) {
    const phases = cfg._phases || seedPhases(cfg.seed == null ? 20261101 : cfg.seed);
    const g = {
      cx: cfg.cx, cy: cfg.cy, r: cfg.r,
      squash: cfg.squash == null ? 0.94 : cfg.squash,
      ph0: phases.ph0, ph1: phases.ph1, ph2: phases.ph2,
    };
    const sweep = sweepDeg(tau, 1);
    const gapDeg = cfg.gapDeg == null ? 24 : cfg.gapDeg;
    const gapCentre = -58;
    const zoneR = cfg.r * (1 - 0.034 * (0.5 - 0.5 * Math.cos(TAU * tau)));
    const prey = preyPose(tau, g);
    const nHunters = cfg.hunters == null ? 5 : cfg.hunters;
    const hunters = [];
    for (let i = 0; i < nHunters; i++) hunters.push(hunterPose(tau, g, i));
    return {
      tau,
      sweep,
      zoneR,
      zonePath: arcPath(
        cfg.cx, cfg.cy, zoneR,
        gapCentre + gapDeg / 2,
        gapCentre - gapDeg / 2 + 360
      ),
      prey,
      preyBlip: blipFor(prey, sweep),
      hunters,
      hunterBlips: hunters.map((h) => blipFor(h, sweep, 20)),
      trail: preyTrail(tau, g, 22, 0.14),
      pings: pingStates(tau, g, 3, 1, 0.115),
    };
  }

  root.MHCore = {
    TAU, DEG, mulberry32, mod, fract, clamp01, seedPhases,
    preyPose, hunterPose, preyTrail, pingStates, sweepDeg, blipFor,
    polar, arcPath, sweepWedge, radarFrame,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
