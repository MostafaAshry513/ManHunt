// Normalise the remaining illustrative examples to the 2-Prey "Riverside Run" scenario and honest timing.
import { readFile, writeFile, readdir } from 'node:fs/promises';
const root = 'C:/dev/ManHunt/design/redesign/';
const files = [];
for (const f of await readdir(root)) if (f.endsWith('.md')) files.push(root + f);
for (const f of await readdir(root + 'screens')) if (f.endsWith('.md')) files.push(root + 'screens/' + f);

const map = [
  ['PREY 2 / 3', 'PREY 2 / 2'],
  ['PREY 0 / 3', 'PREY 0 / 2'],
  ['Prey caught 3 / 3', 'Prey caught {n} / {total}'],
  ['"41:12 played"', '"{duration} played"'],
  ['Prey caught 3 / 3 · 41:12 played', 'Prey caught {n} / {total} · {duration} played'],
  ['All three prey were tagged.', 'Both prey were tagged.'],
  ['HUNTERS WIN.', 'Hunters win.'],
  ['PREY WIN.', 'Prey win.'],
  ['│ 41:12                              HUNTERS    │', '│ 18:48                              HUNTERS    │'],
  ['22:14', '20:46'],
  ['22:15', '20:47'],
  ['22:16', '20:48'],
  ['22:19', '20:50'],
  ['Nice. Two left.', 'Nice. One left.'],
];
for (const f of files) {
  let t = await readFile(f, 'utf8');
  const before = t;
  for (const [a, b] of map) t = t.split(a).join(b);
  if (t !== before) { await writeFile(f, t, 'utf8'); console.log('updated', f.replace(root, '')); }
}

// 08: make the score line explicitly derived + degrade.
const p = root + 'screens/08-result-and-history.md';
let s = await readFile(p, 'utf8');
s = s.replace('`display.m` or `board.meta` numerals: "Prey caught {n} / {total}", "{duration} played", zone at\n   finish if relevant. Real numbers only.',
  '`display.m` or `board.meta` numerals: "Prey caught {n} / {total}", "{duration} played", zone at\n   finish if relevant. Real numbers only; if the server cannot provide the totals, omit the derived line (see\n   the honest-degradation rule below).');
await writeFile(p, s, 'utf8');
console.log('08 score-line note added');
