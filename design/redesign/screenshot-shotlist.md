# ManHunt — premium screenshot shotlist (capture team)

**Status:** capture brief for task-49 (screenshot-director) and for the site/GitHub/README images that feed
task-50. This is a capture spec only: **no mockups, no compositing, no fake screens.** Every image must come
from the running app against a real seeded server, with real OpenStreetMap tiles where a map is shown.
**Visual authority:** [`direction.md`](direction.md) + the screen specs; the redesign's silhouette (Board +
rules + team tags + display type) is what the shots must prove. If the implemented build does not show it yet,
capture the states that do exist and label the gap in the manifest — do not fabricate the redesign.

Where the redesign is not yet implemented, capture the **current build's equivalent states** with the same
seed data and rules below (these become the "before" set), and re-capture after task-51 lands. Keep the old CI
screenshots untouched for comparison.

---

## 0. Non-negotiable capture rules (all shots)

1. **Real app on a real emulator/device** — no mockups, no Photoshop, no AI images, no composited status bar.
2. **One device, one resolution** for the set: the `manhunt_api30` AVD (or better) at **1080 × 2400 px**, phone
   portrait, density 420–440 dpi. Do not mix 1233×2673 and 1080×2400 frames in one set (the current repo does).
3. **Clean status bar, deterministic:** `adb shell settings put global sysui_demo_allowed 1`, then demo-mode
   broadcasts to set clock **21:04**, battery **100 / charging off**, signal **Wi-Fi only, full**, no
   notifications, no carrier text if possible. No debug/ADB icons, no "USB debugging connected", no screen
   recorder.
4. **No keyboard, no cursor, no focus ring** unless the shot is a form state that needs focus (then show a
   single, clean focus). Dismiss the IME with `adb shell input keyevent 111` (ESC) before capture.
5. **No dev strings anywhere.** Banned: `10.0.2.2`, `localhost`, `CI Room`, `Test Room`, `AAZHZX`/random
   test codes, `alice74354`, `bob74354`, `user1`, `-` as a username, `TODO`, `Lorem`, debug version suffixes,
   emulator notification icons, "Charging this device over USB".
6. **Believable data only** — real names, real-looking room names, clocks, scores and chat lines that a real
   group would produce (see §2). The code itself is **server-generated**; use the real code, never retype a
   fake one into the UI.
7. **OSM attribution visible** in every shot with map tiles (`© OpenStreetMap contributors`), never covered by
   a dock, never cropped out. No third-party map branding, no Mapbox/Google.
8. **No fake claims, scores, ratings, player counts, urgency, or store references.** "Not on Play Store" and
   the test-server caveat stay honest wherever they appear.
9. **No tearing/clipping**: no half-loaded tiles, no placeholder images, no blank map (wait for tiles and
   markers), no partially visible dialogs, no scrollbars.
10. **No old-UI "before" frames in the premium pipeline.** The Lead gate is: capture only the verified
    MATCHDAY build. If a screen is not yet redesigned, omit it and mark it `pending` in the MANIFEST — never
    present the current UI as the premium redesign. (The old CI screenshots stay untouched separately.)
11. **Privacy**: no real people's names/locations beyond the seeded fictional set; no owner personal data in
    the status bar/notifications; map location is a public park/street.
12. **No battery/power saving UI**, no "App isn't responding", no toasts in frame; capture after state settles
    (≥1 s).
13. **Crop discipline:** shoot full screen; make separate custom crops only by cropping the captured PNG
    (no upscaling beyond 2×, no stretching). Keep a full-frame original for every crop.
14. **Manifest:** every image gets scenario, seed, device/API, theme/language, dimensions, SHA-256, and a
    one-line description in `MANIFEST.json`; the contact sheet includes the same labels.

---

## 1. Capture rig and setup

