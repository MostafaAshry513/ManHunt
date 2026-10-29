# Lobby audit — state, layout, errors, flow, accessibility

Read-only audit of the ManHunt Android lobby. No production code was modified; the only
file written is this document. No Gradle build or test was executed.

**Scope**

| File | Role |
|---|---|
| `android/app/src/main/java/com/manhunt/app/ui/RoomScreen.kt` | Lobby + in-match screen, `RoomViewModel` |
| `android/app/src/main/java/com/manhunt/app/ui/RoomSettingsDialog.kt` | Admin match settings |
| `android/app/src/main/java/com/manhunt/app/ui/ChatPanel.kt` | Chat tab |
| `android/app/src/main/java/com/manhunt/app/ui/HomeScreen.kt` | Create / join entry points |
| `android/app/src/main/java/com/manhunt/app/ui/Components.kt` | `ErrorBanner`, `TeamPill`, `ScreenCard` |
| `android/app/src/main/java/com/manhunt/app/ui/HistoryDialog.kt` | Match history |
| `android/app/src/main/java/com/manhunt/app/data/Models.kt` | Room contract models |
| `android/app/src/main/java/com/manhunt/app/data/ManHuntRepository.kt`, `ApiClient.kt`, `RoomSocket.kt` | Data layer |
| `server/src/rooms.ts`, `server/src/app.ts`, `server/src/domain/match.ts` | Backend contract |

Every `file:line` reference was verified against the current on-disk state.

---

## Verdict

**The lobby's core state machine is sound and matches the server contract in the happy
path** — ready gating, team-chip locking, admin start blockers, and admin transfer all
behave correctly when state is fresh. The regressions the user is seeing are concentrated
in three areas that the recent changes touched directly:

1. **Layout**: the tab bar is squeezed into the *same row* as the room code + connection
   status, inside the title column, so the header now packs Leave / title / tabs / code /
   status dot / "Live|Polling" / loader / history into one strip (`RoomScreen.kt:577-662`).
   On a narrow phone this crowds and truncates.
2. **Feedback**: there is a single shared `ui.error` channel consumed by *both* the "Your
   setup" card and the chat panel, so an error from one surface shows up in the other, and a
   single global `busy` flag couples chat sends to lobby controls (and vice-versa).
3. **Cross-layer stale state**: the server never resets `eliminated` when a match ends, so
   "TAGGED" badges leak into the lobby; and the server returns the *latest finished* match
   when no match is active, so the lobby keeps rendering the previous match's map/zone.

There are no data-loss or security bugs in the lobby path, but the two stale-state leaks are
genuinely wrong information being shown to players, not just cosmetic.

---

## Findings

