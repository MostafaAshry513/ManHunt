# ManHunt icon system

**Status: APPROVED — the owner selected 01 Open Zone (2026-11-01)**, with direction PICKUP and product name
unchanged. **Copy is provisional, owner approval pending**: the permanent line is
“Hide from your friends.”, the hook “Your friends are hunting you.” and the CTA “Create a hunt. Send the
code. Hide.” — the line “No gear. No fee. Just players.” is **rejected** and must not be used. The approved
mark, wordmark and all integration exports now live in [`final/`](final/README.md);
[`final/LOCKUP.md`](final/LOCKUP.md) is the canonical lockup + copy spec.
This document remains the icon-system build spec — geometry, clear space, minimum sizes, palette tokens
and the export pipeline — for the chosen direction.

Sources of truth:

- approved mark geometry: `concepts/01-open-zone/mark.svg` (generated from `tools/concepts.mjs`, the
  parametric source of truth) — unchanged by the finalisation
- approved lockup + wordmark: `final/LOCKUP.md`, `final/lockup/`
- final package checks: `final/verification-final.json`; concept renders: `VERIFICATION.md`
- brand constraints: `docs/BRAND_BRIEF.md` §3–§4 and `design/brand/strategy/visual-direction.md` §1, §6

---

## 1. The three directions at a glance

| # | Concept | One-line idea | Colours | Verdict |
|---|---|---|---|---|
| 01 | **Open Zone** | the hunt zone is a chalk ring that does not close; the prey dot is in the break | cyan + coral | **recommended** |
| 02 | **The Corner** | a chalk corner of the borrowed pitch; the player is held in the angle | cyan + coral | strongest "real place" story; misread risk |
| 03 | **The Tag** | the hunters' violet ring is closed and the prey dot is in contact at its edge | violet + coral | best role-colour story; weakest mono separation |

All three are drawn as parametric vector geometry on one 108 × 108 dp artboard with one rule: **the mark
lives inside the 66 dp safe circle** (centre 54, 54, radius 33). No concept contains text, letters,
numerals, pins, crosshairs, photographs or third-party marks.

---

## 2. Geometry

### 2.1 Artboard and safe area (all directions)

| Layer | Size | Notes |
|---|---|---|
| Adaptive canvas | 108 × 108 dp | foreground and background layers both 108 dp |
| Visible mask area | ⌀ 72 dp | circle/squircle/rounded-square masks crop to roughly this |
| **Safe zone** | **⌀ 66 dp** | everything that must never be cropped goes here; all three marks comply |
| Mark extent | ≤ 32.6 dp from centre | measured per direction in `VERIFICATION.md` |
| Background | solid `#0B1220` | no gradient (brand rule: flat fills only) |

The 18 dp bleed on every side exists for launcher parallax and mask variety; no element of any mark
uses it. The 12 dp band between the 66 dp safe circle and the 72 dp mask diameter is the mark's
insurance against the most aggressive masks.

### 2.2 Construction, per direction

**01 · Open Zone**

| Property | Value |
|---|---|
| Zone arc radius (centreline) | 22.2 dp |
| Arc weight | 10.4 dp, butt caps (radial chalk cuts) |
| Arc opening | 72°, centred at −56° |
| Arc sweep | 288° |
| Prey dot | r 8.6 dp, centre 24.0 dp from centre, 2° off the opening's centre |
| Ring-to-dot gap (min) | 5.4 dp |
| Max mark radius | 32.6 dp |

**02 · The Corner**

| Property | Value |
|---|---|
| Vertex | (42, 62) dp, mark rotated −9° |
| Markings | 31 dp and 27 dp long, 11.4 dp thick, square ends, 90° joint |
| Prey dot | r 9.8 dp on the angle's bisector, 2.4 dp clear of both markings |
| Max mark radius | 28.8 dp (measured) |

**03 · The Tag**

| Property | Value |
|---|---|
| Hunters' ring | radius 18.2 dp, weight 9.8 dp |
| Prey dot | r 8.8 dp, centre 24.0 dp from centre at −36° |
| Contact overlap | 7.9 dp of the dot lands on the ring's outside |
| Max mark radius | 32.7 dp (measured) |

