#!/usr/bin/env node
// Exact-pixel renderer for the ManHunt UI/UX redesign.
//
//   node render.mjs samples/sample.html
//   node render.mjs directions/a-matchday-raised
//   node render.mjs --all
//   node render.mjs directions/a-matchday-raised/home.html --out out/check
//
// Canvas: logical 390x844 dp at deviceScaleFactor 3 => exactly 1170x2532 px.
// Pages are served from the repo root so /design/... fonts and marks load.
import path from 'node:path';
import { readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { EnvSession, CANVAS, repoLabel, REPO, WORKSTREAM } from './lib/browser.mjs';
import { readDirectionPages } from './lib/direction.mjs';

const HELP = `ManHunt design renderer — HTML page -> exact-pixel PNG

USAGE
  node render.mjs <file.html | directory> [more targets...] [options]
  node render.mjs --all

OPTIONS
  --out <dir>        write PNGs to <dir> instead of <source folder>/out
  --scheme <theme>   prefers-color-scheme for pages without data-theme: dark (default) | light
  --light            shorthand for --scheme light
  --all              render every direction folder under design/ui-v2/directions/
  --settle <ms>      extra settle delay after fonts/images, default 120
  --quiet            only errors and the final summary
  -h, --help         this text

OUTPUT
  One PNG per HTML file, same stem, in <source folder>/out/ by default.
  Every page is captured at 390x844 dp, deviceScaleFactor 3 => 1170x2532 px.
`;

function fatal(msg) {
  console.error(`\n[render] ${msg}\n`);
  process.exit(2);
}

const argv = process.argv.slice(2);
if (!argv.length) fatal(HELP);
const opts = { out: null, scheme: 'dark', all: false, settle: 120, quiet: false };
const targets = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '-h' || a === '--help') fatal(HELP);
  else if (a === '--out' || a === '--scheme' || a === '--settle') {
    const v = argv[++i];
    if (v === undefined) fatal(`${a} needs a value`);
    if (a === '--out') opts.out = path.resolve(process.cwd(), v);
    else if (a === '--scheme') opts.scheme = v === 'light' ? 'light' : 'dark';
    else opts.settle = Math.max(0, Number(v) || 0);
  } else if (a === '--light') opts.scheme = 'light';
  else if (a === '--dark') opts.scheme = 'dark';
  else if (a === '--all') opts.all = true;
  else if (a === '--quiet') opts.quiet = true;
  else if (a.startsWith('-')) fatal(`unknown option ${a}\n\n${HELP}`);
  else targets.push(a);
}

/** Resolve a CLI path: cwd first, then repo root. */
function resolveInput(p) {
  const fromCwd = path.resolve(process.cwd(), p);
  if (existsSync(fromCwd)) return fromCwd;
  const fromRepo = path.resolve(REPO, p);
  if (existsSync(fromRepo)) return fromRepo;
  fatal(`target not found: ${p}\n  tried ${fromCwd}\n  tried ${fromRepo}`);
}

async function collectJobs() {
  const jobs = [];
  const outDirForPagesDir = (pagesDir) => (path.basename(pagesDir) === 'pages' ? path.join(path.dirname(pagesDir), 'out') : path.join(pagesDir, 'out'));
  if (opts.all) {
    const dir = path.join(WORKSTREAM, 'directions');
    if (!existsSync(dir)) fatal(`no directions folder at ${dir}`);
    const dirs = (await readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => path.join(dir, e.name));
    for (const d of dirs) {
      const layout = await readDirectionPages(d);
      for (const f of layout.pageFiles) jobs.push({ source: path.join(layout.pagesDir, f), outDir: layout.outDir });
    }
    if (!jobs.length) fatal(`--all found no HTML pages under ${dir}/*/ (root or pages/ layout)`);
    return jobs;
  }
  for (const target of targets.map(resolveInput)) {
    const st = await stat(target);
    if (st.isDirectory()) {
      // A direction folder may keep pages directly or in pages/; both are supported.
      const layout = await readDirectionPages(target);
      if (!layout.pageFiles.length) fatal(`no .html files in ${target} (looked in the folder and ${path.join(target, 'pages')})`);
      // Pointing straight at a pages/ folder (designer habit) must still write <direction>/out/.
      const outDir = path.basename(target) === 'pages' ? path.join(path.dirname(target), 'out') : layout.outDir;
      for (const f of layout.pageFiles) jobs.push({ source: path.join(layout.pagesDir, f), outDir });
    } else if (/\.html?$/i.test(target)) {
      const dir = path.dirname(target);
      jobs.push({ source: target, outDir: path.basename(dir) === 'pages' ? path.join(path.dirname(dir), 'out') : path.join(dir, 'out') });
    } else {
      fatal(`not an .html file or directory: ${target}`);
    }
  }
  if (!jobs.length) fatal(`nothing to render\n\n${HELP}`);
  if (opts.out) for (const j of jobs) j.outDir = opts.out;
  return jobs;
}

const jobs = await collectJobs();
const started = Date.now();
const session = await new EnvSession({ colorScheme: opts.scheme }).start();
if (!opts.quiet) {
  console.log(`[env] canvas ${CANVAS.width}x${CANVAS.height} dp @${CANVAS.scale}x => ${CANVAS.pxWidth}x${CANVAS.pxHeight} px | scheme ${opts.scheme} | ${jobs.length} page(s)`);
}
let ok = 0;
const failures = [];
try {
  for (const job of jobs) {
    const stem = path.basename(job.source).replace(/\.html?$/i, '');
    const out = path.join(job.outDir, `${stem}.png`);
    try {
      const res = await session.render({ file: job.source, out, settleMs: opts.settle, quiet: opts.quiet });
      ok++;
    } catch (err) {
      failures.push({ source: repoLabel(job.source), error: err.message.split('\n')[0] });
      console.error(`[fail] ${repoLabel(job.source)}: ${err.message.split('\n')[0]}`);
    }
  }
} finally {
  await session.close();
}
const secs = ((Date.now() - started) / 1000).toFixed(1);
console.log(`[render] done: ${ok}/${jobs.length} page(s) rendered in ${secs}s at exactly ${CANVAS.pxWidth}x${CANVAS.pxHeight} px${failures.length ? ` — ${failures.length} failed` : ''}`);
if (failures.length) {
  for (const f of failures) console.error(`  - ${f.source}: ${f.error}`);
  process.exit(1);
}
