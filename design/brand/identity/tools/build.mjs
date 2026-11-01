// ManHunt identity build: emits SVG sources (+ ready Android VectorDrawables),
// raster exports, specimen sheets. Run: node tools/build.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderHtml } from './render.mjs';
import { decodePng, encodePng, cropRgba } from './png.mjs';
import { TOKENS, CONCEPTS, svgDoc, toMono } from './concepts.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(__dirname, 'build');
const CONCEPTS_DIR = path.join(ROOT, 'concepts');
const PREVIEWS = path.join(ROOT, 'previews');
const F = TOKENS.field;
const SHEETS_ONLY = process.argv.includes('--sheets');
const f = (n) => Number(n.toFixed(2));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ------------------------------------------------------------------ fonts
const FONT_CACHE = path.join(os.tmpdir(), 'manhunt-identity-fonts');
const DISPLAY_FONT = 'Barlow Condensed';
const MONO_FONT = 'IBM Plex Mono';

async function fetchFontDataUri(family, weight) {
  const cacheFile = path.join(FONT_CACHE, `${family.replace(/ /g, '-')}-${weight}.b64`);
  if (fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile, 'utf8');
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&display=swap`;
    const res = await fetch(cssUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36' } });
    const css = await res.text();
    const m = css.match(/url\((https:[^)]+\.woff2)\)/);
    if (!m) throw new Error('no woff2');
    const bin = Buffer.from(await (await fetch(m[1])).arrayBuffer()).toString('base64');
    fs.mkdirSync(FONT_CACHE, { recursive: true });
    fs.writeFileSync(cacheFile, bin);
    return bin;
  } catch (err) {
    console.warn(`[fonts] ${family} ${weight} unavailable (${err.message}) — system fallback`);
    return null;
  }
}

const [displayB64, monoB64] = await Promise.all([fetchFontDataUri(DISPLAY_FONT, 600), fetchFontDataUri(MONO_FONT, 400)]);
const DISPLAY = displayB64 ? "'MHDisplay','Bahnschrift SemiBold','Arial Narrow',sans-serif" : "'Bahnschrift SemiBold','Arial Narrow',sans-serif";
const DATA = monoB64 ? "'MHData','Cascadia Mono',Consolas,monospace" : "'Cascadia Mono',Consolas,monospace";
const FONT_FACES =
  (displayB64 ? `@font-face{font-family:'MHDisplay';src:url(data:font/woff2;base64,${displayB64}) format('woff2');font-weight:600;font-display:block}` : '') +
  (monoB64 ? `@font-face{font-family:'MHData';src:url(data:font/woff2;base64,${monoB64}) format('woff2');font-weight:400;font-display:block}` : '');

// ------------------------------------------------------------------ svg -> android vector
function androidPathFromCircle(cx, cy, r, fill) {
  const d = `M${f(cx - r)},${f(cy)}a${f(r)},${f(r)} 0 1,0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1,0 ${f(-2 * r)},0`;
  return `<path\n        android:fillColor="${fill}"\n        android:pathData="${d}" />`;
}

function toAndroidVector(svgInner, { size = 108, fill = null } = {}) {
  let body = svgInner;
  if (fill) body = toMono(body, fill);
  const out = [];
  const re = /<g transform="rotate\(([-\d.]+) 54 54\)">([\s\S]*?)<\/g>|<path([^>]*)\/>|<circle([^>]*)\/>/g;
  let m;
  const attr = (s, n) => (s.match(new RegExp(`${n}="([^"]*)"`)) || [])[1];
  while ((m = re.exec(body))) {
    if (m[1] !== undefined) {
      const inner = toAndroidVector(m[2], { size });
      out.push(`<group\n        android:pivotX="54"\n        android:pivotY="54"\n        android:rotation="${m[1]}">\n        ${inner.replace(/\n/g, '\n      ')}\n      </group>`);
    } else if (m[3] !== undefined) {
      const a = m[3];
      const stroke = attr(a, 'stroke');
      const fillCol = attr(a, 'fill');
      const d = attr(a, 'd');
      const parts = [`android:pathData="${d}"`];
      if (fillCol && fillCol !== 'none') parts.push(`android:fillColor="${fillCol}"`);
      if (stroke && stroke !== 'none') {
        parts.push(`android:strokeColor="${stroke}"`, `android:strokeWidth="${attr(a, 'stroke-width')}"`, 'android:strokeLineCap="butt"');
        const lj = attr(a, 'stroke-linejoin');
        if (lj) parts.push(`android:strokeLineJoin="${lj}"`);
      }
      out.push(`<path\n        ${parts.join('\n        ')} />`);
    } else if (m[4] !== undefined) {
      const a = m[4];
      out.push(androidPathFromCircle(Number(attr(a, 'cx')), Number(attr(a, 'cy')), Number(attr(a, 'r')), attr(a, 'fill')));
    }
  }
  return out.join('\n      ');
}

