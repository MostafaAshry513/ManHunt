# Security & Privacy Review — ManHunt

Adversarial, evidence-based review of the backend (`server/`) and Android client
(`android/`). Method: direct code reading of `server/src/**` and
`android/app/src/main/**`, plus a run of the backend test suite
(`cd server; npm test` → **39 passed, 0 failed**). No code or configuration was
modified. Findings cite file:line against the code as it exists at review time.

## Verdict

The backend's core security model is genuinely strong for a friends-and-family
game: passwords are scrypt-hashed with constant-time verification, session tokens
are 32-byte opaque values stored only as SHA-256, every room/match endpoint
re-checks membership and role server-side, teams lock at match start, tag
outcomes are server-decided, and match timers derive from persisted server
timestamps rather than client input. These properties are backed by a real,
passing test suite (39 tests) that specifically exercises outsider access,
hunter-only location reads, admin-only settings, tag-confirm elimination, and
restart persistence. The one significant authorization bug I found is a
**role/enforcement inconsistency**: the real-time WebSocket `prey_location`
broadcast uses a looser recipient filter than the REST endpoints, so a room admin
who is *playing as prey* still receives every prey's live coordinates over the
socket — exactly the "admin rank grants no location power" invariant the docs
claim is regression-tested (it is only tested on the REST path). Beyond that, the
remaining issues are deployment/operational hardening gaps (no TLS, plaintext
token storage on Android, no rate limit on location reports) and a
match-integrity loophole that lets an admin bypass prey confirmation. None of
these require a sophisticated exploit, but several are meaningful privacy or
fairness problems and are cheap to fix.

## Findings table

| ID | Severity | Area | File:line | Summary |
|----|----------|------|-----------|---------|
| F1 | High | Location privacy | `server/src/rooms.ts:510-515` | WS `prey_location` broadcast reaches the room admin even when the admin is playing prey |
| F2 | High | Deployment / transport | `android/.../AndroidManifest.xml:16`, `android/app/build.gradle.kts:21`, `server/src/config.ts:15` | No TLS; Android enables global cleartext and defaults to an `http://` URL, so tokens and live GPS travel unencrypted |
| F3 | Medium | Match integrity | `server/src/rooms.ts:417-433` | `resolveTag` accepts `pending` tags, letting an admin (incl. an admin-hunter) confirm a tag without the prey's consent |
| F4 | Medium | Abuse / DoS | `server/src/app.ts:243-246`, `server/src/rooms.ts:445` | No rate limit or retention on location reports; `location_reports` grows unbounded |
| F5 | Medium | Android / sessions | `android/.../data/SessionStore.kt:12-16`, `AndroidManifest.xml:13` | Session token stored in plaintext `SharedPreferences` with `allowBackup="true"` |
| F6 | Medium | Sessions / logging | `server/src/app.ts:262-264`, `android/.../data/RoomSocket.kt:63-64` | Session token in WebSocket query string (proxy-log exposure; app-level suppression only) |
| F7 | Low | Secrets / predictability | `server/src/rooms.ts:905-914` | Room join codes generated with `Math.random()` (non-CSPRNG) |
| F8 | Low | Location privacy / retention | `server/src/rooms.ts:570-601` | Prey trail history is readable by hunters with no match-status or time boundary and no retention |
| F9 | Low | Deployment | `server/src/app.ts:79` | CORS `origin: true` reflects any origin |
| F10 | Low | Abuse | `server/src/app.ts:46-66,76` | In-memory rate-limit map never pruned; `trustProxy:false` collapses client IPs behind a proxy |
| F11 | Info | Location privacy | `server/src/rooms.ts:460` | Server accepts prey location reports during head start (surfaced at hunting transition) |

---

## F1 — High — WebSocket location leak to a prey-playing admin

**Exploit scenario.** Alice creates a room (she is the admin), stays on Prey, and
opens the room screen (the official client opens a `RoomSocket` for every member,
`RoomScreen.kt:103`). Bob joins and switches to Hunters. During hunting, Bob's
device reports his position. `reportLocation` builds a recipient filter:

```ts
const allow = (viewerId) => {
  const m = this.member(roomId, viewerId);
  return !!m && (m.team === 'hunters' || this.room(roomId).admin_id === viewerId);
};
if (phase === 'hunting') this.hub.broadcast(roomId, { type: 'prey_location', data: payload }, allow);
```

