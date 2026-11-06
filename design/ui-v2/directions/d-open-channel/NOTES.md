# Direction D — "Open Channel"

**One line:** the hunt as a warm late-night radio channel kept open between friends — a tuning strip, a
channel readout, call lamps, transmissions instead of menus, and one logbook for everything that happened.

This direction was added after the owner asked for a fresh creative direction that does **not** inherit the
current app's screens or code as a constraint. It is a full direction in the same design environment as
A/B/C — same canvas, same page set, same seed story — not a skin over the shipped MATCHDAY board.

---

## 1. Idea

Everyone playing is already carrying one phone and one conversation. ManHunt D treats that conversation as
the product: you don't open "the app" during a hunt, you stay on the channel. The screen is a small warm
radio in a dark park — bone-white type on a near-black warm ground, a tuner strip that quietly measures the
page, and amber only where a signal is genuinely live.

The emotional register is deliberately the missing one in the current spread: A is a scoreboard (competitive,
loud), B is a street poster (physical, playful), C is a field instrument (cold, precise). **D is social and
warm** — the friend who organises the game, not the equipment. It should feel like midnight, a torch and a
walkie-talkie, not like ops.

The metaphor is load-bearing, not decoration:

| Radio idea | ManHunt thing |
|---|---|
| tuning strip + readout | the room: name, room code, 240 m zone, clock |
| call lamp + state word | live / paused / full time / offline, always with words, never colour alone |
| transmissions | the field log; reports, tag claims and system events are the same log |
| roll call | the lobby roster — one column, one line per player, status at a glance |
| logbook | past hunts for this room |
| keycaps | every action; one cyan key per screen is the thing to press |

No fake frequencies, no invented signal strength, no radar/tactical cosmetics. The tuner strip is the only
graphic gesture and it marks sections, not data.

---

## 2. Visual system

### Colour — brand roles survive, warmth is the extension

| Role | Token | Dark | Light (proof) |
|---|---|---|---|
| ground | `--d-bg` | `#0E0C09` warm near-black | `#F7F9FC` chalk (brand light ground, not cream) |
| deep ground / map | `--d-bg-deep` | `#080706` | `#E9EEF6` |
| plate / raised | `--d-plate` / `--d-raised` | `#17130D` / `#201A11` | `#FFFFFF` / `#EEF2F8` |
| ink / dim / mute | `--d-ink` … | `#F3EBDA` bone / `#BDB09A` / `#8D816C` | `#0F172A` / `#475569` / `#7C8CA3` |
| field, time, primary action | `--d-cyan` | `#22D3EE` | `#0C6B84` |
| Prey / exposed | `--d-coral` | `#FF7A59` | `#B33A0F` |
| Hunters / closing in | `--d-violet` | `#A79BFF` | `#5B21B6` |
| live lamp, stale report, warmth | `--d-amber` (extension) | `#F2A33C` | `#8A5200` |

The brand semantics are unchanged: cyan = field/rule/time/primary, coral = Prey, violet = Hunters. Amber is a
direction-local extension used only for "live/attention" lamps and stale reports (the shipped app already uses
amber for stale reports). One cyan **filled** surface per screen (the primary key or the send key); team colour
is never the only cue — lamps always sit beside words, ready ticks beside "Ready".

### Type

- **Big Shoulders 700** — one display moment per screen: the permanent line, the clock, the winner word,
  the room code readout. Tight leading, tabular numerals.
- **Instrument Sans 400/700** — everything functional: titles, body, buttons, roster names, helper copy.
- **Red Hat Mono** — machine data only: clock-adjacent data, room code, timestamps, report ages, zone/radius,
  version lines, system log events. Never prose.
- **IBM Plex Sans Arabic** — Arabic proof only (falls through the stacks; Latin numerals/codes stay Latin).
- Scale: display 76/48/32/24, title 17/22, body 15/22, small 13/19, label 13/16, data 12/16, data-small 11/15,
  state 11/14 mono tracked, sentence case for headings/buttons, caps only for state words and true machine
  labels (`LIVE`, `PAUSED`, `FULL TIME`, `ZONE 240 M`, `PREY 2 / 2`, `HOST`, `YOU`).

### Layout and components

- 390 × 844 full-bleed page, 24 dp gutter, 8 dp rhythm; flat material — no gradients, shadows, glass,
  textures or glows; depth = plates, rules, overlap and scrim.
- **Tuning strip** (`.dial`): 1 px rule with 6 px tick marks, mono caps at each end. Marks section changes on
  every page and gives the direction its silhouette.
- **Rig header** (`.rig`): official mark + wordmark on first-contact pages; back/title/status elsewhere.
- **Readout** (`.readout` / lobby): room code as a mono frequency display, 40–42 px, tap-to-copy.
- **Keycaps** (`.key`): 56 dp flat plates with a 3 dp bottom rule; one filled cyan primary per screen. They are
  the only "button" shape in the system.
- **Lamps + tallies** (`.lamp`, `.tally`): 8 dp square lamps, 9 × 4 dp ready ticks — always paired with a word.
- **Transmission rows** (`.tx` in the field log): time gutter, sender name colour-coded by team with a word,
  body at 15/21; system events are centred mono lines between hairlines; own rows get a 2 dp cyan edge.
