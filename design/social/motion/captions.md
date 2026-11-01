# Captions and copy — ManHunt vertical social short

**Copy lock:** interim-authoritative PICKUP direction from `design/brand/strategy/brand-platform.md` §6.1 (owner approval pending). Every string below is rendered from `src/animate.js` → `MH_COPY`; change it there once and re-render.

---

## 1. On-screen text (English — authoritative)

| Time | Element | Exact string | Style |
|---|---|---|---|
| 0.0–1.5 s | Hook caption | `your street has` / `rules now` | Big Shoulders 124 px, chalk, lowercase, bottom-left |
| 0.0–1.5 s | Brand bug | `MANHUNT` (official drawn wordmark) + `REAL-WORLD HIDE & SEEK` | inline SVG wordmark + Red Hat Mono 22 px, chalk + cyan |
| 1.5–4.0 s | Caption | `two teams` (`two` coral) | Big Shoulders 184 px |
| 1.5–4.0 s | Team labels | `PREY` (coral) · `HUNTERS` (violet) | Red Hat Mono 23 px |
| 4.0–7.0 s | Caption | `one clock` | Big Shoulders 184 px |
| 4.0–7.0 s | Clock | `HUNT CLOCK` · `60:00` → `59:5x` · `SERVER` | Red Hat Mono / Big Shoulders 168 px |
| 7.0–10.0 s | Caption | `the map` / `already knows` | Big Shoulders 124 px |
| 7.0–10.0 s | Attribution | `© OpenStreetMap contributors` | Red Hat Mono 26 px |
| 10.0–12.0 s | Caption | `tagged` (violet) | Big Shoulders 224 px |
| 12.0–15.0 s | Slogan | `No gear. No fee.` / `Just players.` | Instrument Sans Bold 86 px, cyan |
| 12.0–15.0 s | Lockup | Official **Open Zone stacked lockup** — mark above the drawn `MANHUNT` wordmark (no font, 7 drawn paths) | inline SVG, 640 px wide on the 1080 canvas, light-on-dark set |
| 12.0–15.0 s | CTA | `Install free for Android` | Instrument Sans Bold 48 px, navy on cyan |
| 12.0–15.0 s | URL | `http://74.208.99.178/` | Red Hat Mono Bold 58 px, chalk |
| 12.0–15.0 s | Install microcopy | `free APK · Android 8+ · not on Play Store` | Red Hat Mono 28 px, muted |
| 12.0–15.0 s | Confidence line (brand-required) | `Play with people you trust.` | Instrument Sans 26 px, muted ink (not coral, not a banner) |

**Notes**
- Lowercase captions are intentional (brand beat sheet) and set with `text-transform: lowercase` so the source strings stay readable.
- The clock starts at `60:00` because 60 min is the server default; the host can set 5 min–4 h. No copy claims a fixed length.
- The end card never implies Google Play distribution. "Not on Play Store" is a legal/trust requirement, not a disclaimer to hide.
- "Play with people you trust." is an always-include line (brand tone-of-voice §4) because the video travels without its post caption. It must read as confidence, so it sits below the install microcopy in muted ink — never as a warning banner and never in coral.
- The MANHUNT mark is the owner-approved **Open Zone** lockup, inlined verbatim from `design/brand/identity/final/lockup/lockup-stacked-light-on-dark.svg` (and the wordmark on the cover/hook from `wordmark-light-on-dark.svg`). It is drawn vector, not type: never retype it, never add letter-spacing, never recolour/outline/rotate it, never put the slogan or any text inside it, and keep its baked-in clear space empty.

---

## 2. Arabic variants (optional — not rendered yet)

The app's own Arabic terminology is used (`android/.../i18n/Localization.kt`: tag = وسم, prey = فريسة). These are proposed lines for an Arabic cut; they are **not baked into the shipped renders** and need native review plus an RTL caption layout pass (mirror the caption band to the right margin and keep the clock top-left).

| English | Arabic proposal |
|---|---|
| your street has rules now | شارعك له قواعد الآن |
| two teams | فريقان |
| one clock | ساعة واحدة |
| the map already knows | الخريطة تعرف مسبقًا |
| tagged | تم وسمه |
| No gear. No fee. Just players. | لا عتاد. لا رسوم. لاعبون فقط. |
| Install free for Android | ثبّت مجانًا لأندرويد |
| free APK · Android 8+ · not on Play Store | ملف APK مجاني · أندرويد 8+ · ليس على متجر Play |

Brand-approved Arabic slogan source: `design/brand/strategy/brand-platform.md` §8 (same line as above).

---

## 3. Post captions (for the social manager)

**Primary (short):**
> Tonight's hunt: two teams, one clock, your own streets. No gear. No fee. Just players.
> Free Android APK (not on Play Store): http://74.208.99.178/
> © OpenStreetMap contributors for the map screenshot.

**Hook-forward (TikTok / Reels / Shorts):**
> your street has rules now.
> real-world hide & seek — two teams, one clock, a live map.
> free APK for Android 8+ → http://74.208.99.178/

**Feature-forward:**
> Prey hide. Hunters track the live map. Tag by actually touching them. The server keeps the clock and the calls.
> Free sideloaded Android APK: http://74.208.99.178/

**Hashtags (≤ 5, no hashtag soup):**
`#ManHunt` `#HideAndSeek` `#PickupSport` `#AndroidGame` `#OutdoorGames`

**Disclosure lines (keep at least one with any paid boost):**
- `Free APK, sideload — not on Google Play.`
- `Game footage is the ManHunt app; map render © OpenStreetMap contributors.`
- `Original synthesised audio.`

## 4. Hook variants (A/B tests — all fit beat 1 without a redesign)

1. `your street has rules now` — shipped; strongest "what is this?" hook.
2. `someone in your group is hiding` — more narrative, less brand-specific.
3. `two teams. one clock. your block.` — product-truthful, works with the approved slogan and lockup.
4. `the map already knows where they are` — teases the mechanic, weaker first-frame punch.

## 5. Slogan variants (render-time swap)

| Variant | `MH_COPY.sloganLines` | Status |
|---|---|---|
| PICKUP primary | `['No gear. No fee.', 'Just players.']` | **approved + shipped** (owner, 2026-11-01) |
| Former app slogan | `['Hide. Hunt.', 'Survive.']` | retired for external use (LOCKUP.md §5); do not pair with the approved lockup |
| Fairness cut | `['Rules you can't', 'argue with.']` | alternate from brand platform — needs owner/brand approval |
| CTA cut | `['A sport you can', 'start tonight.']` | alternate from brand platform — needs owner/brand approval |

**Do not** put on screen: "survive/safe/protect" promises, fake player counts or scores, fake reviews, trespassing/rooftop imagery, a fixed hunt length, or "on Google Play".

## 6. Accessibility / platform notes

- Captions are burned in (silent-first). Where a platform supports an SRT, the same strings can be supplied: `captions.srt` is not included because burned-in captions are the deliverable; the copy table above is the source.
- Contrast: chalk `#E6EDF7` on asphalt `#0B1220` ≈ 15:1; cyan `#22D3EE` on asphalt ≈ 9:1; coral `#FF7A59` on asphalt ≈ 5.7:1; violet `#A79BFF` on asphalt ≈ 6.6:1 — all pass AA for large text.
- Keep the bottom 320 px and the right 120 px clear of essential text when re-cropping for other platforms.
