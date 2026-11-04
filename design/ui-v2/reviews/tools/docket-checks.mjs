#!/usr/bin/env node
/**
 * Round-2 docket checks (reviewer-ux) — mechanical verification of `reviews/round-2-docket.md` items
 * that can be checked from the rendered pages/DOM. Read-only: loads pages over the repo-rooted static
 * server (brand fonts/Arabic need HTTP), evaluates page facts, and writes
 * `reviews/evidence/round2-docket-checks.json` + `.md`.
 *
 * Usage: node design/ui-v2/reviews/tools/docket-checks.mjs [--dirs a-matchday-raised,...]
 * Pair with `ux-audit.mjs --tag round2` for the measured a11y/type/RTL/overflow numbers.
 */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REVIEWS = path.resolve(HERE, '..');
const WORKSTREAM = path.resolve(REVIEWS, '..');
const REPO = path.resolve(WORKSTREAM, '../..');
const DIRECTIONS = path.join(WORKSTREAM, 'directions');
const EVIDENCE = path.join(REVIEWS, 'evidence');
const PLAYWRIGHT = path.join(WORKSTREAM, 'env/node_modules/playwright/index.mjs');
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(WORKSTREAM, 'env/.browsers');

const CANONICAL = ['auth','roles','home','lobby','hunt-hunter','hunt-prey','chat','result','history','settings','sheet-tag-claim','sheet-room-settings','lobby-rtl','home-light'];
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8', '.js':'text/javascript', '.mjs':'text/javascript',
  '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.ttf':'font/ttf', '.otf':'font/otf',
  '.woff':'font/woff', '.woff2':'font/woff2', '.json':'application/json', '.txt':'text/plain; charset=utf-8' };

const args = process.argv.slice(2);
const onlyDirs = (args[args.indexOf('--dirs') + 1] || '').split(',').map((s) => s.trim()).filter(Boolean);

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url, 'http://127.0.0.1');
        let file = path.normalize(path.join(REPO, decodeURIComponent(url.pathname)));
        if (!file.startsWith(REPO)) { res.writeHead(403); res.end('forbidden'); return; }
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        fs.createReadStream(file).pipe(res);
      } catch (e) { res.writeHead(500); res.end(String(e)); }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

function pngSize(file) {
  try {
    const b = fs.readFileSync(file);
    if (b.length < 24 || b.toString('ascii', 1, 4) !== 'PNG') return null;
    return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
  } catch { return null; }
}

function discover(dir) {
  const base = path.join(DIRECTIONS, dir);
  const found = new Map();
  for (const sub of ['', 'pages']) {
    const abs = path.join(base, sub);
    if (!fs.existsSync(abs)) continue;
    for (const f of fs.readdirSync(abs).filter((x) => x.endsWith('.html')).sort()) {
      const stem = f.replace(/\.html$/, '');
      if (!found.has(stem)) found.set(stem, sub ? `${sub}/${f}` : f);
    }
  }
  return found;
}

function readNotes(dir) {
  try { return fs.readFileSync(path.join(DIRECTIONS, dir, 'NOTES.md'), 'utf8'); } catch { return ''; }
}

