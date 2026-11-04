#!/usr/bin/env node
// Contact sheets for the ManHunt UI/UX redesign.
//
//   node contact-sheet.mjs                       # every direction: page PNGs + sheet + matrix + gallery
//   node contact-sheet.mjs --only a-matchday-raised
//   node contact-sheet.mjs --matrix --gallery    # just rebuild the comparison matrix + index.html
//   node contact-sheet.mjs --pages               # only render the page PNGs (no sheets)
//
// Outputs (under env/out/ by default):
//   pages/<direction>/<page>.png         exact 1170x2532 captures used by the sheets
//   sheets/<direction>.png               per-direction contact sheet (all 14 canonical pages)
//   sheets/matrix.png                    cross-direction matrix (pages x directions)
//   index.html                           link gallery over everything
//
// Sheet PNGs: the sheet layout is deterministic; width comes from the CSS grid and
// the height follows the content. Page-render PNGs are also computed at 3x. The exact
// pixel size of every sheet is printed when it is produced (and recorded in README).
import path from 'node:path';
import { readdir, readFile, stat, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { EnvSession, CANVAS, REPO, WORKSTREAM, ENV_ROOT, toUrlPath } from './lib/browser.mjs';
import { CANONICAL_PAGES, pageId, pageTitle, matrixOrder } from './lib/canonical.mjs';
import { readDirectionPages } from './lib/direction.mjs';

const HELP = `ManHunt contact sheets — per-direction sheets, cross-direction matrix, gallery

USAGE
  node contact-sheet.mjs [options]

OPTIONS
  --dirs <dir>      directions root (default design/ui-v2/directions)
  --out <dir>       output root (default design/ui-v2/env/out)
  --only <name>     only this direction folder (repeatable)
  --pages           only render page PNGs into out/pages/
  --sheet           only build per-direction contact sheets
  --matrix          only build the cross-direction matrix
  --strips          only build the per-page comparison strips (out/strips/<page>.png)
  --gallery         only rebuild out/index.html
  --force           re-render pages even when cached
  --quiet           less logging
  -h, --help
`;
const argv = process.argv.slice(2);
const opts = { dirs: path.join(WORKSTREAM, 'directions'), out: path.join(ENV_ROOT, 'out'), only: [], force: false, quiet: false, phases: new Set() };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--dirs') opts.dirs = path.resolve(process.cwd(), argv[++i]);
  else if (a === '--out') opts.out = path.resolve(process.cwd(), argv[++i]);
  else if (a === '--only') opts.only.push(argv[++i]);
  else if (a === '--force') opts.force = true;
  else if (a === '--quiet') opts.quiet = true;
  else if (a === '--pages') opts.phases.add('pages');
  else if (a === '--sheet' || a === '--sheets') opts.phases.add('sheet');
  else if (a === '--matrix') opts.phases.add('matrix');
  else if (a === '--strips') opts.phases.add('strips');
  else if (a === '--gallery') opts.phases.add('gallery');
  else if (a === '--all') opts.phases.clear();
  else if (a === '-h' || a === '--help') {
    console.log(HELP);
    process.exit(0);
  } else {
    console.error(`unknown option ${a}\n\n${HELP}`);
    process.exit(2);
  }
}
if (!opts.phases.size) {
  // A filtered run refreshes that direction's captures + sheet only. Cross-direction
  // artifacts (matrix / strips / gallery) always need every direction, so they are
  // never rebuilt implicitly from a filtered set.
  for (const p of ['pages', 'sheet']) opts.phases.add(p);
  if (!opts.only.length) for (const p of ['matrix', 'strips', 'gallery']) opts.phases.add(p);
  else console.log('[sheets] --only refreshes that direction\'s pages + sheet only; matrix/strips/gallery always use all directions (run without --only to refresh them)');
}
const sheetDir = path.join(opts.out, 'sheets');
const srcDir = path.join(opts.out, '_src');
const pagesDir = path.join(opts.out, 'pages');
const rel = (abs) => path.relative(REPO, abs).split(path.sep).join('/');
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const mtime = async (f) => (await stat(f).catch(() => null))?.mtimeMs || 0;
const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

// A sheet page must load BOTH the repo assets (brand fonts via canvas.css) and
// the rendered PNGs. When --out points outside the repo, share the nearest common
// root for the throwaway sheet server instead of restricting --out to the repo.
function commonRoot(paths) {
  const parts = paths.map((p) => path.resolve(p).split(path.sep));
  let i = 0;
  while (i < parts[0].length && parts.every((s) => s[i] === parts[0][i])) i++;
  return parts[0].slice(0, i).join(path.sep) || path.sep;
}

