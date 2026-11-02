# ManHunt app redesign — tokens

**Status:** implementation authority for the visual system (task-51). Pairs with
[`direction.md`](direction.md) and [`motion.md`](motion.md). Every value here is a decision, not a
suggestion; where a value is "adaptive" the rule is given. No app code in this workstream.

**One-line rule for the implementer:** when a screen looks wrong, check it against the token that owns the
thing (type role, colour role, shape role), not against taste. If a needed value is not here, add it *here*
first with a note, then use it — never hard-code a hex, a corner radius or a font size in a screen.

---

## 1. Typefaces

The app currently bundles **no font** (system Roboto, `Theme.kt`). The redesign bundles the three faces the
brand motion kit already ships under `design/brand/motion-kit/assets/fonts/` (all **SIL OFL 1.1**, licence
text beside them). Using them is the single cheapest way to make the app look like the brand that already
exists on GitHub/social.

| Role | Face | File (OFL) | Weights | Why |
|---|---|---|---|---|
| Display | **Big Shoulders Display** | `BigShoulders-Bold.ttf` (94.5 KB), `BigShoulders-Regular.ttf` (94.4 KB) | 700 primary, 400 rare | Condensed athletic grotesque — kit numbers, stadium signage, scoreboards. Already used in the motion kit. |
| UI / body | **Instrument Sans** | `InstrumentSans-Regular.ttf` (68.1 KB), `InstrumentSans-Bold.ttf` (68.0 KB) | 400, 700 | A tight, modern grotesque with more character than Roboto and far better metrics for a utility app; family pairing is clearly distinct from the display face. |
| Data | **Red Hat Mono** | `RedHatMono-Regular.ttf` (34.5 KB) | 400 | Only for genuinely machine data: invite code, timestamps, version, coordinates, state words. Never prose, never headings. |
| Arabic | **System Arabic** (Noto Naskh Arabic on device) — optional Phase 4: IBM Plex Sans Arabic (OFL) | — | 400/700 | Do not fake Arabic with the Latin display face; never letter-space Arabic. If APK budget allows (~+250–350 KB), bundle IBM Plex Sans Arabic Regular/SemiBold and add it as the Arabic UI face; otherwise system Arabic is the honest fallback. |

**Bundling budget:** 5 Latin TTFs = **359.5 KB** raw. That is the total accepted cost for the identity; do
not add more faces in this sprint. If APK size is a hard gate, bundle only `BigShoulders-Bold.ttf`,
`InstrumentSans-Regular.ttf`, `InstrumentSans-Bold.ttf`, `RedHatMono-Regular.ttf` (265 KB) and use
Instrument Sans Bold for the rare display-regular moments.

**Android resource layout** (lower-case file names, no XML font families needed if using Compose):

```
res/font/big_shoulders_bold.ttf
res/font/instrument_sans_regular.ttf
res/font/instrument_sans_bold.ttf
res/font/red_hat_mono_regular.ttf
res/raw/ofl_big_shoulders.txt        # licence text, required to ship OFL
res/raw/ofl_instrument_sans.txt
res/raw/ofl_red_hat_mono.txt
```

**Compose wiring (suggested):**

```kotlin
val BigShoulders = FontFamily(Font(R.font.big_shoulders_bold, FontWeight.Bold))
val InstrumentSans = FontFamily(
    Font(R.font.instrument_sans_regular, FontWeight.Normal),
    Font(R.font.instrument_sans_bold, FontWeight.Bold),
)
val RedHatMono = FontFamily(Font(R.font.red_hat_mono_regular, FontWeight.Normal))
```

`ManHuntTheme` builds two typographies: the Latin set above, and an Arabic set that swaps
`BigShoulders`→`FontFamily.SansSerif`/bundled Arabic face and removes all tracking. Select with
`LocalLanguage`/`LocalLayoutDirection` (Arabic when `language == Arabic`). Digits inside Arabic screens stay
Latin tabular (see §2.4). Font fallback chains are required (e.g. user-system Arabic face) — never let a
missing glyph render as tofu.

---

## 2. Type scale

**Rules**

1. **Sentence case everywhere except true labels.** Uppercase is allowed only in (a) `StateTag` words
   (`LIVE`, `HEAD START`, `PAUSED`, `FULL TIME`, `CANCELLED`), (b) mono data labels that are genuinely data
   (field labels such as `HUNT NAME`, values such as `GRANTED`, team marks such as `HOST`/`YOU`), and (c) the
   invite code. Never for headings, eyebrows, buttons or prose; never letterspaced small caps as decoration.
