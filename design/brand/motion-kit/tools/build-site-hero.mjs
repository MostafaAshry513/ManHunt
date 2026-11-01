// Builds the self-contained CSS/SVG site hero (no JS, no external assets).
//
//   node tools/build-site-hero.mjs
//
// Outputs (all generated from this file — edit here, rerun, never hand-edit):
//   site-hero/site-hero.html     standalone 1200×600 preview page (captured for stills)
//   site-hero/hero-snippet.html  the paste-ready <style> + markup block for
//                                server/src/app.ts (install page hero replacement)
//   site-hero/hero.css           the scoped stylesheet alone (inspection/reference)
//
// Motion is the same seeded "Perpetual Pursuit" algorithm as the GIF/banner
// stage (src/motion-core.js), sampled into CSS keyframes so the install page
// needs no JavaScript at all. Reduced motion gets a complete static poster.
import { readFile, writeFile } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';

const KIT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(KIT, 'site-hero');

/* ── load the shared, pure motion maths ─────────────────────────────────── */
const coreSource = await readFile(path.join(KIT, 'src', 'motion-core.js'), 'utf8');
vm.runInThisContext(coreSource);
const C = globalThis.MHCore;
const TAU = C.TAU;
const DEG = C.DEG;

/* ── design constants (all in 1200×600 design units) ────────────────────── */
const W = 1200;
const H = 600;
const RADAR = { cx: 900, cy: 310, r: 180, hunters: 5, squash: 0.94, seed: 20261101 };
const LOOP_S = 8; // site-hero loop (reads slower than the 5 s social loop)
const SAMPLES = 25; // keyframe samples per loop
const PH = C.seedPhases(RADAR.seed);

const COLORS = {
  field: '#0B1220',
  block: '#0E1727',
  park: '#0C2026',
  chalk: '#E6EDF7',
  muted: '#A7B6CC',
  dim: '#7C8DA8',
  cyan: '#22D3EE',
  coral: '#FF7A59',
  violet: '#A79BFF',
};

const fmt = (n) => (Math.round(n * 10) / 10).toString();
const pct = (n, total) => (Math.round((n / total) * 10000) / 100).toFixed(2) + '%';

/* ── official wordmark (verbatim, never retyped — LOCKUP.md §1) ─────────── */
const wordmarkSvg = (await readFile(path.join(KIT, 'assets', 'lockup', 'wordmark-light-on-dark.svg'), 'utf8'))
  .trim()
  .replace(/\swidth="[^"]*"/, '')
  .replace(/\sheight="[^"]*"/, '')
  .replace(/ role="img"/, '');
if (/<text\b|<tspan\b/.test(wordmarkSvg)) throw new Error('wordmark must remain drawn paths');

/* ── deterministic field: blocks, specks, grid, touchlines ──────────────── */
function blockMap() {
  const rnd = C.mulberry32(20261101 ^ 0x9e3779b9);
  const cell = Math.max(104, Math.min(240, W / 8.5));
  const cols = [];
  const rows = [];
  for (let x = -cell * 0.5; x < W + cell; x += cell * (0.82 + rnd() * 0.42)) cols.push(x);
  for (let y = -cell * 0.55; y < H + cell; y += cell * (0.66 + rnd() * 0.38)) rows.push(y);
  const parts = [];
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
      parts.push(
        `<rect x="${fmt(bx)}" y="${fmt(by)}" width="${fmt(bw)}" height="${fmt(bh)}" rx="7" fill="${park ? COLORS.park : COLORS.block}" fill-opacity="${park ? '0.9' : '0.7'}" stroke="${park ? COLORS.cyan : COLORS.chalk}" stroke-opacity="${park ? '0.15' : '0.065'}" stroke-width="1.5"/>`
      );
    }
  }
  return parts.join('');
}

function chalkSpecks() {
  const rnd = C.mulberry32(20261101 ^ 0x51ed270b);
  const parts = [];
  const count = Math.round((W * H) / 9000);
  for (let i = 0; i < count; i++) {
    parts.push(
      `<circle cx="${fmt(rnd() * W)}" cy="${fmt(rnd() * H)}" r="${fmt(0.5 + rnd() * 1.5)}" fill="${COLORS.chalk}" fill-opacity="${(0.03 + rnd() * 0.055).toFixed(3)}"/>`
    );
  }
  return `<g>${parts.join('')}</g>`;
}

