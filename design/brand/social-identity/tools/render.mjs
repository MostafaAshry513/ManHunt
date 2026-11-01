// Headless-Chrome renderer for the ManHunt social identity kit.
//
//   node tools/render.mjs still  --art avatar --size 1024 --t 0 --out out/avatars/x.png
//   node tools/render.mjs still  --art reddit-profile --out out/headers/x.png
//   node tools/render.mjs frames --art avatar --size 512 --fps 20 --duration 4 --out build/tmp/avatar
//   node tools/render.mjs page   --file social-identity/templates/story-1080x1920.html --size 1080x1920 --out out/templates/x.png
//
// Extends the motion kit: reuses its static server + Chrome/ffmpeg locations,
// served from design/brand so the kit shares /motion-kit assets (algorithm,
// lockup, OFL fonts) instead of copying them.
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { startServer, CHROME, FFMPEG, sleep } from '../../motion-kit/tools/browser.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..'); // design/brand
const KIT = path.resolve(import.meta.dirname, '..'); // social-identity
const sleepMs = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  static connect(wsUrl) {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl);
      ws.addEventListener('open', () => resolve(new CDP(ws)), { once: true });
      ws.addEventListener('error', reject, { once: true });
    });
  }
  on(method, cb) {
    if (!this.handlers.has(method)) this.handlers.set(method, []);
    this.handlers.get(method).push(cb);
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
}

const fetchJson = async (url) => (await fetch(url)).json();

async function waitFor(fn, timeoutMs, label) {
  const start = Date.now();
  for (;;) {
    try {
      if (await fn()) return;
    } catch (err) { /* retry */ }
    if (Date.now() - start > timeoutMs) throw new Error('timeout waiting for ' + label);
    await sleepMs(80);
  }
}

async function openSession({ width, height }) {
  const server = await startServer(ROOT, 0);
  const port = server.address().port;
  const cdpPort = 9455;
  const profile = path.join(process.env.TEMP || '/tmp', 'mhsi-chrome-' + process.pid + '-' + Date.now());
  const { spawn } = await import('node:child_process');
  const child = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    '--force-color-profile=srgb',
    '--disable-lcd-text',
    `--window-size=${Math.max(width, 1600)},${Math.max(height, 1000)}`,
    'about:blank',
  ], { stdio: 'ignore', windowsHide: true });

  await waitFor(async () => {
    const v = await fetchJson(`http://127.0.0.1:${cdpPort}/json/version`);
    return !!v.webSocketDebuggerUrl;
  }, 20000, 'chrome CDP port');
  const targets = await fetchJson(`http://127.0.0.1:${cdpPort}/json/list`);
  const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
  const cdp = await CDP.connect(page.webSocketDebuggerUrl);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  cdp.on('Runtime.exceptionThrown', (p) => {
    const d = p.exceptionDetails || {};
    console.error('[page exception] ' + (d.exception && (d.exception.description || d.exception.value) || d.text));
  });
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: false,
    screenWidth: width, screenHeight: height,
  });

  const close = async () => {
    try { child.kill(); } catch (err) { /* noop */ }
    server.close();
    await sleepMs(200);
    try {
      const { rm } = await import('node:fs/promises');
      await rm(profile, { recursive: true, force: true });
    } catch (err) { /* noop */ }
  };
  return { cdp, port, close };
}

async function evaluate(cdp, expression, awaitPromise = false) {
  const r = await cdp.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise });
  if (r.exceptionDetails) throw new Error('evaluate failed: ' + (r.exceptionDetails.text || ''));
  return r.result || {};
}

async function nav(cdp, url, { waitReady = false } = {}) {
  await cdp.send('Page.navigate', { url });
  if (waitReady) {
    await waitFor(async () => {
      const r = await evaluate(cdp, 'window.MH_READY === true || !!window.MH_ERROR');
      return r.value === true;
    }, 30000, 'window.MH_READY');
    const err = await evaluate(cdp, 'window.MH_ERROR || null');
    if (err.value) throw new Error('stage error: ' + err.value);
  } else {
    await waitFor(async () => (await evaluate(cdp, 'document.readyState === "complete"')).value === true, 30000, 'document ready');
    await evaluate(cdp, `(async()=>{await document.fonts.ready;const imgs=[...document.images];await Promise.all(imgs.map(i=>i.complete?0:new Promise(r=>{i.onload=r;i.onerror=r})));return true})()`, true);
  }
  await sleepMs(200);
}