2. **One display moment per screen.** Big Shoulders is for the loud beat only (Home/Auth line, Result
   winner, Board clock, big score numbers, rules-plate titles). Functional titles use Instrument Sans.
3. **Minimum readable size is 13 sp** for any text a player must read; `dataSmall` at 11 sp is only for
   machine metadata (version, timestamp) and must have ≥7:1 contrast.
4. **Tracking**: display face −0.01 em at ≥36 sp, 0 at smaller; UI face 0; data face +0.04 em;
   `StateTag` +0.10 em. **Arabic: 0 tracking always.**
5. **Tabular numerals** (`fontFeatureSettings = "tnum"`) on every clock, countdown, score, zone radius,
   code, coordinate and timestamp. Digits must not dance.
6. **Line length** ≤ 68 characters for body text; never wider than the reading column in §5.
7. **Scaling**: body/labels/data scale 1:1 with the app `fontScale` (existing behaviour). Display and
   Board styles scale at **half rate**, capped at 1.25× so a 2-line display headline can never eat the
   screen: `displayScale = 1f + (fontScale - 1f).coerceAtLeast(0f) * 0.5f`, applied via
   `ManHuntTheme(fontScale = …)`. Re-flow rules in `screens/12-adaptation.md`.

### 2.1 Latin scale (sp / line-height sp, face, weight, tracking)

| Token | Size/LH | Face | Wt | Track | Use |
|---|---|---:|---:|---:|---|
| `display.xl` | 64/58 | Big Shoulders | 700 | −0.01 em | Result winner word only ("HUNTERS WIN"). Max 2 lines. |
| `display.l` | 48/44 | Big Shoulders | 700 | −0.01 em | Auth/Home permanent line, first-run plate title. Max 2 lines. |
| `display.m` | 36/34 | Big Shoulders | 700 | −0.005 em | Rules-plate titles, big score numbers (e.g. "2–1"), Board clock on tablets. |
| `display.s` | 28/30 | Big Shoulders | 700 | 0 | Plate headlines that are declarations ("SEND THE CODE", "YOU'RE OUT"), Home hero fallback. |
| `board.clock` | 44/44 | Big Shoulders | 700 | −0.01 em | The live clock in `MatchBoard`. Hero variant 56/56 when width ≥ 400 dp. |
| `board.meta` | 16/20 | Big Shoulders | 700 | 0 | Zone radius / prey count numerals in Board gutter (tabular). |
| `headline` | 22/28 | Instrument Sans | 700 | 0 | Screen titles ("The hunt", "Settings", "Chat"). |
| `title` | 17/22 | Instrument Sans | 700 | 0 | Plate/sheet titles, roster names, mode names. |
| `body` | 15/22 | Instrument Sans | 400 | 0 | Default copy. |
| `body.small` | 13/19 | Instrument Sans | 400 | 0 | Supporting copy, rules prose, secondary rows. |
| `label` | 13/16 | Instrument Sans | 700 | 0 | Button labels, row actions, tags. |
| `caption` | 12/16 | Instrument Sans | 400 | 0 | Muted metadata, field notes, disclaimers. |
| `data` | 12/16 | Red Hat Mono | 400 | +0.04 em | Invite code, timestamps, version, coordinates, zone radius in sheet. |
| `data.small` | 11/14 | Red Hat Mono | 400 | +0.04 em | Legal/attribution/version metadata only. |
| `state` | 11/14 | Red Hat Mono | 400 | +0.10 em, uppercase | `MatchBoard` state word, `StateTag`: `LOBBY`, `HEAD START`, `LIVE`, `PAUSED`, `FULL TIME`, `CANCELLED`. |

### 2.2 M3 `Typography` slot mapping (for Material components and existing call sites)

| M3 slot | Token | Note |
|---|---|---|
| displayLarge | `display.xl` | replace default |
| displayMedium | `display.l` | |
| displaySmall | `display.m` | |
| headlineLarge | `display.s` | |
| headlineMedium | `display.s` (or `headline` for dense screens) | |
| headlineSmall | `headline` | |
| titleLarge | `headline` | screen titles |
| titleMedium | `title` | |
| titleSmall | `label` | |
| bodyLarge | `body` | |
| bodyMedium | `body.small` | |
| bodySmall | `caption` | |
| labelLarge | `label` | button text |
| labelMedium | `state` | state words |
| labelSmall | `data.small` | metadata |