function androidVectorXml({ inner, mono = null, title }) {
  return `<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108"
    android:alpha="1">
  <!-- ${title} -->
  ${toAndroidVector(inner, { fill: mono })}
</vector>
`;
}

// ------------------------------------------------------------------ raster helpers
function legacyBody(art, px, { round = false, cropDp = 80 } = {}) {
  const scale = px / cropDp;
  const svgPx = 108 * scale;
  const off = (svgPx - px) / 2;
  return `<div style="position:relative;width:${px}px;height:${px}px;overflow:hidden;${round ? 'border-radius:50%;' : ''}">` +
    `<div style="position:absolute;left:${f(-off)}px;top:${f(-off)}px;width:${f(svgPx)}px;height:${f(svgPx)}px">` +
    svgDoc(art.inner, { bg: F, size: svgPx }) +
    '</div></div>';
}

function pageHtml({ w, h, bg = 'transparent', body, css = '' }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:${w}px;height:${h}px;overflow:hidden;background:${bg}}
  svg{display:block}
  ${css}
  </style></head><body>${body}</body></html>`;
}

function writeSvg(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.trim() + '\n');
}

/** Shelf-pack tiles and render them in ONE headless-Chrome pass, then crop. */
async function renderTileGrid(name, tiles, { pageWidth = 1240, gap = 22 } = {}) {
  const rows = [];
  let row = [];
  let rowW = 0;
  for (const t of tiles) {
    if (rowW + t.w > pageWidth && row.length) {
      rows.push(row);
      row = [];
      rowW = 0;
    }
    row.push(t);
    rowW += t.w + gap;
  }
  if (row.length) rows.push(row);
  const pageHeight = rows.reduce((p, r) => p + Math.max(...r.map((t) => t.h)) + gap, gap);
  const positioned = [];
  let y = gap;
  for (const r of rows) {
    let x = gap;
    const h = Math.max(...r.map((t) => t.h));
    for (const t of r) {
      positioned.push({ ...t, x, y });
      x += t.w + gap;
    }
    y += h + gap;
  }
  const body = positioned
    .map((t) => `<div style="position:absolute;left:${t.x}px;top:${t.y}px;width:${t.w}px;height:${t.h}px">${t.body}</div>`)
    .join('');
  fs.mkdirSync(BUILD, { recursive: true });
  const htmlPath = path.join(BUILD, `${name}.html`);
  fs.writeFileSync(htmlPath, pageHtml({ w: pageWidth, h: pageHeight, body }));
  const gridPng = path.join(BUILD, 'out', `${name}.png`);
  await renderHtml(htmlPath, gridPng, { width: pageWidth, height: pageHeight, scale: 1, transparent: true });
  const img = decodePng(fs.readFileSync(gridPng));
  const rgba = img.channels === 4 ? img.data : null;
  if (!rgba) throw new Error('grid render was not RGBA');
  const written = new Map();
  for (const t of positioned) {
    const cropped = cropRgba(rgba, img.width, img.height, t.x, t.y, t.w, t.h);
    const out = path.join(BUILD, 'out', `${name}--${t.name}.png`);
    fs.writeFileSync(out, encodePng(t.w, t.h, cropped));
    written.set(t.name, out);
  }
  return written;
}

const dataUri = (pngPath) => 'data:image/png;base64,' + fs.readFileSync(pngPath).toString('base64');

// ------------------------------------------------------------------ specimen sheet
const panelCss = `
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1600px;height:792px;background:#05090F;overflow:hidden}
  .sheet{width:1600px;height:792px;background:#05090F;color:#E6EDF7;
         font-family:'Segoe UI',Arial,sans-serif;padding:34px 38px 0;position:relative}
  .top{display:flex;align-items:flex-end;justify-content:space-between;
       border-bottom:1px solid #1B273C;padding-bottom:16px}
  .brand{display:flex;align-items:baseline;gap:14px}
  .brand .wm{font-family:${DISPLAY};font-size:26px;letter-spacing:.16em;color:#E6EDF7}
  .brand .sub{font-size:10.5px;letter-spacing:.22em;color:#7C8CA6;text-transform:uppercase}
  .plate{font-family:${DATA};font-size:10.5px;color:#7C8CA6;letter-spacing:.06em}
  .plate b{color:#22D3EE;font-weight:400}
  .body{display:grid;grid-template-columns:372px minmax(0,1fr);gap:32px;padding-top:24px}
  .rail h1{font-family:${DISPLAY};font-size:74px;line-height:.86;font-weight:600;margin:0;color:#22D3EE}
  .rail h2{font-family:${DISPLAY};font-size:33px;line-height:1;font-weight:600;margin:8px 0 0}
  .strategy{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#8A9BB4;margin-top:10px}
  .idea{font-size:14.5px;line-height:1.6;color:#C3D0E2;margin-top:18px;max-width:360px}
  .rule{height:1px;background:#1B273C;margin:20px 0}
  .spec{font-family:${DATA};font-size:10.5px;line-height:1.85;color:#93A5BE}
  .spec .k{display:inline-block;width:112px;color:#5F7089}
  .spec .v{color:#D6E2F2}
  .chips{display:flex;gap:8px;margin-top:6px}
  .chip{width:52px}
  .chip .sw{height:32px;border-radius:3px;border:1px solid #22304d}
  .chip .lb{font-family:${DATA};font-size:8.5px;color:#7C8CA6;margin-top:4px;line-height:1.35}
  .grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-auto-rows:min-content;gap:12px;min-width:0}
  .panel{background:#0A111C;border:1px solid #1B273C;border-radius:6px;padding:12px;position:relative;overflow:hidden;min-width:0}
  .panel .cap{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px}
  .panel .t{font-family:${DATA};font-size:9px;letter-spacing:.13em;color:#7C8CA6;text-transform:uppercase}
  .panel .n{font-family:${DATA};font-size:9px;color:#4F627C}
  .panel .stage{display:flex;align-items:center;justify-content:center;min-width:0}
  .panel .row{display:flex;gap:10px;align-items:flex-end;justify-content:center;min-width:0}
  .zoomed{image-rendering:pixelated}
  .note{font-family:${DATA};font-size:9.5px;color:#5F7089;line-height:1.5}
  .foot{position:absolute;left:38px;right:38px;bottom:20px;display:flex;justify-content:space-between;
        border-top:1px solid #1B273C;padding-top:12px;font-family:${DATA};font-size:9.5px;color:#5F7089;letter-spacing:.04em}
`;

function sheetHtml(c, files) {
  const A = c.fn();
  const art = A;
  const safeSvg = svgDoc(art.inner, { bg: F, size: 232, guides: true })
    .replace('<svg ', '<svg style="border-radius:4px" ');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${FONT_FACES}
    ${panelCss}
  </style></head><body><div class="sheet">
    <div class="top">
      <div class="brand"><span class="wm">MANHUNT</span><span class="sub">identity · logo &amp; icon</span></div>
      <div class="plate">specimen <b>${c.slug.slice(0, 2)}</b> / 03 · ${esc(c.territory)} · plate rev A</div>
    </div>
    <div class="body">
      <div class="rail">
        <h1>${c.slug.slice(0, 2)}</h1>
        <h2>${esc(c.name)}</h2>
        <div class="strategy">${esc(c.strategy)}</div>
        <p class="idea">${esc(c.idea)}</p>
        <div class="rule"></div>
        <div class="spec">
          <div><span class="k">artboard</span><span class="v">108 × 108 dp</span></div>
          <div><span class="k">safe zone</span><span class="v">Ø 66 dp · mark inside</span></div>
          <div><span class="k">clear space</span><span class="v">16 dp (masked use: auto)</span></div>
          <div><span class="k">minimum size</span><span class="v">24 px · favicon 32 px</span></div>
          <div><span class="k">background</span><span class="v">field #0B1220 · flat</span></div>
        </div>
        <div class="rule"></div>
        <div class="spec" style="margin-bottom:6px">palette tokens</div>
        <div class="chips">
          ${c.palette.map((k) => `<div class="chip"><div class="sw" style="background:${TOKENS[k]}"></div><div class="lb">${k}<br>${TOKENS[k]}</div></div>`).join('')}
          <div class="chip"><div class="sw" style="background:${TOKENS.field}"></div><div class="lb">field<br>${TOKENS.field}</div></div>
        </div>
        <div class="rule"></div>
        <div class="note">export plan: adaptive foreground = <b>mark.svg</b>, background = field colour, monochrome = <b>icon-monochrome.svg</b>, legacy = central 80 dp at 48/72/96/144/192 px, Play = 512 px opaque, favicon 16/32 px.</div>
      </div>
      <div class="grid">
        <div class="panel" style="grid-column:span 4">
          <div class="cap"><span class="t">Play 512 · store icon</span><span class="n">512 × 512</span></div>
          <div class="stage"><img src="${dataUri(files.play512)}" style="width:282px;height:282px;border-radius:6px"></div>
          <div class="note" style="margin-top:10px">full 108 dp art · opaque · no text inside the artwork</div>
        </div>
        <div class="panel" style="grid-column:span 4">
          <div class="cap"><span class="t">Adaptive · 108 dp canvas</span><span class="n">66 dp safe circle</span></div>
          <div class="stage">${safeSvg}</div>
          <div class="note" style="margin-top:10px">dashed = 66 dp safe zone · dotted = 72 dp mask Ø</div>
        </div>
        <div class="panel" style="grid-column:span 4">
          <div class="cap"><span class="t">Monochrome layer</span><span class="n">mark only · one colour</span></div>
          <div class="row" style="gap:14px">
            <div style="text-align:center"><img src="${dataUri(files.monoBlack)}" style="width:130px;height:130px;border-radius:4px"><div class="note" style="margin-top:6px">on black</div></div>
            <div style="text-align:center"><img src="${dataUri(files.monoWhite)}" style="width:130px;height:130px;border-radius:4px"><div class="note" style="margin-top:6px">on white</div></div>
          </div>
          <div class="note" style="margin-top:8px">themed icon · silhouette is the whole mark</div>
        </div>
        <div class="panel" style="grid-column:span 3">
          <div class="cap"><span class="t">48 dp · field</span><span class="n">legacy</span></div>
          <div class="row" style="gap:12px">
            <img src="${dataUri(files.legacy48)}" style="width:48px;height:48px">
            <img class="zoomed" src="${dataUri(files.legacy48)}" style="width:168px;height:168px">
          </div>
          <div class="note" style="margin-top:8px">native · 48 px &nbsp;|&nbsp; 3.5× pixel view</div>
        </div>
        <div class="panel" style="grid-column:span 3">
          <div class="cap"><span class="t">48 dp · chalk ground</span><span class="n">light surfaces</span></div>
          <div class="row" style="gap:12px">
            <img src="${dataUri(files.legacy48Chalk)}" style="width:48px;height:48px">
            <img class="zoomed" src="${dataUri(files.legacy48Chalk)}" style="width:168px;height:168px">
          </div>
          <div class="note" style="margin-top:8px">icon keeps its field square on light UI</div>
        </div>
        <div class="panel" style="grid-column:span 6">
          <div class="cap"><span class="t">Silhouette test · 16 / 24 / 32 / 48 px</span><span class="n">native, pixel-doubled</span></div>
          <div class="row" style="gap:16px;align-items:flex-end">
            ${[['16', files.fav16, 5], ['24', files.fav24, 4.5], ['32', files.fav32, 4], ['48', files.legacy48, 3]]
              .map(([px, img, zoom]) => `<div style="text-align:center"><img class="zoomed" src="${dataUri(img)}" style="width:${Math.round(px * zoom)}px;height:${Math.round(px * zoom)}px;border-radius:2px"><div class="note" style="margin-top:5px">${px} px</div></div>`)
              .join('')}
          </div>
          <div class="note" style="margin-top:8px">measured results in VERIFICATION.md</div>
        </div>
      </div>
    </div>
    <div class="foot">
      <span>MANHUNT · original vector work · no stock, no third-party marks</span>
      <span>source: concepts/${c.slug}/mark.svg · rendered by headless Chrome at native pixel sizes</span>
    </div>
  </div></body></html>`;
}

// ------------------------------------------------------------------ per concept
async function buildConcept(c) {
  const art = c.fn();
  const slugDir = path.join(CONCEPTS_DIR, c.slug);
  const previewDir = path.join(PREVIEWS, c.slug);
  const exportDir = path.join(previewDir, 'exports');
  fs.mkdirSync(slugDir, { recursive: true });
  fs.mkdirSync(exportDir, { recursive: true });

  if (!SHEETS_ONLY) {
  const title = `ManHunt — ${c.name} mark`;
  const desc = c.idea;

  // ---- SVG sources
  writeSvg(path.join(slugDir, 'mark.svg'), svgDoc(art.inner, { size: 108, title, desc }));
  writeSvg(
    path.join(slugDir, 'background.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108"><title>ManHunt — adaptive background layer</title><rect width="108" height="108" fill="${TOKENS.field}"/></svg>`,
  );
  writeSvg(path.join(slugDir, 'icon-composite.svg'), svgDoc(art.inner, { bg: TOKENS.field, size: 108, title, desc }));
  writeSvg(
    path.join(slugDir, 'icon-monochrome.svg'),
    svgDoc(art.inner, { size: 108, mono: '#000000', title: `${c.name} — monochrome layer`, desc: 'Themed-icon layer: mark silhouette only, single colour, no background.' }),
  );
  // ready-to-integrate Android drawables (integration itself is a separate task)
  fs.mkdirSync(path.join(slugDir, 'android'), { recursive: true });
  writeSvg(path.join(slugDir, 'android', 'ic_launcher_foreground.xml'), androidVectorXml({ inner: art.inner, title: `${c.name} — adaptive foreground (108dp viewport, mark inside the 66dp safe zone)` }));
  writeSvg(path.join(slugDir, 'android', 'ic_launcher_monochrome.xml'), androidVectorXml({ inner: art.inner, mono: '#000000', title: `${c.name} — monochrome layer (single colour, mark only)` }));

  // ---- raster exports in one render pass
  const densities = [48, 72, 96, 144, 192];
  const tiles = [
    { name: 'play-512', w: 512, h: 512, body: svgDoc(art.inner, { bg: F, size: 512 }) },
    { name: 'mark-512-transparent', w: 512, h: 512, body: svgDoc(art.inner, { size: 512 }) },
    { name: 'monochrome-432', w: 432, h: 432, body: svgDoc(art.inner, { size: 432, mono: '#000000' }) },
    { name: 'monochrome-on-black-512', w: 512, h: 512, body: svgDoc(art.inner, { bg: '#000000', size: 512, mono: '#FFFFFF' }) },
    { name: 'monochrome-on-white-512', w: 512, h: 512, body: svgDoc(art.inner, { bg: '#FFFFFF', size: 512, mono: '#000000' }) },
    { name: 'legacy-48-on-chalk', w: 48, h: 48, body: `<div style="width:48px;height:48px;background:${TOKENS.lightGround}">${svgDoc(art.inner, { bg: F, size: 48 })}</div>` },
    ...densities.map((d) => ({ name: `legacy-${d}`, w: d, h: d, body: legacyBody(art, d) })),
    ...densities.map((d) => ({ name: `legacy-round-${d}`, w: d, h: d, body: legacyBody(art, d, { round: true }) })),
    ...[16, 24, 32].map((px) => ({ name: `favicon-${px}`, w: px, h: px, body: legacyBody(art, px) })),
  ];
  const written = await renderTileGrid(`${c.slug}-exports`, tiles);
  for (const [name, src] of written) fs.copyFileSync(src, path.join(exportDir, `${name}.png`));
  }

  // ---- adaptive safe-zone plate (separate page, its own size)
  const safeSvgBig = svgDoc(art.inner, { bg: F, size: 300, guides: true }).replace('<svg ', '<svg style="border-radius:4px" ');
  const safeZoneHtml = pageHtml({
    w: 900,
    h: 398,
    bg: '#0A111C',
    body: `<div style="padding:26px;font-family:${DATA};color:#93A5BE">
      <div style="font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#7C8CA6">adaptive icon construction — ${esc(c.name)}</div>
      <div style="display:flex;gap:26px;margin-top:20px;align-items:flex-start">
        <div style="text-align:center">${safeSvgBig}<div style="font-size:9px;color:#5F7089;margin-top:10px">108 dp canvas · dashed 66 dp safe · dotted 72 dp mask</div></div>
        <div style="text-align:center"><div style="width:170px;height:170px;border-radius:50%;overflow:hidden;outline:1px solid #22304d">${svgDoc(art.inner, { bg: F, size: 170 })}</div><div style="font-size:9px;color:#5F7089;margin-top:10px">circle mask</div></div>
        <div style="text-align:center"><div style="width:170px;height:170px;border-radius:38px;overflow:hidden;outline:1px solid #22304d">${svgDoc(art.inner, { bg: F, size: 170 })}</div><div style="font-size:9px;color:#5F7089;margin-top:10px">squircle mask</div></div>
      </div>
      <div style="font-size:9.5px;color:#5F7089;margin-top:22px;line-height:1.6">The mark never enters the 12 dp band between the safe circle and the mask Ø, so every launcher mask crops the field, never the mark.</div>
    </div>`,
    css: FONT_FACES,
  });
  fs.writeFileSync(path.join(BUILD, `${c.slug}-safe-zone.html`), safeZoneHtml);
  await renderHtml(path.join(BUILD, `${c.slug}-safe-zone.html`), path.join(previewDir, 'adaptive-safe-zone.png'), { width: 900, height: 398, scale: 1, transparent: true });

  // ---- dark / light ground comparison
  const darkLightHtml = pageHtml({
    w: 900,
    h: 392,
    bg: '#0A111C',
    body: `<div style="display:flex;gap:18px;padding:18px;font-family:${DATA}">
      <div style="flex:1;background:${TOKENS.field};border:1px solid #1B273C;border-radius:6px;padding:20px;text-align:center">
        <div style="font-size:9px;letter-spacing:.14em;color:#7C8CA6;text-transform:uppercase">field ground · #0B1220</div>
        <div style="margin:16px auto 0;width:250px;height:250px;border-radius:6px;overflow:hidden">${svgDoc(art.inner, { bg: F, size: 250 })}</div>
        <div style="font-size:9px;color:#5F7089;margin-top:12px">primary surface · dark-first brand</div>
      </div>
      <div style="flex:1;background:${TOKENS.lightGround};border:1px solid #D3DCE8;border-radius:6px;padding:20px;text-align:center">
        <div style="font-size:9px;letter-spacing:.14em;color:#64748B;text-transform:uppercase">chalk ground · #F7F9FC</div>
        <div style="margin:16px auto 0;width:250px;height:250px;border-radius:6px;overflow:hidden">${svgDoc(art.inner, { bg: F, size: 250 })}</div>
        <div style="font-size:9px;color:#64748B;margin-top:12px">light theme · the square keeps the field colour</div>
      </div>
    </div>`,
    css: FONT_FACES,
  });
  fs.writeFileSync(path.join(BUILD, `${c.slug}-dark-light.html`), darkLightHtml);
  await renderHtml(path.join(BUILD, `${c.slug}-dark-light.html`), path.join(previewDir, 'dark-light-comparison.png'), { width: 900, height: 392, scale: 1, transparent: true });

  // ---- specimen sheet
  const files = {
    play512: path.join(exportDir, 'play-512.png'),
    monoBlack: path.join(exportDir, 'monochrome-on-black-512.png'),
    monoWhite: path.join(exportDir, 'monochrome-on-white-512.png'),
    legacy48: path.join(exportDir, 'legacy-48.png'),
    legacy48Chalk: path.join(exportDir, 'legacy-48-on-chalk.png'),
    fav16: path.join(exportDir, 'favicon-16.png'),
    fav24: path.join(exportDir, 'favicon-24.png'),
    fav32: path.join(exportDir, 'favicon-32.png'),
  };
  const sheetFile = path.join(BUILD, `${c.slug}-sheet.html`);
  fs.writeFileSync(sheetFile, sheetHtml(c, files));
  await renderHtml(sheetFile, path.join(previewDir, 'sheet.png'), { width: 1600, height: 792, scale: 1, transparent: true });

  console.log(`[${c.slug}] ${SHEETS_ONLY ? "sheets re-rendered" : "sources + " + written.size + " rasters"} + plates`);
  return { concept: c, art, files };
}

const built = [];
for (const c of CONCEPTS) built.push(await buildConcept(c));

// ------------------------------------------------------------------ contact sheet
function contactHtml(list) {
  const cards = list
    .map(({ concept: c, art, files }) => `
      <div class="col">
        <div class="colhead"><span class="idx">${c.slug.slice(0, 2)}</span><span class="nm">${esc(c.name)}</span></div>
        <div class="strat">${esc(c.strategy)}</div>
        <div class="hero">${svgDoc(art.inner, { bg: F, size: 250 })}</div>
        <div class="sizes">
          <div style="text-align:center"><img src="${dataUri(files.legacy48)}" style="width:48px;height:48px"><div class="lbl">48</div></div>
          <div style="text-align:center"><img class="zoomed" src="${dataUri(files.legacy48)}" style="width:96px;height:96px"><div class="lbl">48 · 2×</div></div>
          <div style="text-align:center"><img class="zoomed" src="${dataUri(files.fav24)}" style="width:96px;height:96px"><div class="lbl">24 · 4×</div></div>
          <div style="text-align:center"><img class="zoomed" src="${dataUri(files.fav16)}" style="width:96px;height:96px"><div class="lbl">16 · 6×</div></div>
        </div>
        <div class="mono">
          <img src="${dataUri(files.monoBlack)}" style="width:96px;height:96px">
          <img src="${dataUri(files.monoWhite)}" style="width:96px;height:96px">
        </div>
        <div class="lbl">monochrome · white on black / black on white</div>
        <div class="idea">${esc(c.idea)}</div>
      </div>`)
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    ${FONT_FACES}
    *{box-sizing:border-box;margin:0;padding:0}
    html,body{width:1560px;height:852px;background:#05090F;color:#E6EDF7;font-family:'Segoe UI',Arial,sans-serif}
    .sheet{padding:30px 34px}
    .top{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:1px solid #1B273C;padding-bottom:14px}
    .top .l{font-family:${DISPLAY};font-size:30px;letter-spacing:.3em}
    .top .r{font-family:${DATA};font-size:10px;letter-spacing:.08em;color:#7C8CA6}
    .top .r b{color:#22D3EE;font-weight:400}
    .cols{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-top:22px}
    .col{border:1px solid #1B273C;border-radius:8px;padding:16px;background:#0A111C}
    .colhead{display:flex;align-items:baseline;gap:10px}
    .idx{font-family:${DISPLAY};font-size:30px;color:#22D3EE;line-height:1}
    .nm{font-family:${DISPLAY};font-size:24px;letter-spacing:.02em}
    .strat{font-family:${DATA};font-size:9px;letter-spacing:.13em;text-transform:uppercase;color:#7C8CA6;margin-top:5px}
    .hero{margin-top:12px;border-radius:6px;overflow:hidden}
    .sizes{display:flex;gap:12px;align-items:flex-end;margin-top:12px}
    .sizes img{border-radius:3px;outline:1px solid #22304d;display:block}
    .mono{display:flex;gap:10px;margin-top:12px}
    .mono img{border-radius:3px;display:block}
    .lbl{font-family:${DATA};font-size:8.5px;color:#5F7089;margin-top:6px;letter-spacing:.04em}
    .idea{font-size:12px;line-height:1.5;color:#A9B8CC;margin-top:10px}
    .zoomed{image-rendering:pixelated}
    .foot{margin-top:16px;border-top:1px solid #1B273C;padding-top:10px;font-family:${DATA};font-size:9px;color:#5F7089;display:flex;justify-content:space-between}
  </style></head><body><div class="sheet">
    <div class="top"><div class="l">MANHUNT</div><div class="r">logo &amp; icon concepts · <b>3 directions</b> · adaptive 108 dp / 66 dp safe zone · real pixel sizes · plate rev A</div></div>
    <div class="cols">${cards}</div>
    <div class="foot"><span>original vector geometry · cyan = field / never a team · coral = prey · violet = hunters</span><span>full specimen sheets: previews/&lt;concept&gt;/sheet.png</span></div>
  </div></body></html>`;
}
fs.writeFileSync(path.join(BUILD, 'contact-sheet.html'), contactHtml(built));
await renderHtml(path.join(BUILD, 'contact-sheet.html'), path.join(PREVIEWS, 'contact-sheet.png'), { width: 1560, height: 852, scale: 1, transparent: true });

// ------------------------------------------------------------------ legibility strip
const SIZE_STEPS = [16, 24, 32, 48];
const stripCell = (concept, px) => {
  const files = built.find((b) => b.concept.slug === concept.slug).files;
  const src = px === 16 ? files.fav16 : px === 24 ? files.fav24 : px === 32 ? files.fav32 : files.legacy48;
  return `<div style="text-align:center"><img src="${dataUri(src)}" style="width:${px * 4}px;height:${px * 4}px;image-rendering:pixelated;border-radius:3px;display:block;margin:0 auto"></div>`;
};
const stripHtml = pageHtml({
  w: 980,
  h: 748,
  bg: '#0A111C',
  body: `<div style="padding:24px;font-family:${DATA};color:#93A5BE">
    <div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#7C8CA6">silhouette test — native pixels, no smoothing · 4× nearest neighbour</div>
    <div style="display:flex;gap:26px;margin-top:20px">
      <div style="width:120px;font-size:9px;color:#5F7089;padding-top:6px">size</div>
      ${SIZE_STEPS.map((px) => `<div style="text-align:center;width:${px * 4}px;font-size:9px;color:#8A9BB4;padding-bottom:6px">${px} px</div>`).join('')}
    </div>
    ${built
      .map(
        (b) => `<div style="display:flex;gap:26px;align-items:center;margin-bottom:14px">
        <div style="width:120px;font-size:10.5px;color:#D6E2F2">${esc(b.concept.name)}</div>
        ${SIZE_STEPS.map((px) => stripCell(b.concept, px)).join('')}
      </div>`,
      )
      .join('')}
    <div style="font-size:9px;color:#5F7089;margin-top:8px;line-height:1.6">The marks are adjacent shapes; below ~24 px their internal gap closes in the pixel grid — that is why the favicon ships at 32 px and the launcher is judged at 48 px.</div>
  </div>`,
  css: FONT_FACES,
});
fs.writeFileSync(path.join(BUILD, 'legibility-strip.html'), stripHtml);
await renderHtml(path.join(BUILD, 'legibility-strip.html'), path.join(PREVIEWS, 'legibility-strip.png'), { width: 980, height: 748, scale: 1, transparent: true });


// ------------------------------------------------------------------ manifest
fs.writeFileSync(
  path.join(PREVIEWS, 'build-manifest.json'),
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      renderer: 'headless Chrome, native device pixels',
      concepts: CONCEPTS.map((c) => ({ slug: c.slug, name: c.name, strategy: c.strategy, sources: `concepts/${c.slug}/`, previews: `previews/${c.slug}/` })),
      exports: 'previews/<slug>/exports/',
      fonts: 'Preview sheets use Barlow Condensed + IBM Plex Mono (OFL), fetched at build time into the temp dir and embedded only in generated HTML. No font is stored in this folder.',
      licence: 'Original vector work for ManHunt — see LICENSE-assets.md',
    },
    null,
    2,
  ),
);
console.log('contact sheet + legibility strip written');

