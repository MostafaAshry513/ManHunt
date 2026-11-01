// Original drawn wordmark: MANHUNT as a condensed stencil-grotesque logotype.
// Cap height 100 units, baseline at y = 100, uniform stem 16. Built only from
// straight strokes, unions and one arc (U) so it stays crisp at any size and in
// one ink. This is a drawing, not a font: 7 glyph paths + tracking.

export const CAP = 100;
export const STEM = 16;
export const TRACKING = 10;

const P = (n) => Number(n.toFixed(2));
const poly = (pts) => `M${pts.map(([x, y]) => `${P(x)},${P(y)}`).join('L')}Z`;

/** M - two stems + two arms whose crossing leaves a deep top V and reaches the
 *  baseline at the vertex. */
function glyphM({ width = 76, stroke = STEM, arm = 13.5 } = {}) {
  const w = width;
  const s = stroke;
  const half = w / 2;
  const a = arm;
  const over = 9; // how far the arm's top edge overlaps the stem
  const leftArm = [
    [s - over, 0],
    [s - over + a, 0],
    [half + a / 2, CAP],
    [half - a / 2, CAP],
  ];
  const rightArm = [
    [w - s + over - a, 0],
    [w - s + over, 0],
    [half + a / 2, CAP],
    [half - a / 2, CAP],
  ];
  return (
    poly([[0, 0], [s, 0], [s, CAP], [0, CAP]]) +
    poly([[w - s, 0], [w, 0], [w, CAP], [w - s, CAP]]) +
    poly(leftArm) +
    poly(rightArm)
  );
}

/** A - two legs sharing a flat apex, plus a crossbar. */
function glyphA({ width = 68, stroke = STEM, apex = 15, barTop = 63, barBottom = 79 } = {}) {
  const w = width;
  const s = stroke;
  const half = w / 2;
  const topL = half - apex / 2;
  const topR = half + apex / 2;
  const leftLeg = [[topL, 0], [topR, 0], [s + 4, CAP], [0, CAP]];
  const rightLeg = [[topL, 0], [topR, 0], [w, CAP], [w - s - 4, CAP]];
  const bar = [[half - 11, barTop], [half + 11, barTop], [half + 11, barBottom], [half - 11, barBottom]];
  return poly(leftLeg) + poly(rightLeg) + poly(bar);
}

/** N - two stems + one diagonal band from the top-left inner corner to the
 *  bottom-right inner corner. */
function glyphN({ width = 68, stroke = STEM, over = 9, band = 17 } = {}) {
  const w = width;
  const s = stroke;
  const top = [[s - over, 0], [s - over + band, 0]];
  const bottom = [[w - s - 4 + band, CAP], [w - s - 4, CAP]];
  return (
    poly([[0, 0], [s, 0], [s, CAP], [0, CAP]]) +
    poly([[w - s, 0], [w, 0], [w, CAP], [w - s, CAP]]) +
    poly([top[0], top[1], bottom[0], bottom[1]])
  );
}

/** H - two stems + crossbar. */
function glyphH({ width = 64, stroke = STEM, barTop = 41, barBottom = 57 } = {}) {
  const w = width;
  const s = stroke;
  return (
    poly([[0, 0], [s, 0], [s, CAP], [0, CAP]]) +
    poly([[w - s, 0], [w, 0], [w, CAP], [w - s, CAP]]) +
    poly([[0, barTop], [w, barTop], [w, barBottom], [0, barBottom]])
  );
}

/** U - even-odd outer/inner with a rounded bottom (the only curve in the mark). */
function glyphU({ width = 68, stroke = STEM } = {}) {
  const w = width;
  const s = stroke;
  const rOuter = w / 2;
  const yTop = CAP - rOuter;
  const rInner = w / 2 - s;
  const outer = `M0,0V${P(yTop)}A${P(rOuter)},${P(rOuter)} 0 0 0 ${P(w)},${P(yTop)}V0H0Z`;
  const inner = `M${P(s)},0V${P(yTop)}A${P(rInner)},${P(rInner)} 0 0 0 ${P(w - s)},${P(yTop)}V0H${P(s)}Z`;
  return outer + inner;
}

/** T - top bar + centre stem. */
function glyphT({ width = 58, stroke = STEM } = {}) {
  const w = width;
  const s = stroke;
  const x0 = (w - s) / 2;
  return poly([[0, 0], [w, 0], [w, s], [x0 + s, s], [x0 + s, CAP], [x0, CAP], [x0, s], [0, s]]);
}

export const GLYPHS = { M: glyphM, A: glyphA, N: glyphN, H: glyphH, U: glyphU, T: glyphT };

export const WORD = 'MANHUNT';

// per-letter widths, reading order
export const LETTER_WIDTHS = [
  ['M', 76],
  ['A', 68],
  ['N', 68],
  ['H', 64],
  ['U', 68],
  ['N', 68],
  ['T', 58],
];

export function totalWidth({ tracking = TRACKING } = {}) {
  return LETTER_WIDTHS.reduce((sum, [, w]) => sum + w, 0) + tracking * (LETTER_WIDTHS.length - 1);
}

/** One path per letter with x offsets, scaled so the cap height equals `cap`. */
export function wordmark({ tracking = TRACKING, cap = 100 } = {}) {
  const scale = cap / CAP;
  let x = 0;
  const paths = [];
  for (const [letter, w] of LETTER_WIDTHS) {
    paths.push({ letter, d: GLYPHS[letter](), x: P(x * scale), xUnits: x, w: P(w * scale) });
    x += w + tracking;
  }
  return { paths, width: P((x - tracking) * scale), cap: P(cap), scale, unitsWidth: x - tracking };
}

/** Inner SVG markup for the wordmark at a given cap height. */
export function wordmarkInner({ tracking = TRACKING, height = 100, fill = 'currentColor' } = {}) {
  const wm = wordmark({ tracking, cap: height });
  const body = wm.paths
    .map(
      ({ letter, d, xUnits }) =>
        `<path transform="translate(${P(xUnits)} 0)" d="${d}" fill="${fill}"${letter === 'U' ? ' fill-rule="evenodd"' : ''}/>`,
    )
    .join('');
  // the glyph drawings are authored at cap 100, so scale the whole group to the asked cap
  return wm.scale === 1 ? body : `<g transform="scale(${Number(wm.scale.toFixed(5))})">${body}</g>`;
}

/** Standalone wordmark SVG document. */
export function wordmarkSvg({ height = 100, fill = '#E6EDF7', title = 'MANHUNT' } = {}) {
  const wm = wordmark({ cap: height });
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${P(wm.width)} ${P(height)}" width="${P(wm.width)}" height="${P(height)}" role="img">` +
    `<title>${title}</title>` +
    wordmarkInner({ height, fill }) +
    '</svg>'
  );
}

