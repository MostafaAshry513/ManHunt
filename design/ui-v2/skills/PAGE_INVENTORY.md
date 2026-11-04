# PAGE INVENTORY — the real app, its states, and the 14 canonical pages

**Purpose:** designers must design pages that fit the *actual* ManHunt, not a plausible mobile game. This file
maps every canonical page in `briefs/00-workstream.md` to the real screen, labels, data and actions in the
shipped app, and lists the states that must exist. If a design invents a screen, a rule or a number not in the
data contract, reviewers will treat it as a feasibility failure.

**How to use it:** for each canonical page you design, read its block here; use the real seed data (§0), real
labels (§ per page), and cover the flagged states. The brief's "Must show" column is the contract; this file
adds the app's truth. Where the brief and the app differ, the delta is flagged — design the brief, but record
the cost in `NOTES.md` (§8).

**Sources of truth:** `android/app/src/main/java/com/manhunt/app/` (`ui/`, `data/Models.kt`, `i18n/Localization.kt`),
`docs/screenshots/premium/` (real v0.16 MATCHDAY captures, `MANIFEST.json`), legacy `docs/screenshots/*.png`
(v0.12 CI captures, for comparison only), `design/redesign/screens/*.md` (earlier Board specs, useful),
`docs/UI_AUDIT.md` / `docs/LOBBY_AUDIT.md` / `docs/ANDROID_REVIEW.md` (technical findings, still valid).

---

## 0. Canvas and canonical seed

- Logical canvas **390 × 844 dp**, render **1170 × 2532 px** (3×); full-bleed app page, **no status bar, no
  navigation bar, no keyboard, no browser chrome, no device frame**; 24 dp outer margins by default
  (`--mh-gutter`); bottom gesture area is usable canvas. One `.page` root per page, linked to the shared
  `/design/ui-v2/env/canvas.css` (repo-root path; never fork it — override `--mh-*` vars in your
  `direction.css`). Render from repo root:
  `node design/ui-v2/env/render.mjs design/ui-v2/directions/<dir>` → `<dir>/out/*.png`.
  Frozen contract: `design/ui-v2/env/README.md` §2–§4 (canvas, fonts incl. `--mh-font-arabic`/`--font-arabic`,
  mark paths, no external assets, overlays as full-page states behind `.mh-scrim`).
- Seed scenario everywhere (fictional, identical across directions):
  **"Riverside Run"**, code **K7M2QX**, **5 players = 3 Hunters / 2 Prey**, zone **240 m**, clock **41:12**
  remaining, duration **60:00**; players **Nadia, Omar, Selim, Rana, Youssef**.
  Suggested split (use consistently in all pages): Prey **Nadia, Rana**; Hunters **Omar, Selim, Youssef**;
  host/huntmaster **Omar** (or Nadia — pick one and keep it in every page of your direction).
- Finished-match timing for `result`: played **18:48**, Prey remaining **0 / 2**, winner **Hunters**.
  The brief requires a rematch action; the shipped app has no rematch (§8).
- The premium capture set used different fictional names/code (`Yasmin, Leila, Omar, Tariq, Sara`, `R9YLPP`).
  Do **not** copy those into the canonical pages — use the brief's seed. (You may look at the premium
  screenshots for the shipped visual system; they are not the page content authority.)

---

## 1. Canonical page → real surface map

| # | Canonical id | Real screen / composable | File(s) | Real route | Brief "must show" |
|---|---|---|---|---|---|
| 1 | `auth` | Sign in / create local account | `ui/AuthScreen.kt` | `Route.Auth` (`AppRoot.kt`) | quiet form, server row demoted, brand line |
| 2 | `roles` | First-run welcome + Roles / mode catalogue | `ui/RolesScreen.kt` (firstRun / normal), `data/GameModes.kt` | `Route.Safety` (firstRun=true), `Route.Roles` | Prey vs Hunters explained, Classic playable, planned modes honest |
| 3 | `home` | Host or join | `ui/HomeScreen.kt` | `Route.Home` | host action, join-by-code, profile/settings entry |
| 4 | `lobby` | Room lobby (host view, everyone ready) | `ui/RoomScreen.kt` lobby branch + `ui/LobbyBoard.kt` | `Route.Room` (`room.status == "lobby"`) | room code, team sheet, readiness, begin dock |
| 5 | `hunt-hunter` | Live hunt, Hunter view | `ui/RoomScreen.kt` `TacticalHuntPage` / `HuntSheet` / `HuntActionBar` + `ui/MatchMap.kt` | `Route.Room` (`phases HEAD_START/HUNTING/PAUSED`) | map-first, reports + trails + zone, clock, tag action |
| 6 | `hunt-prey` | Live hunt, Prey view | same as above (`me.team == prey`; `showPrey=false`) | `Route.Room` live phase | own position, zone/clock, report cadence, no other prey positions |
| 7 | `chat` | Room field log | `ui/ChatPanel.kt` inside `RoomScreen.kt` Game/Chat pager | `Route.Room` Chat tab | messages + system events, composer |
| 8 | `result` | Full time | `ui/ScorePage.kt` (rendered in-composition over RoomScreen) | finished/cancelled `MatchDto` overlay | winner, final score, duration, actions (rematch, lobby, history) |
| 9 | `history` | Past hunts | `ui/HistoryDialog.kt` | full-screen dialog from room header / result | list + one match summary |
| 10 | `settings` | Settings | `ui/SettingsScreen.kt` (5 tabs) | `Route.Settings` | theme, text size, language, permissions, updates, server |
| 11 | `sheet-tag-claim` | Prey receives tag claim | `MatchSheet` in `ui/RoomScreen.kt` (`pendingTag`) | overlay during live hunt | confirm / dispute, who / when, consequence copy |
| 12 | `sheet-room-settings` | Host edits hunt rules | `ui/RoomSettingsDialog.kt` (+ `ZonePickerDialog`) | overlay in lobby | timers, zone/shrink, trails, report interval, tag policy |
| +1 | `lobby-rtl` | Arabic RTL proof of the lobby | `RoomScreen.kt` + `LobbyBoard.kt` under `LocalLayoutDirection.Rtl`, `i18n/Localization.kt` Arabic map | — | genuinely mirrored lobby, LTR numerals/code |
| +1 | `home-light` | Light-theme proof of Home | `HomeScreen.kt` under light `ManHuntTheme` | — | same Home in "daylight chalk" light theme |

