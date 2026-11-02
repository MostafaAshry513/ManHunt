/**
 * ManHunt site redesign — headless Chrome capture + layout diagnostics.
 *
 * Real Chrome DevTools Protocol (no puppeteer/playwright dependency):
 *  - true mobile emulation (viewport, DPR, UA, touch) at 390x844
 *  - tablet 820x1180 and desktop 1440x900
 *  - full-page PNG, per-section PNGs, viewport PNG
 *  - diagnostics: horizontal overflow, clipped/overflowing elements, blank images,
 *    failed network requests, console errors, element screenshots
 *
 * Usage:
 *   node capture.mjs --url http://127.0.0.1:8095/ --out design/site-redesign/shots/before [--presets all|desktop,tablet,mobile] [--dpr 2]
 */
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';

const PRESETS = {
  desktop: { width: 1440, height: 900, dpr: 1, mobile: false, label: 'desktop-1440' },
  tablet: { width: 820, height: 1180, dpr: 1, mobile: true, label: 'tablet-820' },
  mobile: { width: 390, height: 844, dpr: 2, mobile: true, label: 'mobile-390' },
  board: { width: 1600, height: 1200, dpr: 1, mobile: false, label: 'board-1600' },
  wide: { width: 1200, height: 900, dpr: 1, mobile: false, label: 'wide-1200' },
  'mobile-xs': { width: 320, height: 700, dpr: 2, mobile: true, label: 'mobile-320' },
};

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const URL_TO_LOAD = arg('url', 'http://127.0.0.1:8095/');
const OUT = resolve(arg('out', 'design/site-redesign/shots/before'));
const PRESET_ARG = arg('presets', 'desktop,tablet,mobile');
const DPR_OVERRIDE = Number(arg('dpr', '0')) || 0;
const FULL = arg('full', '1') !== '0';
const SECTIONS = arg('sections', '1') !== '0';
const REDUCED_MOTION = arg('reduced', '0') === '1';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class CDP {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = [];
    this.sessionId = null;
    this.ready = new Promise((res, rej) => {
      this.ws.addEventListener('open', () => res());
      this.ws.addEventListener('error', (e) => rej(new Error(`ws error: ${e.message ?? e}`)));
    });
    this.ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve: r, reject: j } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) j(new Error(`${msg.error.message} (${msg.error.code})`));
        else r(msg.result);
      } else if (msg.method) {
        for (const fn of this.listeners) fn(msg);
      }
    });
  }
  send(method, params = {}, useSession = true) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (useSession && this.sessionId) payload.sessionId = this.sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve_, reject) => this.pending.set(id, { resolve: resolve_, reject }));
  }
  on(fn) { this.listeners.push(fn); }
  once(method, timeoutMs = 30000) {
    return new Promise((resolve_) => {
      const t = setTimeout(() => resolve_(null), timeoutMs);
      const fn = (msg) => {
        if (msg.method === method) {
          clearTimeout(t);
          this.listeners = this.listeners.filter((f) => f !== fn);
          resolve_(msg.params);
        }
      };
      this.listeners.push(fn);
    });
  }
}

async function getJSON(url) {
  const res = await fetch(url);
  return res.json();
}

async function launchChrome(port) {
  const userDataDir = await mkdtemp(join(tmpdir(), 'mh-cdp-'));
  const child = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-background-networking',
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    '--hide-scrollbars',
    '--mute-audio',
    '--force-device-scale-factor=1',
    'about:blank',
  ], { stdio: 'ignore' });
  for (let i = 0; i < 100; i++) {
    try {
      const v = await getJSON(`http://127.0.0.1:${port}/json/version`);
      if (v.webSocketDebuggerUrl) return { child, userDataDir, browserWs: v.webSocketDebuggerUrl };
    } catch { /* not up yet */ }
    await sleep(100);
  }
  throw new Error('Chrome did not expose CDP');
}

