# 12 — Adaptation: RTL/Arabic, light/dark, form factors, text scale, accessibility

**Scope:** how the redesign behaves in every configuration the app supports (minSdk 26, target 37) and how
the implementation is verified without a device. This is a required pass, not a later cleanup: the current app
fails several of these today (documented in `docs/UI_AUDIT.md`; mapped in §7).

---

## 1. RTL and Arabic

### 1.1 Language and mirroring

| Aspect | Rule |
|---|---|
| Direction | `LocalLayoutDirection = Rtl` when language is Arabic (existing `AppRoot` wiring — keep). |
| Layout | Use `start`/`end` padding and alignment; never `left`/`right`. `CutCornerShape(topEnd = …)` mirrors. |
| Screen transitions | `slide/wipe` direction mirrors with layout direction (existing RTL check in `AppRoot` can be reused). Predictive back preview mirrors. |
| Icons | AutoMirrored: `back`, `send`, `expand`, `chevron`, `logout`. **Do not mirror:** wordmark, Open Zone mark, map, clock/code digits, physical team glyphs (prey dot/ring, hunter chevrons), tag/zone glyphs. |
| Wordmark/lockup | Never mirrored (it is the drawn brand drawing); its *placement* mirrors (lockup at start = right). |
| Map | Never mirrored — real geography. UI around it mirrors. |
| Board | Rows mirror: state at start (right), data at end (left); clock is start-aligned; no centred clock. |
| Team sheets | Column order mirrors (Prey on the right in RTL); rows mirror; team names Arabic. |
| Chat | Log mirrors: time gutter at start (right); own messages at end (left); sender names right; send glyph mirrored. |
| Dock/sheets | Actions mirror; primary still bottom; destructive unchanged side. `×` goes to the start? — keep sheet close at end of the title row as in LTR mirrored. |
| Progress/sliders | Text size slider mirrors direction; value label `data` stays LTR. |
| Numbers | Western digits, LTR. Clock/code/timers wrapped in LTR isolates (`CompositionLocalProvider(LocalLayoutDirection provides Ltr)` or `Text(textDirection = Ltr)`). |
| Punctuation | Avoid `·` and spaced em dashes in Arabic strings (bidi reordering). Use full stops/new lines. Keep Latin tokens isolated (ManHunt, APK, Android, version, URLs). |
| Dates/times | Locale-aware; digits LTR; no mirrored time. |
| Test strings | Test every screen with `LocalStrings = arabicStrings()` + `Rtl` at 360 dp and 1.5× text; check for clipped Arabic ascenders/descenders and mixed-direction codes. |

### 1.2 Arabic typography

- **Face:** system Arabic (Noto Naskh Arabic) this sprint; optional bundled **IBM Plex Sans Arabic** (OFL) in
  Phase 4 if APK budget allows and the owner approves. Never render Arabic in Big Shoulders Display.
- **Sizes:** use the Arabic scale in `tokens.md` §2.3: display +8–15 % leading, body +2 sp line height, labels
  +4 sp leading, no tracking. Display line may wrap to 2 lines; never shrink below the Arabic `display.s`
  equivalent to force one line.
- **Mixed strings:** a line like `LIVE · 41:12` is not localised as one string. Render state and clock as
  separate `Text`s in a Row with LTR isolation for the clock; no bidi reordering.
- **Length:** budget +20–30 % width for Arabic labels; buttons/rows must wrap or grow (`heightIn`), not clip.
  Test the longest strings: accept button, team status, claim dialog title, settings explanations, safety
  paragraphs.
- **Copy authority:** reuse the approved MSA strings in `Localization.kt` verbatim (safety paragraphs, role
  names, result, updates, connection). New English copy → copy owner first; do not machine-translate in this
  sprint. Never mix MSA and Egyptian in one screen.
- **Fonts fallback:** if a glyph is missing from the bundled font, fall back to the system Arabic face; never
  tofu. `FontFamily` fallback chain in `Type.kt`.

---

## 2. Light theme: "daylight chalk"

