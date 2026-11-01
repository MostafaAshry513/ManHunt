// Builds the full ManHunt social identity kit (avatars, headers, templates, gallery).
//
//   node tools/build.mjs             full build
//   node tools/build.mjs --stills    skip the animated avatar (GIF/WebM)
//
// Extends the motion kit: reuses its headless-Chrome renderer pattern, OFL fonts,
// official lockup SVGs, radar algorithm and output conventions.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { FFMPEG } from '../../motion-kit/tools/browser.mjs';

const run = promisify(execFile);
const TOOLS = import.meta.dirname;
const KIT = path.resolve(TOOLS, '..');
const STILLS_ONLY = process.argv.includes('--stills');
const OUT = path.join(KIT, 'out');
const TMP = path.join(KIT, 'build', 'tmp');
const RENDER = path.join(TOOLS, 'render.mjs');

const step = (title) => console.log('\n=== ' + title + ' ===');

async function render(args) {
  const { stdout, stderr } = await run(process.execPath, [RENDER, ...args], { cwd: KIT });
  const text = (stdout + stderr).trim();
  if (text) console.log(text.split('\n').map((l) => '  ' + l).join('\n'));
}

const AVATAR_SIZES = [1024, 800, 512, 460, 400, 320, 256, 200, 128, 64, 48];

const HEADERS = [
  ['reddit-profile', 'reddit-profile-banner-1600x480.png'],
  ['reddit-subreddit', 'reddit-subreddit-banner-1920x384.png'],
  ['instagram-card', 'instagram-profile-card-1080x1350.png'],
  ['facebook-profile-cover', 'facebook-profile-cover-851x315.png'],
  ['facebook-page-cover', 'facebook-page-cover-1640x624.png'],
  ['tiktok-profile', 'tiktok-profile-card-1080x1080.png'],
  ['link-in-bio', 'link-in-bio-background-1080x1920.png'],
];

const TEMPLATES = [
  ['feed-square-1080x1080.html', 'feed-square-1080x1080.png', '1080x1080'],
  ['story-1080x1920.html', 'story-1080x1920.png', '1080x1920'],
  ['carousel-cover-1080x1350.html', 'carousel-cover-1080x1350.png', '1080x1350'],
  ['end-card-1080x1350.html', 'end-card-1080x1350.png', '1080x1350'],
];

async function main() {
  for (const dir of ['avatars', 'headers', 'templates', 'gallery']) {
    await mkdir(path.join(OUT, dir), { recursive: true });
  }
  await mkdir(TMP, { recursive: true });

  step('1/6 profile avatars (master 1024 + platform derivatives, mark-only)');
  for (const size of AVATAR_SIZES) {
    await render(['still', '--art', 'avatar', '--size', String(size), '--t', '0', '--out', `out/avatars/manhunt-avatar-${size}.png`]);
  }

  if (!STILLS_ONLY) {
    step('2/6 animated avatar (512, 4 s loop, GIF + WebM)');
    await rm(path.join(TMP, 'avatar-frames'), { recursive: true, force: true });
    await render(['frames', '--art', 'avatar', '--size', '512', '--fps', '20', '--duration', '4', '--out', 'build/tmp/avatar-frames']);
    const frames = path.join(TMP, 'avatar-frames', 'frame_%04d.png');
    const gifOut = path.join(OUT, 'avatars', 'manhunt-avatar-animated-512.gif');
    await run(FFMPEG, [
      '-y', '-hide_banner', '-loglevel', 'error', '-framerate', '20', '-i', frames,
      '-vf', 'split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=none:diff_mode=rectangle',
      '-loop', '0', gifOut,
    ], { cwd: KIT });
    const webmOut = path.join(OUT, 'avatars', 'manhunt-avatar-animated-512.webm');
    await run(FFMPEG, [
      '-y', '-hide_banner', '-loglevel', 'error', '-framerate', '20', '-i', frames,
      '-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-row-mt', '1', '-pix_fmt', 'yuv420p',
      '-an', webmOut,
    ], { cwd: KIT });
    for (const f of [gifOut, webmOut]) {
      const info = await stat(f);
      console.log(`  ${path.relative(KIT, f)}  ${(info.size / 1024).toFixed(0)} KB`);
    }
    await rm(path.join(TMP, 'avatar-frames'), { recursive: true, force: true });
  }

  step('3/6 channel headers / profile cards');
  for (const [art, file] of HEADERS) {
    await render(['still', '--art', art, '--out', `out/headers/${file}`]);
  }

  step('4/6 editable post templates');
  {
    const { stdout } = await run(process.execPath, [path.join(TOOLS, 'build-templates.mjs')], { cwd: KIT });
    console.log(stdout.trim());
    for (const [src, file, size] of TEMPLATES) {
      await render(['page', '--file', `social-identity/templates/${src}`, '--size', size, '--out', `out/templates/${file}`]);
    }
  }

  step('5/6 gallery contact sheet');
  await render(['page', '--file', 'social-identity/gallery/contact-sheet.html', '--size', '1600x1200', '--full-page', '--out', 'out/gallery/social-identity-contact-sheet.png']);

  step('6/6 done');
  console.log('  avatars  : ' + AVATAR_SIZES.length + ' static + animated GIF/WebM');
  console.log('  headers  : ' + HEADERS.length + ' new (plus 4 reused from the motion kit)');
  console.log('  templates: ' + TEMPLATES.length + ' editable HTML/CSS + rendered PNGs');
  console.log('  verify   : node tools/verify.mjs');
}

main().catch((err) => { console.error(err); process.exit(1); });