| Item | Value |
|---|---|
| Device/AVD | `manhunt_api30` (Pixel 6-class), 1080 × 2400, 420–440 dpi, dark theme default, gesture nav |
| App | current debug/signed build of `com.manhunt.app` |
| Server | **isolated dev server + seeded DB** (never the production DB); production host untouched. Server URL configured in the app to a plausible host (the public test host `74.208.99.178` is acceptable and real) — no emulator-local address in frame. |
| Network | internet on for OSM tiles; verify tiles visibly load before any map shot |
| Location | emulator GPS set inside the seeded zone (`adb emu geo fix <lng> <lat>`); location permission granted; no location dialog in frame |
| Notifications | permission granted (grant via adb before capture); no notifications in the shade/status |
| Font scale | 1.0× for the premium set; a separate 1.35×/RTL accessibility set optional |
| Theme | dark for the hero set; light for the light set; Arabic RTL for the RTL set |
| Seed | 5 players, 2 Prey / 3 Hunters, all ready for the hero lobby shot; a run with 2+ live prey reports for the hunt shot |

**Capture account (the phone):** `Omar` — Hunter in the hero hunt shots (so the map and Tag button are
visible); `Yasmin` — host/Prey for the host-view lobby shot. Either can be the capture device; switch by
re-seeding, not by editing the DB mid-shot.

---

## 2. Seeded scenario "Riverside Run" (fiction, believable)

| Field | Value |
|---|---|
| Room name | **Riverside Run** |
| Code | server-generated 6 chars; use the real value (e.g. `K7M2QX` if it comes out like that) |
| Players | **Yasmin** (host, Prey), **Leila** (Prey), **Omar** (Hunter, capture device), **Tariq** (Hunter), **Sara** (Hunter) |
| Teams | Prey 2 / Hunters 3 (5 players). Board totals follow the real 2-Prey scenario: `PREY n / 2`, never `/ 3`. |
| Ready | all 5 ready for the hero Lobby shot; a second state with Leila not ready for the waiting shot |
| Rules | head start 5 min · hunt 60 min · report interval 5 min · trails on · zone 240 m · shrink off (or on with 10 min / 50 m if the UI shows the shrink countdown better) |
| Zone centre | a real public park/urban block with good OSM coverage (e.g. a city park with paths; choose one with visible streets/paths, not a grey residential blob). Record it in the manifest. |
| Clock / timing | Status bar **21:04**; hunting started **20:45:12** → **41:12 remaining** at capture. Final duration for result frames = **18:48 played** (41:12 is *remaining* at S07, never **41:12** as "played"). Chat window 20:46–20:52. |
| Hunt state | head start finished, `LIVE` at **41:12 remaining** (freeze by capturing at the right moment; the timer is live, so accept ±1 s and recapture if a second boundary lands mid-shot) |
| Prey reports | Yasmin: fresh report 12 s ago, accuracy ±6 m, trail of 5 points heading north-east; Leila: stale report 14 min ago, ±22 m, no trail; tag **Leila** before the S09/S12 frames (Sara is a Hunter, not Prey) |
| Chat | 6–8 lines, hunt-relevant, no test chatter (see S11); timestamps inside the 20:46–20:52 window |
| Result | Hunters win with both Prey tagged: **0 / 2**, **18:48 played**. Prey-win variant: honest app state only (see S13). |
| Result data note | The server resets eliminations when a match finishes; capture only survivor/tag data the app actually exposes. If a derived score line cannot be honest, omit it and record `data-gap` in the MANIFEST — never fabricate. |

Never use the seeded **production** server; use the isolated dev DB from the test-env work (or a fresh local
DB), then reset after capture. Do not leave test accounts in production.

---

## 3. Shot list (19 frames: P0–P2) + detail crops

