# ManHunt API reference

Derived from the running code in `server/src/` (`app.ts`, `rooms.ts`, `auth.ts`,
`domain/match.ts`, `realtime.ts`) and the Android client contracts in `android/.../data/`.
If this document and the code disagree, the code wins - please fix the document.

## Conventions

- Base URL: `http://<host>:8080` in development. The Android debug build uses cleartext HTTP.
- All request and response bodies are JSON (`Content-Type: application/json`), including
  `/health`; the WebSocket endpoint uses JSON frames.
- All timestamps are Unix epoch **milliseconds** (integers, UTC).
- Most IDs are opaque strings: `usr_...`, `room_...`, `match_...`, `tag_...`. Chat messages
  and location reports use integer ids.
- Authentication is an opaque bearer token:

  ```http
  Authorization: Bearer <token>
  ```

  Tokens are created by register/login, stored hashed in SQLite, and expire after
  `SESSION_DAYS` (default 30). Logout revokes the current token. There is no refresh token.

- Request bodies are capped at 256 KB. The WebSocket frame limit is 64 KB.
- CORS is enabled for any origin; no cookies are used.
- Application errors (including 413/429/500) use this shape:

  ```json
  { "error": { "code": "cannot_start", "message": "Need at least 2 players (currently 1)" } }
  ```

  An unmatched route is answered by Fastify's built-in 404 handler instead, which does not
  use this shape.

- Common error codes: `invalid_body` (400), `unauthorized` (401), `forbidden` (403),
  `not_found` (404), `conflict`/specific 409 codes, `rate_limited` (429),
  `payload_too_large` (413), `internal` (500). Endpoint sections below list the notable
  endpoint-specific codes; any authenticated endpoint can also return `unauthorized` for a
  missing, invalid or expired token.

### Rate limits

Limits are in-memory per server process, keyed by IP or user id; they reset on restart.
Exceeding one returns `429 { "error": { "code": "rate_limited", ... } }`.

| Action | Key | Limit |
|---|---|---|
| Register, login | client IP | 10 per 60 s |
| Join room | user id | 20 per 60 s |
| Send chat message | user id | 10 per 10 s |
| Request a tag | user id | 10 per 60 s |
| Report a location | user id | 20 per 60 s |

### Room state snapshot

Several endpoints return the same snapshot (`buildState`). The WebSocket `room` event uses
exactly this shape:

```json
{
  "room": {
    "id": "room_...",
    "code": "ABC234",
    "name": "Friday Hunt",
    "adminId": "usr_...",
    "status": "active",
    "settings": { "...": "see Room settings" },
    "createdAt": 1760000000000
  },
  "members": [
    {
      "userId": "usr_...",
      "username": "alice",
      "team": "prey",
      "ready": true,
      "connected": true,
      "eliminated": false,
      "isAdmin": true
    }
  ],
  "match": {
    "id": "match_...",
    "phase": "hunting",
    "status": "hunting",
    "startedAt": 1760000000000,
    "headStartEndsAt": 1760000300000,
    "endsAt": 1760003900000,
    "now": 1760001000000,
    "winner": null,
    "preyAlive": 1,
    "preyTotal": 1,
    "zone": null
  },
  "serverNow": 1760001000000
}
```

- `room.status` is `lobby`, `active` or `closed`.
- `match` is `null` until the room has ever started a match; afterwards it is the active
  match or the latest finished/cancelled one.
