# Round-1 UX / accessibility / engineering-feasibility review

**Reviewer:** reviewer-ux · **Workstream:** ManHunt UI/UX redesign v2 · **Round:** 1 · **Date:** 2026-11-04
**Scope:** interaction & flow UX, accessibility + RTL/i18n, engineering feasibility, with a cross-check on
hierarchy and system consistency. Visual/brand/depth ownership stays with reviewer-visual
(`reviews/round-1-visual.md`); our tables are scored independently and reconciled afterwards.
**Rubric:** `briefs/02-evaluation.md` + `skills/REVIEW_RUBRIC.md` (anchors, §2 automatic caps, §3 acceptance,
§4 page checklist, §5 system checks) + `skills/PAGE_INVENTORY.md` §18 state matrix / §20 brief-vs-shipped deltas.
**Method:** cold page pass (C→A→B order, per `prep-visual.md` §1) at full size from
`env/out/pages/<direction>/*.png` (all 42/42 at exactly 1170×2532), plus a read-only Playwright audit
(`reviews/tools/ux-audit.mjs` → `reviews/evidence/ux-audit*.json` / `ux-audit-summary.md`): computed contrast
with effective backgrounds (AA-body / AA-large / metadata-7:1), real touch-target boxes (including
`cursor:pointer` spans), sub-11 sp text, clipping/page-overflow, fixed-width/absolute inventory, directionality
+ Arabic typography (face/tracking/uppercase), RTL-unisolated numeric runs, CSS techniques that Compose cannot
take as-is, cyan-surface count, seed data, dev/fake-content scan, `403`/font errors, and indicative forced-320 dp
+ 200 % text stress. Findings are tagged `[rendered]`, `[measured]`, `[inferred]`, `[needs device]`.
**Independence:** these numbers were written before reading reviewer-visual's scores. My table lives at
`reviews/scores-round-1-ux.json`; `reviews/scores-round-1.json` (canonical) and `scores-round-1-visual.json` hold
reviewer-visual's table (a filename collision was resolved after round 1). Reconciliation is recorded in §5.1 here
and in `FINAL-RECOMMENDATION.md` (task-12); dissent is preserved there.

## 0. Delivery gate (rubric §3) — pass with notes

| Check | A | B | C |
|---|---|---|---|
| 14/14 canonical pages, exact 1170×2532, no font/render errors | ✅ | ✅ | ✅ |
| NOTES has thesis / per-page intent / rejected / Compose / weaknesses / states | ✅ | ✅ | ✅ |
| Same seed "Riverside Run · K7M2QX · 240 m zone · 41:12 · Nadia/Omar/Selim/Rana/Youssef" | ✅ | ✅ | ✅ |
| Light + RTL proofs genuinely rendered | ✅ (strong) | ✅ (but see Arabic type) | ✅ (strong) |
| Contact sheet / env pack current | ✅ | ✅ **pre-review a11y pass** (re-rendered 19:41–19:42 UTC; composition unchanged — audited against current `out/`) | ✅ |

All three are reviewable. The only delivery defects are small render bugs: A `history` content is clipped by
~10 px (`390×798` in `390×788`), A `sheet-room-settings` scroll body clipped by ~6 px, C `lobby`/room-rules
manifest row clips "Nadia" (`42×20` in `39×20`, nowrap overflow), B `settings` runs 12 px past the canvas
(`scrollHeight 856 > 844`). None changes a verdict; all are cheap fixes.

---

## 1. Direction A — "Matchday, raised"

**Weighted total (my table): 3.75 / 5.** Read as: the most complete and buildable system of the three, with a
real, measurable accessibility debt below its own stated floor, and three content-truthfulness bugs a round-2
pass must clean up.

| Axis | Score | Evidence |
|---|---:|---|
| Brand & product fit *(secondary read — reviewer-visual leads)* | 4 | Board/team-sheet/code grammar unmistakably ManHunt; the raised scale is visible in `hunt-hunter`/`result`; brand line in `auth`/`home`. |
| Distinctiveness / memorability *(secondary)* | 3 | Visibly "raised" v0.16, but the silhouette is still the shipped one; would not be recalled as a new language the way B/C are. Defer. |
| Hierarchy & clarity | 4 | Clock 68 first on hunt pages; one cyan action; settings is the only page where the eye has to work. |
| System consistency | 4 | One grammar across 14 pages; deviations documented (`§13`); two one-offs: 40×22 switches, proof-state mismatch. |
| **Interaction & flow UX** | **4** | All canonical states + the host-side controls the others miss (side switch "You're on this side / Join Hunters", "Stand down", Begin + blocker line); claim re-entry documented; no dead end found. Gaps: leave/back-confirm undocumented (S2), claim shows no expiry/time (S2). |
| **Accessibility & RTL/i18n** | **3** | AA text pairs pass, RTL is the strongest mirror of the three, map has an honest `aria-label` summary incl. "other players are not shown" on prey — but see §1.2: **92 sub-11 sp nodes + 36 metadata pairs below 7:1 + 4 sub-48 dp controls + Arabic letter-spacing that contradicts the direction's own "no tracking" rule**. |
| **Engineering feasibility** | **4** | Reuses `MatchBoard`/`MatchSheet`/`ScorePage`/`TeamSheet`/`CodePlate`; every datum maps to `Models.kt`; no engine work; 6 small S2 truthfulness/implementation notes (§1.3). |

### 1.1 Top 3 strengths
1. **The most usable host flow.** Only A renders the host as a player (Stand down), the side-switch action
   ("You're on this side" / "Join Hunters"), the Begin blocker line and a leave path on the lobby — the others
   leave real lobby actions unrepresented. That matters more than any visual flourish.
2. **Honest data discipline.** Result uses "Prey remaining 0 / 2" + "18:48 played" and no invented survivor
   stats; history shows only date/time/duration/winner/roster — it explicitly refuses the per-match survival
   score the other two invent; "Play again" is a quiet flagged proposal, not a fake primary action.
3. **System is buildable as drawn.** Component→shipped-composable mapping is complete (`NOTES §14`), motion is
   reducible to hard cuts, and the only illustrative map is flagged as a drawn stand-in. An engineer can start
   without a discovery phase.

