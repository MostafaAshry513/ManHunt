// Shared headless-Chrome harness for the motion kit (no npm dependencies).
// Serves the kit folder over a one-shot local HTTP server, drives Chrome over
// CDP using Node's built-in WebSocket, and returns exact-pixel screenshots.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

export const KIT = path.resolve(import.meta.dirname, '..');
export const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export const FFMPEG = 'C:\\dev\\ManHunt\\design\\.tools\\node_modules\\ffmpeg-static\\ffmpeg.exe';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
  '.gif': 'image/gif',
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function startServer(root = KIT, port = 0) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      let p = decodeURIComponent(url.pathname);
      if (p === '/') p = '/src/stage.html';
      const file = path.join(root, p);
      if (!file.startsWith(root) || !existsSync(file)) {
        res.writeHead(404);
        res.end('not found');
        return;
      }
      const body = await readFile(file);
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(body);
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

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

async function fetchJson(url) {
  const res = await fetch(url);
  return res.json();
}

async function waitFor(fn, timeoutMs, label) {
  const start = Date.now();
  for (;;) {
    try {
      if (await fn()) return;
    } catch (err) {
      /* retry until timeout */
    }
    if (Date.now() - start > timeoutMs) throw new Error('timeout waiting for ' + label);
    await sleep(80);
  }
}

/** One-shot browser session pinned to an exact viewport. */
export class Session {
  constructor({ width, height, reduceMotion = false, chrome = CHROME, cdpPort = 9444 } = {}) {
    this.width = width;
    this.height = height;
    this.reduceMotion = reduceMotion;
    this.chrome = chrome;
    this.cdpPort = cdpPort;
    this.logs = [];
  }

  async start() {
    this.server = await startServer(KIT, 0);
    this.port = this.server.address().port;
    this.profile = path.join(os.tmpdir(), 'mh-kit-chrome-' + process.pid + '-' + Date.now());
    this.child = spawn(this.chrome, [
      '--headless=new',
      `--remote-debugging-port=${this.cdpPort}`,
      `--user-data-dir=${this.profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      '--force-color-profile=srgb',
      '--disable-lcd-text',
      `--window-size=${Math.max(this.width, 1600)},${Math.max(this.height, 1000)}`,
      '--allow-file-access-from-files',
      '--autoplay-policy=no-user-gesture-required',
      'about:blank',
    ], { stdio: 'ignore', windowsHide: true });

    await waitFor(async () => {
      const v = await fetchJson(`http://127.0.0.1:${this.cdpPort}/json/version`);
      return !!v.webSocketDebuggerUrl;
    }, 20000, 'chrome CDP port');

    const targets = await fetchJson(`http://127.0.0.1:${this.cdpPort}/json/list`);
    const page = targets.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
    this.cdp = await CDP.connect(page.webSocketDebuggerUrl);
    await this.cdp.send('Page.enable');
    await this.cdp.send('Runtime.enable');
    this.cdp.on('Runtime.exceptionThrown', (p) => {
      const d = p.exceptionDetails || {};
      this.logs.push('[page exception] ' + (d.exception && (d.exception.description || d.exception.value) || d.text));
    });
    this.cdp.on('Runtime.consoleAPICalled', (p) => {
      const vals = (p.args || []).map((a) => (a.value !== undefined ? a.value : a.description)).join(' ');
      this.logs.push('[page ' + p.type + '] ' + vals);
    });
    await this.cdp.send('Emulation.setDeviceMetricsOverride', {
      width: this.width, height: this.height, deviceScaleFactor: 1, mobile: false,
      screenWidth: this.width, screenHeight: this.height,
    });
    if (this.reduceMotion) {
      await this.cdp.send('Emulation.setEmulatedMedia', {
        features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
      });
    }
    return this;
  }

  /** Navigate to a kit-relative path with optional query string. */
  async navigate(relPath, { query = '', waitMode = 'page', timeout = 30000 } = {}) {
    const url = `http://127.0.0.1:${this.port}${relPath}${query ? '?' + query : ''}`;
    await this.cdp.send('Page.navigate', { url });
    if (waitMode === 'stage') {
      await waitFor(async () => {
        const r = await this.evaluate('window.MH_READY === true || !!window.MH_ERROR');
        return r.value === true;
      }, timeout, 'window.MH_READY');
      const err = await this.evaluate('window.MH_ERROR || null');
      if (err.value) throw new Error('stage error: ' + err.value);
    } else {
      await waitFor(async () => {
        const r = await this.evaluate('document.readyState === "complete"');
        return r.value === true;
      }, timeout, 'document ready');
    }
    await this.settle();
    return url;
  }

  /** Fonts + images settled (static pages), then a short paint settle. */
  async settle(ms = 220) {
    try {
      await this.evaluate(`(async () => {
        await document.fonts.ready;
        const imgs = [...document.images];
        await Promise.all(imgs.map(img => img.complete ? 0 : new Promise(res => { img.onload = res; img.onerror = res; })));
        return true;
      })()`, { awaitPromise: true });
    } catch (err) {
      /* pages without image/font work still capture */
    }
    await sleep(ms);
  }

  async evaluate(expression, { awaitPromise = false } = {}) {
    const r = await this.cdp.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise,
    });
    if (r.exceptionDetails) {
      const desc = r.exceptionDetails.exception && (r.exceptionDetails.exception.description || r.exceptionDetails.exception.value);
      throw new Error('evaluate failed: ' + (desc || r.exceptionDetails.text));
    }
    return r.result || {};
  }

  async screenshot(file, { fullPage = false } = {}) {
    let params = { format: 'png', fromSurface: true, captureBeyondViewport: false };
    if (fullPage) {
      const metrics = await this.cdp.send('Page.getLayoutMetrics');
      const size = metrics.cssContentSize || metrics.contentSize;
      params = {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: Math.ceil(size.width), height: Math.ceil(size.height), scale: 1 },
      };
    }
    const shot = await this.cdp.send('Page.captureScreenshot', params);
    const { writeFile, mkdir } = await import('node:fs/promises');
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(shot.data, 'base64'));
    return file;
  }

  async close() {
    try { this.child && this.child.kill(); } catch (err) { /* noop */ }
    try { this.server && this.server.close(); } catch (err) { /* noop */ }
    await sleep(200);
    try {
      const { rm } = await import('node:fs/promises');
      await rm(this.profile, { recursive: true, force: true });
    } catch (err) { /* noop */ }
  }
}

export { sleep };
