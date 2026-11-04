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

## 1. Scores (round 1, independent)

| Axis (weight) | A — Matchday, raised | B — Street signal | C — Field instrument |
|---|---:|---:|---:|
| 1 Brand & product fit (15 %) | **4** | **4** | **3** |
| 2 Distinctiveness / memory (15 %) | **4** | **5** | **5** |
| 3 Hierarchy & clarity (15 %) | **5** | **4** | **4** |
| 4 System consistency (15 %) | **5** | **4** | **5** |
| 5 Interaction & flow UX (15 %) | **2** ⛔cap | **3** | **3** |
| 6 Accessibility & RTL/i18n (10 %) | **3** | **3** | **4** |
| 7 Engineering feasibility (15 %) | **2** ⛔cap | **4** | **4** |
| **Weighted total (/5)** | **3.60** | **3.90** | **4.00** |

**Caps applied (rubric §2, mandatory before averaging):**
- **A — cap 7 ("rematch presented as shipped") → axes 5 and 7 capped at 2.** `result.png` shows a plain inline **"Play again"** row with no proposal marking; the app has no rematch (PAGE_INVENTORY §20.1). NOTES flags it, but the render is scored, and the owner would read it as available. **One-line fix** (label it, or remove it) lifts the cap; projected uncapped A = **4.05** (axes 5/7 at 3/4) — i.e. the cap, not the system, is what puts A third.
- No caps applied to B or C. Judgment calls recorded rather than silently applied: B's mono all-caps labels are not headings (see §2B), B's "DURATION 60:00" and history empty-copy are content bugs (named, not caps), B's extra violet map dots are an unshipped-data finding (named under feasibility, not a §2 enumerated cap), C's rematch **is** labelled as a proposal in-render (no cap, but it is the primary action — a flow defect).

**Two feasibility claims verified against the shipped server (read-only, independent):**
- `tagPolicy` enum is real and server-enforced: `confirm | instant` (`server/src/domain/match.ts:39`, `server/src/rooms.ts:442/types.ts:30`). B's costed Confirm/Instant control is genuinely client-only work; C's read-only "Tags need the Prey to confirm" row is honest. `skills/PAGE_INVENTORY.md` §20.2 ("enum not documented") is out of date on the server side — worth correcting in skills.
- An expired tag claim becomes a **dispute** the huntmaster decides (`server/src/rooms.ts:58–70, 337, 368–383`), so C's "NO ANSWER IN 01:12 · the Huntmaster decides" countdown copy is **accurate**, not invented. Credit to C; A/B do not render the expiry.

---

## 2. Direction A — "Matchday, raised"

**System snapshot.** The shipped MATCHDAY thesis, finished and scaled: a two-band scoreboard (state/mast + one big number), display ladder 60–96, chalk rules instead of cards, code promoted into the Board's big row on `lobby`, claim and full time as composed moments, settings/room-rules as ruled manual pages. The most *complete* system of the three — every page looks designed, not improvised — and the one that most clearly reads as ManHunt without the wordmark.

