/* Layout probe: measure key element boxes and detect clipped content. */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EnvSession, REPO } from '../../../env/lib/browser.mjs';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pages = process.argv.slice(2);
const list = pages.length ? pages : [
  'auth', 'roles', 'home', 'lobby', 'hunt-hunter', 'hunt-prey', 'chat', 'result',
  'history', 'settings', 'sheet-tag-claim', 'sheet-room-settings', 'lobby-rtl', 'home-light',
];

const s = await new EnvSession({}).start();
for (const id of list) {
  await s.page.goto(`http://127.0.0.1:${s.server.port}/design/ui-v2/directions/c-field-instrument/${id}.html`, { waitUntil: 'load' });
  await s.settle({ settleMs: 60 });
  const r = await s.page.evaluate(() => {
    const box = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return [Math.round(r.top), Math.round(r.bottom), Math.round(r.left), Math.round(r.right)];
    };
    const page = document.querySelector('.page').getBoundingClientRect();
    const all = [...document.querySelectorAll('.page *')];
    let maxBottom = 0, minTop = 999, maxRight = 0, minLeft = 999, worstBottom = '', worstRight = '';
    for (const el of all) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 && b.height === 0) continue;
      if (b.bottom > maxBottom) { maxBottom = b.bottom; worstBottom = el.className && el.className.baseVal !== undefined ? 'svg' : (el.className || el.tagName); }
      if (b.right > maxRight) { maxRight = b.right; worstRight = el.className || el.tagName; }
      if (b.top < minTop) minTop = b.top;
      if (b.left < minLeft) minLeft = b.left;
    }
    const overflowY = document.documentElement.scrollHeight;
    return { page: [Math.round(page.top), Math.round(page.bottom)], bezel: box('.bezel'), band: box('.band'), content: box('.content'), chart: box('.chart'), strip: box('.report-strip'), dock: box('.dock'), sheet: box('.sheet'), maxBottom: Math.round(maxBottom), minTop: Math.round(minTop), maxRight: Math.round(maxRight), minLeft: Math.round(minLeft), worstBottom, worstRight, overflowY };
  });
  const f = (n) => (n === null ? '-' : n.join(','));
  console.log(`${id.padEnd(19)} page[${f(r.page)}] bezel[${f(r.bezel)}] band[${f(r.band)}] chart[${f(r.chart)}] strip[${f(r.strip)}] dock[${f(r.dock)}] sheet[${f(r.sheet)}] maxBottom=${r.maxBottom}(${r.worstBottom}) maxRight=${r.maxRight} minLeft=${r.minLeft}`);
}
await s.close();