Extra styles that don't fit M3 slots (`board.clock`, `board.meta`, `data`, `state`, `display.xl`) live in a
`ManHuntType` object (or `CompositionLocal`) so screens can call `ManHuntType.boardClock` directly. Do not
cram them into unrelated M3 slots.

### 2.3 Arabic scale (same roles, Arabic face, no tracking)

Arabic needs more height at the same optical size, and display numerals stay Latin.

| Role | Arabic size/LH | Note |
|---|---|---|
| `display.xl` | 56/64 | result word; may wrap to 2 lines at 360 dp |
| `display.l` | 42/52 | Home/Auth line |
| `display.m` | 32/42 | |
| `display.s` | 26/34 | |
| `board.clock` | 40/44 | **digits stay Latin** Big Shoulders tabular even in Arabic; only the state word is Arabic |
| `headline` | 22/32 | |
| `title` | 17/26 | |
| `body` | 15/24 | Arabic needs +2 sp leading |
| `body.small` | 13/21 | |
| `label` | 13/20 | |
| `caption` | 12/19 | |
| `data` / `state` | 12/18, 11/16 | Latin mono for machine data; state word can be Arabic in UI face if the mono face has no Arabic (fallback, no tracking) |

Arabic display never uses the Latin display face, never gets letterspacing, and never sits in a fixed-height
box (tall ascenders/descenders). For mixed lines ("HUNTING · 42:17"), keep the whole line in one LTR
isolate (`\u202D…\u202C`) or split into separate composables so bidi cannot reorder the clock.

### 2.4 Numerals

- Always Western digits `0-9`; always LTR, even in RTL (wrap the clock/code/timer in
  `CompositionLocalProvider(LocalLayoutDirection provides Ltr)` or `Text(..., textDirection = Ltr)`).
- Clock format `MM:SS` for the hunt countdown; `H:MM` for durations over an hour; tabular everywhere.
- The separator "·" is banned in Arabic strings (bidi hazard) — use a full stop or a new line; it is
  allowed in English metadata only at `caption`/`data` level, never between a label and its value when
  that pair is being translated.
- The invite code is displayed in **Red Hat Mono uppercase** with +0.04 em tracking; Latin-only content,
  always LTR.

---

## 3. Colour

### 3.1 Colour roles (dark / light)

Brand hexes are fixed by the approved identity. The light column is an existing translation in `Theme.kt`;
this table is the semantic contract.

| Token | Dark | Light | Role / use | Contrast |
|---|---|---|---|---|
| `field` | `#0B1220` | `#F7F9FC` | App background, map ground, the Board in light. | — |
| `board` | `#131C2E` (surface) | `#0B1220` | `MatchBoard` plate. **Always ink/raised, in both themes.** | chalk 15.9:1 |
| `plate` | `#131C2E` | `#FFFFFF` | Interactive group surface (code plate, team choice, settings control, match sheet). | — |
| `plateRaised` | `#1D2840` | `#E6ECF5` | Inside a plate: selected segment, code cell, input field. | — |
| `chalk` | `#E6EDF7` | `#0F172A` (`ink`) | Primary text, rules, markings. | 15.9:1 dark / 16.9:1 light |
| `muted` | `#A7B6CC` | `#475569` | Secondary text, metadata. | 9.1:1 dark / 7.6:1 light |
| `hairline` | `#2A3550` | `#D3DCE8` | Structural rules, dividers, decorative borders. **Never the only border of an interactive control.** | non-text |
| `hairlineStrong` | `#5E7198` | `#7C8CA3` | Interactive borders (input rest, outlined button, plate edge), ≥3:1 non-text. | 3.48:1 dark on plate / 3.42:1 light on white |
| `cyan` | `#22D3EE` | `#0C6B84` | **Referee/field only:** clock, LIVE state, focus ring, the one primary action fill, zone ring in diagrams. | 10.4:1 dark / 6.1:1 light |
| `onCyan` | `#04222B` | `#FFFFFF` | Label on a cyan fill. | 9.2:1 / 6.1:1 |
| `coral` | `#FF7A59` | `#B33A0F` | **Prey only** (tag, sheet column, trail, prey dot, prey state). Never a warning colour. | 7.3:1 dark / 5.6:1 light |
| `violet` | `#A79BFF` | `#5B21B6` | **Hunters only** (tag, sheet column, hunter dot, hunter state). | 7.8:1 dark / 8.5:1 light |
| `error` | `#FF8A8A` | `#B91C1C` | Destructive + error text/icons only; never decoration, never used for Prey. | 8.3:1 dark / 6.5:1 light |
| `scrim` | `#0B1220` @ 60% | `#0F172A` @ 45% | Sheet/dialog backdrop. | — |
| `map.asphalt` | `#0B1220` | — | Map ground (Deep Teal tile filter target). | — |
| `map.block` | `#101827` | — | Map blocks/buildings. | — |
| `map.road` | `#223049` | — | Minor roads. | — |
| `map.roadMajor` | `#2F4058` | — | Major roads. | — |
| `map.water` | `#0E2A33` | — | Water. | — |
| `map.label` | `#A7B6CC` | — | Map labels. | 8.3:1 |
| `map.zone` | `#22D3EE` @ 70% stroke | — | Zone boundary; 2 dp + 8% fill is enough. | — |
| `map.prey` | `#FF7A59` | — | Fresh prey dot + report ring. | — |
| `map.preyStale` | `#FF7A59` @ 45% + dashed ring | — | Stale prey: dimmer **and** dashed (shape cue). | — |
| `map.hunter` | `#A79BFF` | — | Hunters. | — |
| `map.eliminated` | `#E6EDF7` @ 30% + cross tick | — | Tagged prey: not a team colour any more. | — |
| `map.trail` | `#FF7A59` @ 58% | — | Prey trail, 2 dp round caps. | — |

