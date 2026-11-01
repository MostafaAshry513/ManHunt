# ManHunt — slogan system

**Status:** proposal for owner approval. Nothing applied. The keep/replace decision is §1; the
recommendation is §6.

**Recommendation in one line:** replace `Hide. Hunt. Survive.` with
**`No gear. No fee. Just players.`** and keep the three-beat cadence so the change reads as a tune-up,
not a relaunch.

Read with `brand-platform.md` (recommended direction **PICKUP**), `tone-of-voice.md` (voice, Arabic,
guardrails) and `visual-direction.md` (typography for the tagline slot).

---

## 1. Keep or replace the current slogan — the call

**Replace `Hide. Hunt. Survive.` as the brand slogan. Keep its shape.**

| For keeping | For replacing |
|---|---|
| Already shipped in 6 places; zero migration cost | `Survive` promises stakes the game does not have, and drifts toward a safety/rescue implication — the exact thing the brief forbids and the README has to walk back ("ManHunt is a game, not a safety service") |
| Three-beat cadence is recognisable and matches the app's terse UI | `Hunt` on its own, seen before the player knows the rules, is the predatory half of the phrase; "Hunt or be hunted" — the voice reference in the brief — is itself a registered mark elsewhere ([furm.com](https://furm.com/trademarks/hunt-or-be-hunted-75195878)) |
| Existing players know it | Unregistrable, generic and used by other products; it describes the mechanic, not a reason to install, and cannot carry a category ("sports app? kids' game? horror game?") |
| | It is the `<h1>` of the install page, which is the highest-stakes surface — and it tells a stranger nothing about cost, gear or group |

**The owner's own brief** asks whether to keep or replace and says the icon must not repeat the words
if kept. The strategic case above is a replace. If the owner vetoes, the fallback is: keep the string
only inside the app (where it has equity) and use `No gear. No fee. Just players.` externally — but
that is two slogans, which §7 forbids, so the recommendation remains: replace everywhere, once.

**What we keep from it: three beats, full stops, no adjectives, no second person, no exclamation
mark.** The new primary is built on the same rhythm on purpose: it lets the change land as a *tune-up*
rather than a relaunch, and it keeps every layout that fits the old string working.

---

## 2. How "360 dp fit" was measured

The brief requires one line in the tagline slot of a 360 dp-wide screen.

- Usable width: **360 dp − 2 × 20 dp** screen padding (`ManHuntSpacing.screen`) = **320 dp**.
- Estimated advance: **0.50 em** average for Roboto-family mixed case with full stops. This is an
  estimate; the real test is a Compose measurement at 360 dp (`ScreenshotTest` at 360 × 800 dp).
- Therefore: **≈ 320 dp ÷ (0.50 × font-size)** characters fit. At the Home tagline size (~13 sp)
  that is ~49 characters; at ~15 sp, ~42.
- The app has **live text scaling** (Settings → Appearance). At **1.5×**, ~30 characters still fit;
  at **2×** anything over ~24 characters wraps — which is acceptable *only if it breaks at a full
  stop* into two clean lines.

**Fit verdicts used below:** `✓` fits one line at default and 1.5× scale; `✓✓` fits one line even at
2× scale; `⚠` fits at default but wraps (gracefully, at a full stop) beyond 1.5×.

---

## 3. Candidates (17 live, each screened)

Risk = trademark/generic-collision screen: **L** low, **M** medium, **H** high. "Generic" = likely
refused registration or unlikely to identify a source. Screening method in §5 — this is a screen,
not clearance.