- **Map scope** (`.scope`): a drawn warm-ink field diagram with a zone ring, latest-report markers, a stale
  marker and a dashed trail; corner-anchored callouts and three flat map keys. It is labelled
  "not a live track" and carries © OpenStreetMap contributors, exactly like a stand-in should.
- **Sheets** (`.sheet`): full-page overlay state with a dimmed page behind, handle, amber "incoming" row,
  display title, body, consequence notice and keycap actions.

---

## 3. Page-by-page intent

1. **auth** — *Sign in.* The permanent line with the Open Zone mark, then a quiet two-field form (callsign,
   passcode). Three numbered steps explain the local account, opening a channel and the plain-HTTP relay below
   the form, so the page is quiet but not empty. Server row demoted to a mono line above the version.
2. **home** — *Host or join.* Two numbered sections on the channel: host (name, default rules, one cyan key)
   and join (six-cell code plate, one disabled key until six characters). Identity and version in a flat footer.
3. **roles** — *Sides.* The briefing: coral Prey row and violet Hunters row, an honest mode catalogue (Classic
   playable; Single Prey and Shrinking Zone marked "Coming soon" with unlit lamps), and the five-step hunt loop.
   One key: "Let's play".
4. **lobby** — *Roll call.* Room code as a frequency readout with ready tally (5/5), then a **single-column
   roll call** (Prey then Hunters, host/you tags, ready lamp + word) — a deliberate structure change from the
   two-up team sheet of A/B/C, so long names and badges never squeeze. Your side selector, compact room rules
   readout, and the begin dock with the everyone-ready line.
5. **hunt-hunter** — *Live, hunter.* Big cyan clock, state lamp + LIVE, zone and prey count data. The map scope
   carries the latest report (coral, with age), a stale report (amber, dashed), the trail and your own position.
   A peek strip repeats the freshest report in words, then the dock: status line, trails toggle and the one
   filled cyan key "Tag prey".
6. **hunt-prey** — *Live, prey.* Same board with no hunters or other-Prey data at all (the map shows only your
   own position and the zone). The honest cadence panel reads "5 min between reports · last sent 20:41" (no
   invented next-report countdown), an incoming tag claim strip stays visible, and the dock's only action is
   the field log.
7. **chat** — *Field log.* A transmission log: mono time gutter, team-coloured sender + team word, message
   body; system events (hunt started, head start over, tag claim) are centred mono lines between hairlines.
   Newest transmissions sit on the composer, like a live channel. Composer is a plate + one cyan send key.
8. **result** — *Full time.* FULL TIME state with the played duration (18:48) in ink, PREY 0 / 2 and the
   winner; giant "Hunters win."; final positions mini-scope; final teams (Tagged / In play); actions: Back to
   lobby, View hunt history, and a clearly-labelled **Rematch · Proposal** (needs a server action — flagged in
   §7). One cyan key.
9. **history** — *Past hunts.* One expanded match summary (date, duration, result, rosters) above the logbook
   grouped by night, with winner words in team colour, honest durations and a cancelled entry. Back to room key.
10. **settings** — *Settings.* A ruled manual: Display (theme, text size with preview line), Language, Permissions
    (allowed + manage), Updates (available version + download), Account (identity, relay read-only, cache, sign
    out). No tab chrome, no card stack; sections are hairlines.
11. **sheet-tag-claim** — *Incoming tag claim.* The prey hunt dimmed behind, then a bottom sheet: "Omar says he
    tagged you.", hunter/kind/time meta, the confirm-or-dispute lead, an "If you confirm" consequence notice,
    Confirm tag (cyan) and Dispute keys. Dismissing is honest: "No answer keeps the claim waiting in the field
    log." — no invented timeout.
12. **sheet-room-settings** — *Hunt rules.* The lobby dimmed behind; host-only sheet with timing steppers,
    play-area (Open/Zone) segmented control, zone radius stepper + zone centre "Pick on map", trails toggle and
    the server-enforced tag policy row; Save rules + Cancel.
13. **lobby-rtl** — *Arabic RTL lobby.* Genuinely mirrored: back arrow flips, code/readout moves to the reading
    start side, roll call order and lamps mirror, numbers/code stay LTR. Arabic copy is MSA, provisional — see §7.
14. **home-light** — *Daylight proof.* Same Home on the brand chalk ground with dark-on-light mark and darkened
    accents; no cream, no beige, no white flash.
15. **state-paused** (extra) — *Paused, hunter.* Muted clock and board, "Positions frozen at 41:12", pause banner
    with the host Resume action, all tagging disabled, field log still available.
16. **state-eliminated** (extra) — *Tagged, spectating.* LIVE continues, spectating state, position-sharing
    stopped, "You were tagged" banner, cadence panel shows when and by whom; the only action is the field log.