### 3.2 Colour rules (enforced in review)

1. **One cyan surface per screen.** "Cyan surface" = a filled cyan area larger than a 2 px line. On Home:
   the Host button. On Lobby: the ready/begin bar. On Hunt: only the clock numerals + Live dot (no cyan
   fill). Never tint icons cyan, never use cyan for links (links are chalk with an underline rule).
2. **Teams are colour + shape + word.** Coral/violet are never the only cue: each has a glyph
   (`prey`/`hunters` FieldMarks) and a name. Team tint fills are 12–14 % alpha over `plate`/`field`; team
   text must keep ≥4.5:1 on its own tint (`coral` on 12 % coral = 6.3:1, `violet` on 12 % violet = 6.5:1).
3. **Cyan is never a team**; coral/violet are never the field, the error colour or the brand line at rest.
4. **No gradients, glows, blurs, glass, drop shadows.** Flat fills only. Depth = overlap + hairlines + scrim.
   The single accepted "texture" is flat chalk-dust specks ≤4 % opacity inside a `FieldPlate` drawing,
   never over text.
5. **Error is not a team colour.** Error banners are a 1 px `error` rule + `error` text on `plate` (or a
   full-width error strip), not a pale-red rounded card.
6. **Disabled** = content at `38 %` of its on-colour, no border change; disabled text is exempt from
   contrast but must still be legible at 1 m. Use `enabled = false` + `alpha(0.38)` on the label/icon only,
   keep the plate/border at full strength so the control remains perceivable.
7. **Selected** = 2 dp team/cyan border + 12 % tint + a `check` glyph; never just a colour swap.
8. **Team colours do not mean "success/failure".** Result uses the winner's team colour for the word and a
   chalk rule, not a green/red pair.
9. **Light theme is daylight chalk**, not a second identity: ink type, white plates, hairlines, darker cyan
   and team colours; the Board remains ink. No pure `#000`; no off-white cream (the brand rejects the
   cream/serif look).
10. **Contrast floors:** body/label ≥4.5:1; large display ≥3:1; non-text interactive boundaries ≥3:1;
    metadata ≥7:1 (because `data.small` is 11 sp). The table in §3.1 is the check; re-run it if a value
    changes.

---

## 4. Spacing, layout and the Board

### 4.1 Spacing scale (dp)

`space.1 = 2`, `2 = 4`, `3 = 6`, `4 = 8`, `5 = 12`, `6 = 16`, `7 = 20`, `8 = 24`, `9 = 32`, `10 = 40`,
`11 = 48`, `12 = 64`. Only these values (no 10, 14, 18, 22).

