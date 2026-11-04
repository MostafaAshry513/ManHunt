#!/usr/bin/env node
// Local preview server for the ManHunt UI/UX redesign.
// Rooted at the repository so pages load /design/... brand fonts and marks with
// exactly the URLs they use in the source. Directory listings let you click
// through direction folders; `/` is a purpose-built index of the workstream.
//
//   node serve.mjs                 # http://127.0.0.1:4173/
//   node serve.mjs --port 5000
import path from 'node:path';
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createStaticServer, REPO, WORKSTREAM } from './lib/server.mjs';
import { CANVAS } from './lib/browser.mjs';
import { CANONICAL_PAGES, pageId } from './lib/canonical.mjs';

const argv = process.argv.slice(2);
const opts = { port: 4173, host: '127.0.0.1', root: REPO };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--port') opts.port = Number(argv[++i]) || opts.port;
  else if (a === '--host') opts.host = argv[++i] || opts.host;
  else if (a === '--root') opts.root = path.resolve(process.cwd(), argv[++i] || REPO);
  else if (a === '-h' || a === '--help') {
    console.log('usage: node serve.mjs [--port 4173] [--host 127.0.0.1] [--root <dir>]');
    process.exit(0);
  } else {
    console.error(`unknown option: ${a}`);
    process.exit(2);
  }
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const url = (rel) => '/' + rel.split(path.sep).join('/');

