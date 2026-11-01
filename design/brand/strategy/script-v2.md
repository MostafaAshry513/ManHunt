# ManHunt — 15 s copy treatments v2 (animated-map only)

> ## 🟡 PROVISIONAL — owner approval pending
>
> These lines are not owner-approved. Renders are fine; **publishing is not** until he confirms.
> Every output built from this file must be marked `copy: provisional — owner approval pending`.
> **Correction applied 2026-11-01:** the tag beat was wrong in the first version of this file.
> `Tagged. Round over.` overstated the rule — a tag eliminates one Prey; the hunt ends when every
> Prey is tagged or the clock runs out. Use `Tagged. You're out.` (15 s, second person) /
> `Tagged. They're out.` (60 s, third person).

**Status:** production copy for motion v4/v5. Three complete treatments, all obeying the owner's
constraint: **the film is 100% animated map / field — no real app screenshot anywhere.**
Supersedes the caption beats in `brand-platform.md` §6.1 (those belonged to the rejected cut).

**Build order recommendation:** **Treatment 1 (HUNTING) now**, Treatment 3 (THE SNITCH) as the
side-by-side A-B variant, Treatment 2 (THE BET) only if comments are the KPI. Reasoning in §5.

Read with `slogan-v2.md` (why these lines) and `tone-of-voice.md` (guardrails).

---

## 0. Shared spec (applies to all three)

| Item | Spec |
|---|---|
| Runtime | 15.00 s exactly, 9:16 1080×1920, 30 fps, silent-first (every word on screen; VO optional) |
| Visuals | Animated map/field only: street-block grid, chalk sweep, zone ring, coral & violet dots, trail, pings, clock, tag snap. **No real screenshot, no photography, no people, no OSM tiles.** |
| Copy budget | Hook ≤ 5 words in 0–1.5 s. Beats ≤ 5 words (max one 7-word explainer). Max 6 copy events in the film. |
| Copy style | Second person, present tense, one verb per line, full stops. No exclamation marks, no emoji on screen, no one-word captions. |
| Clock | May appear and count down. **Copy never states a duration** — hunt length is host-set (default 60 min). |
| Wordmark | Stays behind `MH_LOCKUP.wordmark`; identity-designer's lockup swaps in with one edit |
| End-card structure | wordmark → line → `Install free for Android` → URL → `free APK · Android 8+ · not on Play Store` → `Play with people you trust.` |
| CTA discipline (one verb per asset) | The **film end card** carries the conversion action `Install free for Android`. The **cover/poster** carries the instruction `Create a hunt. Send the code. Hide.` (owner-and-motion agreed, v4 cover). Captions carry whichever the asset lacks. Never two competing verbs on one card. |
| Cover line | `HIDE FROM / YOUR FRIENDS.` — the permanent short form, not the film hook. Convention: **cover = permanent line, film = hook**, so the pair always agrees in family without repeating verbatim. |
| Attribution | **Not required in this version** — the map is original geometry, not OSM data. If any real osmdroid tile is ever composited back in, "© OpenStreetMap contributors" must return. |
| Bonus from the constraint | Dropping the real screenshot also removes the default-green osmdroid pin break — the brand palette logic is now clean for the whole film. |
| Arabic | Full variant of every on-screen line (MSA on screen, Egyptian allowed for social captions), re-measured at 360 dp and 1.5× text scale; timer digits stay LTR |
| Motion kit | Reuse the current build: K1 chalk sweep · K2 block grid · K3 zone ring · K4 dot spawn · K5 report ping · K6 trail draw · K7 hunter converge · K8 clock lock · K9 tag snap · K10 end card |

**Why the copy is shaped this way:** each line has to land in ~1.5 s on someone who has never heard
of ManHunt, and be worth forwarding to a group chat. Lines are short because the map is doing the
explaining; the words carry only what the picture can't.

---

## 1. Treatment 1 — **HUNTING** *(recommended build)*

**Rationale:** the only hook that makes a stranger think of their own group chat within one second —
no jargon, no app knowledge, and the map then proves it.

