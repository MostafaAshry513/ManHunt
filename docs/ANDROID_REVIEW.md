# Android Client Review — ManHunt

> **Historical document.** An internal adversarial review of an earlier version. Some findings have
> since been fixed and `file:line` references may have drifted; check the current code before
> acting on it. See [docs/README.md](README.md) for the current documentation map.

Adversarial, read-only review of the Android client (`android/app/src/main/**`,
`AndroidManifest.xml`, `app/build.gradle.kts`), cross-checked against the backend
contract (`docs/ARCHITECTURE.md`, `server/src/**`). Method: direct code reading of
both sides and field-by-field comparison of every REST/WebSocket DTO. No code was
modified; no emulator/device exists in this environment, so nothing was executed.
Findings cite `file:line` against the code as it exists at review time.

## Verdict

The client is a clean, coherent Compose app whose data layer mirrors the server
contract faithfully: every DTO field name (`serverNow`, `staleAfterMs`,
`preyAlive`, `flagged`, `hasReport`, `nextShrinkAt`, `durationSec`, etc.) lines up
with the backend, error handling is centralised, and there is no client-side
location over-exposure — prey markers are gated on `me.team == HUNTERS` exactly as
the server's `canSeePreyLocations` predicate requires, and the tracking foreground
service is correctly declared (`exported="false"`, `type=location`,
`FOREGROUND_SERVICE_LOCATION`). The two most serious problems are both lifecycle
bugs that no unit test can catch because there are no Android tests at all
(`app/src/test` and `app/src/androidTest` are empty despite a Robolectric/Compose
test stack being declared in the build): (1) the `RoomViewModel` is scoped to the
`Activity` rather than the navigation destination, so its WebSocket and 10-second
polling loop keep running after the user leaves a room; and (2) the tracking
service is only started when the phase flips to `hunting`, which means prey do not
report during the head start (the server explicitly accepts and stores head-start
reports) and, worse, the `hunting`/`resume` transition can trigger a
`startForegroundService` call from the background on Android 12+, which throws
`ForegroundServiceStartNotAllowedException` and crashes. Below those sit several
correctness and UX gaps (a frozen countdown, eliminated prey still "tracked", no
admin path to resolve disputed tags, and a `trailsEnabled` setting with no client
effect).

## Findings table

| ID | Severity | Area | File:line | Summary |
|----|----------|------|-----------|---------|
| A1 | High | Lifecycle / leaks | `RoomScreen.kt:87-119,298-300`; `MainActivity.kt:14-16` | RoomViewModel is Activity-scoped, so the WebSocket and 10 s polling loop are never closed/stopped when the user leaves a room |
| A2 | High | Foreground service | `RoomScreen.kt:322-328`; `TrackingService.kt:158-163` | Tracking starts only at the `hunting`/`resume` phase flip; if the app is backgrounded then, `startForegroundService` throws on Android 12+ and crashes |
| A3 | High | Correctness | `RoomScreen.kt:322-328` vs `server/src/rooms.ts:463` | Prey never report location during `head_start` (server accepts it), so hunters are blind to prey positions at the start of hunting |
| A4 | Medium | Correctness | `RoomScreen.kt:673-741` | Countdown is frozen between server refreshes: `offset` is recomputed each tick, cancelling elapsed time |
| A5 | Medium | Foreground service / privacy | `RoomScreen.kt:322-328`; `TrackingService.kt:133-140` vs `server/src/rooms.ts:459` | Eliminated prey still run the tracking service and show a "Hunters receive your position" notification even though the server rejects their reports |
| A6 | Medium | Correctness / tag flow | `ApiClient.kt:94-95`; `RoomSocket.kt:104-119`; `RoomScreen.kt` | `resolveTag` is never wired to UI and `tag_disputed` is never parsed: an admin cannot resolve a disputed tag from the client |
| A7 | Medium | UX / feature gap | `RoomSettingsDialog.kt:94-95,166`; `ApiClient.kt` | `trailsEnabled` is editable but the client never fetches or renders trails (`locationHistory` has no client method) |
| A8 | Medium | Permissions / privacy | `AndroidManifest.xml:9`; `TrackingService.kt:62-72` | `POST_NOTIFICATIONS` is declared but never requested, so the mandatory "you are being tracked" notification may be hidden on Android 13+ |
| A9 | Low | UX | `RoomScreen.kt:416-425,139-142` | Initial room load failure shows an infinite spinner with no error or retry (error is set but rendered below the `state == null` early return) |
| A10 | Low | UX / privacy surfacing | `MatchMap.kt:95-110`; `RoomScreen.kt:491-497` | Stale/flagged/eliminated prey markers are visually identical; the only cue is a tap-only snippet and a single stale banner (no flagged banner) |
| A11 | Low | Accessibility | `MatchMap.kt:77-137` | The map `AndroidView` has no content description and osmdroid markers are invisible to TalkBack |
| A12 | Low | Security | `ManHuntRepository.kt:66-69` vs `server/src/app.ts:132` | `logout()` never calls `POST /api/auth/logout`, so tokens stay valid up to 30 days after sign-out |
| A13 | Low | Security | `RoomSocket.kt:63-64` | Session token in the WebSocket query string (known gap, restated for the Android surface) |
| A14 | Low | Config / validation | `SessionStore.kt:22-24`; `AuthScreen.kt:169-177` | Server URL accepts a scheme-less value that silently breaks REST and WS with a generic "network" error |
| A15 | Low | Privacy / UX | `AuthScreen.kt:50-51`; `AppRoot.kt:20-54` | Auth screen is Activity-scoped and retains the previous username/password after sign-out |
| A16 | Low | Recomposition | `RoomScreen.kt:308`; `MatchMap.kt:80-135` | `LiveLocation.current` is collected at the top of `RoomScreen`, so every GPS fix recomposes the whole screen and rebuilds all map overlays |

