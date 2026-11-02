// Zero-dependency static preview server for the animation source.
//   node tools/serve.mjs            -> http://127.0.0.1:4173/src/index.html
//   node tools/serve.mjs 8081       -> custom port
// Open the printed URL in Chrome/Edge. The animation auto-plays when the page
// is NOT opened with ?capture=1; append ?t=5.6 for a frozen frame and
// ?guides=1 for the safe-area overlay. (?cover=1 shows the cover composition.)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const PORT = Number(process.argv[2] || 4173);
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ttf': 'font/ttf',
  '.json': 'application/json'
};

createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
    if (p === '/') p = '/src/index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(await readFile(file));
  } catch (e) {
    res.writeHead(500); res.end(String(e));
  }
}).listen(PORT, '127.0.0.1', () => {
  console.log(`ManHunt motion preview: http://127.0.0.1:${PORT}/src/index.html`);
  console.log(`frozen frame: http://127.0.0.1:${PORT}/src/index.html?t=5.6`);
  console.log(`safe area:    http://127.0.0.1:${PORT}/src/index.html?guides=1`);
});