| Use | Value |
|---|---|
| Screen side margin (phone) | 16 |
| Screen side margin (≥600 dp) | 24 |
| Reading column max width | 560 dp (single column); 640 dp absolute max for text |
| Gap between groups (rule-separated) | 24 |
| Gap inside a plate | 12–16 |
| Gap between list rows | 0 (rows are separated by 1 dp hairlines, 12–14 dp vertical padding) |
| Bottom dock inset (above nav bar) | 12 top / 12 bottom + `WindowInsets.navigationBars` |
| Safe drawing | root keeps `safeDrawingPadding()`; Board sits inside it; IME padding on chat composer/docks |
| Board height | 84 dp phone (16+state 16 + 6 + clock 44 + 2) — content-driven, never fixed when text scales |
| Bottom action dock | 72 dp + nav inset (one 56 dp button + optional 40 dp secondary line) |
| Minimum touch target | 48 × 48 dp; inline text actions get 48 dp hit height |
| Button heights | primary 56, secondary 48, inline 48 hit / 16 text |
| Input height | 52 (single line), 44 minimum at large font scale with `heightIn` |
| Code cell | 48 × 56 dp, 6 cells, 8 dp gap |
| Tag/state tag height | 24 dp (team tag 28 dp when it carries a name) |
| Sheet max height | 60 % screen (portrait); scroll inside; sheet padding 16 |
| List row | 56 dp min (player rows), 72 dp when two lines |

### 4.2 The Board (signature metrics)

```
┌──────────────────────────────────────────────────────────────┐  ← 1 dp hairlineTop (chalk 20%)
│  STATE TAG (mono 11, tracked)                  ZONE 240 m    │  row 1: 16 dp, muted/data
│  LIVE                                          PREY 2 / 2     │
│                                                              │
│  41:12                                                        │  row 2: clock 44–56 sp display
│                                                              │
└──────────────────────────────────────────────────────────────┘  ← 1 dp hairlineBottom
```

- Full-bleed edge-to-edge (no side margin); inner content padded 16 dp start/end. In RTL mirrored: state
  left, data right → state right, data left; clock stays LTR as a unit.
- Dark: `board` = `#131C2E`; light: `board` = `#0B1220`; in both, chalk clock + cyan only for the live
  state dot/clock when live. On Result the Board becomes `FULL TIME` + final clock (frozen) + score.
- Home uses the **Masthead variant**: left = horizontal lockup (mark + wordmark) at 20 dp cap height; right
  = device local time in `data` + settings FieldMark button. No fake hunt clock before a hunt exists.
- Lobby uses the Board with `LOBBY`, room name in the state line, fresh invite code in `CodePlate` below,
  and no clock until the hunt starts (show `--:--` is banned; show "Not started" as data).
- Live Hunt: Board is pinned at the top of the safe area, above the map; the map scrolls/pans underneath
  it (map is inset by the Board height, not covered).
- The Board never carries more than: state, clock, one team/score datum, one zone datum. Anything else
  goes to the match sheet.

### 4.3 Adaptive layout tokens

| Window width | Layout |
|---|---|
| `< 600 dp` | One column, 16 dp margins, Board full-bleed, bottom dock. |
| `600–839 dp` | One reading column max 560 dp, centred; Board full-bleed; **Lobby** may show teams side-by-side (already 2-up) and roster below; **Settings** keeps one column; map fills. |
| `≥ 840 dp` | Two-pane where meaningful: **Lobby** = teams/roster left (max 560) + Board/code/rules right; **Hunt** = map top/large + dock bottom (never side-by-side map + sheet in portrait tablets: sheet is a right-side panel 360 dp); **Settings** = 240 dp section rail + content 560; **Chat** = message column max 640, centred. |
| Landscape phone | Board top, map fills, dock at bottom; never a fixed 320 dp map card; content scrolls only in the sheet. |
| Foldable / tabletop | Hinge: top pane = Board + map/field; bottom pane = dock/sheet controls; respect `WindowInsets` + posture; state preserved across fold/unfold (`rememberSaveable`, no `configChanges`). |
| ≥ 1200 dp (desktop/Chromebook) | Same as ≥840 with a max content width of 960 dp (two columns), mouse hover/focus rings visible (2 dp cyan outline + 2 dp offset), keyboard shortcuts Enter/Escape, no bottom-only reach assumptions. |

Grid: 4 dp base, 12-column only conceptually; content is aligned to a **left rule** (all type left-aligned
except the Board clock and Result winner, which are left too — never centre prose). The only centred
things: empty-state short text, the sheet gesture rule, the pager tick rail.

---

## 5. Shape, border, elevation

### 5.1 Radii

| Token | dp | Use |
|---|---:|---|
| `shape.plate` | 2 | Plates, buttons, inputs, code cells, sheets' top corners, dialogs, tags' base |
| `shape.tagCut` | 8 | `CutCornerShape(topEnd = 8.dp)` for `TeamTag`/`StateTag` — the kit-tag/ticket silhouette. Mirrors in RTL automatically. |
| `shape.field` | 0 | Rules, board, map, full-bleed surfaces, dividers |
| `shape.pill` | — | **Banned** (except platform-conventional circular icon buttons at 48 dp, which may be circles). |

