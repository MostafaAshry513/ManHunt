# FINAL RECOMMENDATION — ManHunt UI/UX redesign v2

**Authors:** reviewer-visual (lead: brand, distinctiveness, hierarchy, consistency) with reviewer-ux (lead:
interaction/flow, accessibility/RTL, feasibility depth). **Date:** 2026-11-04 20:10 UTC.
**Owner:** you — the final call is yours; this file makes the evidence and trade-offs legible, it does not launder
taste through scores.
**Reads:** `briefs/*.md`, `skills/*.md`, round-1 and round-2 reviews (`round-1-visual.md`, `round-1-ux.md`,
`round-2-visual.md`, `round-2-ux.md`), all four score JSONs, final renders in `directions/<dir>/out/` (final
captures: A 19:56:53, B 19:57:33, C 19:57:55 UTC), and the owner pack in `env/out/` (per-direction sheets
2704×6128, matrix 1858×19768 incl. 7 state-study rows, 21 comparison strips 1426×1612, 49 page captures
1170×2532 (A 16, B 16, C 17 — all hash-matched to the designers' final `out/`; frozen pack commit 88ac519),
gallery `env/out/index.html`, 155 links).
**Method:** rendered pages first (`skills/REVIEW_RUBRIC.md`); both reviewers scored independently; caps applied
before averaging and every round-1 cap re-verified on round-2 renders; **consolidated table uses the agreed
ownership split (reviewer-visual leads axes 1–4, reviewer-ux leads axes 5–7)**; both independent tables and every
dissent are printed in §8. No taste is delegated to the scores.

---

## 1. Final consolidated scores

| Axis (weight) | A — Matchday, raised | B — Street signal | C — Field instrument |
|---|---:|---:|---:|
| 1 Brand & product fit (15 %) | **5** | **5** | **3** |
| 2 Distinctiveness / memorability (15 %) | **4** | **5** | **5** |
| 3 Hierarchy & clarity (15 %) | **5** | **4** | **4** |
| 4 System consistency (15 %) | **5** | **5** | **5** |
| 5 Interaction & flow UX (15 %) | **4** | **4** | **5** |
| 6 Accessibility & RTL/i18n (10 %) | **4** | **4** | **5** |
| 7 Engineering feasibility (15 %) | **5** | **4** | **4** |
| **Weighted total (/5)** | **4.60** | **4.45** | **4.40** |
| Round 1 (shared, visual-led) → Round 2 (consolidated) | 3.60 → 4.60 | 3.35 → 4.45 | 3.75 → 4.40 |
| Caps | round-1 §2.7, **lifted** | round-1 §2.2/2.7, **lifted** | none (asymmetry moot) |

*The consolidated table deliberately differs from both reviewers' independent tables (mine: A 4.30 = B 4.30 >
C 4.15; reviewer-ux: C 4.55 > B 4.15 > A 4.00) because it takes each lead reviewer's score on their axes rather
than averaging — it is the agreed method's output, not a consensus that either independent ranking is wrong. All
three tables and the dissent are in §8. **Method sensitivity:** under a strict harsher-wins rule across every
disagreement the totals would be A 3.70 / B 4.00 / C 4.00 (sensitivity only — it penalises A for reviewer-ux's
explicitly deferred secondary brand read); under reviewer-ux's independent method C is first. If C's brand-fit is
read as 4 (reviewer-ux dissent), C = 4.55 — 0.05 behind A and 0.10 ahead of B (no longer a tie with B, and
still not a three-way tie).*

**One-line verdicts**
- **A — "Matchday, raised": 4.60 — the finished, lowest-risk system.** Unmistakably ManHunt, the strongest
  hierarchy and craft, every page designed, the most implementation-ready mapping to the shipped Compose app.
  The safe-but-not-boring base to ship.
- **B — "Street signal": 4.45 — the identity play.** The most memorable language in the pack and the best event
  moments; equal on the visual axes, slightly behind on build/cost risk and hierarchy calm. Ship this if the
  product should look like a new game, not a finished one.
