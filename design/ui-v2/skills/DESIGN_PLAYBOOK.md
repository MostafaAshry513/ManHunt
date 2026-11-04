# DESIGN PLAYBOOK — ManHunt UI/UX redesign v2

**Who this is for:** designer-a, designer-b, designer-c. Read this before your first page; re-read §10 before you render.
**Authority order:** `design/ui-v2/briefs/00-workstream.md`, `01-directions.md`, `02-evaluation.md` are the
contract. This file is the app-specific knowledge behind that contract. If they conflict, the brief wins —
message the Lead, do not invent a third rule.
**App under design:** ManHunt v0.16.1, "MATCHDAY BOARD" (shipped partially — see §6). Real source:
`android/app/src/main/java/com/manhunt/app/`. Real captures: `docs/screenshots/premium/` (emulator, 2026-11-04).
Background authority already in the repo: `design/redesign/direction.md`, `design/redesign/tokens.md`,
`design/redesign/screens/*.md`, `design/redesign/audit.md`, `design/brand/strategy/*.md`.

---

## 0. The one sentence to design to

ManHunt is a **real-world hide-and-seek game played at night with friends**: one phone per player, a shared
room code, two teams, one clock, a map of *latest reports* (not live tracking), and a physical tag. The phone
is not a dashboard about the game. It is a **piece of match equipment you hold while standing in a dark park**:
one hand on the screen, the other holding a bag, a torch or a friend's sleeve.

Every screen is a glance, not a read. If a page needs a paragraph to explain itself, it is not finished.

---

## 1. The player situation (P0 constraints — every page is judged against these)

| Situation | What it does to the player | What the design must do | Test on your page |
|---|---|---|---|
| **Night, outdoors** | Dark adaptation; screen is the brightest object; glare, rain, cold hands | Dark-first; no large pure-white fields; high contrast but not bloom; the one cyan/loud area is deliberate; light theme is "daylight chalk", not a white flash | Hold at arm's length in a dark room. Can you read the clock without hunting? Does the page glow? |
| **One-handed, moving** | Thumb reaches the bottom ~40 %; no precise drags while walking | The one primary action lives in a bottom dock; destructive actions are never next to it; nothing essential top-right; no long-press-only actions | Sketch the thumb arc over the 390×844 canvas; every primary is inside it. |
| **Stressed, time-boxed** | Hunt is live; clock is running; being chased | State + time + next action readable in **<1 s**; clock is the loudest object; "LIVE / HEAD START / PAUSED / FULL TIME" is explicit, never colour-only | Squint/blur test: name the action and the clock with the screen blurred. |
| **Social, borrowed phone** | People pass the phone around to show the code; screenshots get shared | The invite code is a **social object** (big, LTR, copyable, shareable); nothing embarrassing/precise for onlookers; no dev strings; screen works at thumbnail size | Stand 1 m away: can you read the code and the room name? |
| **Physical, real-world stakes** | The game happens in real streets and parks; phone is a tool, not a toy | No fake danger/military/surveillance reading; no gamified copy that undercuts the physical rules; safety and honesty copy stays literal | Would a parent reading over the shoulder understand this is a game, not a tracker? |
| **Interrupted** | Calls, pockets, backgrounding, GPS hiccups, dead zones | Every page has a designed **offline/reconnecting/permission** state; last-known data stays on screen; errors say what failed and the next move | Find the page's offline state. If it is "spinner + nothing", fix it. |

**Also true:** the app is **free, sideloaded (not on Google Play), Android 8+**, has no ads/in-app purchases,
and its server is a **plain-HTTP test deployment**. Copy that mentions cost/install must stay honest
(`design/brand/strategy/tone-of-voice.md` §4 "Approved claims ledger").

---

## 2. What the game puts on screen (rules → UI)

The game is **server-authoritative**. The UI may not imply a state the server does not have. The real phase
vocabulary (`android/.../data/Models.kt`, `object Phases`):