No 16/20/28 dp card radii anywhere. No nested plates. No plate for: prose, page sections, headers, lists,
messages, individual roster rows, the Board, the map.

### 5.2 Borders

| Token | dp | Use |
|---|---:|---|
| `border.hairline` | 1 | Rules, dividers, decorative plate outline, Board top/bottom. |
| `border.control` | 1 | Input/outlined-button rest; must use `hairlineStrong` (≥3:1). |
| `border.selected` | 2 | Selected team/segment; team colour; plus 12 % tint. |
| `border.focus` | 2 | Focus ring in cyan, 2 dp offset (draw outside the control; keep 48 dp target). |
| `border.destructive` | 1 | Coral-outline? **No** — error colour at 1 dp, text in `error`. |
| `border.boardRule` | 1 | Chalk @ 20 % over the Board: top and bottom. |

Bottom sheets: 1 dp `hairline` top + a 24 × 2 dp centred gesture rule in `muted` @ 40 %. No rounded-28 dp
sheet corners.

### 5.3 Elevation

**Zero.** `tonalElevation = 0.dp`, `shadowElevation = 0.dp` everywhere. The app uses:
- **overlap** (a plate on the field, the dock over the map, the Board over the map),
- **scrim** (sheet/dialog backdrop, 60 % ink),
- **1 px rule + surface tonal step** (field → plate → plateRaised).

`Surface` components must pass `shadowElevation = 0.dp` explicitly if Material defaults would apply one.
No `elevation` animations.

---

## 6. Iconography — FieldMarks

- **Grid:** 24 × 24 dp; content inside a 2 dp padding (20 dp live area). **Stroke 2 dp** (1.5 dp at 16–18 dp
  sizes), `StrokeCap.Butt`, `StrokeJoin.Miter`, no rounded joins. Solid marks only where listed.
- **Sizes:** 20 dp inline with labels, 24 dp standard actions, 32 dp lone status glyph, 48 dp touch target
  wrapper. Icons never tinted cyan unless they *are* the live/referee state; team glyphs tint team colour;
  neutral glyphs are `chalk` (or `muted` at 70 % for secondary).
- **Grammar:** derived from the Open Zone mark — rings that do not close, dots, tally strokes, rules.
  No Material look-alikes (no AddCircle, Login, Wifi, Lock, Person, Gear, Pets, GpsFixed, Tune).
  Platform conventions that must remain recognisable (back arrow, close ×, check ✓, search) are redrawn in
  the same butt-cap grammar, 2 dp.
- **Icon sheet (16 core + 6 UI):**
  `zone`, `prey`, `hunters`, `trail`, `ping`, `tag`, `clock`, `code`, `roster`, `chat`, `settings`
  (mixer rules, not a gear), `history`, `update`, `share`, `theme` (half-filled ring), `language`
  (mirrored brackets); plus `back`, `close`, `more`, `check`, `plus`, `send`.
- **Never:** an icon tile behind an icon (no 34 dp tinted square), icon-only navigation, a glyph as the
  only cue for a team or state.

---

## 7. Component metrics (single source for specs)

