# ManHunt — site redesign (task-50)

A from-scratch redesign of the game site (`/` — the landing + install page) as a premium
field-sport/street editorial page. Direction: **NIGHT FIXTURE**, the matchday programme for a
borrowed field; sibling of the approved app direction **MATCHDAY BOARD**.

**Status:** implemented in `server/src/app.ts`; typecheck + full server test suite green; verified in
real headless Chrome at 1440/820/390 against the **live v0.16.1** page. **Final accepted
premium set integrated:** the screens section shows five real captures — `s07-hunt` (live map),
`s03-home`, `s05-lobby-host`, `s11-chat`, `s12-result-hunters` (full-time result) — and the hero +
field-band map plates are built from the premium OSM harvest. **No placeholders remain on the page.**
`s13-result-prey`, `s14-settings` and `s15-home-light` are available clean but deliberately unused
(the five-screen rail is the showcase; say the word to swap one in). **Accuracy audit fixed:** the
field section no longer claims "Prey never see the map"; the real visibility model is stated (see
§Accuracy & QA refresh). No commits, no deploys (Lead owns integration).

---

## Read this first

| File | What it is |
|---|---|
| [`concept.md`](concept.md) | The direction, the five design principles, full page architecture, responsive/a11y/type/colour/motion summary, implementation map. |
| [`tokens.md`](tokens.md) | The system: type scale, palette, layout, shape, motion, accessibility, component inventory. Implementation authority. |
| [`direction-options.md`](direction-options.md) | The idea-refine decision record: alternatives considered, stress test, assumptions, MVP scope, not-doing. |
| [`audit.md`](audit.md) | Diagnosis of the page being replaced (with the before captures). |
| [`refs/site-ref.html`](refs/site-ref.html) | **The design source of truth.** Standalone HTML/CSS of the whole page with relative asset paths. Edit design here, then regenerate the renderer. |
| [`refs/rendered/`](refs/rendered/) | Rendered evidence: direction board, desktop/tablet/mobile page renders, and [`qa-report.md`](refs/rendered/qa-report.md) — the committed QA summary for the v0.16.0 capture (results, accuracy checks, provenance). |
| [`board.html`](board.html) | The direction plate (rendered → `refs/rendered/direction-board.png`). |
| [`shots/`](shots/) | Gitignored capture runs: `before/` (old page), `final/` (live v0.16.1 page, last run), `reduced/` (prefers-reduced-motion), `xs/` (320 px robustness), `board/` (direction plate render). Full PNGs + `report.json` live here; the tracked summary is `refs/rendered/qa-report.md`. |

---

## Build pipeline (the app.ts page is generated — do not hand-edit the markup)

```powershell
# 1. Edit the design source
#    design/site-redesign/refs/site-ref.html  (and board.html for the direction plate)

# 2. Regenerate the renderInstallPage() renderer and splice it into server/src/app.ts
node design/site-redesign/tools/build-page.mjs

# 3. Typecheck + tests
cd server
node node_modules/typescript/bin/tsc --noEmit
npm test

# 4. Run a local page and verify (isolated port + temp DB; never the production server)
$env:PORT='8095'; $env:HOST='127.0.0.1'; $env:DB_PATH="$env:TEMP\mh-site-dev.db"
node src/server.ts
node ..\design\site-redesign\tools\capture.mjs --url http://127.0.0.1:8095/ --out ..\design\site-redesign\shots\final
```

`build-page.mjs` replaces the `/` renderer only (between stable markers; the pre-splice backup is
written outside the working tree to the OS temp dir, so a stale page copy can never be committed),
rewrites the reference's asset paths to `/media/*`, and swaps the dynamic values
(version, size, published, SHA-256, download href, server, aggregate stats, no-manifest note) for
template interpolations. The **screens grid is data-driven**: `SCREENS` in the generated renderer is
the single list of premium captures, and the rail class follows its length. If the reference ever
contains a lingering literal demo value, the build fails loudly instead of shipping it.

### Regenerating the assets

| Asset | Script | Output |
|---|---|---|
| Premium phone captures → page-size WebP/JPEG | `tools/optimize-assets.ps1` | `server/public/site/shot-hunt/-home/-lobby/-extra/-result.webp/.jpg` |
| Hero map plate (real live-hunt harvest) | `tools/optimize-assets.ps1` | `server/public/site/map-hero.webp/.jpg` (crop of `s07-hunt` harvest, board + controls removed) |
| Field-band map plate (real OSM harvest) | `tools/optimize-assets.ps1` | `server/public/site/map-band.webp/.jpg` (16:9 harvest crop, controls removed) |
| Subset OFL fonts (same faces as the app redesign) | `tools/build-fonts.ps1` | `server/public/site/*.woff2` (51 KB total) |
| Generated Deep-Teal map plates from OSM tiles (fallback / provenance) | `tools/make-map.ps1` | superseded by the premium harvest; kept so the plates can be regenerated without the capture set |

