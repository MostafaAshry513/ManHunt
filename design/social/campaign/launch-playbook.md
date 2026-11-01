# ManHunt — social launch playbook (14 days)

Status: **draft for owner approval**. Prepared 2026-11-01 by the growth/ads workstream.
Scope: organic social launch + community seeding + measurement. Paid options are labelled separately and
are **not executed**. No account creation, no posting, no spend, no app/server edits happen in this workstream.

Companion files (same folder):

- `captions-and-hooks.md` — copy bank (captions, hooks, CTAs, Arabic, claims/safety rules)
- `hooks-v2.md` — independent hook challenge + A/B hook bank
- `platform-rollout.md` — platform setup, 14-day 60 s/30 s/15 s/GIF rollout, per-platform captions
- `creative-briefs.md` — asset briefs + platform dimensions mapped to the other design workstreams
- `campaign-onepager.html` / `campaign-onepager-*.png` — visual summary of this plan
- `measure-log.ps1` — optional helper that reads the server request log for campaign UTM traffic

---

## 0. The strategy in five lines

1. **ManHunt is a local, physical, 2+ phone game. One viewer cannot play it alone.** The campaign must
   convert *groups*, not individuals — so every asset's primary CTA is "send this to the group chat",
   and the download CTA is secondary.
2. **A brand-new account with no budget will get a trickle, not a wave.** Plan for a median of roughly
   100–500 views per first video (planning range — §8 “What a new account can honestly expect”),
   not five figures. Success in 14 days = **one real group completes one real hunt**, not follower count.
3. **The product's activation funnel leaks before marketing matters.** Baseline today: 48 rooms created,
   only 6 matches started (~12.5%), 9 accounts total. Content must teach "you need 2+ phones and a room
   code" and be filmed with real groups, or traffic will land in a lobby and leave.
4. **Measurement is directional, not precise.** The server has no analytics SDK. It *does* log request URLs
   (including query strings) and the install page shows live account counts. UTM-tagged links + these two
   sources give an honest read. Do not report page hits as success — the public IP is scanned by bots (§8).
5. **Be the honest hobby project.** "Free sideload, 2 MB, no email, source on GitHub, Android only, test
   server — play with people you trust" is both the truthful disclosure **and** the most shareable framing
   for the developer/Android audience that is cheapest to reach first.

### Provisional brand platform and copy family (interim, **pending owner approval**)

The brand workstream (`design/brand/strategy/`) recommends direction **PICKUP** and, after the owner
rejected the first slogan, **copy family v2** (`slogan-v2.md`): hook **“Your friends are hunting you.”**,
permanent short line **“Hide from your friends.”**, end-card CTA **“Create a hunt. Send the code. Hide.”**
The exact wording is a recommendation, not owner-approved. The campaign therefore:

- works in **copy family v2** (see §4 and §5): the hook on the video's first beat and end card, the short
  line on trust-critical surfaces (bio, install page, headers), the CTA on the closing card;
- does **not** use the rejected v1 slogan “No gear. No fee. Just players.” in active copy — it survives only
  in historical design/QA documents that record the rejection;
- keeps the product name **ManHunt** in all copy for now, with no ™/® claims;
- avoids committing money to name-dependent assets (merch, printed permanent signage) until the owner
  decides, because the name itself is a pending owner decision with a trademark-collision risk
  (`design/brand/strategy/brand-platform.md` §1, §10 D1 — `MANHUNT` is a Take-Two mark in the video-game
  class and a same-category app already uses "Manhunt: Hide & Seek").

| Role | Provisional line (copy family v2) | Use in campaign |
|---|---|---|
| Flagship hook | **Your friends are hunting you.** | Video first beat (0–1.5 s) and end-card line; social captions |
| Permanent short line | **Hide from your friends.** | Bio, install-page hero, headers, trust-critical surfaces |
| End-card CTA | **Create a hunt. Send the code. Hide.** | Closing card / caption CTA; teaches the invite loop |
| A/B hook variant | **Your phone is a snitch.** | Second hook treatment (SNITCH), same edit — tests mechanic-led humour against the social threat |
| Descriptor (always paired on first contact) | Real-world hide-and-seek. Two teams, a live map and a clock the players can't bend. Free, 2 MB, Android 8+. | Under the hook/short line; never merged into the wordmark |
| Mode line (not a slogan) | **Two teams. One block. One clock.** | Explainer/carousel copy, never instead of the hook |
| Category tag | PICKUP SPORT | Bios/footers only, never a headline |

**Not doing (deliberate):** follower buying, engagement pods, mass DMs, fake testimonials/reviews, spam
comments, public stranger matchmaking (a GPS-tracking app that pairs strangers is a safety liability),
paid spend before 3 organic tests, app-store badges (it isn't on Play), iOS messaging (no iOS app).

---

## 1. Goal and KPI tree

### Primary goal (owner's ask: players, downloads, visits)

> Get **new groups** to install the Android APK and complete real hunts, proving which message and channel
> create *repeatable* local play — on a $0 media budget in the first 14 days.

### KPI tree

```
GOAL  real groups play real hunts (repeatable)
├── North star:  matches started per week by accounts created in the campaign window
│
├── Acquisition
│   ├── Tagged install-page visits          (server log: GET / + utm_* ; see §8)
│   ├── APK downloads from tagged links     (server log: GET /app.apk, directionally only)
│   ├── Campaign accounts created           (install page "accounts created" delta + DB query)
│   └── GitHub repo views / clones          (owner: GitHub → Insights → Traffic, 14-day window)
│
├── Activation
│   ├── Accounts that join or create a room (DB: room_members, rooms)
│   ├── Rooms with ≥ 2 members             (the real "group formed" event)
│   └── Rooms that start a match           (DB: matches; baseline rooms→matches ≈ 12.5%)
│
├── Engagement
│   ├── Matches finished vs started        (DB: matches.status, ended_at, winner)
│   └── Tags resolved                      (DB: tags; proves the physical tag loop happened)
│
└── Retention / advocacy
    ├── Accounts active again 7 days later (DB: sessions, room_members.last_seen_at)
    └── Room invite shares                  (not directly measurable; proxy: /join?code= hits in logs)
```

### Baselines measured today (2026-11-01) — use these, don't invent numbers

| Metric | Baseline | Source |
|---|---:|---|
| Accounts created (all time) | **9** | Live install page `http://74.208.99.178/` (+9 new this week) |
| Accounts by day | 8 on 2026-10-29, 1 on 2026-11-01 | `server/data/manhunt.db` (read-only query) |
| Release served | v0.13.1, 2.1 MB, Android 8.0+, published 2026-11-01 | Live install page |
| Rooms created | **48** (23 closed, 25 lobby) | DB `rooms` |
| Room memberships | **31** | DB `room_members` |
| Matches started | **6** (5 finished, 1 hunting at snapshot) | DB `matches` |
| Tags resolved | **3** | DB `tags` |
| Rooms → matches started | **≈ 12.5 %** | derived |
| Install-page hits in server log | 2,461 `GET /` over 4 days, **dominated by internet scanners** | `logs/server.out.log` — see §8 |

**Read this honestly:** the log's raw page-hit count is noise (probes for `/.env`, `wp-config.php`, JNDI
payloads etc.). The only trustworthy macro numbers are accounts, rooms and matches. That is fine — those
are the numbers that matter for a game.

### 14-day targets (honest, small, testable)