| # | Slogan | Ch | 360 dp | Rationale | Risk |
|---|---|---|:--:|---|---|
| 1 | **No gear. No fee. Just players.** | 30 | ✓ | Kills the two objections to trying in one breath (equipment, money) and names the only real requirement: people. Category-defining vs. laser tag/paintball and vs. closed paid apps. Same rhythm as the incumbent. | **L** — descriptive combination, no single holder found; "no gear, no fee" is a low-collision formulation |
| 2 | **Rules you can't argue with.** | 27 | ✓ | The fairness pillar in six words; server-authoritative tags are the one thing competitors cannot copy cheaply. Owns "fair" without saying "referee". | **L** — odd enough to be distinctive; "can't argue with" is common conversational English, low collision |
| 3 | A sport you can start tonight. | 30 | ✓ | Gives a *motive* and a *category* at once; "tonight" is literal (no scheduling, no gear) so the urgency is honest. Best CTA-adjacent line for the install page. | **M** — "start tonight" is used by fitness/entertainment; generic enough that it cannot be protected |
| 4 | Two teams. One block. One clock. | 32 | ✓ | The mode line: sport structure in three beats. "One clock" is literally true — the server keeps it. Accurate at any host-set duration (avoid the wrong "forty minutes"). | **L** — low collision; but "block" is US/UK urban and may need "street" or "neighbourhood" in some markets |
| 5 | The neighbourhood is the pitch. | 31 | ✓ | The "borrowed field" pillar; the football register fits the Arabic-speaking audience especially well. | **L** — "neighbourhood is the pitch" no holder found; British spelling for MENA English |
| 6 | Hide from the map. | 18 | ✓✓ | The mechanic in four words; excellent teaser/thumbnail line. | **M** — could read as anti-tracking ("hide from *the* map" = privacy promise), which the product must not imply. Teaser only, never the primary |
| 7 | Hide. Your phone won't. | 23 | ✓ | Witty and true to the mechanic; strongest "curiosity" line in the set. | **M** — the territory ("your phone gives you away") is already owned as a positioning by a competitor, SCRAM: *"pings give you away"* ([Apptopia](https://apptopia.com/google-play/app/com.scram.app/about)). Also reads slightly adversarial between friends |
| 8 | Bring people, not gear. | 23 | ✓ | Social-register version of #1; good for invite copy and group-chat forwards. | **L** — no strong holder found; some use in outdoor-gear marketing |
| 9 | Somebody is already moving. | 27 | ✓ | The thriller note, kept small; good social caption, not a brand slogan — it does not say what the game is. | **L** — but implies tension/risk; keep away from the "danger" side of the guardrails |
| 10 | The chase is the sport. | 23 | ✓ | Compact category claim; works as a secondary line under the logo. | **M** — "chase" is used by many sports/entertainment brands; weak distinctiveness |
| 11 | Start a hunt tonight. | 21 | ✓✓ | The action line; safe CTA for the install page button area and video end card. | **M** — generic imperative; fine as a CTA, weak as a brand line |
| 12 | Free. Fair. And in the street. | 30 | ✓ | The whole strategy in three beats: price, integrity, place. | **L** — "free and fair" is common political language; "in the street" adds distinctiveness |
| 13 | The game your group keeps playing. | 34 | ⚠ | The retention/social promise, useful for social bios. | **M** — "keeps playing" phrasing is generic; unprotectable |
| 14 | Pickup rules. Real ground. | 26 | ✓ | Terse and ownable; assumes the sport frame is established, so it is a *second* line, not a debut. | **L** — "pickup" as a game descriptor is generic, no collision found |
| 15 | The rules don't argue back. | 27 | ✓ | The funnier, stranger sibling of #2; better for in-app copy than for a first-contact h1. | **L** — distinctive phrasing |
| 16 | Your street has rules now. | 26 | ✓ | Campaign line for the video; implies the world changed without saying the app did. | **L** — no holder found; a little ominous, keep it light with the chalk visual |
| 17 | Forty minutes of real. | 22 | ✓ | Rejected on accuracy: the hunt is host-configured (default **60 min**, range 5 min–4 h — `server/src/domain/match.ts`). Never put a wrong number in the brand. | **H** — factually wrong, not a trademark issue |

### Screened out before the table

| Rejected | Why |
|---|---|
| `Play outside.` | The brief's own example of generic; it says nothing about a chase, a group or a clock |
| `Hunt or be hunted.` | Registered elsewhere; also the predatory framing the product should not lead with |
| `Survive the night.` | Horror register; implies danger and stake the game does not have; collides with "no safety promise" |
| `Never lose your friends.` | Accidentally a safety promise; abysmal fit for a game about being hunted by your friends |
| `The ultimate real-life game.` | Superlative with nothing behind it; unprotectable |
| `Hide. Hunt. Survive.` | The incumbent — see §1 |
| Anything with "AI", "neon", "next-gen", "experience" | Category noise; also ages badly for a 2 MB sideloaded game |

---

## 4. Arabic adaptations

English is the source and authoritative; Arabic is an adaptation, not a translation. The app's Arabic
is currently **MSA** (`Localization.kt`), and MSA should stay the in-app default. Egyptian colloquial is
recommended for social/invite copy only, and never mixed with MSA inside one screen.

