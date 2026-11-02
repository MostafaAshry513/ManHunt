# ManHunt GitHub landing page v2 — MATCHDAY BOARD

**Status:** **delivered — the new root `README.md` is implemented** from the **clean premium subset** (home,
lobby, live hunt, result, tag claim, target sheet, chat, light home) and the hero/social assets are rebuilt
from the real `s07-hunt.png` map area with the canonical board **41:12 / Prey 2/2 / Zone 240 m**. Factual
cleanup after the final matchday audit is in: canonical facts (41:12, lobby code VMJYBU, APK 2.4 MB), the
accurate Prey-visibility claim, and no references to the rejected frames (`s01-auth`, `s10-hunt-sheet`,
`s14-settings`). Rejected frames are replaced/removed by screenshot-director; safety/RTL captures remain
queued and are simply not shown. The copy deck, image manifest and verification are final.
**Author:** brand-animator (independent motion/banner designer), 2026-11-02.
**Inputs read:** `design/redesign/direction.md`, `design/redesign/tokens.md`,
`design/site-redesign/concept.md` + its `shots/ref2/` desktop reference, the current `README.md`,
`design/brand/` kit, `design/redesign/screenshot-shotlist.md`.
**Visual authority:** the site-redesigner's ref2 desktop concept — big condensed display type, a real
map band, cyan/amber editorial accents, hairline structure, left-aligned everything. This page must feel
like the same team, in GitHub's Markdown chrome.

Deliverables in this folder:

| File | What it is |
|---|---|
| `concept.md` | this document: the page concept, architecture, copy deck, manifest, removals, constraints |
| `README.draft.md` | the complete proposed `README.md` (draft note at top marks it unpublished) |
| `preview/readme-preview.html` | GitHub-column simulation of the page (dark mode) with premium placeholders |
| `preview/desktop-1012.png`, `preview/desktop-1012-light.png`, `preview/mobile-390.png` | rendered concept previews (GitHub dark column, light column, phone) |
| `stage/hero.html`, `stage/social.html`, `stage/tag-*.html`, `stage/map-band.html` | render-only asset stages |
| `tools/build-assets.mjs`, `tools/render.mjs`, `tools/verify.mjs`, `tools/implement-readme.mjs` | the asset pipeline, checks and the one-command finalisation (assets → README.md → final verification) |
| `README.md` | working folder index: status, where everything is, how to rebuild |
| `docs/brand/matchday-hero-1280x560.png/.gif` | **new** README hero (poster/scoreboard opening) |
| `docs/brand/github-social-matchday-1280x640.png` | **new** GitHub social preview card |
| `docs/brand/tag-prey-400x120.png`, `tag-hunters-400x120.png` | kit tags for the “two sides” table |

No app or server code was touched. No commits or posts.

---

## 1 · The problem

The current README is competent and still reads like a normal open-source project: centred hero, centred
title, badge row, then a long stack of equally weighted sections and a screenshot table of CI captures. It
does not look or feel like the MATCHDAY BOARD product revealed by the app redesign and the site redesign —
it does not open with a match, it opens with a project.

The owner's ask is literal: **the GitHub page needs real work**. The page has to read like the ticket for
tonight's game, not like the manual for a repository.

## 2 · The concept

**The GitHub page is a matchday fixture sheet, printed in the same system as the app.**

One decisive gesture opens it: **a poster headline over real ground.** “HIDE FROM YOUR FRIENDS.” set huge
in Big Shoulders Display on the ink field, with a live-map plate bleeding off the right edge — cyan zone
ring, coral Prey dot with a dashed trail, violet Hunters — and the match board as a small dark plate
(`HUNTING · 42:17 · Prey 1/2 · Zone 240 m`). Under it: one deck line, three plain links, and the honest
micro-line. Then the page behaves like a programme: the field, two sides, the four beats of a round, real
screens, the film, the ledger of rules the server keeps, the pass (install), and the honest limits.