Format: **ID — screen — state — why it exists — acceptance.**
**Priority (Lead gate = verified MATCHDAY build):** **P0** = S05, S07, S03 (the three hero frames);
**P1** = S06, S08, S09, S10, S11, S12; **P2** = S13, S14, S15, S16, S17–S19. A P0/P1 screen that still renders
the old design means **wait**, not capture. If the Lead accepts a partial run, ship P0 only and mark the rest
`pending` in the MANIFEST (never old UI as premium). If Safety/Roles, Chat or Settings are not redesigned yet,
defer S01/S02/S11/S14/S15/S16 to a later run rather than capturing the old screens.

### S01 — Auth (dark)
- **State:** signed out, sign-in mode, fields empty (or username "Yasmin" with a masked password), keyboard
  closed, server row collapsed, version line visible, no error.
- **Proves:** first impression: brand line + field plate + form, no cards/gradient.
- **Accept:** permanent line readable at thumbnail; primary button visible; no dev server address; no dev
  strings; no icon tile.
- **Crop:** full frame; optional detail crop of the form + line (4:5) for the site.

### S02 — Before you play (first-run safety, dark)
- **State:** first launch after clean install (safety not accepted), top of the page; no scroll needed.
- **Proves:** trust surface as a field-guide plate, not a legal wall; the three-line rule + accept dock.
- **Accept:** title + first rule + plate visible; accept button readable; no “safe/private” claims.
- **Crop:** full frame.

### S03 — Home (dark) — **hero**
- **State:** signed in as Omar; no active room; hunt name typed "Riverside Run"; join code empty; footer
  "Playing as Omar"; dark theme; motion at a still frame (not mid-wipe).
- **Proves:** the new Home: masthead + field plate + permanent line + host plate + code plate; two verbs.
- **Accept:** brand line + Create button above the fold; no cards; no "Signed in as -"; no test data; status
  21:04; one cyan surface.
- **Crop:** full frame; **16:9 hero crop** from the top (masthead + plate + line + Create) for the site.

### S04 — Home (Arabic RTL, dark)
- **State:** same as S03 with language العربية; code LTR; plate mirrored.
- **Proves:** real RTL, not mirrored screenshots; Arabic line "اختبئ من أصدقائك." readable; numerals LTR.
- **Accept:** no clipped Arabic; no bidi-mixed server/code; wordmark not mirrored; layout genuinely mirrored.

### S05 — Lobby (host view, all ready, dark) — **hero**
- **State:** room "Riverside Run", 5 players, Prey 2 / Hunters 3, all ready; capture as **Yasmin** (host) so
  `Begin the hunt` is enabled; code plate visible with the real code; no error.
- **Proves:** Board + invite code + team sheets + ready state + dock; the social centre.
- **Accept:** both team columns readable; ready marks visible; Begin enabled; code plate readable; no
  all-caps eyebrow labels; no identical cards; no test names/codes.
- **Crop:** full frame; **detail crop** of Board + code plate + team sheets (4:5) for the site.

### S06 — Lobby (player ready, waiting, dark)
- **State:** same room, capture as Omar (Hunter); Omar ready; Leila not ready (host view not needed);
  `Stand down` secondary + status "Ready. Waiting for the huntmaster." or the waiting reason.
- **Proves:** the non-host state and the disabled/ready logic.

### S07 — Live hunt (Hunters, dark) — **the most important frame**
- **State:** capture as Omar (Hunter), hunting phase at **41:12**, own position inside the zone, 2 prey
  reports (1 fresh 12 s, 1 stale 14 min), trail visible, zone ring visible, real OSM tiles fully loaded,
  sheet peek showing status + attribution, `Tag prey` dock enabled.
- **Proves:** the game itself: field, clock, zone, reports, trails, one action.
- **Accept:** tiles loaded (no checkerboard/grey), markers distinct (fresh vs stale shape cue), Board clock
  legible and the Board reads **PREY 2 / 2** (2-Prey scenario), attribution visible, no pills/HUD-chips if not
  implemented, no "Tactical", no fake distance.
