// Final ref cleanups (UTF-8 safe).
import { readFile, writeFile } from 'node:fs/promises';
const refs = 'C:/dev/ManHunt/design/redesign/refs/';

let board = await readFile(refs + 'direction-board.html', 'utf8');
board = board.replace('00 · THE BRIEF, IN THE OWNER\'S WORDS', 'THE BRIEF, IN THE OWNER\'S WORDS');
await writeFile(refs + 'direction-board.html', board, 'utf8');

let settings = await readFile(refs + 'settings.html', 'utf8');
settings = settings.replace('      <p class="caption">Updates install over the current app. Android will ask you to confirm once.</p>\n', '');
await writeFile(refs + 'settings.html', settings, 'utf8');

console.log('final ref cleanups applied');
