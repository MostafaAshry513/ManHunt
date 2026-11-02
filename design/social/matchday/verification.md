# Verification — MATCHDAY social pack

**COPY STATUS: PROVISIONAL — OWNER APPROVAL PENDING.** Nothing published, nothing committed, no app/server code edited.

Run on the built files in `design/social/matchday/out/` (Windows, headless Chrome 156 + ffmpeg-static 6.0).

---

## 1. Source-capture provenance

All screens come from **`docs/screenshots/premium/`** — "Real Android emulator capture of the ManHunt debug build (no mockups, no compositing)", commit `e25310e6ced1aa11a481c8cf8a19d3641d5ec43a`, Pixel 6 / Android 16 (1080×2400). The copies in `assets/screens/` are byte-identical to the source and match the `MANIFEST.json` sha256 values:

| Copy | sha256 | Manifest match |
|---|---|---|
| s03-home.png | `0632F0F8…DBE0` | ✅ |
| s05-lobby-host.png | `BE09CB45…BEAA` | ✅ |
| s07-hunt.png | `B12E276F…C1C9` | ✅ |
| s08-hunt-claim.png | `99E9F967…EA91F` | ✅ |
| s11-chat.png | `54E6E8CD…C7B` | ✅ |
| s12-result-hunters.png | `89C32D57…F73` | ✅ |

`assets/screens/MANIFEST.json` and `premium-contact-sheet.png` are kept alongside for provenance.

## 2. No old-CI / non-premium pixels

- The film and statics reference only the six premium captures above (`src/*.html`: `assets/screens/s03-home.png`, `s05-lobby-host.png`, `s07-hunt.png`, `s08-hunt-claim.png`, `s11-chat.png`, `s12-result-hunters.png`).
- Grep for the old CI screenshot names (`02-home`, `03-roles`, `04-lobby`, `06-chat`, `07-settings`, `08-hunt-result`), old map assets (`05-map*`) and non-premium `docs/screenshots/` paths across `src/` + `tools/` returns **zero** hits.
- No stock/photo/AI imagery, no composited/fake UI: every screen rectangle in every frame is the real capture, placed and panned (camera moves) — never redrawn.

## 3. Film metadata / decode

| File | Duration | Streams | Decode |
|---|---|---|---|
| `manhunt_matchday_reel_15s_1080x1920.mp4` | 15.00 s | H.264 High/L4.2, yuv420p, 1080×1920, 30 fps, AAC-LC 48 kHz 192 kb/s | exit 0 |
| `manhunt_matchday_reel_15s_1080x1920.webm` | 15.01 s | VP9 Profile 0, yuv420p, 1080×1920, 30 fps, Opus 48 kHz | exit 0 |
| `manhunt_matchday_reel_30s_1080x1920.mp4` | 30.00 s | H.264 High/L4.2, yuv420p, 1080×1920, 30 fps, AAC-LC 48 kHz | exit 0 |
| `manhunt_matchday_teaser_6s_480x854.gif` | 5.99 s | GIF, 480×854, 15 fps, 90 frames, loop, 64 colours | 90 frames verified |

All MP4s are 9:16 (`1080/1920 = 0.5625`, DAR 9:16) and `+faststart`.

## 4. Static dimensions (read from the PNG headers)

| File | Dimensions |
|---|---|
| `manhunt_matchday_cover_1080x1920.png` | 1080×1920 |
| `manhunt_matchday_poster_1080x1920.png` | 1080×1920 |
| `manhunt_matchday_feed-1x1.png` | 1080×1080 |
| `manhunt_matchday_feed-1x1-result.png` | 1080×1080 |
| `manhunt_matchday_portrait-4x5.png` | 1080×1350 |
| `manhunt_matchday_story-9x16.png` | 1080×1920 |
| `manhunt_matchday_story-end-9x16.png` | 1080×1920 |
| `manhunt_matchday_carousel-1-hook.png` … `-5-end.png` | 1080×1350 (×5) |
| `manhunt_matchday_contact-sheet.png` | 1600×2400 |

## 5. OSM attribution

Map tiles appear in the hunt and tag-claim film beats and in the 1:1 feed, 9:16 story, carousel hunt panel and reel frames. Every one carries **© OpenStreetMap contributors**:

- film: `LATEST REPORTS · © OpenStreetMap contributors` (hunt lower third) and `THE PREY CONFIRMS THE TAG · © OpenStreetMap contributors` (claim lower third) — verified in `out/qa/15-hunt.png` and `out/qa/15-claim.png`;
- statics: in-plate `© OpenStreetMap contributors` caption (`manhunt_matchday_feed-1x1.png`, `carousel-4-hunt.png`, `story-9x16.png`) — verified in the rendered files.

## 6. Phone-size legibility

Key film beats downscaled to 390 px wide (`out/qa/phone-*.png`): hook, home, lobby, hunt, claim, result, end card — all read (hook line, board clock 41:12, ZONE 240 m, display captions, end-card CTA/URL/micro/trust). The 6 s GIF final frame was checked at its native 480×854 (`out/qa/gif-end.png`) and reads (permanent line, install button, URL, micro, trust).

