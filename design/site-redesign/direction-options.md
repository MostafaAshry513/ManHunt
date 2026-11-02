# ManHunt landing page — direction decision (idea-refine pass)

**Status:** decision record for task-50. The chosen direction is implemented in `server/src/app.ts`;
the design source is `refs/site-ref.html`, the system is `tokens.md`, the diagnosis is `audit.md`.
Written as a convergent one-pager so the *why* survives after the sprint.

---

## Problem statement

**How might we make a free, sideloaded Android game feel like a real sport worth organising an
evening around — on a plain-HTTP install page that someone opened from a group chat?**

Constraints that decide almost everything:

- **The growth unit is a group, not a person.** The page must convince one organiser and give them
  something worth forwarding to five friends.
- **The product's differentiator is a rule, not a screen.** "Live map hide-and-seek" is table stakes
  in this category; server-owned clocks/teams/tags is not. The page has to dramatise the *rules*.
- **Distribution is the trust bottleneck.** Bare APK, unknown sources, maybe a Play Protect warning.
  A page that looks improvised loses exactly there; it has to look *deliberately underground*.
- **Technical frame:** one static Fastify response, CSS + inline SVG, no JS, no remote assets, CSP
  `default-src 'none'`, mobile-first, dynamic manifest metadata preserved.

The page being replaced documents all of this accurately and sells none of it (see `audit.md`).

---

## Three territories (divergent)

### A. NIGHT FIXTURE — the matchday programme for a borrowed field

The page is the printed handbill/programme for a sport with no league: a fixture poster for
tonight's game. Hero is a match poster (slogan over real ground); the page then reads like a
programme — the field, the sides, the round, the rulebook, the field pass. Print devices are used as
**structure**, not costume: a margin rail with running heads, hairline rules, annotated map plates, a
rules ledger, one download plate, honest small print. Type is the poster: condensed athletic
grotesque at poster scale. One loud gesture, then discipline.

### B. MATCHDAY BROADCAST — the game as a live broadcast package

Giant scorebug clock, team colours, lower-third captions, motion like broadcast graphics, replay
screens. **Why not:** it is the most crowded aesthetic in gaming sites, it reads esports/tactical HUD
(the brand is explicitly neither), and it spends the brand's one loud gesture on a clock that does
not move on a marketing page.

### C. FIELD GUIDE — a plate from a field guide to a sport that does not exist yet

Annotated maps, specimen screenshots with leader lines, measured captions, near-empty pages, clinical
reference markers. **Why not:** it explains a system to someone who has not asked about the system
yet — exactly the critique that killed the old copy. As a whole page it is too quiet for a group
activity. (Its best device — the annotated plate — is adopted inside A.)

---

## Stress test

| Criterion | A Night Fixture | B Broadcast | C Field Guide |
|---|:--:|:--:|:--:|
| Makes a group want to install together | **5** | 3 | 3 |
| Survives the sideload/trust path with dignity | **5** | 4 | 4 |
| Ownable vs. "live-map hide-and-seek" competitors | **5** | 3 | 4 |
| Uses the approved Open Zone identity as structure | **5** | 4 | 3 |
| Executable with no photography/JS/remote assets | **5** | 3 | 5 |
| Works for the functional job (download + install + privacy) | **5** | 4 | 3 |
| Mobile-first at 390 px, accessible, reduced motion | **5** | 3 | 4 |
| Premium screenshot / visual-showcase potential | **5** | 4 | 3 |
| Honest tone, no surveillance/military reading | **5** | 3 | 2 |
| **Total (max 45)** | **45** | **31** | **31** |

**Decision: build A.** It is the only territory that is both editorial and athletic, that turns the
real map and the real screenshots into the two visual anchors, and that makes the rules section a
*structure* (a ledger) instead of a feature grid. It also matches the approved brand idea
one-to-one: **the pitch is borrowed, the rules are not** — which becomes the page's biggest
typographic moment.

**Coherence bonus:** the app's approved redesign direction is **MATCHDAY BOARD** (the phone is a
piece of match equipment: scoreboard, team sheet, chalked pitch, match report). NIGHT FIXTURE is its
sibling: the board's programme/poster. They share type, palette, rules, team tags, radius, zero
elevation and flat fills, so a screenshot of the app can sit inside the page without a seam.

---

## The direction, in one page

1. **The one gesture** — the slogan at poster scale over a real Deep-Teal street map that bleeds off
   the frame, with the Open Zone ring, a coral Prey, violet Hunters, a trail and a server clock.
2. **The programme** — a 96 px margin rail carries `01 / THE FIELD` … `07 / THE QUESTIONS`; the
   whole page is one ordered document, not a section list.
3. **The field plate** — the widest real image on the page: real map + a full-width board strip +
   four annotated notes (zone, latest report, trail, clock) with connector ticks.
4. **The round strip** — four beats on a ruled strip; a true sequence, hairlines instead of cards.
5. **The screens** — real captures staggered like prints on a contact sheet, never a uniform grid.
6. **The rules** — the brand sentence in `display-xl`, then an eight-row ledger (clock, teams, tags,
   map, signal, hosting, language, cost) and the privacy notes as honest small print.
7. **The pass** — the only large plate on the page: big "Get on the field.", manifest metadata,
   one cyan download, the SHA-256, the server, the Play Protect warning, four install steps.