- `optimize-assets.ps1` reads the premium set from `docs/screenshots/premium/` (never writes there)
  and derives all page images into `server/public/site/`. Sources and crops are documented in the
  script header; missing captures are skipped with a warning, so it is idempotent while the set lands.
- Hero plate source: `harvest/board-clock-4x5.png` — the 4:5 harvest of the live hunt map (real OSM
  tiles + the app's 240 m zone, fresh/stale prey markers and coral trail). The 3:2 / 16:9 harvests are
  river-only crops that cannot carry the game state at the portrait hero aspect; the wide 16:9 one is
  used for the field band. Crop rectangles (board + map-control strip removed) are in the script.
- `build-fonts.ps1` needs `python -m pip install fonttools brotli`; licences travel in
  `design/site-redesign/fonts/` (OFL 1.1).
- OSM data © OpenStreetMap contributors (ODbL): the page carries the attribution next to every plate
  and on the screenshots that show tiles.

### Premium capture provenance

- Integrated from the final accepted premium set: `s03-home.png`, `s05-lobby-host.png`,
  `s07-hunt.png`, `s11-chat.png`, `s12-result-hunters.png` (screens), the live-hunt 4:5 harvest
  (`harvest/board-clock-4x5.png` → hero plate), the 16:9 OSM harvest (field band). All derived images
  are page-size WebP with a JPEG fallback; the full-frame premium PNGs stay untouched in
  `docs/screenshots/premium/`. The hero/band HUD values mirror the capture state (LIVE, clock
  **41:12**, PREY 2/2, ZONE 240 m); the result tile shows FULL TIME, 18:48 played, "Hunters win.",
  prey 0/2.
- **No placeholders remain.** Every image on the page is a real premium capture or the real OSM
  harvest. `s13-result-prey` (the Prey-win variant), `s14-settings` and `s15-home-light` are clean and
  available but deliberately unused — the five-screen rail (hunt → home → lobby → chat → result) is
  the showcase. If the Lead wants a sixth tile (e.g. the Prey-win result next to the Hunters win, or
  the light theme), it is one `SCREENS` entry (`server/public/site/shot-*.webp` generation via
  `optimize-assets.ps1`; the rail class follows the count).

---

## Verification tooling

`tools/capture.mjs` drives real headless Chrome over the DevTools Protocol (no puppeteer):
true 390 px mobile emulation (UA + touch + DPR 2), tablet 820, desktop 1440, plus a board preset.

It writes, per viewport: viewport PNG (DPR 2 on mobile), full-page PNG, half-scale overview PNG,
per-section PNGs (elements with `data-shot`), and `report.json` with:

- horizontal overflow (document + individual elements, excluding horizontal scroll rails),
- blank/broken images and tiny images,
- headings + computed sizes (confirms the font files loaded),
- failed network requests, console errors/exceptions,
- link inventory and the first 2.5 KB of body text.

The current run is clean at all three viewports: `horizontalOverflow: false`, `blankImages: []`,
`consoleErrors: []`, `failedRequests: []`.

---

## Constraints honoured

- **No JavaScript.** The only interaction is native `<details>`. CSP keeps `default-src 'none'`
  (+ `img-src 'self' data:`, `font-src 'self'`, `style-src 'unsafe-inline'`).
- **No remote assets.** Fonts, map plates, captures and the film cover are all same-origin under
  `/media/*`. The landing page has zero third-party requests; the only external URLs are
  user-navigated links (GitHub, the film MP4) in `<a href>`.
- **Dynamic manifest data preserved** (version, size, published date, SHA-256, download href, server
  address, aggregate account stats, no-manifest fallback) — all read per request.
- **Preserved routes/behaviour:** `/`, `/join`, `/app.apk`, `/api/app/latest`, `/health`, `/media/*`
  allowlist. No app code touched, no brand assets edited, no commits/deploys.
- **Fonts:** self-hosted OFL woff2, approved by the Lead as not an external runtime dependency; the
  app redesign ships the same three faces.

---

## Accuracy & QA refresh (task-57, audit B5 + B7)

**B5 — false field-visibility claim.** The page said "Prey never see the map", which contradicts the
app: every player gets the live field map with the zone and their own position; only Hunters receive
the Prey's latest reports/trails (`RoomScreen.kt` fetches `latestLocations` only for
`team == HUNTERS`; the map is rendered for every role with `ownLocation`, the zone and `showPrey`
false for Prey). Exact copy diff in `refs/site-ref.html` → regenerated `server/src/app.ts`:

