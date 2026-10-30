# Testing

What runs on every change, how to run it yourself, and what is deliberately not covered.
Commands are real: CI executes the same gates on every push.

## What CI runs

`.github/workflows/ci.yml` has three jobs:

| Job | Steps |
|---|---|
| **Server (typecheck + tests)** | `npm ci` → `npx tsc --noEmit` → `npm test` → start the server on `127.0.0.1:8080` and run `node scripts/smoke.mjs` + `node scripts/match-sim.mjs` against it |
| **Android (build + JVM tests)** | assemble the debug APK, run the Robolectric/JVM unit tests, run Android lint, upload the APK and UI screenshots as artifacts |
| **In-app test (real emulator)** | boot an Android 36 emulator (Pixel 6), run the instrumented in-app match test against a live local backend, upload screenshots and reports |

`release.yml` reuses the Android build path to produce the signed release APK on every `v*` tag.

## Backend

```bash
cd server
npm ci
npm run typecheck        # tsc --noEmit (Node runs the .ts sources natively)
npm test                 # node --test test/*.test.ts
```

The suite uses in-memory SQLite and `fastify.inject`, so it needs no running server. What it
covers:

- `test/domain.test.ts` — haversine accuracy, destination/radius, point-in-polygon, shrink
  clamping, implied speed, coordinate validation, `canStart` (balance/minimum/readiness), phase
  derivation including expiry, victory, settings validation.
- `test/api.test.ts` — register/login/me/duplicate, room create/join, non-admin start, unready
  blocking, team lock, head-start → hunting, location visibility (hunters only), trails gating,
  tag confirm/eliminate/hunters-win, dispute + admin resolve, duplicate tags, prey win on timer
  expiry, chat, state surviving a server restart.
- `test/rematch.test.ts` — a finished match clears eliminations, so the next start works.
- `test/tag-durability.test.ts` — durable tag claims: present in room state, replayed after
  restart, duplicate rejection, 90 s expiry → dispute + system message, message order on a
  match-ending confirmation.
- `test/security.test.ts`, `test/security_fixes.test.ts`, `test/history.test.ts`,
  `test/pagination.test.ts`, `test/properties.test.ts` — authz, malformed input, rate limits,
  history retention, chat pagination, and property-based geo/state checks.

Live-process checks (require a server already listening):

```bash
node scripts/smoke.mjs http://127.0.0.1:8080       # HTTP + WebSocket smoke checks
node scripts/match-sim.mjs http://127.0.0.1:8080   # three simulated players, full match
node scripts/load-test.mjs                         # load test; see docs/PERF.md
```

## Android

```bash
cd android
./gradlew :app:assembleDebug          # Windows: .\build.ps1
./gradlew :app:testDebugUnitTest      # Windows: .\test.ps1
./gradlew :app:lintDebug
```

- JVM tests cover the API client, models, map math, WebSocket parsing, session storage and a
  Robolectric Compose smoke test; screenshot tests render the current UI to PNGs under
  `app/build/screenshots`.
- The emulator test (`android/app/src/androidTest/`, run by CI) drives an in-app match flow
  end-to-end against a real backend.
- `.\install.ps1` installs and launches the app on a connected phone for manual testing; see
  [DEVICE_TESTING.md](DEVICE_TESTING.md) for the long-form device guide.

## Not covered

| Area | Why / status |
|---|---|
| Physical-phone behaviour of the current build | The current build is verified on the CI emulator; the last physical-device verification was an earlier version. Real GPS accuracy, battery use and background throttling still need a field test. |
| HTTPS / public TLS | The public deployment is plain HTTP; there is no certificate to test yet. |
| Long-running production load | [PERF.md](PERF.md) has honest localhost load numbers, not internet-scale results. |
| Browser client | None exists yet. |
| Dependency vulnerability scanning | `npm audit --omit=dev` runs in CI report-only and may fail softly without failing the build. |

Add a test with every behaviour change, especially auth, locations, tags and match phase rules
(see [CONTRIBUTING.md](../CONTRIBUTING.md)).
