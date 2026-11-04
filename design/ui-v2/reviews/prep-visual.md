# Visual/brand review — prep and scoring discipline (round 1)

**Reviewer:** reviewer-visual · **Workstream:** ManHunt UI/UX redesign v2 · **Branch:** design/ui-v2
**Status:** prepared 2026-11-04 before direction renders exist; **aligned with `skills/REVIEW_RUBRIC.md`,
`skills/PAGE_INVENTORY.md`, `skills/DESIGN_PLAYBOOK.md`, `skills/TOKENS.md`, `skills/COMPONENTS.md`**
(design-smith, landed after my first draft). This is *method*, not a verdict.
**Emphasis (rubric §0):** I score all 7 axes; my lead weight is **brand fit, distinctiveness, hierarchy,
consistency** (axes 1–4, hierarchy co-reviewed with reviewer-ux); reviewer-ux leads interaction/flow,
a11y+RTL/i18n, feasibility (5–7). Where our numbers differ we reconcile after both write independently and
record dissent — dissent is never averaged away.

---

## 0. The bar is not "coherent" — it is "finish and push v0.16"

`design/ui-v2/skills/DESIGN_PLAYBOOK.md` §6 is explicit: v0.16 **MATCHDAY Board is the shipped system and
the basis for direction A, delivered partially** — some screens are the new system (home, lobby, hunt, chat,
result, history), others are still legacy Material (roles gradient/paw, settings icon tabs + cards, hunt sheet
pills/rounded chrome, room-rules `AlertDialog`). So the v2 bar is *finish the system and push it*, not
re-derive it and not clone it. From `docs/screenshots/premium/` (real emulator, seeded game):

- Home: lockup masthead, display brand line, host object, 6-cell code plate, one cyan CTA; light proof.
- Lobby: LOBBY tag, room name, `5 / 5 READY`, mono code, two-column team sheet with cut-corner tags,
  `HOST · YOU`, ready checks, cyan Begin dock.
- Hunt: LIVE + ZONE 240 m + PREY 2/2, 44–56 sp tabular clock, full-bleed map with cyan zone ring and coral
  prey/report ring, Tag dock — but the sheet is still a rounded Material surface with a pill Tag button.
- Result: FULL TIME board, "Hunters win.", honest `0 / 2`, full-screen. Claim/tag-picker as full-page states.
- Chat field log; History page; Arabic RTL Home; light Home.

**Consequences for scoring:**
1. A direction that re-arrives at v0.16 with cleaner spacing is **not** a 5 on brand fit or distinctiveness.
   Direction A accepts the side-by-side test itself (`01-directions.md`: "obvious in a side-by-side").
2. But "not v0.16" is not automatically better either: v0.16's shipped screens are the *floor* on the four
   core pages. Any direction that regresses the Board/clock/team grammar it has to explain why (ruling from
   `briefs/01-directions.md` shared anchors).
3. **Seed data is canonical and not negotiable:** every direction renders **"Riverside Run" / `K7M2QX` /
   5 players (3 Hunters, 2 Prey) / zone 240 m / clock 41:12 / duration 60:00**; players
   **Nadia, Omar, Selim, Rana, Youssef**; host/huntmaster consistent across all pages; result **18:48 played,
   PREY 0 / 2, Hunters win**. The premium captures used different fictional names/code (`Yasmin…`, `R9YLPP`)
   — those are **not** page-content authority (`PAGE_INVENTORY.md` §0). Use of premium seed = a red flag.
4. **Brief-vs-app deltas** (`PAGE_INVENTORY.md` §20) must be handled honestly: rematch only as a *proposal*
   with the server cost stated; tag-policy row flagged (enum undocumented); roles entry per brief or explained;
   result "score" = prey remaining, not a football score; settings server read-only; history summary is a
   proposal over real fields; offline state = small client work; result map = labelled drawn-plate stand-in;
   chat is an in-room tab. A delta silently implied to exist is a feasibility failure (axis 7) even if pretty.

---

## 1. Acceptance gate — run before any design scoring (rubric §3)

A direction that fails the gate is **not reviewable**; I report the failure to the designer + Lead as a
delivery issue and do not score missing pages as if they existed. Checklist (evidence in parens):

- [ ] `directions/<d>/out/` has **14 full-page renders, exactly 1170×2532 px** (verify dimensions with `file`);
      12 canonical + `lobby-rtl` + `home-light`; no placeholders/blank/corrupt pages.
