# Evaluation rubric and review process

## Axes (score 1–5 each, with anchors)

| # | Axis | Weight | 1 | 3 | 5 |
|---|---|---|---|---|---|
| 1 | Brand & product fit | 15% | feels like another app | recognises ManHunt | unmistakably ManHunt, advances the identity |
| 2 | Distinctiveness / memorability | 15% | generic | a direction with a voice | one glance from memory; no template tells |
| 3 | Hierarchy & clarity | 15% | can't find the action | usable with effort | eye lands on the right thing in <1 s |
| 4 | System consistency | 15% | per-page improvisation | mostly coherent | one grammar explains every page/state |
| 5 | Interaction & flow UX | 15% | dead ends, unclear states | workable | fast, obvious, state-complete (empty/loading/error) |
| 6 | Accessibility & RTL/i18n | 10% | unusable | some gaps | AA contrast, 48 dp, scaling, true RTL |
| 7 | Engineering feasibility | 15% | needs engine work / fragile | buildable with effort | maps cleanly to Compose, tokens, existing data |

Also required per direction: a **page-by-page weakness list** (the 3 worst pages and why) and **3 stealable
ideas** other directions should consider.

## Process

1. **Round 1** — reviewers read all three directions cold, score independently (no conferring on numbers
   first), and write: per-axis score + 2–4 sentence justification, top 3 strengths, top 3 problems, and one
   concrete fix per problem. Then they **message each designer directly** with the findings relevant to them.
2. **Dialogue** — designers ask clarifying questions, push back with reasoning, or accept and fix. Decisions are
   recorded in the direction `NOTES.md` ("review response" section) and the review files.
3. **Round 2** — designers revise within scope, re-render, and report what changed. Reviewers re-score only the
   axes that changed plus any regression check, then consolidate.
4. **Final** — reviewers produce `reviews/FINAL-RECOMMENDATION.md`: final scores table, per-page best picks
   ("best lobby is B", "best result is A"), ranked recommendation with reasoning, and open owner questions.
   The **owner makes the final call** — taste is not delegated to scores.

## Scoring hygiene

- Score the **design as shipped in the pages**, not the direction's intent or its notes.
- Do not average away a broken core page; call it out.
- Two reviewers must reach a shared table but may keep separate dissents in the file.
- Reviewers must not edit designers' files; all fixes go through the designer (message + review notes).
