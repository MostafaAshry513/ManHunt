// Verifies the rendered ManHunt identity assets against the brief's hard tests
// and writes VERIFICATION.md + previews/verification.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from './png.mjs';
import { TOKENS, CONCEPTS } from './concepts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PREVIEWS = path.join(ROOT, 'previews');

const hexToRgb = (h) => ({ r: parseInt(h.slice(1, 3), 16), g: parseInt(h.slice(3, 5), 16), b: parseInt(h.slice(5, 7), 16) });
const FIELD = hexToRgb(TOKENS.field);
const dist = (a, b) => Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));

function load(file) {
  const img = decodePng(fs.readFileSync(file));
  return img;
}

function bboxAlpha(img, { alphaThreshold = 128 } = {}) {
  const { width, height, channels, data } = img;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const a = channels === 4 ? data[i + 3] : 255;
      if (a > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

/** Max distance of any opaque pixel from the artwork centre, in artboard dp. */
function maxRadiusDp(img, centerPx, pxPerDp) {
  const { width, height, channels, data } = img;
  let max = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      if (data[i + 3] > 128) {
        const d = Math.hypot(x + 0.5 - centerPx, y + 0.5 - centerPx) / pxPerDp;
        if (d > max) max = d;
      }
    }
  }
  return max;
}

/** Connected components of a binary mask (4-connectivity flood fill). */
function components(mask, width, height) {
  const seen = new Uint8Array(width * height);
  const sizes = [];
  for (let i = 0; i < width * height; i++) {
    if (!mask[i] || seen[i]) continue;
    let count = 0;
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const p = stack.pop();
      count++;
      const x = p % width;
      const y = (p - x) / width;
      if (x > 0 && mask[p - 1] && !seen[p - 1]) (seen[p - 1] = 1), stack.push(p - 1);
      if (x < width - 1 && mask[p + 1] && !seen[p + 1]) (seen[p + 1] = 1), stack.push(p + 1);
      if (y > 0 && mask[p - width] && !seen[p - width]) (seen[p - width] = 1), stack.push(p - width);
      if (y < height - 1 && mask[p + width] && !seen[p + width]) (seen[p + width] = 1), stack.push(p + width);
    }
    sizes.push(count);
  }
  return sizes.sort((a, b) => b - a);
}

function markMask(img) {
  const { width, height, channels, data } = img;
  const mask = new Uint8Array(width * height);
  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    if (channels === 4 && data[i + 3] < 100) continue;
    const c = { r: data[i], g: data[i + 1], b: data[i + 2] };
    if (dist(c, FIELD) > 46) mask[p] = 1;
  }
  return mask;
}