---

## A1 — High — WebSocket and polling loop leak when leaving a room

**Why it matters.** `RoomViewModel` opens a `RoomSocket` and starts an
infinite polling loop in `init`:

```kotlin
init {
    repo.currentToken()?.let { socket.connect(Graph.container.serverUrl, it, roomId) }
    refresh()
    viewModelScope.launch {
        while (isActive) { delay(10_000); refresh(silent = true) }
    }
}
override fun onCleared() { socket.close(); super.onCleared() }
```

The ViewModel is obtained with `viewModel(key = roomId, ...)`
(`RoomScreen.kt:298-300`) inside `setContent { AppRoot() }` (`MainActivity.kt:14-16`)
with no custom `ViewModelStoreOwner`. The store owner is therefore the
`ComponentActivity`, and ViewModels in the Activity store are only cleared when the
Activity is destroyed — **not** when the composable leaves composition. The only
cleanup (`onCleared` → `socket.close()`) therefore never runs on navigation.

Concretely: navigate Room A → Home → Room B and you now have two live WebSockets
(the A socket keeps receiving room A `room`/`chat`/`prey_location` broadcasts) and
two 10-second polling loops, draining battery and server connections for the rest
of the app's life. The server's `presence()` counts the still-open A socket, so the
user can even appear "connected" in a room they already left.

**Fix.** Scope the ViewModel to the navigation entry (Navigation Compose
`NavBackStackEntry` as `viewModelStoreOwner`), or add an explicit teardown in the
composable and stop relying on `onCleared`:

```kotlin
// RoomViewModel: keep the polling job as a field
private var pollJob: Job? = null
fun shutdown() { pollJob?.cancel(); socket.close() }
// RoomScreen
DisposableEffect(Unit) { onDispose { vm.shutdown() } }
```

**Test.** A Robolectric/Compose test that composes `RoomScreen`, leaves
composition, and asserts (a) the socket's `close()` was called and (b) the polling
coroutine is cancelled (e.g. via a fake `RoomSocket` recording `close` invocations
and a `runTest` that asserts no further `repo.room` calls after 20 s).

---

## A2 — High — Foreground service start from the background crashes on Android 12+

**Why it matters.** Tracking is started by a `LaunchedEffect` keyed on
`(hasLocation, matchId, phase, me?.team)` that calls
`TrackingService.start(...)` only when `phase == HUNTING` (`RoomScreen.kt:322-328`):

