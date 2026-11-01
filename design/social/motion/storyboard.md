# Storyboard — ManHunt 15 s hook cut (v5 series)

**COPY STATUS: PROVISIONAL — OWNER APPROVAL PENDING.** This file documents the 15 s cut. The 60 s explainer (primary deliverable) is in `storyboard-60s.md`; copy/caption/SRT detail is in `captions-60s.md`.
**Working title:** Treatment 1 "HUNTING" — 15 s cut
**Format:** 1080 × 1920 (9:16), **15.00 s**, 30 fps, silent-first (captions on), original synthesised score
**Cutdown:** 6.00 s loop, 720 × 1280 GIF (hook → tag → end card; v5 series)
**Cover:** 1080 × 1920 PNG cover; poster frame at t = 0.9 s
**Copy:** brand copy family v2 (`design/brand/strategy/script-v2.md` + `slogan-v2.md`), owner approval pending for the v5 lines. Every on-screen string lives in `src/animate.js` → `COPY`.
**Direction lock:** PICKUP · owner-approved Open Zone identity (task-37) · 15 s cut of the v5 series.

---

## v4 change (owner feedback)

The old beat 4 (**7.0–10.0 s**) was a crop of the real app screenshot (`docs/screenshots/05-hunting-map.png`) with an OSM credit. **It is removed completely** — no real image, no photo, no map tiles, no app UI anywhere in the film, and the screenshot assets are deleted from the workstream. The same 3 s is now **continuous original animated field action**: the zone closes, the Prey runs a new line, all five Hunters close the net and coral pings leave the Prey. Everything else (chalk/asphalt kit, block grid, clock, team colours, lockup, end card, trust line, install CTA) is unchanged.

**Consequences:** no OSM attribution is required any more (the map is original geometry, not OSM data). The green-osmdroid-pin palette break is gone; the film is palette-clean. The clock may count down, but no copy states a duration (host-set default 60 min).

---

## Concept

ManHunt is a pickup field sport, so the film is shot **on the borrowed pitch**: asphalt navy, chalk markings, a dot-grid block map, an official cyan zone, coral for Prey and violet for Hunters. There is no product screenshot and no stock footage — the entire 15 s is generated geometry and drawn vector, which is also why it can be re-rendered after a copy or identity change. The only "voice" is the caption band plus the server clock counting down in the corner.

**Hook logic (0–1.5 s):** the first frame is already the hook — the official MANHUNT wordmark sits top-left and "Your friends are hunting you." is fully readable while a chalk line sweeps across the field. Readable at phone size inside 1.5 s; no black frame.

**Silent-first:** every beat carries its message as on-screen text. The brand VO direction is written into `captions.md` but is **not recorded** in this build (original score only); the film is designed to work muted.

---

## Beat-by-beat

| # | Time | Picture (original geometry only) | Caption | Audio |
|---|---|---|---|---|
| 1 | 0.00–1.50 s | Flat asphalt + dot grid; a chalk line sweeps left → right leaving a lit edge and a cyan head; official wordmark top-left. | `Your friends are hunting you.` | chalk scratch |
| 2 | 1.50–4.20 s | Hard cut to the field: touchlines and corner arcs draw in chalk; the official cyan zone circle draws over the block map. Coral Prey dot appears bottom-left, two violet Hunters top-right, labelled. | `One of you is the prey.` | low sub pulse |
| 3 | 4.20–6.80 s | The stadium clock locks into the top-right corner at 60:00 (host-set default) and ticks. The coral trail draws behind the Prey as it runs the pursuit line; the two Hunters close the distance. | `Your phone tells them where you are.` | clock ticks + low pulse |
| 4 | 6.80–9.40 s | No cut — the field keeps moving: the cyan zone ring shrinks 336 → 246 while the Prey runs a new dodge line and the coral trail keeps growing. The two Hunters continue converging and three more violet Hunters fade in to close the net (5 dots). Three coral ping rings leave the Prey and die before the caption band; violet dashed pursuit traces. One-frame cut to black at 9.3667 s. | `Move. Or get tagged.` | clock ticks + rising pings |
| 5 | 9.40–11.60 s | Back to the field centre: the Prey dot holds the middle; the violet Hunter ring snaps onto it; two-frame coral inversion at the snap. | `Tagged. Round over.` | snap + impact |
| 6 | 11.60–15.00 s | End card on navy: chalk rules, campaign line, official Open Zone stacked lockup (mark above the drawn wordmark, clear space baked in), invite CTA, URL, honest install microcopy, confidence line, chalk rule. | `Your friends are hunting you.` + `Create a hunt. Send the code. Hide.` + `http://74.208.99.178/` + `free APK · Android 8+ · not on Play Store` + `Play with people you trust.` | silence |

The end card carries the brand-required confidence line **"Play with people you trust."** — muted ink, between the install microcopy and the bottom chalk rule (tone-of-voice "always include"). The MANHUNT mark is the owner-approved **Open Zone** stacked lockup, inlined verbatim from `design/brand/identity/final/lockup/lockup-stacked-light-on-dark.svg`; the campaign line sits outside the lockup and the wordmark is never retyped or letter-spaced. The **cover** uses the permanent line "Hide from your friends." (the earlier PICKUP positioning line is owner-rejected).

---

## Visual rules applied

- **Palette:** asphalt `#0B1220`, flat block `#0E1727`, chalk `#E6EDF7`, official cyan `#22D3EE` (field/referee — never a team), Prey coral `#FF7A59`, Hunters violet `#A79BFF`. Flat fills only; no gradients, no glow (5 % mono grain is the only texture).
- **No real imagery:** no screenshots, no photos, no OSM tiles, no app UI. Everything on screen is original generated/drawn vector geometry; no third-party map data → no OSM attribution is required in this cut.
- **Chalk geometry is the only decoration:** touchlines, corner arcs, halfway line, zone circle, pursuit trail, pursuit traces.
- **Type:** Big Shoulders (condensed display: captions, cover slogan, clock), Instrument Sans (end-card line, CTA), Red Hat Mono (clock label, URL, install microcopy, team labels). The official lockup is drawn vector, not type.
- **Sentence case:** captions are rendered in sentence case with full stops (no `text-transform`); no exclamation marks.
- **Safe area:** all type inside 84 px side margins and above the bottom 320 px (Reels / TikTok / Shorts chrome); captions bottom edge at 1560 px.
- **Clock:** tabular digits, top-right, from 60:00 (the host-set default); no copy states a fixed duration.
- **Five Hunter dots:** the chase uses five violet Hunters (two from the setup + three joining the closing net) against the single coral Prey.

## Accuracy / safety guardrails

- No "forty minutes" or any claimed fixed hunt length — default is 60 min, host-set in `server/src/domain/match.ts`. The clock is shown as a default, not a rule.
- No "survive"/safety/rescue language. No trespassing imagery or "anywhere is yours" claims; the field is borrowed public ground.
- No real people, no faces, no fake testimonials, no fake player counts or scores.
- Not on Google Play is stated on the end card; the install is a free sideloaded APK.
- No OSM tiles or OSM-derived imagery appear in v4 (the old screenshot beat and its credit are removed).
- Arabic variants are written in `captions.md` but not rendered (needs an RTL layout pass + native review).

## Alternate cuts (re-render only, no redesign)

- **Treatment 3 "THE SNITCH"** (brand copy v2 §3): same structure and kit, only `COPY` lines change. Not built — available as an A/B once Treatment 1 is approved.
- **Treatment 2 "THE BET"**: not to be built (brand instruction).
- Copy changes are one edit in `COPY` plus a rebuild; no animation-system change is needed for an A/B copy cut.
