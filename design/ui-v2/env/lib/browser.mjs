// Playwright session wrapper for exact-pixel page capture.
//
// Canvas contract: logical 390 x 844 dp, captured at deviceScaleFactor 3 =>
// exactly 1170 x 2532 px, full-bleed, no browser chrome, no scrollbars.
// Pages are served over HTTP from the repository root so the brand fonts and
// marks under /design/... load with normal same-origin rules.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { createStaticServer, REPO, ENV_ROOT, WORKSTREAM, DESIGN_ROOT, toUrlPath } from './server.mjs';

// Keep the browser inside the env folder so the toolchain is self-contained.
process.env.PLAYWRIGHT_BROWSERS_PATH ||= path.join(ENV_ROOT, '.browsers');

const PLAYWRIGHT_ENTRY = path.join(ENV_ROOT, 'node_modules', 'playwright', 'index.mjs');
if (!(await stat(PLAYWRIGHT_ENTRY).catch(() => null))) {
  throw new Error(`Playwright is not installed in ${ENV_ROOT}/node_modules.\nRun: cd ${ENV_ROOT} && npm install`);
}
const { chromium } = await import(pathToFileURL(PLAYWRIGHT_ENTRY).href);

/** The one true page canvas. Do not change without updating the brief + README. */
export const CANVAS = Object.freeze({ width: 390, height: 844, scale: 3, pxWidth: 1170, pxHeight: 2532 });

