#!/usr/bin/env node
/**
 * reviewer-ux measurement audit for the ManHunt UI/UX v2 direction pages.
 *
 * Read-only: loads each direction page through a local static server rooted at the repo
 * (brand fonts / Arabic face / marks need HTTP, per env/README.md §3), measures the things a
 * rendered PNG cannot tell you, and writes evidence JSON + a markdown digest to
 * design/ui-v2/reviews/evidence/. It never edits designer files.
 *
 * Usage (from repo root):
 *   node design/ui-v2/reviews/tools/ux-audit.mjs                     # all directions, default checks
 *   node design/ui-v2/reviews/tools/ux-audit.mjs --dirs a-matchday-raised,b-street-signal
 *   node design/ui-v2/reviews/tools/ux-audit.mjs --stress            # + 320dp and 200% text approximations
 *   node design/ui-v2/reviews/tools/ux-audit.mjs --only home.html,lobby.html
 *
 * Output: design/ui-v2/reviews/evidence/ux-audit.json
 *         design/ui-v2/reviews/evidence/ux-audit-summary.md
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
// Chromium lives in the env's own browser cache (env/package.json install-browser script).
process.env.PLAYWRIGHT_BROWSERS_PATH = path.join(WORKSTREAM, 'env/.browsers');

const SEED_EXPECTED = {
  auth: [], roles: [], home: [], 'home-light': [],
  lobby: ['Riverside Run', 'K7M2QX', 'Nadia', 'Omar', 'Selim', 'Rana', 'Youssef'],
  'hunt-hunter': ['Riverside Run', '240', '41:12'],
  'hunt-prey': ['Riverside Run', '240', '41:12'],
  chat: ['Omar'],
  result: ['18:48', '0 / 2'],
  history: ['Riverside Run'],
  settings: [],
  'sheet-tag-claim': ['Omar'],
  'sheet-room-settings': ['240'],
  'lobby-rtl': ['K7M2QX'],
};

const CANONICAL = [
  'auth', 'roles', 'home', 'lobby', 'hunt-hunter', 'hunt-prey', 'chat', 'result',
  'history', 'settings', 'sheet-tag-claim', 'sheet-room-settings', 'lobby-rtl', 'home-light',
];

const args = process.argv.slice(2);
function flag(name) { return args.includes(name); }
function opt(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : null;
}
const onlyDirs = (opt('--dirs') || '').split(',').map((s) => s.trim()).filter(Boolean);
const onlyPages = (opt('--only') || '').split(',').map((s) => s.trim()).filter(Boolean);
const STRESS = flag('--stress');
const QUIET = flag('--quiet');
const TAG = opt('--tag') || '';

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url, 'http://127.0.0.1');
        let file = path.normalize(path.join(REPO, decodeURIComponent(url.pathname)));
        if (!file.startsWith(REPO)) { res.writeHead(403); res.end('forbidden'); return; }
        if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        if (!fs.existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
        res.writeHead(200, {
          'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
          'Cache-Control': 'no-store',
        });
        fs.createReadStream(file).pipe(res);
      } catch (e) {
        res.writeHead(500); res.end(String(e));
      }
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

/* ---------------------------------------------------------------- in-page collect */
function collectInPage() {
  const out = {
    page: {}, contrast: [], smallText: [], targets: [], overflow: [], clippedText: [],
    borders: [], fonts: {}, directionality: {}, colors: {}, seed: {}, forbidden: [],
    headings: [], landmarks: [], a11y: {},
  };

  const parseColor = (str) => {
    if (!str) return null;
    const m = String(str).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (src, dst) => ({
    r: src.r * src.a + dst.r * (1 - src.a),
    g: src.g * src.a + dst.g * (1 - src.a),
    b: src.b * src.a + dst.b * (1 - src.a),
    a: src.a + dst.a * (1 - src.a),
  });
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
  const contrast = (a, b) => {
    const la = lum(a), lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };
  const compositeText = (fg, bg) => over(fg, bg);
  const fmt = (c) => `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`;

  const visible = (el) => {
    if (!el || el.nodeType !== 1) return false;
    if (el.closest('[aria-hidden="true"]')) return false;
    let n = el;
    while (n && n.nodeType === 1) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) === 0) return false;
      if (n.classList && n.classList.contains('mh-sr-only')) return false;
      n = n.parentElement;
    }
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const effBg = (el) => {
    const chain = [];
    let n = el;
    while (n && n.nodeType === 1) { chain.push(n); n = n.parentElement; }
    let base = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = chain.length - 1; i >= 0; i--) {
      const cs = getComputedStyle(chain[i]);
      const c = parseColor(cs.backgroundColor);
      if (c && c.a > 0) base = over(c, base);
    }
    return base;
  };
  const sel = (el) => {
    if (!el || el.nodeType !== 1) return '?';
    const parts = [];
    let n = el;
    let depth = 0;
    while (n && n.nodeType === 1 && depth < 3) {
      let s = n.tagName.toLowerCase();
      if (n.id) { s += '#' + n.id; parts.unshift(s); break; }
      const cls = (n.className && typeof n.className === 'string')
        ? n.className.trim().split(/\s+/).filter(Boolean).slice(0, 2) : [];
      if (cls.length) s += '.' + cls.join('.');
      parts.unshift(s);
      n = n.parentElement; depth++;
    }
    return parts.join(' > ');
  };

  /* page-level facts */
  const html = document.documentElement;
  const body = document.body;
  out.page = {
    title: document.title || '',
    lang: html.getAttribute('lang') || '',
    dir: html.getAttribute('dir') || getComputedStyle(html).direction,
    theme: html.dataset.theme || '',
    pageCount: document.querySelectorAll('.page').length,
    pageRect: (() => { const p = document.querySelector('.page'); if (!p) return null; const r = p.getBoundingClientRect(); return { w: r.width, h: r.height }; })(),
    scroll: { w: body.scrollWidth, h: body.scrollHeight },
    viewport: { w: window.innerWidth, h: window.innerHeight },
  };
  out.headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => ({ tag: h.tagName, text: (h.textContent || '').trim().slice(0, 80) }));
  out.landmarks = [...document.querySelectorAll('main,header,footer,nav,section[aria-label],aside')].map((e) => e.tagName.toLowerCase()).slice(0, 30);

  /* text nodes / contrast / sizes */
  const textParents = new Map();
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const t = (node.nodeValue || '').replace(/\s+/g, ' ').trim();
    if (!t) continue;
    const el = node.parentElement;
    if (!el || !visible(el)) continue;
    // decorative separators (· — / | ·) carry no information; skip noise
    if (t.length <= 3 && /^[·—\-–\/|.+:,()\s]+$/.test(t)) continue;
    if (!textParents.has(el)) textParents.set(el, []);
    textParents.get(el).push(t);
  }
  const isDisabled = (el) => {
    let n = el;
    while (n && n.nodeType === 1) {
      if (n.disabled === true || n.getAttribute('aria-disabled') === 'true' || n.hasAttribute('data-disabled') ||
          (n.classList && [...n.classList].some((c) => /disabled|is-disabled|btn-disabled|inactive/.test(c)))) return true;
      n = n.parentElement;
    }
    return false;
  };
  for (const [el, texts] of textParents) {
    const cs = getComputedStyle(el);
    const fg = parseColor(cs.color);
    if (!fg) continue;
    const bg = effBg(el);
    const fgEff = compositeText(fg, bg);
    const ratio = contrast(fgEff, bg);
    const fontSize = parseFloat(cs.fontSize);
    const weight = parseInt(cs.fontWeight, 10) || 400;
    const large = fontSize >= 24 || (fontSize >= 18.66 && weight >= 700);
    const disabled = isDisabled(el);
    const rule = large ? 'AA-large' : (fontSize <= 12 ? 'metadata-7' : 'AA-body');
    const required = rule === 'AA-large' ? 3 : (rule === 'metadata-7' ? 7 : 4.5);
    const text = texts.join(' / ').slice(0, 90);
    if (ratio + 0.005 < required) {
      out.contrast.push({
        sel: sel(el), text, ratio: +ratio.toFixed(2), required, rule, color: fmt(fgEff), bg: fmt(bg),
        fontSize, weight, disabled,
        note: disabled ? 'disabled state — WCAG AA exempt, legibility note only' : 'computed; verify against screenshot',
      });
    }
    if (fontSize < 14) {
      const mono = /mono/i.test(cs.fontFamily);
      out.smallText.push({
        sel: sel(el), text, size: +fontSize.toFixed(1), weight, mono,
        // brief: body >=14 sp eq, auxiliary >=12; <12 is a hard floor breach, 12-13.9 must be
        // a legitimate auxiliary/mono-data role, not body copy.
        class: fontSize < 11 ? 'hard' : 'aux-or-body',
      });
    }
    const family = cs.fontFamily;
    out.fonts[family] = (out.fonts[family] || 0) + 1;
  }

  /* touch targets */
  const targetSel = 'button,a[href],input,select,textarea,summary,[role="button"],[role="tab"],[role="switch"],[role="checkbox"],[role="radio"],[role="option"],[role="link"],[onclick]';
  const seen = new Set();
  const candidates = [...document.querySelectorAll(targetSel)];
  const SVG_TAGS = new Set(['svg', 'path', 'use', 'g', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'defs', 'clippath', 'mask', 'lineargradient', 'stop', 'text', 'tspan']);
  for (const el of document.querySelectorAll('body *')) {
    if (seen.has(el) || !visible(el)) continue;
    if (SVG_TAGS.has(el.tagName.toLowerCase()) || el.closest('svg')) continue;
    if (getComputedStyle(el).cursor === 'pointer') candidates.push(el);
  }
  for (const el of candidates) {
    if (!visible(el) || seen.has(el)) continue;
    if (SVG_TAGS.has(el.tagName.toLowerCase()) || el.closest('svg')) continue;
    // a nested clickable inside a real control is not an independent target
    if (el.parentElement && el.parentElement.closest(targetSel)) continue;
    seen.add(el);
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const inlineLink = el.tagName === 'A' && cs.display.startsWith('inline');
    // effective box: intersect with every ancestor that clips overflow (overflow hidden/clip parents
    // reduce the actual hit area — a 48px cell inside a 38px clipped container is a 38px target)
    let eff = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    let a2 = el.parentElement;
    let wrapper48 = false;
    while (a2 && a2 !== document.body) {
      const acs = getComputedStyle(a2);
      const ar = a2.getBoundingClientRect();
      // a larger interactive wrapper can legitimately provide the touch target
      if (!wrapper48 && ar.width >= 47.5 && ar.height >= 47.5 &&
          (/hit|wrap|touch/.test(String(a2.className)) || a2.getAttribute('role') || a2.tagName === 'BUTTON' || a2.tagName === 'LABEL')) {
        wrapper48 = true;
      }
      if (/hidden|clip/.test(acs.overflowX + acs.overflowY)) {
        eff = { left: Math.max(eff.left, ar.left), top: Math.max(eff.top, ar.top), right: Math.min(eff.right, ar.right), bottom: Math.min(eff.bottom, ar.bottom) };
      }
      a2 = a2.parentElement;
    }
    const ew = Math.max(0, eff.right - eff.left), eh = Math.max(0, eff.bottom - eff.top);
    const ok = (ew >= 47.5 && eh >= 47.5) || wrapper48;
    out.targets.push({
      sel: sel(el), tag: el.tagName.toLowerCase(), inlineLink,
      text: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      w: +r.width.toFixed(1), h: +r.height.toFixed(1),
      effW: +ew.toFixed(1), effH: +eh.toFixed(1), wrapper48,
      ok,
      top: +r.top.toFixed(1), left: +r.left.toFixed(1),
    });
  }

  /* overflow / clipping / out-of-canvas */
  const pageRect = out.page.pageRect || { w: 390, h: 844 };
  for (const el of [html, body, ...document.querySelectorAll('*')]) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const isPageRoot = el === html || el === body || (el.classList && el.classList.contains('page'));
    if (isPageRoot) {
      if (el.scrollHeight > 845) out.overflow.push({ kind: 'page-scroll', sel: sel(el), detail: `scrollHeight ${el.scrollHeight} > 844` });
      if (el.scrollWidth > 391) out.overflow.push({ kind: 'page-scroll-x', sel: sel(el), detail: `scrollWidth ${el.scrollWidth} > 390` });
    }
    const r = el.getBoundingClientRect();
    // elements with real area that extend outside the page canvas (skip SVG internals and
    // content deliberately clipped by an ancestor — a map/tile bleed is not a layout bug)
    if (!isPageRoot && r.width > 1 && r.height > 1 && !el.closest('svg')) {
      let clippedByAncestor = false;
      let a = el.parentElement;
      while (a && a !== document.body) {
        const acs = getComputedStyle(a);
        if (/hidden|clip/.test(acs.overflowX) || /hidden|clip/.test(acs.overflowY)) { clippedByAncestor = true; break; }
        a = a.parentElement;
      }
      const overRight = r.right > 391, overLeft = r.left < -1, overBottom = r.bottom > 845, overTop = r.top < -1;
      if (!clippedByAncestor && (overRight || overLeft || overBottom || overTop)) {
        out.overflow.push({ kind: 'out-of-canvas', sel: sel(el), detail: `rect ${r.left.toFixed(0)},${r.top.toFixed(0)} ${r.width.toFixed(0)}x${r.height.toFixed(0)}` });
      }
    }
    const hiddenX = /hidden|clip/.test(cs.overflowX), hiddenY = /hidden|clip/.test(cs.overflowY);
    if ((hiddenX && el.scrollWidth > el.clientWidth + 1) || (hiddenY && el.scrollHeight > el.clientHeight + 1)) {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70);
      if (t) out.clippedText.push({ sel: sel(el), text: t, detail: `${el.scrollWidth}x${el.scrollHeight} in ${el.clientWidth}x${el.clientHeight}` });
    }
    if (cs.whiteSpace === 'nowrap' && el.scrollWidth > el.clientWidth + 1 && (el.textContent || '').trim()) {
      out.clippedText.push({ sel: sel(el), text: (el.textContent || '').trim().slice(0, 70), detail: 'nowrap overflow' });
    }
  }

  /* fixed-height text containers (200% trap) */
  // detected via clippedText + later stress pass; record explicit px heights on text holders
  for (const [el, texts] of textParents) {
    const cs = getComputedStyle(el);
    if (cs.height.endsWith('px') && texts.join('').length > 3) {
      const r = el.getBoundingClientRect();
      if (r.height < parseFloat(cs.fontSize) * 1.6 && parseFloat(cs.fontSize) >= 12) {
        out.overflow.push({ kind: 'tight-box', sel: sel(el), detail: `h ${r.height.toFixed(1)} font ${cs.fontSize}` });
      }
    }
  }

  /* non-text boundaries: inputs/buttons outlines for 3:1 (informative) */
  for (const el of document.querySelectorAll('input,button,[role="button"],.plate,[class*="card"]')) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const bg = effBg(el.parentElement || el);
    const bc = parseColor(cs.borderTopColor);
    if (bc && cs.borderTopWidth !== '0px' && bc.a > 0.1) {
      const ratio = contrast(compositeText(bc, bg), bg);
      if (ratio < 2.9) out.borders.push({ sel: sel(el), ratio: +ratio.toFixed(2), color: fmt(bc), bg: fmt(bg) });
    }
  }

  /* fonts */
  const faces = [];
  for (const f of document.fonts) faces.push({ family: f.family, weight: f.weight, status: f.status });
  out.fonts = { used: out.fonts, faces, failures: faces.filter((f) => f.status === 'error').length, loaded: faces.filter((f) => f.status === 'loaded').length };

  /* directionality */
  let rtlCount = 0;
  for (const el of document.querySelectorAll('*')) {
    if (getComputedStyle(el).direction === 'rtl') rtlCount++;
  }
  const physical = [];
  const props = /^(left|right|margin-left|margin-right|padding-left|padding-right|border-left|border-right|border-left-width|border-right-width|text-align)$/;
  for (const sheet of document.styleSheets) {
    let rules;
    try { rules = sheet.cssRules; } catch { continue; }
    const sheetName = sheet.href ? new URL(sheet.href).pathname.split('/').pop() : 'inline';
    for (const rule of rules) {
      if (!rule.style) continue;
      for (const prop of rule.style) {
        if (!props.test(prop)) continue;
        const value = rule.style.getPropertyValue(prop);
        if (!value || value === 'auto' || value === 'initial' || value === 'inherit' || value === 'unset') continue;
        if (/^0(px|dp|rem|em|%)?$/.test(value.trim()) || value === 'none') continue;
        if (prop === 'text-align' && (value === 'center' || value === 'start' || value === 'end' || value === 'justify')) continue;
        if ((rule.selectorText || '').includes('mh-sr-only')) continue;
        physical.push({ prop, value, selector: (rule.selectorText || '').slice(0, 90), sheet: sheetName });
      }
    }
  }
  const physicalBySheet = physical.reduce((a, r) => { a[r.sheet] = (a[r.sheet] || 0) + 1; return a; }, {});
  const rtlUnisolated = [];
  if ((out.page.dir || '').toLowerCase() === 'rtl') {
    const w2 = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n2;
    while ((n2 = w2.nextNode())) {
      const t = (n2.nodeValue || '').trim();
      if (!/^[A-Z0-9:.,\/\- ]{2,}$/.test(t)) continue;
      const el = n2.parentElement;
      if (!el) continue;
      const isolated = (() => {
        let a = el;
        while (a && a.nodeType === 1) {
          const cs = getComputedStyle(a);
          if (a.matches('[dir="ltr"],.mh-ltr,.ltr,[dir="auto"]')) return true;
          if (/isolate/.test(cs.unicodeBidi || '')) return true;
          if (cs.direction === 'ltr' && /isolate/.test(cs.unicodeBidi || '')) return true;
          a = a.parentElement;
        }
        return false;
      })();
      if (isolated) continue;
      rtlUnisolated.push({ text: t.slice(0, 40), sel: sel(el) });
      if (rtlUnisolated.length > 25) break;
    }
  }
  out.directionality = { htmlDir: out.page.dir, rtlElements: rtlCount, physical, physicalBySheet, ltrIsolations: document.querySelectorAll('[dir="ltr"],.mh-ltr').length, rtlUnisolated };

  /* colour usage classifier (brand roles, one-cyan-surface rule) */
  const near = (c, hex, tol = 26) => {
    const t = parseColor(`rgb(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)})`);
    return Math.abs(c.r - t.r) < tol && Math.abs(c.g - t.g) < tol && Math.abs(c.b - t.b) < tol;
  };
  const cyans = { dark: '#22D3EE', light: '#0C6B84' }, cor = { dark: '#FF7A59', light: '#B33A0F' }, vio = { dark: '#A79BFF', light: '#5B21B6' };
  const themeKey = (document.documentElement.dataset.theme || 'dark') === 'light' ? 'light' : 'dark';
  out.colors = { cyanFills: 0, cyanSurfaces: 0, cyanAccents: 0, cyanText: 0, coralText: 0, violetText: 0, distinctFills: {}, cyanSurfaceList: [] };
  for (const el of document.querySelectorAll('*')) {
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    const bg = parseColor(cs.backgroundColor);
    if (bg && bg.a > 0.5) {
      const r = el.getBoundingClientRect();
      const area = r.width * r.height;
      if (near(bg, cyans[themeKey])) {
        out.colors.cyanFills++;
        if (area >= 600) { out.colors.cyanSurfaces++; out.colors.cyanSurfaceList.push({ sel: sel(el), text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40), area: Math.round(area) }); }
        else out.colors.cyanAccents++;
      }
      const key = `${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)}`;
      out.colors.distinctFills[key] = (out.colors.distinctFills[key] || 0) + 1;
      if (near(bg, cor[themeKey])) out.colors.coralFills = (out.colors.coralFills || 0) + 1;
      if (near(bg, vio[themeKey])) out.colors.violetFills = (out.colors.violetFills || 0) + 1;
    }
    const fg = parseColor(cs.color);
    if (fg && (el.textContent || '').trim()) {
      if (near(fg, cyans[themeKey])) out.colors.cyanText++;
      if (near(fg, cor[themeKey])) out.colors.coralText++;
      if (near(fg, vio[themeKey])) out.colors.violetText++;
    }
  }

  /* CSS technique scan — what Compose cannot take as-is (CSSRuleList is Array-like: index loops) */
  const tech = { filter: [], backdropFilter: [], blend: [], gradient: [], boxShadow: [], textShadow: [], mask: [], clipPath: [], animation: [] };
  const sheetNameOf = (sheet) => sheet.href ? new URL(sheet.href).pathname.split('/').pop() : 'inline';
  const scanRules = (list, sheetName) => {
    for (let i = 0; i < list.length; i++) {
      const rule = list[i];
      if (rule.cssRules && rule.cssRules.length) { scanRules(rule.cssRules, sheetName); continue; }
      if (!rule.style) continue;
      const push = (arr, prop) => {
        const v = rule.style.getPropertyValue(prop);
        if (v && v !== 'none' && v !== 'normal') arr.push({ sheet: sheetName, prop, value: String(v).slice(0, 60), selector: String(rule.selectorText || '').slice(0, 70) });
      };
      push(tech.filter, 'filter'); push(tech.backdropFilter, 'backdrop-filter');
      push(tech.blend, 'mix-blend-mode'); push(tech.boxShadow, 'box-shadow'); push(tech.textShadow, 'text-shadow');
      push(tech.mask, 'mask-image'); push(tech.mask, '-webkit-mask-image'); push(tech.clipPath, 'clip-path');
      push(tech.animation, 'animation');
      const bg = rule.style.getPropertyValue('background') || rule.style.getPropertyValue('background-image');
      if (bg && /gradient/.test(bg)) tech.gradient.push({ sheet: sheetName, value: String(bg).slice(0, 70), selector: String(rule.selectorText || '').slice(0, 70) });
    }
  };
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
    scanRules(rules, sheetNameOf(sheet));
  }
  out.techniques = Object.fromEntries(Object.entries(tech).map(([k, v]) => [k, { count: v.length, samples: v.slice(0, 6) }]));

  /* Arabic typography checks on RTL proof pages */
  out.arabic = { textNodes: 0, latinDisplayFace: [], tracking: [], upper: [], fonts: {} };
  const ARABIC_RE = new RegExp('[\u0600-\u06FF]');
  if ((out.page.dir || '').toLowerCase() === 'rtl' || out.page.lang === 'ar') {
    for (const [el, texts] of textParents) {
      const joined = texts.join(' ');
      if (!ARABIC_RE.test(joined)) continue;
      out.arabic.textNodes++;
      const cs = getComputedStyle(el);
      const fam = cs.fontFamily;
      out.arabic.fonts[fam] = (out.arabic.fonts[fam] || 0) + 1;
      if (/Big Shoulders|Instrument Sans|Red Hat Mono/i.test(fam) && !/IBM Plex/i.test(fam)) {
        out.arabic.latinDisplayFace.push({ sel: sel(el), text: joined.slice(0, 40), family: fam.slice(0, 60) });
      }
      const ls = parseFloat(cs.letterSpacing);
      if (!isNaN(ls) && ls !== 0) out.arabic.tracking.push({ sel: sel(el), letterSpacing: cs.letterSpacing, text: joined.slice(0, 30) });
      if (cs.textTransform === 'uppercase') out.arabic.upper.push({ sel: sel(el), text: joined.slice(0, 30) });
    }
  }

  /* seed data + forbidden strings */
  const text = (body.innerText || '').replace(/\s+/g, ' ');
  const seedTokens = ['Riverside Run', 'K7M2QX', '240', '41:12', '60:00', '18:48', '0 / 2', 'Nadia', 'Omar', 'Selim', 'Rana', 'Youssef'];
  const seedExpected = {
    auth: [], roles: [], home: ['Nadia'],
    lobby: ['Riverside Run', 'K7M2QX', 'Nadia', 'Omar', 'Selim', 'Rana', 'Youssef'],
    'hunt-hunter': ['Riverside Run', 'K7M2QX', '240', '41:12', 'Nadia', 'Rana'],
    'hunt-prey': ['Riverside Run', '240', '41:12'],
    chat: ['Nadia', 'Omar'],
    result: ['18:48', '0 / 2'],
    history: ['Riverside Run'],
    settings: [],
    'sheet-tag-claim': ['Omar', 'Nadia'],
    'sheet-room-settings': ['240', '60'],
    'lobby-rtl': ['K7M2QX'],
    'home-light': ['Nadia'],
  };
  const pageId = (document.title || '').toLowerCase().includes('home') ? 'home' : null;
  out.seed = { found: {}, missing: [], expectedKnown: false };
  for (const t of seedTokens) out.seed.found[t] = text.toLowerCase().includes(t.toLowerCase());
  // expected list is filled by the runner (it knows the page id); raw presence stays here.
  out.seed.present = seedTokens.filter((t) => out.seed.found[t]);
  const forbidden = ['10.0.2.2', 'lvh.me', 'lorem ipsum', 'lorem', 'TODO', 'FIXME', '--:--', 'undefined', 'NaN', 'console.log', 'alert(', 'encrypted', 'end-to-end', 'forgot password', 'forgot your password', 'reset password', '74.208.99.178'];
  for (const t of forbidden) {
    let idx = text.toLowerCase().indexOf(t.toLowerCase());
    while (idx >= 0) {
      out.forbidden.push({ token: t, context: text.slice(Math.max(0, idx - 45), idx + 55) });
      idx = text.toLowerCase().indexOf(t.toLowerCase(), idx + 1);
      if (out.forbidden.length > 120) break;
    }
    if (out.forbidden.length > 120) break;
  }

  /* a11y affordances a static page can carry */
  const labeled = (el) => !!(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.textContent.trim() || el.title);
  out.a11y = {
    imgsWithoutAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length,
    buttonsWithoutLabel: [...document.querySelectorAll('button,[role="button"],a[href]')].filter((b) => visible(b) && !labeled(b)).length,
    inputsWithoutLabel: [...document.querySelectorAll('input,select,textarea')].filter((i) => visible(i) && !(i.getAttribute('aria-label') || i.getAttribute('aria-labelledby') || (i.labels && i.labels.length) || i.placeholder)).length,
    svgWithoutTitle: [...document.querySelectorAll('svg')].filter((s) => visible(s) && !s.querySelector('title') && !s.getAttribute('aria-hidden') && !s.getAttribute('aria-label')).length,
    positiveTabindex: document.querySelectorAll('[tabindex]:not([tabindex="0"]):not([tabindex="-1"])').length,
    h1Count: document.querySelectorAll('h1').length,
    langTokens: (text.match(/\b(ManHunt|K7M2QX|APK|Android)\b/g) || []).length,
  };

  return out;
}