| Token/role | Dark | Light |
|---|---|---|
| Background | `#0B1220` | `#F7F9FC` |
| Primary type | `#E6EDF7` | `#0F172A` |
| Secondary type | `#A7B6CC` | `#475569` |
| Plate | `#131C2E` | `#FFFFFF` |
| Plate raised | `#1D2840` | `#E6ECF5` |
| Hairline | `#2A3550` | `#D3DCE8` |
| Interactive border | `#5E7198` | `#7C8CA3` |
| Cyan (field/referee) | `#22D3EE` | `#0C6B84` |
| Prey | `#FF7A59` | `#B33A0F` |
| Hunters | `#A79BFF` | `#5B21B6` |
| Error | `#FF8A8A` | `#B91C1C` |
| **Board** | `#131C2E` ink board | **`#0B1220` ink board** — always dark |
| Map (Live Hunt / Result) | Deep Teal night map | **same Deep Teal night map** |

Rules:
1. The **Board and the map stay night-ink in light theme** — a scoreboard and a field at night do not change
   colour with the phone theme, and this keeps the live game's identity constant. Surrounding chrome (dock,
   sheets, page) is light. This is deliberate; do not "fix" it in review.
2. The drawn `FieldPlate` has a light translation: chalk ground, ink block outlines, same cyan zone, same
   coral/violet dots; no gradient/cream; never use the dark plate on a light page.
3. Status/navigation bar icons follow the in-app theme (existing `Theme.kt` SideEffect — keep; fix audit UI-18
   for splash/background).
4. No white flash: `windowBackground` = field colour per theme; `values-night` or runtime theme both supported
   (app theme is user-to-toggleable; the splash must match the stored theme, not the system, as closely as the
   platform allows — document the one-frame limitation if any).
5. Light theme is not a second identity: same components, same type, same rules; no soft shadows, no cards.
6. Contrast floors hold in both themes (tokens §3.1); team colours in light are darker tokens and pills/tints
   re-checked (light coral `#B33A0F` on 12 % tint ≥4.5? — verify with the implementation; if not, use the solid
   token for text and the tint only as fill).

---

## 3. Window size classes and layouts

Breakpoints: **compact < 600 dp**, **medium 600–839 dp**, **expanded ≥ 840 dp**; landscape phones act as
medium for layout but keep bottom docks; desktop ≥ 1200 dp same as expanded with a 960 dp content cap.

| Screen | Compact | Medium | Expanded |
|---|---|---|---|
| Auth | one column, plate 160–240 | reading column 560 centred, plate 16:9 | two columns: plate 40 %, form 60 % (max 560); start-aligned |
| Safety/Roles | one column | 560 column | 560 column + plate beside on Roles at ≥ 960 |
| Home | one column | 560 column, plate full width | two columns: left plate+line (45 %), right host+join (55 %, max 480) |
| Lobby | one column, team sheets 2-up when width allows | 560 column, team sheets 2-up | two-pane: teams/code left (max 560), summary/host controls right (360) |
| Live hunt | full-bleed map, Board, dock, bottom sheet | map fills, sheet max 480 wide centred? — bottom sheet max 560 centred | map fills; **right-side persistent sheet/panel 360 dp** instead of bottom sheet; Board full width |
| Chat | full width | message column max 640 centred | max 640 centred, composer same |
| Result | single column, dock | 560 centred | trail plate 960 wide, winner/score column 560 |
| Settings | one scroll | one scroll 560 | 240 rail + 560 content |
| Sheets/dialogs | bottom sheet | bottom sheet max 560 | bottom sheet max 560 or centred dialog-like sheet, still full-width feel |

Other rules:
- **No bottom navigation exists** in the app and the redesign does not add one; no `NavigationSuiteScaffold`
  requirement. Do not introduce a nav bar just to satisfy a checklist.
- **Reading width:** body text never exceeds 68 characters; content columns capped as above; rules can extend
  to the full board width but text does not.
- **Primary action cap:** on wide screens the primary button is bounded (≤560 dp) and start-aligned in its
  column; never a 1200 dp full-width bar.
- **Insets:** safe-drawing at root; navigation bars at docks/sheets; IME on composer/dialog fields; display
  cutout respected in landscape (no content behind it).
- **Orientation:** rotation preserves route, scroll, dialogs, match state and map camera. No
  `android:configChanges`/`screenOrientation` locks (existing lock is absent; keep it that way).
- **Foldables/tabletop:** top pane = Board + map/field; bottom pane = dock/sheet; never split a plate/row across
  the hinge; state preserved on fold/unfold. `WindowInsets` obeyed; test with a foldable preview.
- **Desktop/pointer:** hover = 6 % chalk overlay, focus = 2 dp cyan ring; mouse wheel scroll; keyboard: Enter
  submits the focused primary, Escape closes a sheet, Tab order = visual order; tooltips only where an icon
  has no label (rare; the redesign mostly uses labels).
