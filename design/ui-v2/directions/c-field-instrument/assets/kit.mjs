/* ============================================================================
   Direction C — FIELD INSTRUMENT · shared HTML/SVG kit
   Used by tools/build.mjs to compose the static pages. All geometry original
   except the approved Open Zone mark + MANHUNT wordmark paths, inlined verbatim
   from design/brand/identity/final/lockup/ (never redrawn/re-tracked).
   ========================================================================== */

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ── Approved identity geometry (verbatim) ─────────────────────────────────── */
const WORDMARK_PATHS = [
  ['translate(0 0)', 'M0,0L16,0L16,100L0,100ZM60,0L76,0L76,100L60,100ZM7,0L20.5,0L44.75,100L31.25,100ZM55.5,0L69,0L44.75,100L31.25,100Z'],
  ['translate(86 0)', 'M26.5,0L41.5,0L20,100L0,100ZM26.5,0L41.5,0L68,100L48,100ZM23,63L45,63L45,79L23,79Z'],
  ['translate(164 0)', 'M0,0L16,0L16,100L0,100ZM52,0L68,0L68,100L52,100ZM7,0L24,0L65,100L48,100Z'],
  ['translate(242 0)', 'M0,0L16,0L16,100L0,100ZM48,0L64,0L64,100L48,100ZM0,41L64,41L64,57L0,57Z'],
  ['translate(316 0)', 'M0,0V66A34,34 0 0 0 68,66V0H0ZM16,0V66A18,18 0 0 0 52,66V0H16Z'],
  ['translate(394 0)', 'M0,0L16,0L16,100L0,100ZM52,0L68,0L68,100L52,100ZM7,0L24,0L65,100L48,100Z'],
  ['translate(472 0)', 'M0,0L58,0L58,16L37,16L37,100L21,100L21,16L0,16Z'],
];

export function markSvg(size = 40, variant = 'light') {
  const ring = variant === 'light' ? '#22D3EE' : variant === 'mono' ? 'currentColor' : '#0C6B84';
  const dot = variant === 'light' ? '#FF7A59' : variant === 'mono' ? 'currentColor' : '#B33A0F';
  return `<svg viewBox="0 0 108 108" width="${size}" height="${size}" aria-hidden="true" focusable="false">
    <g transform="rotate(0 54 54)"><path d="M74.86,46.41A22.2,22.2 0 1 1 53.23,31.81" fill="none" stroke="${ring}" stroke-width="10.4" stroke-linecap="butt"/><circle cx="66.72" cy="33.65" r="8.6" fill="${dot}"/></g>
  </svg>`;
}

export function wordmarkSvg(width = 120, variant = 'light') {
  const fill = variant === 'light' ? '#E6EDF7' : variant === 'mono' ? 'currentColor' : '#0B1220';
  const h = (width * 100) / 530;
  return `<svg viewBox="0 0 530 100" width="${width}" height="${h}" role="img" aria-label="ManHunt">${WORDMARK_PATHS.map(([t, d]) => `<path transform="${t}" d="${d}" fill="${fill}"/>`).join('')}</svg>`;
}

/** Horizontal lockup, inlined from lockup-horizontal-*.svg (viewBox 806x220). */
export function lockupSvg(width = 200, variant = 'light') {
  const h = (width * 220) / 806;
  const chalkFill = variant === 'light' ? '#E6EDF7' : '#0B1220';
  const ring = variant === 'light' ? '#22D3EE' : '#0C6B84';
  const dot = variant === 'light' ? '#FF7A59' : '#B33A0F';
  const word = WORDMARK_PATHS.map(([t, d]) => `<path transform="${t}" d="${d}" fill="${chalkFill}"/>`).join('');
  return `<svg class="lockup" viewBox="0 0 806 220" width="${width}" height="${h}" role="img" aria-label="ManHunt">
    <g transform="translate(9.69 9.69) scale(1.86)"><g transform="rotate(0 54 54)"><path d="M74.86,46.41A22.2,22.2 0 1 1 53.23,31.81" fill="none" stroke="${ring}" stroke-width="10.4" stroke-linecap="butt"/><circle cx="66.72" cy="33.65" r="8.6" fill="${dot}"/></g></g>
    <g transform="translate(226 60)">${word}</g>
  </svg>`;
}

