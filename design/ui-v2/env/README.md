# ManHunt UI/UX v2 — design environment

Owner: **design-env**. Everything a designer needs to build, preview and render a full-page
direction at the exact review canvas. Read this before your first page; it is the contract.

Workstream root: `design/ui-v2/`
Tooling root: `design/ui-v2/env/` (this folder)
Preview server root: the **repository root** (`/root/ManHunt`) — that is why every path in this
document starts with `/design/...`.

**Status:** ready. Playwright 1.64.1 + headless Chromium 156 are installed in `env/.browsers/`;
no system browser is needed and no `npm install` is required to render.

---

## 1. TL;DR — the only four commands

All commands are run from the repository root (`/root/ManHunt`) unless stated otherwise; target
paths resolve against the current directory first and then the repo root, `--out` against the current directory.

```bash
# 1. preview in a browser (static server rooted at the repo; Ctrl-C to stop)
node design/ui-v2/env/serve.mjs                     # -> http://127.0.0.1:4173/

# 2. render one page  -> design/ui-v2/directions/<dir>/out/<page>.png   (1170x2532)
node design/ui-v2/env/render.mjs design/ui-v2/directions/a-matchday-raised/home.html

# 3. render the whole direction folder in one command -> <dir>/out/*.png
node design/ui-v2/env/render.mjs design/ui-v2/directions/a-matchday-raised

# 4. contact sheet for one direction -> design/ui-v2/env/out/sheets/<dir>.png
node design/ui-v2/env/contact-sheet.mjs --only a-matchday-raised
```

`node design/ui-v2/env/render.mjs --all` renders every direction folder. `node design/ui-v2/env/contact-sheet.mjs` (no args)
renders every direction, builds every per-direction sheet, the cross-direction matrix and the
gallery at `env/out/index.html`.

---

## 2. Canvas contract — non-negotiable

One page = one full-bleed phone screen. There is **no app chrome to design around** — you design the
whole thing.

| Property | Value |
|---|---|
| Logical canvas | **390 × 844 dp** (CSS px) |
| Rendered PNG | **exactly 1170 × 2532 px** (deviceScaleFactor **3**) |
| Capture | viewport shot, no scaling, sRGB, scrollbars hidden |
| Margins | 0 around the page; **24 dp outer margin by default** for content (`--mh-gutter`) |
| Primary theme | **dark**; light is a proof (`<html data-theme="light">`) |
| RTL proof | `<html lang="ar" dir="rtl">` + Arabic face (section 5) |

**Anti-map — do not draw any of these, they are the OS, not the app:**

- ❌ status bar / battery / Wi-Fi / clock at the top
- ❌ navigation bar, three-button or gesture bar, home indicator
- ❌ on-screen keyboard or keyboard hints
- ❌ device frame, rounded phone body, notch/camera cut-out
- ❌ browser chrome, tab bar, address bar, scrollbars
- ❌ page margins/letterboxing (the design is edge-to-edge; `html`/`body`/`.page` are full-bleed)

The **bottom gesture strip is usable canvas** — put real UI there if your direction wants to. The app
does not reserve OS chrome space.

Rules the renderer enforces or warns about:

1. **Exactly one `.page` root, 390 × 844**, inside `<body>`. The reset already sizes `html`, `body`
   and `.page`.
2. **No page scrolling.** The capture is the viewport; anything past 844 dp is clipped and the
   renderer prints `[warn] content overflows the canvas`. If a page needs a scroll region (long
   list, field log), build the region inside the page and hide its scrollbar.
3. **No external assets.** No network URLs, stock images, AI imagery, icon CDNs or web fonts other
   than the bundled repo faces. Everything must render offline from repo files (fonts/marks below).
4. **Original vector/CSS work only.** The Open Zone mark geometry and the wordmark are fixed — place
   the official SVGs, never recut, retype or redraw them.