async function discoverDirections(root, { ignoreOnly = false } = {}) {
  if (!existsSync(root)) return [];
  const out = [];
  for (const e of (await readdir(root, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!e.isDirectory() || e.name.startsWith('.')) continue;
    if (!ignoreOnly && opts.only.length && !opts.only.includes(e.name)) continue;
    const dir = path.join(root, e.name);
    // Direction pages may live in <direction>/ or <direction>/pages/.
    const layout = await readDirectionPages(dir);
    if (!layout.pages.length) continue;
    out.push({ name: e.name, dir, pagesDir: layout.pagesDir, outDir: layout.outDir, directionDir: layout.directionDir, pages: layout.pages });
  }
  return out;
}

async function shouldRender(source, outPng, dirs) {
  if (opts.force) return true;
  const outTime = await mtime(outPng);
  if (!outTime) return true;
  if ((await mtime(source)) > outTime) return true;
  if ((await mtime(path.join(ENV_ROOT, 'canvas.css'))) > outTime) return true;
  // Any sibling asset (direction css/js, shared styles, assets folder files)
  // newer than the PNG invalidates it.
  for (const dir of new Set(dirs)) {
    for (const f of await readdir(dir).catch(() => [])) {
      if ((await mtime(path.join(dir, f))) > outTime) return true;
    }
  }
  return false;
}

/* ── page renders ─────────────────────────────────────────────────────────── */
async function renderPages(directions) {
  const tasks = [];
  for (const d of directions) {
    for (const p of d.pages) {
      tasks.push({ direction: d.name, page: p, png: path.join(pagesDir, d.name, p.id + '.png'), dirs: [d.pagesDir, d.directionDir] });
    }
  }
  if (!tasks.length) {
    console.log('[pages] no direction pages yet — skipping');
    return new Map();
  }
  const session = await new EnvSession({ colorScheme: 'dark' }).start();
  const done = new Map();
  let rendered = 0;
  try {
    for (const [i, t] of tasks.entries()) {
      const cached = !(await shouldRender(t.page.file, t.png, t.dirs));
      if (!cached) {
        await session.render({ file: t.page.file, out: t.png, quiet: true });
        rendered++;
      }
      if (!opts.quiet) console.log(`[pages] ${String(i + 1).padStart(2)}/${tasks.length} ${cached ? 'cached ' : 'rendered'} ${rel(t.png)}`);
      if (!done.has(t.direction)) done.set(t.direction, new Map());
      done.get(t.direction).set(t.page.id, t.png);
    }
  } finally {
    await session.close();
  }
  console.log(`[pages] ${tasks.length} page capture(s), ${rendered} rendered, ${tasks.length - rendered} cached (${CANVAS.pxWidth}x${CANVAS.pxHeight} px each)`);
  return done;
}

/* ── per-direction sheet ──────────────────────────────────────────────────── */
const SHEET = { cols: 4, thumbW: 292, thumbH: Math.round((292 * CANVAS.height) / CANVAS.width), pad: 56, gapX: 24, gapY: 40 };
const MATRIX = { labelW: 176, thumbW: 195, thumbH: Math.round((195 * CANVAS.height) / CANVAS.width), pad: 48, gapX: 24, gapY: 28 };
// One row per canonical page: A | B | C at 195 CSS px = 390 raster px in the 2x PNG
// (1/3 of the 1170 px capture width).
const STRIP = { thumbW: 195, thumbH: Math.round((195 * CANVAS.height) / CANVAS.width), pad: 40, gapX: 24 };

function sheetHeader(kicker, title, sub) {
  return `<header class="shead"><div><p class="kicker">${esc(kicker)}</p><h1>${esc(title)}</h1></div><p class="sub">${esc(sub)}</p></header>`;
}

function sheetDoc({ title, body, width, serverRoot, contentWidth }) {
  return `<!doctype html>
<html lang="en" data-theme="dark"><head><meta charset="utf-8"><title>${esc(title)}</title>
<link rel="stylesheet" href="${toUrlPath(path.join(ENV_ROOT, 'canvas.css'), serverRoot)}">
<style>
  html,body{width:auto;height:auto;min-height:0;overflow:visible;background:#070d18;color:#E6EDF7}
  body{font-family:"Instrument Sans","Segoe UI",sans-serif;margin:0}
  .sheet{width:max-content;background:#070d18;padding:${width.pad}px;box-sizing:border-box}
  .shead{display:flex;align-items:flex-end;justify-content:space-between;gap:40px;margin:0 0 34px;padding-bottom:22px;border-bottom:1px solid rgba(230,237,247,.18);width:${contentWidth}px}
  .kicker{font-family:"Red Hat Mono",monospace;font-size:12px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#22D3EE;margin:0 0 8px}
  h1{font-family:"Big Shoulders","Arial Narrow",sans-serif;font-size:72px;font-weight:700;line-height:.88;text-transform:uppercase;letter-spacing:.005em;margin:0}
  .sub{font-family:"Red Hat Mono",monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#6f829b;text-align:right;margin:0;max-width:420px;line-height:1.7}
  @media (max-width: 900px) {
    .shead{flex-direction:column;align-items:flex-start;gap:14px}
    .shead h1{font-size:54px}
    .sub{text-align:left;max-width:none}
  }
  .foot{display:flex;justify-content:space-between;gap:40px;margin-top:34px;padding-top:18px;border-top:1px solid rgba(230,237,247,.12);width:${contentWidth}px;
        font-family:"Red Hat Mono",monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#6f829b}
  .grid{display:grid;grid-template-columns:repeat(${width.cols},${width.thumbW}px);gap:${width.gapY}px ${width.gapX}px}
  figure{margin:0}
  .thumb{width:${width.thumbW}px;height:${width.thumbH}px;border:1px solid rgba(230,237,247,.22);display:block;background:#0b1220;overflow:hidden}
  .thumb img{width:100%;height:100%;object-fit:cover;display:block}
  .thumb.missing{border-style:dashed;border-color:rgba(230,237,247,.24);display:flex;align-items:center;justify-content:center;
                 font-family:"Red Hat Mono",monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#6f829b;text-align:center;padding:16px}
  figcaption{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-top:8px;
             font-family:"Red Hat Mono",monospace;font-size:10px;letter-spacing:.07em;text-transform:uppercase}
  figcaption .t{color:#a9b8cc;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  figcaption .i{color:#6f829b;flex:none}
  figcaption .i b{color:#22D3EE;font-weight:700}
  .matrix{display:grid;grid-template-columns:${width.labelW}px repeat(var(--dirs),${width.thumbW}px);gap:${width.gapY}px ${width.gapX}px;align-items:start}
  .mhead{font-family:"Big Shoulders","Arial Narrow",sans-serif;font-size:26px;font-weight:700;line-height:.92;text-transform:uppercase;letter-spacing:.01em;color:#E6EDF7}
  .mhead .n{display:block;font-family:"Red Hat Mono",monospace;font-size:9px;font-weight:400;letter-spacing:.08em;color:#6f829b;margin-top:5px;text-transform:uppercase}
  .rowlab{padding-top:6px;text-align:right}
  .rowlab .k{font-family:"Red Hat Mono",monospace;font-size:9px;letter-spacing:.1em;color:#6f829b;text-transform:uppercase}
  .rowlab .t{font-family:"Instrument Sans","Segoe UI",sans-serif;font-size:12px;font-weight:700;line-height:1.25;color:#E6EDF7;margin-top:2px}
  .mcell .thumb{width:${width.thumbW}px;height:${width.thumbH}px}
  .strip{display:flex;gap:${width.gapX ?? 24}px;align-items:flex-start}
  .scol{width:${width.thumbW}px}
  .scol .dlab{font-family:"Red Hat Mono",monospace;font-size:10px;font-weight:700;letter-spacing:.1em;
              text-transform:uppercase;color:#22D3EE;margin:0 0 7px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .scol .thumb{width:${width.thumbW}px;height:${width.thumbH}px}
  .scol .meta2{font-family:"Red Hat Mono",monospace;font-size:9px;letter-spacing:.06em;color:#6f829b;margin-top:6px;text-transform:uppercase}
</style></head><body><div class="sheet">${body}</div></body></html>`;
}

async function buildDirectionSheet(dir, pngs, serverRoot) {
  const slots = CANONICAL_PAGES.map((p, i) => {
    const png = pngs?.get(p.id);
    const cell = png
      ? `<figure><div class="thumb"><img src="${toUrlPath(png, serverRoot)}" alt="${esc(p.title)}"></div>
           <figcaption><span class="t">${esc(p.title)}</span><span class="i"><b>${String(i + 1).padStart(2, '0')}</b> ${esc(p.id)}</span></figcaption></figure>`
      : `<figure><div class="thumb missing">not rendered</div>
           <figcaption><span class="t">${esc(p.title)}</span><span class="i"><b>${String(i + 1).padStart(2, '0')}</b> ${esc(p.id)}</span></figcaption></figure>`;
    return cell;
  }).join('');
  // Pad to a full grid so the sheet never has ragged last rows.
  const missing = (SHEET.cols - (CANONICAL_PAGES.length % SHEET.cols)) % SHEET.cols;
  const padding = missing ? `<div></div>`.repeat(missing) : '';
  const canonicalPresent = pngs ? [...pngs.keys()].filter((id) => CANONICAL_PAGES.some((c) => c.id === id)).length : 0;
  const extraPresent = pngs ? [...pngs.keys()].filter((id) => !CANONICAL_PAGES.some((c) => c.id === id)).length : 0;
  const title = dir;
  const html = sheetDoc({
    title: `Contact sheet — ${dir}`,
    width: SHEET,
    contentWidth: SHEET.cols * SHEET.thumbW + (SHEET.cols - 1) * SHEET.gapX,
    serverRoot,
    body: `${sheetHeader('Direction contact sheet', title, `ManHunt UI/UX v2 · ${canonicalPresent}/${CANONICAL_PAGES.length} pages${extraPresent ? ` + ${extraPresent} extra state page(s)` : ''} · canvas ${CANVAS.width}×${CANVAS.height} dp rendered ${CANVAS.pxWidth}×${CANVAS.pxHeight} px · ${stamp()}`)}
      <div class="grid">${slots}${padding}</div>
      <div class="foot"><span>${esc(dir)} — every canonical page, canonical order</span><span>generated by env/contact-sheet.mjs</span></div>`,
  });
  const src = path.join(srcDir, `${dir}.sheet.html`);
  const out = path.join(sheetDir, `${dir}.png`);
  await mkdir(srcDir, { recursive: true });
  await writeFile(src, html);
  const session = await new EnvSession({ root: serverRoot, viewport: { width: SHEET.pad * 2 + SHEET.cols * SHEET.thumbW + (SHEET.cols - 1) * SHEET.gapX, height: 1000 }, deviceScaleFactor: 2, colorScheme: 'dark' }).start();
  try {
    return await session.renderDocument({ file: src, out, selector: '.sheet' });
  } finally {
    await session.close();
  }
}

/* ── cross-direction matrix ────────────────────────────────────────────────── */
async function buildMatrix(directions, rendered, serverRoot) {
  const users = directions.map((d) => ({ dir: d, pngs: rendered.get(d.name) || new Map() }));
  const extra = users.flatMap((u) => [...u.pngs.keys()].filter((id) => !CANONICAL_PAGES.some((p) => p.id === id)));
  const rows = matrixOrder(extra);
  const head = `<div></div>${users.map((u) => `<div class="mhead">${esc(u.dir.name)}<span class="n">${u.pngs.size}/${CANONICAL_PAGES.length} pages</span></div>`).join('')}`;
  const bodyRows = rows
    .map((id, idx) => {
      const p = CANONICAL_PAGES.find((c) => c.id === id);
      const isCanonical = !!p;
      // Keep the display title to the page id for extras (the kicker already says it is
      // an extra state study) so every strip keeps the same compact height.
      const title = p ? p.title : id;
      const cells = users
        .map((u) => {
          const png = u.pngs.get(id);
          return png
            ? `<div class="mcell"><div class="thumb"><img src="${toUrlPath(png, serverRoot)}" alt="${esc(u.dir.name)} ${esc(title)}"></div></div>`
            : `<div class="mcell"><div class="thumb missing">not rendered</div></div>`;
        })
        .join('');
      const rowTag = p ? `P${String(idx + 1).padStart(2, '0')}` : 'EXTRA';
      return `<div class="rowlab"><div class="k">${rowTag}</div><div class="t">${esc(p ? title : id)}</div></div>${cells}`;
    })
    .join('');
  const html = sheetDoc({
    title: 'Direction matrix — ManHunt UI/UX v2',
    width: { ...MATRIX, cols: users.length },
    contentWidth: MATRIX.labelW + users.length * MATRIX.thumbW + users.length * MATRIX.gapX,
    serverRoot,
    body: `${sheetHeader('Cross-direction matrix', 'Direction matrix', `ManHunt UI/UX v2 · ${users.map((u) => u.dir.name).join(' · ')} · canvas ${CANVAS.width}×${CANVAS.height} dp · ${stamp()}`)}
      <div class="matrix" style="--dirs:${users.length}">${head}${bodyRows}</div>
      <div class="foot"><span>rows: canonical page order</span><span>generated by env/contact-sheet.mjs</span></div>`,
  });
  const src = path.join(srcDir, 'matrix.html');
  const out = path.join(sheetDir, 'matrix.png');
  await mkdir(srcDir, { recursive: true });
  await writeFile(src, html);
  const session = await new EnvSession({ root: serverRoot, viewport: { width: MATRIX.pad * 2 + MATRIX.labelW + users.length * MATRIX.thumbW + MATRIX.gapX * users.length, height: 1000 }, deviceScaleFactor: 2, colorScheme: 'dark' }).start();
  try {
    return await session.renderDocument({ file: src, out, selector: '.sheet', maxWidth: 6000 });
  } finally {
    await session.close();
  }
}

/* ── per-page comparison strips ────────────────────────────────────────────── */
// One strip per canonical page: all directions side by side at 390 raster px wide
// (195 CSS px @2x), for equal-weight page-by-page judging at full size.
async function buildStrips(directions, rendered) {
  const users = directions.map((d) => ({ dir: d, pngs: rendered.get(d.name) || new Map() }));
  const extra = users.flatMap((u) => [...u.pngs.keys()].filter((id) => !CANONICAL_PAGES.some((p) => p.id === id)));
  const rows = matrixOrder(extra);
  const contentWidth = users.length * STRIP.thumbW + Math.max(0, users.length - 1) * STRIP.gapX;
  const stripDir = path.join(opts.out, 'strips');
  await mkdir(stripDir, { recursive: true });
  await mkdir(srcDir, { recursive: true });
  const session = await new EnvSession({
    root: commonRoot([REPO, opts.out]),
    viewport: { width: STRIP.pad * 2 + contentWidth, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: 'dark',
  }).start();
  const produced = [];
  try {
    for (const [idx, id] of rows.entries()) {
      const p = CANONICAL_PAGES.find((c) => c.id === id);
      const isCanonical = !!p;
      // Keep the display title to the page id for extras (the kicker already says it is
      // an extra state study) so every strip keeps the same compact height.
      const title = p ? p.title : id;
      const cols = users
        .map((u) => {
          const png = u.pngs.get(id);
          const visual = png
            ? `<div class="thumb"><img src="${toUrlPath(png, session.root)}" alt="${esc(u.dir.name)} ${esc(title)}"></div>`
            : `<div class="thumb missing">not rendered</div>`;
          return `<div class="scol"><p class="dlab">${esc(u.dir.name)}</p>${visual}<p class="meta2">1170×2532 px</p></div>`;
        })
        .join('');
      const html = sheetDoc({
        title: `Strip — ${title}`,
        width: STRIP,
        contentWidth,
        serverRoot: session.root,
        body: `${sheetHeader(
              isCanonical ? 'Per-page comparison strip' : 'Extra state study — not in the 14-page score set',
              title,
              `${isCanonical ? `canonical page ${String(idx + 1).padStart(2, '0')}/14` : 'extra state study'} · ${users.map((u) => u.dir.name).join(' · ')} · ${stamp()}`,
            )}
          <div class="strip">${cols}</div>
          <div class="foot"><span>${isCanonical ? 'one canonical page, all directions, 390 px thumbs (1/3 canvas)' : 'extra state study — canonical scores do not include this row'}</span><span>generated by env/contact-sheet.mjs</span></div>`,
      });
      const src = path.join(srcDir, `strip-${id}.html`);
      await writeFile(src, html);
      const out = path.join(stripDir, `${id}.png`);
      const res = await session.renderDocument({ file: src, out, selector: '.sheet', maxWidth: 4000, quiet: true });
      produced.push({ id, ...res });
    }
  } finally {
    await session.close();
  }
  return produced;
}

/* ── gallery index.html ────────────────────────────────────────────────────── */
function pageUrlFromOut(pngAbs) {
  // relative path from env/out/index.html to the PNG, works from file:// and the preview server
  return path.relative(opts.out, pngAbs).split(path.sep).join('/');
}

async function buildGallery(directions, rendered) {
  const byDir = new Map(directions.map((d) => [d.name, rendered.get(d.name) || new Map()]));
  const sheetFiles = existsSync(sheetDir) ? (await readdir(sheetDir)).filter((f) => f.endsWith('.png')).sort() : [];
  const matrixFile = sheetFiles.find((f) => f === 'matrix.png');
  const dirSheets = sheetFiles.filter((f) => f !== 'matrix.png');
  const stripDirAbs = path.join(opts.out, 'strips');
  const stripIds = existsSync(stripDirAbs) ? (await readdir(stripDirAbs)).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, '')) : [];
  const stripLinks = matrixOrder([])
    .filter((id) => stripIds.includes(id))
    .map((id) => {
      const canon = CANONICAL_PAGES.find((p) => p.id === id);
      const title = canon ? canon.title : `extra state — ${id}`;
      return `<a href="strips/${esc(id)}.png"><b>${esc(id)}</b> ${esc(title)}${canon ? '' : ' <i style="color:#6f829b;font-style:normal">(not scored)</i>'}</a>`;
    })
    .join('');
  const stripsSection = stripLinks
    ? `<section><header><h2>Page strips</h2><span class="meta">${stripIds.length} pages · A|B|C at 390 px thumbs</span></header>
        <div class="striplinks">${stripLinks}</div></section>`
    : '';
  const stripsSectionCss = '<style>.striplinks{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px 24px}.striplinks a{font-family:"Red Hat Mono",monospace;font-size:11px;color:#a9b8cc;border-bottom:1px solid rgba(230,237,247,.12);padding:6px 0}.striplinks a:hover{color:#22D3EE}.striplinks b{color:#22D3EE;font-weight:700}</style>';

  const dirSections = directions
    .map((d) => {
      const pngs = byDir.get(d.name);
      const pages = CANONICAL_PAGES.map((p) => {
        const png = pngs.get(p.id);
        const pageRecord = d.pages.find((rec) => rec.id === p.id);
        const srcRel = pageRecord ? path.relative(opts.out, pageRecord.file).split(path.sep).join('/') : '#';
        const inner = png
          ? `<a href="${pageUrlFromOut(png)}"><img src="${pageUrlFromOut(png)}" alt="${esc(p.title)}" loading="lazy"></a>`
          : `<span class="miss">not rendered</span>`;
        return `<figure><div class="thumb">${inner}</div><figcaption><b>${esc(p.id)}</b> ${esc(p.title)} <a class="src" href="${esc(srcRel)}">html</a></figcaption></figure>`;
      }).join('');
      const sheet = dirSheets.find((f) => f.startsWith(d.name + '.png'));
      const notesAbs = path.join(d.dir, 'NOTES.md');
      const notesLink = existsSync(notesAbs)
        ? ` · <a href="${esc(path.relative(opts.out, notesAbs).split(path.sep).join('/'))}">NOTES.md</a>`
        : '';
      const extras = d.pages.filter((p) => !CANONICAL_PAGES.some((c) => c.id === p.id));
      const canonCount = pngs.size - extras.filter((p) => pngs.has(p.id)).length;
      const extrasLine = extras.length
        ? `<p class="extras">Extra state variants (not part of the 14-page score set): ${extras
            .map((p) => (pngs.has(p.id) ? `<a href="${pageUrlFromOut(pngs.get(p.id))}">${esc(p.id)}</a>` : `${esc(p.id)} (not rendered)`))
            .join(' ')}</p>`
        : '';
      return `<section><header><h2>${esc(d.name)}</h2>
        <span class="meta">${canonCount}/${CANONICAL_PAGES.length} pages${extras.length ? ` + ${extras.length} extra` : ''}${sheet ? ` · <a href="sheets/${esc(sheet)}">contact sheet</a>` : ''}${notesLink}</span></header>
        <div class="grid">${pages}</div>${extrasLine}</section>`;
    })
    .join('\n');

  const docLink = (abs) => esc(path.relative(opts.out, abs).split(path.sep).join('/'));
  const reviewsDir = path.join(WORKSTREAM, 'reviews');
  const reviewFiles = existsSync(reviewsDir)
    ? (await readdir(reviewsDir)).filter((f) => /\.(md|json)$/i.test(f)).sort()
    : [];
  const evidenceFiles = existsSync(path.join(reviewsDir, 'evidence'))
    ? (await readdir(path.join(reviewsDir, 'evidence'))).filter((f) => /\.(md|json|png|txt)$/i.test(f)).sort()
    : [];
  const briefFiles = existsSync(path.join(WORKSTREAM, 'briefs'))
    ? (await readdir(path.join(WORKSTREAM, 'briefs'))).filter((f) => /\.md$/i.test(f)).sort()
    : [];
  const skillFiles = existsSync(path.join(WORKSTREAM, 'skills'))
    ? (await readdir(path.join(WORKSTREAM, 'skills'))).filter((f) => /\.md$/i.test(f)).sort()
    : [];
  const docsSection = reviewFiles.length || evidenceFiles.length || briefFiles.length || skillFiles.length
    ? `<section><header><h2>Workstream docs</h2><span class="meta">briefs · skills · reviews · evidence</span></header>
        <div class="striplinks">
          ${reviewFiles.map((f) => `<a href="${docLink(path.join(reviewsDir, f))}"><b>review</b> ${esc(f)}</a>`).join('')}
          ${evidenceFiles.map((f) => `<a href="${docLink(path.join(reviewsDir, 'evidence', f))}"><b>evidence</b> ${esc(f)}</a>`).join('')}
          ${briefFiles.map((f) => `<a href="${docLink(path.join(WORKSTREAM, 'briefs', f))}"><b>brief</b> ${esc(f)}</a>`).join('')}
          ${skillFiles.map((f) => `<a href="${docLink(path.join(WORKSTREAM, 'skills', f))}"><b>skill</b> ${esc(f)}</a>`).join('')}
        </div></section>`
    : '';

  return `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>ManHunt UI/UX v2 — render gallery</title>
<style>
  @font-face{font-family:"Big Shoulders";src:url("../../../brand/motion-kit/assets/fonts/BigShoulders-Bold.ttf") format("truetype");font-weight:700;font-display:swap}
  @font-face{font-family:"Red Hat Mono";src:url("../../../brand/motion-kit/assets/fonts/RedHatMono-Regular.ttf") format("truetype");font-weight:400;font-display:swap}
  :root{color-scheme:dark}
  body{background:#070d18;color:#E6EDF7;font:14px/1.5 "Instrument Sans","Segoe UI",sans-serif;margin:0;padding:48px clamp(24px,5vw,64px) 80px}
  h1{font-family:"Big Shoulders","Arial Narrow",sans-serif;font-weight:700;font-size:64px;line-height:.9;text-transform:uppercase;margin:0 0 10px;letter-spacing:.01em}
  h2{font-family:"Big Shoulders","Arial Narrow",sans-serif;font-weight:700;font-size:30px;text-transform:uppercase;margin:0;letter-spacing:.01em}
  .kicker{font-family:"Red Hat Mono",monospace;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#22D3EE;margin:0 0 10px}
  .lede{font-family:"Red Hat Mono",monospace;font-size:11px;letter-spacing:.05em;color:#6f829b;margin:0 0 8px}
  a{color:#E6EDF7;text-decoration:none}a:hover{color:#22D3EE}
  .matrix-link{display:block;margin:26px 0 10px;border:1px solid rgba(230,237,247,.18)}
  .matrix-link img{width:100%;max-width:1810px;display:block}
  section{border-top:1px solid rgba(230,237,247,.14);margin-top:44px;padding-top:24px}
  section header{display:flex;align-items:baseline;justify-content:space-between;gap:20px;margin-bottom:18px}
  .meta{font-family:"Red Hat Mono",monospace;font-size:11px;color:#6f829b;letter-spacing:.05em}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:26px 18px}
  figure{margin:0}
  .thumb{aspect-ratio:390/844;background:#0b1220;border:1px solid rgba(230,237,247,.16);overflow:hidden}
  .thumb img{width:100%;height:100%;object-fit:cover;display:block}
  .miss{display:flex;align-items:center;justify-content:center;height:100%;font-family:"Red Hat Mono",monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#6f829b;border:1px dashed rgba(230,237,247,.2)}
  figcaption{font-family:"Red Hat Mono",monospace;font-size:10px;color:#a9b8cc;margin-top:7px;letter-spacing:.03em}
  figcaption b{color:#22D3EE;font-weight:700}
  .src{float:right;color:#6f829b}.src:hover{color:#22D3EE}
  .striplinks{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px 24px}
  .striplinks a{font-family:"Red Hat Mono",monospace;font-size:11px;color:#a9b8cc;border-bottom:1px solid rgba(230,237,247,.12);padding:6px 0}
  .striplinks a:hover{color:#22D3EE}.striplinks b{color:#22D3EE;font-weight:700}
</style></head><body>
<p class="kicker">ManHunt UI/UX v2 · render gallery</p>
<h1>Design renders</h1>
<p class="lede">canvas ${CANVAS.width}×${CANVAS.height} dp → ${CANVAS.pxWidth}×${CANVAS.pxHeight} px · generated ${stamp()} by env/contact-sheet.mjs</p>
<p class="lede">Pages open at full resolution. Direction sheets and the matrix are under <a href="sheets/">out/sheets/</a>; one-row page strips under <a href="strips/">out/strips/</a>.</p>
${matrixFile ? `<a class="matrix-link" href="sheets/matrix.png"><img src="sheets/matrix.png" alt="Cross-direction matrix"></a>` : ''}
${stripsSection}
${dirSections || '<p class="lede">No direction pages yet — run the designers\' render command first.</p>'}
${docsSection}
</body></html>`;
}

