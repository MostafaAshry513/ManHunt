// One-shot repair of characters mangled by a PowerShell edit; writes UTF-8 without BOM.
import { readFile, writeFile } from 'node:fs/promises';

const refs = 'C:/dev/ManHunt/design/redesign/refs/';

let css = await readFile(refs + 'app.css', 'utf8');
css = css.replace('ManHunt redesign concept refs \u00E2\u20AC\u201D visual language', 'ManHunt redesign concept refs - visual language');
css = css.replace("content: '\u00C3\u2014';", "content: 'x';");
css = css.replace(/\n\.tag\.pre\u00D1\u0192 \{ --c: var\(--coral\); \}/g, '');
css = css.replace('\uFEFF', '');
// scoreline/nowrap fixes
css = css.replace('.scoreline { display: flex; align-items: baseline; gap: 10px; }',
  '.scoreline { display: flex; align-items: baseline; gap: 10px; flex-wrap: nowrap; }');
css = css.replace('.scoreline .big { font-family: var(--disp); font-weight: 700; font-size: 34px; line-height: 1; color: var(--chalk); }',
  '.scoreline .big { font-family: var(--disp); font-weight: 700; font-size: 34px; line-height: 1; color: var(--chalk); white-space: nowrap; }');
await writeFile(refs + 'app.css', css, 'utf8');

let parts = await readFile(refs + 'parts.js', 'utf8');
parts = parts.replace('\u00C2\u00A9 OpenStreetMap contributors', '\\u00A9 OpenStreetMap contributors');
parts = parts.replace('\uFEFF', '');
await writeFile(refs + 'parts.js', parts, 'utf8');

console.log('repaired app.css and parts.js');
