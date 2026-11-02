# 05 — Lobby (room, teams, readiness)

**Route:** `Route.Room` while `room.status == lobby` (game tab of `RoomScreen.kt`).
**Purpose:** turn a room code into a started game: show who is here, let people pick sides, make readiness
visible, and give the host one obvious "begin". This is the social centre of the app and the screen most
screenshots will show.
**Primary action:** Ready to hunt / Stand down (player); Begin the hunt (host, enabled only when valid).

**Old problem being fixed:** roster card → choose-side card → phase card, all identical plates with all-caps
labels, duplicated clock/status, ready button in a card mid-scroll, "Begin the hunt" disabled with the reason
far from it. New: Board at top (room + code + readiness), **team sheets** as the main object, one pinned dock.

---

## 1. Hierarchy

1. **Board (`Lobby` variant)** — room name, `LOBBY` state, readiness `n/n` in the gutter. Full-bleed.
2. **Invite object** — the 6-character code in `CodePlate` display mode + Share / Copy. The social object;
   on its own line under the Board, never buried in a header.
3. **The teams** — two `TeamSheet` columns (Prey coral / Hunters violet) with every member, ready/offline
   status, host mark, your row marked. Choosing a side is an action *on the column*, not a separate card.
4. **Pinned dock** — readiness/primary action. Host sees "Begin the hunt"; players see "Ready to hunt" /
   "Stand down". The reason for a disabled Begin is in the dock's status line, next to the button.
5. **Rules/summary** — one line of hunt rules (duration, interval, zone, trails) + "Hunt rules" (host) or
   "How it works" for players; secondary, under the teams.

No third card. No duplicated clock. No "THE HUNT" all-caps section. No hero.

---

## 2. Layout

```
┌───────────────────────────────────────────────┐
│ [←]                                 [share][⏱]│  room toolbar 56: back/leave, share, history
├───────────────────────────────────────────────┤
│ LOBBY · RIVERSIDE RUN                 2 / 5   │  MatchBoard Lobby: state+room, ready segments
│ ───────────────────────────────────────────── │
│ INVITE CODE                            [copy] │  caption
│  K 7 M 2 Q X        [ Share the code ]        │  CodePlate display mode, 20 sp mono, 6 cells
│ ────────────────────────────────────────────  │
│  ░░ GAME ░░░░░░░░░░░░░░░░░░  CHAT ░░░░░░░░░░  │  two-cell chalk tab rule + pager (unread dot)
│                                               │
│  THE TEAMS                                    │  caption/ChalkRule caption
│  ┌─────────────────────┐ ┌───────────────────┐│
│  │ ● PREY          2   │ │ ◆ HUNTERS      3  ││  TeamSheet headers (team glyph+name+count)
│  │ ─────────────────── │ │ ───────────────── ││
│  │ (Y) Yasmin  HOST    │ │ (O) Omar   YOU    ││  roster rows: avatar,name,status,host
│  │     Ready      ✓    │ │     Ready     ✓   ││
│  │ (L) Leila           │ │ (T) Tariq         ││
│  │     Not ready       │ │     Offline       ││
│  │ [ JOIN PREY ]       │ │ [ JOIN HUNTERS ]  ││  only on the side you're not on
│  └─────────────────────┘ └───────────────────┘│
│                                               │
│  60 min · reports every 5 min · zone 240 m    │  data/summary line (host rules)
│  Hunt rules                            →      │  inline action (host) / How it works (player)
│                                               │
├───────────────────────────────────────────────┤
│  Waiting for Leila to ready up                │  dock status line
│  ┌─────────────────────────────────────────┐  │
│  │              Begin the hunt             │  │  host: 56 primary, enabled when all ready
│  └─────────────────────────────────────────┘  │
└───────────────────────────────────────────────┘
```

Player dock (no "Begin"):
```
│  You're on Prey. Waiting for the host.        │
│  ┌─────────────────────────────────────────┐  │
│  │              Stand down                 │  │  ← 56 secondary-style when already ready
│  └─────────────────────────────────────────┘  │
```
Ready button when not ready is the cyan primary (`Ready to hunt`); once ready it becomes a 48 dp secondary
`Stand down` with the status line "You're ready. Waiting for the huntmaster." — so there is never more than
one cyan surface, and ready state is unmistakable.

