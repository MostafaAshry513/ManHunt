# ManHunt site — QA evidence (task-57 refresh)

**Captured:** 2026-11-02T05:38:49Z · against the current **v0.16.0** manifest
(`versionName 0.16.0`, size **2.4 MB**, published **2026-11-02**, SHA-256
`df67563330ec4096aea16aa1894832df3555368c8ba87d2997806eb1c1744ea4`).
**Target:** the page served by the repo's own Fastify server on an isolated port
(`127.0.0.1:8095`, temp DB; production untouched), i.e. the current page content — not the old
v0.15.1 capture set.

## Method

`node design/site-redesign/tools/capture.mjs --url http://127.0.0.1:8095/ --out design/site-redesign/shots/final`

Real headless Chrome via the DevTools Protocol (no Puppeteer, no mockups): true mobile emulation for
390 (Android UA + touch + DPR 2), 820 tablet and 1440 desktop viewports. The harness writes viewport
PNGs, full-page PNGs, half-scale overviews, per-section PNGs (`data-shot`) and `report.json` with
overflow/blank-image/console/network diagnostics.

## Result — v0.16.0 page

| Viewport | Doc width | Content height | Horizontal overflow | Off-canvas elements | Text overflow | Blank images | Console errors | Failed requests |
|---|---:|---:|---|---:|---:|---:|---:|---:|
| 1440 desktop | 1440 | 7250 px | false | 0 | 0 | 0 | 0 | 0 |
| 820 tablet | 820 | 9118 px | false | 0 | 0 | 0 | 0 | 0 |
| 390 mobile (device emulation, DPR 2) | 390 | 9675 px | false | 0 | 0 | 0 | 0 | 0 |

Also re-run clean: `320 × 700` (no horizontal overflow) and `prefers-reduced-motion: reduce`
(complete static poster, no animation).

## Accuracy checks in the captured page

- "Prey never see the map" — **absent** (the previous false claim).
- Field deck present: “Prey see the field and their own position — never another player's.”
- Rules ledger present: “Prey see the field, the zone and their own position, never another player's.”
- FAQ present: “Prey never see another player's position”.
- Dynamic values present: **v0.16.0**, **2.4 MB**, **2026-11-02**, server line from the request host.

## B7 fixes verified in these captures

- The former tablet/mobile `LATEST REPORT` legend-label overflow (`scroll 107 > client 104`) is gone
  (`overflowTextEls: []`); the legend label column is 112 px.
- The former mobile off-canvas decorative SVG circles are gone (`overflowElements: []`); the mobile
  field band is 16:9 full-bleed so every zone ring/marker stays inside the frame.

## Artifact locations

- Full untracked capture artifacts (gitignored by `design/.gitignore` → `site-redesign/shots/`):
  `design/site-redesign/shots/final/` — `desktop-1440-*`, `tablet-820-*`, `mobile-390-*` viewport,
  full-page, half-page and section PNGs, plus `report.json`.
- Tracked evidence (committed with the design work): `design/site-redesign/refs/rendered/`
  (`site-desktop-1440-viewport.png`, `site-desktop-1440-full.png`, `site-tablet-820-full.png`,
  `site-mobile-390-viewport.png`, `site-mobile-390-full.png`, `site-desktop-reduced-motion.png`,
  `direction-board.png`).
- Server/type tests: `cd server && node node_modules/typescript/bin/tsc --noEmit && npm test` —
  **73/73 pass**, typecheck clean (install-page suite includes the accurate-copy regression guards
  and the no-script / no-remote-assets / manifest guards).
