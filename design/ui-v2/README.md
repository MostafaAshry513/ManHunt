# ManHunt UI/UX redesign v2 — workstream

**Status:** active, launched 2026-11-04. Branch `design/ui-v2`.
**Owner intent:** redesign the *app UI/UX* (not the game rules) — every page of the game as a complete,
full-bleed app screen, explored in competing directions, reviewed and rated, then converged on the best.

This folder is the workstream root. Nothing here is app code and nothing is committed to `master`.

| Path | What lives here | Owner |
|---|---|---|
| [`briefs/`](briefs/) | Workstream brief, page set, direction territories, evaluation rubric | Lead |
| [`env/`](env/) | The design environment: exact-pixel renderer, page canvas, preview server, contact sheets | design-env |
| [`skills/`](skills/) | App-specific design skills: playbook, page inventory, component grammar, tokens, rubric | design-smith |
| [`directions/`](directions/) | Three competing full-app design directions, each with HTML pages + rendered PNGs + notes | designer-a / -b / -c |
| [`reviews/`](reviews/) | Scoring, page critiques, round notes, final recommendation | reviewer-visual / reviewer-ux |

**Flow:** environment + skills → round-1 drafts → reviews (scores + critique) → designer↔reviewer dialogue →
round-2 revisions → final scores + recommendation → owner picks. Designers and reviewers talk directly.

Read in this order: `briefs/00-workstream.md` → `briefs/01-directions.md` → `briefs/02-evaluation.md` →
`env/README.md` → `skills/DESIGN_PLAYBOOK.md`.
