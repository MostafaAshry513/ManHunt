# 01 — App shell, the Board and shared components

**Spec scope:** the frame every screen inherits, the `MatchBoard` family (the redesign's signature), and the
shared component library. Screens in `02`–`12` reference this file instead of redefining components.

Read with [`../tokens.md`](../tokens.md) and [`../motion.md`](../motion.md). All measurements in dp; all
colours by token name; no hard-coded values in screen code.

---

## 1. App frame

```
┌───────────────────────────────────────────────┐  ← system status bar (transparent, chalk icons)
│  safeDrawingPadding()                         │
│  ┌─────────────────────────────────────────┐  │
│  │              SCREEN CONTENT             │  │
│  │  screen margins 16 (phone) / 24 (≥600)  │  │
│  │  Board / Masthead is full-bleed         │  │
│  └─────────────────────────────────────────┘  │
│  ← navigation bar inset (chalk/ink icons)     │
└───────────────────────────────────────────────┘
```

- **Root:** one `Surface` at `field`, `Modifier.fillMaxSize().safeDrawingPadding()` (keep the existing
  `AppRoot.kt` approach — it is already correct for screens).
- **System bars:** transparent, `isAppearanceLight*Bars` follows the in-app theme (not the system), status-bar
  clock/battery are not hidden. The Board/Masthead sits *inside* the safe area, below the status bar; the map
  in Live Hunt is the only element that can extend behind the status bar? **No** — the map starts below the
  Board; it may draw behind the Board's translucent rule? No: keep the map inset below the Board to avoid
  gesture/inset bugs. Edge-to-edge is used for the background colour, not for overlapping content.
- **Screen margins:** 16 dp start/end on phones; text and actions within these margins. Full-bleed elements:
  the Board/Masthead, the map (Hunt), the bottom dock background, the ScorePage's top board, chalk rules that
  are intentionally edge-to-edge (only inside a screen's own section, never the global margin rule).
- **Dialogs and sheets are separate windows:** every `MatchSheet` must apply `WindowInsets.safeDrawing` +
  `WindowInsets.ime` inside its own window (`windowInsetsPadding`), because `material3 AlertDialog` does not
  (known audit finding UI-04). Prefer `ModalBottomSheet` with custom container, or a `Dialog` +
  `Surface(shape = plateTop)` + insets.
- **IME:** chat composer and any text field must pad with `WindowInsets.ime`; `windowSoftInputMode="adjustResize"`
  must be set in the manifest for API 26–29 (audit UI-05).
- **Backgrounds:** no gradients anywhere. The field is flat `field`; plates are flat `plate`; the only texture
  is the drawn `FieldPlate` chalk specks ≤4 % inside its canvas.
- **Back:** system back / predictive back returns one level (Room → Home is already handled later; add the
  missing `BackHandler` for Room per audit UI-11). Back from a dialog dismisses the dialog (not the screen).
  In RTL, the predictive-back preview slides the other way (layout-direction aware).

---

## 2. The `MatchBoard`

The signature component. Four variants share geometry, type, rules and state tag; the data and action slots
change. It is **full-bleed**, always at the top of its screen, and never appears twice.

```
v1 MASTHEAD (Home)                          v2 LOBBY
┌───────────────────────────────────┐       ┌───────────────────────────────────┐
│ ◉ MANHUNT              21:04  [⚙] │       │ LOBBY · RIVERSIDE RUN      CODE   │
│ ───────────────────────────────── │       │                           K7M2QX  │
└───────────────────────────────────┘       │ ───────────────────────────────── │
                                            │ 2 PREY · 3 HUNTERS · 2/5 READY    │
v3 LIVE (Hunt)                              └───────────────────────────────────┘
┌───────────────────────────────────┐
│ ● LIVE                  ZONE 240 m│        v4 FULL TIME (Result)
│ 41:12                   PREY 2 / 2│       ┌───────────────────────────────────┐
│ ───────────────────────────────── │       │ ■ FULL TIME              PREY 0/3 │
└───────────────────────────────────┘       │ 41:12                     HUNTERS  │
                                            │ ───────────────────────────────── │
                                            │ HUNTERS WIN                       │
                                            └───────────────────────────────────┘
```

### 2.1 Geometry

| Property | Value |
|---|---|
| Width | full-bleed, no side margin |
| Height | content-driven: 84 dp typical (top rule 1 + padding 10 + row1 16 + gap 6 + clock row 44 + padding 8 + bottom rule 1) |
| Inner padding | start/end 16, top 10, bottom 8 |
| Top / bottom rule | 1 dp `chalk` @ 20 % (dark) / `hairline` (light); the top rule is the only rule touching the status-bar boundary |
| Fill | dark: `board` (#131C2E); light: `field` (#0B1220) — always an ink board |
| State text | `state` (mono 11, +0.10 em, uppercase); live variant prepends a 6 dp cyan dot (static) |
| Clock | `board.clock` (Big Shoulders 44/44, 56/56 when width ≥400 dp), chalk, tabular, LTR, always `MM:SS` or `H:MM` |
| Right gutter | 1–2 data pairs, `data` 12/16 + numbers in `board.meta` 16/20; right aligned, start-aligned in RTL mirror |
| Tone | no rounded corners, no shadow, no gradient, no tint; the board is a *surface of record* |

### 2.2 Variants and data contract

| Variant | Where | Left slot | Clock slot | Right gutter | Interaction |
|---|---|---|---|---|---|
| `Masthead` | Home (always) | horizontal lockup (mark + wordmark) at 20 dp cap height | device local time (no label) in `data` | settings `FieldMark` as a 48 dp icon button | settings opens Settings; lockup not tappable |
| `Lobby` | Lobby | state `LOBBY` + room name in `title` 17 (one line, ellipsis) + a `data` invite-code line | — (show `NOT STARTED` in `data` if the hunt hasn't begun, never `--:--`) | `PREY n · HUNTERS n · n/n READY` in `data`; ready progress as 5 × 6 dp chalk segments (filled = ready) | room name tappable to copy code? No: code copy/share is in the `CodePlate` below |
| `Live` | Hunt | state `LIVE`, `HEAD START`, `PAUSED` + a small second line `data` (e.g. "Prey are hiding" / "Clock stopped") | countdown, ticking at second boundaries; frozen on pause; on Prey side the clock is the same | zone radius `ZONE 240 m`; `PREY 2 / 2` (Hunters only; Prey sees `2 PREY LEFT`? — **Prey sees only their own status** + zone + clock; never prey count other than their own alive state) | none (the Board is not a control; tapping it does nothing) |
| `FullTime` | Result | state `FULL TIME` + winner word in `headline` below | frozen final clock | score `PREY 0 / 2` + winner team tag | none |

**Data honesty:** never show `--:--`, a fake clock, a player count the server doesn't have, or a countdown
before the hunt starts. When data is unknown, omit the slot rather than fill it.

### 2.3 States

- **Loading (Lobby join):** state `LIVE`? No — show `JOINING` state word + a 1 dp `LoadingRule` in the clock
  slot, no numbers; content below uses its skeleton (see `11-states.md`).
- **Offline:** Board keeps the last-known values; a 1 dp `error` rule under the bottom rule + `data` line
  "Last update 12 s ago · Reconnecting…" (see states spec). Never blank the clock.
- **Paused:** state `PAUSED`, clock frozen, a `data` line "Clock stopped" instead of the tick rule.
- **Reduced motion:** no ticking rule animation; digits still update at second boundaries.
- **RTL:** mirror: state word at start (right), gutter at end (left), the clock stays LTR as one unit in the
  centre of its row? Layout: in RTL the board rows become state right, gutter left, clock still start-aligned
  to the right edge? Choose: clock is start-aligned in both directions (right in RTL), and the gutter sits at
  the opposite end. Do not centre the clock.
- **Light:** fill `#0B1220` (ink board) on a chalk ground, top/bottom rules `#E6EDF7` @ 18 %; the board is
  the one dark object on the light screen. This is intentional and must not be "fixed".
- **Font scale 2×:** Board grows: state + data wrap to two lines, clock stays 44 sp (display half-rate), gutter
  data moves under the clock (single column) rather than clipping.

### 2.4 Compose notes

- `MatchBoard(variant: BoardVariant, state: String, clock: String?, zone: String?, score: String?, roomName:
  String?, code: String?, ready: Int, total: Int, localTime: String?, onOpenSettings: (() -> Unit)?, modifier)`
  — one composable, variant enum, `Modifier.fillMaxWidth().background(...)`. No `Card`, no `Surface` elevation.
- Clock composable `BoardClock(targetEpochMs, offsetMs, running: Boolean)` derived from the existing
  `CountdownText` (sleep to next second boundary; never per-frame). It reads only its own state so the Board
  doesn't recompose the screen each second.
- Semantics: group the Board as one node with a spoken description updated at minute boundaries:
  `stateDescription = "Live. 41 minutes left. Zone 240 metres. 2 of 3 prey remain."`; the visible clock text
  has `liveRegion = None` to avoid per-second TalkBack chatter. The state word itself is a heading for the
  screen (`heading()`).
- `testTag`: `board`, `board_clock`, `board_state`, `board_zone`, `board_score`, `masthead_settings`.

---

## 3. Screen header pattern (non-Board screens)

Auth, Safety/Roles, Chat, Settings and sheets use a **rule-led header**, not a Material top app bar:

```
[←]  THE HUNT                                [share] [history]
────────────────────────────────────────────────────────────
```

| Slot | Spec |
|---|---|
| Back | 48 dp icon button, `back` FieldMark (AutoMirrored), chalk; hidden when the screen is a root (Home, Auth) |
| Title | `headline` 22/28 Bold UI, sentence case, one line ellipsis; max 2 lines when needed |
| Subtitle (optional) | `body.small` muted, one line |
| Actions | 48 dp icon buttons (share/history/settings); max 2, otherwise overflow into a sheet |
| Rule | 1 dp `hairline` 16 dp below the title row; no gradient, no elevation, no scroll behaviour on the header (it is fixed; only content scrolls) |
| Background | `field` (transparent), so the page scrolls under a clean edge; no blur |

The Chat and Settings headers use the same pattern; Settings title "Settings" with no back on tablets in a
two-pane layout (the rail acts as navigation).

---

## 4. `BottomDock` (primary action)

The one primary action lives in the thumb zone, never at the bottom of a scroll.

```
┌───────────────────────────────────────────────┐
│  Waiting on 1 player            [ READY UP ]  │  ← optional status line 13 sp muted
│  ┌─────────────────────────────────────────┐  │
│  │            Begin the hunt               │  │  ← 56 dp primary BoardButton, full width
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

| Property | Value |
|---|---|
| Container | full-bleed `field` fill; 1 dp `hairline` top rule; padding 12 top / 12 bottom + `navigationBars` inset |
| Primary | `BoardButton` primary, height 56, full content width, inside 16 dp side margins |
| Secondary | optional 40 dp inline action above the primary (e.g. "Stand down", "Hunt rules") in `muted`/chalk |
| Status line | `body.small`, `muted`; explains a disabled primary ("Waiting on 1 player", "Pick a side to ready up") |
| Disabled primary | 38 % label on 12 % fill; not grey-only — the reason is always present |
| Busy | label swaps to `MANHUNT`-style 3-tick `LoadingRule` + action name ("Starting…"), stays 56 dp |
| Haptics | confirm on press for ready/begin/tag |
| RTL | mirrored start/end; text right-aligned |

Screens with a dock: Home (Host action is in the plate, not a dock — Home's main action is a full-width
button directly under the name field, still in the lower half), Lobby, Live Hunt, ScorePage.

---

## 5. Shared components

### 5.1 `ChalkRule` — the replacement for a card

```
────────────────────────────────────────────
│ │ SECTION LABEL? — no. Caption 12 sp muted, sentence case
```

| Property | Value |
|---|---|
| Line | 1 dp `hairline`, full content width (inside margins); optional 3 × 3 dp survey ticks at the start, 2 dp above the line |
| Optional end label | `data` 11–12 sp muted, end-aligned (e.g. "2 of 3 ready") |
| Spacing | 12 dp above label / 16–24 dp below line depending on section |
| Use | section separation, list group edges, sheet section heads, "how it works" footer; never inside a plate |
| Do not | use as a button, use rounded ends, use 2 dp (reserve 2 dp for selected/focus) |

### 5.2 `BoardButton`

| Variant | Fill | Border | Label | Height | Use |
|---|---|---|---:|---:|---|
| primary | `cyan` | none | `onCyan` `label` 13 Bold, sentence case | 56 | one per screen: Sign in, Create hunt, Join hunt, Ready, Begin, Tag, Back to lobby |
| secondary | transparent | 1 dp `hairlineStrong` | `chalk` `label` | 48 | Cancel, Hunt rules, View history, Stand down |
| destructive | transparent | 1 dp `error` | `error` `label` | 48 | End hunt, Leave hunt, Sign out (confirm in title) |
| inline | none | 1 dp underline on press | `chalk` `label` | 48 hit | tertiary actions, "Change server", "Try again" |
| disabled | 12 % fill / 38 % label (primary) or 38 % label/border (secondary) | — | same | — | always accompanied by a reason line |

- Pressed: 4 % chalk overlay on the whole button, 120 ms; no ripple (or ripple colour chalk 8 %).
- Focus (keyboard/desktop): 2 dp cyan ring + 2 dp offset.
- Buttons never contain feature glyphs except a single 20 dp FieldMark when it clarifies (Tag: `tag` glyph;
  Send: `send` glyph). Never an icon tile, never two icons.
- Loading: label remains, a 3-tick rule appears before the label; button cannot be tapped twice.

### 5.3 `CodePlate` (invite code entry / display)

```
 INVITE CODE                                    [paste]
 ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐
 │ K  │ │ 7  │ │ M  │ │ 2  │ │ Q  │ │ X  │   ← 48×56 cells, mono 20 sp, caret cyan
 └────┘ └────┘ └────┘ └────┘ └────┘ └────┘
 6 characters. Ask the host for the code.
```

- Entry mode: taps focus a hidden single `BasicTextField` (6 chars, uppercase, filter `InputRules.inviteCode`),
  cells render the value; paste fills all; the 6th character auto-submits **Join** (existing behaviour).
- Display mode (Lobby): cells are static, a `share` 48 dp button and "Copy code" inline action; code is
  `RedHatMono` 20 sp, uppercase, LTR, +0.08 em.
- Error: 1 dp `error` border on the whole plate + "That code doesn't match a hunt. Check the six characters."
  (existing localised error may be reused) — cells do not shake.
- Empty: cells show a 1 dp chalk underscore per cell, not placeholder text.
- Never a generic labelled text field for the code; never a pill.

### 5.4 `TeamTag` / `StateTag` / team rows

| Element | Spec |
|---|---|
| `TeamTag` | 28 dp high, `CutCornerShape(topEnd = 8.dp)`, 12 % team fill, 1 dp team border, 16 dp team FieldMark + name in `label` 13 Bold, padding 6 start / 10 end. Team name is localised ("الفريسة"/"الصيادون" reuse existing keys). |
| `StateTag` | 20 dp, no fill, `CutCornerShape(topEnd = 4.dp)`, 1 dp `hairlineStrong` border, `state` 11 mono tracked uppercase. Live variant: cyan 6 dp dot + cyan text, no border fill. |
| Team row | avatar 32 dp square (2 dp radius, team 1 dp border, initial in `label`), name `title` 17, secondary `data` 11 muted (e.g. "Ready", "Offline", "Tagged"), trailing: `HOST` `data.small` or ready `check` 20 chalk, status tag if eliminated. Row 56 dp, 1 dp hairline between rows. |
| Team colour text | team name and its row border use the team colour; body copy never does. In light theme use the darker team tokens. |

### 5.5 `TeamSheet` (Lobby / Result)

Two columns on ≥360 dp width with 12 dp gap; single column when width < 340 dp or font scale > 1.3 or RTL
names overflow (test both languages). Column header: team glyph 20 + name `title` 17 + count `board.meta` 16
(e.g. "2"); a 2 dp team rule under the header; rows as §5.4, with the current user's row additionally tinted
12 % and marked `YOU` in `data.small`. Empty column: one line "No one yet." `body.small` muted + inline "Join
this side" if the user has not chosen (Lobby only). The Hunters column is violet, Prey coral; column order is
Prey then Hunters in LTR and mirrored visually in RTL (Prey on the right).

### 5.6 `MatchSheet` (all dialogs)

```
        ════════ 24×2 gesture rule (muted 40%) ════════
   TAG YASMIN?                                    [×]
   A tag ends her hunt. She'll confirm it.
   ────────────────────────────────────────────────
   [  They're tagged  ]        ← primary, 56
   [  Not yet  ]               ← secondary, 48
```

- Bottom sheet, full width, `plate`, top corners `shape.plate` (2 dp), 1 dp top `hairline`, max 60 % height,
  scroll inside if needed, safe-drawing + IME insets.
- Title: the consequence in `headline` 22 ("Tag Yasmin?", "End the hunt for everyone?", "Omar says he tagged
  you."). Never "Are you sure?", "Warning", "Confirm".
- Body: one or two sentences `body.small`; if a number/time matters, include it ("The current result is final.").
- Actions: primary then secondary stacked full-width (56/48) with 12 gap; destructive is `error` outlined;
  cancel is always available via a 48 dp `×` and the scrim/back.
- Scrim: 60 % ink (dark) / 45 % ink (light); tapping outside dismisses only non-destructive sheets; a
  destructive sheet requires an explicit action (no tap-outside dismissal).
- Busy: primary label swaps to action + `LoadingRule`; sheet cannot be dismissed mid-request except by back
  (which cancels where the VM supports it).
- Focus: title is a heading; focus moves into the sheet on open and returns to the trigger on close.

### 5.7 `FieldPlate` (drawn field)

A flat, drawn "borrowed pitch" plate used once on Auth, once on Home first-run/empty, and in the Rules page:

- Canvas with: dark field, faint block-map rectangles (chalk 3–4 %), a cyan zone ring with the 24° gap and
  1 dp gap marks, a coral prey dot + short trail, 2–3 violet hunter dots outside the ring, and a couple of
  report pings. It is the existing `BrandMotionBanner`/`BrandRadar` art, restyled static-first and larger.
- No text or numbers inside the canvas (all copy is Compose text outside it), so it localises and scales.
- Aspect ratios: Auth 4:3 plate (width full, height 200–240 dp); Home 16:9 (180 dp); Rules 3:2 (180 dp).
- Reduced motion: static frame remains complete. Motion is a slow sweep + trail growth (4 s loop) only on
  Auth/Home, and it stops when not RESUMED.
- Never a card with a gradient; the plate sits directly on the field or on a 1 dp hairline top/bottom only.

### 5.8 `FieldMark` icon set

Defined in tokens §6. Implementation notes:
- `ImageVector.Builder`, 24 × 24 viewport, stroke `chalk` via tint; build with `stroke = 2f` when the material
  allows; prefer two-layer vectors (fill for solid dots only). Caps `StrokeCap.Butt`, joins `StrokeJoin.Miter`.
- Team glyphs (`prey`, `hunters`) are tinted by the caller; neutral glyphs inherit `LocalContentColor`.
- Sizes: `FieldMarkSize.Inline(20)`, `Default(24)`, `Status(32)`.
- Accessibility: `contentDescription = null` when a visible label is adjacent; otherwise a localised
  description. Decorative mark/wordmark: `contentDescription = null`.

### 5.9 `EmptyState` / `ErrorStrip` / `LoadingRule`

See [`11-states.md`](11-states.md) for copy and layout. Shell-level rules:

- **EmptyState:** left-aligned, not a centred icon tile. A `ChalkRule` caption ("NO HUNTS YET" is banned —
  use "No hunts yet." as `title` 17), one `body.small` sentence, one inline or secondary action. 24–48 dp
  vertical padding. Optional small `FieldPlate` illustration on Home only.
- **ErrorStrip:** full content width, `plate` fill, 1 dp `error` top rule, `error` glyph 20 + `body.small`
  message + inline "Try again"; 48 dp min height; announced (`liveRegion = Assertive`).
- **LoadingRule:** 2 dp cyan rule, 48 dp wide, indeterminate slide 1.2 s linear (or determinate where
  progress exists); always paired with a `body.small` sentence naming what loads. Never a full-screen spinner,
  never a shimmer skeleton (skeletons are allowed only in list placeholders: 3 chalk 8 % bars, no shimmer).

### 5.10 `FieldLog` (chat message row)

See [`07-chat.md`](07-chat.md); shell contract: no bubble for system lines; team tag/name for chat; mono time
in a 44 dp gutter; own message uses a 2 dp chalk start rule; max width 84 %; no `Card`.

---

## 6. Navigation and transition

- Routes unchanged (`AppRoot.kt`): Safety → Auth → Home → Room; Settings/Roles/Room from Home; deep link to
  Room after accept+session.
- **One** `AnimatedContent` at root with the cut+wipe from motion.md §4. No per-screen enter animations except a
  single 240 ms content entrance where specified.
- Predictive back: keep the existing gesture preview for Settings/Roles; Room needs `BackHandler` (leave
  confirmation if a match is live — see dialogs spec).
- The Board/Masthead does not animate between screens; each screen renders its own variant on entry.
- Deep links: cold start shows startup (0.9 s) then the room; warm start cuts directly, wipe only.

---

## 7. RTL / Arabic / adaptive shell notes

- Use `start`/`end` everywhere, `LocalLayoutDirection`; `CutCornerShape(topEnd = …)` mirrors automatically;
  back/forward/send/expand glyphs are `AutoMirrored`.
- The Masthead lockup is **never mirrored** (Latin brand drawing) but its placement mirrors: in Arabic the
  lockup sits at the start (right) and the clock/settings at the end (left).
- Board: state word at start, data at end, clock start-aligned; no centred values.
- Clock/code/version are LTR isolates; team names and state words are localised.
- Wide windows: Board spans full width; inner content is constrained to the reading column and aligned to the
  start (not centred in the Board). The bottom dock's button is capped at 560 dp and start-aligned in a wide
  dock, so it doesn't become a giant bar on tablets.
- Tabletop/fold: dock and sheets live on the bottom pane; Board+map/field on the top. Do not split a single
  plate across the hinge.
- Desktop: hover/focus states visible; 48 dp targets remain; add keyboard actions for the primary button
  (Enter) and sheets (Escape).

---

## 8. Shell acceptance checklist

1. No screen shows a Material `TopAppBar`, `NavigationBar`, `TabRow` (except the Room Game/Chat pager, which
   is restyled as a two-cell chalk rule), or `AlertDialog` card. 
2. The Board renders with real data only; no `--:--`, no fake clock, no player counts from nowhere.
3. Every dialog/sheet respects safe-drawing and IME insets; no clipped action on API 26–29.
4. Root padding + Board + dock coexist at 320 dp width and 2× text scale without overlap or clipping.
5. The wipe transition is ≤240 ms, mirrors in RTL, and never runs when reduced motion is on.
6. The field is flat; the only gradients in the codebase are gone (grep `linearGradient`, `radialGradient`,
   `Brush.`).