```kotlin
if (hasLocation && me?.team == Teams.PREY && matchId != null && phase == Phases.HUNTING) {
    TrackingService.start(context, matchId, intervalSec)
} else if (phase != Phases.HUNTING) {
    TrackingService.stop(context)
}
```

`TrackingService.start` → `ContextCompat.startForegroundService`
(`TrackingService.kt:158-163`). Because the client does **not** track during
`head_start` (see A3), the service is first started exactly at the head-start →
hunting transition (and again at paused → resume, which is preceded by a `stop`).
If the phone is backgrounded at that moment — which is precisely the normal
situation, since prey are out hiding during the head start — the
`LaunchedEffect` fires while the app is in the background and
`startForegroundService` throws `ForegroundServiceStartNotAllowedException`
(Android 12+ / targetSdk 37). It is an uncaught exception on the main dispatcher
and crashes the app.

**Fix.** (1) Start tracking while the app is still visible, i.e. during
`head_start` too (this also fixes A3), so no FGS start is needed at the transition;
and (2) defensively guard the start — check `ProcessLifecycleOwner`/`Lifecycle`
state and, if not foreground, defer or skip; wrap `startForegroundService` in a
`try/catch` for `ForegroundServiceStartNotAllowedException`.

**Test.** Hard to unit-test directly, but a Robolectric test can assert the
`LaunchedEffect` does not call `startForegroundService` when the lifecycle is not
`STARTED`/`RESUMED`. On a device: reproduce by backgrounding a prey phone during
head start and letting hunting begin (should not crash).

---

## A3 — High — Prey location is never reported during the head start

**Why it matters.** `ARCHITECTURE.md:27` states "head_start: prey may move and
report", and the server explicitly accepts reports in that phase
(`server/src/rooms.ts:463`: `if (phase !== 'head_start' && phase !== 'hunting')`
reject). But the client only starts `TrackingService` when `phase == HUNTING`
(`RoomScreen.kt:322-328`). The server only *broadcasts* `prey_location` during
hunting, but `latestLocations` (which the hunter UI polls) returns the latest
stored report per prey. With no head-start reports stored, when hunting begins the
hunters' map is empty and stays empty until each prey's first post-hunting fix —
up to `locationIntervalSec` (default 5 min) of blindness. The setting dialog even
defaults interval to minutes, so this is a long, real gap.

**Fix.** Start tracking for prey during `head_start` as well as `hunting`:

```kotlin
val active = me?.team == Teams.PREY && me?.eliminated != true &&
    matchId != null && (phase == Phases.HEAD_START || phase == Phases.HUNTING)
if (hasLocation && active) TrackingService.start(...) else TrackingService.stop(...)
```

**Test.** Integration test (or manual): start a room with a head start, put a prey
on the map, advance to hunting, and assert the hunter's `latestLocations` already
contains a non-stale prey position.

---

## A4 — Medium — Countdown is frozen between server refreshes

**Why it matters.** `PhaseCard` ticks every second to drive a live countdown
(`RoomScreen.kt:673-679`), then computes:

```kotlin
val offset = (match?.now ?: 0L) - System.currentTimeMillis()   // line 706
...
remaining(target, offset) // = target - (System.currentTimeMillis() + offset)  // 736-742
```

Both `System.currentTimeMillis()` calls happen in the same composition, so the
second call's `now` cancels the first, leaving `remaining = target - match.now`
— a value that is **constant between snapshots**. The per-second tick recomposes
`PhaseCard` but the displayed time does not change; it only "jumps" when a new room
snapshot arrives (the 10 s poll or a socket `room` event). The tick loop is
therefore both wasted recomposition and a broken countdown.

**Fix.** Capture the server offset once per snapshot so elapsed device time is
added, not cancelled:

```kotlin
val offset = remember(match?.now) { (match?.now ?: 0L) - System.currentTimeMillis() }
```

**Test.** A Compose test with a fake clock: render `PhaseCard` with a fixed
`match.now`/`endsAt`, advance the test dispatcher's virtual time by 1 s, and assert
the displayed remaining time decreased by 1 s.

