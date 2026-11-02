// Headless-Chrome renderer for the GitHub landing-page assets.
//
//   node tools/render.mjs still  --page design/github-redesign/stage/hero.html --size 1280x480 --out design/github-redesign/assets/hero.png
//   node tools/render.mjs frames --page design/github-redesign/stage/hero.html --size 1280x480 --fps 20 --duration 5 --out build/frames
//   node tools/render.mjs page   --page design/github-redesign/preview/readme-preview.html --size 1200x1600 --full-page --out preview.png
//
// Extends the motion-kit render approach: one local static server rooted at the
// repo (so the stage can load the shared OFL fonts, official lockup PNGs, the
// site-redesign map art and the premium captures without copying anything),
// plus Chrome-over-CDP exact-viewport screenshots. No npm dependencies.
import { createServer } from 'node:http';
import { readFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const TOOLS = import.meta.dirname;
const REPO = path.resolve(TOOLS, '..', '..', '..'); // C:\dev\ManHunt
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const FFMPEG = 'C:\\dev\\ManHunt\\design\\.tools\\node_modules\\ffmpeg-static\\ffmpeg.exe';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.gif': 'image/gif', '.ttf': 'font/ttf', '.woff2': 'font/woff2',
  '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startServer(root, port = 0) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      let p = decodeURIComponent(url.pathname);
      if (p === '/') p = '/index.html';
      const file = path.join(root, p);
      if (!file.startsWith(root) || !existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
    } catch (err) { res.writeHead(500); res.end(String(err)); }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

class CDP {
  constructor(ws) {
    this.ws = ws; this.id = 0; this.pending = new Map(); this.handlers = new Map();
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      } else if (msg.method && this.handlers.has(msg.method)) {
        for (const cb of this.handlers.get(msg.method)) cb(msg.params);
      }
    });
  }
  static connect(url) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      ws.addEventListener('open', () => resolve(new CDP(ws)), { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
  }
  on(method, cb) { if (!this.handlers.has(method)) this.handlers.set(method, []); this.handlers.get(method).push(cb); }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

async function waitFor(fn, timeoutMs, label) {
  const start = Date.now();
  for (;;) {
    try { if (await fn()) return; } catch (err) { /* retry */ }
    if (Date.now() - start > timeoutMs) throw new Error('timeout waiting for ' + label);
    await sleep(80);
  }
}
const fetchJson = async (url) => (await fetch(url)).json();

async function evaluate(cdp, expression, awaitPromise = false) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
  if (r.exceptionDetails) throw new Error('evaluate failed: ' + (r.exceptionDetails.text || ''));
  return r.result || {};
}

async function openSession({ width, height, cdpPort = 9466 }) {
  const server = await startServer(REPO, 0);
  const port = server.address().port;
  const profile = path.join(os.tmpdir(), 'mh-github-' + process.pid + '-' + Date.now());
  const child = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${cdpPort}`, `--user-data-dir=${profile}`,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--disable-background-networking',
    '--hide-scrollbars', '--force-device-scale-factor=1', '--force-color-profile=srgb', '--disable-lcd-text',
    `--window-size=${Math.max(width, 1600)},${Math.max(height, 1000)}`, 'about:blank',
  ], { stdio: 'ignore', windowsHide: true });
  await waitFor(async () => !!(await fetchJson(`http://127.0.0.1:${cdpPort}/json/version`)).webSocketDebuggerUrl, 20000, 'chrome CDP');
  const targets = await fetchJson(`http://127.0.0.1:${cdpPort}/json/list`);
  const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  const cdp = await CDP.connect(page.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  cdp.on('Runtime.exceptionThrown', (p) => {
    const d = p.exceptionDetails || {};
    console.error('[page exception] ' + (d.exception && (d.exception.description || d.exception.value) || d.text));
  });
  await cdp.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false, screenWidth: width, screenHeight: height });
  const close = async () => {
    try { child.kill(); } catch (err) { /* noop */ }
    server.close();
    await sleep(200);
    try { await rm(profile, { recursive: true, force: true }); } catch (err) { /* noop */ }
  };
  return { cdp, port, close };
}

