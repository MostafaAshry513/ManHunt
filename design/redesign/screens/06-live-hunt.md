# 06 — Live hunt (map, HUD, reports, tag flow)

**Route:** `Route.Room` while a match is active (tactical page of `RoomScreen.kt`: `TacticalHuntPage`,
`MatchMap`, `HuntSheet`, `HuntActionBar`, `BrandMapMotion`).
**Purpose:** play the hunt. A glance must answer: how long is left, where is the zone, who am I, where are
the reports, and what is my one action. Everything else is one touch away.
**Primary action:** Tag prey (Hunters). **Prey has no action in the rules** — the Prey dock is a status, not a
button; do not invent a gameplay action.

**Old problem being fixed:** tiny HUD chips in the top-left, a duplicated clock/status inside the bottom
sheet, a 26 dp-radius sheet with a drag handle that *is* the command surface, tag buried in an expandable
area, and no visual hierarchy between "what the game is doing" and "what I can do". New: the Board owns the
game state; the map is the field; the dock owns the action; the sheet is the drawer.

---

## 1. Hierarchy

1. **Board (`Live`)** — state + clock (44–56 sp) + zone radius + prey count (Hunters only). Pinned, full-bleed.
2. **The field (map)** — full-bleed below the Board: own position, zone ring, prey reports/trails (Hunters),
   no card, no margin. The visual proof that this is a real-place game.
3. **The dock** — one action: `Tag prey` (Hunters, 56 dp cyan) + a secondary line (`Trails on` toggle is in
   the sheet, not the dock); Prey: status text only ("Sharing your position every 5 min · last report 20:41")
   + no button. Host: `End hunt` lives in the sheet, never in the dock.
4. **Pending claim/dispute strip** — cut in directly above the dock, persistent until answered.
5. **The hunt sheet** — persistent bottom peek (`Details`): one-line status, zone-shrink countdown, last
   report age, OSM attribution, expand for roster/prey list/host controls.
6. **Tag flow** — a modal `MatchSheet` over the map (target list → confirm), not a list buried in the sheet.

---

## 2. Layout (Hunters, phone)

```
┌───────────────────────────────────────────────┐
│ ● LIVE                    ZONE 240 m          │  MatchBoard Live, full-bleed
│ 41:12                     PREY 2 / 2          │
├───────────────────────────────────────────────┤
│                                               │
│                THE FIELD (map)                │  full-bleed; osmdroid + Deep Teal filter
│      ○ own position (chalk dot + ring)        │  zone ring cyan, dashed on shrink
│         ▒▒ zone fill 8 %                      │  coral prey dots + report rings
│      ● Yasmin  (fresh, ping)                  │  coral trail (58 %)
│         ───── trail ──────                    │
│      ● Leila (stale, dashed ring)             │
│                          [+] [−] [◎]          │  map controls, 48 dp, end edge, above sheet
│                                               │
│  ┌─────────────────────────────────────────┐  │  pending claim strip (coral, 2 dp top rule)
│  │ Omar says he tagged you.      REVIEW     │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │ ● 2 prey still out · last report 12 s    │  │  HuntSheet peek 72 dp: status + expand chevron
│  │   Zone 240 m · shrinks in 04:12    ⌄     │  │
│  └─────────────────────────────────────────┘  │
│  ┌─────────────────────────────────────────┐  │
│  │                Tag prey                 │  │  56 primary, bottom dock
│  └─────────────────────────────────────────┘  │
│  © OpenStreetMap contributors                 │  data.small inside sheet peek
└───────────────────────────────────────────────┘
```

Expanded sheet (max 60 %, scroll):
```
│  ──── gesture rule ────                       │
│  Prey reports                                 │  title
│  ● Yasmin    fresh · 12 s ago · ±6 m          │  report rows; stale rows coral 45 % + dashed glyph
│  ● Leila     stale · 14 min ago · ±22 m       │
│  ● Sara      tagged                          │  chalk 30 % + cross tick
│  ─────────────────────────────────────────── │
│  Zone 240 m · shrinks in 04:12                │  data
│  Trails                     [on/off switch]   │  hunters only; real setting
│  ─────────────────────────────────────────── │
│  HOST CONTROLS                                │  only host: pause/resume, end hunt, rules
│  [ Pause hunt ]  [ END HUNT ]                 │  secondary 48 / destructive 48
│  ─────────────────────────────────────────── │
│  Hunt roster                                  │  TeamSheet compact / rows
│  © OpenStreetMap contributors                 │  clickable
```