/* 200% text approximation: double font-size + px line-height (Compose fontScale scales both) */
function scaleTextInPage() {
  const all = document.querySelectorAll('body *');
  let scaled = 0;
  for (const el of all) {
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    if (!fs) continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.nodeValue.trim());
    if (!hasText && !['BUTTON', 'A', 'INPUT'].includes(el.tagName)) continue;
    el.style.fontSize = (fs * 2) + 'px';
    if (cs.lineHeight && cs.lineHeight.endsWith('px')) el.style.lineHeight = (parseFloat(cs.lineHeight) * 2) + 'px';
    scaled++;
  }
  return scaled;
}

/* forced narrow reflow: keep the design but drive the page at 320 dp (indicative only —
   the canvas contract is 390; this shows fixed-width traps, not a spec failure by itself) */
function forceNarrowInPage() {
  const style = document.createElement('style');
  style.textContent = 'html,body{width:320px!important;min-width:320px!important;overflow-x:hidden!important}' +
    '.page{width:320px!important;min-width:320px!important;max-width:320px!important}';
  document.head.appendChild(style);
  return { injected: true };
}

function narrowRiskInPage() {
  const out = { fixedWidths: 0, absolute: 0, fixedSamples: [], absoluteSamples: [] };
  for (const el of document.querySelectorAll('.page *')) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (cs.position === 'absolute' || cs.position === 'fixed') {
      out.absolute++;
      if (out.absoluteSamples.length < 12) out.absoluteSamples.push({ sel: el.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height) });
    }
    const w = cs.width;
    if (w && w.endsWith('px') && parseFloat(w) >= 280) {
      out.fixedWidths++;
      if (out.fixedSamples.length < 12) out.fixedSamples.push({ sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/)[0] : ''), w: Math.round(parseFloat(w)), text: (el.textContent || '').trim().slice(0, 30) });
    }
  }
  return out;
}