| Tier | Target | Why this is right |
|---|---|---|
| **Commit (what we control)** | 10–14 posts, 3 concepts tested, 3+ community posts (rules-compliant), 1 consent-cleared gameplay capture session, daily 2-minute measurement snapshot | Execution is the only guaranteed variable |
| **Base case (plan on this)** | 20–35 tagged install-page visits · 8–20 APK downloads · 6–15 new accounts · 4–9 rooms with 2+ members · **2–5 real matches** | Arithmetic in §9; consistent with current 9-account baseline |
| **Stretch (lucky)** | One post > 10k views → 100–250 clicks → 30–60 downloads → 3–8 friend clusters playing | Outliers happen; do not plan budget or promises on them |
| **Fail signal (act on it)** | After 8 posts: median views < 100 **and** < 3 tagged install-page visits **and** 0 new accounts | Change concept/format, not posting volume (§8 decision gates) |

> **Definition of a win:** one group of 3+ friends installs from a campaign link and finishes a hunt
> together, and the owner gets repeat footage of it. A second win is a repeat of that in a different group.

---

## 2. Positioning

### Positioning statement

> **For friend groups who already hang out in the same neighborhood, ManHunt is the free pickup field
> sport of real-world hide-and-seek: phones report position, Hunters follow a live map, and the place
> you already live becomes the pitch. Free on Android — no account email, one fair server.**

Provisional copy family v2: **“Your friends are hunting you.”** (hook) · **“Hide from your friends.”**
(permanent short line) · **“Create a hunt. Send the code. Hide.”** (end-card CTA) — owner approval pending.
The provisional brand direction calls this *PICKUP*: a sport you can start tonight, on ground you
already have, with players instead of equipment. The campaign's job is to make that category obvious in
the first two seconds ("this is a game you play with your friends in the street") **without** promising
a league, a venue, a schedule or a store app that does not exist.

### Message hierarchy (use in this order)

1. **The novelty (attention):** "Hide and seek, but the map knows where you are." Prey positions appear to
   Hunters on a live map; tagging is a physical touch and the Prey confirms or disputes it.
2. **The group ritual (conversion):** "You need at least two phones. One hosts, everyone joins with a
   6-character room code, pick Prey or Hunters, start the hunt." → CTA: *send this to the group chat*.
3. **The honest friction removal (objection handling):** free, ~2 MB, Android 8+, no email required,
   English + Arabic, source on GitHub, `SHA-256` published. Not on Google Play — it's a signed sideload
   (one-time "allow unknown sources", Play Protect may warn).
4. **The hobby-project credibility (trust):** open source, server-authoritative (nobody can fake a tag),
   test server disclaimer, "not a safety service — play with people you trust."

### What we are / are not (keep these words out of posts)

| We are | We are **not** |
|---|---|
| A real-world tag/hide-and-seek game for friend groups | A safety, rescue, tracking or parental-control service |
| Free, open-source, Android-only hobby project | A polished, on-Play-Store, app-store-reviewed product |
| A live-map game that shares your position with Hunters **in your room** during a match | A private/secure messaging app, or a way to "find out where someone really is" |
| Played in public/permitted spaces with people you trust | A reason to trespass, enter private property, or play in unsafe/isolated places |
| An indie project with a small early player base | "Millions of players", "the #1 hide-and-seek app", award-winning, etc. |

### Objection ledger (use in replies, comments, and pinned comments)

| Objection | Honest answer (no spin) |
|---|---|
| "No iPhone?" | Android 8+ only right now. Say it up front in the caption/bio — never let an iPhone user click expecting it to work. |
| "Sideloading is scary." | Free signed APK, ~2 MB, SHA-256 on the install page, full source on GitHub, MIT. One-time "allow unknown sources". It is not on Google Play. |
| "Is my location safe?" | Your position is shown only to the Hunters **in your room** while a match runs; Admins get no extra location power; a foreground notification is visible. The hosted server is a **test server over plain HTTP** — don't use it for real sensitive location data. Play with people you trust. **It is a game, not a safety service.** |
| "Battery?" | GPS runs during a match via a foreground service; bring a power bank for long games. Field battery behaviour is not yet verified on physical phones — say this if asked, don't promise "all-day battery". |
| "How many players?" | 2+ phones minimum; 3–8 is the sweet spot for a first game. Room code makes joining easy. |
| "What does it cost?" | Nothing. No ads, no purchases (there is no payment system in the app). |
| "Does it work offline?" | No — phones need network to the server during the hunt (map tiles also need network). |

### Tone

Direct, outdoorsy, a little dangerous-but-safe, never glorifying trespass or real harm (brand voice from
`docs/BRAND_BRIEF.md` §2). No fake urgency, no "DOWNLOAD NOW" spam, no police/siren/threat imagery.
Second person ("you", "your group"), short sentences, concrete places ("your campus", "the park"), one
joke maximum per post.

---

## 3. Audience segments

| # | Segment | Sizing assumption | Where they are | What convinces them | Content that fits | What to avoid |
|---|---|---|---|---|---|---|
| A | **Friend groups, 16–28** (core) | Highest-value: a group is 2–8 installs from one share | TikTok, Instagram Reels, WhatsApp/Telegram group chats | "This replaces our boring hangout" + a group activity nobody has played | Gameplay POV, "tag 4 friends", group reaction, map reveal | Solo framing; promising it works on iPhone; making it look like a shooter |
| B | **Students / campus** | Dense geography = short walks to hide; event potential | Campus clubs, Discord servers, dorm WhatsApp/Telegram, noticeboards, student subreddits | A cheap, repeatable weekend event; "host a campus hunt" | "Study break", club event poster + QR, campus map tease | Posting flyers without permission; targeting minors; exam-week insensitivity |
| C | **Outdoor / party people** (park hangs, camping, night games, festivals) | Warm intent but needs safe public venues | Reels, TikTok outdoors/party niches, group chats | Novelty at golden hour; "the park becomes the board" | Golden-hour and night-lights footage, parkour-lite energy | Event/festival ambush posts; alcohol framing; night footage that looks unsafe or trespassing; drones over people |
| D | **Existing hide-and-seek fans** (childhood nostalgia, urban tag, tag/elimination games, Nerf/airsoft-adjacent) | Small but highly motivated communities | r/hideandseek, tag/outdoor Discords, Nerf/airsoft hobby spaces | "The game you played as a kid — with a tracker" | Nostalgia hook, evolution-of-the-game explanation, rules deep dive | Raiding hobby communities; pretending to be a member; suggesting play in buildings/private property |
| E | **Android / indie / open-source audience** (amplifier) | Low install conversion, high credibility + sharing | r/AndroidGaming, r/androidapps, r/playmygame, r/sideloaded, r/IndieGaming, Hacker News, GitHub, dev Discords | Maker story, open source, self-hostable Node server, honest build log | "I built…" founder video, architecture explainer, release notes, GIF of the map | Marketing-speak; asking for upvotes; posting unrequested links in dev chats |

**Priority for 14 days:** A (friend groups) is the conversion engine; E (Android/dev) is the cheap reach
engine for a new account; B (students) is where 2–3 real clusters are most likely to be seeded locally;
C and D provide content angles and community goodwill, not volume.

> **Hard rule from the product:** ManHunt is played in person. An online follower who lives in another
> city cannot play with you. Every conversion event is a *local group decision*. So the campaign optimises
> for **shares and group-chat sends**, not follows.

---

## 4. Three ad concepts

These are three genuinely distinct creative territories (not three edits of one video). Each has its own
audience, hook, proof and CTA. Full copy is in `captions-and-hooks.md` (CAP-01…CAP-16).

### Concept 1 — "The Map Is the Game" (screen-led novelty)

- **Big idea:** show the thing nobody expects: a live map where the dots are your friends hiding in the
  real world. Hunters move, the map moves, a tag is a physical touch confirmed in-app.
- **Audience:** A (friend groups), C (outdoor), anyone who scrolls on the strength of a visual.
- **Format:** 12–20 s POV screen + real-world split: phone screen (map, prey marker, tag claim) intercut
  with the same person hiding/tagging. Burned-in captions.