- [ ] `pages/` sources present for all 14; `_`-prefixed helper files are not counted as pages.
- [ ] `NOTES.md` has: one-paragraph thesis; type/colour/spacing/component decisions; per-page intent + 1–2 key
      decisions; states covered; rejected ideas; Compose/feasibility notes; known weaknesses
      (missing sections → caps axis 7 at 3, rubric §2.8).
- [ ] Contact sheet from `env/contact-sheet.mjs` exists for the direction (expect `env/out/sheets/<dir>.png`,
      plus the cross-direction `env/out/sheets/matrix.png`), all 14 readable; page PNGs legible at full size and
      thumbnail. **I do not regenerate sheets** (my write scope is `reviews/` only) — a missing or stale sheet is
      a delivery note to design-env, not a design finding.
- [ ] Canonical seed used everywhere (above), including player names and the 18:48 / 0-2 result.
- [ ] Only the approved mark/wordmark geometry and the three bundled OFL faces; original vector/CSS only —
      no stock/AI/network imagery; no recut/retyped wordmark; no OSM tiles copied into mock pages.
- [ ] Every page has one primary action and its real state per `PAGE_INVENTORY.md` §18; no fake UI, no
      `--:--`, no dev strings.
- [ ] Report files land in `reviews/` only (I never edit designer files).

Then, and only then: **Pass 1 first impressions** (open the 14 pages in canonical order, fixed direction order
**C → A → B**, write one line per page *before reading NOTES*), **Pass 2** read NOTES and cross-check claims
against renders, **Pass 3** score. This ordering is rubric §6.1 and stops intent from contaminating the
first-impression read.

---

## 2. Scoring mechanics

- **Scale:** 1–5 per axis with the rubric anchors (1 failing, 2 clearly below, 3 acceptable, 4 strong,
  5 exceptional). I default to integers; a half point is allowed only with a written reason in the note
  (rubric) and will be rare — if I use one, the sentence says why the evidence straddles two anchors.
- **Weights:** 1 brand 15 %, 2 distinctiveness 15 %, 3 hierarchy 15 %, 4 consistency 15 %, 5 interaction 15 %,
  6 a11y/RTL 10 %, 7 feasibility 15 %. **Weighted total = Σ(score × weight)**, two decimals, /5. I report it
  but the ranking is argued in prose and per-page picks — a weighted total never outvotes a broken core page
  or a cap.
- **Automatic caps (rubric §2) are mandatory and applied before averaging.** I will list every cap with its
  page evidence in the review file; a capped axis is at most 2. The eight cap classes: (1) banned material
  (gradient/glow/shadow/glass, card-stack/icon-tile core system, pill primary, stock/AI/network imagery, recut
  wordmark); (2) fake content (lorem, fake counts/ratings/claims, `--:--`, dev strings); (3) missing pages or
  a page illegible at full size; (4) no genuine RTL proof (mechanical mirror, Latin Arabic, reversed/mirrored
  numerals); (5) light proof = different identity or board-as-white-card; (6) copy violations (exclamation,
  ALL-CAPS headings, invented claims, "safe/secure/private", >1 cyan surface, colour-only team state);
  (7) contradicts game rules (prey sees prey, tag during head start, hidden/dodged winner, rematch presented
  as shipped); (8) NOTES missing required sections. Caps cap the *affected axis*, not the whole direction —
  one cap does not kill a direction, but it is always named, and two caps in different classes will be reported
  to the Lead as a direction-level concern.
- **Evidence per score, rubric §8 template:** axis → score → **evidence (page/state)** → why. No score without
  a visible element and a page. NOTES can explain a score but never earn one.
- **Page gaps vs `PAGE_INVENTORY.md` §18** are listed per direction (which required states are *rendered* vs
  notes-only vs absent). The bold states in §18 (offline, paused, eliminated, update-available, claim) are the
  ones that prove the system is real; notes-only does not count as designed for the state-coverage read.
- **Independence:** I write `scores-round-1.json` + `round-1-visual.md` before reading reviewer-ux's numbers.
  Then reconcile axis by axis: agreements kept, disagreements argued in one paragraph each, dissent recorded
  verbatim in the final file. No numbers conference before both tables exist.
- **Latest render rule:** each score refers to the latest PNG. A fixed page is re-scored from the new render,
  never from the designer's message or NOTES claim.

---

## 3. Scoring discipline (how a number gets on the page)

**Rule 0 — score the render, not the notes.** First impressions come from the PNGs. NOTES are read after
Pass 1 and used only to (a) test whether a claimed state/adaptation actually exists in the artifact and
(b) judge honesty about weaknesses and feasibility. A stated token you cannot see is not a point.

