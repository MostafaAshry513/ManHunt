# ManHunt site redesign — concept: NIGHT FIXTURE

**Status:** implemented (task-50). Design source of truth for the landing/install page in
`server/src/app.ts`. `tokens.md` is the system; `refs/site-ref.html` is the rendered design
reference; `direction-options.md` records the decision; `audit.md` is the before state; `board.html`
/ `refs/rendered/direction-board.png` is the direction plate.

**Owner brief:** the current install page "is not good enough" — a real redesign, recaptured
screenshots, a premium game site with field-sport/street energy, an asymmetrical editorial hero, real
map/screenshot showcase, strong typography, and fewer generic stacked cards.

---

## 1. The idea in one paragraph

**The site is the matchday programme for a borrowed field.** ManHunt is a pickup sport: the field is
somebody's street or park, the gear is the phones everyone already owns, and the only thing the
project adds is rules that hold — kept server-side, not shouted. So the page is designed like the
printed artefact a pickup game actually uses: **a poster for tonight's fixture, then the programme**
— a field map, the two sides, how a round runs, the rulebook, and a field pass you can install. The
hero is a poster: one enormous slogan over real ground. Below it, the page is an ordered document —
a number in the margin rail, a heading, an editorial composition — not a stack of identical cards.
No photography, no fake screenshots, no stock; the visuals are the real map, real app captures, real
type and the Open Zone identity used as structure.

It is the sibling of the approved app direction **MATCHDAY BOARD** (the phone is the scoreboard/team
sheet/chalked pitch); the site is the board's programme and poster. Both share the same three OFL
faces, palette, hairlines, 2 px radii, team tags and zero elevation, so app captures sit inside the
page without a seam.

---

## 2. Design principles (the five rules that decide every detail)

1. **The slogan and the real map are the two biggest things.** The hero outranks the logo, the nav
   and the CTA. The map is a real Deep-Teal street map with a hunt on it — the product's signature
   surface, not an abstract radar.
2. **Rules are structure, not decoration.** Grouping is done with 1 px hairlines, alignment and
   space. A plate (2 px radius, 1 px edge, zero shadow) exists only where the user *acts* — here,
   only the download pass. Prose never sits in a card.
3. **One loud gesture, then discipline.** The poster headline + map is the only loud moment. Every
   other section is measured type and stillness; motion is one orchestrated page-load in the hero,
   then none.
4. **The brand is assigned, not decorated.** Cyan is the field/referee (CTA, live state, zone) and is
   never a team. Coral is Prey, violet is Hunters, always paired with a glyph and a name. Flat fills,
   no gradients/glows/shadows/glass, radius 2 or 0.
5. **Honesty is layout.** The install path, version, size, SHA-256, server address, Play Protect
   warning, OSM attribution and "not a safety service" line are visible, adjacent to the download,
   not buried. The page never invents a player count, a countdown or a claim.

---

## 3. What it replaces (summary; full diagnosis in `audit.md`)

The shipped page was a competent spec sheet laid out in components: eleven tracked-out all-caps
eyebrow labels, seven stacked card sections, six identical screenshot cards (with test-room
placeholders), no map, a slogan at 46 px beside a 600 px radar, the download buried after 4,000 px of
cards, and one system font for everything. Diagnosis: *a spec sheet with no point of view*. The
redesign keeps every true fact and every safety disclosure, and rebuilds the hierarchy, the type, the
imagery and the conversion moment.

---

## 4. Page architecture — seven moments

```
┌ masthead ────────────────────────────────────────────────────────────────┐ sticky, hairline; drawn lockup · 4 links · outline APK button
├ ① THE POSTER ─────────────────────────────────────────────────────────────┤ full-bleed, asymmetric 6/6 grid
│  [PREY] v [HUNTERS]                         ┌ real night map, bleeds →  │
│  HIDE / FROM YOUR / FRIENDS.                │ zone ring · coral prey   │
│  deck + [Download the APK] + film link      │ violet hunters · trail   │
│  free · v0.15.1 · 2.1 MB · Android 8+       │ board HUD 42:17 · OSM    │
│  ── fixture strip: TONIGHT · One street. One clock. · real stats ───────┤
├ ② THE FIELD (§01) ───────────────────────────────────────────────────────┤
│  rail   "The map is the field."  + deck (right)                          │
│  full-width real-map band + board strip + 4 annotated notes (zone /      │
│  latest report / trail / clock) with connector ticks; on tablet/mobile   │
│  the notes become a ruled legend.                                        │
│  Prey note · Hunters note · the 60-second film (poster frame + link)     │
├ ③ THE ROUND (§02) ───────────────────────────────────────────────────────┤
│  01 ROOM ─ 02 SIDES ─ 03 HUNT ─ 04 RESULT   (ruled strip; true sequence) │
├ ④ THE SCREENS (§03) ─────────────────────────────────────────────────────┤
│  "Built for the street, not a menu." four real captures staggered like   │
│  prints on a contact sheet + ruled aside list; snap-scroll rail ≤640 px  │
├ ⑤ THE RULES (§04) ───────────────────────────────────────────────────────┤
│  "The pitch is borrowed." / "The rules are not." (display-xl quote)      │
│  8-row ledger: clock, teams, tags, map, signal, hosting, language, cost  │
│  privacy & safety: five honest notes in two columns                     │
├ ⑥ THE PASS (§05/06) ─────────────────────────────────────────────────────┤
│  the only plate: "Get on the field." + manifest meta grid + one cyan     │
│  download + SHA-256 + server line + Play Protect warning +              │
│  "Install in four steps"                                                 │
├ ⑦ THE QUESTIONS (§07) ───────────────────────────────────────────────────┤
│  six honest answers as a ruled <details> index                           │
└ footer ───────────────────────────────────────────────────────────────────┘
   lockup · three link columns · MIT · © OpenStreetMap contributors · free APK, not on Play Store · "a game, not a safety service"
```

