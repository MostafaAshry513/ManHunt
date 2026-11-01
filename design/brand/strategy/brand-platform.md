# ManHunt — brand platform and positioning

> ## ⚠️ PARTIALLY SUPERSEDED — read `slogan-v2.md` and `script-v2.md` first
>
> The **direction (PICKUP)** and the analysis in §1–§3 still stand, and the identity work was built
> on them. **Everything copy-related in this file is history:**
> - §4/§5 recommend `No gear. No fee. Just players.` — **rejected by the owner.**
> - The slogan table in §5.6 / §8 and decision **D3** are superseded by `slogan-v2.md`
>   (`Your friends are hunting you.` / `Hide from your friends.` / `Create a hunt. Send the code. Hide.`).
> - The 15 s beat sheet and end-card copy in §6 are superseded by `script-v2.md`.
>
> Do not ship a slogan from this file. The moodboard plate in this folder also predates the change.

**Status:** proposal for owner approval. Nothing here is applied to code, the install page or a
social channel yet. Owner decisions are listed in §10 and only the owner can close them.

**Owner of this file:** brand-director (strategy/copy). The mark, icon and lockup are
`design/brand/identity` (identity-designer). This document is a *brief* for that work, not a logo.

**Read with:**

- `slogans.md` — the slogan system and the keep/replace call
- `tone-of-voice.md` — voice rules, Arabic adaptation, safety/legal guardrails, approved claims
- `visual-direction.md` — palette/type/texture/motion brief for the recommended direction
- `moodboard.html` + `moodboard.png` — one-page visual territory plate

**Method.** Ran as a structured divergent→convergent pass: restated the problem as a How-Might-We,
generated territories from four different frames (category, product, emotion, social ritual),
clustered to three, stress-tested each against the owner's actual goal (players → downloads →
visits) and the product's real constraints, then chose. Two frames were deliberately killed before
the three were written; they are recorded in §9.

---

## 1. The problem, stated properly

**How might we make a free, sideloaded Android game with no marketing budget feel like a real
thing worth organising an evening around — to someone who has never heard of it?**

Three facts about ManHunt decide almost every brand question:

1. **The growth unit is not a person, it is a group.** One install is useless. The product needs
   at least two phones, and the game is best at 4–10 people in the same place at the same time.
   Every asset therefore has two jobs: *convince one person to install*, and *give that person
   something worth forwarding to five people.*
2. **The product's most distinctive fact is a rule, not a feature.** Timers, teams, tag outcomes
   and victory are decided server-side. Nobody can fake a tag, nobody can argue the clock
   (`README.md`, "Server-authoritative gameplay"). Most games in this category cannot say that.
3. **Distribution is the brand's hardest surface.** The install path is a bare-IP HTTP page, an
   APK, "allow unknown sources", and possibly a Play Protect warning (`README.md`). A brand that
   looks improvised loses at exactly that step; a brand that looks *deliberately underground*
   survives it. This is a design constraint, not a marketing one.

### What is actually true (the claimable inventory)

| Fact | Source | Brand use |
|---|---|---|
| Free, MIT-licensed, no ads, no in-app purchase, no analytics SDK in the app | `LICENSE`, `android/app/build.gradle.kts` dependency list | A reason to install and to trust |
| ~2 MB APK, Android 8.0+, no email required | `README.md` | "Nothing to lose by trying" |
| Server-authoritative timers/teams/tags; tag needs confirmation; 90 s auto-dispute | `README.md`, `docs/ARCHITECTURE.md` | The fairness pillar |
| Real-world hide-and-seek; Hunters see live positions, optional trails, zone | `README.md` | What it *is* |
| English + Arabic with full RTL; dark theme default; adjustable text size | `README.md`, `Localization.kt`, `Theme.kt` | Two-market asset, not a translation afterthought |
| Self-hostable: one Node process + SQLite | `README.md` | The "you own it" proof point |
| Hosted server is a **plain-HTTP test server**, no account recovery, "a game, not a safety service" | `README.md` §Status, install page | Guardrails — never drift from these |

### What we are up against

The category is no longer empty, and that changes the strategy. Publicly listed apps doing
"real-world hide-and-seek with a live map" now include:

