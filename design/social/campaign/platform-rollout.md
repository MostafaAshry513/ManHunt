# Platform rollout — “post everywhere” for the 60 s explainer + full identity

Status: **owner-run checklist, draft.** 2026-11-01 · growth/ads workstream (independent copy + rollout).
Scope: platform setup, a 14-day posting matrix for the 60 s / 30 s / 15 s / GIF cuts, per-platform
captions, measurement, and a one-sitting execution sequence. **No accounts are created, nothing is
posted, no money is spent by this workstream.**

Read with: `design/social/campaign/launch-playbook.md` (strategy, UTM, measurement), `hooks-v2.md` (hooks),
`design/brand/strategy/script-v2.md` + `slogan-v2.md` (copy v2), `design/brand/strategy/tone-of-voice.md`
(guardrails), `design/brand/identity/final/` (approved identity kit), `design/social/motion/captions.md`
and `render-notes.md` (cuts + copy lock), `server/src/app.ts` (install page).

---

## 0. State of the world before you create anything

| Fact | Consequence for this rollout |
|---|---|
| **No accounts exist yet.** | The owner must create them — this workstream cannot and will not. One sitting, one operator, ~2.5–3.5 h (§7). |
| **No budget assumed.** | Every tool below is free/native. Paid is optional and gated at day 7 (§6.4); no spend before then. |
| **Identity is approved:** `design/brand/identity/final/` (mark “01 Open Zone”, drawn wordmark, lockup, Android/install handoff, OG card). | Use only files in that folder for avatars/headers; do not retype/recolour the wordmark or place text inside the lockup clear space (`LOCKUP.md` §2–§3). |
| **Copy v2 supersedes v1:** `script-v2.md` + `slogan-v2.md`. Flagship **“Your friends are hunting you.”**, short form **“Hide from your friends.”**, end-card CTA **“Create a hunt. Send the code. Hide.”** Owner rejected v1 (“No gear. No fee. Just players.”). | Do **not** use the rejected line anywhere in profiles, bios, covers or captions. v2 is a recommendation pending final owner sign-off — see §8 risk R3. |
| **Shipped video is v4** (`design/social/motion/out/v4-preview/`): 15 s, Treatment 1 “HUNTING”, pure animated map, no app screenshot, no OSM tiles. | v4 is the fallback cut if v5 slips. The v4 cover still carries the rejected v1 slogan (`captions.md` note) — **re-render the cover before posting** (§8 R2). |
| **The 60 s explainer (v5) was not yet on disk when this file was written** (expected under `design/social/motion/out/v5/`). | §3 uses canonical filenames as a **contract**; confirm/replace with the real names when v5 lands. Gate day 1 on the cuts existing and passing QA. |
| **The game needs 2+ phones, one place.** | Every CTA is a group action (“send this to the group chat”), not a solo download. Cross-posting is 7 chances at the same small pool, not 7× reach. |
| `MANHUNT` collides in the game class (Take-Two mark; a same-category app already uses “Manhunt: Hide & Seek”). | Never imply official/affiliation; test handles first; use change-tolerant handles; don’t buy handles from squatters (§1). |
| Hosted install page is a **plain-HTTP test server** at a bare IP; no analytics SDK. | Honest wording everywhere; measurement is directional; see `launch-playbook.md` §7–§8. |

**Platform set for this rollout (exactly the 7 the owner named):** TikTok · Instagram Reels · YouTube
Shorts · X/Twitter · Discord · Reddit · GitHub.

**Deliberately skipped for now:** Facebook/Threads, Snapchat, Pinterest, Twitch, LinkedIn, Telegram
channels. Reasons: no operator bandwidth for the first 14 days, weak fit for a 2+-phone local game, or
no honest value until there is a community. Adding them later is fine; adding them badly is not.

---

## 1. Handles, display names, and the MANHUNT collision

### 1.1 The collision, stated plainly

- `MANHUNT` is a **Take-Two Interactive** mark in the video-game class, and a same-category app already
  ships as “Manhunt: Hide & Seek” (`design/brand/strategy/brand-platform.md` §1, §10 D1).
- Therefore: **do not assume `@manhunt` is available or safe**, do not use it if it is dormant/squatted,
  do not add “official”, ™ or ®, and do not use any Take-Two/Rockstar artwork, font or screenshots.
- The product name itself is still an owner decision (rename risk). Handles chosen now should be
  **change-tolerant**: include a neutral descriptor (`play`, `game`, `android`, `hq`) so a later rename
  strands less. No permanent print/merch before the name decision.

### 1.2 Handle search + registration order

Do this **before** creating anything. 15 minutes.

1. Search each platform + the open web for: `manhunt` handles, “Manhunt: Hide & Seek”, Take-Two Manhunt
   pages. Record screenshots of what already exists.
2. Test availability of the candidates below **in order**, same string across platforms where possible.
3. Prefer a candidate that is: not an existing game/app account, not an inactive squat of a famous mark,
   ≤ 15 characters (X limit), reads like a product not a fan page.
4. If a candidate is taken everywhere, go to the next; **do not** add numbers (looks like a bot), do not
   buy handles from third parties (ToS/trademark risk), do not create a near-identical variant that
   could be mistaken for the existing owners’ account.

| Priority | Candidate handle | Fits | Why |
|---|---|---|---|
| 1 | `playmanhunt` | 12 chars | Action-first, product-like, low impersonation risk |
| 2 | `manhuntgame` | 12 | Category-clear; may be taken by other games — check |
| 3 | `manhuntandroid` | 15 | Exact X limit; platform-specific but honest |
| 4 | `manhunt_apk` | 12 | Sideload-honest, niche but unambiguous |
| 5 | `manhuntpickup` | 14 | Brand-direction aligned (PICKUP), still change-tolerant |
| 6 | `realworldhideandseek` | 21 | Fallback if every ManHunt string is taken; descriptive but long |

