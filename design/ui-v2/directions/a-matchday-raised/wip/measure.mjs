// designer-a WIP: measure rendered page overflow / element extents against the 390x844 canvas.
import { EnvSession } from '../../../env/lib/browser.mjs';
const files = process.argv.slice(2);
const session = await new EnvSession({ colorScheme: 'dark' }).start();
const base = '/design/ui-v2/directions/a-matchday-raised/';
try {
  for (const f of files) {
    await session.page.goto(session.baseUrl + base + f, { waitUntil: 'networkidle' });
    const info = await session.page.evaluate(() => {
      const page = document.querySelector('.page');
      const pr = page.getBoundingClientRect();
      const out = [];
      document.querySelectorAll('.page *').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.height === 0 && r.width === 0) return;
        if (r.bottom > 844.5 || r.top < -0.5 || r.right > 390.5) {
          out.push({ tag: el.tagName.toLowerCase(), cls: (el.className || '').toString().slice(0, 40), top: Math.round(r.top), bottom: Math.round(r.bottom), right: Math.round(r.right) });
        }
      });
      return { pageHeight: pr.height, scrollH: document.documentElement.scrollHeight, overflow: out.slice(0, 14) };
    });
    console.log(f, 'pageH=', info.pageHeight, 'scrollH=', info.scrollH);
    for (const o of info.overflow) console.log('   OVER', JSON.stringify(o));
  }
} finally { await session.close(); }
