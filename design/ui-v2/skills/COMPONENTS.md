# COMPONENTS — the element grammar of ManHunt

The system is small on purpose: **a Board, rules, plates, tags, a code plate, map overlays, a field log,
rectangular actions, a dock, match sheets, and one score page.** Everything else is composition. If a page
needs a new element, it must be derivable from this file or the direction's deliberate deviation (recorded in
`NOTES.md`).

Read with `skills/TOKENS.md` (values) and `skills/PAGE_INVENTORY.md` (where each is used).

**Three surface levels only:**
1. **Field** — the ground (`#0B1220` dark / `#F7F9FC` light). Everything sits directly on it.
2. **Plate** — a 2 dp-radius bounded surface used *only where the user acts inside it* (code entry, team
   choice, settings control, sheet). Max ~2 per screen, never nested, never for prose.
3. **Board** — the ink scoreboard strip. Always dark, always ink, one per screen, at the top.

**Grouping is done with 1 px rules + space + alignment — not with cards.** A rule is the default; a plate is an
exception with a job.

**Existing implementation to reuse/learn from** (file path relative to repo root):
`android/app/src/main/java/com/manhunt/app/ui/BoardComponents.kt`, `BoardInputs.kt`, `LobbyBoard.kt`,
`MatchSheet.kt`, `ScorePage.kt`, `HistoryDialog.kt`, `ChatPanel.kt`, `ui/FieldMarks.kt`,
`ui/theme/BoardTokens.kt`, `ui/theme/Theme.kt`, `map/MatchMap.kt`.

---

## 1. The Board (`MatchBoard`) — the signature

**Role:** the phone as match equipment. Answers "what phase, how long, who/how many" in one glance. It is the
one element that must survive every screenshot and make ManHunt recognisable at thumbnail size.

**Anatomy (single column, full-bleed, 1 dp rule top + bottom):**

```
┌──────────────────────────────────────────────────────────────┐ ← 1 dp rule (chalk 20 % on ink)
│ ■ LIVE                         ZONE 240 m                    │ row 1: 16 dp, StateTag + data gutter
│                                PREY 2 / 2                    │        (right-aligned, mono/data)
│  41:12                          played                       │ row 2: clock 44–56 sp Big Shoulders
│                                                              │        tabular; optional note data small
└──────────────────────────────────────────────────────────────┘ ← 1 dp rule
```

**Variants (one per screen, never two):**
| Variant | Where | Content |
|---|---|---|
| `Masthead` | Home (no hunt yet) | drawn Open Zone mark + MANHUNT wordmark (20 dp cap) + device `HH:mm` + settings FieldMark; 1 dp bottom rule; **no fake hunt clock** |
| `Lobby` | Room, `status == "lobby"` | `LOBBY` StateTag (outline, not live) + room name title + `n / m READY` + room code (cyan data, tappable to copy) + readiness tick row; no clock until the hunt starts |
| `Live` | hunt, `head_start`/`hunting`/`paused` | state word + clock `MM:SS` + zone + `PREY n / n` (hunters only); live dot only when `LIVE` |
| `Full time` | result | `FULL TIME` / `CANCELLED` + played duration `m:ss` + `played` note + `PREY 0 / 2` + winner team label; no live dot |

**State rules:**
- `LIVE` = cyan dot + cyan state word; `PAUSED` = muted state + frozen clock (must be unmistakable); `HEAD START`
  = state word + hunting countdown; `FULL TIME`/`CANCELLED` = muted outline StateTag, no live dot.
- Clock is **tabular**, LTR, `MM:SS` for countdowns, `H:MM`/`m:ss` for played durations. Never `--:--`.
  If a clock does not exist yet, show data "Not started" or omit the row — a fake clock is banned.
- Only four data slots max: state, clock, one team/score datum, one zone datum. Everything else goes to a
  sheet or dossier.
- One Board per screen. Never use it as decoration; never stack two.
- RTL: board mirrors (state on the reading-start side, gutter on the reading-end side); the clock stays a single
  LTR unit; the code is LTR.

**Sizing:** content-driven height ≥84 dp (16 dp padding H, 10 dp V, state row 16 dp, clock 44 sp + 2 dp rule).
Hero clock 56 sp only when width ≥400 dp. Never fixed height when text scales.

**Type:** `board.clock` Big Shoulders 44–56/44–56 Bold, tracking −0.01 em; `board.meta` Big Shoulders 16/20
tabular; state = mono 11/14 +0.10 em uppercase (Arabic: UI face, no tracking); data gutter = mono 12/16.

