// One-shot WIP renderer for the style tile (designer-a). Not part of the env deliverable.
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const file = process.argv[2] || 'style-tile.html';
  const out = process.argv[3] || 'style-tile.png';
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const url = 'file://' + path.resolve(file);
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(200);
  await page.screenshot({ path: out, fullPage: true });
  await browser.close();
  console.log('wrote', out);
})().catch(e => { console.error(e); process.exit(1); });