/** Read the pixel dimensions straight out of the PNG IHDR chunk. */
export async function pngSize(file) {
  const buf = await readFile(file);
  if (buf.length < 24 || buf.toString('ascii', 1, 4) !== 'PNG') throw new Error(`not a PNG: ${file}`);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** Human label relative to the repo, e.g. `design/ui-v2/env/samples/sample.html`. */
export function repoLabel(file) {
  return path.relative(REPO, path.resolve(file)).split(path.sep).join('/');
}

/** Accepts absolute paths, repo-relative paths or paths relative to cwd. */
export function resolveTarget(target) {
  if (path.isAbsolute(target)) return path.resolve(target);
  const fromRepo = path.resolve(REPO, target);
  if (path.isAbsolute(target) || target.includes('/') || target.includes(path.sep)) return fromRepo;
  return path.resolve(process.cwd(), target);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class EnvSession {
  /**
   * @param {{root?: string, viewport?: {width:number,height:number}, deviceScaleFactor?: number,
   *          colorScheme?: 'dark'|'light'|'no-preference', locale?: string}} opts
   */
  constructor({ root = REPO, viewport = { width: CANVAS.width, height: CANVAS.height }, deviceScaleFactor = CANVAS.scale, colorScheme = 'dark', locale = 'en' } = {}) {
    this.root = path.resolve(root);
    this.viewport = { ...viewport };
    this.deviceScaleFactor = deviceScaleFactor;
    this.colorScheme = colorScheme;
    this.locale = locale;
    this.page = null;
  }

  async start() {
    this.server = await createStaticServer({ root: this.root });
    this.baseUrl = `http://127.0.0.1:${this.server.port}`;
    this.browser = await chromium.launch({
      args: ['--hide-scrollbars', '--force-color-profile=srgb', '--disable-lcd-text', '--font-render-hinting=none'],
    });
    this.context = await this.browser.newContext({
      viewport: { ...this.viewport },
      deviceScaleFactor: this.deviceScaleFactor,
      colorScheme: this.colorScheme,
      locale: this.locale,
      timezoneId: 'UTC',
      reducedMotion: 'no-preference',
      hasTouch: true,
    });
    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(45000);
    this.page.on('pageerror', (err) => console.error(`  [page error] ${err.message}`));
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') console.error(`  [console error] ${msg.text()}`);
    });
    return this;
  }

  /** Wait for document readiness: fonts, images, and two animation frames. */
  async settle({ settleMs = 120 } = {}) {
    const page = this.page;
    try {
      await page.evaluate(async () => {
        const settleFrame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        await document.fonts.ready;
        await Promise.all([...document.fonts].map((f) => (f.status === 'loaded' ? 0 : f.load().catch(() => {}))));
        const imgs = [...document.images];
        await Promise.all(
          imgs.map((img) =>
            img.complete && img.naturalWidth
              ? 0
              : new Promise((res) => {
                  img.addEventListener('load', res, { once: true });
                  img.addEventListener('error', res, { once: true });
                  setTimeout(res, 5000);
                }),
          ),
        );
        await Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : 0)));
        await settleFrame();
      });
    } catch (err) {
      // A page with no fonts/images still must capture; report and continue.
      console.warn(`  [settle] ${err.message.split('\n')[0]}`);
    }
    await sleep(settleMs);
  }

  /** Diagnostics: page size vs canvas, overflow, font faces, broken images. */
  async diagnose() {
    return this.page.evaluate(() => {
      const rootEl = document.documentElement;
      const fonts = [...document.fonts].map((f) => ({ family: f.family.replace(/["']/g, ''), weight: f.weight, status: f.status }));
      const badFonts = fonts.filter((f) => f.status === 'error');
      const brokenImages = [...document.images].filter((img) => img.complete && img.naturalWidth === 0 && img.src).map((img) => img.src);
      return {
        scrollWidth: rootEl.scrollWidth,
        scrollHeight: rootEl.scrollHeight,
        clientWidth: rootEl.clientWidth,
        clientHeight: rootEl.clientHeight,
        fonts,
        badFonts,
        brokenImages,
        title: document.title,
      };
    });
  }

  /**
   * Navigate to a repo file and capture it.
   * @param {{file: string, out: string, viewport?: {width:number,height:number},
   *          deviceScaleFactor?: number, fullPage?: boolean, exact?: boolean,
   *          colorScheme?: 'dark'|'light'|'no-preference', settleMs?: number, quiet?: boolean}} opts
   */
  async render({ file, out, viewport, deviceScaleFactor, fullPage = false, exact = !fullPage, colorScheme, settleMs = 120, quiet = false }) {
    const abs = path.resolve(file);
    const urlPath = toUrlPath(abs, this.root);
    if (colorScheme && colorScheme !== this.colorScheme) {
      this.colorScheme = colorScheme;
      await this.context.close().catch(() => {});
      this.context = await this.browser.newContext({
        viewport: { ...this.viewport },
        deviceScaleFactor: this.deviceScaleFactor,
        colorScheme: this.colorScheme,
        locale: this.locale,
        timezoneId: 'UTC',
        reducedMotion: 'no-preference',
        hasTouch: true,
      });
      this.page = await this.context.newPage();
      this.page.setDefaultTimeout(45000);
      this.page.on('pageerror', (err) => console.error(`  [page error] ${err.message}`));
      this.page.on('console', (msg) => {
        if (msg.type() === 'error') console.error(`  [console error] ${msg.text()}`);
      });
    }
    if (viewport) {
      this.viewport = { ...viewport };
      await this.page.setViewportSize(viewport);
    }
    const dsf = deviceScaleFactor || this.deviceScaleFactor;
    const t0 = Date.now();
    await this.page.goto(this.baseUrl + urlPath, { waitUntil: 'load', timeout: 45000 });
    await this.settle({ settleMs });
    const diag = await this.diagnose();
    const warnings = [];
    if (!fullPage) {
      if (diag.scrollWidth > this.viewport.width + 1 || diag.scrollHeight > this.viewport.height + 1) {
        warnings.push(
          `content overflows the canvas: scroll ${diag.scrollWidth}x${diag.scrollHeight} > ${this.viewport.width}x${this.viewport.height} (clipped at the page edge; use overflow rules or a scroll region)`,
        );
      }
    }
    if (diag.badFonts.length) warnings.push(`font faces failed to load: ${diag.badFonts.map((f) => f.family + ' ' + f.weight).join(', ')}`);
    if (diag.brokenImages.length) warnings.push(`images failed: ${diag.brokenImages.join(', ')}`);

    await mkdir(path.dirname(out), { recursive: true });
    await this.page.screenshot({ path: out, fullPage, animations: 'disabled', caret: 'hide', scale: 'device' });
    const dims = await pngSize(out);
    const expectedW = Math.round(this.viewport.width * dsf);
    if (exact) {
      const expectedH = Math.round(this.viewport.height * dsf);
      if (dims.width !== expectedW || dims.height !== expectedH) {
        throw new Error(`screenshot ${dims.width}x${dims.height} != expected ${expectedW}x${expectedH} for ${repoLabel(abs)}`);
      }
    } else if (dims.width !== expectedW) {
      throw new Error(`screenshot width ${dims.width} != expected ${expectedW} for ${repoLabel(abs)}`);
    }
    const ms = Date.now() - t0;
    if (!quiet) {
      console.log(`[render] ${repoLabel(abs)} -> ${path.relative(REPO, out).split(path.sep).join('/')}  ${dims.width}x${dims.height}  ${(await stat(out)).size / 1024 | 0} KiB  ${ms} ms`);
      for (const w of warnings) console.warn(`  [warn] ${w}`);
    }
    return { file: out, ...dims, warnings, fonts: diag.fonts, ms };
  }

  /**
   * Render a whole document (contact sheet, matrix) at its natural size.
   * The viewport is resized to the document's own width (`selector` wrapper
   * should be width:max-content) and the capture is full-page, so the PNG width
   * is deterministic and the height follows the content. deviceScaleFactor is
   * the session's (create sheet sessions at 2x).
   */
  async renderDocument({ file, out, selector = '.sheet', maxWidth = 4000, settleMs = 150, quiet = false }) {
    const abs = path.resolve(file);
    const urlPath = toUrlPath(abs, this.root);
    const t0 = Date.now();
    const measure = (sel) =>
      this.page.evaluate((s) => {
        const el = document.querySelector(s);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { w: Math.ceil(r.width), h: Math.ceil(r.height) };
      }, sel);
    // 1) load wide so max-content wrappers report their natural width
    await this.page.setViewportSize({ width: Math.min(maxWidth, 2000), height: 1000 });
    await this.page.goto(this.baseUrl + urlPath, { waitUntil: 'load', timeout: 45000 });
    await this.settle({ settleMs });
    const initial = await measure(selector);
    const contentWidth = Math.max(1, initial ? initial.w : (await this.diagnose()).scrollWidth);
    if (contentWidth > maxWidth) throw new Error(`document too wide for a sheet: ${contentWidth}px > ${maxWidth}px (${repoLabel(abs)})`);
    // 2) match the viewport to the document, reflow, then measure the true height
    await this.page.setViewportSize({ width: contentWidth, height: 1000 });
    await this.settle({ settleMs });
    const reflowed = await measure(selector);
    const contentHeight = Math.max(1, reflowed ? reflowed.h : (await this.diagnose()).scrollHeight);
    // 3) exactly the content height: no dead column, no empty footer band
    await this.page.setViewportSize({ width: contentWidth, height: contentHeight });
    await sleep(60);
    await mkdir(path.dirname(out), { recursive: true });
    await this.page.screenshot({ path: out, fullPage: true, animations: 'disabled', caret: 'hide', scale: 'device' });
    const dims = await pngSize(out);
    const expectedW = Math.round(contentWidth * this.deviceScaleFactor);
    if (dims.width !== expectedW) throw new Error(`sheet width ${dims.width} != expected ${expectedW} for ${repoLabel(abs)}`);
    if (!quiet) {
      console.log(`[sheet] ${repoLabel(abs)} -> ${repoLabel(out)}  ${dims.width}x${dims.height}  ${((await stat(out)).size / 1024) | 0} KiB  ${Date.now() - t0} ms`);
      for (const w of (await this.diagnose()).badFonts.length ? ['font faces failed to load'] : []) console.warn(`  [warn] ${w}`);
    }
    return { file: out, ...dims, ms: Date.now() - t0 };
  }

  async close() {
    try {
      if (this.browser) await this.browser.close();
    } catch {
      /* noop */
    }
    try {
      if (this.server) await this.server.close();
    } catch {
      /* noop */
    }
  }
}

/** Convenience: render one page with a throwaway session. */
export async function renderOne(opts) {
  const session = await new EnvSession({ colorScheme: opts.colorScheme || 'dark' }).start();
  try {
    return await session.render(opts);
  } finally {
    await session.close();
  }
}

export { REPO, ENV_ROOT, WORKSTREAM, DESIGN_ROOT, toUrlPath };
