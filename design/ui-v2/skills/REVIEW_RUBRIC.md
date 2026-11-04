# REVIEW RUBRIC — scoring anchors and page-level checklist

Expands `design/ui-v2/briefs/02-evaluation.md` into observable anchors. Reviewers (reviewer-visual,
reviewer-ux) use it in round 1 and round 2; the Lead uses it to gate the owner pack. Score the **design as
rendered**, not the NOTES or the intent.

**Scale:** 1 = failing the bar; 2 = clearly below; 3 = acceptable/meets; 4 = strong; 5 = exceptional.
Half points are allowed only with a written reason. Weighted total = Σ(axis score × weight) on a 5-point scale.

| # | Axis | Weight | Owner emphasis (both score all axes) |
|---|---|---:|---|
| 1 | Brand & product fit | 15 % | reviewer-visual |
| 2 | Distinctiveness / memorability | 15 % | reviewer-visual |
| 3 | Hierarchy & clarity | 15 % | reviewer-visual (UX co-reviews) |
| 4 | System consistency | 15 % | reviewer-visual |
| 5 | Interaction & flow UX | 15 % | reviewer-ux |
| 6 | Accessibility & RTL/i18n | 10 % | reviewer-ux |
| 7 | Engineering feasibility | 15 % | reviewer-ux |

---

## 1. Axis anchors (1–5, with observable evidence)

### 1. Brand & product fit (15 %)
Is this unmistakably ManHunt — the field sport played with phones — rather than a generic dark mobile app?

| Score | Anchor |
|---|---|
| 1 | Could be another game/app with the palette swapped; no Open Zone/Board/team grammar; brand used as decoration; breaks approved rules (e.g. gradient hero, cyan as accent, paw/crosshair). |
| 2 | Some ManHunt signals (palette, maybe a mark) but the screen would not be recognised as ManHunt without the wordmark; the game's own objects (board, teams, code, field log) are not structural. |
| 3 | Clearly a ManHunt direction: palette roles respected, approved mark present, one or two signature elements used consistently; still reads a bit like "sports-themed app". |
| 4 | Unmistakably ManHunt at page level: Board/clock + team grammar + code/field-log/field-plate used as structure; brand line placed correctly; the game's props *are* the UI; no rule breaks. |
| 5 | Advances the identity: a page you could put in a pitch deck without the app context and a player would say "that's ManHunt"; the props are used with confidence and craft; every brand rule is honoured *and* the system looks finished, not just compliant. |

### 2. Distinctiveness / memorability (15 %)
Would the owner remember this direction after one look? Is it original, not a template or a trend?

| Score | Anchor |
|---|---|
| 1 | Generic template (card stack, standard HUD, Material defaults); the "street/game" idea is only a few stickers; no visual idea beyond colour. |
| 2 | A direction with a voice but derivative: looks like a known app/game/brand (or another candidate direction); the idea is applied inconsistently or only to the hero page. |
| 3 | A real direction: identifiable across pages, one clear idea, some ownable gestures; a few elements are still generic. |
| 4 | Memorable and original: one glance recalls it; the idea holds on secondary pages and states (not just Home); no template tells; references are digested, not copied. |
| 5 | One-glance-from-memory; the direction creates a visual language the owner could screenshot for a store page / social post; every page contributes to the idea; nothing borrowed recognisably; the system could only be ManHunt. |

### 3. Hierarchy & clarity (15 %)
Can a stressed, one-handed player find the action and read the state in <1 s?

| Score | Anchor |
|---|---|
| 1 | Can't find the primary action; clock/state small or absent; competing loud elements; text below readable size; cards give everything equal weight. |
| 2 | Primary exists but competes; clock/state present but not the first thing; some pages need effort; data duplicated. |
| 3 | Works: one clear primary per page, clock/state readable, acceptable hierarchy; a few weak pages or ambiguous states. |
| 4 | Eye lands on the right thing instantly on every page; the Board/clock is the loudest object where it belongs; secondary data ranked correctly; thumb-reachable primary. **Squint test passes.** |
| 5 | Hierarchy is a signature: at thumbnail scale the page still communicates phase + time + one action and reads as ManHunt without the wordmark; typographic rhythm makes the order obvious without decoration; even dense pages (hunt, settings) stay calm. |

### 4. System consistency (15 %)
Does one grammar explain every page and state — or is each page a fresh improvisation?