**Rule 1 — no averaging away a broken core page.** A broken `home`, `lobby`, `hunt-hunter` or `result` caps
the relevant axis and is called out at the top of the direction section. One weak non-core page (e.g.
`history`) does not sink a system that works.

**Rule 2 — separate "design choice" from "render/delivery defect".** Missing glyphs, clipped text, failed
font loads, blank/wrong-size PNGs, unrendered proof pages are **delivery failures**: logged under
"delivery/render issues" with the file path and reported to the designer, not scored against the design until
they confirm the render. I will not guess what an unrendered page "would look like".

**Rule 3 — three fixed passes, no re-scoring without a written reason.**
- *Pass 1 (first impression):* 14 pages, canonical order, directions C→A→B (blunts "A is the shipped one"
  and first-read bias), 30 % thumbnail + full size, one line each, no scores, **no NOTES yet**.
- *Pass 2 (claims):* NOTES, contact sheet, sources only where the render is ambiguous (e.g. a 1 px border
  looks wrong at 3× — check the CSS to tell a rendering artifact from a choice).
- *Pass 3 (scores):* all 7 axes, evidence table, caps, page-gap list.
- *Pass 4 (cross-direction):* same page across C/A/B at full size and thumbnail for the per-page ranking and
  steals. System scores are not re-opened here without a written reason; only page picks can move.

**Rule 4 — thumbnail before full size for axes 2–3.** At 30 %, can I name the screen and the one action?
Then full size decides craft. The owner will judge part of this set as a gallery; memory is the product.

**Rule 5 — different is not better; clean is not automatically accessible or feasible.** Rubric §7:
distinctiveness is memory/ownability, not loudness; minimal does not earn a11y/feasibility points — I check
contrast, targets, states, implementation.

**Rule 6 — no score inflation for ambition, no penalty for safety.** Trying a huge idea and not landing it
scores as rendered; executing a quiet system exactly scores as rendered. B is not marked up for courage,
A not penalised for resemblance to the shipped app *per se* — only where it fails "finish and push" or a
rubric anchor.

**Rule 7 — taste is declared, not smuggled.** If a preference is not grounded in brief/brand/skills/rubric it
does not move a score; I mark pure-taste judgements as such and keep them out of the table (they may become
owner questions instead). No taste dogpiling: dislike is not evidence, the brief is.

**Rule 8 — same page set, same states, same seed for cross-direction comparisons.** A direction that invents
extra states gets no credit for invention; it can still win a page pick if its rendered state is better.

**Rule 9 — contrast spot-check from declared + rendered values.** Read the page CSS custom properties for the
actual pairs used (body/muted on ground, team text on tint, on-cyan label, disabled), compute WCAG ratios,
sample the PNG where the render disagrees. reviewer-ux owns the formal a11y audit; I flag visible/likely sub-AA
pairs and colour-only signalling.

**Rule 10 — kindness is precision.** Every problem states page + element + concrete fix; no "needs more
polish", no personal framing. No sycophancy. The designer gets the 3 things that matter most, not a pile-on.

---

## 4. What "good" looks like for this product (calibration page)

**The situation.** A phone at night, outdoors, held one-handed by someone walking, standing in a stairwell or
about to run. A group of friends who must agree on one shared object. A host who is also the referee. Real
location data that makes people a little anxious. The screen is looked at for **one second**, not studied.

**Therefore good is:**
1. **Glanceable first.** The right thing (phase, clock, action, state) reads at arm's length in the dark before
   anything else. Decoration that out-shouts the clock/state/action is wrong regardless of beauty.
2. **One decisive gesture per page.** One plate/loud element/primary action; everything else ranks below it.
   The gesture carries game meaning — a board, a team sheet, a code, a claim — never ornament.
3. **The game's own data as the visual language.** Clock, zone, teams, readiness, code, result: these are the
   material. Borrowed app/dashboard/poster furniture is allowed only where it serves them.
4. **Honest, calm, warm under tension.** Plain factual copy in the `tone-of-voice.md` voice: no exclamation,
   no fake urgency/counts/ratings, no "safe/secure/private", no surveillance/military chill. The game is the
   chase, not danger.
5. **Premium = confidence and restraint.** Not luxury: exact baselines, consistent hairlines, tabular numerals
   that do not dance, no gradients/glows/shadows, no icon tiles, no all-caps eyebrows, nothing that fills space
   only. An engineer could build it.
6. **Recognisable from memory.** `DESIGN_PLAYBOOK.md` §4 gives the 10 recognition signals (Board, display
   numerals, chalk rules, kit tags, team sheets, six-cell code plate, field marks, drawn field, flat material,
   permanent line). A strong page shows **≥3 of them from memory at thumbnail scale without the wordmark**.
