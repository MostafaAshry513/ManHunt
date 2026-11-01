# Asset licence and ownership — ManHunt identity

**Scope:** everything under `design/brand/identity/` — the SVG sources in `concepts/` and `final/`, the
rendered previews in `previews/`, and the build/verification tooling in `tools/`.

## 1. Original work

All marks, geometry, colour compositions, specimen sheets and rendered raster previews in this folder
are **original vector artwork created for ManHunt** for this workstream. They were drawn as parametric
geometry (circles, arcs, straight chalk strokes and dots) and rasterised locally with headless Chrome.

The **MANHUNT wordmark** (`final/lockup/wordmark-*.svg`, drawn glyphs in `tools/wordmark.mjs`) and the
**lockups** built from it are also original vector work: seven custom glyph drawings authored as SVG
paths. They are not derived from, traced from, or set in any font — no typeface is licensed, embedded or
redistributed with them, which is why they render identically everywhere.

Explicitly **not** used:

- no third-party logos, wordmarks, game characters, mascots or brand marks;
- no stock icons, icon-font glyphs, traced or scraped artwork;
- no AI image-generation or collage output;
- no photographs, no OpenStreetMap tiles or other map data;
- no real people's likenesses;
- no licensed typefaces inside any icon, mark or lockup.

The icon marks contain **no text**: no letters, no numerals, no words. The wordmark is a separate drawn
logotype delivered in `final/lockup/` — vector drawing, not live text.

## 2. Ownership of the selected assets

**The ManHunt owner owns the final selected assets** — source SVG, generated Android assets, Play-store
and web renders — and may use, modify, sublicense and redistribute them inside and outside the ManHunt
project, including commercially, without attribution to the designer.

For the avoidance of doubt: the owner's ownership covers the chosen mark and its direct derivatives
(recolours, size-specific optical adjustments, flat monoprint versions, motion adaptations, lockups).
The unchosen concept directions remain in this folder as design history and are offered to the owner
on the same terms.

If the assets are distributed as part of the ManHunt repository, they may be covered by the repository's
existing MIT licence; this declaration does not reduce the owner's rights over them.

## 3. Palette provenance

The colour tokens are the ManHunt product's own design tokens, taken from
`android/app/src/main/java/com/manhunt/app/ui/theme/Theme.kt`:

| Token | Value | Role |
|---|---|---|
| Field | `#0B1220` | ground |
| Signal cyan | `#22D3EE` | the field / the referee — never a team |
| Prey coral | `#FF7A59` | Prey |
| Hunters violet | `#A79BFF` | Hunters |
| Chalk | `#E6EDF7` | markings / text |

## 4. Tooling, fonts and dependencies

The build tooling is plain Node.js with **no third-party packages** and drives a locally installed
Chrome/Edge in headless mode.

The **preview sheets only** (never the icons, never the shipped Android assets) use two open-licensed
typefaces for display/data labels: **Barlow Condensed** and **IBM Plex Mono** (both SIL Open Font
License 1.1). They are downloaded at build time into the system temp directory and embedded as data
URIs in generated preview HTML only; **no font file is stored in this folder or in the repository**, and
no font is redistributed as part of the identity assets. Their licences remain with their authors.

## 5. Trademark note

The identity assets give the product a mark; they **do not clear the product name**. "ManHunt" is a
common English phrase and may collide with existing game or media trademarks. A name/trademark search
and the final naming decision are the owner's (see `design/brand/strategy/brand-platform.md` §10 flag D1).
Nothing in this folder renames the product.

## 6. Status

**Approved.** The owner selected 01 Open Zone (2026-11-01) with direction PICKUP and the slogan
“No gear. No fee. Just players.”; the frozen assets, wordmark and lockups are in `final/`. The two
unselected directions (The Corner, The Tag) remain in this folder as design history under the same terms.

- Prepared by: identity-designer (task-33 / task-36)
- Date: 2026-11-01
- Project: ManHunt — `C:\dev\ManHunt`