- **TV/Auto/XR:** out of scope for this app (phone-first game with map and GPS); documented as not designed,
  not silently broken. Do not add TV/Auto surfaces in this sprint.

---

## 4. Text scale and small screens

- Body/labels/data scale 1:1 with the app `fontScale`; display/Board scale at half rate capped 1.25×
  (`tokens.md` §2.7). `ManHuntTheme(fontScale)` keeps the existing entry point.
- 1.0×: the designs in `screens/` are the reference.
- 1.35×: Board stacks its gutter under the clock; team sheets remain 2-up only if names fit; dock grows; code
  cells grow to 56 h.
- 1.5×: team sheets may collapse to one column (RTL especially); Board state/gutter wrap; chat composer grows;
  display lines limited to 2 lines.
- 2.0×: every fixed height is `heightIn`; buttons may be two lines; the Board becomes two rows (state/data,
  then clock), the gutter moves under the clock; sheet titles wrap and grow; no ellipsis on trust copy.
- 320 dp width: 16 dp margins may reduce to 12 only if needed; code cells 40 dp visual with 48 dp hit area;
  buttons full width; team columns stack.
- Nothing clips, overlaps or hides the primary action at any combination of width {320, 360, 411} × scale
  {1.0, 1.35, 1.5, 2.0}. Test the longest Arabic strings at the same matrix.

---

## 5. Motion/theme/system interactions

- Reduced motion: system animator scale 0 → static; in-app toggle (Phase 4) persists separately; theme/language
  change never triggers an animation storm (no per-element entrances).
- Theme/language change preserves route, scroll and dialogs; dialogs re-render in the new theme/RTL direction
  and keep their content/insets.
- Dark↔light switch does not restart the app or the startup screen; Board/map remain ink.
- System back: one level; from a live hunt opens the leave sheet; from a sheet closes the sheet.
- Notifications (match start/tag) deep-link into the room; cold start shows startup briefly then the room.
- Screen-off/on: no loop restarts; clock jumps to the correct value; map keeps camera.

---

## 6. Screenshot/preview test matrix (JVM, Robolectric/native graphics)

Add previews/tests for every core screen and state; keep the existing `ScreenshotTest`/`GameScreenshotTest`
working and extend:

| Dimension | Values |
|---|---|
| Form factor | phone 411×891 dp (existing), small phone 320×640, foldable 673×841 (or `Devices.FOLDABLE`), tablet 800×1280, desktop 1280×800 |
| Theme | dark, light |
| Language | English LTR, Arabic RTL |
| Text scale | 1.0×, 1.35×, 1.5× (display half-rate verified) |
| Motion | normal τ=0 frame, reduced motion (static) |
| States | idle, busy, error, empty, permission strip, offline strip |
| Screens | Auth, Safety, Roles, Home, Lobby, Live Hunt (hunter + prey), Chat, Result, History, Settings, each dialog |

- Capture the τ=0 frame for animated components (`LocalInspectionMode`) so screenshots are deterministic.
- Use seeded, believable data in test fixtures (no "CI Room", no "alice74354"); the screenshot tests are part
  of the deliverable quality now (see `screenshot-shotlist.md` §5).
- Verify dimensions and inspect each image; a screenshot test that renders an empty map/blank state is a
  failure, not a pass.

---

## 7. Accessibility fixes mapped to the existing audit

The redesign must close these known issues (from `docs/UI_AUDIT.md`; IDs kept for traceability):