Other real surfaces not in the canonical set: cold-start `StartupBrandScreen`, leave/end confirm `MatchSheet`s,
tag-target picker sheet, huntmaster dispute sheet, zone-picker map dialog, connection/loading/error states,
update steps. They are listed in §5 — use them as evidence for states; do not replace a canonical page with them.

---

## 2. Data contract — what the UI can actually know (use real fields)

`data/Models.kt` is the contract. Never show a value that is not in it.

| Model | Fields the UI reads | Screen use |
|---|---|---|
| `RoomInfo` | `id, code, name, adminId, status` (`"lobby"`/`"active"`), `settings` | Home→Lobby header, Board |
| `SettingsDto` | `headStartSec` (default 300), `durationSec` (3600), `minPlayers` (2), `locationIntervalSec` (300), `trailsEnabled` (true), `mode` (`"open"`/`"zone"`), `zone`, `shrink`, `tagPolicy` (`"confirm"`) | Lobby ready/begin blockers, hunt rules sheet, hunt report cadence |
| `ZoneDto` | `centerLat, centerLng, radiusM, nextShrinkAt?` | Board gutter (`ZONE 240 m`), map ring, shrink countdown |
| `ShrinkDto` | `enabled, intervalSec (120), stepM (25), minRadiusM (100), warningSec (30)` | Hunt rules sheet, shrink countdown |
| `MemberDto` | `userId, username, team` (`prey`/`hunters`), `ready, connected, eliminated, isAdmin` | Team sheets, roster, readiness, status labels |
| `MatchDto` | `id, phase` (`lobby`/`head_start`/`hunting`/`paused`/`finished`/`cancelled`), `status, startedAt, headStartEndsAt, endsAt, endedAt?, now, winner?, preyAlive, preyTotal, zone` | Board, countdown, result |
| `RoomState` | `room, members, match?, pendingTags, serverNow` | whole room |
| `PendingTagDto` | `id, matchId, hunterId, preyId, createdAt, expiresAt, disputed` | tag claim/dispute sheets + persistent banners |
| `ChatMessage` | `id, userId?, username` (default "System"), `kind` (`"chat"`/`"system"`), `body, createdAt` | field log |
| `PreyLocationStatus` | `userId, username, lat?, lng?, accuracy?, recordedAt?, receivedAt?, stale, flagged, eliminated, hasReport` | Hunter map markers + prey status list |
| `LatestLocations` | `now, staleAfterMs, prey[]` | hunter reports |
| `TrailPoint` / `TrailResponse` | `lat, lng, accuracy?, recordedAt, flagged` / `trailEnabled, points[]` | trails overlay (hunters only, on demand) |
| `MatchHistoryEntry` | `id, startedAt, endedAt?, winner?, cancelled, durationSec?, prey[], hunters[]` | history rows/summary |
| `AppUpdate` | `versionCode, versionName, url, sha256, size, publishedAt?, notes?` | Settings → Updates ("update available" state) |
| `MatchSummary` | `id, phase, startedAt, endsAt, endedAt?, winner?, preyAlive, preyTotal, zone` | source for the honest result snapshot |

Client UI state (what can render): `RoomUi` (`state, locations, trails, trailsVisible, pendingTag, pendingDispute,
notice, history, historyLoaded, historyError, connected, loading, busy, error, left`), `ChatUi` (`messages,
sending, error, hasMore, loadingOlder`). Important truths for designers:
- **`connected` exists but is not rendered** → the offline/reconnect state is a *gap* you must design (§6).
- One global `busy` flag gates several actions; one `error` field is shared. Design must make failure **local
  to the action** (strip next to the control) even though the implementation will need a small split.
- No per-action timestamps for "last updated"; if you show "last report 12 s ago", it must be derived from
  `receivedAt`/`recordedAt` (real) — do not invent a freshness number.

---

## 3. `auth` — sign in / create local account

**Brief must show:** quiet form, server row demoted, brand line. **Real:** `AuthScreen.kt`; first screen only
after the first-run safety/roles step; sign-in and registration are one form with a mode toggle.

**Real content & data (design the same):**
- Brand line in display type: **"Hide from your friends."** (heading semantics), drawn field plate above the
  form (`BrandFieldPlate`, 200 dp, animated unless reduced motion).
- Fields: **"Username"** (3–24 letters/numbers/underscore; helper "At least 3 characters", error "Username is required")
  and **"Password"** (≥8, max 200; helper "At least 8 characters", error "Password must be at least 8 characters";
  show/hide password FieldMark with content description "Show password"/"Hide password").
- Primary action: **"Sign in"** / **"Create account"** (disabled until valid, loading state on the button).
- Mode link: **"New here? Create an account"** / **"I already have an account"**.
- Server row demoted below a chalk rule: `Game server · http://…` data line + **"Change server"** link;
  expanded setup: **"Server address"** field, helper "The server your phone connects to.",
  **"Test connection"** → statuses **"Server is reachable"** / **"Server did not respond. Check the address."**,
  plus **"Save server"** / **"Cancel"**. Not a card, not above the form.
- Footer: version data line `v0.16.1 · free APK · Android 8+` (`BuildConfig`, real).
- Real error strip with **"Try again"** (assertive announcement).