| Component | Metrics |
|---|---|
| `BoardButton` primary | height 56, radius 2, fill `cyan`, label `onCyan` 13 sp Bold UI (not display), full content width; disabled = 38 % label + 12 % fill (no shimmer). |
| `BoardButton` secondary | height 48, fill transparent, 1 dp `hairlineStrong`, label `chalk`; pressed = chalk 8 % overlay. |
| `BoardButton` destructive | height 48, fill transparent, 1 dp `error`, label `error`; destructive confirm may fill `error` with `onError` if the action is irreversible. |
| Inline action | 48 dp hit height, label 13 sp Bold, chalk, 1 dp underline rule on press/focus only. |
| `MatchBoard` | width full, height content (≥84), paddings 16/10, hairlines top/bottom, state `state` + clock/values `board.clock`/`board.meta`. |
| `Masthead` | height 56, lockup height 20 dp, settings 48 dp target, 1 dp bottom rule. |
| `ChalkRule` | 1 dp `hairline`, optional 3 × 3 dp tick marks at start, optional caption 11–12 sp data above/right. |
| `CodePlate` | 6 cells × (48 w × 56 h), 8 gap, plateRaised fill, 1 dp hairlineStrong, code `data` 20 sp Mono? → use 20 sp (mono, tabular, uppercase, +0.08 em), caret cyan; paste action as 48 dp icon button; share/send-code action below. |
| `TeamTag` | height 28, cut corner 8 top-end, 12 % team fill, 1 dp team border, glyph 16 + name `label` 13, padding 8/10. |
| `StateTag` | height 20, no fill, 1 dp hairlineStrong cut-corner 4, text `state` 11 mono tracked; LIVE variant = cyan dot 6 + text cyan. |
| `TeamSheet` | 2 columns (or stacked on narrow RTL where names are long), header: glyph + "Prey"/"Hunters" 15 Bold + count `board.meta` 16; rows 56 dp, 1 dp hairline between, avatar 32 square 2 dp radius + name 15 UI + status data 11 right. |
| Roster row | 56 dp min, avatar 32, name `title` 17, host mark `HOST` data.small top-end, ready tick `check` 20 chalk/cyan? (chalk), no chevrons. |
| Text field | 52 dp, plateRaised fill, 1 dp control border, radius 2, label 12 caption above (not floating inside if it can be avoided), error text 12 below in `error`, focus 2 dp cyan ring. |
| `MatchSheet` | full width, radius 2 top, plate, 1 dp top hairline, gesture rule 24×2 muted 40 %, max 60 % height, title `headline` 22 + body.small 13, actions stacked 48–56 dp with 12 gap; safe-drawing insets inside. |
| `ScorePage` | full screen field; Board FULL TIME; winner word `display.xl`; score line `display.m`; course/meta `data`; map thumbnail plate (radius 2, 16:9, max 240 dp) with OSM credit if tiles; roster TeamSheet; actions bottom dock. |
| Chat row | system line: centred `data.small` muted + 1 dp rule 24 dp each side; message: sender `label` in team colour (or `muted`), body `body` chalk; own message: left 2 dp chalk rule + 12 % white tint, right-aligned in RTL; timestamps `data.small` muted, in a 48 dp gutter aligned to the message top. |
| Empty state | not an icon tile: a 1 dp `ChalkRule` with caption "No hunts yet" + one sentence `body.small` muted + one inline action; never a centred tinted square icon. |
| Loading | a 2 dp cyan rule that fills left→right (determinate, 600 ms) or 3 pulsing chalk ticks; sentence says what is loading; no full-screen spinner. |
| Error | full-width strip on `plate` with 1 dp `error` top rule, `error` glyph, `body.small` message + inline "Try again"; not a rounded card. |

---

## 8. Motion tokens

Full vocabulary in [`motion.md`](motion.md); the tokens are:

| Token | ms | Easing | Use |
|---|---:|---|---|
| `motion.instant` | 0–80 | linear | Board digit change (hard cut), tag snap final frame, button press colour. |
| `motion.tick` | 120 | linear | Press feedback, ripple-free 4 % overlay, check marks. |
| `motion.snap` | 120 | linear (hard cut) | Tag confirmation, role selection, state tag change. |
| `motion.draw` | 400–600 | linear | Zone ring, trail, ping (broadcast graphics; no spring). |
| `motion.enter` | 240 | `EaseOutExpo` (0.16, 1, 0.3, 1) | Sheet/dock rise, screen content entrance (single, not per-element). |
| `motion.exit` | 160 | `EaseInOut` | Sheet dismiss, banner out. |
| `motion.wipe` | 200 | linear | Screen transition chalk wipe / cut. |
| `motion.clock` | 1000 | linear | Clock tick mark; digits do not ease. |

No springs/overshoot, no bounce, no stagger of every element, no shimmer as loading, no animation without a
game meaning. Reduced motion = all of the above collapse to 0 ms with the final state rendered immediately
(the static frame carries the information).

---

## 9. RTL / Arabic tokens

- **Mirror:** layout direction, text alignment, rules, paddings (use `start`/`end`), arrow/back glyphs,
  sheet drag direction, tag cut corner (Compose mirrors `topEnd`), radar field artwork (mirror the canvas
  transform, not the copy), tab/pager direction.
- **Do not mirror:** the wordmark/lockup (brand drawings are fixed), the Open Zone mark, the map (real
  geography), the clock/code numerals (LTR isolate), icons whose meaning is directional physical objects
  (send glyph may mirror, but the tag/zone glyphs do not).
- **Arabic length:** allow +20 % width for labels; buttons wrap to 2 lines and grow `heightIn`, never clip
  (remove fixed heights). Display lines may wrap to 2 lines; never reduce font size below `display.s`
  equivalent to fit.
