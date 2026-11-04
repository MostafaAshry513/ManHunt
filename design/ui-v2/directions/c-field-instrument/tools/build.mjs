/* Compose Direction C ("Field instrument") static pages from the shared kit. */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  page, bezel, stateWord, progressScale, chit, sectionHead, markSvg, wordmarkSvg,
  lockupSvg, icon, groundGrid, chart, mapLabel, handMark, compassSvg, esc,
} from '../assets/kit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* ── small page-local helpers ──────────────────────────────────────────────── */
const groundDark = groundGrid(390, 844);
const groundLight = groundGrid(390, 844)
  .replaceAll('rgba(230,237,247,.020)', 'rgba(15,23,42,.045)')
  .replaceAll('rgba(230,237,247,.045)', 'rgba(15,23,42,.075)');

const reading = (k, v, u = '', cls = '') =>
  `<div class="reading ${cls}"><span class="k">${k}</span><span class="v num">${v}${u ? `<span class="u">${u}</span>` : ''}</span></div>`;

function band({ word, live = false, square = false, room, clock, note, right = '', readings = [], children = '' }) {
  return `<section class="band">
    <div class="row1">${stateWord(word, { live, square })}<span class="room">${esc(room)}</span>
      <div class="right"><span class="data num">${esc(right)}</span></div>
    </div>
    <div class="row2">
      <span class="clock num">${esc(clock)}</span>
      <div class="readings">${readings.join('')}</div>
    </div>
    ${children}
  </section>`;
}

const printScaleLabels = '';

const huntBand = (mode = 'hunter') => band({
  word: 'Live', live: true, room: 'Riverside Run', clock: '41:12', right: 'REMAINING',
  readings: mode === 'hunter'
    ? [reading('Zone', '240', 'm'), reading('Prey', '2 / 2')]
    : [reading('Zone', '240', 'm'), reading('Sharing', 'On')],
  children: progressScale({ playedRatio: 18.8 / 60, labels: false }),
});

/* full-bleed chart with markers + overlays */
function huntChart(mode = 'hunter', H = 540) {
  const k = H / 540;
  const sy = (v) => Math.round(v * k);
  const zone = { x: 214, y: sy(268), r: 126 };
  const nadia = { x: 296, y: sy(196), age: '12 s', accuracyM: 6, label: 'Nadia' };
  const rana = { x: 150, y: sy(372), age: '14 min', accuracyM: 22, stale: true, label: 'Rana' };
  const trail = [[338, sy(146)], [324, sy(170)], [310, sy(186)], [296, sy(196)]];
  const prey = mode === 'hunter' ? [nadia, rana] : [];
  const selfX = mode === 'hunter' ? 206 : 186;
  const selfY = sy(mode === 'hunter' ? 300 : 330);
  const svg = chart({ w: 390, h: H, zone, prey, self: { x: selfX, y: selfY }, trail: mode === 'hunter' ? trail : [] });
  const labels = [];
  if (mode === 'hunter') {
    labels.push(mapLabel(nadia.x, nadia.y, { variant: 'fresh', name: 'Nadia', age: '12 s · ±6 m' }));
    labels.push(mapLabel(rana.x, rana.y, { variant: 'stale', name: 'Rana', age: '14 min · ±22 m', extra: 'STALE', align: 'top' }));
    labels.push(mapLabel(selfX, selfY, { variant: 'self', name: 'You', age: 'hunter', align: 'left' }));
  } else {
    labels.push(mapLabel(selfX, selfY, { variant: 'self', name: 'You', age: 'prey', align: 'left' }));
  }
  return `<div class="chart">
    ${svg}
    <div class="edge-ticks top"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="legend"><span class="k">${mode === 'hunter' ? 'LATEST REPORTS' : 'OWN POSITION'}</span><span>${mode === 'hunter' ? 'not live' : 'no other Prey'}</span></div>
    <div class="north">${compassSvg()}<span class="n">N</span></div>
    ${labels.join('')}
    <div class="controls">
      <button aria-label="Recenter">${icon('recenter', 20)}</button>
      <button aria-label="Zoom in">${icon('plus', 20)}</button>
      <button aria-label="Zoom out">${icon('minus', 20)}</button>
    </div>
    <div class="attr ltr">© OpenStreetMap contributors</div>
  </div>`;
}

function reportStrip(mode = 'hunter') {
  if (mode === 'hunter') {
    return `<div class="report-strip">
      <div class="head"><span class="label">Latest reports</span><span class="meta">5 min interval</span></div>
      <div class="rows">
        <span class="rep"><span class="dot fresh"></span><span class="name">Nadia</span><span class="age num">12 s</span></span>
        <span class="rep"><span class="dot stale"></span><span class="name">Rana</span><span class="age num">14 min</span><span class="state">STALE</span></span>
      </div>
    </div>`;
  }
  return `<div class="report-strip">
    <div class="head"><span class="label">Report cadence</span><span class="meta">not a live track</span></div>
    <div class="rows">
      <span class="rep"><span class="dot fresh"></span><span class="name">Last sent</span><span class="age num">12 s</span></span>
      <span class="rep" style="margin-left:auto"><span class="name">Next</span><span class="age num hot">04:48</span></span>
    </div>
  </div>`;
}

const huntDock = () => `<div class="dock">
  <button class="btn-primary">${icon('tag', 20)} Tag a prey</button>
  <div class="action-row">
    <span class="text-action">${icon('trail', 18)} Trails on</span>
    <span class="text-action">${icon('log', 18)} Field log<span class="badge">2</span></span>
    <span class="text-action muted">${icon('settings', 18)} Hunt rules</span>
  </div>
</div>`;

