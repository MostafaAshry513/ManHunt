# Premium screenshot pipeline

Real-emulator captures of the ManHunt app for the site / GitHub landing page, following
[`design/redesign/screenshot-shotlist.md`](../../design/redesign/screenshot-shotlist.md).
Nothing is mocked or composited: the debug APK runs on an Android emulator against a real
ManHunt server seeded with the shotlist scenario, with real OpenStreetMap tiles fetched over
the network.

> **Why GitHub Actions?** This Windows host is a QEMU/KVM guest **without nested
> virtualisation** (`docs/ENVIRONMENT.md`: no AMD-V, no SLAT). The Android emulator cannot run
> here: x86_64 images require KVM/HAX/WHPX, WHPX cannot start without the Windows hypervisor,
> and the emulator refuses ARM images on an x86_64 host. The approved capture route is the
> manual `premium-screenshots` GitHub Actions workflow, which boots a real KVM emulator on an
> Ubuntu runner.

## What gets captured (shotlist S01-S19)

Scenario: **Riverside Run**, five believable players - **Yasmin** (host, Prey), **Leila**
(Prey), **Omar** (capture device, Hunter), **Tariq** (Hunter), **Sara** (Hunter); 2 Prey / 3
Hunters, all ready; real server-generated invite code; rules 5 min head start, 60 min hunt,
5 min reports, trails on, 240 m zone; live hunt at **41:12 remaining** (played 18:48), Yasmin fresh report (12 s) with a
5-point north-east trail, Leila stale report (14 min, no trail); tag claim on Yasmin; Hunters
win (both Prey tagged); Prey-win rematch.

| File | Scene |
| --- | --- |
| `s01-auth.png` | Auth, dark, empty fields, no keyboard, real server row |
| `s02-safety.png` | First-run safety / before you play |
| `s03-home.png` | Home dark: masthead, permanent line, host block with "Riverside Run" typed, join block, playing as Omar |
| `s04-home-rtl.png` | Home Arabic RTL, dark |
| `s05-lobby-host.png` | Lobby host view: 5 players, 2 Prey / 3 Hunters, code plate, all ready |
| `s06-lobby-player.png` | Lobby player view: Omar ready, Leila not ready, waiting status |
| `s07-hunt.png` | **Hero:** live hunt map, real OSM tiles + attribution, 240 m zone ring, fresh + stale prey markers, trail, clock 41:12, Tag dock |
| `s07-hunt-wide.png` | Landscape 2400x1080 live-hunt band (map hero for wide layouts) |
| `s08-hunt-claim.png` | Prey view: tag claim with review/confirm action |
| `s09-tag-target-sheet.png` | Tag target sheet over the map |
| `s10-hunt-sheet.png` | Hunt sheet expanded: prey reports/ages, trails toggle, attribution |
| `s11-chat.png` | Field log chat with phase separator, keyboard closed |
| `s12-result-hunters.png` | Result: Hunters win, both prey tagged |
| `s13-result-prey.png` | Result: Prey win variant |
| `s14-settings.png` | Settings: appearance (dark, text size), language |
| `s15-home-light.png` | Home light theme |
| `s16-lobby-rtl.png` | Lobby Arabic RTL *(optional)* |
| `s17-empty-chat.png` | Empty chat state *(optional)* |
| `s18-auth-loading.png` | Auth submit loading state *(optional)* |
| `s19-auth-error.png` | Auth server-error state *(optional)* |

Plus `harvest/` crops cut from the full frames (never re-rendered):
`map-hero-16x9`, `map-hero-3x2`, `board-clock-4x5`, `code-plate-1x1`, `team-sheet-4x5`,
`result-score-4x5`, `home-line-16x9` (specs in `harvest-crops.json`), plus `MANIFEST.json`
(scenario, dimensions, SHA-256, crop provenance) and `contact-sheet.png`.

All full frames are `1080x2400` portrait PNGs except `s07-hunt-wide.png` (`2400x1080`). Clean
presentation: dark theme (light + RTL variants as specified), demo-mode status bar (clock
21:04, battery 100%, wifi full, notifications hidden), gesture nav, no IME/cursor, no debug
overlays, no test strings.

## Pipeline components

| File | Role |
| --- | --- |
| `.github/workflows/premium-screenshots.yml` | Manual `workflow_dispatch` job: build APK, start isolated server, seed game, boot KVM emulator, run capture, verify + upload artifact |
| `scripts/screenshots/game-control.mjs` | Seeds the shotlist scenario and drives the live game over the real API (clock sync, trails fresh/stale, tag flows, claim, both results, chat clock); holds WebSocket presence |
| `scripts/screenshots/capture-premium.sh` | On-device driver: deterministic display + status bar, installs the APK, switches the capture account between host (Yasmin) and player (Omar), drives the real UI with adb + `uiautomator`, captures S01-S19 |
| `scripts/screenshots/ui.py` | uiautomator helper (`wait` / `tap` / `wait-gone` / `dump`) with `|` alternatives and `text=`/`desc=`/`res=` matching |
| `scripts/screenshots/verify-captures.mjs` | CI-side verification: real PNG, exact dimensions, blank-frame heuristics; writes `captures.json` |
| `scripts/screenshots/fetch-premium.ps1` | Local: download artifact, verify, install into `docs/screenshots/premium/`, cut harvest crops, write `MANIFEST.json`, render `contact-sheet.png` |
| `scripts/screenshots/harvest-crops.json` | Crop rectangles + aspect + source shot for the harvest set |
| `scripts/screenshots/verify-game-local.ps1` | Device-free dry run of the whole shotlist scenario against a throwaway server on port 8090 |
| `scripts/screenshots/write-meta.mjs` | Writes the artifact's `capture-meta.json` (no tokens) |