function markings() {
  const inset = 22;
  const arcR = 46;
  const corners = [
    `M${inset + 2},${inset + arcR} A${arcR},${arcR} 0 0 1 ${inset + arcR},${inset + 2}`,
    `M${W - inset - 2},${inset + arcR} A${arcR},${arcR} 0 0 0 ${W - inset - arcR},${inset + 2}`,
    `M${inset + 2},${H - inset - arcR} A${arcR},${arcR} 0 0 0 ${inset + arcR},${H - inset - 2}`,
    `M${W - inset - 2},${H - inset - arcR} A${arcR},${arcR} 0 0 1 ${W - inset - arcR},${H - inset - 2}`,
  ];
  return `<g fill="none" stroke="${COLORS.chalk}" stroke-linecap="round">
    <rect x="${inset}" y="${inset}" width="${W - inset * 2}" height="${H - inset * 2}" stroke-opacity="0.3" stroke-width="2.5"/>
    <g stroke-opacity="0.22" stroke-width="2.5">${corners.map((d) => `<path d="${d}"/>`).join('')}</g>
    <g stroke-opacity="0.26" stroke-width="2">
      <path d="M8,24 L8,8 L24,8"/><path d="M${W - 24},8 L${W - 8},8 L${W - 8},24"/>
      <path d="M8,${H - 24} L8,${H - 8} L24,${H - 8}"/><path d="M${W - 24},${H - 8} L${W - 8},${H - 8} L${W - 8},${H - 24}"/>
    </g>
  </g>`;
}

