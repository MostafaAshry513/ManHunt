// Rasterise HTML with headless Chrome. Async + watchdog: headless Chrome can
// hang on very small windows or a locked profile, so every render is polled,
// killed as a process tree once its screenshot lands, and retried once.
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const CANDIDATES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  path.join(os.homedir(), 'AppData/Local/Google/Chrome/Application/chrome.exe'),
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

export const BROWSER = CANDIDATES.find((p) => fs.existsSync(p));
if (!BROWSER) throw new Error('No Chrome/Edge executable found');

const PROFILE_ROOT = path.join(os.tmpdir(), 'manhunt-identity-chrome');
let renderCount = 0;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fileUrl = (p) => 'file:///' + path.resolve(p).replace(/\\/g, '/').replace(/^\//, '');

function killTree(pid) {
  try {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } catch {
    /* already gone */
  }
}

function isCompletePng(file) {
  try {
    const fd = fs.openSync(file, 'r');
    const head = Buffer.alloc(8);
    fs.readSync(fd, head, 0, 8, 0);
    const size = fs.fstatSync(fd).size;
    fs.closeSync(fd);
    if (head[0] !== 0x89 || head[1] !== 0x50 || head[2] !== 0x4e || head[3] !== 0x47) return false;
    // PNG ends with the IEND chunk: 00 00 00 00 49 45 4e 44 ae 42 60 82
    const fd2 = fs.openSync(file, 'r');
    const tail = Buffer.alloc(12);
    fs.readSync(fd2, tail, 0, 12, size - 12);
    fs.closeSync(fd2);
    return tail.toString('hex') === '0000000049454e44ae426082';
  } catch {
    return false;
  }
}

/**
 * @param {string} htmlPath absolute path to an .html file
 * @param {string} pngPath  absolute path for the .png output
 * @param {{width:number,height:number,scale?:number,transparent?:boolean}} opts
 */
export async function renderHtml(htmlPath, pngPath, opts) {
  const { width, height, scale = 1, transparent = true } = opts;
  fs.mkdirSync(path.dirname(pngPath), { recursive: true });

  let lastErr = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const profile = path.join(PROFILE_ROOT, `p-${process.pid}-${renderCount++}-${Math.random().toString(36).slice(2, 7)}`);
    if (fs.existsSync(pngPath)) fs.rmSync(pngPath);
    const args = [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-extensions',
      '--disable-sync',
      '--mute-audio',
      '--disable-crash-reporter',
      '--disable-features=Translate,OptimizationHints',
      `--user-data-dir=${profile}`,
      `--force-device-scale-factor=${scale}`,
      `--window-size=${width},${height}`,
      '--virtual-time-budget=1200',
      '--run-all-compositor-stages-before-draw',
      transparent ? '--default-background-color=00000000' : '--default-background-color=ff0b1220',
      `--screenshot=${pngPath}`,
      fileUrl(htmlPath),
    ];
    const child = spawn(BROWSER, args, { stdio: 'ignore', windowsHide: true });
    const deadline = Date.now() + 25000;
    let ok = false;
    while (Date.now() < deadline) {
      await sleep(80);
      if (isCompletePng(pngPath)) {
        ok = true;
        break;
      }
      if (child.exitCode !== null && child.exitCode !== 0 && !fs.existsSync(pngPath)) break;
    }
    killTree(child.pid);
    try {
      fs.rmSync(profile, { recursive: true, force: true });
    } catch {
      /* windows may hold it briefly */
    }
    if (ok) return pngPath;
    lastErr = new Error(`Chrome did not produce ${pngPath} (attempt ${attempt + 1}, exit ${child.exitCode}) for ${htmlPath}`);
  }
  throw lastErr;
}

// CLI (sync wrapper)
if (process.argv[1]?.endsWith('render.mjs')) {
  const [html, png, w, h, s, opaque] = process.argv.slice(2);
  if (!html || !png) {
    console.error('usage: node render.mjs <html> <png> <width> <height> [scale] [opaque]');
    process.exit(1);
  }
  await renderHtml(path.resolve(html), path.resolve(png), {
    width: Number(w || 800),
    height: Number(h || 600),
    scale: Number(s || 1),
    transparent: opaque !== 'opaque',
  });
  console.log('wrote', png);
}