/* ── Instrument marks: 24 grid, 1.75 dp butt-cap strokes, no rounded joins ── */
const ICONS = {
  back: '<polyline points="15,4 8,12 15,20"/>',
  forward: '<polyline points="9,4 16,12 9,20"/>',
  close: '<path d="M6 6L18 18M18 6L6 18"/>',
  check: '<polyline points="4.5,12.5 9.5,17.5 19.5,6.5"/>',
  plus: '<path d="M12 4.5V19.5M4.5 12H19.5"/>',
  minus: '<path d="M4.5 12H19.5"/>',
  send: '<path d="M4 12H19M13 6L19 12L13 18"/>',
  settings: '<path d="M3.5 7H20.5M3.5 12H20.5M3.5 17H20.5"/><path d="M8 4.5V9.5M15.5 9.5V14.5M10.5 14.5V19.5"/>',
  zone: '<path d="M19.2 12A7.2 7.2 0 1 1 12 4.8" fill="none"/><path d="M12 4.8L14.6 4.1"/>',
  prey: '<path d="M19 12A7 7 0 1 1 12 5" fill="none"/><circle cx="19.6" cy="7.6" r="2" fill="currentColor" stroke="none"/>',
  hunters: '<polyline points="4,4 10,12 4,20"/><polyline points="10,4 16,12 10,20"/><polyline points="16,4 22,12 16,20"/>',
  trail: '<polyline points="3,18 9,11 15,14 21,5"/><circle cx="3" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="11" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="14" r="1.4" fill="currentColor" stroke="none"/><circle cx="21" cy="5" r="1.4" fill="currentColor" stroke="none"/>',
  ping: '<circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M16.2 7.8A6 6 0 0 1 16.2 16.2"/><path d="M18.8 5.2A9.6 9.6 0 0 1 18.8 18.8"/>',
  tag: '<path d="M17.5 12A6.5 6.5 0 1 1 11 5.5" fill="none"/><circle cx="19.5" cy="16.5" r="2.2" fill="currentColor" stroke="none"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 4V6M20 12H18M12 20V18M4 12H6"/>',
  code: '<rect x="3" y="7" width="5" height="10"/><rect x="9.5" y="7" width="5" height="10"/><rect x="16" y="7" width="5" height="10"/>',
  roster: '<path d="M6 4V20M12 4V20M18 4V20"/>',
  log: '<path d="M6 4H18M6 4V20M6 9H15M6 14H15M6 19H12"/>',
  history: '<path d="M4 6H14M4 10H10M12 8V20M12 20H20" /><path d="M16.5 14.5V17L18.5 18.5"/>',
  update: '<path d="M12 3V16M6.5 10.5L12 16L17.5 10.5"/><path d="M4 20H20"/>',
  share: '<rect x="3" y="5" width="8" height="8"/><rect x="13" y="11" width="8" height="8"/><path d="M11 9L13 9"/>',
  location: '<circle cx="12" cy="12" r="7" fill="none"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/><path d="M12 2V4M12 20V22M2 12H4M20 12H22"/>',
  recenter: '<circle cx="12" cy="12" r="5.5" fill="none"/><path d="M12 2.5V6M12 18V21.5M2.5 12H6M18 12H21.5"/>',
  map: '<path d="M3 5L9 3L15 5L21 3V19L15 21L9 19L3 21V5Z"/><path d="M9 3V19M15 5V21"/>',
  warning: '<path d="M12 3L22 20H2L12 3Z"/><path d="M12 9V14M12 17.2V17.6"/>',
  lock: '<rect x="5" y="10" width="14" height="10"/><path d="M8 10V7A4 4 0 0 1 16 7V10"/>',
  theme: '<circle cx="12" cy="12" r="8"/><path d="M12 4A8 8 0 0 1 12 20Z" fill="currentColor" stroke="none"/>',
  language: '<path d="M4 5H12M8 5V8C8 12 5 15 3 16M6 11C7.5 13.5 9.5 15 12 16"/><path d="M13 20L17 9L21 20M14.4 16.4H19.6"/>',
  server: '<rect x="3" y="4" width="18" height="6"/><rect x="3" y="14" width="18" height="6"/><path d="M6.5 7H6.6M6.5 17H6.6"/>',
  account: '<circle cx="12" cy="8" r="4"/><path d="M4 21C4 16.5 7.5 14 12 14C16.5 14 20 16.5 20 21"/>',
  trailoff: '<polyline points="3,18 9,11 15,14 21,5" opacity=".35"/><path d="M4 20L20 4"/>',
  arrowright: '<path d="M4 12H19M13 6L19 12L13 18"/>',
  arrowdown: '<path d="M12 4V19M6 13L12 19L18 13"/>',
};

