# ManHunt — MATCHDAY social pack

**COPY STATUS: PROVISIONAL — OWNER APPROVAL PENDING.** Do not publish until the owner approves the copy family.

A social refresh built **only from the real MATCHDAY BOARD app captures** in `docs/screenshots/premium/` (commit `e25310e6`, Pixel 6 emulator, 2026-11-02). No mockups, no composited screens, no stock imagery, no old CI screenshots. The app was not edited; nothing was committed or posted. Workstream folder: `design/social/matchday/` only.

The edit is a **premium product film**, not a slideshow: the real screens sit in hairline "plates" with slow camera moves (pan/zoom across the captured UI), big condensed matchday typography, mono board data and matchday strip transitions. Map beats use the real OSM tiles from the capture and keep the `© OpenStreetMap contributors` credit on screen.

---

## 1. Deliverables

### Film (`out/`)

| File | Spec | Size |
|---|---|---|
| `manhunt_matchday_reel_15s_1080x1920.mp4` | 15.00 s, 1080×1920, 30 fps, H.264 High/L4.2 + AAC 48 kHz, faststart | **3.86 MB** |
| `manhunt_matchday_reel_15s_1080x1920.webm` | 15.01 s, VP9 + Opus 48 kHz (web fallback) | 1.28 MB |
| `manhunt_matchday_reel_30s_1080x1920.mp4` | 30.00 s, Reels/TikTok/Shorts cut | 6.98 MB |
| `manhunt_matchday_teaser_6s_480x854.gif` | 5.99 s, 480×854, 15 fps, 90 frames, 64 colours, loop | 3.42 MB |
| `manhunt_matchday_cover_1080x1920.png` | reel cover / thumbnail | 0.12 MB |
| `manhunt_matchday_poster_1080x1920.png` | poster still (hook frame, t = 0.55 s) | 0.07 MB |
| `manhunt_matchday_reel15_frame.png` / `manhunt_matchday_reel30_frame.png` | key film stills for carousels/press | 1.42 / 0.28 MB |

Film beats:
- **15 s** — HOOK 0.0–1.4 → HOME 1.4–4.3 → LOBBY 4.3–7.6 → HUNTING 7.6–10.7 → TAG CLAIM 10.7–11.6 → RESULT 11.6–13.2 → END CARD 13.2–15.0
- **30 s** — HOOK 0–2.2 → HOME 2.2–7.0 → LOBBY 7.0–12.4 → HUNTING 12.4–17.6 → TAG CLAIM 17.6–19.0 → CHAT 19.0–23.0 → RESULT 23.0–26.6 → END CARD 26.6–30.0
- **6 s GIF** — HOOK 0–1.5 → HOME 1.5–2.8 → HUNTING 2.8–4.4 → END CARD 4.4–6.0

### Static pack (`out/`)

| File | Size |
|---|---|
| `manhunt_matchday_feed-1x1.png` | 1080×1080 |
| `manhunt_matchday_feed-1x1-result.png` | 1080×1080 |
| `manhunt_matchday_portrait-4x5.png` | 1080×1350 |
| `manhunt_matchday_story-9x16.png` | 1080×1920 |
| `manhunt_matchday_story-end-9x16.png` | 1080×1920 |
| `manhunt_matchday_carousel-1-hook.png` … `-5-end.png` | 1080×1350 (five panels) |
| `manhunt_matchday_contact-sheet.png` | 1600×2400 contact sheet |
| `out/qa/` | phone-size (390 px) + GIF/end proofs |
| `out/COPY-STATUS.txt` | provisional copy marker |

### Docs

`README.md` (this file) · `captions-hooks.md` (hooks, on-screen lines, post captions EN/MSA, claims guardrails) · `out/qa/` (phone-size proofs + end-card/GIF proofs) · `verification.md` (metadata, provenance, no-old-screenshot audit).

## 2. Design language

The app's **MATCHDAY BOARD** direction (`design/redesign/direction.md`, `tokens.md`) drives the pack:

- flat fills only, **no gradients, no shadows**; structure comes from 1 px hairlines (`#2A3550`) and a 1 px offset "lifted plate" frame;
- Big Shoulders Display for the loud lines, Instrument Sans for voice/CTA, Red Hat Mono for board data (`41:12`, `ZONE 240 m`, `VMJYBU`);
- cyan is the field/referee colour only; coral = Prey, violet = Hunters — team colours appear only inside the real captures and data labels;
- every composition has one decisive gesture (a capture plate, a score line, or the end card) and a clock/board strip where the film needs orientation;
- the approved **Open Zone lockup** and **wordmark** are the official SVG assets, inlined verbatim in the film (`assets/lockup/`, sha256 checked) and referenced as files in the statics; never retyped or letter-spaced.

