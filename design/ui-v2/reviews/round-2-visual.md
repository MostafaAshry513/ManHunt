# Round-2 visual/brand re-score (directions A, B, C)

**Reviewer:** reviewer-visual · **Date:** 2026-11-04 20:05 UTC · **Method:** rubric §6/§7 — re-score only axes that
changed, from the new renders only (captures: A 19:57, B 19:57:31, C 19:57:51; env pack re-cut 19:59), plus a full
14-page regression check and re-verification of every round-1 cap. Designer NOTES "Review response" sections were
used only to locate claims; every score is from the renders + reviewer-ux's round-2 mechanical passes.
**Independence:** my round-2 table was written before reviewer-ux's round-2 table (not yet published at 20:05);
`reviews/scores-round-2.json` is mine; reconciliation with their round-2 table happens in task-12.

## 0. Delivery / regression gate — pass
- A/B/C: **14/14 canonical renders at exactly 1170×2532**, plus state extras (A `hunt-paused`, `hunt-eliminated`;
  B `hunt-prey-eliminated`; C `state-paused`, `state-offline`, `state-eliminated`). Contact sheets rebuilt
  (A/B/C 2704×6128; env matrix 1858×13468). No page overflow flagged; no new invented data (see checks below).
- Canonical seed intact in all three (Riverside Run / K7M2QX / 5 / 240 m / 41:12; result 18:48, PREY 0/2).
- Regression: systems, page hierarchy and the round-1 per-page winners are unchanged where they were not
  targeted; no fix introduced a new banned material, icon-only nav, gradient/shadow hero, or missing page.
- Reviewer-ux round-2 docket checks: B passes all G/B checks (no ally markers, no survival scores, lobby
  complete, claim answer-in, settings ≤844). A/C mechanical re-audit expected in their round-2 notes.

## 1. Round-2 scores (changed axes marked ▲; totals recomputed)

