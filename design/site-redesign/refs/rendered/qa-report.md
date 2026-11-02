# ManHunt site — QA evidence (task-61 refresh, live v0.16.1)

**Captured:** 2026-11-02T06:13:06Z (UTC) · **target:** the live install page at
**http://74.208.99.178/** — the current production content, **v0.16.1** (manifest `versionCode 44`,
APK **2,460,570 B**, published **2026-11-02T06:10:25Z**, SHA-256
`0596bee7b6ac110db823c68b365483f21b06c82f9fd6ce62b974219b56e114de`).

The page renders that manifest dynamically: **v0.16.1 · 2.3 MB · 2026-11-02**, hash `0596bee7…114de`,
and “This server http://74.208.99.178”. (The page formats the APK with one binary-decimal digit:
2,460,570 B / 1,048,576 = 2.35 → **2.3 MB**; no code change, this is the existing `formatBytes`
contract.)

## Method

`node design/site-redesign/tools/capture.mjs --url http://74.208.99.178/ --out design/site-redesign/shots/final`

Real headless Chrome via the DevTools Protocol (no Puppeteer, no mockups, no compositing): desktop
1440×900 (DPR 1), tablet 820×1180 (DPR 1), mobile 390×844 with **true device emulation** (Android UA +
touch + DPR 2), plus 320×700 and `prefers-reduced-motion: reduce` runs. The harness writes viewport
PNGs, full-page PNGs, half-scale overviews, per-section PNGs (`data-shot`) and `report.json` with
overflow/blank-image/console/network diagnostics.

## Result — live v0.16.1 page

| Viewport | Doc width | Content height | Horizontal overflow | Off-canvas elements | Text overflow | Blank images | Console errors | Failed requests |
|---|---:|---:|---|---:|---:|---:|---:|---:|
| 1440 desktop | 1440 | 7250 px | false | 0 | 0 | 0 | 0 | 0 |
| 820 tablet | 820 | 9118 px | false | 0 | 0 | 0 | 0 | 0 |
| 390 mobile (device emulation, DPR 2) | 390 | 9675 px | false | 0 | 0 | 0 | 0 | 0 |
| 320 × 700 (robustness) | 320 | — | false | 0 | 0 | 0 | 0 | 0 |
| 1440 reduced-motion | 1440 | — | false | 0 | 0 | 0 | 0 | 0 |

No visual regression against the v0.16.0 evidence: same layout heights (7250 / 9118 / 9675 px), same
composition, zero overflow/clipping/blank assets/console/network errors.

## Accuracy checks on the captured page

- Accurate field-visibility copy is present three times:
  “Prey see the field and their own position — never another player's.” (field deck),
  “Prey see the field, the zone and their own position, never another player's.” (rules ledger),
  “Prey never see another player's position…” (FAQ).
- The old false claims are **absent**: “Prey never see the map”, “Prey never see positions”,
  “Prey never see locations” all return 0 matches.
- Dynamic values present and matching the manifest: v0.16.1, 2.3 MB (2,460,570 B), 2026-11-02,
  0596bee7…114de, server line http://74.208.99.178.

## Artifact locations

- Full capture artifacts (gitignored by `design/.gitignore` → `site-redesign/shots/`):
  `design/site-redesign/shots/final/` — desktop-1440, tablet-820 and mobile-390 viewport + full-page +
  half-scale + per-section PNGs and `report.json`;
  `design/site-redesign/shots/xs/` (320 px) and `design/site-redesign/shots/reduced/`
  (prefers-reduced-motion).
- Committed evidence (tracked): `design/site-redesign/refs/rendered/` —
  `site-desktop-1440-viewport.png`, `site-desktop-1440-full.png`, `site-tablet-820-full.png`,
  `site-mobile-390-viewport.png`, `site-mobile-390-full.png`, `site-desktop-reduced-motion.png`,
  `direction-board.png` (re-rendered from the v0.16.1 captures), and this report.
- Verification: page code unchanged; `cd server && node node_modules/typescript/bin/tsc --noEmit &&
  npm test` re-run — **73/73 tests pass, typecheck clean**.
