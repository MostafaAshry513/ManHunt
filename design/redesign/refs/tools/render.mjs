// Render the ManHunt redesign concept refs to exact-pixel PNGs.
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { Session } from './browser.mjs';

const DESIGN = path.resolve(import.meta.dirname, '..', '..', '..'); // C:\dev\ManHunt\design
const REFS = path.resolve(import.meta.dirname, '..');
const OUT = path.join(REFS, 'out');

const phones = [
  ['auth.html', 'auth'],
  ['home.html', 'home'],
  ['home-light.html', 'home-light'],
  ['lobby.html', 'lobby'],
  ['lobby-rtl.html', 'lobby-rtl'],
  ['hunt.html', 'hunt'],
  ['chat.html', 'chat'],
  ['result.html', 'result'],
  ['settings.html', 'settings'],
];

async function main() {
  await mkdir(OUT, { recursive: true });
  const session = await new Session({ root: DESIGN, width: 411, height: 891, scale: 2, cdpPort: 9556 }).start();
  try {
    for (const [file, name] of phones) {
      await session.setViewport(411, 891, 2);
      await session.navigate(`/redesign/refs/${file}`);
      await session.screenshot(path.join(OUT, `${name}.png`));
      console.log(`[phone] ${file} -> out/${name}.png (822x1782)`);
    }
    // direction board
    await session.setViewport(1600, 1780, 1);
    await session.navigate('/redesign/refs/direction-board.html');
    await session.screenshot(path.join(OUT, 'direction-board.png'));
    console.log('[board] direction-board.html -> out/direction-board.png (1600x1780)');
  } finally {
    await session.close();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });


