# ManHunt motion kit — verification

Generated 2026-11-01T16:31:34.275Z · Node v24.22.1 · 77/77 checks pass.

Renderers: headless Chrome (CDP, exact viewport) for PNG/GIF frames, ffmpeg-static for GIF encoding
and metadata, and headless-Chrome DOM/animation assertions for the CSS-only site hero.

**Result: all checks pass**

| Result | Check | Detail |
|---|---|---|
| PASS | out/readme/manhunt-readme-hero-1280x480.gif · GIF 1280×480 | 1280×480 |
| PASS | out/readme/manhunt-readme-hero-1280x480-static.png · PNG 1280×480 | 1280×480, 92.1 KB |
| PASS | out/readme/manhunt-readme-hero-noslogan-1280x480.png · PNG 1280×480 | 1280×480, 79.2 KB |
| PASS | out/readme/manhunt-readme-hero-noslogan-1280x640.png · PNG 1280×640 | 1280×640, 106.6 KB |
| PASS | out/social/github-social-1280x640.png · PNG 1280×640 | 1280×640, 120.2 KB |
| PASS | out/social/github-social-1280x640.gif · GIF 1280×640 | 1280×640 |
| PASS | out/social/github-social-1280x640-noslogan.png · PNG 1280×640 | 1280×640, 106.6 KB |
| PASS | out/social/x-header-1500x500.png · PNG 1500×500 | 1500×500, 94.6 KB |
| PASS | out/social/youtube-2560x1440-safe-area.png · PNG 2560×1440 | 2560×1440, 167.5 KB |
| PASS | out/social/youtube-2560x1440-safe-area-guide.png · PNG 2560×1440 | 2560×1440, 244.3 KB |
| PASS | out/social/discord-960x540.png · PNG 960×540 | 960×540, 83.9 KB |
| PASS | out/social/discord-960x540.gif · GIF 960×540 | 960×540 |
| PASS | out/site/manhunt-site-hero-1200x600.png · PNG 1200×600 | 1200×600, 101.3 KB |
| PASS | out/site/manhunt-site-hero-1200x600-poster.png · PNG 1200×600 | 1200×600, 101.5 KB |
| PASS | out/app/manhunt-app-hero-1080x480-tau-00.png · PNG 1080×480 | 1080×480, 56.6 KB |
| PASS | out/app/manhunt-app-hero-1080x480-tau-20.png · PNG 1080×480 | 1080×480, 57.6 KB |
| PASS | out/app/manhunt-app-hero-1080x480-tau-40.png · PNG 1080×480 | 1080×480, 63.8 KB |
| PASS | out/app/manhunt-app-hero-1080x480-tau-60.png · PNG 1080×480 | 1080×480, 61.8 KB |
| PASS | out/app/manhunt-app-hero-1080x480-tau-80.png · PNG 1080×480 | 1080×480, 57.4 KB |
| PASS | out/readme/manhunt-readme-hero-1280x480.gif: 100 frames @ 20 fps | 100 frames, 20 fps |
| PASS | out/readme/manhunt-readme-hero-1280x480.gif: 5.00 s loop metadata | 5s |
| PASS | out/readme/manhunt-readme-hero-1280x480.gif: infinite loop flag (NETSCAPE2.0 loop=0) | loop=0 |
| PASS | out/readme/manhunt-readme-hero-1280x480.gif: under 4 MB | 1.10 MB |
| PASS | out/social/github-social-1280x640.gif: 100 frames @ 20 fps | 100 frames, 20 fps |
| PASS | out/social/github-social-1280x640.gif: 5.00 s loop metadata | 5s |
| PASS | out/social/github-social-1280x640.gif: infinite loop flag (NETSCAPE2.0 loop=0) | loop=0 |
| PASS | out/social/github-social-1280x640.gif: under 4 MB | 1.49 MB |
| PASS | out/social/discord-960x540.gif: 100 frames @ 20 fps | 100 frames, 20 fps |
| PASS | out/social/discord-960x540.gif: 5.00 s loop metadata | 5s |
| PASS | out/social/discord-960x540.gif: infinite loop flag (NETSCAPE2.0 loop=0) | loop=0 |
| PASS | out/social/discord-960x540.gif: under 4 MB | 0.91 MB |
| PASS | out/social/github-social-1280x640.png: field + chalk + cyan + coral + violet present | {"field":353879,"chalk":8425,"cyan":2552,"coral":225,"violet":343} |
| PASS | out/social/x-header-1500x500.png: field + chalk + cyan + coral + violet present | {"field":315905,"chalk":6406,"cyan":1835,"coral":192,"violet":326} |
| PASS | out/social/youtube-2560x1440-safe-area.png: field + chalk + cyan + coral + violet present | {"field":1659732,"chalk":12310,"cyan":2608,"coral":295,"violet":383} |
| PASS | out/social/discord-960x540.png: field + chalk + cyan + coral + violet present | {"field":219837,"chalk":3218,"cyan":1485,"coral":174,"violet":320} |
| PASS | out/site/manhunt-site-hero-1200x600-poster.png: field + chalk + cyan + coral + violet present | {"field":304112,"chalk":12640,"cyan":1602,"coral":141,"violet":312} |
| PASS | site hero: renders 1200×600 frame | 1200×600 |
| PASS | site hero: no JavaScript at all | 0 script tags |
| PASS | site hero: no external resources requested | [] |
| PASS | site hero: CSS animations running | 12 animations |
| PASS | site hero: wordmark is 7 drawn paths (no retyped text) | 7 paths, 0 <text> nodes |
| PASS | site hero: hook is the approved short form | "Hide from your friends." |
| PASS | site hero: hook scales with the frame (container query) | 75.96px |
| PASS | site hero: exactly one h1 in the hero |  |
| PASS | site hero: no horizontal overflow | overflow 0px |
| PASS | site hero: svg viewBox 1200×600 | 0 0 1200 600 |
| PASS | site hero: live still is 1200×600 PNG | 1200×600 |
| PASS | site hero: reduced-motion poster is 1200×600 PNG | 1200×600 |
| PASS | site hero: prefers-reduced-motion disables all animation | 0 active |
| PASS | site hero: reduced motion hides ping rings | none |
| PASS | site hero: poster keeps the hook + composition | Hide from your friends. @ 75.96px |
| PASS | site hero install width: fits the 640 px page column | 640px, overflow 0px |
| PASS | site hero install width: hook stays readable (≥30 px) | 40.512px |
| PASS | site hero install width: descriptor stays visible |  |
| PASS | site hero mobile 390: no horizontal overflow | overflow 0px |
| PASS | site hero mobile 390: hook ≥24 px | 29.64px |
| PASS | site hero mobile 390: wordmark stays above min size (≥117 px wide) | 176px |
| PASS | site hero mobile 390: secondary copy hidden | none |
| PASS | snippet: no <script> tag |  |
| PASS | snippet: safe inside a TS template literal (no backticks, no ${) |  |
| PASS | snippet: scoped under .mh-hero |  |
| PASS | snippet: reduced-motion media query present |  |
| PASS | snippet: container query present |  |
| PASS | snippet: contains the approved short line |  |
| PASS | snippet: contains the honest install line |  |
| PASS | snippet: no network asset references |  |
| PASS | snippet: wordmark inlined as official drawn paths |  |
| PASS | snippet docs mention the paste target |  |
| PASS | generated lockup module is provenance-stamped |  |
| PASS | lockup: byte-identical to identity/final/lockup for all 6 files | 6 files verified |
| PASS | lockup: every official path is inlined verbatim (never retyped) | 8 paths, 0 missing |
| PASS | lockup: mark geometry present in inlined lockup |  |
| PASS | stage: approved hook used on social/README artboards |  |
| PASS | stage: honest install microcopy used |  |
| PASS | stage: banners carry the invite CTA |  |
| PASS | stage: no hand-drawn wordmark paths (uses generated official lockup) |  |
| PASS | out/: no stray working files |  |

## Constraints encoded in the checks

- README hero GIF: 1280×480, 100 frames, 20 fps, 5.00 s, infinite NETSCAPE2.0 loop, < 4 MB
  (actual 1.10 MB).
- Social banner GIFs: 1280×640 and 960×540, same 5 s / 20 fps loop.
- Site hero: zero `<script>` tags, zero network resource entries, CSS keyframe animations only;
  `prefers-reduced-motion: reduce` leaves 0 running animations and a complete static composition.
- Site hero: 1200×600 at desktop; scales down the install page's 640 px column and a 390 px phone
  via container queries with no horizontal overflow, and keeps the wordmark above its minimum size.
- Official lockup: all six SVGs byte-identical to `design/brand/identity/final/lockup/`, and every
  official path is inlined verbatim — nothing retyped or letter-spaced.
- Palette: every hero/banner still contains field, chalk, cyan, coral and violet flat-fill pixels.

Reproduce: `node tools/build.mjs && node tools/verify.mjs`.