8. **The answers** — native `<details>` as a ruled Q&A index. No JS anywhere.

Deliberate omissions: no fake league/season framing, no ticker, no fake countdown/counts/testimonials,
no stock photography or faces, no autoplaying video, no scroll-triggered reveals, no gradients,
glows, shadows, glass or 3D, no emoji, no exclamation marks.

---

## Key assumptions to validate (with the cheap test)

- [ ] **The hero's real map reads as a game, not as a surveillance tool.** Test: 5-second reaction
      test with 10 people who have not seen the app. If the first words are "tracking app", reduce
      the map's share of the hero / increase the game copy. (Brand kill-condition: a location game
      that reads as surveillance has lost.)
- [ ] **The poster type still works on a small, cheap Android phone.** Test: real 390 px device at
      1.0× and 1.3× font scale; the hero CTA must still be above the fold.
- [ ] **A group forwards the URL after the hero alone.** Test: ask three people what they would send
      to their group chat after 5 seconds. If they describe mechanics rather than "let's play", the
      hero under-sells the evening.
- [ ] **The install/trust block converts.** Test: compare APK downloads per visit before/after; the
      pass block is the only conversion point, so any regression is this block's problem.
- [ ] **Unknown: will the owner accept self-hosted OFL fonts?** Decided during the sprint: the Lead
      approved same-origin OFL woff2 as not being an "external asset"; the fallback is a one-line
      type-stack swap in `refs/site-ref.html`.

**Could kill it:** if the map plates cannot be shown without OSM attribution or without claiming
tile-level detail the product does not have; if the premium captures never arrive and the screens
section stays as placeholder evidence (that is a content problem, not a direction problem); if the
owner reads "programme/print" as nostalgia rather than sport.

---

## MVP scope (what shipped in the redesign)

- Full rewrite of `renderInstallPage()` in `server/src/app.ts`, generated from
  `refs/site-ref.html` by `tools/build-page.mjs`.
- Real Deep-Teal map plates generated from OSM tiles by `tools/make-map.ps1` (hero + wide band).
- Self-hosted subset OFL fonts (`tools/build-fonts.ps1`) served by the allowlisted `/media/:file`
  route; CSP gains `font-src 'self'`.
- Optimised WebP/JPEG phone captures (`tools/optimize-assets.ps1`) with `<picture>` and explicit
  dimensions; no layout shift, no blank images.
- Dynamic manifest data preserved (version, size, SHA-256, published, download href, server address,
  aggregate stats, no-manifest fallback).
- Install/privacy/FAQ/attribution content carried over and rewritten for tone.
- Tests rewritten for the new information architecture, no-script/no-remote-asset guards, media and
  font allowlist, zero-account state; `tsc --noEmit` + `npm test` green.
- Real Chrome verification at 1440/820/390 (mobile emulation, DPR 2) with overflow/image/console
  diagnostics (`tools/capture.mjs`).

## Not doing (and why)

- **JavaScript** — the page is a poster; the only interaction is native `<details>`. No analytics, no
  consent banner, no smooth-scroll library. Nothing to break under CSP `default-src 'none'`.
- **A blog/feature-marketing layer** — there is no new content to justify more sections; more
  sections is the old problem.
- **Fake screenshots or mockups** — the screen section uses real accepted premium captures only: the
  live hunt (`s07-hunt`), home (`s03-home`), lobby (`s05-lobby-host`), chat (`s11-chat`) and the
  full-time result (`s12-result-hunters`). The screens list is data-driven, so adding the Prey-win
  variant or the light theme is one entry; nothing is faked or composited.
- **A second palette or a light theme for the site** — the brand is dark-first; light theme is an app
  feature, not a marketing surface.
- **Embedding the 60 s video** — a raw MP4 on the page would fight the CSP and the page weight; the
  page links out to the film with a poster frame instead.
- **Arabic RTL version of the site** — the app is bilingual; the marketing site is English for this
  sprint. (If it becomes bilingual, the same layout mirrors cleanly — no fixed asymmetric widths are
  coded in `left/right`, all use logical spacing.)
- **Commits/deploys** — the sprint produces the working tree and evidence; the Lead owns integration.

## Open questions

- **Result section:** integrated from the accepted `s12-result-hunters` full-time frame (18:48,
  "Hunters win.", prey 0/2). The rail shows hunt → home → lobby → chat → result. `s13-result-prey`
  (the Prey-win variant), `s14-settings` and `s15-home-light` are clean and available but unused by
  choice; they are one data entry away if the Lead wants a sixth tile.
- **Hero plate provenance:** the hero and field band use the real premium OSM harvest. The hero uses
  the 4:5 live-hunt harvest crop (it carries the app's real zone + prey markers + trail at a portrait
  aspect that fits the plate); the field band uses the 16:9 OSM harvest. The 3:2 harvest is
  river-only and could not carry the game state. If the Lead prefers a different crop, only
  `tools/optimize-assets.ps1` crop rectangles change.
- Does the owner want the OG image refreshed to match the new page? (It is an identity-controlled
  asset; not edited in this sprint.)
- Should the hosted page link to a self-hosting guide more prominently than one ledger link? Current
  placement: the "Yours to host" ledger row and the footer.