async function navigate(cdp, port, pageRel, { fullPage = false } = {}) {
  const url = `http://127.0.0.1:${port}/${pageRel.replace(/^\/+/, '')}`;
  await cdp.send('Page.navigate', { url });
  await waitFor(async () => (await evaluate(cdp, 'document.readyState === "complete"')).value === true, 30000, 'document ready');
  await evaluate(cdp, `(async () => { await document.fonts.ready; const imgs=[...document.images]; await Promise.all(imgs.map(i=>i.complete?0:new Promise(r=>{i.onload=r;i.onerror=r}))); return true; })()`, true);
  await sleep(200);
  return url;
}

async function shot(cdp, file, fullPage) {
  let params = { format: 'png', fromSurface: true, captureBeyondViewport: false };
  if (fullPage) {
    const metrics = await cdp.send('Page.getLayoutMetrics');
    const size = metrics.cssContentSize || metrics.contentSize;
    params = { format: 'png', fromSurface: true, captureBeyondViewport: true, clip: { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 } };
  }
  const res = await cdp.send('Page.captureScreenshot', params);
  await mkdir(path.dirname(file), { recursive: true });
  const { writeFile } = await import('node:fs/promises');
  await writeFile(file, Buffer.from(res.data, 'base64'));
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t.startsWith('--')) {
      const k = t.slice(2); const n = argv[i + 1];
      if (n === undefined || n.startsWith('--')) args[k] = true;
      else { args[k] = n; i++; }
    } else args._.push(t);
  }
  return args;
}
const sizeOf = (raw, fallback = '1280x480') => {
  const m = String(raw || fallback).match(/^(\d+)x(\d+)$/);
  if (!m) throw new Error('bad --size ' + raw);
  return { width: Number(m[1]), height: Number(m[2]) };
};
const outPath = (p) => (path.isAbsolute(p) ? p : path.join(REPO, p));

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args._[0];
  const page = String(args.page || '').replace(/^\/+/, '');
  if (!page) throw new Error('--page required');
  if (mode === 'still' || mode === 'frames') {
    const { width, height } = sizeOf(args.size);
    const session = await openSession({ width, height });
    try {
      await navigate(session.cdp, session.port, page);
      if (args['anim-time'] != null) {
        await evaluate(session.cdp, `(() => { for (const a of document.getAnimations()) { try { a.currentTime = ${Number(args['anim-time'])} * 1000; a.pause(); } catch (e) {} } return document.getAnimations().length; })()`);
      }
      if (mode === 'still') {
        await shot(session.cdp, outPath(args.out), false);
        console.log(`[still] ${page} ${width}x${height} -> ${args.out}`);
      } else {
        const fps = Number(args.fps || 20);
        const duration = Number(args.duration || 5);
        const total = Math.round(fps * duration);
        const dir = outPath(args.out);
        await mkdir(dir, { recursive: true });
        for (let i = 0; i < total; i++) {
          await evaluate(session.cdp, `window.renderAt(${(i / fps).toFixed(5)})`);
          await shot(session.cdp, path.join(dir, `frame_${String(i).padStart(4, '0')}.png`), false);
          if (i % 20 === 0 || i === total - 1) process.stdout.write(`\r[frames] ${i + 1}/${total}`);
        }
        console.log(`\n[frames] ${page} ${width}x${height}: ${total} frames @ ${fps} fps -> ${args.out}`);
      }
    } finally { await session.close(); }
    return;
  }
  if (mode === 'page') {
    const { width, height } = sizeOf(args.size, '1200x1600');
    const session = await openSession({ width, height });
    try {
      await navigate(session.cdp, session.port, page);
      if (args['anim-time'] != null) {
        await evaluate(session.cdp, `(() => { for (const a of document.getAnimations()) { try { a.currentTime = ${Number(args['anim-time'])} * 1000; a.pause(); } catch (e) {} } return document.getAnimations().length; })()`);
      }
      if (args.out) {
        await shot(session.cdp, outPath(args.out), !!args['full-page']);
        console.log(`[page] ${page} -> ${args.out} (${width}x${height}${args['full-page'] ? ' full-page' : ''})`);
      }
      if (args.eval) console.log('[eval] ' + JSON.stringify((await evaluate(session.cdp, String(args.eval), true)).value));
    } finally { await session.close(); }
    return;
  }
  console.error('usage: node tools/render.mjs <still|frames|page> --page <repo path> [options]');
  process.exit(2);
}

main().catch((err) => { console.error(err); process.exit(1); });

export { FFMPEG };
