/* ManHunt MATCHDAY static pack renderer.
   ?layout=feed1x1|feed1x1b|portrait4x5|story916|storyend|carousel|cover|contact
   carousel: &panel=1..5
   Sizes are fixed per layout (see statics.css); capture sets the viewport. */
(() => {
  'use strict';
  const q = new URLSearchParams(location.search);
  const layout = q.get('layout') || 'feed1x1';
  const id = 'l-' + layout;

  document.querySelectorAll('.layout').forEach((s) => { s.style.display = 'none'; });
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';

  if (layout === 'carousel') {
    const n = Math.max(1, Math.min(5, Number(q.get('panel') || 1)));
    document.querySelectorAll('.car-panel').forEach((p) => p.classList.toggle('on', Number(p.dataset.p) === n));
    const tag = document.getElementById('c-tag');
    if (tag) tag.textContent = 'MATCHDAY 0' + n + ' / 05';
  }

  if (layout === 'contact') {
    const items = [
      ['manhunt_matchday_cover_1080x1920.png', 'COVER · 1080×1920'],
      ['manhunt_matchday_feed-1x1.png', 'FEED · 1:1 · 1080×1080'],
      ['manhunt_matchday_feed-1x1-result.png', 'FEED RESULT · 1:1'],
      ['manhunt_matchday_portrait-4x5.png', 'PORTRAIT · 4:5 · 1080×1350'],
      ['manhunt_matchday_story-9x16.png', 'STORY · 9:16 · 1080×1920'],
      ['manhunt_matchday_story-end-9x16.png', 'STORY END CARD · 9:16'],
      ['manhunt_matchday_carousel-1-hook.png', 'CAROUSEL 01 · HOOK'],
      ['manhunt_matchday_carousel-2-home.png', 'CAROUSEL 02 · HOME'],
      ['manhunt_matchday_carousel-3-lobby.png', 'CAROUSEL 03 · LOBBY'],
      ['manhunt_matchday_carousel-4-hunt.png', 'CAROUSEL 04 · HUNTING'],
      ['manhunt_matchday_carousel-5-end.png', 'CAROUSEL 05 · END CARD'],
      ['manhunt_matchday_poster_1080x1920.png', 'POSTER · HOOK FRAME'],
      ['manhunt_matchday_reel15_frame.png', 'REEL 15s · HUNT FRAME'],
      ['manhunt_matchday_reel30_frame.png', 'REEL 30s · LOBBY FRAME'],
      ['manhunt_matchday_teaser_6s_480x854.gif', 'TEASER · GIF · 480×854']
    ];
    const grid = document.getElementById('csGrid');
    for (const [file, cap] of items) {
      const cell = document.createElement('div');
      cell.className = 'cs-cell';
      const img = document.createElement('img');
      img.src = '../out/' + file;
      img.alt = cap;
      img.onerror = () => { img.style.opacity = '0.15'; };
      const c = document.createElement('div');
      c.className = 'cs-cap';
      c.innerHTML = '<span class="cs-name">' + file + '</span><br>' + cap;
      cell.appendChild(img);
      cell.appendChild(c);
      grid.appendChild(cell);
    }
  }

  const imgs = Array.from(document.images);
  const ready = Promise.all(imgs.map((img) => (img.complete ? Promise.resolve() : new Promise((res) => { img.onload = img.onerror = res; }))));
  Promise.all([document.fonts.ready, ready]).then(() => { window.MH_READY = true; });
})();