async function shot(cdp, file, fullPage) {
  let params = { format: 'png', fromSurface: true, captureBeyondViewport: false };
  if (fullPage) {
    const metrics = await cdp.send('Page.getLayoutMetrics');
    const size = metrics.cssContentSize || metrics.contentSize;
    params = {
      format: 'png', fromSurface: true, captureBeyondViewport: true,
      clip: { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 },
    };
  }
  const res = await cdp.send('Page.captureScreenshot', params);
  const { writeFile } = await import('node:fs/promises');
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, Buffer.from(res.data, 'base64'));
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) args[key] = true;
      else { args[key] = next; i++; }
    } else args._.push(token);
  }
  return args;
}

function sizeOf(args, fallback = '512x512') {
  const raw = String(args.size || fallback);
  const m = raw.match(/^(\d+)x(\d+)$/);
  if (!m) throw new Error('bad --size ' + raw);
  return { width: Number(m[1]), height: Number(m[2]) };
}

const outPath = (p) => (path.isAbsolute(p) ? p : path.join(KIT, p));

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args._[0];
  if (mode === 'still') {
    let width;
    let height;
    let url;
    if ((args.art || 'avatar') === 'avatar') {
      const s = Number(args.size || 512);
      width = s; height = s;
      url = `/social-identity/src/stage.html?art=avatar&size=${s}`;
    } else {
      width = 1600; height = 1000; // provisional; resized to the artboard after load
      url = `/social-identity/src/stage.html?art=${encodeURIComponent(args.art)}`;
    }
    const session = await openSession({ width, height });
    try {
      await nav(session.cdp, `http://127.0.0.1:${session.port}${url}`, { waitReady: true });
      if (args.t != null) await evaluate(session.cdp, `window.renderAt(${Number(args.t)})`);
      if ((args.art || 'avatar') !== 'avatar') {
        const size = await evaluate(session.cdp, `(() => { const s = document.getElementById('stage'); return { w: Math.round(s.getBoundingClientRect().width), h: Math.round(s.getBoundingClientRect().height) }; })()`);
        const { w, h } = size.value;
        await session.cdp.send('Emulation.setDeviceMetricsOverride', {
          width: w, height: h, deviceScaleFactor: 1, mobile: false, screenWidth: w, screenHeight: h,
        });
        await sleepMs(150);
      }
      await shot(session.cdp, outPath(args.out), false);
      console.log(`[still] ${args.art || 'avatar'} -> ${args.out}`);
    } finally { await session.close(); }
    return;
  }

  if (mode === 'frames') {
    const size = Number(args.size || 512);
    const fps = Number(args.fps || 20);
    const duration = Number(args.duration || 4);
    const total = Math.round(fps * duration);
    const outDir = outPath(args.out);
    await mkdir(outDir, { recursive: true });
    const session = await openSession({ width: size, height: size });
    try {
      await nav(session.cdp, `http://127.0.0.1:${session.port}/social-identity/src/stage.html?art=avatar&size=${size}`, { waitReady: true });
      const started = Date.now();
      for (let i = 0; i < total; i++) {
        await evaluate(session.cdp, `window.renderAt(${(i / fps).toFixed(5)})`);
        await shot(session.cdp, path.join(outDir, `frame_${String(i).padStart(4, '0')}.png`), false);
        if (i % 20 === 0 || i === total - 1) {
          process.stdout.write(`\r[frames] avatar ${i + 1}/${total} ${((Date.now() - started) / 1000).toFixed(1)}s`);
        }
      }
      console.log(`\n[frames] avatar ${size}x${size}: ${total} frames @ ${fps} fps -> ${args.out}`);
    } finally { await session.close(); }
    return;
  }

  if (mode === 'page') {
    const { width, height } = sizeOf(args, '1080x1080');
    const session = await openSession({ width, height });
    try {
      const rel = String(args.file || '').replace(/^\/+/, '');
      await nav(session.cdp, `http://127.0.0.1:${session.port}/${rel}`, { waitReady: false });
      if (args['anim-time'] != null) {
        const t = Number(args['anim-time']);
        await evaluate(session.cdp, `(() => { for (const a of document.getAnimations()) { try { a.currentTime = ${t} * 1000; a.pause(); } catch (e) {} } return document.getAnimations().length; })()`);
      }
      if (args.expr) {
        const r = await evaluate(session.cdp, String(args.expr), true);
        console.log('[eval] ' + JSON.stringify(r.value));
      }
      await shot(session.cdp, outPath(args.out), !!args['full-page']);
      console.log(`[page] ${args.file} -> ${args.out} (${width}x${height}${args['full-page'] ? ' full-page' : ''})`);
    } finally { await session.close(); }
    return;
  }

  console.error('usage: node tools/render.mjs <still|frames|page> [options]');
  process.exit(2);
}

main().catch((err) => { console.error(err); process.exit(1); });
