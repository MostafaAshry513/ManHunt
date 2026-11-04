// Static file server shared by every tool in the design environment.
// Rooted at the repository so pages can reference `/design/...` brand fonts and
// marks with the same paths they use in production docs.
import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ENV_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// env/ -> ui-v2/ -> design/ -> repo root
export const WORKSTREAM = path.resolve(ENV_ROOT, '..');
export const DESIGN_ROOT = path.resolve(WORKSTREAM, '..');
export const REPO = path.resolve(DESIGN_ROOT, '..');

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wasm': 'application/wasm',
};

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Minimal directory index so a browser can click through the workstream. */
async function directoryListing(root, dirAbs, urlPath) {
  let entries = [];
  try {
    entries = await readdir(dirAbs, { withFileTypes: true });
  } catch {
    return null;
  }
  entries.sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1));
  const rows = entries
    .filter((e) => !e.name.startsWith('.'))
    .map((e) => {
      const href = urlPath.replace(/\/$/, '') + '/' + encodeURIComponent(e.name) + (e.isDirectory() ? '/' : '');
      return `<li><a href="${href}">${esc(e.name)}${e.isDirectory() ? '/' : ''}</a></li>`;
    })
    .join('\n');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(urlPath)}</title>
<style>body{background:#0B1220;color:#E6EDF7;font:14px/1.5 system-ui,sans-serif;margin:0;padding:40px 48px}
h1{font-size:18px;font-weight:600;color:#22D3EE;margin:0 0 4px}p{color:#8fa3bd;margin:0 0 24px}
ul{list-style:none;padding:0;margin:0}li{padding:6px 0;border-bottom:1px solid #1c2a40}
a{color:#E6EDF7;text-decoration:none}a:hover{color:#22D3EE}</style></head>
<body><h1>${esc(urlPath)}</h1><p>${esc(path.relative(REPO, dirAbs) || '.')}</p><ul>${rows}</ul></body></html>`;
}

/**
 * Start a static server.
 * @param {{root?: string, port?: number, host?: string, quiet?: boolean,
 *          indexHtml?: string | (() => string | Promise<string>)}} opts
 * @returns {Promise<{server: import('node:http').Server, port: number, root: string, close: () => Promise<void>}>}
 */
export function createStaticServer({ root = REPO, port = 0, host = '127.0.0.1', quiet = true, indexHtml = null } = {}) {
  const absRoot = path.resolve(root);
  const server = createServer(async (req, res) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { Allow: 'GET, HEAD' });
        res.end('method not allowed');
        return;
      }
      const url = new URL(req.url || '/', 'http://localhost');
      let rel = decodeURIComponent(url.pathname);
      if ((rel === '/' || rel === '/index.html') && indexHtml) {
        const html = typeof indexHtml === 'function' ? await indexHtml() : indexHtml;
        res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
        res.end(req.method === 'HEAD' ? undefined : html);
        return;
      }
      // Normalise and block traversal.
      rel = rel.replace(/\/+/g, '/');
      let file = path.resolve(absRoot, '.' + rel);
      const relCheck = path.relative(absRoot, file);
      if (relCheck.startsWith('..') || path.isAbsolute(relCheck)) {
        res.writeHead(403);
        res.end('forbidden');
        return;
      }
      let st;
      try {
        st = await stat(file);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404 not found: ' + rel);
        return;
      }
      if (st.isDirectory()) {
        if (!url.pathname.endsWith('/')) {
          res.writeHead(301, { Location: url.pathname + '/' + url.search });
          res.end();
          return;
        }
        const idx = path.join(file, 'index.html');
        if (existsSync(idx)) {
          file = idx;
          st = await stat(file);
        } else {
          const html = await directoryListing(absRoot, file, url.pathname);
          res.writeHead(html ? 200 : 403, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-store' });
          res.end(html || 'directory listing unavailable');
          return;
        }
      }
      const body = await readFile(file);
      res.writeHead(200, {
        'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'Content-Length': body.length,
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 ' + String(err && err.stack ? err.stack : err));
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, async () => {
      const actual = server.address().port;
      if (!quiet) console.log(`[static] ${absRoot} -> http://${host}:${actual}/`);
      resolve({
        server,
        port: actual,
        root: absRoot,
        close: () =>
          new Promise((r) => {
            server.closeAllConnections?.();
            server.close(() => r());
          }),
      });
    });
  });
}

/** Convert an absolute or repo-relative path to a server URL path. */
export function toUrlPath(target, root = REPO) {
  const abs = path.resolve(root, target);
  const rel = path.relative(root, abs);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`path is outside the server root (${root}): ${abs}`);
  }
  return '/' + rel.split(path.sep).join('/');
}
