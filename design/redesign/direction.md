# ManHunt app redesign — direction

**Status:** direction decision for implementation (task-48 → task-51). No app code in this workstream.
**Author:** app-redesigner (independent product/UI design), 2026-11-02.
**Brand inputs (fixed, owner-approved):** direction **PICKUP**, mark **01 Open Zone**, palette
field `#0B1220` / chalk `#E6EDF7` / signal cyan `#22D3EE` / prey coral `#FF7A59` / hunters violet
`#A79BFF`, drawn wordmark (`design/brand/identity/final/`), motion kit faces
(Big Shoulders / Instrument Sans / Red Hat Mono, OFL, already in the repo).
**Copy status:** provisional ("Hide from your friends." / "Your friends are hunting you.") — all copy in
this workstream is *intent*; strings in the app must keep their existing i18n keys where possible.
**Evidence:** rendered direction refs in [`refs/`](refs/), screen specs in [`screens/`](screens/),
diagnosis in [`audit.md`](audit.md).

---

## 0. The decision in one paragraph

**MATCHDAY BOARD (short name: "the Board").** The app is not a dashboard about a game; it is a piece of
**match equipment**: the scoreboard you hold up, the team sheet you fill in, the chalked pitch, the
field log, and the match report. Every screen becomes **one plate with one decisive gesture**, built
from chalk rules and a single live board strip instead of a stack of identical rounded cards. The screen
that any person should be able to draw from memory after one session is: **a huge clock, a cyan rule, two
team tags, and a field** — the same silhouette a stadium scoreboard or a chalked car park has. That is
the whole direction: *stop rendering UI chrome; start laying out the match.*

The owner's complaint — "generic dark cards", "not good enough" — is correct, and the cause is systemic,
not cosmetic. The current app uses **one container for every idea** (a 20 dp card with a tinted icon tile,
a bold title, a grey subtitle), and it uses **the brand as decoration** (a radar banner above the actual
task, the wordmark only inside that banner). The redesign reverses both: the brand becomes **structure**
(type, rules, tags, board numerals), and the container system is replaced by plates, rules and one live
board. Field-sport/street energy comes from **scoreboard scale, chalk geometry, kit tags and team sheets** —
not from more neon, gradients or "game" ornament.

---

## 1. What the current app is actually saying (diagnosis, condensed)

Full screen-by-screen diagnosis and ranked problems are in [`audit.md`](audit.md). The design-relevant
causes are five:

1. **Card monotony.** `ScreenCard` (20 dp radius, 1 px outline, 18 dp padding, icon-tile + bold title +
   subtitle) is used for the hero, both actions, the roster, role choice, the hunt phase, every settings
   group and every dialog. Seven things claim to be equally important, so nothing is. This is the
   "generic dark cards" the owner is reacting to.
2. **Brand as wallpaper.** The animated radar + wordmark banner sits above the real task on both Auth and
   Home, repeats "Hide from your friends." and a Prey/Hunters legend, and is the strongest thing on
   screen. The brand is present but not *used*: no large type, no clock scale, no chalk structure, no
   team-sheet layout.
3. **Template typography.** System Roboto Black + negative tracking, 11 sp all-caps tracked labels
   ("HUNT ROSTER (2)", "CHOOSE YOUR SIDE", "THE HUNT"), and every heading preceded by a 34 dp tinted icon
   tile with a generic Material outlined glyph. These are the exact default-generated-UI tells the brand
   strategy already forbids, and they carry no ManHunt meaning.
4. **No clock.** The clock is the game. It currently lives as small text inside a chip ("LIVE 6:26") or a
   line inside a card, at body size. The most dramatic, most glanceable, most shareable object in the
   product is visually marginal.
5. **States are generic.** Empty = centred grey sentence, loading = spinner, error = red-tinted banner,
   result = a standard `AlertDialog` over the chat keyboard. There is no match-report moment, no
   "you're out" moment, no code-entry moment — the three emotional beats of the game are default dialogs.