async function dirsWithPages(root) {
  if (!existsSync(root)) return [];
  const out = [];
  for (const e of await readdir(root, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith('.')) continue;
    const abs = path.join(root, e.name);
    const html = (await readdir(abs).catch(() => [])).filter((f) => /\.html?$/i.test(f) && !f.startsWith('_')).sort();
    if (html.length) out.push({ name: e.name, dir: abs, pages: html });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

async function sheets() {
  const dir = path.join(WORKSTREAM, 'env', 'out', 'sheets');
  if (!existsSync(dir)) return [];
  return (await readdir(dir).catch(() => [])).filter((f) => f.endsWith('.png')).sort();
}

async function buildIndex() {
  const envRel = path.relative(REPO, path.join(WORKSTREAM, 'env'));
  const sample = `${envRel}/samples/sample.html`;
  const gallery = existsSync(path.join(WORKSTREAM, 'env', 'out', 'index.html')) ? `${envRel}/out/index.html` : null;
  const directions = await dirsWithPages(path.join(WORKSTREAM, 'directions'));
  const sheetFiles = await sheets();

  const directionBlocks = directions
    .map((d) => {
      const present = new Set(d.pages.map(pageId));
      const links = d.pages
        .map((f) => `<a class="chip" href="${url(path.relative(REPO, path.join(d.dir, f)))}">${esc(f)}</a>`)
        .join('');
      const missing = CANONICAL_PAGES.filter((p) => !present.has(p.id)).map((p) => p.id);
      return `<section class="dir"><header><h3>${esc(d.name)}</h3>
        <a class="muted" href="${url(path.relative(REPO, d.dir))}/">folder ↗</a></header>
        <p class="muted">${d.pages.length}/${CANONICAL_PAGES.length} canonical pages${missing.length ? ` · missing: ${missing.map(esc).join(', ')}` : ' · complete'}</p>
        <div class="chips">${links || '<span class="muted">no pages yet</span>'}</div></section>`;
    })
    .join('\n');

  return `<!doctype html><html lang="en" data-theme="dark"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>ManHunt UI/UX v2 — design environment</title>
<style>
  :root{color-scheme:dark}
  body{background:#0B1220;color:#E6EDF7;font:15px/1.5 "Instrument Sans","Segoe UI",sans-serif;margin:0;padding:48px clamp(24px,6vw,72px) 72px}
  h1{font-family:"Big Shoulders","Arial Narrow",sans-serif;font-size:56px;line-height:.95;text-transform:uppercase;letter-spacing:.01em;margin:0 0 8px}
  h2{font-family:"Red Hat Mono",monospace;font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#22D3EE;margin:44px 0 14px}
  h3{font-family:"Big Shoulders","Arial Narrow",sans-serif;font-size:26px;text-transform:uppercase;margin:0;letter-spacing:.01em}
  a{color:#E6EDF7}a:hover{color:#22D3EE}
  p{margin:4px 0 14px}.muted{color:#6f829b;font-family:"Red Hat Mono",monospace;font-size:11px;letter-spacing:.04em;text-decoration:none}
  .rule{height:1px;background:rgba(230,237,247,.16);margin:28px 0}
  .dir{border-top:1px solid rgba(230,237,247,.12);padding:18px 0}
  .dir header{display:flex;align-items:baseline;gap:16px}
  .chips{display:flex;flex-wrap:wrap;gap:8px}
  .chip{font-family:"Red Hat Mono",monospace;font-size:11px;letter-spacing:.03em;border:1px solid rgba(230,237,247,.2);padding:5px 9px;text-decoration:none}
  .chip:hover{border-color:#22D3EE}
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
  .card{border:1px solid rgba(230,237,247,.14);padding:16px;text-decoration:none;display:block}
  .card b{font-weight:700;font-size:15px;display:block;margin-bottom:3px}
  .card span{font-family:"Red Hat Mono",monospace;font-size:11px;color:#6f829b}
</style></head><body>
<h1>ManHunt UI/UX v2</h1>
<p class="muted">design environment · canvas ${CANVAS.width}×${CANVAS.height} dp → ${CANVAS.pxWidth}×${CANVAS.pxHeight} px · server root ${esc(REPO)}</p>
<div class="rule"></div>
<h2>Start</h2>
<div class="cards">
  <a class="card" href="/${esc(sample)}"><b>Smoke-test page →</b><span>${esc(sample)}</span></a>
  ${gallery ? `<a class="card" href="/${esc(gallery)}"><b>Render gallery →</b><span>all directions & contact sheets</span></a>` : ''}
  <a class="card" href="/${esc(envRel)}/README.md"><b>Env README →</b><span>${esc(envRel)}/README.md</span></a>
  <a class="card" href="/${esc(path.relative(REPO, path.join(WORKSTREAM, 'briefs')))}/"><b>Briefs →</b><span>workstream, directions, rubric</span></a>
  <a class="card" href="/${esc(path.relative(REPO, path.join(WORKSTREAM, 'skills')))}/"><b>Skills →</b><span>design system playbook</span></a>
</div>
<h2>Directions</h2>
${directionBlocks || '<p class="muted">No direction pages yet.</p>'}
${sheetFiles.length ? `<h2>Contact sheets</h2><div class="chips">${sheetFiles.map((f) => `<a class="chip" href="/${esc(path.relative(REPO, path.join(WORKSTREAM, 'env', 'out', 'sheets', f)))}">${esc(f)}</a>`).join('')}</div>` : ''}
<h2>Raw tree</h2>
<div class="chips">
  <a class="chip" href="/${esc(envRel)}/">env/</a>
  <a class="chip" href="/${esc(path.relative(REPO, path.join(WORKSTREAM, 'directions')))}/">directions/</a>
  <a class="chip" href="/${esc(path.relative(REPO, path.join(WORKSTREAM, 'reviews')))}/">reviews/</a>
  <a class="chip" href="/${esc(path.relative(REPO, path.join(WORKSTREAM, 'briefs')))}/">briefs/</a>
</div>
</body></html>`;
}

async function main() {
  let server = null;
  let port = opts.port;
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      server = await createStaticServer({ root: opts.root, port, host: opts.host, indexHtml: buildIndex });
      break;
    } catch (err) {
      if (err && err.code === 'EADDRINUSE') {
        port += 1;
        continue;
      }
      throw err;
    }
  }
  if (!server) throw new Error(`no free port between ${opts.port} and ${opts.port + 19}`);
  if (port !== opts.port) console.log(`[serve] port ${opts.port} busy, using ${port}`);
  const base = `http://${opts.host}:${server.port}`;
  console.log(`ManHunt design preview`);
  console.log(`  root    ${server.root}`);
  console.log(`  index   ${base}/`);
  console.log(`  sample  ${base}${url(path.relative(REPO, path.join(WORKSTREAM, 'env', 'samples', 'sample.html')))}`);
  const dirs = await dirsWithPages(path.join(WORKSTREAM, 'directions'));
  for (const d of dirs) console.log(`  pages   ${base}${url(path.relative(REPO, d.dir))}/  (${d.pages.length} html)`);
  if (existsSync(path.join(WORKSTREAM, 'env', 'out', 'index.html'))) {
    console.log(`  gallery ${base}${url(path.relative(REPO, path.join(WORKSTREAM, 'env', 'out', 'index.html')))}`);
  }
  console.log(`  stop    Ctrl-C`);
  const stop = async () => {
    await server.close();
    process.exit(0);
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
