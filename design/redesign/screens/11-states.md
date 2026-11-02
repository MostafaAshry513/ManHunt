# 11 — Empty, loading, error, offline, permission and update states

**Scope:** the state system behind every screen. A redesign is judged on these screens as much as on the
happy path; the current app uses a centred grey sentence, a spinner, a red rounded card and a toast for
everything. The redesign uses **one vocabulary** (shell §5.9): `EmptyState`, `ErrorStrip`, `LoadingRule`,
`OfflineStrip`, `PermissionStrip`, `CodePlate`, `MatchSheet`. No full-screen spinners, no shimmer, no fake
content, no apologies, no exclamation marks.

Copy rules (tone-of-voice): state what happened, then the next move. Empty states invite an action. Loading
says what is loading, once. Errors name the thing that failed. No "Oops", "Something went wrong" alone, no
"Retry" bare verb (use "Try again"), no "network error" jargon.

---

## 1. Components (visual contract)

| Component | Visual | Height | Behaviour |
|---|---|---:|---|
| `EmptyState` | 1 dp `ChalkRule` with an optional `caption` (context), `title` 17 Bold, one `body.small` muted sentence, one 48 dp action/inline. **No icon tile, no centred illustration** except the optional `FieldPlate` on Home/Chat-empty. Left-aligned inside margins. | auto | Static. |
| `LoadingRule` | 2 dp cyan rule, 48 dp wide (determinate where possible), paired with a `body.small` sentence naming the thing. In lists, 3 placeholder bars (8 % chalk) instead. | 24–48 | Indeterminate 1.2 s linear; stops when not resumed; reduced motion = static 40 % rule + text. |
| `ErrorStrip` | `plate` fill, 1 dp `error` top rule, `error` `FieldMark` 20 + message `body.small` + inline "Try again"; full content width; not rounded. | 48 min | `liveRegion = Assertive`; stays until dismissed by success or a new action; never auto-dismisses an error a player must act on. |
| `OfflineStrip` | full-width `plate` under the Board, 1 dp `error` bottom rule, `data` line "Offline · Last update 12 s ago"; reconnect state becomes "Reconnecting…" with a 2 s indeterminate slide (motion.md). | 28–36 | Persistent while offline; never blocks reading. |
| `PermissionStrip` | full-width `plate` with 2 dp cyan top rule (it is an action the player must take), title 15 Bold + `body.small` reason + 48 dp action (`Turn on location` / `Open settings`). | 72–96 | Reason is specific: what fails without it. |
| `SkeletonRows` | 3 × (100 % × 12 dp) bars, 8 % chalk, 8 dp gaps, no shimmer. | — | Only where data replaces them; removed when data arrives. |
| `Retry` | inline 48 dp "Try again" with the failing action, never a fresh navigation. | — | Keeps the user's input/draft. |

Rules:
1. **Errors are not dialogs.** Only a decision goes in a sheet; a failure is a strip/state in place.
2. **Loading is not a screen.** Keep the layout, fill the parts that load; never replace the whole screen with
   a spinner.
3. **Empty is never blank.** Every empty state says what will appear and how to make it appear.
4. **Offline keeps the data.** Never blank the map/board/history on a socket loss; show age.
5. **Retry preserves input** (name, code, draft, target selection, rules edits).
6. **Announce once.** `liveRegion = Assertive` for errors, `Polite` for ready/reconnect; suppress duplicate
   announcements while the same message is visible.

---

## 2. Empty states (by screen)