5. **Accessibility:** WCAG AA contrast, ≥48 dp touch targets, body text ≥14 sp (auxiliary ≥12 sp),
   visible focus/selected states, colour never the only signal.
6. **Overlays** (`sheet-tag-claim`, `sheet-room-settings`) are full-page app states: render the page
   behind them dimmed (`.mh-scrim`) — still no OS chrome, no modal window furniture.
7. **Realistic state where the page has one:** empty / loading / error / offline / reconnecting /
   paused / eliminated. No fake metrics, player counts or urgency.

---

## 3. How a page links the environment (canonical — read this if you read nothing else)

### 3.1 Stylesheet path

Pages are always loaded through the **repo-rooted server** (`serve.mjs` for preview, `render.mjs` for
capture). Reference the shared canvas with the **repo-root absolute path**:

```html
<link rel="stylesheet" href="/design/ui-v2/env/canvas.css">
```

This is the contract for all three directions: it does not depend on how deep your page sits and it
is what the renderer serves. A relative path (e.g. `../../env/canvas.css`) also resolves when the
page is directly inside `directions/<dir>/`, but **use the root path** so every direction matches.

**Do not fork or copy `canvas.css`.** If your direction needs different tokens, override the custom
properties in your own direction stylesheet (or on `.page`), and link it after `canvas.css`:

```html
<link rel="stylesheet" href="/design/ui-v2/env/canvas.css">
<link rel="stylesheet" href="/design/ui-v2/directions/<dir>/direction.css">
```

**Never open pages with `file://`** — brand fonts and Arabic shaping need the HTTP server; `file://`
pages fail same-origin font loading and you get fallback fonts.

### 3.2 Minimal page skeleton

```html
<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Home — Matchday Raised</title>
  <link rel="stylesheet" href="/design/ui-v2/env/canvas.css">
  <style>/* this page's layout, on top of the canvas */</style>
</head>
<body>
  <main class="page">
    <!-- full 390x844 screen; draw the whole app page -->
  </main>
</body>
</html>
```

Light proof: set `data-theme="light"` on `<html>`. RTL proof: `lang="ar" dir="rtl"`.

---

## 4. Brand fonts

All bundled, OFL, loaded from `design/brand/motion-kit/assets/fonts/` by `canvas.css` — you do not
copy or import them.

| Family | Weights | Role | CSS var |
|---|---|---|---|
| **Big Shoulders** | 400, 700 | display: headlines, scoreboard numerals, labels at scale | `--mh-font-display` |
| **Instrument Sans** | 400, 700 | UI text, body, buttons, prose | `--mh-font-ui` |
| **Red Hat Mono** | 400, 700 | data: time, codes, coordinates, small labels, tabular numerals | `--mh-font-mono` |
| **IBM Plex Sans Arabic** | 400, 700 | Arabic body/UI only (RTL proof) | `--mh-font-arabic` / `--font-arabic` |

```html
<link rel="stylesheet" href="/design/ui-v2/env/canvas.css">
<p class="mh-display">Full time</p>
<p class="mh-ui">Quiet UI text.</p>
<p class="mh-mono mh-tabular">41:12 · K7M2QX</p>
```

Do not add other fonts. Body copy ≥ 14 sp; mono data can go to 12 sp; nothing essential below 12 sp.

### 4.1 Brand mark and wordmark

Official SVGs only, from `design/brand/identity/final/lockup/` (served at
`/design/brand/identity/final/lockup/...`):

| Use | File |
|---|---|
| Mark on dark | `/design/brand/identity/final/lockup/mark-light-on-dark.svg` |
| Mark on light | `/design/brand/identity/final/lockup/mark-dark-on-light.svg` |
| Mark, one colour | `/design/brand/identity/final/lockup/mark-mono.svg` |
| Horizontal lockup on dark | `lockup-horizontal-light-on-dark.svg` |
| Horizontal lockup on light | `lockup-horizontal-dark-on-light.svg` |
| Stacked lockup | `lockup-stacked-light-on-dark.svg` / `lockup-stacked-dark-on-light.svg` |
| Wordmark only | `wordmark-light-on-dark.svg` / `wordmark-dark-on-light.svg` |