**Compose notes:** `Column` + `Row` + `Spacer(weight)`, background `BoardTheme.board()`, 1 dp `Box` rules,
safe-drawing inset at root; the Board sits inside the safe area (not under the status bar) per shipped
`MatchBoard`/`AppRoot`. Clock text recomposes alone (`CountdownText` pattern) — never put the tick in screen scope.

---

## 2. Clock & countdown

- **Formats:** hunt countdown `MM:SS`; durations under an hour `m:ss` (`18:48`); durations over an hour `H:MM`.
  Invite code never in the clock slot.
- **Behavior:** wall-clock from the server offset (`MatchDto.now`), not from local phase time; tick once per
  second, isolated to one text node; no easing on digits (`motion.clock = 1000 ms linear`); hard-cut digits.
- **States:** running (live); frozen (paused/full time — keep the last value authoritative); unknown (do not
  render a placeholder); offline (keep counting from last offset, mark stale with data text if updates are old).
- **Semantics:** board is a grouped node that reads "Live. 41 minutes 12 seconds left. Zone 240 metres. 2 of 3
  prey remain." The clock itself is not a live region per second; update on minute boundaries or on demand.
- **Do not:** tint the clock cyan on dark (cyan is live dot/focus only); centre it; use a countdown ring as the
  primary readout; animate a flip/odometer; put secondary data inside the digits.

---

## 3. Rules & plates (`ChalkRule`, plate)

**ChalkRule** — the grouping device that replaces cards:
- 1 dp `hairline`, optional three 3×3 dp survey ticks at the start, optional sentence-case label (body.small)
  and optional data caption at the end; 20 dp vertical padding; full width inside margins.
- Variants: plain rule; labelled rule ("The teams"); rule with data caption ("5 / 5"); rule as section break.
- Never full-bleed under the Board (that's the Board's rule), never more than one label per rule, no ALL-CAPS.
- Compose: `Row` + ticks `Row(3 × Box(1×3 dp))` + `Box(weight(1f).height(1.dp))` + `Text`; `BoardTheme.hairline()`.

**Plate** — a bounded interactive surface:
- 2 dp radius, 1 dp `hairlineStrong` (≥3:1) border, surface fill, 12–16 dp inner padding, **no shadow**.
- Use only for: code entry/code cells, a team-choice control, a settings control group, an input, a sheet.
- Never: prose, page sections, headers, lists, messages, roster rows, the Board, the map, decoration.
- Nested plates are banned. A plate inside a sheet is allowed only for an input/choice (e.g. code cells).
- Selected state = 2 dp team/cyan border + 12 % tint + a `check` FieldMark — not colour alone.
- Disabled = label/icon at 38 % alpha, plate/border stays full strength (control stays perceivable).

**List rows** are not plates: 56 dp min (72 dp when 2 lines), 1 dp hairline between, 12–14 dp vertical padding,
no chevrons, no card background.

---

## 4. Team tags (`TeamTag`, `StateTag`) & team sheets (`TeamSheet`)

**TeamTag** — cut-corner kit tag (ticket silhouette):
- 28 dp min height; `CutCornerShape(topEnd = 8.dp)`; 12 % team fill; 1 dp team border (2 dp when selected);
  glyph 16 dp + sentence-case team name `label` 13 Bold + optional data badge; padding 8/10; mirrors in RTL.
- Variants: role choice (large, full width), roster chip, selected team (2 dp + 20 % tint + check).
- Team colour is never the only cue: always glyph + name. Coral = Prey, violet = Hunters; never cyan.
- Compose: `Surface(shape = BoardShape.tag, border = BorderStroke(...), color = teamColor.copy(alpha = ...))`.

**StateTag** — the only tracked uppercase text:
- 20 dp cut-corner outline (4 dp cut) + mono 11 +0.10 em uppercase state word; live variant = 6 dp cyan dot +
  cyan text, no outline. Words: `LOBBY`, `HEAD START`, `LIVE`, `PAUSED`, `FULL TIME`, `CANCELLED`.
- Never use as a section heading; never title-case it; Arabic uses the UI face with no tracking (no tofu).

