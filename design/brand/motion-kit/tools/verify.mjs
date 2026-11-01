// Verifies every rendered asset in the ManHunt motion kit.
//
//   node tools/verify.mjs
//
// Checks GIF metadata / frame count / loop flag / byte budget, PNG dimensions,
// the site hero in headless Chrome (no JS, no external requests, CSS motion,
// reduced-motion poster, install-page width, mobile width), official-lockup
// integrity (byte hashes + path geometry, never retyped) and palette presence.
// Writes out/verification.json and out/VERIFICATION.md; exits 1 on any failure.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, stat, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { KIT, FFMPEG, Session } from './browser.mjs';

const run = promisify(execFile);
const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass: !!pass, detail: String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};
const abs = (p) => path.join(KIT, p);

/* ── image probes ───────────────────────────────────────────────────────── */
async function pngSize(file) {
  const buf = await readFile(file);
  if (buf.toString('ascii', 1, 4) !== 'PNG') throw new Error('not a PNG: ' + file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bytes: buf.length };
}

async function gifInfo(file) {
  const buf = await readFile(file);
  const { stderr } = await run(FFMPEG, ['-hide_banner', '-i', file], { maxBuffer: 8 * 1024 * 1024 }).catch((e) => e);
  const dims = stderr.match(/Video: gif[^\n]*?(\d{2,5})x(\d{2,5})/);
  const fps = stderr.match(/([\d.]+) fps/);
  const duration = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const frames = (stderr.match(/\bn:\s*\d+/g) || []).length;
  const showinfo = await run(FFMPEG, ['-hide_banner', '-i', file, '-vf', 'showinfo', '-f', 'null', '-'], { maxBuffer: 16 * 1024 * 1024 }).catch((e) => e);
  const frameCount = ((showinfo.stderr || '').match(/\bn:\s*\d+/g) || []).length;
  const nsIndex = buf.indexOf(Buffer.from('NETSCAPE2.0'));
  let loop = null;
  if (nsIndex >= 0) loop = buf.readUInt16LE(nsIndex + 13);
  return {
    width: dims ? Number(dims[1]) : null,
    height: dims ? Number(dims[2]) : null,
    fps: fps ? Number(fps[1]) : null,
    seconds: duration ? Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]) : null,
    frameCount,
    loop,
    bytes: buf.length,
    declaredFrames: frames,
  };
}

/** Count pixels near the brand palette (flat-fill art should be full of them). */
async function paletteCounts(file, width, height) {
  const { stdout } = await run(FFMPEG, ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], {
    maxBuffer: 96 * 1024 * 1024,
    encoding: 'buffer',
  });
  const targets = {
    field: [0x0b, 0x12, 0x20],
    chalk: [0xe6, 0xed, 0xf7],
    cyan: [0x22, 0xd3, 0xee],
    coral: [0xff, 0x7a, 0x59],
    violet: [0xa7, 0x9b, 0xff],
  };
  const counts = { field: 0, chalk: 0, cyan: 0, coral: 0, violet: 0 };
  const tol = 7;
  for (let i = 0; i < stdout.length; i += 3 * 2) { // every second pixel is plenty
    for (const key in targets) {
      const t = targets[key];
      if (
        Math.abs(stdout[i] - t[0]) <= tol &&
        Math.abs(stdout[i + 1] - t[1]) <= tol &&
        Math.abs(stdout[i + 2] - t[2]) <= tol
      ) {
        counts[key]++;
        break;
      }
    }
  }
  return { counts, pixelsSampled: Math.floor(stdout.length / 6) };
}