### 1.2 Top 3 problems + concrete fixes (highest severity first)
1. **The type floor is systematically broken (S1).** 92 text nodes below 11 sp — the `data.small` 10.5 sp token
   (`v0.16.1 · free APK…`, board gutters "Zone/Prey/Remaining", chat time gutter "20:44", history summary,
   room-rules unit labels) and a 9.5 sp settings footer. At arm's length at night that is below the brief's
   auxiliary floor (≥12 sp) and below `skills/TOKENS.md`'s own minimum (11 sp). **Fix:** raise `data.small`
   10.5→11 (and the footer 9.5→11), reduce tracking proportionally; no layout change needed — recompute line
   heights only.
2. **Metadata contrast below the 7:1 rule (S1/S2).** 36 computed pairs at 5.34:1 (muted `#A7B6CC` at 10.5–12 px
   on the ink board/field: board gutters, "Ready", "Invite code", "Full time", "Winner", "Played", tag-claim
   meta). ≤12 sp metadata is required to be ≥7:1. **Fix:** use a lighter muted token (`#C3CEDF`-class) for
   ≤12 sp labels or lift them to 12 sp and keep 4.5:1; one token change fixes every board.
3. **Touch targets:** "View hunt history" 342×44, "Sign out" 342×44, room-rules switches 40×22 (S1) — the two
   switch targets are the *smallest interactive target in the whole pack while sitting in the rules sheet the
   host uses before a hunt. **Fix:** `heightIn(min=48)` on buttons and a ≥48 dp hit wrapper around the switch
   (visual can stay 40×22).
Also: Arabic letter-spacing (`arabic-h` class computes 0.12–1.05 px on "رمز الدعوة", "ابدأ المطاردة") contradicts
`NOTES §3.1` "no tracking" (S2) — set `letter-spacing: 0` for Arabic and re-render `lobby-rtl`; the proof is
otherwise the best of the three (mirrored rules/rows/dock, LTR code + numerals, Arabic face).

### 1.3 Data-truthfulness / feasibility flags (all S2, fix before round-2 render)
- **Room-rules zone centre shows fake geography:** `East gate · 51.5007, -0.1246` — London coordinates and an
  invented place label in a Riverside Park (NYC) room. Use the real `zone.centerLat/Lng` or "Zone centre not set"
  (both are shipped states). This is the kind of detail that reads as "not real" to the owner.
- **`home-light` is a different state from `home`:** `home` shows the join code empty + hunt name "Riverside Run";
  `home-light` shows the code K7M2QX filled and the name empty. The proof must be the same Home state (brief:
  "same Home in daylight chalk"); re-render the light proof from the same HTML data.
- **Hunt-prey "last report 20:41 / next 20:46" needs client state that is not in the contract** (own report
  timestamps are not returned to the player; the phone can track its own sends, but that is new client state).
  `NOTES §4` claims it; the render shows only "last report 20:41". Flag it as small client work or show only the
  interval ("Reports every 5 min") — the honest minimum.