| Axis | Score | Evidence (page) | Why |
|---|---:|---|---|
| Brand & product fit | **4** | `home`, `lobby`, `hunt-hunter`, `result`, `settings`, `lobby-rtl` | Board/clock + team grammar + code/field-log/field-plate are structure, brand line is placed correctly, palette roles hold, no gradient/card regressions. Not a 5: the masthead Settings entry is **icon-only** (brand bans unlabelled icon-only nav) and the lighting of `sheet-room-settings`/board is very close to shipping rather than a pitch-deck advance; the one genuinely new identity move is code-as-Board. |
| Distinctiveness / memory | **4** | all 14 at 30 % | Memorable silhouette (scoreboard + code) and ownable moves (Board code, claim at display scale, manual settings). Holds on secondary pages/states; no template tells. Held off a 5 because it is consciously a *raised version of the current app* — the owner may read it as "same app, better", not a new idea. |
| Hierarchy & clarity | **5** | `home`, `lobby`, `hunt-hunter`, `result`, `sheet-tag-claim` | Squint test passes: one cyan primary, clock/code/winner is the loudest object, everything else ranks below, dense pages stay calm. `hunt-hunter` board 41:12 is the first read; `lobby` code is the hero; `result` winner at 84. |
| System consistency | **5** | all 14 + proofs | One grammar: Board variants (masthead/lobby/live/full-time), rules, plates only for interaction, docks, sheets. Deviations (Board code, 90 % rules sheet, 68/52 clock) are documented in NOTES §13. Light/RTL inherit the system. |
| Interaction & flow UX | **2** ⛔ | `result` | Capped by §2.7 (above). Otherwise: claim is a successful decision surface, disabled actions carry reasons, update-available/permission/cancelled states rendered. Non-happy states offline/loading/error/paused/eliminated are notes-only (see §2A gaps). |
| Accessibility & RTL/i18n | **3** | `lobby-rtl`, `home-light`, all pages | AA holds (audit: 0 AA fails) and the RTL proof is genuine (mirroring, Arabic face, LTR-isolated code/numerals, no bidi flips). But the auxiliary floor is broken systemically — 10.5 px mono labels across board/meta/who/when (31 CSS declarations; audit `hard<12` 4–18/page) — below the brief's ≥12 sp auxiliary rule, and metadata <7:1 on 8 pages (audit). Light proof is a genuine translation but not parity (below). |
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
| Interaction & flow UX | **3** | `sheet-tag-claim`, `hunt-prey`, `history`, `settings` | The claim is the best *event* treatment in the set and the persistent claim strip is the right stress pattern; update/permission/planned-mode/disabled states are rendered. Gaps: offline/loading/error/paused/head-start/eliminated are notes-only; `history` renders empty-state copy under a populated list and shows `PREY 2 / 2` on a cancelled match; `result` footer mislabels the time limit. |
| Accessibility & RTL/i18n | **3** | B a11y pass; audit | Pre-review pass verified: `--dim` #9AA9BF = 7.85:1, `.side p` 13 px, 0 AA fails across 14 pages. Residual gaps: many `hard<12` mono nodes (audit 12–23/page on chat/lobby/history/result), 10 px labels still in history meta/tape/lobby switch (and one 8 px decorative), 3 unisolated Latin/number runs in `lobby-rtl`, 1 px page-scroll on settings. Colour is never sole cue; targets mostly 48. |
| Engineering feasibility | **4** | NOTES §14–15 | No engine work claimed and the mapping is credible (blocks, tape rotation via graphicsLayer, stencil via overpaint, MatchMap chrome only); tag-policy `confirm|instant` verified real (client-only); rematch correctly flagged as proposal; offline small client work. One unshipped-data issue: `hunt-hunter` draws **two extra violet hunter/ally markers** (source comment: "hunters: other hunters violet dots") that are not in the data contract (`LatestLocations` = prey only) and are not noted in NOTES §10.5 — see fix. |

**Top 3 strengths**
1. **A real two-register system** that solves the territory's own biggest risk: ceremony pages shout, operational pages go calm — and the hunt page still puts the clock + one thumb action first.
2. **The claim as an event** (`sheet-tag-claim`): consequence copy before the decision, dismiss-safe ("Dismissing keeps the claim waiting"), and the strongest use of team colour semantics in the set.
3. **Ownable, repeatable physical grammar**: kit-tag names, tape labels, stamp, marker underline and the constant dock give the whole set one identity without extra illustration — the most pitch-deck/social-ready direction.

