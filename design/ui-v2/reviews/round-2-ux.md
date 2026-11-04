# Round-2 UX / accessibility / engineering-feasibility re-score

**Reviewer:** reviewer-ux · **Round:** 2 · **Date:** 2026-11-04 (final renders 19:57–20:03 UTC)
**Scope:** re-score the axes that changed (interaction 5, a11y+RTL 6, feasibility 7 for all three; hierarchy/
consistency regression-checked) against the **new renders only**. Brand/distinctiveness remain secondary reads
for reviewer-visual, unchanged from round 1.
**Evidence:** `ux-audit.mjs --tag round2` → `reviews/evidence/ux-audit-round2*.json` (+ round-1 baseline
`ux-audit-round1-*` for deltas), `docket-checks.mjs` → `round2-docket-checks.{json,md}`, new renders in each
direction's `out/` (A 16, B 15, C 17 pages; all canonical 1170×2532 + labelled non-canonical extras).
**Independence:** this table was written before reading reviewer-visual's round-2 table; reconciliation follows
in `FINAL-RECOMMENDATION.md` (task-12). Round-1 table: `scores-round-1-ux.json`.

## 0. Gate + cap-lift rulings (docket tests)

| Gate | A | B | C |
|---|---|---|---|
| 14 canonical renders, exact 1170×2532, legible; NOTES review response present | ✅ 14+2 extras | ✅ 14+1 extra | ✅ 14+3 extras |
| Seed/data unchanged; no invented data anywhere (scan) | ✅ | ✅ | ✅ |
| Canonical pages ≤844 (no page scroll) | ✅ | ✅ | ✅ |
| **§2.7 rematch presented as shipped** | **LIFTED** — render shows "Play again · PROPOSAL" tag + "Play again needs a server action to restart the room." | n/a (already labelled) | n/a (demoted) |
| **§2.2/§2.7 invented data** | n/a | **LIFTED** — hunt-hunter violet ally markers gone (only own YOU); history per-match survival scores gone | strict-§2.2 asymmetry **moot** — per-match "PREY REMAINING" removed from history |
| Verification of my round-1 items | 9/9 accepted groups verified | 11/11 accepted groups verified | 13/13 accepted groups verified |

All docket checks pass (`round2-docket-checks.md`); the checker itself was hardened (LTR-isolation detection for
`.ltr` class + computed `unicode-bidi`, effective/clipped hit-box maths, honest-label token noise removed) before
this run. **Residual polish items listed in §4 — none is a cap-level defect.**

## 1. Direction A — "Matchday, raised"

**Round-1 weighted 3.75 → round-2 weighted 4.00.** Cap lifted; the direction is now the most implementation-ready
of the three, and it fixed its entire measured a11y debt.

| Axis | R1 | R2 | Why (new render evidence) |
|---|---:|---:|---|
| Brand & product fit *(secondary)* | 4 | 4 | unchanged; defer |
| Distinctiveness *(secondary)* | 3 | 3 | unchanged; the raised-v0.16 silhouette is still the least ownable — defer |
| Hierarchy | 4 | 4 | lobby restructured into one Board object (readiness in the gutter); result dock denser but the proposal tag is legible at 100 % |
| Consistency | 4 | 4 | system holds; new `.sw-hit`/segmented hit tricks are documented patterns, not one-offs |
| **Interaction & flow** | **4** | **4** | cap lifted (labelled rematch + server-action line); claim "Answer in 01:12 · no answer → the huntmaster decides"; hidden per-prey list; paused + eliminated frames; leave/dismissal documented. Held at 4 (not 5) because offline/leave/head-start are still notes-only and the dismissed-claim banner is not rendered anywhere |
| **Accessibility & RTL/i18n** | **3** | **4** | **92→0** sub-11 sp nodes; **36→10** metadata pairs <7:1 (residuals on team tints, §4); **4→0** genuine sub-48 targets (switch wrappers verified 48); Arabic tracking **0**, `rtl-unisolated` **0**; AA-body 0; map/list alternatives present. Residuals keep it at 4, not 5 |
| **Engineering feasibility** | **4** | **5** | fake London coordinates → real NYC seed centre; `home-light` state parity (code-cell/input values identical); own-report client state flagged; no invented data; complete component/token/state mapping (§9 + §15.5); no engine work |