function buildArt() {
  const { cx, cy, r } = RADAR;
  const gap = 24;
  const zonePath = C.arcPath(cx, cy, r, -58 + gap / 2, -58 - gap / 2 + 360);
  const outerPath = C.arcPath(cx, cy, r * 1.115, 0, 359.99);
  const zoneHighlight = C.arcPath(cx, cy, r, 0, 359.99);

  /* bearing ticks */
  let ticks = '';
  for (let i = 0; i < 36; i++) {
    const deg = i * 10;
    const a = C.polar(cx, cy, r * 1.105, deg);
    const b = C.polar(cx, cy, r * (i % 9 === 0 ? 1.155 : 1.13), deg);
    ticks += `<line x1="${fmt(a.x)}" y1="${fmt(a.y)}" x2="${fmt(b.x)}" y2="${fmt(b.y)}"/>`;
  }

  /* chalk-drawn zone circle (hand wobble) */
  const rnd = C.mulberry32(20261101 ^ 0x2545f491);
  const chalkPts = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * TAU;
    const wob = 1 + (rnd() - 0.5) * 0.014 + Math.sin(a * 3 + 1.7) * 0.006 + Math.sin(a * 7 + 0.4) * 0.004;
    chalkPts.push([cx + r * wob * Math.cos(a), cy + r * wob * Math.sin(a) * 0.985]);
  }
  const chalkCircle =
    `M${fmt(chalkPts[0][0])},${fmt(chalkPts[0][1])}` +
    chalkPts.slice(1).map((p) => `L${fmt(p[0])},${fmt(p[1])}`).join('') + 'Z';

  /* the Prey's whole route, chalked on the field (marching dashes = the run) */
  const route = [];
  for (let i = 0; i <= 96; i++) {
    const pose = C.preyPose(i / 96, { cx, cy, r, squash: RADAR.squash, ph0: PH.ph0, ph1: PH.ph1 });
    route.push(`${fmt(pose.x)},${fmt(pose.y)}`);
  }
  const routePath = `M${route.join('L')}Z`;

  /* prey + hunter starting poses (frame 0 of the loop) */
  const prey0 = C.preyPose(0, { cx, cy, r, squash: RADAR.squash, ph0: PH.ph0, ph1: PH.ph1 });
  const hunters0 = Array.from({ length: RADAR.hunters }, (_, i) =>
    C.hunterPose(0, { cx, cy, r, squash: RADAR.squash, ph0: PH.ph0, ph1: PH.ph1, ph2: PH.ph2 }, i)
  );

  /* report pings start where the prey was at each report time */
  const pingOrigins = [0, 1 / 3, 2 / 3].map((tau) =>
    C.preyPose(tau, { cx, cy, r, squash: RADAR.squash, ph0: PH.ph0, ph1: PH.ph1 })
  );

  const hunterDots = hunters0
    .map(
      (h, i) => `<g class="mh-hero__dot mh-hero__dot--hunter mh-hero__dot--h${i + 1}" transform="translate(${fmt(h.x)} ${fmt(h.y)})">
      <circle r="13" fill="none" stroke="${COLORS.violet}" stroke-opacity="0.4" stroke-width="1.6"/>
      <circle r="7" fill="${COLORS.violet}"/>
    </g>`
    )
    .join('\n    ');

  const pingRings = pingOrigins
    .map(
      (p, i) => `<g transform="translate(${fmt(p.x)} ${fmt(p.y)})"><circle class="mh-hero__ping mh-hero__ping--${i}" cx="0" cy="0" r="14" fill="none" stroke="${COLORS.coral}" stroke-opacity="0" stroke-width="2.6"/></g>`
    )
    .join('\n    ');

  const sweepHalf = 52 / 2;
  const wa = C.polar(0, 0, r * 0.995, -sweepHalf);
  const wb = C.polar(0, 0, r * 0.995, sweepHalf);
  const wedge = `M0,0L${fmt(wa.x)},${fmt(wa.y)}A${fmt(r * 0.995)},${fmt(r * 0.995)} 0 0 1 ${fmt(wb.x)},${fmt(wb.y)}Z`;

  return `<svg class="mh-hero__art" viewBox="0 0 ${W} ${H}" role="img" aria-label="An Open Zone radar: the coral Prey dot runs as violet Hunter dots close in.">
  <rect width="${W}" height="${H}" fill="${COLORS.field}"/>
  <g class="mh-hero__blocks">${blockMap()}</g>
  <defs>
    <pattern id="mhHeroDots" width="50" height="50" patternUnits="userSpaceOnUse">
      <circle cx="25" cy="25" r="1.4" fill="${COLORS.cyan}" fill-opacity="0.1"/>
    </pattern>
    <pattern id="mhHeroDotsMajor" width="250" height="250" patternUnits="userSpaceOnUse">
      <circle cx="125" cy="125" r="2.4" fill="${COLORS.cyan}" fill-opacity="0.17"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#mhHeroDots)"/>
  <rect width="${W}" height="${H}" fill="url(#mhHeroDotsMajor)"/>
  ${chalkSpecks()}
  ${markings()}
  <g class="mh-hero__radar">
    <circle cx="${cx}" cy="${cy}" r="${fmt(r * 1.17)}" fill="#07101C" fill-opacity="0.62"/>
    <g stroke="${COLORS.cyan}" stroke-opacity="0.09" stroke-width="1">
      <line x1="${cx - r * 1.17}" y1="${cy}" x2="${cx + r * 1.17}" y2="${cy}"/>
      <line x1="${cx}" y1="${cy - r * 1.17}" x2="${cx}" y2="${cy + r * 1.17}"/>
    </g>
    <g stroke="${COLORS.cyan}" stroke-opacity="0.26" stroke-width="1.4">${ticks}</g>
    <circle class="mh-hero__outer" cx="${cx}" cy="${cy}" r="${fmt(r * 1.115)}" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.2" stroke-width="1.5" stroke-dasharray="2 10"/>
    <circle cx="${cx}" cy="${cy}" r="${fmt(r * 0.68)}" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.1" stroke-width="1" stroke-dasharray="2 12"/>
    <path d="${chalkCircle}" fill="none" stroke="${COLORS.chalk}" stroke-opacity="0.19" stroke-width="2.4" stroke-linecap="round"/>
    <path d="${zonePath}" fill="none" stroke="${COLORS.cyan}" stroke-width="4"/>
    <g class="mh-hero__sweep">
      <path d="${wedge}" fill="${COLORS.cyan}" fill-opacity="0.042"/>
      <line x1="0" y1="0" x2="${fmt(r * 1.1)}" y2="0" stroke="${COLORS.cyan}" stroke-opacity="0.5" stroke-width="1.6"/>
      <circle cx="${fmt(r * 1.1)}" cy="0" r="3" fill="${COLORS.cyan}" fill-opacity="0.9"/>
    </g>
    <path class="mh-hero__trail" d="${routePath}" fill="none" stroke="${COLORS.coral}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.22" stroke-dasharray="3 11"/>
    ${pingRings}
    ${hunterDots}
    <g class="mh-hero__dot mh-hero__dot--prey" transform="translate(${fmt(prey0.x)} ${fmt(prey0.y)})">
      <circle r="17" fill="none" stroke="${COLORS.coral}" stroke-opacity="0.5" stroke-width="2"/>
      <circle r="9.5" fill="${COLORS.coral}"/>
    </g>
  </g>
</svg>`;
}

/* ── CSS keyframes sampled from the motion core ─────────────────────────── */
function keyframeBlock(name, samples, propTable) {
  const lines = [];
  for (let i = 0; i < samples; i++) {
    const p = (i / samples) * 100;
    const { x, y } = propTable(i / samples);
    lines.push(`  ${p.toFixed(2)}% { transform: translate(${fmt(x)}px, ${fmt(y)}px); }`);
  }
  lines.push(`  100% { transform: translate(${fmt(propTable(0).x)}px, ${fmt(propTable(0).y)}px); }`);
  return `@keyframes ${name} {\n${lines.join('\n')}\n}`;
}

