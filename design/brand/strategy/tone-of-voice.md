# ManHunt — tone of voice and guardrails

**Status:** proposal. Applies to anything written after the brand decision: install page, README,
social, video cards, onboarding, in-app copy, release notes, chat system messages, error text.

Pairs with `brand-platform.md` (direction **PICKUP**) and `slogans.md` (slogan system). The
existing app strings are **not** rewritten by this document — these are the rules for new copy and
for the owner-approved replacement pass.

---

## 1. The voice in one line

**ManHunt sounds like the friend who organises the game: plain sentences, short beats, warm, even,
and never hypes something that isn't true.**

Three rules underneath that:

1. **Say what happens.** Name the thing, the place, the cost, the next action. No atmosphere in
   place of information.
2. **Keep the stakes honest.** The game is exciting because of a clock and a chase, not because
   anything is dangerous. Never borrow danger for flavour.
3. **Be the same on the install page and in the error toast.** A brand that is punchy in ads and
   stilted in the app reads as two products.

### Register

- **Person:** second person for the player ("you"), first person plural for the project ("we") only
  in changelogs and READMEs, never in the app UI.
- **Formality:** spoken-confident. Not corporate, not memey. Think a good games-rule explanation.
- **Rhythm:** short sentences. Three-beat lists are the brand shape ("Two teams. One block. One
  clock."). One idea per sentence.
- **Casing:** ManHunt is one word, camel case, never `MANHUNT` in running text (display type only).
  `Prey` and `Hunters` are capitalised when they name the two sides in the rules; lowercase "hunt"
  when it means the match.
- **Punctuation:** full stops, commas, no exclamation marks, no ellipses, no emoji in product copy.
  One em dash per paragraph, max. No ALL CAPS except a true label.
- **Numbers:** numerals, not words — "6-character code", "42:17 left", "3 players". Never a number
  the server does not enforce.

---

## 2. Do / don't

### Product copy

| Do | Don't |
|---|---|
| "Your phone reports your position to the Hunters in your room while the hunt is running." | "Stay invisible." / "Your location is private." |
| "Tag by touching the player, then wait for them to confirm." | "Instantly capture your prey!" |
| "You're in. The huntmaster starts the head start." | "Welcome to the hunt, survivors!" |
| "That room code didn't match a hunt. Check the six characters." | "Error: invalid input." |
| "No hunts yet. Create one and invite your group." | "Nothing here yet." |
| "Pause the hunt? The clock stops for everyone until you resume." | "Are you sure you want to pause?" |
| "Free APK, 2 MB. Android 8.0 and newer." | "Download now — limited time!" |
| "This is a game, not a safety service. Play with people you trust." | "Keep your friends safe." |

### Marketing copy

| Do | Don't |
|---|---|
| "Two teams. One block. One clock." | "The city is your playground." |
| "No gear. No fee. Just players." | "100% free forever!" |
| "Play in places you're allowed to be. Ask before you cross private ground." | "Nowhere is off-limits." |
| "Free APK. Android may warn you about apps from outside the Play Store — that warning is expected; the release is built and signed by the project." | "Totally safe, no warnings." |
| "The server keeps the clock, the teams and the tags. Nobody can fake a tag." | "100% fair and hack-proof." |
| "Play tonight: pick a place, split into teams, start a hunt." | "The ultimate real-life experience." |

### Social copy

| Do | Don't |
|---|---|
| "Hide. Your phone reports. That's the game." | "Your phone is hunting you." |
| "The map knows where you are. They don't — yet." | "Someone has your coordinates." (reads as stalking) |
| "Tagged. That's the round." | "You've been eliminated. Survive or die." |
| "Free, no store, no account email. Requires Android 8+." | "Link in bio — grab it before it's gone." |

### Tone moves to keep (and the failure mode of each)

| Move | Example | Failure mode to avoid |
|---|---|---|
| Flat statement of fact | "The clock is the only thing you both have to agree on." | Trying to be profound |
| Physical, concrete verbs | "tag", "hide", "run", "split", "start" | Abstraction: "engage with the experience" |
| Dry understatement | "Not bad for two phones and a park." | Sarcasm at the player's expense |
| An address, not a slogan | "Pick a place. Split into teams. Start at 8." | Fake urgency or fake scarcity |
| Honest limitation | "Hosted server is a test server. Play test games." | Hedging everything into mush |

---

## 3. Arabic adaptation notes

English is the source; Arabic is an adaptation. The app ships **MSA** today (`Localization.kt`) and
MSA stays the in-app default. **Egyptian colloquial is for social and invite copy only** — never mix
both registers in one screen or one asset.

### Terminology (keep these consistent)

| English | Arabic (in-app / MSA) | Note |
|---|---|---|
| ManHunt | ManHunt (Latin) or مانهنت at most one occurrence | Never decline or annex it with affixes; keep it isolated in RTL |
| hunt (match) | مطاردة | the word the app already uses |
| room | غرفة | |
| Prey | الفريسة / الفرائس | established in the app; do not rename UI strings |
| Hunters | الصيادون | established. **In external copy prefer المطاردون (the chasers) when describing people** — صيد can read as hunting animals and, in a group invite, can sound predatory |
| tag (verb) | وسم / يوسم | already used in `Localization.kt`; keep it |
| head start | مهلة | |
| lobby | غرفة الانتظار | |
| ready | مستعد | |
| score / result | النتيجة | |

### Mechanics that break when translated literally

- **Do not translate the slogan word-for-word.** Use the approved renderings in `slogans.md` §4.
- **Do not transliterate the slogan.** There is no useful transliteration of a value proposition.
- Arabic is verb-first and often shorter than the English: re-measure every string at 360 dp and at
  1.5× text scale. If a line will not fit, cut a beat rather than shrink type.
- **Idioms die in literal translation.** "Rules you can't argue with" becomes `قواعد لا جدال فيها`
  ("rules in which there is no argument") — that is the idiom; the literal `قواعد لا يمكنك الجدال معها`
  is clumsy and long.
- **Gender.** Address players with neutral or masculine-plural forms as the app already does, and
  avoid constructions that clearly address only men or only women in group copy.
- **Punctuation & bidi.** The `·` separator can flip sides in RTL — prefer a full stop or a line
  break. Keep Western digits (`60:00`), never mirror a timer, and keep Latin words (ManHunt, Android,
  APK) isolated so a bidi algorithm cannot reorder them into the sentence.
- **Diacritics.** The app currently writes `انجُ` in the old slogan; for new copy use undiacritised
  forms (except where a diacritic prevents ambiguity). Do not add decorative diacritics.
- **Do not use religious or national idioms** to add warmth — it narrows the audience and ages fast.

### Arabic copy quality bar

An Arabic string is done when a native speaker reads it without noticing it was translated. If a
reviewer's first reaction is "that is English in Arabic clothes", rewrite it from the meaning, not
from the sentence.

---

## 4. Safety, legal and honesty guardrails (non-negotiable)

### Never claim or imply

1. **Safety, rescue, protection or guardianship.** ManHunt is a game. The app reports positions to
   other players; it cannot help in an emergency. Approved phrasing: *"This is a game, not a safety
   service. Play with people you trust."*
2. **Trespassing, private property or restricted-space play.** Nothing like "nowhere is off-limits",
   "the city is yours", rooftops, car parks after hours, or squeezing past a fence. Approved
   phrasing: *"Play in places you're allowed to be in."*
3. **Privacy or encryption we do not have.** The hosted deployment is plain HTTP; the app shares
   precise location with Hunters in the room by design. Never say "encrypted", "private by default",
   "anonymous", or "we never see your location".
4. **Fairness beyond what the server enforces.** The server owns timers, teams and tag outcomes —
   say that. Do not say "hack-proof", "100% fair", or "nobody can cheat".
5. **Fake urgency, scarcity, social proof or numbers.** No countdown timers that reset, no "2,000
   players", no invented testimonials, no review stars, no fake countdowns, no "limited".
6. **Store presence.** It is not on Google Play. Never imply it is, and never hide the sideload step.
7. **Cost promises forever.** "Free" is true today (verified: no ads, no billing SDK in the app, MIT
   licence). "Free forever", "no catch" and "unlimited" are not ours to promise.
8. **Compliance badges.** No "GDPR compliant", "Play Protect approved", "verified by Google".
9. **Medical/health advice.** No claims about fitness benefits or injury risk reduction.
10. **Third-party ownership.** No implying the project is affiliated with Take-Two, Rockstar,
    Google, OpenStreetMap, or any other brand. Map data must carry
    "© OpenStreetMap contributors" wherever tiles appear.

### Always include, somewhere in the same asset

- the honest install path (free APK, Android 8.0+, not on Play Store) on any asset with a CTA;
- "Play with people you trust" on first-contact surfaces (install page, video end card) — it is both
  honest and the product's own README position;
- the served-server caveat where a URL is given: the hosted server is a **test deployment on plain
  HTTP**, no availability guarantee, no account recovery.

### Legal notes for copywriters

- **Assets:** original vectors only; no third-party logos, characters or stock art; no real people
  without written consent; fonts must be OFL/Apache or system-bundled before anything ships.
- **Map:** OSM attribution is required by the ODbL wherever tiles are shown (install page, video,
  screenshots, posters).
- **Trademark:** do not use ™ or ® anywhere unless the owner has filed. Do not build on
  "Hunt or be hunted" (registered elsewhere) and do not assume the name `ManHunt` is clear
  (`brand-platform.md` §1, §10 D1).
- **Licence:** the repo is MIT; any asset published with the brand should be declared original work
  for ManHunt (see `design/brand/identity/LICENSE-assets.md`, identity-designer's file).
- **No posting.** Copy on this team is written to files; only the owner publishes.

### Approved claims ledger (say it only if it is on the left)

| ✅ May say | ❌ May not say | Evidence |
|---|---|---|
| Free, no ads, no in-app purchases | "Free forever", "no monetisation ever" | `android/app/build.gradle.kts` deps; `LICENSE` |
| ~2 MB, Android 8.0+ | "Runs on any phone" | `README.md` |
| No email address required | "Anonymous" | `README.md` |
| Server-authoritative clock/teams/tags; tags need confirmation | "Hack-proof" | `README.md`, `docs/ARCHITECTURE.md` |
| Live map, zone, optional trails — Hunters only | "Anyone can watch" | `README.md` |
| English + Arabic, full RTL | "Fully localised" (modes/strings are partial) | `Localization.kt`, screenshots |
| Self-hostable: one Node process + SQLite | "Enterprise-ready", "production-grade" | `README.md`, `docs/DEPLOYMENT.md` |
| Not on Google Play; signed release APKs with SHA-256 | "Play Store app", "Play Protect approved" | `README.md`, release workflow |
| Hosted server is a plain-HTTP test deployment | "Secure", "private server" | `README.md` §Status |

---

## 5. Writing patterns for UI copy (new strings only)

- **Buttons name the action and the object:** "Create hunt", "Join a hunt", "Download the APK",
  "Resume the hunt". Never "Submit", "Go", "OK".
- **An action keeps its name through the flow:** the button says "Begin the hunt" → the confirmation
  says "The hunt has begun."
- **Errors do not apologise and are never vague.** State what happened, then the next move:
  *"The server didn't respond. Check the address and try again."*
- **Empty states invite the next action:** *"No hunts yet. Create one and invite your group."*
- **Loading states say what is loading, once:** *"Checking for updates…"*
- **Destructive actions name the consequence, not the fear:** *"End the hunt for everyone? The current
  result is final."*
- **Permission asks say why, plainly:** *"ManHunt needs your location to show Hunters where the Prey
  are during a hunt. Only Hunters in your room see it."*
- **Success states are short and factual:** *"Ready. Waiting for the huntmaster."*

---

## 6. Writer's checklist (10 seconds per string)

- [ ] Would a 15-year-old and a 45-year-old both understand it first time?
- [ ] Is there a claim in it, and is that claim in the approved ledger?
- [ ] Does it use "safe", "protect", "survive", "secure", "unlimited", "forever", "anywhere"?
      If yes, stop and rewrite.
- [ ] Is there an exclamation mark, emoji, or fake urgency? Remove it.
- [ ] Does it name a number the server does not enforce?
- [ ] Is the next action obvious?
- [ ] If it ships in Arabic, does it read as Arabic and not as translated English?
- [ ] If it shows map data, is OSM credited?
- [ ] Is the install path honest and present?
