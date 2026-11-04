# Visual/brand review — round 1 (directions A, B, C)

**Reviewer:** reviewer-visual · **Date:** 2026-11-04 19:50 UTC · **Workstream:** ManHunt UI/UX redesign v2
**Method:** `skills/REVIEW_RUBRIC.md` (anchors, §2 caps, §3 acceptance, §4 page checklist), `skills/PAGE_INVENTORY.md` (§0 seed, §2 data contract, §18 states, §20 deltas), `skills/DESIGN_PLAYBOOK.md`, `skills/TOKENS.md`, `skills/COMPONENTS.md`, `briefs/*.md`; rendered pages only (NOTES read after the page pass and used to test claims/honesty, never to earn points). Full method and pre-commitments: `reviews/prep-visual.md`.
**Direction order:** sheets first (system gestalt), then full pages C→A→B for the page pass (bias control per prep), then same-page comparison; NOTES/state claims cross-checked last.
**Baseline:** v0.16 MATCHDAY Board (`docs/screenshots/premium/`) — the bar is "finish and push", not "re-cohere".
**B note (Lead):** Designer B ran a **pre-review accessibility pass** at ~19:42 UTC (metadata ink raised, mono floor, Roles prose 12.5→13 px) and all 14 B pages were re-rendered; I score B only from the current `directions/b-street-signal/out/` renders (byte-matched to the review pack). A and C unchanged since capture.
**Independent scoring:** this file and `scores-round-1.json` were written before reading reviewer-ux's round-1 numbers. Evidence from their `reviews/evidence/ux-audit*.json` was used as measurement input (contrast/targets/text sizes), with independent visual checks; reconciliation is §6.

---

## 0. Acceptance gate (rubric §3) — all three directions reviewable

| Check | A | B | C |
|---|---|---|---|
| 14 canonical renders present | ✅ | ✅ | ✅ |
| Exactly 1170×2532 px, no blank/corrupt pages | ✅ 14/14 | ✅ 14/14 | ✅ 14/14 |
| `NOTES.md` has thesis/system/per-page/states/rejected/feasibility/weaknesses | ✅ (428 lines, §1–§14) | ✅ (906 lines, §1–§16) | ✅ (823 lines, §0–§12.7) |
| Direction contact sheet | ✅ `out/contact-a-matchday-raised.png` | ✅ `out/contact-b-street-signal.png` | ✅ `out/contact-sheet.png` |
| Canonical seed (Riverside Run / K7M2QX / 5 players / 240 m / 41:12; 18:48 / 0-2 result) | ✅ pages consistent | ✅ | ⚠ timeline/identity inconsistencies (§2C) |
| Only approved mark/fonts; original vector work | ✅ | ✅ | ✅ |
| One primary action + designed state per page | ✅ mostly | ✅ mostly | ✅ |

No **delivery** failures. One tooling incident was found and fixed during capture (matrix/strips first rebuilt with a single direction; design-env re-ran the full pack at 19:43 — corrected sizes: sheets 2704×6128; matrix 1858×13468; strips 1426×1612; 42 page PNGs 1170×2532). I reviewed from the corrected pack and the per-direction `out/` renders. Reviewer-ux's DOM audit contains some occlusion/heuristic artifacts (e.g. A's `sheet-room-settings` counted 2 cyan surfaces although the background lobby dock is fully covered by the sheet; "Not on Google Play"/server disclosure flagged as forbidden copy) — noted in §6, not scored.

---

## 1. Scores (round 1, independent, then reconciled where reviewer-ux evidence changed my read)

| Axis (weight) | A — Matchday, raised | B — Street signal | C — Field instrument |
|---|---:|---:|---:|
| 1 Brand & product fit (15 %) | **4** | **4** | **3** |
| 2 Distinctiveness / memory (15 %) | **4** | **5** | **5** |
| 3 Hierarchy & clarity (15 %) | **5** | **4** | **4** |
| 4 System consistency (15 %) | **5** | **4** | **5** |
| 5 Interaction & flow UX (15 %) | **2** ⛔cap | **2** ⛔cap | **3** |
| 6 Accessibility & RTL/i18n (10 %) | **3** | **2** | **3** |
| 7 Engineering feasibility (15 %) | **2** ⛔cap | **2** ⛔cap | **3** |
| **Weighted total (/5)** | **3.60** | **3.35** | **3.75** |

*Reconciliation after reviewer-ux's independent table (19:52): accepted their measured evidence on B a11y (2: 16 sub-48 dp controls, `roles` counters at 3.92:1, Arabic mono/tracking), B invented-data cap (2/2), B lobby control gap, C a11y (3: 10 steppers <48 dp on room-rules, colour-only switches) and C feasibility (3: invented `PREY REMAINING` in history, Home GPS band, real IP). Kept my A cap (see below; reviewer-ux did not cap A — recorded dissent) and my C interaction 3 (they score 4; dissent). Full reconciliation: §8.*

