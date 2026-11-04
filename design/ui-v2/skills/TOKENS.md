# TOKENS — the shipped values, and the rules for deviating

Three kinds of token live here:
1. **Fixed** — approved identity/product constraints. A direction may not change these, even with a good reason:
   mark/wordmark geometry, palette semantic roles, the three OFL faces, contrast/touch/Arabic rules.
2. **Shipped defaults** — the values the app (v0.16.1 MATCHDAY) uses today, or the implementation values in
   `design/redesign/tokens.md`. Directions may re-weight/re-scale them within the deviation contract (§9).
3. **Direction-local choices** — values a direction introduces; they must be recorded in `NOTES.md` and still
   satisfy every floor. A client build maps them back to Fixed/Shipped or adds them to the token layer first.

**Read with:** `design/redesign/tokens.md` (the full rationale/Compose spec), `design/brand/strategy/visual-direction.md`,
`android/.../ui/theme/Theme.kt` + `ui/theme/BoardTokens.kt` (what actually ships),
`design/brand/motion-kit/assets/fonts/` (faces), `design/ui-v2/env/` (canvas + fonts in the design environment).

---

## 1. Typefaces (fixed)

| Role | Face | File / licence | Use |
|---|---|---|---|
| Display | **Big Shoulders Display** (Bold 700, Regular 400) | `design/brand/motion-kit/assets/fonts/BigShoulders-Bold.ttf` (OFL) | big words, clock, score, display numerals. Not body, not labels. |
| UI / body | **Instrument Sans** (400, 700) | `…/InstrumentSans-Regular.ttf`, `-Bold.ttf` (OFL) | every functional label, body, button, title. |
| Data | **Red Hat Mono** (400) | `…/RedHatMono-Regular.ttf` (OFL) | genuinely machine data only: code, timestamps, coordinates, version, state words. Never prose/headings. |
| Arabic (design-env stand-in) | **IBM Plex Sans Arabic** (OFL) | `design/ui-v2/env/fonts/arabic/` (`--mh-font-arabic`, alias `--font-arabic`) | Arabic UI/body/display; matches the device Arabic sans fallback the shipped app uses. Latin numerals/codes stay in the Latin faces. |

Rules: Arabic never uses Big Shoulders/Instrument Sans as its display face; Latin never sets Arabic. No fourth
face in a direction. Fonts are bundled OFL (359.5 KB total for the five Latin TTFs); the Arabic face is a design
stand-in, not a new brand face (the app ships system Arabic until an optional bundled face lands).

---

## 2. Type scale (shipped Latin + Arabic)

From `design/redesign/tokens.md` §2 and the shipped `Theme.kt` (`LatinTypography`, `ArabicTypography`,
`ManHuntType`). Sizes in sp / line-height sp.

| Token | Latin | Face / wt / tracking | Arabic | Use |
|---|---|---|---|---|
| `display.xl` | 64/58 | Big Shoulders 700, −0.01 em | 56/64 | Result winner word only ("Hunters win."). Max 2 lines. |
| `display.l` | 48/44 | Big Shoulders 700, −0.01 em | 42/52 | Auth/Home permanent line; first-run plate title. Max 2 lines. |
| `display.m` | 36/34 | Big Shoulders 700, −0.005 em | 32/42 | Rules-plate titles, big score numbers, tablet Board clock. |
| `display.s` | 28/30 | Big Shoulders 700, 0 | 26/34 | Declaration headlines ("SEND THE CODE", "YOU'RE OUT"). |
| `board.clock` | 44/44 (hero 56/56 at ≥400 dp) | Big Shoulders 700 tabular, −0.01 em | 40/44 (hero 48) — **digits stay Latin** | The live clock in `MatchBoard`. |
| `board.meta` | 16/20 | Big Shoulders 400 tabular | 16/20 Latin digits | Zone radius / prey count in Board gutter. |
| `headline` | 22/28 | Instrument Sans 700 | 22/32 | Screen titles ("The hunt", "Settings", "Chat"), sheet titles. |
| `title` | 17/22 | Instrument Sans 700 | 17/26 | Plate/sheet titles, roster names, mode names. |
| `body` | 15/22 | Instrument Sans 400 | 15/24 | Default copy. |
| `body.small` | 13/19 | Instrument Sans 400 | 13/21 | Supporting copy, rules prose, secondary rows. |
| `label` | 13/16 | Instrument Sans 700 | 13/20 | Button labels, row actions, tags, data labels. |
| `caption` | 12/16 | Instrument Sans 400 | 12/19 | Muted metadata, field notes, disclaimers. |
| `data` | 12/16 | Red Hat Mono 400, +0.04 em | 12/18 Latin mono | Invite code, timestamps, version, coordinates, zone radius. |
| `data.small` | 11/14 | Red Hat Mono 400, +0.04 em | 11/16 | Legal/attribution/version metadata only (≥7:1 contrast). |
| `state` | 11/14 | Red Hat Mono 400, +0.10 em, uppercase | 12/16 UI face, no tracking | `StateTag`/Board state word: `LOBBY`, `HEAD START`, `LIVE`, `PAUSED`, `FULL TIME`, `CANCELLED`. |

**Type rules:**
- Sentence case everywhere except `state` words, true data labels (`HOST`, `YOU`, `PREY n / 2`, `ZONE 240 m`) and
  the invite code. No ALL-CAPS headings/eyebrows/buttons; no mono prose.
- Minimum readable size **13 sp** for text a player must read; 11–12 sp only machine metadata (and with ≥7:1).
  The brief's floor is body ≥14 sp equivalent / auxiliary ≥12 sp — treat 13 sp UI text as auxiliary, not body.
- One display moment per screen. Display is for loud *words/numerals*, not multi-line prose.
- Tabular numerals (`fontFeatureSettings = "tnum"`) on **every** clock, countdown, score, zone radius, code,
  coordinate, timestamp. Always Western digits, LTR, even in RTL.
- Tracking: display −0.01 em at ≥36 sp, 0 below; UI 0; data +0.04 em; state +0.10 em; **Arabic 0 always**.
- Body line length ≤68 characters / 560 dp reading column.
- Text scaling: body/labels/data 1:1; display/Board at **half rate, capped 1.25×** so 200 % font scale cannot
  turn the scoreboard into wallpaper. No fixed heights on anything containing text — `heightIn` and reflow.
- M3 `Typography` slot mapping is in `design/redesign/tokens.md` §2.2; extra styles (`board.clock`, `board.meta`,
  `data`, `state`) live in `ManHuntType` (`BoardTokens.kt`), not crammed into unrelated slots.

---

## 3. Colour — semantic roles (fixed semantics, shipped values)

| Token | Dark (shipped) | Light (shipped) | Role (fixed) | Contrast floor |
|---|---|---|---|---|
| `field` | `#0B1220` | `#F7F9FC` | ground/background | — |
| `board` | `#131C2E` (surface) | `#0B1220` | Board plate — **always ink in both themes** | chalk 15.9:1 |
| `plate` | `#131C2E` | `#FFFFFF` | interactive group surface | — |
| `plateRaised` | `#1D2840` | `#E6ECF5` | inside a plate (code cell, input, selected segment) | — |
| `chalk` | `#E6EDF7` | ink `#0F172A` | primary text, rules, markings | 15.9:1 dark / 16.9:1 light |
| `muted` | `#A7B6CC` | `#475569` | secondary text/metadata | 9.1:1 / 7.6:1 |
| `hairline` | `#2A3550` | `#D3DCE8` | structural rules/dividers; never the only border of a control | non-text |
| `hairlineStrong` | `#5E7198` | `#7C8CA3` | interactive borders (input, outline button, plate edge) | ≥3:1 |
| `cyan` | `#22D3EE` | `#0C6B84` | **field/referee/time**: live, focus ring, the one primary fill, zone ring, clock accents | 10.4:1 / 6.1:1 |
| `onCyan` | `#04222B` | `#FFFFFF` | label on cyan fill | 9.2:1 / 6.1:1 |
| `coral` | `#FF7A59` | `#B33A0F` | **Prey only** (tag, sheet column, trail, prey dot) | 7.3:1 / 5.6:1 |
| `violet` | `#A79BFF` | `#5B21B6` | **Hunters only** | 7.8:1 / 8.5:1 |
| `error` | `#FF8A8A` | `#B91C1C` | destructive/error text/icons only | 8.3:1 / 6.5:1 |
| `scrim` | `#0B1220` 60 % | `#0F172A` 45 % | sheet/dialog backdrop | — |
| `amber` (shipped map stale) | `#F0A43A` | — | stale/flagged report marker (must differ from fresh coral) | non-text signal |

**Map tokens (dark; shipped `MatchMap.kt` filters the tiles):** ground `#0B1220`, blocks `#101827`, roads
`#223049`/`#2F4058`, water `#0E2A33`, labels `#A7B6CC`, zone ring `#22D3EE` @70 % + 8–12 % fill, fresh prey
`#FF7A59`, stale prey amber + dashed/dim, hunter `#A79BFF`, eliminated `#E6EDF7` @30 % + cross tick, trail
`#FF7A59` @58 %.

**Colour rules (review-enforced):**
1. **One filled cyan surface per screen** (>2 px area). No cyan icon tints, links, tab indicators or section labels.
2. **Teams = colour + glyph + name.** Coral/violet never the only cue; team tint fills 12–14 % alpha; team text
   must keep ≥4.5:1 on its own tint.
3. **Cyan is never a team; coral/violet are never the field, error or brand line at rest.**
4. **No gradients, glows, blurs, glass, drop shadows.** Depth = overlap + hairlines + scrim. Only texture allowed:
   flat chalk-dust specks ≤4 % inside the drawn field plate, never over text.
5. **Error is not a team colour.** Error = 1 dp error rule + error text on plate; not a pale rounded card.
6. **Selected** = 2 dp team/cyan border + 12 % tint + check glyph — never a colour swap alone.
7. **Disabled** = label/icon 38 % alpha; plate/border stays full strength; still legible at 1 m.
8. **Light theme = daylight chalk** (ink type, white plates, darker signals, Board stays ink); no pure black, no cream.
9. **Contrast floors:** body/label ≥4.5:1; large display ≥3:1; non-text interactive boundaries ≥3:1; metadata ≥7:1.
   Re-run every new pair; do not eyeball.

---

## 4. Spacing (shipped, 4 dp base — use only these)

`space.1 = 2`, `2 = 4`, `3 = 6`, `4 = 8`, `5 = 12`, `6 = 16`, `7 = 20`, `8 = 24`, `9 = 32`, `10 = 40`,
`11 = 48`, `12 = 64` (`BoardTokens.kt` `BoardSpace`; `Theme.kt` legacy `ManHuntSpacing` has 8/16/20/28/32/18 —
new screens use `BoardSpace`, legacy values are implementation debt, not the design language).

| Use | Value (dp) |
|---|---|
| Screen side margin phone / ≥600 dp | 16 / 24 |
| Reading column max | 560 (640 absolute) |
| Gap between rule-separated groups | 24 |
| Gap inside a plate | 12–16 |
| List row vertical padding | 12–14 (rows separated by 1 dp hairline; no gap) |
| Bottom dock | 72 min + nav inset; 12 top/bottom padding |
| Board height | content-driven ≥84 |
| Button heights | primary 56, secondary 48, hit target 48 |
| Input height | 52 (min), `heightIn` |
| Code cell | 48×56, 6 cells, 8 gap |
| Team tag / state tag height | 28 / 20 |
| Sheet max height | 60 % of screen, scroll inside |
| List row | 56 min (72 for two lines) |
| Minimum touch target | 48×48 |

**Grid:** 4 dp base; content aligned to a left rule (all type left-aligned except Board clock/result winner —
also left; the only centred things: short empty-state text, sheet gesture rule, pager rail).

---

## 5. Shape, border, elevation (fixed rules for v2)

| Token | Value | Use |
|---|---|---|
| `shape.plate` | 2 dp radius | plates, buttons, inputs, code cells, sheet top corners, dialogs |
| `shape.tagCut` | `CutCornerShape(topEnd = 8.dp)` | `TeamTag` (kit/ticket silhouette; mirrors in RTL) |
| `shape.stateTag` | `CutCornerShape(topEnd = 4.dp)` | `StateTag` |
| `shape.field` | 0 | rules, Board, map, full-bleed surfaces, dividers |
| `shape.pill` | **banned** | except platform-circular icon buttons at 48 dp |
| `border.hairline` | 1 dp | rules, dividers, plate outline, Board top/bottom |
| `border.control` | 1 dp `hairlineStrong` | input/outlined-button rest (≥3:1) |
| `border.selected` | 2 dp team/cyan | selected segment/team + 12 % tint |
| `border.focus` | 2 dp cyan + 2 dp offset | every interactive element |
| `border.boardRule` | 1 dp chalk @20 % over ink | Board top/bottom |
| **elevation** | **0** | `tonalElevation = 0`, `shadowElevation = 0`; use overlap + scrim + tonal steps |