```html
<img src="/design/brand/identity/final/lockup/mark-light-on-dark.svg"
     alt="ManHunt" width="40" height="40">
```

Inline `<svg>` copies of the mark are allowed (e.g. the smoke-test page does this) but keep the
geometry identical to the official file. Never recolour the cyan/coral mark arbitrarily — in a
one-colour context use `mark-mono.svg` or an opacity treatment, and document why in `NOTES.md`.

---

## 5. Arabic / RTL proof (`lobby-rtl`)

IBM Plex Sans Arabic (OFL) is bundled at `env/fonts/arabic/`:
`IBMPlexSansArabic-Regular.ttf`, `IBMPlexSansArabic-Bold.ttf`, `OFL.txt`.

`canvas.css` loads it and exposes it as `--mh-font-arabic` (alias `--font-arabic`), for Arabic
body/UI **only**. Arabic glyphs fall through to it from the brand stacks, so Latin letters, numerals
and room codes keep their brand voice; to set a whole Arabic string in the Arabic face use
`.mh-arabic`.

```html
<html lang="ar" dir="rtl" data-theme="dark">
...
<p lang="ar">اختبئ من أصدقائك.</p>
<p class="mh-mono mh-ltr">K7M2QX</p>   <!-- numerals/codes stay LTR -->
```

- `lobby-rtl` must be a **genuinely mirrored lobby**, not a degrotate: mirror layout, paddings,
  icon directions and reading order; keep numerals, times, room codes and coordinates LTR.
- Use logical properties where possible (`margin-inline`, `padding-inline`, `inset-inline-start`,
  `border-start-start-radius`) so the same page can serve LTR and RTL.
- Do not letter-space Arabic; do not uppercase Arabic; allow line-height ≥ 1.45 for diacritics.
- Font proof: `node design/ui-v2/env/render.mjs design/ui-v2/env/samples/_font-check.html --out /tmp/fontcheck` renders all
  four faces + mixed Arabic/Latin on one page.

---

## 6. Tokens and helper classes

`canvas.css` ships *starting* tokens, not a finished design system — directions reweight or extend
them and record that in `NOTES.md`. The **meaning** of the palette is fixed across all directions:
cyan = field/rule/time, coral = Prey/exposed, violet = Hunters/closing in.

| Token | Dark (default) | Light (`data-theme="light"`) | Meaning |
|---|---|---|---|
| `--mh-bg` / `--mh-bg-deep` | `#0B1220` / `#070D18` | `#F7F9FC` / `#E6ECF5` | field, page background |
| `--mh-surface` / `--mh-surface-raised` | `#111C2E` / `#16233A` | `#FFFFFF` / `#FFFFFF` | raised plates |
| `--mh-ink` / `--mh-ink-dim` / `--mh-ink-mute` | `#E6EDF7` / `#A9B8CC` / `#6F829B` | `#0F172A` / `#475569` / `#7C8CA3` | chalk text, 3 levels |
| `--mh-rule` / `--mh-rule-strong` | chalk @ 16% / 32% | `#D3DCE8` / `#B6C2D4` | hairlines, dividers |
| `--mh-cyan` | `#22D3EE` | `#0C6B84` | field, rule, time |
| `--mh-coral` | `#FF7A59` | `#B33A0F` | Prey, exposed |
| `--mh-violet` | `#A79BFF` | `#5B21B6` | Hunters, closing in |
| `--mh-on-accent` | `#04121A` | `#FFFFFF` | text on accent fills |
| `--mh-gutter` | `24px` | default outer margin |
| `--mh-radius` / `--mh-hairline` | `2px` / `1px` | small radius, rule width |
| `--mh-font-display/-ui/-mono/-arabic` | brand families | type roles |

