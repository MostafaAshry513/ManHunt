# Architecture

## Components

```
Android app (Kotlin/Compose)          Backend (Node 24/Fastify)              Storage
┌──────────────────────────┐   HTTPS  ┌──────────────────────────────┐      ┌─────────┐
│ Compose UI / ViewModels  │ ───────► │ REST /api/*                  │ ───► │ SQLite  │
│ Repository               │          │ Auth (opaque tokens)         │      │  (WAL)  │
│  ├─ OkHttp REST          │   WSS    │ RoomService (authoritative)  │      └─────────┘
│  └─ OkHttp WebSocket     │ ◄──────► │ Hub (room-scoped broadcast)  │
│ Foreground location svc  │          │ Tick loop (1 s reconcile)    │
└──────────────────────────┘          └──────────────────────────────┘
```

The server is the only authority. Clients send intents; the server validates, persists and
broadcasts the resulting state.

## Match state machine

```
lobby ──start(admin)──► head_start ──timer──► hunting ──timer / all prey tagged──► finished
  ▲                        │                    │
  └──────── end / finish ──┴──── cancelled ◄────┘
```

- `head_start`: prey may move and report; hunters cannot see positions or tag.
- `hunting`: tags allowed, prey positions visible to hunters.
- `finished`: winner = `prey` if any prey is untagged at expiry, otherwise `hunters`.
- `paused`: admin-only; the match clock is frozen and tags/locations are rejected until resume.
  Resume shifts `head_start_ends_at` and `ends_at` by the paused duration so no time is lost.

Phases are derived, never stored as a client-supplied value:

```
computedPhase(match, now):
  head_start -> now >= ends_at ? finished : now >= head_start_ends_at ? hunting : head_start
  hunting    -> now >= ends_at ? finished : hunting
```

## Data model (SQLite)

| Table | Purpose |
|---|---|
| `users` | id, unique case-insensitive username, scrypt hash |
| `sessions` | sha256(token) -> user, expiry |
| `rooms` | code, name, admin, status, settings JSON |
| `room_members` | (room,user) team, ready, eliminated, joined_at |
| `matches` | status, start/head-start/end timestamps, winner, settings, zone origin+radius |
| `location_reports` | lat/lng/accuracy/recorded_at/received_at/flagged |
| `tags` | hunter, prey, status(pending/confirmed/disputed/rejected) |
| `messages` | room chat + system messages |
| `audit_events` | room, actor, type, JSON payload |
| `zone_events` | reserved for persisted shrink steps (radius is currently derived) |

Indexes cover `location_reports(match_id,user_id,recorded_at)`, `messages(room_id,id)`,
`tags(match_id,status)`.

## REST API

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/health` | - | liveness + DB check |
| POST | `/api/auth/register` | - | rate limited per IP |
| POST | `/api/auth/login` | - | rate limited per IP |
| POST | `/api/auth/logout` | bearer | revokes the token |
| GET | `/api/me` | bearer | |
| POST | `/api/rooms` | bearer | creator becomes admin |
| POST | `/api/rooms/join` | bearer | by code, lobby only |
| GET | `/api/rooms/:id` | member | full state snapshot |
| POST | `/api/rooms/:id/leave` | member | admin transfers |
| POST | `/api/rooms/:id/team` | member | lobby only |
| POST | `/api/rooms/:id/ready` | member | lobby only |
| PATCH | `/api/rooms/:id/settings` | admin | lobby only |
| POST | `/api/rooms/:id/start` | admin | atomic, validated |
| POST | `/api/rooms/:id/end` | admin | finish or cancel |
| POST | `/api/rooms/:id/pause` | admin | hunting only; freezes the clock |
| POST | `/api/rooms/:id/resume` | admin | shifts deadlines by the paused duration |
| GET | `/api/rooms/:id/history` | member | last 20 matches with winner and rosters |
| GET/POST | `/api/rooms/:id/messages` | member | chat history / send |
| POST | `/api/rooms/:id/tags` | hunter | idempotent within 60 s |
| POST | `/api/tags/:id/confirm` | tagged prey | eliminates on confirm |
| POST | `/api/tags/:id/dispute` | tagged prey | needs admin resolution |
| POST | `/api/tags/:id/resolve` | admin | confirmed / rejected |
| POST | `/api/matches/:id/location` | prey | validated + speed flags |
| GET | `/api/matches/:id/locations` | hunter | latest per prey, stale flags |
| GET | `/api/matches/:id/locations/:userId` | hunter | history, gated by `trailsEnabled` |
| GET | `/api/matches/:id` | member | flat match summary (phase, times, winner, zone) |

Errors: `{ "error": { "code": "...", "message": "..." } }` with 400/401/403/404/409/429.

## WebSocket

Connect: `GET /ws?token=<session token>` (same port). Invalid tokens close with code 4401.

Client -> server: `{type:"subscribe", roomId}`, `{type:"ping"}`

Server -> client:

| Event | Recipients | Payload |
|---|---|---|
| `hello` | the client | userId, username, server time |
| `room` | room subscribers | full state snapshot (members, phase, timers, zone) |
| `chat` | room | message or system notice |
| `prey_location` | hunters only (never an admin who is playing prey) | position report |
| `tag_request` | the targeted prey | pending tag |
| `tag_disputed` | room | disputed tag |
| `pong` | the client | server time |

Connection health is reflected as `connected` in the room snapshot; presence never gates
game correctness.

## Security boundaries

1. Every room/match endpoint re-checks membership and role server-side.
2. Teams lock at start; team changes are rejected while a match is active.
3. Location reads require the Hunters team; trails additionally require the setting.
4. Tag outcomes are decided by the server; duplicate claims are idempotent.
5. Start is atomic and validates player count, team balance and readiness.
6. Inputs are validated (zod + domain checks); bodies capped at 256 KB.
7. Rate limits: auth 10/min/IP, room join 20/min/user, chat 10/10 s, tags 10/min.
8. Passwords and tokens are never logged; only hashes are stored.

## Android structure (target)

```
app/src/main/java/com/manhunt/app/
├─ ManHuntApp.kt            root composable / nav host
├─ data/                    ApiClient, WebSocketClient, SessionStore, repository
├─ domain/                  models mirroring server contracts
├─ ui/                      theme, screens, components
├─ location/                TrackingService (foreground, type=location), permission flow
└─ map/                     MapHost abstraction over osmdroid
```