7. **States are half the product.** Empty/loading/error/offline/reconnecting/paused/eliminated/claim/update are
   designed moments in the same grammar, each saying what happened + the next action. A page that only exists
   in its happy state is unfinished.
8. **Realistic.** Canonical seed, real names, real data fields (`PAGE_INVENTORY.md` §2), OSM credit wherever
   tiles appear, no dev strings, no invented numbers.
9. **Implementable.** Maps to Compose + tokens + the existing data contract; every delta costed in NOTES.

**What would make me recommend a direction:** unmistakable ManHunt at thumbnail scale; a signature system
visibly *more finished and more pushed* than v0.16; squint/thumb/blank-the-wordmark tests passed on the four
core pages; no legibility-for-loudness trade; states and proofs real. I report evidence and trade-offs; the
owner makes the taste call.

**Known traps I am watching in myself:** novelty bias (B feels fresh because it is loud), safety bias (A feels
correct because it resembles shipping), density-as-quality bias (C feels professional because it is dense),
home-page bias (judging a system off its hero screen), craft gawking (a spectacular result page hiding a broken
lobby), and rubric-lawyering (hunting for a cap instead of judging the design). Pass order and the caps list
exist to counter these; I will name any residual bias in the limitations section.

---

## 5. Questions I will ask of each direction

**All three**
1. What should I see first on each page, and is it actually first in the render?
2. Which page is your weakest, and what does the contact sheet expose about it?
3. What does your system own that another direction could not copy without becoming you?
4. Which signature device survives 30 % thumbnail — and which only works at full size?
5. Which `PAGE_INVENTORY.md` §18 states are *rendered*, which are notes-only, and why?
6. Which brief-vs-app deltas did you design (§20), and where is the cost stated in NOTES?
7. Where did you deliberately deviate from the shared anchors/tokens, and what did the brief allow?
8. Which 3 things would you steal from the other two directions?

**A — "Matchday, raised"**
- Side-by-side with `s05-lobby-host.png` / `s07-hunt.png` / `s12-result-hunters.png`: what is *obviously*
  better, not simply tidier? Name the delta in hierarchy/scale/craft.
- Is the Board a scoreboard (one dominant object) or a header (a stats strip)? On which pages does it become
  decoration, and is the variant logic deliberate?
- Where does "raised" mean bigger/bolder vs actually more decisive hierarchy? Which page would the owner
  still call "the same app"?
- Where did you finish a legacy screen (roles/settings/hunt sheet) rather than restyle it?

**B — "Street signal"**
- Can I read the clock, the state and my team while walking / at 1 m in the dark, one-handed? Point at the
  page that fails first.
- Is the poster composition a *system* (repeatable one-big-idea + data rule) or a stunt repeated until the
  map/chat/settings pages break?
- Where does flat colour blocking harm state communication (disabled, stale, error, dispute, selected)?
- Does the result/tag moment land as an event, or as noise competing with the outcome data?
- Which screen would a player be embarrassed to open in front of a stranger, and is that acceptable here?

**C — "Field instrument"**
- Does the instrument read as *a friend's game tool* or as surveillance/field-military kit? Show me the warm
  moment on result and tag claim.
- Is the density honest (real data fields only) or decorative (fake grids/telemetry, tiny labels for the look)?
- Can I find the one action in <1 s on the map pages, or do hairlines/mono chrome compete?
- Does map-first survive auth/settings/chat without becoming an oscilloscope manual?
- Where is it actually faster/clearer than v0.16, not merely quieter?

---

## 6. Page-by-page checks (14 canonical frames)

Each page is judged full size **and** at 30 %. For each: the **one-gesture test**, the real content that must
appear (`PAGE_INVENTORY.md`), the §18 required states, and the failure modes I will hunt. Deltas §20 are
flagged where they land.

### 1. `auth` — sign in / create local account
One-gesture: brand line + quiet form; the server row is a footnote below a rule.
Real: "Hide from your friends." display line; Username (3–24) / Password (≥8) with helpers and show/hide;
sign-in/create-account toggle; server row + expanded test; version footer (`v0.16.1 · free APK · Android 8+`).
States (§18): loading submit, field error, server error, server-setup expanded, server-test in-flight/ok/fail.
Hunt: disabled submit without a visible reason; helper/error contrast; one cyan surface (the submit);
dev host (`10.0.2.2`/`manhunt.lvh.me`) excluded; no card-stack; brand line eating the form; missing focus state.

