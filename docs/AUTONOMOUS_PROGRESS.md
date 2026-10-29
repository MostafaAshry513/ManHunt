# Autonomous progress

Updated: 2026-10-29 (0.8.1 review pass)

## Current state

End-to-end game loop exists on both sides: auth, rooms, teams, readiness, server-authoritative
match phases, pause/resume, GPS reporting, hunter map, physical tagging with confirm/dispute,
chat, spectator lockout, history, admin settings, safety onboarding.

## Last verified (2026-10-29)

| Check | Command | Result |
|---|---|---|
| Backend tests | `cd server; npm test` | 51/51 pass |
| Backend types | `npx tsc --noEmit` | clean |
| Live smoke | `node scripts/smoke.mjs` | pass |
| Multi-client match | `node scripts/match-sim.mjs` | 13/13 checks |
| Android build + JVM tests+ localization/dark-palette pins | GitHub Actions 40936226115 | pass |
| Android lint | GitHub Actions 40936226115 | pass |
| Full in-app match | GitHub Actions 40936226115 (emulator) | pass; lobby/hunting/chat/result screenshots uploaded |
| Signed release | GitHub Actions 40937169344 → `v0.8.1` | pass; APK 13,807,941 B + .sha256 asset |
| Channel publish | `scripts/ci/pull-latest-apk.ps1` | SHA-256 verified against release, manifest v0.8.1 code=15 |
| Channel end-to-end | `fetch /api/app/latest` + `fetch /app.apk` | code=15, checksum match, 200 with exact byte count, valid PK |
| Real phone | Infinix SMART 5, Android 11, adb over Tailscale | offline during the 0.8.1 pass; last on-device verified build is 0.7.2 |
| In-app update | 0.6.0 → 0.7.2 on the phone | download → progress → SHA-256 → Play Protect scan → installed |
| Update persistence | force-stop after download | Install button restored from the verified cache |

Public APK: GitHub Releases (`v0.8.1`, signed release build, 0.8.0 remains available).
In-app update channel: `http://74.208.99.178/api/app/latest` → `/app.apk`
(verified 2026-10-29: versionCode 15, sha256 `7381b3d4…d98`, exact release byte count, valid APK).
Real-device screenshots: `docs/screenshots/05-device-*` through `08-device-*`.
New game lobby: `docs/screenshots/09-lobby-game-ui.png`.

## 0.8.1 review pass (2026-10-29)

Autonomous adversarial review of the shipped 0.8.0 UI: two fresh-context reviewers
(map pipeline, lobby/i18n/RTL) plus independent local verification. 28 findings
conciled item by item; every fix is commit `a302428` (versionCode 15).

- **ColorMatrix scale dispute, settled on primary sources.** 0.8.0's dark-tile
  matrix (offsets 225/238/252) shipped correct: `android.graphics.ColorMatrix`
  channels and its offset column are on the 0..255 scale — the platform docs'
  own invert sample uses offset 255 and still inverts, and osmdroid's
  `INVERT_COLORS` does the same. A review-time numeric check that read the
  offsets as 0..1 produced the opposite verdict, and the "fix" written from it
  (offsets /255) would have clamped every tile pixel to black. The corrected
  reasoning is now pinned by `DarkPaletteTest` (offset slots, five validated
  RGB samples, contrast-preservation check) so neither the all-black nor the
  all-white failure mode can land silently again.
- **Map taps hijacked (fixed).** osmdroid's built-in +/− buttons draw unthemed
  above all overlays and consume taps before `MapEventsOverlay`, breaking
  "tap the map to move the zone centre"; disabled, pinch-zoom remains.
- **Map hardening (fixed).** View-level rounded clipping (interop draw path no
  longer trusts the Compose ancestor clip); osmdroid User-Agent declared once
  in `ManHuntApplication` from the running `versionName` instead of three
  drifting hardcodes; the zone-picking map focuses without drawing a fake
  "You" marker on top of the candidate centre; first-centering ignores prey
  reports hidden by `showPrey`.
- **Error surfacing (fixed).** Mid-match failures (tag, pause, resume, end,
  settings, history) were invisible — the only error banner lived in the
  lobby-only card; they now render in their own card at the top of the match
  list. Room-load failures no longer spin forever: a retry card replaces the
  connecting spinner.
- **Dialogs and badges (fixed).** Tag/dispute dialogs are dismissable and
  restore pending state when the API call fails; the unread chat badge counts
  by newest message id (the server's 50-message window silently zeroed the
  previous size-based count in busy rooms); phase transitions scroll to the
  right focal card (lobby's hunt card is the last item) and skip the first
  composition race.
- **Hunt-rules editor (fixed).** Full Arabic (12 missing keys + 3 raw strings),
  cleared fields fall back to the room's stored values instead of hidden
  defaults, dialog title unified with the lobby's "Hunt rules" copy.
- **i18n sweep (fixed).** Safety screen body (4 paragraphs), auth server-format
  hint (private LAN IP removed from UI copy), chat/history fallbacks wrapped.
  Dead and duplicate Arabic keys removed: 289 → 252 lines, 216 unique keys,
  0 duplicates, 0 used-but-missing, 0 unreferenced (mechanical diff each time).
  `LocalizationTest` pins the safety paragraphs, hunt-rules copy and fallback
  names to their Arabic entries.
- **Crash surface (fixed).** JSON schema drift in `ApiClient` surfaces as a
  catchable `ApiException` (`invalid_response`) instead of a
  `SerializationException` that kills the process from a ViewModel coroutine.
- **RTL (fixed).** Navigation screen slides mirror `LocalLayoutDirection`, so
  Arabic transitions match the fully mirrored layout.
- **Deferred with rationale (perf, needs a dedicated emulator pass).** The
  match map lives in a `LazyColumn` item: scrolling it out of the viewport
  disposes the osmdroid `MapView` and scrolling back rebuilds it (documented
  in `MatchMap.kt`); `update()` rebuilds all overlays per location tick —
  acceptable at current list/overlay sizes, both noted as the next work item.
- Accepted trade-offs: unexpected team enum strings render as the raw code
  (server only ever sends the two known teams); a failed leave still returns
  to home (matches the previous release's behavior; the server room remains).

## Recently fixed (real-device + 0.8.0 UI pass)

- Bodyless POSTs (leave/start/pause) rejected by OkHttp; now sent with `{}`.
- Errors moved inside their cards; join/create errors no longer appear under the header.
- Lobby rebuilt as a game screen: roster, then giant team cards, then The Hunt.
- Team cards use each team's colour as a thick border, a large icon and role copy.
- Joining players auto-fill the smaller team (creator prey, next hunter, then prey…),
  so two-player rooms start with one prey and one hunter automatically.
- Start/settings/pause/end moved into The Hunt card; Ready/team selection stays central.
- Chat and lobby actions use separate busy/error channels; failed chat keeps the draft.
- Settings uses five equal icon tabs (Updates no longer clipped) and is fully Arabic/RTL.
- Update page shows a real download progress line and percentage.
- Dark map filter keeps free OSM tiles inside the app's navy/cyan palette.
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
- The CI emulator currently has no usable GPS fix, so its map screenshot shows the waiting
  state; the dark map filter was validated against a real London OSM tile, and the phone map
  was verified earlier with live GPS.
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
