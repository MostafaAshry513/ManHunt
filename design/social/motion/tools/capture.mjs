// Headless Chrome frame capture for the ManHunt short.
// One-shot: starts a local static server, launches Chrome with CDP, paints
// window.renderAt(t) for every frame and saves exact 1080x1920 PNGs.
//
//   node tools/capture.mjs frames master out/frames/master
//   node tools/capture.mjs frames cut    out/frames/cut
//   node tools/capture.mjs still out/stills/hook.png --url "t=0.4"
//   node tools/capture.mjs still out/stills/cover.png --url "cover=1"
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(import.meta.dirname, '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 4173;
const CDP_PORT = 9333;
const W = 1080;
const H = 1920;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.json': 'application/json'
};

/* ── tiny static server ─────────────────────────────────────────────────── */
function startServer() {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      let p = decodeURIComponent(url.pathname);
      if (p === '/') p = '/src/index.html';
      const file = path.join(ROOT, p);
      if (!file.startsWith(ROOT) || !existsSync(file)) {
        res.writeHead(404); res.end('not found'); return;
      }
      const body = await readFile(file);
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(body);
    } catch (e) {
      res.writeHead(500); res.end(String(e));
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

/* ── minimal CDP client on Node's built-in WebSocket ────────────────────── */
class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.handlers = new Map();
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
  on(method, cb) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(cb);
  }
  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve, { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
    return new CDP(ws);
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url) {
  const res = await fetch(url);
  return res.json();
}

async function waitFor(fn, timeoutMs, label) {
  const start = Date.now();
  for (;;) {
    try { if (await fn()) return; } catch (e) { /* retry */ }
    if (Date.now() - start > timeoutMs) throw new Error('timeout waiting for ' + label);
    await sleep(100);
  }
}

async function findPageTarget() {
  const list = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/list`);
  return list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
}

async function launch() {
  const profile = path.join(os.tmpdir(), 'mh-motion-chrome-' + process.pid);
  await rm(profile, { recursive: true, force: true });
  const child = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${W},${H}`,
    '--allow-file-access-from-files',
    '--autoplay-policy=no-user-gesture-required',
    'about:blank'
  ], { stdio: 'ignore', windowsHide: true });
  await waitFor(async () => {
    const v = await fetchJson(`http://127.0.0.1:${CDP_PORT}/json/version`);
    return !!v.webSocketDebuggerUrl;
  }, 20000, 'chrome CDP port');
  return { child, profile };
}