**Shared construction grid.** Centre 54/54; all radii measured from that point; all marks are drawn to
the same 10–12 dp stroke weight family so the three directions feel built by the same hand. Optical
centring is done on the *mark's* centre of mass, and each mark's own asymmetry (a dot in an opening, a
player in a corner, contact on a rim) is what keeps it from looking mechanically centred.

### 2.3 Measured compliance

From `VERIFICATION.md` (pixels decoded, not asserted):

| Direction | Max mark radius | 48 px prey dot | 48 px components | 16 px silhouette |
|---|---|---|---|---|
| Open Zone | 32.56 dp (limit 33) | 70 px | 2 (dot stays separate) | 1 component, 27 % ink |
| The Corner | 28.82 dp (limit 33) | 91 px | 2 (dot stays separate) | 1 component, 19 % ink |
| The Tag | 32.73 dp (limit 33) | 75 px | 1 (contact is the design) | 1 component, 25 % ink |

---

## 3. Clear space

- **Inside the adaptive icon:** the mask + 66 dp safe zone is the clear space. No extra padding is added
  — the mark is sized to fill the safe circle, not to float inside it.
- **Standalone use (README, install page, feature graphic, print):** keep a clear space of **16 dp at
  the 108 dp artboard scale** (25 % of the mark's ~64 dp bounding box, 1.5× the ring weight) on every
  side. Nothing — type, hairlines, other logos, page edges — enters that area.
- **Lockup with the wordmark/slogan:** the mark's right edge (or bottom edge) starts after the same
  16 dp clear space; the lockup's optical alignment is on the mark's bounding box, never on the safe
  circle. Wordmark and slogan are a separate workstream (task-32); this folder supplies the mark only.

---

## 4. Minimum sizes

| Context | Minimum | Notes |
|---|---|---|
| Launcher icon | 48 dp | the mandatory test; all three directions were checked at 48 px native, 2× and 3× |
| Android adaptive | 108 dp art | masks to 72 dp; safe zone 66 dp |
| Standalone mark | 24 px | full fidelity of gaps and dot |
| Absolute minimum | 16 px | the shipped `favicon-16.png`; at 16 px the ring-to-dot gap closes — 32 px is the recommended favicon |
| Monochrome layer | same as launcher | one ink; Open Zone and The Corner keep their dot separate, The Tag is a single silhouette by design |
| Play store icon | 512 × 512 px | 32-bit PNG, opaque, no text |
| Print/README hero | 96 px and up | below 96 px use the 96/144 raster |

Below the minimum sizes, do not scale the mark — use the supplied raster for that size. The exports
folder already contains 16/24/32/48/72/96/144/192/512 px renders.

---

## 5. Palette tokens

Only these colours appear in the identity assets. They are the product's own tokens, not a new palette.

| Token | Hex | Role in the mark | WCAG on field `#0B1220` |
|---|---|---|---|
| Field | `#0B1220` | the ground / adaptive background | — |
| Signal cyan | `#22D3EE` | the field, the zone, the rule, the referee — **never a team** | 10.36 : 1 |
| Prey coral | `#FF7A59` | Prey (the exposed one) | 7.29 : 1 |
| Hunters violet | `#A79BFF` | Hunters (the ones closing in) | 7.82 : 1 |
| Chalk | `#E6EDF7` | markings / type only — not used inside the icon | 15.89 : 1 |
| Hairline | `#2A3550` | non-icon surfaces only | — |

Rules:

1. **One hot colour per composition.** Open Zone and The Corner are cyan + coral; The Tag is violet +
   coral. No direction uses three colours.
2. **Cyan is never spent on a team.** It only ever describes the field's own structure.
3. **No gradients, no glow, no shadows, no outlines.** Flat fills, one background, one ink for
   monochrome.
4. **Light theme is a translation.** The icon keeps its `#0B1220` square on light surfaces; the mark is
   dark-first (the game is played at night). The monochrome layer covers surfaces where colour is taken
   away.
5. **Do not recolour outside the tokens.** A "prey-red icon" or "hunter-purple icon" variant is not part
   of the system; the palette marks roles, not campaigns.

---

## 6. How the final exports are produced

The build is reproducible: `node tools/build.mjs` re-emits every SVG and raster from the parametric
source, and `node tools/verify.mjs` re-measures the result. The shipped Android resources are produced
from these files in one pass (integration is a separate task; **no Android resource was edited in this
workstream**).

### 6.1 Android adaptive icon (API 26+)

| Resource | Source | Spec |
|---|---|---|
| `drawable/ic_launcher_foreground.xml` | `concepts/<concept>/mark.svg` | VectorDrawable, 108 dp viewport 108, mark inside the 66 dp safe circle |
| `values/colors.xml` (`icon_bg` = `#0B1220`) | `background.svg` | solid field colour (reuse `launch_bg`) |
| `mipmap-anydpi-v26/ic_launcher.xml` | new file | `<adaptive-icon>` → background `@color/icon_bg`, foreground `@drawable/ic_launcher_foreground`, `android:monochrome` → `@drawable/ic_launcher_monochrome` |
| `mipmap-anydpi-v26/ic_launcher_round.xml` | new file | same, round variant |
| `drawable/ic_launcher_monochrome.xml` | `concepts/<concept>/icon-monochrome.svg` | single-colour mark silhouette, no background — Android 13+ themed icons |

**Ready-to-integrate VectorDrawables are already emitted** next to each source:
`concepts/<concept>/android/ic_launcher_foreground.xml` and
`concepts/<concept>/android/ic_launcher_monochrome.xml` (108 dp viewport, 108 × 108 units, same geometry
as the SVGs). Copy them into `res/drawable/` and add the two adaptive-icon XMLs above. Nothing in the app
was edited here — integration is its own task.

The mark uses 2–3 primitives (an arc/line with a stroke, and a circle), which is why the VectorDrawable
conversion is trivial: `<path>` for the arc/line with `android:strokeColor`/`android:strokeWidth`/
`android:strokeLineCap="butt"`, and one `<path>` circle for the dot
(`M x,y m -r,0 a r,r 0 1,0 2r,0 a r,r 0 1,0 -2r,0`). A vector foreground adds **no bytes** to the APK
beyond the XML.

The monochrome layer must be the *union* of the mark's shapes in a single fill colour; do not ship the
background in it. For The Tag the two shapes touch by design, so the union is one silhouette; that is
correct and intended.

### 6.2 Legacy rasters (API < 26)

Generated from the composite art by cropping the **central 80 dp** of the 108 dp canvas (mark ≈ 80 % of
the icon width, better launcher presence than the unmasked full canvas) and rendering at:

| Density | Size | File |
|---|---|---|
| mdpi | 48 × 48 | `mipmap-mdpi/ic_launcher.png` (+ `_round`) |
| hdpi | 72 × 72 | `mipmap-hdpi/ic_launcher.png` |
| xhdpi | 96 × 96 | `mipmap-xhdpi/ic_launcher.png` |
| xxhdpi | 144 × 144 | `mipmap-xxhdpi/ic_launcher.png` |
| xxxhdpi | 192 × 192 | `mipmap-xxxhdpi/ic_launcher.png` |

Round variants (`ic_launcher_round.png`) take the same art through a 50 % circular clip with transparent
corners. Square variants are opaque. All are already rendered in
`previews/<concept>/exports/legacy-*.png` and `legacy-round-*.png`; they only need copying into the
`mipmap-*` folders.

### 6.3 Play Store icon

- 512 × 512 PNG, 32-bit, **opaque**, no text, full 108 dp art (the store applies its own rounding):
  `previews/<concept>/exports/play-512.png`.

### 6.4 Web / README / install page

- `mark-512-transparent.png` — 512 px transparent mark for README/install hero use.
- `favicon-32.png` (recommended) and `favicon-16.png` (absolute minimum) — the icon cropped to 80 dp so
  the mark fills the browser tab; 32 px is what should be linked in HTML.
- `legacy-48-on-chalk.png` — 48 px icon on the light theme's `#F7F9FC` ground for light-mode pages.

### 6.5 Verification gates before shipping

`node tools/verify.mjs` must print PASS for: Play 512 dimensions/opacity/palette, 66 dp safe zone,
monochrome single-colour and shape equality, 48 px mark separation and prey-dot visibility, no text in
the mark, and deliverable presence. Then, in the Android integration task: `./gradlew :app:lintDebug`,
launcher icon normal/round/themed on an emulator, and the 48 dp visual check on `#0B1220`.

---

## 7. Usage rules

**Do**

- use `mark.svg` / the supplied rasters as-is; the geometry is already optically tuned
- keep the mark inside the 66 dp safe circle in adaptive icons, and 16 dp clear space elsewhere
- let the field stay `#0B1220`; let the mark be the only bright thing in the frame
- use the monochrome layer wherever colour is unavailable or the theme demands one ink
- pair the mark with the wordmark/slogan at the clear-space distance above

**Don't**

- don't stretch, skew, rotate further, outline, add a shadow/glow/gradient or place the mark on a photo
- don't put the product name, a slogan, a score, a timer or any other text inside the icon
- don't recolour outside the token table, and never use cyan for a team or coral/violet for the field
- don't rebuild the ring as a closed target, add a pin/arrow/crosshair, or "improve" the opening of Open
  Zone — the break is the mark
- don't scale the 16/24 px raster up; re-render from the source instead

---

## 8. Recommendation — accepted

**Recommended and now approved: 01 · Open Zone** (owner decision, 2026-11-01). The reasoning that led to
it, in the order the brand set the tests:

1. **It is the brand's own idea, not a picture of it.** The unclosed zone is the product's core rule
   (a zone that everyone agreed to, with someone outside it) and it is the one metaphor the strategy
   ranked first. The mark is a state of the game, so it can never be "just a logo".
2. **It survives every size.** Ring + dot at 48 px is two shapes with a 2.4 px gap; in one ink it is
   still an open zone with a body in the break; at 512 px the 10.4 dp chalk weight holds. It is the only
   direction where both shapes stay distinct in monochrome *and* in colour at 48 px.
3. **It teaches the palette.** Cyan is the field's structure and coral is Prey — a player who has seen
   the app once reads the colours correctly. The icon uses the brand's primary token, which keeps the
   launcher presence recognisably ManHunt.
4. **It is an evolution, not a repaint.** The current launcher is a navy square with cyan crosshair
   circles, a coral cross and a white dot — a target. Open Zone keeps the field, the cyan and the coral
   but replaces the target with a chase: an opening, and a player going through it.
5. **It extends into a system.** The ring/arc is the brand's motion device ("zone draw", "report ping"),
   so the icon's grammar becomes the app's motion grammar; the 72° opening gives a direction for
   posters, end cards and the install page hero without needing a second device.

**Runner-up: 03 · The Tag** if the icon ever needs to be about the two teams rather than the field: it is
the only direction that spends both role colours, and it is the most distinctive at first glance.
**02 · The Corner** is the calmest, most "place"-led option and the best fit for a poster/print-led
brand, but it is also the one that can be misread as a crop corner.

The approved mark's integration assets — adaptive foreground/monochrome VectorDrawables, legacy and round
densities, Play 512, the drawn MANHUNT wordmark and the lockup — are in [`final/`](final/README.md).

Nothing becomes final until the owner picks a direction.

---

## 9. Owner decisions — resolved and remaining

**Resolved by the owner, 2026-11-01:** direction PICKUP; mark 01 Open Zone; product name stays ManHunt.
The adaptive background is the solid field `#0B1220` (no gradient, per the brand rule), and the icon
palette mapping is cyan = field / coral = prey.

**Superseded:** the slogan “No gear. No fee. Just players.” was **rejected** by the owner (task-46).
Identity surfaces now use the provisional copy family — permanent line “Hide from your friends.”, hook
“Your friends are hunting you.”, CTA “Create a hunt. Send the code. Hide.” — pending final copy approval;

**Still the owner's (not solvable in the identity assets):**

1. **Name/trademark clearance** for “ManHunt” (`brand-platform.md` §10, flag D1).
2. **Go-ahead for the Android integration task** — copy the resources from [`final/android/`](final/android/)
   and run the verification pass; this workstream did not edit app code or `res/`.
3. **Install-page integration** — copy [`final/install/`](final/install/) next to the page and add the tags
   in its README (favicons, `og:image`); again, no server code was edited here.