`<html data-theme="light">` swaps the whole set to the brand **daylight chalk** theme — the same
values as the shipped `Theme.kt` `LightColors` (`design/redesign/tokens.md` §3.2): chalk ground
`#F7F9FC`, white plates, ink `#0F172A`, and accents darkened for AA (`cyan → #0C6B84`,
`coral → #B33A0F`, `violet → #5B21B6`). It is deliberately **not cream** — do not add cream or beige
as the light ground; the `home-light` proof can rely on these tokens directly. Pages without a
`data-theme` follow the capture colour scheme (`render.mjs --scheme light` previews them).
A one-page light-token proof is `design/ui-v2/env/samples/_light-check.html`.

Helper classes (all optional; directions may replace them in their own CSS):

| Class | What it does |
|---|---|
| `.page` | the required 390 × 844 full-bleed root |
| `.mh-display` | Big Shoulders 700, uppercase, tight leading |
| `.mh-ui` | Instrument Sans |
| `.mh-mono` | Red Hat Mono + tabular numerals |
| `.mh-label` | mono 12 sp, uppercase, tracked |
| `.mh-tabular` | tabular figures / `tnum` |
| `.mh-safe` | `padding: var(--mh-gutter)` |
| `.mh-hairline` | 1 dp chalk rule |
| `.mh-scrim` | dim layer for overlay pages behind sheets |
| `.mh-touch` | ≥ 48 × 48 dp hit area, centred content |
| `.mh-sr-only` | visually hidden, screen-reader available |
| `.mh-arabic` | Arabic face (use for whole Arabic strings) |
| `.mh-ltr` | isolate a numeric/code run as LTR inside RTL text |

---

## 7. Page set and filenames

Put your page files in `design/ui-v2/directions/<your-direction>/pages/` (preferred — this is what
tasks 3/4/5 ask for) **or** directly in `design/ui-v2/directions/<your-direction>/` (also supported).
Rendered PNGs belong in `design/ui-v2/directions/<your-direction>/out/`. Use these exact stems in
either layout, no other page subfolders — contact sheets line directions up by these ids, so anything
missing renders as a labelled *not rendered* placeholder and anything non-canonical is appended as an
extra.

| # | File | Page | Must show |
|---|---|---|---|
| 1 | `auth.html` | Sign in / create local account | quiet form, server row demoted, brand line |
| 2 | `roles.html` | Sides + mode catalogue | Prey vs Hunters explained, Classic playable, planned modes honest |
| 3 | `home.html` | Host or join | host action, join-by-code, profile/settings entry |
| 4 | `lobby.html` | Room lobby (host view, everyone ready) | room code, team sheet, readiness, begin dock |
| 5 | `hunt-hunter.html` | Live hunt, Hunter view | map-first, reports + trails + zone, clock, tag action |
| 6 | `hunt-prey.html` | Live hunt, Prey view | own position, zone/clock, report cadence, no other prey positions |
| 7 | `chat.html` | Room field log | messages + system events, composer |
| 8 | `result.html` | Full time | winner, final score, duration, rematch/lobby/history |
| 9 | `history.html` | Past hunts | list + one match summary |
| 10 | `settings.html` | Settings | theme, text size, language, permissions, updates, server |
| 11 | `sheet-tag-claim.html` | Sheet — Prey receives tag claim | confirm / dispute, who/when, consequence copy |
| 12 | `sheet-room-settings.html` | Sheet — host edits hunt rules | timers, zone/shrink, trails, report interval, tag policy |
| 13 | `lobby-rtl.html` | Proof — Arabic RTL lobby | genuinely mirrored lobby, LTR numerals/code |
| 14 | `home-light.html` | Proof — light theme Home | same Home in daylit chalk theme |

Seed data is consistent everywhere (same fictional match, no invented stats):
**"Riverside Run"**, code **K7M2QX**, 5 players (3 Hunters / 2 Prey), zone 240 m, clock 41:12,
duration 60:00. Player names: Nadia, Omar, Selim, Rana, Youssef.

