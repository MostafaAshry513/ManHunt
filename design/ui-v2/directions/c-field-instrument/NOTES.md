# Direction C — “Field instrument”

**Owner:** designer-c · **Status:** round-2 delivered — 14 canonical pages + 3 state studies rendered at 1170×2532, contact sheet rebuilt · branch `design/ui-v2`
**Read with:** `briefs/00-workstream.md`, `briefs/01-directions.md`, `briefs/02-evaluation.md`,
`skills/DESIGN_PLAYBOOK.md`, `skills/PAGE_INVENTORY.md`, `skills/TOKENS.md`, `skills/COMPONENTS.md`,
`skills/REVIEW_RUBRIC.md`, `design/redesign/{direction,tokens,audit}.md`,
`docs/BRAND_BRIEF.md`, `design/brand/strategy/tone-of-voice.md`, `env/README.md`.

**Delivery at a glance:** `directions/c-field-instrument/{auth,roles,home,lobby,hunt-hunter,hunt-prey,chat,result,
history,settings,sheet-tag-claim,sheet-room-settings,lobby-rtl,home-light}.html` → `out/*.png` (all exactly
1170×2532) → contact sheet `out/contact-sheet.png` (env tool copy at `env/out/sheets/c-field-instrument.png`).
All numbers below are real seed values; maps are **original drawn field charts**, not OSM tiles (see §8.r).

---

## 0. Thesis (one paragraph)

The phone is a **field instrument for a chase**: an orienteering compass, a hiking GPS and a surveyor's
notebook built into one dark, calm device — not a dashboard, not a command console. It is **map-first**:
the field chart is the product surface, and every other piece of information is a **readout attached to a
calibrated edge**, not a card floating on a page. The direction's one non-obvious idea is **“show the error
bars”**: ManHunt's map is *latest reports*, not live tracking, so the interface never shows a position
without showing **when it was measured and how good the fix was** — fresh and stale reports look different,
every prey marker carries its age (`12 s`, `14 min`), accuracy is drawn as a ring, and the clock is a
measured readout rather than a slogan. Precision here means *honesty about uncertainty*, which is also what
keeps a location game with friends from looking like surveillance equipment. The human warmth is not
decoration either: the organiser's hand shows up as a hand-scored chalk mark and one **paper field note** at
the two emotional beats (full time, tag claim), where the copy is plain, first-name, and kind. Target
feeling: *the same app you'd trust on a night path with cold hands — quiet, exact, and on your side.*

**One-sentence memory test:** *a dark field chart, a cyan time readout with a ruler under it, and a paper
note pinned on the results page.*

---

## 1. What the phone is in this direction (and how it differs from MATCHDAY)

Direction C is not a reskin of MATCHDAY. It is the other answer to "what is the phone while the game is
happening": MATCHDAY is the organiser's **board** (a plate you hold up); C is the player's **instrument**
(a device you read while moving). The consequences, expressed as system rules:

| System question | C's answer |
|---|---|
| Where does information live? | **Attached to the chart and to calibrated bands**, not stacked in containers. Data rows sit on the field ground with hairline rules; no card stack. |
| What is the loudest object? | The **time readout** (mono, tabular, 46 dp) on game pages; the permanent line (display face) on first-contact pages. |
| What is the primary action? | A **chalk block** — a physical button (64 dp) in the bottom dock. Cyan is *not* spent on buttons; it is spent on measurement. |
| How is the board represented? | A **readout band** (`Bezel` → `ReadoutBand` → `Dock`): state word + clock + right-hand data columns + a progress ruler. It is instrumentation, not a scoreboard strip. |
| How are teams shown? | As **chits and a manifest**: a 3 dp team bar + glyph + sentence-case name + count; roster rows are ruled manifest lines with readiness ticks. |
| What is the depth language? | **Tonal steps + hairlines + calibrated ticks + scrim.** No elevation, no shadows, no glass, no gradients. One panel surface exists (`--panel`) for inputs/sheets, not for grouping. |
| What does motion mean? | **An instrument settling:** value hard-cuts, scale markers slide, a new report pings once, a zone draws. No perpetual animation, no radar sweep, no shimmer. |

**Deviations from the shipped MATCHDAY recognition set, with reasons** (the brief for C explicitly asks for
"HUD-style overlays, mono data, hairline/tonal depth, the board as a heads-up readout"):

1. **Mono is the primary data voice, Big Shoulders is the human voice.** In A, the clock is display type and
   the product's voice is the board. In C the clock is an instrument reading (Red Hat Mono, tabular); Big
   Shoulders is reserved for the one declaration a page makes ("Hunters win.", "Hide from your friends.") and
   page titles. *Why:* an instrument's numbers are not slogans; keeping the display face for human lines makes
   the warm moments land harder.
2. **Cyan is measurement, chalk is action.** Cyan is used for the clock, zone ring, invite code, live dot,
   scale marker and focus. The primary action is a chalk-filled block. *Why:* one filled cyan surface per
   screen would force the same button hierarchy as A; C's semantics keep cyan strictly on the reading side of
   the instrument. This is a deliberate reweighting, not a loss of the fixed role (cyan still = field/rule/time).
3. **The team sheet becomes a manifest; the kit tag becomes a chit.** Same information, a different object:
   the roster is a list of names with readiness measurements, aligned to the same left rule as every readout.
   *Why:* a manifest is what a field organiser actually reads; it also survives Arabic expansion better.
4. **No Board strip on non-game pages.** Home, auth, roles, settings, history, chat lead with the **bezel**
   (identity + local time) and content on the chart ground; the ink readout band only appears where there is
   live instrument data. *Why:* the board is an instrument face; it should not become a header skin.
5. **A paper object is allowed.** The `FieldNote` (warm off-white card, hand-scored mark) is the single
   non-instrument material in the system and appears only on result and tag claim. *Why:* the brief's risk for
   this direction is coldness; one physical, human object is a stronger answer than warmer colours everywhere.

Kept from the fixed identity and the shipped product (non-negotiable): the Open Zone mark and drawn wordmark
geometry, the three OFL faces, palette semantics, no gradients/glow/shadow, 48 dp targets, existing copy and
safety text verbatim, OSM attribution, real data only, honest install/server lines.

---

## 2. Player tests this direction is designed to pass

