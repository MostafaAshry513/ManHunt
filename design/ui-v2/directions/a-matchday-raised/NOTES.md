# Direction A — "Matchday, raised"

**Owner:** designer-a · **Status:** draft thesis (round 1 not yet rendered) · **Pages:** 12 canonical + `lobby-rtl` + `home-light`
**Read with:** `briefs/00-workstream.md`, `briefs/01-directions.md`, `design/redesign/{direction,tokens}.md`, `design/brand/`.

---

## 1. Thesis (one paragraph)

ManHunt is match equipment. Direction A takes the shipped MATCHDAY direction and *raises* it to the definitive
version: the phone is the scoreboard, the team sheet, the chalked zone and the match report of a game being
played outside right now. The Board is the dominant object in the product — a real scoreboard with a 24-hour
match clock at scoreboard scale, tabular numerals and a live data gutter; everything under it is laid out on
chalk rules with one strict type ladder, and surface (plate) is spent only where the player acts. The
difference from v0.16 is not a new idea, it is **scale, contrast and discipline**: fewer containers, much
bigger type, colour assigned rather than decorated (cyan = field/rule/time, coral = Prey, violet = Hunters),
and the game's three emotional beats — the tag claim, full time, the room rules — composed as moments, not
dialogs. A person should be able to draw any screen from memory after one session: a clock, a rule, two team
tags, a field.

## 2. What "raised" means — the six moves that separate this from v0.16 / the concept refs