### 4.1 Hero (the one decisive gesture)

- 12-column grid, content max 1360. Copy on columns 1–6, map plate on 7–12, **bleeding off the right
  viewport edge** and to the bottom of the hero; a 1 px hairline marks the seam.
- Copy stack: team tags (`Prey v Hunters`) → 3-line slogan `clamp(58px, 9.4vw, 140px)`, uppercase,
  line-height .85, each line rising out of an overflow mask once → deck (max 34ch) → primary CTA +
  film link → an honesty data line (free / version / size / Android / not on Play Store).
- Map plate: the **real live-hunt map from the premium capture set** — a 4:5 harvest crop of the
  running app's hunt screen (`harvest/board-clock-4x5.png`, board and map controls cropped away), so
  the ground is genuine OpenStreetMap tiles in the app's Deep Teal palette carrying the app's own
  240 m cyan zone, one fresh coral Prey marker, one stale hollow marker and the coral trail. A board
  HUD (clock 41:12 / LIVE / Prey 2/2 / Zone 240 m) sits top-left; the caption strip says
  **"Illustration — the live map. Latest reports, not the whole truth."** and carries
  `© OpenStreetMap contributors`. The demo state is clearly labelled, never passed off as live data
  — it is a capture of a real seeded game, not a fabricated HUD.
- Fixture strip: `TONIGHT` · "One street. One clock." · aggregate stats (dynamic; a fresh deployment
  shows the MIT licence fact instead of zeroes).

### 4.2 The field band

Full-width (1360) real-map plate (16:9 premium OSM harvest, 1520×690, map controls cropped away) with
a full-width **board strip** across its top (LIVE / 41:12 / Prey 2/2 / Zone 240 m / "Illustration")
and four annotation notes with connector ticks pointing into the map: **Zone**, **Latest report**,
**Trail**, **The clock**. The zone ring and prey markers on the plate mirror the app's map vocabulary
so the annotations point at something real. Each note is one plain sentence of product truth. On
tablet/mobile the absolute notes become a ruled two/four-row legend under the band (nothing is lost).
A caption row carries OSM attribution and "illustration of the hunt screen". This is the page's
field-guide device — used once, so it stays special.

### 4.3 Remaining sections

- **Round strip**: four unequal-focus cells with tick rules; numbers are justified (a real sequence).
- **Screens**: five real premium captures — **hunt (the key showcase, first), home, lobby, chat,
  result** — at different vertical offsets; hairline frames; ruled captions (name + one line); an
  "Everything the round needs" ruled aside below. The result tile is the accepted `s12-result-hunters`
  full-screen frame (FULL TIME, 18:48 played, "Hunters win.", prey 0/2). The renderer builds this list
  from a `SCREENS` array, so adding or reordering captures is one data edit; the rail class follows the
  count (five-up desktop, three-up tablet, snap rail mobile). `s13-result-prey`, settings and the light
  theme are clean but unused by choice. The page never fabricates a screen. Mobile: horizontal snap
  rail at 78 vw with a peek, never a 2,100 px list of equal cards.
- **Rules**: the brand sentence as a two-line pull quote (second line muted), then the ledger —
  label column in mono cyan, title + one sentence per row, 1 px separators, two columns desktop.
  Privacy follows as plain small print with cyan ticks, not a card.
- **Pass**: the only plate on the page. Title, a four-cell manifest grid (version / size / published
  / Android), one primary download (the only other cyan fill), SHA-256 in a mono block, server line,
  hint, Play Protect warning as a ruled note, and the four install steps as a numbered ruled list.
  If no manifest is published: placeholders become em dashes, a "not published yet" note appears and
  the download still works (same contract as before).
- **Questions**: native `<details>`, ruled rows, +/× marker, 72ch measure.
- **Footer**: lockup, "the game / the film / small print" link columns, and the fine print that must
  never leave the page: MIT, OSM attribution, free APK/not on Play Store, "a game, not a safety
  service".

---

## 5. Typography

Three self-hosted OFL faces, the same as the app redesign (see `tokens.md` §1–2):
**Big Shoulders Display 700** for the poster/slogan/section titles/board clock/team words (condensed
athletic grotesque; tabular numerals); **Instrument Sans 400/700** for body, labels, captions and
buttons; **Red Hat Mono 400** only for machine data (version, SHA-256, server, state words, demo
clock data). 51 KB of woff2, same origin, `font-src 'self'`, no remote font requests.