**TeamSheet** — the roster as a team sheet:
- Two columns (Prey first, then Hunters; stacked below ~300 dp): header = glyph 20 + team name `label` upper as
  data label + count `board.meta`; 2 dp team rule; rows 56 dp with 32 dp initial avatar (2 dp plate, tinted),
  name `title` 17, status `dataSmall` (`Ready`/`Gearing up`/`Offline`/`Tagged`), badges `HOST`/`YOU` in data
  labels, ready `check` 18; 1 dp hairlines between rows; the TeamTag action sits at the bottom of each column.
- Empty team: "No prey yet"/"No hunters yet" — not a big empty box.
- Never a single undifferentiated roster list; never show `TAGGED` in the lobby (reset state bug class L-01).

**Roster row** (in hunt sheet / result): player name + team glyph + status labels; 56 dp; no team pills with
rounded corners (use the tag grammar), no chevrons.

---

## 5. Code plate (`CodePlate`) & invite/share

- **Six cells** 48×56 dp, 8 dp gap, `plateRaised` fill, 1 dp `hairlineStrong`, code in mono 20 sp uppercase
  +0.08 em, centred, always LTR (isolate in RTL).
- Editable variant overlays an invisible `BasicTextField` so paste/autofill/IME still work; input filters to
  6 uppercase letters/digits (`InputRules.inviteCode`).
- Read-only variant (in lobby) is tappable to copy → notice "Room code copied".
- **Share** is a first-class action in the lobby: share sheet text "Join my ManHunt room / {name} - code {code} /
  {serverUrl}/join?code={code}" (real string pattern in `RoomScreen.kt`). Design share as an action near the
  code, not a hidden menu item.
- Never a generic text field for the code; never a single long input; never hide the code behind a tap.
- The code is a **social object**: legible at 1–2 m, no tiny letter-spacing, stable LTR.

---

## 6. Map overlays (`MatchMap` grammar)

The map is a real map (osmdroid + OSM tiles, dark filter in dark theme). The design controls the **overlay
language**, not the tiles. OSM attribution stays visible wherever tiles appear.

| Element | Role | Visual grammar | States |
|---|---|---|---|
| **Own position** | where you are | cyan dot + small ring; hollow when no fix yet | known / waiting for GPS / permission off (dim + label) |
| **Prey marker (fresh)** | a real report | coral dot + soft report ring; label/initial optional; accuracy halo if shown | fresh (within interval) |
| **Prey marker (stale)** | old report | dimmed amber/dashed ring + data age; never identical to fresh | stale, flagged/unverified (label "Unverified") |
| **Prey marker (eliminated)** | tagged prey | chalk-dim with a cross tick; no longer a team colour | eliminated |
| **Zone ring** | the play area | cyan 2 dp open/closed ring + 8–12 % fill; ring is a rule, not a glow | static / shrinking (show next shrink countdown in data) |
| **Trail** | prey history (hunters, if enabled) | coral 2 dp polyline, round caps, low alpha; 3–4 point nodes | visible / hidden / empty ("No trails available yet") |
| **Report ping** | a new report | one expanding cyan ring 400–600 ms, linear, fades once | reduced-motion: static ring |
| **Controls** | zoom +, −, recenter | 48 dp targets, flat plates (not glass), top-end on dark scrim | always available; never covered by the sheet |
| **Attribution** | legal | `© OpenStreetMap contributors` data text, tappable | always visible when tiles are shown |
| **Text alternative** | a11y | per-prey status list (live/stale/no report/unverified/tagged) in the sheet | required (map is not screen-reader readable) |

**Rules:** map is full-bleed, no rounded card (hunt page); the Board insets it from the top; the bottom sheet
overlays it but must not cover markers (use fit padding ~160 dp); the map keeps last-known data offline and
marks it stale rather than blanking; never draw fake OSM-like streets in a mock page (a drawn field plate is
the allowed substitute — label it honestly).

---

## 7. Field log entries (`ChatPanel` grammar)

**Message row:** mono `HH:mm` in a 44 dp start gutter (`dataSmall`, muted) · sender name `label` (team colour if
sender has a team; own messages may use cyan, but not as a bubble) · body `body` chalk, full width; 1 dp hairline
between rows at 60 % alpha; no bubbles, no tails, no avatars, no cards. 8 dp vertical rhythm, 12–16 dp side.

**System row:** centred `dataSmall` muted line between two 1 dp hairlines — for game events (match started,
tag confirmed, paused, etc.). Never styled like a chat bubble.

**Composer:** 52 dp plate input (surfaceVariant fill, 1 dp hairlineStrong, 2 dp radius) + 52 dp square primary
send action with `FieldMarks.send`; placeholder "Message"; send disabled when blank/sending; draft survives a
failed send; error strip above the composer; IME padding; RTL: text aligns start, send mirrors, clock numerals LTR.