- **C — "Field instrument": 4.40 — the best-designed system, the riskiest brand.** The most original idea, the
  best hunt and claim screens, the only direction that is genuinely state-complete and the cleanest on measured
  accessibility (interaction 5, a11y 5) — held back by a field-device reading that is the recorded territory
  trade-off. C is now 0.05 behind B: the A-vs-{B,C} trade-off is unchanged. Do not ship whole unless you want that
  identity; mine it heavily either way.

**Cap history:** A's round-1 third place came from one unlabelled "Play again" row (§2.7); B's from invented map
and history data (§2.2/2.7). Both were fixed in round 2 and verified on the renders: A now shows "Play again ·
PROPOSAL" + the server-action note with Back to lobby primary; B removed the ally markers and per-match survival
scores and completed the host lobby. No caps remain. C's round-1 invented-history datum was removed, so the
strict-§2.2 asymmetry with B is moot.

---

## 2. Ranking and recommendation

### 2.1 What each direction is best at

| | A — Matchday, raised | B — Street signal | C — Field instrument |
|---|---|---|---|
| Best at | brand fit, hierarchy, per-page completeness (7 of 14 visual picks), buildability | identity/memorability, event moments (claim/result), field log | system rigour, state completeness (only direction with paused+offline+eliminated rendered), hunt and claim screens |
| Weak at | distinctiveness (a raised known silhouette), notes-only offline/loading/error | hierarchy calm (multi-field pages), notes-only offline/head-start, stress-use risk | brand reading (field device), utility-page density, zero-cyan convention |
| Build cost | reuses shipped MATCHDAY grammar — lowest risk/velocity | same flows + tape/stamp/rotation grammar + poster type rules — more new components | readout/chart grammar + paper note — medium, mostly Canvas + primitives |

### 2.2 Recommendation

**Ship Direction A as the base product, with targeted steals from B and C.**
Grounded in the brief and rubric, not taste clichés:
1. **A answers the brief's actual job** — "ship-ready screen design at a fidelity where an engineer could build
   it" for an existing Compose app — with the least new-system risk, the strongest hierarchy engine and the most
   complete page set. Its round-2 fixes closed the only real gaps (cap, a11y debt, light parity, states).
2. **The A-vs-B call is the owner's taste decision, not a scoring result.** The A-vs-B gap is 0.15 on the
   consolidated table and they tie on reviewer-visual's independent table; reviewer-ux's independent table has B
   ahead by 0.15 — it is a genuine owner taste call in every framing. Per-page picks split 7/4/3 (A/B/C) only
   because ceremony/utility pages dominate the count; if the owner wants the product to look markedly different in
   screenshots and social, **B is the justified choice**.
3. **B's identity should be stolen into A even if A ships**: the tag-claim event, the two-verb dock, kit-tag sender
   grammar, and the documented cyan-operational/chalk-event primary rule (list §3).
4. **C must not be adopted wholesale**, because its brand reading is the one axis where it scores 3 — but it owns
   the two best screens (`hunt-hunter`, `sheet-tag-claim`) and the state-frame discipline. Those are mandatory
   steals for either winner.