- **Crop:** full frame; **16:9 map hero crop** (map + Board, no dock) for the site; **1:1 detail** of the
  Board clock for social.

### S08 — Live hunt (Prey with a tag claim, dark)
- **State:** capture as Yasmin (Prey); claim strip "{Hunter} says they tagged you." visible with REVIEW;
  prey dock status "Sharing your position every 5 min. Last report 21:03."; no prey count in the Board; zone
  ring. Status 21:04, claim is fresh (not the stale 20:41 example).
- **Proves:** the tag beat and the Prey experience; privacy-correct HUD.

### S09 — Tag target sheet (Hunters, dark)
- **State:** live hunt, `Tag prey` tapped, target sheet open over the map: **Yasmin is eligible; Leila is
  already tagged** (Sara is a Hunter, not Prey), so the sheet lists only Yasmin; sheet title "Who did you tag?".
- **Proves:** the physical-tag flow, large targets, one-tap action.
- **Accept:** map visible behind scrim but dim; list readable; cancel; no keyboard.

### S10 — Hunt sheet expanded (Hunters, dark)
- **State:** expanded sheet: prey reports with ages/accuracy, zone shrink countdown, trails toggle, host
  controls (if capture account is host) or roster; OSM attribution visible.
- **Proves:** the information drawer, hierarchy of reports.