Banned: 16/20/24/28 dp card radii, 999 dp chips, sheet corner >2 dp, shadows, gradients, glass, blur, bevels.
No nested plates. No plate for prose/sections/headers/lists/messages/roster rows/Board/map.

---

## 6. Motion (shipped + target vocabulary)

Current `ui/theme/Motion.kt`: `QUICK = 120`, `STANDARD = 180`, `EMPHASIZED = 240`, `LONG = 320`;
`EaseOutExpo(0.16,1,0.3,1)`, `EaseOutCubic`, `EaseInOut`. Target vocabulary from `design/redesign/tokens.md` §8
(reviews check intent, not exact millisecond):

| Token | ms | Easing | Use |
|---|---:|---|---|
| `motion.instant` | 0–80 | linear | Board digit change (hard cut), tag snap final frame, press colour |
| `motion.tick` | 120 | linear | press feedback, check marks (no ripple) |
| `motion.snap` | 120 | hard cut | tag confirmation, role selection, state tag change |
| `motion.draw` | 400–600 | linear | zone ring, trail, report ping (broadcast graphics, no spring) |
| `motion.enter` | 240 | EaseOutExpo | sheet/dock rise, single content entrance |
| `motion.exit` | 160 | EaseInOut | sheet dismiss, banner out |
| `motion.wipe` | 200 | linear | screen transition chalk wipe/cut |
| `motion.clock` | 1000 | linear | clock tick mark; digits do not ease |

Rules: no springs/overshoot/bounce; no per-element stagger; no shimmer; no animation without a game event;
reduced motion (system animator scale 0) collapses everything to the final static frame — the static frame must
carry all information; `draw` motion ≤30 fps on map; map motion pauses when the screen is not resumed.

---

## 7. Sizes & component metrics (single source)

| Component | Metric |
|---|---|
| `BoardButton` primary / secondary / destructive | 56 / 48 / 48 dp height; radius 2; label 13 Bold UI; full content width |
| Inline action | 48 hit height, 13 Bold, underline on press/focus only |
| `MatchBoard` | full width, ≥84 height, 16/10 padding, 1 dp hairlines |
| `Masthead` | 56 height, lockup 20 dp cap, settings 48 target, 1 dp bottom rule |
| `ChalkRule` | 1 dp rule + optional 3×3 dp ticks, 20 dp vertical padding |
| `CodePlate` | 6 × (48×56), 8 gap, code mono 20 sp uppercase +0.08 em, cells plateRaised + 1 dp control border |
| `TeamTag` / `StateTag` | 28 / 20 min height; cut 8 / 4 dp; glyph 16 / dot 6 |
| `TeamSheet` | two columns, 2 dp team rule, rows 56, header glyph 20 + label + count 16 |
| Text field | 52 min, plateRaised, 1 dp control, radius 2, label caption above, error/help 12 below |
| `MatchSheet` | max 60 % height, 2 dp top radius, 1 dp top hairline, gesture rule 24–40×2, padding 16, stacked actions 12 gap |
| `ScorePage` | Board full-time + winner `display.xl` + score `display.m`/data + 180 dp field plate + team sheets + dock |
| Chat row | time 44 dp gutter, name label, body 15/22, 1 dp hairline; composer 52 + 52 send |
| Empty / error / loading | one vocabulary: `EmptyState`, `ErrorStrip`, `LoadingRule`, `OfflineStrip`, `PermissionStrip` (`COMPONENTS.md` §12) |

---

## 8. Adaptive + RTL tokens (shipped intent)