Alice's socket is subscribed to the room, `admin_id === viewerId` is true, so
`allow(Alice)` returns `true` and she receives every prey's live position as a
`prey_location` event. The REST endpoints (`latestLocations` at `rooms.ts:528`,
`locationHistory` at `rooms.ts:576`) correctly reject her (`viewer.team !==
'hunters'`), and the docs claim this is regression-tested — but the test only
covers the REST path (`security.test.ts:24`), not the socket push. The Android
UI hides the markers from her (`MatchMap` only renders prey when
`me.team == HUNTERS`), but the data still arrives on the wire and any modified
client or a plain network capture can read it.

**Impact.** An admin playing prey can track all other prey in real time, defeating
the location-privacy design and the game's fairness model (D7). On a cleartext
deployment (F2) the leak is also visible to any network observer.

**Fix.** Make the socket filter identical to the REST rule — hunters only:

```ts
const allow = (viewerId) => {
  const m = this.member(roomId, viewerId);
  return !!m && m.team === 'hunters';
};
```

**Test.** Extend `security.test.ts` (or a new realtime test) to open two WebSocket
connections (admin-as-prey and hunter), subscribe both, start + advance to
hunting, have the hunter report, and assert the admin-prey socket receives
**no** `prey_location` frame while the hunter does. This is the regression test
the docs currently lack.

---

## F2 — High — No transport encryption; Android enables cleartext

**Exploit scenario.** The Android manifest sets `android:usesCleartextTraffic="true"`
globally (`AndroidManifest.xml:16`) and `DEFAULT_SERVER_URL` is
`http://10.0.2.2:8080` (`app/build.gradle.kts:21`). The server binds
`127.0.0.1:8080` by default (`config.ts:15`) with no TLS. When the service is
exposed via a proxy or the bind address is changed (the deployment plan in
`DEPLOYMENT.md`), every request — bearer token, login credentials, and real-time
GPS coordinates of prey players — travels as plaintext HTTP/WS.

**Impact.** Passive network eavesdropping (same Wi-Fi/LAN, ISP, or a hostile
proxy) reveals session tokens (full account takeover for up to 30 days) and the
live locations of every prey — a serious personal-safety issue for a real-world
"hunt" game.

**Fix.** Terminate TLS in front of the server (Caddy/nginx with ACME) and keep the
Node process bound to `127.0.0.1`; set `DEFAULT_SERVER_URL` to an `https://` URL
and remove `usesCleartextTraffic` (or scope it with a network-security-config that
only allows cleartext to `10.0.2.2` for debug builds).

**Test.** A deployment/integration check that the public URL serves
`https://` and that the debug-only cleartext exception is absent from the release
manifest (e.g. assert `usesCleartextTraffic` is false in a release variant).

---

## F3 — Medium — Admin can bypass prey confirmation on tags

**Exploit scenario.** With the default `tagPolicy: 'confirm'`, a hunter's claim
must be confirmed by the tagged prey. But `resolveTag` allows resolving a tag that
is still `pending`, not just `disputed`:

```ts
if (tag.status !== 'disputed' && tag.status !== 'pending') throw conflict(...);
...
if (decision === 'confirmed') this.eliminate(tag.prey_id, roomId, this.match(tag.match_id));
```

An admin who is also playing as a hunter can submit a claim and immediately
`POST /api/tags/:id/resolve {decision:"confirmed"}` on their own claim, eliminating
prey without any prey interaction. Even a non-hunter admin can force-confirm a
pending claim before the prey ever responds.

**Impact.** The "hunter claim + prey confirmation" trust model (D6) is defeated
whenever the admin is also competing, or simply overrides a pending claim. It
makes tag outcomes effectively admin-controlled and undermines the integrity of
the `confirm` policy.

**Fix.** Restrict resolution to genuinely disputed tags and forbid self-resolution:
`if (tag.status !== 'disputed') throw conflict(...)`, and reject the case where
`tag.hunter_id === adminId`.

**Test.** In `api.test.ts`, create a pending tag from an admin-hunter and assert
`POST /api/tags/:id/resolve {decision:"confirmed"}` returns 409 (`tag_resolved`
/ not-disputed), and that a non-admin-hunter's dispute is still resolvable by the
admin.