/* ── main ─────────────────────────────────────────────────────────────────── */
const t0 = Date.now();
const serverRoot = commonRoot([REPO, opts.out]);
if (serverRoot !== REPO && !opts.quiet) console.log(`[sheets] serving sheets from ${serverRoot} (output is outside the repo)`);
const directions = await discoverDirections(opts.dirs);
// Cross-direction artifacts are always built from every direction on disk, even on a
// filtered --only run, so the matrix/strips can never silently become single-column.
const allDirections = opts.only.length ? await discoverDirections(opts.dirs, { ignoreOnly: true }) : directions;
console.log(`[sheets] directions root ${opts.dirs} — ${directions.length} direction(s) selected, ${allDirections.length} in pack, ${allDirections.reduce((n, d) => n + d.pages.length, 0)} page(s)`);
if (!directions.length && (opts.phases.has('pages') || opts.phases.has('sheet') || opts.phases.has('matrix'))) {
  console.log('[sheets] no direction pages found — nothing to capture yet');
}

let rendered = new Map();
if (opts.phases.has('pages') && directions.length) rendered = await renderPages(directions);

if (opts.phases.has('sheet') && directions.length) {
  // Reuse freshly rendered pages, otherwise load whatever is already in out/pages/.
  for (const d of directions) {
    if (!rendered.has(d.name)) rendered.set(d.name, new Map());
    for (const p of d.pages) {
      const png = path.join(pagesDir, d.name, p.id + '.png');
      if (await mtime(png)) rendered.get(d.name).set(p.id, png);
    }
  }
  for (const d of directions) {
    const res = await buildDirectionSheet(d.name, rendered.get(d.name), serverRoot);
    // Canonical review-pack name (task-8) alongside the sheets/ path.
    await copyFile(res.file, path.join(opts.out, `contact-${d.name}.png`));
    console.log(`[sheet] ${d.name} -> out/sheets/${d.name}.png + out/contact-${d.name}.png  ${res.width}x${res.height}`);
  }
}

