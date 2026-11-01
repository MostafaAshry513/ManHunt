# Captions and copy — ManHunt 15 s hook cut (v5 series)

**COPY STATUS: PROVISIONAL — OWNER APPROVAL PENDING.** This file documents the 15 s cut; the 60 s explainer copy table, SRT timing and Arabic variants are in `captions-60s.md`.
**Copy source:** brand copy family v2 (`design/brand/strategy/script-v2.md` + `slogan-v2.md`), one-pass reviewed by brand-director; owner approval pending. Every string is rendered from `src/animate.js` → `COPY`; change it there once and re-render.
**v4/v5 note:** the real-screenshot beat is gone, so the OSM attribution row is gone too — no OSM data appears in the film.

---

## 1. On-screen text (English — authoritative)

| Time | Element | Exact string | Style |
|---|---|---|---|
| 0.0–1.5 s | Hook caption | `Your friends are` / `hunting you.` | Big Shoulders 124 px, chalk, sentence case, bottom-left |
| 0.0–1.5 s | Brand bug | official drawn `MANHUNT` wordmark + `REAL-WORLD HIDE & SEEK` | inline SVG wordmark + Red Hat Mono 22 px, chalk + cyan |
| 1.5–4.2 s | Caption | `One of you is` / `the prey.` | Big Shoulders 148 px |
| 1.5–4.2 s | Team labels | `PREY` (coral) · `HUNTERS` (violet) | Red Hat Mono 23 px |
| 4.2–6.8 s | Caption | `Your phone tells` / `them where` / `you are.` | Big Shoulders 124 px, 3 lines |
| 4.2–6.8 s | Clock | `HUNT CLOCK` · `60:00` → `59:5x` · `SERVER` | Red Hat Mono / Big Shoulders 168 px |
| 6.8–9.4 s | Caption | `Move.` / `Or get tagged.` | Big Shoulders 148 px |
| 9.4–11.6 s | Caption | `Tagged.` / `Round over.` | Big Shoulders 176 px |
| 11.6–15.0 s | End-card line | `Your friends are` / `hunting you.` | Instrument Sans Bold 86 px, cyan |
| 11.6–15.0 s | Lockup | Official **Open Zone stacked lockup** — mark above the drawn `MANHUNT` wordmark (no font, 7 drawn paths) | inline SVG, 640 px wide on the 1080 canvas, light-on-dark set |
| 11.6–15.0 s | CTA (invite loop) | `Create a hunt. Send the code. Hide.` | Instrument Sans Bold 40 px, navy on cyan |
| 11.6–15.0 s | URL | `http://74.208.99.178/` | Red Hat Mono Bold 58 px, chalk |
| 11.6–15.0 s | Install microcopy (honesty) | `free APK · Android 8+ · not on Play Store` | Red Hat Mono 28 px, muted |
| 11.6–15.0 s | Confidence line (brand-required) | `Play with people you trust.` | Instrument Sans 26 px, muted ink (not coral, not a banner) |

**Notes**
- Captions are now **sentence case with full stops** (brand copy v2). `.cap-text` has `text-transform: none`; do not add lowercase or exclamation marks.
- The clock starts at `60:00` because 60 min is the server default; the host can set 5 min–4 h. No copy claims a fixed duration.
- The end card never implies Google Play distribution. "Not on Play Store" is a legal/trust requirement, not a disclaimer to hide.
- "Play with people you trust." is an always-include line (brand tone-of-voice) because the video travels without its post caption. It must read as confidence: muted ink below the install microcopy — never a warning banner, never coral.
- **End card vs cover:** the end card uses the campaign line "Your friends are hunting you." (copy v2). The **cover** uses the permanent line "Hide from your friends." — the earlier PICKUP positioning line is owner-rejected and retired; it must not appear on any surface.
- The MANHUNT mark is the owner-approved **Open Zone** lockup, inlined verbatim from `design/brand/identity/final/lockup/lockup-stacked-light-on-dark.svg` (wordmark on cover/hook from `wordmark-light-on-dark.svg`). It is drawn vector, not type: never retype it, never add letter-spacing, never recolour/outline/rotate it, never put copy inside it, and keep its baked-in clear space empty.
- No OSM tiles, OSM-derived imagery, app screenshots or photos appear in v4 — no map attribution is required.

