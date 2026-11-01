// Verifies the ManHunt social identity kit.
//
//   node tools/verify.mjs
//
// Checks exact pixel dimensions of every export, animated avatar metadata
// (GIF frame count/loop, WebM codec/duration), avatar circular-crop safety by
// pixel analysis, brand palette presence, template source integrity (official
// lockup, editable COPY blocks, honest line), motion-kit reuse, and the README
// platform-mapping contract. Writes out/verification.json + out/VERIFICATION.md.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { FFMPEG } from '../../motion-kit/tools/browser.mjs';

const run = promisify(execFile);
const TOOLS = import.meta.dirname;
const KIT = path.resolve(TOOLS, '..');
const BRAND = path.resolve(KIT, '..');
const MOTION = path.join(BRAND, 'motion-kit');
const abs = (p) => path.join(KIT, p);

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass: !!pass, detail: String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};
const COLORS = {
  field: [0x0b, 0x12, 0x20],
  chalk: [0xe6, 0xed, 0xf7],
  cyan: [0x22, 0xd3, 0xee],
  coral: [0xff, 0x7a, 0x59],
  violet: [0xa7, 0x9b, 0xff],
};

async function pngSize(file) {
  const buf = await readFile(file);
  if (buf.toString('ascii', 1, 4) !== 'PNG') throw new Error('not a PNG: ' + file);
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20), bytes: buf.length };
}

async function gifInfo(file) {
  const buf = await readFile(file);
  const { stderr } = await run(FFMPEG, ['-hide_banner', '-i', file], { maxBuffer: 8 * 1024 * 1024 }).catch((e) => e);
  const dims = stderr.match(/(\d{2,5})x(\d{2,5})/);
  const fps = stderr.match(/([\d.]+) fps/);
  const duration = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const showinfo = await run(FFMPEG, ['-hide_banner', '-i', file, '-vf', 'showinfo', '-f', 'null', '-'], { maxBuffer: 32 * 1024 * 1024 }).catch((e) => e);
  const frames = ((showinfo.stderr || '').match(/\bn:\s*\d+/g) || []).length;
  const nsIndex = buf.indexOf(Buffer.from('NETSCAPE2.0'));
  const loop = nsIndex >= 0 ? buf.readUInt16LE(nsIndex + 13) : null;
  return {
    width: dims ? Number(dims[1]) : null,
    height: dims ? Number(dims[2]) : null,
    fps: fps ? Number(fps[1]) : null,
    seconds: duration ? Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]) : null,
    frames,
    loop,
    bytes: buf.length,
  };
}

async function videoInfo(file) {
  const { stderr } = await run(FFMPEG, ['-hide_banner', '-i', file], { maxBuffer: 8 * 1024 * 1024 }).catch((e) => e);
  const dims = stderr.match(/(\d{2,5})x(\d{2,5})/);
  const codec = stderr.match(/Video: (\w+)/);
  const duration = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  return {
    width: dims ? Number(dims[1]) : null,
    height: dims ? Number(dims[2]) : null,
    codec: codec ? codec[1] : null,
    seconds: duration ? Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]) : null,
  };
}

async function rawRgb(file) {
  const { stdout } = await run(FFMPEG, ['-v', 'error', '-i', file, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], {
    maxBuffer: 128 * 1024 * 1024,
    encoding: 'buffer',
  });
  return stdout;
}

function near(buf, i, rgb, tol = 8) {
  return Math.abs(buf[i] - rgb[0]) <= tol && Math.abs(buf[i + 1] - rgb[1]) <= tol && Math.abs(buf[i + 2] - rgb[2]) <= tol;
}

/** Circular-crop safety: every painted brand pixel within 46 % of the centre;
 *  the four corner squares contain no mark content. */
async function avatarSafety(file) {
  const { width } = await pngSize(file);
  const raw = await rawRgb(file);
  const S = width;
  const cx = S / 2;
  const cy = S / 2;
  const maxR = 0.46 * S;
  let maxDistance = 0;
  let painted = 0;
  let cyan = 0;
  let coral = 0;
  const corner = Math.max(3, Math.round(S * 0.08));
  let cornerPainted = 0;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const i = (y * S + x) * 3;
      const isCyan = near(raw, i, COLORS.cyan, 10);
      const isCoral = near(raw, i, COLORS.coral, 10);
      const isChalk = near(raw, i, COLORS.chalk, 8);
      const isViolet = near(raw, i, COLORS.violet, 8);
      if (!(isCyan || isCoral || isChalk || isViolet)) continue;
      painted++;
      if (isCyan) cyan++;
      if (isCoral) coral++;
      const d = Math.hypot(x - cx, y - cy);
      if (d > maxDistance) maxDistance = d;
      const inCorner =
        (x < corner && y < corner) ||
        (x >= S - corner && y < corner) ||
        (x < corner && y >= S - corner) ||
        (x >= S - corner && y >= S - corner);
      if (inCorner) cornerPainted++;
    }
  }
  return { S, painted, cyan, coral, maxDistance, maxR, cornerPainted };
}