| Score | Anchor |
|---|---|
| 1 | Per-page improvisation: different radii/type/colour logic; components don't recur; states look like a different product. |
| 2 | Shared palette/type but ad-hoc components; the same element (button/tag/header) appears in several styles; inconsistent spacing. |
| 3 | Mostly coherent: a recognisable core is reused; some one-off components or drift on secondary pages/states. |
| 4 | One grammar across all 14 pages: same Board/rule/plate/tag/dock/state vocabulary; deviations are deliberate and documented; light/RTL proofs use the same system. |
| 5 | The system is the direction: a table of components and their variants would explain every pixel; states, overlays and proofs all inherit it; a new page could be designed from the grammar without asking a question. |

### 5. Interaction & flow UX (15 %)
Can a real player complete the real flows without dead ends, and are the states complete?

| Score | Anchor |
|---|---|
| 1 | Dead ends, unclear states, missing empty/loading/error/offline; destructive actions unguarded; flow contradicts the game rules; copy invented. |
| 2 | Main flows work but states are thin (spinner/red card); disabled reasons missing; tag/claim or lobby flow not fully considered; retry loses input. |
| 3 | Flows work; key states present; some gaps (offline, permission, error ownership, tagged/spectating) or ambiguous buttons. |
| 4 | Every required state designed and reachable: empty/loading/error/offline/reconnect/permission/paused/eliminated/tag claim/tag dispute/update available; each says what happened + next action; retry preserves input; destructive actions name consequences; one-handed flows. |
| 5 | State-complete and stress-tested: a player can be interrupted, offline, eliminated, or claimed against and the screen still tells them the truth and the next move; every action names its object; the flow matches the server rules exactly; no invented UI action without a feasibility note. |

### 6. Accessibility & RTL/i18n (10 %)
Would this pass on a real device in Arabic, at 200 % text, in daylight?

| Score | Anchor |
|---|---|
| 1 | Unusable: contrast failures, <48 dp controls, colour-only cues, Latin type for Arabic, no RTL thinking, text clipped. |
| 2 | Some gaps: body contrast borderline, targets small, tracking/size issues, RTL is a mechanical flip, Arabic strings would overflow. |
| 3 | Meets the basics: AA on main text, 48 dp targets, visible states, a plausible RTL note; a few weak spots (metadata contrast, expansion, bidi, light theme). |
| 4 | AA everywhere stated, ≥48 dp, colour never alone, text scales without clipping, true RTL proof (mirrored layout, LTR numerals/code, Arabic face), light theme plausible, focus/reduced-motion covered. |
| 5 | Accessibility is designed, not patched: semantic structure (board as a readout, map text alternative, errors announced once), Arabic reads like Arabic, numerals never dance, 200 %/320 dp reflow shown or specified, daylight/night both work; no exception needed. |

### 7. Engineering feasibility (15 %)
Could this ship in Compose on minSdk 26 against the existing data contract — or does it need engine work?

| Score | Anchor |
|---|---|
| 1 | Needs engine/OS work, impossible layouts, fake data, banned assets, or contradicts the API; "it's just a concept". |
| 2 | Buildable with major effort: new rendering paradigms, many new components/gestures, unclear state mapping, risky animations, tokens absent. |
| 3 | Buildable with effort: maps to existing components mostly; some new pieces and state work; a few unknowns named. |
| 4 | Maps cleanly to Compose + tokens + existing data; reused components identified; new components small and listed; risky items (map, animation, RTL, insets) addressed; honest deltas. |
| 5 | Handoff-ready: per-page component mapping, token deltas, state/data source per element, exact copy keys, accessibility semantics, and known costs (small client/server/engine) named; nothing silently invented. |

---

## 2. Automatic caps and red flags (apply before averaging)

These cap the affected axis (not the whole direction) at **2**, and must be listed in the review:

1. **Banned material** in any page: gradient/glow/shadow/glass hero, 20 dp card stack/icon tiles as the core
   system, pill buttons for primary actions, stock/AI/network imagery, recut/retyped wordmark. → caps axis 1
   (brand) and 2 if it is the main idea.
2. **Fake content**: lorem, fake player counts/ratings/store badges, invented flags/claims, `--:--` clocks,
   dev strings (`10.0.2.2`, `alice74354`, `Cl Room`, lone `-`). → caps axis 5 and axis 7.
3. **Unreadable at full size / missing pages or states**: fewer than the 14 required renders, or a page
   illegible at 1170×2532 full size. → caps axis 3 for that page; system consistency caps at 2 if pages are missing.
4. **No genuine RTL proof**: `lobby-rtl` is a mirrored screenshot with Latin Arabic or numerals reversed/mirrored.
   → caps axis 6 at 2.
5. **Light proof is a different identity** or the Board becomes a white card. → caps axis 1/4 per impact.
6. **Copy violations**: exclamation marks, ALL-CAPS headings, invented claims, "safe/secure/private", more than
   one cyan surface on a page, colour-only team state. → caps axis 5/1 as relevant.