| English | MSA (in-app default) | Egyptian (social) | Note |
|---|---|---|---|
| No gear. No fee. Just players. | **لا عتاد. لا رسوم. لاعبون فقط.** | **من غير عتاد. من غير فلوس. لاعبين وبس.** | The three-beat rhythm survives; `لاعبون فقط` is the strongest closing beat. Shortest viable form: `لا عتاد. لا رسوم.` when space is tight |
| Rules you can't argue with. | **قواعد لا جدال فيها.** | **قواعد مفيش جدال فيها.** | Literal "cannot argue with" does not work in Arabic; the idiom is "no argument *in* them". Do not translate word-for-word |
| A sport you can start tonight. | **رياضة تبدأها الليلة.** | **لعبة تبدأها النهارده.** | `رياضة` reads as organised sport; if that over-promises, use `لعبة حقيقية تبدأها الليلة` |
| Two teams. One block. One clock. | **فريقان. حي واحد. ساعة واحدة.** | **فريقين. حي واحد. ساعة واحدة.** | "Block" → `حي` (neighbourhood) rather than a literal `مربع سكني`; keep the numeral-free beats |
| The neighbourhood is the pitch. | **الحي هو الملعب.** | **الحي هو الملعب.** | Football register translates cleanly; `الملعب` needs no adjustment |
| Start a hunt tonight. | **ابدأ مطاردة الليلة.** | **ابدأ مطاردة النهارده.** | Keep `مطاردة`, the word the app already uses for the match |
| Your street has rules now. | **لشارعك قواعد الآن.** | **لشارعك قواعد دلوقتي.** | `لشارعك قواعد` is idiomatic and keeps the ownership beat |

Notes that apply to every Arabic rendering:

- **Keep it one line.** Arabic glyphs are wider and cursive-joined; re-measure every string at 360 dp,
  and at 1.5× text scale. Prefer two beats over three if the line must stay single.
- **Numbers:** use Western digits (`60:00`), as the app already does. Keep the clock left-to-right even
  inside RTL — never mirror a timer.
- **Punctuation and bidi:** the `·` separator can jump sides; prefer a full stop or a line break. Keep
  Latin product names (`ManHunt`) isolated from surrounding Arabic.
- **Do not transliterate the slogan.** There is no useful transliteration of a value proposition.
- **Word choice guardrail:** `الصيادون` (hunters) is fine in the app, but in external Arabic copy prefer
  `المطاردون` (the chasers) when describing people — `صيد` can read as hunting game/animals and, in a
  group-invite context, can sound predatory. Details in `tone-of-voice.md` §3.

---

## 5. Trademark / generic-risk screening — method, and how far it goes

**Done here:** a quick external screen for exact-phrase collisions and obvious holders, via public
search and trademark-listing pages; plus a repo-side scan that `Hide. Hunt. Survive.` and
`Hunt or be hunted.` already have lives elsewhere. Findings are recorded per candidate in §3 and, for
the name itself, in `brand-platform.md` §1 (`MANHUNT` is a Take-Two registered mark in the video-game
class; a same-category app already uses "Manhunt: Hide & Seek").

**Not done here:** a legal clearance search. A slogan used in commerce needs, at minimum:

1. a knockout search in the relevant classes (9 software/games, 41 entertainment services, 25 apparel
   if merch is ever sold) in the owner's markets (US, EU, EG, SA at least);
2. a common-law search for the phrase in the same product category;
3. a check that the phrase is not descriptive/laudatory in the class (fully descriptive slogans are
   refused registration, though they can still be *used*).

**Practical conclusion for this brand:** none of the recommended lines needs to be registered — it only
needs not to collide. All three picks screen **L** for collision and all three are *descriptive-ish*
enough that a registration attempt would likely fail. Use them; do not claim TM status on them; do not
put ™ or ® anywhere unless the owner actually files.

**Name, not slogan:** the product name is the bigger risk and only the owner can accept it
(`brand-platform.md` §10, D1). Record whatever is decided in the written licence/ownership statement
the brand brief's handoff checklist requires.

---

## 6. The system: primary + two alternates