| ID | Severity | Location | Problem | User-visible symptom |
|---|---|---|---|---|
| L-01 | Medium | `server/src/rooms.ts:336-348` (reset), `RoomScreen.kt:797-804` (render) | `finishMatch` resets `is_ready=0` but never resets `eliminated`; the lobby renders a `TAGGED` badge from `member.eliminated` unconditionally. | A player tagged last match still shows "TAGGED" while the room sits in the lobby. |
| L-02 | Medium | `server/src/rooms.ts:732` (contract), `RoomScreen.kt:701-703` (render) | `buildState` falls back to `latestMatch` when no match is active, so `state.match` is non-null in the lobby; the client renders `MatchMap` whenever `match != null`. | The previous match's zone/map lingers in the Game tab of the lobby. |
| L-03 | High | `RoomScreen.kt:577-662` | Tab bar (`:594`) shares one `Row` with the room code + status dot + "Live|Polling" (`:590-653`), inside the title `Column`; Leave, title, loader, and history icon all sit in the same header strip. | Cramped/truncated header on small screens and landscape. |
| L-04 | Medium | `RoomUi.error` (`RoomScreen.kt:125`), consumed at `RoomScreen.kt:831` and `ChatPanel.kt:109` | One error field is used by every action (team, ready, start, chat, settings, tag) and rendered in two different cards. | A chat failure shows in "Your setup" on the Game tab; a start/settings failure shows above the chat composer. |
| L-05 | Medium | `RoomScreen.kt:207,220,232,245,355,367` (guards), `:929` (`sending`) | A single `busy` flag gates team/ready/start/settings/chat. | Sending a chat message disables Ready/Start; toggling ready disables the chat send button. |
| L-06 | Low | `RoomScreen.kt:320-328, 656-659`; `historyLoaded` (`:121`) unused | `HistoryDialog` is opened immediately (`:657-658`) and reads `ui.history` before the async `loadHistory` completes; `historyLoaded` is set but never read. | "No matches played yet" flashes, then the real list appears. |
| L-07 | Low | `HomeScreen.kt:78-81` | Join code guard checks `length < 4` while the message and the real code are 6 chars (`server/src/rooms.ts:58, 918-926`). | User can submit a 4-5 char code and get a server 404 instead of client-side validation. |
| L-08 | Low | `HomeScreen.kt:68`; `server/src/rooms.ts:80` | Create name only defaults `ifBlank`; a 1-char name is sent as-is and rejected by the server ("Room name is too short"). | Confusing server error for short names; silent "ManHunt" rename for empty. |
| L-09 | Low | `RoomScreen.kt:581, 410` | `Leave` has no confirmation, and `BackHandler` also calls `leave()`; leaving while admin silently transfers admin (`server/src/rooms.ts:150-153`). | Accidental leave; admin unknowingly hands off the room. |
| L-10 | Low | `RoomScreen.kt:852-863` | `FilterChip` default height (~32 dp) is below the 48 dp touch-target guideline. | Harder to hit team chips. |
| L-11 | Low | `RoomScreen.kt:866-876` | Ready button is disabled outside the lobby with no reason shown. | During a match the disabled "I'm ready" gives no explanation. |
| L-12 | Low | `RoomScreen.kt:832-836` | `notice` is rendered only in the Game tab's setup card, as a dismissible `TextButton`. | "Settings saved" / "Tag confirmed" notices are invisible when the user is on the Chat tab. |

Cosmetic (not in the table): duplicate imports in `RoomScreen.kt:44-48`
(`Badge`, `BadgedBox`, `Button`), `RoomSettingsDialog.kt:28,32`, `HistoryDialog.kt:20`
(`com.manhunt.app.i18n.t`). Harmless warnings, but they point to hasty recent edits.

---

## Concrete fixes

**L-01 — eliminate the "TAGGED" leak (server + client).**
Best fix is server-side: in `finishMatch` (`server/src/rooms.ts:336-348`), reset elimination
alongside readiness — `UPDATE room_members SET is_ready = 0, eliminated = 0 WHERE room_id = ?`.
Defensively, on the client only render the `TAGGED` badge when the room is not in the lobby
(`RoomScreen.kt:797-804`), e.g. gate on `state.room.status != "lobby"`. The client `eliminated`
field is still correct to *keep* in the model (it is meaningful in-match).

**L-02 — stop rendering the previous match's map in the lobby.**
Either have the server return `match: null` when `status === 'lobby'` (only fall back to
`latestMatch` for history/summary, not `buildState`), or gate the map on the client:
render `MatchMap` only when `phase in {head_start, hunting, paused}` (`RoomScreen.kt:701`).
The label under the map (`:716-727`) must be gated the same way — a hunter currently sees
"Prey positions are the latest reports" in the lobby.

**L-03 — restructure the header.**
Move the `TabRow` out of the title column into its own full-width row below the title (or
above the content), and give the room code + status its own compact row. Suggested shape:

```
Row { Leave  ·  title+code+status(weight 1f)  ·  loader  ·  history }
TabRow (full width)
```

Then the `state == null` "Connecting" branch (`:620-626`) can be simplified to the existing
centered loading state (`:664-677`), which is currently redundant with it.

**L-04 — split the error channel.**
Add a separate `chatError` (or keep chat errors local to `ChatPanel`) so lobby/action errors
never surface in chat and vice-versa. Alternatively move lobby errors to a top-level
`SnackbarHost`/banner above the tab content instead of inside the setup card.

**L-05 — split the busy flag.**
Use one busy flag for lobby controls (`setTeam`/`toggleReady`/`startMatch`/`saveSettings`)
and a separate one for chat send. `ChatPanel.sending` should come from the chat flag, not the
global `ui.busy` (`RoomScreen.kt:929`).

**L-06 — load history before showing the dialog.**
Have the history icon set `showHistory = true` only after `historyLoaded` is true (or move
`historyLoaded` into the dialog as a loading state), or make `loadHistory` return the list and
pass it to the dialog. Either way, delete the unused `historyLoaded` from `RoomUi` if it stays
unused.