---

## A5 — Medium — Eliminated prey still run the tracking service with a misleading notification

**Why it matters.** The start condition (`RoomScreen.kt:322-328`) checks team and
phase but not `me?.eliminated`. An eliminated prey remains on team `prey`, so during
`hunting` the service still starts, the GPS/network providers still run, and the
ongoing notification still says "Hunters receive your position every X min"
(`TrackingService.kt:133-140`). In reality the server rejects every report with
`spectator` (`server/src/rooms.ts:459`), so this is pure battery/GPS drain plus a
privacy notification that is factually wrong — the screen even tells the user
"you cannot ... share new positions" (`RoomScreen.kt:445-451`) while the
notification claims the opposite.

**Fix.** Add `me?.eliminated != true` to the start condition (see A3 snippet) and
stop the service when the player becomes eliminated.

**Test.** Robolectric/Compose test: given an eliminated prey member and phase
`hunting`, assert `TrackingService.start` is not called.

---

## A6 — Medium — Admin cannot resolve a disputed tag from the client

**Why it matters.** The tag lifecycle is confirm / dispute / resolve. The client
exposes confirm and dispute dialogs (`RoomScreen.kt:212-238`) but:
- `resolveTag` is declared in `ApiClient.kt:94-95` and `ManHuntRepository.kt:114`
  and is never called anywhere in the UI;
- `SocketPayloadParser` (`RoomSocket.kt:104-119`) only understands
  `room`, `chat`, `prey_location`, `tag_request` — it drops `tag_disputed`, which
  the server broadcasts to the whole room (`server/src/rooms.ts:412`);
- there is no "disputed tags" UI for the admin.

So a disputed tag is a dead end: the prey remains un-eliminated indefinitely and
no one can act from the app (the server correctly rejects a `pending`/non-disputed
resolve since the round-1 fix). This breaks the confirm-tag flow the game is built
on.

**Fix.** Parse `tag_disputed` in `SocketPayloadParser`, surface disputed tags in
the room state/UI, and add an admin dialog that calls `resolveTag(id, "confirmed"|"rejected")`.

**Test.** A parser unit test for the `tag_disputed` frame, plus a UI test that the
admin dialog posts the correct `decision` payload.

---

## A7 — Medium — `trailsEnabled` is configurable but trails are never shown

**Why it matters.** `RoomSettingsDialog` renders "Hunters can see trails" and sends
`trailsEnabled` (`RoomSettingsDialog.kt:94-95,166`), and the server gates
`locationHistory` on it (`server/src/rooms.ts:582-585`). But `ApiClient` has no
`locationHistory` method at all, and no screen fetches `/api/matches/:id/locations/:userId`.
The setting has zero observable effect on the client, which is misleading to admins
who enable it.

**Fix.** Either implement a trail view (fetch `locationHistory` for a selected prey
when `trailsEnabled` and the viewer is a hunter), or hide the toggle until it is
implemented.

**Test.** If implemented, a test that the trail fetch is gated on `trailsEnabled`
and that a hunter-only REST call is made; otherwise a check that the toggle is
removed.

---

## A8 — Medium — `POST_NOTIFICATIONS` declared but never requested

**Why it matters.** On Android 13+, the ongoing "ManHunt is tracking you"
notification is the app's transparency mechanism (the service docstring says the
notification is "mandatory and intentional"). But `POST_NOTIFICATIONS` is declared
(`AndroidManifest.xml:9`) and never requested, and `createChannel`/`startForeground`
run regardless. The FGS still runs when the permission is denied, but its
notification is hidden from the drawer — so the user is tracked without the visible
notice the design promises.

**Fix.** Request `POST_NOTIFICATIONS` (ideally on the same "enable GPS" path or
first time prey tracking is about to start) before starting the service.

**Test.** On a device/emulator with API 33+: deny notifications and confirm the
app either requests the permission or clearly surfaces that tracking runs with the
notification hidden.

---

## A9 — Low — Initial room load failure shows an infinite spinner

