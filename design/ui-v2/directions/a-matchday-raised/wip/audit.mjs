// designer-a WIP: round-2 self-audit (type floor, Arabic tracking, targets, clipping/overflow).
import { EnvSession } from '../../../env/lib/browser.mjs';
const files = process.argv.slice(2);
const session = await new EnvSession({ colorScheme: 'dark' }).start();
const base = '/design/ui-v2/directions/a-matchday-raised/';
const isArabic = (t) => /[\u0600-\u06FF]/.test(t);
try {
  for (const f of files) {
    await session.page.goto(session.baseUrl + base + f, { waitUntil: 'networkidle' });
    const r = await session.page.evaluate(() => {
      const isArabic = (t) => /[\u0600-\u06FF]/.test(t);
      const out = { under11: [], tracking: [], targets: [], over: [], clipped: [], pageH: document.documentElement.scrollHeight };
      const seen = new Set();
      document.querySelectorAll('.page *').forEach((el) => {
        const cs = getComputedStyle(el);
        // direct text content only
        let txt = '';
        el.childNodes.forEach((n) => { if (n.nodeType === 3) txt += n.textContent; });
        txt = txt.trim();
        const rect = el.getBoundingClientRect();
        if (txt && cs.visibility !== 'hidden' && cs.display !== 'none') {
          const fs = parseFloat(cs.fontSize);
          if (fs < 10.9 && !seen.has(el)) { seen.add(el); out.under11.push({ t: txt.slice(0, 24), fs }); }
        }
        // touch targets: interactive-ish elements
        if (/(btn|inline|icon-btn|map-btn|send-btn|tag-team|sw-hit|seg-cell|row-action|sw-label)/.test(String(el.className))) {
          if (rect.width > 0 && (rect.width < 47.5 || rect.height < 47.5)) out.targets.push({ c: String(el.className).slice(0, 26), w: Math.round(rect.width), h: Math.round(rect.height), t: txt.slice(0, 18) });
        }
        // Arabic tracking
        if (isArabic(txt) && cs.letterSpacing && cs.letterSpacing !== 'normal' && parseFloat(cs.letterSpacing) !== 0) {
          out.tracking.push({ t: txt.slice(0, 18), ls: cs.letterSpacing, c: String(el.className).slice(0, 22) });
        }
        // overflow / clipping (ignore svg internals)
        if (!el.closest('svg')) {
          if (rect.right > 390.5 || rect.bottom > 844.5 || rect.left < -0.5) out.over.push({ c: String(el.className).slice(0, 22), r: Math.round(rect.right), b: Math.round(rect.bottom) });
          if (el.scrollHeight - el.clientHeight > 2 && cs.overflow !== 'visible' && cs.overflow !== 'hidden') out.clipped.push({ c: String(el.className).slice(0, 22), sh: el.scrollHeight, ch: el.clientHeight });
        }
      });
      return out;
    });
    const uniq = (a) => [...new Map(a.map((x) => [JSON.stringify(x), x])).values()];
    console.log(`\n== ${f} pageH=${r.pageH} under11=${r.under11.length} targets=${r.targets.length} tracking=${r.tracking.length} over=${r.over.length} clip=${r.clipped.length}`);
    if (r.under11.length) console.log('  under11:', JSON.stringify(uniq(r.under11).slice(0, 8)));
    if (r.targets.length) console.log('  targets:', JSON.stringify(uniq(r.targets).slice(0, 8)));
    if (r.tracking.length) console.log('  tracking:', JSON.stringify(uniq(r.tracking).slice(0, 6)));
    if (r.over.length) console.log('  over:', JSON.stringify(uniq(r.over).slice(0, 6)));
  }
} finally { await session.close(); }