| Phase (server) | State word on screen | What is happening | Screen job |
|---|---|---|---|
| `lobby` | `LOBBY` | Players pick sides, ready up, host edits rules | Teams + code + one action (ready / begin) |
| `head_start` | `HEAD START` | Prey hide; hunting has not started | Clock to hunting; no Tag action; hunters see the map but no prey positions |
| `hunting` | `LIVE` | Hunters see latest prey reports; Tag is available | Clock + map + reports + tag |
| `paused` | `PAUSED` | Host froze the clock for everyone | Unmistakable pause; no Tag; resume is host-only |
| `finished` | `FULL TIME` | Winner is final | Score page, not a dialog |
| `cancelled` | `CANCELLED` | Host ended it / it never ran | Same score page, honest cancellation copy |

**Real domain vocabulary (use these words; do not invent synonyms):**
Prey · Hunters · Hunt · Room · Code (invite code) · Zone · Trail · Report · Tag · Full time · Huntmaster.
"Match" exists in the data/phase code but the app speaks of **the hunt**; use "hunt" in UI copy unless quoting
a server state. "Lobby" is a room state, not a separate app section. "Field log" is the chat's design role
(`ChatPanel.kt` renders system frames as centred data lines between hairlines).

**Rules that constrain composition:**
- Hunters see **latest reports** at an interval (default 5 min), not live positions. Prey see **their own**
  position only. Never show one prey's position to another prey.
- A tag is **physical contact then a double confirmation**: hunter claims → prey confirms or disputes →
  huntmaster resolves a dispute (`RoomScreen.kt`, tag lifecycle; `docs/ARCHITECTURE.md`).
- Disputed claims and dismissed decisions must stay **visible** until answered; never let a claim disappear
  into a dialog the player dismissed (`RoomScreen.kt` pending-claim banners).
- The result is final; the server resets the room after it. Do not invent a rematch action unless you label it
  as a design proposal — the shipped app has "Back to lobby" and "View hunt history" only (see
  `skills/PAGE_INVENTORY.md` §8 for the brief-vs-app delta).

---

## 3. Tone and copy rules

Voice source: `design/brand/strategy/tone-of-voice.md`. The app is written by "the friend who organises the
game": plain sentences, short beats, warm, even, never hypes what is not true.

**Hard copy rules (review will flag violations):**
1. **No exclamation marks** anywhere. `ScorePage.kt` literally strips the `!` from the legacy "Hunters win!".
2. **Sentence case everywhere** except: `StateTag` words (`LOBBY`, `HEAD START`, `LIVE`, `PAUSED`, `FULL TIME`,
   `CANCELLED`), true machine labels (`HOST`, `YOU`, `PREY n / 2`, `ZONE 240 m`), and the invite code.
   No ALL-CAPS headings, eyebrows, buttons, or section labels.
3. **Buttons name the action and the object:** "Create hunt", "Join hunt", "Ready to hunt", "Begin the hunt",
   "Tag prey", "Confirm", "Dispute", "Back to lobby", "View hunt history". Never "Submit", "Go", "OK", "Done".
4. **An action keeps its name through the flow** (button "Begin the hunt" → state "The hunt has started").
5. **Numbers are numerals** and always true: "6-character code", "41:12", "240 m", "2 / 2". Never a number the
   server does not enforce; never "1,248 hunters".
6. **Errors state what failed + the next move**, no apologies, no jargon: "The server didn't respond. Check the
   address and try again." Never a bare "Something went wrong", "Error 500", or a stack trace.
7. **Empty states invite the next action** and say what will appear: "No hunts in this room yet." /
   "Hunts appear here once they finish."
8. **Loading says what is loading, once** (no spinner words repeated in the header and the button).
9. **No fake urgency, scarcity, social proof, ratings, store badges, safety/rescue claims, or "private"/
   "secure"/"encrypted"** (the deployment is plain HTTP). No "free forever".
10. **No dev strings may render**: `10.0.2.2`, `alice74354`, `Cl Room`, `AAZHZX`, a lone `-`, "Signed in as -".
    If a value is missing, omit the row or use real seeded data.

**Seed copy that already exists and reads correctly (safe to place):**
- Permanent line: **"Hide from your friends."**
- Roles tagline: "Two teams. One block. One clock."; "Prey hide. Hunters track them down and tag them in person."
- Lobby instruction: "Pick a side. Ready up. The huntmaster starts the hunt."
- Host waiting: "The huntmaster is setting the rules." (player view)
- Tag claim: "Tag claim" / "{Hunter} says they physically touched you. Confirm the tag?" / "Confirm" / "Dispute"
- Tag picker: "Who did you tag?" / "You must be physically touching the prey. False claims can be disputed."
- Tagged prey: "You were tagged" / "You are spectating this match. You can still chat, but you cannot tag or
  share new positions."
