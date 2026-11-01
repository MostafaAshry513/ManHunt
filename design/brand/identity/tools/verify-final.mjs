// Verifies the final (task-36) identity package: dimensions, SVG hygiene,
// Android resource mapping and palette discipline.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePng } from './png.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FINAL = path.join(ROOT, 'final');

const results = [];
const check = (name, ok, detail) => results.push({ name, ok, detail });

const png = (rel) => {
  const img = decodePng(fs.readFileSync(path.join(FINAL, rel)));
  return img;
};
const expectPng = (rel, w, h, { opaque = null } = {}) => {
  const img = png(rel);
  let alphaOk = true;
  if (opaque !== null) {
    const { width, height, channels, data } = img;
    if (channels === 4) {
      outer: for (let p = 0; p < width * height; p++) {
        const a = data[p * 4 + 3];
        if (opaque && a !== 255) { alphaOk = false; break outer; }
        if (!opaque && a === 255) { alphaOk = false; break outer; }
      }
    }
  }
  check(rel, img.width === w && img.height === h && alphaOk, `${img.width}x${img.height}${opaque === true ? ' opaque' : opaque === false ? ' alpha' : ''}`);
};

const svgFiles = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? svgFiles(path.join(dir, e.name)) : e.name.endsWith('.svg') ? [path.join(dir, e.name)] : []))
    .filter((f) => !f.includes(`${path.sep}previews${path.sep}`));

const ALLOWED = ['#0B1220', '#131C2E', '#E6EDF7', '#22D3EE', '#FF7A59', '#A79BFF', '#0C6B84', '#B33A0F', '#000000', '#FFFFFF', 'none', 'currentColor'];
for (const f of svgFiles(path.join(FINAL, 'lockup'))) {
  const s = fs.readFileSync(f, 'utf8');
  const rel = path.relative(FINAL, f).replace(/\\/g, '/');
  const colours = [...s.matchAll(/(?:fill|stroke)="([^"]+)"/g)].map((m) => m[1]);
  const bad = colours.filter((c) => !ALLOWED.includes(c));
  check(`${rel} · no text/font/links`, !/<text|font-family|href=|xlink:href|<image|url\(/.test(s), 'vector-only, no text, no external references');
  check(`${rel} · palette only`, bad.length === 0, bad.length ? `unexpected: ${[...new Set(bad)].join(', ')}` : `${colours.length} paint values, all tokens`);
}

// PNG deliverables
expectPng('install/og-image-1200x630.png', 1200, 630, { opaque: true });
expectPng('install/favicon-32.png', 32, 32, { opaque: true });
expectPng('install/favicon-48.png', 48, 48, { opaque: true });
expectPng('install/install-page-icon-192.png', 192, 192, { opaque: true });
expectPng('android/play-512.png', 512, 512, { opaque: true });
for (const [dpi, px] of [['mdpi', 48], ['hdpi', 72], ['xhdpi', 96], ['xxhdpi', 144], ['xxxhdpi', 192]]) {
  expectPng(`android/mipmap-${dpi}/ic_launcher.png`, px, px, { opaque: true });
  expectPng(`android/mipmap-${dpi}/ic_launcher_round.png`, px, px);
}
for (const rel of [
  'lockup/previews/lockup-horizontal-light-on-dark.png',
  'lockup/previews/lockup-stacked-light-on-dark.png',
  'lockup/previews/wordmark-light-on-dark.png',
  'lockup/previews/lockup-sheet.png',
]) {
  check(rel, fs.existsSync(path.join(FINAL, rel)) && fs.statSync(path.join(FINAL, rel)).size > 2000, `${fs.statSync(path.join(FINAL, rel)).size} B`);
}

// Android XML
const vector = fs.readFileSync(path.join(FINAL, 'android', 'ic_launcher_foreground.xml'), 'utf8');
check('android/ic_launcher_foreground.xml', /<vector[\s>]/.test(vector) && /android:viewportWidth="108"/.test(vector) && /android:pathData/.test(vector), '108dp VectorDrawable with path data');
const mono = fs.readFileSync(path.join(FINAL, 'android', 'ic_launcher_monochrome.xml'), 'utf8');
check('android/ic_launcher_monochrome.xml', /<vector[\s>]/.test(mono) && !/#22D3EE|#FF7A59|#A79BFF/.test(mono), 'single-colour monochrome layer (no team colours)');
for (const f of ['mipmap-anydpi-v26/ic_launcher.xml', 'mipmap-anydpi-v26/ic_launcher_round.xml']) {
  const s = fs.readFileSync(path.join(FINAL, 'android', f), 'utf8');
  check(`android/${f}`, /<adaptive-icon/.test(s) && /<background/.test(s) && /<foreground/.test(s) && /<monochrome/.test(s), 'adaptive-icon with background, foreground and monochrome');
}

// install app-icon.svg is the approved mark, opaque field, no text
const appIcon = fs.readFileSync(path.join(FINAL, 'install', 'app-icon.svg'), 'utf8');
check(
  'install/app-icon.svg',
  appIcon.includes('width="108"') && appIcon.includes('#0B1220') && appIcon.includes('#22D3EE') && appIcon.includes('#FF7A59') && !/<text|font-family/.test(appIcon),
  '108 dp composite: field #0B1220 + approved mark, vector only',
);

// lockup geometry relationships
const horiz = fs.readFileSync(path.join(FINAL, 'lockup', 'lockup-horizontal-light-on-dark.svg'), 'utf8');
const vb = horiz.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
check('lockup horizontal viewBox', Math.abs(Number(vb[1]) - 806) < 1.5 && Math.abs(Number(vb[2]) - 220) < 0.6, `${vb[1]} x ${vb[2]} units (cap 100, clear space 50)`);

const failures = results.filter((r) => !r.ok);
fs.writeFileSync(
  path.join(FINAL, 'verification-final.json'),
  JSON.stringify({ generated: new Date().toISOString(), pass: failures.length === 0, checks: results.length, failures, results }, null, 2),
);
console.log(`${failures.length === 0 ? 'PASS' : 'FAIL'} — ${results.length} checks, ${failures.length} failures`);
for (const f of failures) console.log('  FAIL', f.name, '—', f.detail);