**Caps applied (rubric §2, mandatory before averaging):**
- **A — cap 7 ("rematch presented as shipped") → axes 5 and 7 capped at 2.** `result.png` shows a plain inline **"Play again"** row with no proposal marking; the app has no rematch (PAGE_INVENTORY §20.1). NOTES flags it, but the render is scored, and the owner would read it as available. **One label fixes it.** Projected uncapped A = **4.05** (axes 5/7 at 3/4) — the cap, not the system, is what keeps A out of first place.
- **B — caps 2.2/2.7 ("fake content / contradicts the contract") → axes 5 and 7 capped at 2.** `hunt-hunter` renders two violet "other hunter" markers (no hunter positions exist in the data contract/server) and `history` invents per-match `PREY 0/2 · 2/2` (`MatchHistoryEntry` carries no preyAlive/preyTotal). Projected uncapped B = **3.80** (interaction 3, feasibility 4).
- **C — cap not applied, dissent recorded.** C's `history` expanded summary also invents `PREY REMAINING 2/2` (same `MatchHistoryEntry` gap): a strict reading of §2.2 would cap C's axes 5/7 at 2 as well. reviewer-ux scored C feasibility 3 without a cap because the item is a single datum on a secondary page (vs B's feature-implication + systemic rows). I accept 3 for the shared table, record the asymmetry here, and will revisit consistency in task-12; if strict, C would be 3.45.
- **Not capped, explicitly:** A's occluded second cyan *surface* in `sheet-room-settings` is a DOM/occlusion artifact (the sheet fully covers the lobby `Begin the hunt`); B's ALL-CAPS mono labels are data/stencil labels (not §2.6 headings; still a consistency fix); B's "Not on Google Play"/test-deployment copy and C's server-IP line are honesty/design-hygiene questions, not dev strings; C's zero filled cyan surface is a documented deliberate reweight (scored on axis 1, not capped).

**Feasibility verification (independent, read-only server check):**
- `tagPolicy` enum is real and server-enforced: `confirm | instant` (`server/src/domain/match.ts:39`, `server/src/rooms.ts:442`, `types.ts:30`). B's costed Confirm/Instant control is genuinely client-only work; C's read-only "Tags need the Prey to confirm" row is honest. `skills/PAGE_INVENTORY.md` §20.2 ("enum not documented") is stale on the server side — a skills fix for the Lead.
- An expired tag claim becomes a **dispute** the huntmaster decides (`server/src/rooms.ts:58–70, 337, 368–383`), so C's "NO ANSWER IN 01:12 · the Huntmaster decides" countdown copy is **accurate**. Credit to C; A/B do not render the expiry, and A's claim "raised at 20:52" omits the 90 s window.
- `MatchHistoryEntry` (Models.kt:226) carries only id/startedAt/endedAt/winner/cancelled/durationSec/prey/hunters — no preyAlive/preyTotal. This is the evidence behind the B/C history findings.

## 2. Direction A — "Matchday, raised"

**System snapshot.** The shipped MATCHDAY thesis, finished and scaled: a two-band scoreboard (state/mast + one big number), display ladder 60–96, chalk rules instead of cards, code promoted into the Board's big row on `lobby`, claim and full time as composed moments, settings/room-rules as ruled manual pages. The most *complete* system of the three — every page looks designed, not improvised — and the one that most clearly reads as ManHunt without the wordmark.

| Axis | Score | Evidence (page) | Why |
|---|---:|---|---|
| Brand & product fit | **4** | `home`, `lobby`, `hunt-hunter`, `result`, `settings`, `lobby-rtl` | Board/clock + team grammar + code/field-log/field-plate are structure, brand line is placed correctly, palette roles hold, no gradient/card regressions. Not a 5: the masthead Settings entry is **icon-only** (brand bans unlabelled icon-only nav) and the lighting of `sheet-room-settings`/board is very close to shipping rather than a pitch-deck advance; the one genuinely new identity move is code-as-Board. |
| Distinctiveness / memory | **4** | all 14 at 30 % | Memorable silhouette (scoreboard + code) and ownable moves (Board code, claim at display scale, manual settings). Holds on secondary pages/states; no template tells. Held off a 5 because it is consciously a *raised version of the current app* — the owner may read it as "same app, better", not a new idea. |
| Hierarchy & clarity | **5** | `home`, `lobby`, `hunt-hunter`, `result`, `sheet-tag-claim` | Squint test passes: one cyan primary, clock/code/winner is the loudest object, everything else ranks below, dense pages stay calm. `hunt-hunter` board 41:12 is the first read; `lobby` code is the hero; `result` winner at 84. |
| System consistency | **5** | all 14 + proofs | One grammar: Board variants (masthead/lobby/live/full-time), rules, plates only for interaction, docks, sheets. Deviations (Board code, 90 % rules sheet, 68/52 clock) are documented in NOTES §13. Light/RTL inherit the system. |
| Interaction & flow UX | **2** ⛔ | `result` | Capped by §2.7 (above). Otherwise: claim is a successful decision surface, disabled actions carry reasons, update-available/permission/cancelled states rendered. Non-happy states offline/loading/error/paused/eliminated are notes-only (see §2A gaps). |
| Accessibility & RTL/i18n | **3** | `lobby-rtl`, `home-light`, all pages | AA text pairs pass and the RTL proof is the strongest mirror (Arabic face, LTR code/numerals, mirrored rules/rows/dock). Debt accepted from reviewer-ux measurement: **92 sub-11 sp nodes** (10.5 sp `data.small` on board gutters/chat gutter/history meta, 9.5 sp settings footer), **36 metadata pairs at 5.34:1** (`#A7B6CC` under 12 sp on ink — needs ≥7:1), 4 sub-48 dp controls (rules switches 40×22), Arabic letter-spacing contradicts the direction's own "no tracking" rule. Light proof is a real translation but a different state (below). |
| Engineering feasibility | **2** ⛔ | NOTES §9/§14 | Capped by §2.7. The underlying mapping is excellent (Board→MatchBoard, rules→ChalkRule, etc., no engine work; rematch/tag-policy/history-summary/offline costed) — this would be a 4–5 if the rematch row were labelled. |

**Top 3 strengths**
1. **The Board is finally a scoreboard, and the code is the match's number** (`lobby`): one system, three variants, and the most ownable identity move in the set.
2. **Craft floor is the highest**: alignment, plates-only-when-interactive, tabular numerals, honest data (`0 / 2`, `18:48 played`), display hierarchy that survives dense pages (`settings`, `sheet-room-settings`).
3. **States as moments**: `sheet-tag-claim` (consequence as title, who/when data, one clear decision) and `result` are the most shippable emotional beats; `settings` update-available is the most credible "finished v2" page.

**Top 3 problems (each → one concrete fix)**
1. **`result` — "Play again" is presented as a shipped action** (cap 7, kills axes 5/7). → Add the proposal marking ("Play again · proposal" + one mono line: needs a server restart) as B/C do — or delete the row. This single change lifts the cap and A's weighted total to 4.05.
2. **`home-light` — the proof shows a different state from dark `home`** (dark: blank code cells, "Riverside Run" in Hunt name; light: K7M2QX prefilled, Hunt name empty, Join enabled-looking). A proof must prove the same system/state in daylight. → Re-render `home-light` with the canonical dark-Home state (empty code, name populated) and identical enabled/disabled states.
3. **Auxiliary type is below the brief floor and the Settings entry is icon-only.** 10.5 px mono meta/who/when across pages (31 declarations; board "Remaining/Latest reports", lobby meta, claim "raised at 20:52") and the masthead Settings glyph has no label. → Raise mono metadata to 11.5–12 px and reflow (no density loss needed — there is slack on `lobby`, `hunt-hunter`); add a visible "Settings" label or make it a text action in the footer.

**Delivery/quality notes (non-blocking, fix if cheap):** `history` row has one clipped text node; `sheet-room-settings` shows London coordinates ("East gate · 51.5007, −0.1246") that do not match the Manhattan "Riverside Run" seed; "hosted test server" is used as a server *name* rather than an address (honest, but vague).
**Worst 3 pages:** `home-light` (parity defect) · `result` (cap) · `hunt-prey` (deliberately sparse by rule; at thumbnail it reads as an empty map — add one in-map own-position label/report-cadence line as A's own NOTES §14.1 suggests, without adding other players).

**Page gaps vs PAGE_INVENTORY §18:** rendered — LIVE + fresh/stale reports + trail/zone (`hunt-hunter`), claim (`sheet-tag-claim`), everyone-ready lobby, update-available + permission-allowed (`settings`), cancelled history row, RTL, light. Notes-only (copy+layout specified, not rendered): offline/reconnecting, loading/error, paused, eliminated/spectating, chat empty/send-failed, history empty/loading/error, claim busy/error/disputed-huntmaster, room-load error.
**Caps:** §2.7 → axes 5/7 = 2 (see above).
**RTL/light read:** RTL is genuinely re-composed (Arabic names, mirrored sheet/dock, LTR code/numerals; new Arabic strings flagged for copy review). Light is a real translation (ink masthead light chrome, daylight chalk) — parity defect above is a state issue, not a system issue.
**Feasibility flags:** Board code slot / Board variants = small Compose work on existing `MatchBoard`; drawn field/map stand-in = allowed and labelled; rematch = server action (unlabelled in render, the cap); tag policy read-only = zero work; history summary uses real fields only; offline strip = small client work. No engine change.
**NOTES honesty check:** strong — known weaknesses list is candid (thin hunt-prey, drawn result plate, dense settings, 90 % sheet, Arabic new strings, no rendered states). The only NOTES↔render gap is the rematch flag (NOTES says proposal; render does not).

**Dialogue log:** see §7 (designer messages sent after the reviewer-ux independence gate; replies appended here).

---

## 3. Direction B — "Street signal"

**System snapshot.** The phone as a street poster for tonight's game: two registers (Poster for ceremony — auth/roles/home/lobby/result/history/settings; Placard for operation — hunt/chat/claim/rules), giant Big Shoulders words and numerals, flat colour fields, kit-tag names, tape/stamp/marker gestures, one constant bottom dock. The boldest and most memorable direction; the riskiest for stress use, but the Placard register keeps data pages calm.

| Axis | Score | Evidence (page) | Why |
|---|---:|---|---|
| Brand & product fit | **4** | `home`, `lobby`, `result`, `hunt-hunter`, `roles`, proofs | Unmistakably ManHunt (mark/line/code/team semantics/field log), and clearly an identity advance. Rule breaks are mostly contained: mono stencil labels are not headings (judged under §2.6 — see below), but a few labels contradict B's own "no ALL-CAPS" rule; "Not on Google Play"/TEST DEPLOYMENT are honest required copy, not dev strings. |
| Distinctiveness / memory | **5** | all 14 at 30 %; `result`, `roles`, `home` | One glance from memory: giant "Host"/"Join", the coral/violet roles split, the violet winner block with the FULL TIME stamp, kit-tag names. Every page contributes; references (street print, ticket stubs, stamps) are digested into a repeatable grammar, not stickers. |
| Hierarchy & clarity | **4** | `home`, `lobby`, `hunt-hunter`, `result` | Eye lands correctly on the big object + dock action; clock dominance and claim hierarchy are strong. Held from 5: `lobby` runs three loud colour surfaces (code, Prey banner, Hunters banner, cyan ready ticks) so the reading order takes a beat; `result` stacks the winner block + map + teams before the action. |
| System consistency | **4** | all 14 + proofs | The two-register system is real and documented; dock/sheet/tag/row grammar recurs; light/RTL inherit it. One grammar explains ~90 % of pixels. Docked by: ALL-CAPS labels that B's own NOTES §12.6 bans ("FIRST RUN · HOW IT WORKS", "5 STEPS", "CLASSIC IS PLAYABLE", "LOAD OLDER MESSAGES", "NEWEST FIRST", "DARK FIRST"); two primary treatments (cyan operational vs chalk event) that are defensible but undocumented as a rule; `settings` 1 px page overflow. |
| Interaction & flow UX | **2** ⛔ | `lobby`, `hunt-hunter`, `history`, `result` | **Capped by §2.2/2.7 (invented data).** Independently: the claim is the best *event* treatment in the set and the persistent claim strip is the right stress pattern. But B's canonical **lobby cannot run a hunt** — no host Ready/Stand down, no side switch (reviewer-ux S1; confirmed against PAGE_INVENTORY lobby) — and room-rules omits zone-centre/map-picker controls; `history` paints empty-state copy under a populated list; `result` mislabels duration. Non-happy states are notes-only. |
| Accessibility & RTL/i18n | **2** | B a11y pass; reviewer-ux measurements | Pre-review pass verified (`--dim` #9AA9BF = 7.85:1, `.side p` 13 px, metadata <7:1 pairs 46→7). Still below the bar I scored: **16 sub-48 dp controls across 10 pages** (e.g. "Review tag claim" 97×32, "View hunt history" 109×32, "Rematch" 116×32, "Play Classic instead" 113×28), `roles` counters **12 px at 3.92:1 (AA fail)**, 3 unisolated numeric runs in `lobby-rtl`, Arabic labels set in mono/letterspaced, settings overflows canvas by 12 px. |
| Engineering feasibility | **2** ⛔ | NOTES §14–15 | **Capped 2.2/2.7.** Otherwise credible (tape = `graphicsLayer`, stencil = overpaint, MatchMap chrome only; tag policy `confirm|instant` verified real client-only; rematch correctly flagged; offline small client work). The cap's evidence: two invented violet "other hunter" markers (no hunter positions in contract) + invented per-match `PREY 0/2`/`2/2` in `history` (`MatchHistoryEntry` has no preyAlive/preyTotal). Both are one-render fixes. |

**Top 3 strengths**
1. **A real two-register system** that solves the territory's own biggest risk: ceremony pages shout, operational pages go calm — and the hunt page still puts the clock + one thumb action first.
2. **The claim as an event** (`sheet-tag-claim`): consequence copy before the decision, dismiss-safe ("Dismissing keeps the claim waiting"), and the strongest use of team colour semantics in the set.
3. **Ownable, repeatable physical grammar**: kit-tag names, tape labels, stamp, marker underline and the constant dock give the whole set one identity without extra illustration — the most pitch-deck/social-ready direction.

**Top 3 problems (each → one concrete fix)**
1. **Invented data on the two trust surfaces (cap 2.2/2.7).** `hunt-hunter` draws two violet "other hunter" markers (no hunter positions exist in the contract/server; it implies teammate tracking) and `history` invents per-match `PREY 0/2 · 2/2` (`MatchHistoryEntry` carries no preyAlive/preyTotal). → Delete the two ally markers (keep own team-colour + chalk ring + YOU, coral prey markers) and drop the per-match prey-remaining from history (or add a costed server-field proposal in NOTES). One render fixes both and lifts the cap (projection 3.80).
2. **The canonical lobby cannot perform its real job.** No "Ready to hunt / Stand down" for the host (a host is a player; Begin is blocked until everyone is ready) and no side-switch action — the shipped `LobbyDock`/`TeamSheet` both exist. → Add the inline ready control and the team-tag side switch to the dock/columns; `lobby` then matches A/C's completeness.
3. **`history` and `result` content contradictions.** Populated history ends with "Hunts appear here once they finish." and shows `PREY 2/2` on a cancelled match; `result` reads "DURATION 60:00" beside "18:48 PLAYED"/20:41–21:00. → Delete the empty line from the populated frame, omit prey-remaining on cancelled, label the limit "LIMIT 60:00" (or "18:48 played of 60:00"). Also: sentence-case the ALL-CAPS action/eyebrow labels that B's own NOTES bans, and fix the 16 hit areas + `roles` counter contrast.
**Worst 3 pages:** `history` (copy contradictions) · `hunt-hunter` (unshipped ally data) · `result` (duration label). `settings`' 1 px overflow is cosmetic but should be corrected for the canvas contract.
**Page gaps vs PAGE_INVENTORY §18:** rendered — claim sheet + persistent claim strip, stale reports, update-available, permission allowed/not-allowed, planned modes, disabled join. Notes-only: offline/reconnecting, loading/error, paused, head start, eliminated/spectating, history empty/loading/error, chat empty/send-failed, tag-claim busy/error.
**Caps:** none. Explicitly not capped: mono ALL-CAPS labels (not headings; still a consistency finding above), invented ally markers (named feasibility finding; §2 does not enumerate it), honest "Not on Google Play"/TEST DEPLOYMENT copy (required honesty, a false positive in the audit's forbidden heuristic).
**RTL/light read:** `lobby-rtl` genuinely mirrored (names as Arabic kit tags, code/numerals LTR, mirrored header/dock), but 3 Latin/number runs lack LTR isolates — fix for robustness. `home-light` is a deliberate translation (ink Host block stays ink, light Join block, same content/parity) and reads as the same product in daylight.
**Feasibility flags:** tape/stamp = graphicsLayer rotation, semantics cleared; stencil = overpaint boxes (text remains real text); marker = vector path; map chrome only; tag policy client-only (verified); rematch server action (flagged); ally markers = remove (or new server data); offline strip = small client work. No engine change.
**NOTES honesty check:** very strong (own risk register, explicit rejections, verified server claims, honest hand-built-map note). Two NOTES↔render gaps: the ally markers are not mentioned; the "no ALL-CAPS headings/eyebrows/labels" rule is contradicted by rendered labels.

**Dialogue log:** see §7.

---

## 4. Direction C — "Field instrument"

**System snapshot.** The phone as a survey instrument for a chase: map-first field chart, calibrated readout band (state + big cyan clock + ruler), hairlines/ticks, mono data, team chits and a manifest, one paper field note at the human beats. The most rigorous system and the most content-driven idea in the set ("show the error bars": every position carries age + accuracy, "latest reports, not live"). Colder by design; warm moments are deliberate but sparse.

| Axis | Score | Evidence (page) | Why |
|---|---:|---|---|
| Brand & product fit | **3** | `home`, `lobby`, `hunt-hunter`, `result`, `roles` | Palette roles are correct (cyan = time/field, coral/violet = teams), the mark/lockup is used properly and the system is clearly a ManHunt direction; but at page level it reads **more field-device than friends' game** — exactly the reading the brand's prior redesign flagged for this territory. The paper FieldNote + first-name copy mitigate on `result`/`sheet-tag-claim`; on home/lobby/hunt the instrument grammar dominates the game's warmth. It also breaks two shipped system rules deliberately: no filled cyan primary (all primaries are chalk/ink blocks) and 01–05 roster numbering (TOKENS banned decoration) — documented, but brand-costly. |
| Distinctiveness / memory | **5** | all 14 at 30 %; `hunt-hunter`, `result`, `sheet-tag-claim` | The most original *idea* in the set and it is content-driven, not costume: error bars/ages/accuracy around a real game truth; cyan readout band; paper note. One-glance memory test passes ("dark field chart, cyan time readout, paper note"). Every page contributes; the memory test could only belong to this product. |
| Hierarchy & clarity | **4** | `hunt-hunter`, `result`, `settings`, `home` | Game pages pass (clock → map → dock action; claim decision clear; result winner clear). Held from 5: utility pages are dense readout stacks where the eye needs a beat; `home` has three loud objects (brand line, black status band, join/host blocks) before the dock, and it puts Join before Host; `result` makes the unshipped Rematch the largest object; some data repeated (NEXT REPORT in dock and cadence row; answer countdown in claim header and footer). |
| System consistency | **5** | all 14 + proofs; NOTES §3 | Best-documented grammar in the set: bezel, readout band, rule labels + survey ticks, manifest, chit, stepper/rocker, dock, paper note. A table of components would explain every page; proofs inherit it; deviations recorded. (Identity/timeline bugs are content, not grammar.) |
| Interaction & flow UX | **3** | `result`, `home`, `history`, `sheet-tag-claim` | Strong decision surfaces (claim countdown + "what confirming means" + no-answer consequence, verified accurate against server expiry→dispute) and broad state coverage (stale+ages, permissions, update, planned modes, disabled join reason, load older; add the host ready/team-switch completeness check). Gaps: offline/loading/error/paused/head-start/eliminated notes-only; `result` makes the **unshipped Rematch the primary action** while "Back to lobby" is a text action; `history` wrong row time/omits the just-played match; identity contradiction. *reviewer-ux scores this 4; dissent recorded — I keep 3 until Rematch is demoted.* |
| Accessibility & RTL/i18n | **3** | audit; proofs | Best text floors (audit `hard<12` 0–6/page; body 15/data 13/labels 12; 0 AA fails) and a genuine RTL proof. Held at 3 by measured target/proof debt: **10 room-rules steppers 44×38 + 2 settings steppers 48×42 + 2 switches 48×28 (<48 dp)**; switches signal state by fill colour alone; 7 unisolated numeric runs and Arabic labels in mono/letterspaced in `lobby-rtl`; ~70 physical-direction props/page is a fragile RTL implementation. |
| Engineering feasibility | **3** | NOTES §8/§12.3; server check | Meticulous mapping/costed deltas and claim expiry verified (no engine work; tag policy honest read-only). Held at 3 by one invented datum (`history` `PREY REMAINING 2/2` — `MatchHistoryEntry` has no preyAlive/preyTotal; strict §2.2 would cap, §8), plus Home's `GPS ±6 m / Location On` pre-hunt readout (no shipped client source) and the real public IP `74.208.99.178` in auth/settings (owner rejected infra hosts in premium captures). All cheap fixes. |

**Top 3 strengths**
1. **"Show the error bars"** — report ages, accuracy rings, fresh/stale shapes and "not a live track" make the hunt HUD honest and genuinely original; the most content-driven idea in the round.
2. **The most rigorous system**: one grammar across 14 pages, best text/contrast floors, a real readout hierarchy, and an implementation map an engineer can start from.
3. **The human beats land**: the paper FieldNote on `result` and the "what confirming means / no answer in 01:12" claim panel are warm, plain and specific — the right antidote to instrument coldness.

**Top 3 problems (each → one concrete fix)**
1. **Identity contradiction:** `home`/`home-light`/`settings` say "Playing as Omar", while `lobby`/`lobby-rtl` show Nadia as HOST · YOU and the huntmaster. One session must have one identity. → Make the user Nadia everywhere (fewest page changes; matches host/huntmaster) or set the lobby host to Omar and mark Omar HOST · YOU.
2. **`result` makes the unshipped Rematch the primary action** (largest chalk block) with Back to lobby as a text action. Even labelled, the page's strongest affordance cannot be used. → Swap: Back to lobby primary (chalk block), Rematch as a labelled secondary/proposal row; keep the caveat. (Pure hierarchy fix; the claim countdown/expiry copy is verified accurate and stays.)
3. **`history` shows an invented score and wrong timeline:** per-match `PREY REMAINING 2/2` is not in `MatchHistoryEntry` (invented datum; reviewer-ux S1), the Sat row reads start 21:41 while its detail says 20:41–21:41, and the just-played match from `result` (Sat 4 Nov, 18:48) is absent. → Drop the survival line (or add a costed server-field proposal), correct the row time, include/align the current match. Also fix in the same pass: 10 room-rules steppers <48 dp + colour-only switch states; `lobby` clipped "Nadia"; Home pre-hunt GPS band (flag or reduce to permission state); real IP → honest server label; Arabic tracking/isolates on the proof.
**Worst 3 pages:** `result` (rematch prominence) · `home` (identity + pre-hunt status band) · `history` (timeline/time). `sheet-room-settings` is the densest sheet with the most target violations — it survives at full size but needs the target pass.
**Page gaps vs PAGE_INVENTORY §18:** rendered — claim + countdown + auto-resolve live, stale reports with ages/accuracy, update-available, permission allowed/off, planned modes, disabled join reason, load-older, notifications off. Notes-only: offline/reconnecting, loading/error, paused, head start, eliminated/spectating, chat empty/send-failed, history loading/error.
**Caps:** none. Not capped: zero filled cyan surfaces (deliberate documented reweight — a brand-fit cost scored on axis 1, not a cap); the server IP/honest test-deployment copy (needs an owner answer, not a §2 violation); home GPS band (feasibility finding).
**RTL/light read:** `lobby-rtl` is a real mirror (manifest order, host/you labels, map unmirrored, code/numerals LTR) but has unisolated runs and physical-prop-dependent CSS; `home-light` is the most considered light translation (daylight graph paper, ink readout band kept, "Daylight" label) — plausible and still C.
**Feasibility flags:** readout band/bezel/dock = plain Compose; chart = Canvas; claim countdown/ages/accuracy = real fields; "next report" = derived client state (flagged); lobby chart = Canvas, no permission; rematch = server action (costed); tag policy read-only = zero work; home GPS band = needs client/permission work or removal; offline strip = small client work; 70 physical-direction props/page = re-author logical properties for a robust RTL pass. No engine change.
**NOTES honesty check:** exceptional — self-test, known weaknesses, new-copy list, render-fidelity notes, server-verified deltas. Two render↔NOTES tensions: identity mismatch is not acknowledged as a defect; the home status band's data source is not flagged (GPS accuracy before a hunt).

**Dialogue log:** see §7.

---

## 5. Per-page best picks (round 1) — best *visual* version; UX-angle differences noted

| Page | Best visual | Why / what to steal | UX-angle note (reviewer-ux) |
|---|---|---|---|
| `auth` | **A** | Quiet form + field plate + brand line, server honestly demoted to a footer row; most credible first contact. | A ✓ |
| `roles` | **B** | "Two teams. One block. One clock." with coral/violet side blocks is the best explanation of the game as a poster; steal A's field-guide plate for re-read. | **A** (B's live-looking "2/3" counters fail contrast 3.92:1 and misread as room data) |
| `home` | **A** | Two verbs are different objects (named host flow vs 6-cell code), brand line carries the page, one cyan CTA. | **B** (docked two-verb pair = honest state + reach; A placeholders read oddly; C invents pre-hunt GPS) |
| `lobby` | **A** | Code as the Board's hero + two-column team sheet + host controls (ready/stand-down, side switch) + Begin dock with blocker; the only complete lobby. | A ✓ |
| `hunt-hunter` | **C** | Clock dominance + honest reports (ages/accuracy, "not live") + Tag in the dock; the best hunter screen. | C ✓ |
| `hunt-prey` | **C** | Own position only + honest report cadence ("last sent / next") + no other Prey; best Prey screen. | C ✓ |
| `chat` | **B** | Best field-log identity: kit-tag senders, system rules, own-message tab, load-older, draft-safe composer. | B ✓ |
| `result` | **B** | The strongest *event* (violet winner field + FULL TIME stamp) with honest prey-remaining; steal A's action hierarchy + C's paper match-record/time ruler. | **A** (honest dock, no unshipped primary; B's stamp energy worth stealing into A) |
| `history` | **A** | Complete, scannable, only direction that shows no survival score it cannot know; grouped list + last-hunt summary. | A ✓ |
| `settings` | **A** | Ruled manual with every required state (update-available, permissions, read-only server); clearest hierarchy. Steal C's section ticks + "Daylight" label, B's update card. | A ✓ |
| `sheet-tag-claim` | **C** | Best claim moment: who/when + real countdown from `expiresAt` (verified: expiry→huntmaster dispute) + consequence panel + paper note. Steal A's consequence-as-display-title. | C ✓ |
| `sheet-room-settings` | **A** | Complete ruled rules sheet (timing/zone/centre/trails/tag policy + honest server-enforced row). Steal C's stepper grammar; fix A's fake zone coordinates. | A ✓ |
| `lobby-rtl` | **A** | Best genuine mirror: Arabic face, LTR-isolated code/numerals, mirrored rules/rows/dock; fix Arabic tracking in round 2. | A ✓ |
| `home-light` | **B** | Most confident daylight translation: same state as its dark Home, ink Host block stays ink, contrast holds. | B ✓ |

**Count:** A 7 · B 3 · C 3 (visual). A's per-page dominance is real; the single-line rematch cap, not the system, is what keeps A out of first place in the weighted table. Where best-visual ≠ best-usable the final recommendation will state both.

---

## 6. Three stealable ideas (across directions)

1. **A's two-band Board with "the match's one number" per variant** (lobby code → live clock → full-time duration). It turns the whole app into one recognisable object and makes the lobby's social object the hero. Highest-leverage steal for whichever direction ships.
2. **B's tag claim as an event with a dismissal-safe strip** — full-bleed consequence banner + two stacked decisions + "Dismissing keeps the claim waiting." Take the emotional treatment; keep the honest copy.
3. **C's "show the error bars" honesty model + claim countdown** — every position carries age + accuracy, fresh/stale differ by shape+word, "latest reports, not a live track"; the claim shows the real 90 s `expiresAt` countdown and the no-answer consequence (verified server behaviour). This is the most product-specific idea in the round and belongs in the winning hunt/claim surfaces.

---

## 7. Cross-direction risks (fix in round 2 regardless of winner)

1. **Unshipped/invented data is the set's common integrity failure.** A: unlabelled "Play again"; B: invented ally markers + per-match survival scores; C: per-match "prey remaining". All three are one-render fixes, all three are capped or flagged, and the pattern matters more than any single page because the brief is explicit about not implying features the app cannot deliver. Round 2 must show zero invented data in the renders.
2. **State completeness is notes-only where the brief asks for rendered states.** None of the three renders offline/reconnecting, loading/error, paused or eliminated frames; those are the states that prove the system is real. All three designers have now committed to rendering extras (A: `hunt-paused`; C: paused/offline/eliminated; B pending) — verify they appear on the sheets.
3. **Auxiliary type + targets below the brief floors are systemic (A worst, B next).** A 92 sub-11 sp nodes / 36 metadata pairs at 5.34:1 / 4 sub-48 controls; B 16 sub-48 controls + a real AA fail at 3.92:1; C 10 steppers + colour-only switches. Round 2 must show the type/target pass in the renders, not just NOTES.

---

## 8. Reconciliation with reviewer-ux

**Their table (19:52):** A 3.75 · B 3.50 · C 3.90. **My table after accepting their measured evidence:** A 3.60 (capped) · B 3.35 (capped) · C 3.75. **Both reviewers independently agree the round-1 ranking is C > A > B**, and both agree the gaps are small and fixable; the ordering must be re-established from round-2 renders.

**Accepted from reviewer-ux (evidence was stronger than my read):**
- **B cap 2.2/2.7 → axes 5/7 = 2** (invented hunter positions + `history` per-match survival scores; data-contract proof checked in `Models.kt:226`).
- **B a11y 3 → 2** (16 sub-48 dp controls; `roles` counters 12 px / 3.92:1 AA fail; Arabic labels mono/letterspaced).
- **B lobby S1** (no host Ready/Stand down, no side switch) — confirmed against PAGE_INVENTORY lobby and B's render; added to B's problem list.
- **A a11y 3 confirmed** (92 sub-11 sp nodes, 36 metadata pairs 5.34:1, 4 sub-48 controls, Arabic tracking).
- **C a11y 4 → 3** (10 room-rules steppers <48 dp, colour-only switches) and **C feasibility 4 → 3** (invented history "prey remaining", pre-hunt GPS band, real IP).
- Shared findings: chat system events are server-English in all three; Arabic typography debt is universal (tracking/mono); leave/end confirm is undocumented; only C renders the map text-alternative list.

**My dissents (recorded, not averaged):**
1. **A cap.** reviewer-ux treats A's "Play again" as a quiet flagged proposal and does not cap; I score the render, where it has no proposal marking, so I keep the §2.7 cap on axes 5/7 and show the one-label fix + 4.05 projection. A's NOTES and the new round-2 render ("Proposal" tag) will lift it.
2. **C interaction 3 vs their 4.** Rematch — unshipped — is still the largest affordance on `result`; until demoted I keep 3.
3. **C feasibility asymmetry.** The same §2.2 class that capped B (invented per-match data) also applies to C's `PREY REMAINING 2/2`, but reviewer-ux scores 3 on severity. I accept 3 for the shared round-1 table, record the asymmetry, and will settle it in task-12: either strict caps for both (C would be 3.45) or the severity read for both.
4. **C consistency 5 vs their 4** — their switch-state issue is an a11y/state-cue problem, not a grammar break; C's grammar is the most complete in the set.
5. Secondary-read differences (B hierarchy, A distinctiveness) defer to me per the agreed split.

**File collision (scores JSON).** Both reviewers wrote `reviews/scores-round-1.json`. Current filesystem state: canonical file holds **my** (reviewer-visual) table; `reviews/scores-round-1-ux.json` also holds a copy of mine — reviewer-ux's table was lost in the rename race (their weighted totals survive in `round-1-ux.md` and their message). Resolution: I save my table as `reviews/scores-round-1-visual.json`; reviewer-ux rewrites their table to `reviews/scores-round-1-ux.json`; **no numbers are overwritten in prose** and task-12 merges both. The canonical filename is not rewritten again until the merge.

---

## 9. Designer dialogue log

*Independence gate opened once both reviewers' tables existed (19:52–19:55). Messages below are the round-1 hand-off; designers' replies are logged with their round-2 commitments.*

| # | Date/time (UTC) | Target | Message (headline) | Reply | Effect on round 2 |
|---|---|---|---|---|---|
| 1 | 19:55 | designer-a | Cap diagnosis: label/remove "Play again"; home-light parity; type floor + metadata contrast + 48 dp; icon-only Settings; hunt-prey label; map text alternative; coordinate fix. | Accepted: proposal tag + server-note line; home-light re-render from identical state; `data.small` 10.5→11.5 + muted alpha .75; labelled Settings; in-map own-position label; map text alternatives; London coords fixed. Partial pushback: "hosted test server" stays as deliberate no-IP honesty; A's advance is scale/craft by territory (accepted). Adds `hunt-paused` extra frame. | Re-score axes 5/7 from new render; re-check type floor/targets; verify parity + paused frame. |
| 2 | 19:55 | designer-b | Three highest-severity: invented ally markers + invented history scores (cap); lobby missing host Ready/Stand down + side switch (S1); history/duration contradictions, roles counter contrast, 16 hit areas, Arabic type/isolation. | *Awaiting reply (round-2 task-10)* | Remove invented data; complete the lobby controls; fix history/duration; type/target pass. Cap lifts when the renders show it. |
| 3 | 19:56 | designer-c | Identity (Omar vs Nadia); Rematch-as-primary swap; history invented survival line + wrong row time/missing current match; 10 steppers + colour-only switches; Home pre-hunt GPS band; real IP; Arabic tracking/isolates; clipped Nadia; chat "newest first". | Accepted: Omar=host everywhere; Back to lobby primary / Rematch labelled secondary; history timeline + just-played match + drop survival line; 12 px floor; ≥48 dp steppers/switches with word cue; remove 01–05 indices; permission-only Home status; neutral server label. Pushback accepted: zero-filled-cyan reweight stays documented; drawn charts stay honest stand-ins. Adds paused/offline/eliminated extras. | Re-score from new `out/`; check identity/lobby/history fixes, target pass, rematch hierarchy, Arabic proof. |

---

## 10. Honest limitations of this review

- **Not every page was viewed at full 1170×2532.** All 42 renders were judged at contact-sheet/30 % scale; full-size reads covered ~8–9 pages per direction (core pages + proofs + claims + settings + problem pages); the rest verified via visible-text extraction, CSS and audit measurements. Page picks for `roles`/`chat`/`history`/`room-settings` lean on medium-size + text evidence.
- **B was judged after a mid-review a11y pass** (19:41–19:42); comparison is against the current renders only.
- **Both reviewers are design-literate, not the owner.** Brand-fit/distinctiveness scores are rubric-anchored but finally taste-adjacent; the owner's call may legitimately weight the "poster" or "instrument" reading differently — hence the per-page picks and both rankings.
- **Scripted HTML mocks, not Compose builds.** Feasibility is read from pages + NOTES + spot checks of `Models.kt`/server code; no motion/scale prototype was tested, and 320 dp/200 % behaviour is spec-level (reviewer-ux's stress audit is indicative, not a build).
- **A11y values are reviewer-ux's DOM audit + my spot checks**, not a device screen-reader run; computed contrast has a known artifact class (A's cyan-surface false positive).
- **Reconciliation is round-1 only.** The shared table merges in task-12 after round-2 renders; cap-lift projections here are informative, not scores.
- **Bias named:** A's per-page dominance plus a cheap cap fix could make me undervalue B/C originality; I keep the weighted table honest, show A's cap-lifted projection, and require round-2 re-scoring from renders before any final ranking.