| Window width | Layout |
|---|---|
| <600 dp | one column, 16 dp margins, Board full-bleed, bottom dock |
| 600–839 | reading column max 560 centred; Board full-bleed; lobby teams may stay 2-up; settings one column |
| ≥840 | two-pane where meaningful (lobby teams/roster + code/rules; hunt map + sheet panel 360 dp; settings rail 240 + content 560; chat column max 640) |
| ≥1200 | same as ≥840, content max 960, hover/focus rings, keyboard Enter/Escape |
| Landscape phone | Board top, map fills, dock bottom; never a fixed map card |
| Foldable/tabletop | hinge/posture: top Board+map, bottom dock/sheet; state preserved (`rememberSaveable`) |

RTL tokens: mirror layout/text alignment/rules/start-end padding/arrows/back/sheet drag/tag cut/pager; don't
mirror wordmark/mark/map/clock-code-score numerals/physical team glyphs. Arabic expands ~15–20 % — buttons
wrap and grow, never clip; no `·` separators in Arabic; no tracking; isolate Latin tokens; numerals LTR.

---

## 9. Deviation contract — how a direction may differ and stay ManHunt

A direction is a coherent system, not a skin. These are allowed if recorded in `NOTES.md` and the review
passes: **re-weight** the palette (more/less coral vs violet vs cyan presence), **re-scale** the type ladder
(within floors/floors: no body <13 sp, no essential <11 sp, display may go bigger/louder), **re-compose** layout
and hierarchy, **re-style** rules/plates/tags (different cuts, ticks, density), **add** a neutral/tint within
the brand hues, **change** the type-pairing emphasis (e.g. more mono in C), **change** motion timing/easing
within the event vocabulary, **introduce** a direction graphic gesture (stencil/tape/registration marks/field
grid) as long as it is flat and doesn't hurt legibility.

| Token | Can a direction change it? | Must keep |
|---|---|---|
| Mark/wordmark geometry | **No** | approved drawings only, clear space, wordmark as paths |
| Faces | **No** (no 4th face; Arabic stand-in allowed) | OFL faces, roles (display/UI/data separation) |
| Colour semantics | **Re-weight only** | cyan=field/referee/time, coral=Prey, violet=Hunters, never cross roles; one hot colour; contrast floors |
| Colour values | **Extend/restyle within brand hue** | contrast floors, flat fills, Board ink in light |
| Type scale | **Re-scale** | one display moment; sentence case rules; tabular numerals; Arabic rules; floors |
| Spacing scale | **Re-base within 4 dp logic** | margins/targets/breathing room; no 10/14/18/22 one-offs without a named token |
| Radii/borders | **Re-style 0–2 dp** | plates ≤2 dp, no pills, no shadow, hairlines ≥3:1 for controls |
| Motion | **Re-time within vocabulary** | event-mapped only, no springs, reduced-motion equivalent |
| Iconography | **Re-draw if grammar matches** | 24 grid, 2 dp butt-cap, original, FieldMarks grammar; no Material feature icons |
| State components | **Re-style** | one vocabulary, honest copy, retry preserves input, offline keeps data |
| Board/clock | **Variant/scale** | one per screen, ink in both themes, tabular, no fake clocks, glanceable |

**Banned for every direction (fixed):** gradients/glows/shadows/blur/glass/bevels; 20 dp card stacks/icon tiles;
all-caps headings/eyebrows; pill buttons; cyan as generic accent; colour-only team cue; fake data/clocks/claims;
dev strings; stock/AI/network imagery; recut mark; a 4th font; more than one Board or primary action per page.

---

## 10. Design-environment contract (frozen — `design/ui-v2/env/README.md`)

Every direction page is built against the shared env canvas, not a personal stylesheet. The contract
(design-env, `env/README.md` + `env/canvas.css`) is:

- **Canvas:** exactly one `.page` root, **390 × 844 dp**, rendered **1170 × 2532 px** @3×, viewport capture,
  no page scrolling (inner scroll regions allowed with hidden scrollbars); full-bleed, no OS chrome; 24 dp
  default outer margin via `--mh-gutter`; overlays rendered as full-page states behind `.mh-scrim`.
- **Stylesheet:** `<link rel="stylesheet" href="/design/ui-v2/env/canvas.css">` (repo-root path — never a
  relative path; never open pages with `file://`). **Do not fork/copy canvas.css.** A direction's token
  overrides go in its own `direction.css` linked **after** canvas.css; they override `--mh-*` custom properties.