- **Manhunt: Hide & Seek** (Integrated Reality Labs; Google Play and App Store) — custom zones,
  satellite view, location tracking; the same *name* in the same category
  ([Play listing](https://play.google.com/store/apps/details?id=com.munimtechnologies.manhuntandroid&hl=en_US),
  [developer page](https://apps.apple.com/no/developer/integrated-reality-labs-inc/id1681178469)).
- **Manhunt IRL: Real-Life GPS Tag** (iOS) — "outdoor hide & seek w/ friends", fuzzy GPS pings
  ([Apptopia](https://apptopia.com/ios/app/6817872685/about)).
- **SCRAM: Hide and Seek** — "Runners hide, hunters chase, and **pings give you away**"
  ([Apptopia](https://apptopia.com/google-play/app/com.scram.app/about)). Note: the
  "your phone betrays you" insight is already taken as a tagline.
- **SLAP** — real-life tag/manhunt/hide-and-seek, "Live map tracking", "Play IRL. Create. Go viral."
  ([PixelPicked](https://pixelpicked.com/game/2STsLL80xSX/slap)).
- **GotchApp** — location-based tag/hide-and-seek ([Appstor.io](https://gotchapp-keep-moving.appstor.io/fr)).

Two consequences:

- **"Real-world hide-and-seek with a live map" is table stakes, not a position.** Leading with the
  mechanic describes the category, not why ManHunt.
- **ManHunt's defensible difference is that it is the open, free, referee-kept one.** Competitors
  are closed, store-distributed products with account sign-ups and their own monetisation. ManHunt
  is MIT source, no email, ~2 MB, and self-hostable — the game you *own* and the game whose rules
  nobody can bend.

Also flagged for the owner, not decided here:

- **Name risk.** `MANHUNT` is a registered US trademark owned by Take-Two Interactive Software in
  the video-game class ([Trademarkia](https://www.trademarkia.com/manhunt-76523018),
  [huski.ai](https://huski.ai/trademark/details/76523018/manhunt?country=US)), and a same-category
  app already ships under "Manhunt: Hide & Seek". Also, "manhunt" is ordinary playground vocabulary
  in the US/UK, which weakens distinctiveness in our favour but worsens confusion in the store
  listings. This is a screening signal, **not legal advice** — a real clearance search by an
  attorney is a five-minute check an owner can do before spending on identity.
- **"Hunt or be hunted"** (currently named as the voice reference in `docs/BRAND_BRIEF.md` §2) is
  itself a registered mark elsewhere in apparel/training goods
  ([furm.com](https://furm.com/trademarks/hunt-or-be-hunted-75195878)). Do not build on it.

---

## 2. The three directions

Each direction is a different answer to *what kind of thing is ManHunt*, not a different skin.
They are ordered by how much strategic risk they carry for this owner.

### Direction 1 — **PICKUP** *(category frame: the sport)*

**Idea.** ManHunt is not an app you try; it is a sport you *start*. The pitch is borrowed — a park,
a campus, six streets and a stairwell — and it costs nothing because everyone already owns the
gear: a phone in each pocket and a place to play. What makes it a sport rather than a game of tag
is the thing the product already does: rules the players cannot bend.

**Positioning (one sentence).** For groups with phones and a neighbourhood, ManHunt is the free
pickup field sport where two teams hunt and hide across real ground and a server keeps the clock
and the rules.

**Category we claim.** Pickup field sport — the free, no-gear end of laser tag/paintball, not the
app-store end of "hide and seek".

**Personality.** The organiser of the group. Even-keeled, quick, fair, a bit street-smart. Reads
the room, sets the rules, gets everyone moving, never over-promises. *Is:* warm, plain-spoken,
confident, dry. *Is not:* macho, tactical-military, hyperactive, ironic for its own sake,
kids' birthday-party.

**Verbal cues.** Sport vocabulary used casually: *teams, the clock, the field, a round, call it,
heads-up, back in*. Three-beat percussion, no filler. Word bank: *pickup, pitch, street, block,
field, teams, clock, round, free, real ground, no gear, no fee.*
Sample lines: "Two teams. One block. One clock." / "No gear. No fee. Just players." /
"Call it in the group chat. Start at 8."

**Visual cues.** Chalk, asphalt, kit colour, stadium clock. Flat fills only — no gradients, no
glow. Field markings borrowed as geometry (touchline corners, the centre circle, the tally).
Two team colours (Prey coral `#FF7A59`, Hunters violet `#A79BFF`) against an official cyan
(`#22D3EE`) that belongs to the *field and the referee*, never to a team — which is exactly the
semantic the dark theme already encodes in `Theme.kt`. Type temperament: condensed athletic
grotesque (DIN-tradition) for display, plain sans for body, tabular numerals for the clock.

**Icon metaphors to explore** (for identity-designer; 48 dp, 66 dp safe zone, monochrome-safe):
a touchline corner (two 90° lines meeting a dot); the zone circle broken by a chase path; a
chalk-drawn pursuit line turning a block; two opposing kit wedges meeting mid-frame; the moment
of a tag — a ring touching a solid dot. **Avoid:** crosshair-only (today's launcher is a target),
map pins, a letter M, and any stadium/whistle cliché that reads as a sports app rather than a chase.

**Risks.**
- *Over-promise.* "Sport" can imply leagues, standings and events that do not exist. **Mitigation:**
  the word "pickup" is load-bearing everywhere; never use "league", "season", "rankings".
- *Club-like coldness.* Sports branding can exclude casual groups and read young-male. **Mitigation:**
  keep the register warm, the copy plain, and the group (not the athlete) as the hero.
- *Surface risk.* A sport brand must be consistent across the install page, the icon and the
  video. If only the app icon ships, it will look like a costume. **Mitigation:** the three
  highest-traffic surfaces are in the handoff table (§8) with exact strings.
- *Sports aesthetics are crowded.* If it lands as "generic esports", it fails. **Mitigation:** spend
  the boldness on one device — chalk-line geometry on dark asphalt — and keep everything else quiet.

**When this wins.** When the owner wants the game to become a thing groups *organise*, and is
willing to make the install page and one video carry the same idea as the icon.

---

### Direction 2 — **LIVE SIGNAL** *(product frame: the map is the game)*

**Idea.** The whole game lives in one gap: where you are, versus what the map says. A phone reports
its position every interval; a cyan ring closes; a trail draws; a clock runs. The brand is that
instrument panel — civilian telemetry, not military. Closest to what the product literally *is*,
and the cheapest to execute consistently.

**Positioning (one sentence).** ManHunt is a live map you can lose on: your position reports
themselves, the zone closes, and the only way to win is to stay off the dots.

**Category we claim.** The live-map game — closer to a flight-tracker or a weather radar than to a
board game.

**Personality.** Precise, electric, cool-headed, mildly clinical — the calm voice reading out
ranges. *Is:* exact, quiet, present-tense, data-flavoured. *Is not:* surveillance-creepy, robotic,
cold for its own sake.

**Verbal cues.** Clipped present tense, counts and intervals: "Signal live." "Report in." "42:17
left." Numbers spelled as numerals. Micro-labels in mono.

**Visual cues.** Concentric ranges, scan sweeps, coordinate ticks, hairline vectors, a dot-grid
ground — the blue-black of the Open Zone field art (`docs/brand/readme-hero.gif`) turned into a
system. One hot accent only.

**Icon metaphors to explore.** A ring with a deliberate gap (the hidden player); a widening ping
anchored at a dot; a vector pinned at both ends; a path that turns a corner out of frame.

**Risks.**
- *Reads as surveillance.* For a product that broadcasts location, that is the worst possible
  association, and it collides head-on with the honest "this is a game, not a safety service"
  guardrail. Hard to mitigate.
- *Crowded aesthetic.* Teal-on-black HUD is the default look of every security and drone brand;
  it also matches "AI purple/cyan gradient" fatigue the brief explicitly warns about.
- *Cold for newcomers.* It explains the system, not the evening. The group — the growth unit —
  disappears from the brand.
- *It is an evolution, not a new identity.* The current icon (cyan ring + coral cross + dot) and
  the current dark map already look like this, so the owner's "new logo, slogan, icon" ask would
  produce something that looks like the old thing.

**When this wins.** If the owner wants the lowest-risk, lowest-cost identity and treats the logo as
a refinement; or if the game later becomes a spectator/trackable product.

---

### Direction 3 — **THE CHASE** *(emotion frame: a timed thriller)*

**Idea.** Not a game — a film in your head. A head start, a map that wakes up, a distance that only
ever gets smaller, and one physical tag that ends it. Brand as film poster: tension, not data.

**Positioning (one sentence).** ManHunt is one server-timed hunt of closing distance, played in the real
world, with a clock that does not care how you feel.

**Category we claim.** The real-world suspense experience — the free, outdoor cousin of the escape
room.

**Personality.** Cinematic, taut, confident, a little dangerous-but-safe. *Is:* dramatic, sparse,
confident. *Is not:* horror, true-crime, menacing.

**Verbal cues.** Short cinematic lines: "Somebody is already moving." "Hide like it counts."

**Visual cues.** Duotone, grain, condensed display type, dramatic numerals, deep negative space,
long shadows. Coral as danger, navy as night.

**Icon metaphors to explore.** Two silhouettes in tension; the gap between two marks; an eye-line;
the instant of contact.

**Risks.**
- *Safety and tone.* Thriller framing of people hunting people walks straight into the guardrails
  ("no safety promises", "never glorify real harm"). A brand that feels like true crime hurts a
  product that already has location-privacy caveats.
- *Production cost.* This direction lives or dies on photography/film craft. The owner has no
  photography budget, and `docs/BRAND_BRIEF.md` forbids photos in the icon background; the identity
  would collapse to "dark screen, thin type" without the imagery.
- *Silhouette icons fail at 48 dp.* The brief's own legibility constraint fights this direction.
- *Hardest to sustain.* Works for a 15-second video; hard on an install page and in a settings menu.

**When this wins.** If the owner later produces live-action or cinematic content and wants the
product to be a suspense entertainment brand. Not now.

---

## 3. Convergent comparison

Scored 1–5 against what this owner actually needs. Weights reflect the stated goal
(players → downloads → visits) and the shipped reality.

| Criterion (weight) | PICKUP | LIVE SIGNAL | THE CHASE |
|---|:--:|:--:|:--:|
| Gives a group a reason to install *together* (×3) | 5 | 2 | 3 |
| Survives the sideload path with dignity (×3) | 4 | 4 | 3 |
| Ownable vs. the competitor set above (×3) | 4 | 2 | 3 |
| Executable with no photography/budget, vector-only (×2) | 4 | 5 | 1 |
| Works at 48 dp, monochrome and in dark UI (×2) | 4 | 5 | 2 |
| Honest under the safety/legal guardrails (×2) | 4 | 3 | 2 |
| Room to grow with modes/features (×1) | 4 | 4 | 4 |
| **Weighted total** | **54** | **40** | **33** |

---

## 4. Recommendation — **PICKUP**

**Recommended direction: PICKUP. Primary slogan: "No gear. No fee. Just players."**

Why, in one paragraph: the growth unit is a group, and only the sport frame gives a group a reason
to install *at the same time*; the category is already crowded with "live map hide-and-seek", so the
position has to be about *what kind of thing this is*, not what it renders; the product's most
distinctive property — impartial, server-kept rules — is a sporting property and nobody in the
category claims it; and the direction is executable in pure vector with the palette the app already
ships. It also fixes the trust problem in the install path without lying: a pickup sport that costs
nothing is not suspicious in the way an unknown app is.

**What we are explicitly not claiming** (guardrail compliance): that it is safe, that it replaces a
safety service, that it is a league, that it is on Google Play, that it works everywhere, that the
hosted server is reliable or private. See `tone-of-voice.md` §5.

---

## 5. The platform (applies to the recommended direction)

### 5.1 Brand idea

> **The pitch is borrowed. The rules are not.**

The world already has the field (your streets, your park, your campus) and everyone already has the
gear (their phones). The only thing ManHunt adds is a set of rules that hold — kept by a server, not
by whoever shouts loudest. This is the one sentence that makes all three pillars fall out.

### 5.2 Positioning statement

**Full.** For groups of friends, classmates and neighbours who already have phones and a place to
play, ManHunt is the free pickup field sport where two teams hunt and hide across real ground and a
server keeps the clock and the rules — because a real chase should cost nothing but an evening, and
should never come down to whoever argues hardest.

**Short (for bios, decks, the install page footer).** The free pickup sport where the map is the
field and the rules don't argue.

### 5.3 The three pillars

1. **The field is borrowed, not built.** The game happens on real ground — streets, parks, campuses,
   car parks — after dark, with real weather and real neighbours. The brand always looks like it was
   *found* somewhere, not rendered. Consequence: respect the ground (no trespassing, no "rule the
   streets", no "anywhere is yours"); the field is shared.
2. **Fair by construction.** The server owns the clock, the teams and the tag. A tag needs the Prey's
   confirmation, a dispute needs the Huntmaster, and no phone can fake any of it. This is why the
   brand can talk about *rules* without being a rulebook. Consequence: never promise "no cheating
   ever"; say what is true — the parts the server owns are not negotiable.
3. **Everyone already owns the gear.** Free, MIT, ~2 MB, no email, no ads, no purchase, and if you
   want, your own server. The only barrier is your friends' calendars. Consequence: be generous and
   plain about cost and privacy; no dark patterns, no "invite 3 friends to unlock".

### 5.4 Promise and reasons to believe

- **Brand promise:** a real chase, on real ground, with rules nobody can bend — tonight, for free.
- **Reasons to believe:** server-authoritative tags and clock; live map with zone and optional
  trails; a tag must be confirmed by the person tagged; English + Arabic; ~2 MB; MIT source;
  self-hostable; no account email required.

### 5.5 Personality

Five dials, read left (what to avoid) to right (what to push):

| Dial | Avoid ← | → Push |
|---|---|---|
| Energy | chill streaming session | **eight o'clock, everyone's out** |
| Warmth | clinical | **the friend who organises it** |
| Competitive edge | casual shrug | **"we're not losing to them again"** |
| Danger | safe family fun | **a little too dark to be comfortable** (never threatening) |
| Cleverness | dry brand sarcasm | **plain sentences that land** |

**Brand is / is not.** Is: plain-spoken, even-keeled, quick, fair, warm, slightly nocturnal.
Is not: tactical, military, horror, macho, ironic, infantilising, aspirational-athlete.

### 5.6 Brand architecture

```
ManHunt                                    master brand (name flagged in §10, decision D1)
├── descriptor (functional)   real-world hide-and-seek
├── descriptor (brand)        pickup sport                 ← category we claim
├── slogan (primary)          No gear. No fee. Just players.
├── roles                     Prey / Hunters               product truth, keep
│   └── plain-language pair   hiders / chasers             for social + invite copy only
├── modes                     Classic hunt · Single Prey · Shrinking Zone
│   └── pattern for growth    ManHunt: <Mode>
└── format marks (owned by identity, not here)
```

**Roles rule.** The product says Prey/Hunters and the Arabic UI says الفرائس/الصيادون — do not rename
product strings. In *brand copy*, use Prey/Hunters when talking about the game's rules, and the
plain pair "hiders/chasers" when talking about people you are inviting. Never mix the two pairs in
one sentence, and never describe people as animals. Detail in `tone-of-voice.md` §3.

**Mode line vs. brand slogan.** `GameModes.classic.tagline` currently *is* the brand slogan. Once a
slogan ships, the mode should carry its own line (recommended: "Two teams. One block. One
clock.") so the slogan keeps meaning "the game itself" and the mode line describes a format.

### 5.7 Territory boundaries (what ManHunt is not)

Not a safety/guardian app · not a "find your friends" utility · not a fitness tracker · not an
esports league · not tactical/military cosplay · not horror or true-crime · not a kids' party
product (family-safe language, but the register is 16+) · not a store listing until it is one.

---

## 6. Campaign platform (for the social short and the install page)

**Campaign idea: "TONIGHT'S HUNT".** Every asset is framed the way a real pickup game gets
announced — a place, a time, two teams — never as a product launch. It gives the brand urgency
without faking it (the urgency is literal: you *can* play tonight) and it makes shareability the
point: the format is an invitation, not an ad.

**Asset rules.** One idea per asset; chalk-line geometry as the only decoration; the clock is the
brand's recurring visual; end cards state the free install path honestly; no fake users, no fake
scores, no real people without consent, and if OpenStreetMap tiles appear, carry
"© OpenStreetMap contributors" (ODbL — see `README.md`).

### 6.1 15-second vertical short — beat sheet (copy + narrative; production owned by the motion agent)

Silent-first: every beat must read with sound off and captions on.

| Time | Picture (abstract, vector, chalk-on-asphalt) | Caption | Audio |
|---|---|---|---|
| 0.0–1.5 s | Black. A chalk line sweeps left→right across the frame, leaving a lit edge. | `your street has rules now` | one chalk scratch |
| 1.5–4.0 s | Cyan zone ring draws over a dot-grid block map; a coral dot and a violet dot appear at opposite corners. | `two teams` | low pulse |
| 4.0–7.0 s | A clock numeral locks into the corner and counts down from the host's duration (default `60:00`); the violet pair starts converging; the coral trail draws behind the dot. | `one clock` | clock ticks |
| 7.0–10.0 s | The coral dot pings — a ring expands out of it to the edge of frame. Hard cut to black, one frame. | `the map already knows` | single ping |
| 10.0–12.0 s | Violet ring snaps onto the coral dot. The whole frame inverts to coral for two frames. | `tagged` | snap |
| 12.0–15.0 s | End card on navy: slogan, then MANHUNT, then the install line. Chalk rule above/below. | `No gear. No fee. Just players.` / `ManHunt · free APK · Android 8+ · not on Play Store` | silence |

Cutdowns: 6 s loop (beats 2, 4, 5, end card), and a 3 s bumper (chalk sweep → slogan).

**Copy for the end card, in order of preference:**
1. `No gear. No fee. Just players.` — primary slogan
2. `Rules you can't argue with.` — alternate, if the short is the "fairness" cut
3. `A sport you can start tonight.` — alternate, if the short is a CTA cut

**Do not** put a fake player count, fake testimonial, fake scoreboard, real faces without consent,
or the word "survive" on any card.

### 6.2 Install page hero lockup (recommended copy, not applied)

The page title is currently the slogan, so a new slogan needs a descriptor directly under it:

```
MANHUNT                                    ← eyebrow (unchanged)
Rules you can't argue with.                ← h1, primary or alternate slogan
Real-world hide-and-seek. Two teams, a live map and a clock the players can't
bend. Free, 2 MB, Android 8+.              ← one-line descriptor directly under the h1
```

`<title>ManHunt — the free pickup sport for Android</title>`
`<meta name="description" content="Real-world hide-and-seek for Android: Prey hide, Hunters track
them on a live map and tag them in person. Server-kept rules. Free APK, 2 MB.">`

---

## 7. What good looks like in six months

The direction is working when:

- new players arrive **in groups** (rooms created per new account trends more to ~1) rather than as
  isolates, and install-page visits convert to accounts;
- people forward a *screenshot of the end card or the map*, not just a link;
- the phrase players use to describe it is "like laser tag but free / in your own streets", not
  "a tracking app";
- the owner can produce any new surface (a poster, a sticker, a store listing) from
  `visual-direction.md` without asking for a new design pass.

---

## 8. Handoff table — the seven strings and surfaces that carry PICKUP

Recommendations only. App/server code edits belong to the integration pass after owner approval.

| Surface | Current | Recommended |
|---|---|---|
| App tagline (Home subtitle, Auth subtitle, Roles footer) | `Hide. Hunt. Survive.` | `No gear. No fee. Just players.` |
| `GameModes.classic.tagline` | `Hide. Hunt. Survive.` | `Two teams. One block. One clock.` |
| `Localization.kt` key `"Hide. Hunt. Survive."` | `اختبئ. اصطد. انجُ.` | `لا عتاد. لا رسوم. لاعبون فقط.` (see `slogans.md` §5) |
| Install page `<title>` | `ManHunt — hide, hunt, survive` | `ManHunt — the free pickup sport for Android` |
| Install page `<h1>` | `Hide. Hunt. Survive.` | `No gear. No fee. Just players.` |
| README first line | `Real-world hide-and-seek for Android.` | keep the factual line; add `The free pickup sport.` as a lead-in |
| Social bio / video end card | — | `No gear. No fee. Just players.` + honest install line |

Icon, wordmark and lockup: `design/brand/identity/` (identity-designer). This file supplies the
icon *metaphor* brief in §2, the palette logic in §5 and the system in `visual-direction.md`.

---

## 9. Not doing (and why)

- **Renaming the product** — owner's call, and it is the highest-stakes decision here (§10, D1). The
  strategy works either way; a rename would repoint the slogan and icon work, so it must be decided
  before identity production starts.
- **"Play outside" / "get off your phone to use your phone" / "the ultimate real-life game"** —
  banned by the brief and by reality; they are the generic platitudes of this category.
- **A mascot or character** — expensive to sustain, and it adds nothing to a game whose subject is
  the players' own place. A chalk line is cheaper and more ownable.
- **The "your phone betrays you" insight as the core position** — SCRAM already ships it
  ("pings give you away"). It is a good *scene*, not a good *position*; keep it inside the video
  (§6.1, beat 4), not on the roof.
- **League/season/ranking promises** — no such features exist; the brand would be lying.
- **Photography of players or places** — consent, licensing and tone risk; vector and type carry the
  identity instead. Also keeps every asset reproducible at 2 MB and in git.
- **A second brand for the Arabic market** — one identity, adapted copy. A parallel Arabic identity
  would double the maintenance and fragment recognition.

## 10. Hidden assumptions, kill conditions and owner decisions

### Assumptions to validate (with a cheap test for each)

- [ ] *Groups actually form.* Install-page visits vs. new accounts vs. rooms created, from server
      logs, over four weeks. If installs convert but rooms do not, the bottleneck is group
      formation, not the brand — and the next investment is invite/share tooling, not a redesign.
- [ ] *Sport language does not scare off casual players.* Run two install-page headlines for two
      weeks (`No gear. No fee. Just players.` vs `A sport you can start tonight.` — both honest) and
      compare APK downloads per visit.
- [ ] *The slogan reads as sport, not as a gym or an insurer.* Five-second test with 10 people who
      have not seen the product: can they say what kind of thing it is?
- [ ] *The chalk/sport visual survives a 48 dp launcher.* Silhouette + monochrome test before any
      icon is declared done.

**Kill conditions.** If, after four weeks of consistent use, testers describe ManHunt as "a tracking
app" or "like Find My", the direction has failed — stop, do not add more assets. If the icon cannot
hold the chase idea at 48 dp, fall back to LIVE SIGNAL's ring-with-a-gap (the strongest single
metaphor produced in this pass) rather than a literal sport badge.

### Owner decisions needed (blocking, in priority order)

| # | Decision | Recommendation | Blocks |
|---|---|---|---|
| D1 | Keep the name `ManHunt` despite the Take-Two mark and a same-category app of the same name? | Keep for now (free hobby project, low commercial exposure), record it in the licence/ownership statement, and take a real clearance check before any paid promotion | identity, store listing, all copy |
| D2 | Approve PICKUP as the direction | Approve | icon, video, install page |
| D3 | Approve replacing `Hide. Hunt. Survive.` with `No gear. No fee. Just players.` and a 6-string update pass | Replace; keep the three-beat cadence so the change reads as a tune-up, not a relaunch | app strings, install page, README |
| D4 | Arabic register: MSA in-app, Egyptian colloquial in social? | Yes — MSA for product UI (matches existing strings), Egyptian for social/invite copy | `Localization.kt`, social |
| D5 | Does "not on Play Store" appear as brand fact? | Yes, one honest footer line — never in the headline | install page, video end card |
| D6 | Free-forever framing? | Say "free" (true today) — never "free forever" | all copy |

### Sources

- Repository: `README.md`, `docs/BRAND_BRIEF.md`, `docs/UI_REVIEW.md`,
  `android/app/src/main/java/com/manhunt/app/ui/theme/Theme.kt`,
  `android/app/src/main/java/com/manhunt/app/data/GameModes.kt`,
  `android/app/src/main/java/com/manhunt/app/i18n/Localization.kt`, `server/src/app.ts`,
  `docs/screenshots/*.png`.
- Competitor / trademark screening (external, untrusted, cite only):
  [Manhunt: Hide & Seek — Google Play](https://play.google.com/store/apps/details?id=com.munimtechnologies.manhuntandroid&hl=en_US) ·
  [Integrated Reality Labs](https://apps.apple.com/no/developer/integrated-reality-labs-inc/id1681178469) ·
  [Manhunt IRL](https://apptopia.com/ios/app/6817872685/about) ·
  [SCRAM](https://apptopia.com/google-play/app/com.scram.app/about) ·
  [SLAP](https://pixelpicked.com/game/2STsLL80xSX/slap) ·
  [GotchApp](https://gotchapp-keep-moving.appstor.io/fr) ·
  [MANHUNT (Take-Two), Trademarkia](https://www.trademarkia.com/manhunt-76523018) ·
  [HUNT OR BE HUNTED](https://furm.com/trademarks/hunt-or-be-hunted-75195878)
- Palette contrast ratios computed for this document (WCAG 2.1 relative luminance) — table in
  `visual-direction.md` §1.