const DIAGNOSTICS_JS = `(() => {
  const vw = window.innerWidth;
  const docW = document.documentElement.scrollWidth;
  const bodyW = document.body.scrollWidth;
  const inScroller = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && p.clientWidth >= 0) return true;
    }
    return false;
  };
  const overflow = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (r.right > vw + 1 || r.left < -1) {
      if (inScroller(el)) continue;
      if (el.classList && (el.classList.contains('skip') || el.classList.contains('sr-only'))) continue;
      if (r.left < -1000) continue; // off-screen a11y affordances parked outside the viewport
      const cs = getComputedStyle(el);
      const name = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0, 3).join('.') : '');
      overflow.push({ name, left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width), position: cs.position });
    }
  }
  // keep the largest offenders only
  overflow.sort((a, b) => (b.right - vw) - (a.right - vw));
  const blankImages = [...document.images].filter(img => !img.complete || img.naturalWidth === 0).map(img => ({ src: img.getAttribute('src'), currentSrc: img.currentSrc, loading: img.loading, complete: img.complete, nat: img.naturalWidth }));
  const smallImages = [...document.images].filter(img => img.complete && img.naturalWidth > 0 && img.getBoundingClientRect().width < 20).map(img => img.getAttribute('src'));
  const headings = [...document.querySelectorAll('h1,h2,h3')].map(h => ({ tag: h.tagName, text: h.textContent.trim().slice(0, 80), size: getComputedStyle(h).fontSize }));
  const links = [...document.querySelectorAll('a')].map(a => ({ text: a.textContent.trim().slice(0, 40), href: a.getAttribute('href') }));
  const bodyText = document.body.innerText;
  const overflowTextEls = [...document.querySelectorAll('h1,h2,h3,p,li,a,span,b,code')].filter(el => el.scrollWidth > el.clientWidth + 2).map(el => ({ tag: el.tagName, text: el.textContent.trim().slice(0, 60), scroll: el.scrollWidth, client: el.clientWidth }));
  return {
    title: document.title,
    viewport: { w: vw, h: window.innerHeight, dpr: window.devicePixelRatio },
    docWidth: { documentElement: docW, body: bodyW },
    horizontalOverflow: Math.max(docW, bodyW) > vw + 1,
    overflowElements: overflow.slice(0, 15),
    overflowTextEls: overflowTextEls.slice(0, 10),
    blankImages, smallImages,
    headings,
    linkCount: links.length,
    links: links.slice(0, 40),
    contentHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
    text: bodyText.slice(0, 2500),
  };
})()`;