**Why it matters.** When `state == null` the screen renders only a spinner and
"Connecting to room..." and returns early (`RoomScreen.kt:416-425`). The
`ErrorBanner(ui.error)` lives inside the `LazyColumn` below that early return, so a
network failure on first load sets `ui.error` but never displays it. The user sees
an endless spinner with no error or retry.

**Fix.** Render the error + a retry button in the `state == null` branch (or show
the banner above the early return).

**Test.** Compose test with a repository that throws on `room()` and assert the
error text and a retry affordance are visible.

---

## A10 — Low — Stale/flagged/eliminated prey are not clearly marked on the map

**Why it matters.** Every prey marker is a default osmdroid `Marker`; the only
differentiator is a `snippet` string ("Tagged"/"Stale report"/"Unverified report")
that appears only when a marker is tapped (`MatchMap.kt:95-110`). There is a single
"Some prey reports are stale" banner (`RoomScreen.kt:491-497`) but no equivalent
for flagged (suspicious/unverified) reports, and no color/icon difference on the
map itself. Review focus #3 asks whether stale/flagged are "clearly marked" — they
are not, for a hunter glancing at the map.

**Fix.** Use distinct marker icons/colors for eliminated vs stale vs flagged vs
live, and add a flagged banner alongside the stale one.

**Test.** Compose/screenshot or Robolectric test asserting a flagged report
produces a visually distinct marker and a visible "unverified" indicator.

---

## A11 — Low — Map has no accessibility content description

**Why it matters.** The map is an `AndroidView` wrapping osmdroid with no
`contentDescription` and no `semantics` (`MatchMap.kt:77-137`); osmdroid `Marker`s
are not exposed to TalkBack at all. A hunter using a screen reader gets no
information about prey positions, zones, or their own location.

**Fix.** Add a `contentDescription`/`stateDescription` to the map and a companion
text list (name + distance + status) so screen-reader users get the same
information; consider `semantics { contentDescription = ... }`.

**Test.** Accessibility check on a device (TalkBack) and/or an `assertIsDisplayed`
of the text list.

---

## A12 — Low — Sign-out does not revoke the session server-side

**Why it matters.** `logout()` only clears local storage
(`ManHuntRepository.kt:66-69`) and never calls `POST /api/auth/logout`, which the
server provides to revoke the token (`server/src/app.ts:132-136`). A "signed out"
token remains valid for up to 30 days if it was captured (e.g. by the cleartext/
proxy risks in A13 and the prior security review).

**Fix.** Best-effort `api.logout(token)` before clearing (ignore network errors).

**Test.** Robolectric test asserting the logout endpoint is invoked on `logout()`
when a token exists.

---

## A13 — Low — Session token in the WebSocket query string

**Why it matters.** `RoomSocket.open()` builds `/ws?token=<token>`
(`RoomSocket.kt:63-64`). This is the server's documented transport
(`ARCHITECTURE.md:94`) and the app suppresses its own `/ws` request log, but any
future reverse proxy/access log must redact query strings. Already tracked as
residual risk #2 in `SECURITY.md`; restated here because it is an Android surface.

**Fix.** Prefer a `Sec-WebSocket-Protocol` or `Authorization` header handshake, or
enforce proxy query-string redaction before exposure.

**Test.** Deployment check that no log line contains the token substring.

---

## A14 — Low — Scheme-less server URL breaks silently

**Why it matters.** `SessionStore.serverUrl` accepts any trimmed string
(`SessionStore.kt:22-24`) with no scheme validation. If a user enters
`192.168.1.20:8080` (without `http://`), REST (`ApiClient.kt:122`) and WS
(`RoomSocket.kt:63`, whose `replaceFirst("http","ws")` is a no-op without a scheme)
both fail with a generic "Cannot reach the server" error. The label shows an
example (`AuthScreen.kt:172`) but does not enforce it.

**Fix.** Normalise/validate the URL on save (prepend `http://` if no scheme, or
reject with a clear message).

**Test.** Robolectric test that `setServerUrl("192.168.1.20:8080")` yields a usable
base URL or a clear validation error.

---

## A15 — Low — Auth screen retains credentials after sign-out