const gcfg = { cx: RADAR.cx, cy: RADAR.cy, r: RADAR.r, squash: RADAR.squash, ph0: PH.ph0, ph1: PH.ph1, ph2: PH.ph2 };
const preyKeyframes = keyframeBlock('mh-hero-prey', SAMPLES, (tau) => C.preyPose(tau, gcfg));
const hunterKeyframes = Array.from({ length: RADAR.hunters }, (_, i) =>
  keyframeBlock(`mh-hero-h${i + 1}`, SAMPLES, (tau) => C.hunterPose(tau, gcfg, i))
);
const startPos = (i) => {
  const h = C.hunterPose(0, gcfg, i);
  return { x: h.x, y: h.y };
};
const preyStart = C.preyPose(0, gcfg);

const dotBaseRules = [
  `.mh-hero__dot--prey { transform: translate(${fmt(preyStart.x)}px, ${fmt(preyStart.y)}px); animation: mh-hero-prey ${LOOP_S}s linear infinite; }`,
  ...Array.from({ length: RADAR.hunters }, (_, i) => {
    const p = startPos(i);
    return `.mh-hero__dot--h${i + 1} { transform: translate(${fmt(p.x)}px, ${fmt(p.y)}px); animation: mh-hero-h${i + 1} ${LOOP_S}s linear infinite; }`;
  }),
].join('\n');

/* ── CSS ────────────────────────────────────────────────────────────────── */
const css = `/* ============================================================================
   ManHunt — install-page hero (self-contained: no JS, no external assets)
   Generated by tools/build-site-hero.mjs from src/motion-core.js.
   Scoped under .mh-hero; safe to paste into server/src/app.ts.
   Brand: Open Zone radar + drawn MANHUNT wordmark. Cyan = field/referee,
   coral = Prey, violet = Hunters. Flat fills only, no gradients or glow.
   ============================================================================ */
.mh-hero {
  --mh-field: ${COLORS.field};
  --mh-chalk: ${COLORS.chalk};
  --mh-muted: ${COLORS.muted};
  --mh-dim: ${COLORS.dim};
  container-type: inline-size;
  display: block;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  color: var(--mh-chalk);
}
.mh-hero__frame { position: relative; overflow: hidden; background: var(--mh-field); }
.mh-hero__art { display: block; width: 100%; height: auto; }
.mh-hero__wordmark { position: absolute; left: 5.33%; top: 12%; width: 26.7%; }
.mh-hero__wordmark svg { display: block; width: 100%; height: auto; }
.mh-hero__rule { position: absolute; left: 5.33%; top: 24.6%; width: ${pct(120, W)}; height: ${pct(5, H)}; background: var(--mh-chalk); opacity: 0.92; }
.mh-hero__rule::after { content: ""; position: absolute; left: calc(100% + 8px); top: 0; width: 38%; height: 100%; background: ${COLORS.cyan}; }
.mh-hero__hook {
  position: absolute; left: 5.33%; top: 28.6%; margin: 0; padding: 0;
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
  font-weight: 700; font-size: 38px; letter-spacing: -0.022em; line-height: 0.99;
  color: var(--mh-chalk); max-width: ${pct(600, W)};
}
.mh-hero__desc {
  position: absolute; left: 5.33%; top: 56.5%; margin: 0;
  font-family: "Segoe UI", system-ui, -apple-system, Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 13px; line-height: 1.4; letter-spacing: -0.004em; color: var(--mh-muted);
}
.mh-hero__legend {
  position: absolute; left: 5.33%; top: 66.5%; margin: 0; display: flex; align-items: center; gap: 18px;
  font-family: ui-monospace, "Cascadia Mono", "Segoe UI Mono", Consolas, monospace;
  font-size: 10px; letter-spacing: 0.16em; color: var(--mh-muted);
}
.mh-hero__legend span { display: inline-flex; align-items: center; gap: 7px; }
.mh-hero__legend i { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.mh-hero__micro {
  position: absolute; left: 5.33%; top: 79%; margin: 0;
  font-family: ui-monospace, "Cascadia Mono", "Segoe UI Mono", Consolas, monospace;
  font-size: 10.5px; letter-spacing: 0.055em; color: var(--mh-dim);
}
@supports (font-size: 1cqw) {
  .mh-hero__hook { font-size: 6.33cqw; }
  .mh-hero__desc { font-size: 2.17cqw; }
  .mh-hero__legend { font-size: 1.75cqw; }
  .mh-hero__micro { font-size: 1.8cqw; }
}
@container (max-width: 560px) {
  .mh-hero__wordmark { width: 45%; top: 9%; }
  .mh-hero__rule { top: 23.5%; width: 18%; }
  .mh-hero__hook { font-size: 26px; font-size: 7.6cqw; top: 26.5%; max-width: 72%; }
  .mh-hero__desc, .mh-hero__legend, .mh-hero__micro { display: none; }
}

/* ── motion (all CSS; disabled entirely under reduced motion) ────────────── */
.mh-hero__sweep {
  transform-box: view-box; transform-origin: ${RADAR.cx}px ${RADAR.cy}px;
  animation: mh-hero-spin ${LOOP_S}s linear infinite;
}
.mh-hero__outer { animation: mh-hero-march-ring 6s linear infinite; }
.mh-hero__trail { animation: mh-hero-march-trail 0.9s linear infinite; }
${dotBaseRules}
.mh-hero__ping { transform-box: fill-box; transform-origin: center; animation: mh-hero-ping 2.6667s cubic-bezier(0.2, 0.6, 0.4, 1) infinite both; }
.mh-hero__ping--1 { animation-delay: 0.889s; }
.mh-hero__ping--2 { animation-delay: 1.778s; }
@keyframes mh-hero-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes mh-hero-march-trail { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -14; } }
@keyframes mh-hero-march-ring { from { stroke-dashoffset: 0; } to { stroke-dashoffset: -12; } }
@keyframes mh-hero-ping {
  0% { transform: scale(0.5); opacity: 0; }
  12% { opacity: 0.42; }
  65% { opacity: 0.1; }
  100% { transform: scale(3.6); opacity: 0; }
}
${preyKeyframes}
${hunterKeyframes.join('\n')}
@media (prefers-reduced-motion: reduce) {
  .mh-hero *, .mh-hero *::before, .mh-hero *::after { animation: none !important; transition: none !important; }
  .mh-hero__ping { display: none; }
}
`;