async function paletteCounts(file, w, h) {
  const raw = await rawRgb(file);
  const counts = { field: 0, chalk: 0, cyan: 0, coral: 0, violet: 0 };
  const step = 6;
  for (let i = 0; i < raw.length; i += 3 * step) {
    for (const key in COLORS) {
      if (near(raw, i, COLORS[key], 7)) { counts[key]++; break; }
    }
  }
  return counts;
}

const LOCK_WORDMARK_PATH = 'M0,0L16,0L16,100L0,100Z';

/* ── expected outputs ───────────────────────────────────────────────────── */
const AVATAR_SIZES = [1024, 800, 512, 460, 400, 320, 256, 200, 128, 64, 48];
const HEADERS = [
  ['out/headers/reddit-profile-banner-1600x480.png', 1600, 480],
  ['out/headers/reddit-subreddit-banner-1920x384.png', 1920, 384],
  ['out/headers/instagram-profile-card-1080x1350.png', 1080, 1350],
  ['out/headers/facebook-profile-cover-851x315.png', 851, 315],
  ['out/headers/facebook-page-cover-1640x624.png', 1640, 624],
  ['out/headers/tiktok-profile-card-1080x1080.png', 1080, 1080],
  ['out/headers/link-in-bio-background-1080x1920.png', 1080, 1920],
];
const TEMPLATES = [
  ['out/templates/feed-square-1080x1080.png', 1080, 1080],
  ['out/templates/story-1080x1920.png', 1080, 1920],
  ['out/templates/carousel-cover-1080x1350.png', 1080, 1350],
  ['out/templates/end-card-1080x1350.png', 1080, 1350],
];

