# GitHub landing page v2 — verification (final)

Generated 2026-11-02T05:05:14.306Z · Node v24.22.1 · 59/59 checks pass, 0 fail, 0 pending.

**Result: all implemented checks pass**

| Result | Check | Detail |
|---|---|---|
| PASS | docs/brand/matchday-hero-1280x560.png | 1280×560, 294 KB |
| PASS | docs/brand/github-social-matchday-1280x640.png | 1280×640, 254 KB |
| PASS | docs/brand/tag-prey-400x120.png | 400×120, 3 KB |
| PASS | docs/brand/tag-hunters-400x120.png | 400×120, 4 KB |
| PASS | docs/brand/matchday-map-band-1080x540.png | 1080×540, 481 KB |
| PASS | design/github-redesign/assets/concept-map-band-2400x936.png | 2400×936, 632 KB |
| PASS | hero GIF: 1280×560 | 1280×560 |
| PASS | hero GIF: 100 frames @ 20 fps, 5.00 s loop | 100 frames / 20 fps / 5s |
| PASS | hero GIF: infinite loop, under 2 MB | loop=0, 795 KB |
| PASS | docs/brand/readme-hero.gif intact | 1280×480 |
| PASS | docs/brand/github-social-1280x640.png intact | 1280×640 |
| PASS | docs/brand/avatar-1024.png intact | 1024×1024 |
| PASS | docs/brand/lockup-light-on-dark.png intact | 1200×328 |
| PASS | docs/brand/lockup-dark-on-light.png intact | 1200×328 |
| PASS | stage uses the brand OFL faces from the motion kit |  |
| PASS | hero uses the official lockup PNG |  |
| PASS | hero carries the honest install micro-line |  |
| PASS | hero map plate carries OSM attribution |  |
| PASS | hero stage has no external http assets |  |
| PASS | stage is render-only (not referenced by README) | assets are baked into PNG/GIF |
| PASS | README.md: file exists and is non-trivial | 10.3 KB |
| PASS | README.md: exactly one H1 | 1 H1 |
| PASS | README.md: H1 is "ManHunt" |  |
| PASS | README.md: no draft note in final | checked |
| PASS | README.md: section “The map is the field” |  |
| PASS | README.md: section “Two sides” |  |
| PASS | README.md: section “Four beats, one organiser” |  |
| PASS | README.md: section “In the app” |  |
| PASS | README.md: section “Watch the film” |  |
| PASS | README.md: section “The rules the server keeps” |  |
| PASS | README.md: section “Get on the field” |  |
| PASS | README.md: section “Status and limits” |  |
| PASS | README.md: every <img> has alt text | 14 images |
| PASS | README.md: non-premium image files exist | 6 local images |
| PASS | README.md: all image files exist | 14 images resolve |
| PASS | README.md: local link targets exist | 10 links resolve |
| PASS | README.md: in-page anchors match headings | 2 anchors |
| PASS | README.md: no mojibake |  |
| PASS | README.md: no old slogan |  |
| PASS | README.md: honest install line present |  |
| PASS | README.md: honest status present |  |
| PASS | README.md: trust line present |  |
| PASS | README.md: provisional copy family used |  |
| PASS | README.md: no placeholder strings |  |
| PASS | README.md: uses only premium app captures (no old CI screenshot set) |  |
| PASS | README.md: map section uses the real capture band |  |
| PASS | README.md: includes the real result capture |  |
| PASS | README.md: no pending/draft language |  |
| PASS | design/github-redesign/preview/desktop-1012.png: 1200px wide, full page | 1200×4858 |
| PASS | design/github-redesign/preview/desktop-1012-light.png: 1200px wide, full page | 1200×4858 |
| PASS | design/github-redesign/preview/mobile-390.png: 390px wide, full page | 390×6606 |
| PASS | preview supports light mode render |  |
| PASS | footer wordmark switches with prefers-color-scheme |  |
| PASS | concept documents the capture update procedure |  |
| PASS | concept documents what is removed from the old README |  |
| PASS | concept documents GitHub surface constraints |  |
| PASS | final: all required premium captures present | all present |
| PASS | final: premium manifest present |  |
| PASS | final: root README implemented, draft remains as record |  |

## Constraints encoded

- Hero: 1280×560, 100 frames @ 20 fps, 5.00 s infinite loop, under 2 MB; official lockup PNG, brand OFL
  faces and OSM attribution; no external assets.
- New assets are additive: the existing approved identity files (readme hero GIF, social card, avatar,
  lockups) are still present with their original dimensions.
- Draft README: exact copy deck, one H1, the nine sections, alt text on every image, honest install/status
  copy, no old slogan, no mojibake; premium image refs listed as pending until the capture drop.
- Final mode additionally requires every image and link to resolve and the draft note to be gone.

Reproduce: `node tools/build-assets.mjs && node tools/verify.mjs` (draft) ·
`node tools/verify.mjs --final` (once README.md is implemented).