### 2. `roles` — sides + mode catalogue
One-gesture: the game explained as a briefing, not a brochure; the accept/primary action at the thumb.
Real: first-run vs re-read title; Classic playable; Single Prey/Shrinking Zone honestly "Coming soon" with
"Play Classic instead" (no dead end); Prey/Hunters paragraphs; "How a hunt runs" steps; first-run permission
moment if shown; approved safety copy verbatim if included; footer line.
States: first-run vs re-read, planned-mode page, permission explanation, long scroll. Hunt: gradient hero/
paw/`ScreenCard` residue, planned modes presented as playable, marketing language, footer-only safety.

### 3. `home` — host or join
One-gesture: two **different** objects — a named host flow and a 6-cell join code — with the next step obvious;
masthead mark+wordmark; no fake hunt board before a hunt.
Real: hunt-name field (max 30, blank → "ManHunt", 2-char error), Create hunt (disabled/loading/error),
CodePlate six cells with partial-helper/error, Join hunt disabled <6, "Read the roles", "Playing as {user}",
Sign out, version. States: host empty/filled, code empty/partial/complete, create/join loading+error+offline,
signed-in identity, light proof. Hunt: invented active-hunt/resume banner; two equal cards; dev strings;
settings entry floating as decoration; `home-light` not actually translating the system.

### 4. `lobby` — room lobby (host view, everyone ready)
One-gesture: the room as a team sheet over a board — code, teams, readiness; Begin at the thumb with its
blocker adjacent; host can also ready.
Real: LOBBY state tag, room name, `5 / 5 READY`, K7M2QX (tap-to-copy + notice), readiness ticks, invite code
plate (read-only), TeamSheet two columns coral/violet (56 dp rows, avatar, Ready/Gearing up/Offline, HOST/YOU,
tag glyph), side-selection TeamTag, Hunt rules link, dock with blocker line + Ready/Stand down + Begin.
States: canonical all-ready host; host with blockers; player view; empty team; >5 players/long names; one
offline member; room-load + load-error/retry; leave confirm; copy-code feedback; `lobby-rtl`.
Hunt: disabled Begin with reason far away; TAGGED leaking into a fresh lobby; nested plates; roster below the
fold/behind scroll; team colour as sole cue; code not a social object; premium seed names.

### 5. `hunt-hunter` — live hunt, Hunter view
One-gesture: the clock (loudest object) → map/zone → one thumb action (Tag prey).
Real: Board LIVE + 41:12 tabular + ZONE 240 m + PREY 2/2, map inset below the board (not covered), OSM tiles
dark-filtered, own cyan position, coral fresh/stale prey markers distinguishable by shape+label, zone ring,
trails on/off, dock Tag prey primary + Trails secondary, "latest reports" line, shrink countdown, expanded
details (pause/resume, hunt rules, end hunt, history, prey status Live/Stale/No report/Tagged/Unverified,
roster), tag flow target picker + claim-sent notice.
States: hunting fresh+stale canonical; no reports ("No reports yet. Prey report every {n} minutes."); head
start (no Tag); paused (unmistakable, clock stopped); offline/reconnecting (last reports, Tag disabled); claim
banner; trails empty; tag-picker empty; map-tiles loading (field colour, no grey checkerboard); GPS state for
map; RTL chrome (map not mirrored).
Hunt: clock loses to HUD chrome or sheet; stale by opacity only; sheet covers markers; fake "next report in"
for hunters (not exposed); pill Tag; duplicated data sources; OSM credit missing.

### 6. `hunt-prey` — live hunt, Prey view
One-gesture: "I am the one being tracked" — own position, zone, clock, what is being shared and when.
Real: Board LIVE + clock + ZONE (no PREY gutter — hunters only); own position only on map; sharing/GPS status
lines ("Sharing your position"/"Waiting for GPS"/"Location off"/"Turn on location services"); honest report
cadence derived from `locationIntervalSec`; claim overlay entry; eliminated → spectating notice.
States: sharing canonical; head start; GPS not asked/denied/permanently denied/services off/waiting fix;
paused; eliminated/spectating; pending claim; offline. Hunt: **another prey's position ever shown** (hard
product-rule violation → caps 5/7), invented hunter markers, fabricated countdown, coral used for errors,
hunter-style Tag action on prey.