**States:** empty ("No messages yet. Say hello."), first page loading (3 skeleton bars), load older (inline
row), send in-flight (spinner in the button, not replacing the composer), send failed (strip + draft kept),
offline (composer disabled + strip), long thread (LazyColumn, keys stable).

---

## 8. Inputs & actions

**`PlateTextField` (input):**
- 52 dp min height (`heightIn`, never fixed); label `caption` above the plate (no floating label);
  plateRaised fill; 1 dp `hairlineStrong` border (error: error-colour border); radius 2 dp; text `body` 15 sp;
  focus = 2 dp cyan ring (2 dp offset); error/help line 12 sp below; trailing action 48 dp.
- Variants: text, password (reveal toggle), number (digits only), URI, coordinate (12-char filter), code overlay.
- Never a Material `OutlinedTextField` look, never a pill, never a floating label overlapping the value.

**`BoardButton` (action):**
| Tone | Height | Fill / border | Label | Use |
|---|---:|---|---|---|
| Primary | 56 | solid cyan, no border | `onCyan` 13 Bold UI | the one primary action on screen |
| Outline | 48 | transparent, 1 dp `hairlineStrong` | chalk 13 Bold | secondary/cancel |
| Destructive | 48 | transparent, 1 dp `error` | error 13 Bold | irreversible actions only |
- Disabled = 38 % label/icon alpha + filled at 12 % (primary) or full-strength outline (secondary); no shimmer.
- Loading = small loader inside the label row, label still present ("Signing in…").
- `heightIn(min)` so text at 1.5–2× grows instead of clipping; min touch 48 dp; **no pill buttons**.
- Inline action = 48 dp hit height, sentence case, chalk with underline on press/focus only — never cyan, never a chip.

**Segmented choice** (e.g. Dark/Light, English/العربية, Open/Zone): 2 dp plates side by side, 48 dp tall,
selected = 2 dp cyan border + 12 % tint, unselected = 1 dp hairlineStrong; `selectable` semantics (radio).
**Switch:** 48 dp target, label to the start of the control, 2 dp plate track (no Material pill styling if the
direction can avoid it); label always present.
**Slider** (text size): 1 px chalk track + 2 dp cyan progress rule + 6×28 dp chalk thumb, whole 48 dp band
tappable, `stateDescription` "%", SetProgress semantics.

---

## 9. Docks & bottom action bars

**`BoardDock` (lobby):** bottom, full-bleed, 1 dp hairline top, 72 dp min + nav inset, 12 dp padding; contains
the one primary action + optional inline secondary/status line. Host: inline "Ready to hunt/Stand down" above a
primary "Begin the hunt" (disabled + blocker reason directly above). Player: one primary "Ready to hunt" /
outline "Stand down".

**Hunt dock:** the one primary action per role — hunter `Tag prey` (56 dp, primary) + `Trails` (48 dp outline) —
inside the sheet peek, thumb-reachable. No other filled action on the map. Host destructive actions live behind
the expanded details/`Hunt rules`, never beside Tag.

**Result dock:** primary "Back to lobby" (56) + outline "View hunt history" (48) at the bottom; optional
rematch only as a labelled proposal.

**Rules:** primary in the bottom 40 %; destructive never adjacent to primary; dock is not a card (no radius,
no shadow); IME and navigation-bar insets respected; RTL mirrors order (primary stays on the reading-start side).

---

## 10. Sheets (`MatchSheet`) & dialogs

**MatchSheet** — every in-room decision is a bottom sheet, not a floating dialog:
- Full width, `plate` fill, 2 dp top corners (square shoulders), 1 dp top hairline, centred gesture rule
  24–40 × 2 dp in muted 40 %, max 60 % screen height (scroll inside), 16 dp padding, safe-drawing insets.
- Title = the **consequence** in `headline` 22 sp ("Tag claim", "End the hunt?", "Leave the room?", "Hunt rules"),
  body = one or two factual `bodySmall` sentences, actions stacked full-width 56/48 with 12 dp gap.
- Destructive action has the error tone and names the consequence; a way out is always visible.
- Busy state disables actions and keeps the sheet open; errors appear in the sheet with retry; **the sheet never
  closes on a failed action that needs an answer**.
- Dismissing a claim sheet is allowed but creates a persistent banner on the screen behind — never lose the
  decision.