export function icon(name, size = 20, cls = '') {
  const inner = ICONS[name] || ICONS.close;
  return `<svg class="${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="butt" stroke-linejoin="miter" aria-hidden="true" focusable="false">${inner}</svg>`;
}

/* ── Chart ground (the instrument's paper) ─────────────────────────────────── */
export function groundGrid(w = 390, h = 844) {
  let minor = '';
  for (let x = 0; x <= w; x += 8) minor += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="rgba(230,237,247,.020)" stroke-width="1"/>`;
  for (let y = 0; y <= h; y += 8) minor += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="rgba(230,237,247,.020)" stroke-width="1"/>`;
  let major = '';
  for (let x = 0; x <= w; x += 40) major += `<line x1="${x}" y1="0" x2="${x}" y2="${h}" stroke="rgba(230,237,247,.045)" stroke-width="1"/>`;
  for (let y = 0; y <= h; y += 40) major += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="rgba(230,237,247,.045)" stroke-width="1"/>`;
  return `<svg class="ground" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><g>${minor}${major}</g></svg>`;
}

/* ── Drawn field chart (the stand-in for osmdroid tiles) ───────────────────── */
/** Simple deterministic pseudo-random for repeatable "organic" geometry. */
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * drawChart({w,h, zone:{x,y,r}, prey:[{x,y,age,stale,accuracyM,label}], self:{x,y},
 *            trail:[[x,y]...], showZone, showPrey, crop:'park'|'city'|'wide'})
 * All coordinates are in the SVG's own pixel space. Returns inline SVG.
 */
export function chart({ w = 390, h = 538, zone = null, prey = [], self = null, trail = [], showZone = true, showPrey = true, seed = 7, hideWater = false } = {}) {
  const r = rng(seed);
  const parts = [];
  // water (Hudson) on the west
  const waterW = hideWater ? 0 : Math.round(w * 0.24);
  if (!hideWater) {
    parts.push(`<rect x="0" y="0" width="${waterW}" height="${h}" fill="#07151f"/>`);
    let ripples = '';
    for (let i = 0; i < 30; i++) {
      const y = Math.round(6 + i * (h / 30));
      const len = Math.round(30 + r() * 110);
      const x = Math.round(r() * (waterW - len));
      ripples += `<line x1="${x}" y1="${y}" x2="${x + len}" y2="${y}" stroke="rgba(34,211,238,.06)" stroke-width="1"/>`;
    }
    parts.push(ripples);
    // shoreline: a gentle curve
    const shore = `M${waterW},0 C${waterW + 18},${h * 0.18} ${waterW - 12},${h * 0.36} ${waterW + 10},${h * 0.52} C${waterW + 26},${h * 0.68} ${waterW - 6},${h * 0.84} ${waterW + 8},${h}`;
    parts.push(`<path d="${shore}" fill="none" stroke="#16323f" stroke-width="2"/>`);
    parts.push(`<path d="M${waterW},0 L${waterW + 6},0 L${waterW + 20},${h} L${waterW - 4},${h} Z" fill="#081821"/>`);
  }
  const east = hideWater ? 20 : waterW + 26;
  // park band with paths
  const parkX = east, parkW = Math.round(w * 0.30);
  parts.push(`<rect x="${parkX}" y="0" width="${parkW}" height="${h}" fill="#0b1517"/>`);
  let paths = '';
  for (let i = 0; i < 7; i++) {
    const x0 = parkX + 8 + Math.round(r() * (parkW - 20));
    const y0 = Math.round(r() * h);
    const c1x = x0 + 30 + Math.round(r() * 40);
    const c1y = y0 + (r() > 0.5 ? 1 : -1) * Math.round(30 + r() * 70);
    paths += `<path d="M${x0},${y0} C${x0 + 40},${y0} ${c1x - 40},${c1y} ${c1x},${c1y}" fill="none" stroke="rgba(230,237,247,.10)" stroke-width="1.25"/>`;
  }
  parts.push(paths);
  // city blocks east of the park
  const cityX = parkX + parkW + 6;
  parts.push(`<rect x="${cityX}" y="0" width="${w - cityX}" height="${h}" fill="#0b1320"/>`);
  const blockW = 34, blockH = 30, gap = 6;
  let blocks = '';
  for (let y = 8; y < h; y += blockH + gap) {
    for (let x = cityX + 8; x < w - 12; x += blockW + gap) {
      const bw = Math.min(blockW, w - 12 - x);
      if (bw < 8) continue;
      blocks += `<rect x="${x}" y="${y}" width="${bw}" height="${blockH}" fill="#101b2b" stroke="#16233a" stroke-width="0.75"/>`;
    }
  }
  parts.push(blocks);
  // a major avenue + cross streets
  parts.push(`<line x1="${cityX + 2}" y1="0" x2="${cityX + 2}" y2="${h}" stroke="#22314a" stroke-width="5"/>`);
  for (let y = 40; y < h; y += 96) parts.push(`<line x1="${cityX}" y1="${y}" x2="${w}" y2="${y}" stroke="#1a2740" stroke-width="3"/>`);
  // park boundary road
  parts.push(`<line x1="${parkX + parkW + 3}" y1="0" x2="${parkX + parkW + 3}" y2="${h}" stroke="#1e2c44" stroke-width="3"/>`);
  // faint survey rings around the zone centre (instrument feel, decorative geometry only)
  if (showZone && zone) {
    const { x, y, r: zr } = zone;
    for (const k of [0.45, 0.72]) {
      parts.push(`<circle cx="${x}" cy="${y}" r="${Math.round(zr * k)}" fill="none" stroke="rgba(230,237,247,.055)" stroke-width="1" stroke-dasharray="2 6"/>`);
    }
    // the scored zone: four arcs with chalk-style gaps (the brand ring language)
    const gap = 9 * Math.PI / 180;
    let arcs = '';
    for (let q = 0; q < 4; q++) {
      const a0 = q * Math.PI / 2 + gap / 2;
      const a1 = (q + 1) * Math.PI / 2 - gap / 2;
      const x0 = x + zr * Math.cos(a0), y0 = y + zr * Math.sin(a0);
      const x1 = x + zr * Math.cos(a1), y1 = y + zr * Math.sin(a1);
      arcs += `<path d="M${x0.toFixed(1)},${y0.toFixed(1)} A${zr},${zr} 0 0 1 ${x1.toFixed(1)},${y1.toFixed(1)}" fill="none" stroke="#22D3EE" stroke-opacity=".78" stroke-width="2"/>`;
    }
    parts.push(`<circle cx="${x}" cy="${y}" r="${zr}" fill="rgba(34,211,238,.045)"/>`);
    parts.push(arcs);
    // survey mark at zone centre: fine cross with ticks — a scored mark, not a crosshair reticle
    parts.push(`<g stroke="rgba(230,237,247,.5)" stroke-width="1"><line x1="${x - 7}" y1="${y}" x2="${x - 2}" y2="${y}"/><line x1="${x + 2}" y1="${y}" x2="${x + 7}" y2="${y}"/><line x1="${x}" y1="${y - 7}" x2="${x}" y2="${y - 2}"/><line x1="${x}" y1="${y + 2}" x2="${x}" y2="${y + 7}"/></g>`);
  }
  // trail
  if (trail.length > 1) {
    const pts = trail.map(([x, y]) => `${x},${y}`).join(' ');
    parts.push(`<polyline points="${pts}" fill="none" stroke="rgba(255,122,89,.55)" stroke-width="2" stroke-linejoin="miter"/>`);
    for (const [x, y] of trail.slice(0, -1)) {
      parts.push(`<circle cx="${x}" cy="${y}" r="2" fill="rgba(255,122,89,.55)"/>`);
    }
  }
  // prey markers
  if (showPrey) {
    for (const p of prey) {
      const acc = p.accuracyM ? Math.max(4, Math.round((p.accuracyM / 700) * 390)) : 0;
      if (p.stale) {
        parts.push(`<circle cx="${p.x}" cy="${p.y}" r="${acc || 10}" fill="none" stroke="rgba(255,122,89,.35)" stroke-width="1" stroke-dasharray="3 4"/>`);
        parts.push(`<circle cx="${p.x}" cy="${p.y}" r="10" fill="none" stroke="rgba(255,122,89,.55)" stroke-width="1.75" stroke-dasharray="3 3"/>`);
        parts.push(`<circle cx="${p.x}" cy="${p.y}" r="3.5" fill="none" stroke="rgba(255,122,89,.75)" stroke-width="1.75"/>`);
      } else {
        parts.push(`<circle cx="${p.x}" cy="${p.y}" r="${Math.max(acc, 4)}" fill="none" stroke="rgba(255,122,89,.30)" stroke-width="1" stroke-dasharray="2 3"/>`);
        parts.push(`<circle cx="${p.x}" cy="${p.y}" r="10" fill="none" stroke="#FF7A59" stroke-width="2"/>`);
        parts.push(`<circle cx="${p.x}" cy="${p.y}" r="3.6" fill="#FF7A59"/>`);
      }
    }
  }
  // self: chalk dot + ring + four cyan survey ticks (never a crosshair)
  if (self) {
    const { x, y } = self;
    parts.push(`<circle cx="${x}" cy="${y}" r="15" fill="rgba(34,211,238,.08)"/>`);
    parts.push(`<circle cx="${x}" cy="${y}" r="8" fill="none" stroke="#E6EDF7" stroke-width="2"/>`);
    parts.push(`<circle cx="${x}" cy="${y}" r="2.5" fill="#E6EDF7"/>`);
    parts.push(`<g stroke="#22D3EE" stroke-width="2"><line x1="${x - 15}" y1="${y}" x2="${x - 11}" y2="${y}"/><line x1="${x + 11}" y1="${y}" x2="${x + 15}" y2="${y}"/><line x1="${x}" y1="${y - 15}" x2="${x}" y2="${y - 11}"/><line x1="${x}" y1="${y + 11}" x2="${x}" y2="${y + 15}"/></g>`);
  }
  return `<svg class="map" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${parts.join('')}</svg>`;
}

/** Map label chip — a small ink plate with a hairline, never a card. */
export function mapLabel(x, y, { variant = 'fresh', name = '', age = '', extra = '', align = 'right' } = {}) {
  const swatch = variant === 'stale'
    ? '<span class="sw sw-stale"></span>'
    : variant === 'self'
      ? '<span class="sw sw-self"></span>'
      : '<span class="sw sw-fresh"></span>';
  const style = `left:${x}px;top:${y}px;` + (align === 'left'
    ? 'transform:translate(14px,-50%);'
    : align === 'top'
      ? 'transform:translate(-50%, calc(-100% - 16px));'
      : 'transform:translate(calc(-100% - 14px),-50%);');
  return `<div class="maplabel ${variant}" style="${style}"><span class="l1">${swatch}<b>${esc(name)}</b><i>${esc(age)}</i></span>${extra ? `<span class="l2">${esc(extra)}</span>` : ''}</div>`;
}

/* ── Paper field note: the one human object (result + tag claim) ───────────── */
export function handMark(kind = 'circle') {
  if (kind === 'circle') {
    return `<svg viewBox="0 0 92 46" width="92" height="46" fill="none" stroke="#0b1220" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M70 7C78 12 86 20 85 27C84 36 68 42 50 42C32 42 12 38 8 29C4 20 14 12 30 9C40 7 50 7 58 9" opacity=".9"/><path d="M20 44C32 46 52 46 66 43" opacity=".7"/></svg>`;
  }
  return `<svg viewBox="0 0 92 46" width="92" height="46" fill="none" stroke="#0b1220" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M8 22C20 18 38 17 46 21C54 25 45 31 35 32C25 33 16 30 18 25C20 20 34 16 50 17" opacity=".9"/></svg>`;
}