### 7. `chat` — room field log
One-gesture: a field log during a hunt, not a messenger.
Real: mono HH:mm gutter, sender + body rows, 1 dp rules, system rows centred between rules, no bubbles;
composer 52 dp plate + 52 dp send field mark; empty "No messages yet. Say hello."; load-older; error above
composer with draft preserved; unread badge when tabbed.
States: populated + system event; empty; sending; send failure (draft kept, retry); load-older in-flight;
offline (composer disabled + reason); long thread/names; RTL notes (gutter mirror, numerals LTR).
Hunt: bubble-messenger genericism; system events look like messages; send action unclear/small; empty state
generic grey sentence; invented delivery states.

### 8. `result` — full time
One-gesture: the outcome as a scoreboard moment — winner word, honest score, duration, then ranked actions.
Real: FULL TIME (or CANCELLED) board, `18:48` "played", PREY 0/2, "Hunters win." display sentence case, score
line "Prey remaining: 0 / 2" mono, final team sheets with TAGGED only where authoritative, primary "Back to
lobby" + outline "View hunt history"; rematch only as labelled proposal with server cost.
States: Hunters win canonical; Prey win honest 2/2; cancelled; result-sync loading (winner never hidden);
final report/map unavailable; many players; RTL notes. Hunt: dialog/notification-sized moment; spectator/score
honesty violations; exclamation; green/red winner colouring; hidden winner while syncing; rematch implied as
shipped; invented survivals/score lines; keyboard/chrome leak-through.

### 9. `history` — past hunts
One-gesture: a scannable ruled list; one match summary that uses only real fields.
Real: header "Hunt history"; date-grouped rows (time, duration M:SS, "Hunters won"/"Prey won"/"Hunt cancelled"/
"In progress", accent dot, team-name line); ≥72 dp rows; loading 3 skeleton bars (no shimmer); error strip with
retry; empty "No hunts in this room yet." + "Hunts appear here once they finish."; per-room history.
States: 3–5 matches across win/win/cancel; one summary; loading; empty; error (≠ empty); long scroll.
Hunt: card stack; error masquerading as empty; invented per-player tags/score depth; dead-end rows.

### 10. `settings` — settings
One-gesture: a ruled manual page with clear sections, not five mystery icon tabs.
Real: Appearance (Dark/Light segmented; Text size 85–135 % with honest "applies on release" note + preview);
Language (English/العربية + immediate/mirror note); Permissions (Location precise allowed/not + Manage/Allow,
notifications tracking notice + match switch); Updates (installed version, check/checking, update available /
up to date, release notes, download % / failure, install ready / unknown-sources); Account ("Signed in as",
read-only server + "change on sign-in", cache size/calculating/clear, Sign out destructive).
States (§18): all the above, incl. update-available and download progress/failure; RTL/light notes.
Hunt: icon-only nav; card groups; read-only server shown as editable with no save path; fake update claims;
`Signed in as -`; live-slider preview defect; <48 dp rows.

### 11. `sheet-tag-claim` — Prey receives a tag claim
One-gesture: consequence as the title/first line, then the decision — confirm vs dispute — at the thumb.
Real: "Tag claim" + "{Hunter} says they physically touched you. Confirm the tag?" (hunter name from member
data, claim time optional small honest addition); primary Confirm / outline Dispute stacked; confirming means
out+spectating; disputed → huntmaster decides; busy/error keep sheet with retry; dismissal → persistent
"Review tag claim" banner; resolution strip; huntmaster "Disputed tag" sibling (Confirm tag / Reject).
States: incoming canonical; busy; error+retry; dismissed banner; disputed-huntmaster; resolution. Hunt:
decision as text links; generic dialog; consequence unclear before the tap; losing the claim on dismiss;
clinical/inconsistent copy.

### 12. `sheet-room-settings` — host edits hunt rules
One-gesture: the host changing the terms, in the app's one control grammar.
Real: "Hunt rules" + "Applies to the next match. Rules are enforced by the server."; Timing (head start 5,
duration 60, report interval 5; whole numbers); trails switch; Play area Open/Zone with radius 240, use my
location, lat/lng, pick-on-map zone picker, shrink switch + every/by; tag policy as an honest ruled row
("Tags need the prey to confirm", server-enforced) with the missing-enum flag; Save/Cancel; validation errors.
States: open-area canonical; zone expanded + map picker; validation; save busy; locating; zone centre unset;
RTL (inputs, coordinates LTR). Hunt: Material dialog/chips/switches as default; invented tag-policy values;
invented zone/enum behaviour; nested plates; tiny labels; no validation feedback.