7. **Contradicts the game rules** (e.g. prey sees another prey; tag available during head start; result dodges
   the winner; rematch presented as shipped). → caps axis 5 and 7.
8. **NOTES.md missing the required sections** (thesis, per-page intent, rejected ideas, Compose/feasibility,
   known weaknesses). → caps axis 7 at 3.

---

## 3. Deliverable acceptance (checked before design scoring; failure = direction is not reviewable)

- [ ] 14 full-page renders, exact **1170×2532**, at `directions/<d>/out/`; pages at `directions/<d>/pages/`
      (all 12 canonical + `lobby-rtl` + `home-light`).
- [ ] Direction `NOTES.md` with: one-paragraph thesis; type/colour/spacing/component decisions; per-page intent
      + 1–2 key decisions; states covered; what was rejected; Compose/feasibility notes; known weaknesses.
- [ ] Contact sheet from the env tool; direction pages legible at full size and thumbnail.
- [ ] Real seed data everywhere: Riverside Run / K7M2QX / 5 players (3H/2P) / 240 m / 41:12 / 60:00;
      result 18:48 played, PREY 0/2.
- [ ] Only approved mark/fonts; original vector work; no stock/AI/network assets.
- [ ] Every page has one primary action, a designed state (per `PAGE_INVENTORY.md` §18), and no fake UI.

---

## 4. Page-level checklist (walk every page; tick/cite the page)

### Cross-page (apply to each page)
- [ ] One primary action, bottom 40 %, only filled-cyan surface; disabled state has a reason adjacent.
- [ ] The page's real state is present (canonical) and at least one non-happy state per `PAGE_INVENTORY.md` §18.
- [ ] Board/clock/state where the page has it: legible at arm's length/thumbnail; tabular; LTR in RTL.
- [ ] ≤2 plates, no nesting, no plate for prose; grouping by rules/space.
- [ ] Real copy/keys: sentence case, no exclamation, no invented claim, buttons name action+object.
- [ ] No banned elements (gradient/glow/shadow/pill/card stack/icon tile/Material feature icon).
- [ ] Numbers real and honest; no `--:--`, no fake counts.
- [ ] RTL/light system notes (proof pages: actually rendered).
- [ ] Compose note exists for any new component/gesture on the page.

### Page-specific minimums
| Page | Check |
|---|---|
| `auth` | Permanent line in display type, quiet form, server row demoted below the task, loading/error states, password affordance, version honest. |
| `roles` | Prey vs Hunters explained in the app's own rules, Classic playable, planned modes honest ("coming soon", escape to Classic), first-run vs re-read entry, permission moment if shown. |
| `home` | Masthead mark+wordmark, two verbs clearly different objects, code plate editable (6 cells), settings entry, real errors; `home-light` same system. |
| `lobby` | Host: room code/host view, team sheet (Prey/Hunters, host/you/ready/offline), readiness, begin dock with blocker reason, host can ready. Player view + empty team states. `lobby-rtl`: mirrored, Arabic face, LTR numerals/code, no clipped labels. |
| `hunt-hunter` | Map-first + Board clock/state/zone/prey count; fresh + stale reports distinguishable without colour alone; trails; Tag action; OSM attribution; paused/head-start/no-reports/offline states; sheet doesn't cover markers. |
| `hunt-prey` | Own position only (never other prey), zone/clock, report cadence honest, location permission/services/first-fix states, claimed & eliminated/spectating states. |
| `chat` | Field-log grammar (time/name/body, system rows), empty/sending/send-failure/load-older/offline states, composer 52 + 48 send, draft preserved on failure. |
| `result` | Full-time Board with played duration, winner word sentence case (no `!`), honest score (PREY 0/2 or 2/2), duration, final team sheets with TAGGED, lobby + history actions; rematch labelled proposal; cancelled + prey-win variants; winner never hidden. |
| `history` | 3–5 real matches across wins/cancel, list + one match summary, loading/empty/error (error ≠ empty), scroll, no dead ends. |
| `settings` | Ruled manual: theme, text size, language, permissions (location/notifications), update-available state, server read-only honesty, account/sign-out; states (checking/downloading/failed/install). |
| `sheet-tag-claim` | Consequence as title/body ("who/when" + what confirming means), Confirm/Dispute, busy/error, dismissed → persistent banner, disputed-huntmaster variant. |
| `sheet-room-settings` | Ruled groups: timing (head start/duration/report interval), trails, play area open/zone + radius + centre + map picker, shrink, tag policy — accept either (a) a read-only current-behaviour row ("Tags need the prey to confirm", server-enforced) or (b) a costed `confirm`/`instant` proposal whose copy states the real consequence (instant = no claim sheet, prey eliminated immediately) and whose NOTES flag the client-only cost; a third invented value or copy that contradicts the server semantics caps axis 5/7. Validation errors, save/busy. |
| `lobby-rtl` | Genuinely mirrored reading order; Arabic body/display in the Arabic face; code/numerals LTR; no `·`; no truncation; readiness/host labels localised. |
| `home-light` | Same Home system in daylight chalk; Board (if any) ink; contrast holds; no white flash, no cream/off-white identity shift. |