Everything in GitHub's Markdown chrome stays quiet and left-aligned: no centred hero text, no badge row at
the top, no emoji, no exclamation marks, no card stack. The loudness is spent once, in the hero, exactly as
the site reference spends it once in its poster.

**Why it is the same team as the site:** it reuses the site redesign's devices one-to-one —
- condensed display type at poster scale and tiny mono machine data,
- a real map as a full-bleed plate (not a decoration or an abstract radar),
- kit tags with the cut corner in team colours,
- hairline rules and a ledger instead of cards,
- honest small print next to every claim,
- the board-chrome: state word, tabular clock, and two live data figures in the corner.

## 3 · Page architecture

```
# ManHunt                                  ← the only H1 (GitHub needs it; the image carries the wordmark)
[hero GIF 1280×560]                       ← THE POSTER: HIDE FROM YOUR FRIENDS. / map plate / board chip
deck line + 3 links + honest micro-line   ← the one screen that has to land the idea
──────────────────────────────────────────
## The map is the field                   ← real capture, full width (or 05-map-wide)
   caption + 4 short notes                ← zone / latest report / trail / clock
## Two sides                              ← kit tags + the two roles in one table
## Four beats, one organiser              ← 01 Room · 02 Sides · 03 Hunt · 04 Result (true sequence)
## In the app                             ← 4 real captures, clickable, captions underneath
## Watch the film                         ← cover + 60 s / 30 s / 15 s / GIF, raw MP4 links
## The rules the server keeps            ← ledger: clock / sides / tags / zone / reconnects / map
## Get on the field                      ← the pass: CTA, 3 install steps, honest small print
## Status and limits                     ← 6 honest items (plain HTTP, test server, trust, zone, emulator, no Play)
<details> Build it, or host it yourself  ← collapsed: self-host commands, CI gates, docs links
footer: wordmark · MIT · OSM credit · “a game, not a safety service”
```

Each moment is one-of-a-kind: one poster, one map plate, one two-sided table, one numbered sequence, one
screen grid, one ledger, one pass. Nothing is a card. Nothing is repeated. The long technical material is
collapsed into `<details>` or linked to `docs/`, so the page can be read top-to-bottom in about a minute
and still be a real repository README.

## 4 · What is carried by images vs Markdown

GitHub sanitises CSS, JS, custom fonts and `<style>`; a distinctive GitHub README is therefore a
**typographic page built in images** with **tight Markdown copy**. Split:

| Carried by built assets (`docs/brand/`) | Carried by Markdown |
|---|---|
| The poster: condensed type, lockup, board chip, map plate, honest micro-line | deck line, links, section titles, prose, tables, ledger, status list |
| Kit tags (Prey / Hunters, cut corner, glyphs) | the two role explanations |
| GitHub social preview card (1280×640) | — |
| Animated hero variant (5 s loop: zone breathing, report pings, marching trail, live dot) | alt text that describes the motion |

Type inside the images is the real brand system — Big Shoulders Display 700, Instrument Sans, Red Hat Mono
(all OFL, from `design/brand/motion-kit/assets/fonts/`), flat colours, no gradients. Markdown text uses
GitHub's own stack, which is the honest limit of the surface; the reading rhythm is set by rules, tables
and the images.

## 5 · Design decisions (and why)

1. **Hero is an image, not centred HTML text.** GitHub cannot render the display face; a poster needs the
   real face. A generated image is the only way to make the opening look like the site — and it is an
   original brand asset (official lockup + brand fonts + OSM-derived map plate, all in-repo).
2. **Animated hero (GIF) rather than static.** GitHub autoplays inline GIFs; the 5 s loop carries coral
   report pings around the real prey marker and a live-dot pulse — subtle motion on real ground, not a
   fake live feed. The static PNG is kept for social/OG and for anyone who needs a still.
3. **Real map, not the radar.** The site reference proved the map is the product's signature. The radar
   belongs to the app's Auth/Home plate; the GitHub page's field section shows the real live hunt.
