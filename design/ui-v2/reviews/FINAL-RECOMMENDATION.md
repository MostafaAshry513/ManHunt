# FINAL RECOMMENDATION — ManHunt UI/UX redesign v2

**Authors:** reviewer-visual (lead, brand/hierarchy/consistency/distinctiveness) with reviewer-ux (interaction/flow,
accessibility/RTL, feasibility depth). **Date:** 2026-11-04 20:05 UTC. **Owner:** you — the final call is yours;
this file makes the evidence and trade-offs legible, it does not launder taste through scores.
**Reads:** `briefs/*.md`, `skills/*.md`, round-1 and round-2 reviews (`round-1-visual.md`, `round-1-ux.md`,
`round-2-visual.md`, `round-2-ux.md`), `scores-round-1*.json`, `scores-round-2*.json`, final renders in
`design/ui-v2/directions/<dir>/out/` (captures 19:57 UTC), the review pack in `env/out/` (per-direction sheets
2704×6128, matrix 1858×13468, 14 strips 1426×1612, gallery `env/out/index.html`).
**Method:** rendered pages first (rubric `skills/REVIEW_RUBRIC.md`); both reviewers scored independently then
reconciled; caps applied before averaging; every round-1 cap was re-verified on the round-2 renders; no score was
carried over without re-reading the changed page.

---

## 1. Final scores (reconciled round 2)

| Axis (weight) | A — Matchday, raised | B — Street signal | C — Field instrument |
|---|---:|---:|---:|
| 1 Brand & product fit (15 %) | **5** | **5** | **3** |
| 2 Distinctiveness / memorability (15 %) | **4** | **5** | **5** |
| 3 Hierarchy & clarity (15 %) | **5** | **4** | **4** |
| 4 System consistency (15 %) | **5** | **5** | **5** |
| 5 Interaction & flow UX (15 %) | **3** | **3** | **4** |
| 6 Accessibility & RTL/i18n (10 %) | **4** | **4** | **4** |
| 7 Engineering feasibility (15 %) | **4** | **4** | **4** |
| **Weighted total (/5)** | **4.30** | **4.30** | **4.15** |
| Round 1 → Round 2 | 3.60 → 4.30 | 3.35 → 4.30 | 3.75 → 4.15 |
| Caps | round-1 §2.7 cap, **lifted** | round-1 §2.2/2.7 cap, **lifted** | none |

**One-line verdicts**
- **A — "Matchday, raised":** the finished, highest-confidence system — unmistakably ManHunt, every page designed,
  the cleanest hierarchy and the most per-page wins; the safe-but-not-boring base to ship.
- **B — "Street signal":** the strongest identity in the pack — a street-poster language that makes ManHunt look
  like a game people are playing tonight; equal score, higher upside and higher execution/stress risk.
- **C — "Field instrument":** the most original, rigorous and state-complete system — the best hunt and claim
  screens in the pack — held back only by a colder, field-device brand reading (the recorded territory trade-off).

**Score history and caps:** A's round-1 third place was caused by one unlabelled "Play again" row (rubric §2.7);
B's by invented map/history data (§2.2/2.7). Both were fixed in round 2 and verified on the rendered pages:
A now shows "Play again · PROPOSAL" + a server-action note with Back to lobby primary; B removed the ally markers
and per-match survival scores, and completed the host lobby flow. No caps remain. C's round-1 history-invention
issue is gone; the strict-§2.2 asymmetry with B is therefore moot.
*Reconciliation detail and any reviewer-ux axis dissent: §8.*

---

## 2. Ranking and recommendation

### 2.1 The numbers: A = B (4.30), C (4.15)

A and B tie exactly on the weighted rubric, but for opposite reasons — the profiles are the decision:

| | A — Matchday, raised | B — Street signal |
|---|---|---|
| Leads on | brand fit, hierarchy, per-page completeness (7 of 14 page picks), implementation proximity | brand fit, distinctiveness (the most ownable identity), event moments, field log |
| Weaker on | distinctiveness (a raised known silhouette), notes-only non-happy states | hierarchy (multi-field pages), notes-only non-happy states, higher stress-use risk |
| Implementation | reuses shipped MATCHDAY components (`MatchBoard`, `MatchSheet`, `ScorePage`, `TeamSheet`, `CodePlate`) — lowest risk/velocity | reuses the same flows but adds tape/stamp/rotation grammar and poster typography rules — more new component work |
| If shipped as-is | a premium, finished MATCHDAY product; low surprise for existing players | a visibly new product; maximal differentiation, louder launch |