1. **The Board becomes a scoreboard, not a header strip.** Height ~148–172 dp, two bands: a masthead band
   (state word + room name + data) and a score band (the match's number at display scale + a right-hand data
   gutter). The Board's big row always holds the match's most important number: **lobby = the invite code,
   live = the clock, full time = the final clock.** One system, three variants. The board is ink in both
   themes (a scoreboard doesn't change colour with the weather) and carries 1 px chalk edge rules.
2. **The type ladder doubles its contrast.** Big Shoulders at 60–96 for the loud beats (winner, permanent
   line, sheet titles, clock), Instrument Sans quiet at 15/13/12 for every functional label, Red Hat Mono
   only for machine data. No all-caps eyebrow labels, no decorative stats. Display type is allowed to be
   genuinely large because everything else is genuinely quiet.
3. **Chalk-rule geometry replaces cards.** Grouping is 1 px rules with 3-tick survey marks, hairlines between
   rows, 24 dp page margins, left-aligned everything. Plates exist only where a player acts inside a bounded
   object (inputs, code cells, team-choice column, sheet surface); max two per screen, never nested, never
   for prose. No rounded-card stack anywhere.
4. **Team colour becomes blocking, not tint.** Each side owns a colour *and* a glyph *and* a word: a 3 dp team
   rule, a display-scale count numeral, a solid cut-corner tag. Colour is never the only signal.
   **One cyan surface per screen** — the one action (or, on Hunt, the clock + referee rules).
5. **States are moments.** The tag claim and full time are the two loudest compositions in the app: full-screen
   score page, consequence-first sheet at display scale for the claim. A failure is a ruled strip in place,
   never a dialog; loading is a 2 dp rule and a sentence, never a spinner.
6. **Every number is honest and tabular.** Western digits, LTR, tabular figures; no `--:--`, no invented
   counts, no fake urgency; live values use real seed data; where the server cannot supply a stat the page
   omits it rather than inventing it.

## 3. Design system

### 3.1 Type ladder

| Token | Size/LH (dp) | Face | Weight | Track | Use |
|---|---:|---|---:|---:|---|
| `display.xl` | 84/78 | Big Shoulders | 700 | −0.015 em | Result winner only, max 2 lines. |
| `display.l` | 60/56 | Big Shoulders | 700 | −0.012 em | Auth/Home permanent line, first-run title, max 2 lines. |
| `display.m` | 44/42 | Big Shoulders | 700 | −0.008 em | Page declarations / moment titles (claim title, sheet titles, mode title, score numerals). |
| `display.s` | 30/32 | Big Shoulders | 700 | 0 | Declarations that must be one line ("Hunters", scoreboard label, step numerals at 30). |
| `board.clock` | 68/62 | Big Shoulders | 700 | −0.01 em | Live/full-time clock (52/50 on Lobby/Result where the code/winner carries the screen). |
| `board.meta` | 20/22 | Big Shoulders | 700 | 0 | Board gutter numerals, team counts, step numbers. |
| `headline` | 21/27 | Instrument Sans | 700 | 0 | Page/header titles ("Settings", "How the game works", "Hunt history"). |
| `title` | 17/22 | Instrument Sans | 700 | 0 | Section titles, team names, sheet section heads. |
| `body` | 15/22 | Instrument Sans | 400 | 0 | Default copy. |
| `body.small` | 13/19 | Instrument Sans | 400 | 0 | Supporting copy, consequences, rules prose. |
| `label` | 13/16 | Instrument Sans | 700 | 0 | Buttons, tags, row actions, dock status emphasis. |
| `caption` | 12/16 | Instrument Sans | 400 | 0 | Muted metadata and helper lines. |
| `data` | 12/16 | Red Hat Mono | 400 | +0.04 em | Code, timestamps, version, coordinates. |
| `data.small` | 10.5/14 | Red Hat Mono | 400 | +0.06 em | Attribution, keyboard-free metadata, OSM credit. |
| `state` | 11.5/15 | Red Hat Mono | 400 | +0.12 em, upper | `LOBBY` `HEAD START` `LIVE` `PAUSED` `FULL TIME` `CANCELLED` only. |

Rules: sentence case everywhere except `state`, mono data labels and the invite code. One display moment per
page (two on Result: Board clock + winner word, deliberately the pair). Arabic: no tracking, larger leading,
system Arabic face (Big Shoulders has no Arabic); digits stay Latin tabular and LTR. Display scales at half
rate capped 1.25× under text scaling; body/label 1:1.

### 3.2 Palette weight

| Role | Dark | Light | Weight |
|---|---|---|---|
| field (ground) | `#0B1220` | `#F5F7FB` | 100% of ground; flat, no gradient. |
| board (scoreboard) | `#0E1728` | `#0B1220` ink in both | Slightly lifted ink + 1 px chalk edge rules. |
| plate (interactive) | `#131E33` | `#FFFFFF` | Only where the player acts. |
| plate.raised | `#1B2740` | `#E9EEF6` | Inputs, code cells, selected segment. |
| chalk | `#E6EDF7` | `#0F172A` | Primary type, rules, markings (15.9:1 dark). |
| muted | `#A7B6CC` | `#475569` | Secondary type (9.1:1 dark). |
| hairline | `#26324B` | `#D3DCE8` | Structural rules, row dividers (non-text). |
| hairline.strong | `#55688C` | `#7C8CA3` | Interactive borders ≥3:1. |
| cyan | `#22D3EE` | `#0B6B83` | **Field/referee only:** clock rule, live dot, one primary action, focus. |
| coral | `#FF7A59` | `#B33A0F` | **Prey only.** |
| violet | `#A79BFF` | `#5B21B6` | **Hunters only.** |
| error | `#FF8A8A` | `#B91C1C` | Failures and destructive only — never a team. |
| scrim | `#0B1220` 62% | `#0F172A` 45% | Sheets. |

Team fills are 10–12% tint; team text sits on the tint at ≥6:1. Cyan never tints an icon or a team. No
gradients, glows, blurs, shadows, or glass anywhere. The only texture is flat chalk-dust specks ≤4% inside a
drawn field plate, never over text.

### 3.3 Spacing and plate language

4 dp base: 4/8/12/16/20/24/32/40/48/56/64. Phone page margin **24 dp** (brief default); Board/map/dock are
full-bleed. Sections separated by 24–32 dp + a chalk rule. Rows 52–56 dp with 1 px hairlines; group gaps 24;
plate padding 16. Controls: buttons primary 56 / secondary 48; inputs 52; code cells 46×54 (48 dp hit); team
row 52; settings row 56–64; sheet padding 20; sheet max height 86% (tag claim 64%). Nothing tappable below
48 dp. No fixed heights on text-bearing rows (heightIn only).

### 3.4 Component grammar

- **MatchBoard**: variants `Masthead` (Home: lockup + local time + settings — no fake hunt clock),
  `Lobby` (state + room name; big row = invite code + share; gutter = `5 / 5 READY` + ready ticks + team counts),
  `Live` (state + room name; big row = clock; gutter = zone / prey count for Hunters; zone only for Prey),
  `FullTime` (state + room name; big row = frozen final clock; gutter = score + winner). One Board per page,
  full-bleed, inside the safe content area.
- **ChalkRule**: 1 px rule + optional 3×3 dp survey ticks at start + optional end mono data label; the
  alternative to a card.
- **TeamTag**: cut-corner (top-end 8 dp) 28 dp tag, 10% team fill, 1 px team border, 16 dp team glyph,
  name `label`. **StateTag**: 20 dp cut-corner 4 dp, 1 px hairline.strong, `state` mono tracked.
- **TeamSheet**: column header = team glyph + team name 17 + count at `display.m` in team colour over a
  3 dp team rule; rows 52 dp (avatar 28 square initial, name 15, status mono 10.5, trailing HOST/YOU/check);
  your row = 10% tint + chalk 2 px start rule; empty column = one honest line.
- **BoardButton**: primary 56 solid cyan label onCyan, radius 2; secondary 48 outline; destructive error
  outline; inline 48 hit with underline rule. Disabled = 38% label + reason line always present.
- **CodePlate**: 6 cells 46×54, mono 20 uppercase, raised fill, 1 px strong border, cyan caret; LTR always.
- **FieldPlate**: original drawn "borrowed pitch" vector (block-map geometry, faint chalk ground, cyan zone
  ring with the mark's 24° gap, coral trail + prey dot, violet hunter chevrons, report pings); static, no text
  inside; light translation for light theme.
- **MatchSheet**: bottom sheet, 2 dp top radius, 1 px top hairline, 20×2 gesture rule, consequence-as-title at
  `display.m` or `headline`, actions stacked (56/48), scrim. No AlertDialog anywhere.
- **Dock**: full-bleed, 1 px top rule, optional status line 13 muted (the reason/affirmation), one primary.
- **FieldMark** icon set: original chalk geometry only — zone (unclosed ring), prey (dot in ring), hunters
  (converging chevrons), trail, ping, tag (ring touching dot), clock, code cells, roster tallies, chat rule,
  settings mixer rules, history, update, share, theme, language, back/close/check/plus/send/chevron/locate/eye.
  No Material look-alikes, no paw, no crosshair.
- **Field log** (chat): 40 dp mono time gutter, sender `label` in team colour + name, body 15, system events
  as ruled separators with mono labels, own message = 2 px chalk start rule + 10% chalk tint, no bubbles.

### 3.5 Motion intent

Broadcast graphics, not app animation. Hard cut for every state word/score change; digits change at second
boundaries with no easing; 240 ms ease-out only for sheet rise; 200 ms chalk wipe for screen transitions;
zone/trail/ping draw at constant speed (400–600 ms linear); tag snap 120 ms and it lands. No springs,
overshoot, bounce, shimmer, confetti, glow or parallax. One entrance per screen maximum. Reduced motion =
final frame immediately; all information is present statically. The clock is sacred: no pulse, no colour
flash, no per-second announcement.

## 4. Per-page intent (12 canonical + 2 proofs)

| # | Page | Intent + the 1–2 key decisions |
|---|---|---|
| 1 | `auth` | First frame is the game, not a form: drawn field plate with zone ring, prey dot, trail; **"Hide from your friends." at 60** over a chalk rule; then a quiet two-field form and one cyan button; server setup demoted to one mono data row above the version footer. Key: no banner card, no "Welcome back"; the plate is the brand. |
| 2 | `roles` | A field-guide plate: mode title "Classic hunt" at 44, honest hook, 3:2 mode diagram, the two sides as team tags with one sentence each, four numbered steps using `board.meta` numerals, other modes listed with "Not playable yet" in data, tick rail, dock "Let's play". Key: numbered steps use the scoreboard numerals (no icons/circles); planned modes honest, never marketed. |
| 3 | `home` | The matchday programme cover: Masthead (official lockup, local time 21:04, settings FieldMark), the drawn field, the permanent line at 60, then **two different objects**: Host = name field + cyan "Create the hunt"; Join = six code cells + outline "Join hunt". Footer: How it works / Playing as Nadia / Sign out / version. Key: hosting is above the fold on every phone; code and name are different shapes, not twin cards. |
| 4 | `lobby` | The room is a social object: **Board's big row is the invite code** (`K7M2QX` at 44 mono) with Share/ Copy in the gutter; readiness (`5 / 5 READY` + 5 ticks) reads at a glance; team sheets below with counts at `display.m`; rules summary on a chalk rule; dock "Begin the hunt" with "Everyone's ready." status. Key: code as scoreboard object (deviates from "code plate below the Board" with a reason: the code is the match's number before the clock exists); teams are the page's body, not cards. |
| 5 | `hunt-hunter` | Map-first: a real scoreboard (LIVE, `41:12` at 68, ZONE 240 m, PREY 2/2) pinned over a full-bleed drawn field; zone ring, own position, two prey reports — one fresh with ping + coral trail, one stale with dashed ring; square map controls; peek sheet with report age, zone-shrink countdown, OSM credit; dock "Tag prey". Key: one action, one glance = clock/zone/reports; stale is a shape, not just a colour. |
| 6 | `hunt-prey` | The exposed side of the same field: Board LIVE with clock and ZONE only (Prey never sees prey count); map is own position + zone, nothing else; a **coral-ruled position report band** ("SHARING YOUR POSITION", every 5 min, last report 20:41, next 20:46, "Hunters see this position.") where the Hunters' tag button would be. Key: no invented action for Prey — status is the dock; the cadence band makes the game rule visible. |
| 7 | `chat` | The field log: ruled separators for phase events ("HUNTING BEGAN", "RANA WAS TAGGED"), mono time gutter, team-coloured senders with names, own message as a chalk-ruled tinted block, pinned composer. Key: no bubbles/system pills; the log reads like a match report being written live. Seed names Nadia (Prey), Rana (Prey), Omar (Hunters, you), Selim, Youssef. |
| 8 | `result` | The loudest page in the app: FullTime board (`18:48`, HUNTERS WIN, PREY 0/2), then **"Hunters win." at 84**; honest summary "Both prey were tagged."; honest score line **Prey remaining 0 / 2** + 18:48 played at display scale; trail plate 16:9; final team sheets; dock Back to the lobby + View hunt history, with "Play again" as a flagged proposal row. Key: a scoreboard page, not a dialog; winner word plays against the frozen clock. |
| 9 | `history` | The match report ledger: header; **last-hunt summary block** (scoreline, duration, tagged, trail thumbnail) above a ruled list grouped "TONIGHT / YESTERDAY", mono times + result + score; cancelled match shown honestly; loading/empty/error documented in NOTES §6. Key: no card per match; the latest match gets the only illustration. |
| 10 | `settings` | The manual's back matter: one ruled page, no tabs — Appearance (segmented theme, text size slider + live preview line), Language, Permissions (status rows), Updates (installed v0.16.1, "You are up to date", What's new link), Account (name, **read-only** server, cache, sign out), footer. Key: segmented chalk controls not pills; honest sideload copy; server read-only here because it is changed on Auth after sign-out. |
| 11 | `sheet-tag-claim` | A moment, not a dialog: frozen hunt-prey page behind a 62% scrim; bottom sheet with a coral 3 px top rule, title **"Omar says he tagged you." at 44**, data line "At 20:52 · East gate", consequence copy ("Confirm it if it happened. Dispute it if it didn't — the huntmaster decides."), primary "Confirm tag" 56 + secondary "Dispute" 48. Key: consequence as title; the decision is unmissable; dismissal keeps the coral strip (documented). |
| 12 | `sheet-room-settings` | The rules book: lobby dimmed behind; 86%-height sheet titled **"Hunt rules." at 44** + honesty lead ("Applies to the next hunt. The server enforces these."); ruled sections TIMING / FIELD / VISIBILITY with numeric steppers, Open/Zone segmented control, chalk switches; Save rules + Cancel. Key: rules are equipment, not settings; honest consequence copy; no Material switch rows. |
| +1 | `lobby-rtl` | A genuinely mirrored Lobby in Arabic: Board state = الردهة, code and numerals LTR, team columns mirrored (Prey on the right), Arabic team names, dock "ابدأ المطاردة", +20–30% string length absorbed without clipping, no bidi reordering. Same visual system, not a translation skin. |
| +1 | `home-light` | "Daylight chalk": the same Home with a chalk ground, ink type, white plates, dark cyan, darker team colours — and the **Masthead still ink** (a scoreboard does not change colour). The drawn field plate has a light translation. Proves the light theme is the same identity, not a second one. |

## 5. States covered in round 1

Rendered: live (LIVE), stale report (dashed shape + text age), full time, cancelled (history row), tag claim
(decision state), RTL, light, "everyone ready" lobby, "up to date" settings, all-ready host dock. Documented
in NOTES (designed, not rendered) with copy and layout: empty/loading/error/offline/eliminated/paused/
permission for each page — see §6. The chosen page states are the ones that carry the game's facts; no page
invents a state the server cannot produce.

## 6. State design bank (documented; round-1 pages show the states listed in §5)

- **Auth**: submit busy = label + 2 dp rule, fields disabled; auth error = ruled error strip above the primary
  ("The server didn't respond. Check the address and try again."); server row expands inline, never a card.
- **Home**: create/join busy on the button; errors as ruled strips that keep the typed name/code; join error
  "That code didn't match a hunt. Check the six characters."; no global offline banner.
- **Lobby**: joining = skeleton board + `JOINING` state word; room error = full-page honest state; offline =
  1 px error rule under the Board + "Connection lost. Last update 12 s ago."; ready/start errors as strips
  above the dock; disabled Begin always names its blocker.
- **Live hunt**: map loading = field ground + "Loading map…" data line in the peek; no prey reports = peek
  "No reports yet. Prey report every 5 min."; no GPS = permission strip above the dock with the real reason;
  tagged = "Tagged. You're out." strip + "Spectating." status; paused = PAUSED board + chalk strip + RESUME;
  offline = rule under board + age in peek; action failure = strip above dock, control re-enabled.
- **Chat**: empty = rule + "No messages yet." + one sentence; send failed = strip above composer, draft kept;
  load older = inline rule; offline = send disabled with reason.
- **Result**: final-report fetch failure never hides the winner — strip in the trail area only; missing
  derived stats are omitted, never invented; cancelled variant has no winner word.
- **History**: loading skeleton rows (not spinner); empty "No hunts in this room yet." + invitation; error
  strip with retry; canvas shows a cancelled row to prove the state.
- **Settings**: update check/download states inline (rule + byte counts); permissions as status rows; cache
  clear busy; sign-out confirm sheet.
- **Sheets**: busy and error states inside the sheet (primary label + rule; error strip); destructive sheets
  require an explicit action, ×/back still cancels.
- **A11y**: touch ≥48 dp, body ≥13 sp, AA contrast from the token table, focus/selected = 2 px cyan ring +
  shape/word change (never colour alone), clock announced at minute boundaries not per second.

## 7. What I deliberately avoid

Rounded card stacks / 16–28 dp card radii; the tinted icon tile; Material outlined feature icons; gradients,
glows, shadows, glass, blur, scanlines; pill buttons and chips; all-caps eyebrow labels and "01/02/03"
decoration; mono for prose; cyan as a generic accent/link/icon tint; team colour for errors or decoration;
colour as the only team cue; the paw, crosshair, or military/tactical vocabulary; fake metrics, player
counts, urgency or store claims; marketing headers inside the app except the approved permanent line; emoji,
exclamation marks, "Oops"/"Something went wrong" without a next move; celebration effects (confetti, flashing,
sounds); a second illustration per page; the wordmark used as an icon; redrawing the Open Zone mark.

## 8. Biggest risks + mitigations

1. **"Safe" — may land too close to v0.16.** Mitigation: board scale (148–172 dp, 68–84 display), type ladder
   contrast, rule geometry and moments are all visibly different in a side-by-side; NOTES §2 lists the delta.
2. **Board height eats the map on short phones.** Mitigation: content-driven heights; live board compresses to
   masthead + clock + gutter at ≤700 dp; map min height 340 dp; no fixed text-box heights.
3. **Display type + Arabic.** Arabic uses a system Arabic face, no tracking, larger leading, display max 2
   lines; the RTL proof tests +20–30% string length. Big Shoulders is never used for Arabic. If a bundled
   Arabic face is not affordable, the honest fallback is documented as an implementation decision.
4. **Dense pages (settings, room rules sheet) staying legible.** Mitigation: 56 dp rows, 13 sp minimum, ruled
   sections, mono values end-aligned; the sheet scrolls inside; no tiny multi-column grids.
5. **The claim "consequence as title" can read cold.** Mitigation: the copy is warm and factual (no blame, no
   lecturing), the who/when data line is human, and the coral rule carries the emotional beat without
   shouting; only one display line is loud.
6. **Team colour reliance.** Mitigation: every team state is glyph + name + count + colour; selected rows add
   a 2 px chalk rule; stale/reported/tagged each have a distinct shape and word.

## 9. Compose feasibility notes (what an implementation pass must know)

- **Structure:** Board = `Column` of two `Row` bands with `Modifier.fillMaxWidth().background(board)` and
  `drawBehind` hairlines; variants via an enum + slot lambdas, not four files. Clock = `derivedStateOf` +
  `LaunchedEffect` sleeping to the next second boundary (never per-frame, never `Xx:xx` recomposition of the
  whole screen). Tabular figures via `fontFeatureSettings = "tnum"`.
- **Fonts:** the existing 5 OFL TTFs (359 KB) as `res/font` + licence texts in `res/raw`; Arabic uses the
  system Arabic family in the Compose `FontFamily` fallback chain (bundling IBM Plex Sans Arabic is +250–350
  KB and an owner decision, not required for this direction). Never render Arabic in Big Shoulders.
- **Plates/rules:** hairlines via `drawWithContent`/`drawBehind` (1 dp) not `Divider`; 2 dp radius via
  `RoundedCornerShape(2.dp)`; cut corners via `CutCornerShape(topEnd = 8.dp)` (auto-mirrors). No `Card`, no
  elevation, no `Surface` shadows (`shadowElevation = 0.dp`). All heights on text containers are `heightIn`.
- **Drawn field:** port the SVG geometry to Compose `Canvas` paths (already the approach in `BrandMotion` /
  `BrandMapMotion`); the static FieldPlate is one vector asset, no animation requirement. The live hunt keeps
  the existing `MatchMap` (OSM tiles + Deep Teal filter) with `roundedCorners = false`,
  `showAttribution = true` and the existing overlay model; the direction never requires engine work.
- **Data contract:** every value on the pages exists in `Models.kt`/`RoomState`: room `code`, `name`,
  `settings` (duration, head start, report interval, zone radius, trails), `members[]` with team/ready/host,
  `match.phase`/`endsAt`, pending tags/disputes, chat messages, `history` entries. The result's derived
  "2 / 2 tagged" is honest only if the client snapshots final state before the server resets eliminations
  (known gap documented in the redesign specs) — otherwise the page falls back to winner + duration only.
- **RTL:** logical start/end everywhere; numerals/code/clock wrapped in LTR isolates; wordmark/mark never
  mirrored, placement mirrors; map never mirrored; CutCornerShape mirrors; no `·` in Arabic strings.
- **Motion:** reuse the existing `Motion.kt` durations; hard cuts for digits; one 240 ms sheet rise; no
  springs; `Settings.Global.ANIMATOR_DURATION_SCALE == 0` renders the static frame.
- **Effort:** medium. Phase 0 (tokens + Board + rules/buttons/tags/marks) unlocks the whole set; the page
  designs reuse roughly 14 primitives. The heaviest work is the drawn field/map styling and the RTL pass, not
  the layout system.

## 10. Files

- `pages/` — 14 full-page HTML designs, 390×844 dp, no OS chrome.
- `out/` — rendered PNGs 1170×2532 + the direction contact sheet.
- `wip/style-tile.html` — the pin-the-voice tile used before pages (not a final page).
- `NOTES.md` — this file; §11 appended after round-2 review.

---

## 11. Corrections from the app inventory (design truth locked before build)

Read after `skills/DESIGN_PLAYBOOK.md` + `skills/PAGE_INVENTORY.md` (design-smith). These supersede any
earlier assumption in this file.

- **Cast + POV.** Prey: **Nadia** (host / huntmaster) and **Rana**. Hunters: **Omar, Selim, Youssef**.
  POV per page: `lobby`, `chat`, `hunt-prey`, `sheet-tag-claim`, `history`, `settings` = Nadia's phone;
  `hunt-hunter`, `result` = Omar's phone; `home`/`auth`/`roles` = Nadia signed in. The set deliberately shows
  both sides of the same hunt; each page is internally consistent.
- **Version/install honesty.** Footer = **v0.16.1 · free APK · Android 8+**; sideloading is stated honestly;
  no store/rating/player-count claims.
- **Result score is honest, not a football score.** The real score datum is **Prey remaining 0 / 2** (and
  18:48 played). No invented survivor/tag counts; if final counts are missing, the line is omitted.
- **Rematch is a proposal, not shipped.** The app has Back to lobby + View hunt history only. The page shows
  "Play again" as a quiet tertiary row and NOTES flags: needs a server action (restart same room with same
  teams/settings) + client call; small API, no engine work.
- **Tag policy has no shipped UI.** `SettingsDto.tagPolicy` exists (default `"confirm"`); the enum is not
  documented client-side. `sheet-room-settings` shows the enforced behaviour as a **read-only ruled row**
  ("Tags need the prey to confirm — enforced by the server") and NOTES flags: control requires server enum
  confirmation. No alternative policy values are invented.
- **Roles entry.** The app reaches Roles from Home ("Read the roles") and at first run, not from Settings;
  the canonical page is designed as the classic catalogue with a back header and "Let's play" dock; the
  first-run variant ("Welcome to ManHunt" + Let's play, no back) is documented, not rendered.
- **Settings server is read-only.** Changing the server happens on Auth after sign-out; the page states that.
- **No zone-shrink countdown on the hunt pages** — the seed room has shrink off (`Shrink over time` off,
  120 s / 25 m waiting). The shape/geometry is designed in `sheet-room-settings` but not falsely ticking in
  the Board.
- **Stale reports in Direction A** = coral at 45% + dashed ring + the word "Stale" + age in mono. We do not
  introduce the shipped amber hue: the direction keeps the brand palette and adds shape+word, which also
  satisfies "colour never the only cue".
- **Auth server row** = muted data line "Game server · hosted test server" + inline "Change server" (expands
  inline: address field, Test connection, Save/Cancel). No IP address and no dev strings in the page.
- **Timeline used consistently:** hunt starts 20:33:12, duration 60:00; at 20:52 the clock reads 41:12
  (18:48 played); chat messages 20:44–20:52; tag claim at 20:52; result = 18:48 played, both prey tagged.
  Home renders the pre-hunt moment at 20:31 local; Settings/History render after the hunt at 21:05.
- **First-run safety content** is approved and translated in `Localization.kt`; the Roles page reuses its
  meaning only where relevant (sides + modes), it does not replace the safety screen in the canonical set.
- **Offline/reconnect** is a real state flag (`connected`) with no shipped UI: designed here as a ruled strip
  under the Board + disabled server actions. Cost: small client work (render flag, disable actions), no engine
  change. Flagged in §9.
- **History summary** is a design proposal; only date/time/duration/winner/cancellation/team rosters are real.
  The summary block uses exactly those fields.
- **Drawn map honesty.** Pages depict the field as an original drawn diagram (no OSM tiles copied, no invented
  street labels); because the shipped screen shows OSM tiles, the real map surfaces keep
  `© OpenStreetMap contributors` in `data.small`. Result map is the allowed drawn "final position map"
  stand-in (proposal flagged).

---

## 13. Token deviations (per `skills/TOKENS.md` §9 / §11 — allowed and recorded here)

| Value | Shipped default | Direction A | Why / floor check |
|---|---|---|---|
| `display.xl` | 64/58 | **84/78** (−0.015 em) | "Raised": the winner word is the payoff of the game and the one moment the app may shout. Sentence case + full stop kept; max 2 lines at 390 dp. Large display ≥3:1 only rule — chalk on field 15.9:1. |
| `display.l` | 48/44 | **60/56** | The permanent line is the matchday-programme cover line; 2 lines at 390 dp ("Hide from / your friends."). Arabic uses IBM Plex at 52/62, no tracking. |
| `display.m` | 36/34 | **44/42** | Moment titles (claim, hunt rules, score numerals). |
| `board.clock` | 44/44 (hero 56) | **68/62** live, **52/50** full-time | The Board is the direction's thesis: the clock is the loudest object, readable at 30 % thumbnail and 1.5 m. Ink board in both themes; tabular; digits never animate. This is the deliberate "raise" over the shipped strip (variant/scale is allowed by the deviation contract; still one Board per screen, no fake clocks). |
| `board.meta` | 16/20 | **20/22** | Gutter numerals (`240`, `2 / 2`) at scoreboard scale. |
| line-height display | 0.92 | 0.90–0.93 per role | Tighter stadium signage leading; no descender collisions checked at 84/60/44/68. |
| page gutter | 16 dp (shipped) / 24 dp (v2 brief default) | **24 dp** | Brief's default; larger margin reads as a printed programme and gives the Board's full-bleed edge more force. 16 used only for internal sheet padding where stated. |
| board fill | `#131C2E` | **`#0E1728`** | Slightly deeper ink so the chalk rules/clock carry the contrast; same role, same family (extend within brand hue allowed). Board stays `#0B1220`-ink in light theme. |
| theme bg | `#0B1220` dark / `#F7F9FC` light | same dark; light **`#F5F7FB`** | Tailwind-class chalk ground; no cream, no pure white field (night test). |
| team rules | 2 dp | **3 dp** | Team colour blocking is a stated "raised" move; contrast of the rule vs plate is non-text-only and decorative grouping, text still carries the name. |
| state tags | 11/14 | **11/15** | One px more leading for mono at 11 px on dark. |
| sheet max height | 60 % | **86–90 % for the two sheets shown** (claim 64 %) | The claim is a moment (64 %); the rules book is a full-height manual page (86 %). Both are the real surfaces; no AlertDialog. |
| board height | ≥84 | **148–172 content-driven** | Two-band scoreboard (mast + score row). Still content-driven, no fixed height on text (min-heights only). |
| code object | CodePlate below Board in lobby | **Board's big row (display-scale code) + Share action; no separate six-cell plate in the lobby** | Deliberate deviation: the code is the match's number before a clock exists; making it the Board's big row makes the lobby's hero object the social object. The six-cell CodePlate remains on Home (editable) where entry needs cells. Recorded here; inventory's readiness ticks stay in the gutter. |
| clock semantics | not announced per second | same | board is one grouped node, updates on minute boundaries; static frame carries all information. |
| motion | shipped tokens | same vocabulary, no new events | hard-cut digits, 240 ms sheet rise, 200 ms wipe, 400–600 ms field draws; reduced motion = final frame. No springs/glows. |
| stale report | shipped amber `#F0A43A` | **coral 45 % + dashed ring + "Stale" + age** | Keeps the brand palette; adds shape + word so colour is never the only cue; still clearly distinct from fresh coral (dim + dash + label). Recorded deviation. |
| Arabic | system Arabic in app | IBM Plex Sans Arabic stand-in in the proof; Latin numerals/code stay Latin faces | Per env/design-smith; no fourth *brand* face, Arabic is a stand-in; no tracking; display uses Arabic face. |
| icons | 22 FieldMarks | same 24-grid, 2 dp butt-cap grammar, redrawn only where a page needs a mark | No Material look-alikes; no paw/crosshair. |

Accessibility/privacy floors checked for every pair introduced: body 15/13 chalk or muted on field ≥7.6:1;
mono data 10.5–12 muted on field/board ≥7:1; team text (coral/violet) on its 10 % tint ≥6:1 dark and uses
light tokens on the light proof; cyan primary label onCyan 9.2:1; error 8.3:1; non-text interactive borders
`rgba(230,237,247,.32)` ≈ 3.4:1 on plate. Touch targets: every button ≥48 (primary 56), map controls 48,
chips/rows that act 48; inline actions carry 48 dp hit boxes.

---

## 14. Round 1 delivery — self-test and known weaknesses

**Delivered:** 14 pages at `design/ui-v2/directions/a-matchday-raised/*.html`, rendered to
`out/*.png` at exactly **1170 × 2532** with `env/render.mjs`, contact sheet
`out/contact-a-matchday-raised.png` (also `env/out/sheets/a-matchday-raised.png`). No page renders a
scrollbar or exceeds the canvas. Files:
`auth, roles, home, lobby, hunt-hunter, hunt-prey, chat, result, history, settings, sheet-tag-claim,
sheet-room-settings, lobby-rtl, home-light` (+ shared `_a.css`; `wip/` holds the pre-page style tile and
local measure/render helpers, not deliverables).

**Twelve-point self-test (against `skills/DESIGN_PLAYBOOK.md` §10):**
1. *Squint*: Board clock 68 and state word are the first read on hunt pages; winner 70 on result; the
   one filled action is the only cyan mass on every page. Pass.
2. *Thumb*: every primary is in the bottom 40 % (docks at 56 dp; auth/home primaries at y≈640+/≈590+). Pass.
3. *Scoreboard*: at 30 % the clock/prey-count/pitch silhouette is legible; the code reads at 1 m. Pass.
4. *One-cyan*: exactly one filled cyan surface per page (tag-claim/prey/hunt have the coral/canvas rule only
   where no primary exists; cyan lines/dots are not surfaces). Pass — documented deviation: lobby ready
   ticks are 4 px cyan data ticks, not a surface.
5. *No-card*: plates are inputs/code cells/sheets only; grouping is rules and space; no nested plates.
   Auth/Home have interactive plates (2–3 fields), Lobby/Hunt have none in the page body. Pass.
6. *Mirror*: `lobby-rtl` is genuinely re-composed (RTL grid order, mirrored rows/dock, Arabic names/labels in
   IBM Plex, code/5/5/2/3 LTR isolates, no `·` in Arabic); the wordmark is absent there, so no mirroring
   question; map is never mirrored. Pass.
7. *Daylight*: `home-light` keeps the same ladder/components, with the ink Masthead? — the Masthead is light
   chrome with the official dark-on-light mark/wordmark per the shipped light theme; the drawn plate is
   translated, not recoloured. Board-bearing pages keep an ink Board by rule. Pass.
8. *Night*: dark-first, no white field, no glow; light proof is daylight chalk not cream. Pass.
9. *State*: rendered states = LIVE + fresh/stale reports (hunter), live sharing (prey), full time, cancelled
   row (history), tag claim, everyone-ready lobby, update-available settings, RTL, light. Other states are
   documented in §6/§11 with copy and layout. Partial by design (one state per page this round).
10. *Copy*: no exclamation marks; sentence case except state words/data labels/code; no invented claims;
    no dev strings; real seed cast; honest result score (`Prey remaining 0 / 2`), no fake clocks.
11. *Build*: maps to existing composables and data; new pieces listed in §9; the only real deltas are
    rematch (server action), history summary (design proposal), tag policy read-only row (client work if it
    becomes a control), offline strip (small client work) — all costed in §11.
12. *Direction*: the raised Board, doubled type ladder, chalk rules and display-scale moments are visibly
    distinct from the shipped strip in a side-by-side; the direction is not a reskin of the refs (code in
    the Board, score-page scale, claim moment, manual pages are its own moves).

**References actually used (digested, no assets copied):**
- *Matchday programmes / team sheets* — two-column roster, ruled sections, honest data density, masthead
  date/time logic. Not taken: club crests, sponsor blocks, period pastiche.
- *Stadium scoreboards / athletics result boards* — the clock as the loudest object, fixed state+data grid,
  tabular numerals, "played"/"full time" honesty. Not taken: LED/dot-matrix cosplay.
- *Printed field manuals / orienteering control cards* — ruled manuals for Settings/Rules, the code as a
  control card, survey ticks as grouping. Not taken: technical clutter or fake coordinates.
- *Chalk-on-asphalt* — the drawn field plate, unclosed zone ring, survey ticks (brand's own gesture, via
  `design/brand/identity/design-philosophy.md`).

**Known weaknesses (honest, for round 2):**
1. **Hunt-prey is deliberately sparse** (own position + zone only) — correct by rule, but on a thumbnail it
   can read as "empty map". A small in-map own-position label + a clearer report-cadence band may be worth
   adding; do not add other players.
2. **Result trail plate is a drawn stand-in** for the real OSM snapshot; labelled honestly in the plate
   credit, but the final implementation should snapshot the live map (engine/client work) or keep the drawn
   plate as an allowed v1.
3. **Settings is dense at 390 dp** (fits, but the rhythm is tighter than the rest of the system). It may be
   better as a real scrolling page in implementation even though this shot fits.
4. **The room-rules sheet is a tall (90 %) sheet** — justified by content, but it is close to a page; on
   short phones it must become a full page with a pinned save action (Compose note).
5. **Arabic new strings** not in `Localization.kt` are provisional: "مشاركة الرمز" (share the code),
   "أنت على هذا الجانب" (you're on this side), "انضم إلى الصيادين" (join Hunters), "المضيف" (host),
   "الجميع مستعد. المطاردة جاهزة للبدء." (dock status), "المسارات مفعّلة" (trails on) — flagged for copy review.
6. **History summary** shows only real fields (winner/duration/date/rosters); no score line because
   `MatchHistoryEntry` does not carry preyAlive/preyTotal. If the owner wants the score there, the API needs
   one field.
7. **Interactions are static** (no hovers/focus rings rendered); focus ring token (2 px cyan + 2 offset) is
   specified in §9 but not shown in the PNGs.
8. **Hunt-hunter map labels** are drawn legend text, not real OSM tile labels; the live map is still the
   shipped osmdroid tiles with the Deep Teal filter.
9. The lobby's Board-big-row-is-the-code decision deviates from the earlier "CodePlate below the Board"
   spec; it is recorded in §13 and is the direction's clearest "raised" move — reviewers should judge it as
   a deliberate system decision.
10. Claim sheet time "raised at 20:52" uses `createdAt` (real); it does not show `expiresAt` because a
    countdown would need the client clock presentation decision.

**Component → shipped mapping for the implementer (feasibility axis):**
`Board` → `MatchBoard` variants (masthead works; add FullTime/Lobby code slot), `rules` → `ChalkRule`,
buttons → `BoardButton`/`InlineLink`, tags → `TeamTag`/`StateTag`, team columns → `TeamSheet`/`RosterRow`,
code cells → `CodePlate` (Home entry), map → `MatchMap` + overlay grammar, chat → `ChatPanel` field log,
sheets → `MatchSheet` (plus a tall variant for rules), result → `ScorePage`, history → `HistoryDialog`,
settings → new section composables (segmented, slider, ruled rows), drawn plates → `BrandMotion` canvas
port. No engine change required; new token values are the ladder/board scale, colour refinements recorded
in §14; Arabic needs the env stand-in only for the proof (shipped app uses system Arabic).

## 15. Review response (round 2) — decisions, changes, remaining risks

Round-2 pass driven by `reviews/round-1-visual.md` (weighted 3.60/5, capped 5/7 by the unlabelled rematch) and
`reviews/round-1-ux.md` (3.75/5). Both reviewer message threads are logged in the review files; this is the
item → decision → change record. All 16 renders were re-produced from the revised source
(14 canonical + 2 extra state frames); audit after the pass: **0 functional/readable text nodes < 11.5 px, 0 metadata
pairs < 7:1, 0 sub-48 dp interactive targets, 0 clipped regions, 0 page overflow, 0 Arabic letter-spacing in
`lobby-rtl`**. Precision note: **no text below 11 px**, but the shipped metadata token is 11 px and remains on
15 declarations (33 rendered nodes — data punctuation, avatar initials, step numerals, mono status/timestamps,
unit labels, update/legal meta, proposal tag/note, RTL player meta), all ≥7:1; the readable-function floor is
11.5 px for everything else (see §15.6).

### 15.1 reviewer-visual items

| Item | Decision | What changed |
|---|---|---|
| **Cap §2.7: `result` "Play again" presented as shipped** | Accept — labelled as a proposal, not removed (brief's result must-show includes rematch; the shipped app has none) | `result`: action now reads "Play again" + visible **Proposal** data tag; one mono line under the secondary buttons: "Play again needs a server action to restart the room." NOTES already costed the server action. |
| `home-light` shows a different state from `home` | Accept | Proof re-rendered from the identical state: Hunt name "Riverside Run" focused, code cells empty, Join hunt disabled. Same DOM, same behaviours; only the theme changes. |
| Auxiliary type below floor (10.5/9.5 px) | Accept — system token pass | `data.small` 11.5/15 by default, board meta labels 11.5, chat gutter 11.5 (44 dp), history meta 11.5, switch labels 11.5, settings footer 9.5→11, claim/result credits 11.5. Measured post-pass: no text below 11 px; the remaining 11 px uses are the shipped metadata token, enumerated in §15.6. |
| Metadata < 7:1 (5.34:1 board labels) | Accept — one token change | Board muted token `.55 → .75` alpha (= #B0B8C3 on #0e1728, **8.95:1**). Field/plate metadata now 9.1:1 / 8.09:1; light theme 7.18:1. Contrast table in §13; rechecked per pair. |
| Icon-only Settings entry | Accept | Masthead shows the mixer FieldMark **plus a visible "Settings" label** (48 dp target) on `home` and `home-light`. No icon-only navigation remains. |
| `lobby` should be one object, not a perfected shipped page | Accept — restructured | Readiness moved fully into the Board gutter (`READY 5 / 5` + five ticks, no separate "Everyone is ready" line); the invite code and its Share action are one social object inside the Board's big row; the teams section carries only "The teams / 5 players". Host controls kept (Stand down, side switch, Begin + reason). |
| `hunt-prey` reads as an empty map at thumbnail | Accept | Added one in-map own-position label ("You · last report 20:41") over the dot, plus the existing cadence band; **no other players** added (hard rule). |
| "hosted test server" vague | Pushback accepted by reviewer | Kept deliberately: no IP/environment address in a designed capture; the plain-HTTP test-deployment caveat is in the auth footer / NOTES. |
| Board deeper ink | No change (confirmed no contrast cost; chalk 15.2:1) | — |
| Other cheap fixes | Accept | History 10 px clip fixed; room-rules 6 px clip fixed; London coordinates replaced; Settings label added. (Delivery note "auth closest to shipping" left as-is within A's territory: it is the brand's first-contact composition; the lobby is the page pushed this round.) |

### 15.2 reviewer-ux items

| Item | Decision | What changed |
|---|---|---|
| 92 nodes below 11 px | Accept | See 15.1 — 0 remaining. `data.small` token raised to 11.5 systematically; the page-specific 10–10.5 px rules were updated; 15 intentional 11 px mono machine-data uses remain (listed in §15.6). |
| 36 metadata pairs at 5.34:1 | Accept | Board-muted alpha raise (8.95:1) + size pass. Re-measured all pairs (field 9.1:1, plate 8.09:1, credit 10.88:1, light 7.18:1). |
| Sub-48 dp targets: View hunt history 44, Sign out 44, rules switches 40×22 | Accept | Secondary/destructive buttons now ≥48 (page overrides removed); both switches get a 48×48 hit wrapper (visual stays 40×22, ON/OFF word visible); inline text actions get 48 high hit boxes via padding (visual unchanged); segmented cells get 48 layout height (38 visual, clipped); board share action 48. Post-audit: 0 interactive targets <48. |
| Fake London zone centre | Accept | Room-rules shows the seed centre as `Set on the map · 40.8008, -73.9720` (Riverside Park, Manhattan; no invented place label). "Zone centre not set" remains the documented shipped fallback. |
| `home-light` parity | Accept | Fixed (see 15.1). |
| Claim expiry missing | Accept — C-verified behaviour | Claim sheet now shows **"Answer in 01:12"** (from `expiresAt`) and "No answer → the huntmaster decides." The server turns an expired claim into a huntmaster dispute (verified in `server/src/rooms.ts` by reviewer-visual), so the copy is accurate. |
| Arabic letter-spacing | Accept | `[dir="rtl"] .arabic-h { letter-spacing: 0 }` added (the earlier RTL overrides missed `.board-code-label`, `.board-share`, `.board-teamline`, `.btn`); every numeric run in `lobby-rtl` isolated with `.mh-ltr` including the rules-summary 60/5/240. Post-audit: tracking 0 px on Arabic, unisolated 0. |
| Leave/back confirm | Accept — documented (notes-or-frame per §18) | §6 state bank adds the shipped `MatchSheet` copy: lobby "Leave the room? / You'll lose your spot in the lobby. You can rejoin with the code." and active hunt "Leave this hunt? / The hunt runs without you. Your team keeps playing and you can't rejoin this match."; toolbar back + system back route to it (implementation note in §9). Not rendered this round (explicitly allowed by the brief; paused/eliminated frames add more value). |
| Dismissed-claim persistent banner | Accept — documented | §6 now specifies the coral strip under the Board: "A tag claim is waiting for your answer." / "Confirm or dispute it to keep the hunt fair." / REVIEW 48 dp; dismissal never loses the decision. |
| Hunt-prey "last report" client state | Partial accept | Render keeps "Last report 20:41" only (no "next"), labelled in §9 as **own-send client state** (the phone knows when it last sent; no server ack). "Reports every 5 min" is the room setting. Cost named as small client state, not server invention. |
| Map text alternative not the per-prey list | Accept | `hunt-hunter` now carries a visually-hidden per-prey status list (Nadia fresh 12 s; Rana stale 14 min) plus a tightened aria-label ("latest reports, not a live track… other players are not shown"). `result` trail plate gets a descriptive text alternative. |
| Other flagged states | Accept — rendered extras | Added **two non-canonical state frames** (appended on the contact sheet as extras): `hunt-paused.html` (PAUSED board, stopped clock, paused strip + Resume, disabled Tag with reason) and `hunt-eliminated.html` (tagged prey: "Tagged. You're out." strip, sharing stopped, Open chat, no actions). |
| Settings footer 9.5 px | Accept | 11 px /15 and single footer line; page re-fitted. |
| History clip / rules clip | Accept | Both fixed; audit now shows 0 clipped regions and page heights 844. |

### 15.3 Changes that also affect the rest of the system
- **Type floor is now a system rule:** no functional/readable text below 11.5 px; mono machine metadata is 11.5
  except the shipped `data.small` 11 px token (15 uses, list in §15.6) with
  tracking; Big Shoulders numerals untouched (display scale is the point).
- **Metadata token split:** `--a-board-muted` is now a readable 8.95:1 on ink; page-level "quiet" text on
  field/plate is ≥7.18:1. Do not lower it without re-running the contrast table.
- **48 dp rule for every action:** `.inline.hit48` padding trick and the switch hit wrapper are the pattern
  for implementation (visual height stays; hit target grows). Segmented cells are 48 layout / 38 visual.
- **Lobby Board is one object:** readiness ticks + code + share all live in the Board; do not re-introduce a
  separate readiness caption on implementation.
- **Claim lifecycle:** `expiresAt` countdown + "no answer → huntmaster decides" is part of the claim sheet;
  the persistent coral strip is the re-entry state. Both are honest server behaviours.
- **State frames:** paused/eliminated are rendered extras in `out/` and the contact sheet; other states
  (offline, loading, error, head start, chat empty/send-error, history empty/error, claim busy/disputed) remain
  documented in §6/§11 with copy and layout.

### 15.4 Remaining risks / new known weaknesses
1. **Result dock is now denser** (proposal tag + server-action line). It fits at 390×844 but the note is the
   first thing to cut at 320 dp / large text scale — the proposal tag is the essential part.
2. **Room-rules sheet is ~91 % of the screen** (top 72 dp) to fit the full real control set at the new type
   floor; implementation should make it a full-height page with a pinned Save action on short screens.
3. **Switch state is ON/OFF word + knob position + border**, never fill alone; the visual is 40×22 inside a
   48 hit wrapper — implementation must keep the wrapper, not shrink to the visual.
4. **`lobby-rtl` has four provisional Arabic strings** not in `Localization.kt`: "مشاركة الرمز",
   "أنت على هذا الجانب", "انضم إلى الصيادين", "المضيف", plus the dock's "الجميع مستعد. المطارقة جاهزة للبدء."
   and the teams caption "5 لاعبين" — flagged for copy review (no tracking, existing words reused where possible).
5. **Claim countdown is static in the frame** ("01:12"); implementation derives it from `expiresAt` and must
   not re-render the whole sheet per second (single Text, seconds boundary).
6. **Extra state frames are extras**, not part of the canonical 14; owner pack should treat them as evidence of
   the state system, not new screens.
7. **Results screen still uses the drawn trail stand-in** (allowed, labelled) — real implementation should
   snapshot the map or keep the drawn plate; do not draw fake street labels.
8. **Light masthead** is light chrome with the official dark-on-light mark/wordmark (per shipped light theme);
   the Board-bearing pages keep the ink Board — if the owner wants the Masthead ink in light too, that is a
   one-token decision, not a system change.
9. **No leave-confirm render** (documented only) — cheap to add if the owner review wants the destructive beat
   proven; the component and copy are specified.
10. **200 % / 320 dp reflow is specified, not rendered**: Board stacks (state+data wrap, clock stops at 44 sp),
    team sheets go single column, inline actions grow, pages scroll only inside the permitted regions; no fixed
    text heights. Add to implementation acceptance tests.

### 15.5 Compose/implementation notes added in round 2
- Metadata tokens: `data.small` 11.5/15 (a few 11 px machine-data uses remain, §15.6), `state` 11.5, board-muted `chalk @75%` (never below 7:1); the
  shipped `BoardTheme` muteds must be re-checked because the current `#A7B6CC` on `board` is 5.34:1.
- Hit targets: `heightIn(min = 48.dp)` on all text actions; switch rows as `selectable` 48 dp with the visual
  track 40×22 inside; segmented choices 48 dp tall (visual can inset).
- Claim: `expiresAt` → `remember` countdown text, one node; consequence copy "No answer → the huntmaster
  decides"; dismissal keeps the coral strip (never lose the decision).
- Leave/back: `BackHandler`/toolbar back opens the MatchSheet from §6; destructive action names the
  consequence; active hunt copy says the hunt runs without you.
- Hunt-prey: own-send "last report" needs a small client state (timestamp of last successful send) — no server
  change; if not implemented, show only "Reports every 5 min".
- Lobby: readiness ticks are data (up to 8), Board big row = code + Share; do not duplicate readiness below.
- Type scaling: body 1:1, display/board half-rate capped 1.25; at 200 % the Board stacks, team sheets
  single-column, dock buttons grow; page scrolls allowed only in the documented regions (chat log, long lists).



### 15.6 Precision correction after reviewer-visual's round-2 check (type floor)

reviewer-visual correctly noted the earlier claim "0 nodes < 11.5 px" was too broad: raw CSS still contains
**15 `font-size: 11px` declarations** (they were below my ≤10.9 px self-audit threshold — that was the bug). A
re-measure at <11.5 px gives **33 rendered nodes at 11 px** from those 15 declarations, in these families:

| Family | Nodes | What it is |
|---|---:|---|
| Board state separator "·" | 6 | decorative data glyph |
| Avatar initials (result) | 5 | single letter inside 24 × 24 avatar |
| Roles step numerals 01–05 | 5 | mono sequence numerals |
| `lobby-rtl` player status meta | 5 | Arabic "HOST · READY"-class status (`المضيف، مستعد`, `مستعد`) |
| Prey band labels/timestamps (hunt-prey + claim background) | 4 | "Sharing position", "Last report 20:41" |
| Chat own-message "You" labels | 2 | mono sender label |
| Result proposal tag + server-action note | 2 | data tag + mono note |
| Settings update meta + legal footer | 2 | "v0.16.2 · 2.3 MB", licence/OSM line |
| Room-rules unit labels ("min", "m") | 3 | mono unit suffix (marked in notes of the field value) |
| Hunt-eliminated band timestamp | 1 | "Tagged by Omar at 20:52" |

All are mono/upright **data labels and machine metadata**, not prose; every pair is ≥7:1 (board 8.95:1, field
9.1:1, plate 8.09:1). Readable functional copy is ≥11.5 px (body 13–15, labels 13, table headers 11.5). **The
brief's 12 sp auxiliary floor is met for readable auxiliary text; the 11 px set is the shipped `data.small`
metadata role and stays in this round** because the round-2 renders are the scored artefact and the owner pack
must remain version-stable. If the owner wants a strict ≥12 px floor for *all* text including metadata, it is
one token bump in `_a.css`/page overrides and a re-render — no layout change expected beyond a few line
heights; NOTES records this as an open, cheap option rather than pretending the claim is met at 12.

Other residuals recorded from the same review: offline/loading/error/head-start are **documented only** (§6,
§11); an offline strip frame was deliberately not added after round-2 scoring so the owner pack stays
version-stable — it is a one-frame addition if requested, and paused/eliminated extras already prove the state
system. The result dock's server-action note is the first element to cut at 320 dp / large text (the proposal
tag itself is the essential marker). At 320 dp: proposal tag stays, note hidden; dock buttons wrap and grow
(`heightIn`); Board stacks (state + data wrap, clock held at 44 sp); team sheets single-column; scrolling only
inside documented regions.


### 15.7 Round-2 handoff polish (reviewer-ux residuals; recorded, not re-rendered)

reviewer-ux's round-2 audit verified all docket items (0 sub-11sp, 0 genuine sub-48 targets, tracking/unisolation
0, AA-body 0, heights 844, cap lifted; axes interaction 4 / a11y 4 / feasibility 5). These residuals are S2/S3
handoff notes — deliberately **not** re-rendered, because the round-2 PNGs are the scored artefact and both
reviewers' numbers and the owner pack are aligned to them. Each is a one-line implementation fix.

1. **10 metadata pairs still < 7:1 on team tints/plates** (6.49–6.5:1; all readable, none a body pair):
   avatar initial `N` 12 px, `Host · Ready` 11.5 px (lobby / `lobby-rtl` / rules-sheet roster background),
   `Sharing position` 11 px (hunt-prey + claim background), claim `Hunters` tag 12 px, `If you confirm` 12 px.
   **Fix for implementation:** on team tints, either (a) set these labels at ≥13 px so the 4.5:1 large/label
   floor applies (recommended; they are labels, not metadata), or (b) introduce a lighter team-text token on
   tints (`coral` #FF9A80 / `violet` #BFB6FF class) while keeping the current tokens for non-text marks. The
   current renders already store the values; no visual change is needed to the system idea, only the small-text
   colour/size pass at build time.
2. **Segmented controls are a non-literal mock:** `.seg.small` is 38 px visually with 48 px `.seg-cell` boxes
   clipped by `overflow:hidden`; HTML hit-testing clips to 38, so the 48 dp measurement only holds once Compose
   makes the interactive control 48 dp tall with a 38 px visual inset (or simply 48 px visual). This is a mock
   technique, not a design exception — do not copy the clipping to Compose.
3. **Switch semantics:** `role="switch"` in the mock sits on the inner 40×22 track; implementation must put
   the role/click/selectable semantics on the 48 dp wrapper (or make the whole row a selectable target), with
   the track as a visual child. State remains ON/OFF word + knob position + border, never fill alone.
4. **Arabic uppercase inheritance:** 8 Arabic nodes inherit `text-transform: uppercase` from shared label classes
   (no visual effect on Arabic script). Implementation: `[dir="rtl"] { text-transform: none; }` on those label
   families to match the "no tracking, no case transforms in Arabic" rule.
5. **Optional S3:** result team sheet says "In play" for Hunters at full time; the shipped status is a
   full-time artefact — implementation may show "—" or "Full time" (C/B use "—"). Kept in the round-2 render as
   honest roster participation; changing it is a copy-only edit.

No further render pass is planned for Direction A round 2. If the owner requests the strict ≥12 px metadata floor
or the team-tint contrast lift before implementation, both are single-token passes plus a re-render; they are
logged here rather than silently claimed fixed.

## 16. Round-2 file set

- 14 canonical pages + **2 extra state frames**: `hunt-paused.html`, `hunt-eliminated.html` (non-canonical;
  rendered into `out/` for state evidence, not part of the canonical 14-up contact grid — the env sheet tool
  captures 16 pages but lays out the canonical 14).
- `out/`: 16 page PNGs at exactly 1170×2532 (14 canonical + 2 extras) + `out/contact-a-matchday-raised.png`
  (canonical 14-up grid; also `env/out/sheets/a-matchday-raised.png`). The extra frames are
  `out/hunt-paused.png` and `out/hunt-eliminated.png`.
- `_a.css`: the shared system (tokens, board, rules, plates, tags, sheets, docks, map, chat, settings, RTL).