The palette is right. The mark is right. The problem is that the app doesn't use either as **structure**.

---

## 2. Three territories (divergent pass)

Each is a different answer to *what the phone is while the game is happening*. They are not skins.

### Territory A — **MATCHDAY BOARD** *(chosen)*

**Idea.** The phone is the **organiser's board**: a scoreboard strip, a team sheet, a chalked zone, a
match report. It is carried, propped against a backpack, passed around. The interface is composed like a
matchday plate: hairline rules, measured margins, display numerals, one action. Tally marks, kit tags and
the team sheet are the component language; the live clock is the loudest object in the product.

**What it looks like.** Big, left-aligned display type in Big Shoulders Display ("HOST A HUNT" at 40–56 sp
is a headline, not a card title). A full-bleed **Board** strip across the top of Home/Lobby/Hunt/Result:
dark plate, hairline top rule, phase word in mono, clock at 44–56 sp tabular, zone radius and prey count
in the right gutter. Grouping with 1 px chalk rules and open space instead of rounded cards. Team tags
with a **cut corner** (a ticket/kit tag silhouette) in coral/violet, each carrying a phase glyph and the
name — colour never alone. Buttons are **rectangular blocks** (2 dp radius, 48–56 dp tall), solid cyan for
the one primary action; everything else is a hairline outline. The map is full-bleed and the HUD is a
board + a bottom action dock. The result is a **scoreboard page**, not a dialog.

**Why it fits ManHunt.** It is literally the physical object the game already needs — the thing the host
holds up to show the code, the clock, the teams and the last result. It turns the game's real props into
UI, which is where the street/field energy actually comes from; nothing is borrowed from sports
broadcasting that the game doesn't already do.

**Risks / mitigations.**
- *Cold or military.* Mitigated by warmth of copy, hand-marked diagram lines, generous space, and the
  coral/violet player colours only as team tags — no HUD reticles, no "TACTICAL" vocabulary, no scanline
  cosplay. The Board is a scoreboard, not a command console.
- *Display type discipline at 320 dp / 1.5× / Arabic.* Hard-tested with per-screen max sizes in
  [`tokens.md`](tokens.md); display type is only used for strings that can wrap to two lines or be cut.
  Arabic switches to the Arabic display treatment, never a scaled-down condensed Latin face.
- *Implementation cost.* Medium: the token layer + a small component set + 8 screens. Phased plan in §7;
  the "credible slice" is 4 screens.

### Territory B — **PICKUP POSTER** *(street-flyer layer; rejected as the app system)*

**Idea.** The app is a **flyer for tonight's game** taped to a lamppost: oversized poster type, photocopied
contrast, hand-scrawled arrows and cancellation marks, stencil numbering, "TONIGHT · 8PM · THE PARK" energy.
Each screen is a poster; scrolling is like turning a stack of prints.

**What it looks like.** Enormous display headlines (72–120 sp), one photograph-free high-contrast poster
composition per screen, torn-paper edges, overprint/registration misalignment as a graphic device, xerox
texture, asymmetric type columns. Coral and violet used as overprint inks. Rules become torn strips.

**Why it is not the app.** It is a brilliant **campaign layer** — it should be the poster set, the social
grid and the install page — but as a UI it is costume: forms, chat, settings and a live map cannot be read
through a poster treatment, and every screen would need a new illustration. It also spends the brand's one
allowed "loud" gesture on decoration instead of the clock. Keep it as the **campaign extension** (§6), not
the product shell.

### Territory C — **FIELD INSTRUMENT** *(orienteering roadbook; rejected)*

**Idea.** The phone is a **navigation instrument** for a timed pursuit: survey grid, coordinate readouts,
contour hairlines, range rings, monochrome ink with team colours only as data marks, cut-corner instrument
panels, numbers that look measured rather than shouted.