- Pause: "The hunt is paused. The clock is stopped."
- Finish: "Hunt over – Hunters win"/"Prey win"; result buttons "Back to lobby" / "View hunt history".
- Safety / first-run copy exists in `i18n/Localization.kt` (safety block, "Play safe", "Not a safety service") —
  if you place it, copy exactly; it is approved and translated.

**Places where existing copy is weak — you may improve placement, not invent claims** (record in NOTES.md):
"Welcome back" (legacy), "HUNT ROSTER (2)" (ALL-CAPS eyebrow), "THE HUNT", "CHOOSE YOUR SIDE",
"begin the hunt" label vs "start the hunt" vocabulary, "Match" vs "Hunt" drift, "Stale" with no explanation,
`--:--` placeholder clocks (banned in v2 designs: show "Not started" as data or omit).

**Arabic copy:** MSA only in the app (`Localization.kt`); do not machine-translate new strings in your page.
When a designed page has Arabic, use the existing translations where a key exists; otherwise mark the string
`[NEW COPY — needs Arabic review]` in NOTES.md. Never mix MSA with Egyptian colloquial in one screen.

---

## 4. What makes ManHunt look like ManHunt (identity tests)

The approved identity is fixed: **01 Open Zone** mark (incomplete cyan chalk ring with the coral Prey dot in
the gap), the **drawn MANHUNT wordmark** (paths — never retype, re-track or letter-space it), the palette
roles, and the three bundled OFL faces. Sources: `design/brand/identity/final/`,
`design/brand/motion-kit/assets/fonts/`, `design/brand/identity/design-philosophy.md`.

**Recognition signals — a ManHunt page should be identifiable from a thumbnail by at least three of these:**
1. **The Board**: a full-bleed ink strip with a hairline top rule, a mono/uppercase state word, a huge tabular
   clock, and a right gutter of live data (`MatchBoard` in `ui/BoardComponents.kt`). One per screen.
2. **Display numerals**: Big Shoulders Bold clock/score at 44–64 sp, tabular, tight leading, never body text.
3. **Chalk rules**: 1 px `#2A3550` rules with 3 tiny survey ticks — the grouping device instead of cards
   (`ChalkRule` in `ui/BoardComponents.kt`).
4. **Kit tags**: cut-corner (8 dp, top-end) team tags with glyph + sentence-case name + team colour; colour is
   never the only cue (`TeamTag`, `BoardShape.tag`).
5. **Team sheets**: two columns (Prey coral / Hunters violet), 2 dp team rule, 56 dp rows, initial avatar,
   status data, host/you labels, ready check (`TeamSheet` in `ui/LobbyBoard.kt`).
6. **Six-cell code plate**: 48×56 dp chalk cells, 8 dp gap, mono code with tracking (`CodePlate`).
7. **Field marks**: original chalk-geometry icons on a 24 grid, 2 dp butt-cap strokes (`ui/FieldMarks.kt`) —
   never Material outlined feature icons.
8. **The drawn field**: a dark pitch/asphalt diagram with a zone ring, ticks and asphalt grain ≤4 % opacity
   (`BrandFieldPlate` in `ui/BrandMotion.kt`) — illustration, not wallpaper, never on text.
9. **Flat material**: zero elevation, zero gradients, zero glows; depth = overlap + hairline + scrim.
10. **The permanent line set in display type** on first-contact surfaces — the one place the brand speaks.

**Colour semantics (non-negotiable, from `docs/BRAND_BRIEF.md` / `design/README.md`):**
cyan `#22D3EE` = field / referee / time / the one primary action · coral `#FF7A59` = Prey / exposed ·
violet `#A79BFF` = Hunters / closing in · chalk `#E6EDF7` = markings and type · field `#0B1220` = the ground.
Never cyan as a team, never coral/violet as the field or as error/decoration, never a team colour for the
brand line at rest. **One cyan surface per screen** (a filled area >2 px); one hot colour per composition.