### 2.2 Recommendation

**Ship Direction A as the base product system, with targeted steals from B and C.** Reasons, grounded in the
brief and rubric (not taste clichés):

1. **A is the lowest-risk path to "finished".** The brief's demand is "ship-ready screen design at a fidelity where
   an engineer could build it", against an existing Compose app. A maps cleanly to the shipped components and
   tokens (no engine work), has the most complete page set and the strongest hierarchy engine; its round-2 fixes
   were the only things keeping it from first place in round 1.
2. **A's weakness is the one thing the owner's taste can decide.** A's distinctiveness is a raised ManHunt, not a
   new language. If the owner wants a product that reads as markedly different in screenshots, B is the equal-
   scoring alternative and should be chosen instead — this is the single taste decision in the pack, and §5
   question 1 states it plainly.
3. **B's identity is worth taking even if A ships.** The tag-claim event, the two-verb dock, the kit-tag sender
   grammar and the cyan-operational/chalk-event primary rule are per-page steals that make A's system feel owned
   rather than inherited (list §3).
4. **C should not be adopted wholesale** — its brand reading is the one axis where it scores 3, and that is a
   product-identity risk for a game about friends. But C owns the two best screens in the pack
   (`hunt-hunter`, `sheet-tag-claim`) and the state-frame discipline; those must be stolen into whichever
   direction ships (§3). If the owner wants an "instrument" product identity, C is viable with the documented
   fallback (a 2 dp cyan rule on the dock primary edge) and an explicit acceptance of the colder reading.

**In one line:** *A to ship (or B if the owner wants the louder product — they tie), with B's event/identity
treatment and C's hunt/claim honesty and state frames lifted into the final design.*

---

## 3. Per-page best picks and steals (final)

Best **visual** version per canonical page + the 1–2 elements worth stealing into the shipped design. Where
best-visual ≠ best-usable, the UX angle is noted (reviewer-ux).

| Page | Best visual | Steal into the final design | UX note |
|---|---|---|---|
| `auth` | **A** | A's brand-line + field-plate + demoted-server footer; C's dial drawing as the plate alternative. | A (quiet form, real states) |
| `roles` | **B** | Poster two-team split + "Two teams. One block. One clock."; A's field-guide plate for the re-read/planned-modes page; use the approved "Coming soon/Playable today" copy. | A (re-read completeness); B is now contrast-clean |
| `home` | **A** | Two distinct verbs + labelled Settings; B's bottom two-verb dock and larger verb scale for reach. | **B** (docked reach/honest state) |
| `lobby` | **A** | One-object Board (code + readiness + share) + complete host controls + two-column team sheet; C's compact rules summary line. | A |
| `hunt-hunter` | **C** | C's report honesty (age + accuracy, fresh/stale by shape+word, per-prey text alternative, "latest reports — not a live track"); A's clock dominance/two-band Board; B's fresh-report ring. | C |
| `hunt-prey` | **C** | Own-position-only + report cadence + no other Prey; B's persistent claim strip and calm "keep moving" copy. | C |
| `chat` | **B** | Kit-tag senders + system rules + draft-safe composer; C's "room record · n entries" header; keep A's clean time gutter. | B |
| `result` | **B** | B's winner event (violet field + FULL TIME stamp); A's action hierarchy (Back to lobby primary) + C's paper match-record and played-time ruler. | **A** (no unshipped primary) |
| `history` | **A** | Real-fields-only grouped list + last-hunt summary; C's expanded match-summary block layout. | A |
| `settings` | **A** | Ruled manual with real update/permission states; C's section ticks + "Daylight" label; B's update card. | A |
| `sheet-tag-claim` | **C** | Consequence-first title + verified 90 s countdown from `expiresAt` + "no answer → the huntmaster decides" + paper "what confirming means"; B's "Dismissing keeps the claim waiting." | C |
| `sheet-room-settings` | **A** | Complete ruled controls incl. zone centre / use my location / pick on map + honest tag-policy row; C's stepper grammar; B's confirm/instant consequence copy if the control ships. | A |
| `lobby-rtl` | **A** | Best mirror + LTR isolation + Arabic face; zero tracking; mirror rules/rows/dock, never the mark/map/numerals. | A |
| `home-light` | **B** | B's daylight translation (ink block stays ink, parity); A's parity is now fixed and close; C's graph-paper variant is an owner option. | B |