Optional extra files in your direction folder: `NOTES.md` (visual thesis + review response),
`direction.css` (shared direction styles), `out/` (your rendered PNGs). Keep all visual work
inside your direction folder; do not edit `env/`, `skills/`, `briefs/` or another direction.

---

## 8. Rendering (`render.mjs`)

```bash
node design/ui-v2/env/render.mjs <file.html | directory> [more targets...] [options]

  --out <dir>        write PNGs to <dir> (default: <source folder>/out/)
  --scheme <dark|light>   prefers-color-scheme for pages without data-theme (default dark)
  --light            shorthand for --scheme light
  --all              render every folder under design/ui-v2/directions/
  --settle <ms>      extra delay after fonts/images settle (default 120)
  --quiet            errors + summary only
```

- Direction folders are resolved as `<direction>/pages/*.html` when that folder contains pages,
  otherwise `<direction>/*.html`. Either way the **default output is `<direction>/out/<stem>.png`**.
  Pointing the renderer at a page file or at a `pages/` folder directly also writes to
  `<direction>/out/` unless `--out` is given.
- Output name = source stem, e.g. `home.html -> out/home.png`.
- **Every capture is exactly 1170 × 2532 px.** The renderer reads the PNG header back and hard-fails
  with a non-zero exit code if a capture is not the contract size.
- Before capture it waits for `document.fonts.ready`, every `<img>` to load/decode, then two
  animation frames plus the settle delay. CSS animations/transitions are fast-forwarded and the
  caret is hidden, so stills are deterministic.
- Useful diagnostics printed per page: `[warn] content overflows the canvas` (scroll size vs
  390 × 844), failed font faces, broken images, page JS errors.
- Rendering both themes: pages with explicit `data-theme` ignore `--scheme`; pages without one follow
  it. There is no separate light/devicelight output — render the explicit light proof page.

Typical log:

```
[env] canvas 390x844 dp @3x => 1170x2532 px | scheme dark | 3 page(s)
[render] design/ui-v2/directions/a-matchday-raised/home.html -> .../out/home.png  1170x2532  74 KiB  312 ms
[render] done: 3/3 page(s) rendered in 1.1s at exactly 1170x2532 px
```

---

## 9. Preview server (`serve.mjs`)

```bash
node design/ui-v2/env/serve.mjs                  # http://127.0.0.1:4173/  (auto-increments if busy)
node design/ui-v2/env/serve.mjs --port 5000      # explicit port
```

- Rooted at the **repository root**, so `/design/...` URLs for fonts, marks and direction assets
  work exactly as written above.
- `/` is a generated index: smoke test, README, briefs, skills, each direction's pages (with
  missing-page counts), contact sheets and a raw-tree browser.
- Any folder URL gets a clickable listing; any file URL is served with the right MIME type.
- It runs until Ctrl-C; it is only needed for humans and for the renderer's own HTTP fetch (the
  renderer starts its own ephemeral server, so you do not need `serve.mjs` running to render).

---

## 10. Contact sheets (`contact-sheet.mjs`)

```bash
node design/ui-v2/env/contact-sheet.mjs                          # everything: pages + sheets + matrix + gallery
node design/ui-v2/env/contact-sheet.mjs --only a-matchday-raised # one direction's sheet (+ matrix/gallery refresh)
node design/ui-v2/env/contact-sheet.mjs --matrix                 # only the cross-direction matrix
node design/ui-v2/env/contact-sheet.mjs --strips                 # only the per-page A|B|C comparison strips
node design/ui-v2/env/contact-sheet.mjs --pages                  # only fresh 3x page captures
node design/ui-v2/env/contact-sheet.mjs --sheet                  # only per-direction sheets
node design/ui-v2/env/contact-sheet.mjs --gallery                # only rebuild env/out/index.html
  --dirs <dir>   directions root (default design/ui-v2/directions)
  --out <dir>    output root (default design/ui-v2/env/out)
  --force        re-render pages even if cached
```