| Where | Before | After |
|---|---|---|
| Field section deck | "Hunters see the **latest report**, not a perfect live feed. **Prey never see the map.** The zone and the trails are the host's call — the server keeps the clock." | "Hunters see the **latest report**, not a perfect live feed. **Prey see the field and their own position — never another player's.** The zone and the trails are the host's call — the server keeps the clock." |
| Rules ledger, "Map / Latest report only." | "Hunters see the last report and optional trails — not a perfect live feed. **Prey never see positions.**" | "Hunters see the last report and optional trails — not a perfect live feed. **Prey see the field, the zone and their own position, never another player's.**" |
| FAQ, "Who can see my location?" | "Only the Hunters in your room, during the hunting phase, see your latest report. **Prey never see locations**, and admins get no extra location access. Location history is shown only when the host enables trails." | "Only the Hunters in your room, during the hunting phase, see your latest report. **Prey never see another player's position**, and admins get no extra location access. Location history is shown only when the host enables trails." |

Regression guards were added to `server/test/install-page.test.ts`: the accurate lines must be
present and `Prey never see the map` / `Prey never see positions` / `Prey never see locations` must
not come back.

**B7 — mobile QA findings.** (1) the "LATEST REPORT" legend label overflowed its 104 px column
(`scroll 107 > client 104`, flagged on tablet + mobile) — the legend label column is now **112 px**;
(2) the field-band decorative SVG circles were geometrically off-canvas on the 4:3 mobile band (the
`preserveAspectRatio="slice"` crop pushed them ~31 px past the viewport) — the mobile band is now
**16:9** full-bleed, keeping every decorative ring/marker inside the frame. The refreshed
`report.json` is clean at all three viewports: `overflowElements: []`, `overflowTextEls: []`.

**Evidence (live v0.16.1):** `design/site-redesign/shots/final/` (viewport + full-page + per-section PNGs
and `report.json`, captured against http://74.208.99.178/: version 0.16.1, 2,460,570 B displayed as 2.3 MB, 2026-11-02), plus
`shots/reduced/`, `shots/xs/`, `shots/board/`; page renders mirrored in `refs/rendered/`.

---

## Evidence summary (last verified run: `shots/final/`, against the **live v0.16.1** page)

| Check | Result |
|---|---|
| `npx tsc --noEmit` (server) | clean |
| `npm test` (server) | **73/73 pass** — install-page suite covers the new IA, accurate field-visibility copy (with regression guards against the old "Prey never see the map" claim), no scripts, no remote assets, media/font allowlist, manifest values, no-manifest fallback, zero-account state, CSP `font-src 'self'` |
| Live page content | captured from **http://74.208.99.178/**; dynamic manifest values rendered: **v0.16.1** (versionCode 44), **2,460,570 B → 2.3 MB**, published **2026-11-02**, SHA-256 `0596bee7…114de`, server line `http://74.208.99.178` |
| 1440 desktop | `horizontalOverflow: false`, `overflowElements: []`, `overflowTextEls: []`, `blankImages: []`, `consoleErrors: []`, `failedRequests: []` |
| 820 tablet | same (the former "Latest report" label overflow is fixed by the 112 px legend label column) |
| 390 mobile (real Chrome device emulation: Android UA + touch + DPR 2) | same (the former off-canvas band circles are fixed by the 16:9 full-bleed band crop) |
| 320 × 700 extra-small | no horizontal overflow (layout reflows; used as a robustness check, not a required viewport) |
| `prefers-reduced-motion: reduce` | hero map + slogan render as a complete static poster; no animation runs |
| Copy accuracy (audit B5) | field deck, rules ledger and FAQ now state the real visibility model: everyone sees the field/zone/own position; only Hunters receive the Prey's latest reports and trails; no one sees another player's position |
| Page payload | **62.6 KB HTML** (all CSS inline), 51 KB fonts, **396 KB total** of referenced WebP images + fonts (hero map 55 KB, band 24 KB, five captures 265 KB, film cover 38 KB). No JS. |
| Screens | five real premium captures — `s07-hunt` (first, key showcase), `s03-home`, `s05-lobby-host`, `s11-chat`, `s12-result-hunters` (full-time, 18:48, "Hunters win.", prey 0/2) — in a staggered 5-up rail (`screens--5`), real 1080×2400 frames, clean status bar, seeded players (Yasmin/Leila/Omar/Tariq/Sara), room `VMJYBU`, live clock 41:12. **No placeholder remains**; the Prey-win result, settings and light-theme captures are available but unused (swap via the `SCREENS` list). |

### Changing the capture set (one data edit)

`SCREENS` in `design/site-redesign/tools/build-page.mjs` is the single list of screen captures; the
rail class follows its length (`screens--N`). To add `s13-result-prey` / `s14-settings` /
`s15-home-light`, add an entry (and generate its `shot-*` pair with `optimize-assets.ps1` + two
allowlist lines in `server/src/app.ts`), then rebuild and re-run capture. The six-up/other-count
layouts use the same grid: add `nth-child(N)` stagger rules if the default offsets need tuning.
