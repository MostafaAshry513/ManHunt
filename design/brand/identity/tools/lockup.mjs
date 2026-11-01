// Approved Open Zone lockup: mark + drawn MANHUNT wordmark, in the three
// required colour states and two layouts. Design units use cap height 100.
import { openZone, TOKENS } from './concepts.mjs';
import { wordmark, wordmarkInner, TRACKING } from './wordmark.mjs';

/** Extent of the Open Zone mark inside its 108 dp artboard, in dp. */
const MARK_VISIBLE = 64.6;

export const LOCKUP_STATES = {
  'light-on-dark': {
    ring: TOKENS.signal,
    dot: TOKENS.prey,
    wordmark: TOKENS.chalk,
    ground: TOKENS.field,
    label: 'light on dark — navy field',
  },
  'dark-on-light': {
    // light-theme translations from Theme.kt (contrast-safe on chalk)
    ring: '#0C6B84',
    dot: '#B33A0F',
    wordmark: '#0B1220',
    ground: TOKENS.lightGround,
    label: 'dark on light — chalk ground',
  },
  mono: {
    ring: '#000000',
    dot: '#000000',
    wordmark: '#000000',
    ground: '#FFFFFF',
    label: 'monochrome — one ink',
  },
};

export const LOCKUP_STATE_KEYS = Object.keys(LOCKUP_STATES);

const P = (n) => Number(n.toFixed(2));

function markInner(state) {
  const inner = openZone().inner;
  return inner.replace(`stroke="${TOKENS.signal}"`, `stroke="${state.ring}"`).replace(`fill="${TOKENS.prey}"`, `fill="${state.dot}"`);
}

/** Mark-only SVG (no ground), scaled to an exact pixel size. */
export function markSvg({ state = 'light-on-dark', size = 108, title = 'ManHunt — Open Zone mark' } = {}) {
  const s = LOCKUP_STATES[state];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="${size}" height="${size}" role="img">` +
    `<title>${title}</title>${markInner(s)}</svg>`
  );
}

/* lockup geometry, in cap-height units (cap = 100) */
const CAP = 100;
const PAD = 50; // clear space: 0.5 x cap
const MARK_D = 120; // visible mark diameter
const GAP = 56;
const WM = wordmark({ cap: CAP });
const WM_W = WM.width;

/** Horizontal or stacked lockup at design units; viewBox includes the clear space. */
export function lockupSvg({ layout = 'horizontal', state = 'light-on-dark', title, desc } = {}) {
  const s = LOCKUP_STATES[state];
  const k = MARK_D / MARK_VISIBLE; // scale for the 108 dp mark artboard
  const meta = `<title>${title || `ManHunt — ${layout} lockup`}</title>${desc ? `<desc>${desc}</desc>` : ''}`;
  let width;
  let height;
  let markT;
  let wmT;
  if (layout === 'horizontal') {
    const contentW = MARK_D + GAP + WM_W;
    width = contentW + PAD * 2;
    height = MARK_D + PAD * 2;
    const cx = PAD + MARK_D / 2;
    const cy = PAD + MARK_D / 2;
    markT = `translate(${P(cx - 54 * k)} ${P(cy - 54 * k)}) scale(${P(k)})`;
    wmT = `translate(${P(PAD + MARK_D + GAP)} ${P(PAD + (MARK_D - CAP) / 2)})`;
  } else {
    const contentW = Math.max(MARK_D, WM_W);
    width = contentW + PAD * 2;
    height = MARK_D + GAP + CAP + PAD * 2;
    const cx = PAD + contentW / 2;
    markT = `translate(${P(cx - 54 * k)} ${P(PAD - 54 * k + MARK_D / 2)}) scale(${P(k)})`;
    wmT = `translate(${P(PAD + (contentW - WM_W) / 2)} ${P(PAD + MARK_D + GAP)})`;
  }
  const paths = wordmarkInner({ height: CAP, fill: s.wordmark });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${P(width)} ${P(height)}" width="${P(width)}" height="${P(height)}" role="img">` +
    meta +
    `<g transform="${markT}">${markInner(s)}</g>` +
    `<g transform="${wmT}">${paths}</g>` +
    '</svg>'
  );
}

/** Wordmark-only SVG, tight box (no clear space baked in). */
export function wordmarkSvg({ state = 'light-on-dark', cap = 100, title = 'MANHUNT' } = {}) {
  const s = LOCKUP_STATES[state];
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${P(WM_W)} ${CAP}" width="${P((WM_W * cap) / CAP)}" height="${cap}" role="img">` +
    `<title>${title}</title>` +
    wordmarkInner({ height: CAP, fill: s.wordmark }) +
    '</svg>'
  );
}

export const LOCKUP_METRICS = { CAP, PAD, MARK_D, GAP, WM_W, MARK_VISIBLE, tracking: TRACKING };