| Screen | Title | Body | Action | Notes |
|---|---|---|---|---|
| Home | *(no empty state — the host/join board is the state)* | — | — | A new player sees the two verbs; there is nothing to be empty of. |
| Lobby — other team empty | No one yet. | "Send the code — a hunt needs both sides." | `Share the code` (secondary) | The action scrolls/focuses the code block; no separate sheet. |
| Lobby — no other players at all | (same as above; server blocker line in dock) | — | Share | Dock Begin shows the real blocker. |
| Live hunt — no prey reports yet | No reports yet. | "Prey report every {interval}. Their last known positions will appear here." | — (informational) | Sheet peek; map shows zone + own position. Prey never see prey positions, so this state is Hunter-only. |
| Live hunt — no eligible tag targets | No prey to tag right now. | "Every prey is either tagged or already in a pending tag." | `CLOSE` | Target sheet empty state; never fake rows. |
| Chat | No messages yet. | "Say hello. The room can talk here." | Focus composer (tap anywhere on the sentence) | No fake messages. |
| History | No hunts in this room yet. | "Finish a hunt and it will show up here." | `CLOSE` / back | Fixes the old bug where a load error showed this text. |
| TeamSheet — unassigned empty | *(no empty state; unassigned players show "Picking a side")* | — | — | — |
| Updates — no update | You're up to date. | "ManHunt v{name}." | `CHECK AGAIN` inline | This is a success state, not an empty one. |
| Settings cache 0 B | 0 B | — | — | Row value, no state screen. |

---

## 3. Loading states (by screen)

| Where | Sentence | Visual | Notes |
|---|---|---|---|
| Cold start | — | `StartupBrandScreen` 900 ms, skippable | Never a spinner. |
| Auth submit | "Signing in…" / "Creating your account…" | button label + `LoadingRule` inside the button | Fields disabled, layout stable. |
| Auth server probe | "Testing connection…" | inline row | Success/failure text after. |
| Home create/join | "Creating the hunt…" / "Joining…" | button label + `LoadingRule` | Keep the typed value. |
| Room join (before state) | "Joining the hunt…" | skeleton: toolbar + Board with `JOINING` + 3 bars | No full screen spinner. |
| Lobby room refresh | — | no visible loading after first state; stale values acceptable | Do not flash. |
| Live hunt — map tiles | "Loading map…" | `data` line in sheet peek; last tiles stay | Never a grey checkerboard over the field: keep the field colour and draw zone/markers immediately. |
| Live hunt — first GPS fix | "Finding your position…" | `data` in sheet + hollow own marker | Permission state takes over if denied. |
| Tag request | dock label `Waiting for {name}` | button disabled | Not a spinner. |
| Claim response | sheet primary `LoadingRule` | sheet disabled | — |
| Chat first page | — | 3 skeleton bars above composer | Composer usable. |
| Chat older | "Loading older messages…" | inline row | Preserve scroll anchor. |
| History | — | 3 skeleton rows | Header visible. |
| Update check | "Checking for updates…" | disabled button + `LoadingRule` | — |
| Update download | "Downloading 1.2 of 2.3 MB" | 2 dp determinate cyan rule | Real bytes only. |
| Cache size | "Calculating…" | row value | — |
| Sign out | "Signing out…" | confirm sheet primary | — |

**Global rule:** if a load can take >300 ms, the *sentence* appears; below 300 ms do not show any loading UI
(avoid flicker). Never animate a fake progress.

---

## 4. Error states (by screen)

| Where | Message | Action | Notes |
|---|---|---|---|
| Auth | "The server didn't respond. Check the address and try again." / "Username or password is wrong." | `Try again` / edit | Existing API messages may be used if they meet the tone bar; no raw exception text. |
| Auth server probe | "Server did not respond. Check the address." | inline | Existing string. |
| Home create | "Couldn't create the hunt. Try again." or the server's message if human-readable | `Try again` | Keep the name. |
| Home join | "That code didn't match a hunt. Check the six characters." | `Try again` (focus cell 1) | Keep the code. |
| Room load | Full-screen `ErrorState`: "We couldn't load this hunt." + reason (`Room not found.`, `You're not in this room.`, `The server didn't respond.`) | primary `Try again` if transient; secondary `BACK TO HOME` | No dead end. |
| Lobby start/ready/team/leave | Strip above dock: "Couldn't start the hunt. Try again." etc. (use server message if human) | inline `Try again` | Controls re-enabled. |
| Live hunt tag request | In target sheet: "Couldn't send the tag. Try again." | retry row | Sheet stays; target row re-enabled. |
| Claim confirm/dispute | In claim sheet: "Couldn't send your answer. Try again." | retry | Strip persists. |
| Admin resolve | In dispute sheet: "Couldn't resolve the tag. Try again." | retry | — |
| Pause/end | Strip above dock: "Couldn't pause the hunt. Try again." / "Couldn't end the hunt. Try again." | retry | — |
| Chat send | Above composer: "Message didn't send. Check your connection and try again." + `Try again` | keep draft | Existing draft-preserving fix stays. |
| Chat older | Inline: "Couldn't load older messages. Try again." | retry | — |
| History | Strip: "Couldn't load the hunt history. Check your connection and try again." | `Try again` | Never show the empty state for an error. |
| Update check | "Couldn't check for updates. Check your connection and try again." | `Try again` | Existing string. |
| Update download | "Download failed. Check your connection and try again." | `Try again` | Existing. |
| Update install (unknown sources) | "Android needs permission to install from ManHunt. It will ask once." | `Open settings` | Not an error red; it is a system step, use chalk + action, `error` only if install actually fails. |
| Result report | In trail area: "Couldn't load the final report. Try again." | retry | Never hide the winner. |
| Sign out | In sheet: "Couldn't sign out. Try again." | retry | — |
| Deep-link join failure | Home with `ErrorStrip`: "Couldn't join that hunt. The code may have expired." | `Try again` / enter code | Existing toast is replaced by an in-page strip (toasts are not persistent) if the route allows; if not, keep the toast but make the message specific. |

