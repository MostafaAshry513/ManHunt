# Round-2 re-score docket (reviewer-visual)

**Trigger:** task-9/10/11 complete + new `out/` renders + refreshed contact sheets. Round 2 re-scores **only the
axes that changed** (plus a full 14-page regression check). Every score is re-established from the new PNGs —
designer replies/NOTES are claims, not evidence (rubric §7). No number carries over without re-verification.
**Coordinates with reviewer-ux:** they re-run the DOM audit on the new renders; I re-read pages + thumbnails. We
exchange tables only after both have written round-2 scores; reconcile axis-by-axis, dissent recorded.

## Global gate before scoring (same as round 1)
- 14 canonical renders at 1170×2532 (+ any state extras), legible; contact sheet refreshed; NOTES "Review response" appended.
- Canonical seed still correct (Riverside Run / K7M2QX / 5 / 240 m / 41:12; result 18:48, 0/2) and no new invented data anywhere.
- No cap may be *assumed* lifted: A's rematch, B's invented data, C's asymmetry are re-checked in the render.

## A — Matchday, raised (re-score axes 5, 6, 7 + regression)
- **Cap lift test:** `result` shows "Play again" + a visible **Proposal** tag AND a server-action line; the tag must read at a glance in the render, not only in NOTES. If it does → interaction 3, feasibility 4 (projection 4.05). If not → cap stays 2/2.
- **home-light parity:** identical state to dark `home` (Hunt name populated+focused, code empty, Join disabled); diff-able.
- **Type/targets:** audit `hard<11` ≈ 0, metadata pairs ≥7:1 on ink, 4 sub-48 controls fixed (rules switches 48 wrapper, result/settings secondaries), Arabic tracking 0 in `lobby-rtl`.
- **New state frame:** `hunt-paused` — PAUSED board, stopped clock, resume action, unmistakable; no Tag.
- **Content fixes:** London zone coords → NYC seed or "not set"; history 10 px clip, room-rules 6 px clip.
- **Pushback checks:** "hosted test server" staying is accepted (no IP); Board ink contrast measured OK.
- **Regression:** no page >2 plates, one cyan surface, 14/14 legible; lobby/claim/settings unchanged in hierarchy.

## B — Street signal (re-score axes 5, 6, 7 + regression; caps expected to lift)
- **Cap lift test (data):** `hunt-hunter` no violet "other hunter" markers beyond own YOU marker; `history` no per-match `PREY 0/2`/`2/2` in rows **or** expanded summary. Both gone → interaction 3, feasibility 4 (projection 3.80). Any remaining invented data → cap stays.
- **Lobby completeness:** host Ready/Stand down + side switch + blocker line rendered; Begin disabled-with-reason; player view.
- **Content:** history empty-state line only in empty state; result "LIMIT 60:00"/"18:48 played of 60:00"; roles 2/3 counters gone or relabelled and ≥4.5:1; room-rules zone-centre/map-picker restored.
- **A11y:** 16 sub-48 controls → hit wrappers; Arabic labels face/tracking 0; `lobby-rtl` isolates 0 unisolated runs; settings page ≤844.
- **Own-rule consistency:** sentence-case the ALL-CAPS action/eyebrow labels (or document them as data labels); state the cyan-vs-chalk primary rule in NOTES.
- **Regression:** poster identity intact on home/roles/result; claim event unchanged; no new invented data on any page.

## C — Field instrument (re-score axes 1, 5, 6, 7 + regression)
- **Identity:** Omar = host/huntmaster everywhere (lobby + lobby-rtl), home/settings "Playing as Omar"; no Nadia-host contradiction; claim stays Prey-side view.
- **Rematch hierarchy:** Back to lobby is the only primary chalk block; Rematch labelled secondary/proposal with note (keep; brief must-show). If demoted → interaction 4.
- **Data truth:** per-match `PREY REMAINING 2/2` removed from `history` (strict §2.2 dissent resolved on the new render); history row start times vs detail; just-played match appears; dates weekdays correct (Wed 4 Nov etc.).
- **A11y:** 10 room-rules steppers + settings steppers ≥48 hit boxes; switches ≥48 wrapper + ON/OFF word cue; 12 px floor respected; `lobby-rtl` isolates 0 unisolated; Arabic if any must be Arabic face/no tracking.
- **Home:** pre-hunt status is permission-only (no invented GPS ±6 m); if kept live-fix, NOTES must flag the client/permission change.
- **Content:** neutral server label (no real IP), clipped "Nadia" fixed, 01–05 indices removed, chat "newest first" label/order fixed; "Riverside Park" label from real zone coords.
- **New extras:** paused / offline-reconnecting / eliminated-spectating rendered; check they inherit the instrument grammar (and count as state-completeness evidence).
- **Regression:** readout band hierarchy, claim countdown, paper note, result winner + time ruler unchanged; brand-cost of zero-cyan reweight unchanged/documented.

## Score-lift policy (fairness)
- Caps lift only on rendered evidence; otherwise they stay at 2.
- A fix that adds new defects is netted in the same axis, not accepted as a win. A regression on any core page caps that axis at 3 (reviewer-ux S5) unless a §2 cap already applies.
- Recompute weighted totals from the shared rubric weights; present raw round-2 totals + cap-lift notes; ranking argued in prose. No taste laundering: if round 2 lands two directions within 0.10, the recommendation says so and gives the owner the trade-off.

## Final consolidation (task-12, with reviewer-ux)
`FINAL-RECOMMENDATION.md`: final axes×directions table + one-line verdict each; ranking + reasoning; 14 per-page
picks + steals (best-visual and best-usable where they differ); implementation read (Compose risks, tokens to
formalise, engine items); top-5 owner questions; honest limitations.