5. **If the owner prefers C's instrument identity**, C becomes a legitimate first choice — with a brand score of 4
   (reviewer-ux's independent read) C = 4.55, 0.05 behind A and 0.10 ahead of B — but that must be an explicit identity
   decision, and the fallback (2 dp cyan rule on dock primaries) plus a native-Arabic pass would be conditions of
   shipping it. **Reviewer-ux dissents on the ordering:** on their independent table C is first (4.55 vs B 4.15,
   A 4.00) because state-completeness and brand-independent usability carry more weight in axes 5–7; the
   consolidated table is the agreed method's output, not a consensus that C is worse. On the consolidated table
   C 4.40 is now effectively level with B (0.05) — the A-vs-{B,C} trade-off is unchanged.

**In one line:** *A to ship (B if you want the louder product; they tie on identity/execution trade-offs), with
B's event/identity treatment and C's hunt/claim honesty and state frames lifted into the final design.*

---

## 3. Per-page best picks and steals (final)

Best **visual** version per canonical page + the 1–2 elements worth stealing. Where best-visual ≠ best-usable,
the UX angle is noted.

| Page | Best visual | Steal into the final design | UX note |
|---|---|---|---|
| `auth` | **A** | Brand-line + field-plate + demoted-server footer; C's dial drawing as an alternative plate. | A |
| `roles` | **B** | Poster two-team split + "Two teams. One block. One clock."; A's field-guide plate for the re-read page; approved "Coming soon/Playable today" copy. | A (re-read completeness); B contrast-clean now |
| `home` | **A** | Two distinct verbs + labelled Settings; B's docked two-verb pair and larger verb scale for one-hand reach. | **B** (docked reach/honest state) |
| `lobby` | **A** | One-object Board (code + readiness + share) + complete host controls + two-column team sheet; C's room-record summary line. | A |
| `hunt-hunter` | **C** | C's report honesty (age + accuracy, fresh/stale by shape+word, per-prey text alternative, "latest reports — not a live track"); A's clock dominance/two-band Board; B's fresh-report ring. | C |
| `hunt-prey` | **C** | Own-position-only + report cadence + no other Prey; B's persistent claim strip and calm "keep moving" copy. | C |
| `chat` | **B** | Kit-tag senders + system rules + draft-safe composer; C's "room record · n entries" header; A's clean time gutter. | B |
| `result` | **B** | B's winner event (violet field + FULL TIME stamp); A's action hierarchy (Back to lobby primary); C's paper match-record + played-time ruler. | **A** |
| `history` | **A** | Real-fields-only grouped list + last-hunt summary; C's expanded match-summary layout. | A |
| `settings` | **A** | Ruled manual with update/permission states; C's section ticks + "Daylight" label; B's update card. | A |
| `sheet-tag-claim` | **C** | Consequence-first title + verified 90 s `expiresAt` countdown + "no answer → the huntmaster decides" + paper "what confirming means"; B's "Dismissing keeps the claim waiting." | C |
| `sheet-room-settings` | **A** | Complete ruled controls incl. zone centre / use my location / pick on map + honest tag-policy row; C's stepper grammar; B's confirm/instant consequence copy if the control ships. | A |
| `lobby-rtl` | **A** | Best mirror + LTR isolation + Arabic face + zero tracking; mirror rules/rows/dock — never the mark/map/numerals. | A |
| `home-light` | **B** | B's daylight translation (ink block stays ink, state parity); A's parity is now fixed and close; C's graph-paper variant is an owner option. | B |

**Count:** A 7 · B 4 · C 3. **By system:** A for completeness/ceremony, B for identity/events, C for live hunt +
claim decisions.

---

## 4. Implementation read (Compose / tokens / engine)

*Depth by reviewer-ux; merged with reviewer-visual's feasibility read. Handoff notes are in each direction's
NOTES "review response" sections.*

**If A ships as the base** the build is a completion of known work, not a new system:
- **Reuse:** `MatchBoard` (extend with lobby big-row code + full-time variants), `ChalkRule`, `BoardButton`,
  `TeamTag`/`StateTag`, `CodePlate`, `TeamSheet`, `MatchSheet`, `ScorePage`, `HistoryDialog`, `ChatPanel`,
  `FieldMarks`, `MatchMap` overlay grammar.
- **Tokens to formalise:** two-band Board (height/rows/one-number slot), raised type ladder (display xl/board
  clock/new sheet title sizes), board-muted 7:1 token, `data.small` 11→11.5/12 decision (see A residual), 48 dp
  hit-wrapper pattern for inline actions and switches, plate/rule/tag grammar already documented.
- **New/cheap:** Board "one number" slot + readiness ticks; claim countdown from `PendingTagDto.expiresAt` vs
  `RoomState.serverNow` (no device clock); paused/eliminated state variants (A's rendered extras are the
  template); labelled Settings entry; light-theme parity; map per-prey text alternative (existing
  `PreyStatusCard` pattern; closes UI_AUDIT UI-03); status band permission-only.
- **Steals:** B's stamp/tape event treatment (`graphicsLayer` rotation, semantics cleared, no layout impact),
  B's two-verb dock, C's report-age/accuracy overlays (real `receivedAt`/`accuracy`), C's paper FieldNote
  (`Surface` + small rotation + vector mark), C's played-time ruler (`Canvas`).
- **Engine/server items (owner decisions):** (1) **rematch** — needs a server action (restart room with same
  teams/settings) + client refresh; otherwise Back to lobby only. (2) **tag-policy control** — server already
  supports `confirm|instant` (`server/src/domain/match.ts`); exposing it is client-only UI + product decision.
  (3) **system chat events are server-English** — Arabic field logs will show English system lines until system
  messages become structured/i18n (small server change). (4) **result trail map** — real snapshot needs client
  work; the drawn plate is the allowed v1, labelled honestly. (5) **Arabic display face** — bundling IBM Plex Sans
  Arabic (~+460 KB) vs system Arabic is an APK-budget call.
- **Round-2 residual handoff notes from the measurement pass (not score-changing):** A — roster/status on team
  tints at 6.5:1 and a few claim-band pairs 5.9–6.5:1 (raise token/lighten tint), `.seg.small` 38 px visual inside
  a clipped 48 px cell (make the Compose control 48 dp interactive regardless of visual inset), `role="switch"` on
  the inner track (put semantics on the 48 dp wrapper), 8 Arabic nodes inherit `text-transform: uppercase` (set
  `none` under RTL). **B** — residuals **cleared** in the post-scoring 20:03:42 polish (4 metadata pairs + Arabic
  credit line fixed; audit 0/16 below floors, Arabic 31/31 in the Arabic face at 0 tracking); one a11y caveat
  remains and keeps B at a11y 4: **no per-prey map text alternative** (aria summary only — the UI_AUDIT UI-03 gap
  that A and C closed). **C** — residuals **cleared** in the 20:04 re-render (Arabic name line-box 24/24;
  paper-note metadata now 11.07:1), which is why C's a11y moved to 5.
- **Non-negotiable keeps (reviewer-ux):** whatever direction ships, keep a **visible per-prey report list as the
  map's text alternative** (closes UI_AUDIT UI-03 — the one audit finding that blocks a user group) and the claim
  sheet's **`expiresAt` countdown + "no answer → the huntmaster decides" transition** (cheapest way a real claim
  decision is never lost). Both are already designed (C's hunter report list, C/A's claim countdown).