**Measured delta (audit):** sub-11 sp 92→0 · metadata<7 36→10 · targets<48 4→0 · clipped 2→2 (segmented visual
clip, §4) · page-scroll 0 · RTL-unisolated 0→0 · tracking 0→0 · AA-body 0→0 · 200 % page height (result) 1444→1532
px (denser result dock — implementation note in NOTES §15.4).
**Regression check:** 14 canonical pages still one grammar, one cyan surface per page, seed intact; lobby/claim/
settings hierarchy unchanged apart from the documented restructure. No new defects found.

## 2. Direction B — "Street signal"

**Round-1 weighted 3.50 (capped) → round-2 weighted 4.15.** The data cap is lifted, the lobby is complete, and the
hit-area debt is gone; residual type/contrast polish remains.

| Axis | R1 | R2 | Why (new render evidence) |
|---|---:|---:|---|
| Brand & product fit *(secondary)* | 4 | 4 | unchanged; defer |
| Distinctiveness *(secondary)* | 5 | 5 | unchanged — still the most memorable system |
| Hierarchy | 4 | 4 | claim is now consequence-first ("Omar tagged you." display); result uses `LIMIT 60:00` + "18:48 played"; poster identity intact |
| Consistency | 4 | 4 | sentence-case pass + "one action hot" rule documented; team-colour fields stay as data |
| **Interaction & flow** | **3** | **4** | lobby now has host Ready/Stand-down + word-based `Prey | Hunters` side selector + blocker copy; rules sheet has zone centre/coordinates/Pick on map/Use my location; claim countdown + expiry transition + instant-policy note; eliminated/spectating frame rendered. Held at 4 because paused/head-start/offline are still notes-only and leave-confirm is not rendered |
| **Accessibility & RTL/i18n** | **2** | **4** | **16→0** genuine sub-48 targets (all 48 wrappers verified); sub-11 sp 17→0; metadata<7 7→4 (residuals, §4); lobby-rtl numeric runs now LTR-isolated via `.ltr` (audit 0 unisolated); Arabic labels moved to the Arabic face; AA-body 0. Residual: one Arabic credit line still mono/letter-spaced with a `·` (§4) |
| **Engineering feasibility** | **2** | **4** | cap lifted: no invented positions, no invented history scores; hunt-hunter aria-label stays "reported Prey positions"; rest maps cleanly to shipped composables (tape = `graphicsLayer` rotation, no engine work); extras labelled non-canonical |

**Measured delta:** sub-11 sp 17→0 · metadata<7 7→4 · targets<48 16→0 · clipped 1→0 · page-scroll 1→0 ·
RTL-unisolated 3→0 · hostile-content scan 0. **Regression check:** poster identity on home/roles/result unchanged,
claim event unchanged, 14/14 legible.

## 3. Direction C — "Field instrument"

**Round-1 weighted 3.90 → round-2 weighted 4.45.** The cleanest state system in the pack; one small RTL clipping
regression introduced by its own fix (netted in axis 6).

| Axis | R1 | R2 | Why (new render evidence) |
|---|---:|---:|---|
| Brand & product fit *(secondary)* | 4 | 4 | unchanged; cyan-as-measurement documented; defer |
| Distinctiveness *(secondary)* | 5 | 5 | unchanged |
| Hierarchy | 4 | 4 | rematch demoted (secondary + "needs a server restart; not in the current build"), Back to lobby is the only primary; readout hierarchy unchanged |
| Consistency | 4 | 5 | accepted reviewer-visual's argument: switch cue is an a11y/state issue, not grammar; system holds across 17 pages (3 extras inherit it) |
| **Interaction & flow** | **4** | **5** | rematch demoted; "Change side" added; history ↔ result line-up fixed; **paused + offline + eliminated all rendered** as labelled extras; claim lifecycle unchanged (best in pack); no dead ends |
| **Accessibility & RTL/i18n** | **3** | **4** | **12→0** sub-48 targets (steppers 48×48, switches 52×48 + ON/OFF word); sub-11 sp 1→0; RTL unisolated 7→0; tracking 0; Arabic labels all in the Arabic face; AA-body 0. Netted: the RTL row fix **introduced vertical clipping of Arabic names** (5 names, 22 px in 20 px, §4) — new defect, so not 5 |
| **Engineering feasibility** | **3** | **4** | invented per-match survival score removed; real IP removed; Home permission-only readout (no live GPS); real zone coordinates; strict-§2.2 asymmetry moot; extras labelled non-canonical; mock's physical-direction CSS documented as a handoff note (Compose start/end) |