const preyDock = () => `<div class="dock">
  <div class="share-block">
    <span class="k">Sharing<br>position</span>
    <span class="v">ON</span>
    <span class="next"><span class="k">Next report</span><span class="v num">04:48</span></span>
  </div>
  <div class="action-row">
    <span class="text-action">${icon('log', 18)} Field log</span>
    <span class="text-action muted">${icon('settings', 18)} Hunt rules</span>
  </div>
</div>`;

/* ── AUTH ──────────────────────────────────────────────────────────────────── */
function dialSvg() {
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const major = i % 5 === 0;
    const r0 = major ? 88 : 92, r1 = 96;
    ticks += `<line x1="${(110 + r0 * Math.cos(a)).toFixed(1)}" y1="${(110 + r0 * Math.sin(a)).toFixed(1)}" x2="${(110 + r1 * Math.cos(a)).toFixed(1)}" y2="${(110 + r1 * Math.sin(a)).toFixed(1)}" class="dial-tick"/>`;
  }
  return `<svg viewBox="0 0 220 220" width="220" height="220" aria-hidden="true">
    <g stroke="rgba(230,237,247,.42)" stroke-width="1">${ticks}</g>
    <circle class="dial-ring" cx="110" cy="110" r="96" fill="none" stroke="rgba(230,237,247,.22)" stroke-width="1"/>
    <circle cx="110" cy="110" r="60" fill="none" stroke="rgba(230,237,247,.10)" stroke-width="1"/>
    <g class="corner" stroke="rgba(230,237,247,.55)" stroke-width="1">
      <path d="M6 26V6H26"/><path d="M194 6H214V26"/><path d="M214 194H194V214"/><path d="M26 214H6V194"/>
    </g>
    <g transform="translate(50 50) scale(1.1111)">
      <path d="M74.86,46.41A22.2,22.2 0 1 1 53.23,31.81" fill="none" stroke="#22D3EE" stroke-width="10.4" stroke-linecap="butt"/>
      <circle cx="66.72" cy="33.65" r="8.6" fill="#FF7A59"/>
    </g>
  </svg>`;
}

const authPage = () => page({ title: 'Sign in', body: `<div class="auth">
  ${groundDark}
  <div class="layer">
    ${bezel({ noSettings: true })}
    <div class="content">
      <div class="dial">${dialSvg()}
        <div class="dial-meta"><span class="label">01 / Open zone</span></div>
      </div>
      <h1 class="display-l line">Hide from<br>your friends.</h1>
      <div class="fields">
        <label class="field"><span class="field-label">Username</span><span class="input">Omar</span></label>
        <label class="field"><span class="field-label">Password</span><span class="input"><span class="pw">••••••••</span><span class="act text-action muted" style="margin-left:auto">Show</span></span></label>
      </div>
      <a class="text-action muted mode-link">New here? Create an account</a>
    </div>
    <div class="dock">
      <button class="btn-primary">Sign in</button>
      <div class="server-row">
        <span class="k">Game server</span><span class="v">Hosted test server</span>
        <span class="act"><span class="text-action muted">Change server</span></span>
      </div>
      <p class="caption server-note">Hosted server is a plain-HTTP test deployment. Play with people you trust.</p>
      <div class="foot"><span class="footer-note num">v0.16.1 · Free APK · Android 8+</span><span class="footer-note num">Not on Google Play</span></div>
    </div>
  </div>
</div>` });

/* ── ROLES ─────────────────────────────────────────────────────────────────── */
function guidePlate() {
  const cx = 171, cy = 76, r = 54;
  const gap = 16 * Math.PI / 180;
  let arcs = '';
  for (let q = 0; q < 4; q++) {
    const a0 = q * Math.PI / 2 + gap / 2, a1 = (q + 1) * Math.PI / 2 - gap / 2;
    arcs += `<path d="M${(cx + r * Math.cos(a0)).toFixed(1)},${(cy + r * Math.sin(a0)).toFixed(1)} A${r},${r} 0 0 1 ${(cx + r * Math.cos(a1)).toFixed(1)},${(cy + r * Math.sin(a1)).toFixed(1)}" fill="none" stroke="#22D3EE" stroke-width="2"/>`;
  }
  const preyX = cx + 30, preyY = cy - 20;
  let ticks = '';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ticks += `<line x1="${(cx + (r + 10) * Math.cos(a)).toFixed(1)}" y1="${(cy + (r + 10) * Math.sin(a)).toFixed(1)}" x2="${(cx + (r + 15) * Math.cos(a)).toFixed(1)}" y2="${(cy + (r + 15) * Math.sin(a)).toFixed(1)}" stroke="rgba(230,237,247,.20)" stroke-width="1"/>`;
  }
  return `<div class="guide-plate">
  <svg class="map" viewBox="0 0 342 150" width="342" height="150" aria-hidden="true">
    <rect width="342" height="150" fill="#0a121e"/>
    ${ticks}
    ${arcs}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(34,211,238,.05)"/>
    <g transform="translate(${cx - 7} 0)"><line x1="0" y1="${cy}" x2="4" y2="${cy}" stroke="rgba(230,237,247,.45)"/><line x1="10" y1="${cy}" x2="14" y2="${cy}" stroke="rgba(230,237,247,.45)"/></g>
    <circle cx="${preyX}" cy="${preyY}" r="12" fill="none" stroke="#FF7A59" stroke-width="2"/>
    <circle cx="${preyX}" cy="${preyY}" r="4" fill="#FF7A59"/>
    <g stroke="#A79BFF" stroke-width="2" fill="none" stroke-linecap="butt">
      <polyline points="268,44 280,60 268,76"/><polyline points="280,44 292,60 280,76"/><polyline points="292,44 304,60 292,76"/>
    </g>
    <text x="80" y="140" fill="rgba(230,237,247,.55)" font-family="Red Hat Mono, monospace" font-size="12" letter-spacing="1">ZONE 240 m</text>
    <text x="274" y="30" fill="rgba(167,155,255,.85)" font-family="Red Hat Mono, monospace" font-size="12" letter-spacing="1">HUNTERS</text>
    <text x="${preyX + 18}" y="${preyY - 6}" fill="rgba(255,122,89,.9)" font-family="Red Hat Mono, monospace" font-size="12" letter-spacing="1">PREY</text>
  </svg>
</div>`;
}