| Role | Line | Ch | Job | Where it goes |
|---|---|---:|---|---|
| **Primary** | **No gear. No fee. Just players.** | 30 | Category + reason to try, every time | App tagline (Home/Auth/Roles), install page `<h1>`, video end card, README lead-in, social bio |
| **Alternate A** — fairness cut | **Rules you can't argue with.** | 27 | Trust/pillar line for audiences who are sceptical of an unknown APK | Install page A/B headline, "why ManHunt" section, GitHub release notes, self-hosting docs |
| **Alternate B** — action cut | **A sport you can start tonight.** | 30 | Motive + CTA; the line that makes the click | Video CTA card, install-page subhead, share/invite copy |
| **Descriptor** (always paired with the primary on first contact, never alone) | Real-world hide-and-seek. Two teams, a live map and a clock the players can't bend. Free, 2 MB, Android 8+. | — | Explains what the primary deliberately does not | Directly under the primary on the install page; README first paragraph; video end card second line |
| **Mode line** (not the brand slogan) | Two teams. One block. One clock. | 32 | Replaces the slogan inside `GameModes.classic.tagline` once the brand slogan ships | Roles screen, mode cards |
| **Category tag** (not a slogan) | PICKUP SPORT | — | Brand descriptor for bios/footers where the category is needed | Install page footer, README badge line, social header |

**Why these three:** the primary sells the *type of thing* (a free, gear-free sport) and the
objection-killers in the same breath; alternate A is the *why trust it*; alternate B is the *why now*.
That is one line per job — no overlap, no competing claims. The three-beat shape ties them to the
incumbent.

---

## 7. Usage rules

1. **One slogan per surface.** Never put the primary and an alternate on the same screen.
2. **First contact always pairs slogan + descriptor.** The primary deliberately does not say
   "hide-and-seek"; a stranger meeting it cold must get the descriptor within one line.
3. **Never inflect it.** It is a lockup, not a sentence: do not write "no gear and no fee", do not
   embed it in a paragraph, do not translate it mid-sentence.
4. **Do not add punctuation, emoji or exclamation marks.** The full stops are the voice.
5. **Never put a number in the slogan** unless the server enforces it (see candidate 17).
6. **Do not use the slogan as a CTA button label.** Buttons say what happens ("Download the APK",
   "Create hunt"); the slogan sits above them.
7. **Do not translate word-for-word.** Use the approved Arabic adaptation (§4) or English.
8. **Retire the old string everywhere in one pass.** Mixed slogans on one screen read as a half-shipped
   update — worse than either slogan alone.

---

## 8. Migration map (recommendation only; integration belongs to the owner's pass)

| File / surface | Current | Change to |
|---|---|---|
| `android/app/src/main/java/com/manhunt/app/i18n/Localization.kt` key `Hide. Hunt. Survive.` | `اختبئ. اصطد. انجُ.` | `لا عتاد. لا رسوم. لاعبون فقط.` (and add the English key `No gear. No fee. Just players.`) |
| `ui/HomeScreen.kt` tagline | `Hide. Hunt. Survive.` | `No gear. No fee. Just players.` |
| `ui/AuthScreen.kt` subtitle | `Hide. Hunt. Survive.` | `No gear. No fee. Just players.` |
| `ui/RolesScreen.kt` footer | `ManHunt · Hide. Hunt. Survive.` | `ManHunt · No gear. No fee. Just players.` — or drop the slogan here and use `PICKUP SPORT` |
| `data/GameModes.kt` classic tagline | `Hide. Hunt. Survive.` | `Two teams. One block. One clock.` |
| `server/src/app.ts` install page `<title>` / `<h1>` | `ManHunt — hide, hunt, survive` / `Hide. Hunt. Survive.` | `ManHunt — the free pickup sport for Android` / `No gear. No fee. Just players.` |
| `README.md` first line | `Real-world hide-and-seek for Android.` | keep as the factual line; the slogan goes in the lead-in above it |

Verify after the pass: no occurrence of `Hide. Hunt. Survive.` remains outside git history
(`grep -r`), the 360 dp screenshot still fits, and the Arabic string renders on one line at 1.5× scale.

## 9. What to test before locking

- 5-second test with 10 people who have not seen the product: what is it, and what does it cost?
- Install page A/B: primary vs. alternate B over two weeks, APK downloads per visit.
- 360 dp + Arabic + 1.5× text-scale screenshots for all three lines before shipping.
- Do not test the slogan in isolation from the icon: the two are one first impression.
