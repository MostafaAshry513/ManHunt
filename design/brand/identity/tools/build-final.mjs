// Final identity package (task-36): approved Open Zone lockup, Android handoff,
// install-page handoff. Run: node tools/build-final.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { renderHtml } from './render.mjs';
import { TOKENS, openZone, svgDoc, toMono } from './concepts.mjs';
import {
  LOCKUP_STATES, LOCKUP_STATE_KEYS, LOCKUP_METRICS, lockupSvg, wordmarkSvg as lockupWordmarkSvg, markSvg,
} from './lockup.mjs';
import { wordmark, wordmarkInner } from './wordmark.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FINAL = path.join(ROOT, 'final');
const BUILD = path.join(__dirname, 'build');
const F = TOKENS.field;
const P = (n) => Number(n.toFixed(2));

// ------------------------------------------------------------------ fonts (preview/OU assets only)
const FONT_CACHE = path.join(os.tmpdir(), 'manhunt-identity-fonts');
async function fontB64(family, weight) {
  const cacheFile = path.join(FONT_CACHE, `${family.replace(/ /g, '-')}-${weight}.b64`);
  if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile, 'utf8');
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&display=swap`;
    const res = await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36' } });
    const css = await res.text();
    const m = css.match(/url\((https:[^)]+\.woff2)\)/);
    if (!m) throw new Error('no woff2');
    const b64 = Buffer.from(await (await fetch(m[1])).arrayBuffer()).toString('base64');
    fs.mkdirSync(FONT_CACHE, { recursive: true });
    fs.writeFileSync(cacheFile, b64);
    return b64;
  } catch (err) {
    console.warn(`[fonts] ${family} ${weight}: ${err.message}`);
    return null;
  }
}
const notoB64 = null;
const [displayBold, displayBook, monoB64] = await Promise.all([
  fontB64('Barlow Condensed', 600),
  fontB64('Barlow Condensed', 400),
  fontB64('IBM Plex Mono', 400),
]);
const FONT_FACES =
  (displayBold ? `@font-face{font-family:'MHDisplay';src:url(data:font/woff2;base64,${displayBold}) format('woff2');font-weight:600;font-display:block}` : '') +
  (displayBook ? `@font-face{font-family:'MHDisplay';src:url(data:font/woff2;base64,${displayBook}) format('woff2');font-weight:400;font-display:block}` : '') +
  (monoB64 ? `@font-face{font-family:'MHData';src:url(data:font/woff2;base64,${monoB64}) format('woff2');font-weight:400;font-display:block}` : '');
const DISPLAY = "'MHDisplay','Bahnschrift SemiBold','Arial Narrow',sans-serif";
const BOOK = "'MHDisplay','Bahnschrift','Arial',sans-serif";
const DATA = "'MHData','Cascadia Mono',Consolas,monospace";

// ------------------------------------------------------------------ helpers
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, typeof content === 'string' ? content : content);
  return file;
}
const pageHtml = ({ w, h, bg = 'transparent', body, css = '' }) => `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${w}px;height:${h}px;overflow:hidden;background:${bg}}
  svg,img{display:block}
  ${css}