/* facts gathered per page in the browser */
function pageFacts() {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const txt = (el) => norm(el.textContent);
  const rect = (el) => { const r = el.getBoundingClientRect(); return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
  const q = (sel) => Array.from(document.querySelectorAll(sel));
  const text = norm(document.body.innerText || '');
  const page = document.querySelector('.page') || document.body;
  const violet = (el) => {
    const f = (el.getAttribute && el.getAttribute('fill')) || '';
    let cf = ''; try { cf = getComputedStyle(el).fill || ''; } catch {}
    return /a79bff/i.test(f) || /a79bff/i.test(cf) || /167,\s*155,\s*255/i.test(f + cf);
  };
  const facts = {
    text,
    pageScrollHeight: page.scrollHeight,
    pageScrollWidth: page.scrollWidth,
    inputs: q('input, textarea').map((i) => ({ value: i.value || '', placeholder: i.placeholder || '', cls: i.className || '' })),
    codeCells: q('[class*="code-cell"]').map((c) => ({ text: txt(c), cls: c.className || '' })),
    hiddenText: q('.mh-sr-only,[class*="sr-only"],[hidden],[aria-hidden="true"]').map(txt).join(' | '),
    buttons: q('button,[role="button"],a[href]').map((b) => ({ text: txt(b).slice(0, 40), cls: b.className || '', ...rect(b) })),
    primaryBtns: q('[class*="btn-primary"],[class*="primary"]').map((b) => ({ text: txt(b).slice(0, 40), cls: b.className || '' })),
    violetInMap: q('svg circle, svg path, svg rect').filter(violet).filter((el) => el.closest('[class*="map"],[class*="chart"]')).length,
    violetAll: q('svg circle, svg path, svg rect, [class*="marker"]').filter(violet).length,
    dataCounters: q('[class*="data"],[class*="count"],[class*="num"]').map(txt).filter((t) => /^[0-9]{1,2}$/.test(t)),
    rows: q('[class*="m-row"],[class*="player"],[class*="team-row"],[class*="row"]').map(txt).filter(Boolean).slice(0, 60),
    clipped: q('*').filter((el) => {
      const cs = getComputedStyle(el);
      return /hidden|clip/.test(cs.overflowX + cs.overflowY) && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) && norm(el.textContent).length > 0;
    }).map((el) => txt(el).slice(0, 40)).slice(0, 10),
    smallTargets: q('button,[role="button"],a[href]').map((b) => ({ text: txt(b).slice(0, 30), ...rect(b) })).filter((b) => (b.w > 0 && b.h > 0) && (b.w < 47.5 || b.h < 47.5)),
  };
  facts.ip = /74\.208\.99\.178/.test(text);
  facts.answerIn = (text.match(/answer in/gi) || []).length;
  facts.proposal = /proposal/i.test(text);
  facts.gpsPlusMinus = /GPS\s*±|±\s*\d/i.test(text);
  facts.openArea = /OPEN AREA/i.test(text);
  facts.preyRemaining = (text.match(/PREY REMAINING/gi) || []).length;
  facts.inPlay = /IN PLAY/i.test(text);
  facts.zoneCentre = /Zone centre|Pick on map|Use my location/i.test(text);
  facts.standDown = /Stand down|Ready to hunt/i.test(text);
  facts.hostLine = (text.match(/HOSTED BY [A-Zا-ي]+/gi) || []).join(' | ');
  facts.playingAs = (text.match(/Playing as [A-Za-zا-ي]+/gi) || []).join(' | ');
  return facts;
}