/* ── Page shell ────────────────────────────────────────────────────────────── */
export function page({ title, lang = 'en', dir = 'ltr', theme = 'dark', body, css = '' }) {
  return `<!doctype html>
<html lang="${lang}" dir="${dir}" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>ManHunt — Direction C — ${esc(title)}</title>
<link rel="stylesheet" href="/design/ui-v2/env/canvas.css">
<link rel="stylesheet" href="/design/ui-v2/directions/c-field-instrument/assets/field.css">
<link rel="stylesheet" href="/design/ui-v2/directions/c-field-instrument/assets/pages.css">
<style>${css}</style>
</head>
<body>
<main class="page">
${body}
</main>
</body>
</html>`;
}

/* ── Shared page fragments ─────────────────────────────────────────────────── */
export function bezel({ mode = 'home', title = '', room = '', localtime = '21:04', light = false, back = false, noSettings = false } = {}) {
  const variant = light ? 'dark' : 'light';
  if (back) {
    return `<header class="bezel">
      <a class="back" aria-label="Back">${icon('back', 22)}</a>
      <div class="bezel-title"><b>${esc(title)}</b>${room ? ' <span class="dim">/ ' + esc(room) + '</span>' : ''}</div>
      <div class="spacer"></div>
      ${markSvg(22, light ? 'dark' : 'light')}
    </header>`;
  }
  return `<header class="bezel">
    ${lockupSvg(176, variant)}
    <div class="spacer"></div>
    <span class="localtime num">${esc(localtime)}</span>
    ${noSettings ? '' : `<a class="settings" aria-label="Settings">${icon('settings', 20)}<span>Settings</span></a>`}
  </header>`;
}