**Top 3 problems (each → one concrete fix)**
1. **`hunt-hunter` shows other hunters' positions** (two violet rings outside the "You" marker) — the app cannot know ally positions; it implies a teammate-tracking feature that does not exist and is not costed in NOTES. → Remove the two ally markers (keep own team-colour + chalk ring + YOU, and the coral prey markers); if the owner ever wants ally visibility, add it to NOTES as a data/API delta with a cost.
2. **`history` content contradictions**: the populated list ends with "Hunts appear here once they finish." (empty-state copy) and the cancelled row shows `PREY 2 / 2`. → Delete the empty line from the populated frame (keep it only in the empty state) and omit prey-remaining on cancelled matches (score unknown/not final).
3. **`result` footer mislabels duration**: "STARTED 20:41 · ENDED 21:00 · DURATION 60:00" while the strip says "18:48 PLAYED". → Change to "LIMIT 60:00" (or "18:48 played of 60:00") so both numbers mean what they say.
   *Also fix (cheap, own-rule consistency):* sentence-case the ALL-CAPS action/eyebrow labels listed above and note the cyan-vs-chalk primary rule in NOTES; raise residual 10 px history/tape labels to the stated 11 sp floor.

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
| Interaction & flow UX | **3** | `result`, `home`, `history`, `sheet-tag-claim` | Strong decision surfaces (claim countdown + "what confirming means" + no-answer consequence, verified accurate against server expiry→dispute) and good state coverage rendered (stale+ages, permissions, update, planned modes, disabled join reason, load older). Gaps: offline/loading/error/paused/head-start/eliminated are notes-only; `result` makes the **unshipped Rematch the primary action** while "Back to lobby" is a text action (even labelled, the primary is unavailable — swap); `history` has a wrong row start time and omits the just-played match; identity contradiction (below). |
| Accessibility & RTL/i18n | **4** | audit; proofs | Best text floors (audit `hard<12` 0–6/page; body 15/data 13/labels 12; 0 AA fails) and a genuine RTL proof. Docked from 5: `sheet-room-settings` has **10 targets <48 dp** (steppers/switch rows), `lobby` 2, `settings` 2; `lobby-rtl` has 7 unisolated Latin/number runs (code/numbers visually correct, but fragile), and the mock uses ~70 physical-direction CSS properties per page (no logical start/end) — a real implementation/RTL-robustness cost even though the render mirrors correctly. |
| Engineering feasibility | **4** | NOTES §8/§12.3; server check | Meticulous mapping and costed deltas; no engine work; claim countdown verified accurate (server expiry→dispute); tag policy honest read-only; rematch costed. Deltas to watch: lobby chart (canvas, no location permission — good), home status band claims "GPS ±6 m / Location On" **before a hunt** (app does not acquire location on Home; permission is requested at play) → either drop it or note the client/permission change; `result` rematch prominence implies availability; "74.208.99.178" is shown as the server address (confirm this is the real intended public test server, or use an honest placeholder). |

**Top 3 strengths**
1. **"Show the error bars"** — report ages, accuracy rings, fresh/stale shapes and "not a live track" make the hunt HUD honest and genuinely original; the most content-driven idea in the round.
2. **The most rigorous system**: one grammar across 14 pages, best text/contrast floors, a real readout hierarchy, and an implementation map an engineer can start from.
3. **The human beats land**: the paper FieldNote on `result` and the "what confirming means / no answer in 01:12" claim panel are warm, plain and specific — the right antidote to instrument coldness.

**Top 3 problems (each → one concrete fix)**
1. **Identity contradiction:** `home`/`home-light`/`settings` say "Playing as Omar", while `lobby`/`lobby-rtl` show Nadia as HOST · YOU and the huntmaster. One session must have one identity. → Make the user Nadia everywhere (fewest page changes; matches host/huntmaster) or set the lobby host to Omar and mark Omar HOST · YOU.
2. **`result` makes the unshipped Rematch the primary action** (largest chalk block) with Back to lobby as a text action. Even with the visible proposal note, the page's strongest affordance cannot be used. → Swap: Back to lobby primary (chalk block), Rematch as a labelled secondary/proposal row; keep the note.
3. **`history` timeline is wrong/incomplete:** the Sat row reads start 21:41 while its own detail says 20:41–21:41, and the just-played match from `result` (Sat 4 Nov, 18:48) does not appear in the list (latest is Sat 1 Nov). → Correct the row start time (20:41) and include/align the current finished match, or restate the result date to match history.
   *Also fix (cheap):* reduce room-rules <48 dp controls to 10 → 0; raise the 10 px chart labels if design allows (floor is close); review the home pre-hunt GPS band; drop the 01–05 numbering if reviewers/owner read it as decoration.

**Worst 3 pages:** `result` (rematch prominence) · `home` (identity + pre-hunt status band) · `history` (timeline/time). `sheet-room-settings` is the densest sheet with the most target violations — it survives at full size but needs the target pass.
**Page gaps vs PAGE_INVENTORY §18:** rendered — claim + countdown + auto-resolve live, stale reports with ages/accuracy, update-available, permission allowed/off, planned modes, disabled join reason, load-older, notifications off. Notes-only: offline/reconnecting, loading/error, paused, head start, eliminated/spectating, chat empty/send-failed, history loading/error.
**Caps:** none. Not capped: zero filled cyan surfaces (deliberate documented reweight — a brand-fit cost scored on axis 1, not a cap); the server IP/honest test-deployment copy (needs an owner answer, not a §2 violation); home GPS band (feasibility finding).
**RTL/light read:** `lobby-rtl` is a real mirror (manifest order, host/you labels, map unmirrored, code/numerals LTR) but has unisolated runs and physical-prop-dependent CSS; `home-light` is the most considered light translation (daylight graph paper, ink readout band kept, "Daylight" label) — plausible and still C.
**Feasibility flags:** readout band/bezel/dock = plain Compose; chart = Canvas; claim countdown/ages/accuracy = real fields; "next report" = derived client state (flagged); lobby chart = Canvas, no permission; rematch = server action (costed); tag policy read-only = zero work; home GPS band = needs client/permission work or removal; offline strip = small client work; 70 physical-direction props/page = re-author logical properties for a robust RTL pass. No engine change.
**NOTES honesty check:** exceptional — self-test, known weaknesses, new-copy list, render-fidelity notes, server-verified deltas. Two render↔NOTES tensions: identity mismatch is not acknowledged as a defect; the home status band's data source is not flagged (GPS accuracy before a hunt).