**Never:** expose stack traces, HTTP codes alone ("Error 500"), developer text ("10.0.2.2"), "Oops", "Something
went wrong" without a next step, or a dialog for a retryable failure.

---

## 5. Offline / reconnect

- **Detection:** socket state (existing `RoomSocket` connection state) plus failed requests. Do not add a
  network-state permission/listener beyond what exists if avoidable; use request outcomes.
- **Global strip:** in a room, a 28–36 dp strip under the Board: `data` "Offline · last update 12 s ago" then
  "Reconnecting…" with a 2 s linear slide under the stick; tap = retry now. In non-room screens, failures show
  per-action error strips (no global banner).
- **Behaviour:** keep reading cached state (map, chat, roster, Board values). **Disable actions that need the
  server** (create/join/ready/start/tag/pause/end/save rules/send chat) with a reason in the dock/strip;
  do not silently fail.
- **Recovery:** on reconnect, refresh state once; if the phase/result changed while offline, the normal
  transitions apply (e.g. cut to ScorePage if finished while offline). Announce politely ("Reconnected").
- **Clock:** when offline, the Board clock keeps counting from the last server offset but is marked `data`
  "stale" if updates have not arrived in 2 report intervals; do not stop the clock silently. If the phase is
  unknown, keep the last known and show the age.
- **Chat:** messages sent while offline are not queued (no offline outbox in this app); the composer send is
  disabled with the offline strip visible. Do not fake delivery.

---

## 6. Permission states

### 6.1 Location (the critical one)

| Condition | Detect | UI |
|---|---|---|
| Not asked yet | `!hasPermission && !shouldShowRationale` | `PermissionStrip` under the Board in Live Hunt / above the dock: title "Location is off." body "Hunters can't see you as Prey, and your position won't appear on your own map. Only Hunters in your room see your position during a hunt." action `Allow location` (system dialog). Auth/Home do not ask. |
| Denied (can ask again) | `shouldShowRationale` | Same strip, action `Allow location`; after a second denial → next row. |
| Denied permanently | `!shouldShowRationale && !hasPermission` | Same strip, action `Open settings` (app settings). |
| Services off | permission granted, `LocationManager` providers disabled | Strip title "Location services are off." action `Turn on location` (opens location settings). |
| No fix yet | permission + services on, `LiveLocation.current == null` | `data` line "Finding your position…" in sheet; hollow own marker; never block the hunt. |
| Background tracking notification denied (API 33+) | notification permission denied | Strip: "Notifications are off. ManHunt shows a permanent notification while tracking." action `Open settings`; the foreground service still runs where allowed; do not imply tracking is hidden. |

Copy rule: explain **what fails**, never claim safety; "Only Hunters in your room see it during the hunt" is
approved wording; do not say "private"/"secure"/"encrypted".

### 6.2 Notifications (non-blocking)