Account switching is done by injecting the app's own SharedPreferences with **real server
sessions** minted through the API (`run-as`, debug build only); the captured screens themselves
are the real app UI. This is what lets the set show both the host view (Yasmin) and the player
hunt view (Omar) without leaving/rejoining the room and changing the host mid-set.

## Exact commands

### 1. Device-free verification (works on this host right now)

```powershell
cd C:\dev\ManHunt
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\screenshots\verify-game-local.ps1
```

Starts the real server on `127.0.0.1:8090` with a temp DB (production `:8080` and
`server\data\manhunt.db` are never touched) and asserts the whole shotlist scenario: lobby
(all ready + waiting variant), 41:12 hunting clock, fresh + stale prey reports, 5-point trail,
claim, Hunters-win result, Prey-win rematch, secondary room + leave flows. Exit code 0 = PASS.

### 2. Trigger the capture workflow

The workflow must exist on the default branch before GitHub can dispatch it. Once
`.github/workflows/premium-screenshots.yml` is committed and pushed to `master` **and** the
MATCHDAY BOARD redesign build has landed (Lead verifies before final capture):

```powershell
cd C:\dev\ManHunt
gh workflow run premium-screenshots.yml --ref master
gh run list --workflow=premium-screenshots.yml --limit 3
gh run watch <run-id> --exit-status          # ~20-30 min
```

If the verified build is missing some redesigned screens, mark them pending instead of
substituting old UI (comma-separated shot IDs; never captured, recorded in MANIFEST):

```powershell
gh workflow run premium-screenshots.yml --ref master -f pending_shots=s02,s11,s14
```

A successful run uploads the `premium-screenshots` artifact (PNGs + `captures.json` +
`capture-meta.json`); a failed run uploads `premium-diagnostics` (server log, UI dump, logcat,
failure screenshot) for fast iteration.

### 3. Download, verify and install the set

```powershell
cd C:\dev\ManHunt
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\screenshots\fetch-premium.ps1
```

Defaults to the latest successful run. Explicit run id:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\screenshots\fetch-premium.ps1 -RunId 1234567890
```

After visually comparing `s07-hunt.png` with `s07-hunt-alt.png` (kept in the artifact), promote
the alternate hero if it is better:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\screenshots\fetch-premium.ps1 -UseMapAlt
```

The script fails loudly on wrong dimensions / blank frames; it never publishes a partial set.
Crop rectangles in `harvest-crops.json` are re-validated on every run; edit them if the
redesign layout shifts.

### 4. Re-run / iterate

The workflow is re-runnable with no commits: dispatch again. If the redesign changes any copy
or control used by the driver, update the `ui_wait` / `ui_tap` alternatives in
`capture-premium.sh` (they match visible text / content descriptions, not coordinates) and
re-dispatch.

## Why the captured state is deterministic

- **Display:** `wm size 1080x2400`, `wm density 420`, font scale 1.0, rotation locked (except the
  dedicated landscape band shot).
- **Status bar:** SystemUI demo mode - clock 21:04, battery 100% unplugged, wifi only full,
  notifications hidden.
- **Chat clock:** seeded chat lines are re-stamped into the 20:46-20:52 window so the Chat
  screenshot sits before the 21:04 status-bar clock (hunting started 20:45:12).
- **Hunt clock:** the isolated DB is nudged so the Board shows 41:12 **remaining** at capture
  time and the finished match reports **18:48 played** (41:12 is never used as "played"). The
  timer is live, so a 1 s drift is accepted.
- **Theme/language:** app preferences are injected per shot (dark/light, en/ar) before the
  screen is captured.
- **No dev strings:** the isolated server is mapped to a self-hosted looking hostname
  (`manhunt.local`) on the emulator when the image allows it; otherwise the app default is
  used. No `10.0.2.2` appears in the app UI when the mapping succeeds.
- **Real map:** the app fetches live OSM raster tiles (`© OpenStreetMap contributors`) over the
  emulator network; the capture waits for tiles before shooting.

## Verification gates

1. **Server-side, before capture:** every stage is asserted through the API
   (`verify --stage lobby|lobby-waiting|hunting|claim|result-hunters|result-prey`).
2. **CI-side:** `verify-captures.mjs` rejects non-PNGs, wrong dimensions, tiny files and (when
   ImageMagick is present) flat frames.
3. **Local-side:** `fetch-premium.ps1` re-verifies every file, validates crop bounds/aspect and
   records SHA-256 in `MANIFEST.json`.
4. **Human-side:** every image is visually inspected for blank tiles, test strings, clipped
   layout and stray UI; a shot that fails is re-captured, not shipped.

## Known limitations / current status

- No local emulator on this host (no nested virtualisation); everything runs on the CI runner.
- The workflow is `workflow_dispatch` only, must be committed to the default branch before it
  can be triggered, and must not be run for final captures until the MATCHDAY BOARD screens
  (client-polish Phase 1/2) are in the build and the Lead has verified that.
- **Pending shots:** a screen that is not redesigned in the verified build is never captured in
  its old form. Pass it via `-f pending_shots=...`; the capture driver skips it, the verifier
  accepts its absence, and `MANIFEST.json` records it under `pending` (no file, no checksum).
- **S13 data-gap:** the server resets eliminations on match finish, so the app can only expose
  an honest Prey-win state (winner + final duration + the roster state it actually has), not a
  "1 of 2 survived" count. `MANIFEST.json` records `data-gap: survivor count unavailable`; S13
  may also be marked pending if the verified build has no honest representation.
- **Result timing:** S12/S13 show **18:48 played**; 41:12 is the remaining time at the S07
  moment and must never be used as the final duration.
- `s02-safety.png` captures the first-run safety surface only when the verified build has it;
  otherwise it is marked pending (never replaced with the old roles page).
