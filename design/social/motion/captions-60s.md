# Captions & copy — ManHunt 60 s explainer v5

**COPY STATUS: PROVISIONAL — OWNER APPROVAL PENDING.** This is the brand copy family after brand-director's one-pass review, applied by motion. Do not publish until the owner approves. SRTs are exported verbatim to the burned-in captions.

Copy family: hook `Your friends are hunting you.` · permanent line `Hide from your friends.` · film end-card button `Install free for Android` · campaign CTA `Create a hunt. Send the code. Hide.` (cover/captions/link-in-bio only) · trust line `Play with people you trust.`

---

## 1. On-screen lines (60 s master — authoritative strings)

| # | Time | Line (burned) | Notes |
|---|---|---|---|
| 1 | 0.00–2.50 | `Your friends are hunting you.` | hook opens every cut |
| 2 | 2.50–8.50 | `It's hide-and-seek in the real world.` | what it is |
| 3 | 8.50–11.80 | `One team hides.` | coral rules |
| 4 | 11.80–16.00 | `One team hunts.` | violet rules |
| 5 | 16.00–24.00 | `Your phone reports your position.` | report beat |
| 6 | 24.00–32.00 | `Hunters see your last report.` | honest tracking wording — latest reports, not "live" |
| 7 | 32.00–34.72 | `Find them.` | |
| 8 | 34.72–36.96 | `Touch them to tag.` | touch is the real mechanic |
| 9 | 36.96–40.00 | `Tagged. They're out.` | a tag eliminates one prey; hunt ends when all prey are tagged or the clock ends |
| 10 | 40.00–47.00 | `The server keeps the clock.` | fairness beat; clock is visual only, host-set default 60 min |
| 11 | 47.00–49.70 | `Create a hunt.` | origin of the code |
| 12 | 49.70–53.00 | `Share the code.` | |
| 13 | 53.00–57.00 | `Free Android APK. Not on Play Store.` | honesty |
| 14 | 57.00–58.60 | `Hide from your friends.` | permanent line closes every cut |
| 15 | 58.60–60.00 | `Install free for Android` | end-card button (speakable) |

Diagram labels (not captions, part of the schematic): `PREY`, `HUNTERS`, `HUNT MAP`, `PLAY ZONE`, `SERVER CLOCK`, `TRAIL`, `2+ PHONES · 6-CHARACTER CODE`, `FREE ANDROID APK`, `Android 8+ · not on Play Store`, URL.

**30 s cut:** same lines with compressed timings (see SRT #2). **15 s cut:** hook / `One of you is the prey.` / `Your phone tells them where you are.` / `Move. Or get tagged.` / `Tagged. You're out.` / `Hide from your friends.` + install button. **6 s GIF:** hook + `Tagged. They're out.` + `Hide from your friends.` + install button.

End card (all cuts): permanent line → official Open Zone stacked lockup → `Install free for Android` button → `http://74.208.99.178/` → `free APK · Android 8+ · not on Play Store` → `Play with people you trust.`

## 2. SRT cue tables (verbatim, exported UTF-8 with BOM)

SRT carries **narrative lines only** — URL/micro/trust are persistent on-screen UI and are deliberately not in the subtitle track. Button text `Install free for Android` gets its own final cue where it is burned in as speakable text.

**60 s** → `out/v5/manhunt_explainer_60s.srt`: 15 cues matching the table above exactly (cues 1–15 = rows 1–15).
**30 s** → `out/v5/manhunt_explainer_30s.srt`: 15 cues, same strings, compressed timings.
**15 s** → `out/v5/manhunt_15s.srt`: 7 cues (hook, prey, phone, move, tagged, permanent line, install button).

Export rule: UTF-8 **with BOM**, LF line endings, no mojibake (verify one file's first bytes are `EF BB BF` and reread a cue).

## 3. VO direction (not recorded)

The film ships with the original synthesised score and burned captions; there is no approved voice asset in the repo and no TTS voice is used for brand VO. If a dry, tell-a-friend read is recorded later, use **exactly** the narrative SRT lines in order; stress HUNT · PREY · PHONE · TAGGED; no added claims. Audio-only remux, video untouched.

## 4. Arabic variants (provisional; not rendered)

MSA for an Arabic cut (needs RTL layout pass + native review). `Android 8+` / URL / clock digits stay LTR.

| English | Arabic (MSA) |
|---|---|
| Your friends are hunting you. | أصدقاؤك يطاردونك. |
| It's hide-and-seek in the real world. | إنها لعبة الاختباء في العالم الحقيقي. |
| One team hides. | فريق يختبئ. |
| One team hunts. | فريق يطارد. |
| Your phone reports your position. | هاتفك يبلّغ عن موقعك. |
| Hunters see your last report. | يرى الصيادون آخر بلاغ لك. |
| Find them. | اعثر عليهم. |
| Touch them to tag. | المسهم ليُوسَموا. |
| Tagged. They're out. | تم وسمهم. خرجوا من الجولة. |
| The server keeps the clock. | الخادم يحفظ الوقت. |
| Create a hunt. | أنشئ مطاردة. |
| Share the code. | شارك الرمز. |
| Free Android APK. Not on Play Store. | تطبيق أندرويد مجاني. ليس على متجر Play. |
| Hide from your friends. | اختبئ من أصدقائك. |
| Install free for Android | ثبّت مجانًا لأندرويد |
| Play with people you trust. | العب مع أشخاص تثق بهم. |

## 5. Post copy

**Primary (60 s explainer):**
> Your friends are hunting you. Real-world hide-and-seek: prey hide, hunters see the latest reports and close in, tag by touching. The server keeps the clock.
> Free Android APK (not on Play Store): http://74.208.99.178/ · Android 8+
> Create a hunt. Send the code. Hide.

**Series caption (15 s):**
> your friends are hunting you. free Android APK → http://74.208.99.178/ · Android 8+ · not on Play Store · hide from your friends.

**Hashtags (≤5):** `#ManHunt` `#HideAndSeek` `#PickupSport` `#AndroidGame` `#OutdoorGames`

**Disclosures (keep with any paid boost):** `Free APK, sideload — not on Google Play.` · `Original synthesised audio.` · `No real people, screenshots or stock footage.`

## 6. Claims audit

- No duration claims (clock visual only; host-set default 60 min).
- No "live map"/"private"/"encrypted"/"safe"/"survive"/"protect"/"anywhere".
- No player counts, scores, testimonials, fake urgency.
- Tag rules correct: tag by touching, one prey out per tag, hunt ends when all prey tagged or clock ends.
- Install honesty on-screen: free APK, Android 8+, not on Play Store, plain-IP URL.
- No screenshots/photos/people/OSM tiles.
- Every beat line ≤7 words; no one-word captions; no exclamation marks or emoji; sentence case with full stops.

**Copy status: provisional — owner approval pending.** One identity-package file (install/OG assets) still declares the retired line approved; that is a Lead/identity fix, outside this workstream.