- Banned: middle-of-screen `AlertDialog` cards, 24–28 dp rounded corners, 6 dp elevation, multiple side-by-side
  text buttons, keyboard-over-sheet layouts.
- **Sheet variants:** tag claim, disputed tag (huntmaster), tag target picker, end hunt, leave room, hunt rules
  (large content sheet), update/install confirmation if used.

**Full-screen overlay:** the result `ScorePage` and `HistoryDialog` are full-screen surfaces, not sheets.

---

## 11. Scoreboard / result page (`ScorePage`)

```
[ MatchBoard: FULL TIME · 18:48 played · PREY 0 / 2 · HUNTERS ]
Hunters win.                                    ← display.xl 64 sp, sentence case, full stop
Prey remaining: 0 / 2                           ← data/mono line
[ drawn field plate / final trail map ]         ← 180 dp (or real map snapshot later — label honestly)
Hunt roster (two team columns + TAGGED)         ← team sheet grammar
[ Back to lobby ]  [ View hunt history ]        ← bottom dock
```
- States: Hunters win; Prey win (honest `2 / 2`); cancelled; result-sync loading (show winner immediately,
  never hide it); final report unavailable.
- The winner word is the one display moment on the page; no exclamation mark; team colour may accent the word
  + a chalk rule, never a green/red success pair.