---

## F4 — Medium — No rate limit or retention on location reports

**Exploit scenario.** `POST /api/matches/:id/location` is the only authenticated
write endpoint with no `limiter.check` (compare `app.ts:243-246` with the tag/chat
limits). A prey can stream thousands of reports per minute. Each report is a row in
`location_reports`, which is never pruned (no retention job in `server.ts`, no
`DELETE` in `schema.sql`).

**Impact.** Unbounded disk growth and DB bloat (a single misbehaving or compromised
client can exhaust the `manhunt.db` volume over a long match), degrading
`latestLocations`/`locationHistory` queries and the single-writer SQLite instance.

**Fix.** Add a per-user rate limit to the location endpoint (e.g. 20/min, matching
the `locationIntervalSec` floor), and add a periodic retention job that deletes
`location_reports` (and old `messages`/`audit_events`) older than a retention
window.

**Test.** A test that POSTs location reports faster than the limit and asserts a
`429`; and a unit test that the retention query removes rows older than N days.

---

## F5 — Medium — Android stores the session token in plaintext with backup enabled

**Exploit scenario.** `SessionStore` writes the bearer token to `SharedPreferences`
with `MODE_PRIVATE` and no encryption (`SessionStore.kt:12-16`), and the manifest
sets `android:allowBackup="true"` (`AndroidManifest.xml:13`). Android Auto Backup
can therefore exfiltrate the token (and cached user JSON) to the cloud/`adb backup`
without root.

**Impact.** A stolen/restored backup yields the 30-day session token and full
account control, plus any locally cached data. The token is the highest-value
secret the client holds.

**Fix.** Use `EncryptedSharedPreferences` / Android Keystore-backed storage, or at
minimum set `android:allowBackup="false"` (or a backup rules file excluding the
token) until encrypted storage is in place.

**Test.** A Robolectric test asserting the token is not readable from a backup
surface (rules file excludes the key) or that the store delegates to an
encrypted-backed implementation.

---

## F6 — Medium — Session token in the WebSocket query string

**Exploit scenario.** The client connects with
`/ws?token=<token>` (`RoomSocket.kt:63-64`), and the server reads it from the URL
(`app.ts:262-264`). The app suppresses its *own* request log for `/ws`, but any
reverse proxy, load balancer, or access log in front of the server will record the
full URL — including the token — unless explicitly configured to redact query
strings. `DEPLOYMENT.md` acknowledges this but the code does not prevent it.

**Impact.** Token leakage into proxy/access logs persists after the request and is
a common credential-exposure path once a proxy is added (which `DEPLOYMENT.md`
itself recommends).

**Fix.** Prefer a short-lived one-time WS ticket, or authenticate the WebSocket
via a `Sec-WebSocket-Protocol`/`Authorization` header handshake where the proxy
supports it; at minimum, configure and verify query-string redaction at the proxy
layer before exposure.

**Test.** A proxy-config or integration check that `/ws?token=...` request URLs are
not written to any access log (assert the token substring is absent from captured
logs).

---

## F7 — Low — Room codes generated with `Math.random()`

**Exploit scenario.** `uniqueCode()` builds 6-character join codes from
`Math.floor(Math.random() * CODE_ALPHABET.length)` (`rooms.ts:905-914`). V8's
`Math.random()` (xorshift128+) is not cryptographically secure and its output can
be predicted once a few outputs are observed. Every other secret in the codebase
uses `randomBytes`/`randomUUID`; room codes are the one security-relevant value
that does not.

**Impact.** A determined attacker who can observe or infer a few generated codes
could predict subsequent codes and target/join specific rooms. Low for a casual
game, but trivially avoidable.

**Fix.** Use `randomInt` from `node:crypto` (`crypto.randomInt(0, CODE_ALPHABET.length)`)
for each character.

**Test.** A unit test is not meaningful for randomness; a lint/static-analysis rule
(or code review) that bans `Math.random` in `server/src` is the appropriate guard.

---

## F8 — Low — Trail history has no match-status or retention boundary

