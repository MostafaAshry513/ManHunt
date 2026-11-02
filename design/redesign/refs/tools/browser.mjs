// Headless-Chrome harness for the ManHunt redesign concept refs.
// Adapted from design/brand/motion-kit/tools/browser.mjs (same proven approach:
// local HTTP server + CDP + document.fonts.ready settle, no npm dependencies).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

export const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export const SLEEP = (ms) => new Promise((r) => setTimeout(r, ms));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.json': 'application/json',
};

export function startServer(root, port = 0) {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      let p = decodeURIComponent(url.pathname);
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
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
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
      /* retry */
    }
    if (Date.now() - start > timeoutMs) throw new Error('timeout waiting for ' + label);
    await SLEEP(70);
  }
}

export class Session {
  constructor({ root, width, height, scale = 1, cdpPort = 9555 } = {}) {
    this.root = root;
    this.width = width;
    this.height = height;
    this.scale = scale;
    this.cdpPort = cdpPort;
  }

  async start() {
    this.server = await startServer(this.root, 0);
    this.port = this.server.address().port;
    this.profile = path.join(os.tmpdir(), 'mh-refs-chrome-' + process.pid + '-' + Date.now());
    this.child = spawn(CHROME, [
      '--headless=new',
      `--remote-debugging-port=${this.cdpPort}`,
      `--user-data-dir=${this.profile}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--hide-scrollbars',
      '--force-color-profile=srgb',
      '--disable-lcd-text',
      '--allow-file-access-from-files',
      '--window-size=1600,1200',
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
    await this.setViewport(this.width, this.height, this.scale);
    return this;
  }

  async setViewport(width, height, scale = 1) {
    this.width = width;
    this.height = height;
    this.scale = scale;
    await this.cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: scale,
      mobile: false,
      screenWidth: width,
      screenHeight: height,
    });
  }

  async navigate(relPath, { timeout = 30000 } = {}) {
    const url = `http://127.0.0.1:${this.port}${relPath}`;
    await this.cdp.send('Page.navigate', { url });
    await waitFor(async () => {
      const r = await this.cdp.send('Runtime.evaluate', {
        expression: 'document.readyState === "complete"',
        returnByValue: true,
      });
      return r.result && r.result.value === true;
    }, timeout, 'document ready');
    await this.settle();
    return url;
  }

  async settle(ms = 260) {
    try {
      await this.cdp.send('Runtime.evaluate', {
        expression: `(async () => {
          await document.fonts.ready;
          const imgs = [...document.images];
          await Promise.all(imgs.map(img => img.complete ? 0 : new Promise(res => { img.onload = res; img.onerror = res; })));
          return true;
        })()`,
        returnByValue: true,
        awaitPromise: true,
      });
    } catch (err) {
      /* pages without fonts/images still capture */
    }
    await SLEEP(ms);
  }

  async screenshot(file) {
    const shot = await this.cdp.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
      captureBeyondViewport: false,
    });
    const { writeFile, mkdir } = await import('node:fs/promises');
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, Buffer.from(shot.data, 'base64'));
    return file;
  }

  async close() {
    try { this.child && this.child.kill(); } catch (err) { /* noop */ }
    try { this.server && this.server.close(); } catch (err) { /* noop */ }
    await SLEEP(200);
    try {
      const { rm } = await import('node:fs/promises');
      await rm(this.profile, { recursive: true, force: true });
    } catch (err) { /* noop */ }
  }
}
