# 08 — Result (ScorePage) and Hunt history

**Route:** when the room's match reaches `FINISHED` / `CANCELLED` (`RoomScreen` result path) → **ScorePage**;
"View hunt history" / room toolbar history → **Hunt history**.
**Purpose:** the match's ending is the emotional payoff: who won, by how much, how long it took, and what the
field looked like. It is also where a group decides to play again.
**Primary action:** Back to lobby. Secondary: View hunt history (and Rematch only if the app already supports
it — do not invent the action).

**Old problem being fixed:** the result is a standard `AlertDialog` with a crosshair icon, opened over the chat
with the keyboard up, saying "Hunt result / Hunters win! / Prey remaining: 0/1" — a notification, not a result.
History is another `AlertDialog` list. New: a **full-screen scoreboard page** and a **field log of past
matches**; both use the Board's full-time variant.

---

## 1. Hierarchy — ScorePage

1. **The winner** — the state/score Board (`FULL TIME`) then the winner in `display.xl` ("Hunters win."), the
   single loudest type in the app. This is the one time the app may shout (without an exclamation mark).
2. **The score line** — `display.m` or `board.meta` numerals: "Prey caught {n} / {total}", "{duration} played", zone at
   finish if relevant. Real numbers only; if the server cannot provide the totals, omit the derived line (see
   the honest-degradation rule below).
3. **The field** — a non-interactive trail plate: zone, coral trails, markers where prey were last seen /
   tagged; attribution if real map tiles are used.
4. **The team sheets** — final states (tagged, escaped) per player, not just "roster".
5. **Actions** — `Back to the lobby` primary, `VIEW HUNT HISTORY` secondary; rematch only if supported.

---

## 2. Layout — ScorePage