export function stateWord(word, { live = false, square = false } = {}) {
  const dot = live ? '<span class="dot"></span>' : square ? '<span class="square"></span>' : '';
  return `<span class="state${live ? ' live' : ''}">${dot}${esc(word)}</span>`;
}

export function progressScale({ playedRatio = 0.313, labels = true, start = '00:00', now = '18:48', end = '60:00' } = {}) {
  const ticks = [];
  for (let i = 0; i <= 12; i++) {
    ticks.push(`<span class="tick${i % 3 === 0 ? ' major' : ''}" style="left:${(i / 12) * 100}%"></span>`);
  }
  return `<div class="scale">
    <span class="base"></span>${ticks.join('')}
    <span class="fill" style="width:${Math.round(playedRatio * 100)}%"></span>
    <span class="now" style="left:${Math.round(playedRatio * 100)}%"></span>
    <span class="end"></span>
    ${labels ? `<span class="lbl start">${start}</span><span class="lbl now-lbl" style="left:${Math.round(playedRatio * 100)}%">${now}</span><span class="lbl end-lbl">${end}</span>` : ''}
  </div>`;
}

export function chit(team, name, count = null) {
  const cls = team === 'prey' ? 'preys' : 'hunterss';
  const glyph = team === 'prey' ? icon('prey', 15) : icon('hunters', 15);
  return `<span class="chit ${cls}"><span class="bar"></span>${glyph}<span class="name">${esc(name)}</span>${count !== null ? `<span class="count num">${esc(count)}</span>` : ''}</span>`;
}

export function sectionHead(label, meta = '', ticks = true) {
  return `<div class="section-head">${ticks ? '<span class="ticks"><i></i><i></i><i></i></span>' : ''}<span class="label">${esc(label)}</span><span class="line"></span>${meta ? `<span class="meta num">${esc(meta)}</span>` : ''}</div>`;
}


/** Compass needle: a plain triangular north mark, no reticle. */
export function compassSvg() {
  return `<svg viewBox="0 0 16 26" width="16" height="26" aria-hidden="true"><path d="M8 1L13 17L8 13.6L3 17Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="miter"/><path d="M8 13.6V25" stroke="currentColor" stroke-width="1"/></svg>`;
}