4. **Real captures only, labelled.** Every app image comes from screenshot-director's premium capture run
   (single emulator, 1080×2400, clean status bar, seeded “Riverside Run” game, real OSM tiles) — no
   mockups, no composited UI, no fake scores. The map plate in the hero is the real capture's map area,
   cropped; the standalone map band is a crop of the same capture.
5. **The dark plate problem.** GitHub READMEs are viewed on white *and* dark backgrounds. Images are
   self-contained dark plates with their own ink ground, so they read as printed plates on either theme;
   the kit tags carry an ink ground for the same reason. The footer wordmark is the one transparent asset:
   it uses GitHub's supported `<picture>` + `prefers-color-scheme` pattern — chalk lockup for dark mode,
   ink lockup for light mode — so it never disappears on a white page. Both previews are rendered
   (`desktop-1012.png`, `desktop-1012-light.png`) to check the page in each mode.
6. **No badges up top.** CI/release/license badges are project chrome, not matchday; they are removed from
   the opening and live as text links in the footer and `<details>`. The information is still one click away.
7. **Numbered markers only for the real sequence** (Room → Sides → Hunt → Result). Everywhere else,
   hairline rules and tables replace numbering.
8. **Honesty next to the claim.** Every CTA has “free APK · Android 8.0+ · not on Play Store” nearby, and
   the status section keeps every limitation of the hosted deployment.

## 6 · Image manifest and current status

| Image | Path | Size | Status |
|---|---|---|---|
| README hero (animated) | `docs/brand/matchday-hero-1280x560.gif` | 1280×560 · 100 frames · 20 fps · 5 s loop · 0.8 MB | **built** — map plate is the real `s07-hunt.png` map area; board reads **41:12 / Prey 2/2 / Zone 240 m**; coral report pings + live-dot pulse |
| README hero (static) | `docs/brand/matchday-hero-1280x560.png` | 1280×560 · 0.3 MB | **built** — social/OG still and fallback |
| GitHub social preview card | `docs/brand/github-social-matchday-1280x640.png` | 1280×640 | **built** — upload as the repo Social preview; same canonical board |
| Prey kit tag | `docs/brand/tag-prey-400x120.png` | 400×120 | **built** |
| Hunters kit tag | `docs/brand/tag-hunters-400x120.png` | 400×120 | **built** |
| **Map band (README field section)** | `docs/brand/matchday-map-band-1080x540.png` | 1080×540 | **built** — derived crop of `s07-hunt.png` (zone ring + fresh/stale markers + trail); harvested by `build-assets.mjs`. The supplied `harvest/map-hero-16x9.png` is tiles-only, so it is not used. |
| Home capture | `docs/screenshots/premium/s03-home.png` | 1080×2400 | **captured — in the README** |
| Lobby capture | `docs/screenshots/premium/s05-lobby-host.png` | 1080×2400 | **captured — in the README** (code **VMJYBU**) |
| Live-hunt capture | `docs/screenshots/premium/s07-hunt.png` | 1080×2400 | **captured — in the README** (clock **41:12**); also the hero/map-band source |
| Result capture | `docs/screenshots/premium/s12-result-hunters.png` | 1080×2400 | **captured — in the README** (full time 18:48, PREY 0/2, “Hunters win.”) |
| More screens (clean) | `s08-hunt-claim`, `s09-tag-target-sheet`, `s11-chat`, `s15-home-light` | 1080×2400 | **captured — in the README** |
| Rejected frames | `s01-auth` (dev URL), `s10-hunt-sheet` (clipped sheet), `s14-settings` (broken slider) | 1080×2400 | **rejected by audit B1–B3 — not referenced**; screenshot-director replaces/removes them |
| Other optionals | `s02-safety`, `s04-home-rtl`, `s06-lobby-player`, `s13-result-prey`, `s16-lobby-rtl`, `s17-empty-chat`, `s18-auth-loading`, `s19-auth-error`, `harvest/` crops, `MANIFEST.json`, `contact-sheet.png` | 1080×2400 / 1080×608 / 1080×1350 | captured / **s02 + s16–s19 still pending** — not used by the README |
| Film cover | `docs/brand/explainer-cover.png` | 1080×1920 (displayed 180) | existing, reused |
| Footer lockup | `docs/brand/lockup-light-on-dark.png` | 1200×328 (displayed 18 high) | existing official lockup |