**Count:** A 7 · B 4 · C 3. **Best per direction as a system:** A for utility/ceremony completeness, B for
identity/events, C for the live-hunt + claim decisions.

---

## 4. Implementation read (Compose / tokens / engine)

*(Depth by reviewer-ux; merged observations from both reviewers.)*

**If A ships as the base, the build is a completion of known work, not a new system.**
- Reuse: `MatchBoard` (extend with lobby big-row code + full-time variants), `ChalkRule`, `BoardButton`,
  `TeamTag`/`StateTag`, `CodePlate`, `TeamSheet`, `MatchSheet`, `ScorePage`, `HistoryDialog`, `ChatPanel`,
  `FieldMarks`, `MatchMap` overlay grammar. Token layer: type scale (raise `data.small` to 11.5–12 and the
  board-muted alpha to the 7:1 token), two-band Board height, plate/rule/tag grammar already documented.
- New/cheap: Board "one number" slot + readiness ticks; claim sheet countdown from `PendingTagDto.expiresAt` vs
  `RoomState.serverNow` (no device clock); paused/eliminated state variants (A's rendered extras are the template);
  labelled Settings entry; light-theme parity pass; 48 dp hit-wrapper pattern for inline actions/switches;
  map per-prey text alternative (existing `PreyStatusCard` pattern; UI_AUDIT UI-03).
- Steals that are Compose-cheap: B's stamp/tape event treatment (`graphicsLayer` rotation, semantics cleared, no
  layout impact), B's two-verb dock, C's report-age/accuracy overlays (real `receivedAt`/`accuracy` fields), C's
  paper FieldNote (`Surface` + small rotation + vector mark), C's played-time ruler (`Canvas`).
- **Engine/server items (owner decisions, not free):** (1) **rematch** — needs a server action (restart the room
  with same teams/settings) + client refresh; until then Back to lobby only. (2) **tag policy control** — server
  already supports `confirm|instant` (verified in `server/src/domain/match.ts`); exposing it is client-only UI +
  product decision. (3) **system chat events are server-English** — Arabic field logs will contain English system
  lines until system messages become structured/i18n (small server change). (4) **result trail map** — a real map
  snapshot needs client work; the drawn plate is the allowed v1, labelled honestly. (5) **Arabic display face** —
  bundling IBM Plex Sans Arabic (~+460 KB) vs system Arabic is an APK-budget decision.
