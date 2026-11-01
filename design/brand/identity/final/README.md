# ManHunt identity — final package (approved)

**Status: APPROVED by the owner, 2026-11-01.** Product name unchanged: **ManHunt**. Direction **PICKUP**,
mark **01 Open Zone**, slogan **“No gear. No fee. Just players.”**

This folder is the frozen handoff. Nothing here redesigns anything — the mark geometry is the approved
`concepts/01-open-zone/mark.svg`, and the wordmark is the drawn logotype specified in
[`LOCKUP.md`](LOCKUP.md).

## What is in here

| Folder | Contents | Consumer |
|---|---|---|
| [`lockup/`](lockup/) | MANHUNT wordmark + Open Zone mark lockups, horizontal & stacked, in light-on-dark / dark-on-light / monochrome — SVG sources + PNG previews + spec sheet | motion (`task-37`), install page, README, posters |
| [`android/`](android/) | complete Android resource handoff: adaptive foreground + monochrome VectorDrawables, `mipmap-anydpi-v26` definitions, legacy & round PNGs at 5 densities, Play 512, icon background value | Android integration task (Lead) |
| [`install/`](install/) | install-page web handoff: favicons 32/48, inline-ready `app-icon.svg`, 192 px web/touch icon, OG/Twitter card 1200×630 | install page (`server/src/app.ts` — Lead) |
| [`LOCKUP.md`](LOCKUP.md) | **canonical** wordmark string/style, geometry, colours, slogan pairing, exact paths for motion | everyone |
| [`MANIFEST.json`](MANIFEST.json) | every generated file with byte size and SHA-256 | handoff / integrity |
| [`verification-final.json`](verification-final.json) | 49 automated checks (dimensions, palette, SVG hygiene, Android XML) — all pass | QA |

## Fast path

- **Motion / end card:** `lockup/lockup-stacked-light-on-dark.svg` (or `wordmark-light-on-dark.svg` if
  keeping your own layout). See `LOCKUP.md` §1 for the exact constants.
- **Android:** copy `android/mipmap-*` and `android/mipmap-anydpi-v26/` into `res/`, then install the two
  VectorDrawables and the background colour — mapping table in [`android/README.md`](android/README.md).
- **Install page:** copy `install/*` next to the page and add the tags in
  [`install/README.md`](install/README.md) (favicon 32/48, `og:image` 1200×630, 192 px icon).

## Rebuild

```powershell
cd design/brand/identity
node tools/build-final.mjs      # lockups, Android + install handoff, spec sheet, manifest
node tools/verify-final.mjs     # 49 checks -> final/verification-final.json
```

Preview/spec type in the plates is **Barlow Condensed** (OFL) fetched at build time and embedded as data
URIs in generated HTML only — no font file is stored in this folder, and the lockup SVGs themselves
contain no text or font references. Everything else is original vector geometry; see
[`../LICENSE-assets.md`](../LICENSE-assets.md).

## Known integration notes

1. **Plain-HTTP hosted server.** The install page is served over `http://` at a bare IP; social scrapers
   (Open Graph/Twitter) can still read `og:image`, but it must be an **absolute** URL to the deployed
   file, e.g. `http://74.208.99.178/og-image-1200x630.png`. If the deployment gains TLS later, update the
   URL — the image itself does not change.
2. **The install page must not stretch the OG card.** Use `og:image:width=1200`, `og:image:height=630`.
3. **Theme/round icons:** use the supplied `ic_launcher_monochrome.xml` for `android:monochrome`; the
   Android 13+ themed icon must stay mark-only (no background).
4. **Launcher page splash:** the approved mark can replace the plain `launch_background` later; the field
   colour `#0B1220` stays so there is no white flash.