const rolesPage = () => page({ title: 'Roles', body: `<div class="roles">
  ${groundDark}
  <div class="layer">
    ${bezel({ back: true, title: 'Roles', room: 'FIELD GUIDE' })}
    <div class="content">
      <h1 class="display-l lead">Two teams.<br>One clock.</h1>
      ${sectionHead('The two sides')}
      ${guidePlate()}
      <div class="sides">
        <div class="side"><span class="ico prey">${icon('prey', 26)}</span>
          <div class="txt"><div class="name prey">Prey — you hide</div>
            <p class="caption">Your phone shares your position with the Hunters every 5 minutes. Stay hidden until the clock stops.</p></div>
        </div>
        <div class="side"><span class="ico hunters">${icon('hunters', 26)}</span>
          <div class="txt"><div class="name hunters">Hunters — you chase</div>
            <p class="caption">You see the Prey's latest reports and their trails. Touch a Prey in person, then confirm it in the app.</p></div>
        </div>
      </div>
      ${sectionHead('Modes')}
      <div class="modes">
        <div class="mode-row"><div><div class="name">Classic hunt</div><div class="tagline">Two teams. One block. One clock.</div></div><span class="state on">Playable today</span></div>
        <div class="mode-row off"><div><div class="name">Single Prey</div><div class="tagline">One Prey, no backup.</div></div><span class="state off">Coming soon</span></div>
        <div class="mode-row off"><div><div class="name">Shrinking Zone</div><div class="tagline">The walls close in.</div></div><span class="state off">Coming soon</span></div>
      </div>
      <p class="safety">ManHunt is a game, not a safety service. Play with people you trust.</p>
    </div>
    <div class="dock">
      <button class="btn-primary">Let's play</button>
      <p class="caption" style="margin-top:8px">Location and notifications are asked now, before the hunt starts.</p>
    </div>
  </div>
</div>` });

/* ── HOME ──────────────────────────────────────────────────────────────────── */
function homeContent({ light = false } = {}) {
  return `<div class="layer">
    ${bezel({ light })}
    <div class="content">
      <h1 class="display-l line">Hide from<br>your friends.</h1>
      <div class="band status-band">
        <div class="inner"><div class="readout-strip">
          <div class="rd"><span class="k">Location</span><span class="v"><span class="dot"></span>Allowed</span></div>
          <div class="rd"><span class="k">Hunt</span><span class="v">Not running</span></div>
        </div></div>
      </div>
      <div class="block join">
        ${sectionHead('Join a hunt', '6 characters')}
        <div class="code">
          <span class="cell focused"><span class="caret"></span></span>
          <span class="cell"></span><span class="cell"></span><span class="cell"></span><span class="cell"></span><span class="cell"></span>
        </div>
        <div class="helper"><span class="caption">Enter the six-character invite code.</span></div>
        <button class="btn-secondary" style="margin-top:8px" aria-disabled="true">Join the hunt</button>
      </div>
      <div class="block host">
        ${sectionHead('Host a hunt')}
        <label class="field"><span class="field-label">Hunt name</span><span class="input">Riverside Run<span class="caret"></span></span></label>
        <div class="defaults"><span class="label">Default rules</span><span class="mono-data">Classic hunt · head start 5 min · 60 min</span></div>
        <div class="extras"><span class="text-action muted">${icon('roster', 18)} Read the roles</span></div>
      </div>
    </div>
    <div class="dock">
      <button class="btn-primary">Create the hunt</button>
      <div class="id-row"><span class="k">Playing as</span><span class="who">Omar</span><span class="act"><span class="text-action muted">Sign out</span></span></div>
    </div>
  </div>`;
}
const homePage = () => page({ title: 'Host or join', body: `<div class="home">
  ${groundDark}
  ${homeContent()}
</div>` });

const homeLightPage = () => page({ title: 'Host or join (light)', theme: 'light', body: `<div class="home">
  ${groundLight}
  ${homeContent({ light: true })}
</div>` });

/* ── LOBBY ─────────────────────────────────────────────────────────────────── */
function lobbyChart() {
  const svg = chart({ w: 390, h: 208, zone: { x: 250, y: 104, r: 86 }, prey: [], self: null, showPrey: false, seed: 12 });
  return `<div class="chart-plate">
    ${svg}
    <div class="edge-ticks top"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="legend"><span class="k">PLAY AREA</span><span>240 m zone</span></div>
    <div class="legend" style="left:8px;bottom:8px;top:auto"><span class="k">CENTRE</span><span>Riverside Park</span></div>
    <div class="north">${icon('arrowdown', 16)}<span class="n">N</span></div>
    <div class="attr ltr">© OpenStreetMap contributors</div>
  </div>`;
}

