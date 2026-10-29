# Testing

Everything below was executed on the build machine. Results are recorded, not assumed.

## Backend

```powershell
cd C:\dev\ManHunt\server
npm test          # node --test, in-memory SQLite + fastify.inject
npx tsc --noEmit  # type gate (no emit; Node runs .ts natively)
node scripts/smoke.mjs   # against a live server on 127.0.0.1:8080
```

### Results (2026-10-28)

| Command | Result |
|---|---|
| `npm test` | **45 passed, 0 failed** |
| `npx tsc --noEmit` | **clean** |
| `node scripts/smoke.mjs` | **SMOKE PASS** - 11 checks, real HTTP + WebSocket |
| `node scripts/match-sim.mjs` | **MATCH SIM PASS** - 13 checks, 3 players, full match |

Coverage by file:

- `test/domain.test.ts` - haversine accuracy, destination/radius, point-in-polygon, polygon
  area, shrink clamping, implied speed, coordinate validation, `canStart` (balance, minimum,
  readiness), phase derivation incl. expiry, victory, settings validation.
- `test/api.test.ts` - register/login/me/duplicate, room create/join, non-admin start,
  unready blocking, team lock, head-start -> hunting, location visibility (hunters only),
  trails gating, tag confirm/eliminate/hunters-win, dispute + admin resolve, idempotent
  duplicate tags, prey win on timer expiry, chat, **state survives a server restart**.
- `test/security.test.ts` - outsider access, prey cannot read locations or report as hunter,
  invalid coordinates/timestamps/accuracy, teleport flags, login rate limiting,
  admin-only settings/end, invalid bearer token.

Smoke test (live process) verifies: health, two registrations, room create/join, settings
patch, team switch, readiness, WebSocket subscribe, server-authorized start, prey location
POST, **hunter-only `prey_location` push**, and chat fan-out.

## Android

```powershell
cd C:\dev\ManHunt\android
.\build.ps1
.\test.ps1
```

| Command | Result |
|---|---|
| `build.ps1` | **BUILD SUCCESSFUL**, `app-debug.apk` produced |
| `test.ps1` | **21 tests passed** (ApiClient 4, Models 4, MapMath 2, Socket parser 6, SessionStore 4, AppSmoke 1) |
| `gradlew :app:lintDebug` | **0 errors** (warnings only: dependency update hints) |

Robolectric runs the real Compose UI through `AppSmokeTest`; parser and map math are pure
JVM tests. Android-specific behaviours below still require a device.

## Not verified (and why)

| Item | Blocker |
|---|---|
| Real GPS capture, accuracy filtering, background tracking | No emulator (no nested virtualisation) and no physical device attached. |
| Foreground service notification + OS battery behaviour | Requires a real device. |
| Map rendering and OSM tile requests | Requires a device/emulator to render; osmdroid also needs a real network viewport. |
| Multi-device gameplay | Only simulated clients can run here (multi-client HTTP/WS tests are feasible and planned). |
| Public HTTPS reachability | Inbound port not opened; see `DEPLOYMENT.md`. |
| Instrumentation/UI tests | Need a device or emulator. |

These are tracked in `IMPLEMENTATION_PLAN.md`; they are not counted as done.

## Running the backend test suite in CI

```yaml
- run: npm ci
- run: npx tsc --noEmit
- run: npm test
```
