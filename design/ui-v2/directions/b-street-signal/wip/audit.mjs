#!/usr/bin/env node
// Read-only self-audit for direction B: overflow, touch targets, sub-11px text, contrast vs effective bg.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(HERE, '..');
const REPO = '/root/ManHunt';
const WS = path.join(REPO, 'design/ui-v2');
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(WS, 'env/.browsers');
const { chromium } = await import(path.join(WS, 'env/node_modules/playwright/index.mjs'));

const MIME = { '.html':'text/html', '.css':'text/css', '.svg':'image/svg+xml', '.ttf':'font/ttf', '.png':'image/png', '.js':'text/javascript' };
const server = http.createServer((req,res)=>{
  const u = decodeURIComponent(req.url.split('?')[0]);
  const f = path.join(REPO, u);
  if (!f.startsWith(REPO) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nope'); }
  res.writeHead(200, {'content-type': MIME[path.extname(f)] || 'application/octet-stream'});
  fs.createReadStream(f).pipe(res);
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port = server.address().port;
const browser = await chromium.launch();
const pages = fs.readdirSync(path.join(DIR,'pages')).filter(f=>f.endsWith('.html')).sort();
const out = [];
for (const file of pages) {
  const page = await browser.newPage({ viewport:{width:390,height:844}, deviceScaleFactor:1 });
  await page.goto(`http://127.0.0.1:${port}/design/ui-v2/directions/b-street-signal/pages/${file}`);
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForTimeout(120);
  const data = await page.evaluate(() => {
    const px = v => parseFloat(v)||0;
    const parse = c => { const m=c.match(/rgba?\(([^)]+)\)/); if(!m) return null; const p=m[1].split(',').map(Number); return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}; };
    const lum = ({r,g,b}) => { const f=v=>{v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4)}; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
    const ratio = (a,b)=>{ const la=lum(a),lb=lum(b); return (Math.max(la,lb)+0.05)/(Math.min(la,lb)+0.05); };
    const bgOf = el => { let cur=el; while(cur && cur.nodeType===1){ const c=parse(getComputedStyle(cur).backgroundColor); if(c && c.a>0.5) return c; cur=cur.parentElement; } return {r:11,g:18,b:32,a:1}; };
    const tag = el => el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+(el.className && typeof el.className==='string'?'.'+el.className.trim().split(/\s+/).slice(0,3).join('.'):'');
    const res = { overflow:{w:document.querySelector('.page').scrollWidth,h:document.querySelector('.page').scrollHeight}, small:[], targets:[], contrast:[] };
    for (const el of document.querySelectorAll('.page *')) {
      const cs = getComputedStyle(el);
      if (cs.display==='none'||cs.visibility==='hidden') continue;
      const r = el.getBoundingClientRect();
      if (r.width===0&&r.height===0) continue;
      // leaf text nodes only
      const hasText = [...el.childNodes].some(n=>n.nodeType===3 && n.textContent.trim().length);
      if (hasText) {
        const size = px(cs.fontSize);
        if (size < 11) res.small.push({el:tag(el), size, text:el.textContent.trim().slice(0,42)});
        const fg = parse(cs.color); if (fg) { const bg = bgOf(el); const cr = ratio(fg,bg);
          const large = size>=24 || (size>=18.66 && parseInt(cs.fontWeight,10)>=700);
          const floor = size<12 ? 7 : (large?3:4.5);
          if (cr < floor) res.contrast.push({el:tag(el), size, cr:+cr.toFixed(2), floor, text:el.textContent.trim().slice(0,42)});
        }
      }
      if (el.matches('button, a, [role=radio], [role=switch], input, select, textarea') && !el.closest('[aria-hidden=true]')) {
        if (r.width < 48 || r.height < 48) res.targets.push({el:tag(el), w:Math.round(r.width), h:Math.round(r.height), text:(el.getAttribute('aria-label')||el.textContent||'').trim().slice(0,32)});
      }
    }
    return res;
  });
  out.push({ page:file.replace('.html',''), ...data });
  await page.close();
}
await browser.close(); server.close();
let bad=0;
for (const p of out) {
  const issues = p.small.length+p.targets.length+p.contrast.length+(p.overflow.w>390||p.overflow.h>844?1:0);
  if (!issues) continue; bad++;
  console.log(`\n== ${p.page} (overflow ${p.overflow.w}x${p.overflow.h})`);
  if (p.overflow.w>390||p.overflow.h>844) console.log('  overflow!');
  if (p.small.length) console.log('  sub-11px:', p.small.map(s=>`${s.size}px ${s.el} "${s.text}"`).join(' | '));
  if (p.targets.length) console.log('  <48dp:', p.targets.map(t=>`${t.w}x${t.h} ${t.el} "${t.text}"`).join(' | '));
  if (p.contrast.length) console.log('  contrast:', p.contrast.map(c=>`${c.cr}<${c.floor} ${c.size}px ${c.el} "${c.text}"`).join(' | '));
}
console.log(`\n[audit] ${bad}/${out.length} pages with issues`);
fs.writeFileSync(path.join(HERE,'audit-b.json'), JSON.stringify(out,null,1));
