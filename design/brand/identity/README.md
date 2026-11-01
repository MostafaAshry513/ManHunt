# ManHunt — logo & app icon identity

**Status: identity APPROVED — 01 Open Zone** (owner, 2026-11-01), direction PICKUP, product name unchanged
(**ManHunt**). **Copy is provisional, owner approval pending:** permanent line “Hide from your friends.”,
hook “Your friends are hunting you.”, CTA “Create a hunt. Send the code. Hide.” — the rejected line
“No gear. No fee. Just players.” must not be used. The frozen integration package (lockup, wordmark,
Android resources, install-page assets) is in [`final/`](final/README.md); the canonical lockup + copy
spec is [`final/LOCKUP.md`](final/LOCKUP.md).

This folder holds the identity workstream (task-33 + finalisation task-36). Three complete directions were
explored and verified; one was chosen. The Android resources, splash, slogan strings and install page are
explicitly **not** edited by this folder — they are copied in by the integration task.

## Approved assets (start here)

| File | What it is |
|---|---|
| [`final/LOCKUP.md`](final/LOCKUP.md) | **Canonical lockup spec** — MANHUNT wordmark + Open Zone mark, colour states, clear space, slogan pairing, paths for motion |
| [`final/lockup/previews/lockup-sheet.png`](final/lockup/previews/lockup-sheet.png) | Approved lockup spec plate (horizontal/stacked × three colour states) |
| [`final/install/og-image-1200x630.png`](final/install/og-image-1200x630.png) | Install-page Open Graph card |
| [`final/android/`](final/android/README.md) | Android handoff: adaptive + monochrome VectorDrawables, mipmap densities, Play 512 |
| [`final/install/`](final/install/README.md) | Install-page handoff: favicons, `app-icon.svg`, 192 px icon, OG card |
| [`final/MANIFEST.json`](final/MANIFEST.json) | Every final file with size + SHA-256 |

## The three explored directions

| # | Concept | Strategy | Colours | Source | Status |
|---|---|---|---|---|---|
| 01 | **Open Zone** | chase / pursuit tension — a zone ring that does not close, prey dot in the break | cyan + coral | [`concepts/01-open-zone/`](concepts/01-open-zone/) | **approved** |
| 02 | **The Corner** | real place / borrowed pitch — a chalk corner with the player held in the angle | cyan + coral | [`concepts/02-the-corner/`](concepts/02-the-corner/) | not selected |
| 03 | **The Tag** | predator / prey — hunters' ring closed, prey dot in contact at its edge | violet + coral | [`concepts/03-the-tag/`](concepts/03-the-tag/) | not selected |

## Exploration previews & sources

Kept as design history — the selected mark's already-frozen exports are in `final/`.

| File | What it is |
|---|---|
| [`previews/contact-sheet.png`](previews/contact-sheet.png) | All three directions side by side at real pixel sizes |
| [`previews/01-open-zone/sheet.png`](previews/01-open-zone/sheet.png) | Open Zone specimen: 512 px, adaptive safe zone, 48 px dark/light, monochrome, 16–48 px silhouette |
| [`previews/02-the-corner/sheet.png`](previews/02-the-corner/sheet.png) | Same, for The Corner |
| [`previews/03-the-tag/sheet.png`](previews/03-the-tag/sheet.png) | Same, for The Tag |
| [`previews/legibility-strip.png`](previews/legibility-strip.png) | Native-pixel silhouette strip, 16/24/32/48 px, all concepts |
| [`previews/process/`](previews/process/) | 6 rounds of exploration sheets (60+ candidate marks, rejects documented) |

Each concept folder contains, at 108 × 108 dp with the mark inside the 66 dp safe circle:

- `mark.svg` — the adaptive **foreground** layer (transparent, mark only)
- `background.svg` — the adaptive **background** layer (`#0B1220`)
- `icon-composite.svg` — foreground over field, for previews and Play-store art
- `icon-monochrome.svg` — the Android 13+ **monochrome** layer (one colour, mark silhouette only)
- `android/ic_launcher_foreground.xml`, `android/ic_launcher_monochrome.xml` — ready-to-copy
  VectorDrawables (108 dp viewport, same geometry); this folder does not edit app resources