- **Risk areas:** Board height vs map on short phones (A mitigation: compress at ≤700 dp, min map 340 dp); poster
  steals must not migrate into hunt/claim stress screens; 320 dp/200 % reflow is specified, not render-tested;
  light theme must stay a translation (A) or a documented ink-block language (B); RTL needs logical properties in
  Compose (the mocks' physical-direction CSS is a mock-only cost).

---

## 5. Top 5 open questions for the owner

1. **How loud should the product be?** The A-vs-B gap is 0.15 on the consolidated table (4.60/4.45) and they tie
   on reviewer-visual's independent table (4.30/4.30); reviewer-ux's independent table has B ahead by 0.15
   (4.15/4.00). Opposite profiles, a genuine taste/strategy call in every framing: A is the polished matchday
   product with the least risk; B is the street-poster identity that makes ManHunt look like a new game.
2. **How committed is light theme?** A's daylight-chalk translation is complete; B uses ink colour blocks; C uses
   graph-paper daylight. Which appears in store/social screenshots changes perceived identity more than any
   other single choice.
3. **Do we keep the cyan-primary convention, or accept C's "cyan = measurement, chalk = action" reweight?** If C's
   hunt/claim screens are stolen into the winner this must be decided consistently; the documented fallback is a
   2 dp cyan rule on the dock primary.
4. **Which unshipped deltas do we build?** Rematch (small server action) and the tag-policy Confirm/Instant
   control (client-only; server values already exist). Both are visible proposals in the designs and can be
   omitted without redesign.
5. **How much should the brand mark carry the identity, and what is the Arabic investment?** Masthead lockup on
   every page (A/B) versus a Board-first, mark-light system (C); and whether to bundle the Arabic display face
   (~+460 KB) for a proper Arabic type voice instead of the system fallback.

*(Minor: "hosted test server" labels are deliberately address-free — say if you want a real server address in
designed screenshots.)*

---

## 6. Honest limitations

- **Scripted HTML mocks, not a Compose build.** Feasibility is read from pages + NOTES + spot checks of
  `Models.kt`/server code; no motion, device or performance prototype was tested. 320 dp/200 %/foldable behaviour
  is specified, not rendered.
- **Not every page was re-read at full 1170×2532 in round 2.** All 42 canonical pages were judged at contact-sheet
  and 1/3-thumbnail scale; changed and cap-critical pages were re-read full size; the rest were cross-checked via
  visible-text extraction, CSS values and both reviewers' measurement passes.
- **Brand fit/distinctiveness are rubric-anchored but finally taste-adjacent.** The reviewer split (C brand 3 vs 4)
  is recorded, not averaged; the owner may legitimately weight the instrument reading differently.
- **Accessibility is a DOM audit + spot checks**, not a device screen-reader/real-player pass; contrast is
  computed from rendered colours and hit-area maths is an approximation of native hit-testing.
- **The consolidated table is a designed merge, not a vote.** It takes lead-reviewer scores per axis; the
  independent tables disagree on ranking (mine A=B>C, reviewer-ux C>B>A) and neither is "wrong" — §8 prints both.
  The A-vs-C ordering is the live disagreement; the A-vs-B ordering is an owner taste decision.
- **Design intent never scored as evidence.** Every claim here was re-checked against final PNGs; designers'
  self-audits were leads, not proof.
- **Method sensitivity:** the consolidated ordering is not robust to the method — reviewer-ux's independent method
  puts C first; strict harsher-wins gives A 3.70 / B 4.00 / C 4.00. The A-vs-B gap (0.15) is inside the
  uncertainty band and is an owner taste call; the A-vs-C question is the live reviewer disagreement.
- **Post-scoring deltas (Lead-requested; ranking unchanged):** A corrected its type-floor claim (33 rendered
  11 px machine-data nodes; no text below 11 px; renders unchanged). B added a second non-canonical state frame
  (`hunt-hunter-paused`, 20:01) and a 20:03:42 polish that cleared its residual metadata/Arabic-type items (a11y
  stays 4 — no per-prey map text alternative). C's 20:04 re-render cleared both its residuals (Arabic line-box
  24/24, paper-note metadata 11.07:1); on those final renders reviewer-ux moved **C a11y 4→5** (Lead-requested
  update, 20:10) → **consolidated C = 4.40**, reviewer-ux independent C = 4.55. The frozen pack (49 page captures —
  A 16, B 16, C 17; matrix/strips include all 7 labelled state studies) is hash-matched to the final direction
  `out/` for all three.