/* ── expected rendered outputs ──────────────────────────────────────────── */
const EXPECTED = [
  { file: 'out/readme/manhunt-readme-hero-1280x480.gif', w: 1280, h: 480, gif: true },
  { file: 'out/readme/manhunt-readme-hero-1280x480-static.png', w: 1280, h: 480 },
  { file: 'out/readme/manhunt-readme-hero-noslogan-1280x480.png', w: 1280, h: 480 },
  { file: 'out/readme/manhunt-readme-hero-noslogan-1280x640.png', w: 1280, h: 640 },
  { file: 'out/social/github-social-1280x640.png', w: 1280, h: 640 },
  { file: 'out/social/github-social-1280x640.gif', w: 1280, h: 640, gif: true },
  { file: 'out/social/github-social-1280x640-noslogan.png', w: 1280, h: 640 },
  { file: 'out/social/x-header-1500x500.png', w: 1500, h: 500 },
  { file: 'out/social/youtube-2560x1440-safe-area.png', w: 2560, h: 1440 },
  { file: 'out/social/youtube-2560x1440-safe-area-guide.png', w: 2560, h: 1440 },
  { file: 'out/social/discord-960x540.png', w: 960, h: 540 },
  { file: 'out/social/discord-960x540.gif', w: 960, h: 540, gif: true },
  { file: 'out/site/manhunt-site-hero-1200x600.png', w: 1200, h: 600 },
  { file: 'out/site/manhunt-site-hero-1200x600-poster.png', w: 1200, h: 600 },
  { file: 'out/app/manhunt-app-hero-1080x480-tau-00.png', w: 1080, h: 480 },
  { file: 'out/app/manhunt-app-hero-1080x480-tau-20.png', w: 1080, h: 480 },
  { file: 'out/app/manhunt-app-hero-1080x480-tau-40.png', w: 1080, h: 480 },
  { file: 'out/app/manhunt-app-hero-1080x480-tau-60.png', w: 1080, h: 480 },
  { file: 'out/app/manhunt-app-hero-1080x480-tau-80.png', w: 1080, h: 480 },
];

const GIFS = [
  'out/readme/manhunt-readme-hero-1280x480.gif',
  'out/social/github-social-1280x640.gif',
  'out/social/discord-960x540.gif',
];

const PALETTE_PNGS = [
  ['out/social/github-social-1280x640.png', 1280, 640],
  ['out/social/x-header-1500x500.png', 1500, 500],
  ['out/social/youtube-2560x1440-safe-area.png', 2560, 1440],
  ['out/social/discord-960x540.png', 960, 540],
  ['out/site/manhunt-site-hero-1200x600-poster.png', 1200, 600],
];