17. **state-offline** (extra) — *Offline, hunter.* Coral alert banner ("No connection… reports may be older than
    they look"), last-known board and map labels, stale-look callouts, tagging disabled with a retry.

---

## 4. States and honesty

- State words come from the server vocabulary: LOBBY, HEAD START (not shown on a canonical page here), LIVE,
  PAUSED, FULL TIME, CANCELLED. Colour is never the only signal: every lamp has a word.
- Reports are **latest reports**, never live tracking; the map is labelled "not a live track" and the drawn
  field is labelled a stand-in.
- Prey never sees another Prey's position (the prey scope only has own position + zone).
- Tag claims stay visible until answered; the sheet says dismissing keeps the claim waiting.
- No fake counts, ratings, urgency, safety/rescue claims or "secure/encrypted" language. The relay is described
  as the plain-HTTP test server it is.
- "Next report in" is deliberately **not** invented: the cadence panel shows the real interval plus the last
  sent time (a countdown would need new client state).

## 5. Accessibility and i18n

- WCAG AA contrast in both themes (bone on near-black ≈ 15:1; cyan on near-black ≈ 11:1; coral and violet
  text match ≥ 7:1 on dark; darkened accents in the light proof).
- Touch targets: 44–56 dp keycaps, 48 dp icon buttons and inline actions, 44 dp sheet steppers; nothing
  essential relies on hover.
- Body copy ≥ 13 sp, machine metadata ≥ 10.5 sp mono; no ALL-CAPS headings or buttons (caps only for state
  words/machine labels).
- Focus/selected states are visible: cyan underline on segmented controls, cyan current row edge in the log,
  `aria-checked`/`role="switch"` semantics in the markup.
- RTL: logical properties throughout; numbers/codes wrapped `.mh-ltr`; Arabic never tracked or uppercased.
- Light is a real token swap, not a filter.

## 6. Compose / feasibility notes

- All components are ordinary Compose primitives: Column/Row/Box, Text, Outlined/Text buttons with a flat
  bottom border for keycaps, Canvas for the tuning strip and lamps. No blur, elevation, gradients or custom
  shaders needed.
- The map scope is drawn SVG here. In the app it would be the existing `MatchMap` (OSM tiles) with the same
  overlay callouts/chips; the drawn plate is a labelled stand-in for the design review, as in A/B/C.
- Fonts already ship (Big Shoulders, Instrument Sans, Red Hat Mono). The amber extension is one extra token
  pair; the light values map onto the shipped light palette with darkened accents.
- Sheets are full-screen states in Compose (same pattern as the shipped `MatchSheet`), not dialogs.
- The roll-call list (single column) is cheaper than the two-up team sheet and handles long names better.
- The tag-claim countdown is deliberately absent, so no new timer/engine work is implied. Rematch is marked as
  a proposal; it needs a server/API addition and is **not** implemented.

## 7. Deliberate choices, known limits, open questions

- **Drawn map stand-in**: the field map is original vector/CSS work, honest about being a stand-in. No OSM tiles
  are copied into the mock pages.
- **Rematch** is shown as a proposal with a note that it needs a server action; the shipped app has no rematch.
- **Arabic copy is provisional.** Existing app translations were reused where they exist (lobby nouns, ready,
  begin, stand down, role names). New strings introduced by this direction's framing need Arabic review:
  "نداء الحضور" (roll call), "اختر جانبك قبل البدء", "قواعد الغرفة", "تعديل القواعد", "اضغط للنسخ",
  "رمز الغرفة", "مطاردة كلاسيكية", "مفعّلة", "البدء" — flag: **[NEW COPY — needs Arabic review]**.
- **The radio metaphor is framing only.** Domain vocabulary stays the app's: Prey, Hunters, Hunt, Room, Code,
  Zone, Trail, Report, Tag, Full time, Huntmaster. No "frequency" appears in place of "room code"; the rig and
  dial use mono captions, not invented data.
- **Host identity** is Omar throughout (auth callsign, home "Playing as Omar", lobby HOST · YOU, hunter scope);
  `hunt-prey` and `sheet-tag-claim` are the Prey player's view of the same room, as in the other directions.
- **No tab chrome in the lobby.** The direction treats the lobby as a roll call and the field log as its own
  channel page; the existing Game/Chat tab convention is deliberately not reproduced (the field log is one tap
  from the hunt and lobby headers).
- **No "empty lobby" page** in the canonical set, so blockers/empty team states are described in the components
  rather than shown; if the owner wants state coverage expanded, the same roll-call component handles it.

## 8. Verification

- 17/17 pages rendered at exactly **1170 × 2532 px** (`render.mjs`), no page-overflow warnings, no font or image
  failures; every page checked against the 390 × 844 canvas for content clipped below the fold (none).
- Automated geometry audit over all pages: zero clipped visible text, zero content outside the canvas, no
  control-column drift on repeated rows, no interactive collisions. Remaining line-box intersections are
  font-metric overlaps between stacked board lines (verified visually; no ink collision).
- Contact sheet generated by `env/contact-sheet.mjs`; extras appear in the matrix and page strips.
- Direction A/B/C sources and evidence were not modified; only this folder and the regenerated environment
  pack entries for the new direction were added.
