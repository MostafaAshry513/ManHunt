/* ============================================================================
   ManHunt social identity kit — artboards + deterministic renderer
   ----------------------------------------------------------------------------
   window.renderAt(t)        paints the frame for virtual time t (avatar only)
   window.MH_READY === true  fonts loaded, first frame painted, capturable

   Artboards: profile avatars (normalised square, any pixel size), platform
   headers/cards, and the link-in-bio background. The radar/field art comes
   from art.js (same motion-core system as design/brand/motion-kit); the
   official lockup is injected verbatim from src/generated/lockup.js in the
   motion kit — never retyped.
   ============================================================================ */
(async function () {
  'use strict';

  const C = window.MHCore;
  const A = window.MHArt;
  const LOCK = window.MH_LOCKUP_SVG || {};
  if (!C || !A) throw new Error('motion-core.js / art.js failed to load');

  const q = new URLSearchParams(location.search);
  const artName = q.get('art') || 'avatar';
  const avatarSize = Number(q.get('size') || 0) || 512;
  const stage = document.getElementById('stage');
  const artHost = document.getElementById('artHost');
  const ui = document.getElementById('ui');

  const HOOK = ['Your friends are', 'hunting you.'];
  const DESC = 'Real-world GPS hide-and-seek for Android.';
  const CTA = 'Create a hunt. Send the code. Hide.';
  const MICRO = 'free APK · Android 8+ · not on Play Store';
  const URL = 'http://74.208.99.178/';
  const TRUST = 'Play with people you trust.';

  /* ── helpers ───────────────────────────────────────────────────────────── */
  function el(tag, cls, css, text) {
    const node = document.createElement(tag);
    node.className = cls;
    if (css) node.style.cssText = css;
    if (text != null) node.textContent = text;
    return node;
  }
  function inlineSvg(markup) {
    const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw new Error('lockup SVG failed to parse');
    const svg = document.importNode(doc.documentElement, true);
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    return svg;
  }
  const px = (n) => n + 'px';

  /* ── artboards ─────────────────────────────────────────────────────────
     All sizes are the platforms' real upload sizes. `radar.tau` freezes the
     deterministic loop at a readable moment; avatar artboards animate. */
  const ARTS = {
    avatar: { kind: 'avatar' },

    'reddit-profile': {
      w: 1600, h: 480, seed: 20261101,
      field: { inset: 22, corner: 46 },
      radar: { cx: 1290, cy: 240, r: 190, hunters: 5, tau: 0.9 },
      text: {
        x: 84, align: 'left',
        lockup: { w: 420, y: 56 },
        rule: { y: 180, w: 120 },
        hook: { size: 66, y: 216, lines: HOOK },
        desc: { size: 19, y: 372 },
        legend: { size: 13, y: 408 },
        micro: { size: 13, y: 440 },
      },
    },

    'reddit-subreddit': {
      w: 1920, h: 384, seed: 20261101,
      field: { inset: 18, corner: 34 },
      radar: { cx: 1600, cy: 192, r: 140, hunters: 5, tau: 0.9 },
      text: {
        x: 352, align: 'left',
        lockup: { w: 300, y: 44 },
        hook: { size: 46, y: 150, lines: ['Your friends are hunting you.'] },
        desc: { size: 16, y: 224 },
        cta: { size: 14, y: 268 },
        micro: { size: 12, y: 332 },
      },
    },

    'instagram-card': {
      w: 1080, h: 1350, seed: 20261101,
      field: { inset: 18, corner: 38 },
      radar: { cx: 740, cy: 880, r: 270, hunters: 5, tau: 0.9 },
      text: {
        x: 64, align: 'left',
        lockup: { w: 420, y: 96 },
        rule: { y: 226, w: 150 },
        hook: { size: 78, y: 270, lines: HOOK },
        desc: { size: 21, y: 456 },
        legend: { size: 14, y: 1200 },
        micro: { size: 14, y: 1268 },
      },
    },

    'facebook-profile-cover': {
      w: 851, h: 315, seed: 20261101,
      field: { inset: 12, corner: 24 },
      radar: { cx: 700, cy: 158, r: 100, hunters: 5, tau: 0.9 },
      text: {
        x: 210, align: 'left',
        lockup: { w: 300, y: 40 },
        hook: { size: 36, y: 140, lines: HOOK },
        desc: { size: 14, y: 232 },
        micro: { size: 10, y: 286, align: 'right', right: 24 },
      },
    },

    'facebook-page-cover': {
      w: 1640, h: 624, seed: 20261101,
      field: { inset: 20, corner: 42, halfway: false },
      radar: { cx: 1380, cy: 312, r: 195, hunters: 5, tau: 0.9 },
      text: {
        x: 430, align: 'left',
        lockup: { w: 400, y: 170 },
        hook: { size: 58, y: 300, lines: HOOK },
        desc: { size: 18, y: 432 },
        micro: { size: 12.5, y: 460 },
      },
    },

    'tiktok-profile': {
      w: 1080, h: 1080, seed: 20261101,
      field: { inset: 18, corner: 38 },
      radar: { cx: 740, cy: 760, r: 235, hunters: 5, tau: 0.9 },
      text: {
        x: 64, align: 'left',
        lockup: { w: 380, y: 84 },
        rule: { y: 204, w: 140 },
        hook: { size: 64, y: 240, lines: HOOK },
        desc: { size: 19, y: 398 },
        legend: { size: 13, y: 1008 },
        micro: { size: 13, y: 1040 },
      },
    },

    'link-in-bio': {
      w: 1080, h: 1920, seed: 20261101,
      field: { inset: 28, corner: 58, halfway: true },
      radar: { cx: 540, cy: 1520, r: 245, hunters: 5, tau: 0.9 },
      text: {
        x: 540, align: 'center',
        lockup: { w: 520, y: 230 },
        rule: { y: 383, w: 180 },
        hook: { size: 84, y: 430, lines: HOOK },
        desc: { size: 23, y: 640 },
        cta: { size: 26, y: 1060 },
        micro: { size: 15, y: 1116 },
        url: { size: 17, y: 1154 },
        trust: { size: 14, y: 1192 },
      },
    },
  };

  /* ── avatar (normalised: renders crisp at every derivative size) ────────── */
  function buildAvatar() {
    const S = avatarSize;
    stage.style.width = S + 'px';
    stage.style.height = S + 'px';
    artHost.innerHTML = `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${A.avatar({ size: S, tau: 0, markSvg: (LOCK.mark && LOCK.mark.svg) || '' })}</svg>`;
    window.renderAt = (tSeconds) => {
      const tau = ((((tSeconds / 4) % 1) + 1) % 1);
      artHost.innerHTML = `<svg width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${A.avatar({ size: S, tau, markSvg: (LOCK.mark && LOCK.mark.svg) || '' })}</svg>`;
      return tau;
    };
    window.MH_LOOP_SECONDS = 4;
    window.renderAt(0);
  }

  /* ── headers / cards: one static composition ───────────────────────────── */
  function buildHeader(cfg) {
    stage.style.width = cfg.w + 'px';
    stage.style.height = cfg.h + 'px';
    const radarTau = cfg.radar.tau == null ? 0.9 : cfg.radar.tau;
    artHost.innerHTML = `<svg width="${cfg.w}" height="${cfg.h}" viewBox="0 0 ${cfg.w} ${cfg.h}">
      ${A.field({ w: cfg.w, h: cfg.h, seed: cfg.seed, inset: cfg.field.inset, corner: cfg.field.corner, halfway: cfg.field.halfway, idPrefix: 'mhsi' })}
      ${A.radar({ cx: cfg.radar.cx, cy: cfg.radar.cy, r: cfg.radar.r, hunters: cfg.radar.hunters, seed: cfg.seed, tau: radarTau })}
    </svg>`;

    const t = cfg.text;
    const centered = t.align === 'center';
    const alignCss = () => (centered
      ? `left:50%;transform:translateX(-50%);text-align:center;`
      : `left:${t.x}px;`);

    if (t.lockup && LOCK.horizontal) {
      const wrap = el('div', 'mh-lockup', centered
        ? `left:50%;transform:translateX(-50%);top:${t.lockup.y}px;width:${t.lockup.w}px`
        : `left:${t.x}px;top:${t.lockup.y}px;width:${t.lockup.w}px`);
      wrap.appendChild(inlineSvg(LOCK.horizontal.svg));
      wrap.firstChild.setAttribute('role', 'img');
      wrap.firstChild.setAttribute('aria-label', 'ManHunt');
      ui.appendChild(wrap);
    }

    if (t.rule) {
      const rule = el('div', 'mh-rule', `${alignCss()};top:${t.rule.y}px;width:${t.rule.w}px;display:flex;gap:8px;align-items:stretch;`);
      const bar = el('i', '', `flex:1;background:var(--chalk);opacity:.92;`);
      const head = el('i', '', `width:38%;background:var(--cyan);opacity:.9;`);
      rule.appendChild(bar);
      rule.appendChild(head);
      ui.appendChild(rule);
    }

    if (t.hook) {
      const hook = el('div', 'mh-hook', `${alignCss()};top:${t.hook.y}px;font-size:${t.hook.size}px`);
      hook.innerHTML = t.hook.lines.join('<br>');
      ui.appendChild(hook);
    }
    if (t.desc) {
      ui.appendChild(el('div', 'mh-desc', `${alignCss()};top:${t.desc.y}px;font-size:${t.desc.size}px`, DESC));
    }
    if (t.cta) {
      ui.appendChild(el('div', 'mh-cta', `${alignCss()};top:${t.cta.y}px;font-size:${t.cta.size}px`, CTA));
    }
    if (t.legend) {
      const lg = el('div', 'mh-legend', centered
        ? `left:50%;transform:translateX(-50%);top:${t.legend.y}px;font-size:${t.legend.size}px`
        : `left:${t.x}px;top:${t.legend.y}px;font-size:${t.legend.size}px`);
      const d = Math.max(7, Math.round(t.legend.size * 0.82));
      lg.innerHTML =
        `<span class="lg"><i class="dot" style="width:${d}px;height:${d}px;background:var(--coral)"></i>PREY</span>` +
        `<span class="lg"><i class="dot" style="width:${d}px;height:${d}px;background:var(--violet)"></i>HUNTERS</span>`;
      ui.appendChild(lg);
    }
    if (t.micro) {
      const css = t.micro.align === 'right'
        ? `right:${t.micro.right == null ? 24 : t.micro.right}px;top:${t.micro.y}px;font-size:${t.micro.size}px`
        : `${alignCss()};top:${t.micro.y}px;font-size:${t.micro.size}px`;
      ui.appendChild(el('div', 'mh-micro', css, MICRO));
    }
    if (t.url) ui.appendChild(el('div', 'mh-url', `${alignCss()};top:${t.url.y}px;font-size:${t.url.size}px`, URL));
    if (t.trust) ui.appendChild(el('div', 'mh-trust', `${alignCss()};top:${t.trust.y}px;font-size:${t.trust.size}px`, TRUST));

    window.renderAt = () => 0;
  }

  const art = ARTS[artName];
  if (!art) throw new Error('unknown artboard: ' + artName);
  window.MH_ART = artName;
  if (art.kind === 'avatar') buildAvatar();
  else buildHeader(art);

  try { await document.fonts.ready; } catch (err) { /* fonts still render */ }
  if (art.kind === 'avatar') window.renderAt(0);
  window.MH_READY = true;
})().catch((err) => {
  console.error('[stage] ' + (err && err.stack ? err.stack : err));
  window.MH_ERROR = String(err);
});