**Dialogue log:** see §7.

---

## 5. Per-page best picks (round 1)

| Page | Best direction | Why / what to steal |
|---|---|---|
| `auth` | **A** | Quiet form + field plate + brand line, server demoted to a footer row — the most credible first contact; steal B's bottom-docked single action clarity. |
| `roles` | **B** | "Two teams. One block. One clock." with the coral/violet side blocks is the best explanation of the game as a poster; steal A's field-guide plate for the Classic/planned-mode page. |
| `home` | **A** | Two verbs are genuinely different objects (named host flow vs 6-cell code), brand line carries the page, one cyan CTA; steal B's bottom-docked two-verb button pair for reach. |
| `lobby` | **A** | Code as the Board's hero + two-column team sheet + Begin dock with reason — the most complete room at a glance; steal C's concise rules summary line and B's code-underliner. |
| `hunt-hunter` | **C** | Clock dominance + honest reports (ages/accuracy, "not live") + Tag in the dock; steal B's fresh-report ring and "YOU" label treatment, A's two-band clock scale. |
| `hunt-prey` | **C** | Own position only + report cadence ("last sent / next") is the most honest Prey screen; steal B's persistent claim strip and "keep moving" human line. |
| `chat` | **B** | Best field-log identity: kit-tag senders, system rules, own-message tab, real composer; fix its caps label; steal C's "Room record · 9 entries" header line. |
| `result` | **B** | The strongest *event* (violet winner field + FULL TIME stamp) with honest prey-remaining; steal A's action dock hierarchy and fix B's duration label. |
| `history` | **A** | Complete, scannable, honest (summary uses real fields; cancelled rows handled); steal C's expanded match-summary block layout. |
| `settings` | **A** | Ruled manual with every required state (update-available, permissions, read-only server) and the clearest hierarchy; steal C's section ticks + "Daylight" theme label. |
| `sheet-tag-claim` | **A** | Consequence-first display title, who/when data, clean two-decision surface — most usable under stress; steal C's countdown (verified behaviour) and B's dismiss copy. |
| `sheet-room-settings` | **A** | Complete ruled rules sheet (timing/zone/trails/tag policy, honest server-enforced row); steal C's stepper grammar and fix A's mismatched zone coordinates. |
| `lobby-rtl` | **A** | Genuine Arabic recomposition, LTR-isolated code/numerals, clean mirror; steal B's Arabic kit-tag name treatment. |
| `home-light` | **B** | The most confident light translation (ink Host block stays ink, parity of state, contrast holds); steal C's daylight graph-paper ground as an option. |

*Best-visual ≠ best-usable:* `result` is B's visually but A's is easier to act on; `hunt-prey` is C's visually but B's claim-strip handling is the better stress pattern; `roles` is B's visually but A's field-guide is more informative at a re-read.
**Count:** A 8 pages · B 4 · C 2. A's per-page dominance is real — the cap, not the system, is what keeps A from leading the table.

---

## 6. Three stealable ideas (across directions)

1. **A's two-band Board with "the match's one number" per variant** (lobby code → live clock → full-time duration). It turns the whole app into one recognisable object and makes the lobby's social object the hero. Highest-leverage steal for whichever direction ships.
2. **B's tag claim as an event, not a form** — full-bleed consequence banner + two stacked decisions + "Dismissing keeps the claim waiting." Take the emotional treatment; keep the honest copy.
3. **C's "show the error bars" honesty model** — every position carries age + accuracy, fresh/stale differ by shape+word, "latest reports, not a live track". This is the most product-specific idea in the round and belongs in the winning hunt HUD regardless of the system chosen.

---

## 7. Cross-direction risks (fix in round 2 regardless of winner)