**Measured delta:** sub-11 sp 1→0 · metadata<7 1→1 · targets<48 12→0 · clipped 4→5 (all RTL Arabic names, new) ·
RTL-unisolated 7→0 · tracking 0 · forbidden 0 · page-scroll 0. **Regression check:** readout hierarchy, claim
countdown, paper note, result winner/time ruler unchanged; zero-cyan reweight documented; no invented data.

## 4. Residual polish items (not cap-level; recommend implementation notes or a quick fix if a render cycle remains)

**A (10 metadata pairs <7:1, 2 handoff items):**
- Roster/status at 6.5:1: avatar initial `N` 12 px, `Host · Ready` 11.5 px (lobby, lobby-rtl, room-rules roster
  background) — these sit on the team tint; raise the text token or lighten the tint to reach 7:1.
- Claim/prey band: `Sharing position` 11 px 6.49:1 (hunt-prey + claim), `Hunters` 12 px 5.86:1 and
  `If you confirm` 12 px 6.49:1 in the claim sheet.
- Handoff: (a) `.seg.small` is 38 px tall while `.seg-cell` is 48 px inside `overflow:hidden` — hit-testing in
  HTML is clipped to 38 px; in Compose make the control 48 dp interactive with the visual inset (or grow the
  visual to 48; it fits). (b) `role="switch"` sits on the inner 40×22 track — put role/click on the 48 wrapper
  (or a `selectable` row) so the semantic target is the 48 node. (c) 8 Arabic nodes inherit
  `text-transform: uppercase` — set `none` under `[dir=rtl]` (no visual effect on Arabic, but it is the rule).
- Minor: `IN PLAY` for hunters at full time remains (round-1 S3); consider "—".

**B (4 metadata pairs + 1 RTL type node):**
- `home-light` join helper 4.76:1 @12 px; `Review tag claim` 6.78:1 @12 px; result `Prey remaining 0 / 2` 5.3:1
  @12 px; claim meta `OMAR · 20:48 · RIVERSIDE RUN` 4.58:1 @11 px.
- `lobby-rtl` dock credit line `مطاردة النهر · الغرفة` is still Red Hat Mono, 0.66 px tracking and contains `·`
  — move to the Arabic face, zero tracking, split on a full stop/newline.

**C (5 clipped Arabic names + 1 metadata pair):**
- `lobby-rtl` manifest rows clip all five Arabic names vertically (22 px content in 20 px box: نادية، رنا، عمر،
  سليم، يوسف) — add 2–3 px line-height / row height for Arabic; this is a regression from the RTL fix.
- Result `PLAYED OF 60:00` 6.75:1 @12 px on the paper note (just under the 7:1 metadata rule; AA-body is fine).

## 5. Round-2 table (my independent scores)

| Axis | Weight | A | B | C |
|---|---:|---:|---:|---:|
| Brand & product fit *(secondary)* | 15 % | 4 | 4 | 4 |
| Distinctiveness *(secondary)* | 15 % | 3 | 5 | 5 |
| Hierarchy & clarity | 15 % | 4 | 4 | 4 |
| System consistency | 15 % | 4 | 4 | 5 |
| Interaction & flow UX | 15 % | 4 | 4 | 5 |
| Accessibility & RTL/i18n | 10 % | 4 | 4 | 4 |
| Engineering feasibility | 15 % | 5 | 4 | 4 |
| **Weighted total** | | **4.00** | **4.15** | **4.45** |
| Caps active | | none (lifted) | none (lifted) | none (asymmetry moot) |

**Read:** C is first on my table (state-completeness + honesty + clean feasibility), B second (voice + now-complete
flows, residual type polish), A third by my weights — but **A is the ranking's most sensitive number**: its
distinctiveness is a secondary read, and if reviewer-visual scores A 4 there (rather than my 3) A ties B at 4.15.
A remains the most buildable and tied for cleanest a11y; the final recommendation should present the A-vs-B order
as a trade-off (buildability/completeness vs memorability/voice) rather than a settled score, per the docket's
"within 0.10 → say so" rule. C leads by >0.25 on both tables and is the safest "ship the system" recommendation.

## 6. Limitations
DOM measurements are computed from CSS (not device pixels); hit-area maths uses element boxes intersected with
clipping ancestors (an approximation of native hit-testing); 320 dp/200 % results are indicative, not contract
failures; extras are state evidence, not new screens; brand/distinctiveness are secondary reads deferred to
reviewer-visual. Visual checks done on the new PNGs; no Compose prototype exists, so feasibility is read from
pages + NOTES + server code.