- **Required helpers/classes:** `.page` (root), `.mh-display`, `.mh-ui`, `.mh-mono`, `.mh-label`,
  `.mh-tabular`, `.mh-safe` (24 dp gutter padding), `.mh-hairline`, `.mh-scrim`, `.mh-touch` (≥48 dp),
  `.mh-sr-only`, `.mh-arabic` (whole Arabic string), `.mh-ltr` (isolate a code/numeric run as LTR).
- **Fonts:** canvas.css loads the bundled brand faces (`--mh-font-display/-ui/-mono`) and the Arabic stand-in
  (`--mh-font-arabic`, alias `--font-arabic`, `env/fonts/arabic/`); brand faces stay first in every stack so
  Latin letters/numerals/codes keep brand voice. Arabic proof page: `<html lang="ar" dir="rtl">`; Arabic body
  text in the Arabic face (`.mh-arabic` where the whole string is Arabic); numerals/code stay `.mh-ltr`.
- **Themes:** dark is primary; light proof = `<html data-theme="light">`. **canvas.css now ships the brand
  "daylight chalk" light tokens directly** (fixed at source, matching shipped `Theme.kt` LightColors /
  `design/redesign/tokens.md` §3.2): ground `#F7F9FC`, deep `#E6ECF5`, surface `#FFFFFF`, ink `#0F172A`,
  dim `#475569`, mute `#7C8CA3`, rules `#D3DCE8`/`#B6C2D4`, cyan `#0C6B84`, coral `#B33A0F`,
  violet `#5B21B6`, on-accent `#FFFFFF` — so the `home-light` proof can rely on them directly; the Board stays
  ink `#0B1220`. §3 above remains the authority. A direction may still reweight light within the brand (override
  `--mh-*` in its own `direction.css` and record it in NOTES), but not into a cream/beige identity — the brand
  explicitly rejects the cream/serif look (`design/redesign/tokens.md` §3.2 rule 9).
- **Theme/token mapping:** our ManHunt roles map to the env scaffold as: field→`--mh-bg`, board/plate→
  `--mh-surface` (Board stays ink manually), surfaceRaised→`--mh-surface-raised`, chalk→`--mh-ink`,
  muted→`--mh-ink-dim`, hairline→`--mh-rule`, control border→`--mh-rule-strong`, cyan→`--mh-cyan`,
  onCyan→`--mh-on-accent`, coral→`--mh-coral`, violet→`--mh-violet`, focus→`--mh-focus`,
  radius→`--mh-radius`, hairline width→`--mh-hairline`. Add direction-specific vars in `direction.css`.
- **Render:** from the repo root —
  `node design/ui-v2/env/render.mjs design/ui-v2/directions/<dir>` → `<dir>/out/*.png` (exactly 1170×2532);
  one page: `node design/ui-v2/env/render.mjs design/ui-v2/directions/<dir>/<page>.html`; contact sheet:
  `node design/ui-v2/env/contact-sheet.mjs --only <dir>`. Font proof and preview: see `env/README.md` §1/§8.
- **No external assets:** every page renders offline from repo files — no network URLs, stock images, AI
  imagery, icon CDNs or non-bundled web fonts. Mark/lockup paths are in `env/README.md` §4.1; use the official
  SVGs (inline copies allowed only if geometry is identical).

## 11. Token checklist for NOTES.md (per direction)

1. List every value you changed from the shipped defaults + one-line reason.
2. Show the type scale (display→caption) you used, including the Board clock/state styles.
3. Show the colour table with contrast ratios for every text pair (AA/AAA), light + dark.
4. State how the direction uses cyan (one surface/page), coral, violet, error, amber.
5. State radii/border/elevation rules and confirm no shadow/gradient/blur.
6. State spacing base and margins; how the bottom dock and 48 dp targets are met.
7. State motion events used + reduced-motion equivalents.
8. State Arabic/RTL adjustments and light-theme translation.
9. Confirm you linked the shared `env/canvas.css`, used `.page` + the required helper classes, overrode only `--mh-*` vars in `direction.css`, and rendered with `node design/ui-v2/env/render.mjs` (see §10).
10. State Compose mapping: which shipped composables are reused, which are new, which need token-layer work.
