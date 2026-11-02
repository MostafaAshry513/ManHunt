// Implements the final GitHub landing page once the premium captures exist.
//
//   node tools/implement-readme.mjs
//
// Preconditions: the required premium captures are in docs/screenshots/premium/
// (S-ID naming from design/redesign/screenshot-shotlist.md). The script:
//   1. checks the required captures,
//   2. rebuilds the MATCHDAY hero/social assets from the real live-hunt capture
//      (build-assets.mjs also derives the README map band crop from it),
//   3. assembles the root README.md from README.draft.md (drops the draft note,
//      drops the optional "More screens" block if those captures are absent),
//   4. refuses to write broken image references,
//   5. runs verify.mjs --final.
//
// It writes README.md (plus the built assets it owns). It never touches
// docs/screenshots/premium/ (screenshot-director owns that directory).
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';

const run = promisify(execFile);
const TOOLS = import.meta.dirname;
const KIT = path.resolve(TOOLS, '..');
const REPO = path.resolve(KIT, '..', '..');
const abs = (p) => path.join(REPO, p);
const exists = async (p) => access(abs(p)).then(() => true).catch(() => false);

// What the shipped README needs today (clean premium frames only).
const REQUIRED = [
  'docs/screenshots/premium/s03-home.png',
  'docs/screenshots/premium/s05-lobby-host.png',
  'docs/screenshots/premium/s07-hunt.png',
  'docs/screenshots/premium/s12-result-hunters.png',
];
const MORE_SCREENS = [
  'docs/screenshots/premium/s08-hunt-claim.png',
  'docs/screenshots/premium/s09-tag-target-sheet.png',
  'docs/screenshots/premium/s11-chat.png',
  'docs/screenshots/premium/s15-home-light.png',
];
// README map band = derived crop of the live-hunt capture (built by build-assets).
const MAP_BAND = 'docs/brand/matchday-map-band-1080x540.png';
const MAP_FALLBACKS = [
  'docs/screenshots/premium/harvest/map-hero-16x9.png',
  'docs/screenshots/premium/s07-hunt.png',
];

function stripDraftNote(md) {
  let out = md.replace(/^<!--[\s\S]*?-->\s*/, '');
  out = out.replace(/^> \*\*Draft note[\s\S]*?\n\n/m, '');
  return out.replace(/^\s*\n/, '');
}

async function main() {
  const missingList = [];
  for (const p of REQUIRED) if (!(await exists(p))) missingList.push(p);
  if (missingList.length) {
    console.error('[implement-readme] required premium captures missing:');
    for (const p of missingList) console.error('  - ' + p);
    process.exit(2);
  }

  console.log('[implement-readme] required premium captures present. Rebuilding brand assets…');
  await run(process.execPath, [path.join(TOOLS, 'build-assets.mjs')], { cwd: KIT, stdio: 'inherit' });

  let md = await readFile(abs('design/github-redesign/README.draft.md'), 'utf8');
  md = stripDraftNote(md);

  // Map band fallbacks if the derived crop is absent after the build.
  if (!(await exists(MAP_BAND))) {
    if (await exists(MAP_FALLBACKS[0])) {
      console.log('[implement-readme] using the supplied harvest map crop (derived band missing)');
      md = md.replace(/docs\/brand\/matchday-map-band-1080x540\.png/g, MAP_FALLBACKS[0]);
    } else if (await exists(MAP_FALLBACKS[1])) {
      console.log('[implement-readme] using the portrait live-hunt capture as a centred map band');
      md = md.replace(
        /<img src="docs\/brand\/matchday-map-band-1080x540\.png" width="100%" alt="([^"]+)">/,
        '<p align="center"><img src="' + MAP_FALLBACKS[1] + '" width="420" alt="$1"></p>'
      );
    }
  }

  const missingScreens = [];
  for (const p of MORE_SCREENS) if (!(await exists(p))) missingScreens.push(p);
  if (missingScreens.length) {
    console.log('[implement-readme] dropping "More screens" block; missing: ' + missingScreens.join(', '));
    md = md.replace(/<details>\s*<summary>More screens<\/summary>[\s\S]*?<\/details>\s*/m, '');
  }

  // Every local <img src> and every relative link must resolve.
  const imgSrcs = [...md.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map((m) => m[1]).filter((s) => !/^https?:/.test(s));
  const linkTargets = [...md.matchAll(/\]\((?!https?:\/\/|#|mailto:)([^)\s]+)\)/g)].map((m) => m[1].split('#')[0]).filter(Boolean);
  const broken = [];
  for (const p of new Set([...imgSrcs, ...linkTargets])) {
    if (!(await exists(p.replace(/^\//, '')))) broken.push(p);
  }
  if (broken.length) {
    console.error('[implement-readme] refusing to write README with broken references: ' + broken.join(', '));
    process.exit(1);
  }

  await writeFile(abs('README.md'), md, 'utf8');
  console.log(`[implement-readme] wrote README.md (${(md.length / 1024).toFixed(1)} KB, ${imgSrcs.length} images)`);

  try {
    const { stdout } = await run(process.execPath, [path.join(TOOLS, 'verify.mjs'), '--final'], { cwd: KIT });
    console.log(stdout.trim().split('\n').slice(-8).join('\n'));
  } catch (err) {
    console.error(err.stdout || err);
    console.error('[implement-readme] final verification failed — README written but not ready; fix and re-run.');
    process.exit(1);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