### 2.1 Phone / short screens

- Board + code + tab rule + teams: the teams are the first content; the rules summary and "Hunt rules" go
  below the fold if needed. The dock is always visible.
- Team columns stack to one column if width < 340 dp, font scale > 1.3×, or Arabic names are long. Stacking
  order: Prey then Hunters (mirrored in RTL).
- 8+ players: each team column grows; the page scrolls; the dock is fixed. Do not cap the roster with "and 3
  more" — every player must be visible/scrollable (launch scale is small).

### 2.2 Empty / one-player / all-ready states

| State | Design |
|---|---|
| Only you | TeamSheet shows you; other column empty line "No one yet."; the code block gets a stronger
  "Share the code" inline emphasized? — it is a secondary 48 button under the code; dock: host Begin disabled
  with "Share the code. A hunt needs at least one more player." (use the actual server blocker text, localised). |
| Some ready, some not | Dock status "Waiting for {name} to ready up"; Begin disabled. |
| All ready, host | Begin enabled, status "Everyone's ready." |
| All ready, non-host | "Ready. Waiting for the huntmaster." (no action needed; stand down secondary). |
| Team unassigned players | Their team column shows nothing; a `Status` line in their row "Picking a side" (data) so it's visible they haven't chosen. Use the status the server exposes; do not invent. |
| Host leaves / room gone | Full-screen error page: "This room is closed." + "Back to home" (see states spec). |

---

## 3. Components

| Element | Spec | Test tag |
|---|---|---|
| Room toolbar | 56 dp row: back/leave 48 (auto-mirrored), spacer, share 48, history 48; no title (Board has it); 1 dp rule below | `room_leave`, `room_share`, `room_history` |
| Board | shell §2.1 `Lobby` variant: state + room name + ready segments + `n/n READY` | `board`, `board_state` |
| CodePlate | shell §5.3 display mode: six cells + `copy` inline + Share button; caption "INVITE CODE" (uppercase? — no: caption "Invite code" sentence case) | `room_code`, `room_copy_code`, `room_share_code` |
| Tab rule | two-cell rule, labels "Hunt" / "Chat" (replace "Game" — it *is* the hunt; but check existing tests tap by tag/text; keep tag `room_tab_0/1`), 2 dp active rule follows pager; chat unread dot (6 dp cyan) only if the VM already exposes unread (do not add plumbing; skip otherwise) | `room_tabs` |
| TeamSheet | shell §5.5; header glyph+name+count; rows shell §5.4; join/switch inline action per column; empty column line; your row tint+`YOU` | `team_sheet_prey`, `team_sheet_hunters` |
| Rules summary | `data` 12 muted line built from real settings (duration, report interval, zone on/off, radius, trails on/off); keep keys reused; hide unknown values | `room_rules_summary` |
| Rules action | inline "Hunt rules" (host, opens RoomSettingsDialog) / "How it works" (player → Roles); 48 dp | `room_rules` |
| Error strip | `ErrorStrip` above the dock or under the teams; start/ready errors | `room_error` |
| Dock | shell §4; host: Begin (primary, testTag `start_match`), status line with `start_blockers` content; player: Ready/Stand down (`ready_button`) | `bottom_dock` |
| Pending claim/dispute banners | lobby can also have a pending tag from a previous match? — not in lobby; only in live/finished states (see 06). Do not show in lobby. | — |

Removed: `ScreenHeader` with code chip/live dot/title pack, roster `ScreenCard` + all-caps "HUNT ROSTER (n)",
choose-side `ScreenCard` + `TeamChoiceCard` twin cards, the phase `ScreenCard` in lobby, the duplicate
status/clock texts, the "Begin the hunt" button inside the card, "Game" tab label/icon.

---

## 4. Copy intent