**Why it matters.** `AuthViewModel` is Activity-scoped (`AuthScreen.kt:89`) and
holds `ui.username`/`ui.password`. After `repo.logout()` routes back to Auth, the
same ViewModel instance still shows the previous username and password, so a shared
device exposes the last user's password in the field.

**Fix.** Clear the fields when the session becomes null (or key the ViewModel on
the session).

**Test.** Compose test: log in, sign out, assert the username/password fields are
empty.

---

## A16 — Low — Every GPS fix recomposes the whole room screen and rebuilds the map

**Why it matters.** `LiveLocation.current` is collected at the top of `RoomScreen`
(`RoomScreen.kt:308`), so each fix changes `ownLocation` and recomposes the entire
screen (LazyColumn, chat, dialogs). `MatchMap`'s `update` block clears and re-adds
every overlay on each recomposition (`MatchMap.kt:80-135`). With both GPS and
NETWORK providers registered at `minDistance = 0` (`TrackingService.kt:86-90`),
fixes can be more frequent than the report interval.

**Fix.** Collect `ownLocation` inside `MatchMap` (or use `derivedStateOf`/scope
the recomposition) and diff overlays rather than clear-and-rebuild.

**Test.** Compose test asserting a `LiveLocation.update` does not recompose
siblings of the map.

---

## Verified-good list

Evidence-backed items that are correct:

- **DTO alignment.** `Models.kt` field names and types match the server payloads:
  `RoomState.serverNow` → `serverNow` (`rooms.ts:769`), `LatestLocations.staleAfterMs`
  and `PreyLocationStatus.{stale,flagged,eliminated,hasReport}` → `latestLocations`
  (`rooms.ts:553-571`), `MatchSummary`/`MatchDto` → `matchSummary`/`buildState`
  (`rooms.ts:699-712,734-746`), `MatchHistoryEntry.durationSec?` → `matchHistory`
  (`rooms.ts:676-686`). `ManHuntJson.ignoreUnknownKeys = true` tolerates additive
  server fields.
- **No location over-exposure.** Prey markers render only when
  `me?.team == Teams.HUNTERS` (`RoomScreen.kt:463`), and `ui.locations` is only
  populated for hunters in the hunting phase (`RoomScreen.kt:126-130`) — matching
  the server's single `canSeePreyLocations` predicate (`rooms.ts:928-931`). Prey and
  eliminated spectators see no prey markers; `LiveLocation` holds only the player's
  own fix (`LiveLocation.kt:13-23`).
- **Foreground service declaration.** `TrackingService` is `exported="false"` with
  `android:foregroundServiceType="location"` and the `FOREGROUND_SERVICE_LOCATION`
  permission (`AndroidManifest.xml:19-22,8`); `ServiceCompat.startForeground` passes
  `FOREGROUND_SERVICE_TYPE_LOCATION` on Q+ (`TrackingService.kt:63-72`); the service
  calls `startForeground` immediately in `onStartCommand`; it registers on the main
  looper and unregisters on destroy (`TrackingService.kt:86-90,142-149`).
- **Stop-on-end is wired.** `LaunchedEffect` stops tracking when phase leaves
  `hunting`, and `DisposableEffect(Unit)` stops it on leaving composition
  (`RoomScreen.kt:322-331`).
- **Server-authoritative design.** The client never computes match phases; it reads
  `phase`/`now` from the server snapshot (`ManHuntRepository.kt:9-12`). The
  `remaining()` formula is the standard server-offset + elapsed pattern — it is
  correct in principle (the defect in A4 is that the offset is recomputed each
  tick).
- **Geodesy matches.** `MapMath.destination`/`circle` mirror `server/src/domain/geo.ts:24-47`
  (same Earth radius, same bearing math, same antimeridian normalisation).
- **Settings patch correctness.** `RoomSettingsDialog` sends the same keys the
  server's `mergeSettings`/`parseSettings` expect and omits untouched fields so the
  server-side merge preserves them (`server/src/domain/match.ts:59-66`); numeric
  conversion and `filter(Char::isDigit)` guard against NaN.