</style></head><body>${body}</body></html>`;

async function renderPage(name, { w, h, bg = 'transparent', body, css = '', transparent = true }) {
  fs.mkdirSync(BUILD, { recursive: true });
  const htmlPath = path.join(BUILD, `${name}.html`);
  fs.writeFileSync(htmlPath, pageHtml({ w, h, bg, body, css }));
  const png = path.join(BUILD, 'final', `${name}.png`);
  await renderHtml(htmlPath, png, { width: w, height: h, scale: 1, transparent });
  return png;
}

/** Render an SVG document string to a PNG at an exact size (keeps aspect). */
async function renderSvg(name, svg, { width, height, transparent = true }) {
  const sized = svg.replace(/width="[^"]*"/, `width="${width}"`).replace(/height="[^"]*"/, `height="${height}"`);
  return renderPage(name, { w: width, h: height, body: sized, transparent });
}

const dataUri = (p) => 'data:image/png;base64,' + fs.readFileSync(p).toString('base64');
const copy = (from, to) => {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  return to;
};

const manifest = [];
function rec(file, note) {
  const st = fs.statSync(file);
  manifest.push({ path: path.relative(FINAL, file).replace(/\\/g, '/'), bytes: st.size, sha256: sha(fs.readFileSync(file)), note });
}

// ------------------------------------------------------------------ 1. lockup sources
const lockupDir = path.join(FINAL, 'lockup');
const previewDir = path.join(lockupDir, 'previews');
for (const layout of ['horizontal', 'stacked']) {
  for (const state of LOCKUP_STATE_KEYS) {
    const f = write(path.join(lockupDir, `lockup-${layout}-${state}.svg`), lockupSvg({ layout, state }));
    rec(f, `${layout} lockup, ${LOCKUP_STATES[state].label}`);
  }
}
for (const state of LOCKUP_STATE_KEYS) {
  rec(write(path.join(lockupDir, `wordmark-${state}.svg`), lockupWordmarkSvg({ state })), `MANHUNT wordmark, ${state}`);
  rec(write(path.join(lockupDir, `mark-${state}.svg`), markSvg({ state })), `Open Zone mark only, ${state}`);
}

// lockup PNG previews (transparent)
const lockupPngs = {};
for (const layout of ['horizontal', 'stacked']) {
  const svg = lockupSvg({ layout, state: 'light-on-dark' });
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const vbW = Number(vb[1]);
  const vbH = Number(vb[2]);
  for (const state of LOCKUP_STATE_KEYS) {
    const s = lockupSvg({ layout, state });
    const width = layout === 'horizontal' ? 1200 : 760;
    const height = Math.round((width * vbH) / vbW);
    const png = await renderSvg(`lockup-${layout}-${state}`, s, { width, height });
    const out = copy(png, path.join(previewDir, `lockup-${layout}-${state}.png`));
    rec(out, `PNG preview ${layout} ${state}, ${width}x${height}`);
    lockupPngs[`${layout}-${state}`] = out;
  }
}
// wordmark PNG previews
const wordmarkPngs = {};
for (const state of LOCKUP_STATE_KEYS) {
  const svg = lockupWordmarkSvg({ state });
  const vb = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
  const width = 1000;
  const height = Math.round((width * Number(vb[2])) / Number(vb[1]));
  const png = await renderSvg(`wordmark-${state}`, svg, { width, height });
  const out = copy(png, path.join(previewDir, `wordmark-${state}.png`));
  rec(out, `PNG preview wordmark ${state}, ${width}x${height}`);
  wordmarkPngs[state] = out;
}

// ------------------------------------------------------------------ 2. lockup sheet
const M = LOCKUP_METRICS;
const sheetCss = `
  ${FONT_FACES}
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1600px;height:1180px;background:#05090F;overflow:hidden;color:#E6EDF7;font-family:'Segoe UI',Arial,sans-serif}
  .sheet{width:1600px;height:1180px;padding:34px 38px 0;position:relative}
  .top{display:flex;align-items:flex-end;justify-content:space-between;border-bottom:1px solid #1B273C;padding-bottom:16px}
  .brand{display:flex;align-items:baseline;gap:14px}
  .brand .wm{font-family:${DISPLAY};font-size:26px;letter-spacing:.16em}
  .brand .sub{font-size:10.5px;letter-spacing:.22em;color:#7C8CA6;text-transform:uppercase}
  .plate{font-family:${DATA};font-size:10.5px;color:#7C8CA6}
  .plate b{color:#22D3EE;font-weight:400}
  .body{display:grid;grid-template-columns:372px minmax(0,1fr);gap:32px;padding-top:24px}
  .rail h1{font-family:${DISPLAY};font-size:34px;line-height:1;font-weight:600;margin:0}
  .rail .approved{display:inline-flex;align-items:center;gap:8px;margin-top:12px;font-family:${DATA};font-size:9.5px;letter-spacing:.14em;text-transform:uppercase;color:#22D3EE;border:1px solid #1B3A47;background:#0A1C22;border-radius:3px;padding:5px 9px}
  .rail .approved i{width:6px;height:6px;border-radius:50%;background:#22D3EE;display:block}
  .rail p{font-size:13px;line-height:1.6;color:#C3D0E2;margin-top:14px}
  .rule{height:1px;background:#1B273C;margin:18px 0}
  .spec{font-family:${DATA};font-size:10.5px;line-height:1.85;color:#93A5BE}
  .spec .k{display:inline-block;width:118px;color:#5F7089}
  .spec .v{color:#D6E2F2}
  .grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:12px;align-content:start}
  .panel{background:#0A111C;border:1px solid #1B273C;border-radius:6px;padding:12px;min-width:0}
  .cap{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:9px}
  .t{font-family:${DATA};font-size:9px;letter-spacing:.13em;color:#7C8CA6;text-transform:uppercase}
  .n{font-family:${DATA};font-size:9px;color:#4F627C}
  .stage{display:flex;align-items:center;justify-content:center;border-radius:4px;padding:14px}
  .stage.on-field{background:${TOKENS.field}}
  .stage.on-chalk{background:${TOKENS.lightGround}}
  .stage img{max-width:100%;height:auto;display:block}
  .note{font-family:${DATA};font-size:9.5px;color:#5F7089;line-height:1.55;margin-top:8px}
  .clearspace{position:relative}
  .clearspace .box{position:absolute;border:1px dashed #F5C542;border-radius:1px}
  .foot{position:absolute;left:38px;right:38px;bottom:20px;display:flex;justify-content:space-between;border-top:1px solid #1B273C;padding-top:12px;font-family:${DATA};font-size:9.5px;color:#5F7089}
`;

// clear-space overlay geometry (horizontal lockup, design units)
const hSvg = lockupSvg({ layout: 'horizontal', state: 'light-on-dark' });
const hVb = hSvg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
const hW = Number(hVb[1]);
const hH = Number(hVb[2]);
const insetX = (M.PAD / hW) * 100;
const insetY = (M.PAD / hH) * 100;

const sheetBody = `<div class="sheet">
  <div class="top">
    <div class="brand"><span class="wm">MANHUNT</span><span class="sub">identity · approved lockup</span></div>
    <div class="plate">plate <b>L01</b> / 01 · Open Zone + MANHUNT · approved 2026-11-01</div>
  </div>
  <div class="body">
    <div class="rail">
      <h1>Approved<br>lockup</h1>
      <div class="approved"><i></i> owner approved · Open Zone</div>
      <p>The Open Zone mark paired with the drawn MANHUNT wordmark. The wordmark is a custom
      condensed grotesque drawn for ManHunt — no font is required to render it, so the lockup is
      byte-identical everywhere.</p>
      <div class="rule"></div>
      <div class="spec">
        <div><span class="k">wordmark</span><span class="v">MANHUNT · 7 glyphs</span></div>
        <div><span class="k">cap height</span><span class="v">100 units · stem 16</span></div>
        <div><span class="k">tracking</span><span class="v">10 units (0.10 cap)</span></div>
        <div><span class="k">mark</span><span class="v">⌀ 1.2 cap · 0.56 cap gap</span></div>
        <div><span class="k">clear space</span><span class="v">0.5 cap (50 units)</span></div>
        <div><span class="k">min size</span><span class="v">wordmark cap 22 px · lockup 180 px</span></div>
      </div>
      <div class="rule"></div>
      <div class="spec" style="margin-bottom:6px">colour states</div>
      <div class="spec" style="color:#93A5BE">
        <div><span class="k">light-on-dark</span><span class="v">chalk on field</span></div>
        <div><span class="k">dark-on-light</span><span class="v">field ink on chalk</span></div>
        <div><span class="k">mono</span><span class="v">one ink, black</span></div>
      </div>
      <div class="rule"></div>
      <div class="note">slogan pairing: set the approved line “No gear. No fee. Just players.” outside the
      lockup's clear space, never inside the mark. Files: final/lockup/, final/LOCKUP.md.</div>
    </div>
    <div class="grid">
      <div class="panel" style="grid-column:span 7">
        <div class="cap"><span class="t">horizontal · light on dark</span><span class="n">primary use</span></div>
        <div class="stage on-field"><img src="${dataUri(lockupPngs['horizontal-light-on-dark'])}" style="width:100%"></div>
      </div>
      <div class="panel" style="grid-column:span 5">
        <div class="cap"><span class="t">clear space</span><span class="n">0.5 cap</span></div>
        <div class="clearspace"><div class="stage on-field"><img src="${dataUri(lockupPngs['horizontal-light-on-dark'])}" style="width:100%"></div>
          <div class="box" style="left:${P(insetX)}%;top:${P(insetY)}%;right:${P(insetX)}%;bottom:${P(insetY)}%"></div>
        </div>
        <div class="note">dashed = minimum clear space around the lockup</div>
      </div>
      <div class="panel" style="grid-column:span 6">
        <div class="cap"><span class="t">horizontal · dark on light</span><span class="n">chalk ground</span></div>
        <div class="stage on-chalk"><img src="${dataUri(lockupPngs['horizontal-dark-on-light'])}" style="width:100%"></div>
      </div>
      <div class="panel" style="grid-column:span 6">
        <div class="cap"><span class="t">horizontal · monochrome</span><span class="n">one ink</span></div>
        <div class="stage on-chalk"><img src="${dataUri(lockupPngs['horizontal-mono'])}" style="width:100%"></div>
      </div>
      <div class="panel" style="grid-column:span 6">
        <div class="cap"><span class="t">stacked · light on dark</span><span class="n">narrow formats</span></div>
        <div class="stage on-field"><img src="${dataUri(lockupPngs['stacked-light-on-dark'])}" style="width:62%"></div>
      </div>
      <div class="panel" style="grid-column:span 6">
        <div class="cap"><span class="t">stacked · dark on light</span><span class="n">print / light UI</span></div>
        <div class="stage on-chalk"><img src="${dataUri(lockupPngs['stacked-dark-on-light'])}" style="width:62%"></div>
      </div>
      <div class="panel" style="grid-column:span 12">
        <div class="cap"><span class="t">minimum sizes</span><span class="n">lockup width</span></div>
        <div style="display:flex;gap:28px;align-items:center;justify-content:space-between">
          <div style="text-align:center"><div class="stage on-field" style="padding:10px"><img src="${dataUri(lockupPngs['horizontal-light-on-dark'])}" style="width:320px"></div><div class="note" style="text-align:left">320 px</div></div>
          <div style="text-align:center"><div class="stage on-field" style="padding:10px"><img src="${dataUri(lockupPngs['horizontal-light-on-dark'])}" style="width:240px"></div><div class="note" style="text-align:left">240 px</div></div>
          <div style="text-align:center"><div class="stage on-field" style="padding:10px"><img src="${dataUri(lockupPngs['horizontal-light-on-dark'])}" style="width:180px"></div><div class="note" style="text-align:left">180 px — minimum</div></div>
        </div>
        <div class="note">below 180 px use the mark alone (final/install/app-icon.svg); the wordmark never goes below 22 px cap height.</div>
      </div>
    </div>
  </div>
  <div class="foot"><span>MANHUNT · approved Open Zone lockup · original vector geometry</span><span>sources: final/lockup/*.svg · PNG previews in final/lockup/previews/</span></div>
</div>`;
fs.writeFileSync(path.join(BUILD, 'final', 'lockup-sheet.html'), pageHtml({ w: 1600, h: 1180, bg: '#05090F', body: sheetBody, css: sheetCss }));
await renderHtml(path.join(BUILD, 'final', 'lockup-sheet.html'), path.join(previewDir, 'lockup-sheet.png'), { width: 1600, height: 1180, scale: 1, transparent: false });
rec(path.join(previewDir, 'lockup-sheet.png'), 'lockup specimen sheet 1600x1180');

// ------------------------------------------------------------------ 3. Android handoff
const androidDir = path.join(FINAL, 'android');
const exportsDir = path.join(ROOT, 'previews', '01-open-zone', 'exports');
const conceptAndroid = path.join(ROOT, 'concepts', '01-open-zone', 'android');
for (const f of ['ic_launcher_foreground.xml', 'ic_launcher_monochrome.xml']) {
  rec(copy(path.join(conceptAndroid, f), path.join(androidDir, f)), 'VectorDrawable for res/drawable/');
}
const adaptive = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/icon_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
    <monochrome android:drawable="@drawable/ic_launcher_monochrome" />
</adaptive-icon>
`;
for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  rec(write(path.join(androidDir, 'mipmap-anydpi-v26', name), adaptive), 'adaptive icon definition for res/mipmap-anydpi-v26/');
}
rec(
  write(path.join(androidDir, 'values', 'icon_colors.xml'), `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Icon background: the brand field colour. If the app already has this value
         (launch_bg = #0B1220), point the background at @color/launch_bg instead. -->
    <color name="icon_background">#0B1220</color>
</resources>
`),
  'new values resource (additive) for res/values/',
);
const densities = [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]];
for (const [dpi, px] of densities) {
  rec(copy(path.join(exportsDir, `legacy-${px}.png`), path.join(androidDir, `mipmap-${dpi}`, 'ic_launcher.png')), `legacy launcher ${px}px → res/mipmap-${dpi}/`);
  rec(copy(path.join(exportsDir, `legacy-round-${px}.png`), path.join(androidDir, `mipmap-${dpi}`, 'ic_launcher_round.png')), `legacy round ${px}px → res/mipmap-${dpi}/`);
}
rec(copy(path.join(exportsDir, 'play-512.png'), path.join(androidDir, 'play-512.png')), 'Google Play store icon 512x512');
rec(copy(path.join(exportsDir, 'favicon-32.png'), path.join(androidDir, 'favicon-32.png')), 'web favicon 32x32');
rec(copy(path.join(exportsDir, 'legacy-48.png'), path.join(androidDir, 'favicon-48.png')), 'web favicon 48x48');

// ------------------------------------------------------------------ 4. install-page handoff
const installDir = path.join(FINAL, 'install');
rec(copy(path.join(exportsDir, 'favicon-32.png'), path.join(installDir, 'favicon-32.png')), 'install page favicon 32x32');
rec(copy(path.join(exportsDir, 'legacy-48.png'), path.join(installDir, 'favicon-48.png')), 'install page favicon 48x48');
rec(
  write(path.join(installDir, 'app-icon.svg'), svgDoc(openZone().inner, { bg: F, size: 108, title: 'ManHunt', desc: 'Open Zone app icon: cyan zone ring with the break, coral prey dot.' })),
  'inline-ready app icon SVG (108 dp composite)',
);
const install192 = await renderSvg('install-page-icon-192', svgDoc(openZone().inner, { bg: F, size: 192 }), { width: 192, height: 192, transparent: false });
rec(copy(install192, path.join(installDir, 'install-page-icon-192.png')), 'web app / touch icon 192x192');

// ------------------------------------------------------------------ 5. OG image 1200x630
const WM_TINY = wordmark({ cap: 34 });
const ogCss = `
  ${FONT_FACES}
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1200px;height:630px;background:${F};overflow:hidden;color:#E6EDF7;font-family:${BOOK}}
  .og{position:relative;width:1200px;height:630px;padding:64px 72px;display:flex;justify-content:space-between;align-items:center}
  .left{width:700px;display:flex;flex-direction:column;justify-content:center}
  .wm{width:${P((WM_TINY.width * 34) / 34)}px;height:34px}
  .rule{width:64px;height:3px;background:${TOKENS.signal};margin-top:34px}
  h1{font-family:${DISPLAY};font-weight:600;font-size:88px;line-height:.95;letter-spacing:-.01em;margin-top:26px}
  h1 .coral{color:${TOKENS.prey}}
  .sub{font-family:${BOOK};font-weight:400;font-size:22px;letter-spacing:.06em;color:#A7B6CC;margin-top:34px}
  .mark{width:286px;height:286px;align-self:center;margin-right:8px}
  .corner{position:absolute;left:72px;bottom:38px;font-family:${DATA};font-size:11px;letter-spacing:.18em;color:#4F627C}
`;
const ogBody = `<div class="og">
  <div class="left">
    <svg class="wm" viewBox="0 0 ${P(WM_TINY.width)} 34" width="${P(WM_TINY.width)}" height="34">${wordmarkInner({ height: 34, fill: TOKENS.chalk })}</svg>
    <div class="rule"></div>
    <h1>No gear. No fee.<br><span class="coral">Just players.</span></h1>
    <div class="sub">Real-world GPS hide-and-seek</div>
  </div>
  <svg class="mark" viewBox="0 0 108 108" width="286" height="286">${openZone().inner}</svg>
  <div class="corner">MANHUNT · ANDROID · FREE APK</div>
</div>`;
const ogPng = await renderPage('og-image-1200x630', { w: 1200, h: 630, bg: F, body: ogBody, css: ogCss, transparent: false });
rec(copy(ogPng, path.join(installDir, 'og-image-1200x630.png')), 'Open Graph / social card 1200x630');

// ------------------------------------------------------------------ 6. manifest
for (const rel of ['README.md', 'LOCKUP.md', 'android/README.md', 'install/README.md']) {
  const abs = path.join(FINAL, rel);
  if (fs.existsSync(abs) && !manifest.some((m) => m.path === rel)) rec(abs, 'handoff document');
}
manifest.sort((a, b) => a.path.localeCompare(b.path));
write(
  path.join(FINAL, 'MANIFEST.json'),
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      status: 'APPROVED — owner approved Open Zone + "No gear. No fee. Just players."',
      wordmark: 'MANHUNT (drawn, 7 glyph paths, cap 100 units, stem 16, tracking 10)',
      mark: 'Open Zone, unchanged geometry from concepts/01-open-zone/mark.svg',
      canonicalForMotion: 'final/lockup/lockup-stacked-light-on-dark.svg and final/lockup/wordmark-light-on-dark.svg',
      files: manifest,
    },
    null,
    2,
  ),
);
console.log(`final package written: ${manifest.length} files`);
for (const m of manifest) console.log(`  ${m.path}  (${m.bytes} B)`);
