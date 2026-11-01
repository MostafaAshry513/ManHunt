# Storyboard — ManHunt vertical social short

**Working title:** "Tonight's Hunt — one clock"
**Format:** 1080 × 1920 (9:16), 15.00 s, 30 fps, silent-first (captions on), original synthesised audio
**Cutdown:** 6.00 s loop, 720 × 1280 GIF (beats 2 → 4 → 5 → end card)
**Cover:** 1080 × 1920 PNG poster still
**Direction lock:** PICKUP — read as interim-authoritative copy from `design/brand/strategy/brand-platform.md` §6.1 (owner approval pending). Chalk on asphalt, flat fills, two kit colours, the server clock recurring. Copy is centralised in `src/animate.js` → `MH_COPY`; the slogan line can be swapped and re-rendered in one edit.

---

## Concept

ManHunt is treated as a **pickup field sport**, not an app. The frame is a borrowed pitch: asphalt navy, chalk markings, a dot-grid block map, an official cyan zone, and the two kit colours — coral for Prey, violet for Hunters. Nothing is a testimonial and nothing is a promise; the only "voice" is the caption band and the **server clock** counting down in the corner. The whole film is one idea: *the field already knows where everyone is* — the map is not a feature, it is the referee.

**Hook logic (0–1.5 s):** the first frame is already a complete sentence — the official Open Zone MANHUNT wordmark and the line "your street has rules now" are on screen, and a chalk line is sweeping across the frame. A scroll-stopper does not get a pre-roll.

**Silent-first:** every beat carries its information as on-screen text; the audio is a texture, never the message. The last 3 s are silent by design (brand beat sheet: end-card audio = silence), so the piece works muted and loops cleanly.

---

## Beat-by-beat

| # | Time | Picture | Caption | Audio |
|---|---|---|---|---|
| 1 | 0.00–1.50 s | Flat asphalt + dot grid. A chalk line sweeps left → right, leaving a lit edge and a cyan head. Official MANHUNT wordmark + REAL-WORLD HIDE & SEEK sits top-left. | `your street has rules now` | scratching chalk (synthesised noise scrape) |
| 2 | 1.50–4.00 s | Hard cut to the field: touchlines and corner arcs draw in chalk; the official cyan centre circle (the zone) draws clockwise over the block map. Coral Prey dot appears bottom-left, two violet Hunter dots top-right, labelled. | `two teams` (`two` in coral) | low sub pulse |
| 3 | 4.00–7.00 s | The stadium clock locks into the top-right corner at 60:00 and ticks. The coral trail draws behind the Prey dot as it runs the pursuit line; the two violet Hunters close the distance. | `one clock` | clock ticks + low pulse |
| 4 | 7.00–10.00 s | Hard cut to a real app render: the live hunt map, framed as evidence on the field, with a coral ping expanding from the prey marker. OSM credit carried. One-frame cut to black at 9.97 s. | `the map already knows` | single ping |
| 5 | 10.00–12.00 s | Back to the field. The Prey dot holds the centre; the violet Hunter ring snaps onto it. Two-frame coral inversion on the snap. | `tagged` | snap + impact |
| 6 | 12.00–15.00 s | End card on navy: chalk rule, slogan, official Open Zone stacked lockup (mark above the drawn wordmark, clear space baked in), install CTA, URL, honest install line, confidence line, chalk rule. | `No gear. No fee. Just players.` + `Install free for Android` + `http://74.208.99.178/` + `free APK · Android 8+ · not on Play Store` + `Play with people you trust.` | silence |

The end card also carries the brand-required confidence line **"Play with people you trust."** — muted ink, between the install microcopy and the bottom chalk rule (tone-of-voice §4 "always include"; the video is forwarded without its caption). The MANHUNT mark is the owner-approved **Open Zone** lockup, inlined verbatim from the identity package (`design/brand/identity/final/lockup/lockup-stacked-light-on-dark.svg`); the slogan sits outside the lockup and the wordmark is never retyped or letter-spaced.

---

## Visual rules applied

- **Palette:** asphalt `#0B1220`, chalk `#E6EDF7`, official cyan `#22D3EE` (field/referee — never a team), Prey coral `#FF7A59`, Hunters violet `#A79BFF`. No other colours.
- **Flat only:** flat fills, no gradients, no glow, no photographic background. The single exception is a 5 % monochrome grain overlay for asphalt texture.
- **Chalk geometry is the only decoration:** touchlines, corner arcs, halfway line, centre circle, pursuit line. No icons, no emoji, no stock art.
- **Type:** Big Shoulders (condensed athletic display) for captions and the cover slogan, Instrument Sans (plain sans) for end-card slogan/CTA, Red Hat Mono for clock, labels, URL and install microcopy. The MANHUNT lockup is the owner-approved drawn vector (Open Zone, no font dependency), inlined verbatim from `design/brand/identity/final/`. All fonts are OFL, bundled in `assets/fonts/`.
- **Safe area:** all type inside 84 px side margins and above the bottom 320 px (Reels / TikTok / Shorts chrome). Captions bottom edge at 1560 px.
- **Clock:** monospaced-like tabular digits, top-right, from 60:00 (the host-set default; the host can change the length — no fixed duration is claimed in copy).
- **Real app visual:** `05-hunting-map.png` crop from `docs/screenshots/` (ManHunt-owned render), carrying "© OpenStreetMap contributors" on screen during the shot.

## Accuracy / safety guardrails (verified against repo)

- No "forty minutes" or any claimed fixed hunt length — default is 60 min, host-set in `server/src/domain/match.ts`. The clock is shown as a default, not a rule.
- No "survive"/safety/rescue language. No trespassing imagery or "anywhere is yours" claims; the field is borrowed public ground.
- No real people, no faces, no fake testimonials, no fake player counts or scores.
- Not on Google Play is stated on the end card; the install is a free sideloaded APK.
- Map tiles: the only OSM-derived visual is the ManHunt screenshot of the live map; the required attribution is displayed on screen. No external tiles are used in the motion graphics.

## Alternate endings (re-render only, no redesign)

`src/animate.js` → `MH_COPY.sloganLines`:

- **Approved and shipped:** `['No gear. No fee.', 'Just players.']` — owner-approved 2026-11-01 together with the PICKUP direction and the Open Zone mark.
- Former slogan `['Hide. Hunt.', 'Survive.']` is retired for external use (LOCKUP.md §5). Do not pair it with the approved lockup; only re-enable if the owner reverses the decision.
- The short's visual grammar does not depend on the slogan — only the end card, cover and poster change. The lockup itself is not slogan-dependent.