- **Risk areas to watch:** Board height vs map on short phones (A's own mitigation: compress at ≤700 dp, min map
  340 dp); poster steals must not migrate into hunt/claim stress screens; 320 dp/200 % reflow is specified but not
  render-tested; light theme must stay a translation (A) or a documented ink-block language (B); RTL needs logical
  properties in Compose (the mocks' physical-direction CSS is a mock-only cost).

---

## 5. Top 5 open questions for the owner

1. **How loud should the product be?** A and B tie at 4.30 with opposite profiles — A is the polished matchday
   product we can ship with least risk; B is the street-poster identity that makes it look like a new game.
   This is the one genuine taste/strategy call in the pack; the numbers do not make it for you.
2. **How committed is light theme?** A's daylight-chalk translation is complete; B's uses ink colour blocks; C's
   uses a graph-paper daylight variant. Which one appears in store/social screenshots changes the product's
   perceived identity more than any other single choice.
3. **Do we keep the cyan-primary convention, or accept C's "cyan = measurement, chalk = action" reweight?** If
   C's hunt/claim screens are stolen into the winner, this must be decided consistently across the app; the
   fallback (2 dp cyan rule on the dock primary) is documented.
4. **Which unshipped deltas do we build?** Rematch (needs a small server action) and the tag-policy
   Confirm/Instant control (client-only, server-enforced values already exist). Both are visible proposals in the
   designs; they can be omitted without redesign.
5. **How much should the brand mark carry the identity?** Masthead lockup on every page (A/B) versus a
   Board-first, mark-light system (C); and whether to bundle the Arabic display face (+~460 KB) for a proper
   Arabic type voice instead of the system fallback.

*(Minor, not in the five: the two "hosted test server" labels are deliberately address-free — say if you want a
real server address printed in designed screenshots.)*

---

## 6. Ranking summary and honest limitations

**Final ranking (reconciled):** A = B (4.30) · C (4.15). Round-1 ranking was C > A > B; round-2 fixes moved A and B
up sharply because their gaps were the caps and measured-fix debt, not system flaws. C's lead in round 1 was
real (system rigour/state completeness/originality) and it remains the best source of hunt/claim design.

**Limitations of this evaluation**
- **Scripted HTML mocks, not a Compose build.** Feasibility is read from the pages + NOTES + spot checks of
  `Models.kt`/server code; no motion, device, or performance prototype was tested. 320 dp/200 %/foldable
  behaviour is specified, not rendered.
- **Not every page was re-read at full 1170×2532 in round 2.** All 42 canonical pages were judged at contact-sheet
  and 1/3-thumbnail scale; changed and cap-critical pages were re-read full size; the rest were cross-checked via
  visible-text extraction, CSS values and both reviewers' measurement passes.
- **Brand fit/distinctiveness are rubric-anchored but finally taste-adjacent.** The reviewer split (C brand 3 vs 4)
  is recorded rather than averaged; the owner may legitimately weight the instrument reading differently.
- **Accessibility is a DOM audit + spot checks**, not a device screen-reader/real-player pass; contrast is computed
  from rendered colours (heuristic artifacts were manually filtered).
- **Round-2 reconciliation status:** our independent round-2 tables are merged here; where reviewer-ux's table
  differs, the dissent is listed in §8. The two "equal totals" are a coincidence of weights, not a tie-break —
  the tie-break is §5 question 1.
- **Design intent never scored as evidence.** Every claim in this file was re-checked against the final PNGs; the
  designers' self-audits were used as leads, not proof.

---

## 7. Where to look (owner pack)

- **Judge the spread:** `env/out/sheets/matrix.png` (1858×13468; 14 rows × A/B/C, 390-px thumbs).
- **Per-direction:** `env/out/sheets/{a-matchday-raised,b-street-signal,c-field-instrument}.png` (2704×6128).
- **Per-page:** `env/out/strips/<page>.png` (1426×1612, A|B|C side by side); full pages in
  `directions/<dir>/out/*.png` (1170×2532).
- **Gallery:** `env/out/index.html` via `node design/ui-v2/env/serve.mjs`.
- **Argument:** `reviews/round-1-visual.md` + `round-1-ux.md`; `reviews/round-2-visual.md` + `round-2-ux.md`;
  scores JSONs; each direction's `NOTES.md` (review-response sections record every accept/partial/pushback).

---

## 8. Reconciliation record (both reviewers)

**Round-1:** both reviewers independently ranked **C > A > B**; shared table used the harsher numbers
(A 3.60 / B 3.35 / C 3.75 visual; A 3.75 / B 3.50 / C 3.90 UX). Reviewer-ux accepted A's cap for the shared table;
I kept C interaction 3 (their 4) pending the rematch demotion; C's strict-§2.2 feasibility asymmetry was recorded
to settle on round-2 renders (now moot — the invented history datum was removed).
**Round-2:** both caps lifted on rendered evidence; reviewer-ux's round-2 mechanical pass confirmed B's fixes and,
expected before this file's final report, A/C equivalents. Open items merged/dissent-recorded below:
- **C brand fit (visual 3, UX secondary 4):** retained 3 in the shared table as the reviewer-visual lead score;
  if the owner reads the instrument identity as a feature, the effective ranking becomes a three-way argument —
  stated here, not averaged.
- **C interaction (visual 4 after fixes, UX 4):** agreed — C is the only direction with paused/offline/eliminated
  rendered, which is why it now leads the interaction axis.
- **A/B states (visual 3 both):** both still have notes-only offline/loading/error/head-start; kept at 3 by the
  "rendered where required" rule, with A's paused/eliminated and B's eliminated extras credited.
- **Auxiliary type:** A's 11 px machine-data nodes and C's residual CSS declarations are tokens-compliant but
  strictly below the brief's 12 sp auxiliary floor; recorded as implementation notes, not score changes.
- **File handling:** round-1 scores are preserved in `scores-round-1.json` (visual) and `scores-round-1-ux.json`
  (UX); round-2 in `scores-round-2-visual.json` and `scores-round-2-ux.json`. The canonical
  `scores-round-1.json` filename caused a collision that is resolved by suffixing both reviewers' files; no
  numbers were lost.