**Exploit scenario.** `locationHistory` (`rooms.ts:570-601`) checks only that the
viewer is a non-eliminated hunter and that `trailsEnabled` is true; it does not
check that the match is `hunting` (or even that the requesting hunter's match is
the same one whose history is requested, though the `match_id` scoping makes that
harmless). It returns up to 500 historical points per prey.

**Impact.** A hunter can pull a prey's full trail after a match has ended, and the
trail data itself is retained indefinitely in `location_reports`. This is likely
intended as post-match review, but there is no explicit boundary or retention, so
historical real-world movements accumulate without limit.

**Fix.** Decide and document a retention policy; optionally restrict history to the
active match (or an explicit post-match window) and prune old `location_reports`.

**Test.** A test asserting history is rejected (or gated) for a `finished` match,
plus a retention unit test.

---

## F9 — Low — CORS reflects any origin

**Exploit scenario.** `app.register(cors, { origin: true })` (`app.ts:79`) echoes
the request `Origin`, effectively allowing cross-origin requests from any site.
Because authentication is a bearer header (not a cookie), a browser from another
origin cannot silently reuse a victim's token, so CSRF is largely neutralized —
but the setting is broader than necessary.

**Impact.** Minimal today (no cookie auth), but it removes a defense-in-depth
layer and should be tightened before any browser client ships (as `SECURITY.md`
already notes).

**Fix.** Restrict `origin` to the concrete client origins (or `false` if only the
mobile app is a client).

**Test.** An integration test asserting a cross-origin request with a foreign
`Origin` is rejected (or not echoed) once the allow-list is configured.

---

## F10 — Low — Rate-limit map unbounded; `trustProxy` disabled

**Exploit scenario.** `RateLimiter` keys a `Map` that is never pruned
(`app.ts:46-66`); long-lived processes accumulate entries for every
`register:<ip>`/`login:<ip>`/`join:<id>`/`chat:<id>`/`tag:<id>` key. With
`trustProxy: false` (`app.ts:76`), `req.ip` behind a reverse proxy becomes the
proxy's single address, collapsing all clients into one rate-limit bucket.

**Impact.** Slow memory growth, and either over- or under-limiting once a proxy is
introduced. Low today, relevant at deployment.

**Fix.** Prune expired entries in `check()` (or use a fixed-size/evicting map), and
set `trustProxy` appropriately when a proxy is added.

**Test.** A unit test that advances the clock and asserts expired entries are
removed.

---

## F11 — Info — Head-start location reports are accepted server-side

**Exploit scenario.** `reportLocation` allows reports in `head_start`
(`rooms.ts:460`). The official client only starts the tracking service during
`hunting` (`RoomScreen.kt:294`), so honest prey do not report during the head
start; but the server accepts such reports, and the *latest* report (from the head
start) is then surfaced to hunters the moment hunting begins (it is within the
`staleAfter` window).

**Impact.** A prey who (deliberately or by client bug) reports during the head
start reveals their hiding spot at the transition. Harmless to prey against their
will, but slightly inconsistent with the "head start = hidden" model.

**Fix.** Optionally reject reports during `head_start` server-side to match the
client, or document the behavior.

**Test.** A test asserting a head-start location POST is rejected (if that policy
is adopted).

---

## Verified controls

Evidence-backed controls that are genuinely well implemented:

- **Password hashing.** scrypt `N=16384, r=8, p=1`, 16-byte per-user salt, 32-byte
  key, `timingSafeEqual` comparison, and a dummy-hash fallback for unknown users to
  keep login timing uniform (`auth.ts:26-44, 66-74`).
- **Session tokens.** 32 random bytes via `randomBytes`, stored only as SHA-256,
  30-day expiry, server-side revocation, and a fresh token per login/register (no
  fixation) (`auth.ts:18-20, 77-99`).
- **Authorization re-checks.** Every room/match endpoint re-verifies membership;
  admin-only actions (`start`/`end`/`pause`/`resume`/`settings`/`resolve`) call
  `requireAdmin`; verified by tests (`security.test.ts:5,131`, `api.test.ts:89`,
  `history.test.ts:89,161`).
- **Teams lock at start.** `setTeam` rejects non-lobby (`rooms.ts:167`); tested
  (`api.test.ts:123`).