- **No sensitive logging.** No `Log.*`, `println`, `System.out`, or `Timber` calls
  exist anywhere in the client; the token never touches a client log.
- **JSON/body hygiene.** `Authorization: Bearer` and `Content-Type` headers are set
  only when needed (`ApiClient.kt:117-120`); empty 2xx bodies for `Unit` are
  handled (`ApiClient.kt:138-141`).
- **minSdk 26 + APIs.** Only `java.time` (`HistoryDialog.kt:20-23`) is used from
  the "modern" API set, which is available on API 26+; `ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION`
  is guarded by `Build.VERSION.SDK_INT >= Q`.
- **Touch targets.** Primary buttons use `50–54.dp` heights (`HomeScreen.kt:142,160`,
  `RoomScreen.kt:570`, etc.), comfortably above the 48 dp recommendation.

## Lead corrections and fixes after this review

- **The claim that there are zero Android unit tests is incorrect.** At review time the
  project had 16 JVM/Robolectric tests; after the fixes below it has 21
  (ApiClient 4, Models 4, MapMath 2, Socket parser 6, SessionStore 4, AppSmoke 1).
- A1 (socket/polling leak) fixed: `RoomViewModel.start()/stop()` are driven by the screen,
  and `onCleared` closes the socket and cancels the poll.
- A2 (illegal background FGS start) fixed: tracking starts only while the screen is RESUMED
  and during `head_start` or `hunting`, so the transition cannot start an FGS from the
  background.
- A3 (no prey reports during head start) fixed by the same change.
- Countdown offset frozen between polls fixed with `remember(match.id, match.now)`.
- Eliminated prey no longer keep tracking; `end_match` and disputed-tag resolution are now
  available in the UI; `tag_disputed` is parsed; `POST_NOTIFICATIONS` is requested on 33+.
- Remaining, not yet implemented: trail polylines, zone picker on the map, and full
  accessibility audit.

## Cannot verify without a device

- **Background FGS crash (A2) in practice.** Static reasoning shows the
  `ForegroundServiceStartNotAllowedException` path; the exact timing of the
  head-start→hunting transition while backgrounded needs a real device on Android
  12+.
- **Notification visibility (A8).** Whether the tracking notification is actually
  hidden from the drawer when `POST_NOTIFICATIONS` is denied on API 33+.
- **GPS quality/throttling.** Fix cadence with two providers at `minDistance = 0`,
  and OEM battery throttling effects, can only be measured on hardware.
- **osmdroid rendering.** Tile loading, marker hit-testing, and the copyright
  attribution overlay behaviour on a real device.
- **TalkBack experience (A11).** The actual screen-reader announcement for the map
  and markers.
- **Font scaling.** The app relies on Material typography (`sp` units) but specific
  large-font clipping in the room header/countdown was not exercised.
- **Token exfiltration via backup.** `allowBackup="false"` is now set
  (`AndroidManifest.xml:13`), but no backup was performed to confirm the token is
  excluded.

## Top 5 fixes by risk reduction

1. **A1 — Stop the socket and polling loop on navigation.** Scope the
   `RoomViewModel` to the destination or add a `DisposableEffect` teardown. This is
   the biggest silent resource/privacy leak and is a one-liner to fix.
2. **A3 + A2 together — Track during head start (while visible) and never start an
   FGS from the background.** Fixes the prey-blindness correctness bug *and*
   eliminates the Android 12+ background-start crash, since the service is already
   running at the hunting transition.
3. **A5 — Don't track eliminated prey.** Prevents wasted battery and removes a
   notification that falsely claims the server is receiving the player's position.
4. **A4 — Fix the frozen countdown.** `remember(match?.now) { ... }` the offset so
   the per-second tick actually decrements the clock instead of wasting a
   recomposition.
5. **A6 — Wire up admin tag resolution.** Parse `tag_disputed` and add a resolve
   dialog so the confirm/dispute/resolve flow can complete; without it the core tag
   mechanism dead-ends for any contested tag.

(For completeness: A8 — requesting `POST_NOTIFICATIONS` — is the cheapest
privacy-transparency win and worth doing alongside the above.)