**What it looks like.** Nearly monochrome field + chalk; hairline grid across the whole app; coordinates and
bearings in mono; tiny range ticks; dialogs that look like instrument cards; type at small sizes with
enormous data density. The clock is a seven-segment-like readout rather than display type.

**Why it is not the app.** Two reasons, both hard: (1) it walks straight into the "surveillance / military
instrument" reading the brand strategy explicitly rejected for a location-sharing game — the wrong
association for a product about friends; (2) it is cold and dense where the owner asked for street energy,
and it would make the app *less* legible outdoors at arm's length than the current one. Its good ideas
(measured margins, honest labels, tabular numerals) are absorbed into A, not adopted wholesale.

---

## 3. Evaluation (convergent pass)

Scored against what this redesign must achieve, as constraints rather than taste.

| Criterion | A — Matchday Board | B — Pickup Poster | C — Field Instrument |
|---|:--:|:--:|:--:|
| Kills card fatigue / gives one clear hierarchy per screen | **5** | 3 | 4 |
| Field-sport / street energy (owner's ask), not SaaS | **5** | 5 | 2 |
| Uses approved identity as structure (mark/palette/motion/type) | **5** | 3 | 3 |
| Works for functional screens (forms, chat, settings, map HUD) | **5** | 1 | 4 |
| Feasible in Compose in this sprint with existing assets | **4** | 1 | 3 |
| Honest tone / no surveillance or military reading | **5** | 4 | 1 |
| Survives light theme, RTL/Arabic, 320 dp, 1.5× text, foldables | **4** | 2 | 3 |
| Premium screenshot potential (what the owner judges) | **5** | 5 | 2 |
| **Total (max 40)** | **38** | **24** | **20** |

**Decision: build A.** B informs campaign/behind-the-scenes surfaces (and gives us the confidence to be
loud in screenshots); C's measurement discipline is folded into A's spacing and data treatment. Neither
B nor C is built as an app system.

---

## 4. The chosen direction, specified

### 4.1 Five principles

1. **One plate, one gesture.** Each screen has exactly one thing the eye lands on first (Home: the Host
   action; Lobby: the Board + teams; Hunt: the clock + map; Result: the winner word). Everything else
   ranks below it and uses less contrast. If two elements argue, one is wrong.
2. **The Board is the signature.** A full-bleed horizontal strip with a hairline top rule, letter-spaced
   mono state, a huge tabular clock, and a right-hand gutter of live data. It appears on Home (off-match),
   Lobby, Live Hunt and Result. It is the one component that survives every screenshot and makes ManHunt
   recognisable at thumbnail size, the way a scoreboard does.
3. **Rules are structure, plates are only for interaction.** Grouping is done with 1 px hairlines
   (`#2A3550`), alignment and space; a `Plate` (2 dp radius, 1 px outline, no shadow, no gradient) exists
   only where the user acts *inside* a bounded object (code entry, team choice, a settings group that is a
   control, the map sheet). Decoration never gets a plate. No card inside a card. No plate for prose.
4. **Type carries the sport.** Big Shoulders Display for loud words and numerals; Instrument Sans for
   every functional label and body; Red Hat Mono only for genuinely machine data (code, timer-tick label,
   coordinates, version). No all-caps eyebrow labels, no "01/02/03" decoration, no mono for prose. Team
   names and roles are **sentence case** — "Prey", "Hunters" — and are always paired with a shape or a
   word, never colour alone.
5. **The field is the field.** Cyan is the referee/field signal only: the clock, live state, focus, the one
   primary action. Coral = Prey, violet = Hunters, and nothing else. One hot colour per screen. Flat fills;
   no gradients (the current `HeroBanner` gradient is removed), no glow, no drop shadows; depth comes from
   overlap and hairlines.

### 4.2 The signature components (new, small set)

| Component | Role | Never |
|---|---|---|
| `MatchBoard` | Full-bleed top strip: phase, clock, zone, prey-alive. The app's signature. | Used as decoration, or more than once per screen. |
| `FieldPlate` | The airy "pitch diagram" plate: drawn zone/trail/dots as the single illustration on Auth/Home first-run/Roles. | Inside another plate; multiplied per screen. |
| `ChalkRule` | 1 px rule with an optional 3-tick survey mark and a short label. The alternative to a card. | Full-bleed under the status bar (that is the Board's top rule). |
| `TeamTag` | Cut-corner tag in team colour with glyph + name (`Prey` / `Hunters`). Used for role, roster row, chip. | Statuses that are not a team (use mono state text). |
| `CodePlate` | Six chalk cells for the invite code, with paste and share affordances. | A generic text field for a 6-char code. |
| `TeamSheet` | Two-column roster: Prey sheet coral, Hunters sheet violet, rows of player + ready mark + host mark. | A single undifferentiated "roster" list. |
| `BoardButton` | 2 dp radius, 48–56 dp, solid cyan (primary) / 1 px outline (secondary) / coral outline (destructive). | Pill buttons, icon-only icon-tiles, buttons with an icon tile prefix. |
| `StateTag` | Mono 11 sp tracked state word (`LOBBY`, `HEAD START`, `LIVE`, `PAUSED`, `FULL TIME`, `CANCELLED`). | Used as a section heading. |
| `FieldMark` | Original chalk-geometry icon set (§4.4). | Material outlined icons for feature areas. |
| `MatchSheet` | Bottom sheet with a 24 px chalk gesture rule, no rounded top corners beyond 2 dp, max 60 % height, scrollable inside. | A modal card floating in the middle of the screen. |
| `ScorePage` | Full-screen result: display winner word, score line, minute, trail map, roster tags, two actions. | An `AlertDialog`. |

### 4.3 Screen directions (one line each; full specs in `screens/`)

| Screen | The one gesture | Board? |
|---|---|---|
| **Auth** | The permanent line set in display type over the drawn field plate; the form is secondary, server config is a footnote. | No |
| **First-run safety / Roles** | A **field-guide plate**: drawn zone diagram, three rules, one accept bar at the thumb. | No |
| **Home** | Two verbs, not two cards: **Host** as the big field plate with name + CTA, **Join** as the code plate. | Yes (Masthead variant) |
| **Lobby** | **Team sheets** side by side over a Board that already shows code + state; ready is a pinned bottom bar. | Yes |
| **Live Hunt** | Full-bleed field, Board with the clock, one bottom dock action (Tag), everything else folded into a match sheet. | Yes |
| **Chat** | A **field log**: mono time gutter, team tag per sender, no bubble chrome for system lines; composer pinned. | No (compact header) |
| **Result** | A full-screen **scoreboard**: "HUNTERS WIN" at 72 sp, score + duration, trail map, roster tags. | Yes (full-time variant) |
| **Settings / Updates** | A ruled **manual page**: sections as rules, rows as commands, changelog as a field log. | No |
| **Tag / claim / dispute / end dialogs** | A **match sheet** with consequence as the title: "Tag Yasmin?" / "Omar says he tagged you." / "End the hunt for everyone?" | No |

### 4.4 Field-mark icon set (original, chalk geometry)

Drawn on a 24 × 24 grid, 2 dp stroke, square or butt terminals, no rounded corners, no fills except
deliberate solid marks. Replaces every Material outlined icon used as a feature glyph. Core 16:

`zone` (incomplete ring, the brand's gap), `prey` (solid dot inside an open ring), `hunters` (three
converging short chevrons), `trail` (polyline, three nodes), `ping` (dot with two expanding arcs),
`tag` (ring touching a dot), `clock` (ring + two straight hands), `code` (six cut cells), `roster` (three
tally strokes), `chat` (corner bracket + rule), `settings` (three rules with offset notches — a mixer, not
a gear), `history` (clock + return arrow), `update` (arrow down into a rule), `share` (two plates + link
line), `system` (half-filled ring — theme), `language` (two mirrored brackets around a rule). Plus
directional `back`, `close`, `more`, `check`, `plus`, `send` drawn in the same grammar.

The set is small on purpose: one icon file (`FieldMarks.kt`, `ImageVector`s), one stroke grammar, no
Material look-alikes. The brand mark and wordmark are separate assets and are never used as an icon.

### 4.5 Colour and material rules (details in `tokens.md`)

- **The Board is always dark.** In light theme the rest of the app becomes "daylight chalk" (`#F7F9FC`
  ground, ink type, white plates, hairline `#D3DCE8`), but the Board stays ink `#0B1220` with chalk text —
  a physical scoreboard does not change colour with the weather; this also keeps the live game's identity
  constant across themes and gives light mode a reason to exist.
- **One cyan surface per screen.** On Home: the Host button. On Lobby: the ready bar. On Hunt: the board
  clock/referee rule. Elsewhere cyan appears only as 2 px focus/report accents and the open-zone ring in
  diagrams.
- **No gradients.** The current `HeroBanner` linear gradient is removed; the only "texture" allowed is
  flat chalk dust specks ≤4 % opacity in the drawn field plate (never on text), exactly as the motion kit
  already does.
- **No shadows.** Overlap, hairlines and a 1 px "lifted plate" offset replace elevation. Dialogs/sheets use
  a 60 % ink scrim, not a shadow.

### 4.6 Copy intent (provisional; do not invent approved claims)

The voice is already specified in `design/brand/strategy/tone-of-voice.md`; the redesign changes *where*
words sit, not the voice. Rules for implementation:

- Screen titles are **plain nouns or verbs**: "The hunt", "The teams", "Chat", "Settings", "Result" — no
  marketing headers inside the app except the Auth/Home permanent line and the first-run rules plate.
- Buttons name the action and keep that name through the flow ("Create the hunt" → "The hunt is live").
- One exclamation mark in the entire app: none. No "Welcome back", no "Success!", no "Oops".
- The **code is a social object**: "Send the code" is a first-class action on Lobby (share sheet), because
  the CTA already promises it.
- Provisional lines that are safe to place: Auth/Home permanent line **"Hide from your friends."**, lobby
  instruction "Pick a side. Ready up. The hunt starts when everyone is ready.", tag consequence
  "Tagged. You're out.", result "Hunt over." Everything else reuses existing i18n keys.

---

## 5. What to remove (the "not doing" list — explicit)

Remove from the app; do not port into the redesign:

1. **The 34 dp tinted rounded icon tile** that precedes every card title (`ScreenCard`'s `icon` slot) —
   every instance. It is the single strongest template tell in the current app.
2. **20 dp rounded cards as the default group container.** Keep plates only where §4.1 says. The
   `ScreenCard` composable may remain for compatibility but must not be used by the redesigned screens.
3. **All-caps, letterspaced 11 sp eyebrow labels** (`SectionLabel`, `Pill` uppercase, `HUNT ROSTER (2)`,
   `CHOOSE YOUR SIDE`, `THE HUNT`, `HUNTMASTER`). State words may stay uppercase only inside `StateTag`.
4. **The gradient hero card** (`HeroBanner`). Gradients are against the brand rules; the animated brand
   plate (the existing `BrandMotionBanner`/radar) is kept as a *drawn field plate* but never wrapped in a
   gradient card.
5. **The duplicated hero banner on Home.** The brand plate is for Auth and first-run; Home leads with the
   Board and the two verbs. The wordmark returns as a small horizontal lockup in the Home header.
6. **The second hunt-status card in the Lobby** (`PhaseCard`) — its information moves into the Board and
   the bottom action bar; only host-rule controls stay, in the match sheet.
7. **The "Game server" card on Auth.** Demoted to a footer disclosure ("Game server · address · Change")
   with the "Test connection" probe inside it. It is setup plumbing, not the first thing a player sees.
8. **Icon-only Settings tabs** (`SettingsTab` `TabRow` with five unlabeled icons). Replaced by a ruled,
   sectioned single scroll with sentence-case sections.
9. **The `AlertDialog` hunt result** and the crosshair icon. Replaced by `ScorePage` (full-screen).
10. **Pill-shaped buttons and 999 dp chip radii.** Buttons become blocks; chips become cut-corner tags.
11. **`animateContentSize()` on cards** and the universal fade-and-slide-up screen transition. Replaced by
    hard cuts / chalk wipes (see `motion.md`).
12. **Generic Material icons as feature glyphs** (AddCircle, Login, Info, Wifi, Lock, Person, Settings,
    SportsEsports, GpsFixed, Pets, Tune, Visibility, ExpandMore…). Replaced by `FieldMark`s (system icons
    for pure platform conventions — back, close, check, search — may remain, redrawn in the same grammar).
13. **"Signed in as -"** and similar placeholder/empty-dev strings on any shipped surface; the footer
    identity is either a real name or omitted.
14. **The paw icon** as the Prey symbol. Prey is the coral dot in the open zone, not an animal.
15. **Cyan as a generic accent** (icon tints, links, tab indicators, section labels). See §4.5.

Kept deliberately: the palette, the mark/wordmark, the animated field plate concept, the map, the existing
gameplay flow, test tags, accessibility semantics, Arabic dictionary structure, and the honesty copy.

---

## 6. The wave (what this direction implies beyond the app)

The Matchday Board gives the project a **coherent prop language** that the site, screenshots and social
can borrow without redesigning it: the Board strip as the site hero device, the kit tag as the price/CTA
chip, the field plate as the OG/social composition, the score page as the release-note/launch graphic.
The Pickup Poster territory becomes the **campaign layer**: a poster series using the same board data
("TONIGHT / RIVERSIDE / 2 v 3 / 20:41"), never a second UI. The site and screenshot teams should treat
this file as the visual authority for in-app captures: if a screenshot would not sit on a matchday board,
it is not the redesign.

---

## 7. Implementation plan for the app team (feeds task-51)

**Phase 0 — tokens + shell (highest leverage).** Add the token layer (`tokens.md`): bundled fonts, colour
roles, type scale, spacing, shapes, border/elevation rules. Build `MatchBoard`, `ChalkRule`, `BoardButton`,
`TeamTag`, `StateTag`, `CodePlate`, `FieldMark`. Change the root surface/edge-to-edge treatment to the new
screen margins (16 dp) and Board bleed. **No screen redesign yet; this alone changes the app's silhouette.**

**Phase 1 — the four hero screens (the credible slice):** Auth, Home, Lobby, Live Hunt. These are the
screenshots the owner judges and the screens players see most. Include the bottom docks (one-hand reach)
and the board.
**Phase 2 — the match beats:** Tag/claim/dispute sheets, End-hunt confirm, Result `ScorePage`, History.
**Phase 3 — the manual:** Chat field log, Roles/Safety field guide, Settings/Updates, Room rules sheet.
**Phase 4 — states + adaptation:** empty/loading/error/offline/permission states per `screens/11-states.md`,
RTL/Arabic and light-theme passes per `screens/12-adaptation.md`, adaptive columns for ≥600 dp.

**Compatibility rules:** keep every existing `testTag`, semantics and gameplay action; keep the same
navigation graph and ViewModels; do not change strings that have approved Arabic; add new keys only where
the spec requires new copy. Prefer creating new composables and swapping call sites over rewriting
`RoomScreen.kt` wholesale; keep `MatchMap`'s public API and pass the new chrome in from the hunt screen.

**Design acceptance tests (run on the built app, dark + light + Arabic, 360 dp and 1.5× text):**

1. **Squint test** — with the screen blurred, can you name the one primary action and see the clock/state?
2. **Thumb test** — on a 6.1″ phone, every primary action is reachable without shifting grip (bottom 40 %).
3. **Scoreboard test** — at 30 % scale (screenshot thumbnail), is the clock legible and is the screen
   recognisably ManHunt via the Board + team tags, without reading a word?
4. **One-cyan test** — count cyan surfaces: exactly one "hot" cyan area per screen.
5. **No-card test** — count plates: ≤2 per screen, never nested, never for prose.
6. **Mirror test** — in Arabic RTL, no icon/rule/clock mirrors incorrectly; numerals stay LTR; the Board
   reads right-to-left correctly.
7. **Daylight test** — light theme is the same system, with the Board still ink; no white flash.
8. **One-hand/rotation test** — rotation preserves scroll, dialogs and match state; foldable/tablet shows
   the Board full width with a centred reading column and no stretched lines.
9. **No-device-strings test** — no "10.0.2.2", "Signed in as -", "CI Room", "alice74354" in any shipped
   surface or capture.

---

## 8. Assumptions and kill criteria (honest, per idea-refine)

**Betting that is true (validate cheaply):**
- A1. The owner's "not good enough" is about *hierarchy and identity*, not about wanting more decoration.
  → Validate: ship Phase 0+1 and compare the Home/Lobby screenshots against the current set with the owner.
- A2. Big Shoulders Display remains legible and on-brand at 40–56 sp on a 360 dp screen, including the
  clock. → Validate: render the four hero screens at 360 dp with 1.35–1.5× text before full rollout.
- A3. Six-character `CodePlate` entry is faster and more memorable than a generic text field. → Validate:
  usability run with 5 people; if not, fall back to a styled 6-cell row attached to a normal input.
- A4. A full-bleed Board does not collide with status-bar/inset handling or osmdroid gestures. → Validate
  on device before Phase 3; keep the Board inside the safe-drawing box.

**Could kill it:** if the display face cannot be bundled without breaching the ~2 MB APK/offline promise
(fallback: use the same scale in Instrument Sans Bold — still a large improvement, but the scoreboard
silhouette weakens); if the Board makes the map unusable under gestures (fallback: Board becomes a
collapsible strip); if light theme's ink Board reads as a bug to users (fallback: Board follows theme,
keeping a 2 px ink rule as the identity).

**Deliberately not doing (and why):** no photography, no stock, no new logo, no new palette, no game-rule
or layout flow changes, no icon-only navigation, no gradient/glow/glass, no motion that doesn't map to a
game event, no marketing claims or numbers the server doesn't enforce.

---

## 9. Files in this workstream

| File | What it is |
|---|---|
| `direction.md` | This decision and the system-level changes. |
| `tokens.md` | Type, colour, space, shape, border, elevation, motion tokens + Compose mapping. |
| `motion.md` | Startup, transitions, Board clock, map/HUD motion, reduced motion, haptics. |
| `audit.md` | Screen-by-screen diagnosis and ranked worst problems, with evidence. |
| `screens/00-index.md` | Screen map, state matrix, shared components, file guide. |
| `screens/01-shell-and-board.md` | App frame, Board, navigation, headers, Insets, cross-screen system. |
| `screens/02-auth.md` … `screens/12-adaptation.md` | Per-screen specs (hierarchy, copy, states, Compose notes, screenshot brief). |
| `screenshot-shotlist.md` | Exact premium capture set, seed data, crops, rejection checklist. |
| `refs/` | Rendered concept boards and phone mocks (HTML + PNG) using the official lockup/fonts. Start with `refs/out/direction-board.png`, then `refs/out/{home,lobby,hunt,result,chat,settings,auth,home-light,lobby-rtl}.png`; re-render with `node refs/tools/render.mjs`. Provenance/rights in `refs/README.md`. |

**Handoff:** implementation authority is this file + `tokens.md`; questions about a specific screen are
answered by that screen's spec. Conflicts with gameplay or existing i18n keys go to the Lead, not resolved
by inventing copy. The rendered refs are illustrations of the direction, not pixel-exact handoff; the token
values and screen specs win where they differ.