function manifest({ light = false } = {}) {
  const row = (idx, name, extra = '', check = true) => `<div class="m-row">
      <span class="idx num">${idx}</span><span class="who">${esc(name)}</span>
      <span class="tags">${extra ? `<span class="data">${extra}</span>` : ''}${check ? `<span class="check">${icon('check', 18)}</span>` : ''}</span>
    </div>`;
  return `<div class="manifest">
    <div class="col">${chit('prey', 'Prey', 2)}<div class="teamrule" style="background:rgba(255,122,89,.55);height:2px"></div>
      ${row('01', 'Nadia', 'HOST · YOU')}${row('02', 'Rana', 'READY')}
    </div>
    <div class="col">${chit('hunters', 'Hunters', 3)}<div class="teamrule" style="background:rgba(167,155,255,.55);height:2px"></div>
      ${row('03', 'Omar', 'READY')}${row('04', 'Selim', 'READY')}${row('05', 'Youssef', 'READY')}
    </div>
  </div>`;
}

function lobbyBody({ rtl = false } = {}) {
  const T = rtl ? {
    title: 'Riverside Run',
    state: 'غرفة الانتظار',
    host: 'حكم المطاردة: عمر',
    mode: 'المطاردة الكلاسيكية',
    playArea: 'منطقة اللعب', zone: '240 م',
    code: 'رمز الدعوة', share: 'مشاركة الغرفة',
    players: 'اللاعبون', ready: 'مستعد',
    rules1: 'المدة <span class="ltr">60</span> دقيقة. مهلة الفرائس <span class="ltr">5</span> دقائق.',
    rules2: 'البلاغات كل <span class="ltr">5</span> دقائق. المسارات مفعّلة.',
    edit: 'قواعد المطاردة',
    begin: 'ابدأ المطاردة',
    stand: 'تراجع', leave: 'مغادرة', side: 'اختر جانبك',
    hostTag: 'المضيف', youTag: 'أنت', readyTag: 'مستعد',
  } : {
    title: 'Riverside Run', state: 'Lobby', host: 'HOSTED BY OMAR', mode: 'CLASSIC HUNT',
    playArea: 'PLAY AREA', zone: '240 m', code: 'INVITE CODE', share: 'Send the code',
    players: 'Team manifest', ready: 'READY', rules1: '60 min. Head start 5 min.',
    rules2: 'Reports every 5 min. Trails on.', edit: 'Edit rules', begin: 'Begin the hunt',
    stand: 'Stand down', leave: 'Leave room', side: 'Change side', hostTag: 'HOST', youTag: 'YOU', readyTag: 'READY',
  };
  return `<div class="layer">
    ${rtl
      ? `<header class="bezel">
          <a class="back" aria-label="رجوع" style="margin-inline-start:-14px">${icon('forward', 22)}</a>
          <div class="bezel-title"><b>${T.state}</b></div>
          <div class="spacer"></div>
          ${markSvg(22, 'light')}
        </header>`
      : bezel({ back: true, title: 'Lobby', room: 'RIVERSIDE RUN' })}
    <div class="content">
      <div class="head">
        <div class="title-row">
          <h1 class="display-l ${rtl ? 'latinface' : ''}">${T.title}</h1>
          <div class="right"><div class="v num"><span class="ltr">5 / 5</span> <span class="u">${T.ready}</span></div></div>
        </div>
        <div class="metarow"><span class="label">${T.host}</span><span class="label">${T.mode}</span></div>
      </div>
      <div class="chart-plate">
        ${chart({ w: 390, h: 208, zone: { x: 250, y: 104, r: 86 }, prey: [], self: null, showPrey: false, seed: 12 })}
        <div class="edge-ticks top"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <div class="legend" ${rtl ? 'style="right:8px;left:auto"' : ''}><span class="k">${T.playArea}</span><span>${rtl ? `<span class="ltr">240</span> م` : T.zone}</span></div>
        <div class="north">${compassSvg()}<span class="n">N</span></div>
        <div class="attr ltr">© OpenStreetMap contributors</div>
      </div>
      <div class="code-bar">
        <span class="serial"><span class="k">${T.code}</span><span class="v num ltr">K7M2QX</span></span>
        <span class="act"><span class="text-action">${icon('share', 18)} ${T.share}</span></span>
      </div>
      <div class="manifest-wrap">
        ${sectionHead(T.players, rtl ? '\u20665 / 5\u2069' : `5 / 5 ${T.ready}`)}
        <div class="manifest">
          <div class="col">${chit('prey', rtl ? 'الفريسة' : 'Prey', 2)}<div style="background:rgba(255,122,89,.55);height:2px;margin-top:6px"></div>
            <div class="m-row"><span class="who">${rtl ? 'نادية' : 'Nadia'}</span><span class="tags"><span class="check">${icon('check', 18)}</span></span></div>
            <div class="m-row"><span class="who">${rtl ? 'رنا' : 'Rana'}</span><span class="tags"><span class="check">${icon('check', 18)}</span></span></div>
          </div>
          <div class="col">${chit('hunters', rtl ? 'الصيادون' : 'Hunters', 3)}<div style="background:rgba(167,155,255,.55);height:2px;margin-top:6px"></div>
            <div class="m-row"><span class="who">${rtl ? 'عمر' : 'Omar'}</span><span class="tags">${rtl ? `<span class="data">${T.hostTag}</span><span class="data">${T.youTag}</span>` : `<span class="data">${T.hostTag} · ${T.youTag}</span>`}<span class="check">${icon('check', 18)}</span></span></div>
            <div class="m-row"><span class="who">${rtl ? 'سليم' : 'Selim'}</span><span class="tags"><span class="check">${icon('check', 18)}</span></span></div>
            <div class="m-row"><span class="who">${rtl ? 'يوسف' : 'Youssef'}</span><span class="tags"><span class="check">${icon('check', 18)}</span></span></div>
          </div>
        </div>
      </div>
      <div class="rules-line">
        <div class="txt"><div>${T.rules1}</div><div>${T.rules2}</div></div>
        <span class="act"><span class="text-action muted">${T.edit}</span></span>
      </div>
    </div>
    <div class="dock">
      ${rtl ? '' : `<div class="status caption">Everyone's ready. Begin when you are.</div>`}
      <button class="btn-primary">${T.begin}</button>
      <div class="action-row dock-actions" style="margin-top:4px">
        <span class="text-action muted">${icon('check', 18)} ${T.stand}</span>
        <span class="text-action muted">${T.side}</span>
        <span class="text-action muted">${T.leave}</span>
      </div>
    </div>
  </div>`;
}

const lobbyPage = () => page({ title: 'Lobby', body: `<div class="lobby">${groundDark}${lobbyBody()}</div>` });
const lobbyRtlPage = () => page({ title: 'Lobby Arabic RTL proof', lang: 'ar', dir: 'rtl', body: `<div class="lobby">${groundDark}${lobbyBody({ rtl: true })}</div>` });

/* ── HUNT ──────────────────────────────────────────────────────────────────── */
const huntHunterPage = () => page({ title: 'Live hunt — Hunter', body: `<div class="hunt">
  ${groundDark}
  <div class="layer">
    ${huntBand('hunter')}
    ${huntChart('hunter')}
    ${reportStrip('hunter')}
    ${huntDock()}
  </div>
</div>` });

const huntPreyPage = () => page({ title: 'Live hunt — Prey', body: `<div class="hunt prey-hunt">
  ${groundDark}
  <div class="layer">
    ${huntBand('prey')}
    ${huntChart('prey')}
    ${reportStrip('prey')}
    ${preyDock()}
  </div>
</div>` });

/* ── CHAT ──────────────────────────────────────────────────────────────────── */
const chatRows = [
  ['sys', '20:45', 'MATCH STARTED', 'Match started. Prey have 5 min head start.'],
  ['msg', '20:46', 'Nadia', 'prey', 'Going north along the path. See you at full time.'],
  ['msg', '20:46', 'Youssef', 'hunters', 'Taking the north gate. Selim is with me.'],
  ['msg', '20:47', 'Omar', 'hunters', "Two of us at the fountain. We'll take the bridge first."],
  ['msg', '20:48', 'Rana', 'prey', 'Okay. I will keep to the trees.'],
  ['msg', '20:49', 'Selim', 'hunters', 'Bridge is clear. Moving along the water.'],
  ['sys', '20:50', 'HEAD START OVER', 'Head start over - hunting is live.'],
  ['msg', '20:51', 'Selim', 'hunters', "Rana's last report is 14 minutes old."],
  ['sys', '20:52', 'TAG CLAIM', 'Omar claims to have tagged Nadia - awaiting confirmation'],
];
const chatPage = () => page({ title: 'Field log', body: `<div class="chat">
  ${groundDark}
  <div class="layer">
    ${bezel({ back: true, title: 'Field log', room: 'RIVERSIDE RUN' })}
    <div class="content">
      <div class="log-meta"><span class="label">Room record</span><span class="data num">20:45–20:52 · 9 entries</span></div>
      <div class="log">
        <div class="load-older"><span class="text-action muted">${icon('history', 18)} Load older messages</span><span class="data num" style="margin-left:auto">oldest first</span></div>
        ${chatRows.map((row) => row[0] === 'sys'
          ? `<div class="row-sys"><span class="idx num">${row[1]}</span><span class="txt"><b>${row[2]}</b> ${esc(row[3])}</span></div>`
          : `<div class="row-msg"><span class="time num">${row[1]}</span><div class="body-col"><div class="sender" style="color:${row[3] === 'prey' ? 'var(--coral)' : 'var(--violet)'}">${esc(row[2])}<span class="team">${row[3] === 'prey' ? 'PREY' : 'HUNTERS'}</span></div><div class="msg">${esc(row[4])}</div></div></div>`).join('')}
      </div>
    </div>
    <div class="dock">
      <div class="composer">
        <div class="box"><span>Message the room</span></div>
        <button class="btn-primary send">Send</button>
      </div>
    </div>
  </div>
</div>` });

/* ── RESULT ────────────────────────────────────────────────────────────────── */
function timeRuler() {
  const w = 342, y = 22, played = 0.313;
  let ticks = '';
  for (let i = 0; i <= 12; i++) {
    const x = Math.round((i / 12) * w);
    const major = i % 3 === 0;
    ticks += `<line x1="${x}" y1="${major ? 14 : 17}" x2="${x}" y2="${y + (major ? 8 : 5)}" stroke="rgba(230,237,247,${major ? '.30' : '.14'})" stroke-width="1"/>`;
  }
  const mx = Math.round(w * played);
  return `<div class="time-plate">
    <svg viewBox="0 0 ${w} 62" width="${w}" height="62" aria-hidden="true">
      <line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="rgba(230,237,247,.30)" stroke-width="1"/>
      ${ticks}
      <line x1="0" y1="${y - 2}" x2="${mx}" y2="${y - 2}" stroke="#E6EDF7" stroke-width="4"/>
      <line x1="${mx}" y1="${y - 2}" x2="${w}" y2="${y - 2}" stroke="rgba(230,237,247,.20)" stroke-width="2" stroke-dasharray="3 4"/>
      <line x1="${mx}" y1="${y - 10}" x2="${mx}" y2="${y + 10}" stroke="#22D3EE" stroke-width="2"/>
      <circle cx="${mx}" cy="${y - 2}" r="3" fill="#22D3EE"/>
    </svg>
    <span class="mono-data num" style="position:absolute;left:0;top:38px">00:00</span>
    <span class="mono-data num hot" style="position:absolute;left:${mx}px;top:38px;transform:translateX(-50%)">18:48</span>
    <span class="mono-data num" style="position:absolute;right:0;top:38px">60:00</span>
    <span class="label" style="position:absolute;left:0;top:0">Played</span>
    <span class="label" style="position:absolute;right:0;top:0">41:12 remaining</span>
  </div>`;
}

const resultPage = () => page({ title: 'Full time', body: `<div class="result">
  ${groundDark}
  <div class="layer">
    ${band({ word: 'Full time', square: true, room: 'Riverside Run', clock: '18:48', right: 'PLAYED', readings: [reading('Prey', '0 / 2'), reading('Winner', 'Hunters', '', 'violet')] })}
    <div class="content">
      <div class="winner-block">
        <h1 class="display-xl">Hunters win.</h1>
        <div class="meta"><span class="mono-data num">Wed 4 Nov · 20:45–21:04</span><span class="mono-data num" style="margin-left:auto">Riverside Run</span></div>
      </div>
      <div class="time-block">
        ${sectionHead('Time played')}
        ${timeRuler()}
      </div>
      <div class="paper-wrap">
        <div class="paper">
          <div class="paperm"><span class="label">Match record</span><span class="data num">WED 4 NOV</span></div>
          <div class="line">Both Prey tagged. That's the run.</div>
          <div class="sub">From the first scored circle to the last tag.</div>
          <div class="big"><span class="val num">18:48</span><span class="u">PLAYED OF 60:00</span></div>
          <div class="note-foot"><span class="data num">RIVERSIDE RUN · K7M2QX</span><span class="sig">Prey 0 / 2</span></div>
          <span class="hand">${handMark('underline')}</span>
        </div>
      </div>
      <div class="manifest-wrap">
        ${sectionHead('Final manifest', '5 players')}
        <div class="manifest">
          <div class="col">${chit('prey', 'Prey', 2)}<div style="height:2px;background:rgba(255,122,89,.55);margin-top:6px"></div>
            <div class="m-row"><span class="who">Nadia</span><span class="tags"><span class="tagged">TAGGED</span></span></div>
            <div class="m-row"><span class="who">Rana</span><span class="tags"><span class="tagged">TAGGED</span></span></div>
          </div>
          <div class="col">${chit('hunters', 'Hunters', 3)}<div style="height:2px;background:rgba(167,155,255,.55);margin-top:6px"></div>
            <div class="m-row"><span class="who">Omar</span><span class="tags"></span></div>
            <div class="m-row"><span class="who">Selim</span><span class="tags"></span></div>
            <div class="m-row"><span class="who">Youssef</span><span class="tags"></span></div>
          </div>
        </div>
      </div>
    </div>
    <div class="dock">
      <button class="btn-primary">Back to lobby</button>
      <div class="action-row" style="margin-top:6px;justify-content:space-between">
        <span class="text-action">Rematch <span class="proposal-tag">PROPOSAL</span></span>
        <span class="text-action muted">${icon('history', 18)} View hunt history</span>
      </div>
      <p class="proposal">Rematch needs a server restart; not in the current build.</p>
    </div>
  </div>
</div>` });

/* ── HISTORY ───────────────────────────────────────────────────────────────── */
const historyPage = () => page({ title: 'Past hunts', body: `<div class="history">
  ${groundDark}
  <div class="layer">
    ${bezel({ back: true, title: 'Hunt history', room: 'RIVERSIDE RUN' })}
    <div class="content">
      <div class="hist-head"><h1 class="display-l">Past hunts.</h1><span class="mono-data num">4 hunts · this room</span></div>
      <div class="group-date"><span class="label">Wed 4 Nov</span><span class="line"></span><span class="meta">21:04</span></div>
      <div class="h-row sel">
        <span class="time num">20:45</span>
        <div class="what"><div class="name">Riverside Run</div><div class="sub">Prey: Nadia, Rana</div></div>
        <div class="res"><div class="word" style="color:var(--violet)">Hunters won</div><div class="dur num">18:48</div></div>
      </div>
      <div class="summary">
        <div class="r"><span class="k">Date</span><span class="v num">4 Nov · 20:45–21:04</span></div>
        <div class="r"><span class="k">Duration</span><span class="v num">18:48 played</span></div>
        <div class="r"><span class="k">Result</span><span class="v" style="color:var(--violet)">Hunters won</span></div>
        <div class="r"><span class="k">Prey</span><span class="v">Nadia, Rana</span></div>
        <div class="r"><span class="k">Hunters</span><span class="v">Omar, Selim, Youssef</span></div>
      </div>
      <div class="group-date"><span class="label">Sun 1 Nov</span><span class="line"></span><span class="meta">21:41</span></div>
      <div class="h-row">
        <span class="time num">20:41</span>
        <div class="what"><div class="name">Riverside Run</div><div class="sub">Prey: Nadia, Rana</div></div>
        <div class="res"><div class="word" style="color:var(--coral)">Prey won</div><div class="dur num">60:00</div></div>
      </div>
      <div class="group-date"><span class="label">Sat 31 Oct</span><span class="line"></span><span class="meta">21:30</span></div>
      <div class="h-row">
        <span class="time num">21:12</span>
        <div class="what"><div class="name">Riverside Run</div><div class="sub">Prey: Nadia, Rana</div></div>
        <div class="res"><div class="word" style="color:var(--violet)">Hunters won</div><div class="dur num">18:48</div></div>
      </div>
      <div class="group-date"><span class="label">Fri 30 Oct</span><span class="line"></span><span class="meta">21:06</span></div>
      <div class="h-row">
        <span class="time num">20:58</span>
        <div class="what"><div class="name">Riverside Run</div><div class="sub">Ended by the Huntmaster</div></div>
        <div class="res"><div class="word" style="color:var(--muted)">Cancelled</div><div class="dur num">8:12</div></div>
      </div>
    </div>
    <div class="dock"><button class="btn-primary" style="height:56px">Back to room</button></div>
  </div>
</div>` });

/* ── SETTINGS ──────────────────────────────────────────────────────────────── */
const settingsPage = () => page({ title: 'Settings', body: `<div class="settings">
  ${groundDark}
  <div class="layer">
    ${bezel({ back: true, title: 'Settings' })}
    <div class="content">
      <div class="head"><h1 class="display-m">Settings.</h1><span class="right num">v0.16.1 · 100% text</span></div>
      ${sectionHead('Display')}
      <div class="row"><span class="k">Theme</span><span class="ctrl"><span class="rocker"><span class="opt on">${icon('check', 16)} Dark</span><span class="opt">Daylight</span></span></span></div>
      <div class="row"><span class="k">Text size</span><span class="ctrl"><span class="stepper"><button aria-label="Smaller">${icon('minus', 18)}</button><span class="val num">100<span class="unit">%</span></span><button aria-label="Larger">${icon('plus', 18)}</button></span></span></div>
      <div class="preview"><span class="sample">Hunters see prey positions every few minutes.</span><span class="tag">PREVIEW</span></div>
      ${sectionHead('Language')}
      <div class="row"><span class="k">Language</span><span class="ctrl"><span class="rocker"><span class="opt on">English</span><span class="opt">العربية</span></span></span></div>
      ${sectionHead('Field permissions')}
      <div class="row"><span class="k">Location<span class="h">Required as Prey in a hunt</span></span><span class="val">Allowed</span><span class="act"><span class="text-action muted">Manage</span></span></div>
      <div class="row"><span class="k">Match notifications<span class="h">Tags, hunt start and result</span></span><span class="val">Off</span><span class="act"><span class="text-action">Turn on</span></span></div>
      ${sectionHead('Updates', 'v0.16.1 installed')}
      <div class="upd"><div class="txt"><div class="t">Update available · 0.17.0</div><div class="s num">2.1 MB · published 3 Nov</div></div><span class="act"><span class="text-action">Download</span></span></div>
      <div class="row"><span class="k">Check for updates</span><span class="val num">last checked 21:02</span></div>
      ${sectionHead('Server')}
      <div class="row"><span class="k">Game server</span><span class="val">Hosted test server</span></div>
      <p class="caption" style="margin-top:5px">Read-only here. To change it, sign out and edit it on the sign-in screen. The hosted server is a plain-HTTP test deployment.</p>
      ${sectionHead('Account')}
      <div class="row"><span class="k">Playing as Omar</span><span class="act"><span class="text-action" style="color:var(--error)">Sign out</span></span></div>
      <div class="foot"><span class="footer-note">Free APK · Android 8+ · Not on Google Play</span></div>
    </div>
  </div>
</div>` });

/* ── SHEET: TAG CLAIM ──────────────────────────────────────────────────────── */
const claimSheetPage = () => page({ title: 'Tag claim sheet', body: `<div class="hunt prey-hunt">
  ${groundDark}
  <div class="layer">
    ${huntBand('prey')}
    ${huntChart('prey')}
    ${reportStrip('prey')}
    ${preyDock()}
  </div>
  <div class="scrim"></div>
  <section class="sheet claim-sheet">
    <div class="grab"></div>
    <div class="sheet-head">
      <div class="meta"><span class="label">Tag claim</span><span class="data num">20:58 · from Omar</span></div>
      <div class="sheet-title display-m">Omar says he<br>tagged you.</div>
    </div>
    <div class="sheet-body">
      <div class="who-row">${chit('hunters', 'Omar')}<span class="data">HUNTERS · PHYSICAL TAG</span><span class="data num">20:58</span></div>
      <p class="body-copy caption">He says he touched you at 20:58. Confirm if that happened.</p>
      <div class="paper">
        <div class="paperm"><span class="label">What confirming means</span><span class="data">READ ONCE</span></div>
        <div class="line">You're out, and you can follow the rest from the field log.</div>
        <div class="sub">If it didn't happen, dispute it and the Huntmaster decides.</div>
      </div>
      <div class="expiry"><span class="k">No answer in</span><span class="v num">01:12</span><span class="c">the Huntmaster decides</span></div>
    </div>
    <div class="sheet-dock">
      <button class="btn-primary">Confirm the tag</button>
      <button class="btn-secondary" style="margin-top:8px">Dispute</button>
      <p class="caption consequence" style="margin-top:8px">Confirming ends your hunt. The field log stays open.</p>
    </div>
  </section>
</div>` });

/* ── SHEET: HUNT RULES ─────────────────────────────────────────────────────── */
const ruleRow = (label, control) => `<div class="row"><span class="k">${label}</span><span class="ctrl">${control}</span></div>`;
const ruleStep = (v, u) => `<span class="stepper"><button aria-label="Less">${icon('minus', 18)}</button><span class="val num">${v}<span class="unit">${u}</span></span><button aria-label="More">${icon('plus', 18)}</button></span>`;
const rulesSheetPage = () => page({ title: 'Hunt rules sheet', body: `<div class="lobby">
  ${groundDark}
  ${lobbyBody()}
  <div class="scrim"></div>
  <section class="sheet rules-sheet">
    <div class="grab"></div>
    <div class="sheet-head">
      <div class="meta"><span class="label">Hunt rules</span><span class="data num">HOST ONLY</span></div>
      <div class="sheet-title display-m">Rules for the hunt.</div>
      <p class="intro">Applies to the next match. Rules are enforced by the server.</p>
    </div>
    <div class="sheet-body">
      ${sectionHead('Timing')}
      ${ruleRow('Prey head start', ruleStep(5, 'min'))}
      ${ruleRow('Hunt duration', ruleStep(60, 'min'))}
      ${ruleRow('Report interval', ruleStep(5, 'min'))}
      ${sectionHead('Play area')}
      <div class="row"><span class="k">Mode</span><span class="ctrl"><span class="rocker"><span class="opt">Open</span><span class="opt on">${icon('check', 14)} Zone</span></span></span></div>
      ${ruleRow('Zone radius', ruleStep(240, 'm'))}
      <div class="row"><span class="k">Zone centre</span><span class="val num">40.79950, -73.97350</span><span class="act"><span class="text-action muted">Pick on map</span></span></div>
      ${sectionHead('Trails')}
      <div class="row"><span class="k">Hunters can see trails</span><span class="ctrl switch-ctrl"><span class="switch on" role="switch" aria-checked="true"></span><span class="switch-word">On</span></span></div>
      ${sectionHead('Tag policy')}
      <div class="row"><span class="k">Tags need the Prey to confirm<span class="h">Server-enforced</span></span><span class="val">CONFIRM</span></div>
      ${sectionHead('Zone shrink')}
      <div class="row"><span class="k">Shrink over time</span><span class="ctrl switch-ctrl"><span class="switch" role="switch" aria-checked="false"></span><span class="switch-word">Off</span></span></div>
    </div>
    <div class="sheet-dock">
      <div class="dock-row"><button class="btn-primary">Save rules</button><span class="text-action muted">Cancel</span></div>
    </div>
  </section>
</div>` });


/* ── STATE STUDIES (non-canonical extras: paused / offline / eliminated) ───── */
const statePausedPage = () => page({ title: 'State study — hunt paused', body: `<div class="hunt state-paused">
  ${groundDark}
  <div class="layer">
    ${band({ word: 'Paused', square: true, room: 'Riverside Run', clock: '41:12', right: 'stopped',
      readings: [reading('Zone', '240', 'm'), reading('Prey', '2 / 2')],
      children: progressScale({ playedRatio: 18.8 / 60, labels: false }) })}
    ${huntChart('hunter', 553)}
    <div class="strip"><span class="glyph">${icon('warning', 18)}</span><span class="msg">The hunt is paused. The clock is stopped.</span></div>
    <div class="dock">
      <button class="btn-primary">Resume the hunt</button>
      <div class="action-row dock-actions" style="margin-top:4px">
        <span class="text-action">${icon('log', 18)} Field log</span>
        <span class="text-action muted">${icon('settings', 18)} Hunt rules</span>
      </div>
    </div>
  </div>
</div>` });

const stateOfflinePage = () => page({ title: 'State study — offline / reconnecting', body: `<div class="hunt state-offline">
  ${groundDark}
  <div class="layer">
    ${huntBand('hunter')}
    <div class="offline"><span class="dot"></span><span class="t">Offline · reconnecting</span><span class="r">12 s ago</span></div>
    ${huntChart('hunter', 534)}
    ${reportStrip('hunter')}
    <div class="dock">
      <button class="btn-primary" aria-disabled="true">Tag a prey</button>
      <p class="proposal">Reconnect to tag. The last reports stay on screen.</p>
      <div class="action-row dock-actions" style="margin-top:2px">
        <span class="text-action">Retry now</span>
        <span class="text-action muted">${icon('log', 18)} Field log</span>
      </div>
    </div>
  </div>
</div>` });

const stateEliminatedPage = () => page({ title: 'State study — eliminated / spectating', body: `<div class="hunt prey-hunt state-eliminated">
  ${groundDark}
  <div class="layer">
    ${band({ word: 'Live', live: true, room: 'Riverside Run', clock: '41:12', right: 'REMAINING',
      readings: [reading('Zone', '240', 'm'), reading('Sharing', 'Off')],
      children: progressScale({ playedRatio: 18.8 / 60, labels: false }) })}
    <div class="strip tagged-strip"><span class="glyph">${icon('tag', 18)}</span><span class="msg"><span class="mono">TAGGED · 20:58</span><br>You were tagged. You are spectating this match. You can still chat, but you cannot tag or share new positions.</span></div>
    ${huntChart('prey', 503)}
    <div class="dock">
      <div class="share-block">
        <span class="k">Tagged<br>at 20:58</span>
        <span class="v">OUT</span>
        <span class="next"><span class="k">Status</span><span class="v spec">Spectating</span></span>
      </div>
      <div class="action-row dock-actions" style="margin-top:8px">
        <span class="text-action">${icon('log', 18)} Field log</span>
        <span class="text-action muted">${icon('settings', 18)} Hunt rules</span>
      </div>
    </div>
  </div>
</div>` });

/* ── write pages ───────────────────────────────────────────────────────────── */
const PAGES = {
  auth: authPage,
  roles: rolesPage,
  home: homePage,
  lobby: lobbyPage,
  'hunt-hunter': huntHunterPage,
  'hunt-prey': huntPreyPage,
  chat: chatPage,
  result: resultPage,
  history: historyPage,
  settings: settingsPage,
  'sheet-tag-claim': claimSheetPage,
  'sheet-room-settings': rulesSheetPage,
  'lobby-rtl': lobbyRtlPage,
  'home-light': homeLightPage,
  'state-paused': statePausedPage,
  'state-offline': stateOfflinePage,
  'state-eliminated': stateEliminatedPage,
};

await mkdir(ROOT, { recursive: true });
let n = 0;
for (const [id, fn] of Object.entries(PAGES)) {
  await writeFile(path.join(ROOT, `${id}.html`), fn(), 'utf8');
  n++;
}
console.log(`[build] wrote ${n} pages to ${path.relative(process.cwd(), ROOT)}/`);