**What "generic mobile UI" looks like — reject on sight:** 16–28 dp rounded cards everywhere; a tinted 34 dp
icon tile before every title; gradient hero cards; pill buttons at 999 dp; five equal cards so nothing leads;
icon-only navigation; Material outlined feature icons; ALL-CAPS tracked 11 sp eyebrow labels; centred grey
empty sentences; a spinner as the loading state; a rounded red error card; a default `AlertDialog` for the
payoff moment. Every one of these is documented as a shipped failure in `design/redesign/audit.md` and
`docs/UI_AUDIT.md`; do not bring them back in a new skin.

---

## 5. Originality rules

- **Original vector/CSS/SVG work only. No stock images, no AI-generated imagery, no network assets** in the
  pages. Any photo-like surface is out. Illustrations are drawn with CSS/SVG in the page.
- **Use only the approved mark/wordmark geometry** from `design/brand/identity/final/`; scale it, recolour it
  only within the approved brand variants, never redraw/trace/retype it. The wordmark is drawn as paths.
- **Do not imitate a real property.** Field sports, match programmes, street posters, kit graphics and
  instruments are *reference languages* (see `INSPIRATION.md`), not assets: no club crests, federation marks,
  sponsor marks, kit manufacturer marks, scoreboard brands, game HUD screenshots, or OSM tiles copied into
  mock pages. No third-party logos or characters anywhere.
- **No fake UI claims in the design**: no "download on Play", no ratings/stars, no player counts, no "pro"
  tiers, no fake system chrome. The canvas is an app page (no status bar / nav bar / eyebrow device frame).
- **The direction must be yours, not the reference's.** If a reviewer can name the app a page is imitating,
  it has failed the distinctiveness axis (`briefs/02-evaluation.md`, axis 2).
- **One idea per page, executed hard.** ManHunt's originality comes from *which object the screen is built
  around* (board, team sheet, code plate, field log, field diagram) and how confidently that object is scaled
  — not from decoration layered on a standard mobile layout.

---

## 6. MATCHDAY lessons (what v0.16 shipped — keep / avoid)

MATCHDAY BOARD is the current shipped system and the basis for direction A. It got a lot right, but it was
delivered partially: some screens are the new system, others are still the old Material app. The v2 work must
**finish the system and push it**, not re-derive it.

**What genuinely shipped (read these files; reuse their logic/metrics, not their exact pixels):**
- Tokens + three faces + type scale: `ui/theme/Theme.kt`, `ui/theme/BoardTokens.kt`.
- `MatchBoard`, `StateTag`, `ChalkRule`, `BoardButton`, `TeamTag`, `CodePlate`, `BoardScaffold`, `BoardHeader`,
  `BoardDock`: `ui/BoardComponents.kt`.
- `Masthead`, `ZoneMark` (drawn Open Zone), `PlateTextField`, `ErrorStrip`, `LoadingTicks`, `InlineLink`,
  `BoardScaleSlider`: `ui/BoardInputs.kt`.
- `LobbyBoard`, `TeamSheet`, `LobbyDock`: `ui/LobbyBoard.kt`.
- `MatchSheet` (bottom-sheet decision surface): `ui/MatchSheet.kt`.
- Full-screen `ScorePage`: `ui/ScorePage.kt`. Field-log chat rows + composer: `ui/ChatPanel.kt`.
- Full-screen `HistoryDialog` with honest loading/empty/error: `ui/HistoryDialog.kt`.
- 22 `FieldMarks`: `ui/FieldMarks.kt`.
- Real captures proving the look: `docs/screenshots/premium/s03-home.png`, `s05-lobby-host.png`,
  `s07-hunt.png`, `s08-hunt-claim.png`, `s11-chat.png`, `s12-result-hunters.png`, `s15-home-light.png`.

**Keep (these are core ManHunt and v2 must not lose them):**
1. The Board strip as the signature; the clock as the loudest object; tabular numerals.
2. Type as structure: display face for loud words/numerals, UI face for function, mono only for machine data.
3. Chalk rules instead of cards; plates only where the user acts inside a bounded object; max ~2 plates/screen.
4. Cut-corner kit tags, two-column team sheets, six-cell code plate, full-screen score page, match sheets.
5. Cyan = field/referee, coral/violet = teams; one cyan surface; flat fills, no gradients/glow/shadow.
6. The drawn Open Zone mark + field plate as the brand's one illustration.
7. The shipped copy and safety content (translated, approved) — improve layout, not claims.
8. The hard behaviours: 48 dp targets, heightIn instead of fixed text heights, safe-drawing insets, RTL mirror,
   reduced-motion static equivalents, OSM attribution wherever map tiles appear.

