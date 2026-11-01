// Parametric geometry helpers for the ManHunt identity marks.
// Everything is designed on a 108 x 108 artboard with the mark kept inside the
// Android adaptive-icon safe circle: centre (54,54), radius 33 (66 dp diameter).

export const ART = 108;
export const C = { x: 54, y: 54 };
export const SAFE_R = 33;

const D2R = Math.PI / 180;
export const fx = (n) => Number(n.toFixed(2));
export const P = (x, y) => ({ x, y });
export const pol = (cx, cy, r, deg) => P(cx + r * Math.cos(deg * D2R), cy + r * Math.sin(deg * D2R));

/** Distance from the artboard centre — used to assert the 66 dp safe circle. */
export const safeDist = (p) => Math.hypot(p.x - C.x, p.y - C.y);

export function arcPoints(cx, cy, r, a0, a1, steps = 48) {
  const out = [];
  for (let i = 0; i <= steps; i++) out.push(pol(cx, cy, r, a0 + ((a1 - a0) * i) / steps));
  return out;
}

export function quadPoints(p0, p1, p2, steps = 48) {
  const out = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const u = 1 - t;
    out.push(P(u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x, u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y));
  }
  return out;
}

/** Unit normals for a sampled centreline. */
function normals(pts) {
  return pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return P(-dy / len, dx / len);
  });
}

const M = (p) => `${fx(p.x)},${fx(p.y)}`;

/**
 * Filled, tapered ribbon along a sampled centreline.
 * thickness tapers from wStart (tail) to wEnd (tip). wEnd ~ 0 gives a sharp point.
 */
export function ribbon(centerPts, wStart, wEnd, opts = {}) {
  const { ease = 0.85, tailCap = 'flat', tipR = 0.6 } = opts;
  const n = normals(centerPts);
  const outer = [];
  const inner = [];
  for (let i = 0; i < centerPts.length; i++) {
    const t = i / (centerPts.length - 1);
    const w = wEnd + (wStart - wEnd) * Math.pow(1 - t, ease);
    const half = Math.max(w, tipR) / 2;
    outer.push(P(centerPts[i].x + n[i].x * half, centerPts[i].y + n[i].y * half));
    inner.push(P(centerPts[i].x - n[i].x * half, centerPts[i].y - n[i].y * half));
  }
  const outerD = outer.slice(1).map((p) => `L${M(p)}`).join('');
  // walk the inner edge back from the head end so both ends are square cuts
  const innerD = inner
    .slice()
    .reverse()
    .map((p) => `L${M(p)}`)
    .join('');
  let tail = 'Z';
  if (tailCap === 'round') {
    const a = inner[inner.length - 1];
    const b = outer[0];
    tail = `A${fx(wStart / 2)},${fx(wStart / 2)} 0 0 1 ${M(b)}Z`;
    return `M${M(outer[0])}${outerD}${innerD}L${M(a)}${tail}`;
  }
  return `M${M(outer[0])}${outerD}${innerD}Z`;
}

/** Circle as a single closed subpath (usable as an even-odd hole). */
export function circleSub(cx, cy, r) {
  return `M${fx(cx - r)},${fx(cy)}a${fx(r)},${fx(r)} 0 1,0 ${fx(2 * r)},0a${fx(r)},${fx(r)} 0 1,0 ${fx(-2 * r)},0Z`;
}

/** Rounded rectangle as a closed subpath, optionally rotated about its centre. */
export function roundRectSub(cx, cy, w, h, r, rotDeg = 0) {
  const hw = w / 2;
  const hh = h / 2;
  const rr = Math.min(r, hw, hh);
  const pts = [];
  const corners = [
    [hw - rr, hh - rr, 0],
    [-(hw - rr), hh - rr, 90],
    [-(hw - rr), -(hh - rr), 180],
    [hw - rr, -(hh - rr), 270],
  ];
  // build with arcs
  const a = corners;
  const rot = (x, y) => {
    const c = Math.cos((rotDeg * Math.PI) / 180);
    const s = Math.sin((rotDeg * Math.PI) / 180);
    return P(cx + x * c - y * s, cy + x * s + y * c);
  };
  const start = rot(hw, -(hh - rr));
  let d = `M${M(start)}`;
  const order = [
    [a[0], a[1]],
    [a[1], a[2]],
    [a[2], a[3]],
    [a[3], a[0]],
  ];
  for (const [c0, c1] of order) {
    const p0 = rot(c0[0], c0[1]);
    const p1 = rot(c1[0], c1[1]);
    d += `A${fx(rr)},${fx(rr)} 0 0 1 ${M(p1)}`;
  }
  d += 'Z';
  return d;
}

/** Rotate a list of points. */
export function rotatePts(pts, deg, about = C) {
  const c = Math.cos((deg * Math.PI) / 180);
  const s = Math.sin((deg * Math.PI) / 180);
  return pts.map((p) => P(about.x + (p.x - about.x) * c - (p.y - about.y) * s, about.y + (p.x - about.x) * s + (p.y - about.y) * c));
}

export function maxSafeDist(pathD) {
  // parse the numbers out of a path and return the max distance from the centre
  const nums = pathD.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  let max = 0;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const d = Math.hypot(nums[i] - C.x, nums[i + 1] - C.y);
    if (d > max) max = d;
  }
  return max;
}