- **Tracking:** 0 for Arabic; `state` and `data` in Latin keep their tracking.
- **Bidi:** never interpolate Latin tokens (codes, timers, "Android 8+") into Arabic sentences without an
  isolate; prefer separate `Text` composables in the same row.
- **Fonts:** bundled Arabic face if added; otherwise system Arabic sans (not Naskh for UI? — Naskh is the
  Android default and reads well; a squared sans is preferred for the sport temperament but Naskh is
  acceptable until the optional face lands). Never render Arabic in the Latin display face.

---

## 10. Accessibility tokens

- Contrast floors in §3.2; re-check every new pair.
- Touch targets ≥48 dp; inline actions ≥48 dp hit height; no control smaller than 48 × 48.
- Text scaling 1:1 for body/labels/data; display half-rate capped (§2); layouts must reflow, never clip.
  At 200 % font scale: Board stacks (state line wraps, clock 44 sp min), buttons grow, TeamSheet becomes
  one column, Board meta hides the zone line, chat composer grows.
- Semantics: Board announces "Live. 41 minutes 12 seconds left. Zone 240 metres. 2 of 3 prey remain." as
  one grouped node (or clock as its own live region `polite`); clock is not announced every second (use
  `liveRegion = None` and update semantics on minute boundaries or on demand). Map keeps a text alternative
  listing prey status (existing audit UI-03) and never includes hidden prey.
- Focus: visible 2 dp cyan ring + 2 dp offset on every interactive element; keyboard navigation order
  follows visual order; hover state on pointer devices = 6 % chalk overlay + ring.
- Motion: `Settings.Global.ANIMATOR_DURATION_SCALE == 0` → static; also respect Compose
  `LocalInspectionMode`; no essential info carried only by motion.
- Errors: `liveRegion = Assertive` on the error strip; success/ready changes are `Polite`.
- The Board clock must be readable at 1.5 m in daylight: chalk on board 15.9:1, 44 sp display; never tint
  the clock cyan on dark (cyan is reserved for live dot + focus; the clock is chalk).

---

## 11. Compose mapping (suggested files)

```
ui/theme/Tokens.kt          // space, radius, border, sizes, motion, breakpoints as objects/consts
ui/theme/Type.kt            // FontFamilies, ManHuntType styles, Arabic variants, scaledBy(fontScale, displayHalfRate)
ui/theme/Theme.kt           // color schemes (existing values + roles), Shapes (plate=2, tagCut), ManHuntTheme(fontScale)
ui/theme/Motion.kt          // durations/easings (existing file extended; keep names, adjust values)
ui/components/MatchBoard.kt // Board + Masthead variants
ui/components/ChalkRule.kt
ui/components/BoardButton.kt
ui/components/TeamTag.kt    // + StateTag, CodePlate, TeamSheet, RosterRow
ui/components/FieldMarks.kt // ImageVector set
ui/components/MatchSheet.kt // sheet/dialog scaffold, scrim, insets
ui/components/States.kt     // EmptyState, ErrorStrip, LoadingRule (new signatures; keep old composables working)
```

`ManHuntTheme` must keep its current signature (`darkTheme`, `fontScale`, `content`) and existing colour
scheme values (they are already correct); the redesign adds roles, not new brand colours. Existing
composables (`ScreenCard`, `PrimaryButton`, etc.) may remain for compile compatibility but redesigned
screens must not use them (see direction.md §5). Existing `Surface`/`Card` elevations must be forced to 0.

---

## 12. Banned list (review will reject)

- Hex colours, corner radii, font sizes, durations or easing curves written inside a screen file.
- 16/20/28 dp rounded cards, nested cards, cards for prose, cards with tinted icon tiles.
- Gradients (including `Brush.linearGradient` hero), glows, shadows, blur, glass, 3D, scanline cosplay.
- ALL-CAPS headings, eyebrow labels or button labels (uppercase is reserved for state words, mono data labels and codes); "01/02/03" decoration; mono for prose.
- Pill buttons/chips (`RoundedCornerShape(999.dp)`) except platform-circular icon buttons.
- Cyan as generic accent/link/icon tint; team colours for errors or decoration; colour as the only team cue.
- Material outlined icons as feature glyphs; the paw; the crosshair as a brand glyph.
- Fake clocks ("--:--"), fake numbers ("1,248 hunters"), fake urgency, marketing headers inside the app.
- Fixed heights on anything that contains text (use `heightIn`).
- Animations that do not map to a game event; springs/overshoot; per-element entrance staggering.
- `AlertDialog` for the match result; `TabRow` icon-only navigation; drop shadows as hierarchy.