Display name (all platforms): **ManHunt** — optionally `ManHunt — real-world hide-and-seek` where the
field allows ~40 chars. Never `ManHunt Official` (implies a claim the owner hasn't established).

### 1.3 Profile assets — use the approved identity kit

All assets come from `design/brand/identity/final/`. No new design work; just export/crop.

| Asset | Source | Export | Rules |
|---|---|---|---|
| Avatar (all platforms) | `install/app-icon.svg` (108 dp field square) | 400×400 PNG | Mark on field `#0B1220`; circular-crop safe (mark sits inside the 66 dp safe circle); no text, no slogan |
| X / Twitter header | `lockup/lockup-horizontal-light-on-dark.svg` | 1500×500 PNG | Lockup left or centred, field background, one chalk rule; keep the lockup clear space empty; content within the central ~1050×350 |
| YouTube channel banner | same horizontal lockup | 2048×1152 PNG | Safe area 1546×423; mark + wordmark + one line of copy max |
| Discord profile/banner | `install/app-icon.svg` + horizontal lockup | 400×400 avatar; 960×540 banner | Same rules; banner can carry the descriptor line |
| Reddit profile banner | horizontal lockup | 1600×400 PNG | Same rules; no slogan inside lockup clear space |
| GitHub social preview | `install/og-image-1200x630.png` (already exists) | 1280×640 preferred re-export or use OG | Settings → Social preview; do not stretch (set dimensions if using OG) |
| Link-preview (OG) | `install/og-image-1200x630.png` | 1200×630 | Needs **absolute** URL on the deployed install page; integration is an owner/server pass (`install/README.md`) |

Export these five files once and keep them in one folder the owner controls (e.g.
`design/brand/identity/final/social/` — create it in the identity workstream, not here). Profile copy
that may appear in headers must be **factual** until slogan v2 is approved: “Real-world hide-and-seek
for Android · Free APK, 2 MB · Android 8+ · not on Google Play”.

---

## 2. Account setup checklist (per platform)

Do them in this order (GitHub first — it already exists; then X → YouTube → TikTok → Instagram → Reddit
→ Discord). Record every handle in the tracker at the end of §7.

### 2.1 TikTok
- [ ] Account created with the owner’s email; phone verification complete; 2FA on.
- [ ] **Business Account** (free) registered → clickable website link in bio from day 1 (personal accounts
      need 1,000+ followers for a link). Trade-off: Business accounts use only the Commercial Music Library —
      irrelevant here because all audio is original/synthesised (`captions.md` §4).
- [ ] Avatar 400×400; bio ≤ 80 chars; link = tagged install page (§5 UTM); pinned comment draft with
      “free APK · Android 8+ · not on Play Store · 74.208.99.178”.
- [ ] Settings: allow downloads (shares help), comments on, duet/stitch on (content can be stitched by
      others — free reach), auto-captions off (captions are burned in).
- [ ] Upload path: 9:16 MP4, 15 s / 30 s / 60 s cuts; cover chosen per post; no watermark.

### 2.2 Instagram (Reels)
- [ ] Account created; professional/creator mode optional (free; unlocks insights) — recommended.
- [ ] Avatar 400×400; bio ≤ 150 chars; one link in bio (or up to 5 if available), tagged install page.
- [ ] Reels upload 9:16 MP4; covers exported per hook variant; keep text inside the safe area
      (bottom ~35% covered by UI, right side ~15%).
- [ ] Story: optional repost of the Reel with a link sticker (only if available).
- [ ] No copyrighted music; use the video’s original audio track.

### 2.3 YouTube (Shorts)
- [ ] Channel created (same Google account as the owner; don’t mix personal channel history if avoidable —
      a brand channel is cleaner). Handle claimed; 2FA.
- [ ] Avatar 400×400; banner 2048×1152; channel description ≤ 1000 chars with the honest install path and
      the tagged URL (description links are visible; Shorts links are not reliably clickable — treat Shorts
      as awareness + search).
- [ ] Upload 60 s explainer as a Short (vertical, ≤ 3 min), 30 s / 15 s as Shorts too; title = hook variant,
      description = 2–3 lines + URL + hashtags; pinned comment with the APK disclosure.
- [ ] Optional: a “full explainer” unlisted? No — keep it simple, Shorts only for 14 days.

### 2.4 X / Twitter
- [ ] Account created; 2FA; display name + avatar; bio ≤ 160 chars with the honest install path and the
      tagged link (X allows a bio link).
- [ ] Header 1500×500.
- [ ] Video: 60 s MP4 native (fits the free video limit comfortably); GIF ≤ 8 MB 1080×1080 as fallback —
      verify current GIF limits at posting time.
- [ ] Long-form threads: 3–4 posts max; every thread’s first post stands alone; link in the last post.

### 2.5 Discord
- [ ] Account created (or use the owner’s existing personal account — do **not** create a bot account to
      impersonate a brand). Avatar + About me (≤ 190 chars) + a website field if available.
- [ ] **No server is required to start.** The play is joining existing communities where promotion is
      allowed (university gaming clubs, board-game cafés, outdoor groups, Android/dev servers): lurk ≥ 3 days,
      read rules, then ask an admin once with the template in §5.6.
- [ ] File limits: free uploads are ~10 MB — the 15 s MP4/GIF fits, the 60 s may not; share a YouTube/install
      link in that case. Never DM strangers download links.

### 2.6 Reddit
- [ ] Account created (use a real, identifiable developer profile — disclosure is the strategy here);
      avatar 400×400; profile description ≤ 200 chars; add the honest developer line.
- [ ] Check each subreddit’s rules before posting (self-promo rules, flair, minimum account age/karma).
- [ ] Post plan (one post per community per 14 days): r/AndroidGaming (day 3), r/playmygame (day 5),
      r/sideloaded (day 8) — only if rules allow. No standalone posts in r/Android, r/gaming, r/games,
      r/hideandseek (verify rules) during the first 14 days.
- [ ] Format: native 30 s/60 s video (or YouTube link) + dev disclosure first line + honest limitations list
      + one specific feedback ask (§5.5).

### 2.7 GitHub (existing repo — configure, don’t recreate)
- [ ] Repo description one-liner: “Real-world GPS hide-and-seek for Android — free, MIT, self-hostable”.
- [ ] Homepage `http://74.208.99.178/?utm_source=github&utm_medium=referral&utm_campaign=launch-v5`.
- [ ] Topics: android, kotlin, jetpack-compose, gps, hide-and-seek, nodejs, fastify, websocket, self-hosted, game.
- [ ] Social preview image (1280×640 or the OG card); README hero GIF (≤ 8 MB); release note for v0.13.x
      linking the install page and the 60 s explainer.
- [ ] Issue template / Discussions: owner choice; if enabled, invite feedback in the README.

**Account prerequisites / gotchas:** an email the owner controls; phone verification may be required
(TikTok/Instagram/YouTube); recovery codes stored offline; do not create multiple accounts per platform
(ban risk); do not use VPN/region tricks; complete each platform’s “brand/business” info honestly.

---

## 3. Cuts, filenames, and the posting contract

**Expected v5 deliverables** (canonical names — confirm/replace once the v5 export lands):

| Cut | Expected file | Spec | Use |
|---|---|---|---|
| 60 s explainer | `design/social/motion/out/v5/manhunt_explainer_60s_1080x1920.mp4` | 1080×1920, 9:16, H.264 + AAC, 60.0 s | YouTube Shorts (primary), X, TikTok test (day 5), Reddit dev post |
| 30 s cut | `.../manhunt_cut_30s_1080x1920.mp4` | 1080×1920, 30.0 s | Reels/TikTok/Shorts mid-funnel, Reddit |
| 15 s cut | `.../manhunt_cut_15s_1080x1920.mp4` | 1080×1920, 15.0 s | The default first post everywhere (best completion rate) |
| 15 s A/B variant | `.../manhunt_cut_15s_snitch_1080x1920.mp4` | “Your phone is a snitch.” treatment, if rendered | Hook A/B from day 3; TikTok/Reels only |
| GIF | `.../manhunt_cutdown_1080x1080_loop.gif` | 1080×1080, 5–8 s, ≤ 8 MB, loop-safe | X/Reddit/Discord/GitHub README |
| Covers | `.../covers/manhunt_cover_{tiktok,reels,shorts}_1080x1920.png` | 1080×1920 | One cover per post/hook variant |
| Poster / OG | `.../manhunt_poster_1080x1920.png`, `final/install/og-image-1200x630.png` | as existing | Profile/announcement, install-page OG |

**Posting contract (all platforms):**
- Find the **v5 QA frames first** (`out/v5/qa/` if present): first frame, hook frame, end card, phone-390
  previews. If QA is missing or a frame shows the rejected v1 slogan on the cover → **stop** and get it
  fixed (§8 R2).
- Upload the **clean master** — never a platform-watermarked download. Export per-platform covers.
- Every description/caption carries: the honest install path (`Free sideload APK · Android 8+ · not on
  Google Play`), the URL or “link in bio”, and “Play with people you trust.” on any first-contact post.
- No OSM attribution needed in v4/v5 (no OSM data on screen; original map geometry). If tiles return,
  “© OpenStreetMap contributors” returns with them.
- No real people in v5 → no consent form needed for this asset; if the owner later adds gameplay footage,
  written consent + location blur are mandatory before it ships.
- Disclosure lines: `Free APK, sideload — not on Google Play.` / `Original synthesised audio.` /
  `No real people or user footage; all on-screen geometry is original.`

**Cross-posting order and variation rules (why it must not look identical everywhere):**

1. **TikTok first** (the discovery engine) → **Instagram Reels** 2–4 h later with a different cover and a
   shorter caption → **YouTube Shorts** next morning with a title-hook and search-friendly description →
   **X** same day (native video or GIF, thread) → **Reddit/Discord/GitHub** on their own cadence days.
2. Vary the first frame/cover, the caption’s first line, and the CTA per platform. Posting the same file
   with the same caption everywhere on the same hour reads as syndicated spam to users and to some
   ranking systems.
3. Do not post more than **2 platform posts per day** in week 1 (plus same-day cross-posts of the same
   video). One operator, and the comment replies matter more than volume.
4. Weekend content is the priority: the game is played at weekends, so Friday–Sunday posts carry the
   “play tonight / this weekend” CTA.

---

## 4. 14-day posting matrix

Assumptions: start day 0 on Sunday 2026-11-01 (setup only), post day 1 = Monday 2026-11-02 → day 14 =
Sunday 2026-11-15. Caption IDs refer to §5. Times are hypotheses (owner timezone assumed UTC+2; shift if
the owner/audience is elsewhere) — pick two windows and let day-7 data choose. Platform windows:
TikTok/Reels **18:00–21:00 local**; Shorts **15:00–18:00 UTC** or next-morning upload; X **12:00–15:00
UTC**; Reddit **14:00–16:00 UTC**; Discord **evening, when the server is active**.

### Week 1 (days 0–7)

| Day | TikTok | Instagram Reels | YouTube Shorts | X / Twitter | Reddit · Discord · GitHub |
|---|---|---|---|---|---|
| 0 (Sun) | — | — | — | — | **Setup only:** cases §2, profile assets, handles, bios, links, baseline snapshot; GitHub repo description/topics/homepage/social preview |
| 1 (Mon) | **15 s** · HUNTING · CAP-T1 · CTA “send to group chat” | **15 s** · HUNTING · CAP-I1 · cover B | **15 s** · HUNTING · title T1 · description with URL | **GIF** + 2-post thread: “Your friends are hunting you. The map is the game.” | GitHub: README hero GIF + install link; Reddit: lurk/comment helpfully only |
| 2 (Tue) | **30 s** · HUNTING · CAP-T2 | **30 s** · HUNTING · CAP-I2 | **60 s explainer** · title T2 (search: real-world hide and seek app) | **60 s** native video + one-line context | Discord: lurk/identify 1–2 servers, read rules |
| 3 (Wed) | **15 s SNITCH** variant (A/B) · CAP-T3 | **15 s** · CAP-I3 · different first frame | **30 s** · title T3 | Thread: 4 posts on how a hunt works, GIF frame each, link last | **Reddit r/AndroidGaming** dev post (60 s native, disclosure, limitations, feedback ask) |
| 4 (Thu) | **60 s** · HUNTING · CAP-T4 (first long test) | **60 s** · HUNTING · CAP-I4 | **15 s** · title T4 | **GIF** + “bet you can’t hide” comment-bait | — |
| 5 (Fri) | **15 s** · HUNTING · CAP-T5 · weekend CTA | **15 s** · weekend CTA · CAP-I5 | **30 s** · weekend CTA | **30 s** native + poll (“who wins, Prey or Hunters?”) | **Reddit r/playmygame** post (30 s + one specific feedback ask) |
| 6 (Sat) | **30 s** · SNITCH/HUNTING best · CAP-T6 | **30 s** · CAP-I6 | **15 s** · weekend CTA | **GIF** + “tonight: pick a park, split teams” | **Discord:** admin-approved post in one server (15 s/GIF + live answers, §5.6) |
| 7 (Sun) | **15 s** best hook · CAP-T7 | **15 s** · CAP-I7 | **15 s** · recap-style title | Thread: honest week-1 numbers from the install page + what I learned | GitHub release note (if a release exists) · **DAY-7 GATE (§6.4)** |

### Week 2 (days 8–14)

| Day | TikTok | Instagram Reels | YouTube Shorts | X / Twitter | Reddit · Discord · GitHub |
|---|---|---|---|---|---|
| 8 (Mon) | **best-performing cut** (scale) · CAP-T8 | **60 s** · CAP-I8 | **60 s** explainer · title T5 (search) | **60 s** native video | **Reddit r/sideloaded** (only if rules allow): honest “not on Play Store” angle, 15 s + APK disclosure |
| 9 (Tue) | **15 s** BET hook · CAP-T9 (comment engine) | **15 s** · CAP-I9 | **30 s** · T6 | **GIF** + one-line + link in reply | Discord: second server / propose a game night (§5.6) |
| 10 (Wed) | **60 s** (only if day-4 60 s held; else 30 s) | **30 s** · CAP-I10 | **15 s** | Thread: “why the server keeps the clock” dev cut | Reddit: reply on r/AndroidGaming weekly thread if one exists (rules) |
| 11 (Thu) | **15 s Arabic-caption post** (if Arabic audience) · CAP-T11-AR | **15 s Arabic** · CAP-I11-AR | **30 s** · T7 | **Arabic post** (hook + install line) | Discord: Arabic-speaking server if one is identified and rules allow |
| 12 (Fri) | **30 s** · weekend plan · CAP-T12 | **60 s** · CAP-I12 | **60 s** · T8 | **GIF** + “tonight” CTA | GitHub: README update with 60 s link + feedback issue |
| 13 (Sat) | **15 s** · weekend CTA · CAP-T13 | **15 s** · CAP-I13 | **15 s** · weekend CTA | **15 s** native + “play tonight” | Discord: game-night reminder in approved server(s) |
| 14 (Sun) | **60 s devlog/recap** (honest numbers) · CAP-T14 | **15 s** · CAP-I14 | **60 s** recap · T9 | Thread: 14-day recap + roadmap honesty | GitHub release/README; **DAY-14 review** (§6.5) |

**Matrix rules**
- Never two identical-looking posts on the same platform in one day.
- TikTok 60 s is tested once (day 4) and repeated only if completion-rate holds; otherwise stay ≤ 30 s.
- If v5 lands late, the matrix compresses: skip day 4/5 TikTok long tests, keep 15 s first-post pattern and
  move 60 s to YouTube/X/Reddit only (where long-form is expected).
- The A/B variant (SNITCH) appears on days 3/6/9; keep everything else identical so the hook is the only
  variable.
- Community platforms (Reddit/Discord/GitHub) follow their own rules and cadence; the matrix is a ceiling,
  not a quota. If a community says no, skip it — do not re-post.

---

## 5. Per-platform caption pack (not one caption recycled)

Hook lines are v2 (`script-v2.md`/`slogan-v2.md`; owner approval pending — see §8 R3). If v2 is not
approved at posting time, use the factual descriptor line: “Real-world hide-and-seek for Android. Free APK,
2 MB, Android 8+ — not on Google Play.” Every caption below includes the honest install path.

### 5.1 TikTok (short, punchy, ≤ 5 hashtags; captions must survive truncation)
- **CAP-T1** `Your friends are hunting you. One of you is the prey, the map does the rest. Free sideload APK, Android 8+, not on Google Play — link in bio. 2+ phones.`
  `#hideandseek #gpsgame #androidgame #outdoorgames`
- **CAP-T2** `The group chat has a map now. Two teams, one clock, one live map. Free APK (not Play Store) — link in bio. Bring 2+ phones.`
- **CAP-T3** `Your phone is a snitch. It tells the other team where you are — that’s the game. Free sideload APK, Android 8+, not on Google Play.`
- **CAP-T4** `60 seconds on how a hunt works: create a room, send the 6-character code, hide, get tracked. Free APK, Android 8+, not on Play Store — link in bio.`
- **CAP-T5** `Weekend plan: pick a place you’re allowed to be, split teams, start at 8. Free sideload APK — Android 8+, not on Google Play.`
- **CAP-T6** `Tagging is physical. The clock is the server’s. The map is the only referee you can’t argue with. Free APK for Android — link in bio.`
- **CAP-T7** `One week, honest numbers: [show the install-page counts, labelled “includes test accounts”]. The game needs people in one place — bring 3. Free APK, not on Play Store.`
- **CAP-T8** `The cut everyone actually watched. Real-world hide and seek, two teams on one live map. Free sideload APK, Android 8+, not on Google Play — link in bio.`
- **CAP-T9** `Bet you can’t hide. You have 2+ phones to prove it. Free APK, Android 8+, not on Play Store — link in bio.`
- **CAP-T11-AR** (Egyptian) `أصحابك بيطاردوك. واحد فيكم هو الفريسة، والخريطة معاهم. APK مجاني، أندرويد 8+، مش على Google Play — اللينك في البايو. محتاج موبايلين.`
- **CAP-T12** `It’s Friday. Nobody in your group has a plan. Fix that with a map, a clock and a 6-character code. Free sideload APK, Android 8+, not on Google Play.`
- **CAP-T13** `Tonight: two teams, one park, one clock. Free APK for Android 8+, sideload — not on Google Play — link in bio.`
- **CAP-T14** `14 days. [real numbers from the install page, labelled]. What I learned: a view is not a player — a room with 2+ people is. Free APK, not Play Store, link in bio.`

### 5.2 Instagram Reels (2–3 lines, 3–5 hashtags, line break before the link line)
- **CAP-I1** `Your friends are hunting you. Two teams, one live map, one clock — played on your own streets.
Free sideload APK · Android 8+ · not on Google Play → link in bio.`
- **CAP-I2** `The hiding has a tracker. Prey hide, Hunters watch the map and tag them in person.
Free APK for Android (not Play Store) → link in bio. Play with people you trust.`
- **CAP-I3** `One of you is the prey. Your phone reports your position to the other team. That’s the game.
Free sideload APK, Android 8+ → link in bio. 2+ phones, one room code.`
- **CAP-I4** `60 seconds on how ManHunt works: host a hunt, send the code, hide, get found.
Free APK, Android 8+, not on Google Play → link in bio.`
- **CAP-I5** `Weekend plan, sorted. Pick a park, split into Prey and Hunters, start at 8.
Free sideload APK for Android, not on the Play Store → link in bio.`
- **CAP-I6** `The server keeps the clock and the tags. Your friends keep the drama.
Free APK, Android 8+, sideload → link in bio.`
- **CAP-I7** `Week one, honest recap: [numbers]. Most people need one friend with an Android phone to try it.
Free sideload APK, not on Google Play → link in bio.`
- **CAP-I8** `Maybe the simplest way to get a group outside: hide, track, tag. That’s it.
Free APK · Android 8+ · not on Play Store → link in bio.`
- **CAP-I9** `Your phone knows where you are. This game makes that the point.
Free sideload APK, Android 8+ → link in bio. Play in places you’re allowed to be.`
- **CAP-I10** `Two teams. One live map. One clock that nobody can argue with.
Free APK, Android 8+, not on Google Play → link in bio.`
- **CAP-I11-AR** (Egyptian) `أصحابك بيطاردوك. لعبة استغماية بالـ GPS، فريقين وخريطة وساعة.
APK مجاني لأندرويد 8+، مش على Google Play — اللينك في البايو.`
- **CAP-I12** `Friday night, no plan: create a hunt, send the code, hide. Free sideload APK for Android —
not on Google Play → link in bio.`
- **CAP-I13** `Tag them in person. Confirm or dispute in the app. The server calls it.
Free APK, Android 8+, not on Play Store → link in bio.`
- **CAP-I14** `14 days, [numbers]. If you want to try it: 2+ Android phones, one public place, one room code.
Free sideload APK (not on Google Play) → link in bio.`

### 5.3 YouTube Shorts (title = hook; description = 2 lines + URL + tags)
- **Title T1** `Your friends are hunting you (real-world hide and seek, Android)`
  **Description** `Real-world GPS hide-and-seek for Android: Prey hide, Hunters follow a live map and tag them in person. Free sideload APK, 2 MB, Android 8+, not on Google Play: http://74.208.99.178/?utm_source=youtube&utm_medium=social&utm_campaign=launch-v5&utm_content=t1 #hideandseek #androidgame`
- **Title T2** `How a real-world GPS hide-and-seek game works in 60 seconds`
  **Description** `60-second explainer of ManHunt — two teams, one live map, one server clock. Free APK, Android 8+, not on the Play Store: [tagged URL]`
- **Title T3** `Your phone is a snitch (hide and seek, but tracked)`
  **Description** `The fun part: your own phone gives you away. Free sideload APK for Android 8+: [tagged URL] · not on Google Play.`
- **Title T4** `hide and seek but your phone reports your position`
  **Description** `Prey hide, Hunters track on a live map, tag with a touch. Free APK (sideload) → [tagged URL]`
- **Title T5** `real-world hide and seek — the 60-second version`
  **Description** `Two teams, one clock, one live map. Free Android APK, not on Google Play: [tagged URL]`
- **Title T6** `the map is the referee (real-world hide and seek)`
- **Title T7** `you need 2 phones to play this (real-world hide and seek)`
- **Title T8** `what a real-world hunt looks like on the map`
- **Title T9** `14 days of posting my GPS hide-and-seek game — honest numbers`
  (Long titles get truncated in some surfaces — keep the hook in the first 40 characters.)

### 5.4 X / Twitter (threads: first post stands alone; link in the last post)
- **X1 (GIF launch)** `Your friends are hunting you. Real-world hide-and-seek for Android: two teams, one live map, one server clock.
Free sideload APK, 2 MB, Android 8+ — not on Google Play: 74.208.99.178`
- **X2 (60 s)** `The 60-second explainer. Prey hide, Hunters track the live map, tag by touching them in person, the server keeps the clock and the calls.
Free APK, Android 8+, not on Play Store → 74.208.99.178`
- **X3 (thread)** `How a hunt works: 1) host creates a room, 2) everyone joins with a 6-character code, 3) pick Prey or Hunters, 4) the huntmaster starts the head start, 5) Prey hide and their phones report position, 6) Hunters watch the map and tag in person. Free APK (not on Google Play): 74.208.99.178`
- **X4 (week-1 honest)** `One week of posting ManHunt. Numbers, including tests: [install-page counts]. What worked: short hook, real map. What didn’t: long cuts without context. Free APK, Android 8+, not on Play Store.`
- **X5 (dev/fairness)** `The server owns the clock, the teams and the tag; a tag needs the Prey’s confirmation, a dispute goes to the huntmaster. No phone can fake it. Source: github.com/MostafaAshry513/ManHunt — free APK at 74.208.99.178 (sideload, Android 8+, not on Play Store).`
- **X6 (Arabic)** `أصحابك بيطاردوك. لعبة استغماية حقيقية على أندرويد: فريقين وخريطة وساعة. APK مجاني، أندرويد 8+، مش على Google Play — 74.208.99.178`

### 5.5 Reddit (dev disclosure first; one post per community; no link-only posts)
- **r/AndroidGaming (day 3)** title: `[Dev] I built a real-world GPS hide-and-seek game for Android — free, open source, not on the Play Store`
  body: disclosure first line; what it is (Prey hide, Hunters track a live map, tag by touch, server-authoritative clock/tags); 60 s video; honest limitations (Android only, sideload, test server over plain HTTP, 2+ phones, field battery unverified); one clear ask (“what’s confusing about the install or the first hunt?”); source link; APK link with UTM.
- **r/playmygame (day 5)** title: `Real-world hide and seek with a live map — looking for feedback on the first-hunt flow`
  body: same disclosure, focused on the feedback ask; 30 s video; invite to comment.
- **r/sideloaded (day 8, only if rules allow)** title: `[Dev] Free sideloaded Android game — real-world hide and seek, MIT source, signed APK with SHA-256`
  body: sideload specifics (signed release, SHA-256 on the install page, source, no email, ~2 MB), what to expect, limitations. No hype.
- **Arabic Reddit** only if a rules-allowing Arabic sub is identified; otherwise skip.

### 5.6 Discord (two templates; only after rules + admin permission)
- **Admin pitch:** “Hi — I’m the developer of ManHunt, a free open-source Android game: real-world hide-and-seek where phones report position and two teams track each other on a live map. It needs a group in one place, so it suits a game-night slot. I’m not selling anything and I’m not asking to post links: if you’d like, I can share a 2-minute demo and answer questions in a channel, and if people are interested we can set up a game night. Totally fine to say no.”
- **Approved-channel post:** 15 s clip or GIF + “free sideload APK, Android 8+, not on Google Play — 74.208.99.178; play with people you trust; happy to answer anything about how the tag/clock works.”
- Never cold-DM download links; never @everyone; never post the same message across servers in one day.

### 5.7 GitHub
- **README lead-in:** `Real-world GPS hide-and-seek for Android. Prey hide; their phones report position; Hunters follow a live map and tag them in person. Free signed APK (~2 MB, Android 8+, not on Google Play): http://74.208.99.178/ · 60 s explainer: [YouTube link]`
- **Release note (if a release is cut):** short, honest bullets: what changed, install link + SHA-256, the 60 s explainer, and the limitations that still apply (test server, no zone enforcement, Android only).

---

## 6. Measurement plan

### 6.1 What to record per post (2 minutes/day)

| Field | Where | Why |
|---|---|---|
| Views, 3 s hold %, avg watch %, full-watch % | Platform analytics (TikTok/IG/YT/X native) | Hook and cut performance |
| Likes, comments, shares, saves | Platform analytics | Shares/saves = the real social signal for a group game |
| Profile visits / link clicks | Platform analytics (TikTok business, IG insights, X analytics, YT) | Intent |
| Tagged install-page visits | `logs/server.out.log` filtered by `utm_campaign=launch-v5` (`measure-log.ps1 -Campaign launch-v5`) | The campaign's cleanest visit signal |
| `/app.apk` requests | Same log (directional — includes in-app updates) | Install intent, with caveats |
| Accounts created (total + this week) | Live install page counters (`http://74.208.99.178/`) | Activation |
| Rooms with 2+ members, matches started/finished, tags | Read-only DB query (`launch-playbook.md` §7) | The only real success metric |
| GitHub views/clones/referrers | GitHub → Insights → Traffic (14-day rolling) | Developer channel |
| Reddit: upvotes, comments, click-throughs if available | Reddit post analytics | Community quality |

### 6.2 UTM convention for this rollout

```
http://74.208.99.178/?utm_source=<platform>&utm_medium=<social|community|referral>&utm_campaign=launch-v5&utm_content=<cut-or-post>
```

| Placement | Example |
|---|---|
| TikTok bio | `?utm_source=tiktok&utm_medium=social&utm_campaign=launch-v5&utm_content=profile` |
| Instagram bio | `?utm_source=instagram&utm_medium=social&utm_campaign=launch-v5&utm_content=profile` |
| YouTube description | `?utm_source=youtube&utm_medium=social&utm_campaign=launch-v5&utm_content=t1` (per video: t1…t9) |
| X posts | `?utm_source=x&utm_medium=social&utm_campaign=launch-v5&utm_content=x1` |
| Reddit post body | `?utm_source=reddit&utm_medium=community&utm_campaign=launch-v5&utm_content=androidgaming` |
| Discord | `?utm_source=discord&utm_medium=community&utm_campaign=launch-v5&utm_content=<server-slug>` |
| GitHub README/release | `?utm_source=github&utm_medium=referral&utm_campaign=launch-v5&utm_content=readme` |

Rules: lowercase, hyphenated, one `utm_content` per surface; never change `utm_campaign` mid-flight; add
`utm_content=-snitch` for the A/B variant so hook comparisons are measurable.

### 6.3 Daily snapshot template (copy into a note/sheet)

| Date | Platform | Cut | Hook | Views | 3 s hold | Shares | Saves | Profile visits | Tagged visits | APK req | Accounts | Rooms 2+ | Matches | Note |
|---|---|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|---|
| | | | | | | | | | | | | | | |

**Honesty rules:** label test accounts; report tagged visits as a floor (scanner noise, no attribution IDs,
no cookies); never present raw install-page hits as “visits”; the plain-HTTP test server has no analytics
beyond the log; cross-platform views double-count the same people.

### 6.4 Day-7 gate (organic) and optional paid gate

**Organic gate — apply to each cut/platform after day 7:**

| Signal | Scale | Hold / change | Kill |
|---|---|---|---|
| 3 s hold | ≥ 1.5× the account median | 0.7–1.5× median | < 0.7× median on 2 posts |
| Shares + saves | ≥ 1% of views | 0.3–1% | ~0% on 3 posts |
| Tagged install-page visits | ≥ 3 from this platform | 1–2 | 0 |
| New accounts / matches | ≥ 1 campaign account or 1 room 2+ | — | 0 after 7 days |

**Actions:** scale = make that cut/hook the default for the next 7 days (more posts, same edit); hold =
keep cadence, change only the first frame/caption; kill = stop posting that cut/platform pattern (Shorts
and GitHub keep long-tail value even at low views — don’t kill the *repo*, kill the *posting cadence*).

**Optional paid (not executed by this workstream; owner-only, after the day-7 gate):**
- Only if organic shows a working hook (≥1.5× median 3 s hold **and** ≥3 tagged visits).
- Cap **$50–100 total** for the first test; one platform; objective = traffic/website (app-install campaigns
  are unavailable — the app is not on Google Play).
- Use the winning organic cut; target 18–30, gaming/outdoor interests; keep the `not on Play Store` line in
  the ad text.
- **Kill rule:** $25 spent with zero tagged install-page visits → stop. No exception.

### 6.5 Day-14 review
- Which platform/cut produced the only thing that matters — a room with 2+ people that started a match?
- Keep the top two platform posts/week; retire the rest. Keep TikTok+Reels; Shorts as search presence;
  X/GitHub for dev credibility; Reddit/Discord only where invited.
- Write the honest numbers into `hooks-v2.md`/playbook appendices; do not claim “growth” from views.

---

## 7. One-sitting execution sequence (owner, ~2.5–3.5 h)

Block the time; do it on day 0 and post nothing until Phase E verifies.

### Phase A — prep offline (≈35 min)
1. [ ] Collect the v5 cuts + covers + GIF into one folder; confirm filenames/sizes; open one frame per cut and
       check the **cover does not show the rejected v1 slogan**.
2. [ ] Export the five profile assets from `design/brand/identity/final/` at the sizes in §1.3 (avatar 400,
       X header 1500×500, YouTube banner 2048×1152, Discord banner 960×540, Reddit banner 1600×400).
3. [ ] Write the bios (§1.4 / platform checklist) and the first six captions into a notes file you can paste.
4. [ ] Build the UTM link list (§6.2) in the same notes file.
5. [ ] Baseline snapshot: install-page numbers, DB funnel query, GitHub traffic screenshot, current log copy.

### Phase B — handles + accounts (≈75 min)
6. [ ] Handle availability sweep (§1.2) — record the winner or fallback per platform.
7. [ ] GitHub: repo description/topics/homepage/social preview/README GIF (no new account).
8. [ ] Create in this order: **X → YouTube → TikTok → Instagram → Reddit → Discord** (each: avatar, display
       name, bio, link, 2FA + recovery codes saved offline).
9. [ ] TikTok: register the **Business Account** (clickable bio link); same for YouTube/IG if prompted.
10. [ ] Record every handle/URL in the tracker below; stop before posting.

### Phase C — profiles + drafts (≈45 min)
11. [ ] Upload avatar + header on every platform; verify text legibility on a phone.
12. [ ] Paste bios + UTM links; pin the install comment where available.
13. [ ] Upload day-1 drafts: TikTok 15 s draft, Reels 15 s draft, Shorts 15 s scheduled/private, X GIF saved,
        GitHub README updated; Reddit/Discord just follow/lurk (no posts on day 0).
14. [ ] Confirm covers/variants differ per platform (no identical first frame everywhere).

### Phase D — verify on a real phone (≈15 min)
15. [ ] Open every bio link on an Android phone: install page loads; APK download works; SHA-256 visible.
16. [ ] Play the 60 s/30 s/15 s cuts on the phone at 1× — text legible, no clipping, install line readable.
17. [ ] Check link unfurls (OG image) — if bare, note it and continue (OG integration is a pending owner/server pass).

### Phase E — start the rhythm (≈10 min)
18. [ ] Snapshot the baseline one more time; start the daily 2-minute record.
19. [ ] Post day 1 (TikTok first, then Reels 2–4 h later, Shorts next morning, X same day).
20. [ ] For 60 minutes after each post: reply to every comment honestly; never paste the link repeatedly.

**Daily operator routine (15–30 min/day):** check pinned links on a phone → post the day’s cut in platform
order → reply to comments → log the numbers → note the most common question (it becomes the next caption).

### Handle/link tracker (fill during Phase B)

| Platform | Handle | Display name | Bio live? | Link + UTM | Avatar/header | 2FA saved |
|---|---|---|---|---|---|---|
| TikTok | | | | | | |
| Instagram | | | | | | |
| YouTube | | | | | | |
| X | | | | | | |
| Reddit | | | | | | |
| Discord | | | | | | |
| GitHub | (existing) | | | | | |

---

## 8. What NOT to do (and the risks that make it matter)

**Spam / integrity**
- No buying followers, views, likes, saves or comments; no engagement pods, comment rings or vote brigades.
- No fake accounts, sockpuppets, “player” impersonation or astroturfing — Reddit/HN/Discord will find it and
  it destroys the only asset a hobby project has.
- No unsolicited DMs with download links; no mass Discord joins; no @everyone; no reposting the same message
  across servers/subreddits in one day; no creating multiple accounts to cross-promote.
- No auto-DM tools, no bots, no scraped emails, no bought handles or “guaranteed growth” services.

**Claims / legal**
- No safety, rescue, privacy, encryption or “secure” promises; the hosted server is a plain-HTTP test server.
- Never imply Google Play/App Store presence; never claim “free forever”; no fake player counts,
  testimonials, reviews, awards, urgency or countdowns.
- No Take-Two/Rockstar/other-brand assets or names; no “official” unless the owner establishes it; no ™/®;
  don’t use the rejected v1 slogan anywhere.
- No copyrighted music (business accounts are limited to the Commercial Music Library; the shipped film uses
  original synthesised audio — keep it).
- No fixed hunt length or distance claims; the clock is host-set (default 60 min). No OSM tiles on screen in
  v4/v5, so no attribution needed — if tiles return, “© OpenStreetMap contributors” returns.
- No real people/consent issues in v5 (pure animation); any future gameplay footage needs written consent and
  location blur (no house numbers, plates, schools, minors).
- No posting to minor-heavy communities; no night/isolated-place imagery; no trespassing framing.
- No paid spend before the day-7 gate; no app-install ad formats (unavailable — not on a store).
- Don’t post identical files with identical captions to all 7 platforms at the same hour; don’t repost a
  watermarked download; don’t put a URL in a community title; don’t link APK mirrors or aggregators.

---

## 9. Risks, dependencies, and honest notes

| # | Risk / dependency | Effect | Mitigation |
|---|---|---|---|
| R1 | **v5 explainer not on disk at time of writing** (only v4-preview exists) | Matrix can’t be executed until cuts exist | Use v4-preview 15 s as the day-1 fallback; confirm v5 filenames + QA frames in Phase A; if v5 is missing on day 1, post v4 15 s and add v5 when it lands. |
| R2 | **Stale v1 slogan on the v4 cover** (and possibly the v5 cover) — the owner rejected “No gear. No fee. Just players.” | Shipping it contradicts the owner’s decision and the v2 copy | Re-render covers with v2 lines before any post; check the cover frame in Phase A; also update `design/brand/identity/final/README.md`, `LOCKUP.md` §5 and `motion/captions.md` note 32 which still reference the v1 slogan. |
| R3 | **Slogan v2 not owner-approved yet** | Profiles/posts could use unapproved copy | Use the factual descriptor in bios/headers until approval; run v2 campaign lines in video/posts only after sign-off; keep approvals in writing. |
| R4 | **MANHUNT name/trademark collateral** (Take-Two class; existing “Manhunt: Hide & Seek”) | Handle rejection, impersonation claims, stranded accounts if renamed | Test handles first; avoid `@manhunt`; no “official”; change-tolerant handles; no permanent print/merch; keep the rename option open. |
| R5 | **No OG image/favicon on the install page yet** (identity assets delivered, server integration pending) | Shared links unfurl bare; lower click trust | Note in Phase D; owner/server pass to add `og:image` (absolute URL) + favicons; keep OG asset 1200×630. |
| R6 | **Plain HTTP test server** | Some platforms/browsers warn; users may distrust | Say it plainly in bios/pinned comments; don’t call it secure; long-term fix is TLS/domain. |
| R7 | **One operator, 7 platforms** | Burnout; thin replies; identical posting | Cap at 2 platform posts/day + cross-posts; 15–30 min/day; skip communities that say no; matrix is a ceiling. |
| R8 | **New-account reach is small** (median first posts ~100–500 views, luck-driven outliers) | Low install numbers in 14 days | Judge on tagged visits/accounts/matches; gate at day 7; do not buy reach. |
| R9 | **Arabic assets not rendered** (Arabic on-screen cut not in v5 scope) | Arabic captions only on some posts | Use Arabic captions on days 11 with the English video; full RTL cut is a later deliverable; native review required. |
| R10 | **Platform rules change** (link-in-bio thresholds, GIF limits, self-promo rules) | Plan breaks silently | Re-verify each platform’s current rules during Phase A; keep fallbacks (pinned comment, plain URL, QR). |

---

## 10. Definition of done for this rollout

- [ ] 7 accounts created (or documented as unavailable + fallback), handles recorded, 2FA saved.
- [ ] Profiles complete: avatar, display name, bio, tagged link, header where applicable.
- [ ] GitHub configured (description, topics, homepage with UTM, social preview, README GIF).
- [ ] v5 cuts + covers + GIF confirmed on disk and QA’d (no rejected slogan on any cover).
- [ ] Covers/captions/CTAs prepared per platform (not one caption recycled).
- [ ] Baseline snapshot captured; daily record template started.
- [ ] Day-1 posts drafted; day-7 gate scheduled; day-14 review scheduled.
- [ ] Owner confirms: slogan v2 approval status, handle choice, name/trademark position, paid budget ($0 or
      the optional day-7 test), and that no community rules are being broken.