| Axis (weight) | A | B | C | Why (delta from round 1) |
|---|---:|---:|---:|---|
| 1 Brand & product fit (15 %) | **5** ▲ | **5** ▲ | **3** | **A:** icon-only Settings fixed (label+mark), light proof parity fixed, claim expiry added, lobby Board now one object (code+readiness+share in the Board) — every brand rule honoured and the system looks finished. **B:** all-caps-rule contradictions fixed (only true state/data labels/code remain), two primary treatments documented as one rule (cyan operational / chalk event where team field is the subject), poster identity preserved and now rule-clean. **C:** visually unchanged identity (intentional instrument reweight); warm moments land but the page-level reading is still more field-device than friends' game — the recorded brand trade-off, not a new defect. |
| 2 Distinctiveness / memory (15 %) | **4** | **5** | **5** | Unchanged: A is a raised version of a known ManHunt silhouette; B/C are new languages. The lobby-as-one-Board push strengthens A's memory hook but does not make it a new language. |
| 3 Hierarchy & clarity (15 %) | **5** | **4** | **4** | A unchanged (squint passes; new result proposal tag is subordinate, correct). B unchanged (three colour surfaces in lobby; result stacks before action). C: rematch demoted to secondary row behind Back to lobby — result hierarchy fixed; utility-page density + home join→host order remain (deliberate, documented). |
| 4 System consistency (15 %) | **5** | **5** ▲ | **5** | B's round-1 consistency dock (own-rule ALL-CAPS labels, undocumented primary variants, 12 px overflow) is cleared: sentence case, documented cyan/chalk rule, settings fits. A/C were already 5. |
| 5 Interaction & flow UX (15 %) | **3** ▲cap-lift | **3** ▲cap-lift | **4** ▲ | **A:** §2.7 cap lifted — "Play again · PROPOSAL" + server-action note read at a glance; result dock keeps Back to lobby primary. **B:** §2.2/2.7 cap lifted — ally markers and per-match survival scores removed; lobby now has side selector + Stand down + Begin-with-blocker (complete host flow); history contradictions fixed. Both still 3, not 4: offline/loading/error/paused/head-start remain notes-only for A/B (A added paused/eliminated extras; B added eliminated only). **C:** 3→4 — Rematch demoted (result flow honest), identity/history bugs fixed, and paused/offline/eliminated are now rendered extras; claim countdown + no-answer rule verified accurate against server behaviour. |
| 6 Accessibility & RTL/i18n (10 %) | **4** ▲ | **4** ▲ | **4** ▲ | A: metadata <7:1 pairs fixed by board-muted token (8.95:1), 92 sub-11 px nodes reduced to 11–11.5 px aux (14 remaining 11 px declarations — tokens-compliant for machine data with ≥7:1, strictly still below the brief's 12 sp aux floor, recorded as implementation note), 48 dp hit wrappers, Arabic letter-spacing fixed. B: 16 sub-48 controls fixed, roles 3.92:1 AA pair removed with counters, Arabic face/tracking/LTR isolates fixed, settings fits. C: 10 steppers + switches ≥48 hit boxes + ON/OFF word cue, 12 px floor claimed (3 residual 10–11 px CSS declarations to be verified by the DOM audit), numeric isolates/Arabic face fixed. All three: true RTL + light proofs, colour never sole cue; 200 %/320 dp still spec-level. |
| 7 Engineering feasibility (15 %) | **4** ▲cap-lift | **4** ▲cap-lift | **4** ▲ | A: cap lifted (proposal labelled, server action costed); excellent mapping (MatchBoard/Sheet/ScorePage/TeamSheet/CodePlate), no engine work; two rendered state extras reduce state risk. B: cap lifted (invented data removed; lobby controls documented with a deliberate dock-vs-column deviation; tagPolicy confirm|instant verified client-only; rematch flagged; offline strip small client work). C: invented history datum removed (MatchHistoryEntry fields only), home permission-only, neutral server label; claim expiry verified; remaining costs are client-only (derived report countdown, chart canvas). |
| **Weighted total (/5)** | **4.30** | **4.30** | **4.15** | A and B tied; C 0.15 behind on brand-fit trade-off, ahead on state completeness. |

**Caps:** all round-1 caps **lifted** on rendered evidence (A §2.7; B §2.2/2.7). No new caps. C's strict-§2.2
history issue is gone (survival line removed), so the round-1 asymmetry is moot.

## 2. Residual issues carried into the recommendation (not blocking)

**A:** 14 remaining 11 px auxiliary declarations and a NOTES claim of "0 nodes < 11.5 px" that the CSS does not
support (measurement nit, tokens-compliant, below brief's 12 sp aux floor); offline/loading/error/head-start
still notes-only; result dock is denser (proposal tag + note) — first to cut at 320 dp/large text.
**B:** paused/head-start/offline still notes-only (only eliminated extra rendered); side-switch lives in the
dock rather than per-column (documented deviation — acceptable); one 845→844 page height claim needs the DOM
audit confirmation; poster register remains the riskiest under stress but is now rule-clean.
**C:** brand-fit trade-off (field instrument reading; zero-filled-cyan reweight) is an owner question, not a bug;
join-before-host order deliberate (re-checked: Create remains the only chalk primary; acceptable);
physical-direction CSS documented as mock-only (Compose maps to start/end); residual 10–11 px CSS declarations
need the DOM audit to confirm they are unused/decorative (designer claims 0 rendered <12 px).

## 3. Per-page picks (round 2) — best visual; UX-angle note where it differs

| Page | Pick | Why / steal |
|---|---|---|
| `auth` | **A** | Calm brand-first form, server honestly demoted; C's dial is stronger in isolation but A's is the most credible first contact. |
| `roles` | **B** | Poster explanation of the game; counters + contrast fixed in round 2; A remains the better re-read (field-guide plate) — UX note now closer. |
| `home` | **A** | Two verbs as different objects, labelled Settings, light parity proven; B's docked two-verb pair is the better reach pattern (UX). |
| `lobby` | **A** | One-object Board (code+readiness+share) + complete host controls + team sheet; B's lobby is now complete but its three colour surfaces still cost a beat. |
| `hunt-hunter` | **C** | Best hunter screen: clock dominance + ages/accuracy + "not a live track" + per-prey text alternative; steal B's fresh-report ring and A's two-band clock scale. |
| `hunt-prey` | **C** | Own-position-only + report cadence + claim strip; steal B's persistent-claim treatment. |
| `chat` | **B** | Best field-log identity (kit-tag senders, system rules, draft-safe composer); C's "room record · 9 entries" header worth stealing. |
| `result` | **B** | Strongest event (violet winner field + FULL TIME stamp); A has the cleanest action hierarchy now; C's paper match-record + time ruler are the best details — steal both. |
| `history` | **A** | Cleanest scannable record (real fields only); C's expanded summary block now honest and close; steal C's summary layout. |
| `settings` | **A** | Most complete/clearest ruled manual; steal C's section ticks + "Daylight" label. |
| `sheet-tag-claim` | **C** | Consequence-first + verified countdown + paper note; A/B are now close (A added the countdown; B has the strongest event styling) — steal A's display-consequence title and B's "Dismissing keeps the claim waiting." |
| `sheet-room-settings` | **A** | Complete ruled controls incl. zone centre/pick-on-map + honest tag-policy row; steal C's stepper grammar and B's Confirm/Instant consequence copy. |
| `lobby-rtl` | **A** | Best mirror + LTR isolation + Arabic face; fix tracking (done); steal C's manifest order treatment. |
| `home-light` | **B** | Most confident daylight translation (ink block stays ink, parity); A's parity is now fixed and close, C's graph-paper variant is a valid owner option. |

**Count:** A 7 · B 4 · C 3.

## 4. Reconciliation status
My round-2 table (above) is written before reviewer-ux's round-2 numbers. Open reconciliation points for task-12:
- **A vs B tie (4.30).** I expect our tables to agree within ~0.1; the ranking argument (A = lowest-risk finished
  base vs B = highest-identity) is a judgement the owner should see explicitly, not a scoring formula.
- **C's brand fit** is the biggest subjective delta (my 3; reviewer-ux's round-1 secondary read was 4). If they
  keep 4, C lands ~4.30 and the ranking becomes a three-way argument — that dissent must be stated, not averaged.
- **C interaction 4 vs A/B 3**: C is the only direction with all three stress states rendered; if reviewer-ux
  weights rendered-state completeness higher, A/B's notes-only states could be scored harsher — settle by the
  shared "states rendered where required" rule in the rubric.
- B/A a11y 4 depends on the DOM audit confirming the residual 10–11 px nodes are unused/decorative.

## 5. Designer messages (round 2, sent)
- **A:** cap lifted on render; brand fit now 5. Residual: 11 px declarations vs "0 < 11.5" claim, notes-only
  offline/loading/error, denser result dock at 320 dp. No further visual work required for scoring; keep as-is.
- **B:** cap lifted; lobby flow now complete; consistency 5. Residual: paused/offline/head-start still notes-only
  (only eliminated rendered), dock side-switch deviation stays documented. No further work required.
- **C:** interaction 4 (rematch fix + state extras verified), a11y/feasibility 4. Residual: brand-fit trade-off is
  an owner call (documented reweight); verify the residual 10–11 px CSS nodes are unused/decorative in the DOM
  audit; keep join→host order with the documented priority.