- `notes.md` — idea, measured construction, risks

## Rendered exports

`previews/<concept>/exports/` holds real rasterised assets at native pixel sizes:

- `play-512.png` — 512 × 512, opaque, full 108 dp art
- `mark-512-transparent.png` — 512 px mark, transparent (web/README use)
- `monochrome-432.png` — 108 dp @ 4× monochrome layer, transparent
- `monochrome-on-black-512.png`, `monochrome-on-white-512.png` — mono fidelity checks
- `legacy-{48,72,96,144,192}.png` and `legacy-round-{48,72,96,144,192}.png` — legacy launcher rasters
  (central 80 dp of the adaptive art, mark ≈ 80 % of the icon)
- `favicon-{16,24,32}.png`, `legacy-48-on-chalk.png`

`previews/<concept>/` also contains `adaptive-safe-zone.png` (66 dp safe circle, 72 dp mask, circle and
squircle mask previews), `dark-light-comparison.png`, and `sheet.png`.

All 34 automated checks pass (`VERIFICATION.md`): every direction keeps the mark inside the 66 dp safe
circle (32.6 / 28.8 / 32.7 dp measured), uses only palette tokens, stays opaque on Play 512, keeps a
distinct prey dot at 48 px (Open Zone and The Corner) or a single contact silhouette by design (The Tag),
and contains no text. The 16 px native-pixel strip (`previews/legibility-strip.png`) shows exactly where
the shapes start to fuse — which is why the favicon ships at 32 px.

## Build it yourself

No dependencies, no package manager: plain Node.js 20+ and a local Chrome/Edge.

```powershell
cd design/brand/identity
node tools/build.mjs        # concept sources -> rasters -> specimen sheets (headless Chrome)
node tools/verify.mjs       # pixel checks on the three concepts -> VERIFICATION.md
node tools/build-final.mjs  # approved lockup + Android + install handoff -> final/
node tools/verify-final.mjs # 49 checks on the final package -> final/verification-final.json
```

`tools/` layout: `concepts.mjs` (the three parametric marks — the design source of truth),
`wordmark.mjs` (the drawn MANHUNT glyphs), `lockup.mjs` (mark + wordmark composition), `geometry.mjs`
(helpers), `render.mjs` (headless-Chrome rasteriser, isolated profile per render), `png.mjs`
(dependency-free PNG reader/writer), `build.mjs`, `build-final.mjs`, `verify.mjs`, `verify-final.mjs`.
Generated intermediate HTML lives in `tools/build/` and can be deleted at any time.

Preview/spec sheets use **Barlow Condensed** and **IBM Plex Mono** (both OFL) for display labels; they are
fetched at build time into the system temp directory and embedded only in generated HTML — no font file is
stored in this folder. The **lockup and wordmark contain no text and need no font at all**.

## Documents

- [`final/LOCKUP.md`](final/LOCKUP.md) — canonical approved lockup spec (wordmark, geometry, colours,
  slogan pairing, paths for motion)
- [`final/README.md`](final/README.md) — the frozen integration package (lockup, Android, install page)
- [`icon-system.md`](icon-system.md) — geometry, clear space, minimum size, palette tokens, export
  pipeline, recommendation, owner decisions
- [`design-philosophy.md`](design-philosophy.md) — the visual philosophy and the method used to find
  the marks
- [`LICENSE-assets.md`](LICENSE-assets.md) — originality and ownership declaration
- [`VERIFICATION.md`](VERIFICATION.md) — measured test results for the three concepts (auto-generated)
- [`final/verification-final.json`](final/verification-final.json) — measured checks on the final package
- [`previews/process/`](previews/process/) — exploration sheets kept as design history

## Guardrails respected

- original vector geometry only; no stock, no third-party marks/characters, no photographs, no map data
- no text inside any mark; the product name is unchanged ("ManHunt")
- cyan is the field/referee and is never used as a team colour; coral = Prey, violet = Hunters
- no gradients or glows; the adaptive background is the solid field token `#0B1220`
- the mark is inside the 66 dp safe circle on the 108 dp canvas, and the monochrome layer is mark-only