**L-07 — validate the code length against the real constant.**
Change `HomeScreen.kt:78` to reject `joinCode.length != 6` (or `< 6`) and align the message;
better, share the `CODE_LENGTH`/alphabet constant with the server rather than hardcoding.

**L-08 — client-side name validation.**
Trim and validate on the client: reject empty/1-char names with a clear inline message, and
only default to "ManHunt" when the user explicitly wants that, instead of silently renaming.

**L-09 — confirm leave when admin / during a match.**
Add a confirmation dialog when `me.isAdmin` (or when the match is running) before `leave()`.

**L-10 — enlarge team chips.**
Give the `FilterChip`s a minimum 48 dp touch target (`Modifier.heightIn(min = 48.dp)`), or use
larger `FilterChip`/segmented buttons.

**L-11 — disabled-reason copy.**
When not in the lobby, replace the ready button's disabled state with a short "Match in
progress" label, or hide it and show a status line.

**L-12 — surface notices consistently.**
Render `ui.notice` once at the screen level (e.g. a snackbar or a top banner outside the
tab-switched content) so it is visible regardless of the active tab.

---

## Verified good

- **Ready gating**: `enabled = lobby && !ui.busy` (`RoomScreen.kt:868`) and the server-side
  `setReady` "Match already started" conflict (`rooms.ts:180`) agree; the button is correctly
  disabled once the room is `active`.
- **Team chips locked outside the lobby**: `enabled = lobby` (`RoomScreen.kt:856,862`) matches
  the server `teams_locked` conflict (`rooms.ts:168`).
- **Admin start blockers are consistent with the server**: `startBlockers` (`RoomScreen.kt:1024-1034`)
  mirrors `canStart` (`domain/match.ts:70-89`) — min players, ≥1 prey, ≥1 hunter, and not-ready
  count all line up in the normal flow. The only stale-state risk (a member leaving between the
  last refresh and tapping Start) is re-validated server-side and surfaces as an error.
- **Admin transfer**: `leave` (`rooms.ts:150-153`) reassigns to the earliest joiner and the
  client re-renders `isAdmin` on the next state push/poll — correct.
- **Double-tap protection on lobby actions**: `setTeam`, `toggleReady`, `startMatch`,
  `saveSettings`, and `act` all guard on `ui.busy` and always clear it in `finally`-equivalent
  try/catch paths (`RoomScreen.kt:207-376`).
- **No dead space from hidden banners**: `ErrorBanner` uses `AnimatedVisibility` with
  `shrinkVertically` exit (`Components.kt:102-123`), so an absent error collapses to zero
  height rather than reserving a blank strip.
- **Room code display**: code is shown from `state.room.code` with a `room_code` test tag
  (`RoomScreen.kt:627-637`), and join input is upper-cased on entry (`HomeScreen.kt:60`).
- **Not color-only**: team (`TeamPill` has text + dot, `Components.kt:53-78`), readiness
  ("Ready"/"Not ready" text + color, `RoomScreen.kt:814-819`), and connection ("Live"/"Polling"
  text next to the dot, `:647-651`) all convey state through text, not just color.
- **History/chat/leave/tag send labels**: the history icon (`:660`) and send button
  (`ChatPanel.kt:221`) have `contentDescription`s.

---

## Top 5 fixes (ranked)

1. **L-02 — stop rendering the stale map in the lobby.** Most prominent wrong information a
   returning player sees; small change (gate the map on an active phase, or return `match: null`
   in lobby from `buildState`).
2. **L-01 — reset `eliminated` at match end.** "TAGGED" badges in the lobby are flatly wrong
   and easy to fix server-side with a one-line SQL change (plus a defensive client gate).
3. **L-03 — restructure the header / move the tab bar to its own row.** This is the constant,
   daily "header is crowded" complaint and the most visible of the recent tab/settings changes.
4. **L-04 — split the error channel.** Errors in the wrong card confuse both admins (start
   failures) and players (chat failures); the fix is localized.
5. **L-05 — split the global `busy` flag.** Chat sends silently locking the Ready/Start buttons
   (and ready toggling locking chat) is the kind of "it feels broken" the user is reporting, and
   it is a small, safe refactor.