| Slot | English | Notes |
|---|---|---|
| State | LOBBY (mono state tag) | data state, allowed uppercase |
| Ready gutter | `2 / 5 READY` | data; no fake |
| Code caption | Invite code | sentence case |
| Copy | Copy code | existing key "Room code copied" for the toast; add "Copy code" |
| Share | Share the code | existing "Share room" key can be updated; honest action; no "Invite friends!!" |
| Teams caption | The teams | sentence case; no "CHOOSE YOUR SIDE" caps |
| Join actions | Join Prey / Join Hunters | existing `Prey`/`Hunters` keys; object+action |
| Switch | Switch to Prey / Switch to Hunters | if the VM allows switching; the tap target is the column action |
| Row status | Ready / Not ready / Offline / Picking a side | reuse existing keys where present ("Ready", "Offline"); "Not ready" may be new |
| Host mark | HOST | `data.small` label, not a colour or icon alone |
| Summary | {duration} min · report every {n} min · zone {m} m | reuses existing settings strings; Arabic: no `·`; use line breaks |
| Rules action | Hunt rules / How it works | existing |
| Dock (host) | Begin the hunt | existing key; status line uses `startBlockers` joined with a sentence not `·` ("Waiting for Leila to ready up." / "Every player needs a side."); no "Waiting for alice74354 to ready up" in screenshots — good data required |
| Dock (player not ready) | Ready to hunt / Stand down | existing keys |
| Dock status (player ready) | You're ready. Waiting for the huntmaster. | existing-ish "Ready. Waiting for the huntmaster."; keep |
| Leave sheet | Leave this hunt? / "You'll lose your spot. The code won't work for you until you join again." | host: "End the room for everyone?" is a separate destructive sheet (see 10) |

Arabic: reuse existing Localization keys for Ready/Stand down/Begin/Share/Hunt rules/team names; new strings
(Invite code, Your row marker YOU, team summary phrasing, Dock status) need copy-language review. `HOST` and
`YOU` in `data.small` should become localised or omitted (prefer a glyph + semantics: HOST can be a crown-like
`FieldMark`? — no crown; use the word HOST in data.small, localised "المضيف" if key exists, else English tag
is acceptable in both languages like "HOST" is used in Arabic sports). Decide: use a small `host` FieldMark
(dot with a tick/flag) + contentDescription; visually no word; the row also sorts host first. This avoids
untranslated labels.

---

## 5. States

| State | Design |
|---|---|
| Loading room (join in flight) | Screen skeleton in-place: toolbar + Board with `JOINING` state + 3 chalk placeholder bars (no shimmer) + dock disabled with "Joining the hunt…"; never a full-screen spinner. |
| Room load error | Full-screen `ErrorPage` (states spec): "We couldn't load this hunt." + reason + "Back to home" secondary + "Try again" primary? — use primary "Try again" if retry is possible, else "Back to home". |
| Start error | `ErrorStrip` above dock: server message + "Try again"; dock button re-enabled. |
| Ready toggle busy | Dock button loading; no double-tap; other actions remain. |
| Offline/reconnect | 1 dp `error` rule under the Board; `data` line "Connection lost. Reconnecting…" + last update; dock disabled with reason "Waiting for the server."; teams stay visible from last state. |
| Host rules saved | RoomSettingsDialog closes; Board/gutter and summary update from room state; no toast required (maybe a 2 s `data` line "Rules updated." in the summary, polite live region). |
| All ready → live | Board cuts LOBBY → HEAD START; dock content animates out; screen transitions to the Hunt page (wipe). |
| 200 % text | Team columns stack; dock grows; Board ready segments wrap under; code cells 48 tall with text; toolbar icons stay 48. |
| RTL | Mirror everything; code LTR; team columns order mirrored (Prey on the right); host/YOU marks localised/neutral; dock mirrored. |
| Light | as shell: ink Board, white plates, chalk ground; team tokens darker (coral `#B33A0F`, violet `#5B21B6`). |

---

## 6. Compose implementation notes

- Keep the existing `RoomViewModel`/`RoomState` and all action names (`setTeam`, `toggleReady`, `startMatch`,
  `openSettings`, `share`, `loadHistory`, `leave`). Keep `showMatchMap`, pager behaviour and tag `room_tab_*`.