**Avoid / fix (this is where v0.16 is not finished — reviewers will check you didn't inherit these):**
| Problem still in the shipped build | Where | What v2 must do instead |
|---|---|---|
| Hunt page bottom sheet is a 26 dp rounded Material surface; Tag is a pill button; HUD chips have elevation/shadow | `RoomScreen.kt` (`HuntSheet`, `HudChip`, `HuntActionBar`) — see premium `s07-hunt.png` | Make the hunt sheet/dock part of the Board grammar: 2 dp plate, flat, one primary in the dock. No pills. |
| Hunt rules is still a Material `AlertDialog` with `FilterChip`s, `Switch`, `TextButton`s | `RoomSettingsDialog.kt` | A match sheet with ruled groups and the same input grammar as the rest of the app. |
| Settings is still 5 icon-only Material tabs + `ScreenCard`s; Roles is still a `HeroBanner` gradient page with a paw icon | `SettingsScreen.kt`, `RolesScreen.kt` (still uses `HeroBanner`, `ScreenCard`, Material outlined icons) | Ruled manual pages / field-guide plate; no gradient, no paw, no icon tiles. |
| Huntmaster controls in the hunt details use `OutlinedButton` + Material icons + "HUNTMASTER" SectionLabel | `RoomScreen.kt` `HuntDetails` | FieldMarks + BoardButton/InlineLink; sentence-case labels except true state tags. |
| Lobby header crams leave/share/history icons in a top row with a Material TabRow below | `RoomScreen.kt` | One clear header; tabs/docks follow the new system; Chat/Game switch designed, not Material default. |
| `--:--` placeholder clock still possible (`formatRemaining`) | `RoomScreen.kt` | Never fake a clock: "Not started" as data, or omit the clock. |
| Result uses a drawn field placeholder instead of a real trail map (allowed this sprint) | `ScorePage.kt` `BrandFieldPlate` | Allowed in v2 designs too; label it honestly in NOTES/Compose notes. Do not draw fake OSM-like streets. |
| Empty/error/offline states are still generic in places (`ScreenCard` + `ErrorBanner`, spinner, centered sentence) | many | Use one state vocabulary: EmptyState / ErrorStrip / LoadingRule / OfflineStrip / PermissionStrip (see `skills/COMPONENTS.md`). |
| No visible offline/reconnect state; connection flag exists but is not rendered | `RoomUi.connected` | Design the offline strip and disabled-action rule; do not invent a network stack. |
| Board says `LIVE` but clock may be frozen on pause; HUD duplicates data in sheet | `RoomScreen.kt` | Paused must be unmistakable (state word + stopped clock); one source of truth per datum. |
| "HOST", "YOU", "PREY"/"HUNTERS" uppercase hard-coded in some components | `LobbyBoard.kt`, `ScorePage.kt` | These are acceptable as *data labels*, but sentence-case team names must exist alongside; Arabic must not be faked with uppercase Latin. |
| `animateContentSize` on every card; per-second tick recomposes a card | `Components.kt`, legacy `PhaseCard` | Event-mapped motion only; ticking value isolated to one Text (`CountdownText` shows how). |
| Dev/honesty leaks: server host in UI, "Cl Room"-class names, lone "-" | legacy screens | Real seed data only. No infrastructure strings on designed pages. |

**MATCHDAY v2 target, one line:** the shipped direction, finished across all 14 pages, with the craft and scale
of a matchday programme and the calm legibility of a field instrument — not a new skin.

---

## 7. Accessibility, RTL and internationalisation (hard constraints)

From `briefs/00-workstream.md` + `docs/UI_AUDIT.md` + `design/redesign/tokens.md` §9–10:

**Accessibility**
- WCAG AA contrast: body/label ≥4.5:1; large display ≥3:1; non-text interactive boundaries ≥3:1; metadata
  ≥7:1 if ≤12 sp. Check every pair you introduce; don't eyeball it.
- Touch targets ≥48×48 dp; never a control smaller; inline links get 48 dp hit height; no hover-only actions.
- Body text ≥14 sp (auxiliary ≥12 sp; 11–12 sp only for machine metadata). No text below 11 sp in a page.
- Text scaling: body/labels scale 1:1; display is half-rate capped at 1.25× (so a 200 % setting cannot turn
  the board into wallpaper). At 1.5×/2×: no clipping, no fixed text heights, buttons grow, team sheets reflow.
- Colour is never the only signal. Teams = colour + glyph + name. States = word + shape. Stale reports =
  amber/dim **and** dashed/annotated. Focus = visible 2 dp cyan ring + 2 dp offset.
- Motion: every cue has a static equivalent; respect system animator scale 0 (reduced motion); no essential
  information carried only by motion; no shimmer.
- Semantics: board is one grouped node or a polite live region; the map needs a text alternative (the real app
  has `PreyStatusCard` for this reason — UI-03 in `docs/UI_AUDIT.md`); errors are assertive, ready/reconnect
  polite; one announcement per message.
- Destructive actions name the consequence ("End the hunt for everyone?") and are not beside the primary.

**RTL / Arabic (proof page `lobby-rtl`; system notes for the rest)**
- Arabic is a first-class language for this app: full MSA dictionary in `i18n/Localization.kt`, RTL layout is
  wired at `AppRoot.kt` via `LocalLayoutDirection`. Design it, don't just let it flip.
- Mirror layout, alignment, rules, start/end padding, back/arrow direction, tag cut corner, pager direction.
  **Do not mirror:** the wordmark/mark, the map (real geography), the clock/code/score numerals (always LTR).
- Numerals are Western digits and stay LTR even in RTL: clock, code, counts, radius. Isolate them; never let
  bidi reorder a timer. No `·` separator in Arabic strings (bidi hazard); use a full stop or a line break.
- No letter-spacing/tracking in Arabic; no Latin display face for Arabic; Arabic display/body uses the Arabic
  face at larger size with more line height. Arabic text runs ~15–20 % longer — allow wrapping, never shrink
  below the size floor, never clip.
- **Arabic font in the design environment:** the host has no Arabic-capable font, so design-env ships an
  **IBM Plex Sans Arabic (OFL)** face at `design/ui-v2/env/fonts/arabic/`, loaded by canvas.css as `--mh-font-arabic` (alias `--font-arabic`).
  Use it (or its alias) for Arabic body/UI text; keep the brand Latin faces (Big Shoulders / Instrument Sans / Red Hat Mono)
  for LTR numerals, the invite code, state/data labels and any Latin-only string, exactly as the app keeps Latin
  tabular digits inside Arabic screens. Never set Arabic text in Big Shoulders/Instrument Sans; never set Latin
  numerals in the Arabic face. The shipped app uses the device Arabic sans fallback — the env face is the
  design-standin for that fallback, not a new brand face.
- Team names: use the existing `الفريسة` / `الصيادون`; keep `ManHunt` as a Latin isolate.
- The proof page must be genuinely mirrored and read correctly right-to-left: primary action at the mirrored
  thumb position, code/numerals LTR, punctuation not stranded at the wrong end.

**Light theme (`home-light` proof)**
- Light is "daylight chalk", not a second identity: `#F7F9FC` ground, ink type `#0F172A`, white plates,
  hairline `#D3DCE8`, darker cyan/team colours for contrast. The Board stays ink in both themes (a scoreboard
  does not change colour with the weather). No pure black, no cream/serif. No white flash.

**Honesty / legal**
- OSM attribution `© OpenStreetMap contributors` visible wherever map tiles appear (real app keeps it on the
  hunt sheet). The install path is honest: free APK, Android 8+, not on Google Play, plain-HTTP test server.
- No fake numbers, ratings, urgency, store badges, "secure"/"private" claims, or safety-service claims.

---

## 8. Jetpack Compose feasibility rules (design like an engineer will build it)

Target: **Jetpack Compose, minSdk 26**, existing navigation graph + ViewModels + data contract. "Implementable"
is a scored axis (15 %); reviewers will check NOTES.md for it.

**What maps cleanly (use freely):** Column/Row/Box with weights and `Arrangement.spacedBy`; `heightIn` sizes;
1 dp borders; `CutCornerShape`; `Canvas`/`drawWithContent` for the field/zone grids; CSS SVG inline (re-drawn
in Compose with `Path`/`ImageVector`); plain text styles from tokens; `LazyColumn` for lists; `ModalBottomSheet`
for match sheets; `AnimatedContent`/`animateFloatAsState` for event motion; `WindowInsets.safeDrawing`/IME;
`LocalLayoutDirection` for RTL; `fontFeatureSettings = "tnum"` for numerals.

**What needs care / avoid:**
- No `backdrop-filter`, `filter: blur`, glass, blend modes beyond simple alpha, CSS `position: sticky`
  complicated layouts, CSS `grid` with overlapping items, or nested scrolling that has no Compose equivalent.
- No infinite/lottie-style animation as decoration; only game-event motion (clock tick, zone draw, trail draw,
  report ping, tag snap, sheet rise) with a reduced-motion static frame.
- No fixed heights on anything that contains text (use `heightIn`); no fixed-width labels (Arabic expands).
- Don't design a map with fake tiles: the real screen uses osmdroid with a dark tile filter; a design may show
  a drawn field/official-style map plate, but it must be honest in NOTES (and no invented street labels).
- Don't add gameplay actions or rules; if the brief requires an action the app lacks (e.g. rematch), note it as
  a small server/API addition with the exact endpoint shape, not as free UI.
- Keep the existing composable names/signatures compiling where other code calls them; new surfaces are new
  composables swapped in screen by screen (`design/redesign/screens/00-index.md` §6). Your HTML pages propose
  the target, not the refactor plan.
- Fonts are the three bundled OFL faces in `design/brand/motion-kit/assets/fonts/` (359.5 KB total). Do not
  introduce a fourth face in a page; Arabic uses the env's IBM Plex Sans Arabic stand-in (`env/fonts/arabic/`,
  `--font-arabic`), matching the device Arabic sans fallback the shipped app uses. Arabic never uses the Latin
  display face; Latin numerals/codes stay in the brand faces.