---

## 2. VO direction (brand copy v2 — not recorded in this build)

The brand supplies a ~5.5 s VO for platform cuts. **It is not in the shipped preview:** the film ships with the original synthesised score only (there is no approved/recorded voice track in the repo, and no TTS voice is used for brand VO). The film is designed to work muted; add the VO track when the owner/brand supplies a recorded or approved voice, then re-encode audio only (video untouched).

Direction: dry, tell-a-friend delivery. Stress **HUNT · PREY · PHONE · TAGGED**.

> "Your friends are hunting you. One of you is the prey. Your phone tells them where you are. Move — or get tagged."

## 3. Arabic variants (optional — not rendered yet)

Brand-supplied MSA on-screen lines (copy v2). These are **not baked into the shipped renders** and need native review plus an RTL caption layout pass (mirror the caption band to the right margin and keep the clock top-left).

| English | Arabic (MSA) |
|---|---|
| Your friends are hunting you. | أصدقاؤك يطاردونك. |
| One of you is the prey. | واحد منكم هو الفريسة. |
| Your phone tells them where you are. | هاتفك يخبرهم أين أنت. |
| Move. Or get tagged. | تحرّك، أو يوسمونك. |
| Tagged. Round over. | تم وسمك. انتهت الجولة. |
| Hide from your friends. | اختبئ من أصدقائك. |
| Create a hunt. Send the code. Hide. | أنشئ مطاردة. أرسل الرمز. اختبئ. |
| free APK · Android 8+ · not on Play Store | ملف APK مجاني · أندرويد 8+ · ليس على متجر Play |

Terminology matches the app's own Arabic (`android/.../i18n/Localization.kt`: tag = وسم, prey = فريسة).

---

## 4. Post captions (for the social manager)

**Primary (Treatment 1):**
> Your friends are hunting you. One of you is the prey. Your phone tells them where you are. Move — or get tagged.
> Free Android APK (not on Play Store): http://74.208.99.178/ · Android 8+ · original audio.

**Short / hook-forward:**
> your friends are hunting you.
> the group chat has a map now. create a hunt, send the code, hide.
> free Android APK → http://74.208.99.178/ · Android 8+ · not on Play Store

**Feature-forward:**
> Two teams, one live map, one clock. Prey hide; Hunters track and tag in person. The server keeps the clock and the calls.
> Free sideloaded Android APK: http://74.208.99.178/

**Hashtags (≤ 5, no hashtag soup):**
`#ManHunt` `#HideAndSeek` `#PickupSport` `#AndroidGame` `#OutdoorGames`

**Disclosure lines (keep at least one with any paid boost):**
- `Free APK, sideload — not on Google Play.`
- `Original synthesised audio.`
- `No real people or user footage; all on-screen geometry is original.`

## 5. Copy variants / A-B

- **Treatment 1 "HUNTING"** — shipped in the v4 preview.
- **Treatment 3 "THE SNITCH"** (copy v2 §3, hook `Your phone is a snitch.`) — not built; same structure and kit, only `COPY` lines differ. Available as an A/B.
- **Treatment 2 "THE BET"** — not to be built (brand instruction).

**Do not** put on screen: "survive/safe/protect" promises, fake player counts or scores, fake reviews/testimonials, trespassing/rooftop imagery, a fixed hunt length, or "on Google Play".

## 6. Accessibility / platform notes

- Captions are burned in (silent-first). Where a platform supports an SRT, the strings above are the source.
- Contrast: chalk `#E6EDF7` on asphalt `#0B1220` ≈ 15:1; cyan `#22D3EE` on asphalt ≈ 9:1; coral `#FF7A59` on asphalt ≈ 5.7:1; violet `#A79BFF` on asphalt ≈ 6.6:1 — all pass AA for large text.
- Keep the bottom 320 px and the right 120 px clear of essential text when re-cropping for other platforms.