- **Location privacy (REST).** `latestLocations`/`locationHistory` require the
  Hunters team and reject eliminated spectators; history additionally requires
  `trailsEnabled` (`rooms.ts:520-581`); tested (`api.test.ts:136-191`,
  `security.test.ts:24`, `history.test.ts:248`).
- **Tag integrity.** Hunter-only claims, prey-only confirm/dispute, 60 s idempotent
  duplicate claims, and elimination that cannot double-apply; tested
  (`api.test.ts:193-272`).
- **Server-authoritative timers.** Phases derive from persisted timestamps
  (`computedPhase`), reconciled on read and by a 1 s tick; pause/resume shifts
  deadlines atomically; tested (`domain.test.ts:101`, `api.test.ts:274,314`,
  `history.test.ts:150-246`).
- **Input validation.** zod schemas plus domain bounds for coordinates, accuracy,
  timestamps, settings, and chat length (`app.ts:23-36`, `domain/match.ts`,
  `rooms.ts:464-475`); tested (`security.test.ts:51`, `domain.test.ts`).
- **Rate limits.** auth 10/min/IP, join 20/min/user, chat 10/10 s, tags 10/min
  (`app.ts:116-218`); tested (`security.test.ts:114`).
- **Body caps.** 256 KB HTTP, 64 KB WebSocket payload (`app.ts:75,80`).
- **No secret material in logs/audit.** No coordinates in `audit_events`
  (`rooms.ts:497` stores only `matchId`); `/ws` request logging suppressed
  (`app.ts:260-262`); no credentials or API keys found in the repository;
  `.env*`/`data/`/`*.db` gitignored; no Android signing keys present.
- **SQL injection resistance.** All queries use parameterized `prepare`/`run`; no
  user input is string-interpolated into SQL.
- **WS membership gate.** `subscribe` re-checks room membership server-side
  (`app.ts:284-291`).
- **Android service isolation.** `TrackingService` is `exported="false"` with
  `foregroundServiceType="location"` and the `FOREGROUND_SERVICE_LOCATION`
  permission (`AndroidManifest.xml:7-22`).
- **Restart safety.** Match state (including `paused_at`) is persisted; migration
  is idempotent and tested (`db.ts:18-30`, `history.test.ts:340`,
  `api.test.ts:314`).

## Could not verify

The following could not be verified from static reading alone and are not claimed
as verified:

- **TLS / actual network exposure.** `DEPLOYMENT.md` states the service binds
  `127.0.0.1`, has no inbound firewall rule, and no proxy; I did not scan the
  public IP or a live instance.
- **Real-device behaviour.** GPS capture quality, foreground-service notification
  visibility (Android 13+ `POST_NOTIFICATIONS` is declared but never requested at
  runtime), OS battery throttling, and whether Android Auto Backup exfiltrates the
  token in practice.
- **GPS spoofing resistance.** Heuristics flag speed/accuracy outliers but cannot
  stop a compromised device; not assessed against real spoofing tools.
- **Reverse-proxy behaviour.** Whether a future proxy redacts `/ws` query strings
  (F6) cannot be verified until one exists.
- **Multi-instance scaling.** The single-writer SQLite assumption and the re-entrant
  `tx()` helper assume one process; horizontal scale is out of scope and untested.
- **Dependency audit result.** `npm audit` runs in CI as an advisory step but was
  not executed during this review.

## Top 5 fixes by risk reduction

1. **F1** — Restrict the WS `prey_location` recipient filter to hunters only
   (`rooms.ts:510-515`) and add a realtime regression test. One-line change that
   closes the only server-side authorization inconsistency found.
2. **F3** — Restrict `resolveTag` to `disputed` tags and forbid self-resolution
   (`rooms.ts:417-433`). Restores the prey-confirmation trust model.
3. **F4** — Rate-limit and add retention for location reports
   (`app.ts:243-246`). Prevents the only un-throttled authenticated write and the
   unbounded location store.
4. **F2** — Terminate TLS and disable cleartext in release builds
   (`AndroidManifest.xml`, `build.gradle.kts`, `config.ts`). The single biggest
   privacy win before any public exposure.
5. **F5** — Encrypt the Android session token at rest and set
   `allowBackup="false"` (`SessionStore.kt`, `AndroidManifest.xml`). Protects the
   highest-value client secret.