### +1. `lobby-rtl` — Arabic RTL proof (lobby)
One-gesture: a genuinely designed RTL lobby, not a mirrored LTR page.
Real: Arabic lobby strings exist (رمز دعوة, مستعد, غرفة الانتظار, الفريسة/الصيادون, ابدأ المطاردة, blockers,
اختبئ من أصدقائك); layout mirrors; cut corners mirror; code K7M2QX + numerals Western/LTR-isolated; plausible
Arabic seed names (fictional), both teams populated, readiness visible; no `·`; Arabic face not Big Shoulders;
no tracking; hard-coded HOST/YOU/READY labels localised or justified.
Hunt: mechanical flip; Latin Arabic; mirrored/reversed numerals or code; clipped labels; team order that
breaks reading direction; mark/map mirrored; missing host/blocker/Begin states.

### +1. `home-light` — light theme proof (Home)
One-gesture: the same Home system in daylight chalk — a translation, not a second identity.
Real: ground #F7F9FC, ink #0F172A, white plates, updated hairlines, darker cyan/team colours; **Board stays
ink**; identical content/actions to dark Home; no cream/serif drift; no pure-white card stack.
States: default light + dark parity note. Hunt: white-card board; different identity; contrast loss on
muted/disabled; cyan/team colours unchanged (too bright/weak); hierarchy drift from dark.

---

## 7. Cross-cutting tests (run on every direction)

**7.1 Hierarchy & plate grammar.** One primary per page; squint test full size + thumbnail; ≤2 plates, never
nested, never for prose; grouping by rules/space; explicit secondary/tertiary ranking; dense pages (hunt,
settings, room rules) stay calm. A card stack fails hierarchy + consistency reads regardless of polish.

**7.2 Board/clock authority.** Signature claim: dominant object; one per screen; only where meaningful (no
fake clock pre-hunt/`--:--`); at most state + clock + one team/score + one zone datum; tabular, LTR, legible
at thumbnail; same variants logic across lobby/live/full-time/paused/offline; no duplicate data source; on
hunt pages the map is inset below the board, not covered.

**7.3 Type system.** Display for loud words/numerals only; UI face for function; mono only for machine data
(code, clock labels, timestamps, coordinates, version) — never prose; sentence case except state words/mono
data labels/code; no ALL-CAPS eyebrows/headings/buttons; one display moment per page; tabular numerals
wherever numbers change; consistent screen-title scale across pages; Arabic: no tracking, no Latin display
face; body ≥14–15 sp-equivalent (aux ≥12). Display type used as a big label on ordinary UI is not carrying
the game.

**7.4 Colour semantics.** Cyan = field/referee/time/live/one primary, never generic accent/link/tint; coral =
Prey only; violet = Hunters only; never team colour for error/success/decoration; one hot colour + exactly one
filled cyan surface per page; colour never sole signal (shape + word + colour); contrast on actual pairs
(body/label AA, large display ≥3:1, team text on tint, on-cyan label, metadata ≥7:1 if ≤12 sp); error distinct
from coral; light theme keeps the roles.

**7.5 State design.** §18 per page; empty/loading/error/offline/reconnecting/paused/eliminated/claim/update all
in one state vocabulary (EmptyState / ErrorStrip / LoadingRule / OfflineStrip / PermissionStrip); each says
what happened + next action; error ≠ empty; loading says what; offline keeps last data and disables actions;
disabled has adjacent reason; destructive names consequence; retry preserves input.

**7.6 Distinctive-but-not-gimmicky.** (a) survives 30 % thumbnail; (b) appears on ≥5 pages under a stated rule;
(c) never costs legibility under stress; (d) maps to a game meaning, not decoration; (e) original — no
recognisable borrowed template/asset; a font trick is not an idea. Gimmick test: if removing it leaves the
system equally clear, it was decoration; if it is the only distinctive thing, the system is thin.

**7.7 RTL/light.** Designed, not mechanically supported: mirror layout/rules/order; do not mirror mark/map/
numerals/physical glyphs; LTR isolation for code/clock/N; no `·`; Arabic face + no tracking; light as designed
translation with the explicit Board decision. Anything claimed in NOTES but absent from `lobby-rtl`/
`home-light` is unproven — say so.

**7.8 Feasibility read (secondary; reviewer-ux leads).** Maps to Compose + tokens + data contract; custom
drawing is vector/CSS-portable; data shown exists; implied animation has a static equivalent; §20 deltas costed
in NOTES; no engine work silently assumed. NOTES language earns no points — the pages must not depend on
invented APIs or data.

---

## 8. Outputs and templates (round 1)

`reviews/round-1-visual.md`
1. Method note + acceptance-gate result per direction (page count, exact sizes, missing/defective renders) +
   baseline note.