## 7. Copy / claims audit

- Copy family v2 applied: hook `Your friends are hunting you.`, permanent line `Hide from your friends.`, film end-card button `Install free for Android`, campaign CTA `Create a hunt. Send the code. Hide.` in captions/cover.
- **Provisional** status marked in `README.md`, `captions-hooks.md`, `out/COPY-STATUS.txt`, this file.
- No duration claims (clock values are real capture data: 41:12 remaining at the hunt frame, 40:27 on the later claim capture, 18:48 played at full time, host-set default unchanged); no player counts, wins, reviews, testimonials, urgency.
- Tracking described as `latest reports` / `your last report`, never "live map", "real-time", "private", "encrypted".
- On-screen hunt phase label is `HUNTING` (the app's own phase word, `Localization.kt:115`); the nav/strip reads `03 HUNTING`; no "LIVE" label on any motion/static surface.
- Tag flow matches the capture: touch → the prey confirms (`Tag claim` sheet with Confirm/Dispute).
- Install honesty on screen: `free APK · Android 8+ · not on Play Store` and the bare-IP URL.
- No safety/rescue/trespass claims; no "anywhere".
- The captures show debug-build test-match data (usernames, room code); they are app test data, not real people or endorsements.

### 7.1 Post-review corrections (brand-director, applied + re-rendered)

1. **Phase label:** hunt board chip `HUNTING` (was `LIVE`), strip/nav `03 HUNTING` (was `03 LIVE HUNT`), strip label `HUNTING`; HTML/CSS comments no longer say "live". Applies to film + 1:1 feed, 9:16 story, carousel hunt panel.
2. **Hook #8 removed** (`Your street has rules now.` — rejected v1 line).
3. **Arabic lines corrected:** `هاتفك يُبلّغ عن آخر موقعك.` (phone reports the last position, not the map) and `الوسم يحتاج تأكيد الفريسة.` (the tag needs the prey's confirmation).
4. **Carousel caption:** `Zone 240 m` (was "Live zone 240 m").
5. Optional brand suggestions adopted: chat microcopy `IN-GAME CHAT · CAPTURED MATCH`; hook #4 `The map is the field.`; hook #5 uses the approved mode line `Two teams. One block. One clock.`
6. Re-rendered after the fixes: 15 s MP4/WebM, 30 s MP4 (chat microcopy re-rendered separately), GIF, all statics, contact sheet; re-verified durations/decode/GIF/PNG dims and the changed frames (`out/qa/15-hunt.png`, `out/qa/15-hook.png`, `out/qa/30-chat.png`, feed/story/carousel statics).
7. **Result-static consistency (last string):** 1:1 result meta is `PREY REMAINING 0 / 2 · CAPTURED MATCH` (same phrasing as the chat beat; no surface says "real match" any more). Re-rendered `manhunt_matchday_feed-1x1-result.png` (1080×1080) and the contact sheet (1600×2400); re-checked dimensions. Only that static + contact sheet changed — video encodes untouched and still decode clean.
8. **Lead re-audit — social composition fixes (no video re-encode):**
   - `carousel-5-end`: the cyan Install button was overlapping the stacked MANHUNT lockup. Re-laid out with vertical separation — headline ends ~452 px, stacked lockup 512–709, CTA 790–882, URL/micro/trust 934/994/1050, slide label at the foot. No text or lockup collision.
   - `feed-1x1-result`: was repeating the result (board headline + a framed inner capture that repeated the score and cropped mid-radar). Rebuilt as a **board-only composition**: one statement (`HUNTERS WIN.`), the real full-time board data in a single plate (`FULL TIME`, `18:48 played`, `PREY 0 / 2 · HUNTERS`, status bar cropped out), no duplicated winner word, no radar crop.
   - Collision sweep of the other panels: carousel 1/2/3/4, feed-1x1, portrait-4x5, story-9x16, story-end, cover and contact sheet checked for overlaps — none found.
   - Re-rendered only `manhunt_matchday_feed-1x1-result.png`, `manhunt_matchday_carousel-5-end.png` and `manhunt_matchday_contact-sheet.png`; video encodes untouched (15 s / 30 s MP4 still decode exit 0); dimensions re-verified (1080×1080 / 1080×1350 / 1600×2400).

## 8. Safety / workflow

- No app or server file touched; all writes under `design/social/matchday/` (plus reusing the pre-existing ffmpeg-static tool dependency).
- No git commit; no post to any platform; no publishing.
- Frames cache (`out/frames/`, ~230 MB JPEG) is deleted after verification; `tools/build.ps1` regenerates everything deterministically from source + captures.

## 9. Known limitations

1. Copy provisional — owner approval pending.
2. No VO recorded (score + burned graphics only).
3. Arabic/MSA variants written but not rendered (needs RTL layout + native review).
4. OSM attribution must stay on any map-frame crop — it is part of the tile licence.
5. 30 s cut is MP4-only; GIF is silent.
6. Real captures include the emulator status bar (21:04, 3G) and debug test data — by design.
