# UI/UX redesign v2 — handoff brief

> **UPDATE 2026-11-04 20:05 UTC — round 2 complete; final recommendation filed.**
> - All three directions are revised, re-rendered and reviewed twice (rounds 1 and 2). Final reconciled scores:
>   **A 4.30 · B 4.30 · C 4.15** (no caps remain). Full argument + per-page picks + implementation read + owner
>   questions: **`reviews/FINAL-RECOMMENDATION.md`**. All round-2 capture pack artifacts are in `env/out/`
>   (48 captures at 1170×2532, sheets 2704×6128, matrix 1858×18868, strips 1426×1612, gallery `index.html`).
> - **Next step is an owner decision, not more design work**: pick the product direction (A or B — they tie;
>   C is the best source of hunt/claim design and should be mined for steals), then implementation.
> - The five owner questions are listed in `FINAL-RECOMMENDATION.md` §5. This handoff is current as of the
>   round-2 finish; the sections below describe the workstream as originally handed over and remain accurate.

**Status:** round 1 complete (3 full directions × 14 pages), not yet reviewed, no app code changed.
**Handed over from:** a DeepSeek Harness chat session that ran the workstream with an agent team.
**Handed over to:** the dsh-superagent deployment for ManHunt (`MostafaAshry513/ManHunt`).
**Owner:** MostafaAshry513. **Branch:** `design/ui-v2` (this folder is the whole workstream).

## Owner intent (verbatim, condensed)

Redesign the **app UI/UX only** — not the game rules. Every page of the game as a **complete full real app
page** (no screenshot styling, no Android status/nav chrome overlapping the content). Build a **designing
environment**, design the elements on it, explore competing designs, then **see what is best and what the
owner likes most**. Designers and reviewers must talk to each other directly to reach the best result.

## What exists in this branch

| Path | Contents |
|---|---|
| `design/ui-v2/briefs/00-workstream.md` | Canvas contract (390×844 dp → 1170×2532 px, full-bleed, no OS chrome), 12 canonical pages + 2 proof variants, seed scenario, non-negotiables, quality bar, process |
| `design/ui-v2/briefs/01-directions.md` | Three direction territories: A "Matchday, raised", B "Street signal", C "Field instrument" |
| `design/ui-v2/briefs/02-evaluation.md` | Evaluation axes/weights + review process |
| `design/ui-v2/env/` | Working environment: Playwright Chromium renderer (`render.mjs`), repo-rooted preview server (`serve.mjs`), shared canvas/brand tokens (`canvas.css` incl. Arabic face), contact sheets + comparison matrix + strips (`contact-sheet.mjs`), README |
| `design/ui-v2/skills/` | App-specific design skills written before designing: DESIGN_PLAYBOOK, PAGE_INVENTORY (real app pages/states from code), COMPONENTS, TOKENS, REVIEW_RUBRIC, INSPIRATION |
| `design/ui-v2/directions/a-matchday-raised/` | 14 pages + renders + NOTES (thesis/system/per-page/Compose notes) |
| `design/ui-v2/directions/b-street-signal/` | 14 pages + renders + NOTES |
| `design/ui-v2/directions/c-field-instrument/` | 14 pages + renders + NOTES |
| `design/ui-v2/reviews/` | `prep-visual.md` + `prep-ux.md` (reviewer methods, app-constraint catalogue, calibrated UX audit tooling), no round-1 scores yet |
| `design/ui-v2/env/out/` | rendered proofs; sheets/matrix/strips regenerate with `node env/contact-sheet.mjs` |

**Verified:** 42/42 page renders at exactly 1170×2532 px (A/B/C 14 each). No app/server code was touched.

## What was the process / who did what

| Role | Did |
|---|---|
| Lead (chat session) | Briefs, direction territories, task board, integration, handoff |
| design-env | Built the design environment (renderer/canvas/preview/contact sheets) |
| design-smith | Wrote app-specific design skills + real page/state inventory |
| designer-a / -b / -c | One direction each, full 14-page set, NOTES |
| reviewer-visual / reviewer-ux | Review method + rubric alignment + calibrated DOM/a11y audit tool; **round-1 scoring not yet run** |

## Next steps (ticket-sized)

1. **Render the comparison pack:** `cd design/ui-v2/env && node contact-sheet.mjs` → per-direction contact
   sheets, `matrix.png`, per-page A|B|C strips, `index.html` gallery. Verify every render is 1170×2532.
2. **Round-1 review:** run two independent reviewer passes per `briefs/02-evaluation.md` and
   `skills/REVIEW_RUBRIC.md` (visual/brand + UX/a11y/feasibility), score each direction, write
   `reviews/round-1-*.md` + `reviews/scores-round-1.json`, and message the designers directly.
3. **Designer↔reviewer dialogue**, then **round-2 revisions** per direction (re-render, update NOTES).
4. **Consolidated final:** scores, ranked recommendation, per-page best picks + "stealable" elements,
   implementation read, open owner questions → `reviews/FINAL-RECOMMENDATION.md`.
5. **Owner picks the direction** (taste belongs to the owner). Implementation in Compose is a **separate,
   later phase** — not part of this handoff.

## Rules that must survive any handover

- Full-bleed pages only: no status bar / nav bar / keyboard / device frame / OS chrome; canvas 390×844 dp,
  rendered 1170×2532 px.
- Brand fonts (Big Shoulders / Instrument Sans / Red Hat Mono) + the approved Open Zone mark from the repo;
  original vector/CSS work only — no stock, AI imagery, or network assets.
- Real seed scenario everywhere ("Riverside Run", K7M2QX, 5 players 3H/2P, zone 240 m, clock 41:12,
  result 18:48 / PREY 0/2), real copy and honest states; no fake metrics or product claims.
- WCAG AA contrast, 48 dp targets, Arabic RTL proof, light-theme proof, Compose feasibility notes.
- Do not edit `android/` or `server/`; no pushes to `master` in this phase.

## Environment notes

- Linux host, Node 26, Playwright Chromium lives in `env/.browsers/` (gitignored). Restore with
  `cd design/ui-v2/env && npm ci && npx playwright install chromium`.
- Preview: `node env/serve.mjs` → http://127.0.0.1:4173/ (repo-rooted).
- Reviewers' calibrated a11y/contrast audit: `reviews/tools/ux-audit.mjs`.

## Known open items

- Round-1 scores/reviews do not exist yet; the reviewers are prepped but not run.
- Direction B flags "Rematch · proposal" and client-only `Confirm | Instant` tag-policy UI as costed proposals.
- Direction A/B/C all flag drawn map stand-ins (labelled) rather than real OSM tiles in the concept pages.
- Arabic strings used in the `lobby-rtl` proof are partially new/provisional and need copy review.