1. **State completeness is notes-only where the brief asks for rendered states.** None of the three renders offline/reconnecting, loading/error, paused or eliminated frames; those are the states that prove the system is real. Round 2 should add at least one rendered strip/frame per direction (offline strip on hunt; paused board; eliminated/spectating prey) — cheap and high-value for the owner pack.
2. **Auxiliary type below the brief floor is systemic** (A worst at 10.5 px, B 10 px, C 10–11 px residual). The contract says body ≥14 sp / auxiliary ≥12 sp; round 2 should raise metadata mono to ≥11.5–12 px and reflow, or the a11y claim fails in implementation review.
3. **Unshipped behaviour presented as available** is the set's common honesty failure mode: A's unlabelled "Play again" (capped), C's Rematch-as-primary (labelled but dominant), B's ally markers (unflagged data). Every one is cheap to fix; the pattern matters more than any single page because the brief is explicit about not implying features.

---

## 8. Reconciliation with reviewer-ux

**Status at filing:** my table above is independent (written before reviewer-ux's `scores-round-1` numbers existed). Their measurement layer (`reviews/evidence/ux-audit.json` + summary, 19:45) was consumed as evidence. Reconciliation will run axis-by-axis when both tables exist; dissents recorded here, never averaged.
**Evidence disagreements I already expect to record:**
1. **A `sheet-room-settings` "2 cyan surfaces"** — audit counts the lobby `Begin the hunt` button behind the fully-covering sheet (occlusion artifact). My visual read: one cyan surface (`Save rules`). No §2.6 cap from me; if reviewer-ux's DOM result is upheld, it is still a false-positive class (background occluded) and belongs in the audit-tool notes.
2. **"Forbidden" tokens** — "Not on Google Play" and the honest "hosted test server / plain-HTTP test deployment" lines are required honesty (brief/voice docs), not dev strings; C's `74.208.99.178` needs an owner answer (real public test server or placeholder), not a cap.
3. **B page-scroll (1 px) on `settings`** — cosmetic contract miss, not a state/flow failure; I score it as a delivery note. B's claim-sheet `out-of-canvas` nodes are decorative bleed with nothing clipped (audit `clipped = 0`).
4. **B all-caps labels** — I judge them data/stencil labels (not §2.6 "ALL-CAPS headings"), so no cap; still a consistency/copy fix. If reviewer-ux reads them as headings, the reconciliation paragraph will say so.
**Split to confirm with reviewer-ux:** I own axes 1–4 (and the page picks); their depth on 5–7 overrides my provisional numbers where evidence differs. `result` best-visual (B) vs best-usable (A) will be stated both ways in the final recommendation.

---

## 9. Designer dialogue log

*Independence gate:* per agreement with reviewer-ux, findings/impressions are shared with designers only after both `scores-round-1.json` files exist. Messages sent + replies will be appended here (item → designer response → accept/partial/pushback → round-2 effect).

| # | Date | Target | Message (headline) | Reply | Effect |
|---|---|---|---|---|---|
| — | — | — | to be appended after the gate | — | — |

---

## 10. Honest limitations of this review

- **Not every page was viewed at full 1170×2532.** All 42 renders were judged at contact-sheet/30 % scale; full-size reads covered ~8–9 pages per direction (the four core pages + proofs + claims + settings + selected problem pages); the remainder were verified via visible-text extraction, CSS/audit measurements and the sheet. Page-level picks for `roles`/`chat`/`history`/`room-settings` lean on medium-size + text evidence, not a full-size aesthetic read.
- **B was judged after a mid-review a11y pass** (state changed at 19:41–19:42). Comparison to A/C is on the pre-pass→post-pass current state only; one earlier B snapshot existed during capture, not used.
- **Both reviewers are design-literate, not the owner.** Brand-fit and distinctiveness scores are rubric-anchored but finally taste-adjacent; the owner's call may legitimately weight the "poster" or "instrument" reading differently. That is why §6 has both rankings and the per-page picks.
- **Scripted HTML mocks, not Compose builds.** Feasibility is read from the pages + NOTES + server-code spot checks; no prototype interaction/motion was tested, and font-scale/320 dp behaviour is spec-level (reviewer-ux's stress audit is indicative, not a build).
- **A11y numbers are reviewer-ux's DOM audit + my spot checks**, not a device screen-reader run; contrast is computed from DOM colours (the A cyan-surface false positive shows the class of risk).
- **One inherent bias to name:** A's per-page dominance + the cheap cap fix could make me undervalue B/C's originality; I have kept the weighted table honest, shown the cap-lifted projection for A, and will require round 2 to re-score from renders before any final ranking.