Approved identity files are **not overwritten**: the existing `docs/brand/readme-hero.gif`,
`docs/brand/github-social-1280x640.png`, `avatar-1024.png` etc. stay in place for the current README and
other surfaces. The matchday assets are new files.

## 7 · Capture dependency and update procedure

The root `README.md` is implemented (2026-11-02) from the premium capture set, including the result capture.
It deliberately contains no broken images or placeholders; captures that arrive later are optional additions,
not gaps.

**When any further captures arrive (safety, RTL, auth states):**

1. Check `docs/screenshots/premium/MANIFEST.json` for the new files (the workstream never writes into
   `docs/screenshots/premium/` — screenshot-director owns that directory).
2. Add an image to `README.draft.md` and to the matching list in `tools/implement-readme.mjs` /
   `PREMIUM` in `tools/verify.mjs` (main grid, “More screens”, or a new row).
3. Re-run the one-command implementation, which rebuilds the hero/social from the real map capture, writes
   `README.md` and runs the final verification:
   `node design/github-redesign/tools/implement-readme.mjs`
4. Re-render the previews and re-check:
   `node design/github-redesign/tools/render.mjs page --page design/github-redesign/preview/readme-preview.html --size 1200x1600 --full-page --out design/github-redesign/preview/desktop-1012.png`
   `node design/github-redesign/tools/verify.mjs --final`
5. Report the added paths to the Lead.

**Fallbacks already handled:** if the derived map band is absent, `implement-readme.mjs` falls back to the
supplied harvest crop, then to the portrait live-hunt capture at 420 px centred. If an optional “More
screens” capture is missing, the whole block is dropped rather than shipped broken.

## 8 · What is removed from the current README

| Current README | New page | Why |
|---|---|---|
| Centred hero `<p align="center">` + centred H1 + 5 badges | left-aligned H1 + poster image + 3 text links | Matchday page opens with a match, not project chrome. |
| “What it is” two-row Prey/Hunters table inline | Two sides section with kit tags | Same information, visual language from the app. |
| “Watch the game” block | Watch the film table | Keeps the film, drops the oversized centred embed. |
| 8-image CI screenshot tables | 4 premium captures, clickable, captioned | Real redesign captures; old CI set stays in `docs/screenshots/` for comparison. |
| 3 install subsections (“quick way”, “from GitHub”, “quick start”) | one Get on the field pass + `<details>` | One conversion path, honest small print. |
| 8-bullet Features list | rules ledger (6 rows) | Features become the rules the server keeps. |
| Self-host section with env table | `<details>` with commands + docs links | Keeps the page short; detail is one click away. |
| Requirements / Repository layout / Development sections | `<details>` + `docs/` links | Contributor detail belongs in docs, not the landing page. |
| Brand & social kit paragraph | footer credit + link | Not a landing-page section. |
| 6-item status list | 6-item status list, tightened | Honesty kept — it is part of the brand. |
| License + OSM credit | footer line | Kept. |

Kept for contributors: CI/release/quality links, architecture/API/testing/deployment/security/runbook
links, CHANGELOG, CONTRIBUTING, LICENSE, OpenStreetMap attribution, the honest “not a safety service” line.

## 9 · GitHub surface constraints handled

- Sanitised HTML: `<table>`, `<tr>`, `<td width>`, `<img>`, `<a>`, `<details>`, `<summary>`, `<sub>`,
  `<br>`, `<strong>`, `<blockquote>` are used; no `<style>`, `style=` attributes, JS, or inline SVG.
- Relative links resolve from the repo root; heading anchors are lowercase-hyphenated (`#watch-the-film`,
  `#status-and-limits`) and match the headings.
