import { EnvSession } from '../../../env/lib/browser.mjs';
const [file, selector] = process.argv.slice(2);
const session = await new EnvSession({ colorScheme: 'dark' }).start();
try {
  await session.page.goto(session.baseUrl + '/design/ui-v2/directions/a-matchday-raised/' + file, { waitUntil: 'networkidle' });
  const out = await session.page.evaluate((sel) => {
    const res = [];
    document.querySelectorAll(sel).forEach((el) => {
      const r = el.getBoundingClientRect();
      res.push({ tag: el.tagName, cls: String(el.className).slice(0, 40), text: (el.textContent || '').trim().slice(0, 40), top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right) });
    });
    return res;
  }, selector || '.btn, .set-foot, .set-body');
  console.log(JSON.stringify(out, null, 1));
} finally { await session.close(); }