- **Hooks (first 1–2 s):** "This is my friend on my map right now." / "Hide and seek just got a tracker."
  / "POV: you can see where everyone is hiding."
- **Proof shown (only real, only from the app):** live map, room code, Prey/Hunters sides, tag
  confirm/dispute, countdown. Use `docs/screenshots/05-hunting-map.png` and real screen recordings.
- **Primary CTA:** "Send this to the group chat — then download it together." Secondary: "Free Android APK
  in bio."
- **Why it wins:** it explains the product in one second and is impossible to confuse with a static app ad.
- **Kill criteria:** if two map-first posts get low completion (< 25% watched to 3 s or < 50% to end),
  switch the first frame to a human face/reaction and put the map second.

### Concept 2 — "The Group Chat Challenge" (invite-loop / social pressure)

- **Big idea:** the ad is a dare: "tag the 3 friends you'd hunt first — you can't play alone." The product
  needs a group, so the content asks the viewer to assemble one. Screenshot-friendly: "the group chat when
  everyone gets a room code."
- **Audience:** A (core), B (campus groups), D (nostalgia groups).
- **Format:** 15–30 s — real group footage (consent-cleared): four friends in a park, one hosts, map
  reveal, chase, tag, reactions; on-screen text = the dare; end card = "2+ phones. 1 room code. 0 dollars."
- **Hooks:** "Tag 3 friends or you can't play." / "Your group chat is boring. Fix it." / "Instructions:
  send this to 3 people, get outside."
- **Proof shown:** the actual room-code join flow (all phones in one shot), a real tag claim, a real match
  result dialog.
- **Primary CTA:** share/save/send-to-friends (deliberately *not* "download" first — a solo click can't
  convert); download CTA in caption/bio/pinned comment.
- **Why it wins:** it matches the actual product requirement (a group), and share/save signals are the
  cheapest organic distribution a new account has.
- **Kill criteria:** if shares/saves are < 1% of views after two posts, the dare is too vague — switch to a
  concrete "screen-record your group chat reaction" stitchable format.

### Concept 3 — "I Built a GPS Hide-and-Seek Game" (maker / open-source)

- **Big idea:** founder-led, honest build story: "I got tired of screen games, so I made hide-and-seek
  real. Here's the map, the tag rule, and the source code." Credibility-first; the GitHub link is the proof.
- **Audience:** E (Android/dev/open-source — high sharing), plus D and A as secondary.
- **Format:** 20–45 s talking-head + screen B-roll; or a pure screen-capture devlog (Node server +
  foreground GPS + Compose map). Post as a Short/Reel/TikTok and as a text post on Reddit/HN with rules
  compliance.
- **Hooks:** "I built hide-and-seek for Android with real GPS." / "You can't fake a tag in this game — the
  server owns the rules." / "This is what a $0 indie game looks like."
- **Proof shown:** GitHub repo, CI badge, install page, SHA-256, the server-authoritative tag flow, the
  limitations list (honest = credible on HN/Reddit).
- **Primary CTA:** "Source is on my profile. Free APK if you want to play with friends."
- **Why it wins:** developer/indie audiences are the cheapest organic reach for a new account, they
  tolerate "hobby project" honesty, and they share unusual builds — and the owner is the proof.
- **Kill criteria:** if this concept gets comments calling it spam (it won't if disclosed and posted in
  the right threads), stop immediately — that damages the other two concepts' credibility too.

**Concept priority:** Post 3 day 1 (credibility + dev reach) → 1 days 2–5 (visual hook) → 2 days 5–10
(share loop) → re-run the best performer in new formats days 11–14. This ordering also buys time for the
motion-designer's hero video to be ready.

### Copy family in the concepts (A/B, provisional)

The video ships copy family v2; the A/B is at the **hook** level, not “old vs new”:

| Days | Hook / end-card line | Why |
|---|---|---|
| 1, 3, 5, 8, 10, 13 | HUNTING: **Your friends are hunting you.** | Strongest social-threat hook; the map then proves it in the same second |
| 2, 4, 6, 9, 12, 14 | SNITCH A/B: **Your phone is a snitch.** | Tests mechanic-led humour against social threat; same edit, only the copy lines change |
| 7, 11 | Short line on bio/caption: **Hide from your friends.** | Trust-critical surfaces; never put the threat line next to an APK warning |

Rules: one line per surface, never both hooks in one video; v2 is **provisional** — keep the end card as a
separate 2–3 s layer so lines can be re-rendered; the short line always ships with the descriptor; the
end-card CTA is **“Create a hunt. Send the code. Hide.”**; no slogan in a CTA button; no ™/®; Arabic only
from the v2 renderings in `design/brand/strategy/slogan-v2.md` §6 (MSA on screen, Egyptian for social
copy, never mixed). Compare 3-second hold, shares and tagged install-page visits — not likes.
**The v4 cover still carries the rejected v1 slogan — re-render the cover before posting.**

---

## 5. Organic posting plan — first 14 days

### Assumptions baked into the plan

- **One owner/operator** posting manually, ~60–90 min/day including comments. No scheduler tool, no bots.
- **No budget.** No paid promotion in days 1–7; optional $ test from day 8 (§10).
- **New accounts** on TikTok, Instagram, YouTube. Cross-post the *same* master video to Reels + Shorts on
  the same day; never re-upload a platform-branded download (export clean 1080×1920 masters; see briefs).
- **Platform choice:** TikTok = primary (best discovery for new accounts); Instagram Reels = secondary
  (share-to-DM culture fits the group CTA); YouTube Shorts = cross-post only (keeps search presence;
  clickable links are limited — see §8). Skip X/Facebook/Snapchat/Twitch/Threads for now: no operator
  bandwidth and no evidence they fit.
- **Cadence:** 1 post on each of days 1–14 (13 videos + 1 carousel/photo post). Days 7 and 14 double as
  decision gates. Budget 60–90 min/day including replies and the measurement snapshot; if time runs short,
  cut the day-11 engagement post first (it is the most replaceable).
- **Content sources:** (1) motion-designer hero 12–15 s short in `design/social/motion/`; (2) owner-shot
  real gameplay with consent; (3) screen recordings of the app; (4) founder talking-head; (5) stills from
  `docs/screenshots/` in carousels. **Do not invent gameplay footage** (no fake UI, no stock people
  pretending to use the app).
- **Every video:** burned-in captions (sound-off first), one concept, one CTA, no fake claims; the end card
  uses the v2 flagship hook **"Your friends are hunting you."** (or the SNITCH A/B hook on A/B days) plus
  the end-card CTA **"Create a hunt. Send the code. Hide."**; trust-critical surfaces (bio, install page,
  headers) use the short line **"Hide from your friends."** The end card must be a separate 2–3 s card so
  copy can be re-rendered after the owner approves (dependency note in `creative-briefs.md`). The rejected
  v1 slogan stays out of every active campaign asset.

### Daily plan

