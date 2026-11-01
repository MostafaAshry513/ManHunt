# Platform crops & posting notes — ManHunt v5 explainer

**COPY STATUS: PROVISIONAL — OWNER APPROVAL PENDING.** Do not publish until the owner approves.

Masters are 9:16 / 1080 × 1920. Everything is designed inside the safe area (84 px side margins, bottom 320 px clear), so no platform-specific re-crop is required for the primary posts.

## Assets

| Asset | Path | Use |
|---|---|---|
| 60 s master | `out/v5/manhunt_explainer_60s_1080x1920.mp4` (+ `.webm`) | Reels / TikTok / Shorts / any vertical feed |
| 30 s cut | `out/v5/manhunt_explainer_30s_1080x1920.mp4` | Stories / feed / paid social short |
| 15 s cut | `out/v5/manhunt_15s_1080x1920.mp4` | hook cut / paid social / re-posts |
| 6 s teaser | `out/v5/manhunt_teaser_720x1280.gif` | Slack/community/Discord loops, GIF-capable surfaces |
| Cover / thumbnail | `out/v5/manhunt_explainer_cover_1080x1920.png` | IG Reels cover, TikTok cover, Shorts thumbnail (9:16) |
| Square thumbnail | `out/v5/manhunt_thumbnail_1080x1080.png` | feed grid / LinkedIn / X card crop |
| Poster | `out/v5/manhunt_explainer_poster_1080x1920.png` | still frame (t = 0.9 s) for carousels/print |
| Subtitles | `out/v5/manhunt_explainer_60s.srt`, `_30s.srt`, `manhunt_15s.srt` | platform caption tracks (UTF-8 with BOM) |

## Platform notes

- **TikTok / Reels / Shorts:** upload the 9:16 MP4; turn off platform auto-captions when the burned-in captions are on, or supply the SRT as an alternate-language track only. The 60 s master is the teaching cut; the 15 s is the hook cut.
- **Stories:** 30 s cut fits the 15 s-per-card limit only in two cards; alternatively use 15 s cut per card.
- **Feed grid / X / LinkedIn:** use `manhunt_thumbnail_1080x1080.png`; it is a centre crop of the cover designed to keep the headline, legend, CTA and URL. If a platform needs 16:9, crop the square to 1200 × 675 and keep the safe band; do not squash.
- **Caption tracks:** SRTs carry narrative lines only (no URL/micro/trust) and are verbatim to burned-in text. Re-export as UTF-8 with BOM if a platform's uploader mangles the middle dot (the SRTs contain only narrative lines, so this should not occur).
- **Audio:** original synthesised score; no licensed music, no VO. If a platform requires a silent version, drop the audio stream without re-encoding video.
- **Copy status:** provisional — owner approval pending. CTA convention: film end card = install button; campaign CTA `Create a hunt. Send the code. Hide.` is for captions, cover and link-in-bio.
- **Not on Google Play:** the install line must remain on screen and in post copy where the install CTA appears.