Settings → Permissions row: status + `ALLOW` (system dialog) or `Open settings`; explanation: match start and
tag events; no push-server implications (there is no push service — do not promise notifications when the app
is closed; verify what the app actually does before writing that copy).

### 6.3 Sideload / install unknown sources

Settings → Updates: honest system step, `Open settings`; never "Play Protect approved"; never hide the step.

---

## 7. Session / room edge states

| State | Design |
|---|---|
| Session expired mid-room | Full-screen or covering state: "You've been signed out." body "Your session expired. Sign in again to rejoin the hunt." action `SIGN IN` (Auth). Do not silently bounce without explanation. |
| Room closed / kicked | "This room is closed." body "The host ended the room. Ask for a new code." action `BACK TO HOME`. |
| Removed from team? | Not a UI action; follow server events; show a strip if the server exposes a message, otherwise rely on state. |
| App opened from a finished match | The room shows the current lobby with "Last hunt: …" line; ScorePage only for matches the player saw active (existing `seenActivePhase` rule — keep that behaviour; it is correct). |
| Update installed / app restarted mid-hunt | Reconnect restores state; Board shows current phase; the result shows if the match finished while away (subject to the `seenActivePhase` rule; keep). |
| Host leaves | Existing server behaviour; show the room state as it becomes. Do not invent a "host transferred" badge. |

---

## 8. Copy bank (provisional, English)

Use existing i18n keys wherever the key exists; these are the intended meanings:

**Empty**
- No one yet. Send the code — a hunt needs both sides.
- No reports yet. Prey report every {n} minutes.
- No prey to tag right now. Every prey is tagged or in a pending tag.
- No messages yet. Say hello. The room can talk here.
- No hunts in this room yet. Finish a hunt and it will show up here.

**Loading**
- Creating the hunt… / Joining… / Signing in… / Creating your account… / Checking for updates… /
  Downloading {done} of {total} / Loading map… / Finding your position… / Loading older messages… /
  Calculating… / Signing out… / Testing connection…

**Error**
- The server didn't respond. Check the address and try again.
- That code didn't match a hunt. Check the six characters.
- Couldn't create the hunt. Try again.
- We couldn't load this hunt. Try again.
- Couldn't send the tag. Try again.
- Couldn't send your answer. Try again.
- Couldn't resolve the tag. Try again.
- Couldn't pause the hunt. Try again.
- Couldn't end the hunt. Try again.
- Message didn't send. Check your connection and try again.
- Couldn't load older messages. Try again.
- Couldn't load the hunt history. Check your connection and try again.
- Couldn't check for updates. Check your connection and try again.
- Download failed. Check your connection and try again.
- Android needs permission to install from ManHunt. It will ask once.
- Couldn't sign out. Try again.

**Offline**
- Offline · last update 12 s ago
- Reconnecting…
- Reconnected.
- Waiting for the server.

**Permission**
- Location is off. Hunters can't see you as Prey, and your position won't appear on your own map.
- Location services are off. Turn them on to share your position.
- Notifications are off. ManHunt shows a permanent notification while tracking.

Arabic: reuse the existing MSA strings in `Localization.kt` (they exist for safety, location, start blockers,
updates, result, connection). New strings need copy-language review; do not machine-translate in code. No `·`
in Arabic; no exclamation marks; keep Latin tokens (APK, Android, v0.15.1, URLs) isolated.

---

## 9. State acceptance checklist

1. Every screen has its empty/loading/error states designed and reachable in preview/screenshot tests.
2. No state uses a full-screen spinner; no shimmer; no auto-dismissing error that needs action.
3. Every error names the failed thing and the next move; retry preserves input.
4. Offline keeps last-known data and disables only server-dependent actions.
5. Location/notification permission strips explain what fails and provide the correct deep link.
6. History error ≠ history empty (regression fixed).
7. Result is never hidden by a failed final-report fetch; the winner is shown immediately.
8. All state strings go through i18n; Arabic strings are the existing approved ones where present.
9. Screen readers announce errors/reconnect once, politely where possible; strips are not skipped by focus.
10. Reduced motion: all loading visuals have a static equivalent with the same informational text.