- `match.status` is the persisted phase; `match.phase` is derived from timestamps (see
  [Phases](#phases-and-transitions)). `now` and `serverNow` are the server clock.
- `zone` is `null` in open mode, otherwise
  `{ "centerLat": 51.5, "centerLng": -0.12, "radiusM": 800, "nextShrinkAt": 1760000300000 | null }`.
- `connected` reflects live WebSocket presence only; it never gates game rules.

## Endpoints

### Health

| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| GET | `/health` | none | - | `{ "ok": true, "now": 1760000000000, "service": "manhunt", "version": "0.1.0" }` |

Runs `SELECT 1` against SQLite, so a 500 means the database is unavailable.

### Auth

#### POST `/api/auth/register`

Rate limited per IP. No auth. Returns 200 (not 201).

```json
{ "username": "alice", "password": "password123" }
```

- `username`: 3-24 characters, `A-Z a-z 0-9 _` only. Case-insensitive uniqueness.
- `password`: 8-200 characters.

Response:

```json
{ "token": "opaque-token", "user": { "id": "usr_...", "username": "alice", "created_at": 1760000000000 } }
```

Errors: `invalid_username`, `invalid_password`, `username_taken` (400), `rate_limited` (429).

#### POST `/api/auth/login`

Same body, response and rate limit as register. Errors: `unauthorized` (401, invalid
credentials), `rate_limited` (429). Unknown usernames still run a password hash check to
keep timing uniform.

#### POST `/api/auth/logout`

Bearer auth. No body. Deletes the session for the presented token: `{ "ok": true }`.

#### GET `/api/me`

Bearer auth. Response: `{ "user": { "id": "usr_...", "username": "alice", "created_at": 1760000000000 } }`.
The Android client validates a stored token with this endpoint on launch.

### Rooms

#### POST `/api/rooms`

Bearer auth. Creates a room; the creator becomes admin and joins as `prey`.

```json
{ "name": "Friday Hunt" }
```

`name` is trimmed and truncated to 60 characters; after trimming it must be at least 2
characters (400 `invalid_name`). Response: room state snapshot.
The 6-character join code uses an unambiguous alphabet (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).

#### POST `/api/rooms/join`

Bearer auth, rate limited per user. Body: `{ "code": "ABC234" }` (trimmed, upper-cased).

- Already a member: returns the current snapshot, even mid-match.
- Room missing or closed: 404 `not_found`.
- Match already running and not a member: 409 `match_in_progress`.
- 50 members already: 409 `room_full`.
- New members join as `prey`, not ready. Response: room state snapshot.

#### GET `/api/rooms/:id`

Bearer auth, room member. Response: room state snapshot.

A non-member receives **401 `unauthorized`** ("Not a member of this room"), including for a
room id that does not exist.

#### POST `/api/rooms/:id/leave`

Bearer auth. No body. Removes the caller from the room: `{ "ok": true }`.

- If the admin leaves, the earliest-joined remaining member becomes admin.
- If the last member leaves, `room.status` becomes `closed`.
- Errors: 404 `not_found`, 403 `forbidden` (not a member).

#### POST `/api/rooms/:id/team`

Bearer auth, room member, lobby only. Body: `{ "team": "prey" }` or
`{ "team": "hunters" }`. Resets the caller's ready flag. Response: snapshot.

Errors: 404, 403 (not a member), 400 `invalid_team`, 409 `teams_locked`.

#### POST `/api/rooms/:id/ready`

Bearer auth, room member, lobby only. Body: `{ "ready": true }`. Response: snapshot.

Errors: 404, 403, 409 `match_in_progress`.

#### PATCH `/api/rooms/:id/settings`

Bearer auth, **admin**, lobby only. Body is a partial settings object; it is merged over the
current settings (including a one-level merge of `shrink`) and re-validated. Unknown keys are
dropped. Returns the snapshot, including the normalised settings.

```json
{ "headStartSec": 600, "durationSec": 5400, "trailsEnabled": false }
```

Errors: 404, 403 (not admin), 409 `settings_locked`, 400 `invalid_settings` with a
semicolon-separated explanation such as `mode: zone mode requires a zone`.

#### POST `/api/rooms/:id/start`

Bearer auth, **admin**, lobby only. No body. Starts a match after validating:

- at least `minPlayers` active (not eliminated) members,
- at least one active prey and one active hunter,
- every active member is ready.

Errors: 404, 403, 409 `match_in_progress`, 409 `cannot_start` (message lists every reason).
Response: snapshot whose `match.phase` is `head_start` (or `hunting` immediately when
`headStartSec` is 0). Timers are server-side:

```
startedAt        = now
headStartEndsAt  = now + headStartSec * 1000
endsAt           = headStartEndsAt + durationSec * 1000
```

#### POST `/api/rooms/:id/end`

Bearer auth, **admin**, active match required. Optional body: `{ "cancelled": true }`.

- `cancelled: true` -> phase/status `cancelled`, `winner: null`.
- otherwise -> `finished`; `winner` is `prey` if at least one prey is alive, else `hunters`.

Both paths set `room.status = "lobby"` and clear readiness. Response: snapshot.

Errors: 404, 403, 409 `no_active_match`.

#### POST `/api/rooms/:id/pause`

Bearer auth, **admin**. Only valid while the computed phase is `hunting`. No body.
Freezes the clock; tags and location reports are rejected while paused. Response: snapshot
with `match.phase: "paused"`.

Errors: 404, 403, 409 `no_active_match`, `already_paused`, `not_hunting`.

#### POST `/api/rooms/:id/resume`

Bearer auth, **admin**. Only valid while paused. No body. Shifts `headStartEndsAt` and
`endsAt` forward by the paused duration, so remaining time is preserved. Response: snapshot
with `match.phase: "hunting"`.

Errors: 404, 403, 409 `no_active_match`, `not_paused`.

#### GET `/api/rooms/:id/history`

Bearer auth, room member. Returns the 20 most recent matches, newest first.

```json
{
  "matches": [
    {
      "id": "match_...",
      "startedAt": 1760000000000,
      "endedAt": 1760001800000,
      "winner": "hunters",
      "cancelled": false,
      "durationSec": 1800,
      "prey": ["alice"],
      "hunters": ["bob", "cara"]
    }
  ]
}
```

`durationSec` includes the head start. Rosters are read from the room's **current**
membership, not a per-match snapshot. An in-progress match also appears, with `endedAt`,
`winner` and `durationSec` null. Cancelled matches have `winner: null` and `cancelled: true`.
Errors: 404, 403.

#### GET `/api/rooms/:id/messages`

Bearer auth, room member. Returns the last 50 messages in ascending id order (system and
chat interleaved; no pagination parameters).

```json
{
  "messages": [
    { "id": 12, "userId": "usr_...", "username": "alice", "kind": "chat", "body": "north gate", "createdAt": 1760000000000 },
    { "id": 13, "userId": null, "username": "System", "kind": "system", "body": "bob joined the room", "createdAt": 1760000000000 }
  ]
}
```

Errors: 404, 403.

#### POST `/api/rooms/:id/messages`

Bearer auth, room member, rate limited per user. Body: `{ "body": "north gate" }`.
The body is trimmed; it must be 1-500 characters. Returns the created message and broadcasts
a `chat` event:

```json
{ "id": 14, "userId": "usr_...", "username": "alice", "kind": "chat", "body": "north gate", "createdAt": 1760000000000 }
```

Errors: 404, 403, 400 `empty_message` / `message_too_long`, 429.

### Tags

A tag is visible as:

```json
{ "id": "tag_...", "matchId": "match_...", "hunterId": "usr_...", "preyId": "usr_...", "status": "pending", "createdAt": 1760000000000 }
```

Statuses: `pending`, `confirmed`, `disputed`, `rejected`.

#### POST `/api/rooms/:id/tags`

Bearer auth, **hunter**, phase `hunting`, rate limited per user.
Body: `{ "preyId": "usr_..." }`.

- The target must be a prey member who is not eliminated (400 `invalid_target`,
  409 `already_tagged`).
- With `tagPolicy: "confirm"` (default) the tag is `pending`; only the target prey receives a
  `tag_request` WebSocket event.
- With `tagPolicy: "instant"` the tag is immediately `confirmed` and the prey is eliminated;
  no `tag_request` is sent.
- Idempotency: if the same hunter already requested a tag for the same prey within 60 s, the
  existing tag is returned instead of creating a new one (unless the prey is now eliminated,
  in which case 409 `already_tagged` wins).

Errors: 404 (room), 409 `no_active_match` / `not_hunting`, 403 (not a hunter), 400
`invalid_target`, 409 `already_tagged`, 429.

#### POST `/api/tags/:id/confirm`

Bearer auth, **only the tagged prey**. No body. Marks the tag `confirmed` and eliminates the
prey. Returns the tag view. If this was the last living prey, the match finishes immediately
with `winner: "hunters"`.

Errors: 404 `not_found`, 403 (not the tagged prey), 409 `tag_resolved`.

#### POST `/api/tags/:id/dispute`

Bearer auth, **only the tagged prey**. No body. Marks the tag `disputed`; the prey is **not**
eliminated. Broadcasts `tag_disputed` to the room and returns the tag view.

Errors: 404, 403, 409 `tag_resolved`.

#### POST `/api/tags/:id/resolve`

Bearer auth, **room admin**. Only a `disputed` tag can be resolved. Body:
`{ "decision": "confirmed" }` or `{ "decision": "rejected" }`.

- `confirmed`: eliminates the prey (and can finish the match).
- `rejected`: the prey stays alive; the tag is recorded as rejected.

Returns the tag view. Errors: 404, 403 (not admin), 409 `tag_not_disputed`.

### Matches and locations

#### GET `/api/matches/:id`

Bearer auth, member of the match's room. Flat summary, available in every phase:

```json
{
  "id": "match_...",
  "phase": "finished",
  "status": "finished",
  "startedAt": 1760000000000,
  "headStartEndsAt": 1760000300000,
  "endsAt": 1760003900000,
  "endedAt": 1760003600000,
  "winner": "prey",
  "preyAlive": 1,
  "preyTotal": 1,
  "zone": null,
  "now": 1760004000000
}
```

Errors: 404 (match), 403 (not a room member).

#### POST `/api/matches/:id/location`

Bearer auth, **prey only**, not eliminated, rate limited per user. Accepted in `head_start`
and `hunting`; rejected while paused/finished/cancelled.

```json
{ "lat": 51.5007, "lng": -0.1246, "accuracy": 6.5, "recordedAt": 1760001000000 }
```

- `lat`/`lng` must be finite and in range; `accuracy` 0-2000 m (optional);
  `recordedAt` defaults to server now and must be within `now - 15 min` .. `now + 60 s`.
- A report is accepted but **flagged** (`flagged: true`) when the finite implied speed from
  the previous report exceeds 55 m/s or accuracy exceeds 500 m. Flagged reports are still
  stored and broadcast; the flag is advisory. A non-increasing `recordedAt` produces an
  infinite implied speed, which the current check does **not** flag.
- During `hunting`, accepted reports are broadcast as `prey_location` to hunters only.
  During `head_start` they are stored without a broadcast.

Response: `{ "ok": true, "flagged": false, "reportId": 42 }`.

Errors: 404 (match), 403 (not a member / not prey / eliminated spectator), 409
`match_not_running`, 400 `invalid_coordinates` / `invalid_timestamp` / `invalid_accuracy`,
429.

#### GET `/api/matches/:id/locations`

Bearer auth, **hunter**, not eliminated, phase exactly `hunting`. Returns the latest report
per prey, including prey with no report yet.

```json
{
  "now": 1760001000000,
  "staleAfterMs": 600000,
  "prey": [
    {
      "userId": "usr_...",
      "username": "alice",
      "lat": 51.5007,
      "lng": -0.1246,
      "accuracy": 6.5,
      "recordedAt": 1760000900000,
      "receivedAt": 1760000901000,
      "stale": false,
      "flagged": false,
      "eliminated": false,
      "hasReport": true
    }
  ]
}
```

`staleAfterMs = max(60 s, locationIntervalSec * 2)`. A prey with no report has `lat: null`,
`lng: null`, `hasReport: false` and `stale: true`.

Errors: 404, 403 (not a member / spectator / not a hunter / phase is not `hunting`, including
head start and paused). The head-start rejection uses code `forbidden`.

#### GET `/api/matches/:id/locations/:userId`

Bearer auth, **hunter**, not eliminated, and `trailsEnabled` must be true. Returns up to 500
reports for that prey in ascending `recordedAt` order (SQL `LIMIT 500`, so this is the oldest
500, not the newest).

```json
{
  "matchId": "match_...",
  "userId": "usr_...",
  "trailEnabled": true,
  "points": [
    { "lat": 51.5007, "lng": -0.1246, "accuracy": 6.5, "recordedAt": 1760000900000, "flagged": false }
  ]
}
```

Errors: 404, 403 (not a member / spectator / not a hunter), 403 `trails_disabled`.

## WebSocket

Connect to the same host/port:

```
ws://127.0.0.1:8080/ws?token=<url-encoded session token>
```

- The token is passed in the query string (the route suppresses request logging).
- Missing, invalid or expired token: the server closes with code **4401** and reason
  `unauthorized`.
- `hello` is sent immediately, before any subscription.
- One socket subscribes to at most one room; subscribing again replaces `roomId` (there is no
  `unsubscribe` frame). Closing the socket leaves the room and broadcasts an updated snapshot.
- Each connection has a 64 KB frame limit. Malformed JSON and unknown frame types are
  ignored silently.

### Client -> server frames

```json
{ "type": "subscribe", "roomId": "room_..." }
{ "type": "ping" }
```

`subscribe` checks membership. On success the server subscribes the socket, sends a `room`
snapshot to it, then broadcasts another `room` snapshot to all subscribers. A non-member gets
an `error` frame and remains connected.

### Server -> client events

Every frame is `{ "type": "...", "data": { ... } }`.

| Event | When / recipients | `data` fields |
|---|---|---|
| `hello` | immediately to the new socket | `userId`, `username`, `now` |
| `room` | after a successful subscribe and after room/match mutations (membership, teams, readiness, settings, start/end/pause/resume, tags) to all room subscribers | full room state snapshot |
| `chat` | room subscribers when a chat or system message is created | `id`, `userId` (null for system), `username`, `kind` (`chat`/`system`), `body`, `createdAt` |
| `prey_location` | hunters only, non-eliminated, while `hunting`, on each accepted live report | `matchId`, `userId`, `username`, `lat`, `lng`, `accuracy` (nullable), `recordedAt`, `receivedAt`, `flagged` |
| `tag_request` | only the targeted prey, when a `confirm`-policy tag is created | tag view: `id`, `matchId`, `hunterId`, `preyId`, `status` (`pending`), `createdAt` |
| `tag_disputed` | all room subscribers when a prey disputes | tag view: `id`, `matchId`, `hunterId`, `preyId`, `status` (`disputed`), `createdAt` |
| `pong` | reply to the requesting socket's `ping` | `now` |
| `error` | requesting socket (currently only a forbidden `subscribe`) | `code` (e.g. `forbidden`), `message` |

Notes:

- There is no dedicated event for tag confirmation, rejection, elimination or match finish.
  Clients learn these from the next `room` snapshot (or by polling).
- `prey_location` visibility is role-based. An admin who is playing as prey never receives
  positions, on either REST or WebSocket.
- `chat` system messages are broadcast with `"id": 0`; the history endpoint returns their real
  database ids, so ids are not stable between the socket event and later history.

## Room settings

Returned in every snapshot, written by `PATCH /api/rooms/:id/settings`. Defaults and bounds
come from `server/src/domain/match.ts`.

| Field | Type | Default | Bounds / values |
|---|---|---|---|
| `headStartSec` | integer seconds | `300` | 0-1800 |
| `durationSec` | integer seconds | `3600` | 300-14400 (5 min - 4 h); excludes the head start |
| `minPlayers` | integer | `2` | 2-50 |
| `locationIntervalSec` | integer seconds | `300` | 30-3600; client reporting cadence and stale threshold |
| `trailsEnabled` | boolean | `true` | hunters may read location history |
| `mode` | string | `"open"` | `"open"` or `"zone"` |
| `zone` | object or null | `null` | required when `mode` is `"zone"` |
| `shrink` | object | see below | only meaningful in zone mode |
| `tagPolicy` | string | `"confirm"` | `"confirm"` (prey confirms) or `"instant"` |

`zone`:

| Field | Type | Bounds |
|---|---|---|
| `centerLat` | number | -90 to 90 |
| `centerLng` | number | -180 to 180 |
| `radiusM` | number | 50-20000 |

`shrink` (all fields required inside the object; a patch may send a partial object):

| Field | Type | Default | Bounds |
|---|---|---|---|
| `enabled` | boolean | `false` | - |
| `intervalSec` | integer seconds | `120` | 30-3600 |
| `stepM` | number metres | `25` | 5-5000 |
| `minRadiusM` | number metres | `100` | 25-5000 |
| `warningSec` | integer seconds | `30` | 0-300 |

Cross-field validation:

- `mode: "zone"` requires a non-null `zone`.
- In zone mode with shrink enabled, `shrink.minRadiusM` must be less than `zone.radiusM`.
- Shrink radius is derived, not persisted:
  `radiusM = max(minRadiusM, zone.radiusM - floor(max(0, now - headStartEndsAt) / intervalSec) * stepM)`.
  `nextShrinkAt` is the next step boundary, or `null` at the minimum radius.
- `warningSec` is stored but no warning event is emitted.
- Zone membership is **not enforced**: reports outside the radius are still accepted. The
  zone is drawn by the client only.

## Phases and transitions

Room status and match phase are separate:

- `room.status`: `lobby` -> `active` on start -> `lobby` when the match finishes/cancels;
  `closed` when the last member leaves.
- `match.phase` / `match.status`: `head_start`, `hunting`, `paused`, `finished`,
  `cancelled`. (`lobby` exists in the type as the room status value, not as a match phase.)

```
lobby --start(admin)--> head_start --headStartEndsAt--> hunting --endsAt--> finished
                          |                             |
                          |                             +-- all prey tagged --> finished (hunters)
                          +-- admin end ---------------> finished / cancelled
hunting --pause(admin)--> paused --resume(admin)--> hunting (deadlines shifted forward)
```

Rules enforced by `computedPhase` and `RoomService.reconcile`:

- `head_start`: prey may move and post locations; hunters can neither read locations nor tag.
- `hunting`: tags and location reads are allowed.
- `paused`: only reachable from `hunting`; tags and location reports are rejected (409).
  Resume sets status back to `hunting` and adds the paused duration to both `headStartEndsAt`
  and `endsAt`.
- `finished`: the timer expired, the admin ended it, or the last prey was eliminated.
  Winner is `prey` if `preyAlive > 0 && preyTotal > 0`, otherwise `hunters`.
- `cancelled`: admin ended with `{ "cancelled": true }`; `winner` is null.
- Phase changes are applied by a 1-second server tick and lazily by state endpoints
  (`GET /api/rooms/:id`, history, match summary, location and tag calls), so clients should
  use `phase` rather than computing transitions from `status`.
- After `finished`/`cancelled` the room returns to `lobby`, readiness is cleared, and the
  match summary/history remain readable.

## Client implementation notes

- **Server clock offset.** Every snapshot carries `serverNow` (and the match carries `now`).
  Compute `offset = serverNow - localNowAtReceipt`, then render countdowns as
  `target - (localNow + offset)`. Re-sync on every `room` event. Do not trust the device clock
  for phases; the server reconciles them.
- **WebSocket is an accelerator, not a requirement.** Polling is allowed and expected as a
  fallback: `GET /api/rooms/:id` for state and `GET /api/rooms/:id/messages` for chat. The
  Android client polls every 10 s while the socket is connected or reconnecting. No game rule
  depends on a socket being open.
- **Prey privacy is role-based, not admin-based.** Prey never receive `prey_location` events;
  `GET .../locations` and `.../locations/:userId` return 403 for prey (and for an admin who is
  playing prey). Eliminated prey become spectators: chat and snapshots still work, but they
  cannot report or read locations, and teams are locked while the match runs.
- **Reconnect flow.** Reopen `/ws?token=...`, wait for `hello`, send `subscribe`, and use the
  returned `room` snapshot to replace local state. There is no replay of missed chat or
  location events; re-fetch state and chat, and latest/trail locations where the role allows,
  over REST.
- **Location cadence is client-driven.** The server validates and stores reports but does not
  schedule them; `locationIntervalSec` tells the client how often to report (the Android
  foreground service uses it). Stale markers on the hunter side use twice that interval.
- **Tolerate unknown fields and events.** The Android JSON parser ignores unknown keys and
  unknown event types, which keeps older clients working.

## Known implementation gaps

These are observed in the current code, not API guarantees:

- **Rematch bug (verified).** `finishMatch` clears readiness but not `eliminated`, and
  `startMatch` validates with `canStart` *before* clearing elimination. After a match in which
  every prey was tagged, the next `POST /api/rooms/:id/start` fails with 409 `cannot_start`
  ("At least one player must be on Prey") until the eliminated prey leaves and rejoins or a
  new room is used.
- Zone boundaries are not enforced and `shrink.warningSec` produces no event; `zone_events`
  is an unused reserved table.
- Match history rosters use current membership, not per-match snapshots.
- Chat has no pagination (last 50 only); location history returns the oldest 500 points.
- Out-of-order or duplicate `recordedAt` values make the implied speed infinite and are not
  flagged (`Number.isFinite(speed) ? speed > 55 : false`).
- The Android `SocketPayloadParser` handles `room`, `chat`, `prey_location` and `tag_request`
  only; it ignores `hello`, `pong`, `error` and `tag_disputed`. The Android UI also has no
  controls for ending a match or resolving a dispute, and the API client has no calls for
  end-match, location history or server-side logout (sign-out clears local state only), so
  those actions need another client today.
- A socket can be subscribed to one room at a time and there is no unsubscribe frame.
- `GET /api/rooms/:id` returns 401 rather than 403/404 for outsiders and unknown ids.
- Realtime system messages use `id: 0`, while history returns the stored id.