- The lobby branch currently lives inside a `LazyColumn` with items (banners, roster, choose side, phase). New
  structure: `Column { RoomToolbar(); MatchBoard(); CodePlate(); TabRule(); HorizontalPager { LobbyPage,
  ChatPage } ; BottomDock }`, where `LobbyPage` is its own `LazyColumn` with `key`s (`team_sheets`, `rules`,
  optional error strip). Dock is outside the pager (always visible on both tabs? — Chat should not show the
  ready dock; hide dock when the Chat tab is selected, keep composer instead). On the chat tab the composer is
  the bottom surface; switching tabs swaps the bottom area — animate only the dock height? No: cut.
- TeamSheet: build from `state.members` grouped by `team` (Prey/Hunters) and unassigned; sort host first, then
  ready, then name. Use stable keys (`userId`). Row uses `avatar` initial, `name`, status (`data`), host mark,
  and `Modifier.selectable(role = RadioButton)` on the *column action*, not the row (rows are not buttons).
  The current user row tint 12 % team; `YOU` replaced by an `eyebrow`-free `data.small` "You" label.
- Keep `testTag("team_prey")` / `team_hunters` on the column join actions (existing tests may tap them).
- Dock: use `WindowInsets.navigationBars` padding; do not animate the button width; keep 56 height with
  `heightIn` and wrap label at large font scale.
- Board countdown not present in lobby; do not start a timer/loop.
- Share: `Intent.ACTION_SEND` with text "Join my hunt on ManHunt. Code: K7M2QX" + the install URL? Honest:
  include the code and the server/install note? Keep the existing share implementation if present; just move
  the affordance. Copy uses `ClipboardManager` and the existing "Room code copied" string.
- Host rules summary: read from `state.room.settings`/match config; hide fields the server doesn't provide;
  do not hardcode 60 min unless the server default actually returns it (it does by default, but read it).
- Leave: if `room.status != lobby` → leave sheet with consequence; in lobby → simple leave sheet (still
  confirm; a mis-tap on the back arrow now opens a sheet rather than leaving immediately, fixing audit UI-20).
- Semantics: Board as a single group; team headers heading; ready changes `liveRegion = Polite`; dock status
  is part of the button's `stateDescription` ("Begin the hunt, unavailable: waiting for Leila to ready up").

---

## 7. Premium screenshot brief

- **Shot A (hero):** dark, 1080 × 2400. Room "Riverside Run", code `K7M2QX`, 5 players: Prey = Yasmin (host,
  ready), Leila (not ready); Hunters = Omar (you, ready), Tariq (offline), Sara (ready). Dock: "Waiting for
  Leila to ready up." + `Begin the hunt` disabled (capture as host) — or capture as player with `Stand down`
  to avoid a disabled hero button. Best: **host view with all five ready and `Begin the hunt` enabled** for a
  strong action shot; use a second capture for the waiting state.
- Status bar 21:04; no notification icons; no keyboard; no "CI Room", no "AAZHZX"-style random codes.
- **Shot B (ready player):** `Ready to hunt` cyan primary, status "Pick your side." or "Ready. Waiting for the
  huntmaster."
- **Shot C (code detail):** tight crop of the Board + CodePlate + share — good for the site/OG detail.
- **Shot D (Arabic RTL):** same roster mirrored; code LTR; team names Arabic.
- **Reject:** identical cards, all-caps eyebrows, player names with random numbers, "Live" dot with no clock,
  disabled-only screen.

---

## 8. A11y / RTL / adaptive checklist

- Announce readiness and team changes (`liveRegion = Polite`); Board's `stateDescription` includes room name
  and ready count.
- Touch: team column action 48; row itself not tappable; share/code/copy 48; dock 56.
- Contrast: team tokens on plate (coral 6.6, violet 7.1); team tag text on 12 % tint (6.3/6.5); status `data`
  muted 8.3; disabled dock reason muted (not 38 %) so it is readable.
- 320 dp: columns stack; code cells 40 w with 48 hit wrapper; dock status wraps 2 lines.
- Tablet ≥840: two-column layout — left: Board/CodePlate/teams; right (min 320): room summary, rules, host
  controls; dock can become a right-aligned button within the reading column (avoid a 1000 dp-wide button).
- Tabletop: Board + code + teams top pane; dock bottom pane.
- Arabic: `HOST` → host glyph or localised word; "You" label localised; no `·` in translated lines; every
  count reading direction-safe.