- Video links point at `raw.githubusercontent.com/.../v5/*.mp4` (tracked in the repo) rather than large
  embedded media; the GIF is inline but 1.5 MB.
- Images carry explicit `width` so the 1080×2400 portraits do not dominate the column; hero/map use
  `width="100%"`.
- Every image has descriptive alt text; the poster alt describes the board data and the motion.
- OSM attribution appears next to every map image (and the OSM credit is in the footer).
- No claim about Play Store, reviews, player counts, urgency or safety; no fixed hunt length.
- Dark/light: images are self-contained plates; the transparent footer wordmark switches with
  `<picture><source media="(prefers-color-scheme: dark)">`; both modes are rendered and checked.

## 10 · Verification

**Final result: 65/65 checks pass, 0 fail, 0 pending (`node tools/verify.mjs --final`).**

Thumbnail test: the hero and social card were downscaled to 320 px wide and still read — the poster line,
the map plate with the zone/markers, and the board chip are all legible at feed size.

`node design/github-redesign/tools/verify.mjs` checks:

- asset dimensions + GIF metadata (1280×560, 100 frames, 20 fps, 5 s, infinite loop, < 2 MB),
- hero assets were rebuilt from the brand system (official lockup path, OFL fonts, no external asset URLs),
- the hero board carries the canonical **41:12 / Prey 2/2 / Zone 240 m**,
- every image referenced by final `README.md` resolves (draft mode reports premium refs as pending),
- the final README uses only premium app captures — no old CI screenshot set, no placeholders,
- the map section uses the real-capture band (`docs/brand/matchday-map-band-1080x540.png`),
- canonical facts are consistent: clock **41:12** (no 41:14), lobby code **VMJYBU** (no WNWHA3),
  APK **2.4 MB** (no 2.2 MB), and the accurate Prey-visibility claim (no “Prey never see the map”),
- the rejected frames (`s01-auth`, `s10-hunt-sheet`, `s14-settings`) are not referenced,
- every local link target resolves, and heading anchors exist,
- no old slogan, no mojibake, no draft/pending language in the final README,
- Markdown structure: one H1, the eight required sections, alt text on every image,
- the approved identity files were not overwritten (readme hero, social card, avatar, lockups intact).

## 11 · Open constraints / notes for the Lead

1. **Canonical facts (post-audit B4/B5).** The page now uses one value per fact: clock **41:12**, lobby
   code **VMJYBU**, APK **about 2.4 MB**, and the accurate product claim (Hunters see the latest reports;
   Prey see the field, the zone and their own position — never other players’ positions). The hero and
   social card carry the same 41:12 board as the live-hunt capture.
2. **README implemented; new captures are additive.** The full in-app loop is shown, including the result
   capture. Safety/RTL/auth-state captures are still queued; re-run `implement-readme.mjs` after adding
   them to the draft (§7). No page change is needed to ship without them.
3. **Rejected frames are intentionally unreferenced.** `s01-auth` (dev server URL), `s10-hunt-sheet`
   (clipped sheet) and `s14-settings` (broken slider) must be replaced/removed by screenshot-director;
   the README does not depend on them.
4. **Commit dependency.** The implemented README references the premium captures and the new
   `docs/brand/` assets; those files must be committed by the Lead for GitHub to render the page (this
   workstream does not commit).
5. **Map band is a derived crop.** `docs/brand/matchday-map-band-1080x540.png` is a crop of
   `s07-hunt.png` (real capture, zone ring + fresh/stale markers + trail). The hero plate is likewise the
   real capture's map area. Both are documented derived assets in `docs/brand/`.
6. **Copy is provisional.** The page uses “Hide from your friends.” and the app copy family; owner
   approval is pending. The page contains no other marketing claims.
7. **Static numbers.** README says “about 2.4 MB / Android 8.0+”; the install page remains authoritative
   for the current version, size and SHA-256 (README links to it rather than hard-coding a version).
8. **No commits/posts** — files are staged for the Lead.
