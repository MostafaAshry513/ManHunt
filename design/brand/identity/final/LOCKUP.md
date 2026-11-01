# ManHunt — approved lockup

**Status: APPROVED by the owner, 2026-11-01.**
Direction **PICKUP** · mark **01 Open Zone** · slogan **“No gear. No fee. Just players.”** · product
name unchanged (**ManHunt**).

This file is the single source of truth for the lockup. Motion (`task-37`), the install page and any
other surface consume the files below — do not retype, re-crop or re-draw anything from this document.

---

## 1. Canonical files (use these paths)

| Need | File | Notes |
|---|---|---|
| **Wordmark (primary)** | `final/lockup/wordmark-light-on-dark.svg` | chalk `#E6EDF7`, transparent bg, tight box |
| **Wordmark fallback raster** | `final/lockup/previews/wordmark-light-on-dark.png` | 1000 × 189 px, transparent |
| **Lockup, stacked** | `final/lockup/lockup-stacked-light-on-dark.svg` | mark above wordmark — end cards, avatars, narrow formats |
| **Lockup, horizontal** | `final/lockup/lockup-horizontal-light-on-dark.svg` | mark left of wordmark — headers, documents |
| Lockup raster (stacked) | `final/lockup/previews/lockup-stacked-light-on-dark.png` | 760 × 453 px, transparent |
| Lockup raster (horizontal) | `final/lockup/previews/lockup-horizontal-light-on-dark.png` | 1200 × 328 px, transparent |
| Mark only | `final/lockup/mark-light-on-dark.svg` | transparent, 108 dp artboard, mark inside the 66 dp safe circle |
| App icon (field square) | `final/install/app-icon.svg` | 108 × 108 dp composite, field `#0B1220` |
| All variants sheet | `final/lockup/previews/lockup-sheet.png` | 1600 × 916 spec plate |

Dark-on-light (`*-dark-on-light.svg`) and monochrome (`*-mono.svg`) versions of every file exist in the
same folder. **Motion should use the `light-on-dark` set**: the short's end card is on the navy field.

### The single constant for motion

```js
// design/social/motion/src/animate.js
const MH_LOCKUP = {
  wordmarkSvg: 'C:/dev/ManHunt/design/brand/identity/final/lockup/wordmark-light-on-dark.svg',
  lockupSvg: 'C:/dev/ManHunt/design/brand/identity/final/lockup/lockup-stacked-light-on-dark.svg',
  wordmarkPng: 'C:/dev/ManHunt/design/brand/identity/final/lockup/previews/wordmark-light-on-dark.png',
  fill: '#E6EDF7',
  slogan: 'No gear. No fee. Just players.',
};
```

**Inline the SVG markup rather than loading it as a file** (the render is a headless Chrome page, so file
URLs work, but inline is deterministic):

```html
<!-- wordmark, light on dark: viewBox 0 0 530 100 -->
<svg class="mh-wordmark" viewBox="0 0 530 100" width="530" height="100" role="img" aria-label="ManHunt">
  <!-- 7 <path> elements copied verbatim from wordmark-light-on-dark.svg -->
</svg>
```
```css
.mh-wordmark{width:clamp(240px, 46vw, 520px);height:auto;display:block}
```

The wordmark contains **no `<text>` and no font dependency** — it is seven drawn paths, so it renders
identically in every browser/OS and in video frames. That is the whole point of the drawn logotype.

---

## 2. Wordmark specification

| Property | Value |
|---|---|
| String (canonical casing) | **MANHUNT** — one word, uppercase, no letter-spacing added by the consumer |
| Construction | 7 custom glyph paths (M A N H U N T), authored at **cap height 100 units**, baseline y=100 |
| Stem / weight | 16 units (0.16 cap) — heavy condensed grotesque |
| Tracking baked in | 10 units (0.10 cap); do **not** add letter-spacing |
| Width | 530 units at cap 100 → aspect **5.30 : 1** |
| Corners / curves | square terminals; one arc (U) |
| Ink | single fill per variant: chalk `#E6EDF7` / ink `#0B1220` / mono `#000000` |
| Text content | none — vector paths only (safe for video, no font licensing, no fallback risk) |

Minimum sizes: wordmark cap height **≥ 22 px** (≈117 px wide); horizontal lockup **≥ 180 px** wide;
stacked lockup **≥ 140 px** wide. Below that use the mark alone.

---

## 3. Lockup geometry (cap = 100 units)

| Property | Value |
|---|---|
| Mark visible diameter | 120 units (**1.2 × cap**) — measured from the drawn mark, not the 108 dp artboard |
| Gap mark → wordmark | 56 units (0.56 × cap) |
| Clear space | **50 units (0.5 × cap)** on all four sides, baked into the SVG viewBox |
| Horizontal viewBox | 806 × 220 units (content 706 × 120) |
| Stacked viewBox | 630 × 376 units (content 530 × 276) |
| Alignment | mark optical centre sits on the wordmark's cap-height centre line; stacked is centred on the wordmark's width |

The clear space is already included in every lockup SVG — place nothing inside the dashed area shown on
the spec plate. The mark's own safe-zone rule still applies inside the icon.

---

## 4. Colour

| State | Wordmark | Mark ring | Mark dot | Ground |
|---|---|---|---|---|
| **light-on-dark** (primary) | `#E6EDF7` chalk | `#22D3EE` signal cyan | `#FF7A59` prey coral | `#0B1220` field |
| dark-on-light | `#0B1220` ink | `#0C6B84` (light-theme primary) | `#B33A0F` (light-theme tertiary) | `#F7F9FC` chalk ground |
| monochrome | `#000000` | `#000000` | `#000000` | white/one ink |

Rules (from `design/brand/strategy/visual-direction.md` §1): cyan is the field/referee and is never a
team colour; coral is Prey; violet is Hunters; flat fills only — no gradients, glows, shadows or outlines.

---

## 5. Slogan pairing

Approved primary slogan: **“No gear. No fee. Just players.”** (three beats, 30 characters).

- Set the slogan **outside** the lockup's clear space — never inside the mark, never inside the icon.
- Recommended order on a surface: slogan first, then the lockup (as on the end card and the OG card), or
  lockup first and slogan under it. One of the two per surface.
- The slogan is live copy, set in the brand display face — it is **not** part of the wordmark drawing.
  Do not draw the slogan or turn it into paths from this package.
- The old line “Hide. Hunt. Survive.” is retired for external use; do not pair it with this lockup.
- Descriptor line (install page / OG card, optional): **“Real-world GPS hide-and-seek”** — sentence case,
  under the slogan, never merged into the wordmark.

---

## 6. Don't

- don't retype the wordmark in a font, add letter-spacing, stretch, rotate, outline or recolour it
- don't use the light-on-dark wordmark on a light ground (use the dark-on-light file)
- don't add a tagline, score, timer or any text inside the mark or lockup
- don't use cyan for a team, coral/violet for the field, or any gradient/glow
- don't crop the lockup's clear space or place it inside another shape's edge
- don't scale below the minimum sizes; switch to the mark alone instead
- don't ship the old launcher geometry (closed cyan circles + coral crosshair) with this lockup

---

## 7. Provenance

Mark: `concepts/01-open-zone/mark.svg` (approved geometry, unchanged). Wordmark: original drawn glyphs in
`tools/wordmark.mjs`; lockups generated by `tools/build-final.mjs`. All original vector work for ManHunt —
see `LICENSE-assets.md`. Owner owns the selected assets.
