/* ============================================================================
   ManHunt social identity kit — shared SVG art
   ----------------------------------------------------------------------------
   Extends the motion kit: the radar, block map and markings are the same
   deterministic system used by design/brand/motion-kit (motion-core.js
   "Perpetual Pursuit"), re-aimed for profile/header/post surfaces.

   Pure string generation, no DOM: loaded by the browser stage AND evaluated in
   Node by the templates/gallery builders (so one art source serves everything).
   Requires window/global MHCore (../motion-kit/src/motion-core.js).
   ============================================================================ */
(function (root) {
  'use strict';

  const C = root.MHCore;
  if (!C) throw new Error('social-identity art.js requires motion-core.js');

  const COLORS = {
    field: '#0B1220',
    fieldDeep: '#07101C',
    block: '#0E1727',
    park: '#0C2026',
    chalk: '#E6EDF7',
    muted: '#A7B6CC',
    dim: '#7C8DA8',
    cyan: '#22D3EE',
    coral: '#FF7A59',
    violet: '#A79BFF',
  };

  const f = (n) => (Math.round(n * 100) / 100).toString();
  const polar = C.polar;
  const arcPath = C.arcPath;

  /* ── field: borrowed pitch block map + survey dots + chalk markings ─────── */
  function blockMap(w, h, seed, fade) {
    const rnd = C.mulberry32((seed >>> 0) ^ 0x9e3779b9);
    const cell = Math.max(104, Math.min(240, w / 8.5));
    const cols = [];
    const rows = [];
    for (let x = -cell * 0.5; x < w + cell; x += cell * (0.82 + rnd() * 0.42)) cols.push(x);
    for (let y = -cell * 0.55; y < h + cell; y += cell * (0.66 + rnd() * 0.38)) rows.push(y);
    const parts = [];
    for (let i = 0; i < cols.length - 1; i++) {
      for (let j = 0; j < rows.length - 1; j++) {
        const gap = 10 + rnd() * 16;
        const bx = cols[i] + gap / 2 + rnd() * 8;
        const by = rows[j] + gap / 2 + rnd() * 8;
        const bw = cols[i + 1] - cols[i] - gap - rnd() * 16;
        const bh = rows[j + 1] - rows[j] - gap - rnd() * 12;
        if (bw < 54 || bh < 40) continue;
        if (rnd() < 0.13) continue;
        const park = rnd() < 0.055;
        parts.push(
          `<rect x="${f(bx)}" y="${f(by)}" width="${f(bw)}" height="${f(bh)}" rx="7" fill="${park ? COLORS.park : COLORS.block}" fill-opacity="${f((park ? 0.9 : 0.7) * fade)}" stroke="${park ? COLORS.cyan : COLORS.chalk}" stroke-opacity="${f((park ? 0.15 : 0.065) * fade)}" stroke-width="1.5"/>`
        );
      }
    }
    return `<g>${parts.join('')}</g>`;
  }

  function dotGrid(w, h, idPrefix) {
    const spacing = Math.max(34, Math.min(54, Math.round(Math.min(w, h) / 11)));
    return `<defs>
      <pattern id="${idPrefix}Dots" width="${spacing}" height="${spacing}" patternUnits="userSpaceOnUse">
        <circle cx="${spacing / 2}" cy="${spacing / 2}" r="1.4" fill="${COLORS.cyan}" fill-opacity="0.1"/>
      </pattern>
      <pattern id="${idPrefix}DotsMajor" width="${spacing * 5}" height="${spacing * 5}" patternUnits="userSpaceOnUse">
        <circle cx="${(spacing * 5) / 2}" cy="${(spacing * 5) / 2}" r="2.4" fill="${COLORS.cyan}" fill-opacity="0.17"/>
      </pattern>
    </defs>
    <rect width="${w}" height="${h}" fill="url(#${idPrefix}Dots)"/>
    <rect width="${w}" height="${h}" fill="url(#${idPrefix}DotsMajor)"/>`;
  }

  function specks(w, h, seed) {
    const rnd = C.mulberry32((seed >>> 0) ^ 0x51ed270b);
    const count = Math.round((w * h) / 9000);
    let out = '<g>';
    for (let i = 0; i < count; i++) {
      out += `<circle cx="${f(rnd() * w)}" cy="${f(rnd() * h)}" r="${f(0.5 + rnd() * 1.5)}" fill="${COLORS.chalk}" fill-opacity="${(0.03 + rnd() * 0.055).toFixed(3)}"/>`;
    }
    return out + '</g>';
  }

  function markings(w, h, opt) {
    const inset = opt.inset;
    const arcR = opt.corner;
    const corners = [
      `M${inset + 2},${inset + arcR} A${arcR},${arcR} 0 0 1 ${inset + arcR},${inset + 2}`,
      `M${w - inset - 2},${inset + arcR} A${arcR},${arcR} 0 0 0 ${w - inset - arcR},${inset + 2}`,
      `M${inset + 2},${h - inset - arcR} A${arcR},${arcR} 0 0 0 ${inset + arcR},${h - inset - 2}`,
      `M${w - inset - 2},${h - inset - arcR} A${arcR},${arcR} 0 0 1 ${w - inset - arcR},${h - inset - 2}`,
    ];
    const midway = opt.halfway
      ? `<line x1="${w / 2}" y1="${inset}" x2="${w / 2}" y2="${h - inset}" stroke-opacity="0.16" stroke-width="2" stroke-dasharray="16 22"/>`
      : '';
    const pad = 8;
    const tick = 16;
    return `<g fill="none" stroke="${COLORS.chalk}" stroke-linecap="round">
      <rect x="${inset}" y="${inset}" width="${w - inset * 2}" height="${h - inset * 2}" stroke-opacity="0.30" stroke-width="2.5"/>
      <g stroke-opacity="0.22" stroke-width="2.5">${corners.map((d) => `<path d="${d}"/>`).join('')}</g>
      ${midway}
      <g stroke-opacity="0.26" stroke-width="2">
        <path d="M${pad},${pad + tick} L${pad},${pad} L${pad + tick},${pad}"/>
        <path d="M${w - pad - tick},${pad} L${w - pad},${pad} L${w - pad},${pad + tick}"/>
        <path d="M${pad},${h - pad - tick} L${pad},${h - pad} L${pad + tick},${h - pad}"/>
        <path d="M${w - pad - tick},${h - pad} L${w - pad},${h - pad} L${w - pad},${h - pad - tick}"/>
      </g>
    </g>`;
  }

  /** Full field group: asphalt, block map, survey dot grid, specks, markings. */
  function field(opt) {
    const w = opt.w;
    const h = opt.h;
    const seed = opt.seed == null ? 20261101 : opt.seed;
    const fade = opt.fade == null ? 1 : opt.fade;
    const grid = opt.grid !== false;
    const inset = opt.inset == null ? Math.round(Math.min(w, h) * 0.05) : opt.inset;
    const corner = opt.corner == null ? Math.round(inset * 2.1) : opt.corner;
    const idPrefix = opt.idPrefix || 'mhsi';
    return `<rect width="${w}" height="${h}" fill="${COLORS.field}"/>
      ${blockMap(w, h, seed, fade)}
      ${grid ? dotGrid(w, h, idPrefix) : ''}
      ${specks(w, h, seed)}
      ${markings(w, h, { inset, corner, halfway: !!opt.halfway })}`;
  }

  /* ── the Open Zone radar (same composition as the motion-kit banners) ───── */
  function chalkCirclePath(cx, cy, r, seed) {
    const rnd = C.mulberry32((seed >>> 0) ^ 0x2545f491);
    const pts = [];
    for (let i = 0; i < 72; i++) {
      const a = (i / 72) * Math.PI * 2;
      const wob = 1 + (rnd() - 0.5) * 0.014 + Math.sin(a * 3 + 1.7) * 0.006 + Math.sin(a * 7 + 0.4) * 0.004;
      pts.push([cx + r * wob * Math.cos(a), cy + r * wob * Math.sin(a) * 0.985]);
    }
    return `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}` + pts.slice(1).map((p) => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') + 'Z';
  }

  function radarMarkup(opt) {
    const cx = opt.cx;
    const cy = opt.cy;
    const r = opt.r;
    const seed = opt.seed == null ? 20261101 : opt.seed;
    const tau = opt.tau == null ? 0.9 : opt.tau;
    const hunters = opt.hunters == null ? 5 : opt.hunters;
    const gapDeg = opt.gapDeg == null ? 24 : opt.gapDeg;
    const squash = opt.squash == null ? 0.94 : opt.squash;

    const cfg = { cx, cy, r, hunters, squash, seed };
    const frame = C.radarFrame(cfg, tau);
    const sweepDeg = frame.sweep;

    let ticks = '';
    for (let i = 0; i < 36; i++) {
      const deg = i * 10;
      const a = polar(cx, cy, r * 1.105, deg);
      const b = polar(cx, cy, r * (i % 9 === 0 ? 1.155 : 1.13), deg);
      ticks += `<line x1="${f(a.x)}" y1="${f(a.y)}" x2="${f(b.x)}" y2="${f(b.y)}"/>`;
    }

    const trail = frame.trail.map((p) => `${f(p.x)},${f(p.y)}`).join(' ');
    const pingMarkup = frame.pings
      .map((p) => `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(p.r)}" fill="none" stroke="${COLORS.coral}" stroke-width="2.4" stroke-opacity="${p.o.toFixed(3)}"/>`)
      .join('');
    const hunterMarkup = frame.hunters
      .map((h, i) => {
        const blip = frame.hunterBlips[i] || 0;
        return `<g transform="translate(${f(h.x)} ${f(h.y)})">
          ${blip > 0.04 ? `<circle r="${f(13 + 5 * blip)}" fill="none" stroke="${COLORS.violet}" stroke-width="1.4" stroke-opacity="${(0.3 * blip).toFixed(3)}"/>` : ''}
          <circle r="13" fill="none" stroke="${COLORS.violet}" stroke-opacity="0.4" stroke-width="1.6"/>
          <circle r="7" fill="${COLORS.violet}"/>
        </g>`;
      })
      .join('');
    const pb = frame.preyBlip || 0;
    const preyMarkup = `<g transform="translate(${f(frame.prey.x)} ${f(frame.prey.y)})">
      ${pb > 0.04 ? `<circle r="${f(12 + 30 * pb)}" fill="none" stroke="${COLORS.coral}" stroke-width="2" stroke-opacity="${(0.4 * pb).toFixed(3)}"/>` : ''}
      <circle r="${f(17 + 7 * pb)}" fill="none" stroke="${COLORS.coral}" stroke-opacity="${(0.48 + 0.4 * pb).toFixed(3)}" stroke-width="2"/>
      <circle r="${f(9.5 * (1 + 0.2 * pb))}" fill="${COLORS.coral}"/>
    </g>`;

    return `<g>
      <circle cx="${cx}" cy="${cy}" r="${f(r * 1.17)}" fill="${COLORS.fieldDeep}" fill-opacity="0.62"/>
      <g stroke="${COLORS.cyan}" stroke-opacity="0.09" stroke-width="1">
        <line x1="${f(cx - r * 1.17)}" y1="${cy}" x2="${f(cx + r * 1.17)}" y2="${cy}"/>
        <line x1="${cx}" y1="${f(cy - r * 1.17)}" x2="${cx}" y2="${f(cy + r * 1.17)}"/>
      </g>
      <g stroke="${COLORS.cyan}" stroke-opacity="0.26" stroke-width="1.4">${ticks}</g>
      <circle cx="${cx}" cy="${cy}" r="${f(r * 1.115)}" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.2" stroke-width="1.5" stroke-dasharray="2 10"/>
      <circle cx="${cx}" cy="${cy}" r="${f(r * 0.68)}" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.1" stroke-width="1" stroke-dasharray="2 12"/>
      <path d="${chalkCirclePath(cx, cy, r, seed)}" fill="none" stroke="${COLORS.chalk}" stroke-opacity="0.19" stroke-width="2.4" stroke-linecap="round"/>
      <path d="${frame.zonePath}" fill="none" stroke="${COLORS.cyan}" stroke-width="4"/>
      <g transform="translate(${cx} ${cy}) rotate(${f(sweepDeg)})">
        <path d="${C.sweepWedge(r * 0.995, 42)}" fill="${COLORS.cyan}" fill-opacity="0.042"/>
        <path d="${C.sweepWedge(r * 0.995, 104)}" fill="${COLORS.cyan}" fill-opacity="0.018"/>
        <line x1="0" y1="0" x2="${f(r * 1.1)}" y2="0" stroke="${COLORS.cyan}" stroke-opacity="0.5" stroke-width="1.6"/>
        <circle cx="${f(r * 1.1)}" cy="0" r="3" fill="${COLORS.cyan}" fill-opacity="0.9"/>
      </g>
      <polyline points="${trail}" fill="none" stroke="${COLORS.coral}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" stroke-opacity="0.58"/>
      ${pingMarkup}
      ${hunterMarkup}
      ${preyMarkup}
    </g>`;
  }

  /* ── avatar: the Open Zone mark behaving as a radar ────────────────────── */
  /**
   * Circular-crop-safe by construction: every painted element stays inside
   * radius 0.43 × size, so any platform's circular mask (radius 0.5) keeps it.
   * opt: { size, tau, markSvg, seed }
   */
  function avatarArt(opt) {
    const S = opt.size;
    const tau = opt.tau == null ? 0 : opt.tau;
    const seed = opt.seed == null ? 20261101 : opt.seed;
    const cx = S / 2;
    const cy = S / 2;

    /* the official mark, inlined verbatim; its visible extent is 0.604 of the
       108-unit artboard, so scale the artboard to 0.58/0.604 of the avatar. */
    const markInner = opt.markSvg
      ? opt.markSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<title>[\s\S]*?<\/title>/, '')
      : '';
    const k = (0.58 * S) / 65.2;
    const mark = markInner
      ? `<g transform="translate(${f(cx)} ${f(cy)}) scale(${k.toFixed(5)}) translate(-54 -54)">${markInner}</g>`
      : '';

    /* the coral dot sits at the gap of the mark: (12.72, -20.35) from the mark centre */
    const dotX = cx + 12.72 * k;
    const dotY = cy - 20.35 * k;

    /* report pings from the Prey dot — two per loop, so the loop closes. */
    let pings = '';
    for (let i = 0; i < 2; i++) {
      const local = C.fract(tau - i / 2);
      const age = local / 0.16;
      if (age >= 1) continue;
      pings += `<circle cx="${f(dotX)}" cy="${f(dotY)}" r="${f(S * (0.02 + age * 0.15))}" fill="none" stroke="${COLORS.coral}" stroke-width="${f(S * 0.006)}" stroke-opacity="${(0.5 * Math.pow(1 - age, 1.3)).toFixed(3)}"/>`;
    }

    const sweep = C.mod(tau * 360, 360);
    const outerR = S * 0.42;
    const arcR = S * 0.375;
    const tip = { x: arcR * Math.cos(22 * Math.PI / 180), y: arcR * Math.sin(22 * Math.PI / 180) };
    return `<rect width="${S}" height="${S}" fill="${COLORS.field}"/>
      <rect width="${S}" height="${S}" fill="url(#mhsiAvatarDots)"/>
      <defs>
        <pattern id="mhsiAvatarDots" width="${f(S / 9)}" height="${f(S / 9)}" patternUnits="userSpaceOnUse">
          <circle cx="${f(S / 18)}" cy="${f(S / 18)}" r="${f(S * 0.0016)}" fill="${COLORS.cyan}" fill-opacity="0.12"/>
        </pattern>
      </defs>
      <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(outerR)}" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.2" stroke-width="${f(S * 0.004)}" stroke-dasharray="${f(S * 0.012)} ${f(S * 0.03)}"/>
      <g transform="translate(${f(cx)} ${f(cy)})">
        <g transform="rotate(${f(sweep)})">
          <path d="${arcPath(0, 0, arcR, -22, 22)}" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.55" stroke-width="${f(S * 0.012)}" stroke-linecap="round"/>
          <circle cx="${f(tip.x)}" cy="${f(tip.y)}" r="${f(S * 0.009)}" fill="${COLORS.cyan}" fill-opacity="0.9"/>
        </g>
      </g>
      <circle cx="${f(cx)}" cy="${f(cy)}" r="${f(S * 0.295)}" fill="none" stroke="${COLORS.cyan}" stroke-opacity="0.14" stroke-width="${f(S * 0.0025)}" stroke-dasharray="${f(S * 0.008)} ${f(S * 0.02)}"/>
      ${mark}
      ${pings}`;
  }

  root.MHArt = { COLORS, field, radar: radarMarkup, avatar: avatarArt, blockMap, dotGrid, specks, markings, chalkCirclePath };
})(typeof globalThis !== 'undefined' ? globalThis : this);