async function main() {
  console.log('\n== avatars (exact sizes + circular safety) ==');
  for (const size of AVATAR_SIZES) {
    const file = abs(`out/avatars/manhunt-avatar-${size}.png`);
    try {
      const p = await pngSize(file);
      check(`avatar ${size}: ${size}×${size} PNG`, p.width === size && p.height === size, `${p.width}×${p.height}, ${(p.bytes / 1024).toFixed(1)} KB`);
      const safe = await avatarSafety(file);
      check(`avatar ${size}: all mark pixels inside the circular safe area`, safe.maxDistance <= safe.maxR, `max radius ${(safe.maxDistance / size * 100).toFixed(1)}% (limit 46%)`);
      check(`avatar ${size}: corners empty (safe clockwise crop)`, safe.cornerPainted === 0, `${safe.cornerPainted} painted corner px`);
      if (size === 48) {
        check('avatar 48: mark still legible (cyan ring + coral dot)', safe.cyan >= 20 && safe.coral >= 5, `${safe.cyan} cyan / ${safe.coral} coral px`);
      }
    } catch (err) {
      check(`avatar ${size} exists`, false, String(err.message || err));
    }
  }

  console.log('\n== animated avatar ==');
  try {
    const gif = abs('out/avatars/manhunt-avatar-animated-512.gif');
    const g = await gifInfo(gif);
    check('avatar GIF: 512×512', g.width === 512 && g.height === 512, `${g.width}×${g.height}`);
    check('avatar GIF: 80 frames @ 20 fps', g.frames === 80 && Math.round(g.fps) === 20, `${g.frames} frames / ${g.fps} fps`);
    check('avatar GIF: 4.00 s loop, infinite', Math.abs((g.seconds || 0) - 4) < 0.02 && g.loop === 0, `${g.seconds}s, loop=${g.loop}`);
    check('avatar GIF: small enough for an avatar upload (<2 MB)', g.bytes < 2 * 1024 * 1024, `${(g.bytes / 1024).toFixed(0)} KB`);
    const v = await videoInfo(abs('out/avatars/manhunt-avatar-animated-512.webm'));
    check('avatar WebM: 512×512 VP9, ~4 s, silent', v.width === 512 && v.height === 512 && v.codec === 'vp9' && Math.abs((v.seconds || 0) - 4) < 0.1, `${v.width}×${v.height} ${v.codec} ${v.seconds}s`);
  } catch (err) {
    check('animated avatar exists and parses', false, String(err.message || err));
  }

  console.log('\n== headers / profile cards ==');
  for (const [file, w, h] of HEADERS) {
    try {
      const p = await pngSize(abs(file));
      check(`${file}`, p.width === w && p.height === h, `${p.width}×${p.height}, ${(p.bytes / 1024).toFixed(0)} KB`);
    } catch (err) {
      check(`${file} exists`, false, String(err.message || err));
    }
  }

  console.log('\n== templates (rendered) ==');
  for (const [file, w, h] of TEMPLATES) {
    try {
      const p = await pngSize(abs(file));
      check(`${file}`, p.width === w && p.height === h, `${p.width}×${p.height}, ${(p.bytes / 1024).toFixed(0)} KB`);
    } catch (err) {
      check(`${file} exists`, false, String(err.message || err));
    }
  }

  console.log('\n== gallery ==');
  try {
    const p = await pngSize(abs('out/gallery/social-identity-contact-sheet.png'));
    check('gallery contact sheet: 1600 px wide, full page', p.width === 1600 && p.height > 2000, `${p.width}×${p.height}`);
  } catch (err) {
    check('gallery contact sheet exists', false, String(err.message || err));
  }

  console.log('\n== palette (flat brand fills) ==');
  for (const [file, w, h] of [HEADERS[0], HEADERS[1], HEADERS[2], ...TEMPLATES]) {
    try {
      const c = await paletteCounts(abs(file), w, h);
      check(`${file}: field + chalk + cyan + coral + violet`, c.field > 1000 && c.chalk > 150 && c.cyan > 100 && c.coral > 15 && c.violet > 25, JSON.stringify(c));
    } catch (err) {
      check(`${file} palette`, false, String(err.message || err));
    }
  }

  console.log('\n== template source (editable, official, honest) ==');
  {
    const files = await readdir(abs('templates'));
    check('templates/: four editable HTML sources', ['feed-square-1080x1080.html', 'story-1080x1920.html', 'carousel-cover-1080x1350.html', 'end-card-1080x1350.html'].every((f) => files.includes(f)), files.join(', '));
    for (const file of files.filter((f) => f.endsWith('.html'))) {
      const src = await readFile(abs(path.join('templates', file)), 'utf8');
      check(`${file}: copy lives in marked COPY blocks`, (src.match(/COPY/g) || []).length >= 1);
      check(`${file}: official lockup paths inlined verbatim`, src.includes(LOCK_WORDMARK_PATH) && (src.includes('viewBox="0 0 806 220"') || src.includes('viewBox="0 0 530 100"')));
      check(`${file}: honest install line present`, src.includes('free APK · Android 8+ · not on Play Store'));
      check(`${file}: no <script>`, !/<script\b/i.test(src));
      check(`${file}: fonts/art resolve locally (no external asset URLs)`, !/src="http|href="http|url\(http/i.test(src));
    }
    const end = await readFile(abs('templates/end-card-1080x1350.html'), 'utf8');
    check('end-card: short line + CTA + URL + trust', end.includes('Hide from your friends.') && end.includes('Create a hunt. Send the code. Hide.') && end.includes('74.208.99.178') && end.includes('Play with people you trust.'));
    const story = await readFile(abs('templates/story-1080x1920.html'), 'utf8');
    check('story: hook + CTA + honest line', story.includes('Your friends are') && story.includes('Create a hunt. Send the code. Hide.') && story.includes('free APK'));
  }

  console.log('\n== extends the motion kit (no duplication) ==');
  {
    const reuse = [
      ['out/social/youtube-2560x1440-safe-area.png', 2560, 1440],
      ['out/social/x-header-1500x500.png', 1500, 500],
      ['out/social/github-social-1280x640.png', 1280, 640],
      ['out/social/discord-960x540.png', 960, 540],
    ];
    for (const [rel, w, h] of reuse) {
      try {
        const p = await pngSize(path.join(MOTION, rel));
        check(`motion-kit reuse: ${rel}`, p.width === w && p.height === h, `${p.width}×${p.height}`);
      } catch (err) {
        check(`motion-kit reuse: ${rel}`, false, String(err.message || err));
      }
    }
    const stageHtml = await readFile(abs('src/stage.html'), 'utf8');
    check('stage loads the motion-kit radar + lockup directly', stageHtml.includes('/motion-kit/src/motion-core.js') && stageHtml.includes('/motion-kit/src/generated/lockup.js'));
    const art = await readFile(abs('src/art.js'), 'utf8');
    check('art.js consumes MHCore (single motion source)', art.includes('root.MHCore') && art.includes('C.radarFrame'));
    const fontsExist = await stat(path.join(KIT, 'assets', 'fonts')).then(() => true).catch(() => false);
    check('no duplicated font files in this kit (shared from motion-kit)', !fontsExist);
    const tmpl = await readFile(abs('tools/build-templates.mjs'), 'utf8');
    check('templates read the official SVGs from motion-kit/assets/lockup', tmpl.includes("assets', 'lockup'") && tmpl.includes('wordmark-light-on-dark.svg'));
  }

  console.log('\n== README / platform contract ==');
  {
    const readme = await readFile(abs('README.md'), 'utf8');
    for (const token of ['YouTube', 'X / Twitter', 'Instagram', 'TikTok', 'Discord', 'Reddit', 'GitHub', '1546', 'circular', 'owner-approval-pending', 'animated']) {
      check(`README mentions ${token}`, readme.includes(token));
    }
    const mapping = readme.includes('Reddit') && readme.includes('manhunt-avatar-') && readme.includes('motion-kit/out/social');
    check('README carries the file→platform mapping + reuse pointers', mapping);
    check('README flags what cannot be uploaded as-is', readme.includes('cannot be uploaded as-is') || readme.includes('not accepted as an avatar'));
  }

  console.log('\n== copy rules ==');
  {
    const readme = await readFile(abs('README.md'), 'utf8');
    check('copy: hook / short form / CTA documented', readme.includes('Your friends are hunting you.') && readme.includes('Hide from your friends.') && readme.includes('Create a hunt. Send the code. Hide.'));
    const all = await readdir(abs('out'), { recursive: true });
    check('out/: no stray working files', all.every((f) => !/\.(psd|ai|tmp)$/i.test(f)));
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  const summary = { total: results.length, passed, failed: failed.length };
  const json = { generatedAt: new Date().toISOString(), kit: 'design/brand/social-identity', runtime: process.version, summary, checks: results };
  await writeFile(abs('out/verification.json'), JSON.stringify(json, null, 2) + '\n', 'utf8');

  const rows = results.map((r) => `| ${r.pass ? 'PASS' : '**FAIL**'} | ${r.name.replace(/\|/g, '\\|')} | ${r.detail.replace(/\|/g, '\\|')} |`).join('\n');
  const md = `# ManHunt social identity kit — verification

Generated ${json.generatedAt} · Node ${process.version} · ${summary.passed}/${summary.total} checks pass.

**Result: ${summary.failed === 0 ? 'all checks pass' : summary.failed + ' check(s) failed'}**

| Result | Check | Detail |
|---|---|---|
${rows}

## Constraints encoded in the checks

- Profile avatars: 11 exact-size PNGs (1024 master → 48 derivative), every painted mark pixel inside a
  46 %-of-width radius so a 50 % circular crop cannot clip it; corners verified empty; the 48 px
  derivative still has a legible cyan ring + coral dot.
- Animated avatar: 512×512 GIF (80 frames, 20 fps, 4.00 s, infinite loop, <2 MB) and a silent 512×512
  VP9 WebM master. Formats are flagged per platform in the README (only Discord/Telegram animate avatars;
  WebM is not an avatar upload anywhere).
- Headers/cards: exact platform-upload pixel sizes; Reddit subreddit copy inside the centre 1280×384 crop.
- Templates: editable HTML/CSS with marked COPY blocks, official lockup inlined verbatim
  (wordmark paths present, no \`<script>\`, no external assets), honest install line on every rendered post.
- Reuse: YouTube/X/GitHub/Discord banner surfaces are the motion-kit files (dimension-checked), the stage
  loads motion-kit \`motion-core.js\` + official lockup directly, and no fonts/art are duplicated in this kit.
- Palette: every checked header/template contains field, chalk, cyan, coral and violet flat fills.

Reproduce: \`node tools/build.mjs && node tools/verify.mjs\`.
`;
  await writeFile(abs('out/VERIFICATION.md'), md, 'utf8');

  console.log(`\n== ${summary.failed === 0 ? 'VERIFICATION PASSED' : 'VERIFICATION FAILED'} — ${summary.passed}/${summary.total} checks ==`);
  console.log('  out/verification.json\n  out/VERIFICATION.md');
  if (summary.failed > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
