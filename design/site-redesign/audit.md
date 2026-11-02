# ManHunt landing page — audit of the page being replaced

**Scope:** `server/src/app.ts` → `renderInstallPage()` as shipped at commit `0c44361`
("feat(site): turn the install page into a full game landing page"). Read-only diagnosis for the
redesign; evidence is the page itself and the before-captures in `shots/before/`
(1440 desk, 820 tablet, 390 mobile; headless Chrome, real DevTools emulation).

The page was a real advance on the old single-card install sheet. It is still not good enough, and
the reason is structural rather than cosmetic.

---

## What it says, in one line

**A spec sheet laid out in components, with no point of view.** It documents the game accurately and
sells it weakly: the page never decides what the first, second and third things you should feel are,
so everything is presented at the same weight, in the same container, and the brand is decoration
rather than structure.

---

## Findings, ranked by impact on "does this look like a game worth organising an evening around?"

### 1. Card monotony — the page is a stack of identical rounded cards (critical)

Counting the containers in the shipped page: a boxed hero card, a lead panel card, two stat cards,
a film split card, six screenshot cards, four flow cards, two side cards, six feature cards, a
download card, an install card, a privacy card, five FAQ cards. All of them use the same 14–22 px
radius, the same `--card`/`--surface` gradient fill, the same 1 px border and (most of them) the same
soft shadow. Seven different *kinds* of information — hero, stats, roles, sequence, evidence,
rules, download — are all the same shape. When every object is equally emphatic, nothing is
hierarchical, and the page reads as a component library demo rather than a poster. This is the same
diagnosis the app redesign reaches for the app (see `design/redesign/direction.md` §1.1).

### 2. Eleven tracked-out all-caps eyebrow labels (critical — the strongest "templated" tell)

`REAL-WORLD HIDE-AND-SEEK`, `OPEN ZONE / FIELD NOTES`, `THE 60-SECOND VERSION`, `IN THE APP`,
`HOW A HUNT RUNS`, `WHY IT WORKS`, `BEFORE YOU PLAY` … a mono, letter-spaced, cyan label sits above
almost every heading. This is the single most recognisable AI-generated-page pattern right now, it
carries no ManHunt meaning, and it flattens the h1/h2 hierarchy further. The brand's own visual
direction explicitly forbids it ("ALL-CAPS eyebrow labels on every block", `visual-direction.md` §3).

### 3. No map anywhere on a page about a live map (critical)

The product's signature surface — a real street map at night with a zone ring, a prey dot, hunters,
trails and a clock — appears on the page only as the abstract radar illustration in the hero SVG.
Meanwhile every competitor site in the category leads with its map. The page owns a real, ownable
map identity (Deep Teal, Open Zone) and hides it. The "screens" section has six app screenshots but
none of the hunt/map screen (the repo had retired the old map screenshot and nothing replaced it).

### 4. Placeholder screenshots presented as evidence (high)

The "Built for the street" grid is six equal, top-cropped, rounded frames showing captures with a
test room (`CI Room`), placeholder usernames (`alice74354`, `bob74354`) and empty states
(`Signed in as -`). The page is trying to sell a social game with proof of a test build. They are
also cropped identically so the most interesting part of each screen (the map, the team sheet) is
not visible. *(The screenshot workstream, task-49, replaces these; the redesign treats real captures
as content, not decoration.)*

### 5. The slogan is smaller than the decoration (high)

`HIDE FROM YOUR FRIENDS.` is set at `clamp(28px, 4.2vw, 46px)` inside a 1200×600 hero image whose
radar is 60 % of the card and whose wordmark is drawn at ~26 % of the frame width. On a 1440 px
desktop the most important words on the page are ~46 px tall. A poster's slogan should be the
biggest thing in the first viewport; here it is the fifth-largest element after the radar, the
wordmark, the nav and the download card.

### 6. The install/trust moment is buried mid-page in the same card as everything else (high)

The download card sits after the features grid, then install steps in another card, then privacy in
another card. A first-time visitor has to scroll ~4,000 px through feature copy before reaching the
one thing the page exists to do. The SHA-256, version, size, server address and Play Protect warning
— the trust content that makes sideloading feel deliberate — are split across two low-contrast
cards. The single most important moment on the page has no hierarchy.

### 7. No display typography (high)

One system sans for everything, at body-scale weights. The page has no display face, no poster
scale, no tabular numerals (so the version, size and date wobble between lines), and no typographic
voice. The brand's type temperament (condensed grotesque, DIN tradition, tabular numerals) is
documented in `visual-direction.md` §3 and present in the app redesign, but absent from the page.

### 8. Zero real community evidence (medium)

The aggregate stats are honest but rendered as two large empty cards showing `0` / `+0` on the dev
server — a visual dead end. They are also the first content after the lead section, so the page's
second beat is frequently a pair of zeroes.

### 9. The film is a split card with a raw GitHub MP4 link (medium)

The 60-second explainer — a genuinely strong asset — is presented as a small side card with a cover
crop and three inline links, one of which points at a raw.githubusercontent.com MP4. No play
affordance, no context for why it is worth watching, no poster treatment.

### 10. Motion is a single looping radar, everywhere (low–medium)

The hero radar loops indefinitely with no relation to anything else on the page, while every card
hover gets a `filter: brightness()`. The brand's motion vocabulary (one broadcast moment, clock
discipline) is not used; there is neither a page-load moment nor stillness.

### 11. iOS/Android safe-area and small-screen polish gaps (low)

At 390 px the hero card is 30 px narrower than the viewport inside a 14 px gutter, the wordmark still
carries its large-desktop layout (desktop hero type hidden behind container queries), the version
chips wrap awkwardly, and the six screenshot cards become a 2,100 px vertical list of identical
thumbnails — the least scannable form of the most visual content.

### 12. No use of the approved Open Zone geometry (low)

The hero uses the old radar artwork rather than the approved Open Zone mark/unclosed ring, and the
drawn MANHUNT wordmark is inlined in the hero but not used as the actual site logo (the masthead
shows the raster favicon + the word "ManHunt"). The page contradicts the frozen identity package it
ships next to.

---

## What was kept on purpose (don't throw the baby out)

- The honest install path, Play Protect warning, SHA-256, server line, plain-HTTP test-server caveat
  and the "not a safety service" line — all required and all carried into the new page.
- The real content set (roles, how a hunt runs, the server-authoritative rules, English/Arabic,
  self-hosting, the film, the FAQ answers) — rewritten, not re-invented.
- The palette and the Open Zone identity — the new page uses them *as structure*.
- The dynamic metadata contract (manifest on every request, no-manifest fallback, `/app.apk`,
  `/media/*`, `/join`, health, CSP) — unchanged in behaviour.

## Principles the fix had to satisfy

1. One hierarchy of moments per page, not a component library.
2. The slogan and the real map are the two biggest things.
3. Rules are structure (hairlines, alignment, rules-ledger), not decoration.
4. Plates only for interaction; prose never in a card.
5. Every piece of trust content is visible near the download.
6. The page must feel like the same product as the redesigned app and the identity package.
