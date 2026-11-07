# Direction E — Still Night

**One line:** the hunt as a quiet field object — graphite chrome, a field chart that is the
only bright thing on the screen (a dark chart with luminous traces at night, printed paper in
daylight), one figure, one accent, and a minute ruler you can read at a glance.

**Themes:** Night (default graphite), Dusk (blue hour, cooler and a step less black) and
Daylight (brand chalk, the same drawing as printed paper). Theme tokens, per-theme map
treatment and proofs are in §4 and §5.

Designed with the **unslop** skill by Damir Sokolovsky ([@heydamir](https://x.com/heydamir)),
<https://github.com/heydamir/unslop>, CC BY 4.0. The audit, direction and pass order follow the
skill; the screens, copy and visuals are original work for ManHunt. Credit is repeated in
`direction.css` and in the PR body. A copy of the skill text was read at
`/tmp/unslop/skills/unslop/` (SKILL.md, signs.md, tokens.md, visuals.md, refs.md, effects.md);
no image-generation tool was available, so the direction's one rich visual is built in code
(SVG + CSS), which the skill explicitly allows for app screens.

Static design direction: 390×844 dp, rendered at 3× = 1170×2532 px by the shared
`design/ui-v2/env` renderer. 14 canonical pages + 3 state studies, same coverage as A–D,
plus 2 theme proofs (Dusk home, Daylight live hunt) once the theme system was added.

---

## 1. The audit — where slop lives today

unslop asks for every sign with where it lives. Audited: the shipped MATCHDAY screens
(`docs/screenshots/premium/`, real emulator captures of v0.16) and Directions A–D as delivered
in `design/ui-v2/directions/`. This is a craft read, not a taste read: A–D are deliberate,
reviewed systems, but they still show several of the skill's listed signs. Nothing below is
about the current app being bad; it is what a redline pass would say to any of them.

### 1.1 The shipped app (MATCHDAY board)

| Sign (from `references/signs.md`) | Where it lives |
| --- | --- |
| Uppercase, tracked micro-labels everywhere | `LIVE`, `ZONE 240 m`, `PREY 2 / 2`, `PROPOSAL`, `FULL TIME`, share/chat/tabs labels; nine of the ten states are announced in caps |
| Accent spread over chrome | cyan is on the primary button, the tab underline, the LIVE dot, the zone ring, every icon, the logo mark and the progress line — it stops meaning "this one action" |
| Decoration standing in for content | the home screen's radar-ring illustration over a generic grid; it says "tactical" rather than showing the game's own field |
| Component noise | six separate 1-char boxes for a room code; icon-only nav buttons in a top bar and a duplicate lower tab row |
| Uniform containers | every block is the same 12–16 px card on the same surface; grouping is done by boxes, not by spacing or rules |
| Machine voice | helper text written as instructions in the imperative ("Enter the 6-character invite code the host sends you.") while screen labels are noun phrases; mixed register |
| Status bar chrome baked into the design | screenshots include OS status-bar space, so the design never owns the full frame |
| What is *not* wrong | no purple/blue gradients, no emoji labels, no glass, no glowing pills, no gradient text, no fake badges. The app is not the skill's worst case — it is a decent dark utility UI that is generically "gamey" |

### 1.2 Direction A — Matchday, raised

Strengths: hierarchy, one system, buildable. Signs: ALL-CAPS tracked labels on every eyebrow
and row (`INVITE CODE`, `HOST`, `READY`, `TRAILS`); display weight 700 on a 44–64 px ladder so
nearly every screen has two or three equally loud things; cyan on primary buttons *and* every
figure *and* rules *and* focus; the chalk-line/board metaphor repeated on every page, so no
single moment is the memory. It is loud by construction — a stadium scoreboard — which is a
legitimate choice, but it is the opposite of "quiet chrome, one bright element".

### 1.3 Direction B — Street signal

Strengths: strongest identity in A–D. Signs: saturated coral/violet/cyan fields competing for
the same surface (the skill's "every element highlighted"); rotated stamps, tape and posters as
decoration on multiple screens (the visual does not carry information on the settings/result
rows); caps with wide tracking on stamps and labels; copy occasionally shouts one word per
line for rhythm rather than meaning. The print/poster language is coherent — but the richness is
spread across chrome, borders and label treatments rather than concentrated in one content
moment, which is exactly the skill's central diagnosis.

### 1.4 Direction C — Field instrument

Strengths: the calmest, most state-complete, best accessibility. Signs: mono caps labels on
almost every value (`PREY 2/2`, `ZONE 240 m`, `FULL TIME`, `RECENT`, `TRAILS`); near-total
reliance on one family + one weight in many places, so hierarchy is carried by letter-spacing
and caps rules; every block is a readout box, giving the "uniform containers" tell; the whole
screen is low-contrast text on dark, which is quiet but also means nothing is the bright
element. C already moved toward unslop's "quiet chrome" — E's job is to finish that move and
give the quiet something to be quiet around.

### 1.5 Direction D — Open Channel (this workstream, PR #5)

Strengths: distinct social register, state studies. Signs: radio-dial caps, `LIVE/PAUSED/FULL
TIME` state words in caps, several accents (cyan + amber lamp + coral/violet teams) plus a warm
lamp glow-ish frame; call lamps, tally marks and meters as recurring chrome decoration; copy is
sentence case in the body but the machine voice creeps back in the readouts. It is a themed
system rather than a content-first one — the theme carries the screens.

### 1.6 What all of A–D share (template look, per `signs.md`)

- Dark-first navy/black, white text, one saturated accent on the primary button. Swap the
  wordmark and A–D could belong to a tactical, cycling or airsoft app. That is the "template
  look" the skill warns about after the passes.
- Uppercase tracked labels as the default label style, in all four.
- The map is the only visual, but it is always dark and abstract; none of A–D shows the field as
  a *made object* with material (paper, ink, contour), and none shows a hunt artifact.
- Every screen carries the same density; no screen lets a single content moment breathe.
- All four use a display face at 700 for headings — the skill's type table asks for 400–500.

### 1.7 What the audit says to do

Keep: the brand (Open Zone mark, wordmark, cyan/coral/violet semantics), the page set, the
honesty rules. Change: surfaces go neutral graphite; labels go sentence case; the display weight
drops to 400; one accent only in chrome; the richness concentrates into one bright content
object per screen; the typography carries hierarchy through size and colour instead of caps and
tracking; and the system gets one signature detail you can describe in a sentence.

---

## 2. The five-line direction (unslop's format, derived from the product)

- **Product.** A real-world game of hide-and-seek on the streets and in the parks at night, for
  a small group of friends: one room code, two sides, a shared clock, and reports of where the
  Prey were last seen.
- **Character.** *Still, exact, faintly mischievous.* Nothing shouts; the game is the fun.
  The tone of a friend who has already checked the route and is not going to make a thing of it.
- **World.** The hour before you go out: a **paper map and a graphite pencil on the kitchen
  table**, streetlight through the window. The app is the paper object on that table, not the
  streetlight. Surfaces are graphite (pencil lead, unlit asphalt); the map is chalk-white paper
  with print inks; type is plain-spoken.
- **Moments.** Two, and only two, carry the colour and craft: **(1) the field plate** — a drawn
  map of the seeded area with real street names, a cyan zone ring, coral/violet position marks
  and a dashed report trail. It is the single bright thing on every screen that has one: at
  Night and Dusk it is a dark chart (deeper than the chrome) lit only by those traces; in
  Daylight the identical drawing is printed on white paper with darker print inks. **(2) the
  clock** — one Big Shoulders figure at 64 px, the only display type on the screen, with the
  minute ruler under it.
- **Signature.** **The minute ruler.** A 1 px hairline of 60 ticks under the clock, where the
  minutes still to play are inked and the minutes already played are hairline. It appears on
  the lobby (hunt length), both live hunt screens, full time and the history summary — always
  the same measurement, always readable at a glance. It is the one detail only this game would
  have.

**What unslop adds, in one sentence:** A–D designed *systems*; E designs *one object* — the
plate — and lets everything else on the screen be quiet, plain-spoken graphite, so the maps,
the clock and the report trail are the only things allowed to be beautiful.

Naming: "Still Night" is the product's world in two words (the quiet of a night game before
anything happens). Folder `e-still-night`.

---

## 3. The passes (in the skill's order)

**Pass 1 — Spacing.** One 4 px grid for the whole direction. Screen gutter 24, section rhythm
22–24, row rhythm 44/46, control heights 44–48, plate gaps 10–12. Related items use 2–8; groups
use 12–24; no arbitrary numbers. Every page was asserted against the 390×844 canvas by a fit
audit rather than by eye (`/tmp/egen/fit.mjs`, no scroll height > 844).

**Pass 2 — Colour (signs.md §Surfaces and color).** Purple/blue gradients, glows, gradient text,
emoji, glass and pills were already absent in A–D; the actual over-use was accent spread and
multi-colour chrome. In E: every surface is the graphite ramp (#131416 / #191a1d / #232529);
text has three roles; hairlines are primary text at 8%; **cyan is the only accent** and appears
only as (a) the one live-state dot, (b) the zone ring inside the plate, (c) the selection
indicator — a few percent of the screen. Coral and violet are **semantic only**: Prey and
Hunters, used as 6–7 px dots in lists and as the print inks inside the plate. Primary buttons
are off-white from the ramp, not the accent, so the accent never becomes "the button colour".
The plate is the direction's one bright element: since the owner review it is a **dark chart**
in the night themes — the plate surface sits deeper than the page, and the only light on it is
the cyan zone ring, the coral/violet marks and the map labels — and **printed paper** in
Daylight. Nothing else in the chrome changed.

**Pass 3 — Icons.** One line set, 16–18 px, 1.5 stroke, currentColor, 6–8 px gap to label.
Icons appear only where they carry meaning (back, copy, download, send, close); the top bar
uses text actions ("Settings", "Field log", "Edit rules") instead of icon-only buttons, and the
bottom of every screen has at most one filled action. No emoji, no filled/branded icon soup.

**Pass 4 — Copy.** Sentence case everywhere, including states and buttons: "Live", "Paused",
"Full time", "Hunters win", "Tag prey", "Begin the hunt" (A–D used `LIVE`, `PAUSED`, `FULL TIME`
in caps as a style). Labels are noun phrases, helpers are short sentences: "Leave it empty and
the room is called ManHunt." Numbers are real and consistent with the seeded hunt (Riverside
Run, K7M2QX, 41:12 of 60:00, 5 players, tags 18:48). No exclamation marks, no "New ✨", no
invented counts, no fabricated next-report countdown. Headlines and labels end without periods
(unslop pass 4), which deliberately differs from the shipped app's `Hunters win.` — that is a
copy-direction call for E only.

**Pass 5 — Type.** Families stay real-brand: Instrument Sans for the interface (400/500 only),
Big Shoulders 400 for the one display figure and the two landing headlines, Red Hat Mono 400
for machine data at 11–13 px. Weights drop from 700 to 400/500; caps and tracking are gone
except for genuine codes (mono, positive tracking on `K7M2QX`) and Arabic (no tracking at all).
Hierarchy comes from size, colour and space: 64 figure / 44 headline / 28 page title / 15 body
/ 13 label / 12 mono meta / 10–11 legal. The old uppercase-eyebrow ladder is replaced by a
13 px sentence-case section label plus a mono right-hand meta.

**Pass 6 — Layout.** A–D built dense boards; E builds one quiet column with a strict reading
order: chrome (56) → statement → plate → the one action. The plate is always the largest single
element; the clock block is the second; nothing else is allowed to grow. Repeated rows are a
single 44–46 px line with a hairline (players, reports, settings, history), never stacks of
equal cards. The only two panes are the overlays (tag claim, hunt rules), because the product
needs a decision sheet and an edit sheet. The live hunt screens let the plate fill all space
between the clock and the dock, so the map is genuinely the screen.

**Pass 7 — Details.** Hairlines are one weight and never decorative. Radii: 4–6 tags/keycaps,
8–10 rows/buttons/inputs, 12–14 plates, 16 sheets; nested radius follows outer − padding.
Numbers are tabular in every mono context; the clock and the minute ruler share alignment.
Dividers stop at content, not at the page edge. The room code is the only wide-tracked text.
Status is text plus a 6 px dot, never a pill. The map's attribution is a quiet footer band
inside the plate (legal and honest), not floating chrome over the artwork.

**Pass 8 — Visuals.** No image tool was connected; the skill's rule for app screens is that
dashboards rarely need a generated image, and their moments come from the product. E's moment
is drawn in code: an original SVG of the seeded area (Riverside Park / Riverside Dr / W 103–109
St / Broadway / Hudson) with building blocks, roads, park, print-ink labels, a cyan zone ring,
coral Prey marks (fresh solid ring, stale dashed), a violet Hunter mark, a dashed report trail,
your own cyan ring, a north arrow and a 100 m note. It is labelled "not a live track" and the
attribution band credits OpenStreetMap contributors — the geometry is drawn, not tiles copied.
The plate is the same drawing in every theme; at Night and Dusk it is a dark chart (deeper
than the chrome, with luminous traces), and in Daylight it reads as a printed map on white
paper. See §4 for the per-theme plate tokens and §5 for the proofs.

**Pass 9 — Motion (specified, not animated in static renders).** One easing curve
`cubic-bezier(0.22,1,0.36,1)`; 120–180 ms for press/toggle, 300–400 ms for sheets; entrances
rise 6–8 px and fade once; no loops, no parallax, no pulsing live dot, no animated gradients.
The minute ruler is the only element that can animate: its fill interpolates on each tick
(transform/width on a clipped layer, one curve). The plate is static; map markers appear once
when a report lands, then hold.

---

## 4. Tokens and components

**Graphite ramp, dark (primary).** Page `#131416`, deep `#0e0f11`, surface `#191a1d`, raised
`#232529`; text `#eef0f3` / `#a6abb4` / `#7c828c`; hairlines 8% and 14% of text; primary
`#eef0f3` with `#16181b` label. Accent `#22d3ee` (brand cyan, rare); semantic Prey `#ff7a59`,
Hunters `#a79bff`, positive `#4cc38a`, negative `#e5484d`.

**Light proof.** Brand chalk `#f7f9fc` page, white surface, `#eef2f8` raised, `#111827` /
`#4b5565` / `#6b7487` text, darkened accents `#0c6b84` / `#b33a0f` / `#5b21b6`; the plate
becomes white paper with the same print inks. No cream or beige anywhere.

**Theme system.** Three complete palettes, not filters. Same tokens, same components; only the
values move:

| Token role | Night (default) | Dusk | Daylight |
| --- | --- | --- | --- |
| page / deep | `#131416` / `#0e0f11` | `#121722` / `#0d111a` | `#f7f9fc` / `#eef2f7` |
| surface / raised | `#191a1d` / `#232529` | `#181e2a` / `#222a38` | `#ffffff` / `#eef2f8` |
| text / secondary / muted | `#eef0f3` / `#a6abb4` / `#7c828c` | `#e9edf4` / `#a7b0c2` / `#7b8497` | `#111827` / `#4b5565` / `#6b7487` |
| accent | `#22d3ee` | `#22d3ee` | `#0c6b84` |
| Prey / Hunter | `#ff7a59` / `#a79bff` | `#ff8364` / `#b3a6ff` | `#b33a0f` / `#5b21b6` |
| primary button | off-white `#eef0f3` | off-white `#e9edf4` | ink `#111827` |

Night is the primary theme (a night game); Dusk is the blue hour variant for people who want
a cooler, slightly lighter dark; Daylight is the brand-chalk reading theme. The settings theme
picker shows all three with a material swatch (background · plate · accent) and marks the
active one with a check; no theme is invented per screen.

**Plate treatment per theme.** The plate is the same drawing in all three themes, with
different materials and inks:

| Plate token | Night | Dusk | Daylight |
| --- | --- | --- | --- |
| paper (plate surface) | `#0a0c0e` | `#0e141f` | `#ffffff` |
| blocks / block accents | `#14181c` / `#1b2126` | `#1a2230` / `#222c3d` | `#eef2f7` / `#e4eaf1` |
| roads / road edges | `#1d242a` / `#293138` | `#232e40` / `#303d52` | `#fbfcfd` / `#dfe6ee` |
| park / water | `#121a14` / `#0d151d` | `#152219` / `#0f1a27` | `#e9f0e7` / `#e8f0f6` |
| map labels | `#7b8590` | `#8390a6` | `#6b7280` |
| zone ring / Prey / Hunter | `#22d3ee` / `#ff7a59` / `#a79bff` | `#22d3ee` / `#ff8364` / `#b3a6ff` | `#0c6b84` / `#c2410c` / `#5b21b6` |
| zone fill opacity | 10% | 10% | 6% |

In the night themes the plate is a dark chart: its surface is deeper than the page so it still
reads as one recessed object, the road grid is a step lighter than the blocks, and the
luminous traces (cyan ring, coral/violet marks, the dashed trail, your own cyan ring) are the
only bright marks on the screen. Marker halos use the plate surface colour so map labels stay
legible on both dark and paper. In Daylight the same drawing is printed on white paper with the
darker print inks. Legibility was checked on the renders: map labels and the attribution band
stay ≥ 4.5:1 against their plate surface in all three themes; the plate is never the only place
a safe interaction happens (all controls are on the chrome).

**Legacy light token names.** `data-theme="light"` remains the Daylight theme; Night is
`data-theme="dark"` (aliased as `night`) so existing pages and proofs keep working. `home-light`
is kept as the canonical Daylight proof page name; the new theme proofs are `home-dusk` and
`hunt-hunter-light`.

**Type.** Instrument Sans 400/500; Big Shoulders 400 for the single display figure (64/60,
40/38 for the small figure) and two 44 px headlines; Red Hat Mono 400 for all machine data
(11–13 px); IBM Plex Sans Arabic for Arabic. Scale: 64 · 44 · 28 · 15 · 13 · 12 · 11 · 10.

**Components.** Top bar (56, wordmark or back+title, one quiet text action); buttons (primary
off-white 48, secondary raised 48, quiet text); fields (label 13 + 44 control + hairline, mono
hint); rows (44–46 + hairline); roster row (dot + name + optional tag + mono status); minute
ruler; segmented control (40); stepper (40); switch (40×24, text On/Off beside it); theme picker
(40 px rows with background/plate/accent swatch and a check); field plate
(14 radius, footer attribution band); report row; team final table; history row; bottom dock
(status row + one filled action); overlay sheet (16 radius, handle, quiet head, title 24, note
box, stacked actions); banners for paused/offline/tagged.

**Signature.** `.scale` — 60 ticks, `repeating-linear-gradient` at 1 px pitch, base ticks at
35% ink, fill ticks at full ink, width set inline (68.7% for 41:12 left, 31.3% for 18:48
played), labels 0 and 60 min. It is one component used consistently, never decoration.

---

## 5. Pages (19: 14 canonical + 3 states + 2 theme proofs)

Canonical 14: `auth`, `roles`, `home`, `lobby`, `hunt-hunter`, `hunt-prey`, `chat`, `result`,
`history`, `settings`, `sheet-tag-claim`, `sheet-room-settings`, `lobby-rtl`, `home-light`.
State studies 3: `paused`, `tagged`, `offline`. Theme proofs 2: `home-dusk` (Dusk home) and
`hunt-hunter-light` (Daylight live hunt, printed-paper plate).

| Page | Intent | The moment |
| --- | --- | --- |
| auth | One device, one callsign; no email, no third-party promise. Quiet form with the product's world above it. | The 150 px plate: a corner of the field, the zone, your own ring. |
| roles | Explain two sides and the real modes (Classic playable, Single Prey / Shrinking Zone planned) without a poster. | The side rows plus a 108 px field strip as a legend. |
| home | The two actions, named for what they do; sample hunt name and an honest empty room code. | 180 px plate ("Tonight's field") with a Prey mark, a trail and your ring. |
| lobby | Room code, who is here, the rules as a quiet table, one way to begin. | The plate (zone ring, you) + the minute ruler reading the 60 min hunt. |
| hunt-hunter | The clock, the zone, the latest reports, one tag action. | Full-height plate: fresh Nadia (12 s), stale Rana (14 min), the trail, and your ring; minute ruler under 41:12. |
| hunt-prey | Same clock, own position only, the cadence made explicit, a waiting claim. | The plate with only your ring; "5 min" cadence figure; claim banner. |
| chat | A transmission log, not a messenger: fixed time gutter, team dots, system lines between. | Typographic: the log itself is the visual, own messages marked "You". |
| result | The loud word is the winner, not the duration; final positions; no fake rematch. | "Hunters win" at 64 px + the plate of final positions + the ruler at 18:48. |
| history | Past hunts grouped by date, one summary with its own final-positions plate. | The 128 px plate in the summary; mono data lines. |
| settings | An app screen that does not need a visual: appearance, language, permissions, update, account. | The theme/type preview line; no chrome shouting. |
| sheet-tag-claim | The one decision that must be explicit in the product. | The plate stays visible behind the scrim; sheet gives confirm and dispute equal weight, with the consequence in a quiet note box. |
| sheet-room-settings | Host edits, server-enforced, plainly. | Steppers + segmented mode + the zone centre as a real coordinate line. |
| lobby-rtl | Arabic proof of the same lobby, mirrored, with logical properties and LTR codes. | Same plate and ruler, mirrored layout, no letter-spacing on Arabic. |
| home-light | Daylight proof on the brand chalk ground (same page as home). | The plate reads as a printed map on a white desk; the chrome is chalk and ink. |
| home-dusk | Dusk proof of the same home page. | Cool blue-hour chrome with the dark chart a step deeper still. |
| hunt-hunter-light | Daylight proof of the busiest screen, to prove the system in the reading theme. | The printed-paper plate and ink clock under a chalk page; button flips to ink-on-white. |
| paused | The clock is stopped, tagging is off, the host can resume. | Muted figure + dashed zone ring; frozen positions as dotted markers. |
| tagged | The Prey's hunt is over; they spectate, chat stays open. | Dashed ring + faded own position; the alert banner does the state work. |
| offline | Show the last state, say it may be stale, disable tagging. | Alert banner + muted figure + dotted "last known" reports. |

Every rendered page was checked visually and by the fit/geometry scripts; text over a paper
plate only appears inside the plate's own annotations (tiny mono, print ink), never as UI text
floating on the artwork.

---

## 6. i18n and a11y

- Logical CSS properties throughout (`padding-inline`, `inset-inline`, `margin-inline-start`);
  RTL is the same components, not a second layout; the back chevron is mirrored, the code and
  numbers are isolated with `.mh-ltr`; map attribution is `dir="ltr"`.
- Type follows a 4-step minimum: body 15 (min 13 for secondary), meta mono 12, legal 10–11,
  section labels 13; nothing below 10.5 except map annotations (cartographic, inside the
  artwork) and the plate legal line.
- Contrast: primary/secondary text on graphite ≥ 7:1 / ≥ 5:1; accent used for a dot and a
  ring, not for body text; map inks ≥ 4.5:1 against their plate surface for text in all three
  themes; line work is ≥ 1.5 px strokes; primary button labels are ink on off-white (Night/
  Dusk) or white on ink (Daylight), ≥ 12:1. The theme picker has a textual label for every
  option (name + description) so it is not colour-only; the active row carries a check, a
  raised surface and a hairline.
- Targets: every control ≥ 44 px; icon buttons 44×44 hit area; stepper keys 40×40 inside a
  44 px row; rows are 44–46; no hover-only affordances.
- Focus order follows DOM reading order; the two sheets are described as dialogs (`role` in
  static HTML; Compose maps to ModalBottomSheet semantics). The plate has a text alternative
  (`aria-label`) describing the field, the zone and the reports; the map note repeats the
  honesty statement in text.
- Arabic: MSA, sentence case, no letter-spacing/uppercase, numbers inside `.mh-ltr` where the
  string mixes a code or a ratio; names and roles use the app's existing vocabulary. The Arabic
  copy in this direction is provisional (see limits).

---

## 7. Compose feasibility

- The system maps to the shipped Compose stack: plate = Canvas/SVG-like drawing in a Box
  (path + text), minute ruler = Canvas or a clipped Row of ticks, clock = Text with the Big
  Shoulders font, sheets = ModalBottomSheet, segmented/stepper/switch = existing M3 components
  restyled with tokens, lists = LazyColumn rows with 1 px dividers.
- The plate needs one custom composable (`FieldPlate`) with parameters: crop, zone, marks,
  trail, labels. The data it draws is the same model the app already has (positions, ages,
  trails); no new server contract. The drawn map is a stand-in for real tiles: at
  implementation time it should be replaced by the existing map provider (OSM raster) with the
  same print overlay (zone ring, marks, trail) and the same paper/ink styling — the direction's
  contract is "one bright paper object", not "hand-drawn tiles".
- No new permissions, no new endpoints, no gameplay changes. Rematch stays a labelled proposal.
- Fonts are the project's existing OFL brand fonts (no new faces); the three themes are three
  plain token sets (Color values + the plate ink set) selected by a `ThemeMode` enum
  (Night / Dusk / Daylight; "follow system" is a product decision), applied above the theme
  like the app's existing dark/light switch; RTL is covered by Compose's layout direction.

---

## 8. Deliberate choices, and limits

- **The plate is drawn, not live.** Every page says "not a live track" and the plate credits
  OpenStreetMap contributors. Real tiles are an implementation concern (A–D carry the same
  note). This is a design-direction limitation, stated rather than hidden. In the dark themes
  the implementation will need a dark map style (or a styled overlay/tint on the existing
  raster tiles) that keeps roads a step lighter than blocks, as in the drawing.
- **Theme proofs are extras, not canonical pages.** The contact sheet renders the 14 canonical
  pages; `home-dusk` and `hunt-hunter-light` are theme proofs carried as extra pages (the sheet
  header counts them with the state studies, and they appear in the matrix and strips). The
  canonical page set stays at 14 so coverage comparisons with A–D remain exact.
- **Three themes are design intent, not a full theming audit.** Night/Dusk/Daylight are
  complete token sets and the key pages are proven, but A–D (and the shipped app) remain
  single-theme; E does not retro-fit themes onto the other directions.
- **Uppercase is gone by design.** E writes states as "Live", "Paused", "Full time". That is
  the unslop copy pass applied to the whole direction; the shipped app's state vocabulary stays
  in caps for A–D. If the owner prefers the app's capitalised state words, this is a mechanical
  change that does not affect layout.
- **Copy deviations for the pass:** headlines/labels end without periods ("Hunters win"); the
  rules line for joining a room is short and specific rather than the shipped instruction
  sentence. These are direction-level copy decisions, not app copy changes.
- **Arabic is provisional.** New strings introduced by this direction and still needing review:
  مطاردة النهر (Riverside Run), الردهة/الملعب، رمز الغرفة، نسخ، اللاعبون، مستعد،
  المضيف · أنت، قواعد الغرفة، تعديل القواعد، مدة المطاردة، مهلة البداية، البلاغات،
  المنطقة، المسارات، سياسة الوسم، تأكيد، الجميع مستعد، تراجع، ابدأ المطاردة.
  Existing app translations are reused where they exist; "مستعد" follows the app's ready word.
  RTL proofs should get a native review of bidi order (numbers/slash strings) before shipping.
- **No motion in the repo.** The renders are static; the motion spec is in pass 9. A story
  video was not produced (no Playwright/ffmpeg render pipeline for a static direction here).
- **E's extra state ids are unique** (`paused`, `tagged`, `offline`) so the shared matrix and
  strip pack can include A/B/C/E without duplicate rows. A/B/C sources and renders are
  untouched.
- **No app code changes.** Nothing under `android/` or `server/` was touched.

---

## 9. Verification

- 19/19 pages rendered by `design/ui-v2/env/render.mjs` at exactly 1170×2532 px, no overflow
  warnings from the renderer (14 canonical + 3 state studies + 2 theme proofs).
- Fit audit (`/tmp/egen/fit.mjs`, per-element, every page): no content below the 390×844 fold,
  every stage asserted; contact sheet regenerated from these renders.
- Geometry audit (`/tmp/egen/audit.mjs`): no clipped visible text, no content outside the
  canvas, no control-column drift, no interactive collisions. The only flagged line-box
  intersections are font-metric overlaps between the state line and the display figure on hunt
  screens (line boxes overlap by 4–8 px, no ink collision); verified visually.
- Theme checks: every page rendered in its intended theme; the dark and dusk plates were
  checked for label/attribution contrast, block-vs-road separation and halo legibility; the
  Daylight pages were checked for paper-vs-chrome separation. Settings was re-fit after the
  theme picker replaced the old two-option segmented control.
- A/B/C untouched; only the shared pack (contact sheet, matrix, strips, gallery) is regenerated
  to include the fourth direction.

Regenerate: `node design/ui-v2/env/render.mjs design/ui-v2/directions/e-still-night`,
`node design/ui-v2/env/contact-sheet.mjs --only e-still-night`,
`node design/ui-v2/env/contact-sheet.mjs --matrix --strips --gallery`.