| Test | C's answer |
|---|---|
| **Squint test** (blurred, name state + time + next action) | Readout band: state word + 46 dp clock + progress ruler; dock: one 64 dp chalk block with a 17 dp label. Nothing else carries that contrast. |
| **Thumb test** (390×844, primary in bottom 40 %) | Primary action always in `Dock` (bottom 112–140 dp). Nothing essential top-right; secondary actions are 48 dp text actions in the dock. |
| **Night test** (arm's length, dark adaptation) | Dark-first `#0B1220`/`#060B14`; no white fields except the small paper note; text floors 12 dp (labels) / 13 dp (data) / 15 dp (body); contrast 7.5–15.9:1 for text. Cyan readings are bright but small; the dock is chalk-on-dark. |
| **Thumbnail/scoreboard test** (30 % scale) | Recognisable by the chart + cyan readout + ruled bands: no other direction has a map-derived hierarchy on every game page. |
| **Mirror test** | Logical properties everywhere; charts/compass/wordmark do not mirror; numerals/codes in LTR isolates; Arabic labels use the Arabic face, no tracking. |
| **Daylight test** | Light = daylight chalk, with the readout band still ink (the instrument face is physical); paper note unchanged. |

---

## 3. The system

### 3.1 Colour

Brand roles survive; C reweights *where the heat sits*. All text pairs below are measured (WCAG relative
luminance, script in `/tmp` during design; re-check on implementation).

**Dark (primary)**

| Token | Value | Role | Contrast |
|---|---|---|---|
| `ground` | `#0B1220` | page/field ground (brand field) | — |
| `void` | `#060B14` | bezel + readout bands (one step below ground) | chalk 16.9:1 |
| `panel` | `#0E1828` | only surface for inputs, sheets, FieldNote backing shadow? (no shadow — tonal step) | chalk 14.2:1 |
| `raised` | `#142136` | focused input / pressed segment | chalk 12.4:1 |
| `chalk` | `#E6EDF7` | primary text, rules, dock button fill | 15.9:1 on ground |
| `mute` | `#A9B8CC` | secondary data, prose secondary | 9.3:1 |
| `dim` | `#90A6C0` | 12 dp machine labels (min 7:1) | 7.5:1 |
| `hair` | `rgba(230,237,247,.14)` | structural rules, ticks, map grid | non-text |
| `hairStrong` | `rgba(230,237,247,.30)` | interactive borders (≥3:1 boundary) | 3.8:1 |
| `cyan` | `#22D3EE` | **measurement only:** clock, zone, code, live dot, focus, scale marker | 10.4:1 |
| `coral` | `#FF7A59` | Prey only (markers, chits, trail, prey state) | 7.3:1 |
| `violet` | `#A79BFF` | Hunters only | 7.8:1 |
| `error` | `#FF8A8A` | destructive/error only; never a team | 8.3:1 |
| `paper` | `#F2F3EE` + ink `#0B1220` | FieldNote only (result, tag claim) | 16.8:1 |

**Light (proof + system notes)**

| Token | Value | Role | Contrast |
|---|---|---|---|
| `ground` | `#F7F9FC` | daylight chalk ground | ink 16.9:1 |
| `panel` | `#FFFFFF` | inputs/sheets | — |
| `raised` | `#E6ECF5` | selected/input | — |
| `ink` | `#0F172A` | primary text | 16.9:1 |
| `mute` | `#475569` | secondary text (also used at 12 dp: 7.2:1) | 7.2:1 |
| `hair` | `rgba(15,23,42,.14)` | rules | non-text |
| `hairStrong` | `rgba(15,23,42,.30)` | interactive borders | 3.2:1 |
| `cyan` | `#0C6B84` | measurement | 5.8:1 |
| `coral` | `#B33A0F` | Prey | 5.6:1 |
| `violet` | `#5B21B6` | Hunters | 8.5:1 |
| `readout band` | ink `#0B1220` + chalk | **always ink in both themes** (C's equivalent of “the Board stays ink”) | 15.9:1 |

**Rules**
1. Cyan is never a filled action surface. Cyan is a *reading*: time value, zone ring, invite code, live dot,
   2 dp focus rule, scale progress marker, selected-measurement underline. One cyan reading is "hot" per
   page; everything else is chalk/mute/dim.
2. Team colour is never the only cue: always glyph + sentence-case name + colour (chit, marker, manifest).
3. The single paper object is not a second theme: it is one physical note, off-white, ink text, hand-scored
   mark. Never used for prose blocks or empty space.
4. Error is never coral and never a team colour.
5. No gradient, glow, blur, glass, shadow. Scrim = `#060B14` at 68 % (sheets) / 45 % (maps behind sheets).

### 3.2 Typography

Faces (bundled OFL only): **Big Shoulders** (700) = human declarations, page titles, the permanent line;
**Red Hat Mono** (400/700) = every instrument reading, machine label, code, timestamp, age, unit;
**Instrument Sans** (400/700) = prose, buttons, names, sheet copy. Arabic = device Arabic sans (no tracking,
larger size, more leading); digits stay Latin tabular.

| Token | Size/line | Face | Use |
|---|---|---|---|
| `clock` | 46/46, tnum, +0.01 em | Mono 700 | hunt countdown, full-time played time |
| `reading.l` | 26/28, tnum | Mono 700 | invite code, final score `0 / 2`, sheet timer values |
| `reading.m` | 18/22, tnum | Mono 700 | zone radius, counts, stepper values |
| `data` | 13/18, +0.02 em | Mono 400 | ages, timestamps, coordinates, version, footer |
| `label` | 12/16, +0.14 em, uppercase | Mono 400 | machine labels only: `REMAINING`, `ZONE`, `LAST REPORT`, `HOST`, `YOU`, `STALE` |
| `display.xl` | 56/52, −0.01 em | Display 700 | winner word, first-run permanent line |
| `display.l` | 36/34, −0.005 em | Display 700 | page titles (“Past hunts.”, auth line, sheet heroes) |
| `display.m` | 26/28 | Display 700 | section declarations (“Hunt rules”, room name on lobby) |
| `title` | 17/22 | Sans 700 | names, room name in bezel, row titles |
| `body` | 15/22 | Sans 400 | prose, messages, form values |
| `button` | 17/20 | Sans 700 | dock primary labels |
| `caption` | 13/19 | Sans 400 | helpers, consequence copy, footer |
| `arabic.*` | +4–6 sp vs Latin role, 0 tracking | Arabic sans | same roles; display never uses Big Shoulders |

**Floors:** no text below 12 dp anywhere; 12 dp only for mono machine labels at ≥7:1; body never below 15 dp;
buttons never icon-only for a game action; labels scale 1:1 with system text size, display at half-rate capped
1.25×. All numerals tabular (`font-feature-settings:"tnum"`). The clock never eases or animates digits.

### 3.3 Layout, canvas and the calibrated grid

- Canvas 390 × 844 dp, **24 dp outer margin** (`--gutter`), 4 dp base scale (4/8/12/16/24/32/40/56/64).
- **Three horizontal zones** on every page: `Bezel` (64 dp identity bar, void), optional `ReadoutBand`
  (96 dp ink band with state + values), content (field), `Dock` (112–140 dp, bottom). The dock is always the
  last thing; nothing scrolls under it.
- **Chart ground** on content pages: transparent SVG/CSS hairline grid every 8 dp (2 % chalk) and 40 dp
  (4.5 % chalk), plus registration ticks at the 24 dp margin corners on charts. It is the "paper" the
  instrument is plotted on; never over text at more than 4.5 %.
- **Edge rulers**: on chart and summary areas, horizontal/vertical tick rulers (8 dp minor / 40 dp major,
  1 px `hair`), with mono labels at the ends (e.g. `0`, `240 m`). These are the direction's structural motif
  and replace decorative dividers.
- Content is **left-aligned to the 24 dp rule** (mirrors to right in RTL). Centred only for: dock status lines,
  empty-state short text, sheet grab rule.
- On-map overlays: labels sit on the map with a 78 % void label plate + 1 px hair, 12 dp mono; map controls are
  48 dp square glyph buttons in a hairline column at the edge; OSM credit always visible at 12 dp.

### 3.4 Material and depth

No elevation tokens exist. Depth is: `void` → `ground` → `panel` → `raised` tonal steps, 1 px hairlines, tick
marks, and scrim. Only **inputs, sheets and the paper note** get a surface; prose, rows, bands, charts and
grouping never do. Sheets are chart drawers: full width, 2 dp top radius, 1 px `hairStrong` top rule, 40×4 dp
grab rule, title + mono meta, content scrolls **inside**, dock pinned.

### 3.5 Component grammar

| Component | What it is | Rules / metrics |
|---|---|---|
| `Bezel` | 64 dp identity bar, `void`, 1 px `hair` bottom | horizontal lockup 200 dp wide (brand min respected); right: local time `data` + `Settings` label+glyph 48 dp; subpages: back glyph 48 dp + mono breadcrumb + mark 20 dp |
| `ReadoutBand` | ink instrument face, 96 dp (grows with font scale) | left: state word (`LIVE`/`HEAD START`/`PAUSED`/`FULL TIME`/`LOBBY`) + room name `title`; centre-left: clock `clock` + label `REMAINING`/`PLAYED`; right column: up to two readouts (`ZONE 240 m`, `PREY 2 / 2`); bottom: **progress ruler** 2 dp with tick marks + cyan marker (only when duration is known). Always ink in both themes. |
| `Reading` | label + value + unit (+ optional age) | label `label` dim above; value mono tabular; unit `data` dim after value; hairline baseline optional; columns separated by 1 px vertical `hair` |
| `Scale` | 1 px ruler with ticks + optional marker/labels | 8 dp minor, 40 dp major; cyan 2 dp marker for a live value (time remaining, report age) |
| `Chit` | team identity mark | 3 dp team-colour bar + team glyph 14 + sentence-case name `title`(13–15) + optional count mono; not a pill, not a plate |
| `Manifest` | ruled roster | team header (chit + 2 dp team rule + count `reading.m`), 56 dp rows: index `data` dim, name `title`, readiness check glyph or `HOST`/`YOU` data labels, 1 px hairline between; collective readiness `5 / 5 READY` in the header |
| `RuleLabel` | section divider | 1 px `hair` rule + mono label at left + optional data at right; **no 01/02/03 decoration** |
| `FieldButton` | the action | primary: 64 dp, 2 dp radius, `chalk` fill, ink label `button` (light: ink fill, chalk label); secondary: 56 dp, 1 px `hairStrong`, chalk label; destructive: 1 px `error` + `error` label; disabled = label 38 % and no fill change; loading = 3 pulsing ticks + label change (never a spinner) |
| `CodeCells` | 6 invite-code cells | 48 × 56 dp, 8 dp gap, `panel`, 1 px `hairStrong`; value mono 24 700, LTR isolate; focus = 2 dp cyan bottom rule + caret (no cyan fill); paste/share actions 48 dp |
| `Input` | ruled field | label `label` above; 56 dp ruled line (1 px `hairStrong`), value `body`; focus = 2 dp cyan bottom rule; error = error hairlines + `caption` message; no rounded box, no floating label |
| `Stepper` | instrument value control | 48 dp − / + square glyph buttons, 1 px `hairStrong`; value `reading.m` centred; min label below optional; long-press repeat noted in Compose notes |
| `Rocker` | 2–4 option segmented control | 48 dp tall, 1 px frame; selected = `chalk` fill + ink label + check glyph (light: ink fill); never a colour-only selection |
| `Marker` | map symbol | Prey fresh: 2 px coral ring + 6 dp dot, label `NAME · 12 s`; stale: 45 % coral dashed ring + hollow dot + label `NAME · 14 min · STALE`; Prey tagged: chalk 30 % ring + cross tick; self: chalk dot + 2 px chalk ring + 4 cyan survey ticks; accuracy: 1 px dashed coral circle (radius from `accuracy`); no crosshair/reticle anywhere |
| `ReportStrip` | honesty strip above dock | 1 px hairline top; rows or columns per prey: chit glyph + name + age + accuracy; age > interval = `STALE` annotation; used on hunt-hunter only |
| `FieldNote` | the human object | paper `#F2F3EE`, ink text, 1 px ink rule, 2 dp radius, 2 dp rotation (−0.6°), 16–20 dp padding; one hand-scored SVG mark (ink) max; used on result + tag claim only |
| `Sheet` | chart drawer | bottom sheet over scrim, 2 dp top radius, panel, top hairline, grab rule; title `display.m` + mono meta; dock pinned; max 76 % height, scroll inside |
| `Strip` | state/error/offline/notice | full width, 1 px rule top+bottom, 40–48 dp, glyph + `caption` message + 48 dp inline action; error = `error` rule + text; offline = `STALE`-style mono label + disabled actions; never a rounded banner card |
| `Empty` | designed absence | 1 px rule + mono label + one sentence + one inline action; no centred icon square, no spinner |
| `Loading` | instrument calibrating | three 12×2 dp chalk ticks pulsing (1.2 s, one-shot feel), sentence says what is loading; no spinner |

### 3.6 Icon language — “instrument marks”

Original 24 × 24 vector set, 1.75–2 dp butt-cap strokes, no rounded joins, no filled icons except dots:
`zone` (open ring), `prey` (dot in open ring), `hunters` (three converging chevrons), `trail` (polyline with
three nodes), `ping` (dot + one expanding arc), `tag` (ring touching dot), `clock` (ring + tick marks, no hands
— a gauge), `code` (six cells), `roster` (three tally strokes), `log` (bracket + rule), `settings` (three
slide rules), `history` (stacked rules + clock tick), `update` (arrow down onto rule), `share` (two plates +
link), `location` (dot + open ring + tick), `back`/`close`/`check`/`plus`/`minus`/`send` (same grammar).
The mark and wordmark are **never** used as icons. Map controls may be glyph-only as a platform convention
(48 dp, content descriptions) — every *game* action keeps a text label.

### 3.7 Motion intent

Instrument settling, not animation. Tokens: `readout 120 ms` (value hard-cut), `tick 80 ms` (press),
`scale 300 ms linear` (marker slide on minute boundaries only), `draw 400–500 ms linear` (zone ring, trail),
`report 600 ms one-shot` (spring? no — one expanding ring, then still), `sheet 240 ms
cubic-bezier(.16,1,.3,1)`, `exit 160 ms`. No springs/overshoot, no stagger, no shimmer, no looping radar
sweep, no perpetual pulsing dot. Reduced motion: all durations 0, final frame rendered immediately. Haptics:
tag claim arrival (two beats), tag confirm, ready toggle.

### 3.8 Map / chart illustration rules (honesty)

The HTML mocks use an **original drawn field chart** (water, park, street grid, paths, zone) as the stand-in
for the real osmdroid map; no OSM tiles, no invented place/street labels, no fake coordinates. The zone ring,
accuracy rings, trails and report markers are drawn from the seed's real values. `© OpenStreetMap
contributors` is always rendered because the implemented screen uses OSM tiles. In Compose the same layout
uses the existing `MatchMap` (osmdroid, Deep Teal filter); the chart-grid, rulers and markers are Compose
`Canvas`/overlays, not new map engine work.

### 3.9 Copy

Inherits `tone-of-voice.md` and the playbook copy rules (no exclamation marks, sentence case, action names the
object, honest claims, no dev strings). C adds:
- **Instrument labels are machine labels** (`REMAINING`, `ZONE`, `LAST REPORT`, `STALE`, `HOST`) — the only
  uppercase the system allows besides state words and the invite code.
- **Every page has exactly one plain human sentence**, in Instrument Sans, near the action or the reading it
  explains. It is where warmth lives: “Prey report every 5 minutes. The map shows the latest report, not a
  live track.” / “Everyone's ready. Begin when you are.” / “Omar says he tagged you.”
- **No tactical vocabulary:** no target, contact, asset, subject, hostile, scan, sweep, signature, coordinates
  in primary UI (only inside the rules sheet as editable fields, which the app already has).
- **No fake precision:** ages are real (`receivedAt`), accuracy is real (`accuracy`), never “±3 m” invented;
  the invite code is the only code.
- Arabic: reuse `Localization.kt` strings exactly; new strings flagged `[NEW COPY — needs Arabic review]` in
  this file (§9) and never machine-translated into the page unmarked.

### 3.10 States system

Same vocabulary everywhere: `Strip` (notice/error/offline/permission), `Loading` (calibrating ticks + what is
loading), `Empty` (rule + sentence + inline action), `ReadoutBand` state word + tick for `PAUSED`/`HEAD
START`/`FULL TIME`/`CANCELLED`, `Marker` stale/eliminated treatment, `Tagged` = spectating notice in the
prey dock + chalk-dim self marker. Canonical pages embed the state the inventory requires (fresh + stale
report, report cadence, update available, claim countdown); the remaining states are specified here and shown
in the review-response round if reviewers want frames: paused, head start, eliminated/spectating, offline
(reconnecting strip + disabled dock + last-known ages preserved), auth validation/loading/server error,
lobby blockers, empty chat, result cancelled, history loading/error/empty, settings download progress.

### 3.11 RTL and light

**RTL (`lobby-rtl` proof):** genuinely mirrored chrome (bezel, readout band columns, manifest reading order,
dock, rules, back glyph), **not** mirrored: map/chart, compass N, Open Zone mark, wordmark, numerals, code.
Numerals/codes wrapped LTR; no `·` in Arabic; no tracking in Arabic; Arabic labels from the app dictionary,
plus `[NEW COPY]` items listed in §9. Arabic is set in the Arabic system face (like the app's Naskh fallback)
at +4–6 sp / +6–8 leading with no tracking; the mono data face is used only for Latin digits.
**Light (`home-light` proof):** same composition and hierarchy; ground `#F7F9FC`, ink type, white panels,
darker measurement colours; **the readout band stays ink** (instrument face) exactly as A keeps the Board
ink; the paper note is unchanged. No cream/serif, no pure black, no white flash.

---

## 4. Per-page intent (14 pages)

Format: **gesture** — composition — data — states shown — key decisions.

1. **`auth` — “Calibration.”** The Open Zone mark scaled into a **calibration dial** (ring + 72 ticks +
   coral dot in the gap + survey brackets), the permanent line under it, then a quiet ruled form.
   *Composition:* bezel → dial (200 dp) → “Hide from your friends.” (`display.l`, two lines, hand-scored
   underline) → Username / Password ruled inputs → `Sign in` chalk block → “New here? Create an account”
   inline → rule + server disclosure row (`GAME SERVER · 74.208.99.178`, `Change server`, `Test connection`)
   → footer `v0.16.1 · Free APK · Android 8+ · Not on Google Play`.
   *Data/state:* empty form, valid helper states; server row demoted (never above the action); no dev host in
   the primary UI (test deployment line stays honest).
   *Decisions:* the dial is the brand's one illustration and makes auth the only page where the mark is the
   hero; form fields are ruled lines, not boxes; the primary is chalk — the first sign that cyan is not a
   button here.
2. **`roles` — “Field guide.”** A drawn zone diagram with the two sides annotated, then the side briefs, then
   a mode catalogue that is honest about what is playable today.
   *Composition:* bezel (back + `ROLES`) → `display.l` “Two teams. One block. One clock.” → zone diagram
   (coral prey dot in the ring gap, violet hunter chevrons outside, ticks, scale bar) → side briefs (Prey /
   Hunters chits + 2 sentences each, copy from the app) → `RuleLabel MODES` → Classic hunt row (`PLAYABLE`
   cyan tick) / Single Prey + Shrinking Zone rows (`PLANNED`, honest copy) → safety strip (“ManHunt is a game,
   not a safety service. Play with people you trust.”) → dock `Let's play`.
   *States:* first run (accept + permission explanation) vs re-read (`Close`); planned modes honest, no dead
   end (they show “Play Classic instead” inline).
   *Decisions:* treats the page as the game's field guide, not a brochure; the three safety claims are quoted
   from the approved copy, never invented.
3. **`home` — “Start panel.”** The two verbs are two calibrated sections on the chart ground; the primary
   (host) is a chalk block in the dock, the join is a six-cell code instrument above it.
   *Composition:* bezel (lockup, `21:04`, `Settings`) → permanent line (`display.l`) with hand-scored
   underline → **status band** (`LOCATION ON` · `GPS ±6 m` · `NO HUNT RUNNING` — real states) →
   `JOIN A HUNT` rule + code cells (focused state) + helper + outline `Join the hunt` → `HOST A HUNT` rule +
   Hunt name input (`Riverside Run`) → dock: `Create the hunt` chalk block + identity line
   (`PLAYING AS OMAR · SIGN OUT · v0.16.1`).
   *States:* default signed-in; disabled join with adjacent reason; focus state on the code; light proof
   (`home-light`); offline strip specified (dock disabled + strip).
   *Decisions:* host is the primary but join is not hidden; the status band makes "is my phone ready?" a
   glance, and it is real data (permission/accuracy/room) rather than decoration.
4. **`lobby` — “Briefing plate.”** The room is briefed before the hunt: a zone chart, the code as a serial
   number, and the manifest of who is here.
   *Composition:* bezel (back, lockup small, mark) → ink room header: state `LOBBY` + room name (host = **Omar**, HOST · YOU)
   `display.m` + `5 / 5 READY` → **start chart** (240 dp: drawn zone ring, centre survey mark, scale
   `240 m`, `CLASSIC HUNT` readout) → the code row (`CODE K7M2QX` mono 26 + `Send the code` 48 dp action) →
   `TEAM MANIFEST` rule + Prey/Hunters columns (2 Up: chit + 2 dp team rule + count, 56 dp rows with `HOST`
   on Nadia and readiness checks) → rules readout line (`60 MIN · HEAD START 5 MIN · REPORTS 5 MIN ·
   TRAILS ON`) with `Edit rules` 48 dp → dock: status “Everyone's ready.” + `Begin the hunt` chalk block +
   inline `Ready ✓`/`Stand down` for the host.
   *States:* host, everyone ready (canonical); blockers variant specified (status line adjacent to Begin);
   code copied notice strip; room load/error specified.
   *Decisions:* the zone chart is a schematic drawn from room settings (no location permission needed —
   cheaper than a live map) and gives the lobby a "briefing" identity no other direction has; the code is
   the page's single cyan reading.
5. **`hunt-hunter` — “The instrument.”** Full-bleed field chart under an ink readout band; the reports are
   the data, the age is the truth.
   *Composition:* ink `ReadoutBand` (LIVE + clock 41:12 + `ZONE 240 m` + `PREY 2 / 2` + progress ruler) →
   chart with zone (4-arc scored ring, cyan 80 %), self survey mark (chalk dot + cyan ticks), Nadia fresh
   marker (coral ring+dot, label `NADIA · 12 s`, accuracy ring ±6 m, coral trail 5 points), Rana stale marker
   (dashed 45 % ring, hollow dot, `RANA · 14 min · STALE`), north arrow + edge ticks, map controls column →
   `ReportStrip` (“Latest reports, not a live track” + `NADIA 12 s ±6 m` / `RANA 14 min · STALE`) + OSM credit
   → dock: `Tag a prey` 64 dp chalk block + `Trails on` / `Field log` / `Hunt rules` 48 dp text actions.
   *States:* live + fresh + stale (canonical); paused (band `PAUSED`, clock stopped, no Tag), head start
   (`Prey are hiding. Hunting starts in 05:00`, no Tag), no reports yet, offline/reconnecting (ages keep
   counting, Tag disabled + strip), claim banner (specified).
   *Decisions:* the age/accuracy data replaces the usual HUD chips — it is the product's honesty rule made
   visual; the progress ruler makes "how much hunt is left" readable without parsing the clock; the Tag action
   is the only chalk block and sits in the thumb zone.
6. **`hunt-prey` — “Own reading.”** Same instrument, but it only knows you: the chart is centred on your own
   survey mark; the dock reports your sharing cadence.
   *Composition:* ink band (`LIVE`, 41:12, `ZONE 240 m`; no prey count) → chart (own mark + accuracy ring,
   zone ring, no other prey markers, no trails) → `ReportStrip` (`REPORTING EVERY 5 MIN` · `LAST SENT 12 s`
   · `NEXT 04:48`) → dock: status `Sharing your position` + `Hunters see your latest report.` + text actions
   (`Field log`, `Hunt rules`). No tag action (correct per rules).
   *States:* sharing (canonical); head start; GPS/permission denied; paused; eliminated/spectating (status line
   verbatim from the app + chalk-dim mark + no sharing); claim overlay (next page).
   *Decisions:* "next report in" is a **client-derived countdown** (from `locationIntervalSec` + `receivedAt`)
   — flagged in §7 as small client work, no server change; if rejected, the strip falls back to
   `LAST SENT HH:mm` only.
7. **`chat` — “Field log.”** The room's log as a ruled record, not a messenger.
   *Composition:* bezel (back, `FIELD LOG`, `6 ENTRIES`) → log rows: time mono in a 44 dp gutter with a
   vertical hairline, sender chit (team colour + name), body 15 dp; own rows marked with a 2 dp chalk bar;
   system events as a full-width strip (`MATCH STARTED` mono label + sentence) → composer dock: ruled input
   (`Message`) + 72 dp `Send` chalk block; offline strip specified.
   *Data:* 6 real entries across 20:45–20:52 (system: match started / head start over / tag claim; Nadia,
   Omar, Selim, Rana lines), all consistent with the seed.
   *States:* populated (canonical); empty (`No messages yet. Say hello.` + action), sending, send failure
   (draft kept), load older, offline.
   *Decisions:* the vertical gutter rule + index-free time column is the log's instrument structure; system
   events get the same rule grammar as the app's phases.
8. **`result` — “Match record.”** The game's payoff as a record card: instrument readings up top, then the
   **paper field note** with the human line, then the final manifests and actions.
   *Composition:* ink band (`FULL TIME`, played 18:48, `PREY 0 / 2`, `HUNTERS`) → `Hunters win.`
   (`display.xl`) → time ruler (0–60 min scale, played segment chalk, remaining 41:12 dashed, finish marker)
   → **FieldNote** (paper): `RIVERSIDE RUN · SAT 4 NOV`, human line “Both Prey tagged. That's the run.”,
   hand-scored circle around `18:48`, note “Same crew next week?” (app voice; not a promise) → final manifest
   (Prey rows with `TAGGED`, Hunters rows) → dock: `Rematch` chalk block (**design proposal — flagged**),
   `Back to lobby` outline, `View hunt history` inline.
   *Data:* winner Hunters, played 18:48, prey 0/2, duration 60:00, teams as seed. Honest degradation: if a
   count is unknown, omit the score line rather than fake it.
   *States:* Hunters win (canonical); prey win 2/2 honest; cancelled; result-sync loading; map unavailable
   (no fake street drawing — the ruler replaces the fake trail map).
   *Decisions:* the paper note + hand-scored time is the direction's warm moment; the time ruler is a real
   instrument (it shows played vs planned from two real timestamps) instead of the shipped decorative field
   plate.
9. **`history` — “Logbook.”** Past hunts as a ruled log with one opened match summary.
   *Composition:* bezel (back, `HUNT HISTORY`) → `display.l` “Past hunts.” + readout `3 HUNTS` → date rule
   labels + rows (start time mono 64 dp gutter, room name, winner chit, duration `18:48`) → selected row
   expanded into a ruled summary block (date, duration, winner, team rosters — only real fields; no invented
   tags/score) → dock: back/inline.
   *Data:* 4 fictional-but-consistent entries (3 completed, 1 cancelled) including the just-played Wed 4 Nov
   match; all fields from `MatchHistoryEntry` only (no per-match prey-remaining).
   *States:* populated + one summary (canonical); loading skeleton bars (no shimmer); error strip with retry
   (never masquerade as empty); empty.
   *Decisions:* the expanded summary is a ruled readout block, not a card; rows use the same time gutter as
   the field log so the two pages feel like pages of one notebook.
10. **`settings` — “Calibration manual.”** Every setting is a calibration row; the page is a manual with rules,
    not tabs of cards.
    *Composition:* bezel (back, `SETTINGS`) → sections (`DISPLAY`, `LANGUAGE`, `FIELD PERMISSIONS`,
    `UPDATES`, `SERVER`, `ACCOUNT`) each as `RuleLabel` + rows: Theme `Rocker` (Dark selected / Daylight),
    Text size `Stepper` (− 100 % +) + live preview line, Language `Rocker` (English / العربية), Location
    `ALLOWED` readout + `Manage`, Notifications `OFF` + `Turn on`, Installed `v0.16.1` + `Check for updates`
    + last checked mono, Update strip (`Update available · 0.17.0 · 2.1 MB` + `Download` — real fields),
    Server read-only URL + `Test connection` + honest plain-HTTP line, Account `OMAR` + `Sign out` (error
    colour) → footer `Free APK · Android 8+ · not on Google Play` + OFL licence line.
    *States:* default; update available (required); notification off; location allowed; signing out;
    download progress specified; RTL/light notes.
    *Decisions:* kill the 5 icon-only tabs — a single ruled manual with labelled sections and a 48 dp target
    per row; theme/text-size/language get visible values, not just switches; the server row stays read-only
    (change on Auth) exactly as shipped.
11. **`sheet-tag-claim` — “The tag.”** The only physical verb in the game gets a decision surface with a
    countdown and a human sentence; the hunt is dimmed behind it.
    *Composition:* dimmed hunt-prey behind (48 % scrim, band still visible) → sheet: mono meta
    `TAG CLAIM · 20:58 · ANSWER IN 01:12`, `display.m` “Omar says he tagged you.” → claim readout row
    (hunter chit, time, “physically touched” phrasing verbatim) → **FieldNote** consequence card: “If he
    touched you, say yes and you're out. If not, dispute it — the Huntmaster decides.” + hand-scored tick →
    dock: `Confirm the tag` chalk block + `Dispute` outline + `Answering lets you spectate with the field log.`
    *States:* incoming claim (canonical); busy/confirming; error + retry (sheet stays); dismissed → persistent
    banner specified; disputed (huntmaster) variant specified.
    *Decisions:* countdown is real (`expiresAt`), the "when" is real (`createdAt` — a small honest addition
    the shipped sheet does not render); consequence is stated before the tap; confirm is primary because the
    game expects honesty, dispute is a full-size outline not a link.
12. **`sheet-room-settings` — “Hunt rules.”** The host calibrates the hunt on the same ruled rows as settings,
    over the dimmed lobby.
    *Composition:* dimmed lobby → sheet `HUNT RULES` + `Applies to the next hunt. Rules are enforced by the
    server.` → `TIMING`: head start 5 min, duration 60 min, report interval 5 min (`Stepper` rows) →
    `PLAY AREA`: `Rocker` Open/Zone (Zone selected), Zone radius 240 m stepper, Zone centre `Riverside Park`
    + `Pick on map` 48 dp + `Use my location` → `TRAILS`: switch row (on) → `TAG POLICY` readout row:
    “Tags need the Prey to confirm.” (server-enforced; **UI is new, enum undocumented — flagged**) →
    `ZONE SHRINK`: off toggle + sub-readouts Every 10 min / By 25 m (disabled) → dock: `Save rules` chalk
    block + `Cancel`.
    *States:* zone expanded, seed values (canonical); open-area variant; validation error strips; saving;
    saved notice; zone centre not set; RTL (inputs, coordinates LTR) / light notes.
    *Decisions:* values are steppers (instrument calibration) instead of free-text dialogs, with the manual
    coordinate fields kept as a fallback row (the app has them); the sheet is scrollable inside with a pinned
    save dock.
13. **`lobby-rtl` — the same briefing plate mirrored.** Arabic host lobby, code and numerals LTR, all five
    players with Arabic-script names (fictional), genuine mirroring of band columns, manifest order, rules,
    dock and back glyph. Existing Arabic strings from `i18n/Localization.kt`; new strings listed in §9.
    Proves: no clipped Arabic, no tracking, code readable in place, primary action at the mirrored thumb.
14. **`home-light` — the same start panel in daylight chalk.** Identical structure, seed, copy and actions;
    light tokens; the **readout band stays ink**; the primary becomes an ink block with chalk label; hairlines
    and grid go ink at 14 %; the permanent line and status band keep their hierarchy. Proves the system is one
    identity in two lights, not two designs.

---

## 5. Seed scenario (identical on every page)

| Field | Value |
|---|---|
| Room / hunt | **Riverside Run** |
| Invite code | **K7M2QX** (LTR isolate everywhere) |
| Players (5 = 3 Hunters / 2 Prey) | **Hunters:** Omar (**host/huntmaster**, device identity on home/lobby/hunt-hunter/settings), Selim, Youssef. **Prey:** Nadia, Rana (Nadia receives the canonical tag claim — prey-side view). |
| Rules | Classic · head start 5 min · duration 60 min · report interval 5 min · trails on · zone mode, 240 m radius, centre Riverside Park · shrink off · tag policy confirm |
| Live state | phase `hunting` (LIVE), **41:12 remaining** = 18:48 played of 60:00; 2/2 prey alive at the moment of the hunt pages |
| Reports | Nadia: fresh, **12 s** old, accuracy **±6 m**, trail 5 points; Rana: **stale, 14 min**, ±22 m, no trail (drawn per the app's stale rule, not as a live track) |
| Finish | **Hunters win**, both Prey tagged at **18:48 played**, prey remaining **0 / 2** (the tag happens right at the 41:12 mark, so hunt and result pages are consistent) |
| Field log | 20:45–20:52, 6 entries (system + Nadia/Omar/Selim/Rana), no test chatter |
| Local time (bezel) | `21:04` · result date `Wed 4 Nov 2026` (weekday-correct, matches history) |
| Version/footer | `v0.16.1 · Free APK · Android 8+ · Not on Google Play`; server row `74.208.99.178` only in Auth/Settings; test-deployment caveat where a URL is given |

Status-bar/browser-chrome/dev strings never rendered; no fake counts/ratings/urgency; every number above is
either the brief's seed, the app's real default settings, or derivable from them.

---

## 6. What I deliberately reject

- **Surveillance/military instrument language:** radar sweeps, reticles/crosshairs, scanlines, target
  brackets, “TARGET/CONTACT/HOSTILE”, camo/olive, heat-maps, a pulsing tracker dot, fake “locking” states.
  The instrument is a field guide, not a weapon sight — the fix is *honesty about uncertainty*, not more
  fidelity.
- **Dashboard entropy:** eight HUD chips, duplicated clock/zone in sheet and band, tiny text to look dense.
  One source of truth per datum; density comes from rules and position, never from type below 12 dp.
- **MATCHDAY copy-paste:** no large cyan fill as the primary action, no Board on non-game pages, no
  icon-tile/card stack, no pill/chip chrome, no 26 dp sheet corners, no status chip floating in a scrim.
- **Poster/street moves:** no oversized 72–120 dp type, no flat colour-field blocks, no stencil/tape/sticker
  gestures, no overprint — that is direction B's territory, not a skin to borrow here.
- **Fake instrument data:** no invented coordinates (except the real editable fields in the rules sheet), no
  fabricated bearings/headings/heat-maps/“ETA”, no fake clock (`--:--`), no invented player counts.
- **Icon-only game actions, hidden primary actions, colour-only team/state cues, colour-only stale dots.**
- **Gradients, glows, shadows, glass, blur, textures, stock/AI imagery, network assets.**
- **Pure-white light theme or cream/serif “field notebook” pastiche** — light is daylight chalk, the paper
  object is one note, not a theme.

---

## 7. Risks & controls

| Risk | Control |
|---|---|
| **Coldness** (this territory's known risk; the shipped redesign explicitly rejected “field instrument” for being unfriendly) | One human sentence per page; first names; the paper FieldNote at result/claim; hand-scored chalk marks; the permanent line kept; the only jargon is the game's own; no “system/tactical” language. Test: would a parent reading over the shoulder see a game between friends? |
| **Dense readouts / small text** | Floors: 12 dp labels @≥7:1, 13 dp data, 15 dp body, 17 dp buttons; density through hairlines, not type size; verify at 1.5×/2× scale and at 320 dp; the readout band collapses into two rows at small widths. |
| **Clock/state legibility at arm's length** | The clock is the largest object on game pages (46 dp mono 700, 10.4:1) + progress ruler + state word; dock button 64 dp/17 dp; nothing else in the band competes (zone/prey are `reading.m`). Blur test in §2. |
| **Icon-only / hidden actions** | Every game action keeps a text label; map controls are the only glyph-only convention (platform-standard, 48 dp, described); nothing essential lives top-right; sheets keep their decision in the dock. |
| **Overly “instrument” reading (surveillance)** | Error bars + honest ages + “latest report, not live track” copy; no reticle/radar; the map is a field chart with a scored zone, not a tracking console; team colour chits humanise; the paper note and mark keep the brand's hand-made voice. |
| **Map vs scroll/gesture conflict** | Hunt pages are “chart fills, band and dock overlay, sheet overlays”; no map inside a scrolling column; chart/controls are Compose overlays (feasible with existing `MatchMap`). |
| **Light theme weight** | The readout band stays ink by design (a physical instrument face); the rest is high-key chalk; verify no large white field at night (`home-light` is a daylight proof, not the default). |
| **Hand-drawn marks look gimmicky** | Max one chalk mark per screen, only at a human moment; the mark is vector geometry in the brand's grammar, not a sketch font. |
| **Cyan under-use** (reviewers used to one filled cyan surface per screen) | Every page has one hot cyan **reading** (clock/code/zone ring/dial/live tick/selected measurement). Recorded as a deliberate reweight; if reviewers reject it, the fallback is a 2 dp cyan rule on the dock's primary edge without changing the hierarchy. |
| **Canonical seed vs premium captures differ** | Use the brief's seed (Nadia/Omar/Selim/Rana/Youssef, K7M2QX). Premium screenshots are a visual baseline only. |

---

## 8. Compose / feasibility notes (axis 7)

**Maps cleanly to Compose:**
- Shell: `Column` with `weight(1f)` map/chart + fixed-ish `heightIn` band/dock; `WindowInsets` safe drawing;
  IME padding on chat composer. All overlays are `Box` alignment; no scroll-under-map.
- `ReadoutBand`, `Bezel`, `Dock`, `RuleLabel`, `Manifest`, `Chit`, `Reading`, `Stepper`, `Rocker`, `Strip`:
  plain `Row/Column/Text/Box` + 1 dp `border` + `RoundedCornerShape(2.dp)`; zero elevation.
- `Scale`/rulers/chart ground: `Canvas`/`drawWithContent` lines — cheap; spans by `fillMaxWidth`.
- Clock/readings: existing `MatchDto`/`RoomState` fields; `fontFeatureSettings = "tnum"`; one ticking `Text`
  node (existing `CountdownText` pattern) — no whole-screen recomposition.
- Map overlays: existing `MatchMap` API (`ownLocation`, `prey`, `zone`, `trails`, `showPrey`, callbacks);
  markers drawn as Compose overlays or osmdroid `Marker`s; accuracy rings from `accuracy`; stale from `stale`;
  age derived from `receivedAt`/`recordedAt` (real fields). No engine change.
- Sheets: `ModalBottomSheet` with 2 dp shape and custom drag handle; existing `RoomSettingsDialog` logic can
  be rebuilt as sheet content (same validation block).
- Fonts: bundled Big Shoulders / Instrument Sans / Red Hat Mono; add a `MonoBold` weight (file exists);
  Arabic system fallback, no tracking; numerals LTR isolate (`Text(textDirection = Ltr)` or separate nodes).
- Paper `FieldNote`: `Surface` colour #F2F3EE, `Modifier.rotate(-0.6f)` via `graphicsLayer`; the hand-scored
  mark is a small `ImageVector`/`Canvas Path` (static, drawn once) — cheap and testable.
- Offline: `RoomUi.connected` exists but is not rendered — new `OfflineStrip` + disabled dock + preserved
  ages = small client work (no server change).
- Light theme: existing light colour scheme + new tokens; the always-ink readout band is one explicit
  exception (like the shipped Board).
- Accessibility: board/band as one grouped semantics node with a polite live region on the clock (update on
  minute boundaries, `liveRegion=None` for the ticking text); map gets a text alternative listing prey with
  ages (existing `PreyStatusCard` pattern — real); 48 dp targets; visible 2 dp cyan focus rule; errors
  assertive; reduced-motion static frames; colour never alone.

**Small client work / new UI (no server):** report-age readouts and stale annotations (real data), claim
created-at + countdown (real `createdAt`/`expiresAt`), “next report in” countdown (derived client state),
readout-band layout, FieldNote, manifest, steppers/rockers, offline strip, update-available strip (existing
`AppUpdate`), settings as a single scroll.

**Proposals that need a server/API change (flag to Lead, do not imply shipped):**
1. **Rematch** (required by the brief on `result`): needs a room restart action that copies teams/settings —
   e.g. `POST /api/rooms/{id}/rematch` returning the new lobby state, or client-side `POST /api/rooms` with
   the same settings + auto-join. Cost: small server action + state refresh; no engine change. Until then,
   `Back to lobby` remains the shipped action.
2. **Tag policy control** in `sheet-room-settings`: `SettingsDto.tagPolicy` exists (server enum
   `'confirm' | 'instant'`, verified in `server/src/domain/match.ts`) but **no client UI** and the enum is not
   documented in the client. The page shows the current server-enforced behaviour as a readout row
   (“Tags need the Prey to confirm.”); exposing `instant` would be a product decision + client field, flagged.
3. **Lobby zone chart** (`lobby`): drawn from `room.settings.zone` (real) — no map/location permission needed;
   if the implementation prefers the live map, it costs a location permission prompt in the lobby (not
   recommended).
4. **History match summary expansion**: data supports date/time/duration/winner/cancelled/team rosters only —
   no per-player tags. The summary block shows only those fields.

**Not done / not possible:** no map snapshot on result from the current contract (uses the played-time ruler +
honest omission instead of a fake trail); no per-message delivery state; no live “next report” on the hunter
side (hunters only know ages).

---

## 9. Known weaknesses / open questions + new copy

**Known weaknesses of round 1 (to fix in round 2 / reviewer input):**
1. The always-ink readout band in light theme is a deliberate call but needs a test: does `home-light` still
   read as “daylight chalk” with one ink strip? (Fallback: light band = chalk ground + ink rules + cyan
   readings; keep the rule only for the hunt band.)
2. Cyan-as-measurement is principled but could read as under-branded at thumbnail size next to A's cyan button
   (see risk table; fallback noted).
3. The chart-drawing stand-in for OSM tiles must not be mistaken for fake map data — NOTES and the review
   reply must repeat the honesty rule; no street labels anywhere.
4. `lobby` zone chart is a proposal (schematic from settings); if rejected, the lobby loses its map-first
   identity and needs a second composition.
5. `hunt-prey` has no primary action (correct by rules) — the dock is a status panel; worth a reviewer check
   that it doesn't feel like a dead end (the field log + rules actions are there).
6. Tag-claim “answer in 01:12” assumes a 90 s TTL display (`PENDING_TAG_TTL_MS`); verify the real value and
   make the countdown honest (fallback: show `Answered by 21:00`).
7. Arabic rendering in the HTML proof depends on the host's Arabic fallback face, not the app's device
   Naskh; the proof can only be judged for mirroring/geometry, not final Arabic type quality. `[NEW COPY]`
   strings need a native review before implementation.

**New copy introduced by C (marked for Arabic review, not translated in pages except the RTL proof where
existing strings are used):** `[NEW COPY — needs Arabic review]`:
- `LATEST REPORTS` / `LATEST REPORT` (strip label) — MSA candidate: أحدث البلاغات (compare existing
  “مواقع الفرائس بحسب آخر البلاغات”).
- `REPORTING EVERY 5 MIN` / `LAST SENT 12 s` / `NEXT 04:48` (prey strip).
- `STALE` already exists (`قديم`); `ANSWER IN 01:12` (claim countdown).
- `PLAY AREA` (chart label), `START CHART` (internal name only, not displayed), `TEAM MANIFEST` (manifest
  label; “قائمة الفريقين”), `READY 5 / 5` (existing “مستعد” + numerals), `HOST`/`YOU` data labels (already
  hard-coded Latin in app; keep as Latin data labels or localise in implementation — flagged).
- `Both Prey tagged. That's the run.` and `Same crew next week?` (human lines) — needs tone review + Arabic.
- `If he touched you, say yes and you're out. If not, dispute it — the Huntmaster decides.` (claim
  consequence).
- `Latest reports, not a live track.` (hunter strip).
- `Everyone's ready. Begin when you are.` (lobby status).

**Open questions for the Lead/reviewers:** (a) is the paper FieldNote an acceptable single warm material
inside the dark instrument, or does it read as a second theme? (b) does C's mono clock hold the “clock is the
loudest object” test at thumbnail size against A's display clock? (c) is the schematic lobby chart worth the
implementation cost vs a plain ruled lobby? (d) tag-policy row as read-only vs a real control (product call).

---

## 10. Files, build and render (current)

```
design/ui-v2/directions/c-field-instrument/
  <id>.html                                14 canonical pages + 3 state studies, directly in the direction folder
                                           (env/README.md §7 — no pages/ subfolder)
  out/<id>.png                             17 renders at exactly 1170×2532 (verified PNG IHDR)
  out/contact-sheet.png                    direction contact sheet (2704×6128; env tool copy too)
  NOTES.md                                  this document
  assets/field.css                         C token layer + component grammar (loaded after canvas.css)
  assets/pages.css                         page compositions + round-2 review fixes + RTL overrides
  assets/kit.mjs                           approved mark/wordmark inlines, original FieldMark icons,
                                           original drawn field charts, page shell, shared fragments
  tools/build.mjs                          deterministic page build (rerun after edits)
  tools/check.mjs                          layout probe (three-zone shell boxes + overflow)
  tools/audit.mjs                          round-2 mechanical audit (text floor / targets / clipping / canvas)
```

Commands (from repo root, per `env/README.md`): `node design/ui-v2/env/render.mjs design/ui-v2/directions/c-field-instrument`
→ 17 PNGs into `out/`; `node design/ui-v2/env/contact-sheet.mjs --only c-field-instrument` → the labelled
17-page sheet. Rebuild pages after kit/CSS edits with
`cd design/ui-v2/directions/c-field-instrument && node tools/build.mjs`. Pages link
`/design/ui-v2/env/canvas.css` then the two direction stylesheets. No external network assets; only the three
bundled OFL faces + the env-bundled IBM Plex Sans Arabic for the RTL proof + original SVG/CSS.

---

## 11. Review response (round 2)

_See **§13 — Round-2 review response** below: every reviewer-ux and reviewer-visual finding is logged as
item → decision (accept / partial / pushback) → what changed in the renders, plus the new-copy list and
post-round-2 known weaknesses._

---

## 12. Round-1 delivery record (what was actually built, 2026-11-04)

### 12.1 File map (as delivered — note the page location change)

The env contract (`env/README.md` §7) requires canonical pages **directly in the direction folder**, not in a
`pages/` subfolder, so the contact sheet can line directions up by filename. Direction C follows the env
contract:

```
design/ui-v2/directions/c-field-instrument/
  auth.html roles.html home.html lobby.html hunt-hunter.html hunt-prey.html chat.html
  result.html history.html settings.html sheet-tag-claim.html sheet-room-settings.html
  lobby-rtl.html home-light.html          ← 14 canonical full-page HTML designs (390×844, no OS chrome)
  state-paused.html state-offline.html state-eliminated.html
                                          ← 3 non-canonical state studies (round-2 extras; appended by the env sheet)
  out/<id>.png                            ← 17 renders, exactly 1170×2532 (verified PNG IHDR)
  out/contact-sheet.png                   ← direction contact sheet (copy of env tool output)
  NOTES.md                                ← this document
  assets/field.css                        ← direction token layer + component grammar (loaded after canvas.css)
  assets/pages.css                        ← page compositions (three-zone shell, charts, sheets)
  assets/kit.mjs                          ← approved mark/wordmark inlines, FieldMark icon set, chart drawing,
                                            page shell, shared HTML fragments
  tools/build.mjs                         ← composes the static pages (deterministic; rerun to rebuild)
  tools/check.mjs                         ← layout probe: measures band/chart/strip/dock boxes + overflow
```

Commands (from repo root, per `env/README.md`):

```bash
node design/ui-v2/env/render.mjs design/ui-v2/directions/c-field-instrument     # 14 PNGs into out/
node design/ui-v2/env/contact-sheet.mjs --only c-field-instrument              # env/out/sheets/c-field-instrument.png (2704×6128, 14 canonical + 3 extras)
node design/ui-v2/directions/c-field-instrument/tools/check.mjs                # layout probe (optional)
node design/ui-v2/directions/c-field-instrument/tools/audit.mjs                # round-2 mechanical audit (floor/targets/clipping)
cd design/ui-v2/directions/c-field-instrument && node tools/build.mjs          # regenerate pages/ from kit
```

Every rendered page reports `1170×2532` from `render.mjs` with **no overflow warnings**. The layout probe
tracks the three-zone shell: bezel 64 dp / instrument band 108 dp / chart 540 dp / report strip 55 dp / dock
141 dp (hunt pages sum to 844 exactly); sheets are full-page overlay states with the page behind dimmed.

### 12.2 System decisions confirmed in the build (and small changes from the pre-build draft)

1. **The clock is cyan mono.** The hunt band clock (`41:12`, `18:48`) is Red Hat Mono Bold 44 dp tabular in
   cyan — this is C's "one hot reading" per game page and the loudest object on the screen. Zone/Prey values
   stay chalk so only the time is hot; the progress ruler marker is the same cyan.
2. **The action is a chalk block.** Primary buttons are 64 dp chalk-on-ink (ink-on-chalk in light) with a
   17 dp label; secondary actions are 56 dp hairline outlines. Cyan is never a button fill. This is the
   direction's deliberate palette re-weighting: *chalk = what you do, cyan = what is measured*. Fallback if
   reviewers reject it: add a 2 dp cyan rule on the dock's leading edge without changing the hierarchy.
3. **The instrument band is always ink** (dark and light), matching the shipped rule for the Board: a physical
   instrument face does not change colour with the weather. In `home-light` the **bezel follows the theme**
   (white ground, ink wordmark) and only the **readout band stays ink** — one ink strip, no second identity.
4. **"Show the error bars" is real in the UI.** Every prey marker carries its age (`Nadia 12 s · ±6 m`,
   `Rana 14 min · ±22 m`), stale reports are a dashed hollow ring with a `STALE` annotation, the hunter page
   states `LATEST REPORTS · not live`, the report strip repeats `5 min interval`, and the prey page shows
   `LAST SENT 12 s` / `NEXT 04:48`. Ages come from `receivedAt`/`recordedAt`; accuracy from `accuracy`.
5. **The map is an original drawn field chart in the mocks.** Water/park/city grid, zone ring (four scored arcs
   with gaps), survey centre mark, accuracy rings and markers are original SVG; **no OSM tiles, no invented
   street/place labels, no fake coordinates**. `© OpenStreetMap contributors` is rendered on every chart because
   the implemented screen uses OSM tiles; in Compose the same layout uses the existing `MatchMap` (osmdroid).
6. **The human moments are the paper `FieldNote` + hand-scored marks.** Result: an off-white record card with
   "Both Prey tagged. That's the run." and a hand-scored mark around the final `Prey 0 / 2`. Tag claim: the
   decision copy itself ("You're out, and you can follow the rest from the field log. If it didn't happen,
   dispute it and the Huntmaster decides.") on the same paper object. Both are the only non-instrument
   materials in the system, rotated −0.6°, with ink text (16.8:1 on the paper) and one vector hand mark.
7. **The code is the lobby's hot reading.** `K7M2QX` is cyan mono 26 dp with `Send the code` as a first-class
   48 dp action; the manifest and rules readout sit below it. The lobby also carries a **drawn start chart**
   (zone ring, centre mark, `PLAY AREA 240 m`) built from `room.settings.zone` — a schematic, not a live map,
   so no location permission is needed before the hunt (implementation note §8).
8. **Home reads in one glance.** Bezel (lockup / 21:04 / Settings) → permanent line → **readout band**
   (`LOCATION ON · GPS ±6 m · HUNT NOT RUNNING`) → `JOIN A HUNT` six-cell code instrument (focused cell state)
   → `HOST A HUNT` ruled name field + default-rules readout → dock `Create the hunt` + `PLAYING AS OMAR · SIGN OUT`.
   Host is primary but join is never hidden; the disabled Join has its reason directly above it.
9. **Arabic proof is genuinely mirrored.** `lobby-rtl` is `<html lang="ar" dir="rtl">`: bezel order, title
   block, chart legend, code bar, manifest reading order, team rules, rows, rules lines, dock and back glyph all
   mirror; **K7M2QX and all numerals stay LTR** (isolated), `©` + attribution are wrapped in an LTR isolate,
   no `·` separators in Arabic, no tracking, Arabic body/UI set in the env-bundled **IBM Plex Sans Arabic**
   (OFL; the device falls back to system Arabic Naskh). Arabic player names are fictional (نادية، رنا، عمر،
   سليم، يوسف) while the room name stays Latin and uses the brand display face.
10. **Settings is one manual, no tabs.** Five ruled sections (Display, Language, Field permissions, Updates,
    Server, Account) with rocker/stepper/switch instrument controls, text-size preview line, update-available
    strip (`0.17.0 · 2.1 MB · published 3 Nov` — a seeded `AppUpdate` state), read-only server row and honest
    plain-HTTP caveat, sign-out in error colour. Everything fits one 844 dp screen at 100 %.
11. **Tag claim shows the real consequence before the tap**: 90 s answer window (`01:12` remaining, derived
    from `expiresAt`), `20:58` claim time (real `createdAt`), a paper consequence card, `Confirm the tag`
    primary + full-size `Dispute` outline + `Confirming ends your hunt. The field log stays open.` The dimmed
    prey page stays visible behind the sheet.
12. **Hunt rules sheet is a calibration panel**, not a Material dialog: stepper rows for head start / duration /
    report interval, Open–Zone rocker, zone radius stepper, zone centre + `Pick on map`, trails switch, tag
    policy row, shrink row, `Save rules` + `Cancel`. It is ~94 % of the page height because the brief requires
    all groups visible; implementation may use an internal scroll with the save dock pinned (§8).

### 12.3 Brief → shipped-app deltas and proposals (costs named)

| Item | Page | Delta / proposal | Cost |
|---|---|---|---|
| **Rematch** | `result` | Shown as primary with an explicit in-UI mono note: *"Rematch is a proposed action - needs a server restart, not in the current build."* The shipped app has only Back to lobby / View hunt history. | **Small server action** (`POST /api/rooms/{id}/rematch` copying teams/settings, returning lobby state) + client refresh; no engine change. If not adopted, remove the button and the note; Back to lobby remains primary. |
| **Tag policy** | `sheet-room-settings` | Chosen **baseline (a)**: one read-only row “Tags need the Prey to confirm” + `CONFIRM` + “Server-enforced”. The verified enum is `confirm`/`instant` (server `domain/match.ts`); a full confirm/instant rocker is a valid client-only proposal but not shown so the page does not imply a control that ships without a product decision. | Read-only = **zero** client work. If a control is wanted: client-only settings payload field (server already enforces both values); under `instant` the claim sheet can never appear — document in copy. |
| **History summary** | `history` | Expanded summary block for the selected match (date, duration, result, prey remaining, team rosters) as a ruled readout. No per-player tag data exists in `MatchHistoryEntry`, so none is shown. | **Small client UI** (selected-row state + summary block); data already present. |
| **Lobby start chart** | `lobby` | Schematic chart drawn from `room.settings.zone` (centre, radius) before the hunt exists. | **Small client Canvas** (no map/location permission needed). If the team prefers the live map, it costs a lobby location permission prompt — not recommended. |
| **Prey “next report” countdown** | `hunt-prey` | `NEXT 04:48` derived client-side from `locationIntervalSec` + last `receivedAt`. Flagged: no server change, small client timer state. Fallback if rejected: show only `LAST SENT 12 s`. | Small client. |
| **Claim “when”** | `sheet-tag-claim` | Claim time `20:58` + answer countdown rendered from `createdAt`/`expiresAt` (real fields; the shipped sheet does not display them). | **Small client** (pure presentation). |
| **Server edit** | `settings` | Kept read-only, exactly as shipped: “To change it, sign out and edit it on the sign-in screen.” No editable field with no save path. | None. |
| **Report ages / accuracy** | hunt pages | Ages from `receivedAt`/`recordedAt`, accuracy from `accuracy`; stale from `stale`. No invented freshness. | Small client presentation only. |
| **Rematch/history ordering** | `result` | Back to lobby dismisses; history opens over the room (shipped flow kept). | None. |

### 12.4 Known weaknesses of the rendered round-1 set (reviewer input welcome)

1. **Cyan presence at thumbnail scale.** C's “one hot reading” is text (clock/code/countdown), not a filled
   surface; next to A's cyan primary button it may read as less branded. The system is deliberate and
   documented (§3.1); the cheap fallback is a 2 dp cyan rule on the dock leading edge.
2. **The hunt map is a drawn chart**, not tiles: it is intentionally honest (no invented streets) but a
   reviewer comparing against A's real-tile capture should read the chart as the design's *schematics*, not
   as a missing asset; the implemented screen keeps osmdroid.
3. **`hunt-prey` has no primary action** (correct by game rules: Prey do not tag). Its dock is a status panel
   (`SHARING ON`, `NEXT 04:48`) + Field log / Hunt rules actions. This is by design but may be scored as a
   “no action” page; the alternative (inventing an action) would contradict the rules.
4. **Dense pages** (settings, hunt rules sheet) are at the edge of the 844 dp budget at 100 %; at 1.5× text
   the settings page will need the internal scroll region (specified in §8), and the rules sheet already
   scrolls internally in implementation. Round 2 could reduce one settings row (e.g. “Check for updates”
   could merge into the Updates section heading) if reviewers see crowding.
5. **`lobby` start chart is a proposal** — if cut, the lobby loses its map-first identity and would need a
   second composition (the manifest/code/dock grammar still works without it).
6. **Arabic type quality** can only be judged for mirroring/geometry here; the env stand-in is IBM Plex Sans
   Arabic while the app ships system Arabic. All new Arabic strings in the proof (`المضيف`, `أنت`, the rules
   lines, the “ready” labels) need a native review before implementation — see the `[NEW COPY]` list below.
7. **The result paper card** is the one non-instrument material; it works in the render and carries the
   warmth, but reviewers may legitimately ask whether a paper surface belongs in a dark instrument UI. It is
   the deliberate “one human moment” the brief requires.
8. **History is seeded fiction** (4 matches, fictional times); only the field/date/value shape is real. The
   end dates/team lineups are not from a server fixture.
9. **Even after the fix passes, text in the chart labels is 12 dp**; it meets the auxiliary floor and ≥7:1 but
   is the smallest text in the system. At 200 % font scale the map labels must grow/abbreviate (Compose rule:
   labels scale 1:1; marker labels can switch to name-only above 1.25×).
10. **Motion is specified, not shown** (static pages carry the final frame): the event vocabulary is in §3.7;
    a motion prototype is not part of this round.

### 12.5 New copy introduced by C (needs tone + Arabic review; not all translated in the pages)

Format: string → where → note. Arabic candidates are suggestions only, not approved translations.

| String | Where | Note |
|---|---|---|
| Latest reports · not live | hunt-hunter strip/legend | honest latency statement; existing Arabic has “مواقع الفرائس بحسب آخر البلاغات”. |
| Own position · no other Prey | hunt-prey page | product rule made visible. `[NEW COPY]` |
| Report cadence · last sent 12 s · next 04:48 | hunt-prey strip/dock | derived client state; `[NEW COPY]` |
| No answer in 01:12 · the Huntmaster decides | tag claim sheet | consequence copy; `[NEW COPY]` |
| Both Prey tagged. That's the run. | result paper note | human line; `[NEW COPY]` |
| From the first scored circle to the last tag. | result paper note | human line; `[NEW COPY]` |
| Rematch is a proposed action - needs a server restart, not in the current build. | result dock | **design-note string, remove on implementation** (kept visible so reviewers do not score rematch as shipped). |
| Everyone's ready. Begin when you are. | lobby dock | `[NEW COPY]` |
| Default rules · Classic hunt · head start 5 min · 60 min | home | summary of real defaults (`SettingsDto`); `[NEW COPY]` |
| Update available · 0.17.0 · 2.1 MB · published 3 Nov | settings | seeded `AppUpdate` state; `[NEW COPY]` |
| Playing as {name} · Sign out | home dock | existing strings recombined. |
| المضيف / أنت / مستعد · the two Arabic rules lines · Arabic ready labels | lobby-rtl | `[NEW COPY — needs Arabic review]`; the rest reuses `Localization.kt` strings (الردهة، غرفة الانتظار، رمز الدعوة، مشاركة الغرفة، اللاعبون، الفريسة، الصيادون، ابدأ المطاردة، تراجع، مغادرة). |

### 12.6 Round-1 self-test results (the 12-point test from the playbook)

| Test | Result |
|---|---|
| Squint test | Pass on hunt/result/home: state + cyan clock + one chalk button are the only high-contrast masses. |
| Thumb test | Primary buttons at y≈750–820 dp (bottom 40 % is y≥506); secondary actions in the same dock band. |
| Scoreboard/thumbnail test | The chart + cyan readout + ruled bands are recognisable at 30 %; contact sheet confirms the system reads as one product. |
| One-cyan test | No filled cyan areas; one hot cyan **reading** per page (clock / code / countdown / dial), as designed. |
| No-card test | Zero cards; ≤2 surfaces per page (input cell groups / paper / sheet). Grouping is 1 px rules. |
| Mirror test | `lobby-rtl` rendered; numerals/code/attribution LTR-isolated; no `·` in Arabic; no tracking. |
| Daylight test | `home-light` uses daylight-chalk tokens, theme-following bezel and an ink readout band; no cream. |
| Night test | Ground `#0B1220`/`#060B14`; no large white fields except the ~150 dp paper note; text ≥12 dp. |
| State test | Canonical state per page + at least one designed non-happy state: stale reports, claim countdown, update-available, notifications-off, disabled join with reason, planned modes, load-older. Remaining states specified in §3.10/§8. |
| Copy test | No exclamation marks, no ALL-CAPS headings (machine labels only), no invented claims/ratings/urgency; OSM attribution present; honest install/server lines. |
| Build test | Mapping in §8; new components are small Compose primitives; only rematch/tag-policy need named client/server work. |
| Direction test | Unmistakably the instrument territory, not MATCHDAY board and not a generic dark app; deviations recorded in §1. |

### 12.7 Notes on rendering fidelity (so reviewers judge the right thing)

- Pages are static full-page HTML on the env canvas (390×844) and were rendered at deviceScaleFactor 3;
  no status bar, nav bar, keyboard, browser chrome or device frame is drawn.
- Fonts: Big Shoulders / Instrument Sans / Red Hat Mono from `design/brand/motion-kit/assets/fonts/`;
  Arabic proof uses env-bundled IBM Plex Sans Arabic (`env/fonts/arabic/`, OFL) as the design stand-in for the
  device Arabic face. No other font is used.
- The approved mark and wordmark are inlined verbatim from `design/brand/identity/final/lockup/`; the dial on
  auth adds only original tick/bracket geometry around the approved mark (mark itself unaltered).
- The pages are composed from `tools/build.mjs`; the generated HTML is deterministic and self-contained apart
  from the two stylesheets and the repo fonts. No network assets, no stock/AI imagery.

---

## 13. Round-2 review response (reviewer-ux + reviewer-visual, 2026-11-04)

**Round-1 → round-2 result:** all round-1 findings were read, decisions recorded below, and every accepted
item is fixed in the renders. Direction C's canonical pages were re-rendered at 19:57 UTC (all exactly
1170×2532); three rendered state studies were added (non-canonical extras). Mechanical audit
(`tools/audit.mjs`, all 17 pages): **0 text nodes below 12 px, 0 interactive targets below 48 dp, 0 clipped
text nodes, every page 390×844 with bottom = 844**, and a 24-character username test shows the lobby manifest
ellipsizes without overlapping the tags or leaving the row.

### 13.1 reviewer-ux — decisions and changes (item → decision → change)

| # | Finding (severity) | Decision | What changed in the renders |
|---|---|---|---|
| U1 | Touch targets: rules-sheet steppers 44×38 (×10), settings steppers 48×42, switches 48×28 (S1) | **Accept** | Steppers are 48×48 hit boxes (visual scale kept); settings/rules steppers and rockers ≥48 tall; switches are 52×48 hit boxes (30 px visual track inside); all inline/text actions now carry a 48×48 minimum. Audit now 0 sub-48 targets. |
| U2 | Switches convey state by fill colour only (S2) | **Accept** | Each switch has a mono ON/OFF word cue beside the track (trails = ON, shrink = OFF); colour is no longer the only signal. |
| U3 | History invented datum "PREY REMAINING 2 / 2" not in `MatchHistoryEntry` (S1) | **Accept** | Removed. The expanded summary now uses only date window, duration, winner, `prey[]`, `hunters[]` — all real contract fields. |
| U4 | Home readout "GPS ±6 m" implies a location fix Home does not request (S2) | **Accept** | Home's band is permission-only now: `LOCATION Allowed · HUNT Not running` (both checkable without a location fix; no "reading you before you start" implication). No new client location work is needed; NOTES no longer implies it. |
| U5 | Real public IP `74.208.99.178` on auth/settings (S2) | **Accept** | Replaced with the neutral label `Hosted test server` on both pages; the honest plain-HTTP test-deployment caveat remains (auth adds "Play with people you trust."). |
| U6 | Lobby "Nadia" clipped (42×20 in 39×20), 24-char names break; no side switch (S2) | **Accept** | Decorative 01–05 indices removed; name column is `flex:1; min-width:0; nowrap; ellipsis` (24-char test passes, no overlap); `Change side` (اختر جانبك) added as a 48 dp dock action next to Stand down / Leave. |
| U7 | Result: unshipped Rematch is the primary action (S2) | **Accept** | **Back to lobby** is the single chalk primary; Rematch is a secondary row with a `PROPOSAL` tag + the "needs a server restart, not in the current build" note. |
| U8 | Chat header says "newest first" while the log runs oldest→newest (S2) | **Accept** | Says `oldest first` (load-older row sits at the top, as before). |
| U9 | RTL: 7 unisolated numeric runs; Arabic labels in mono/tracked faces; `·` in Arabic (S2) | **Accept** | Every numeric run is LTR-isolated (`5 / 5`, `240`, chit counts, rules-line numbers, section meta; 01–05 removed); Arabic labels moved to IBM Plex Sans Arabic with 0 tracking (serial label, chit names, manifest names/tags, legend, rules lines, buttons, dock actions, title unit); the Arabic host tag is two labels, not a middot. Also recorded: the static mock uses physical-direction CSS, but Compose maps to start/end natively and the RTL overrides are a mock-only cost (NOTES §8 feasibility). |
| U10 | Rules-sheet "Server-enforced" at 10 px; zone centre shows invented place label (S2) | **Accept** | All remaining 10–11 px labels raised to 12 px (audit 0 sub-12). Zone centre now shows the real readout `40.79950, -73.97350` from the zone settings plus `Pick on map`; the "not set" validation state remains the empty state (documented in §8). |
| U11 | Roles "PLANNED/PLAYABLE" replace approved copy family (S3) | **Accept** | Planned modes use `Coming soon` (existing translated string); Classic uses `Playable today` (new copy, flagged below). |
| U12 | Claim countdown duplicated (header + expiry) | **Accept** | Header meta is `20:58 · from Omar`; the countdown lives once, in the "No answer in 01:12 · the Huntmaster decides" row. |
| U13 | Notes-only paused/offline/eliminated states (cross-direction risk) | **Accept** | Three rendered studies added: `state-paused` (PAUSED band, frozen clock, exact "The hunt is paused. The clock is stopped." + Resume), `state-offline` (offline strip + retained ages + disabled Tag with reason + Retry), `state-eliminated` (tagged strip, Sharing Off, spectating dock, field log open). They are non-canonical extras, appended by the env sheet and named `state-*`. |
| U14 | Derived "next report" countdown + own accuracy | **Partial/accept** | Kept the derived countdown; NOTES labels it client-derived with the `LAST SENT` fallback. Own accuracy is real phone data and is shown as `±8 m` on the prey self marker. |
| U15 | Home join-before-host order | **Partial (accepted by reviewer)** | Kept both verbs in join→host order (returning-player fast path); host block strengthened with the default-rules readout and Create is the dock's only chalk block. NOTES states the deliberate priority; reviewer-ux will judge on squint at re-score. |
| U16 | Zero filled-cyan surfaces | **Pushback (accepted by reviewer-ux; recorded dissent)** | Documented reweighting: cyan = measurement (clock/code/zone/countdown/focus), chalk block = action, primary actions are high-contrast and unambiguous. Reviewer-ux accepted it as an owner/system question rather than a UX defect; the fallback 2 dp cyan dock rule remains documented. |
| U17 | Physical-direction CSS (~70 props/page) | **Partial (documented)** | Mock-only implementation choice; Compose uses start/end and the mock's RTL overrides are targeted. Listed in §8 as an implementation/RTL-robustness cost, not silently ignored. |

### 13.2 reviewer-visual — decisions and changes (item → decision → change)

| # | Finding | Decision | What changed |
|---|---|---|---|
| V1 | Identity contradiction: home/settings say "Omar", lobby says "Nadia HOST · YOU" (S1) | **Accept** | Omar is host/huntmaster everywhere: lobby + lobby-rtl hosted by Omar (Omar HOST · YOU, Hunters), home/home-light/settings "Playing as Omar", hunt-hunter is Omar's view. The tag claim stays Nadia receiving Omar's claim (prey-side view, consistent). |
| V2 | Result makes unshipped Rematch the primary (S1) | **Accept** | Same fix as U7 — Back to lobby primary, Rematch labelled proposal row, note kept. |
| V3 | History timeline wrong/incomplete: row 21:41 vs detail 20:41; just-played result missing | **Accept** | Row time is the start (20:41 etc.), group meta is the end; the just-played Wed 4 Nov match is first in the list; weekdays are 2026-correct (Wed 4 Nov / Sun 1 Nov / Sat 31 Oct / Fri 30 Oct); result date now matches (`Wed 4 Nov · 20:45–21:04`). |
| V4 | 10–11 px labels, <48 controls, "Server-enforced" 10 px | **Accept** | Covered by U1/U10: 12 px floor everywhere (includes the Roles guide-plate SVG text), 48 dp controls/switches. |
| V5 | 01–05 roster numbering reads as banned decorative numbering | **Accept** | Removed from lobby, lobby-rtl and result manifests. |
| V6 | Home pre-hunt GPS band / real IP / drawn map label | **Accept** | Covered by U4, U5, U10 (Home permission-only; neutral server label; real coordinates instead of place name). |
| V7 | `lobby-rtl` unisolated runs + tracking | **Accept** | Covered by U9. |
| V8 | Three rendered state frames (cross-direction risk #1) | **Accept** | Covered by U13. |
| V9 | Zero filled cyan / drawn charts / one-human-moment | **Pushback accepted** | Documentation stands: zero-filled-cyan is the direction's core reweight; drawn charts are honest stand-ins (no OSM tiles/labels); the paper FieldNote remains the deliberate human moment. |
| V10 | Home join-before-host | **Partial (accepted)** | Same as U15. |

### 13.3 New/changed copy in round 2 (needs tone + Arabic review)

| String | Where | Note |
|---|---|---|
| `Playable today` | roles | replaces "PLAYABLE"; `[NEW COPY]` (planned modes use the existing `Coming soon`) |
| `Coming soon` | roles planned modes | existing app string (translated) |
| `Change side` | lobby dock | new English copy; Arabic uses the existing **اختر جانبك** (from "Choose your side") |
| `Hosted test server` | auth + settings | neutral server label replacing the real IP |
| `Hosted server is a plain-HTTP test deployment. Play with people you trust.` | auth | honest test-deployment + trust line (approved-claims family) |
| `Rematch needs a server restart; not in the current build.` | result | **design-note string** kept visible so rematch is not read as shipped; remove on implementation |
| `The hunt is paused. The clock is stopped.` | state-paused | existing app string (translated) |
| `Offline · reconnecting` / `last update 12 s ago` / `Retry now` | state-offline | new state vocabulary; `[NEW COPY]` |
| `You were tagged. You are spectating this match. You can still chat, but you cannot tag or share new positions.` | state-eliminated | existing app string (verbatim, translated) |
| `Change side`/`اختر جانبك`, `مستعد` etc. | lobby-rtl | existing strings; no middot separators |

### 13.4 Known weaknesses after round 2 (and what remains for the owner/final task)

1. **Zero filled-cyan** remains a deliberate, documented reweighting (owner decision if C is chosen: is the
   one hot action chalk or cyan?). Brand-fit cost is acknowledged; reviewer-ux accepted it as a system note.
2. **Home hierarchy** is join→host by design (returning-player fast path) with host as the only chalk primary;
   reviewer-visual/UX will judge the squint at re-score — the swap is one build change if asked.
3. **Rules sheet** now sits as a 748 px auto-height sheet; the dimmed lobby title is partially visible behind
   the top edge (deliberate context, same language as the claim sheet). If a reviewer reads it as clutter, the
   fix is `height: 780px` (full-height sheet) at the cost of a small internal gap.
4. **States beyond the three studies** (loading/error frames, chat empty/send-failed, history empty/error,
   claim busy/error/disputed-huntmaster) remain notes-only; adding 10+ frames would dilute the canonical set.
5. **Drawn chart vs OSM tiles** — honest stand-in, no invented street/place labels, attribution present; the
   implementation keeps osmdroid.
6. **Arabic type quality** is env-IBM-Plex only; new Arabic strings need a native review before implementation
   (`[NEW COPY]` list).
7. **History** is seeded fiction (4 matches) but every field is from `MatchHistoryEntry`; no per-match survival
   score that the contract cannot know.
8. **Result paper note** is the single non-instrument material — deliberate human moment; owner may still
   prefer it quieter.