if (opts.phases.has('matrix') && allDirections.length >= 1) {
  for (const d of allDirections) {
    if (!rendered.has(d.name)) rendered.set(d.name, new Map());
    for (const p of d.pages) {
      const png = path.join(pagesDir, d.name, p.id + '.png');
      if (await mtime(png)) rendered.get(d.name).set(p.id, png);
    }
  }
  const res = await buildMatrix(allDirections, rendered, serverRoot);
  await copyFile(res.file, path.join(opts.out, 'matrix-all-directions.png'));
  console.log(`[matrix] out/sheets/matrix.png + out/matrix-all-directions.png  ${res.width}x${res.height}`);
}

if (opts.phases.has('strips') && allDirections.length) {
  for (const d of allDirections) {
    if (!rendered.has(d.name)) rendered.set(d.name, new Map());
    for (const p of d.pages) {
      const png = path.join(pagesDir, d.name, p.id + '.png');
      if (await mtime(png)) rendered.get(d.name).set(p.id, png);
    }
  }
  const strips = await buildStrips(allDirections, rendered);
  if (strips.length) {
    const first = strips[0];
    console.log(`[strips] out/strips/<page>.png — ${strips.length} strips, ${first.width}x${first.height} each`);
  }
}

if (opts.phases.has('gallery')) {
  for (const d of allDirections) {
    if (!rendered.has(d.name)) rendered.set(d.name, new Map());
    for (const p of d.pages) {
      const png = path.join(pagesDir, d.name, p.id + '.png');
      if (await mtime(png)) rendered.get(d.name).set(p.id, png);
    }
  }
  await mkdir(opts.out, { recursive: true });
  await writeFile(path.join(opts.out, 'index.html'), await buildGallery(allDirections, rendered));
  console.log(`[gallery] out/index.html`);
}
console.log(`[sheets] done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