function stressInPage() {
  const page = document.querySelector('.page') || document.body;
  const vw = page.getBoundingClientRect().width || window.innerWidth;
  const vh = page.getBoundingClientRect().height || window.innerHeight;
  const out = { viewport: { w: vw, h: vh }, pageScroll: { w: page.scrollWidth, h: page.scrollHeight }, outOfCanvas: [], clipped: [], small: [] };
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.right > vw + 1 || r.left < -1 || r.bottom > vh + 1 || r.top < -1) {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
      if (t) out.outOfCanvas.push({ sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''), text: t, rect: `${r.left.toFixed(0)},${r.top.toFixed(0)} ${r.width.toFixed(0)}x${r.height.toFixed(0)}` });
    }
    const hiddenX = /hidden|clip/.test(cs.overflowX), hiddenY = /hidden|clip/.test(cs.overflowY);
    if ((hiddenX && el.scrollWidth > el.clientWidth + 1) || (hiddenY && el.scrollHeight > el.clientHeight + 1)) {
      const t = (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50);
      if (t) out.clipped.push({ sel: el.tagName.toLowerCase(), text: t });
    }
  }
  return out;
}

/* ---------------------------------------------------------------- main */
async function main() {
  const server = await startServer();
  const port = server.address().port;
  const base = `http://127.0.0.1:${port}`;
  const { chromium } = await import(PLAYWRIGHT);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    colorScheme: 'dark',
  });
  const consoleErrors = [];
  const page = await context.newPage();
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('requestfailed', (r) => consoleErrors.push(`requestfailed ${r.url()}`));

  const dirs = fs.readdirSync(DIRECTIONS, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((d) => !onlyDirs.length || onlyDirs.includes(d))
    .sort();

  const report = { meta: { tool: 'reviewer-ux ux-audit', when: new Date().toISOString(), canvas: '390x844 @3x', stress: STRESS, dirs }, directions: {}, consoleErrors };

  for (const dir of dirs) {
    const dirPath = path.join(DIRECTIONS, dir);
    // env contract says pages sit directly in the direction folder; some designers use pages/.
    // Support both, prefer the root copy when a stem exists twice.
    const locations = [{ dir: '', rel: '' }];
    if (fs.existsSync(path.join(dirPath, 'pages'))) locations.push({ dir: 'pages', rel: 'pages/' });
    const fileEntries = [];
    for (const loc of locations) {
      const abs = path.join(dirPath, loc.dir);
      if (!fs.existsSync(abs)) continue;
      for (const f of fs.readdirSync(abs).filter((x) => x.endsWith('.html')).sort()) {
        const id = f.replace(/\.html$/, '');
        if (fileEntries.some((e) => e.id === id)) continue;
        fileEntries.push({ id, file: f, rel: loc.rel + f });
      }
    }
    fileEntries.sort((a, b) => a.id.localeCompare(b.id));
    const files = fileEntries.map((e) => e.file);
    const pages = {};
    for (const fe of fileEntries) {
      const file = fe.file, id = fe.id;
      if (onlyPages.length && !onlyPages.includes(file)) continue;
      const url = `${base}/design/ui-v2/directions/${dir}/${fe.rel}`;
      const entry = { file, id, rel: fe.rel };
      try {
        await page.goto(url, { waitUntil: 'load', timeout: 30000 });
        await page.evaluate(async () => { await document.fonts.ready; });
        await page.waitForTimeout(260);
        entry.collect = await page.evaluate(collectInPage);
        const expected = SEED_EXPECTED[id] || [];
        entry.collect.seed.expected = expected;
        entry.collect.seed.missingExpected = expected.filter((t) => !entry.collect.seed.found[t]);
        if (STRESS) {
          entry.narrowRisk = await page.evaluate(narrowRiskInPage);
          // forced 320 dp reflow (indicative): reload then drive the page at 320
          await page.reload({ waitUntil: 'load' });
          await page.evaluate(async () => { await document.fonts.ready; });
          await page.evaluate(forceNarrowInPage);
          await page.waitForTimeout(120);
          entry.stress320 = await page.evaluate(stressInPage);
          // 200% text approximation on a clean load
          await page.reload({ waitUntil: 'load' });
          await page.evaluate(async () => { await document.fonts.ready; });
          await page.waitForTimeout(100);
          entry.scaledNodes = await page.evaluate(scaleTextInPage);
          await page.waitForTimeout(140);
          entry.stress200 = await page.evaluate(stressInPage);
        }
      } catch (e) {
        entry.error = String(e && e.message ? e.message : e);
      }
      pages[id] = entry;
      if (!QUIET) {
        const c = entry.collect || {};
        const aa = (c.contrast || []).filter((x) => !x.disabled && x.rule !== 'metadata-7').length;
        const meta = (c.contrast || []).filter((x) => !x.disabled && x.rule === 'metadata-7').length;
        const hard = (c.smallText || []).filter((t) => t.class === 'hard').length;
        const targets = (c.targets || []).filter((t) => !t.ok).length;
        const clipped = (c.clippedText || []).length + ((c.overflow || []).filter((o) => o.kind === 'page-scroll').length);
        process.stdout.write(`[ux-audit] ${dir}/${id}: AA-fail ${aa}, meta<7 ${meta}, text<11 ${hard}, targets<48 ${targets}, clip/overflow ${clipped}${entry.error ? ' ERROR ' + entry.error : ''}\n`);
      }
    }
    report.directions[dir] = { pages, present: files.map((f) => f.replace(/\.html$/, '')), missingCanonical: CANONICAL.filter((c) => !files.includes(c + '.html')) };
  }

  fs.mkdirSync(EVIDENCE, { recursive: true });
  const suffix = TAG ? `-${TAG}` : '';
  const outJson = path.join(EVIDENCE, `ux-audit${suffix}.json`);
  fs.writeFileSync(outJson, JSON.stringify(report, null, 2));
  // per-direction snapshots so a single-direction re-run never destroys the others
  for (const [dirName, d] of Object.entries(report.directions)) {
    fs.writeFileSync(path.join(EVIDENCE, `ux-audit${suffix}-${dirName}.json`), JSON.stringify({ meta: report.meta, consoleErrors: report.consoleErrors, directions: { [dirName]: d } }, null, 2));
  }

  /* markdown digest */
  const lines = ['# UX audit digest (reviewer-ux measurement tool)', '', `Generated ${report.meta.when} · canvas ${report.meta.canvas} · stress=${STRESS}`, ''].
    concat(['Read as: hard-text = <11 px text nodes; aux-or-body = 11–13.9 px (11–12 machine metadata is allowed, body role is not);',
      'clipped = text clipped by an overflow-hidden ancestor or nowrap overflow; out-of-canvas = real content outside 390×844;',
      'cyan surfaces = cyan fills with area ≥ 600 px² (one-cyan-surface rule); seed-missing = expected seed tokens absent;',
      'rtl-uniso = Latin/number runs in an RTL page without an LTR isolate. Contrast is computed from DOM colours; verify crops.', '']);
  for (const [dir, d] of Object.entries(report.directions)) {
    lines.push(`## ${dir}`, '', `Pages present: ${d.present.length}/14. Missing canonical: ${d.missingCanonical.length ? d.missingCanonical.join(', ') : 'none'}`, '');
    lines.push('| page | AA fails | meta<7 | contrast(disabled) | hard<11 | aux 11–13.9 | targets<48 | clipped | out-of-canvas | page-scroll | font errors | cyan surfaces | phys dir props | seed-missing | forbidden | rtl-uniso |');
    lines.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    for (const [id, p] of Object.entries(d.pages)) {
      if (p.error) { lines.push(`| ${id} | ERROR: ${p.error} | | | | | | | | | | | | |`); continue; }
      const c = p.collect;
      const hard = c.smallText.filter((t) => t.class === 'hard').length;
      const aux = c.smallText.filter((t) => t.class === 'aux-or-body').length;
      const phys = c.directionality.physical.length;
      const aaFails = c.contrast.filter((x) => !x.disabled && x.rule !== 'metadata-7').length;
      const meta = c.contrast.filter((x) => !x.disabled && x.rule === 'metadata-7').length;
      const dis = c.contrast.filter((x) => x.disabled).length;
      lines.push(`| ${id} | ${aaFails} | ${meta} | ${dis} | ${hard} | ${aux} | ${c.targets.filter((t) => !t.ok).length} | ${c.clippedText.length} | ${c.overflow.filter((o) => o.kind === 'out-of-canvas').length} | ${c.overflow.filter((o) => o.kind.startsWith('page-scroll')).length} | ${c.fonts.failures} | ${c.colors.cyanSurfaces || 0} | ${phys} | ${(c.seed.missingExpected || []).join(',') || '—'} | ${c.forbidden.length} | ${(c.directionality.rtlUnisolated || []).length} |`);
      const tq = c.techniques || {};
      const risky = Object.entries(tq).filter(([k, v]) => v.count > 0).map(([k, v]) => `${k}:${v.count}`);
      if (risky.length) lines.push(`  - ${id} CSS techniques: ${risky.join(', ')}`);
      if (c.arabic && c.arabic.textNodes) lines.push(`  - ${id} Arabic nodes ${c.arabic.textNodes}; latin-display-face ${c.arabic.latinDisplayFace.length}; tracking ${c.arabic.tracking.length}; uppercase ${c.arabic.upper.length}; fonts ${JSON.stringify(c.arabic.fonts)}`);
      if (c.a11y && (c.a11y.imgsWithoutAlt || c.a11y.buttonsWithoutLabel || c.a11y.inputsWithoutLabel)) lines.push(`  - ${id} a11y: imgs-no-alt ${c.a11y.imgsWithoutAlt}, unlabeled-buttons ${c.a11y.buttonsWithoutLabel}, unlabeled-inputs ${c.a11y.inputsWithoutLabel}, h1 ${c.a11y.h1Count}`);
    }
    if (STRESS) {
      lines.push('Stress (indicative, not part of the 390 dp canvas contract):', '');
      lines.push('| page | forced-320 out-of-bounds | forced-320 clipped | abs/fixed | fixed ≥280px | 200% page height | 200% out-of-canvas | 200% clipped |');
      lines.push('|---|---|---|---|---|---|---|---|');
      for (const [id, p] of Object.entries(d.pages)) {
        if (p.error) continue;
        const s320 = p.stress320 || {}, s200 = p.stress200 || {}, nr = p.narrowRisk || {};
        lines.push(`| ${id} | ${(s320.outOfCanvas || []).length} | ${(s320.clipped || []).length} | ${nr.absolute || 0} | ${nr.fixedWidths || 0} | ${(s200.pageScroll || {}).h || '—'}px | ${(s200.outOfCanvas || []).length} | ${(s200.clipped || []).length} |`);
      }
      lines.push('');
    }
  }
  fs.writeFileSync(path.join(EVIDENCE, `ux-audit${suffix}-summary.md`), lines.join('\n'));

  await browser.close();
  server.close();
  console.log(`\n[ux-audit] wrote ${outJson}`);
  console.log(`[ux-audit] wrote ${path.join(EVIDENCE, 'ux-audit-summary.md')}`);
  if (consoleErrors.length) console.log(`[ux-audit] console/page errors: ${consoleErrors.length} (see JSON)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