Outputs (all under `design/ui-v2/env/out/` unless `--out` says otherwise):

| Output | Content | Exact size |
|---|---|---|
| `pages/<direction>/<page>.png` | fresh 3x page captures used by the sheets | 1170 × 2532 px each |
| `sheets/<direction>.png` | one direction, all 14 canonical pages, labelled 4-column grid | **2704 × 6128 px** (2× of 1352 × 3064 CSS; printed at build) |
| `sheets/matrix.png` | pages (rows) × directions (columns) comparison — the owner/judging sheet | **1858 × 13420 px** for 3 directions (2×; width grows per direction, height printed at build) |
| `strips/<page>.png` | **one row per canonical page**: A / B / C side by side at 390 raster px thumbs (= 1/3 of the 1170 px capture), with direction labels — the reviewer's equal-weight page-by-page pass | **1426 × 1576 px** each for 3 directions (height printed at build) |
| `contact-<direction>.png` | review-pack copy of `sheets/<direction>.png` (task-8 canonical name) | same as the sheet |
| `matrix-all-directions.png` | review-pack copy of `sheets/matrix.png` (task-8 canonical name) | same as the matrix |
| `index.html` | clickable gallery over pages, sheets, strips and matrix | — |
| `_src/*.html` | intermediate sheet documents (debug only, git-ignored) | — |

