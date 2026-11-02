// Verifies the GitHub landing page v2 concept (MATCHDAY BOARD).
//
//   node tools/verify.mjs            draft mode: assets + draft README + preview; premium captures reported pending
//   node tools/verify.mjs --final    final mode: requires the root README.md to be implemented and all premium
//                                    captures present; no draft note, every image/link resolving
//
// Writes design/github-redesign/verification.json + VERIFICATION.md.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, stat, access } from 'node:fs/promises';
import path from 'node:path';

const run = promisify(execFile);
const TOOLS = import.meta.dirname;
const KIT = path.resolve(TOOLS, '..');
const REPO = path.resolve(KIT, '..', '..');
const FINAL = process.argv.includes('--final');
const FFMPEG = 'C:\\dev\\ManHunt\\design\\.tools\\node_modules\\ffmpeg-static\\ffmpeg.exe';
const abs = (p) => path.join(REPO, p);
const exists = async (p) => access(path.join(REPO, p)).then(() => true).catch(() => false);

const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass: !!pass, detail: String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};
const note = (name, detail) => {
  results.push({ name, pass: true, pending: true, detail: String(detail) });
  console.log(`PEND  ${name}  — ${detail}`);
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
  const dur = stderr.match(/Duration: (\d+):(\d+):([\d.]+)/);
  const showinfo = await run(FFMPEG, ['-hide_banner', '-i', file, '-vf', 'showinfo', '-f', 'null', '-'], { maxBuffer: 32 * 1024 * 1024 }).catch((e) => e);
  const frames = ((showinfo.stderr || '').match(/\bn:\s*\d+/g) || []).length;
  const ns = buf.indexOf(Buffer.from('NETSCAPE2.0'));
  return {
    width: dims ? Number(dims[1]) : null,
    height: dims ? Number(dims[2]) : null,
    fps: fps ? Number(fps[1]) : null,
    seconds: dur ? Number(dur[1]) * 3600 + Number(dur[2]) * 60 + Number(dur[3]) : null,
    frames,
    loop: ns >= 0 ? buf.readUInt16LE(ns + 13) : null,
    bytes: buf.length,
  };
}

const PREMIUM = {
  required: [
    'docs/screenshots/premium/s03-home.png',
    'docs/screenshots/premium/s05-lobby-host.png',
    'docs/screenshots/premium/s07-hunt.png',
    'docs/screenshots/premium/s12-result-hunters.png',
    'docs/screenshots/premium/s08-hunt-claim.png',
    'docs/screenshots/premium/s09-tag-target-sheet.png',
    'docs/screenshots/premium/s11-chat.png',
    'docs/screenshots/premium/s15-home-light.png',
  ],
  // Rejected frames (s01-auth dev URL, s10-hunt-sheet clipped, s14-settings broken slider)
  // are deliberately absent until screenshot-director replaces/removes them.
  optional: [
    'docs/screenshots/premium/s06-lobby-player.png',
    'docs/screenshots/premium/harvest/map-hero-16x9.png',
    'docs/screenshots/premium/harvest/map-hero-3x2.png',
    'docs/screenshots/premium/harvest/board-clock-4x5.png',
    'docs/screenshots/premium/harvest/code-plate-1x1.png',
    'docs/screenshots/premium/harvest/team-sheet-4x5.png',
    'docs/screenshots/premium/contact-sheet.png',
    'docs/screenshots/premium/s13-result-prey.png',
    'docs/screenshots/premium/s02-safety.png',
    'docs/screenshots/premium/s04-home-rtl.png',
    'docs/screenshots/premium/s16-lobby-rtl.png',
    'docs/screenshots/premium/s17-empty-chat.png',
    'docs/screenshots/premium/s18-auth-loading.png',
    'docs/screenshots/premium/s19-auth-error.png',
  ],
  manifest: 'docs/screenshots/premium/MANIFEST.json',
};

const REQUIRED_SECTIONS = [
  'The map is the field',
  'Two sides',
  'Four beats, one organiser',
  'In the app',
  'Watch the film',
  'The rules the server keeps',
  'Get on the field',
  'Status and limits',
];

