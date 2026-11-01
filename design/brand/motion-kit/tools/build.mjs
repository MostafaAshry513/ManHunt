// Builds every rendered asset in the ManHunt motion kit, deterministically.
//
//   node tools/build.mjs            full build (lockup sync, stills, GIFs, contact sheets)
//   node tools/build.mjs --stills   skip GIF frame capture/encode (fast visual pass)
//
// Requirements: Node 24+, local Chrome/Edge (headless), and the repo's
// design/.tools/node_modules/ffmpeg-static/ffmpeg.exe for GIF encoding.
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { KIT, FFMPEG } from './browser.mjs';

const run = promisify(execFile);
const STILLS_ONLY = process.argv.includes('--stills');
const OUT = path.join(KIT, 'out');
const TMP = path.join(KIT, 'build', 'tmp');
const CAPTURE = path.join(KIT, 'tools', 'capture.mjs');

const step = (msg) => console.log('\n=== ' + msg + ' ===');

async function capture(args) {
  const { stdout, stderr } = await run(process.execPath, [CAPTURE, ...args], { cwd: KIT });
  const text = (stdout + stderr).trim();
  if (text) console.log(text.split('\n').map((l) => '  ' + l).join('\n'));
}

async function frames(art, { fps = 20, duration = 5, size, out }) {
  await rm(path.join(TMP, out), { recursive: true, force: true });
  await capture(['frames', '--art', art, '--fps', String(fps), '--duration', String(duration), '--size', size, '--out', path.join('build/tmp', out)]);
}

async function gif(framesDir, target, { fps = 20, colors = 160 } = {}) {
  const input = path.join(TMP, framesDir, 'frame_%04d.png');
  await run(FFMPEG, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-framerate', String(fps),
    '-i', input,
    '-vf', `split[s0][s1];[s0]palettegen=max_colors=${colors}:stats_mode=diff[p];[s1][p]paletteuse=dither=none:diff_mode=rectangle`,
    '-loop', '0',
    target,
  ], { cwd: KIT });
  const info = await stat(target);
  console.log(`  ${path.relative(KIT, target)}  ${(info.size / 1048576).toFixed(2)} MB`);
}

async function main() {
  for (const dir of ['readme', 'social', 'site', 'app']) {
    await mkdir(path.join(OUT, dir), { recursive: true });
  }
  await mkdir(TMP, { recursive: true });

  step('1/7 sync official lockup + site hero');
  {
    const { stdout } = await run(process.execPath, [path.join(KIT, 'tools', 'sync-lockup.mjs')], { cwd: KIT });
    console.log(stdout.trim());
    const hero = await run(process.execPath, [path.join(KIT, 'tools', 'build-site-hero.mjs')], { cwd: KIT });
    console.log(hero.stdout.trim());
  }

  step('2/7 social banners (still)');
  const stills = [
    ['gh-social', '1280x640', 'out/social/github-social-1280x640.png', '0.9'],
    ['gh-social', '1280x640', 'out/social/github-social-1280x640-noslogan.png', '0.9'],
    ['x-header', '1500x500', 'out/social/x-header-1500x500.png', '0.9'],
    ['youtube', '2560x1440', 'out/social/youtube-2560x1440-safe-area.png', '0.9'],
    ['discord', '960x540', 'out/social/discord-960x540.png', '0.9'],
  ];
  for (const [art, size, out, t] of stills) {
    const extra = out.includes('noslogan') ? ['--slogan', '0'] : [];
    await capture(['still', '--art', art, '--t', t, '--size', size, '--out', out, ...extra]);
  }

  step('3/7 README hero (still fallbacks + animated GIF frames)');
  await capture(['still', '--art', 'readme-hero', '--t', '0.9', '--size', '1280x480', '--out', 'out/readme/manhunt-readme-hero-1280x480-static.png']);
  await capture(['still', '--art', 'readme-hero', '--t', '0.9', '--size', '1280x480', '--slogan', '0', '--out', 'out/readme/manhunt-readme-hero-noslogan-1280x480.png']);
  await capture(['still', '--art', 'gh-social', '--t', '0.9', '--size', '1280x640', '--slogan', '0', '--out', 'out/readme/manhunt-readme-hero-noslogan-1280x640.png']);

  step('4/7 app hero key frames (1080×480 = 360×160 dp @3x)');
  const taus = [0, 0.2, 0.4, 0.6, 0.8];
  for (let i = 0; i < taus.length; i++) {
    const t = taus[i] * 5;
    await capture([
      'still', '--art', 'app-banner', '--t', String(t), '--size', '1080x480',
      '--out', `out/app/manhunt-app-hero-1080x480-tau-${String(i * 20).padStart(2, '0')}.png`,
    ]);
  }

  step('5/7 site hero poster (reduced motion) + deterministic live still');
  await capture(['page', '--file', 'site-hero/site-hero.html', '--size', '1200x600', '--anim-time', '0.35', '--out', 'out/site/manhunt-site-hero-1200x600.png']);
  await capture(['page', '--file', 'site-hero/site-hero.html', '--size', '1200x600', '--reduce-motion', '--out', 'out/site/manhunt-site-hero-1200x600-poster.png']);

  if (!STILLS_ONLY) {
    step('6/7 animated variants (100 frames @ 20 fps, 5 s loop)');
    const anims = [
      ['readme-hero', '1280x480', 'frames-readme', 'out/readme/manhunt-readme-hero-1280x480.gif'],
      ['gh-social', '1280x640', 'frames-gh', 'out/social/github-social-1280x640.gif'],
      ['discord', '960x540', 'frames-discord', 'out/social/discord-960x540.gif'],
    ];
    for (const [art, size, dir, target] of anims) {
      await frames(art, { fps: 20, duration: 5, size, out: dir });
      await gif(dir, path.join(KIT, target));
    }
  }

  step('7/7 contact sheets');
  await capture(['page', '--file', 'banners/contact-sheet.html', '--size', '1600x1200', '--full-page', '--out', 'out/social/banners-contact-sheet.png']);
  await capture(['page', '--file', 'app/keyframes.html', '--size', '1600x1200', '--full-page', '--out', 'out/app/manhunt-app-hero-keyframes.png']);
  await capture(['page', '--file', 'banners/youtube-safe-area.html', '--size', '2560x1440', '--out', 'out/social/youtube-2560x1440-safe-area-guide.png']);

  console.log('\n=== build complete ===');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