Real captures used: `s03-home` (Home), `s05-lobby-host` (Lobby + code plate + roster), `s07-hunt` (hunt map, clock, zone, reports), `s08-hunt-claim` (tag claim / prey confirm), `s11-chat` (30 s chat beat), `s12-result-hunters` (full time result). `s13-result-prey` and the harvest crops are copied for provenance/alternates but are not composited into the shipped surfaces.

## 3. Provenance & licensing

- **Captures:** `docs/screenshots/premium/` — "Real Android emulator capture of the ManHunt debug build (no mockups, no compositing)", commit `e25310e6ced1aa11a481c8cf8a19d3641d5ec43a`, Pixel 6 / Android 16, dark theme, 1080×2400. Copies under `assets/screens/` are byte-identical (sha256 verified against `MANIFEST.json`, see `verification.md`).
- **Map tiles:** OpenStreetMap raster tiles (ODbL, © OpenStreetMap contributors). Every film frame and static that shows tiles keeps the attribution; the film lower third carries it on the hunt/claim beats and the statics carry it inside the map plate or caption line.
- **Identity:** owner-approved Open Zone lockup/wordmark from `design/brand/identity/final/`, copies in `design/brand/motion-kit/assets/lockup/` — sha256 `BF72BFDF…859B` (stacked) and `BF6E1493…600D` (wordmark); horizontal lockup `1CD1975E…E022`. Used unmodified.
- **Fonts:** Big Shoulders Display, Instrument Sans, Red Hat Mono — SIL OFL 1.1, bundled with the licence files in `assets/fonts/`.
- **Audio:** original synthesised score per cut (`tools/audio.mjs` — sines, noise, one-pole filters, seeded RNG; no samples, no libraries, no licensed music, no VO).
- **No people / no stock / no AI imagery.** The captures show the app's own test-match data (usernames, room code) from a debug-build session; no real-person likeness, no endorsement, no testimonial.

## 4. Build & regeneration

```powershell
# From design/social/matchday
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tools/build.ps1
# -SkipFrames to re-encode from existing frames
```

Pipeline: `tools/capture.mjs` (headless Chrome via CDP, `window.renderAt(t)` deterministic virtual clock, JPEG frames) → static ffmpeg (`design/.tools/node_modules/ffmpeg-static`) for MP4/WebM/GIF and still extraction → `tools/capture.mjs --page statics` for the static pack. Source stage: `src/index.html` + `styles.css` + `animate.js` (timelines `reel15`/`reel30`/`gif6`); statics: `src/statics.html` + `statics.css` + `statics.js`. Preview: `node tools/serve.mjs` then `http://127.0.0.1:4173/src/index.html?t=9.6&timeline=reel15`, statics at `…/src/statics.html?layout=feed1x1`.

## 5. Verification

Full evidence in `verification.md`. Summary:
- **Film:** 15.00 s MP4 + 15.01 s WebM and 30.00 s MP4, 1080×1920 / 30 fps / 9:16, H.264 High/L4.2 + AAC 48 kHz (VP9 + Opus for WebM), all full-decode `exit 0`; GIF 5.99 s / 90 frames / 480×854 / 15 fps.
- **Stills:** every PNG header read back — 1080×1920 cover/poster/story, 1080×1080 feed, 1080×1350 portrait + five carousel panels, 1600×2400 contact sheet.
- **Provenance:** the six shipped captures are byte-identical to `docs/screenshots/premium/` and match `MANIFEST.json` sha256 (commit `e25310e6`); grep for old CI screenshots/map assets in `src/` + `tools/` returns zero hits.
- **OSM attribution:** present on every film/static map frame; verified in `out/qa/15-hunt.png`, `out/qa/15-claim.png` and the static map plates.
- **Phone legibility:** all key beats downscaled to 390 px read (hook, 41:12 board, ZONE 240 m, captions, end-card CTA/URL/micro/trust).
- **Workflow:** no app/server edits, no commits, no posts; frames cache deleted after verification (rebuild via `tools/build.ps1`).

## 6. Limitations / honest notes

1. **Copy is provisional — owner approval pending.** No publishing.
2. **No VO recorded.** The film is music + burned-in graphics; a dry-read VO would be an audio-only remux.
3. **Arabic/MSA not rendered** — variants are in `captions-hooks.md`; an Arabic cut needs RTL layout + native review.
4. **OSM attribution dependency:** map beats must keep `© OpenStreetMap contributors`; cropping it out would violate the tile licence.
5. **30 s cut is MP4-only** (15 s also has WebM); GIF is silent.
6. The source captures include the emulator status bar (21:04, 3G) and debug test data — they are the real build, not a marketing mock.
7. No app/server edits, no commits, no posts; this folder is self-contained.