Type rules: sentence case everywhere except the slogan, state words and team names; no tracked-out
all-caps eyebrow labels (the section marker lives in the margin rail); one display moment per block;
no single-word accent inside a headline; tabular numerals on every clock/stat/date/hash; body measure
≤ 68ch; mono only for data.

## 6. Colour, material, motion

- Palette is the product's: field `#0B1220`, plate `#131C2E`, chalk `#E6EDF7`, muted `#A7B6CC`,
  cyan `#22D3EE` (field/referee), coral `#FF7A59` (Prey), violet `#A79BFF` (Hunters), hairlines
  `#2A3550`/`#5E7198`. One cyan fill per viewport; team colour never alone; flat fills only; the only
  texture is 2.4 % asphalt grain over the field (never over text).
- Shape: radius 2 for plates/buttons/tags/frames, 0 for rules and full-bleed surfaces; pills banned;
  no nested plates. Elevation: zero — depth from overlap, hairlines and plate tone.
- Motion: one orchestrated hero load (veil, headline lines, zone draw, trail march, three report
  pings, ~1.4 s total) and nothing else; all CSS; all disabled under `prefers-reduced-motion`, which
  leaves a complete static poster. No scroll-triggered reveals, no parallax, no autoplay.

## 7. Responsive + accessibility

- Desktop >1020 px: 12-col asymmetric layout with the 96 px programme rail and absolute map notes.
- Tablet 641–1020 px: single column; hero stacks (copy → full-bleed map band); annotations become a
  ruled legend; screens 2-up; pass stacks.
- Mobile ≤640 px: 18 px gutters; slogan `clamp(48px, 15vw, 82px)`; band 4:3 full-bleed; screens
  horizontal snap rail; ledger rows stack; pass single column; sticky masthead keeps the lockup and
  the APK button only.
- Accessibility: one h1 per page, ordered h2/h3, skip link, 2 px cyan focus rings with offset, all
  images with alt text, figures with captions that carry attribution, `aria-hidden` on decorative
  board chrome, native `<details>`, reduced-motion complete, contrast AAA for body text on field.
  Verified with zero horizontal overflow, zero clipped text, zero blank images at 1440/820/390
  (Chrome DevTools mobile emulation, DPR 2).

## 8. Written content

Voice from `design/brand/strategy/tone-of-voice.md`: second person, present tense, plain verbs, no
exclamation marks, no fake urgency/numbers, no "safe/secure/private", the honest install path beside
every CTA, "play with people you trust", OSM attribution wherever tiles appear, the plain-HTTP
test-server caveat wherever the URL appears. Slogan: **"Hide from your friends."** (the permanent
line chosen for a trust-critical page — the flagship hook stays in social/video). CTA: **"Download
the APK"** (names the action and the object). The strongest line on the page is the brand idea, not a
claim: *"The pitch is borrowed. The rules are not."*

## 9. Implementation map (where everything lives)

| What | Where |
|---|---|
| Page renderer (inlined CSS + markup + dynamic data) | `server/src/app.ts` → `renderInstallPage()` — **generated**, do not hand-edit |
| Design source of truth (standalone HTML) | `design/site-redesign/refs/site-ref.html` |
| Regenerate the renderer from the reference | `design/site-redesign/tools/build-page.mjs` |
| Real map plates (hero: live-hunt 4:5 harvest crop; band: 16:9 OSM harvest crop; WebP + JPEG) | `design/site-redesign/tools/optimize-assets.ps1` → `server/public/site/map-*.webp` |
| Generated Deep-Teal OSM plates (fallback/provenance only) | `design/site-redesign/tools/make-map.ps1` (superseded by the premium harvest) |
| Subset OFL woff2 fonts | `design/site-redesign/tools/build-fonts.ps1` → `server/public/site/*.woff2` |
| Page-size premium captures + film cover (WebP + JPEG) | `design/site-redesign/tools/optimize-assets.ps1` → `server/public/site/shot-*.webp` |
| Screens list (data-driven, currently hunt / home / lobby; result pending) | `SCREENS` in the generated `renderInstallPage()` (edit `tools/build-page.mjs`) |
| Screenshot/overflow/console verification | `design/site-redesign/tools/capture.mjs` → `design/site-redesign/shots/` |
| Media allowlist + `font-src 'self'` CSP | `server/src/app.ts` (route section) |
| Tests for the new page | `server/test/install-page.test.ts` |
| Direction plate | `design/site-redesign/board.html` → `refs/rendered/direction-board.png` |

**Preserved contracts:** dynamic version/size/SHA-256/published date/server address/download href from
the update manifest on every request; no-manifest fallback; `/join` invite page (unchanged);
`/app.apk`; `/api/app/latest`; health; `/media/*` allowlist; CSP `default-src 'none'` (+ `img-src
'self' data:`, + `font-src 'self'`); no scripts; no remote assets.