- Map gestures vs scroll: the hunt map owns drag gestures; the sheet above it must not fight it. Design the
  hunt page as "map fills, sheet overlays, details scroll inside sheet", not as a scrolling page with a map card.
- Tokens: never hard-code a hex/radius/font-size in a screen; add it to the token set first (`skills/TOKENS.md`).
- Performance rules of thumb: one ticking text node, not a whole-card ticker; no `animateContentSize` on list
  cards; no per-frame recomposition of the map/sheet; stable list keys.

**Design-environment contract (frozen by design-env — `design/ui-v2/env/README.md`):** every page is a single
`.page` root at 390×844 dp, linked to the shared `/design/ui-v2/env/canvas.css` via the repo-root path (do not
fork it; override `--mh-*` tokens in your direction's `direction.css` loaded after it). Use the required helpers
`.mh-display/.mh-ui/.mh-mono/.mh-label/.mh-tabular/.mh-safe/.mh-hairline/.mh-scrim/.mh-touch/.mh-sr-only/
.mh-arabic/.mh-ltr`. Dark is primary; light proof is `<html data-theme="light">`, RTL proof is
`<html lang="ar" dir="rtl">`. Render from the repo root:
`node design/ui-v2/env/render.mjs design/ui-v2/directions/<dir>` → `<dir>/out/*.png` (exactly 1170×2532).
No page scrolling (inner scroll regions with hidden scrollbars are fine), no OS chrome, no external assets.
**Light proof:** canvas.css now ships the brand "daylight chalk" light tokens directly (`<html data-theme="light">`,
ground `#F7F9FC`, ink `#0F172A`, Board stays ink) — use them; TOKENS §3 is the authority if a direction reweights
light (record it in NOTES, no cream/beige identity).

**HTML→Compose vocabulary for your pages:** `display`/`flex` → Column/Row/Box; `border: 1px` → `border`;
`border-radius: 2px` → `RoundedCornerShape(2.dp)`; `clip-path` cut corner → `CutCornerShape(8.dp, topEnd)`;
`linear-gradient` → **don't** (use two solids or a Canvas redraw if it is the drawn field); `box-shadow` →
**don't** (overlap + hairline); `position: absolute` overlays → `Box` alignment; `grid-template-columns: 1fr 1fr`
→ Row with `weight(1f)`; `@font-face` → `Font(R.font...)`; `rem` → `sp`/`dp`; `vh/vw` → `fillMaxSize()`/weights.

---

## 9. Page-level obligations (summary; full inventory in `skills/PAGE_INVENTORY.md`)

Every canonical page must show its **real state(s)** and its **real data**, at 390×844, with the seed scenario
"Riverside Run" / `K7M2QX` / 5 players (3 Hunters, 2 Prey) / zone 240 m / clock 41:12 / duration 60:00.
Every page must cover the states it actually has; the ones reviewers will look for are flagged in the inventory.
The 14 pages: `auth`, `roles`, `home`, `lobby`, `hunt-hunter`, `hunt-prey`, `chat`, `result`, `history`,
`settings`, `sheet-tag-claim`, `sheet-room-settings` + proof variants `lobby-rtl`, `home-light`.

**Non-negotiables per page:**
1. One primary action, in the bottom 40 %, visually the only primary.
2. The Board/state/clock (where the page has them) answers "what phase, how long, who" in one glance.
3. Real copy and real data; no lorem, no fake metrics, no dev strings.
4. Empty/loading/error/offline designs where the page can meet them; states are half the product.
5. No generic card stack, no icon tiles, no gradients/glow/shadows, no pill buttons (unless a circle icon
   button is a platform convention and 48 dp).
6. Compose/feasibility notes in NOTES.md: new components, tokens, what maps to existing code, what costs work.

---

## 10. Before you render: the 12-point self-test

1. **Squint test** — blurred, can you name the one action and read the clock/state?
2. **Thumb test** — primary inside the bottom-40 % reach zone at 390×844.
3. **Scoreboard test** — at 30 % scale (thumbnail), is the clock legible and the page recognisably ManHunt
   without reading a word?
4. **One-cyan test** — exactly one filled cyan surface per page (2 px focus/report accents don't count).
5. **No-card test** — count plates: ≤2 per page, none nested, none for prose.
6. **Mirror test** — would the Arabic proof read correctly? Are numerals/code/clock LTR-isolated?
7. **Daylight test** — does the same system survive light theme with the Board still ink?
8. **Night test** — no giant white field, glare or neon; contrast holds at arm's length.
9. **State test** — find the page's empty/loading/error/offline state; does each say what happened + next move?
10. **Copy test** — read every string aloud: sentence case, no exclamation, no invented claim, no dev string,
    no "·" in Arabic.
11. **Build test** — can it be built in Compose with existing components/data? Anything requiring engine work
    named honestly in NOTES.md?
12. **Direction test** — is this unmistakably *your* territory, not a reskin of the shipped app and not a
    generic mobile layout?

---

## 11. Where the authority lives (repo map)

| What | File |
|---|---|
| The contract (what to produce, quality bar) | `design/ui-v2/briefs/00-workstream.md` |
| Direction territories + what every direction must produce | `design/ui-v2/briefs/01-directions.md` |
| Scoring axes + review process | `design/ui-v2/briefs/02-evaluation.md` |
| Real page/state/data inventory | `design/ui-v2/skills/PAGE_INVENTORY.md` |
| Element grammar + sizes | `design/ui-v2/skills/COMPONENTS.md` |
| Current tokens + deviation rules | `design/ui-v2/skills/TOKENS.md` |
| Reviewer anchors + page checklist | `design/ui-v2/skills/REVIEW_RUBRIC.md` |
| References / anti-references | `design/ui-v2/skills/INSPIRATION.md` |
| Canvas/render/pipeline | `design/ui-v2/env/README.md` (design-env owns it) |
| Shipped design rationale | `design/redesign/direction.md`, `tokens.md`, `audit.md`, `screens/` |
| Brand constraints | `docs/BRAND_BRIEF.md`, `design/README.md`, `design/brand/identity/design-philosophy.md` |
| Voice + approved claims | `design/brand/strategy/tone-of-voice.md` |
| Historical technical findings (still valid) | `docs/UI_AUDIT.md` (UI-01…UI-24), `docs/ANDROID_REVIEW.md` (A1…), `docs/LOBBY_AUDIT.md` (L-01…) |
| Real app source | `android/app/src/main/java/com/manhunt/app/` |
| Real captures | `docs/screenshots/premium/` (+ manifest), legacy `docs/screenshots/*.png` |

**The gate:** the owner will judge three complete directions side by side. A page that is beautiful but needs
copy invented, states missing, RTL faked, or a Compose engine change is not finished. Depth of the system and
honesty of the states beat one hero screen.