**States to design (must exist):** default; field validation (username too short / password too short);
submitting/loading (button label + rule, fields disabled); server error strip; server setup expanded; server
test in-flight and success/failure; RTL/light system notes.
**Screenshot refs:** no clean premium auth capture yet (`s01-auth` was rejected for showing a dev host; `pending`s18-auth-loading`);
legacy `docs/screenshots/01-auth.png` is the *old* UI — do not copy its card/gradient look.
**Delta:** registration and sign-in are the same screen; design both labels, not two screens.

---

## 4. `roles` — sides + mode catalogue (first run / re-read)

**Brief must show:** Prey vs Hunters explained, Classic playable, planned modes honest.
**Real:** `RolesScreen.kt` + `data/GameModes.kt`; reached as first-run welcome (`firstRun=true`) and later via
Home "Read the roles". Current implementation is **still legacy** (HeroBanner gradient + `ScreenCard`s + paw
icon) — redesigning it is expected, not optional.

**Real content & data:**
- First-run: **"Welcome to ManHunt"** / "Real-world hide-and-seek — here's how it works."; normal: **"Roles"** /
  "How each side plays, and what modes are coming."
- Mode catalogue (`GameModes.all`, pages): **"Classic hunt"** — tagline **"Two teams. One block. One clock."**,
  summary "The original real-world game: Prey hide and share their position, Hunters track them down and tag
  them in person." (`available=true`); **"Single Prey"** — "One prey. No backup." (planned); **"Shrinking Zone"** —
  "The walls close in." (planned). Planned modes show **"Coming soon"**, **"Classic is the only playable mode
  right now."**, and **"Play Classic instead"** (never a dead end).
- Sides: **"The two sides"** → **"Prey — you hide"** (coral) and **"Hunters — you chase"** (violet) with the real
  rules paragraphs (copy in `Localization.kt`, translated): prey share position at the room interval; survive
  to win; hunters see latest positions + trails if allowed; tag by touching, each tag confirmed; tag every prey.
- **"How a hunt runs"** 5 steps: create/join → pick side → ready → head start → tag/confirm → ends on timer or all prey tagged.
- First-run dock: **"Let's play"** (requests location + notifications **on first run only**, never mid-hunt);
  later: **"Close"**. Footer "ManHunt · Hide from your friends.".
- Pager dots + "Swipe to see all modes · classic is playable today".

**States to design:** first-run vs re-read entry; classic page; planned-mode page (honest "coming soon");
permission-request explanation if you place it (the real first-run requests permissions on "Let's play");
long-content/scroll; RTL/light notes. **Do not** present planned modes as playable; no store/beta language.
**Screenshot refs:** premium `s02-safety.png` (first-run welcome, current legacy look), legacy `docs/screenshots/03-roles.png`.
**Delta:** the brief calls this "Sides + mode catalogue"; the app's first-run also carries the safety/permission
moment (approved safety copy exists in `Localization.kt`). If you include safety copy, use it verbatim.

---

## 5. `home` — host or join

**Brief must show:** host action, join-by-code, profile/settings entry. **Real:** `HomeScreen.kt`, current
MATCHDAY implementation (this is the reference for how far the shipped system already got).

**Real content & data:**
- Masthead (`Masthead`): drawn **01 Open Zone mark** + **MANHUNT wordmark** (20 dp cap), device local time
  `HH:mm` in data face, settings `FieldMark` button (48 dp).
- Drawn field plate band (120 dp, animated/static).
- Permanent line **"Hide from your friends."** in display type.
- Host block: caption **"Host a hunt"** + field **"Hunt name"** (max 30; blank falls back to "ManHunt",
  2-char minimum with error "Hunt name must be at least 2 characters") + primary **"Create hunt"**
  (real disabled/loading state; error strip + "Try again").
- Chalk rule; join block: **"Join a hunt"** + six-cell **CodePlate** (real six uppercase letters/digits;
  partial helper "Enter the 6-character invite code") + outline **"Join hunt"** disabled until 6 characters;
  error "Could not join that room…"/server message + "Try again".
- Footer: **"Read the roles"**, **"Playing as {username}"**, **"Sign out"**, version data line.
- Settings entry is the masthead FieldMark; there is no profile block and no avatar.

**States to design:** default signed-in, host field empty/filled, join code empty/partial(1–5)/complete(6),
create/join loading, create/join error, missing hunt-name error, signed-out not applicable, light theme
(`home-light` proof), offline (create/join disabled + reason), RTL system notes. There is **no**
"active hunt" state on Home in the app — do not invent a resume banner unless flagged as a proposal.
**Screenshot refs:** premium `s03-home.png` (dark, exactly this screen), `s15-home-light.png` (light),
`s04-home-rtl.png` (Arabic Home). **Use these as the shipped baseline; beat them, don't clone them.**
**Delta:** brief says "profile/settings entry" — the app has settings via the masthead mark and identity via
"Playing as"; no profile screen. Keep it that way or flag a proposal.

---

## 6. `lobby` — room lobby, host view, everyone ready

**Brief must show:** room code, team sheet, readiness, begin dock. **Real:** `RoomScreen.kt` (lobby branch),
`LobbyBoard.kt` (`LobbyBoard`, `TeamSheet`, `LobbyDock`); actual MATCHDAY implementation.

**Real content & data (host = isAdmin, all 5 ready):**
- Room header strip: leave/logout icon (48 dp), share icon, history icon. (Current header is sparse/legacy-ish;
  redesign it as part of the system.)
- `LobbyBoard`: `StateTag` **LOBBY** (outline, not live), room name **"Riverside Run"** title, right gutter
  `5 / 5 READY` data, room code **K7M2QX** in cyan data (tap to copy → notice **"Room code copied"**), and a
  readiness segment row (up to 8 × 14×4 dp ticks; ready ticks cyan).
- Invite code block: caption **"Invite code"** + six-cell `CodePlate` (read-only in the lobby).
- Game/Chat switch (current Material TabRow; redesign as the Board system; Chat = field log).
- `TeamSheet` two columns: **PREY** (coral, glyph + 2 dp rule + count) and **HUNTERS** (violet). Rows 56 dp:
  initial avatar 32 dp, name (title 17), status dataSmall (`Ready`/`Gearing up`/`Offline`/`Tagged`), badges
  `HOST`, `YOU`, ready check glyph; `TeamTag` at the bottom of each column is the side-selection action
  (selected = 2 dp team border + 20 % tint).
- Host action **"Hunt rules"** inline link (opens `sheet-room-settings`).
- `LobbyDock` (bottom): host sees blocker/status line (real blocker copy: "Need 2 players", "No prey yet",
  "No hunters yet", "Waiting for {names} to ready up") + inline **"Ready to hunt"/"Stand down"** (host is a
  player too) + primary **"Begin the hunt"** (disabled until no blockers; loading state).
  Players see one primary **"Ready to hunt"** / outline **"Stand down"**.
- Notice strip for transient confirmations (`secondaryContainer` today; restyle in system).

**States to design (required):** host + everyone ready (canonical); host + blockers (Begin disabled with the
reason adjacent); player view (ready / not ready); empty team ("No prey yet"/"No hunters yet"); >5 players
(8 ready ticks cap; long names; 2-column → stacked below 300 dp); one member offline; a member tagged last
match (lobby must not show TAGGED — known L-01 bug class); room load state ("Connecting to room");
room load error + Try again (no dead end); leave confirm (admin/active: "You are abandoning this hunt. It runs
without you." vs "You will leave the room and lose your spot in the lobby."); room code copying feedback;
RTL proof variant `lobby-rtl`.
**Screenshot refs:** premium `s05-lobby-host.png` (host, all ready), `s06-lobby-player.png` (player, waiting);
`s16-lobby-rtl` is pending (design it fresh); legacy `docs/screenshots/04-lobby.png` is old UI — comparison only.
**Delta:** brief says "begin dock"; host must also be able to ready up themselves (real behavior). Show that.

---

## 7. `hunt-hunter` — live hunt, Hunter view

**Brief must show:** map-first, reports + trails + zone, clock, tag action. **Real:** `RoomScreen.kt`
`TacticalHuntPage` (`HuntSheet`, `HuntActionBar`, `HuntDetails`) + `MatchMap.kt`; this is the page the owner
most wants fixed (clock/state/map hierarchy; shipped HUD is still partly legacy Material).

**Real content & data (phase `hunting`, seed):**
- `MatchBoard`: state **LIVE** (cyan live dot + cyan state), clock **41:12** (`MM:SS`, tabular, from `endsAt`
  + server `now` offset), right gutter **ZONE 240 m**, second gutter **PREY 2 / 2** (hunters only). Board is
  pinned above the map; map is inset by it, not covered (current implementation: Column Board → map weight).
- Full-bleed `MatchMap`: real OSM tiles dark-filtered; own position (cyan); prey markers coral (fresh) and
  amber/dim (stale/flagged; current code uses amber `#F0A43A` for stale so it is not confused with fresh coral);
  zone ring cyan ~2 dp + 12 % fill; trails coral when toggled; zoom +/− and recenter controls.
- Sheet (bottom): status line ("Prey positions are the latest reports"; head start: "Prey are hiding. Hunting
  starts in"; paused/spectator variants), zone line + **"Zone shrinks in MM:SS"** when shrink enabled,
  expand chevron; **"Tag prey"** primary (only during `hunting`, not head start/paused/eliminated) +
  **"Trails"/"Hide trails"**; OSM attribution **© OpenStreetMap contributors** (must stay visible);
  error strip; pending claim(s) floating above the sheet.
- Expanded details: **"HUNTMASTER"** section (host): **"Pause hunt"** / **"Resume hunt"**, **"Hunt rules"**,
  **"End hunt"** (destructive); **"View hunt history"**; prey status list (per prey: `Live`/`Stale`/
  `No report`/`Tagged`/`Unverified`); **"You were tagged"** notice if eliminated; **Hunt roster** (all members
  + team + `HOST`/`TAGGED`/`Offline`).
- Real tag flow: target picker sheet **"Who did you tag?"** → body "You must be physically touching the prey.
  False claims can be disputed." → list of eligible prey (empty: **"No eligible prey"**) → claim sent notice
  **"Tag claim sent - waiting for the prey to confirm"**; prey confirms/disputes; result notice
  **"Tag confirmed"** / **"Tag disputed - the admin will decide"**; disputed tag → host sheet
  **"Disputed tag"** with **"Confirm tag"** / **"Reject"**.

**States to design (required):** hunting with fresh + one stale report (canonical); no reports yet
("No reports yet. Prey report every {n} minutes." — hunter-only empty state); head start (no Tag action,
hunting countdown); paused (unmistakable, clock stopped, host resume); eliminated hunter? (not a thing —
prey only) / eliminated prey view is `hunt-prey`; GPS states for the hunter (map still works without location;
"Waiting for GPS" belongs to prey); offline/reconnecting (keep last reports, mark age, disable Tag);
trails on/off and empty-trail notice **"No trails available yet"**; pending claim banner; long names/many
players in roster; tag picker empty; tag claim failure; map tiles loading (keep field colour, no grey
checkerboard); RTL (map not mirrored; chrome is).
**Screenshot refs:** premium `s07-hunt.png` (hero: real map, zone, coral trail, clock 41:12, Tag dock),
`s08-hunt-claim.png` (prey claim over map), `s09-tag-target-sheet.png` (target picker). These are the shipped
baseline; the hunt sheet/HUD still show pills/rounded chrome — beat that.
**Delta:** report cadence on hunter view — brief only requires "reports + trails + zone"; showing "last report"
freshness is real (`receivedAt`/`stale`), showing "next report in" is not exposed to hunters. Keep to real data.

---

## 8. `hunt-prey` — live hunt, Prey view

**Brief must show:** own position, zone/clock, report cadence, **no other prey positions**.
**Real:** same `TacticalHuntPage` with `me.team == prey`; `MatchMap(showPrey = false)`; no Tag action.

**Real content & data:**
- `MatchBoard`: **LIVE** + clock; **ZONE 240 m**; no `PREY n / n` gutter (hunters only).
- Full-bleed map: **own position only** (cyan dot); zone ring; no prey markers, no trails (a prey must never
  see another prey's location — this is a hard product rule, not a design choice).
- Sheet status line (real strings): **"Sharing your position"** / **"Waiting for GPS"** /
  **"Open the app to resume sharing"** / **"Location off"** / **"Turn on location services"**;
  zone + shrink countdown when applicable; GPS action when needed: **"Enable GPS"** / **"Allow in settings"** /
  **"Turn on"**.
- Report cadence: the room's `locationIntervalSec` (seed 5 min) is the real interval; the phone reports while
  the hunt is active and visible. A designed cadence readout (e.g. "Reports every 5 min · last sent HH:mm") is
  allowed if it is honest — "next report in" countdown needs new client state: flag it in NOTES if you use it.
- Claim moment: `sheet-tag-claim` overlays this page; dismissed claims stay as a banner on this page.
- Eliminated (tagged) state: status line **"You are spectating this match. You can still chat, but you cannot
  tag or share new positions."** + a **"You were tagged"** notice; board continues; map keeps own position only;
  no GPS/track actions; chat still works.

**States to design (required):** hunting/sharing (canonical); head start (prey hiding, clock to hunting);
GPS permission not asked / denied / denied permanently / services off / waiting for first fix; paused;
eliminated/spectating; pending tag claim (the moment); offline/reconnecting (last state kept, actions disabled);
RTL (map not mirrored, chrome mirrored); long Arabic status strings.
**Screenshot refs:** premium `s08-hunt-claim.png` is the prey view + claim; no clean plain prey-hunt hero exists
— `s07-hunt.png` shows the layout but as hunter (Tag action, prey markers) — do not copy hunter data into prey.
**Delta:** brief "report cadence" is the only point without a shipped equivalent; treat it as an information
design problem with honest data, not a fabricated countdown.

---

## 9. `chat` — room field log

**Brief must show:** messages + system events, composer. **Real:** `ChatPanel.kt` (shipped MATCHDAY field log).

**Real content & data:**
- Rows: mono `HH:mm` in a 44 dp gutter, sender name (`label`; own messages in cyan today), body `body` chalk,
  1 dp hairline between rows; **no bubbles, no tails, no cards**. System rows (`kind == "system"`):
  centred `dataSmall` line between two hairlines (e.g. match/tag/system events).
- Empty state: **"No messages yet. Say hello."** (currently a centred sentence — redesign per state system).
- Composer: 52 dp plate input, placeholder **"Message"**, square 52 dp send action with `FieldMarks.send`
  (content description "Send message"), disabled when blank/sending; draft **kept on failed send**;
  error banner above composer; **"Load older messages"** with loading state; messages page at 50, up to 500.
- During a hunt the chat is a tab beside the Game page; the tab switch shows an unread badge (count by
  message id).
- The result does **not** open over the chat (shipped ScorePage is in-composition) — keep that.

**States to design (required):** populated field log with realistic hunt messages + at least one system event;
empty; sending (in-flight); send failure (draft preserved, retry); load-older in-flight/loaded; offline
(composer disabled with reason, strip visible); long thread; long names; RTL (composer text alignment, time
gutter mirror, numerals LTR); keyboard-open state is **not** rendered on the canvas but note IME behavior.
**Screenshot refs:** premium `s11-chat.png` (shipped field log), legacy `docs/screenshots/06-chat.png` (old
bubbles — comparison only).
**Delta:** the app has no per-message "delivered" state; don't invent one.

---

## 10. `result` — full time

**Brief must show:** winner, final score, duration, actions (rematch, lobby, history). **Real:** `ScorePage.kt`,
rendered full-screen in-composition when the player watched the match go active.

**Real content & data (Hunters-winning seed):**
- `MatchBoard` variant: state **FULL TIME** (or **CANCELLED**), clock = **played duration 18:48** with note
  **"played"**, gutter **PREY 0 / 2**, second gutter **HUNTERS** (winner team, uppercase data label).
- Winner word in display XL: **"Hunters win."** / **"Prey win."** / **"Hunt cancelled"** (sentence case, full
  stop, no exclamation — `ScorePage.kt` strips the legacy `!`).
- Score line: **"Prey remaining: 0 / 2"** in mono; omitted when final counts are unknown (honest degradation).
- Drawn field plate as the "trail map" stand-in (allowed this sprint; a real map snapshot is a later engine
  item — do not draw fake OSM streets).
- Final team sheets: two columns, per-player names + **TAGGED** for eliminated prey (only when the captured
  flags agree with the authoritative score); no invented "survivors".
- Actions: primary **"Back to lobby"**, outline **"View hunt history"**. **No rematch in the app** — brief
  requires showing one: design it as a proposed action and flag "rematch needs a server/API addition; not
  shipped" in NOTES.md (see §8).
- Cancelled variant: state **CANCELLED**, winner word **"Hunt cancelled"**, same structure; score line only if
  known.
- Prey-win variant: honest **2 / 2** remaining (both prey alive at full time) — the premium manifest documents
  this as the only honest state; never fabricate "1 prey survived".
**States to design (required):** Hunters win (canonical); Prey win (honest 2/2); cancelled; result sync
loading (server summary fetch can lag — show the winner immediately, never hide it); final report/map
unavailable; many players; RTL (winner word, board, team sheets; numerals LTR); light theme system notes.
**Screenshot refs:** premium `s12-result-hunters.png`, `s13-result-prey.png`; legacy `docs/screenshots/08-hunt-result.png`
is the old dialog over the keyboard — explicitly the failure this page fixes.
**Delta:** rematch (§8). Also brief says "final score" — the real score line is **prey remaining**, not a
football score; keep that honest.

---

## 11. `history` — past hunts

**Brief must show:** list + one match summary. **Real:** `HistoryDialog.kt` (shipped MATCHDAY full-screen page).

**Real content & data:**
- Header **"Hunt history"** + back (48 dp).
- List grouped by date: date in `data` + hairline; rows ≥72 dp: start time `HH:mm` (64 dp gutter),
  duration `M:SS` (52 dp gutter), result word in the winner team colour (**"Hunters won" / "Prey won" /
  "Hunt cancelled" / "In progress"**), 6×6 dp accent dot, team names line ("Prey: … · Hunters: …" — in real
  data, `prey[]`/`hunters[]`); 1 dp hairline between rows. No chevrons.
- Loading: 3 skeleton bars (no shimmer). Error: error strip with retry — **must never masquerade as empty**
  (regression fixed in shipped code; keep that). Empty: **"No hunts in this room yet."** +
  **"Hunts appear here once they finish."**
- Data is **per room** (`repo.history(roomId)`), not global account history.

**States to design (required):** populated list (3–5 matches, one Hunters win, one Prey win, one cancelled);
one **match summary** (brief requires it — the app has no expand/detail row yet: design a selected-row summary
or a small detail block; note that only date/time/duration/winner/team names are real, no per-player tags/score
unless you use the same honest-data rules); loading; empty; error; many matches (scroll); RTL; light notes.
**Screenshot refs:** no premium capture of the shipped history page; legacy `docs/screenshots/06-chat.png`-era
history didn't exist as a page (it was a dialog). Design fresh; premium `s12-result-hunters.png` shows the
entry point.
**Delta:** brief "one match summary" is a design proposal; data supports date, duration, winner, cancelled,
team rosters — nothing deeper.

---

## 12. `settings` — settings

**Brief must show:** theme, text size, language, permissions, updates, server. **Real:** `SettingsScreen.kt`
(still partly legacy: `ScreenCard`, 5 icon-only `TabRow` tabs, Material `Switch`, `Slider`-style custom
`BoardScaleSlider`; redesigning as a ruled manual is expected).

**Real content & data (5 sections):**
1. **Appearance**: **"Theme"** — **"Dark" / "Light"** segmented choice (2 dp plates; selected 2 dp cyan border
   + 12 % tint); **"Text size"** — `85 %…135 %` slider with 11 stops, live **"Preview only: the app applies this
   size when you release the slider."**, example sentence "Hunters see prey positions every few minutes."
2. **Language**: **"English" / "العربية"**; note **"Language applies immediately and mirrors the whole layout."**
3. **Permissions**: **"Location"** card → **"Precise location"** (`Allowed`/`Not allowed`, explanation "Required
   while you play as Prey in an active match.", action **"Manage"**/**"Allow"** opens system settings);
   **"Notifications"** card → **"Tracking notice"** (Android requires a visible notification while location
   tracking is active) + **"Match notifications"** switch ("Get notified when someone claims a tag, a hunt
   starts or ends.").
4. **Updates**: **"Updates"** — **"Installed v0.16.1 (…)"**, **"Check for updates"** (checking state),
   **"Update available: vX"** / **"You are up to date"** / error, release notes/date, **"Download update"**
   (real % progress + "Downloading... N%"), **"Update ready to install"** + **"Install update"**, then
   **"What's new"** (manifest notes or the bundled `Changelog` entries v0.16.1…).
5. **Account**: **"Account"** → **"Signed in as {user}"**; **"Server"** card → current URL + **"To change the
   server, sign out and edit it on the sign-in screen."** (read-only); **"Storage"** → cache size
   (`Calculating…` / bytes / `0 B`) + **"Clear cache"**; **"Sign out"** (destructive/error colour).

**States to design (required):** default theme/text size; language selected Arabic (then the page switches RTL —
design notes); permission allowed vs not allowed; match notifications on/off; update available (the required
"update available" state) / up to date / checking / download progress / download failed / install ready /
install blocked (unknown sources); cache calculating/cleared; signed-in identity; RTL and light system notes.
**Screenshot refs:** premium set has no clean settings capture (`s14-settings` was rejected for a slider
defect; it is listed as removed). Legacy `docs/screenshots/07-settings.png` is the old card/tab UI — do not copy.
**Delta:** brief says "server" in settings — the shipped app makes it read-only here (change on Auth). Keep
that behavior or flag a proposal; do not show an editable server field with no save path.

---

## 13. `sheet-tag-claim` — prey receives a tag claim

**Brief must show:** confirm / dispute, who / when, consequence copy. **Real:** `MatchSheet` in `RoomScreen.kt`
(`ui.pendingTag`); shown as a full-page app state with the hunt dimmed.

**Real content & data:**
- Title **"Tag claim"**; body **"{Hunter username} says they physically touched you. Confirm the tag?"**
  (hunter name comes from `pendingTags[].hunterId` → `members`); the claim has `createdAt`/`expiresAt` — a
  **when** exists in the data (relative "just now"/time of day) but the shipped sheet does not render it:
  showing it is a small, honest addition (call it out in NOTES).
- Actions: primary **"Confirm"**, outline **"Dispute"** (stacked, 56/48 dp); busy state disables both;
  error on failure keeps the sheet open with a retry (shipped behavior: `pendingTag` is restored).
- Dismissing the sheet is allowed but the claim becomes a **persistent banner** on the hunt page:
  "A tag claim is waiting for your answer." / "Confirm or dispute it to keep the hunt fair." /
  action **"Review tag claim"** — never loses the decision.
- After the answer: notice **"Tag confirmed"** or **"Tag disputed - the admin will decide"** (transient strip,
  not a toast-only). If disputed, the huntmaster gets the **"Disputed tag"** sheet:
  body "{Hunter} says they tagged {Prey}, and they dispute it. Confirm or reject the tag." actions
  **"Confirm tag"** / **"Reject"** (destructive tone); resolution notice "Disputed tag: confirmed/rejected".
- Consequence copy: when a prey confirms, they become eliminated → spectating (see `hunt-prey`); when disputed,
  the huntmaster decides. Design must make the consequence legible **before** the tap ("Confirming means
  you're out and spectating" / "The huntmaster decides a disputed claim"). Do not invent a different rule.
**States to design (required):** incoming claim (canonical); busy/confirming; error + retry; dismissed-claim
banner; disputed-tag state for the huntmaster; resolution confirmation. RTL: hunter name, sentence order,
buttons; numerals (time) LTR.
**Screenshot refs:** premium `s08-hunt-claim.png` shows the current claim UI over the hunt (banner style);
legacy `08-hunt-result.png` shows the old dialog era — not the target.

---

## 14. `sheet-room-settings` — host edits hunt rules

**Brief must show:** timers, zone/shrink, trails, report interval, tag policy. **Real:** `RoomSettingsDialog.kt`
(still a Material `AlertDialog` — converting to a MatchSheet is expected) + `ZonePickerDialog`.

**Real content & data (validated client-side, enforced server-side):**
- Title **"Hunt rules"**; intro **"Applies to the next match. Rules are enforced by the server."**
- **Timing**: **"Prey head start (minutes)"** (0–999; seed 5), **"Match duration (minutes)"** (1–999; seed 60),
  **"Location report interval (minutes)"** (1–999; seed 5). Whole numbers only.
- **"Hunters can see trails"** switch (seed on).
- **Play area**: **"Open" / "Zone"** choice; when Zone: **"Zone radius (metres)"** (seed 240),
  **"Use my location"** (fresh fix every press; errors "Allow location access to use your position" /
  "Could not get your location. Check location services."), **"Zone centre set"/"Zone centre not set"**,
  **"Pick on map"** → full-screen zone picker ("Tap the map to place the zone centre", "Drag to move the map,
  tap to set the centre", Close), **"Latitude"/"Longitude"** manual fields (5-dp formatted), **"Enter coordinates
  manually"**, **"Shrink over time"** switch + **"Every (min)"** + **"By (m)"** (seed: off, 120 s, 25 m,
  min radius 100 m, warning 30 s).
- Footer **"Save"** / **"Cancel"**; validation errors: "Enter whole numbers for the timing fields",
  "Enter a valid latitude and longitude", "Enter a valid zone radius in metres", "Enter valid shrink values".
- **Tag policy**: `SettingsDto.tagPolicy` exists (default **`confirm`**) but there is **no UI control in the
  app**. The server does support exactly two values: **`confirm`** (default — tag goes `pending`; the prey gets
  the claim sheet and confirms or disputes) and **`instant`** (tag is immediately confirmed, the prey is
  eliminated, and **no claim sheet is sent**). Both are documented in `docs/API.md` (~§ tags, settings table) and
  enforced in `server/src/domain/match.ts` (`tagPolicy: z.enum(['confirm','instant'])`) / `server/src/rooms.ts`
  (`instant` path). Brief requires showing tag policy, so there are two honest options:
  **(a) safer — current behaviour only:** one read-only ruled row ("Tag confirmation — On · server-enforced")
  plus a NOTES line that a per-room control is not shipped (zero client work); or
  **(b) allowed costed proposal — a confirm/instant choice** using exactly those two labels, with the
  consequence spelled out in copy and in NOTES: `confirm` = prey confirms/disputes (the claim sheet exists);
  `instant` = no claim sheet, the prey is eliminated immediately and only spectates. If you show `instant`
  selected, also state (NOTES or a small frame) what happens to the tag-claim page under it — the sheet cannot
  appear for that room. **Do not invent a third value** and do not imply the choice is cheat-proof.
  Cost of (b): **client-only** — the settings payload already accepts `tagPolicy`, the server already enforces
  both values; it needs the control + copy + Arabic strings + tests. Flag the chosen option in NOTES.
**States to design (required):** open-area rules (canonical, seed values); zone-area rules expanded (map picker
entry, lat/lng, shrink on); validation errors; busy/save loading; save success (notice "Settings saved",
returns to lobby); location-locating state; zone centre not set; RTL (inputs, coordinates LTR, slider
direction) and light notes.
**Screenshot refs:** none premium (not captured); `ZonePickerDialog` full-screen map is the real pattern for
map placement. Legacy code is the only current visual reference — redesign from the system.

---

## 15. `lobby-rtl` — Arabic RTL proof (lobby)

**Brief must show:** genuinely mirrored lobby, LTR numerals/code. **Real:** `RoomScreen.kt` lobby + `LobbyBoard.kt`
rendered under `LocalLayoutDirection.Rtl` with Arabic strings from `i18n/Localization.kt`.

**What is real in the app today (use as constraints, not as finished design):**
- Arabic strings exist for the lobby: room code label ("رمز دعوة"), "مستعد" (Ready), "غرفة الانتظار"
  (lobby), "الفريسة"/"الصيادون" (Prey/Hunters), "مستعد للمطاردة" (Ready to hunt), "ابدأ المطاردة"
  (Begin the hunt), "حكم المطاردة" (Huntmaster), blockers ("تحتاج … لاعبين", "لا توجد فرائس بعد",
  "في انتظار … ليستعد"), "اختبئ من أصدقائك." (Hide from your friends.).
- Layout mirrors via `LocalLayoutDirection`; `CutCornerShape(topEnd)` mirrors automatically.
- **Known real gaps to solve in the proof:** some labels are hard-coded uppercase Latin (`HOST`, `YOU`,
  `READY`, `PREY`/`HUNTERS` in components); the room code/numerals are Latin and must be explicitly LTR
  (wrapped/isolated) so bidi does not reorder them; no `·` separators in Arabic; no tracking in Arabic;
  Arabic display uses the UI Arabic face, not Big Shoulders; names may be Arabic-script and longer.
- Real Arabic names for the seed are yours to choose (fictional); keep code **K7M2QX** and numerals Western
  digits, LTR. All five players must have plausible Arabic names; both teams populated; readiness visible.

**States to design:** canonical host view mirrored, with blockers/Begin; one alternate state (player view or
not-all-ready) is a bonus. Must prove: mirrored hierarchy, mirrored TeamSheet columns (Prey first in reading
order), back/share glyphs mirrored appropriately, code and numerals LTR, no clipped Arabic, Arabic button labels
not truncated.
**Screenshot refs:** `docs/screenshots/premium/s04-home-rtl.png` shows real Arabic Home (not lobby);
`s16-lobby-rtl.png` is pending in the manifest — this proof page is exactly that missing capture.

---

## 16. `home-light` — light theme proof

**Brief must show:** same Home in "daylight chalk" light theme. **Real:** `HomeScreen.kt` under light
`ManHuntTheme` (`Theme.kt` `LightColors`); premium `s15-home-light.png` shows the shipped light Home.

**Light tokens that are real:** ground `#F7F9FC`, onBackground ink `#0F172A`, surface `#FFFFFF`,
surfaceVariant `#E6ECF5`, onSurfaceVariant `#475569`, outline `#B6C2D4`/`#D3DCE8`, primary cyan
`#0C6B84`, violet `#5B21B6`, coral `#B33A0F`, error `#B91C1C`. The **Board stays ink** `#0B1220` in light
theme (a scoreboard does not change colour with the weather); masthead is light with ink wordmark.
**Content:** identical to `home` (same seed, same actions). Prove the system translates, not a second identity.
**States to design:** default Home light; note dark counterpart parity. No gradients, no pure white card
stack, no "cream".
**Screenshot ref:** premium `s15-home-light.png` — the shipped baseline.

---

## 17. Other real surfaces (states evidence, not canonical pages)

Use these to prove the state system and to avoid inventing behaviour; do not let them replace a canonical page.

| Surface | Real behavior / copy | How to use |
|---|---|---|
| Cold start | `StartupBrandScreen`: 1.4 s Open Zone reveal (ring, coral dot, survey ticks, wordmark), reduced-motion static 900 ms; skippable after first composition | Notes for brand motion; not a canonical page |
| Room load | state null → "Connecting to room" + loader; failure → error + **"Try again"** | Loading/error pattern (redesign it: no full-screen spinner) |
| Leave confirm | `MatchSheet` "Leave the room?" body depends on active hunt; destructive **"Leave"** + **"Cancel"** | Destructive-action grammar |
| End hunt confirm | `MatchSheet` "End the hunt?" / "This ends the hunt for everyone and returns the room to the lobby." / **"End hunt"** | Destructive-action grammar |
| Dispute (huntmaster) | `MatchSheet` "Disputed tag" + "Confirm tag"/"Reject" | `sheet-tag-claim` sibling state |
| Tag target picker | `MatchSheet` "Who did you tag?" + eligible prey list; empty "No eligible prey" | Hunt action state |
| Zone picker | full-screen map dialog, tap to set zone centre, Close | `sheet-room-settings` sub-state |
| Offline/reconnect | **not designed in the app** (`connected` never rendered); requests fail into banner/strip; 10 s polling fallback vs socket | **Design the state** (required by brief); keep last-known data |
| Session expired in room | 401 → `left=true` → back Home with no explanation | Design a session-expired state; do not silently bounce |
| Update available | Settings → Updates; real `AppUpdate` (version, size MB, release date, notes, SHA-256) and download progress | Required "update available" state |
| Deep link / invite | `manhunt://join?code=`; auto-joins after consent+session; failure toast "Could not join that room. Check the invite link."; share text uses `{serverUrl}/join?code={code}` | Task says flag invite/deep-link states — design invite on lobby (code plate + share) and a deep-link failure state on Home (strip, not toast) |
| Notification permission denied (API 33+) | Tracking foreground service still shows a notification; match notifications are a user switch | Settings → Permissions state |

---

## 18. State coverage — what designers must actually show

The brief requires "realistic states where the page has them: empty/loading/error/offline/reconnecting/
paused/eliminated". The review will check the page set against this list. Minimum per page:

| Page | Required state in the canonical frame | Must also be designed (notes or second frame) |
|---|---|---|
| auth | default quiet form | loading submit; field error; server error; server setup expanded |
| roles | classic playable + planned honest | first-run vs re-read; permission moment; long scroll |
| home | default dark | create/join loading; error; **offline**; deep-link join failure; light (proof) |
| lobby | host, everyone ready | blockers/disabled Begin; player view; empty team; **offline**; room load error; leave confirm |
| hunt-hunter | LIVE with reports + stale + trail + zone | **paused**; head start; no reports yet; **offline/reconnecting**; claim banner; GPS/permission (location for map); tag picker |
| hunt-prey | LIVE, own position, zone/clock | **head start**; **eliminated/spectating**; location permission denied/services off/waiting fix; **offline**; claim overlay |
| chat | populated field log + system event | empty; sending; send error; load older; **offline** (composer disabled) |
| result | Hunters win, 18:48 played, PREY 0/2 | Prey win (2/2 honest); cancelled; result-sync loading |
| history | populated list | **one match summary**; loading; empty; error |
| settings | appearance (theme + text size) | language; permissions (allowed/not); **update available**; up to date; download progress/failure; server read-only; cache |
| sheet-tag-claim | incoming claim | busy/error; dismissed → persistent banner; disputed (huntmaster) |
| sheet-room-settings | open-area seed rules | zone expanded + shrink; validation; save/busy; **tag policy row** |
| lobby-rtl | mirrored host lobby | one alternate state (bonus) |
| home-light | light Home | parity notes for dark |

**Priority if a page can only show one state:** the canonical "must show" state is mandatory; the states marked
**bold** in the table (offline, paused, eliminated, update available, claim) are the ones that prove the system
is real. Do not fake a state by dimming a happy path and calling it "error" — write real copy and a real action.

---

## 19. Screenshot index (real captures)

| File | What it shows | Why relevant |
|---|---|---|
| `docs/screenshots/premium/s03-home.png` | Home dark, MASTHEAD, permanent line, host + join blocks, real seed names | Shipped Home baseline |
| `docs/screenshots/premium/s15-home-light.png` | Home in light theme | `home-light` proof baseline |
| `docs/screenshots/premium/s04-home-rtl.png` | Home Arabic RTL | RTL typography baseline (not lobby) |
| `docs/screenshots/premium/s05-lobby-host.png` | Lobby host, everyone ready, real code, HOST/YOU labels | Lobby baseline |
| `docs/screenshots/premium/s06-lobby-player.png` | Lobby player view, mixed readiness | Lobby alternate state |
| `docs/screenshots/premium/s07-hunt.png` | Live hunt: real OSM tiles, 240 m zone, fresh+stale prey, coral trail, clock 41:12, Tag dock | Hunt baseline (still legacy chrome in the sheet) |
| `docs/screenshots/premium/s08-hunt-claim.png` | Prey view + tag claim over the hunt | Claim baseline |
| `docs/screenshots/premium/s09-tag-target-sheet.png` | Tag target picker sheet over the map | Hunt action state |
| `docs/screenshots/premium/s11-chat.png` | Field-log chat during the hunt | Chat baseline |
| `docs/screenshots/premium/s12-result-hunters.png` | Full-time board, "Hunters win.", 0/2, actions | Result baseline |
| `docs/screenshots/premium/s13-result-prey.png` | Prey win, honest 2/2 | Result alternate |
| `docs/screenshots/premium/s02-safety.png` | First-run welcome, current legacy look | Roles baseline (to be replaced) |
| `docs/screenshots/premium/MANIFEST.json` | Seed, device, rejected frames, pending shots | Capture truth |
| Legacy `docs/screenshots/01-auth.png` … `08-hunt-result.png` | v0.12 CI captures (cards, dialogs) | What v2 is replacing — comparison only |

---

## 20. Brief vs shipped app — deltas a designer must handle

1. **Rematch.** Brief's result must-show includes "rematch"; the app has no rematch action (`ScorePage.kt`
   has Back to lobby + View hunt history). Design it only as a proposal and add a NOTES line:
   "Rematch not shipped — needs a server action (restart same room with same teams/settings) + client call;
   cost: small API + state refresh, no engine change. Otherwise omit." Do not silently imply it exists.
2. **Tag policy.** Brief's room-settings must-show includes tag policy. The server enum **is** documented
   and enforced: `confirm` (default; prey confirms/disputes; claim sheet exists) or `instant` (immediate
   confirmation, prey eliminated, no claim sheet) — `docs/API.md`, `server/src/domain/match.ts`,
   `server/src/rooms.ts`. The client has no control. Either show the current behaviour read-only (safest) or
   design a costed confirm/instant proposal with the real consequence copy (§14); no third value, no
   cheat-proof claim. Client-only cost for the control; the server already supports the values.
3. **Roles entry.** Brief says "first run / from Settings"; the app reaches Roles from Home ("Read the roles")
   and first run. Either honour the brief in a proposal and flag it, or keep the app's entry and say why.
4. **Result "final score".** The real score is **prey remaining `0 / 2`**, not a two-team score. Keep it real;
   if you design a scoreboard score, it must be derivable from `preyAlive/preyTotal` and labelled honestly.
5. **Settings server.** Read-only in Settings (change happens on Auth after sign-out). If the brief's "server"
   row is designed as editable, flag the missing server-side/config path.
6. **History summary.** "One match summary" is a proposal; the data supports date/time/duration/winner/
   cancellation/team rosters only.
7. **Offline/reconnecting** exists in state (`connected`) but not in UI. Design it; note the small client work
   (render the flag + disable actions + strip) as feasibility.
8. **Result map.** `ScorePage` uses a drawn field plate, not a real map snapshot (allowed this sprint, per
   the code comment). Do not draw fake street layouts; label it "final position map (proposal)" if you show one.
9. **Chat tab vs page.** Chat is a tab inside RoomScreen during lobby/hunt, not a stand-alone route; the
   canonical `chat` page is its full-page state. Keep the in-room switch design in mind for hunt pages.
10. **Rematch/history ordering:** on result, "Back to lobby" dismisses the score page; history opens over the
    room. Keep the flow.

**Rule:** any delta you design becomes one line in `NOTES.md` under **Compose/feasibility notes** with the
cost (small client / small server / engine work / not possible), so reviewers can score axis 7 honestly.