| Day | Date* | Platform(s) | Asset | Concept | Hook (from `captions-and-hooks.md`) | Caption | Primary CTA | Notes / measurement |
|---:|---|---|---|---|---|---|---|---|
| 0 | Sun 11-01 | — | — | — | — | — | — | **Setup only:** create/claim handles (owner), bio copy (§6), create TikTok Business account *if* you want a clickable bio link on day 1, pin "how to install" comment, verify install page + QR works, snapshot baseline numbers (§8) |
| 1 | Mon 11-02 | TikTok + Reels + Shorts | Founder talking-head 20–30 s | 3 | H5 "I built hide-and-seek for Android…" | CAP-01 | "Source + free APK in bio" | Also post the same story as text on r/AndroidGaming/ r/playmygame **only if** rules allow (see §6); screenshot baseline |
| 2 | Tue 11-03 | TikTok + Reels + Shorts | Hero short (motion) 12–15 s | 1 | H1 "This is my friend on my map right now." | CAP-02 | Share to group chat; APK in bio | Motion asset may not be final — if not, use a 10 s screen recording with the same hook |
| 3 | Wed 11-04 | TikTok + Reels + Shorts | Screen-record "Host a hunt in 60 s" | 1 | H3 "Nobody knows how to play until the map opens." | CAP-03 | "Send to the friend who organises everything" | Pinned comment: full install steps |
| 4 | Thu 11-05 | TikTok + Reels + Shorts | "Tag 3 friends" group dare (real footage) | 2 | H2 "Tag 3 friends or you can't play." | CAP-04 | Tag/share CTA | Reply to every comment for 60 min after posting |
| 5 | Fri 11-06 | TikTok + Reels + Shorts | POV prey hiding / hunter closing in | 1 | H4 "POV: you're the Prey and the map is against you." | CAP-05 | APK in bio | Weekend is the best first-play window — CTA "play this weekend" |
| 6 | Sat 11-07 | TikTok + Reels + Shorts | "It's Saturday. Host a hunt." poster-style video | 2 | H6 "It's 8pm and your group chat is dead." | CAP-06 | "Play tonight with 2+ phones" | **Test window A:** encourage 3–5 local friends to actually play tonight; capture consent-cleared footage |
| 7 | Sun 11-08 | TikTok + Reels | Week-1 honest recap / lesson | 3 | H5 variant "1 week, N installs, what broke." | CAP-07 | "Try it with your group" | **Decision gate 1** (§8): compare views, 3 s hold, shares, tagged visits |
| 8 | Mon 11-09 | TikTok + Reels + Shorts | Comment-reply video to the most common question | 1/3 | H10 (answer-first hook) | CAP-08 | Link in bio | Optional: start paid test only after this gate (§10) |
| 9 | Tue 11-10 | TikTok + Reels + Shorts | "Why it's not on the Play Store" honest explainer | 3 | H8 "It's not on Google Play — here's why." | CAP-09 | Install from the link | Addresses the #1 objection; strong trust content |
| 10 | Wed 11-11 | TikTok + Reels + Shorts | Carousel/photo post: 5 real screenshots + how it works | 1 | H7 "5 screens, 2 phones, 1 hunt." | CAP-10 | Save for the weekend | Test stills vs video; IG carousel + TikTok photo mode |
| 11 | Thu 11-12 | TikTok + Reels + Shorts | Duet/stitch-bait: "show me where you'd hide" | 2 | H3 variant | CAP-11 | Comment your hiding spot | Engagement play — no prize, no fake giveaway |
| 12 | Fri 11-13 | TikTok + Reels | "Last-minute weekend plan" + real group footage | 2 | H6 variant | CAP-12 | "Assemble 3 people. Go." | Reuse best-performing format; change only the first frame |
| 13 | Sat 11-14 | TikTok + Reels + Shorts | Next Saturday hunt reminder + QR on screen | 1 | H2 variant | CAP-13 | Scan QR / link in bio | **Test window B:** another local group plays; capture footage |
| 14 | Sun 11-15 | TikTok + Reels + Shorts | Day-14 recap + what's next (roadmap honesty) | 3 | H5 variant | CAP-14 | "If you played, tell me how it went" | **Decision gate 2:** scale the winning concept, cut the rest (§8) |

\* Dates assume a 2026-11-01 start; shift the whole table to the actual owner start day. Posting windows:
evenings in the **players' local timezone** — for MENA audiences try 18:00–23:00 local, Thursday/Friday
nights and weekends; for a global English/dev audience, weekday mornings UTC are often better. With fewer
than 7 posts per platform there is no reliable "best time" — pick 2 consistent windows and let the data
tell you after day 7.

### Daily operator routine (30–90 min)

1. **Before posting:** check the pinned comment and bio link still work on a phone (not desktop).
2. **Post** the day's asset to TikTok first, then immediately cross-post the clean master to Reels and
   Shorts (no watermarks). Same caption family, platform-appropriate hashtags (`captions-and-hooks.md`).
3. **First 60 minutes:** reply to every comment with a real answer (scripts in `captions-and-hooks.md` §6).
   Ask one question back to keep threads alive. Do not spam "download now" in replies.
4. **Track** the day's numbers in the snapshot table (§8): views per platform after 24 h, likes, comments,
   shares, saves, profile visits, link clicks (if available), tagged install-page hits from `measure-log.ps1`.
5. **Note** any repeated question → it becomes tomorrow's video (this is the cheapest content engine).

### Platform-specific rules of thumb

- **TikTok:** 5–9 hashtags; native captions; first frame must work muted; reply with video to questions;
  do not use copyrighted chart music on a business account (Commercial Music Library only) — the motion
  designer's original/royalty-free audio avoids this entire problem.
- **Reels:** 3–5 hashtags; use the same clean 9:16 master; put the CTA in the caption *and* the first
  on-screen text (Reels UI hides caption text behind "more"); avoid reposting TikTok-watermarked files.
- **Shorts:** title = the hook; description = 1 line + install URL (visible, but not clickable for most
  accounts — treat Shorts as awareness + search presence, not a click channel); cross-post only after the
  TikTok/Reels edit exists, don't spend extra time.
- **Covers/thumbnails:** use the cover brief in `creative-briefs.md`; keep the cover text ≤ 6 words and
  readable at 1/5 size.

---

## 6. Community, Reddit and Discord (no spam)

### Principles (non-negotiable)

1. **Disclose, always:** "I made this" in the first line. Never astroturf, never post as a "player".
2. **Read the rules of each community before posting.** Many ban self-promotion entirely or restrict it to
   weekly threads. If in doubt, ask the mods first — a removed post costs the account's reputation.
3. **One post per community in 14 days.** Afterwards, stay and answer questions; don't re-post or "bump".
4. **Give more than you ask.** Post the source, the limitations, and a way to play without installing
   (video of a real game). No link-only posts.
5. **Never DM strangers a download link**, never mass-forward, never ask for upvotes/likes/installs
   (vote manipulation and "engagement bait" violate platform rules and poison niche communities).
6. **Accept removal without arguing.** If a mod removes it, thank them and move on.
7. **No minors-targeted communities.** No school-age subreddits/servers, no "ask your classmates" framing.
8. **Safety context in every community post:** play in public/permitted places with people you trust;
   not a tracking/safety service; test server disclaimer.

### Channel plan