- Serious and human: this is the payoff of the game. One warm detail allowed (the direction's chosen gesture).
- Compose: full-screen opaque `Surface` rendered in-composition over the room (never a Dialog window — the old
  dialog-under-keyboard failure); safe-drawing padding; scrolling column for many players.

---

## 12. State components (one vocabulary, everywhere)

| Component | Visual | Use / rule |
|---|---|---|
| `EmptyState` | 1 dp ChalkRule + optional caption + title 17 Bold + one `bodySmall` muted sentence + one action. Left-aligned, no icon tile, no illustration (optional static field plate on Home/Chat). | Every empty state says what will appear + how to make it appear. |
| `ErrorStrip` | plate fill, 1 dp error top rule (or full error border), error text `bodySmall` + inline "Try again"; 48 dp min; assertive live region; never auto-dismisses an error needing action. | Errors are not dialogs; keep input on retry. |
| `LoadingRule` | 2 dp cyan rule (48 dp wide, determinate where possible) or 3 pulsing chalk ticks + a sentence naming what loads. | No full-screen spinner; reduced-motion static 40 % rule + text. |
| `SkeletonRows` | 3 × 12 dp bars at 8 % chalk, 8 dp gaps, no shimmer. | Only where data replaces them. |
| `OfflineStrip` | full-width plate under the Board: `data` "Offline · last update 12 s ago" → "Reconnecting…"; 28–36 dp; tap = retry. | Keep last-known data; disable server actions with a reason; never blank the map/board. |
| `PermissionStrip` | plate with 2 dp cyan top rule, title 15 Bold + one `bodySmall` reason ("what fails") + 48 dp action (Allow/Open settings). | Location is the critical one (prey). Notifications non-blocking. |
| `NoticeStrip` | full-width transient confirmation (e.g. "Settings saved", "Tag confirmed") with dismiss; not a toast-only. | Confirmations are not errors; don't stack more than one. |

**Copy banks** for these states are in `design/redesign/screens/11-states.md` §8 and `PAGE_INVENTORY.md` §18.

---

## 13. Field plate (the drawn pitch / radar)

- Role: the brand's one illustration — a dark field diagram with the Open Zone ring, survey ticks, faint asphalt
  grain ≤4 % opacity (never on text); used on Auth (200 dp), Home (120 dp), Roles/first-run, empty states, and as
  the result trail stand-in (180 dp). One per page.
- It is decorative art: no semantics, no fake data, no invented street names; reduced-motion shows the static
  first frame; it must never be the loudest thing above the actual task.
- Compose: a `Canvas`/`drawWithContent` recreation of `BrandFieldPlate` (shipped) or a static variant; don't
  add particles/glow; ≤30 fps if animated; skip animation when the screen is not resumed.

---

## 14. Composition matrix (what can appear where)

| Page | Board | Plates | Tags | Code | Field log | Map | Dock | Sheet |
|---|---|---|---|---|---|---|---|---|
| auth | — | inputs (2) + server field | — | — | — | — | — | — |
| roles | — | 0–2 (mode choice / accept) | side tags | — | — | — | accept bar | — |
| home | Masthead | inputs + code cells | — | ● editable | — | — | — | — |
| lobby | Lobby | 0 | TeamTags + TeamSheet | ● read-only | (Chat tab) | — | ● | rules sheet |
| hunt-hunter | Live | 0 | roster tags | — | (Chat tab) | ● full-bleed | ● Tag/Trails | claim/target/details |
| hunt-prey | Live | 0 | — | — | (Chat tab) | ● own only | ● status/GPS | claim |
| chat | compact header | composer input | — | — | ● | — | — | — |
| result | Full time | 0–1 (roster) | TeamSheet tags | — | — | field plate | ● actions | — |
| history | — (header) | 0 | result dot | — | — | — | — | full-screen page |
| settings | — (header) | inputs/choices | — | — | — | — | — | — |
| claim sheet | (behind: Live) | 0 | prey tag | — | — | dimmed | — | ● |
| room rules | (behind: Lobby) | inputs/choices | — | — | — | map in picker | — | ● |

**Count check:** ≤2 plates per page, ≤1 Board, ≤1 primary filled cyan surface, ≤1 display moment.

---

## 15. Compose mapping & implementation notes

| Element | Shipped component/file | Target change |
|---|---|---|
| Board/Masthead | `MatchBoard`, `StateTag` in `ui/BoardComponents.kt`; `Masthead` in `ui/BoardInputs.kt` | reuse metrics; add `PAUSED`/`CANCELLED` variants if a page needs them; keep one per screen |
| Rules | `ChalkRule` | reuse; allow optional label/caption per direction |
| Plates/inputs | plate visuals in `BoardInputs.kt` (`PlateTextField`) | new `SelectablePlate`/`SegmentedChoice` for settings/rules |
| Buttons | `BoardButton`, `InlineLink` | make the hunt dock use them (currently Material Button/OutlinedButton) |
| Tags/sheets | `TeamTag`, `StateTag`, `TeamSheet` in `BoardComponents.kt`/`LobbyBoard.kt` | style fix only: sentence-case labels, no hard-coded uppercase English |
| Code | `CodePlate` | reuse; add explicit LTR isolate for RTL |
| Map | `map/MatchMap.kt` + `map/BrandMapMotion.kt` | overlay grammar only; don't rebuild tiles; add stale/eliminated marker differentiation (UI-08) |
| Chat rows | `ChatPanel.kt` `MessageBubble`/`Composer` | already field-log grammar; extend empty/error/offline states |
| Sheet | `MatchSheet.kt` | reuse; convert `RoomSettingsDialog` from `AlertDialog` to the sheet + ruled groups |
| Score page | `ScorePage.kt` | reuse; add the direction's result composition; honest degradation rules stay |
| History | `HistoryDialog.kt` | reuse; add one summary design (proposal) |
| State components | `ErrorStrip`, `LoadingTicks` in `BoardInputs.kt`; legacy `ErrorBanner`/`EmptyState`/`ManHuntLoader` in `Components.kt`/`ManHuntLoader.kt` | new EmptyState/OfflineStrip/PermissionStrip per §12; retire legacy usage screen by screen |
| Field marks | `ui/FieldMarks.kt` (22 marks) | use; add a mark only if the grammar is the same (24 grid, 2 dp butt caps, no rounded joins) |

**Hard constraints:** no gradients/glows/shadows/blur; no 16–28 dp card radii; no pill shapes (except platform
circular icon buttons at 48 dp); no ALL-CAPS outside StateTag/data labels/code; no fixed heights on text; no
nested plates; no plate for prose; no animation without a game event; no icon tile behind an icon; no Material
feature icons; no fake clocks/numbers; every touch ≥48 dp; every state says what happened + next move.

---

## 16. Banned combinations (review will reject)

- Board + second Board / Board used as a page header inside a card.
- Plate inside plate; card in a card; icon tile + title + subtitle repeated per section.
- Cyan used as a link/icon tint/team colour; coral/violet used for errors or as the field; a green/red result pair.
- Pill buttons, 999 dp chips, 20 dp cards, 24 dp dialog radius, 6 dp elevation.
- Unlabelled icon-only navigation; a destructive action next to the primary; a disabled primary with its reason far away.
- Spinner as the only loading state; red rounded error card; toast-only error; empty state = centred grey sentence.
- Placeholder `--:--`, "1,248 hunters", fake ratings/store badges, "private/secure/encrypted", exclamation marks.
- A map that shows another prey's position to a prey; a result that hides the winner while a map/report loads.