| Time | On-screen copy | Map / field action | SFX |
|---|---|---|---|
| 0.0–1.5 | **Your friends are hunting you.** | Black. Chalk sweep L→R leaves a lit edge; the line stamps on the sweep | chalk scratch |
| 1.5–4.2 | **One of you is the prey.** | K2 block grid draws; K3 cyan zone ring draws with its gap; K4: 5 violet dots appear at the frame edges, 1 coral dot near the middle | low pulse |
| 4.2–6.8 | **Your phone tells them where you are.** | K5: the coral dot pings (ring expands, 400–600 ms, ×3 at report interval); K7: violet dots begin moving inward | ping |
| 6.8–9.4 | **Move. Or get tagged.** | K6 coral trail starts drawing; K8 clock locks in and ticks; violet dots close the gap | clock ticks |
| 9.4–11.6 | **Tagged. You're out.** | K9: violet ring snaps onto the coral dot (120 ms); one frame black, two frames coral-invert; dots freeze | snap |
| 11.6–15.0 | end card: **Your friends are hunting you.** + `Install free for Android` + URL + micro + trust | K10; chalk rules top and bottom; no motion except the fade | silence |

**VO (natural pace, ~5.5 s, record dry):** "Your friends are hunting you. One of you is the prey.
Your phone tells them where you are. Move — or get tagged."
Stress: HUNT · PREY · PHONE · TAGGED. Do not read it as an announcer; read it like telling a friend.

**One-line rationale:** uses the one relationship everyone already has (friends) as the threat, so
the film explains itself before the first beat ends.

**Caption (post copy):**
> the group chat has a map now. create a hunt, send the code, hide.
> free Android APK — 74.208.99.178 · Android 8+ · not on Play Store

**Arabic variant (on-screen, MSA):**
أصدقاؤك يطاردونك. · واحد منكم هو الفريسة. · هاتفك يخبرهم أين أنت. · تحرّك، أو يوسمونك. ·
تم وسمك. انتهت الجولة.
**Egyptian caption:** «أصحابك بيطاردوك. اعمل مطاردة، ابعت الكود، واستخبى.»

**Tests:** 3-second hold vs. the old cut; shares/“@friend” comments (the forwardability signal).

---

## 2. Treatment 2 — **THE BET** *(comment engine)*

**Rationale:** a dare is the cheapest comment engine on a cold account — people argue with "you
can't", not with a benefit list.

| Time | On-screen copy | Map / field action | SFX |
|---|---|---|---|
| 0.0–1.5 | **Bet you can't hide.** | Black; chalk line stamps across; a single coral dot lands on the line's end | chalk scratch + soft thud |
| 1.5–4.2 | **You hide in the real world.** | K2 block grid + K3 zone; coral dot sits alone inside the ring; the world stays still | low pulse |
| 4.2–6.8 | **They follow you on a live map.** | K4: 4 violet dots appear at the edges; K5: coral ping; K7: violet starts moving | ping |
| 6.8–9.4 | **Can you outlast the clock?** | K8 clock locks and counts; K6 trail draws; violet dots tighten | clock ticks |
| 9.4–11.6 | **Tagged. You're out.** | K9 snap; one frame black, two frames coral invert | snap |
| 11.6–15.0 | end card: **Bet you can't hide.** + `Install free for Android` + URL + micro + trust | K10 | silence |

**VO (~5 s):** "Bet you can't hide. You hide in the real world. They follow you on a live map.
Can you outlast the clock?"
Stress: BET · REAL · MAP · CLOCK. The last line is a genuine question — leave it hanging, do not
answer it.

**One-line rationale:** turns the film into a challenge the viewer wants to win, which is the only
reason a stranger comments on a game they haven't played.

**Caption:**
> no gear, no fee, no excuse — bet you can't stay hidden. free Android APK 74.208.99.178

**Arabic variant:** أتحداك أن تختبئ. · تختبئ في العالم الحقيقي. · يتابعونك على خريطة مباشرة. ·
أتظن أنك تصمد حتى نهاية الوقت؟
**Egyptian caption:** «أتحداك تستخبى. استخبى من أصحابك — بس الخريطة معاهم.»

**Tests:** comments per 1 000 views; replay rate at the 9–12 s tag beat.

---

## 3. Treatment 3 — **THE SNITCH** *(the distinctive one)*

**Rationale:** owns the one mechanic no competitor's video can honestly show, and it's the funniest:
your own phone sold you out.