### S11 — Chat (live hunt, dark)
- **State:** 6–8 messages from the seeded players, one phase separator ("Yasmin was tagged" or "Hunting
  began"), one own message, timestamp gutter, composer empty, keyboard closed. Times must sit inside the hunt
  window (hunting started 20:45) and before the 21:04 status-bar clock; the set below does.
- **Content (use or adapt, keep it real):**
  - 20:46 Yasmin: "I'm near the north gate."
  - 20:47 Omar: "Two minutes. I'm crossing the field."
  - 20:48 Leila: "Take the path by the water, they're on the east side."
  - 20:50 Tariq: "I can see the trail heading east."
  - 20:51 system: "Yasmin was tagged."
  - 20:52 Sara: "One left. She's not going far."
- **Accept:** no test chatter, no "alice", no pill bubbles, names/teams readable, time LTR.

### S12 — Result (Hunters win, dark)
- **State:** match finished with both prey tagged; ScorePage: `FULL TIME` Board (**final duration 18:48,
  prey 0 / 2**, Hunters), "Hunters win.", honest summary ("Both prey were tagged."), trail plate (tiles +
  attribution or drawn plate), final team sheets, dock "Back to the lobby"; keyboard closed. **Do not use
  41:12 as "played"** — 41:12 was the remaining time at the S07 moment; the finished match ran 18:48.
- **Proves:** the result as a scoreboard, not a dialog.
- **Accept:** no AlertDialog card, no exclamation mark, no keyboard, no cropped attribution, winner readable
  at thumbnail; totals follow the real 2-Prey scenario (0/2) — never a hard-coded 0/3.

### S13 — Result (Prey win, dark)
- **State:** a second finished match where at least one Prey finished alive; "Prey win." variant; different
  trail. **Honest data:** the server resets eliminations at match finish, so if the app cannot show a survivor
  count, capture the honest state (winner + final duration + whatever final roster state the app actually
  exposes) and record `data-gap: survivor count unavailable` in the MANIFEST. Do not fabricate "1 of 2
  survived"; if no honest state can be produced, mark S13 `pending` and ship without it.

### S14 — Settings — Appearance (dark)
- **State:** top of Settings: theme Dark selected, text size 1.0×, preview plate, language section; no error.
- **Proves:** the manual page, no icon tabs, no chips.

### S15 — Home (light theme)
- **State:** same as S03 in light theme.
- **Proves:** "daylight chalk" translation, ink masthead/plate, contrast.

### S16 — Lobby (Arabic RTL, dark) *(optional but recommended)*
- **State:** 5-player lobby in Arabic, code LTR, team columns mirrored, ready dock.
- **Proves:** the most complex screen in RTL.

**Detail/harvest crops for site/OG/social (crop from the full frames, never re-render):**
- `board-clock` 4:5 from S07 (Board + map top) — the signature crop.
- `code-plate` 1:1 from S05.
- `team-sheet` 4:5 from S05.
- `map-hero` 16:9 from S07 (Board + map, no dock) — site hero.
- `result-score` 4:5 from S12 (FULL TIME + winner word).
- `home-line` 16:9 from S03 (plate + "Hide from your friends.").

---

## 4. Capture sequence (minimise state churn)

1. Reset app data / fresh install → S02 (safety) → accept → S01 (auth) → sign in.
2. Seed room + 5 players via the sim/seed tool; host Yasmin creates "Riverside Run"; set rules; everyone
   readies → S05 (host) + S06 (player) + code/team-sheet crops.
3. Start hunt; wait through head start; set GPS inside zone; drive prey bots/positions to produce 2 reports
   (one fresh, one stale) and a trail; capture S07 (hunter), S10 (expanded), S09 (target sheet).
4. As prey/claim state: trigger a tag claim on Yasmin → S08.
5. Chat: post the seeded lines from the bots, capture S11.
6. Tag the remaining prey / end the hunt → S12; run one more match for S13 (or capture a lucky prey win).
7. Settings → S14. Home light → S15. Switch language → S04 + S16.
8. Export PNGs, compute SHA-256, write MANIFEST.json + contact sheet, and inspect every image at 100 % and at
   thumbnail size (360 px wide). Reject and re-capture anything that fails §0.

---

## 5. Quality bar (acceptance for the set)

- **Thumbnail test:** at 360 px wide, S03/S05/S07/S12 must be recognisably ManHunt and show one clear action /
  clock.
- **Credibility test:** no visible test data, dev strings, blank tiles, duplicate names, mismatched status
  bar, keyboard, or "hunting" UI that contradicts the game rules.
- **Consistency:** same device, same status bar state, same seeded group and room across the set; time
  progresses plausibly between shots (auth 20:41 → lobby 20:44 → hunt 20:52 → result 21:33, or similar; record
  real times).
- **RTL set:** genuinely mirrored, no clipped Arabic, no bidi breakage; Arabic copy is the approved MSA from
  the app.
- **Light set:** the ink Board + night map are visible and intentional; no white flash, no untranslated
  colours.
- **Files:** PNG, no transparency needed, sRGB, ≥1080 px wide full frames; crops labelled with source shot ID;
  no upscaling; MANIFEST checksums match.

---

## 6. Where the images go (for the Lead/site team)

| Surface | Files |
|---|---|
| `docs/screenshots/premium/` | full set + `MANIFEST.json` + contact sheet |
| README | S03, S05, S07, S12 (4-up or sequence) + `home-line`/`map-hero` |
| Install page hero | `map-hero` 16:9 or S07 crop |
| GitHub social preview | S07 or S12 full-bleed (1280×640 crop from the 1080-wide frame, no stretching) |
| Social posts | S07 board-clock crop, S05 code plate crop, S12 score crop (platform crops from the same frames) |
| Store/listing | not applicable (not on Play Store) |

**Content safety:** screenshots of the map must show a public place; no real private addresses; OSM credit
stays; "not on Play Store" honesty stays if the asset carries a CTA.

---

## 7. Fallback: deterministic JVM screenshots (secondary only)

The Robolectric tests (`ScreenshotTest.kt`, `GameScreenshotTest.kt`) render real Compose without tiles. Use them
for regression evidence and state coverage (empty/loading/error/RTL/light/200 %), **not** for the premium set:
they cannot show real map tiles, real network states, or a clean device status bar. When the redesign lands,
extend these tests with the matrix in `screens/12-adaptation.md` §6 and seed them with the same believable
fixtures (never CI names).
