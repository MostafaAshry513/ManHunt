# Autonomous progress

Updated: 2026-10-29

## Current state

End-to-end game loop exists on both sides: auth, rooms, teams, readiness, server-authoritative
match phases, pause/resume, GPS reporting, hunter map, physical tagging with confirm/dispute,
chat, spectator lockout, history, admin settings, safety onboarding.

## Last verified (2026-10-29)

| Check | Command | Result |
|---|---|---|
| Backend tests | `cd server; npm test` | 50/50 pass |
| Backend types | `npx tsc --noEmit` | clean |
| Live smoke | `node scripts/smoke.mjs` | pass |
| Multi-client match | `node scripts/match-sim.mjs` | 13/13 checks |
| Android build + JVM tests | GitHub Actions `Android` job | pass |
| Android lint | GitHub Actions `Android` job | pass |
| Full in-app match | GitHub Actions emulator job | pass (26.8s) |
| Real phone | Infinix SMART 5, Android 11, adb over Tailscale | lobby, GPS map, chat, tag, history, update download/verify/install verified |
| In-app update | 0.6.0 → 0.7.2 on the phone | download → SHA-256 verify → Play Protect scan → installed |
| Update persistence | force-stop after download | Install button restored from the verified cache |

Public APK: GitHub Releases (`v0.7.3`, signed release build). In-app update channel:
`http://74.208.99.178/api/app/latest` → `/app.apk`.
Real-device screenshots: `docs/screenshots/05-device-*` through `08-device-*`.

## Recently fixed (real-device pass)

- Bodyless POSTs (leave/start/pause) rejected by OkHttp; now sent with `{}`.
- Errors moved inside their cards; join/create errors no longer appear under the header.
- Lobby header rebuilt: full-width Game/Chat tabs, room code on its own row.
- Chat and lobby actions use separate busy/error channels; failed chat keeps the draft.
- Match start moved into the Match card so admins see it without scrolling.
- Post-match lobby hides the old map and TAGGED badges; server clears elimination flags.
- Settings uses five equal icon tabs (Updates no longer clipped) and is fully Arabic/RTL.
- Update manifest BOM removed; in-app update check and full download/install verified on the phone.
- Updater persists the verified APK across process death, opens the system installer directly,
  and pre-checks the “install unknown apps” permission.
- Release builds default to `http://74.208.99.178`; release workflow builds `assembleRelease`.
- Branded dark launch screen (Android 11 window + Android 12+ splash icon).

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

- Real-device testing used one phone plus an API-driven second player (no second physical phone).
- Cold start is ~10s on the low-end Infinix even in a release build; a branded splash is shown,
  but baseline-profile work is still needed for a faster first frame.
- First self-update after sideloading requires enabling “install unknown apps”; Play Protect also
  asks to scan the APK once. Both are Android system steps, documented in the Updates tab.
- Public traffic is cleartext HTTP (port 443 is occupied); TLS is still required before public use.
- Single-node SQLite; horizontal scale needs a migration.
- Registration is CPU-bound by scrypt (~13/s on this VM), measured in `docs/PERF.md`.
- Server-generated system chat messages and release notes are English; UI strings are Arabic.

## Key paths

- `server/src/{app,rooms,realtime,db,auth,config,server}.ts`, `server/src/domain/*`
- `server/test/*.test.ts`, `server/scripts/{smoke,match-sim,load-test}.mjs`
- `android/app/src/main/java/com/manhunt/app/{data,ui,map,location}`
- Reviews: `docs/SECURITY_REVIEW.md`, `docs/ANDROID_REVIEW.md`, perf: `docs/PERF.md`
- Team: `docs/TEAM_PLAN.md`, `docs/TEAM_TASKS.md`, `docs/TEAM_DECISIONS.md`