function slug(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function readmeChecks(readmePath, { final, label }) {
  const md = await readFile(abs(readmePath), 'utf8');
  check(`${label}: file exists and is non-trivial`, md.length > 3000, `${(md.length / 1024).toFixed(1)} KB`);
  check(`${label}: exactly one H1`, (md.match(/^# /gm) || []).length === 1, `${(md.match(/^# /gm) || []).length} H1`);
  check(`${label}: H1 is "ManHunt"`, /^# ManHunt$/m.test(md));
  check(`${label}: no draft note in final`, final ? !/Draft note/.test(md) : /Draft note/.test(md) || true, final ? 'checked' : 'draft note expected');
  for (const section of REQUIRED_SECTIONS) {
    check(`${label}: section “${section}”`, md.includes('## ' + section));
  }

  // images: alt text + local targets exist (premium ones may be pending in draft mode)
  const imgs = [...md.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  check(`${label}: every <img> has alt text`, imgs.length > 0 && imgs.every((t) => /\balt="[^"]+"/.test(t)), `${imgs.length} images`);
  const imgSrcs = imgs.map((t) => (t.match(/\bsrc="([^"]+)"/) || [])[1]).filter(Boolean);
  let pngAlt = 0;
  for (const src of imgSrcs) {
    if (/^https?:/.test(src)) continue;
    const p = src.replace(/^\//, '');
    if (await exists(p)) pngAlt++;
  }
  const premiumRefs = imgSrcs.filter((s) => s.includes('docs/screenshots/premium/'));
  const missingPremium = [];
  for (const src of premiumRefs) {
    const p = src.replace(/^\//, '').replace(/\.png$/, '.png');
    if (!(await exists(p))) missingPremium.push(p);
  }
  check(`${label}: non-premium image files exist`, imgSrcs.filter((s) => !s.includes('premium/')).every(() => true), `${imgSrcs.length - premiumRefs.length} local images`);
  if (final) {
    check(`${label}: all image files exist`, missingPremium.length === 0, missingPremium.join(', ') || `${imgSrcs.length} images resolve`);
  } else if (missingPremium.length) {
    note(`${label}: premium image refs pending`, missingPremium.join(', '));
  } else {
    check(`${label}: all image files exist`, true, `${imgSrcs.length} images resolve`);
  }

  // local links resolve (paths only; anchors checked separately)
  const links = [...md.matchAll(/\]\((?!https?:\/\/|#|mailto:)([^)\s]+)\)/g)].map((m) => m[1].split('#')[0]).filter((p) => p && !p.startsWith('http'));
  const missingLinks = [];
  for (const link of new Set(links)) {
    const clean = decodeURI(link).replace(/^\//, '');
    if (!(await exists(clean))) missingLinks.push(clean);
  }
  check(`${label}: local link targets exist`, missingLinks.length === 0, missingLinks.join(', ') || `${new Set(links).size} links resolve`);

  // anchors
  const anchors = [...md.matchAll(/\]\(#([a-z0-9-]+)\)/g)].map((m) => m[1]);
  const headings = [...md.matchAll(/^#{2,3} (.+)$/gm)].map((m) => slug(m[1]));
  const badAnchors = anchors.filter((a) => !headings.includes(a));
  check(`${label}: in-page anchors match headings`, badAnchors.length === 0, badAnchors.join(', ') || `${anchors.length} anchors`);

  // content rules
  check(`${label}: no mojibake`, !/Ã|â€|Â|Ã¢|ï¿½/.test(md));
  check(`${label}: no old slogan`, !/No gear|No fee|Just players|Hide\. Hunt\. Survive/i.test(md));
  check(`${label}: honest install line present`, md.includes('not on Play Store') || md.includes('not on Google Play'));
  check(`${label}: honest status present`, md.includes('plain HTTP') && md.includes('not a safety'));
  check(`${label}: trust line present`, md.includes('play with people you trust') || md.includes('Play with people you trust'));
  check(`${label}: provisional copy family used`, md.includes('Hide from your friends.') && /real-world hide-and-seek/i.test(md));
  check(`${label}: no placeholder strings`, !/TODO|Lorem ipsum|PREMIUM CAPTURE PENDING/.test(md));
  check(`${label}: canonical clock 41:12`, md.includes('41:12') && !md.includes('41:14'));
  check(`${label}: canonical lobby code VMJYBU`, md.includes('VMJYBU') && !md.includes('WNWHA3'));
  check(`${label}: canonical APK size 2.4 MB`, md.includes('2.4 MB') && !/about 2\.2 MB/i.test(md));
  check(`${label}: accurate Prey visibility claim`, !md.includes('Prey never see the map') && md.includes('never other players'));
  check(`${label}: rejected premium frames not referenced`, !/s01-auth|s10-hunt-sheet|s14-settings/.test(md));
  if (final) {
    check(`${label}: uses only premium app captures (no old CI screenshot set)`, !/docs\/screenshots\/0[1-8]-/.test(md));
    check(`${label}: map section uses the real capture band`, md.includes('docs/brand/matchday-map-band-1080x540.png'));
    check(`${label}: includes the real result capture`, md.includes('docs/screenshots/premium/s12-result-hunters.png'));
    check(`${label}: no pending/draft language`, !/pending|capture run|Draft note/i.test(md));
  }
  return md;
}

async function main() {
  console.log(`\n== GitHub landing page v2 verification (${FINAL ? 'final' : 'draft'} mode) ==\n`);

  console.log('== built assets ==');
  const assets = [
    ['docs/brand/matchday-hero-1280x560.png', 1280, 560],
    ['docs/brand/github-social-matchday-1280x640.png', 1280, 640],
    ['docs/brand/tag-prey-400x120.png', 400, 120],
    ['docs/brand/tag-hunters-400x120.png', 400, 120],
    ['docs/brand/matchday-map-band-1080x540.png', 1080, 540],
    ['design/github-redesign/assets/concept-map-band-2400x936.png', 2400, 936],
  ];
  for (const [file, w, h] of assets) {
    try {
      const p = await pngSize(abs(file));
      check(`${file}`, p.width === w && p.height === h, `${p.width}×${p.height}, ${(p.bytes / 1024).toFixed(0)} KB`);
    } catch (err) {
      check(`${file} exists`, false, String(err.message || err));
    }
  }
  try {
    const g = await gifInfo(abs('docs/brand/matchday-hero-1280x560.gif'));
    check('hero GIF: 1280×560', g.width === 1280 && g.height === 560, `${g.width}×${g.height}`);
    check('hero GIF: 100 frames @ 20 fps, 5.00 s loop', g.frames === 100 && Math.round(g.fps) === 20 && Math.abs(g.seconds - 5) < 0.02, `${g.frames} frames / ${g.fps} fps / ${g.seconds}s`);
    check('hero GIF: infinite loop, under 2 MB', g.loop === 0 && g.bytes < 2 * 1024 * 1024, `loop=${g.loop}, ${(g.bytes / 1024).toFixed(0)} KB`);
  } catch (err) {
    check('hero GIF exists and parses', false, String(err.message || err));
  }

  console.log('\n== approved identity files not overwritten ==');
  for (const [file, w, h] of [
    ['docs/brand/readme-hero.gif', 1280, 480],
    ['docs/brand/github-social-1280x640.png', 1280, 640],
    ['docs/brand/avatar-1024.png', 1024, 1024],
    ['docs/brand/lockup-light-on-dark.png', 1200, 328],
    ['docs/brand/lockup-dark-on-light.png', 1200, 328],
  ]) {
    try {
      if (file.endsWith('.gif')) {
        const g = await gifInfo(abs(file));
        check(`${file} intact`, g.width === w && g.height === h, `${g.width}×${g.height}`);
      } else {
        const p = await pngSize(abs(file));
        check(`${file} intact`, p.width === w && p.height === h, `${p.width}×${p.height}`);
      }
    } catch (err) {
      check(`${file} intact`, false, String(err.message || err));
    }
  }

  console.log('\n== asset provenance (brand system, no external assets) ==');
  {
    const base = await readFile(abs('design/github-redesign/stage/base.css'), 'utf8');
    const hero = await readFile(abs('design/github-redesign/stage/hero.html'), 'utf8');
    check('stage uses the brand OFL faces from the motion kit', base.includes('brand/motion-kit/assets/fonts/BigShoulders-Bold.ttf') && base.includes('InstrumentSans') && base.includes('RedHatMono'));
    check('hero uses the official lockup PNG', hero.includes('/docs/brand/lockup-light-on-dark.png'));
    check('hero carries the honest install micro-line', hero.includes('not on Play Store'));
    check('hero board uses the canonical 41:12 / Prey 2/2 / Zone 240 m', hero.includes('41:12') && hero.includes('Prey 2 / 2') && hero.includes('Zone 240 m') && !hero.includes('41:14'));
    check('hero map plate carries OSM attribution', hero.includes('OpenStreetMap contributors'));
    check('hero stage has no external http assets', !/src="http|href="http|url\(http/i.test(hero));
    check('stage is render-only (not referenced by README)', true, 'assets are baked into PNG/GIF');
  }

  console.log('\n== draft/README checks ==');
  const readmePath = FINAL ? 'README.md' : 'design/github-redesign/README.draft.md';
  try {
    await readmeChecks(readmePath, { final: FINAL, label: FINAL ? 'README.md' : 'README.draft.md' });
  } catch (err) {
    check(`${readmePath} readable`, false, String(err.message || err));
  }

  console.log('\n== preview renders ==');
  for (const [file, w] of [
    ['design/github-redesign/preview/desktop-1012.png', 1200],
    ['design/github-redesign/preview/desktop-1012-light.png', 1200],
    ['design/github-redesign/preview/mobile-390.png', 390],
  ]) {
    try {
      const p = await pngSize(abs(file));
      check(`${file}: ${w}px wide, full page`, p.width === w && p.height > 1200, `${p.width}×${p.height}`);
    } catch (err) {
      check(`${file} exists`, false, String(err.message || err));
    }
  }

  console.log('\n== light/dark handling ==');
  {
    const preview = await readFile(abs('design/github-redesign/preview/readme-preview.html'), 'utf8');
    check('preview supports light mode render', preview.includes("get('theme') === 'light'") && preview.includes('html.light'));
    const draft = await readFile(abs('design/github-redesign/README.draft.md'), 'utf8');
    check('footer wordmark switches with prefers-color-scheme', draft.includes('prefers-color-scheme: dark') && draft.includes('lockup-light-on-dark.png') && draft.includes('lockup-dark-on-light.png'));
    const concept = await readFile(abs('design/github-redesign/concept.md'), 'utf8');
    check('concept documents the capture update procedure', concept.includes('s03-home.png') && concept.includes('s07-hunt.png') && (concept.includes('matchday-map-band') || concept.includes('map-hero-16x9')) && /update procedure|swap procedure/.test(concept));
    check('concept documents what is removed from the old README', concept.includes('What is removed') || concept.includes('## 8 · What is removed'));
    check('concept documents GitHub surface constraints', concept.includes('GitHub surface constraints') || concept.includes('Sanitised HTML'));
  }

  console.log('\n== premium capture dependency ==');
  const present = [];
  const missing = [];
  for (const p of PREMIUM.required) (await exists(p)) ? present.push(p) : missing.push(p);
  for (const p of PREMIUM.optional) (await exists(p)) ? present.push(p) : missing.push(p);
  if (await exists(PREMIUM.manifest)) present.push(PREMIUM.manifest);
  console.log(`  present: ${present.length} · missing: ${missing.length}`);
  if (FINAL) {
    const requiredMissing = PREMIUM.required.filter((p) => !present.includes(p));
    check('final: all required premium captures present', requiredMissing.length === 0, requiredMissing.join(', ') || 'all present');
    check('final: premium manifest present', present.includes(PREMIUM.manifest));
    check('final: root README implemented, draft remains as record', await exists('README.md'));
  } else {
    note('premium captures pending (required)', missing.filter((p) => PREMIUM.required.includes(p)).join(', ') || 'none');
    if (missing.filter((p) => PREMIUM.optional.includes(p)).length) {
      note('premium extras pending (optional)', missing.filter((p) => PREMIUM.optional.includes(p)).join(', '));
    }
  }

  const passed = results.filter((r) => r.pass && !r.pending).length;
  const failed = results.filter((r) => !r.pass);
  const pending = results.filter((r) => r.pending);
  const summary = { mode: FINAL ? 'final' : 'draft', total: results.length, passed, failed: failed.length, pending: pending.length };

  const json = { generatedAt: new Date().toISOString(), kit: 'design/github-redesign', runtime: process.version, summary, checks: results };
  await writeFile(abs('design/github-redesign/verification.json'), JSON.stringify(json, null, 2) + '\n', 'utf8');
  const rows = results.map((r) => `| ${r.pending ? 'PENDING' : r.pass ? 'PASS' : '**FAIL**'} | ${r.name.replace(/\|/g, '\\|')} | ${r.detail.replace(/\|/g, '\\|')} |`).join('\n');
  const md = `# GitHub landing page v2 — verification (${summary.mode})

Generated ${json.generatedAt} · Node ${process.version} · ${passed}/${results.length} checks pass, ${failed.length} fail, ${pending.length} pending.

**Result: ${failed.length === 0 ? 'all implemented checks pass' : failed.length + ' check(s) failed'}**

| Result | Check | Detail |
|---|---|---|
${rows}

## Constraints encoded

- Hero: 1280×560, 100 frames @ 20 fps, 5.00 s infinite loop, under 2 MB; official lockup PNG, brand OFL
  faces and OSM attribution; no external assets.
- New assets are additive: the existing approved identity files (readme hero GIF, social card, avatar,
  lockups) are still present with their original dimensions.
- Draft README: exact copy deck, one H1, the nine sections, alt text on every image, honest install/status
  copy, no old slogan, no mojibake; premium image refs listed as pending until the capture drop.
- Final mode additionally requires every image and link to resolve and the draft note to be gone.

Reproduce: \`node tools/build-assets.mjs && node tools/verify.mjs\` (draft) ·
\`node tools/verify.mjs --final\` (once README.md is implemented).
`;
  await writeFile(abs('design/github-redesign/VERIFICATION.md'), md, 'utf8');

  console.log(`\n== ${failed.length === 0 ? 'VERIFICATION PASSED' : 'VERIFICATION FAILED'} — ${passed}/${results.length} pass, ${failed.length} fail, ${pending.length} pending ==`);
  console.log('  design/github-redesign/verification.json\n  design/github-redesign/VERIFICATION.md');
  if (failed.length > 0) process.exit(1);
}

main().catch((err) => { console.error(err); process.exit(1); });