| Channel | Fit | What to do (once, done well) | Rules / risk notes | Expected outcome |
|---|---|---|---|---|
| **r/AndroidGaming** | High (Android-only game, indie-friendly) | One `[Dev]`-style post: short honest description, 2 screenshots + GIF, free APK link, source link, limitations list; then answer every comment | Check sidebar/wiki for dev-post rules; disclose "I'm the developer"; no link-only titles | Best single community channel: 20–200 views, 1–10 installs if it lands |
| **r/playmygame** | High (explicitly for feedback) | Post with a specific feedback ask ("what's confusing about the install flow?") + install link | Built for this; still disclose and stay to reply | Few views but quality feedback + possible testers |
| **r/androidapps** | Medium | Post only if rules allow dev posts (many restrict to a weekly thread) | Read rules; avoid duplicates; no "free app" spam phrasing | Moderate; long-tail |
| **r/sideloaded / r/FOSSGaming / r/opensource** | Medium (fits "not on Play Store", MIT) | Sideload angle: signed APK, SHA-256, source, self-hostable server | Keep it factual; these communities dislike hype and "free" bait | Small, high-trust |
| **r/IndieGaming / r/gamedev (weekly self-promo threads only)** | Medium | One post in the designated weekly thread; otherwise comment helpfully in others' threads | Never post standalone self-promo outside allowed threads | Indie goodwill; some dev followers |
| **r/hideandseek** | Medium (nostalgia relevance) | Only if the sub allows it: "we turned hide-and-seek into a GPS game; here's what changed" + discussion question | Verify sub exists/rules; do not pretend it's an ordinary player post; no link spam | Niche but on-theme |
| **Hacker News (Show HN)** | Medium | One "Show HN: Real-world GPS hide-and-seek for Android (open source)" with honest limitations, install + GitHub links | HN hates marketing; don't ask for upvotes; post in the morning US time; expect 0–5 points | Occasional traffic spikes; credibility |
| **GitHub** (repo itself) | High, free | Social preview image, topics, README GIF, each release gets a short honest "what's new" post; GitHub Discussions for feedback | Not a spam channel — keep releases genuinely useful | Dev audience + repo traffic analytics (§8) |
| **Product Hunt** | Low priority | Only if the owner wants to run a launch: needs account, assets, a hunter, and 2–4 weeks' notice; never ask for upvotes | PH rules: no vote solicitation; launch readiness too low now (Android sideload, test server) | Skip in the first 14 days |
| **Discord (existing communities)** | Medium | Identify 5–8 relevant servers (university gaming clubs, board-game café communities, outdoor/urban-hike groups, Android/dev servers). Lurk ≥ 3 days, read channel rules, then **ask an admin** whether a "we made a real-world hide-and-seek game — want to run a game night?" message is welcome. If yes, post once with a demo GIF + invite to try; answer questions live | Never cold-DM admins repeatedly; never post invite links without permission; no @everyone; no cross-server copy-paste bombing | A willing server = 1 real game night (highest-value outcome) |
| **WhatsApp/Telegram (owner's own network)** | Highest conversion, zero reach beyond network | Owner personally invites 10–20 friends to one Saturday game; after a successful match, each player shares the room-invite link once. Consent, no mass forwarding | Personal network only; no scraping people from groups | **Most realistic path to the first 2 real matches** |
| **Campus/city physical** | Medium (local acquisition) | With permission only: A5 QR cards at board-game cafés, campus club noticeboards, community boards. Put "scan → install → host a hunt" + install URL text under the QR | Never flypost; get written/verbal permission; no posters in schools | A few scans; credibility offline |

### Templates (edit to fit, keep the disclosure)

**Reddit / r/AndroidGaming-style post**

> **[Dev] I made real-world GPS hide-and-seek for Android — free, open source, no Play Store**
>
> I'm the developer. It's a real-world hide-and-seek game: Prey hide, their phones report position,
> Hunters watch a live map and tag them by physically touching them (the Prey confirms or disputes the tag,
> the server owns the rules).
>
> - Free signed APK (~2 MB, Android 8+): http://74.208.99.178/ — SHA-256 is on the page
> - Source (MIT): https://github.com/MostafaAshry513/ManHunt
> - Honest limitations: it's an active hobby project, the hosted server is a test server over plain HTTP,
>   Android only, you need 2+ phones from the same room, and it's a game — not a safety/tracking service.
>   Play in public places with people you trust.
>
> What I'd like from you: try a round with 2+ phones and tell me where the install/game flow is confusing.
> I'll answer every comment.

**Discord admin pitch (send only after lurking and confirming it's allowed)**

> Hi — I'm the developer of ManHunt, a free open-source Android game that turns hide-and-seek into a
> real-World GPS game (phones track Prey, Hunters tag in person). It needs a group in one place, so it
> suits your server's game-night slot. I'm not selling anything and I'm not asking to post links: if you'd
> like, I can share a 2-minute demo video and answer questions in your general chat, and if the community is
> interested we can set up a game night with 4+ people. Totally fine to say no.

**Hacker News Show HN**

> Show HN: Real-world GPS hide-and-seek for Android (open source)
>
> I built ManHunt: Prey hide; their phones report GPS to the server; Hunters follow a live OpenStreetMap
> view and tag them by physically touching them, with the Prey confirming/disputing the tag. Server is a
> single Node process (Fastify + SQLite), server-authoritative contract, Kotlin/Compose app. Free signed
> APK at http://74.208.99.178/, source at https://github.com/MostafaAshry513/ManHunt.
>
> Known limitations, honestly: Android only, not on Google Play (sideload), hosted server is a test VM over
> plain HTTP, zone boundaries aren't enforced server-side, and field battery/GPS behaviour isn't verified
> on physical phones yet. The interesting part for HN is probably the tag arbitration state machine and the
> "client sends intents, server decides" design. Happy to answer questions.

---

## 7. Measurement and UTM plan

### Ladder and data sources

| Stage | What we can actually measure | Source / command | Reliability |
|---|---|---|---|
| Exposure | Views, likes, comments, shares, saves per post | Native platform analytics (owner account) | Good |
| Visits | Tagged install-page hits | `logs/server.out.log` — request URL includes query string; filter by `utm_campaign=launch14` | **Directional** (no UA/referrer, bot noise, log rotation) |
| Downloads | `GET /app.apk` (and `HEAD`) | Same log | Directional — in-app updates also fetch the APK |
| Accounts | Total accounts + "new this week" | Live install page stats + DB `SELECT COUNT(*) FROM users` | Good |
| Room formed | Rooms with ≥2 members | DB `rooms` / `room_members` | Good |
| Match played | Matches started/finished, tags | DB `matches`, `tags` | Good |
| Invite shares | `/join?code=` hits | Same log | Directional |
| Repo interest | Repo views/clones/uniques + referrers | GitHub → Insights → Traffic (owner, 14-day rolling) | Good for its window |

> The install page counts accounts from **all** sources (including the owner's own tests). Always take a
> before/after snapshot and subtract known test accounts. Report deltas, never absolute "we got X users".

### UTM convention

Use on **every link we control** (bio, pinned comment, QR, community posts). Keep it consistent:

```
http://74.208.99.178/?utm_source=<platform>&utm_medium=<social|community|offline|paid>&utm_campaign=launch14&utm_content=<content-id>
```

| Channel | Example URL |
|---|---|
| TikTok bio / comment | `http://74.208.99.178/?utm_source=tiktok&utm_medium=social&utm_campaign=launch14&utm_content=cap-02` |
| Instagram Reels bio | `http://74.208.99.178/?utm_source=instagram&utm_medium=social&utm_campaign=launch14&utm_content=cap-02` |
| YouTube Shorts description | `http://74.208.99.178/?utm_source=youtube&utm_medium=social&utm_campaign=launch14&utm_content=cap-02` |
| Reddit post | `http://74.208.99.178/?utm_source=reddit&utm_medium=community&utm_campaign=launch14&utm_content=reddit-androidgaming` |
| Discord game night | `http://74.208.99.178/?utm_source=discord&utm_medium=community&utm_campaign=launch14&utm_content=<server-slug>` |
| Hacker News | `http://74.208.99.178/?utm_source=hn&utm_medium=community&utm_campaign=launch14&utm_content=show-hn` |
| QR poster / in-person | `http://74.208.99.178/?utm_source=qr&utm_medium=offline&utm_campaign=launch14&utm_content=<venue-slug>` |
| Paid test (later) | `...&utm_medium=paid&utm_content=tiktok-boost-01` |
| GitHub README/release | `...&utm_source=github&utm_medium=referral&utm_campaign=launch14&utm_content=readme` |

Rules: lowercase, hyphenated, no spaces; one content id per post; don't change the campaign value
mid-flight (`launch14` for the whole 14 days; use `launch14b` for a re-run after changes).

### Where the links can go (platform reality for a brand-new account)

| Platform | Clickable link for a new account? | Practical plan |
|---|---|---|
| TikTok | Bio link needs a **free registered Business Account** or 1,000+ followers ([Sprout Social, 2026](https://sproutsocial.com/insights/tiktok-link-in-bio-guide/); [Rebrandly, 2025](https://www.rebrandly.com/blog/how-to-add-link-tiktok-bio)). Business accounts get only the Commercial Music Library for sound. | Register the free Business Account → tagged link in bio from day 1 + pinned comment with install steps. Choose original/royalty-free audio so the music restriction doesn't matter. |
| Instagram Reels | Profile bio link: no follower minimum, up to 5 links ([TLinky, 2026](https://tlinky.com/link-in-bio-for-instagram/)) | One bio link with `utm_source=instagram`; CTA "link in bio". |
| YouTube Shorts | Description links exist but are generally not clickable in the Shorts player; channel links only | Treat Shorts as awareness/search; put the URL as plain text + "search ManHunt GitHub"; don't count on Shorts clicks. |
| Reddit | Text links allowed in most subs, subject to each sub's rules | Tagged link inside the post body (not the title); disclose; one post per sub. |
| Discord | Links fine once the admin welcomes it | Tagged link in the agreed channel only. |
| QR | N/A | QR encodes the tagged URL; also print the URL as text under it. |

> Verify each platform's current rules at launch — these thresholds change. Don't build the whole plan on
> one link placement; the fallback is always "search ManHunt on GitHub / install page URL in plain text".

### Owner's 2-minute daily snapshot (copy into a note/Sheet)

| Date | Post(s) | Views (TT/IG/YT) | 3 s hold % | Likes | Comments | Shares | Saves | Profile visits | Tagged visits* | APK dl* | Accounts (total) | Rooms (2+) | Matches | Notes |
|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|---|
| 11-01 baseline | — | — | — | — | — | — | — | — | — | — | 9 | ? | 6 | Baseline |
| 11-02 | CAP-01 | | | | | | | | | | | | | |

\* from `logs/server.out.log` via `measure-log.ps1` (or the manual commands below). Save a copy of the log
before it rotates during the campaign.

### Manual commands (no code changes)

```powershell
# 1. Campaign-tagged install-page hits (from the campaign link), grouped by utm_source
Select-String -Path C:\dev\ManHunt\logs\server.out.log -Pattern 'utm_campaign=launch14' |
  ForEach-Object { if ($_.Line -match 'utm_source=([a-z0-9_-]+)') { $Matches[1] } } |
  Group-Object | Sort-Object Count -Descending | Select-Object Count, Name

# 2. APK downloads per day (directional: includes in-app updates and bots)
$rows = Get-Content C:\dev\ManHunt\logs\server.out.log | ForEach-Object {
  if ($_ -match '^\[(\d{4}-\d{2}-\d{2})T[^\]]+\] (.*)$') { $d=$Matches[1]; $j=$Matches[2]
    if ($j -match '"url":"/app\.apk"') { [pscustomobject]@{Day=$d} } }
}
$rows | Group-Object Day | Sort-Object Name | Select-Object Name, Count

# 3. The funnel from the game database (read-only)
node -e "const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync('C:/dev/ManHunt/server/data/manhunt.db',{readOnly:true});console.table({users:db.prepare('SELECT COUNT(*) n FROM users').get().n,rooms2plus:db.prepare('SELECT COUNT(*) n FROM (SELECT room_id FROM room_members GROUP BY room_id HAVING COUNT(*)>=2)').get().n,matches:db.prepare('SELECT COUNT(*) n FROM matches').get().n,finished:db.prepare(\"SELECT COUNT(*) n FROM matches WHERE status='finished'\").get().n,tags:db.prepare('SELECT COUNT(*) n FROM tags').get().n});db.close()"
```

Or use the helper: `pwsh -File design\social\campaign\measure-log.ps1 -Campaign launch14`.

### Honesty rules for reporting

- Never describe raw page hits as "visits" without removing scanner noise; the public IP receives constant
  bot probes (§8 baseline table). Campaign-tagged query strings are the clean slice.
- Attribution is last-touch-ish at best: one person may see a video, get the APK from the GitHub release,
  and never touch a tagged link. That's fine — report tagged numbers as a floor, not a total.
- The DB/install-page counts include test accounts. Note them, subtract them, or say "includes test accounts".
- The hosted server is a **test server**: data may be wiped. Do not build public claims ("our players")
  on numbers that might vanish; screenshot the dashboard if you need a record.

---

## 8. Decision gates, tests and honest expectations

### Decision gate 1 (end of day 7)

Look at: median views per post, 3-second hold rate, shares+saves, tagged install-page visits, new accounts.

| Signal after 7 posts | Action |
|---|---|
| Median ≥ 300 views, ≥ 3 tagged visits, ≥ 1 new account | Keep cadence; double down on the top concept; start the paid test (§10) |
| Median 100–300 views, < 3 tagged visits, 0 accounts | Change **hook and first frame**, keep cadence; add one direct in-network invite push (WhatsApp/campus) |
| Median < 100 views, 0 tagged visits, 0 accounts | **Do not post more of the same.** Stop, re-shoot concept 2 with real people (the game is social footage, not screen footage), and spend the remaining days on in-person invites |

### Decision gate 2 (end of day 14)

- Which concept produced the *only* thing that matters — a room with 2+ members that started a match?
- If ≥ 2 real matches happened: turn the winning concept into a repeatable weekly format ("Saturday hunt"),
  and ask the owner to consider the product-side fixes before scaling reach (below).
- If 0 matches: the bottleneck is almost certainly **activation, not reach**. Do not buy ads. Fix the
  group-formation experience first (see owner decision #1).

### The three tests worth running (cheap, real)

1. **Hook test:** same video, two different first frames/on-screen lines (H1 "map" vs H2 "tag 3 friends"),
   posted 2–3 days apart or as A/B on the same platform. Winner = higher 3-second hold.
2. **CTA test:** "share to your group chat" vs "download in bio" as the primary ask on otherwise identical
   posts. Winner = shares/saves + tagged visits, not likes.
3. **Format test:** screen-led vs face-led vs group-footage-led. Winner by completion + profile visits.
   (This one decides what the next 2 weeks of content should be.)

### What a new account can honestly expect

- First posts on a new TikTok account commonly land around **100–500 views**; the platform sometimes gives
  the first video a wider test ([360uniquizer, 2026](https://360uniquizer.com/en/news/tiktok-zero-views-new-account)).
  A beginner posting daily reported ~3,675 total views in week one with a first post at 1,891
  ([Videognostics, Oct 2025](https://www.linkedin.com/posts/videognostics_insights-and-observations-after-1-week-of-activity-7381690942623436800-rChN)).
- A 2026 analysis claims sub-2,000-follower accounts average ~2,400 views per video and ~73% of TikTok
  views come from For You ([growently summary of Metricool data](https://growently.com/first-1000-tiktok-followers)) —
  treat as an optimistic planning ceiling, not a promise.
- Expect **0–50 followers in 14 days**; a viral hit is luck and should not be in the plan. A single video
  over 10k views would already be an outlier.
- **The game's own structure caps reach-to-install conversion**: viewers need (a) Android, (b) 1+ friend
  present, (c) willingness to sideload. Assume 1–3% of views click a link and 30–60% of those install;
  build the plan on those ranges (§9).

---

## 9. Realistic model (label every number as an assumption)

Base-case arithmetic for 14 days, 14 posts (13 videos + 1 carousel) cross-posted to 3 platforms (same master, so platform views are
not fully additive — assume TikTok full reach, Reels ~20–30% incremental, Shorts ~10–20% incremental):

| Step | Conservative | Base | Lucky |
|---|---:|---:|---:|
| Views in 14 days | 1,500 | 5,000 | 25,000 (one outlier) |
| → tagged install-page visits (0.4–1.5%) | 6 | 35 | 250 |
| → APK downloads (40–60% of visits, Android share + sideload friction) | 2 | 18 | 120 |
| → accounts created (50–75% of downloads) | 1–2 | 9–14 | 60–90 |
| → rooms with ≥2 members (40–60% of accounts) | 0–1 | 4–8 | 25–40 |
| → matches started (60–80% of rooms) | 0–1 | 3–6 | 15–30 |
| → matches *finished* (assume 70–85%) | 0–1 | 2–5 | 10–20 |

Caveats: cross-platform double counting (same person) possible; the install page doesn't count downloads;
in-app updates inflate APK download counts; the DB includes test accounts. **The base case is the plan;
the lucky column is the reason to keep posting, not a forecast.**

---

## 10. Paid options (separate; NOT executed; owner decision only)

**Structural constraint:** ManHunt is **not on Google Play**, so store-install ad products (Google App
Campaigns, Meta/TikTok app-install objectives) are not available. Paid options can only drive **traffic**
to the install page — and a plain-HTTP IP address is a weak ad landing page (trust + click-quality
friction). Treat paid as a *small, late, optional test*, never the growth engine.

| Option | How | Suggested test | Honest expectation | Requirements |
|---|---|---|---|---|
| TikTok Promote/Boost on the best organic video | Boost the day-7 winner, objective "more website visits", audience 18–30, broad | **$10–20 total** (e.g. $5–7/day × 3 days) | 1,000–5,000 views; 10–50 clicks; 2–10 downloads; cost per account likely high (> $2–5) at this scale | Business account + ad account/payment; owner runs it; video must be organic-looking (ads can use organic posts as Spark Ads) |
| Instagram/Meta Boost Reels | Boost a Reel with "website visits" CTA | **$10–15** for 3–4 days, Android + interests gaming/outdoor | Similar to TikTok, often lower for indie novelty content | Meta ad account; owner runs |
| Reddit Ads | Target r/AndroidGaming, r/androidapps, gaming/outdoors interests; honest dev copy | **$15–25** ($5/day × 3–5 days) | Cheap impressions, modest clicks; Reddit users are ad-averse but the honest dev angle works | Reddit ad account; creative using one of the briefs' static assets |
| Google Search Ads | Exact/phrase: "gps hide and seek", "real life hide and seek game", "hide and seek android" | **$20–30**, 5 days | Search volume for these phrases is tiny; mostly curiosity clicks; likely poor ROI | Google Ads account; landing page = install page (plain HTTP may lower quality score) |
| Micro-influencer barter | Offer an early look/behind-the-scenes to small Android/gaming/outdoor creators (2k–20k followers) | $0 cash; 3–5 outreach DMs | Unpredictable; most won't reply; one good fit can outperform all ads | Owner sends outreach from the brand account; no money, no fake followers, no scripted "reviews" |
| Physical QR cards | A5 cards at board-game cafés/community boards **with permission** | Cost of printing only (~$10) | A handful of scans; good for local clusters | Permission, honest copy, tagged QR |

**Paid guardrails:** total test cap ≤ **$100** for the first 14 days; no spend before decision gate 1
(day 7); run one channel at a time with a unique `utm_content`; judge on accounts created and matches
started, never impressions; stop any test that spends > $25 without a single tagged install-page visit.
If the owner wants to learn something faster, the highest-ROI "paid" spend is honestly **printing QR cards
for local venues** and **buying your friends dinner for a game night** — real clusters beat ad clicks at
this stage.

---

## 11. Guardrails: claims, safety, privacy, legal

### Approved claims (verifiable from the repo — safe to use)

| ID | Claim | Evidence |
|---|---|---|
| C1 | Real-world GPS hide-and-seek; Prey hide, Hunters track on a live map and tag in person | `README.md` |
| C2 | Free signed APK, ~2 MB, Android 8.0+ | install page, `README.md` |
| C3 | Not on Google Play — sideload with "allow unknown sources"; Play Protect may warn | `README.md` |
| C4 | No email required; local account (username + password, no account recovery) | `README.md`, install page |
| C5 | Source on GitHub, MIT license, self-hostable (one Node process, SQLite) | repo, `docs/DEPLOYMENT.md` |
| C6 | Server-authoritative timers/teams/tag outcomes — clients cannot fake a tag or phase | `README.md`, `docs/ARCHITECTURE.md` |
| C7 | Position visible only to Hunters in your room during a match; Admins get no extra location power; foreground-service notification visible | `README.md`, install page |
| C8 | English + Arabic with full RTL | `README.md` |
| C9 | Hosted server is a test server over plain HTTP; data may be wiped; not a safety service | install page, `README.md` |
| C10 | Classic mode is the only playable mode today (Single Prey/Shrinking Zone are "planned") | `android/.../data/GameModes.kt` |
| C11 | Tag claim → Prey confirms or disputes → Huntmaster resolves; 90 s timeout | `README.md` |

### Brand-workstream copy rules (interim, from `design/brand/strategy/tone-of-voice.md`)

- **Voice:** the friend who organises the game — plain sentences, short beats, warm, even, never hyping
  something untrue. Second person for the player; "we" only in changelogs/READMEs, never in the app UI.
- **Casing:** `ManHunt` is one word, camel case in running text; `MANHUNT` only as display type. `Prey`
  and `Hunters` capitalised when they name the sides; lowercase "hunt" for the match.
- **Punctuation:** full stops and commas; no exclamation marks, ellipses or emoji in product copy; one em
  dash max; no ALL CAPS except a true label.
- **Numbers:** numerals ("6-character code", "42:17 left", "3 players"); never a number the server does
  not enforce (the hunt length is host-configured, default 60 min, range 5 min–4 h — don't say "40
  minutes").
- **Avoid in *new* copy:** the word "survive"/"survivors" (the incumbent slogan keeps it, but new lines
  should not inherit its safety/stakes drift) and "hunt or be hunted" (registered elsewhere).
- **OSM attribution:** "© OpenStreetMap contributors" wherever map tiles are shown (video, screenshots,
  poster) — required by the ODbL.
- **Trademark:** no ™ or ® anywhere unless the owner files; do not assume the name is clear (see §12 #13).
- **Arabic:** in external copy prefer `المطاردون` (the chasers) over `الصيادون` when describing people;
  UI strings keep the established `الصيادون`. Keep Western digits, don't mirror timers, isolate Latin
  words (ManHunt, Android, APK) in RTL text, and don't transliterate the slogan.

### Forbidden (fake, unverifiable, or dangerous to imply)

- "Safe / secure / private / safest / protects you / never lose anyone" — it is a location-sharing game,
  not a safety product.
- "On the Play Store / App Store / available on iPhone / get it on iOS."
- "Millions of players", "the #1 hide-and-seek app", award claims, press quotes, star ratings, testimonials
  (there are none).
- "Works offline", "no battery drain", "GPS works everywhere", "unhackable", "no data collected".
- "Guaranteed fun", "best game of 2026", fake urgency ("last chance", countdowns that reset).
- Any footage that looks like trespassing, entering private property, playing on roads/rail/construction
  sites, at night in isolated places, or filming bystanders/children without consent.

### Safety & legal checklist for every post/asset

1. **Consent:** everyone identifiable on camera has agreed to appear and to the post. Minors: parent/guardian
   consent + don't target minors; prefer adult friend groups in marketing.
2. **Location privacy:** blur house numbers, license plates, school/hospital signage, and any map screenshot
   that reveals a real home or school; use public parks/neighborhoods for footage.
3. **Play safely:** public/permitted places; daylight or well-lit areas for filmed games; no traffic/roads/
   rails/construction/water; no illegal trespass; no "hide in the mall after closing" jokes; no police/siren
   framing; no alcohol/drugs on camera.
4. **The disclosure line** goes in the bio and pinned comment (not necessarily every caption): "Free test
   build, Android only, not on Play Store. Location is shared with Hunters in your room during a match.
   It's a game, not a safety service — play with people you trust."
5. **Sideload honesty:** always from the official install page/GitHub release; mention the SHA-256 exists;
   never link APK mirrors or APK aggregators (untrusted copies are a security risk and would misrepresent us).
6. **Platform rules:** no engagement baiting/vote requests; no "follow for part 2" spam; no auto-DMs; no
   buyable engagement; expect TikTok's dangerous-activities and minor-safety policies to apply — show the
   safe context (public park, daylight, people laughing) so the content is clearly a game.
7. **No stranger matchmaking:** never encourage meeting strangers to play — a GPS-tracking game that pairs
   strangers is a safety liability. Community spaces are for updates/support/existing groups only.
8. **Test server honesty:** plain HTTP, data may be wiped, no password recovery. Don't say "we'll keep your
   data safe" — say what the install page says.

---

## 12. Owner decisions (blocking or high-impact)

| # | Decision | Why it matters now | Recommendation |
|---|---|---|---|
| 1 | **Fix activation before scaling reach?** 48 rooms → 6 matches (12.5%), 31 memberships for 48 rooms. Most rooms are solo. | Ads/content amplify whatever the lobby does. If a group can't get into a match easily, traffic is wasted. Also: the first campaign videos need *real group footage* — which requires the owner to run 2–3 real test games. | Run 3 real local games this week (the most valuable campaign prep). If lobbies are confusing, fix UX before spend. |
| 2 | **Copy family v2 approval + A/B** | The owner rejected the v1 slogan. Brand v2 (`slogan-v2.md`) proposes flagship **“Your friends are hunting you.”**, short line **“Hide from your friends.”**, end-card CTA **“Create a hunt. Send the code. Hide.”** — provisionally adopted by this plan, not yet owner-approved. The A/B is HUNTING vs SNITCH at hook level (§4), and the v4/v5 cover must be re-rendered off the rejected v1 line before any post. | Owner approves v2 (or edits it); keep the end card a separate layer; re-render the cover; no active copy on the rejected v1 line. |
| 3 | **Who creates and operates the accounts** | Growth workstream cannot create accounts or post. Someone must register handles, write the bio, choose business vs personal on TikTok, and post daily. | Owner or a named operator; TikTok free Business Account for a clickable bio link from day 1 (trade-off: Commercial Music Library only — use original audio). |
| 4 | **Platform shortlist** | More platforms = worse execution for one person. | TikTok + Instagram Reels primary; YouTube Shorts cross-post; skip the rest for 14 days. |
| 5 | **Language priority** | App is EN+AR; owner network is likely MENA. | English-first captions (global dev/Android reach) + Arabic adaptations (provided) for local/community posts. Owner decides if a fully Arabic channel is warranted later. |
| 6 | **No public stranger matchmaking** | Safety + platform risk; also it can't work (players must be physically together). | Approve the policy in §11.7; community is for updates/support/existing groups. |
| 7 | **Paid test budget** | Paid can't use app-install formats (not on Play), landing page is plain-HTTP IP; returns likely thin. | $0 until day 7; then optional ≤$100 total on one channel; or spend on QR printing/local game night instead. |
| 8 | **Safety framing sign-off** | Claims about privacy/safety are the highest legal/brand risk. | Approve §11 claims ledger and the disclosure line; no "safe/secure" language anywhere. |
| 9 | **Footage consent + capture plan** | Campaign assets depend on real gameplay footage that doesn't exist yet. | Owner films a 60–90 min session with 4+ consenting adults in a public park; motion designer uses it; store raw footage + consent notes under the campaign folder (not committed if private). |
| 10 | **Analytics access** | Without snapshots and log copies, the 14-day report is guesswork. | Owner keeps a copy of `logs/server.out.log` during the campaign and snapshots the install-page stats daily; shares GitHub Insights traffic. |
| 11 | **Product-side gaps that affect marketing** | No OG image on install page (link shares look bare), no favicon (brand workstream), plain HTTP, no Play Store. | Ship OG image + favicon (identity/brand workstreams + owner integration); keep the honest disclaimer; plan Play Store as the long-term unlock. |
| 12 | **Community posting authority** | Reddit/HN/Discord posts must be disclosed and can only be made by the owner from a real account. | Owner reviews/approves the templates (§6) and posts personally; one post per community; no delegation to bots. |
| 13 | **Name, trademark and social-handle risk** | `MANHUNT` is a Take-Two mark in the video-game class and a same-category app already uses "Manhunt: Hide & Seek" (`brand-platform.md` §1/§10 D1). The owner has not approved the name. Social accounts, hashtags and any printed asset inherit that risk; a late rename would strand handles, hashtags and printed QR material. | Owner decides the name/trademark position **before** printing anything permanent or paying for a handle/domain. Choose change-tolerant handles (e.g. include a descriptor like `play`/`hunt` rather than a name-only handle), keep first-14-days assets text-light on the wordmark, and don't claim TM status. |

---

## 13. First-72-hours checklist (owner/operator)

- [ ] Approve claims ledger and disclosure line (§11), and **write** the bio copy from `captions-and-hooks.md`.
- [ ] Register/claim handles (TikTok, Instagram, YouTube) — owner, not this workstream. Register the free
      TikTok Business Account if a day-1 bio link is wanted.
- [ ] Snapshot the baseline: install page numbers, `measure-log.ps1` run, DB funnel query, GitHub traffic
      screenshot (§7).
- [ ] Confirm the install page, APK link and QR work on a real Android phone (not just desktop).
- [ ] Host one 4+ person test game this week; record consent-cleared footage (60–90 min, public park,
      daylight; vertical + horizontal).
- [ ] Export/ship the motion short (motion-designer) and covers; caption bank ready (`captions-and-hooks.md`).
- [ ] Post day 1 (founder video, Concept 3) with a tagged bio link; pin the install comment; reply to
      every comment for 60 min.
- [ ] Start the daily 2-minute snapshot; do not change the plan before day 7 unless a kill criterion fires.

---

## 14. References

Repo evidence: `README.md`, `docs/BRAND_BRIEF.md`, `docs/UI_REVIEW.md`, `server/src/app.ts` (install page,
`/join` link), `server/src/schema.sql` (measurement tables), `android/.../data/GameModes.kt` (only Classic
playable), live install page <http://74.208.99.178/>, `logs/server.out.log`, `server/data/manhunt.db`.

Brand workstream (interim, pending owner approval): `design/brand/strategy/brand-platform.md` (direction
PICKUP, name/trademark risk), `design/brand/strategy/slogans.md` (primary + alternates + Arabic
renderings), `design/brand/strategy/tone-of-voice.md` (voice, guardrails, approved claims ledger),
`design/brand/strategy/visual-direction.md` (palette semantics, typography, motion vocabulary),
`design/brand/identity/` (mark/icon in progress), `design/social/motion/` (hero short in progress).

External planning data (verify at launch; treat as untrusted marketing sources, not guarantees):

- New-account view ranges: [360uniquizer, 2026](https://360uniquizer.com/en/news/tiktok-zero-views-new-account);
  [Videognostics first-week post, Oct 2025](https://www.linkedin.com/posts/videognostics_insights-and-observations-after-1-week-of-activity-7381690942623436800-rChN);
  [growently/Metricool summary, 2026](https://growently.com/first-1000-tiktok-followers)
- TikTok bio link requirements: [Sprout Social](https://sproutsocial.com/insights/tiktok-link-in-bio-guide/);
  [Rebrandly](https://www.rebrandly.com/blog/how-to-add-link-tiktok-bio)
- Instagram bio links: [TLinky, 2026](https://tlinky.com/link-in-bio-for-instagram/)