---

## 5. System-level checks (score axes 4/5/6 mostly here)

- [ ] **One grammar:** every page uses the same Board/rule/plate/tag/dock/sheet/state vocabulary; variants are
      deliberate.
- [ ] **State vocabulary:** empty/loading/error/offline/permission/update use the same visual language and copy
      rules across pages.
- [ ] **Colour semantics:** cyan never a team/accent; coral/violet only teams; one cyan surface per page; error
      distinct; contrast table in NOTES.
- [ ] **Type system:** display only for loud words/numerals; sentence case; mono only data; tabular numbers;
      Arabic type rules.
- [ ] **Touch & scale:** ≥48 dp; text scaling reflow; no fixed text heights; 320 dp and 1.5×/2× considered.
- [ ] **Flow truth:** every action/state maps to the app's real data/actions; deltas (rematch/tag policy/history
      summary/server edit) explicitly costed in NOTES.
- [ ] **Proof pages:** `lobby-rtl` and `home-light` are real designs, not recolours/mechanical flips.

---

## 6. Round process (matches `briefs/02-evaluation.md`)

**Round 1 — cold and independent.**
1. Read briefs + skills; open pages in order; note first-impression per page before reading NOTES.
2. Score all 7 axes per direction with 2–4 sentence justifications; cite page/state evidence.
3. Write top 3 strengths, top 3 problems, and **one concrete fix per problem** (what to change on which page).
4. Page-by-page ranking: for each canonical page + proofs, which direction has the best version.
5. Choose 3 stealable ideas across directions (specific enough to implement).
6. Message each designer directly with their findings; invite questions; log the dialogue in the review file.
7. Do not confer on numbers before both reviewers have written their own; reconcile after.

**Dialogue.** Designers accept/partially accept/push back with reasons; decisions go into direction
`NOTES.md` "review response" and the review file. Reviewers do not edit designer files.

**Round 2.** Re-score only axes that changed plus a regression check on all pages; verify fixes are systemic
(not one page); keep dissents; update the page-level best picks.

**Final.** reviewer-visual (with reviewer-ux) consolidates `reviews/FINAL-RECOMMENDATION.md`: final scores table,
ranked recommendation with reasoning grounded in this rubric, per-page best picks + steals, implementation read
(Compose risks/tokens/engine items), top 5 open owner questions, honest limitations. The owner makes the call —
taste is not delegated to scores.

---

## 7. Scoring hygiene

- Score the **rendered design**; notes can explain but not earn points. A stated token you can't see is not a point.
- Do not average away a broken core page (Home/Lobby/Hunt/Result): call it out and cap the relevant axis.
- Weight the axes as given; two reviewers produce their own tables, then reconcile; dissent recorded, not erased.
- "Different" is not "better": distinctiveness is scored on memory/ownability, not on loudness.
- "Clean/minimal" is not automatically accessible or feasible: check contrast, targets, states, and implementation.
- Be specific: every problem gets a page + element + fix; no "needs more polish".
- No sycophancy; no dogpiling on taste — justify with the brief/rubric. Kindness = precision.
- Record the score for the *latest* render; a fixed page is re-scored from the new PNG, not from the message.

---

## 8. Review file templates

**Per direction (round 1):**
```md
## Direction A — Matchday, raised
Weighted total: x.xx / 5
| Axis | Score | Evidence (page/state) | Why this score |
|---|---|---|---|
| Brand & product fit | 4 | Home, Hunt, Result | … |
…
Top 3 strengths: …
Top 3 problems: …
1. problem → concrete fix (page, element, change)
…
Stealable ideas: 1) … 2) … 3) …
Page gaps vs PAGE_INVENTORY.md §18: …
Dialogue log: designer replied …, decision …
```

**Per-page ranking:**
```md
| Page | Best direction | Why (1–2 elements worth stealing) |
|---|---|---|
| auth | B | the … |
```

**Final recommendation (reviewer-visual + reviewer-ux):**
1. Final scores table (axes × directions) with one-line verdict per direction.
2. Ranking + reasoning (brief/rubric, not taste clichés).
3. Per-page best picks + steals.
4. Implementation read: Compose risks, tokens to formalise, engine items.
5. Top 5 open questions for the owner.
6. Honest limitations of the evaluation.