/* ── markup ─────────────────────────────────────────────────────────────── */
const heroMarkup = `<section class="mh-hero" aria-labelledby="mh-hero-title">
  <div class="mh-hero__frame">
    ${buildArt()}
    <span class="mh-hero__wordmark" role="img" aria-label="ManHunt">
      ${wordmarkSvg.replace('<svg', '<svg aria-hidden="true" focusable="false"')}
    </span>
    <span class="mh-hero__rule" aria-hidden="true"></span>
    <h1 class="mh-hero__hook" id="mh-hero-title">Hide from <br>your friends.</h1>
    <p class="mh-hero__desc">Real-world GPS hide-and-seek for Android.</p>
    <p class="mh-hero__legend" aria-hidden="true"><span><i style="background:${COLORS.coral}"></i>PREY</span><span><i style="background:${COLORS.violet}"></i>HUNTERS</span></p>
    <p class="mh-hero__micro">free APK · Android 8+ · not on Play Store</p>
  </div>
</section>`;

const snippet = `<!-- ============================================================================
     ManHunt install-page hero — self-contained (no JS, no external assets).
     Generated by design/brand/motion-kit/tools/build-site-hero.mjs.
     Paste the <style> block into the page's existing <style> section and the
     <section> where the old <header class="hero"> block was. The hero includes
     the page's <h1> ("Hide from your friends." — brand copy v2 short form).
     Motion loops at ${LOOP_S}s; prefers-reduced-motion renders a complete static poster.
     ============================================================================ -->
<style>
${css}
</style>
${heroMarkup}
`;

const preview = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ManHunt — install-page hero (1200×600, CSS only)</title>
<style>
  html, body { margin: 0; padding: 0; background: #05080f; }
  body { display: flex; align-items: flex-start; justify-content: center; min-height: 100vh; }
  .mh-hero { width: 1200px; max-width: none; }
</style>
<style>
${css}
</style>
</head>
<body>
${heroMarkup}
</body>
</html>
`;

await writeFile(path.join(OUT, 'hero.css'), css, 'utf8');
await writeFile(path.join(OUT, 'hero-snippet.html'), snippet, 'utf8');
await writeFile(path.join(OUT, 'site-hero.html'), preview, 'utf8');
console.log('[site-hero] wrote site-hero/site-hero.html, site-hero/hero-snippet.html, site-hero/hero.css');
console.log(`[site-hero] loop ${LOOP_S}s · ${SAMPLES} keyframe samples · wordmark inlined from assets/lockup`);