async function main() {
  await mkdir(OUT, { recursive: true });
  const port = 9300 + Math.floor(Math.random() * 300);
  const { child, userDataDir, browserWs } = await launchChrome(port);
  const cdp = new CDP(browserWs);
  await cdp.ready;

  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' }, false);
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true }, false);
  cdp.sessionId = sessionId;

  const failedRequests = [];
  const consoleErrors = [];
  const consoleLogs = [];
  cdp.on((msg) => {
    if (msg.method === 'Network.loadingFailed' && msg.params) failedRequests.push({ id: msg.params.requestId, error: msg.params.errorText, type: msg.params.type });
    if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
      consoleErrors.push(msg.params.args?.map((a) => a.value ?? a.description ?? '').join(' '));
    }
    if (msg.method === 'Runtime.consoleAPICalled') {
      consoleLogs.push(msg.params.type + ': ' + (msg.params.args?.map((a) => a.value ?? a.description ?? '').join(' ') ?? ''));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params?.exceptionDetails?.exception?.description ?? JSON.stringify(msg.params?.exceptionDetails ?? {}));
    }
  });

  await cdp.send('Page.enable');
  await cdp.send('Network.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  if (REDUCED_MOTION) {
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
    });
  }

  const presetNames = PRESET_ARG === 'all' ? Object.keys(PRESETS) : PRESET_ARG.split(',').map((s) => s.trim());
  const report = { url: URL_TO_LOAD, generatedAt: new Date().toISOString(), presets: {} };

  for (const name of presetNames) {
    const p = PRESETS[name];
    if (!p) throw new Error(`Unknown preset ${name}`);
    const dpr = DPR_OVERRIDE || p.dpr;
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: p.width, height: p.height, deviceScaleFactor: 1, mobile: p.mobile,
    });
    if (p.mobile) {
      await cdp.send('Emulation.setUserAgentOverride', { userAgent: ANDROID_UA, platform: 'Android' });
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    } else {
      await cdp.send('Emulation.setUserAgentOverride', { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36', platform: 'Win32' });
      await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: false });
    }

    const loaded = cdp.once('Page.loadEventFired', 30000);
    await cdp.send('Page.navigate', { url: URL_TO_LOAD });
    await loaded;
    // Wait for fonts + eagerly-loaded images. Lazy images below the fold are handled after the
    // scroll pass, so don't block the load event on them.
    await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        await document.fonts.ready;
        const eager = [...document.images].filter(img => img.loading !== 'lazy');
        await Promise.race([
          Promise.all(eager.map(img => img.complete ? null : new Promise(r => { img.addEventListener('load', r, {once:true}); img.addEventListener('error', r, {once:true}); }))),
          new Promise(r => setTimeout(r, 5000)),
        ]);
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        return true;
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });

    // Scroll through the page once to trigger lazy images and any viewport-dependent layout, then
    // wait for the lazy set to decode (bounded), then return to the top.
    await cdp.send('Runtime.evaluate', {
      expression: `(async () => {
        const step = window.innerHeight * 0.75;
        for (let y = 0; y < document.documentElement.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
        window.scrollTo(0, 0);
        await Promise.race([
          Promise.all([...document.images].filter(img => img.loading === 'lazy').map(img => img.complete ? null : new Promise(r => { img.addEventListener('load', r, {once:true}); img.addEventListener('error', r, {once:true}); }))),
          new Promise(r => setTimeout(r, 6000)),
        ]);
        await new Promise(r => setTimeout(r, 200));
        // Evidence captures must not contain empty image frames: force any remaining lazy image to
        // load eagerly and give the set a bounded chance to decode before screenshots.
        for (const img of document.images) { if (img.loading === 'lazy') img.loading = 'eager'; }
        await Promise.race([
          Promise.all([...document.images].filter(img => !img.complete).map(img => new Promise(r => { img.addEventListener('load', r, {once:true}); img.addEventListener('error', r, {once:true}); }))),
          new Promise(r => setTimeout(r, 8000)),
        ]);
        return document.documentElement.scrollHeight;
      })()`,
      awaitPromise: true, returnByValue: true,
    });

    const diag = (await cdp.send('Runtime.evaluate', { expression: DIAGNOSTICS_JS, returnByValue: true })).result.value;

    // viewport shot at high DPR
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: p.width, height: p.height, deviceScaleFactor: dpr, mobile: p.mobile });
    await sleep(150);
    const vp = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    await writeFile(join(OUT, `${p.label}-viewport.png`), Buffer.from(vp.data, 'base64'));

    if (FULL) {
      // full-page shot at DPR 1 (keeps pixel dimensions sane on long mobile pages)
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: p.width, height: p.height, deviceScaleFactor: 1, mobile: p.mobile });
      await sleep(100);
      const metrics = await cdp.send('Page.getLayoutMetrics');
      const content = metrics.cssContentSize ?? metrics.contentSize;
      const full = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: Math.ceil(content.width), height: Math.ceil(content.height), scale: 1 },
      }).catch((e) => ({ error: String(e) }));
      if (full && full.data) await writeFile(join(OUT, `${p.label}-full.png`), Buffer.from(full.data, 'base64'));
      else report.presets[name] = { ...(report.presets[name] ?? {}), fullPageError: full?.error };

      // A half-scale full-page copy: long mobile pages exceed image-viewer limits at 1:1, and this
      // is the review-friendly overview.
      const half = await cdp.send('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: Math.ceil(content.width), height: Math.ceil(content.height), scale: 0.5 },
      }).catch(() => null);
      if (half?.data) await writeFile(join(OUT, `${p.label}-full-half.png`), Buffer.from(half.data, 'base64'));
    }

    if (SECTIONS) {
      // section shots: any element with data-shot attribute, plus section/main children
      const rects = (await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const out = [];
          const els = document.querySelectorAll('[data-shot]');
          for (const el of els) {
            const r = el.getBoundingClientRect();
            out.push({ name: el.getAttribute('data-shot'), x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height });
          }
          return out;
        })()`, returnByValue: true,
      })).result.value;
      await cdp.send('Emulation.setDeviceMetricsOverride', { width: p.width, height: p.height, deviceScaleFactor: Math.min(dpr, 2), mobile: p.mobile });
      const sectionMetrics = await cdp.send('Page.getLayoutMetrics');
      const sectionContent = sectionMetrics.cssContentSize ?? sectionMetrics.contentSize;
      for (const r of rects) {
        const x = Math.max(0, Math.round(r.x));
        const y = Math.max(0, Math.round(r.y));
        const width = Math.min(Math.ceil(r.w), Math.ceil(sectionContent.width - x));
        const height = Math.min(Math.ceil(r.h), Math.ceil(sectionContent.height - y));
        if (width < 10 || height < 10) continue;
        const shot = await cdp.send('Page.captureScreenshot', {
          format: 'png', captureBeyondViewport: true,
          clip: { x, y, width, height, scale: 1 },
        }).catch((e) => ({ error: String(e) }));
        if (shot?.data) await writeFile(join(OUT, `${p.label}-section-${r.name}.png`), Buffer.from(shot.data, 'base64'));
      }
    }

    report.presets[name] = { ...(report.presets[name] ?? {}), ...diag, failedRequests: failedRequests.splice(0), consoleErrors: consoleErrors.splice(0) };
  }

  report.consoleLogSample = consoleLogs.slice(0, 30);
  await writeFile(join(OUT, 'report.json'), JSON.stringify(report, null, 2));

  cdp.ws.close();
  child.kill();
  await sleep(300);
  await rm(userDataDir, { recursive: true, force: true }).catch(() => {});

  // concise console summary
  for (const [name, r] of Object.entries(report.presets)) {
    console.log(`\n== ${name} ${r.viewport.w}x${r.viewport.h} dpr=${r.viewport.dpr}`);
    console.log(`   doc ${r.docWidth.documentElement}px, content height ${r.contentHeight}px, overflow=${r.horizontalOverflow}`);
    if (r.overflowElements?.length) console.log('   overflowing:', JSON.stringify(r.overflowElements.slice(0, 5)));
    if (r.blankImages?.length) console.log('   BLANK IMAGES:', JSON.stringify(r.blankImages));
    if (r.consoleErrors?.length) console.log('   consoleErrors:', r.consoleErrors.slice(0, 5));
    if (r.failedRequests?.length) console.log('   failedRequests:', JSON.stringify(r.failedRequests.slice(0, 5)));
  }
  console.log(`\nSaved to ${OUT}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