| Time | On-screen copy | Map / field action | SFX |
|---|---|---|---|
| 0.0–1.5 | **Your phone is a snitch.** | Black; a phone-shaped outline flickers once, then shatters into the chalk grid; line stamps | chalk scratch + short glitch |
| 1.5–4.2 | **It tells them where you are.** | K2 grid + K3 zone; coral dot appears; K5 single long ping ring reaches the frame edge | ping |
| 4.2–6.6 | **So you keep moving.** | K6 trail draws immediately behind the coral dot; K7 violet dots start converging | pulse |
| 6.6–9.2 | **They're closing in.** | K8 clock locks; violet dots tighten visibly; coral dot changes direction | clock ticks |
| 9.2–11.6 | **Tagged. You're out.** | K9 snap; invert | snap |
| 11.6–15.0 | end card: **Your phone is a snitch.** + `Install free for Android` + URL + micro + trust | K10 | silence |

**VO (~4.5 s):** "Your phone is a snitch. It tells them where you are. So you keep moving.
They're closing in. Tagged."
Stress: SNITCH · WHERE · MOVING · CLOSING · TAGGED. Keep it dry — the joke lands flat, not jokey.

**One-line rationale:** names the game's unique mechanic in the funniest possible way, so the film is
memorable even if the viewer never installs.

**Caption:**
> your phone has been telling on you this whole time. free Android APK 74.208.99.178 — Android 8+,
> not on Play Store.

**Arabic variant:** هاتفك يفضحك. · يخبرهم أين أنت. · لذلك تبقى تتحرك. · إنهم يقتربون. ·
تم وسمك. انتهت الجولة.
**Egyptian caption:** «موبايلك يفضحك. سخّن الكود وابعت لأصحابك قبل ما يلاقوك.»

---

## 4. Change list for the v4 edit (so motion can work from one table)

| Slot | v3 (now shipped) | v4 Treatment 1 |
|---|---|---|
| `COPY.hook` | `your street has rules now` | `Your friends are hunting you.` |
| `COPY.beat1` | `two teams` | `One of you is the prey.` |
| `COPY.beat2` | `one clock` | `Your phone tells them where you are.` |
| `COPY.beat3` | `the map already knows` | `Move. Or get tagged.` |
| `COPY.beat4` | `tagged` | `Tagged. You're out.` (accurate — a tag eliminates one Prey, it does not end the hunt unless they were the last) |
| `COPY.endLine` | `No gear. No fee. Just players.` | `Your friends are hunting you.` |
| Real-screenshot beat | 7.0–10.0 s (`05-map-crop.png`) | **removed** — replace with K5 pings + K7 converge in the same slot |
| OSM credit | present on the map beat | **removed** (no OSM data on screen) — reinstate only if tiles return |
| `COPY.trust`, micro line, URL, button, `MH_LOCKUP` | keep | keep unchanged |

Everything else in the current build (timing, safe areas, end-card layout, audio beds) can stay; this
is a copy-and-one-beat change, not a rebuild.

## 5. Which to build, and why

1. **Treatment 1 (HUNTING)** — build now. It has the strongest 1.5 s hook in the set, the clearest
   human stake, and it needs the least new animation (6 dots, pings, trail, snap — all existing kit).
2. **Treatment 3 (THE SNITCH)** — build in the same pass as the A-B variant if time allows. It tests a
   different *kind* of line (mechanic-led humour vs. social threat) and is the one most likely to be
   screenshotted and reposted.
3. **Treatment 2 (THE BET)** — hold. It is the best comment-bait but the weakest at explaining the
   game; use it only when comments are the metric you care about.

**Isolation for the test:** every treatment keeps the same end-card layout, button, URL, micro and
trust line — only the line changes. That way a difference is attributable to the copy, not the design.
After the test, the winning line becomes the social end card; permanent app/install-page surfaces use
the short form `Hide from your friends.` (`slogan-v2.md` §4).

## 6. Guardrail checklist before render

- [ ] No duration stated anywhere (clock is visual only, host-set default 60 min)
- [ ] No `safe` / `survive` / `protect` / `encrypted` / `private` / `anywhere` / `free forever`
- [ ] No player counts, scores, testimonials, fake urgency
- [ ] No real app screenshot, no OSM tiles, no people, no trespassing imagery
- [ ] Every line readable muted, at 360 dp equivalent, at 1.5× text scale
- [ ] No one-word captions; no exclamation marks; no emoji on screen
- [ ] End card carries the honest install line (`free APK · Android 8+ · not on Play Store`) and
      `Play with people you trust.`
- [ ] Arabic variant rendered and measured (RTL, digits LTR, no mixed register)
- [ ] Runtime exactly 15.00 s; first frame is not black for longer than the 0.3 s chalk-in