- Direction folders are discovered in either layout: `<direction>/pages/*.html` when present, else
  `<direction>/*.html`; the sheet's internal captures always go to `env/out/pages/<direction>/`
  (a direction's own `out/` proofs are never touched).
- Page captures are cached: only pages whose source (or `canvas.css`, or a sibling asset) changed
  since the PNG are re-rendered. Use `--force` after changing anything the page imports from elsewhere.
- The sheet uses its **own** captures in `out/pages/`; it never writes into a direction folder and
  never overwrites a designer's `out/` proofs.
- Direction sheet thumbnails are 292 CSS px wide (584 raster px in the 2× PNG, 0.75× of the capture);
  the matrix uses 195 CSS px (**390 raster px** in the 2× PNG — exactly 1/3 of the 1170 px capture, the
  reviewer's "scoreboard/thumbnail" read for distinctiveness + hierarchy). Both stay inspectable when
  zoomed; review evidence should quote the PNG sizes above.
- The gallery is the thing to open for a whole-direction or cross-direction review: it links every
  full-resolution page PNG, the direction sheets, the per-page strips and the matrix.
- Strips are built from the same `out/pages/` captures as the sheets, so a page judged on a strip and
  on its direction sheet is the same render. They exist because the full matrix is ~13,400 px tall and
  gets downscaled by image viewers; each strip is small enough to inspect at native size.

**Self-test fixture** (five-second proof the whole chain works, writes only outside the real
review output):

```bash
node design/ui-v2/env/render.mjs design/ui-v2/env/samples/fixture-directions/dir-a --out /tmp/env-smoke/pages
node design/ui-v2/env/contact-sheet.mjs --dirs design/ui-v2/env/samples/fixture-directions --out /tmp/env-smoke/out
```

That renders a 3-page dummy direction in one command and produces `dir-a/dir-b/dir-c` sheets +
matrix + gallery in `/tmp/env-smoke/out`. The fixture pages are deliberately not designs; they exist
to prove the toolchain.

---

## 11. Smoke proof (task-1 acceptance)

```bash
node design/ui-v2/env/render.mjs design/ui-v2/env/samples/sample.html --out design/ui-v2/env/out
# -> design/ui-v2/env/out/sample.png : 1170 x 2532, brand fonts + Open Zone mark, full-bleed
```

The proof file is on disk at `design/ui-v2/env/out/sample.png`. It exercises Big Shoulders,
Instrument Sans, Red Hat Mono, the cyan/coral/violet roles and the page canvas. Arabic faces are
proven by `design/ui-v2/env/samples/_font-check.html` (`--out /tmp/fontcheck`).

---

## 12. Troubleshooting

| Symptom | Fix |
|---|---|
| `Playwright is not installed` | `cd design/ui-v2/env && npm install` |
| `Executable doesn't exist at .../.browsers/...` | `cd design/ui-v2/env && npm run install-browser`; if the browser complains about shared libraries, `npm run install-deps` (root + apt; already done on this host) |
| Brand fonts fall back to Arial/DejaVu | You opened the page via `file://`; use `serve.mjs` or `render.mjs`. Confirm `GET /design/ui-v2/env/canvas.css` = 200 and that you did not move/copy `canvas.css` |
| Arabic shows tofu/blocks | Use `<html lang="ar" dir="rtl">` (or `lang="ar"` on the Arabic element) so `:lang(ar)` selects IBM Plex Sans Arabic; check `samples/_font-check.html` renders |
| `[warn] content overflows the canvas` | Your page is taller/wider than 390 × 844. Fit the viewport or make a bounded inner scroll region; the renderer clips at the page edge |
| Render says `screenshot ... != expected ...` | The viewport/canvas were changed outside this env; do not edit `render.mjs` dimensions — ask design-env |
| Contact sheet cell says *not rendered* | The page file is missing/named non-canonically, or `--pages` was not run; run the sheet command again |
| Port 4173 in use | `serve.mjs` auto-increments the port and prints the URL; or pass `--port` |
| Two designers render at once | Safe: the renderer uses an ephemeral port and its own Chromium profile per run |
| Large matrix PNG is slow to open | It is intentionally tall (all pages × directions); open `env/out/index.html` and use the per-direction sheets for detail |

---

## 13. Environment internals / maintenance

```
design/ui-v2/env/
  package.json          pinned Playwright 1.64.1, scripts
  render.mjs            single page / direction folder -> exact PNGs
  serve.mjs             repo-rooted preview server + generated index
  contact-sheet.mjs     per-direction sheets, cross-direction matrix, gallery
  canvas.css            canvas reset + brand @font-face + tokens + Arabic/RTL + helpers
  lib/server.mjs        shared static server (MIME, traversal guard, directory listing)
  lib/browser.mjs       Playwright session, settle/diagnose, exact-size assertion
  lib/canonical.mjs     the 14 canonical page ids/order (drives sheets + matrix)
  fonts/arabic/         IBM Plex Sans Arabic TTFs + OFL.txt
  samples/sample.html   smoke test page (source of out/sample.png)
  samples/_font-check.html   four-face + mixed Arabic/Latin proof (underscore = not rendered by folder scans)
  samples/fixture-directions/  3 dummy pages × 3 dirs for toolchain self-test
  out/                  render proof + generated review output (sample.png, pages/, sheets/, strips/,
                        contact-<direction>.png, matrix-all-directions.png, index.html)
  .browsers/            Chromium + ffmpeg download (git-ignored)
  node_modules/         Playwright (git-ignored)
```

- **Canvas changes are a cross-team decision.** The 390 × 844 / 3× / 1170 × 2532 contract is in the
  workstream brief; if it ever changes, `render.mjs`, `canvas.css`, `contact-sheet.mjs` and every
  README/skill that quotes a size change together (Lead approval).
- **New font:** drop the TTF + licence under `env/fonts/` (or the brand font folder if it is brand
  property), add `@font-face` in `canvas.css`, add it to the table above. Do not add network fonts.
- **New page id:** append to `lib/canonical.mjs` and the table above; sheets/matrix pick it up
  automatically.
- **Write scopes:** design-env owns `env/`; each designer owns their direction folder; reviewers own
  `reviews/`; design-smith owns `skills/`. Never edit another owner's files — message them instead.
- **Do not commit** from this workstream unless the Lead asks; rendered outputs are review artifacts.

Questions about the environment -> message **design-env**. Contract changes are announced to all
designers and mirrored in `skills/TOKENS.md`.