### 2.1 Prey layout differences

- Board gutter: **no prey count** (Prey never sees how many others are alive — that's Hunter information);
  show only `ZONE 240 m` (+ phase).
- Dock: no primary; a status panel:
  `SHARING POSITION` (state style) `Every 5 min · last report 20:41. Keep moving.` in `body.small`; if
  location is off/denied, this becomes the GPS recovery action ("Turn on location").
- Map: own position + zone only; no prey/hunter markers (server privacy), no trails.
- Sheet: phase/clock/zone-shrink line, your report cadence/timer next report, tag claim if any, roster, rules
  reminder, OSM attribution. No "tag" action.
- When tagged: full-width strip `Tagged. You're out.` + dock status "Spectating. The hunt continues." — no
  action, no red flash; the map stays (own position only).

### 2.2 Head start

- Board state `HEAD START`, clock counts down the head start, dock: Hunters "Prey are hiding. Hunt starts in
  {t}." (status, no button yet); Prey: "Hide. You have {t}." + sharing status may not have started.
- Map shows zone + own position; prey reports appear only when hunting starts (server).
- When hunting starts, Board cuts to `LIVE`; the hunter dock's Tag button appears (enabled); haptic tick.

### 2.3 Tag flow (Hunters)

1. Dock `Tag prey` (enabled if any prey eligible; disabled otherwise with the honest reason).
2. **Target sheet** (modal): title "Who did you tag?"; body "Pick the player you physically tagged. They'll
   confirm it."; list of eligible prey rows (avatar, name, status) — max 8, scroll; cancel via `×`/back.
3. **The row is the action.** One tap sends the tag request; no second confirmation sheet — this happens in
   the field, the Prey must confirm server-side anyway, and an extra tap would slow a physical tag. The sheet
   closes on tap, haptic confirms. (The old flow's list did the same; the redesign only restyles it.)
4. Request sent: dock becomes `Waiting for {name}` disabled + status "Waiting for them to confirm."; the
   pending strip appears on the Prey's screen (claim). Hunter can continue playing; the request expires
   server-side (show `data` "Expires in 90 s" only if the server provides it).
5. Confirmed: prey marker becomes eliminated; Board prey count updates instantly + one rule sweep; haptic.
6. Disputed: admin gets a dispute strip (violet) "A tag is disputed." → review sheet; hunter sees "Disputed —
   waiting for the huntmaster." status; no duplicate claims (server 409 → show the existing claim status).
7. No eligible prey: Tag disabled + reason in dock; map still live.

**Target list must not include**: yourself, eliminated prey, players already in a pending claim (server state),
or players marked offline? — offline prey are still valid targets in the real world; keep them but show status.

### 2.4 Claim / dispute strips (Prey, admin)

- **Prey claim strip** (coral): `{Hunter} says he tagged you.` + `REVIEW` inline (48 dp) → Claim sheet:
  title "{Hunter} tagged you."; body "Confirm it if it happened. Dispute it if it didn't — the huntmaster
  decides."; primary `Confirm tag`, secondary `DISPUTE`. (Wording gender-neutral: "they"; Arabic neutral/
  masculine plural per copy rules.)
- **Admin dispute strip** (violet, 2 dp top rule): `A tag is disputed.` + `REVIEW` → Dispute sheet: both sides,
  "Confirm tag" / "Reject tag", consequence line "This ends {name}'s hunt." / "This keeps {name} in the hunt."
- Strips persist above the dock until answered; they never block the map; they are not toast/auto-dismiss.
- If the strip concerns you and the result would end your hunt, the sheet title states it.

### 2.5 Hunt controls (host)

- Pause sheet: "Pause the hunt?" body "The clock stops for everyone until you resume." primary `Pause hunt`,
  secondary `Keep playing`. When paused, Board `PAUSED` + frozen clock + a full-width chalk strip under the
  Board "Hunt paused. Clock stopped." (no modal).
- Resume: dock/Board? Resume action in the expanded sheet + the paused strip has `RESUME` inline (48) — the
  only time a secondary action is allowed near the dock.
- End hunt sheet: "End the hunt for everyone?" body "The current result is final. Players can't rejoin this
  hunt." primary destructive `End the hunt`, secondary `Keep playing`.

---

## 3. Components

| Element | Spec / reuse | Test tag |
|---|---|---|
| Board | shell §2.1 `Live` variant; clock `board.clock`; state may be HEAD START/LIVE/PAUSED | `board`, `board_clock` |
| Map | existing `MatchMap` (`showAttribution = false`, `roundedCorners = false`, full-bleed, fitPadding = Board + dock); Deep Teal filter; existing overlays + `BrandMapMotion`; **no card, no margin** | `match_map_card` (keep) |
| Map controls | 40–48 dp chalk square controls, end edge, above the sheet: zoom +, zoom −, recenter (`◎` = `zone`/location FieldMark); 1 dp border, no shadow | `map_recenter`, `map_zoom_in`, `map_zoom_out` |
| HuntSheet (persistent) | peek 72 dp: status `body.small` (2 lines max) + expand 48; expanded: prey reports, zone shrink, trails, host controls, roster, attribution; NOT modal; 2 dp top corners; 1 dp top rule; max 60 % height; scroll inside | `hunt_sheet`, `hunt_sheet_expand`, `hunt_attribution` (keep) |
| Tag dock | `BoardButton` primary 56 `Tag prey`; disabled + reason when none; waiting label when pending | `hunt_tag_button` (keep) |
| Prey dock | status panel: `StateTag SHARING POSITION`? — no: `data` label + two-line `body.small`; GPS recovery button when needed | `hunt_prey_status` |
| Target sheet | `MatchSheet` + list of target rows (56–64 dp, avatar+name+status; the row itself is the action) | `tag_picker`, `tag_target_{id}` |
| Claim sheet | `MatchSheet` title "{Hunter} tagged you." primary `Confirm tag` secondary `DISPUTE` | `tag_claim` |
| Dispute sheet | `MatchSheet` title "Resolve the disputed tag." two actions | `tag_dispute` |
| Claim/dispute strip | full-width plate, 2 dp top rule (coral for claim, violet for dispute), title + inline `REVIEW`; 1 line, wrap to 2 | `hunt_claim_banner`, `hunt_dispute_banner` (keep) |
| Tagged strip | full-width `plate` with 2 dp `chalk` top rule: "Tagged. You're out." + `Spectating.` | `hunt_tagged_notice` |
| Paused strip | full-width plate with 2 dp cyan top rule: "Hunt paused. Clock stopped." + `RESUME` inline (host only) | `hunt_paused_banner` |
| Location strip | full-width strip when GPS off/denied: plain reason + `Turn on location` / `Open settings` (48) | `hunt_location_banner` |
| Attribution | `© OpenStreetMap contributors`, `data.small` muted, 48 dp hit, opens copyright URL; inside sheet peek (collapsed) and expanded | `hunt_attribution` (keep) |
| Connection state | 1 dp rule under Board + `data` line "Connection lost. Reconnecting…" or "Last update N s ago"; no spinner over map | `hunt_connection` |

Removed: `HudChip` pills, `TacticalHud` chips, the duplicated timer/phase in `HuntSheet`, `ScreenScrim` gradients,
the 26 dp sheet radius, "Tactical" vocabulary, the pills in `HuntActionBar`, `PAUSE`/`END` inside the collapsed
peek (moved to expanded host controls).

---

## 4. Copy intent

| Slot | English | Notes |
|---|---|---|
| Board | `HEAD START` / `LIVE` / `PAUSED` / `FULL TIME` | state words; localise |
| Board (Prey) | `ZONE 240 m` only | no prey count for Prey |
| Prey dock | `Sharing your position every 5 min. Last report 20:41.` | factual; no "safe/private" |
| Hunter dock | `Tag prey` / `Waiting for Yasmin` | action + object; word "tag" matches game verb |
| Dock reason | `No prey left.` / `No prey to tag yet.` | honest states |
| Head start | `Prey are hiding. Hunt starts in 2:40.` | Prey: `Hide. You have 2:40.` |
| Claim strip | `{Hunter} says he tagged you.` → neutral: `{Hunter} says they tagged you.` | avoid gendered assumption; Arabic neutral forms |
| Claim sheet title | `{Hunter} tagged you.` | consequence |
| Claim body | `Confirm it if it happened. Dispute it if it didn't — the huntmaster decides.` | plain, no accusation |
| Tag target | `Tag {name}?` / row tap sends; body "Pick the player you physically tagged. They'll confirm it." | the Prey confirms; no extra hunter confirmation |
| Waiting | `Waiting for {name} to confirm.` | data line with expiry if server provides |
| Paused | `Hunt paused. Clock stopped.` | no blame |
| Tagged | `Tagged. You're out.` / `Spectating. The hunt continues.` | exact game truth (one prey eliminated, not the round) |
| Zone | `Zone 240 m · shrinks in 04:12` | English `·` allowed; Arabic use full stop/newline |
| Location | `Location is off. Hunters can't see you and reports won't send.` | honest; permission ask says why |
| End | `End the hunt for everyone?` / `The current result is final.` | consequence in title |
| OSM | `© OpenStreetMap contributors` | required, never removed/cropped |
| Errors | `Couldn't send the tag. Try again.` / `Couldn't pause the hunt. Try again.` | no apology, next move |

Prohibited: "TACTICAL", "SURVIVE", "safe", "hunter elite", "target acquired", military/weapon language, "You
are being hunted" as an app string (it is campaign copy), fake distances, fake "nearby" data.

---

## 5. States

| State | Design |
|---|---|
| Map loading (tiles/first fix) | Last known map / field ground + `data` "Loading map…" in the sheet peek; no full-screen spinner; once loaded, no shimmer. |
| No location permission / services off / no fix | Location strip above dock: reason + `Turn on location` (permission) or `Open settings`; Board stays; map shows zone and last known own position (if any) with a hollow own marker; no tag disabled? — tag still possible if server allows; keep enabled if eligible, because the game can be played without own GPS? Prey must report; Hunter needs map. Spec: for hunters with no location, Tag remains enabled only if target list is available; reason line explains own-position missing ("Your position is unknown. Show location to see yourself on the field."). |
| No prey reports yet (Hunters) | Sheet peek: "No reports yet. Prey report every {n} min."; map shows zone; Tag disabled with "No prey reports yet."? — tag eligibility comes from server member state, not reports; keep Tag enabled and dock reason only if server says none. Do not invent. |
| Stale reports | Prey marker coral 45 % + dashed ring; sheet row "stale · 14 min ago"; no ping; a `data` warning "Reports are stale. Positions are the last known." |
| Eliminated prey | marker chalk 30 % + cross tick; sheet row `tagged`; not targetable. |
| Pending tag | strip on prey; hunter dock waiting; admin dispute strip; sheets per §2.3. |
| Paused | board PAUSED, clock frozen, paused strip; map static; tag/trails disabled (server enforces); resume available (host). |
| Offline/reconnecting | 1 dp rule under Board, `data` "Connection lost. Reconnecting…", last update age; actions that require server show busy → error; map keeps last positions with age. |
| Match end | cut to `ScorePage` (08); no dialog over the map. |
| 320 dp / 2× | Board stacks; map controls collapse to recenter + zoom in a vertical stack; sheet peek grows to 96; dock label 2 lines; tag target rows wrap. |
| RTL | Board mirrored (state right, data left, clock start-aligned right); map geographically correct (not mirrored); markers keep shapes; sheet mirrored; tag target rows mirrored; `×`/back mirrored; numerals LTR. |
| Light | map uses same Deep Teal tiles (map is always dark? — a light theme map would need a light tile filter; out of scope: keep the Deep Teal map in both themes, it is a field at night; the surrounding chrome/Board adapts). Document: in light theme, Live Hunt keeps the dark map and ink Board, with white dock/sheet. This must be a deliberate, consistent rule and listed in adaptation. |
| Reduced motion | static markers, no pings/sweep, zone/trail complete, camera jumps; all info in text (age in sheet). |

---

## 6. Compose implementation notes

- Keep `MatchMap` public API and the existing `testTag("match_map_card")`; pass `showAttribution = false`,
  `roundedCorners = false`, `fillMaxSize()`. Do not wrap in a Card; the map is a direct child of the `Box`
  between Board and dock.
- `TacticalHuntPage` structure: `Column { MatchBoard(); Box(weight 1f) { MatchMap(); MapControls(); } ;
  HuntSheetPeek(); BottomDock() }` — the map must not extend under the Board/dock (inset them; no
  `fillMaxSize` overlay). Existing `ScreenScrim` calls are removed.
- Keep `BrandMapMotion` overlays, but rename/param only if needed; do not regress 30 fps cap, reduced-motion
  static, no per-frame allocations. Add: report ping, stale dashed ring, eliminated cross tick, zone stroke
  2 dp + 8 % fill.
- `HuntSheet`: use a persistent `Surface` with `Column` + `AnimatedVisibility(detailsExpanded)` height
  animation 240 ms `enter`; `rememberSaveable(match.id)` for expanded state (existing). Do **not** use
  `ModalBottomSheet` for it (it must not block the map); modal `MatchSheet` only for the tag/claim/dispute/
  pause/end/rules dialogs.
- Timer: reuse `CountdownText` (sleep to next second) but move it into the Board composable; the Board reads
  its own ticker so the whole screen doesn't recompose each second. Freeze on PAUSED.
- Tag flow: keep existing `showTagPicker`, `pendingTag`/`pendingDispute` state and VM actions
  (`requestTag`/`confirmTag`/`disputeTag`/`resolveDispute` names may differ — use what exists). Do not change
  endpoints or payloads. Keep `testTag`s: `hunt_tag_button`, `tag_picker`, `hunt_claim_banner`,
  `hunt_dispute_banner`, `hunt_attribution`.
- Claim/dispute strips: place above `HuntSheet` in the bottom column, not inside the map, so they never cover
  prey markers/gestures. Coral for claim (prey), violet for dispute (hunters/admin), both text+action.
- Map fit: on first frame fit zone + reports + own position with Board/dock padding (`fitPadding`); add a
  recenter control; never re-fit automatically on every report.
- Semantics: map gets a text alternative (`contentDescription` built from own team, zone radius, number of
  fresh/stale reports and their ages, never hidden prey); Board `stateDescription`; strips `liveRegion`;
  tag button's `stateDescription` includes disabled reason.
- Insets: root handles status/nav; the doodle dock adds `navigationBars`; sheet expanded adds `ime` if it ever
  contains a field (it does not; still safe).
- Battery/lifecycle: pause map motion and the clock UI updates when not RESUMED; do not poll faster than the
  existing VM; no new threading.
- Attribution: keep visible in the collapsed peek (as today); text `data.small` on `plate`, clickable to
  `https://www.openstreetmap.org/copyright`. Never cover it with the dock.

---

## 7. Premium screenshot brief

- **Shot A (hero, Hunters):** dark, 1080 × 2400. Real OSM tiles (network on emulator), city park/street at
  dusk; zone ring 240 m; two coral prey markers (one fresh with ping, one stale dashed); coral trail; Board
  `● LIVE 41:12`, `ZONE 240 m`, `PREY 2 / 2`; dock `Tag prey`; sheet peek with status + attribution.
  Status bar 21:04. **This is the single most important screenshot of the redesign.**
- **Shot B (Prey):** same field, Board without prey count; dock status "Sharing your position every 5 min.
  Last report 20:41."; claim strip if we want to show the tag beat — a separate capture: coral strip
  "{Hunter} says they tagged you." + REVIEW.
- **Shot C (tag target):** map + `Who did you tag?` sheet over it (believable names, two team tags visible;
  the sheet body states the Prey will confirm).
- **Shot D (expanded sheet):** prey reports list with ages/accuracy, zone shrink, host controls (or trails).
- **Shot E (paused):** PAUSED board + paused strip.
- **Shot F (Arabic RTL):** mirrored board/dock/sheet, map not mirrored, code/clock LTR.
- **Reject:** blank/checkerboard map tiles, HUD pill chips, "Tactical", fake distances, no attribution, grey
  osmdroid default markers, a sheet covering the map entirely.

---

## 8. A11y / RTL / adaptive checklist

- The map's text alternative must include: team, zone radius and shrink time, each prey's status/age
  (Hunters only), and own-position state. Hidden prey must never appear in semantics.
- Clock is not announced every second (`liveRegion = None`, update `stateDescription` at minute boundaries).
- Strip actions 48 dp; dock 56; map controls 48; tag target rows 56; sheet title heading.
- Contrast: report ages `data` muted 8.3; coral claim strip title chalk on plate with 2 dp coral rule (not
  coral body text); violet dispute same; live dot cyan on board 10.4.
- One-hand: Tag is the bottom 56 dp bar; no map control in the thumb area except recenter at the lower end.
- Tablet ≥840: map fills the content area; sheet can be a right-side panel (360 dp) instead of a bottom sheet;
  Board full width; dock is a start-aligned 560 dp button within the panel, not a full-width bar.
- Landscape phone: Board 84 dp, map fills rest, peek 56 dp, dock 72 dp; no fixed map height.
- Tabletop/fold: map top pane, sheet/dock bottom pane; do not split the Board across the hinge.
- Arabic: state/clock LTR for digits; team names Arabic; tag/claim wording neutral; a `·` in the status line
  must become a line break; numbers and "m" localise (use `t("m")` existing).