---

## 7. Where to look (owner pack)

- **Judge the spread:** `env/out/sheets/matrix.png` (1858×19768; P01–P14 + 7 labelled EXTRA state rows × A/B/C,
  390-px thumbs).
- **Per direction:** `env/out/sheets/{a-matchday-raised,b-street-signal,c-field-instrument}.png` (2704×6128).
- **Per page:** `env/out/strips/<page>.png` (21 strips, 1426×1612; canonical 14 + 7 labelled state studies);
  full pages in `directions/<dir>/out/*.png` (1170×2532; 49 page captures in the frozen pack — A 16, B 16, C 17,
  including B's `hunt-hunter-paused`; all committed hashes match the designers' final `out/`).
- **Gallery:** `env/out/index.html` (155 links, 0 broken) via `node design/ui-v2/env/serve.mjs`.
- **Argument:** `reviews/round-1-visual.md` + `round-1-ux.md`; `reviews/round-2-visual.md` + `round-2-ux.md`;
  `reviews/FINAL-RECOMMENDATION.md`; the four scores JSONs; each direction's `NOTES.md` (review-response sections
  record every accept/partial/pushback).

---

## 8. Reconciliation record (both reviewers)

**Round 1:** both reviewers independently ranked **C > A > B**; shared table used the harsher numbers
(A 3.60 / B 3.35 / C 3.75 visual; A 3.75 / B 3.50 / C 3.90 UX). Reviewer-ux accepted A's cap for the shared table;
I kept C interaction 3 vs their 4 pending the rematch demotion; C's strict-§2.2 feasibility asymmetry was recorded
to settle on round-2 renders (now moot — the invented history datum was removed).