```
┌───────────────────────────────────────────────┐
│ ■ FULL TIME                        PREY 0 / 2 │  MatchBoard FullTime (ink)
│ 18:48                              HUNTERS    │
├───────────────────────────────────────────────┤
│                                               │
│  Hunters win.                                 │  display.xl 64/58, 2 lines max
│  Both prey were tagged.                  │  body 15 muted (honest summary)
│                                               │
│  ┌─────────────────────────────────────────┐  │
│  │   TRAIL PLATE 16:9 (non-interactive)    │  │  zone ring, coral trails, tagged markers
│  │   © OpenStreetMap contributors          │  │  data.small, tappable if tiles
│  └─────────────────────────────────────────┘  │
│                                               │
│  THE TEAMS                                    │  caption
│  ● Prey (0)              ◆ Hunters (3)        │  two team sheets, final states
│   Yasmin   tagged         Omar     ✓          │
│   Leila    tagged         Tariq    ✓          │
│   Sara     tagged         Nour     —          │
│                                               │
│  ────────────────────────────────────────────  │
│  Hunt history                           →     │  inline action (also dock secondary)
│                                               │
├───────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐  │
│  │            Back to the lobby            │  │  56 primary
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │           VIEW HUNT HISTORY             │  │  48 secondary
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

- **The Board is frozen** (no ticker). The winner word is the only display-xl moment; if the localised string
  is long (Arabic), it wraps to 2 lines and stays `display.xl` (Arabic 56/64), never shrinks below `display.l`.
- **Score data:** prey caught / prey total, plus duration (from match start/end). If the server exposes
  zone/trails data, one `data` line: "Zone 240 m at the end". Do not invent stats (no "distance travelled", no
  MVPs, no accuracy). **Honest degradation is required** (known server behaviour): the server resets
  eliminations when a match finishes, so the derived "n / total tagged" or per-player final statuses may be
  unavailable at finish. In that case show the winner + final duration and **omit** the derived score line —
  never fabricate a survivor count. The clean fix is for the client to snapshot final match state before the
  reset (Phase 2 implementation task), or for the server to expose a small final report (tagged list, duration);
  either is acceptable, silent fabrication is not.
- **Trail plate:** read-only map snapshot (recommended, premium) with the zone and trails, **or** a drawn
  `FieldPlate` from the match data if a map snapshot is not feasible in this sprint. If tiles are used, the
  OSM credit must be visible (and the plate must not be cropped in screenshots).
- **Team sheets:** use `TeamSheet` with final statuses. If the server only returns eliminated flags, show
  "Tagged" / "In play at the end" — never fabricate outcomes. If the finish reset removes the flags, show the
  roster without invented statuses (or omit the sheets and keep the winner + score + trail plate) — do not
  guess who was tagged.
- **Cancelled match:** title "HUNT CANCELLED." (state word in Board `CANCELLED`), body "The huntmaster ended
  the hunt before it finished." Score area shows how many were tagged at cancellation; actions: Back to lobby,
  View hunt history. No winner word.
- **Draw / no winner:** if the server can return a non-Teams winner, the copy must not force a team; use "NO
  WINNER." as the display line only if the model says so (do not invent; preserve the existing winner
  semantics).
- **Pending dispute at finish:** the ScorePage must not block resolution: if a disputed tag exists, show a
  `data` line "A disputed tag is still under review." and leave the resolver on the room (existing actions);
  do not auto-resolve in UI.

---

## 3. Layout — Hunt history (full-screen overlay)

```
┌───────────────────────────────────────────────┐
│ [←]  Hunt history                             │  header 56
├───────────────────────────────────────────────┤
│  TONIGHT · 2 NOV 2026                         │  `data` date group
│  ──────────────────────────────────────────── │
│  20:41  18:48   Hunters win.  2 / 2 tagged →  │  entry row 72 dp: time, duration, result, score
│  19:02  24:08   PREY WIN      1 / 2 tagged →  │
│  YESTERDAY                                    │
│  21:15  cancelled                —            │
│  ──────────────────────────────────────────── │
│  …                                            │
│                                               │
│  Loading: 3 chalk placeholder rows            │
│  Empty: "No hunts in this room yet." + one    │
│  sentence "Finish a hunt and it will appear   │
│  here."                                       │
│  Error: ErrorStrip + Try again                │
└───────────────────────────────────────────────┘
```

- Replaces the `HistoryDialog` `AlertDialog`; keep the `HistoryDialog(onDismiss, …)` call signature working
  (render a full-screen `Surface`/`Dialog` with `usePlatformDefaultWidth = false`, safe insets).
- Rows are not cards: 1 dp hairlines, `data` time/duration in mono, result word in `label` with the winner
  team colour (team tag/dot), score `data`; tapping a row expands in place? — no navigation; the row shows all
  available data (the current history entries have winner/score/time). No fake "match report" screen.
- Empty state is honest: "No hunts in this room yet." (existing string) + "Finish a hunt and it will show up
  here."; no icon tile.
- Loading skeleton rows (8 % chalk bars), not a spinner; error strip with retry (this fixes the known bug where
  errors looked like "no hunts").
- Group by local date; use `data` group labels ("TONIGHT", "YESTERDAY", date) — these are genuine temporal
  labels, not decorative ALL CAPS eyebrows; allowed. In Arabic, localised date labels; times LTR.

---

## 4. Components

| Element | Spec | Test tag |
|---|---|---|
| Board | shell §2.1 `FullTime` variant | `board`, `board_state` |
| Winner | `ManHuntType.display.xl`; Arabic display.xl; color: chalk (not team colour) — the team identity is in the Board gutter + winner tag next to the score | `result_winner` |
| Summary | `body` muted; one sentence, factual | — |
| Trail plate | `MatchMap` read-only (no gestures) or drawn `FieldPlate`; 16:9; 1 dp hairline; OSM credit if tiles | `result_map` |
| Team sheets | `TeamSheet` (final statuses) | `result_teams` |
| Duration/score | `board.meta` / `data` | `result_score` |
| Primary | `BoardButton` primary 56 "Back to the lobby" (existing key "Back to lobby") | `result_back` |
| Secondary | `BoardButton` secondary 48 "View hunt history" (existing key) | `result_history` |
| Rematch | only if the app currently exposes a rematch action; label "Play again" (existing key); secondary; never required | `result_rematch` |
| Cancel variant | same page, state CANCELLED, no winner word, body sentence | — |
| History page | full-screen overlay with header back; list rows; loading/empty/error | `history_dialog` (keep existing tag if present) |
| History row | 72 dp, hairline, time+duration `data`, result `label` + team dot, score `data`; no chevron | — |

Removed: the `AlertDialog` card, crosshair icon, exclamation-marked strings, "Prey remaining: 0/1" as the only
result data, the keyboard visible behind the dialog, "Hunt result" as a title (the state word + winner is the
title).

---

## 5. Copy intent

| Slot | English | Notes |
|---|---|---|
| Board state | FULL TIME / CANCELLED | state words |
| Winner | **Hunters win.** / **Prey win.** | existing keys have "!"; **change visible values to a full stop** (tone-of-voice bans exclamation marks); flag to copy owner |
| Summary (hunters) | All {n} prey were tagged. | derived from real counts |
| Summary (prey) | {n} of {total} prey made it to the end. | honest: a prey "wins" if any survive; use server winner only, don't restate rules wrongly |
| Summary (cancelled) | The huntmaster ended the hunt before it finished. | states cause |
| Score | Prey caught {n} / {total} · {duration} played | use `data`/`board.meta`; Arabic no `·` |
| Teams caption | The teams | sentence case |
| Empty history | No hunts in this room yet. / Finish a hunt and it will show up here. | reuses existing empty string; fixes the old "No hunts in this room yet." on error |
| History title | Hunt history | existing |
| Error | Couldn't load the hunt history. Check your connection and try again. | states what + next move |
| OSM | © OpenStreetMap contributors | only if tiles are shown |

Arabic: existing keys for "Hunters win!" / "Prey win!" / "View hunt history" / "Back to lobby" exist in
`Localization.kt` (win strings have `!` — update the Arabic too for consistency: "فاز الصيادون." etc.; copy
owner to confirm). Score labels need copy-language review.

---

## 6. States

| State | Design |
|---|---|
| Finished | ScorePage with winner + score + trail plate + sheets + actions. |
| Cancelled | As §2, no winner. |
| Loading/syncing result | If the room state arrives before the final history fetch, show the Board + winner immediately; the trail plate/sheets can be placeholder bars with `data` "Loading the final report…" — do not block the winner. |
| Result fetch error | Winner still shown; trail plate area shows an `ErrorStrip` "Couldn't load the final report. Try again." (does not hide the result). |
| Final report data missing (server reset) | Show winner + duration + trail plate; omit the derived score line and any per-player final statuses rather than inventing them; no error strip (this is a data gap, not a user error). |
| History loading | 3 skeleton rows, header visible; no spinner. |
| History empty | Rule + "No hunts in this room yet." + sentence. |
| History error | ErrorStrip with retry; never the empty state. |
| Many players | TeamSheets scroll with the page; page scrolls; actions pinned? ScorePage can scroll with dock pinned for actions; trail plate above. |
| 200 % text | Winner wraps 2 lines; Board stacks; sheets stack one column; dock buttons grow. |
| 320 dp | Trail plate 16:9 narrow; actions full width; score line wraps. |
| RTL | Board mirrored; winner word right-aligned; score line right; team sheets mirrored (Prey on the right); trail map **not** mirrored (real geography); times/durations LTR. |
| Light | ScorePage uses ink Board + chalk content; trail map stays dark (same rule as Live Hunt); sheets white plates. |
| Reduced motion | No entrance; winner appears on the cut; no confetti/particles (none exist). |

---

## 7. Compose implementation notes

- Replace the result `AlertDialog` with an override of the room's game page: when `match.phase` is
  FINISHED/CANCELLED, render `ScorePage` **in place of** the tactical/lobby page (or as a full-screen overlay
  over it) — not a dialog window. Ensure the IME is hidden (`LocalSoftwareKeyboardController?.hide()`) when the
  result appears; the chat composer must not be visible under it.
- Keep the existing result/dismiss state in `RoomViewModel` if any; if not, derive from `match.phase` and allow
  "Back to the lobby" to return to the lobby view without clearing the finished match data (the lobby shows
  "Last hunt: …" as today). Do not lose the user in a finished-match loop: back to lobby must be a stable view.
- Trail plate: `MatchMap` with `Modifier.pointerInput {}` disabled / `MatchMap` param to disable gestures if
  easy, else a static `Canvas` reading the same overlay data (preferred if gestures are hard to disable). If
  `MatchMap` is reused, pass `showAttribution = true` and no `ownLocation`; hide map controls.
- Team sheets: build from current `state.members` + match data; keep `Hunt history` call to `vm.loadHistory()`
  and existing state fields.
- History: replace `AlertDialog` in `HistoryDialog.kt` with a full-screen `Dialog(properties =
  DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false))` + `Surface` +
  `safeDrawingPadding()` + header + `LazyColumn`; keep the composable/parameters source-compatible for the
  caller and screenshot tests. Add `error: String?` handling (known bug) and keep the existing loading/empty
  branches working.
- Accessibility: winner word `heading()` + `liveRegion = Assertive`? — result appearance is important; make
  the page root `liveRegion = Polite` with the winner/score summary; the ScorePage should take focus on a
  heading. Board semantics "Full time."; buttons standard.
- Performance: the trail plate is static; no map tile loading needed if the snapshot is drawn; if `MatchMap` is
  reused, do not start BrandMapMotion (pass `motion = false` or a static flag) and release/disable when the
  page is not visible.
- Overflow: winner + summary fit on 360×640 with dock; the page is scrollable, actions pinned; the Board and
  winner must be visible on first paint without scrolling on 360×640.

---

## 7. Premium screenshot brief

- **Shot A (result, Hunters):** dark, 1080 × 2400. Ink FULL TIME Board (41:12, PREY 0/3, HUNTERS), huge
  "Hunters win.", honest summary, trail plate with coral trails and zone, team sheets, dock with "BACK TO THE
  LOBBY". Keyboard closed. Status 21:04.
- **Shot B (result, Prey):** "Prey win." with 1 of 2 prey surviving; different trail.
- **Shot C (cancelled):** "HUNT CANCELLED." variant, no fake winner.
- **Shot D (history):** full-screen history with 4 believable entries over two date groups.
- **Reject:** AlertDialog card over chat keyboard, crosshair icon, exclamation, "Prey remaining: 0/1" only,
  blank map, cropped OSM credit.

---

## 8. A11y / RTL / adaptive checklist

- The page announces "Full time. Hunters win. Both prey were tagged." as one polite live region on
  appearance, not the clock.
- Buttons ≥48; dock 56; history rows 72 (tap target ≥48); back 48.
- Contrast: winner chalk/ink 15.9; team tags on plate (coral 6.6/violet 7.1); `data` muted 8.3.
- Winner never relies on team colour alone: team tag + name + score.
- RTL: mirror everything except the map and numerals; the winner word may be Arabic (allow 2 lines).
- Tablet ≥840: content in a single 560 reading column centred; trail plate can be wider (960) but the score/
  winner column stays 560; dock button capped 560.
- Tabletop: board + winner top pane; team sheets/actions bottom.
- Reduced motion: no transition; result is a cut.