2. Per direction, rubric §8 template:
   ```
   ## Direction X — <name>
   Weighted total: x.xx / 5
   | Axis | Score | Evidence (page/state) | Why this score |
   Top 3 strengths
   Top 3 problems, each → concrete fix (page, element, change)
   Worst 3 pages + why
   Page gaps vs PAGE_INVENTORY.md §18 (rendered / notes-only / absent)
   Caps applied (rubric §2) + evidence
   RTL/light read; feasibility flags; NOTES honesty check
   ```
3. Cross-direction: per-page best picks (14 rows, rubric template: page | best direction | why + 1–2
   stealables), 3 stealable ideas (specific enough to implement), 3 biggest cross-direction risks.
4. Dialogue log: messages sent (timestamped), replies/pushback, what I accepted, what I kept.
5. Reconciliation with reviewer-ux: agreements, dissent recorded verbatim, no numbers averaging.

`reviews/scores-round-1.json`
```
{ "reviewer": "reviewer-visual", "round": 1,
  "rubric": "design/ui-v2/skills/REVIEW_RUBRIC.md",
  "baseline": "v0.16 MATCHDAY Board (docs/screenshots/premium) — finish-and-push bar",
  "directions": [ { "direction": "A", "weighted_total": 0.00,
                    "scores": [ { "axis": "brand_fit", "score": 0, "note": "…" }, … ],
                    "caps": [ { "rule": "…", "page": "…", "axis_capped": "…" } ] } ] }
```
Axes keys: `brand_fit, distinctiveness, hierarchy, consistency, interaction, a11y_rtl, feasibility`; every note
cites an artifact; caps and half-point reasons explicit.

**Messaging:** one short message per designer (designer-a/b/c): the 3 biggest visual problems + the concrete
fix each (page + element), one strength worth keeping, the page-gap list headline, and an invitation to
challenge with evidence. Durable detail stays in the review file; messages stay under ~150 words. Lead gets
paths + headline verdict only. Dialogue goes into both the review file and (for designers) their NOTES
"review response".

**Reconciliation agreement with reviewer-ux (2026-11-04):** same 7 axes/weights, same fixed page order
C→A→B, same flat `scores` row shape `{direction, axis, score, note}` (my JSON adds top-level
`weighted_total` + `caps` per direction, mergeable by `direction`+`axis`); both write their tables
**independently before any number exchange**; reconcile axis by axis, one paragraph per disagreement, each
score citing a page; dissent recorded verbatim in `FINAL-RECOMMENDATION.md`, never averaged; rubric §2 caps
applied by both before averaging. reviewer-ux supplies the Playwright DOM/measurement evidence layer
(`reviews/evidence/` — contrast pairs, <48 dp targets, text sizes, overflow, RTL/directionality, 320 dp/200 %
stress); I own first-impression/thumbnail evidence and the per-page picks, and will share a draft picks table
before the final file. Delivery defects are reported before scoring on both sides.

---

## 9. Round-2 / final pre-commitment (reminder to self)

- Round 2: re-score only axes that changed, plus a **regression check on all 14 pages** (a fix that breaks the
  system is not a fix); verify fixes are systemic, not one page; re-score from the latest PNGs only; keep caps
  removed/retained with evidence; update the per-page best picks.
- `FINAL-RECOMMENDATION.md` (with reviewer-ux): final scores table + one-line verdict per direction; ranking
  with reasoning grounded in rubric/brief; per-page picks + steals; implementation read (Compose risks, tokens
  to formalise, engine items); top 5 owner questions (taste/strategy decisions that are theirs); honest
  limitations. The owner makes the final call — taste is not delegated to scores; my job is making the
  evidence and trade-offs legible.

---

## 10. Source map (read before round 1)

`briefs/00-workstream.md`, `01-directions.md`, `02-evaluation.md` · `skills/REVIEW_RUBRIC.md`,
`PAGE_INVENTORY.md` (§0 seed, §2 data contract, §18 states, §20 deltas), `DESIGN_PLAYBOOK.md` (§4 identity
signals, §6 MATCHDAY lessons, §7 hard constraints, §10 self-test), `TOKENS.md`, `COMPONENTS.md`,
`INSPIRATION.md` · `design/redesign/direction.md`, `tokens.md`, `audit.md` · `design/brand/identity/
design-philosophy.md`, `docs/BRAND_BRIEF.md`, `design/brand/strategy/{tone-of-voice,visual-direction}.md` ·
`docs/screenshots/premium/` (contact sheet + home, lobby, hunt, result, light, RTL and claim captures) ·
`env/render.mjs` / `env/contact-sheet.mjs` output conventions · real app screenshots in `docs/screenshots/`
(legacy, comparison only).
