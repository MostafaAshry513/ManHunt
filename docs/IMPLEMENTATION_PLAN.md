# Implementation plan

Living document. Statuses: Pending / In progress / Blocked / Completed / Verified.
"Verified" means the listed command was run and passed on this machine.

## Phase 0 - Environment discovery — Completed (verified)

- Host inventory, toolchain versions, network/firewall state: `docs/ENVIRONMENT.md`.
- Discovered: no nested virtualisation -> no usable emulator; no Docker/Postgres; no gh auth.

## Phase 1 - Research and architecture — Completed

- `docs/RESEARCH.md` (sources + conclusions), `docs/DECISIONS.md` (12 ADRs).
- `docs/ARCHITECTURE.md`: state machine, schema, API, WS contract, security boundaries.

## Phase 2 - Foundation — Completed (verified)

- Android project builds against API 37, AGP 9.5, Compose BOM 2026.09: `.\build.ps1` PASS.
- Backend TypeScript compiles under `tsc --noEmit`: PASS.
- Test harnesses in place for both sides.

## Phase 3 - Auth and rooms — Backend Completed (verified), Android Pending

- Register/login/logout/me, scrypt + opaque sessions, rate limiting.
- Create/join/leave room by code, admin transfer, members, teams, readiness.
- Real-time room snapshots over WebSocket.
- Tests: `test/api.test.ts`, `test/security.test.ts` (part of 30 passing).

## Phase 4 - Match lifecycle — Backend Completed (verified), Android Pending

- Server-authoritative start with full precondition checks.
- Head start (default 300 s), configurable duration, phase reconciliation, restart-safe.
- Victory: prey win at expiry if any prey survives; hunters win when all prey are tagged.
- Admin end/cancel.
- Tests: start authorization, unready blocking, team lock, head-start expiry, timer expiry.

## Phase 5 - Maps and GPS — Backend verified, Android implemented but unverified on device

- Done (verified): location validation, speed/accuracy flags, latest-per-prey with stale
  markers, history gated by `trailsEnabled`, circular zone + deterministic shrink, 30-day
  retention purge.
- Done (unverified): osmdroid map card with zone/markers/attribution, foreground
  `TrackingService` (type=location), permission flow, live position updates.
- Cannot verify here: real GPS fixes, background throttling, tile downloads (no device).

## Phase 6 - Tagging and multiplayer extras — Mostly done

- Done (verified): claim/confirm/dispute/admin-resolve (disputes only), idempotency,
  elimination, spectator lockout, chat + system messages, audit events, pause/resume.
- Done (verified): match history endpoint + Android history dialog.
- Done (unverified): Android tag picker, incoming tag dialog, clip-free spectator banner.
- Pending: anti-cheat review dashboard, match summary screen beyond the history dialog.

## Phase 7 - UI/UX — In progress

Dark default + light palette, room settings editor, spectator banner, history dialog, empty
and error states. Still pending: onboarding/safety screen, accessibility audit, layout
inspection on device.

## Phase 8 - Full validation — In progress

Done: 43 backend tests, typecheck, smoke (11 checks), match simulation (13 checks),
16 Android JVM tests, APK build. Pending: device-based checks, load test, screenshot review.

## Phase 9 - Public deployment — Blocked

Requires explicit authorization to open an inbound port (and a domain or tunnel). See
`docs/DEPLOYMENT.md`. All locally testable work continues regardless.

## Phase 10 - Final audit — Pending