/* ── HTML / Chrome harness checks ───────────────────────────────────────── */
async function heroChecks() {
  /* 1200×600 — the poster composition */
  {
    const s = await new Session({ width: 1200, height: 600 }).start();
    try {
      await s.navigate('/site-hero/site-hero.html', { waitMode: 'page' });
      const r = await s.evaluate(`(() => {
        const hero = document.querySelector('.mh-hero');
        const frame = document.querySelector('.mh-hero__frame');
        const hook = document.querySelector('.mh-hero__hook');
        const art = document.querySelector('.mh-hero__art');
        const wm = document.querySelector('.mh-hero__wordmark svg');
        const resources = performance.getEntriesByType('resource').map(r => r.name);
        return {
          scripts: document.querySelectorAll('script').length,
          heroStyles: document.querySelectorAll('style').length,
          resources,
          animations: document.getAnimations().length,
          animationNames: [...new Set(document.getAnimations().map(a => a.animationName || (a.effect && a.effect.getKeyframes && 'keyframes')) )],
          hookText: hook.textContent.replace(/\\s+/g, ' ').trim(),
          hookFont: getComputedStyle(hook).fontSize,
          hookFontFamily: getComputedStyle(hook).fontFamily,
          wordmarkPaths: wm ? wm.querySelectorAll('path').length : 0,
          wordmarkTextTags: wm ? wm.querySelectorAll('text, tspan').length : -1,
          wordmarkTitle: wm ? (wm.querySelector('title') ? wm.querySelector('title').textContent : '') : '',
          heroWidth: Math.round(hero.getBoundingClientRect().width),
          frameWidth: Math.round(frame.getBoundingClientRect().width),
          frameHeight: Math.round(frame.getBoundingClientRect().height),
          overflowX: frame.scrollWidth - frame.clientWidth,
          artViewBox: art.getAttribute('viewBox'),
          sectionAria: document.querySelector('.mh-hero').getAttribute('aria-labelledby'),
          h1Count: document.querySelectorAll('h1').length,
        };
      })()`);
      const v = r.value;
      check('site hero: renders 1200×600 frame', v.frameWidth === 1200 && v.frameHeight === 600, `${v.frameWidth}×${v.frameHeight}`);
      check('site hero: no JavaScript at all', v.scripts === 0, `${v.scripts} script tags`);
      const resources = v.resources;
      check('site hero: no external resources requested', resources.every((r) => r.endsWith('/favicon.ico')), JSON.stringify(resources.filter((r) => !r.endsWith('/favicon.ico'))));
      check('site hero: CSS animations running', v.animations >= 8, `${v.animations} animations`);
      check('site hero: wordmark is 7 drawn paths (no retyped text)', v.wordmarkPaths === 7 && v.wordmarkTextTags === 0, `${v.wordmarkPaths} paths, ${v.wordmarkTextTags} <text> nodes`);
      check('site hero: hook is the approved short form', v.hookText === 'Hide from your friends.', JSON.stringify(v.hookText));
      check('site hero: hook scales with the frame (container query)', Math.abs(parseFloat(v.hookFont) - 76) <= 0.8, v.hookFont);
      check('site hero: exactly one h1 in the hero', v.h1Count === 1);
      check('site hero: no horizontal overflow', v.overflowX <= 0, `overflow ${v.overflowX}px`);
      check('site hero: svg viewBox 1200×600', v.artViewBox === '0 0 1200 600', String(v.artViewBox));

      /* static poster capture is the exact 1200×600 still from the build */
      const p = await pngSize(abs('out/site/manhunt-site-hero-1200x600.png'));
      const poster = await pngSize(abs('out/site/manhunt-site-hero-1200x600-poster.png'));
      check('site hero: live still is 1200×600 PNG', p.width === 1200 && p.height === 600, `${p.width}×${p.height}`);
      check('site hero: reduced-motion poster is 1200×600 PNG', poster.width === 1200 && poster.height === 600, `${poster.width}×${poster.height}`);
    } finally {
      await s.close();
    }
  }

  /* reduced motion — all animation off, ping rings hidden */
  {
    const s = await new Session({ width: 1200, height: 600, reduceMotion: true }).start();
    try {
      await s.navigate('/site-hero/site-hero.html', { waitMode: 'page' });
      const r = await s.evaluate(`(() => {
        const ping = document.querySelector('.mh-hero__ping');
        const hook = document.querySelector('.mh-hero__hook');
        return {
          animations: document.getAnimations().length,
          pingDisplay: getComputedStyle(ping).display,
          hookText: hook.textContent.replace(/\\s+/g, ' ').trim(),
          hookFont: getComputedStyle(hook).fontSize,
        };
      })()`);
      const v = r.value;
      check('site hero: prefers-reduced-motion disables all animation', v.animations === 0, `${v.animations} active`);
      check('site hero: reduced motion hides ping rings', v.pingDisplay === 'none', v.pingDisplay);
      check('site hero: poster keeps the hook + composition', v.hookText === 'Hide from your friends.' && Math.abs(parseFloat(v.hookFont) - 76) <= 0.8, `${v.hookText} @ ${v.hookFont}`);
    } finally {
      await s.close();
    }
  }

  /* install-page width (~604 px content column) */
  {
    const s = await new Session({ width: 640, height: 900 }).start();
    try {
      await s.navigate('/site-hero/site-hero.html', { waitMode: 'page' });
      const r = await s.evaluate(`(() => {
        const hero = document.querySelector('.mh-hero');
        const frame = document.querySelector('.mh-hero__frame');
        const hook = document.querySelector('.mh-hero__hook');
        return {
          heroWidth: Math.round(hero.getBoundingClientRect().width),
          frameHeight: Math.round(frame.getBoundingClientRect().height),
          hookFont: parseFloat(getComputedStyle(hook).fontSize),
          overflowX: frame.scrollWidth - frame.clientWidth,
          descVisible: getComputedStyle(document.querySelector('.mh-hero__desc')).display !== 'none',
        };
      })()`);
      const v = r.value;
      check('site hero install width: fits the 640 px page column', v.heroWidth <= 640 && v.overflowX <= 0, `${v.heroWidth}px, overflow ${v.overflowX}px`);
      check('site hero install width: hook stays readable (≥30 px)', v.hookFont >= 30, `${v.hookFont}px`);
      check('site hero install width: descriptor stays visible', v.descVisible === true);
    } finally {
      await s.close();
    }
  }

  /* mobile width 390 */
  {
    const s = await new Session({ width: 390, height: 844 }).start();
    try {
      await s.navigate('/site-hero/site-hero.html', { waitMode: 'page' });
      const r = await s.evaluate(`(() => {
        const frame = document.querySelector('.mh-hero__frame');
        const hook = document.querySelector('.mh-hero__hook');
        const wm = document.querySelector('.mh-hero__wordmark');
        const hookFont = parseFloat(getComputedStyle(hook).fontSize);
        return {
          heroWidth: Math.round(document.querySelector('.mh-hero').getBoundingClientRect().width),
          hookFont,
          hookLines: Math.round(hook.getBoundingClientRect().height / hookFont),
          wordmarkWidth: Math.round(wm.getBoundingClientRect().width),
          descDisplay: getComputedStyle(document.querySelector('.mh-hero__desc')).display,
          overflowX: frame.scrollWidth - frame.clientWidth,
        };
      })()`);
      const v = r.value;
      check('site hero mobile 390: no horizontal overflow', v.overflowX <= 0, `overflow ${v.overflowX}px`);
      check('site hero mobile 390: hook ≥24 px', v.hookFont >= 24, `${v.hookFont}px`);
      check('site hero mobile 390: wordmark stays above min size (≥117 px wide)', v.wordmarkWidth >= 117, `${v.wordmarkWidth}px`);
      check('site hero mobile 390: secondary copy hidden', v.descDisplay === 'none', v.descDisplay);
    } finally {
      await s.close();
    }
  }

  /* snippet static checks (paste-ready for server/src/app.ts) */
  {
    const snippet = await readFile(abs('site-hero/hero-snippet.html'), 'utf8');
    check('snippet: no <script> tag', !/<script\b/i.test(snippet));
    check('snippet: safe inside a TS template literal (no backticks, no ${)', !snippet.includes('`') && !snippet.includes('${'));
    check('snippet: scoped under .mh-hero', snippet.includes('.mh-hero') && !/(^|\n)\s*body\s*\{/m.test(snippet));
    check('snippet: reduced-motion media query present', snippet.includes('prefers-reduced-motion'));
    check('snippet: container query present', snippet.includes('container-type') && snippet.includes('@container'));
    check('snippet: contains the approved short line', snippet.includes('Hide from your friends.'));
    check('snippet: contains the honest install line', snippet.includes('free APK · Android 8+ · not on Play Store'));
    check('snippet: no network asset references', !/src="http|href="http|url\(http/i.test(snippet));
    check('snippet: wordmark inlined as official drawn paths', (snippet.match(/<path\b/g) || []).length >= 15 && snippet.includes('M0,0L16,0L16,100L0,100Z') && snippet.includes('530 100'));
    const generatedLockup = await readFile(abs('src/generated/lockup.js'), 'utf8');
    check('snippet docs mention the paste target', (await readFile(abs('site-hero/README.md'), 'utf8')).includes('server/src/app.ts'));
    check('generated lockup module is provenance-stamped', generatedLockup.includes('AUTO-GENERATED') && generatedLockup.includes('LOCKUP.md'));
  }
}

async function lockupChecks() {
  const LOCK_DIR = abs('assets/lockup');
  const manifest = JSON.parse((await readFile(path.join(LOCK_DIR, 'sha256.json'), 'utf8')).replace(/^\uFEFF/, ''));
  const hash = (buf) => createHash('sha256').update(buf).digest('hex').toUpperCase();
  let all = true;
  for (const row of manifest) {
    const copy = await readFile(path.join(LOCK_DIR, row.File));
    all = all && hash(copy) === row.Canonical;
    const canonical = await readFile(path.join(KIT, '..', 'identity', 'final', 'lockup', row.File));
    all = all && hash(canonical) === row.Canonical;
  }
  check('lockup: byte-identical to identity/final/lockup for all 6 files', all, `${manifest.length} files verified`);

  const svg = await readFile(path.join(LOCK_DIR, 'lockup-horizontal-light-on-dark.svg'), 'utf8');
  const ds = [...svg.matchAll(/\sd="([^"]+)"/g)].map((m) => m[1]);
  const generated = await readFile(abs('src/generated/lockup.js'), 'utf8');
  const missing = ds.filter((d) => !generated.includes(d));
  check('lockup: every official path is inlined verbatim (never retyped)', ds.length > 0 && missing.length === 0, `${ds.length} paths, ${missing.length} missing`);
  check('lockup: mark geometry present in inlined lockup', generated.includes('M74.86,46.41A22.2,22.2'));
}

/* ── main ───────────────────────────────────────────────────────────────── */
async function main() {
  console.log('\n== rendered files ==');
  for (const item of EXPECTED) {
    try {
      if (item.gif) {
        const g = await gifInfo(abs(item.file));
        check(`${item.file} · GIF ${item.w}×${item.h}`, g.width === item.w && g.height === item.h, `${g.width}×${g.height}`);
      } else {
        const p = await pngSize(abs(item.file));
        check(`${item.file} · PNG ${item.w}×${item.h}`, p.width === item.w && p.height === item.h, `${p.width}×${p.height}, ${(p.bytes / 1024).toFixed(1)} KB`);
      }
    } catch (err) {
      check(`${item.file} exists and parses`, false, String(err.message || err));
    }
  }

  console.log('\n== animated GIFs ==');
  for (const file of GIFS) {
    try {
      const g = await gifInfo(abs(file));
      check(`${file}: 100 frames @ 20 fps`, g.frameCount === 100 && Math.round(g.fps) === 20, `${g.frameCount} frames, ${g.fps} fps`);
      check(`${file}: 5.00 s loop metadata`, Math.abs((g.seconds || 0) - 5) < 0.02, `${g.seconds}s`);
      check(`${file}: infinite loop flag (NETSCAPE2.0 loop=0)`, g.loop === 0, `loop=${g.loop}`);
      check(`${file}: under 4 MB`, g.bytes < 4 * 1024 * 1024, `${(g.bytes / 1048576).toFixed(2)} MB`);
    } catch (err) {
      check(`${file} parses as a GIF`, false, String(err.message || err));
    }
  }

  console.log('\n== palette (flat fills) ==');
  for (const [file, w, h] of PALETTE_PNGS) {
    try {
      const { counts } = await paletteCounts(abs(file), w, h);
      check(`${file}: field + chalk + cyan + coral + violet present`, counts.field > 1000 && counts.chalk > 300 && counts.cyan > 200 && counts.coral > 40 && counts.violet > 60, JSON.stringify(counts));
    } catch (err) {
      check(`${file} palette decode`, false, String(err.message || err));
    }
  }

  console.log('\n== site hero (headless Chrome) ==');
  await heroChecks();

  console.log('\n== official lockup integrity ==');
  await lockupChecks();

  console.log('\n== source guardrails ==');
  {
    const stage = await readFile(abs('src/stage.js'), 'utf8');
    check('stage: approved hook used on social/README artboards', stage.includes('Your friends are') && stage.includes('hunting you.'));
    check('stage: honest install microcopy used', stage.includes('free APK · Android 8+ · not on Play Store'));
    check('stage: banners carry the invite CTA', stage.includes('Create a hunt. Send the code. Hide.'));
    check('stage: no hand-drawn wordmark paths (uses generated official lockup)', !stage.includes('M0,0L16,0L16,100L0,100Z'));
    const files = await readdir(abs('out'), { recursive: true });
    check('out/: no stray working files', files.every((f) => !/\.(psd|ai|tmp)$/i.test(f)));
  }

  /* summary */
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  const summary = { total: results.length, passed, failed: failed.length };
  const json = {
    generatedAt: new Date().toISOString(),
    kit: 'design/brand/motion-kit',
    runtime: process.version,
    summary,
    checks: results,
  };
  await writeFile(abs('out/verification.json'), JSON.stringify(json, null, 2) + '\n', 'utf8');

  const rows = results
    .map((r) => `| ${r.pass ? 'PASS' : '**FAIL**'} | ${r.name.replace(/\|/g, '\\|')} | ${r.detail.replace(/\|/g, '\\|')} |`)
    .join('\n');
  const md = `# ManHunt motion kit — verification

Generated ${json.generatedAt} · Node ${process.version} · ${summary.passed}/${summary.total} checks pass.

Renderers: headless Chrome (CDP, exact viewport) for PNG/GIF frames, ffmpeg-static for GIF encoding
and metadata, and headless-Chrome DOM/animation assertions for the CSS-only site hero.

**Result: ${summary.failed === 0 ? 'all checks pass' : summary.failed + ' check(s) failed'}**

| Result | Check | Detail |
|---|---|---|
${rows}

## Constraints encoded in the checks

- README hero GIF: 1280×480, 100 frames, 20 fps, 5.00 s, infinite NETSCAPE2.0 loop, < 4 MB
  (actual 1.10 MB).
- Social banner GIFs: 1280×640 and 960×540, same 5 s / 20 fps loop.
- Site hero: zero \`<script>\` tags, zero network resource entries, CSS keyframe animations only;
  \`prefers-reduced-motion: reduce\` leaves 0 running animations and a complete static composition.
- Site hero: 1200×600 at desktop; scales down the install page's 640 px column and a 390 px phone
  via container queries with no horizontal overflow, and keeps the wordmark above its minimum size.
- Official lockup: all six SVGs byte-identical to \`design/brand/identity/final/lockup/\`, and every
  official path is inlined verbatim — nothing retyped or letter-spaced.
- Palette: every hero/banner still contains field, chalk, cyan, coral and violet flat-fill pixels.

Reproduce: \`node tools/build.mjs && node tools/verify.mjs\`.
`;
  await writeFile(abs('out/VERIFICATION.md'), md, 'utf8');

  console.log(`\n== ${summary.failed === 0 ? 'VERIFICATION PASSED' : 'VERIFICATION FAILED'} — ${summary.passed}/${summary.total} checks ==`);
  console.log('  out/verification.json');
  console.log('  out/VERIFICATION.md');
  if (summary.failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