- **Leave/back confirm not documented:** lobby/hunt use a back arrow as the only leave affordance; no confirm
  sheet, no "you will lose your spot"/abandon copy or state in NOTES (§6 doesn't mention it).
- **Claim expiry absent:** the 90 s `expiresAt` exists in `PendingTagDto` and the claim sheet shows only
  "raised at 20:52" — a player who waits is silently pushed into a huntmaster dispute. Cheapest win in the pack
  (§4).
- **Map text alternative is a summary, not the shipped `PreyStatusCard` list:** "Two reported prey positions,
  one fresh and one stale" is honest but a screen-reader hunter cannot get *which* prey and how old. Add the
  per-prey status list (C has the pattern) — UI_AUDIT UI-03 is the one audit finding that blocks a user group.
- Minor render bugs: history body clips 10 px; room-rules sheet scroll body clips 6 px; result board has no
  text alternative for the drawn trail plate (allowed stand-in, label it).

### 1.4 Worst pages
1. **`sheet-room-settings`** — the two 40×22 switch targets + fake London coordinates + 18 sub-11 sp labels +
   6 px clipped scroll body; the most S1/S2 items on one page.
2. **`history`** — 15 sub-11 sp nodes + the ~10 px clipped body (and it is otherwise the most honest history of
   the three, so the clip is a shame).
3. **`settings`** — dense, 9.5 sp footer, 44 dp Sign out; strong content, needs the type/target pass.

---

## 2. Direction B — "Street signal" (scores against the pre-review a11y-pass re-render, 19:41–19:42 UTC)

**Weighted total (my table): 3.50 / 5.** Read as: the most memorable voice and the best field-log/poster
composition, undermined by one data-contract violation on the live map and a lobby flow that cannot actually
run a hunt without controls the design leaves out.

| Axis | Score | Evidence |
|---|---:|---|
| Brand & product fit *(secondary)* | 4 | Street-print ManHunt, unmistakable; flat colour + oversized display; not another app. |
| Distinctiveness / memorability *(secondary)* | 5 | The most ownable of the three at thumbnail: coral/violet team blocks, taped code, stamped full time. |
| Hierarchy & clarity | 4 | One big object per page; hunt/claim drop to the calm register; the claim sheet's loudest element is a generic "Tag claim" instead of the consequence (see §2.4). |
| System consistency | 4 | Two-register system is real and holds on 14 pages; deviations documented; team counters on `roles` break its own contrast pattern. |
| **Interaction & flow UX** | **3** | Best-in-class chat/log and claim-dismissal note, but **the canonical lobby has no ready/unready control for the host (S1)** and no side-switch action; room-rules frame omits the zone-centre/map-picker controls (self-documented trim). |
| **Accessibility & RTL/i18n** | **2** | **16 sub-48 dp controls across 10 pages** (incl. 32 dp targets for "Review tag claim", "View hunt history", "Rematch", "Play Classic instead"), a real AA failure (12 px "2"/"3" at **3.92:1** on team fills in `roles`), 3 unisolated numeric runs in `lobby-rtl`, Arabic labels set in Red Hat Mono and letterspaced although NOTES says "no tracking". |
| **Engineering feasibility** | **2** | **Capped (rubric §2.2/§2.7): invented live data.** `hunt-hunter` draws two violet "other hunter" markers; the data contract has **no hunter positions** (only `LatestPreyStatus`; server shares prey positions to hunters only). `history` invents per-match "PREY 0/2 / 2/2", which `MatchHistoryEntry` does not carry. The rest maps cleanly (tape/stamp = `graphicsLayer` rotation, flat blocks, no engine work). |

### 2.1 What the pre-review a11y pass fixed (recorded as required)
B re-rendered all 14 pages after a self-initiated accessibility pass (metadata ink `#9AA9BF`, 11 sp floor on
mono metadata, Roles prose 13 sp). Measured effect vs the pre-pass audit: metadata <7:1 pairs **46 → 7**, sub-11
nodes **83 → 17**, composition unchanged. Credit where due — the pass removed the worst contrast/type debt. It
did **not** touch hit areas (16 remaining), the `roles` team-counter contrast, or Arabic type, which are the
findings below.

### 2.2 Top 3 strengths
1. **Best field log of the three.** `chat` reads as a room record that happens to be a messenger: mono time
   gutter, team-tagged senders with words not just colour, system rows as ruled interstitials, load-older, a
   composer that keeps the draft on failure. The calm register is genuinely usable under stress.
2. **The claim/dismissal UX is complete in the hard part.** "Dismissing keeps the claim waiting." plus the
   persistent banner (documented) means the decision cannot be lost — a real-world tag flow requirement.
3. **The two-register rule is the best system answer to the territory's own risk.** Poster only on ceremony,
   placard on operation, with the dock constant — B is loud where it is safe and quiet where it hurts.

### 2.3 Top 3 problems + concrete fixes
1. **Invented live positions on the hunt map (S1, capped axis 7).** `hunt-hunter` renders two violet markers
   labelled in the NOTES as "other hunters"; the aria-label still says "reported Prey positions". No endpoint,
   DTO or server rule exposes hunter positions; the shipped overlay model is `ownLocation, prey, zone, trails`.
   **Fix:** remove the two violet dots (or only show them if the brief is explicitly changed to add hunter
   telemetry — it is not); keep violet for the Hunters' own team colour/identity and the `YOU` ring. This is the
   single most damaging item in the pack because it turns a location-privacy product into a lie.
2. **The lobby cannot perform its real job (S1).** No "Ready to hunt / Stand down" control for the host (a host
   is a player and the servers block begin until everyone is ready; PAGE_INVENTORY lobby requires it) and no
   side-switch action (the other directions and the shipped app both have one). A host in a not-all-ready room
   has nothing to tap except Begin (disabled/blocked). **Fix:** add the inline Ready/Stand down in the dock and
   the `TeamTag` side switch under each column — both already exist in the shipped `LobbyDock`/`TeamSheet`.
3. **Hit-area debt on exactly the controls used under stress (S1).** "Review tag claim" 97×32 (the persistent
   banner on the run!), "View hunt history" 109×32, "Rematch · proposal" 116×32, "LOAD OLDER MESSAGES" 154×32,
   "Play Classic instead" 113×28, "Hunt rules" 58×32, "Manage" 47×44, "Allow" 32×44, "Download update" 129×42,
   "Change server" 84×44. **Fix:** +8 dp inline padding or a 48 dp hit wrapper on every text action; no visual
   redesign needed. (The re-render should show the larger hit box, and NOTES should say the visual height stays.)

### 2.4 UX/state gaps (S2 unless noted)
- `roles`: counts "2"/"3" on the team blocks read like live room data on an explanation page (use no counts, or
  "example"), and they are **3.92:1 at 12 px** (AA fail; 12 px is not large text). Fix contrast to ≥4.5 and drop
  or relabel the counts.
- `hunt-prey`: Board gutter says **"OPEN AREA · 5 PLAYERS"** directly above a 240 m zone ring — "Open area" reads
  as the *Open* play-area mode and contradicts the seed (zone mode). Fix to `ZONE 240 m` only or `PLAY AREA`.
- `result`: "DURATION 60:00" next to "STARTED 20:41 · ENDED 21:00" — 60:00 is the rules duration, not the played
  time; label it "Rules: 60:00" (or omit) and keep the honest "18:48 played". "IN PLAY" for hunters at full time
  is a shipped-status artifact; use "—" or "Full time".
- `sheet-room-settings`: the rendered frame omits zone-centre / Use-my-location / Pick-on-map / lat-lng
  (`NOTES §10.12` documents the trim "to fit the sheet"). The sheet the host sees must include the control that
  lets them actually set a zone; bring it back in round 2 (it is shipped behaviour). `Cancel` is 342×40 (<48).
- `sheet-tag-claim`: no time/expiry indication (S2, same as A) — add "Answer in mm:ss" from `expiresAt`. The
  loudest line is the generic "Tag claim" while the consequence sentence is small — invert (A/C make the
  consequence the display title).
- `lobby-rtl`: `K7M2QX` and `5 / 5` are not LTR-isolated (audit found 3 unisolated runs; the render currently
  holds visually but bidi is one string change away from breaking); Arabic labels are set in **Red Hat Mono**
  (5 nodes incl. "رمز الدعوة", "المضيف") and letterspaced (0.66–1.1 px) although NOTES §9 says "zero tracking".
  Fix: Arabic face for Arabic labels, `letter-spacing: 0`, `dir="ltr"` on code/numeric runs.
- `settings`: page overflows the canvas by 12 px (`scrollHeight 856`); "Plain HTTP; no availability guarantee"
  is honest and good — keep.
- **Shared with A/C:** chat system events are server-composed English strings; in Arabic they will appear in
  English. B is the direction that makes system events most structural, so this is a real (small, server-side)
  cost to name in NOTES.
- No second frame for paused/offline/eliminated/head-start (documented only). §18 permits notes-or-second-frame,
  but the eliminated/spectating beat is the one state a player will remember; B's calm register would render it
  cheaply.

### 2.5 Worst pages
1. **`lobby`** — missing ready + side-switch actions; not a complete lobby.
2. **`hunt-hunter`** — the invented hunter markers sit on the most trust-sensitive screen.
3. **`roles`** — live-looking counts at 3.92:1 plus 28 dp "Play Classic instead".

---

## 3. Direction C — "Field instrument"

**Weighted total (my table): 3.90 / 5.** Read as: the strongest state design and the best accessibility
foundation of the three, held back by a small number of concrete target/hit-area and data-honesty items, all
cheap to fix.

| Axis | Score | Evidence |
|---|---:|---|
| Brand & product fit *(secondary)* | 4 | A field instrument for ManHunt, not a generic HUD: mark-as-calibration dial, paper note moments, mono readings; cyan stays measurement. |
| Distinctiveness / memorability *(secondary)* | 5 | Most ownable system; a thumbnail is identifiable by chart + cyan reading + ruled bands; the paper match record is a memory hook. |
| Hierarchy & clarity | 4 | Mono 46 clock is the loudest reading on game pages; dock always one chalk block; settings/rules are dense but ordered. |
| System consistency | 4 | One instrument grammar; the paper `FieldNote` is a single documented warm exception; switch state cues are the one weak spot. |
| **Interaction & flow UX** | **4** | Complete controls where it matters (zone centre + Pick on map, tag policy read-only row, stand down, leave, save/cancel); claim has countdown + consequence + persistent re-entry; no dead end found. Gaps: no team-side switch in the lobby manifest (S2); rematch (unshipped) is the result's primary action (S2); chat "newest first" label. |
| **Accessibility & RTL/i18n** | **3** | Best type floors of the three (one sub-11 node), metadata ≥7:1, real visible text alternative list for prey reports, Arabic display face used; but **10 room-rules steppers at 44×38 and 2 settings steppers at 48×42, 2 switches at 48×28 (<48 dp)**, switch state conveyed by fill colour alone, and Arabic labels mixed into mono/letterspaced. |
| **Engineering feasibility** | **3** | No CSS effects beyond a caret blink; every datum maps except one: `history` shows per-match **"PREY REMAINING 2 / 2"**, which `MatchHistoryEntry` does not carry (S1). Other flags: Home's live GPS readout is not in the shipped Home behaviour and is unflagged (S2); auth/settings print the real public IP `74.208.99.178` (S2 design hygiene). Everything else is honest and cheap. |

### 3.1 Top 3 strengths
1. **The only truly state-complete game screen.** `hunt-hunter` shows per-prey age **and accuracy** ("Nadia
   12 s · ±6 m", "Rana 14 min · ±22 m STALE"), a visible `LATEST REPORTS` list (the map text alternative that
   UI_AUDIT UI-03 demands), the honest label "not a live track", a trail toggle, field log and hunt rules. This
   is the most usable hunter screen and the one that would pass an accessibility pass as designed.
2. **The claim moment is the best in the pack.** `sheet-tag-claim` shows who/when, a real countdown from
   `expiresAt` ("answer in 01:12" / "NO ANSWER IN 01:12 → the Huntmaster decides"), consequence-first copy, a
   paper "WHAT CONFIRMING MEANS / READ ONCE" note, then Confirm/Dispute. It is honest, warm and time-aware —
   steal it into the chosen direction.
3. **Honest data framing that raises trust:** "Latest reports, not a live track", "Own position · no other
   Prey", accuracy on every mark. C turns the product's core uncertainty (periodic reports) into the design's
   strongest idea.

### 3.2 Top 3 problems + concrete fixes
1. **Touch targets (S1, 12 controls):** the room-rules steppers are 44×38 (10 of them: head start, duration,
   report interval, zone radius, shrink values) and settings' text-size steppers 48×42; the two rules switches
   are 48×28. This is the sheet the host edits before a hunt, with cold hands, often in the dark. **Fix:** make
   every stepper ≥48×48 (visual size can stay 44 wide; extend the hit box), and give switches a ≥48 dp wrapper
   + a position/word state cue (not fill colour alone).
2. **One invented datum on a trust surface (S1):** `history`'s per-match summary shows "PREY REMAINING 2 / 2".
   Past matches carry only winner/cancelled/duration/rosters (`MatchHistoryEntry`); the current result's
   `preyAlive` does not persist into history. **Fix:** drop the line from history (A's approach) or add the
   server field as a costed proposal in NOTES — do not show it as real.
3. **Home is the one page that implies data it does not have (S2):** the readout band "LOCATION On · GPS ±6 m ·
   HUNT Not running" requires a live location fix on Home, which the shipped app does not request outside a
   match; it also implies position is being read before the player starts anything (privacy-perception cost in
   a location game). **Fix:** either flag it in NOTES as new client work (+ privacy copy) or show only
   permission state ("Location allowed · not in a hunt"). The rest of Home is strong.
Also: auth and settings print the **real public test IP** `74.208.99.178`; use the configured server label
("Game server · hosted test server", as A/B do) or a neutral placeholder — the owner explicitly rejected infra
hosts in the premium screenshot set and it is environment-specific data in a design.

### 3.3 UX/state gaps (S2 unless noted)
- `lobby`: manifest row "Nadia" is **clipped** (`42×20` in `39×20`, nowrap) — a real name truncated at 390 dp;
  with a 24-char username this breaks. Fix the column/row sizing (`min-width: 0` + wrap/ellipsis + full name
  accessible). No team-side switch action in the manifest (S2; the shipped `TeamSheet` has one).
- `result`: **Rematch is the primary white action** even though it is not shipped; the caveat line below is
  honest but the primary placement implies availability. Keep the caveat, demote Rematch to a labelled proposal
  row or drop it (brief is satisfied by documenting).
- `chat`: header says "newest first" while the visible log runs oldest→newest; fix the label (or the order).
  System rows are real server English — same i18n gap as A/B.
- `sheet-room-settings`: switch state is fill-colour only (trails on vs shrink off look like two tints of the
  same square); add knob position/word. "Server-enforced" is 10 px (<11 floor). Zone centre shows an invented
  place label "Riverside Park" — derive from real lat/lng or leave blank. `Cancel` is not in the sub-48 list (it is ≥48 dp) — fine.
- `roles`: new data labels "PLANNED"/"PLAYABLE" replace the approved "Coming soon"/"Playable now" family → adds
  translation work; prefer the existing strings (S3 copy governance).
- `lobby-rtl`: 7 numeric runs are not LTR-isolated (`5 / 5`, `K7M2QX`, `01`–`05`); the render currently holds but
  bidi is fragile. Arabic labels are set in mono/Instrument Sans with 0.24–1.68 px tracking even though NOTES
  §3.11 says no tracking. Fix the isolation + Arabic face/tracking (S2). The mirrored composition itself is
  excellent (manifest reading order, compass not mirrored, code LTR).
- No second frame for paused/offline/eliminated/head-start (shared with A/B; documented only).

### 3.4 Worst pages
1. **`sheet-room-settings`** — 10 sub-48 steppers + colour-only switches + 10 px label; otherwise a good page.
2. **`history`** — invented "Prey remaining" per past match (S1) in an otherwise elegant record page.
3. **`lobby`** — clipped "Nadia" and no side-switch action on the page whose whole job is routing players to
   sides.

---

## 4. Cross-direction: 3 worst UX risks, 3 cheapest wins

### 4.1 Three worst UX risks (if any of this shipped as drawn)
1. **Invented location data on the live map (B, S1).** Two violet "other hunter" markers are drawn on
   `hunt-hunter`; the server never broadcasts hunter positions and the aria-label calls the map "reported Prey
   positions". In a real-world location game this is the kind of lie that damages trust in the one place it
   matters most. Fix before anything else in B: delete the markers.
2. **Core lobby/rule flows that cannot be completed (B S1, C S2):** B's host has no Ready/Stand down and no
   side switch; B's rules sheet has no zone-centre control in the rendered frame; C's lobby has no side-switch.
   A real room can stall or be set up wrong. Fix: ship A's host controls (or the shipped `LobbyDock`/`TeamSheet`
   behaviour) into the chosen direction; keep the room-settings zone-centre/Use-my-location/Pick-on-map control
   visible in the sheet.
3. **Hit areas and micro-text at night (all three, S1):** A 10.5 px labels + 44 dp buttons + 40×22 switches;
   B 16 actions at 28–44 dp including the persistent claim banner; C 44×38 steppers + 48×28 switches. These are
   exactly the controls used one-handed, in the dark, while moving — and they are the cheapest category to fix.
   (Second-order risk worth naming: none of the three shows the claim's 90 s expiry except C, so A/B users can
   lose a claim decision by waiting.)

### 4.2 Three cheapest wins (high value / low cost)
1. **One token pass for micro-type + metadata contrast** — raise sub-11 sp text to 11 (A 10.5→11 across 92
   nodes, B/C 10 px labels), and lift ≤12 sp metadata to ≥7:1 (A's muted 5.34:1 board labels; B's 4.5–5.3:1
   update/claim meta; C's 6.75:1 "PLAYED OF 60:00"). Pure token change, no layout work; fixes the largest
   measured a11y debt in the pack in one commit.
2. **48 dp hit boxes on every text/inline action** — A: View history / Sign out / both rules switches; B: 16
   actions (claim-banner Review, Game tab, Load older, Download update, Manage, Allow, Share/Rules, View
   history, Rematch…); C: 10 steppers + 2 switches. Padding/`heightIn` only; the visuals don't move. Biggest
   one-handed utilisation win for the smallest diff.
3. **Claim lifecycle package** — add "Answer in mm:ss" from `expiresAt` to A/B (C already has it), render the
   dismissed-claim persistent banner in at least one frame (A/B/C all only document it), and make the
   consequence the display title (A/C already do; B's generic "Tag claim" is the loudest object). Copy + one
   row + one banner state; removes the only real "lose a decision by waiting" failure in the game.

### 4.3 Per-page UX/state picks (my angle; reviewer-visual owns the visual pick)

| Page | UX/state pick | Why / what to steal |
|---|---|---|
| auth | **A** | Quiet form, server row honestly demoted ("hosted test server"), realistic filled state, no IP. C's identity is stronger visually but exposes the real host. |
| roles | **A** | Complete first-run content + planned-mode escape ("Play Classic instead") + no live-looking counters. C is close; B's 2/3 counters misread and fail contrast. |
| home | **B** | Two verbs as different objects in a fixed dock; honest host/join state; no invented readouts. A good but placeholders read oddly; C shows GPS data Home doesn't have. |
| lobby | **A** | Only direction with the host's full real controls: ready/stand-down, side switch, blocker line; code as the board's big object. C close (better manifest) but no side switch; B incomplete. |
| hunt-hunter | **C** | Ages + accuracy + visible prey list + "not a live track". A clean but summary-only; B invents hunter markers. |
| hunt-prey | **C** | Cadence with last/next + explicit "no other Prey" + status dock; claim countdown. A honest but no self-report state; B has the "OPEN AREA" conflict. |
| chat | **B** | Field log with mono gutter, team tags (word+colour), load-older, dismissal-safe composer. C close (steal room-record counter); A's sender identity is colour-only. |
| result | **A** | Honest 0/2 + no fake primary action (Play again is quiet); full-time moment lands. Steal C's paper match-record + time-played ruler; steal B's stamp energy. |
| history | **A** | Only direction that shows no survival score it cannot know; grouped list + last-hunt summary. B/C must delete the invented per-match "prey remaining". |
| settings | **A** | Most complete, clearest section rhythm; steal B's real slider + update card/timing and C's preview line. (A needs the type/target pass; B overflows; C's steppers/IP.) |
| sheet-tag-claim | **C** | Countdown + consequence-first + paper note + dismissal note. Steal A's consequence-as-display-title for the final system. |
| sheet-room-settings | **A** | Complete controls incl. zone centre/use-my-location (C close, but 44×38 steppers; B omits centre). Steal B's Confirm/Instant consequence copy (allowed costed proposal) and C's ruled section rhythm. |
| lobby-rtl | **A** | Best genuine mirror + LTR isolation + Arabic face; fix the tracking. C's manifest order/indices worth stealing; B needs type/isolation fixes. |
| home-light | **B** | Same state as its dark Home and a real daylight translation of the blocks; A's light proof shows a different state; C's is good but its ink band decision needs owner sign-off. |

### 4.4 Cross-direction shared findings
- **Chat system events are server-English.** All three design them as structural rows; none names the i18n cost.
  In Arabic the field log will contain English system lines. Needs structured event types (small server change)
  or an explicit "English system events in Arabic" acceptance; record as a feasibility delta in each NOTES.
- **No second frame proves the stress states.** Paused / offline / eliminated / head-start are documented with
  real copy in all three (`PAGE_INVENTORY` §18 allows notes-or-second-frame) but not rendered. Round 2 should
  render at least **eliminated/spectating** and **paused** — they are the states a real player meets under
  pressure, and they are where a design system either holds or falls apart. Cost: one frame each.
- **Arabic typography debt is universal** (A/B/C all apply positive letter-spacing to Arabic labels and B/C set
  Arabic labels in the mono face) despite every NOTES claiming "no tracking". Re-render `lobby-rtl` after fixing;
  this is a visible proof-page quality issue for the Arabic-reading owner.
- **Destructive leave/end flows inconsistent:** the shipped app confirms leave ("You will leave the room and
  lose your spot") and end-hunt; none of the three renders or documents the leave confirm on the canonical
  lobby, and the back-arrow is the only leave affordance. Add the sheet to the system (cheap) or state the
  decision explicitly.
- **No direction renders a map text-alternative list except C.** The shipped `PreyStatusCard` exists; A has a
  good summary aria-label, B a summary only. The final system should carry C's list.

---

## 5. Dialogue log (designers ↔ reviewer-ux)

**Messages sent (round 1):**
- 2026-11-04 · `designer-a` — top fixes: type floor 10.5→11 sp (92 nodes), metadata 7:1 on board labels,
  48 dp hits on View history/Sign out/rules switches, fake London zone coordinates, home-light state mismatch,
  claim expiry, Arabic tracking.
- 2026-11-04 · `designer-b` — top fixes: remove invented other-hunter markers, add host Ready/Stand down +
  side switch to lobby, restore zone-centre control in rules sheet, 16 hit areas, roles counter contrast,
  history invisible score, Arabic type (mono/tracking/isolation).
- 2026-11-04 · `designer-c` — top fixes: 48 dp stepper/switch targets, delete invented history "prey remaining",
  Home GPS readout (flag or remove), real IP in auth/settings, clipped "Nadia", lobby side switch, result
  rematch primary, chat "newest first", Arabic tracking/isolation.

**Status 19:52 UTC:** all three messages sent, each with the three highest-severity findings + concrete fix and an
invitation to push back with evidence. Replies/decisions will be appended here as they arrive (round-2 response
task-9/10/11); accepted items will be re-verified against the new renders, not against the reply text.

### A — designer-a reply (round-2 response, received 2026-11-04 ~19:55 UTC)
**Decision: accepted with verification items; pushbacks accepted.** Logged fixes to re-verify from the new render:
1. Type floor: `data.small` 10.5→**11.5/15**, chat gutter 10.5→11.5 (44 dp gutter), board/meta 10.5→11.5, settings
   footer 9.5→11, plate credit 10→11, switch labels 11.5. *Verify:* my audit `hard<11` = 0 and no fixed-height
   clipping; I will send the exact remaining node list if any family stays <11.
2. Metadata 7:1: board-muted alpha .55→**.75** (claimed ≈8:1 on `#0e1728`). *Verify:* computed pairs ≥7:1 for
   every ≤12 sp node on ink; re-check the board gutters/state/claim meta specifically.
3. 48 dp: remove 44 dp overrides on result/settings secondary buttons; 40×22 rules switches get a **48×48 hit
   wrapper** with the ON/OFF word retained (state not colour-only). *Verify:* target boxes ≥48 and no overlap
   with the row label.
4. Truth bugs: zone centre → `set on the map · 40.8008, -73.9720` (Riverside Park, NYC; fallback "not set"
   documented); `home-light` re-rendered from the same state as `home`. *Verify:* parity + no invented place label.
5. Claim expiry: "Answer in 01:12" from `expiresAt` + "No answer → the huntmaster decides". *Verify:* copy and the
   data source (real `PendingTagDto.expiresAt`); this is the accepted cheapest win.
6. Arabic: `[dir=rtl] .arabic-h { letter-spacing: 0 }` + `.mh-ltr` isolates on every numeric run. *Verify:*
   audit `tracking = 0`, `rtl-uniso = 0` on `lobby-rtl`, visual proof re-read.
7. Clips: history 10 px + room-rules 6 px. *Verify:* `clipped = 0`, page heights 844.
8. Map a11y: visually-hidden per-prey status list inside the existing aria label ("latest reports, not live"),
   result plate alt text, prey in-map own-position label. *Verify:* hidden text is `.mh-sr-only` (not
   `aria-hidden`) and names both prey + ages.
9. Leave/back: documenting the shipped confirm copy in NOTES §6 is accepted (no extra frame required); the
   dismissed-claim persistent banner must also be documented there.
**Extra frame:** accepted plan = **paused**; if a second frame is affordable, **eliminated/spectating on
`hunt-prey`** is the higher-value proof (board continues, no tag/share, chat works) — but neither replaces the
state documentation. Do not render leave-confirm for review purposes.
**Pushback accepted:** 44 dp dock controls were their own override bug — fixing to 48 is right; "hosted test
server" as a label is deliberate and I recorded it as a positive (my IP objection was only for C's
`74.208.99.178`). **Partial accepted:** last-report self-send time is fine if NOTES names the client-state cost;
no server acknowledgement to be invented.
### B — designer-b reply (round-2 response, received 2026-11-04 ~19:58 UTC)
**Decision: accepted with verification items; partials accepted; two questions answered.**
1. Remove violet ally markers + history per-match survival scores (S1) → my feasibility cap lifts if the new
   renders show no invented positions/scores; aria-label stays "reported Prey positions". *Verify:* two markers
   gone on `hunt-hunter`; `history` has no per-match PREY n/2; cap removed in round-2 table.
2. Lobby host **Ready/Stand down** + side-switch (segmented in dock, 48 dp cells) with blocker copy in dock.
   *Verify:* both controls present and ≥48 dp; not-all-ready state copy.
3. Rules sheet: zone centre + coordinates + Pick on map + Use my location restored; Cancel 48. *Verify:* controls
   present, sheet fits 844, zone "not set" validation.
4. Hit areas: 48 dp wrappers on all inline actions/switches/segment cells/Download/Cancel; switch gets
   knob-position + ON/OFF word. *Verify:* audit `targets<48` = 0 (or only justified exceptions) and no overlap.
5. roles counters removed (fixes 3.92:1 pair) → *verify no new contrast pair and no room-data look.*
6. `hunt-prey` gutter = `ZONE 240 m` only → *verify no "OPEN AREA" string.*
7. `result` `LIMIT 60:00` + `—` instead of `IN PLAY` → *verify copy and honest 0/2.*
8. `lobby-rtl`: Arabic face + zero tracking on labels; LTR isolates for `K7M2QX`, `5 / 5`, `5 لاعبين`; no `·`.
   *Verify:* audit `tracking=0`, `rtl-uniso=0`; visual re-read.
9. Settings overflow fixed (target scrollHeight ≤844) → *verify no page scroll.*
10. Claim sheet: consequence-first title "Omar tagged you." + `Answer in 01:12` from `pendingTag.expiresAt`
    relative to `RoomState.serverNow` (not device clock) + "No answer → the huntmaster decides" + expired/disputed
    state distinct; under `tagPolicy=instant` the sheet cannot appear (already in NOTES). *Verify:* countdown is
    server-time-correct, expiry state designed, no claim sheet implied under instant.
11. History empty copy only in the empty state → *verify populated frame has no "Hunts appear here…"*.
**Partials accepted:** paused/head-start/offline stay specified (rubric §18 notes-or-second-frame) with a
strengthened eliminated/spectating spec; one **eliminated/spectating `hunt-prey` extra frame (15th)** requested
because it is the highest-value state proof in the pack and cheap — paused can stay a spec (A is rendering paused,
so the owner pack gets both). Chat system events: accepted as shared server-side limitation recorded in NOTES, not
faked in Arabic. Loud-colour/ALL-CAPS items are reviewer-visual's calls; the "only one action is hot" rule and
sentence-case fix are good.
**Questions answered:** (a) "Answer in mm:ss" is the right form (action prompt + consequence line); "Expires in"
loses the consequence. (b) yes to the eliminated extra frame; spec alone is enough for the other states.
**Round-2 verification for B:** re-run audit on refreshed `out/` and compare: 16→targets, 7→metadata, 17→sub-11,
3→RTL-unisolated, invented-data scan = 0, page height ≤844; re-read lobby/rules/claim/result/RTL; remove the §2.2
cap in the round-2 table if clean.

### C — designer-c reply (round-2 response, received 2026-11-04 ~20:00 UTC)
**Decision: accepted with verification items; partials accepted with one record note.**
1. Touch targets: every stepper ≥48×48 hit box, switches ≥48 dp wrapper + ON/OFF word/position, remaining sub-12
   labels raised (Server-enforced, map sub-labels, chat tags, history keys, rules hints → 12). *Verify:* audit
   `targets<48` = 0, no colour-only switch state, no fixed-height clipping from the raises.
2. History invented datum dropped; summary uses only `MatchHistoryEntry` fields; row/detail time mismatch fixed;
   just-played match added so history ↔ result line up. *Verify:* no per-match prey-remaining; date/time
   consistency across rows + detail; duration present only when real.
3. Home invented GPS readout dropped → permission-state readout (LOCATION Allowed · NOTIFICATIONS On · HUNT Not
   running). *Verify:* no location-fix data on Home; NOTES drops the new-client-location item.
4. Real IP replaced with "Hosted test server" on auth + settings, plain-HTTP caveat retained. *Verify:* no
   `74.208.99.178` in any page.
5. Lobby: decorative 01–05 indices removed; names `flex:1/min-width:0` + ellipsis (24-char safe); "Change side"
   48 dp dock action. *Verify:* no clipped name at 390 dp with a 24-char test string; change-side visible and not
   colliding with Begin/stand-down/leave.
6. Result: Back to lobby primary, Rematch secondary/proposal labelled. *Verify:* primary ordering + caveat.
7. Chat "oldest first" label fixed. *Verify:* label matches order.
8. RTL: 7 numeric runs LTR-isolated, Arabic labels out of mono/Instrument Sans into the Arabic face with 0
   tracking, middot removed. *Verify:* audit `rtl-uniso`=0, `tracking`=0, Arabic-face count = Arabic text nodes;
   static-CSS physical-direction note added to NOTES feasibility (Compose maps start/end) — accepted as handoff note.
9. Switch word cue + 48 wrapper — covered by 1.
10. Rules sheet zone centre: real coordinates `40.79950, −73.97350` + Pick on map (matches the seed zone); no
    invented place label. *Verify:* values map to `settings.zone`; "not set" state still reachable.
11. Roles: "Coming soon" reused; "Playable now" flagged [NEW COPY] — accepted (copy governance).
12. Claim: duplicate countdown removed (single expiry row) — *verify one countdown + consequence line.*
13. Three rendered extra frames (paused, offline/reconnecting, eliminated/spectating) — accepted; labelled
    non-canonical extras, canonical 14 unchanged for comparability.
**Partials:** join-before-host order accepted (returning-player fast path is legitimate; keep the strengthened
host emphasis and add one NOTES line that first-session emphasis is host — no swap unless the re-score shows the
host action is not the first read). "One cyan surface" pushback **accepted in my axes**: it is a documented system
reweighting (cyan = measurement, chalk = action), not an a11y/UX failure; I record it as a consistency note for
reviewer-visual/owner, not a defect — but if the owner picks C, the "one hot action" rule needs a decision on
whether the primary is chalk or cyan. Derived "next report" countdown + own accuracy: accepted if NOTES labels
them client-derived (own accuracy is real phone-fix data, not server) — no invented server acknowledgement.
Notes-only loading/error/chat/history/claim sub-states accepted (rubric §18); the 3 extras close the important gap.
**Round-2 verification for C:** re-run audit on refreshed `out/` + 3 extras: targets 12→0, sub-11 1→0, RTL 7→0,
clipped 4→0 (24-char name test), invented-data scan = 0, no IP; re-read claim/history/home/result/RTL; regression
check the 14 canonical pages for unrelated drift.

**Round-2 verification for A:** re-run `ux-audit.mjs` on the refreshed `out/`, compare against the round-1
numbers (92→<11, 36→metadata, 4→targets, 2→clipped, tracking→0, unisolated→0), re-read `home-light` parity,
claim countdown, zone coordinates, hidden prey list, and check no regression on the 14-page system.


**Reconciliation input to reviewer-visual (sent 19:52 UTC):** my weighted totals A 3.75 / B 3.50 / C 3.90; my
per-page UX/state picks are in `scores-round-1.json` → `page_ux_picks` (A wins auth/roles/lobby/result/history/
settings/rules sheet/RTL; B wins home/chat/home-light; C wins hunt-hunter/hunt-prey/claim). Expected reconciliation
points: (a) B feasibility is capped at 2 by rubric §2.2/§2.7 — if reviewer-visual does not count the invented map
markers as "fake content", the cap is the disagreement to argue; (b) A a11y is 3 because of the measured 10.5 sp/
5.34:1 debt, not because its RTL proof is weak (it is the strongest); (c) C feasibility is 3 (one invented history
stat + Home GPS + real IP) versus A's 4 (no invented product data but three S2 content bugs); (d) my brand/
distinctiveness scores are secondary reads and should defer to reviewer-visual's depth. No numbers were exchanged
before both files existed.

### 5.1 Reconciliation with reviewer-visual (round 1) — filed 2026-11-04 ~20:05 UTC

**Agreed ranking: C > A > B** (both tables), narrow and fix-driven rather than taste-driven.
**Shared table (harsher value wins where we differ):** reviewer-visual's `scores-round-1.json` — A 3.60 (capped),
B 3.35 (capped), C 3.75; my independent table (this reviewer) — A 3.75, B 3.50, C 3.90. Both sets are kept.

Accepted into the shared table from my evidence (credited in `round-1-visual.md` §8): B feasibility cap
(§2.2/§2.7), B a11y 2 (16 sub-48 controls, roles 3.92:1, Arabic type), B lobby interaction S1, A a11y 3, C a11y 3,
C feasibility 3.

**Dissents recorded (not averaged):**
1. **A cap** — reviewer-visual caps axes 5/7 because the rendered "Play again" has no proposal label (§2.7 scores
   the render). I accept the cap for the shared round-1 table (render is the evidence); my interaction/feasibility
   4s stand as the post-fix projection, and A is adding the label in round 2.
2. **C interaction (mine 4, theirs 3)** — clarified with reviewer-visual: their 3 is **hierarchy/reach**
   (the result page's largest affordance cannot execute, whatever its label), not a §2.7 claim; we agree the caveat
   is honest disclosure (same class as B's "Rematch · proposal"). Positions are consistent: once designer-c
   demotes Rematch to a labelled secondary and Back to lobby becomes the only primary, reviewer-visual moves to 4
   and the dissent disappears. Round 2 decides on the render.
3. **C consistency (mine 4, theirs 5)** — accepted theirs: the switch cue is an a11y/state issue, not a grammar
   inconsistency; reconciled table will use 5.
4. **C feasibility asymmetry** — strict §2.2 reading would cap C too. My position: C's one invented datum is a
   secondary-page S1 (not the live-map fake content that drove B's cap) and it is being removed; if the Lead wants
   the mechanical rule, C caps at 2 and the ranking narrows — settle in task-12 on the round-2 renders.

**best-visual ≠ best-usable rows handed to reviewer-visual for task-12** (full rationale in
`scores-round-1-ux.json` → `reconciliation_round1.best_visual_ne_best_usable_rows`):
- `roles`: best visual **B** / best usable **A** — B's side-block composition is the best poster explanation, but
  its "2/3" counters read as live room data and fail contrast (3.92:1) on an explanation page; A's field-guide +
  5-step flow + "Play Classic instead" escape is the usable first-run. Steal B's side blocks into A's explanation.
- `home`: best visual **A** / best usable **B** — A's two-verb object hierarchy is the stronger visual but its
  empty code-cell dashes and reach are weaker; B's docked two-verb pair is honest and thumb-reachable. Steal A's
  named-host-field treatment into B's dock composition.
- `result`: best visual **B** / best usable **A** — B's violet winner field + FULL TIME stamp is the pack's best
  event, but its "DURATION 60:00"/"IN PLAY" copy and unlabelled Rematch muddy an honest outcome; A's dock keeps
  only Back to lobby + history and states prey remaining 0/2. Steal B's stamp/winner-field energy into A's
  action hierarchy.

---

## 6. Evidence summary and limitations

**Measurements (final run 19:47 UTC, 42 pages × stress):** A: 0 AA-body fails, **36 metadata <7:1**, **92 nodes
<11 sp**, 4 targets <48 dp, 2 clipped regions, 0 out-of-canvas. B (post-pre-pass): 0 AA-body fails, 7 metadata
<7:1, 17 nodes <11 sp, **16 targets <48 dp**, 1 clipped, 3 RTL-unisolated runs. C: 0 AA-body fails, 1 metadata
<7:1, 1 node <11 sp, **12 targets <48 dp**, 4 clipped (name truncation), 7 RTL-unisolated runs. Raw data:
`reviews/evidence/ux-audit.json`, `ux-audit-<direction>.json`, CSS technique/Arabic/A11y samples in
`ux-audit-summary.md`. All 42 PNGs verified 1170×2532. Stress runs (forced-320 / 200 % text) are indicative, not
contract failures: A `roles` 2220 px / `home` 1384 px at 200 %, B `roles` 3483 px, C `settings` 1644 px — every
direction needs an explicit "what reflows/scrolls at 200 %" rule in NOTES for the implementation pass.

**Limitations:** (1) My numbers assume CSS px = dp at 1× and a light theme equal to the brand daylight tokens;
pixel colours were spot-checked against the PNGs but not every pair was re-sampled. (2) TalkBack/IME/e-paper
behaviour still needs a device; `[needs device]` items are not scored. (3) RTL-unisolated detection is a heuristic
(the current renders look correct; the risk is bidi under different fonts/strings). (4) "No second frame" for
paused/offline/eliminated follows the skill's notes-or-second-frame allowance — if the Lead/owner wants states
*rendered*, all three lose a point on axis 5. (5) The tag-policy finding is judged against design-smith's
corrected two-value line (read-only row = safe; `confirm|instant` = allowed costed proposal with consequence
copy). (6) B's scores use the current re-rendered files (pre-review a11y pass); A/C unchanged since 19:32/19:38.
