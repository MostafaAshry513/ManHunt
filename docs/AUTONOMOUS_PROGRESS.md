# Autonomous progress

Updated: 2026-10-29

## Current state

End-to-end game loop exists on both sides: auth, rooms, teams, readiness, server-authoritative
match phases, pause/resume, GPS reporting, hunter map, physical tagging with confirm/dispute,
chat, spectator lockout, history, admin settings, safety onboarding.

## Last verified (all commands re-run by the lead)

| Check | Command | Result |
|---|---|---|
| Backend tests | `cd server; npm test` | 45/45 pass |
| Backend types | `npx tsc --noEmit` | clean |
| Live smoke | `node scripts/smoke.mjs` | 11/11 checks |
| Multi-client match | `node scripts/match-sim.mjs` | 13/13 checks |
| Android build | `cd android; .\build.ps1` | BUILD SUCCESSFUL |
| Android tests | `.\test.ps1` | 21/21 pass |
| Android lint | `gradlew :app:lintDebug` | 0 errors |
| Deploy scripts | parse + live health/backup | 5/5 parse, health 0/2, backup integrity ok |

APK: `android/app/build/outputs/apk/debug/app-debug.apk`.

## Recently fixed (from independent reviews)

- WS location leak to admins playing prey (High), admin bypass of prey tag confirmation,
  `Math.random` room codes, location rate limit + 30-day retention, `allowBackup`.
- Android: socket/polling leak on navigation, illegal background FGS start, no prey reports
  during head start, frozen countdown, eliminated prey still tracking, missing manifest icon.
- Backend: rematch after a hunters win was impossible (elimination state blocked `canStart`);
  same-timestamp teleport reports were not flagged.

## Ready / next tasks

1. Zone picker: tap map to set centre, radius slider (server validation already in place).
2. Accessibility audit: content descriptions, font scaling, contrast check.
3. Device verification pass (requires a phone; no emulator on this host).
4. Public HTTPS (blocked on inbound port + domain authorization).
5. Load/CI execution (CI exists; no GitHub auth here).

## Done in the latest pass

- Hunter trail polylines from real reported points (on-demand fetch, honours `trailsEnabled`).
- Admin end-match and disputed-tag resolution dialogs; `tag_disputed` parsed.
- Zone shrink countdown in the match card.
- Lint clean; manifest icon; backup rules; notification permission flow.

## Known limitations

- No emulator (no nested virtualisation) and no phone attached: GPS fixes, FGS behaviour,
  notification visibility, map tiles and two-phone play are UNVERIFIED.
- Debug build uses cleartext HTTP; TLS is required before public use.
- Single-node SQLite; horizontal scale needs a migration.
- Registration is CPU-bound by scrypt (~13/s on this VM), measured in `docs/PERF.md`.

## Key paths

- `server/src/{app,rooms,realtime,db,auth,config,server}.ts`, `server/src/domain/*`
- `server/test/*.test.ts`, `server/scripts/{smoke,match-sim,load-test}.mjs`
- `android/app/src/main/java/com/manhunt/app/{data,ui,map,location}`
- Reviews: `docs/SECURITY_REVIEW.md`, `docs/ANDROID_REVIEW.md`, perf: `docs/PERF.md`
- Team: `docs/TEAM_PLAN.md`, `docs/TEAM_TASKS.md`, `docs/TEAM_DECISIONS.md`