**Round 2 — the three tables:**
| Table | A | B | C | Ranking |
|---|---:|---:|---:|---|
| reviewer-visual (independent, `scores-round-2-visual.json`) | 4.30 | 4.30 | 4.15 | A = B > C |
| reviewer-ux (independent, `scores-round-2-ux.json`) | 4.00 | 4.15 | 4.55 | C > B > A |
| **Consolidated (this file, agreed ownership split)** | **4.60** | **4.45** | **4.40** | **A > B > C** |

**Consolidated method (agreed 20:05 UTC):** axes 1–4 = reviewer-visual's lead scores, axes 5–7 = reviewer-ux's
lead scores; mandatory caps wherever they apply; both independent tables preserved; dissents recorded, never
averaged. **Reviewer-ux co-signs the consolidated table as the agreed method output while dissenting on the
ordering** — on their independent table C is first because state-completeness and brand-independent usability
carry more weight in axes 5–7.

**Lead-requested post-pack update 20:10:** C a11y **4→5** after its two residual items closed on the final
renders (Arabic name line-box 24/24; paper-note metadata 11.07:1) → consolidated **C 4.40**, reviewer-ux independent
**C 4.55**. Ranking unchanged (A 4.60 > B 4.45 > C 4.40); B's post-scoring polish also cleared its residuals, but
B a11y stays 4 because it still has no per-prey map text alternative (UI_AUDIT UI-03). No other axis changes.

**Agreements:** all round-1 caps lifted on rendered evidence; C is the most state-complete system (interaction 5)
and the cleanest on measured accessibility (5), and the best hunt/claim source; A is the most buildable and strong
on a11y; B is the most memorable; no invented data remains in any canonical page; the field-instrument brand
reading is the decisive C trade-off.

**Dissent recorded (not averaged):**
- **Reviewer-ux ranks C first and calls it the safest "ship the system" recommendation.** Their case: state
  completeness + honesty + clean feasibility outweigh the brand reading (which they defer on). I keep C's brand
  at 3 (field-device reading is a product-identity risk for a friends game) and therefore C third in the
  consolidated table. If the owner likes the instrument identity, C's effective total is 4.55 and the decision
  changes — that is an owner question, not a hidden average.
- **Reviewer-ux scores A's hierarchy 4 / consistency 4 / distinctiveness 3 / brand 4 (secondary reads); I score
  5/5/4/5.** Their lower reads stem from the denser result dock, the new hit-area idioms and "raised v0.16" as
  least-ownable; I hold that the system holds, the idioms are documented patterns, and the lobby restructure
  removes the one hierarchy criticism. The consolidated table takes my lead scores on axes 1–4 (their dissent
  printed here).
- **Reviewer-ux scores B's consistency 4 / brand 4 (secondary); I score 5/5** — sentence-case pass, documented
  primary rule and complete lobby close my round-1 objections.
- **A11y/feasibility** are agreed (A5/B4/C4 feasibility; a11y 4/4/5 after the Lead-requested C update), with
  residual handoff items in §4 and B's per-prey map text-alternative caveat recorded.
- **A residual type note:** A's 33 rendered 11 px nodes are machine-data at ≥7:1 (tokens-compliant); the brief's
  auxiliary floor is 12 sp, so a strict-12 bump remains an open one-token option — recorded, not scored.
- **B's late paused frame** (20:01, non-canonical) is outside the scored 14; it strengthens B's state evidence if
  the pack is re-cut but does not change scores.
- **File handling:** round-1 scores are preserved in `scores-round-1.json` (visual) and `scores-round-1-ux.json`
  (UX); round 2 in `scores-round-2-visual.json` and `scores-round-2-ux.json`. The canonical round-1 filename
  collision was resolved by suffixing both reviewers' files; no numbers were lost.