async function captureFrame(cdp, file, fmt, quality) {
  const params = fmt === 'jpeg'
    ? { format: 'jpeg', quality: quality || 90, fromSurface: true, captureBeyondViewport: false }
    : { format: 'png', fromSurface: true, captureBeyondViewport: false };
  const shot = await cdp.send('Page.captureScreenshot', params);
  await writeFile(file, Buffer.from(shot.data, 'base64'));
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  if (mode !== 'frames' && mode !== 'still') {
    console.error('usage: node tools/capture.mjs frames <master|cut> <outDir>  |  node tools/capture.mjs still <file> --url "t=0.4"');
    process.exit(2);
  }
  const urlFlagIdx = args.indexOf('--url');
  const extraQuery = urlFlagIdx >= 0 ? args[urlFlagIdx + 1] : '';
  const evalIdx = args.indexOf('--eval');
  const evalExpr = evalIdx >= 0 ? args[evalIdx + 1] : null;
  const fmtIdx = args.indexOf('--format');
  const frameFormat = fmtIdx >= 0 ? args[fmtIdx + 1] : 'png';
  const qIdx = args.indexOf('--quality');
  const frameQuality = qIdx >= 0 ? Number(args[qIdx + 1]) : 90;
  const limIdx = args.indexOf('--limit');
  const frameLimit = limIdx >= 0 ? Number(args[limIdx + 1]) : 0;
  const startIdx = args.indexOf('--startFrame');
  const frameStart = startIdx >= 0 ? Number(args[startIdx + 1]) : 0;
  const endIdx = args.indexOf('--endFrame');
  const frameEnd = endIdx >= 0 ? Number(args[endIdx + 1]) : 0;

  let timeline = null;
  let out = null;
  let fps = 30;
  let duration = 0;

  if (mode === 'frames') {
    timeline = args[1];
    out = path.resolve(ROOT, args[2]);
  }

  const server = await startServer();
  const { child, profile } = await launch();
  process.on('exit', () => { try { child.kill(); } catch (e) {} });

  try {
    await waitFor(findPageTarget, 20000, 'page target');
    const target = await findPageTarget();
    const cdp = await CDP.connect(target.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    cdp.on('Runtime.exceptionThrown', (p) => {
      const d = p.exceptionDetails || {};
      console.error('\n[page exception] ' + (d.exception && (d.exception.description || d.exception.value) || d.text));
    });
    cdp.on('Runtime.consoleAPICalled', (p) => {
      const vals = (p.args || []).map((a) => a.value !== undefined ? a.value : a.description).join(' ');
      console.log('[page ' + p.type + '] ' + vals);
    });
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: W, height: H, deviceScaleFactor: 1, mobile: false,
      screenWidth: W, screenHeight: H
    });
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', {
      color: { r: 11, g: 18, b: 32, a: 1 }
    });

    const base = `http://127.0.0.1:${PORT}/src/index.html`;

    if (mode === 'frames') {
      // Timing table is duplicated here on purpose so the capture tool can be
      // run standalone; it must match window.MH_TIMELINES in src/animate.js.
      const tables = {
        master: { fps: 30, duration: 15.0, query: '' },
        short15: { fps: 30, duration: 15.0, query: '&timeline=master15' },
        cut: { fps: 15, duration: 6.0, query: '&cut=1' },
        long60: { fps: 30, duration: 60.0, query: '&timeline=long60' },
        short30: { fps: 30, duration: 30.0, query: '&timeline=short30' },
        gif6: { fps: 15, duration: 6.0, query: '&timeline=gif6' }
      };
      const t = tables[timeline];
      if (!t) throw new Error('unknown timeline: ' + timeline);
      fps = t.fps; duration = t.duration;
      await mkdir(out, { recursive: true });
      let total = Math.round(t.duration * t.fps);
      if (frameLimit > 0) total = Math.min(total, frameLimit);
      const first = Math.max(0, frameStart);
      const last = frameEnd > 0 ? Math.min(total, frameEnd) : total;
      total = last;
      const query = `?capture=1${t.query}`;
      const ext = frameFormat === 'jpeg' ? 'jpg' : 'png';
      console.log(`[capture] ${timeline}: frames ${first}..${last - 1} @ ${t.fps} fps ${frameFormat} → ${out}`);
      await cdp.send('Page.navigate', { url: base + query });
      await waitFor(async () => {
        const r = await cdp.send('Runtime.evaluate', { expression: 'window.MH_READY === true', returnByValue: true });
        return r.result && r.result.value === true;
      }, 25000, 'animation ready');

      const t0 = Date.now();
      for (let i = first; i < last; i++) {
        const time = i / t.fps;
        await cdp.send('Runtime.evaluate', { expression: `window.renderAt(${time})`, returnByValue: true });
        await captureFrame(cdp, path.join(out, `frame_${String(i).padStart(5, '0')}.${ext}`), frameFormat, frameQuality);
        if (i % 30 === 0 || i === last - 1) {
          const el = (Date.now() - t0) / 1000;
          process.stdout.write(`\r[capture] frame ${i + 1}/${last}  ${el.toFixed(1)}s`);
        }
      }
      console.log(`\n[capture] done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    } else {
      const file = path.resolve(ROOT, args[1]);
      await mkdir(path.dirname(file), { recursive: true });
      const query = `?capture=1${extraQuery ? '&' + extraQuery : ''}`;
      await cdp.send('Page.navigate', { url: base + query });
      await waitFor(async () => {
        const r = await cdp.send('Runtime.evaluate', { expression: 'window.MH_READY === true', returnByValue: true });
        return r.result && r.result.value === true;
      }, 25000, 'animation ready');
      await sleep(120);
      if (evalExpr) {
        const r = await cdp.send('Runtime.evaluate', { expression: evalExpr, returnByValue: true, awaitPromise: true });
        console.log('[eval] ' + JSON.stringify(r.result ? r.result.value : null));
      }
      await captureFrame(cdp, file);
      console.log('[capture] still → ' + file);
    }
  } finally {
    try { child.kill(); } catch (e) {}
    server.close();
    await sleep(300);
    try { await rm(profile, { recursive: true, force: true }); } catch (e) {}
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
