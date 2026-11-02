// Builds the MATCHDAY BOARD GitHub assets:
//   docs/brand/matchday-hero-1280x560.png      primary README poster/scoreboard opening
//   docs/brand/matchday-hero-1280x560.gif      animated variant (5 s loop, clock/zone/pings/trail)
//   docs/brand/github-social-matchday-1280x640.png  new GitHub social preview card
//   docs/brand/tag-prey-400x120.png / tag-hunters-400x120.png  kit tags for the "two sides" table
//   design/github-redesign/assets/concept-map-band-2400x936.png  concept-preview map band
//
//   node tools/build-assets.mjs
//
// The hero map panel uses the premium live-map capture
// (docs/screenshots/premium/05-map.png) when it exists, otherwise the
// site-redesign map illustration, so the concept can be built and reviewed
// before the premium capture lands. Re-run after the premium drop to rebuild
// the hero with the real capture.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm, stat, access } from 'node:fs/promises';
import path from 'node:path';

const run = promisify(execFile);
const TOOLS = import.meta.dirname;
const KIT = path.resolve(TOOLS, '..');
const REPO = path.resolve(KIT, '..', '..');
const RENDER = path.join(TOOLS, 'render.mjs');
const FFMPEG = 'C:\\dev\\ManHunt\\design\\.tools\\node_modules\\ffmpeg-static\\ffmpeg.exe';
const TMP = path.join(KIT, 'build');

const exists = async (p) => access(p).then(() => true).catch(() => false);

const PREMIUM_MAP = 'docs/screenshots/premium/s07-hunt.png';
const FALLBACK_MAP = 'server/public/site/map-hero.jpg';

// Where the coral prey marker sits inside the real capture (detected by colour
// scan of s07-hunt.png). The hero/social stages draw their report-ping motion
// around this point when they use the real capture, and hide the illustrated
// overlay art (the capture already contains the real zone ring, markers, trail).
const PREY = { x: 552, y: 1482 };
const HERO_MAP = { w: 556, h: 560, size: 1.25, posX: 0.30, posY: 0.66 };
const SOCIAL_MAP = { w: 480, h: 640, size: 1.8, posX: 0.35, posY: 0.66 };

function mapPoint(cfg, orig) {
  const dispW = cfg.w * cfg.size;
  const scale = dispW / 1080;
  const dispH = scale * 2400;
  const offX = cfg.posX * (dispW - cfg.w);
  const offY = cfg.posY * (dispH - cfg.h);
  return { x: Math.round(orig.x * scale - offX), y: Math.round(orig.y * scale - offY) };
}
const pct = (n) => Math.round(n * 10000) / 100 + '%';
const heroPoint = mapPoint(HERO_MAP, PREY);
const socialPoint = mapPoint(SOCIAL_MAP, PREY);

async function render(args) {
  const { stdout, stderr } = await run(process.execPath, [RENDER, ...args], { cwd: KIT });
  const text = (stdout + stderr).trim();
  if (text) console.log(text.split('\n').map((l) => '  ' + l).join('\n'));
}

async function main() {
  await mkdir(path.join(KIT, 'assets'), { recursive: true });
  await mkdir(path.join(REPO, 'docs', 'brand'), { recursive: true });
  await mkdir(TMP, { recursive: true });

  const hasPremium = await exists(path.join(REPO, PREMIUM_MAP));
  const map = hasPremium ? '/' + PREMIUM_MAP : '/' + FALLBACK_MAP;
  const q = hasPremium
    ? (cfg, point) => [
        '?map=' + encodeURIComponent(map),
        'mapPos=' + encodeURIComponent(`${pct(cfg.posX)} ${pct(cfg.posY)}`),
        'mapSize=' + encodeURIComponent(`${Math.round(cfg.size * 100)}% auto`),
        'marks=0',
        'pings=' + encodeURIComponent(`${point.x},${point.y}`),
      ].join('&')
    : () => '?map=' + encodeURIComponent(map) + '&mapPos=' + encodeURIComponent('center 42%') + '&marks=1';
  console.log(`[assets] map source: ${hasPremium ? 'PREMIUM capture ' + PREMIUM_MAP : 'site illustration ' + FALLBACK_MAP}`);
  if (hasPremium) console.log(`[assets] ping centre: hero (${heroPoint.x},${heroPoint.y}) · social (${socialPoint.x},${socialPoint.y})`);

  await render(['still', '--page', 'design/github-redesign/stage/hero.html' + q(HERO_MAP, heroPoint), '--size', '1280x560', '--out', 'docs/brand/matchday-hero-1280x560.png']);
  await render(['still', '--page', 'design/github-redesign/stage/social.html' + q(SOCIAL_MAP, socialPoint), '--size', '1280x640', '--out', 'docs/brand/github-social-matchday-1280x640.png']);
  await render(['still', '--page', 'design/github-redesign/stage/tag-prey.html', '--size', '400x120', '--out', 'docs/brand/tag-prey-400x120.png']);
  await render(['still', '--page', 'design/github-redesign/stage/tag-hunters.html', '--size', '400x120', '--out', 'docs/brand/tag-hunters-400x120.png']);

  const framesDir = path.join(TMP, 'hero-frames');
  await rm(framesDir, { recursive: true, force: true });
  await render(['frames', '--page', 'design/github-redesign/stage/hero.html' + q(HERO_MAP, heroPoint), '--size', '1280x560', '--fps', '20', '--duration', '5', '--out', 'design/github-redesign/build/hero-frames']);
  await run(FFMPEG, [
    '-y', '-hide_banner', '-loglevel', 'error', '-framerate', '20',
    '-i', path.join(framesDir, 'frame_%04d.png'),
    '-vf', 'split[s0][s1];[s0]palettegen=max_colors=160:stats_mode=diff[p];[s1][p]paletteuse=dither=none:diff_mode=rectangle',
    '-loop', '0', path.join(REPO, 'docs', 'brand', 'matchday-hero-1280x560.gif'),
  ], { cwd: REPO });
  await rm(framesDir, { recursive: true, force: true });

  // Real-capture map band for the "the map is the field" section: a crop of the
  // live-hunt capture that keeps the zone ring, fresh + stale prey markers and trail
  // (the supplied harvest/map-hero crop is tiles-only). Derived asset, documented.
  if (hasPremium) {
    await run(FFMPEG, [
      '-y', '-hide_banner', '-loglevel', 'error',
      '-i', path.join(REPO, PREMIUM_MAP),
      '-vf', 'crop=1080:540:0:1300',
      path.join(REPO, 'docs', 'brand', 'matchday-map-band-1080x540.png'),
    ], { cwd: REPO });
  }

  await render(['still', '--page', 'design/github-redesign/stage/map-band.html', '--size', '2400x936', '--out', 'design/github-redesign/assets/concept-map-band-2400x936.png']);

  console.log('\n[assets] written:');
  for (const f of [
    'docs/brand/matchday-hero-1280x560.png',
    'docs/brand/matchday-hero-1280x560.gif',
    'docs/brand/github-social-matchday-1280x640.png',
    'docs/brand/tag-prey-400x120.png',
    'docs/brand/tag-hunters-400x120.png',
    'docs/brand/matchday-map-band-1080x540.png',
    'design/github-redesign/assets/concept-map-band-2400x936.png',
  ]) {
    if (!(await exists(path.join(REPO, f)))) { console.log(`  (missing) ${f}`); continue; }
    const info = await stat(path.join(REPO, f));
    console.log(`  ${f}  ${(info.size / 1024).toFixed(0)} KB`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