| ID | Old problem | Redesign fix |
|---|---|---|
| UI-01 | Chat composer measured at 0 dp | New Chat layout uses a `weight(1f)` log + fixed-height composer inside a Column; test at 320 dp + IME. |
| UI-02 | Light-theme team colours fail AA | Light team tokens are darker (`#B33A0F`, `#5B21B6`) from the existing theme; team tints re-checked; team cues are never colour-only. |
| UI-03 | Map has no semantics/text alternative | Map gets a full text alternative (own team/position, zone/shrink, prey report ages, never hidden prey); see 06 §6. |
| UI-04 | Dialogs bypass insets | All sheets/dialogs are new composables with explicit `safeDrawing`/IME insets; no `AlertDialog`. |
| UI-05 | IME inset not delivered on API 26–29 | Manifest `windowSoftInputMode="adjustResize"` + `imePadding` on composer/dialog fields. |
| UI-06 | Rotation loses route/dialogs | Keep the existing `rememberSaveable` route work; sheet/dialog open state must be saveable where behaviour allows; test rotation in room. |
| UI-07 | Whole-screen recomposition | Board clock reads its own state; chat draft local; map chrome isolated; keep the perf teammate's work. |
| UI-08 | Stale/flagged/eliminated prey look identical | New marker shapes: fresh = solid + ring + ping; stale = 45 % + dashed ring; eliminated = 30 % + cross tick; sheet text states all three. |
| UI-09 | Fixed-height buttons clip at 200 % | Every text container uses `heightIn`, no fixed heights. |
| UI-10 | Room header crowding at 320 dp / 200 % | New room toolbar has only back/share/history; room name is in the Board with ellipsis; no code chip. |
| UI-11 | Back exits the app from a room | `BackHandler` in Room → leave/back sheet; one level. |
| UI-12 | Fixed 320 dp map in landscape | Map fills remaining height; no fixed map height. |
| UI-13 | Unbounded tag-picker list | Target list is scrollable, max height, ≤8 visible, empty state. |
| UI-14 | Switches without accessible label | New toggle rows merge label+description+state; one semantics node. |
| UI-15 | Errors not announced | `ErrorStrip`/strips use `liveRegion = Assertive`; ready/reconnect `Polite`. |
| UI-16 | Loader talks over the UI | `LoadingRule` has no generic contentDescription; the sentence names the action; the button keeps its label. |
| UI-17 | Phase ticker never stops | Clock composable stops when not RESUMED or when the phase is not timed; paused freezes it. |
| UI-18 | Light-only platform theme → flash | `windowBackground` per theme + in-app theme bar icons (existing SideEffect kept and extended). |
| UI-19 | Lazy lists without keys | New lobby/history/chat lists use stable keys. |
| UI-20 | One-tap destructive Leave | Leave opens a `MatchSheet` with consequence. |
| UI-21 | Dialog height cap assumes inset window | Sheets are inset-aware and scroll; no hard 460 dp cap. |
| UI-22 | Hidden banners still consume spacing | Conditional composables (no zero-height animated banners) in new layouts. |
| UI-23 | `animateContentSize` on cards | No `animateContentSize` on list items/cards; sheets animate height only. |
| UI-24 | Screen transition ignores direction/clipping | New wipe transition is layout-direction aware and clipped to the safe area; one transition at root. |

Additional requirements: 48 dp targets; `contentDescription` on all icon-only actions; heading semantics on
screen/section titles; TalkBack announces Board as one node; no focus traps; support 200 % font scale; colour
never the only cue.

---

## 8. Verification without a device (implementation team)

1. `@Preview` sets for each screen: Phone/Foldable/Tablet/Desktop × dark/light × en/ar × fontScale 1.0/1.5 ×
   reduced motion; capture via Robolectric screenshot tests into `build/screenshots/`.
2. Inspect every rendered PNG (do not trust a green test); reject blank maps, clipped text, tofu glyphs,
   missing attribution.
3. `grep` checks before handoff: no `AlertDialog(` outside legacy code, no `linearGradient`/`radialGradient`,
   no `RoundedCornerShape(1[6-9].dp|2[0-9].dp|999)`, no `FilterChip`, no `IconButton` with a Material feature
   icon in redesigned screens, no `animateContentSize` in list items, no hard-coded hex in screens.
4. TalkBack pass with the accessibility scanner on the emulator for Auth/Home/Lobby/Hunt/Result (at least).
5. Manual rotation, font-scale and language toggles on the emulator; screenshot before/after for the Lead.

---

## 9. Adaptation acceptance checklist

1. Arabic RTL verified on every core screen at 360 dp, 1.5×: no clipped glyphs, no bidi-mixed clock/codes, no
   mirrored wordmark/map/numerals.
2. Light theme verified on every core screen: ink Board, night map, no white flash, contrast floors met.
3. Phone 320 dp and tablet 800 dp verified; no fixed-height clipping; dock reachable; primary action visible.
4. Fold/unfold + rotation preserve state; no configChanges hacks; dialogs survive rotation.
5. 200 % font scale: nothing clipped; Board/sheet/dock reflow; longest Arabic strings tested.
6. All audit fixes in §7 implemented or explicitly deferred with a note to the Lead.
7. Screenshot matrix captured and inspected; the premium set is regenerable (`screenshot-shotlist.md`).
8. No TV/Auto/XR promise; no unsupported form factor implied anywhere.
