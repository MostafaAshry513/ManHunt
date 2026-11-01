// Exact-pixel capture for the ManHunt motion kit.
//
//   node tools/capture.mjs still  --art readme-hero --t 0.9 --size 1280x480 --out out/readme/x.png [--slogan 0]
//   node tools/capture.mjs frames --art readme-hero --fps 20 --duration 5 --size 1280x480 --out build/tmp/readme
//   node tools/capture.mjs page   --file site-hero/site-hero.html --size 1200x600 --out out/site/x.png [--reduce-motion] [--full-page] [--anim-time 2.4]
//   node tools/capture.mjs eval   --file site-hero/site-hero.html --size 1200x600 --expr "document.title"
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { Session, KIT } from './browser.mjs';

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    } else {
      args._.push(token);
    }
  }
  return args;
}

function sizeOf(args) {
  const raw = String(args.size || '1280x480');
  const m = raw.match(/^(\d+)x(\d+)$/);
  if (!m) throw new Error('bad --size, expected WxH, got ' + raw);
  return { width: Number(m[1]), height: Number(m[2]) };
}

const outPath = (p) => (path.isAbsolute(p) ? p : path.join(KIT, p));

async function still(args) {
  const { width, height } = sizeOf(args);
  const art = args.art || 'readme-hero';
  const query = [`art=${encodeURIComponent(art)}`];
  if (args.slogan === '0') query.push('slogan=0');
  const session = await new Session({ width, height }).start();
  try {
    await session.navigate('/src/stage.html', { query: query.join('&'), waitMode: 'stage' });
    const t = Number(args.t == null ? 0.9 : args.t);
    await session.evaluate(`window.renderAt(${t})`);
    await session.screenshot(outPath(args.out));
    console.log(`[still] ${art} @ t=${t} -> ${args.out} (${width}x${height})`);
  } finally {
    await session.close();
  }
}

async function frames(args) {
  const { width, height } = sizeOf(args);
  const art = args.art || 'readme-hero';
  const fps = Number(args.fps || 20);
  const duration = Number(args.duration || 5);
  const total = Math.round(fps * duration);
  const outDir = outPath(args.out);
  await mkdir(outDir, { recursive: true });
  const query = [`art=${encodeURIComponent(art)}`];
  if (args.slogan === '0') query.push('slogan=0');
  const session = await new Session({ width, height }).start();
  try {
    await session.navigate('/src/stage.html', { query: query.join('&'), waitMode: 'stage' });
    const started = Date.now();
    for (let i = 0; i < total; i++) {
      await session.evaluate(`window.renderAt(${(i / fps).toFixed(5)})`);
      await session.screenshot(path.join(outDir, `frame_${String(i).padStart(4, '0')}.png`));
      if (i % 20 === 0 || i === total - 1) {
        process.stdout.write(`\r[frames] ${art} ${i + 1}/${total} ${((Date.now() - started) / 1000).toFixed(1)}s`);
      }
    }
    console.log(`\n[frames] ${art}: ${total} frames @ ${fps} fps -> ${args.out}`);
  } finally {
    await session.close();
  }
}

async function page(args) {
  const { width, height } = sizeOf(args);
  const session = await new Session({ width, height, reduceMotion: !!args['reduce-motion'] }).start();
  try {
    const file = args.file || '/site-hero/site-hero.html';
    const rel = file.startsWith('/') ? file : '/' + file;
    await session.navigate(rel, { waitMode: 'page' });
    if (args['anim-time'] != null) {
      // Deterministic still of a CSS animation: park every animation at the same
      // virtual time and pause it before the screenshot.
      const t = Number(args['anim-time']);
      await session.evaluate(`(() => {
        for (const anim of document.getAnimations()) {
          try { anim.currentTime = ${t} * 1000; anim.pause(); } catch (e) {}
        }
        return document.getAnimations().length;
      })()`);
    }
    if (args.expr) {
      const r = await session.evaluate(String(args.expr));
      console.log('[eval] ' + JSON.stringify(r.value));
    }
    if (args.out) {
      await session.screenshot(outPath(args.out), { fullPage: !!args['full-page'] });
      console.log(`[page] ${file} -> ${args.out} (${width}x${height}${args['full-page'] ? ' full-page' : ''})`);
    }
  } finally {
    await session.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const mode = args._[0];
  if (mode === 'still') return still(args);
  if (mode === 'frames') return frames(args);
  if (mode === 'page') return page(args);
  console.error('usage: node tools/capture.mjs <still|frames|page> [options]');
  process.exit(2);
}

main().catch((err) => { console.error(err); process.exit(1); });
