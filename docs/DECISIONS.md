# Decisions

Format: decision, context, alternatives, consequence.

## D1 - Monorepo: `android/` + `server/` + `docs/`

Single repository so client, server and contracts evolve together. Alternatives
(two repos) rejected: no benefit at this scale, and the game rules live on both sides.

## D2 - Backend: Node 24 + TypeScript (native type stripping) + Fastify 5

Fastify gives fast routing, schema validation, `inject()` for socket-free integration
tests, and first-class WebSocket support on the same port.

Alternatives: NestJS (more ceremony, slower boot, decorators need a build step), Express
(no built-in test injection, weaker validation story), Go (would need a separate toolchain
and slower iteration here), .NET (fine, but Node is already installed and the team's
iteration loop is faster).

Consequence: no build step. Node runs `.ts` directly; `tsc --noEmit` is the type gate.

## D3 - Storage: SQLite via `node:sqlite`, WAL, single process

No Postgres and no Docker exist on this host. The game needs one authoritative writer and
modest throughput (tens of players). SQLite gives ACID transactions, sub-millisecond reads,
and a single file to back up.

Alternatives: Postgres (not installed; would add a service and native client), JSON files
(no transactions/atomicity), in-memory (loses matches on restart).

Consequence: single instance only. If horizontal scale is ever needed, swap the repository
layer for Postgres and add Redis/pub-sub for timers and broadcast.

## D4 - Authentication: opaque bearer tokens + scrypt

Random 32-byte tokens, stored as SHA-256 hashes with expiry. Passwords hashed with scrypt
(N=16384, r=8, p=1, per-user salt).

Alternatives: JWT (cannot be revoked without a denylist; longer blast radius if leaked),
external identity provider (account/billing dependency).

Consequence: one indexed lookup per request; logout and admin revocation are immediate.

## D5 - Server-authoritative time and rules

All phases derive from persisted timestamps (`started_at`, `head_start_ends_at`, `ends_at`).
A 1 s tick reconciles transitions; every read also reconciles lazily. Clients render
countdowns from `serverNow` + timestamps and never decide phase locally.

Consequence: a server restart never resets a match or grants a fresh head start.

## D6 - Tagging defaults to physical claim + prey confirmation

GPS proximity never eliminates anyone. A hunter submits a claim; the target confirms or
disputes; an admin resolves disputes. `instant` policy exists but is off by default.

Rationale: software cannot prove physical contact. Silent auto-confirmation would be
trivially abusable and unfair.

## D7 - Location privacy is role-based, not rank-based

Only players on the Hunters team can read prey positions or history. A room admin who is
playing as Prey gets no location powers (this was a real bug caught by a test).

History additionally requires `trailsEnabled`. Every endpoint re-checks authorization;
nothing relies on the UI hiding data.

## D8 - Maps: osmdroid + OSM raster tiles behind an interface

No API key or account, works offline-ish via tile cache, supports markers/polylines/
polygons needed for zones and trails.

Constraints: distinct User-Agent, visible attribution, >= 7 day cache, no prefetch.
A commercial tile provider can be substituted without touching game logic.

## D9 - Android networking: OkHttp 5 + kotlinx.serialization

One HTTP client for REST and WebSocket, mature, small. Alternatives: Ktor client
(heavier, multiplatform future is nice but the backend is platform-neutral anyway),
Retrofit (extra layer for little gain here).

## D10 - Android DI: manual composition root

No Hilt/Koin. One `AppContainer` built in `Application`. Fewer annotation processors,
faster builds, easier tests during a fast-moving build phase.

## D11 - Location provider: `LocationManager`, not Play Services

Play Services adds a large dependency and fails on devices without GMS. Native
`LocationManager` with a `location`-type foreground service covers the requirement.

Consequence: we do manual accuracy/age filtering; documented in the service.

## D12 - Zones: circular only for v1

Deterministic radius shrink (`max(min, base - step * elapsedIntervals)`), computed from
timestamps, so it survives restarts and needs no scheduler rows.

Polygon zones are represented in the domain (point-in-polygon + area) but the UI and room
settings currently expose circles only.