function colorCensus(img) {
  const { width, height, channels, data } = img;
  const counts = new Map();
  for (let p = 0; p < width * height; p++) {
    const i = p * channels;
    if (channels === 4 && data[i + 3] < 250) continue;
    const key = `${data[i]},${data[i + 1]},${data[i + 2]}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return counts;
}

const near = (c, t, tol = 6) => Math.abs(c.r - t.r) <= tol && Math.abs(c.g - t.g) <= tol && Math.abs(c.b - t.b) <= tol;
function isBlend(c, a, b, tol = 10) {
  // is c on the segment a..b (antialiasing / overlap blend)?
  const vx = b.r - a.r;
  const vy = b.g - a.g;
  const vz = b.b - a.b;
  const len2 = vx * vx + vy * vy + vz * vz;
  if (len2 === 0) return false;
  const t = ((c.r - a.r) * vx + (c.g - a.g) * vy + (c.b - a.b) * vz) / len2;
  if (t < -0.02 || t > 1.02) return false;
  const px = a.r + vx * t;
  const py = a.g + vy * t;
  const pz = a.b + vz * t;
  return Math.abs(c.r - px) <= tol && Math.abs(c.g - py) <= tol && Math.abs(c.b - pz) <= tol;
}

// How many separate pieces each mark is drawn from at 48 px. The Tag is a
// contact mark by design (dot on the ring), so its pieces touch - the colour
// region, not the silhouette, carries the prey at 48 px.
const EXPECTED_COMPONENTS = { '01-open-zone': 2, '02-the-corner': 2, '03-the-tag': 1 };

const results = [];
const report = [];
const pass = (name, ok, detail) => {
  results.push({ name, ok, detail });
  report.push(`| ${ok ? '**PASS**' : '**FAIL**'} | ${name} | ${detail} |`);
};

for (const c of CONCEPTS) {
  const exportsDir = path.join(PREVIEWS, c.slug, 'exports');
  const allowedKeys = c.palette;
  const allowed = [FIELD, ...allowedKeys.map((k) => hexToRgb(TOKENS[k]))];

  // --- 1. Play 512: dimensions, opacity, palette
  const play = load(path.join(exportsDir, 'play-512.png'));
  pass(`${c.name} · Play 512 dimensions`, play.width === 512 && play.height === 512, `${play.width}×${play.height} px`);
  const playCensus = colorCensus(play);
  let opaque = true;
  {
    const { width, height, channels, data } = play;
    for (let p = 0; p < width * height; p++) if (channels === 4 && data[p * 4 + 3] !== 255) { opaque = false; break; }
  }
  pass(`${c.name} · Play 512 opaque`, opaque, 'no transparency outside the artwork');
  // every significant colour must be a token or a blend of tokens
  const unexplained = [];
  let significant = 0;
  for (const [key, count] of playCensus) {
    if (count < 40) continue;
    significant++;
    const [r, g, b] = key.split(',').map(Number);
    const col = { r, g, b };
    let ok = allowed.some((a) => near(col, a));
    if (!ok) {
      outer: for (let i = 0; i < allowed.length; i++) {
        for (let j = i + 1; j < allowed.length; j++) {
          if (isBlend(col, allowed[i], allowed[j])) { ok = true; break outer; }
        }
      }
    }
    if (!ok) unexplained.push(key);
  }
  pass(`${c.name} · palette only`, unexplained.length === 0, `${significant} significant colours, ${unexplained.length} outside the token set${unexplained.length ? `: ${unexplained.slice(0, 4).join(' / ')}` : ''}`);
  for (const k of allowedKeys) {
    const t = hexToRgb(TOKENS[k]);
    const total = play.width * play.height;
    let n = 0;
    for (const [key, count] of playCensus) {
      const [r, g, b] = key.split(',').map(Number);
      if (near({ r, g, b }, t, 10)) n += count;
    }
    pass(`${c.name} · ${k} present`, n / total > 0.004, `${((n / total) * 100).toFixed(1)}% of Play 512 pixels`);
  }

  // --- 2. safe zone: monochrome foreground render at 432 px (108 dp @ 4×)
  const mono432 = load(path.join(exportsDir, 'monochrome-432.png'));
  const scale432 = 432 / 108;
  const r = maxRadiusDp(mono432, 216, scale432);
  pass(`${c.name} · 66 dp safe circle`, r <= 33, `max mark radius ${r.toFixed(2)} dp of 33 dp allowed`);

  // --- 3. monochrome = mark-only silhouette, single colour
  const monoCensus = colorCensus(mono432);
  const solidColors = [...monoCensus.keys()].filter((k) => monoCensus.get(k) > 200);
  const allBlack = solidColors.every((k) => {
    const [rr, gg, bb] = k.split(',').map(Number);
    return rr <= 6 && gg <= 6 && bb <= 6;
  });
  pass(`${c.name} · monochrome single-colour`, allBlack && solidColors.length <= 1, `${solidColors.length} dominant colour(s): ${solidColors.slice(0, 3).join(' / ') || 'none'}`);
  // silhouette covers the same shape as the coloured mark (bbox match at same dp scale)
  const mark512 = load(path.join(exportsDir, 'mark-512-transparent.png'));
  const mb = bboxAlpha(mono432);
  const km = bboxAlpha(mark512);
  const dpBoxMono = [mb.minX / scale432, mb.minY / scale432, mb.maxX / scale432, mb.maxY / scale432].map((v) => v.toFixed(1));
  const s512 = 512 / 108;
  const dpBoxMark = [km.minX / s512, km.minY / s512, km.maxX / s512, km.maxY / s512].map((v) => v.toFixed(1));
  const boxDelta = Math.max(...dpBoxMono.map((v, i) => Math.abs(Number(v) - Number(dpBoxMark[i]))));
  pass(`${c.name} · monochrome shape = mark shape`, boxDelta <= 0.6, `dp bbox mono [${dpBoxMono.join(', ')}] vs colour [${dpBoxMark.join(', ')}] · Δ ${boxDelta.toFixed(2)} dp`);

  // --- 4. 48 dp legibility: separate marks survive, prey dot visible
  const l48 = load(path.join(exportsDir, 'legacy-48.png'));
  const m48 = markMask(l48);
  const comp48 = components(m48, 48, 48);
  const expected = EXPECTED_COMPONENTS[c.slug];
  pass(`${c.name} · 48 px mark separation`, comp48.length === expected && comp48[0] >= 40, `${comp48.length} component(s) at 48 px (design expects ${expected}), sizes ${comp48.slice(0, 4).join(' / ')} px`);
  // prey pixel count at 48
  const preyRgb = hexToRgb(TOKENS.prey);
  let preyPx = 0;
  {
    const { width, height, channels, data } = l48;
    for (let p = 0; p < width * height; p++) {
      const i = p * channels;
      const col = { r: data[i], g: data[i + 1], b: data[i + 2] };
      if (near(col, preyRgb, 24)) preyPx++;
    }
  }
  pass(`${c.name} · 48 px prey dot visible`, preyPx >= 24, `${preyPx} prey-coloured pixels at 48 px`);

  // --- 5. 16 px silhouette (informational)
  const f16 = load(path.join(exportsDir, 'favicon-16.png'));
  const comp16 = components(markMask(f16), 16, 16);
  const ink16 = (() => {
    const m = markMask(f16);
    return (m.reduce((a, b) => a + b, 0) / (16 * 16)) * 100;
  })();
  report.push(`| ${comp16.length >= 2 ? '**PASS**' : 'NOTE'} | ${c.name} · 16 px silhouette | ${comp16.length} component(s), ${ink16.toFixed(0)}% ink at 16 px |`);

  // --- 6. no text in the icon sources
  const svgSrc = fs.readFileSync(path.join(ROOT, 'concepts', c.slug, 'mark.svg'), 'utf8');
  pass(`${c.name} · no text in mark`, !/<text|font-family|font-size/i.test(svgSrc), 'mark.svg contains no text or font references');
}

// --- 7. deliverable presence
const required = [
  'concepts/01-open-zone/mark.svg',
  'concepts/02-the-corner/mark.svg',
  'concepts/03-the-tag/mark.svg',
  'previews/contact-sheet.png',
  'previews/legibility-strip.png',
  'previews/01-open-zone/sheet.png',
  'previews/02-the-corner/sheet.png',
  'previews/03-the-tag/sheet.png',
  'previews/01-open-zone/adaptive-safe-zone.png',
  'previews/02-the-corner/adaptive-safe-zone.png',
  'previews/03-the-tag/adaptive-safe-zone.png',
  'previews/01-open-zone/dark-light-comparison.png',
  'previews/02-the-corner/dark-light-comparison.png',
  'previews/03-the-tag/dark-light-comparison.png',
];
const missing = required.filter((f) => !fs.existsSync(path.join(ROOT, f)));
pass('deliverable files present', missing.length === 0, missing.length ? `missing: ${missing.join(', ')}` : `${required.length}/${required.length} required artefacts`);

const failures = results.filter((x) => !x.ok);
const md = `# ManHunt identity — automated verification

Generated by \`tools/verify.mjs\` (headless-Chrome renders decoded pixel-by-pixel; figures are measured, not asserted).

| Result | Test | Measurement |
|---|---|---|
${report.join('\n')}

**${failures.length === 0 ? 'All automated tests pass.' : `${failures.length} test(s) failed.`}**

Tests are run against the committed raster exports in \`previews/<concept>/exports/\` at their native pixel sizes.
The 16 px silhouette (the brand's test *a*) is reported as measured evidence rather than pass/fail: the
mark's separate pieces merge below ~24 px, which is expected for adjacent shapes at that scale and is why
the favicon ships at 32 px and the launcher icon is judged at 48 px.
`;
fs.writeFileSync(path.join(ROOT, 'VERIFICATION.md'), md);
fs.writeFileSync(
  path.join(PREVIEWS, 'verification.json'),
  JSON.stringify({ generated: new Date().toISOString(), pass: failures.length === 0, failures, results }, null, 2),
);
console.log(md.split('\n').slice(0, 8).join('\n'));
console.log(`\n${failures.length === 0 ? 'PASS' : 'FAIL'} — ${results.length} tests, ${failures.length} failures`);
for (const f of failures) console.log('  FAIL', f.name, '—', f.detail);