async function main() {
  const server = await startServer();
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  const { chromium } = await import(PLAYWRIGHT);
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();

  const dirs = fs.readdirSync(DIRECTIONS, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name)
    .filter((d) => !onlyDirs.length || onlyDirs.includes(d)).sort();

  const report = { meta: { tool: 'reviewer-ux docket-checks', when: new Date().toISOString(), docket: 'reviews/round-2-docket.md' }, directions: {} };

  for (const dir of dirs) {
    const pages = discover(dir);
    const notes = readNotes(dir);
    const facts = {};
    for (const [stem, rel] of pages) {
      try {
        await page.goto(`${base}/design/ui-v2/directions/${dir}/${rel}`, { waitUntil: 'load', timeout: 30000 });
        await page.evaluate(async () => { await document.fonts.ready; });
        await page.waitForTimeout(140);
        facts[stem] = await page.evaluate(pageFacts);
      } catch (e) { facts[stem] = { error: String(e && e.message ? e.message : e) }; }
    }
    const out = path.join(DIRECTIONS, dir, 'out');
    const pngs = fs.existsSync(out) ? fs.readdirSync(out).filter((f) => f.endsWith('.png')) : [];
    const dims = Object.fromEntries(pngs.map((f) => [f.replace(/\.png$/, ''), pngSize(path.join(out, f))]));
    const extras = Object.keys(facts).filter((s) => !CANONICAL.includes(s));

    const checks = [];
    const add = (id, desc, status, evidence) => checks.push({ id, desc, status, evidence });
    const f = (stem) => facts[stem] || {};
    const ftext = (stem) => (facts[stem] && facts[stem].text) || '';

    /* ---- global gate ---- */
    const missingHtml = CANONICAL.filter((c) => !pages.has(c));
    const missingPng = CANONICAL.filter((c) => !dims[c]);
    const badPng = CANONICAL.filter((c) => dims[c] && (dims[c].w !== 1170 || dims[c].h !== 2532)).map((c) => `${c}:${dims[c].w}x${dims[c].h}`);
    add('G1', '14 canonical HTML + rendered PNG at exactly 1170x2532', (!missingHtml.length && !missingPng.length && !badPng.length) ? 'PASS' : 'FAIL',
      `html missing: ${missingHtml.join(',') || 'none'} | png missing: ${missingPng.join(',') || 'none'} | wrong dims: ${badPng.join(',') || 'none'} | extras: ${extras.length}`);
    add('G2', 'NOTES.md has a Review response section', /review response/i.test(notes) ? 'PASS' : 'FAIL', `notes bytes ${notes.length}`);
    const allText = Object.values(facts).filter((x) => x && x.text).map((x) => x.text).join(' ');
    const forbidden = ['10.0.2.2', 'lvh.me', 'lorem ipsum', '--:--'].filter((t) => allText.toLowerCase().includes(t.toLowerCase()));
    add('G3', 'No dev/fake strings across pages', forbidden.length ? 'FAIL' : 'PASS', forbidden.join(',') || 'none');
    const res = f('result').text || '';
    add('G4', 'Result seed honest (18:48 + prey 0/2)', /18:48/i.test(res) && /0\s*\/\s*2/i.test(res) ? 'PASS' : 'FAIL', res.slice(0, 120));
    const tooTall = CANONICAL.filter((c) => facts[c] && facts[c].pageScrollHeight > 846);
    add('G5', 'Canonical pages do not scroll past the 844 canvas', tooTall.length ? 'WARN' : 'PASS', tooTall.length ? tooTall.map((c) => `${c}:${facts[c].pageScrollHeight}`).join(',') : 'all <=846');
    const invented = [];
    if (facts['history'] && facts['history'].preyRemaining > 0) invented.push('history PREY REMAINING');
    if (f('hunt-hunter').inPlay) invented.push('hunt-hunter IN PLAY');
    if (f('hunt-prey').openArea) invented.push('hunt-prey OPEN AREA');
    if (f('home').gpsPlusMinus || f('home-light').gpsPlusMinus) invented.push('home GPS ±');
    const hasIp = Object.values(facts).some((x) => x && x.ip);
    if (hasIp) invented.push('real public IP');
    add('G6', 'No invented-data patterns (IP / survival scores / OPEN AREA / GPS±)', invented.length ? 'FAIL' : 'PASS', invented.join(', ') || 'none');

    /* ---- direction-specific docket items ---- */
    if (dir === 'a-matchday-raised') {
      const rr = f('result');
      const hasPlayAgain = /play again/i.test(rr.text || '');
      add('A1', 'Cap lift: unshipped rematch clearly labelled as proposal in the render', hasPlayAgain ? (rr.proposal ? 'PASS' : 'FAIL') : 'PASS', hasPlayAgain ? `proposal=${rr.proposal} | text:${(rr.text || '').match(/play again[^.]*/i)?.[0] || ''}` : 'no Play again affordance');
      const h = f('home'), hl = f('home-light');
      const filled = (x) => (x.codeCells || []).filter((c) => c.text && !/empty/.test(c.cls)).length;
      const hv = (x) => (x.inputs || []).map((i) => i.value).filter(Boolean).join('|');
      add('A2', 'home-light shows the same Home state as home (code cells/input values)', filled(h) === filled(hl) && hv(h) === hv(hl) ? 'PASS' : 'FAIL', `code filled dark=${filled(h)} light=${filled(hl)} | inputs dark="${hv(h)}" light="${hv(hl)}"`);
      const rs = ftext('sheet-room-settings');
      add('A3', 'Zone centre honest (no London/fake coords)', /51\.5007/.test(rs) ? 'FAIL' : (/40\.8|not set/i.test(rs) ? 'PASS' : 'WARN'), rs.match(/(zone centre[^<]{0,80})/i)?.[0] || rs.slice(0, 80));
      add('A4', 'Claim shows answer-in time', (f('sheet-tag-claim').answerIn || 0) > 0 ? 'PASS' : 'FAIL', `answer-in=${f('sheet-tag-claim').answerIn}`);
      add('A5', 'hunt-hunter has hidden per-prey status text', /nadia/i.test(f('hunt-hunter').hiddenText || '') && /rana/i.test(f('hunt-hunter').hiddenText || '') ? 'PASS' : 'FAIL', (f('hunt-hunter').hiddenText || '').slice(0, 120));
      add('A6', 'Extra paused state frame rendered', extras.some((s) => /paused/i.test(s)) && (dims[extras.find((s) => /paused/i.test(s))] ? true : false) ? 'PASS' : 'FAIL', `extras: ${extras.join(',') || 'none'}`);
      add('A7', 'No clipped history / room-rules bodies', (f('history').pageScrollHeight <= 846) && (f('sheet-room-settings').pageScrollHeight <= 846) ? 'PASS' : 'WARN', `history ${f('history').pageScrollHeight} | rules ${f('sheet-room-settings').pageScrollHeight}`);
    }
    if (dir === 'b-street-signal') {
      add('B1', 'hunt-hunter has no invented ally markers (violet only = own YOU)', (facts['hunt-hunter'].violetInMap || 0) <= 1 ? 'PASS' : 'FAIL', `violet map shapes=${facts['hunt-hunter'].violetInMap} all=${facts['hunt-hunter'].violetAll}`);
      const hist = ftext('history');
      add('B2', 'history has no per-match survival scores', !/PREY\s*[0-9]\s*\/\s*[0-9]/i.test(hist) ? 'PASS' : 'FAIL', (hist.match(/PREY\s*[0-9]\s*\/\s*[0-9]/gi) || []).join(','));
      const lob = f('lobby');
      const sideSwitch = /your side|change side|join prey|join hunters|switch side/i.test(lob.text || '')
        || (lob.buttons || []).some((b) => /^(prey|hunters|join prey|join hunters)$/i.test((b.text || '').trim()));
      add('B3', 'Lobby has host Ready/Stand down + side switch', lob.standDown && sideSwitch ? 'PASS' : 'FAIL', `standDown=${lob.standDown} sideSwitch=${sideSwitch}`);
      add('B4', 'Room-rules sheet has zone-centre / map-picker / use-my-location', f('sheet-room-settings').zoneCentre ? 'PASS' : 'FAIL', 'zoneCentre=' + f('sheet-room-settings').zoneCentre);
      add('B5', 'roles has no live-looking 2/3 counters', (f('roles').dataCounters || []).filter((x) => x === '2' || x === '3').length === 0 ? 'PASS' : 'FAIL', JSON.stringify(f('roles').dataCounters));
      add('B6', 'hunt-prey gutter no OPEN AREA contradiction', !f('hunt-prey').openArea ? 'PASS' : 'FAIL', 'openArea=' + f('hunt-prey').openArea);
      add('B7', 'Claim: consequence-first + answer-in time', f('sheet-tag-claim').answerIn > 0 && /tagged you/i.test(ftext('sheet-tag-claim')) ? 'PASS' : 'FAIL', `answerIn=${f('sheet-tag-claim').answerIn} taggedYou=${/tagged you/i.test(ftext('sheet-tag-claim'))}`);
      add('B8', 'settings fits the canvas', f('settings').pageScrollHeight <= 846 ? 'PASS' : 'FAIL', 'pageScrollHeight=' + f('settings').pageScrollHeight);
      add('B9', 'Extra eliminated/spectating frame rendered', extras.some((s) => /eliminat|spectat|tagged/i.test(s)) ? 'PASS' : 'FAIL', `extras: ${extras.join(',') || 'none'}`);
    }
    if (dir === 'c-field-instrument') {
      const rr = f('result');
      const rematchPrimary = (rr.primaryBtns || []).some((b) => /rematch/i.test(b.text)) || /rematch/i.test((rr.text || '').slice(0, 20));
      const backPrimary = (rr.primaryBtns || []).some((b) => /back to lobby/i.test(b.text));
      add('C1', 'Rematch demoted; Back to lobby is the primary', !rematchPrimary && backPrimary ? 'PASS' : 'FAIL', `rematchPrimary=${rematchPrimary} backPrimary=${backPrimary} primaries=${JSON.stringify((rr.primaryBtns || []).map((b) => b.text))}`);
      add('C2', 'history has no per-match PREY REMAINING', (f('history').preyRemaining || 0) === 0 ? 'PASS' : 'FAIL', 'preyRemaining=' + f('history').preyRemaining);
      add('C3', 'no real public IP anywhere', !Object.values(facts).some((x) => x && x.ip) ? 'PASS' : 'FAIL', Object.keys(facts).filter((k) => facts[k] && facts[k].ip).join(','));
      add('C4', 'Home pre-hunt readout has no invented live GPS', !f('home').gpsPlusMinus ? 'PASS' : 'FAIL', 'gps±=' + f('home').gpsPlusMinus);
      add('C5', 'No clipped names/labels in lobby', (f('lobby').clipped || []).length === 0 ? 'PASS' : 'FAIL', JSON.stringify((f('lobby').clipped || []).slice(0, 4)));
      add('C6', 'Rules/settings steppers + switches >=48 hit boxes', ((f('sheet-room-settings').smallTargets || []).length + (f('settings').smallTargets || []).length) === 0 ? 'PASS' : 'FAIL', JSON.stringify([...(f('sheet-room-settings').smallTargets || []).slice(0, 6), ...(f('settings').smallTargets || []).slice(0, 4)]));
      const want = ['paused', 'offline', 'eliminat'];
      add('C7', 'Three state extras rendered (paused/offline/eliminated)', want.filter((w) => extras.some((s) => s.toLowerCase().includes(w))).length >= 3 ? 'PASS' : 'FAIL', `extras: ${extras.join(',') || 'none'}`);
      const home = ftext('home'), lob = ftext('lobby'), lobRtl = ftext('lobby-rtl');
      const povOk = /playing as omar/i.test(home) && (/hosted by omar/i.test(lob) || (lob.includes('Omar') && /host/i.test(lob)));
      add('C8', 'POV identity consistent (Omar plays; host is Omar)', povOk ? 'PASS' : 'FAIL', `home:[${(home.match(/playing as \w+/i) || [''])[0]}] lobby:[${f('lobby').hostLine}] rtl has Omar=${/عمر/.test(lobRtl)}`);
    }

    report.directions[dir] = { pages: Object.keys(facts), extras, pngDims: dims, checks };
    for (const c of checks) console.log(`[${dir}] ${c.id} ${c.status} — ${c.desc} :: ${c.evidence}`);
  }

  fs.mkdirSync(EVIDENCE, { recursive: true });
  const outJson = path.join(EVIDENCE, 'round2-docket-checks.json');
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2));
  const lines = ['# Round-2 docket checks (reviewer-ux mechanical pass)', '', `Generated ${report.meta.when}`, ''];
  for (const [dir, d] of Object.entries(report.directions)) {
    lines.push(`## ${dir}`, '', `Pages: ${d.pages.length} | extras: ${d.extras.join(', ') || 'none'}`, '');
    lines.push('| id | status | check | evidence |'); lines.push('|---|---|---|---|');
    for (const c of d.checks) lines.push(`| ${c.id} | ${c.status} | ${c.desc} | ${String(c.evidence).replace(/\|/g, '\\|').slice(0, 160)} |`);
    lines.push('');
  }
  fs.writeFileSync(path.join(EVIDENCE, 'round2-docket-checks.md'), lines.join('\n'));
  await browser.close(); server.close();
  console.log(`\n[docket] wrote ${outJson}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
