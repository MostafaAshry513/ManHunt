// ManHunt identity — the three final mark concepts, parametric and in one place.
// All geometry lives on the 108 x 108 dp adaptive-icon artboard. Every mark fits
// inside the 66 dp safe circle: centre (54,54), radius 33.
//
// Palette semantics (locked by design/brand/strategy/visual-direction.md §1):
//   cyan  #22D3EE = the field / the referee — never a team
//   coral #FF7A59 = Prey
//   violet#A79BFF = Hunters
//   navy  #0B1220 = the ground
import { C, P, pol, fx, quadPoints, ribbon } from './geometry.mjs';

export const TOKENS = {
  field: '#0B1220',
  surface: '#131C2E',
  chalk: '#E6EDF7',
  signal: '#22D3EE',
  prey: '#FF7A59',
  hunters: '#A79BFF',
  hairline: '#2A3550',
  lightGround: '#F7F9FC',
};

const f = (n) => Number(n.toFixed(2));
export const dot = (cx, cy, r, fill) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${fill}"/>`;

// ---------------------------------------------------------------- 1. OPEN ZONE
// "The zone that does not close." The hunt zone is a cyan chalk ring with a
// deliberate break; the coral prey dot sits in the break — someone is out of the
// zone, or is about to be. Reads as a chase, never as a map or a target.
export function openZone({
  r = 22.2,
  stroke = 10.4,
  gap = 72,
  mouth = -56,
  rot = 0,
  dotR = 8.6,
  dotAt = 24,
  dotOff = -2,
} = {}) {
  const a0 = mouth + gap / 2;
  const sweep = 360 - gap;
  const p0 = pol(C.x, C.y, r, a0);
  const p1 = pol(C.x, C.y, r, a0 + sweep);
  const arc = `M${f(p0.x)},${f(p0.y)}A${r},${r} 0 ${sweep > 180 ? 1 : 0} 1 ${f(p1.x)},${f(p1.y)}`;
  const dp = pol(C.x, C.y, dotAt, mouth + dotOff);
  return {
    inner:
      `<g transform="rotate(${rot} ${C.x} ${C.y})">` +
      `<path d="${arc}" fill="none" stroke="${TOKENS.signal}" stroke-width="${stroke}" stroke-linecap="butt"/>` +
      dot(dp.x, dp.y, dotR, TOKENS.prey) +
      `</g>`,
    data: { r, stroke, gap, mouth, dotR, dotAt, dotOff },
  };
}

// ---------------------------------------------------------------- 2. THE CORNER
// "The borrowed pitch." A cyan chalk corner — two thick markings meeting at 90°
// — with the coral prey dot held in the angle. The corner is a place; the dot is
// the player standing in it.
export function corner({
  v = P(42, 62),
  rot = -9,
  legs = [
    { len: 31, deg: -90 },
    { len: 27, deg: 0 },
  ],
  w = 11.4,
  dotR = 9.8,
  dotGap = 2.4,
} = {}) {
  const u = legs.map(({ deg }) => ({ x: Math.cos((deg * Math.PI) / 180), y: Math.sin((deg * Math.PI) / 180) }));
  const ends = legs.map(({ len }, i) => P(v.x + u[i].x * len, v.y + u[i].y * len));
  const strokePath = `M${f(ends[0].x)},${f(ends[0].y)}L${f(v.x)},${f(v.y)}L${f(ends[1].x)},${f(ends[1].y)}`;
  // prey dot on the inner bisector, a fixed gap away from both legs
  const bx = u[0].x + u[1].x;
  const by = u[0].y + u[1].y;
  const bl = Math.hypot(bx, by);
  const half = Math.abs(Math.atan2(u[1].y, u[1].x) - Math.atan2(u[0].y, u[0].x));
  const d = (dotGap + w / 2 + dotR) / Math.sin(half / 2);
  const dp = P(v.x + (bx / bl) * d, v.y + (by / bl) * d);
  return {
    inner:
      `<g transform="rotate(${rot} ${C.x} ${C.y})">` +
      `<path d="${strokePath}" fill="none" stroke="${TOKENS.signal}" stroke-width="${w}" stroke-linecap="butt" stroke-linejoin="miter"/>` +
      dot(dp.x, dp.y, dotR, TOKENS.prey) +
      `</g>`,
    data: { v, rot, w, dotR, dotGap, dp },
  };
}

// ---------------------------------------------------------------- 3. THE TAG
// "The tag instant." The hunters' violet ring is closed; the coral prey dot is
// at its edge, in contact. The only verb in the game, one frame before it lands.
export function tag({
  r = 18.2,
  stroke = 9.8,
  rot = 0,
  dotR = 8.8,
  dotAt = 24,
  dotAngle = -36,
} = {}) {
  const dp = pol(C.x, C.y, dotAt, dotAngle);
  return {
    inner:
      `<g transform="rotate(${rot} ${C.x} ${C.y})">` +
      `<circle cx="${C.x}" cy="${C.y}" r="${r}" fill="none" stroke="${TOKENS.hunters}" stroke-width="${stroke}"/>` +
      dot(dp.x, dp.y, dotR, TOKENS.prey) +
      `</g>`,
    data: { r, stroke, dotR, dotAt, dotAngle },
  };
}

export const CONCEPTS = [
  {
    slug: '01-open-zone',
    name: 'Open Zone',
    strategy: 'chase / pursuit tension',
    idea:
      'The hunt zone is a chalk ring that does not close. The prey dot is in the break — someone is out of the zone, or about to be.',
    territory: 'unclosed zone',
    palette: ['signal', 'prey'],
    fn: openZone,
  },
  {
    slug: '02-the-corner',
    name: 'The Corner',
    strategy: 'real place / borrowed pitch',
    idea:
      'A chalk corner of the borrowed pitch. The prey dot is held in the angle — the corner flag is a player.',
    territory: 'touchline corner',
    palette: ['signal', 'prey'],
    fn: corner,
  },
  {
    slug: '03-the-tag',
    name: 'The Tag',
    strategy: 'predator / prey tension',
    idea:
      'The hunters\' violet ring is closed and the prey dot is at its edge, in contact: the tag, one frame before it lands.',
    territory: 'tag instant',
    palette: ['hunters', 'prey'],
    fn: tag,
  },
];

// Shape-only version (silhouette): all paint becomes one colour.
export function toMono(inner, color = '#000000') {
  return inner.replace(/(fill|stroke)="#[0-9A-Fa-f]{6}"/g, `$1="${color}"`);
}

export function svgDoc(inner, { bg = null, size = 108, guides = false, mono = null, title = '', desc = '' } = {}) {
  const body = mono ? toMono(inner, mono) : inner;
  const g = guides
    ? `<circle cx="${C.x}" cy="${C.y}" r="33" fill="none" stroke="#F5C542" stroke-width="0.4" stroke-dasharray="1.6 1.6" opacity=".95"/>` +
      `<circle cx="${C.x}" cy="${C.y}" r="36" fill="none" stroke="#5C6C86" stroke-width="0.3" stroke-dasharray="0.9 2.4" opacity=".8"/>`
    : '';
  const meta = (title ? `<title>${title}</title>` : '') + (desc ? `<desc>${desc}</desc>` : '');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="${size}" height="${size}" role="img">` +
    meta +
    (bg ? `<rect width="108" height="108" fill="${bg}"/>` : '') +
    body +
    g +
    '</svg>'
  );
}
