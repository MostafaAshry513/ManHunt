/* Round-2 verification probe: text floor, touch targets, clipping, canvas size. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EnvSession } from '../../../env/lib/browser.mjs';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = process.argv.slice(2);
const list = pages.length ? pages : [
  'auth', 'roles', 'home', 'lobby', 'hunt-hunter', 'hunt-prey', 'chat', 'result', 'history',
  'settings', 'sheet-tag-claim', 'sheet-room-settings', 'lobby-rtl', 'home-light',
  'state-paused', 'state-offline', 'state-eliminated',
];
const s = await new EnvSession({}).start();
for (const id of list) {
  await s.page.goto(`http://127.0.0.1:${s.server.port}/design/ui-v2/directions/c-field-instrument/${id}.html`, { waitUntil: 'load' });
  await s.settle({ settleMs: 60 });
  const r = await s.page.evaluate(() => {
    const pageEl = document.querySelector('.page');
    const pr = pageEl.getBoundingClientRect();
    const small = [];
    const targets = [];
    const clipped = [];
    const INTERACTIVE = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA']);
    const walk = (root) => {
      for (const el of root.querySelectorAll('*')) {
        const tag = el.tagName.toUpperCase();
        const b = el.getBoundingClientRect();
        if (b.width === 0 && b.height === 0) continue;
        // text floor: elements that directly contain a non-empty text node
        const directText = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(' ').trim();
        if (directText) {
          const fs = parseFloat(getComputedStyle(el).fontSize) || 0;
          if (fs > 0 && fs < 12) small.push({ cls: el.className || tag, fs, text: directText.slice(0, 40) });
        }
        // SVG text
        if (tag === 'TEXT') {
          const fs = parseFloat(el.getAttribute('font-size') || getComputedStyle(el).fontSize) || 0;
          if (fs > 0 && fs < 12) small.push({ cls: 'svg-text', fs, text: el.textContent.slice(0, 40) });
        }
        const interactive = INTERACTIVE.has(tag) || el.getAttribute('role') === 'switch' || el.classList.contains('text-action') || el.classList.contains('switch');
        if (interactive) {
          if (b.width < 47.5 || b.height < 47.5) targets.push({ tag, cls: el.className || '', w: Math.round(b.width), h: Math.round(b.height), text: (el.textContent || '').trim().slice(0, 30) });
        }
        // clipped text: text overflow hidden without ellipsis, or hard clip
        const cs = getComputedStyle(el);
        if (directText && cs.overflow === 'hidden' && (el.scrollWidth > el.clientWidth + 1) && cs.textOverflow !== 'ellipsis') {
          clipped.push({ cls: el.className || tag, sw: el.scrollWidth, cw: el.clientWidth, text: directText.slice(0, 40) });
        }
      }
    };
    walk(document);
    return {
      page: [Math.round(pr.width), Math.round(pr.height)],
      scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight],
      small, targets, clipped,
      below: Math.round(Math.max(...[...document.querySelectorAll('.page *')].map((e) => e.getBoundingClientRect().bottom))),
    };
  });
  const bad = r.small.length + r.targets.length + r.clipped.length + (r.page[0] !== 390 || r.page[1] !== 844 ? 1 : 0) + (r.scroll[0] > 391 || r.scroll[1] > 845 ? 1 : 0);
  console.log(`${bad ? 'FAIL' : 'OK  '} ${id.padEnd(19)} page=${r.page} scroll=${r.scroll} below=${r.below} small=${r.small.length} targets=${r.targets.length} clipped=${r.clipped.length}`);
  if (r.small.length) console.log('     small:', JSON.stringify(r.small.slice(0, 5)));
  if (r.targets.length) console.log('     targets:', JSON.stringify(r.targets.slice(0, 8)));
  if (r.clipped.length) console.log('     clipped:', JSON.stringify(r.clipped.slice(0, 5)));
}
await s.close();
