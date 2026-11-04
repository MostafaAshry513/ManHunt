# UX / accessibility / engineering-feasibility review — prep and discipline (round 1)

**Reviewer:** reviewer-ux · **Workstream:** ManHunt UI/UX redesign v2 · **Branch:** `design/ui-v2`
**Status:** prepared 2026-11-04, before any direction render exists. This is *method and constraints*, not a verdict.
**Read first:** `briefs/00-workstream.md`, `01-directions.md`, `02-evaluation.md`; `skills/REVIEW_RUBRIC.md`,
`skills/PAGE_INVENTORY.md`, `skills/DESIGN_PLAYBOOK.md`, `skills/TOKENS.md` (reconciled in §12); real app code under `android/`;
`docs/UI_AUDIT.md`, `docs/ANDROID_REVIEW.md`, `docs/SECURITY.md`, `design/redesign/*` (shipped MATCHDAY BOARD
direction, tokens, screens, states, adaptation); `docs/screenshots/premium/` (real v0.16 baseline).

**Scope split with reviewer-visual.** I own the depth on **interaction & flow UX (axis 5), accessibility & RTL/i18n
(axis 6), engineering feasibility (axis 7)**, and I cross-check hierarchy (3) and system consistency (4) with
page-level evidence. reviewer-visual owns depth on brand fit (1), distinctiveness (2) and hierarchy/consistency;
we both score all seven axes on the shared rubric and reconcile per `briefs/02-evaluation.md` (dissent recorded,
never averaged away). `reviews/prep-visual.md` §1 and §6 are the companion method; this file is deliberately
different: it is the **real-app constraint catalogue + per-page UX/state/feasibility checklist** the renders must
survive, not a restatement of the visual criteria.

---

## 0. What "done" means for a page (my bar)

**Judge the render as if it is about to be built into this app next week for real players** — because that is the
brief. No "it's just a concept" exemption where the brief demands real states, real vocabulary, real seed data and
the fixed feature set.

A page passes my review only when all six hold:
1. **The real state works**: the data it shows exists in the shipped contract (`android/.../data/Models.kt`,
   server schemas) and every action it offers exists in the shipped product.
2. **The unhappy states exist in the render** where the page has them (empty/loading/error/offline/reconnecting/
   paused/eliminated/pending), not only in NOTES.
3. **It survives a real phone**: 390 dp wide, 320 dp narrow, 200 % font scale, one hand, dark, outdoors.
4. **A screen-reader and an Arabic player can use the same page**: no vision-only information, no colour-only
   signal, genuine RTL, no clipped expanded Arabic, numerals LTR-isolated.
5. **An engineer can build it in Jetpack Compose (minSdk 26) on the existing contract** without engine work the
   brief did not sanction; anything that needs new data/API/platform work is named as such.
6. **It does not lie or endanger the player**: no invented affordances/data, no privacy claim the app can't keep,
   no fake urgency/store/ratings, no copy that makes a location-sharing game sound like a tracker.

Anything that fails (1)–(3) or (6) is a UX defect, not a taste disagreement. Anything failing (4) or (5) is a
blocker unless the direction explicitly logs it as an implementation task with a credible path.

---

## 1. Scoring discipline (independence first)

**S1 — Render, not notes.** NOTES is read *after* pages, to test claimed states and honesty. A state described but
not rendered where the brief requires it is a gap. Literal untruth in NOTES (claims a state/feature the pages or
code don't support) is a separate finding and costs credibility in the final recommendation.

**S2 — Evidence per score.** Every number cites page file + observation. No free-floating numbers.

**S3 — Same pass order as reviewer-visual** so our cold reads are comparable: full page pass in the fixed order
`auth → roles → home → lobby → hunt-hunter → hunt-prey → chat → result → history → settings →
sheet-tag-claim → sheet-room-settings → lobby-rtl → home-light`, directions **C → A → B** (blunts "A is the
shipped one" and first-read bias), full-size 1170×2532; then a cross-direction same-page pass for page picks.
My pass adds the DOM/measurement checks below on the HTML sources (read-only).

**S4 — Separate my numbers from reviewer-visual's.** Each writes `scores-round-1.json` before reading the other's
scores. Reconcile axis by axis afterwards; disagreements get one paragraph each in the joint record; both files are
preserved. Same JSON row shape (see §9) so the final table merges mechanically.

**S5 — A number cannot hide a broken page.** A core page (home/lobby/hunt-hunter/hunt-prey) with an S0/S1 defect
caps the affected axis at 3 and is named at the top of the direction section. Good settings pages do not lift it.

**S6 — No reward for asserted accessibility.** "AA contrast", "48 dp", "RTL-ready" in NOTES earns nothing; only
measured/visible compliance does. Equally, **a delivery defect** (missing glyph, clipped Arabic, unmirrored page,
blank render) is reported as a delivery issue first and not scored as a design choice until the designer confirms
the render — same rule as reviewer-visual §1 Rule 5.

**S7 — No invented features.** Additional pages/states invented beyond the brief are judged only under "state
completeness" where they replace a required state; they earn no credit for scope. Anything implying data/behaviour
the app doesn't have is a finding under feasibility, *even if it would be nice*.

**S8 — Budget awareness is part of feasibility.** The shipped app already contains the MATCHDAY grammar in Compose
(`BoardComponents.kt`: `MatchBoard`, `StateTag`, `ChalkRule`, `BoardButton`, `TeamTag`, `CodePlate`, `BoardScaffold`,
`MatchSheet`, `ScorePage`, `FieldMarks`, `LobbyBoard`, `BoardInputs`). A direction that reuses the grammar is
cheaper than one that requires new primitives; a direction that diverges must justify the build cost. I score
buildable-with-the-existing-system, not "could be built by a bigger team eventually".

---

## 2. Severity scale (used for every page finding)

| Sev | Name | Definition | Disposition |
|---|---|---|---|
| **S0** | Blocker | Makes a core page or flow unusable or unsafe/false: privacy violation (prey positions on the prey screen), impossible action, invented data shown as real, deceptive claim, no way to complete the page's job, unreadable core datum. | **Must fix in round 2**; message designer immediately; mention to Lead if it survives round 2. Caps axis at ≤2. |
| **S1** | High | Breaks a realistic use state or a hard requirement: missing required state (empty/loading/error/offline/paused/eliminated), WCAG AA failure on body/labels, <48 dp touch target on a real action, one-handed failure on the core action, false/absent RTL, clipped Arabic, fake affordance that dead-ends, data field that doesn't exist. | Fix before the owner decision; caps that axis at ≤3. |
| **S2** | Medium | Friction/robustness/feasibility risk: cramped 320 dp, 200 % clipping on a non-primary element, ambiguous destructive adjacency, confusing copy, a state present but weak, implementation risk requiring named work. | Fix in round 2 or record as implementation risk; several on core pages cap the axis at 3–4. |
| **S3** | Low | Polish/edge-case: 1–2 dp misalignment, minor copy inconsistency, exotic state. | Note only. |

**Confidence tags** on every finding: `[rendered]` (visible in the PNG), `[measured]` (contrast/target/overflow
computed from the DOM/CSS/PNG), `[inferred]` (from code contract/Compose knowledge), `[needs device]` (can't settle
without a real phone: TalkBack announcements, real IME, tile rendering). Findings without a tag are treated as
opinion and not scored.

**Practical reading of the scale for a design exploration:** an S1 costs a direction roughly one point on the
affected axis; an S0 costs the direction its recommendation. 4 = "ships, with ≤2 S2s listed"; 5 = "ships, no S1/S0,
≤2 S2s, and the states are genuinely designed"; 3 = "one S1 or ≥3 S2s"; 2 = "several S1s or one S0"; 1 = "unusable
as rendered".

---

## 3. Axis anchors — how I settle axes 5 / 6 / 7 (and cross-check 3 / 4)

Weight from `briefs/02-evaluation.md`: brand 15 · distinctiveness 15 · hierarchy 15 · consistency 15 ·
interaction/flow 15 · a11y+RTL 10 · feasibility 15.

### Axis 5 — Interaction & flow UX (weight 15 %)
| Score | Anchor |
|---|---|
| 5 | Every page's job is completable through the rendered states; no dead ends; destructive actions guarded; back/leave/sheet-dismiss/resume behaviour defined; required states (empty/loading/error/offline/paused/eliminated/pending) are designed in one grammar; primary action sits in the thumb zone; claim/reconnect recovery is designed; nothing invented. |
| 3 | Workable with effort: a required state is missing or generic, or one flow dead-ends but has a workaround, or the primary action is reachable but not obvious, or recovery after interruption is undefined. |
| 1 | Dead ends / unclear states / can't find the action; a core flow cannot be completed as rendered. |

Tests I run: **5-second first-glance** (name the action before reading), **interruption test** (kill/rotate/background
mid-flow: where do I resume?), **destructive adjacency test**, **re-entry test** (dismissed claim/pending banner),
**dead-end test** (every button leads somewhere or is visibly disabled with reason).

### Axis 6 — Accessibility & RTL/i18n (weight 10 %)
| Score | Anchor |
|---|---|
| 5 | WCAG AA contrast on all real text pairs; body ≥14 sp / auxiliary ≥12 sp eq.; ≥48 dp targets with ≥8 dp separation on actions; colour never the only signal; visible focus/selected/disabled distinction; text alternative for the map and every status; scaling to 200 % without clipping; genuine Arabic RTL proven (mirroring right, numerals LTR-isolated, approved Arabic strings, no clipping, +20–30 % expansion handled); reduced-motion and semantics notes present. |
| 3 | Some gaps: a few sub-AA pairs, one or two <48 dp controls, RTL mostly mirrored but with LTR bleed-through or an untranslated string, scaling untested/unsafe. |
| 1 | Unusable: contrast failures across body text, RTL is a mirrored LTR page with broken bidi, no text alternatives, clipping at default size. |

Formal checks are in §7. Brief baseline: **AA (4.5:1 body / 3:1 large ≥24 px or ≥18.66 px bold & non-text)**,
≥48 dp, body ≥14 sp eq., auxiliary ≥12 sp eq., colour never the only signal. I hold the brief's numbers, not a
softer internal standard.

### Axis 7 — Engineering feasibility (weight 15 %)
| Score | Anchor |
|---|---|
| 5 | Maps cleanly to Compose + existing tokens/data: every datum exists in `Models.kt`/server schemas; effects are vector/Canvas/Compose-achievable (no CSS-only blur/blend/mask on the map, no custom basemap); fonts are the three bundled OFL faces (Arabic = platform Arabic sans, never a Latin display face); density/size/state fit minSdk 26 / target 37; named implementation risks with realistic cost. |
| 3 | Buildable with effort: a new component family or a modest amount of new drawing work; some effects need substituting; one or two data values need adding (e.g. a derived count) without server change; no engine work. |
| 1 | Needs engine/protocol work, a custom map renderer, a new font/asset, or invents data/APIs; or the design depends on a fidelity HTML can do and Compose/osmdroid cannot. |

**What counts as "engine work" here** (from the real repo): new map rendering (osmdroid draws colour-matrix-filtered
OSM raster tiles + Canvas overlays — no custom basemap, no map CSS), new real-time events/protocol fields, new server
endpoints, new permission flows, new platform services, bundled new fonts (APK budget explicitly capped in
`design/redesign/tokens.md`), and any claim about match state the server doesn't persist. A separate UI screen or a
bottom sheet is *not* engine work.

### Cross-check anchors
- **Hierarchy (3):** <1 s test — the one action/outcome is the first thing seen full-size and at 30 %; no competing
  displays; disabled actions carry their reason adjacent.
- **Consistency (4):** one grammar explains every page/state; same component for the same meaning; states use the
  same vocabulary across pages; no per-page improvisation. I report inconsistencies with page pairs, not adjectives.

---

## 4. Method & tooling

**Pass A — cold read.** NOTES (once) → contact sheet → full-size pages in the fixed order (C → A → B). No scores
drafted until the pass ends. I record: first-glance action, states visible, any invented data, any dead end.

**Pass B — DOM/measurement audit (read-only on the HTML/CSS).** The env ships Playwright + Chromium
(`design/ui-v2/env/`). From `reviews/tools/` I run a script that loads each `pages/*.html` at the canvas contract
(390×844, deviceScaleFactor 3) and reports, per page:
1. **Contrast** — computed `color` vs nearest opaque background per visible text node; body/label threshold 4.5 : 1,
   large (≥24 px or ≥18.66 px bold) 3 : 1; also non-text boundaries (input outlines, focus rings, icon glyphs
   conveying state) at 3 : 1. Pixel-sample the PNG at the same coordinates to catch what CSS-only analysis misses.
2. **Touch targets** — every `button/a/input/[role=button]`; flag rendered rect < 48×48 CSS px (= dp) and actions
   separated by < 8 dp.
3. **Type size** — any visible text < 12 px eq.; body copy < 14 px eq.; fixed-height text containers; tracking on
   Arabic; uppercase on Arabic.
4. **Overflow/clipping** — `scrollWidth > clientWidth`, `scrollHeight > clientHeight` on text containers; absolutely
   positioned labels that collide; any text node whose rendered box is clipped by an ancestor.
5. **Fixed geometry** — fixed `height` on interactive controls (200 % font-scale trap), fixed map/card heights, and
   elements pinned inside the top/bottom safe area (implementation insets will move them).
6. **Directionality** — `direction`, `left/right` (vs logical) properties, `margin-left`/`padding-right`, text-align
   hard-coded; on `lobby-rtl` verify the *whole* page is mirrored and numerals/code are LTR-isolated.
7. **Colour-only signals** — flagged manually per page against §7.4.
8. **Content truthfulness** — scan visible text for invented claims (player counts, ratings, "secure", "encrypted",
   "real-time tracking", email/recovery, forgot-password, third-party sign-in, store badges) and for English left in
   the RTL proof other than approved Latin tokens (ManHunt, code, URL, version, digits).

I write findings against page ids and keep the raw JSON output in `reviews/evidence/` (my write scope). I do not
edit designer files; if the script cannot run, I fall back to PNG inspection + CSS reading and say so.

**Implemented:** `reviews/tools/ux-audit.mjs` (Playwright from `env/node_modules`, Chromium from `env/.browsers`,
local static server rooted at the repo, pages loaded over HTTP like the renderer). Outputs
`reviews/evidence/ux-audit.json` + `ux-audit-summary.md`: contrast with effective-background compositing and
AA-large/AA-body/metadata-7:1 buckets (disabled states separated), touch targets incl. `cursor:pointer` controls,
sub-11/12/14 px text, clipped/overflowing text, out-of-canvas content, page overflow, font-face failures, physical
direction properties attributed per stylesheet, RTL unisolated Latin/number runs, cyan-surface count, seed-token
presence and forbidden-string scan. `--stress` adds an indicative forced-320 dp reflow (canvas override) and a
200 % text approximation (font-size + px line-height doubled). Calibration checks: computed colours are verified
against crops in the PNGs before a contrast finding is scored; the fixed-390 canvas means forced-320/200 % results
are *adaptation evidence*, not per-se contract failures — the design's NOTES must state the reflow/scroll rule.

**Pass C — stress simulations (indicative, labelled as such).** Re-render/inspect at:
(a) **320 dp** width — the real narrow-phone case in `UI_AUDIT.md` UI-10; (b) **200 % type** — inject a stylesheet
that doubles text sizes (approximation: it does not emulate Compose `fontScale` exactly; findings are labelled
`[measured]` as "stress approximation"); (c) **RTL forced** on an LTR page to see what breaks when Arabic lands
(the real app mirrors *everything* when the language is Arabic — `LocalLayoutDirection`); (d) **long strings** —
username 24 chars, room name 30 chars, Arabic labels +20–30 %. These produce S2 hypotheses, not S0 verdicts, unless
the page also fails at default size.

**Pass D — feasibility read of the HTML/CSS.** For each page: list the techniques used that Compose cannot take
as-is (CSS `filter`/`backdrop-filter`/`mask`/`mix-blend-mode` on the map, SVG filters, custom map artwork, text on
a path, fixed-aspect scaling of type, per-frame animation without a static equivalent, non-brand font families,
icon-only glyphs with no label). Then map every visible datum to a field in `Models.kt` / server schema / approved
string; anything unmatched is listed under "data-contract mismatches".

**Pass E — NOTES honesty check.** Compare claimed states/adaptation/feasibility against what the renders and the
real code support; record claims that can't hold (e.g. "RTL-safe" with no Arabic proof, "implementable as-is" with
a custom basemap, "instant tag policy" shown but server default is confirm).

---

## 5. The real-app constraint catalogue (what every direction is judged against)

This section is the evidence base. It is derived from the shipped code on this branch, not from the brief alone.
Where `docs/UI_AUDIT.md` / `docs/ANDROID_REVIEW.md` are historical (they are marked as such), I use them only for
failure *patterns* to avoid re-inheriting, and verify current behaviour in code.

### 5.1 Canonical page set, seed and vocabulary (fixed)
- 14 pages, ids exactly: `auth, roles, home, lobby, hunt-hunter, hunt-prey, chat, result, history, settings,
  sheet-tag-claim, sheet-room-settings, lobby-rtl, home-light`.
- Seed must be identical everywhere: **Riverside Run · K7M2QX · 5 players (3 Hunters / 2 Prey) · Nadia, Omar,
  Selim, Rana, Youssef · zone 240 m · clock 41:12 remaining of 60:00**. Any page showing different names/counts/code
  without a stated variant is a consistency + truthfulness finding.
- Vocabulary (approved): Prey, Hunters, Hunt, Room, Code, Zone, Trail, Report, Tag, Full time, Huntmaster. Copy family
  current: "Hide from your friends.", "Two teams. One block. One clock.", "Track. Tag." / "Hide. Survive."
- Overlays 11/12 are full-page states with the page behind dimmed — dimmed-but-readable is a real requirement (the
  player may still be running; context must survive).

### 5.2 Real information architecture (what is a page, a tab, a sheet, a dialog)
Current shipped IA (`AppRoot.kt`, `RoomScreen.kt`, `SettingsScreen.kt`, `RolesScreen.kt`):
- Routes: **Safety/first-run → Auth → Home ↔ Roles · Settings · Room**. Room is one route with a **Game/Chat tab**
  surface; **History is a dialog** opened from the room header and from Result ("View hunt history").
- Room header: Leave (with confirm), share, history, connection state.
- Sheets/dialogs today: tag claim (prey), tag target picker (hunter), huntmaster dispute resolve, room rules sheet,
  leave confirm, end-hunt confirm, history dialog. Designs may upgrade these to bottom sheets — that is not engine
  work — but **no direction may add a bottom navigation bar** (`design/redesign/screens/12-adaptation.md` §3: the app
  has none; adding one would be a product change).
- Settings today: 5 tabs — Appearance, Language, Permissions, Updates, Account. A redesign may restructure to a
  manual/list; it must still expose all five groups + the server row + storage/cache.
- Roles is the **first-run screen** (welcome + what the app does + mode catalogue + permission request on "Let's
  play") and is later reachable from Home. There is **no separate Safety screen in v0.16** even though the strings
  exist in `i18n/Localization.kt`; the location-sharing disclosure lives in the roles copy today. *Open question for
  every direction:* where the location-sharing disclosure lives (roles first-run vs a settings section) — it must be
  somewhere real; inventing an extra page is a scope question for the Lead/owner, not a silent addition.

### 5.3 Real match state machine (server-authoritative; phases in `Models.kt` / `server/domain/match.ts`)
`lobby → head_start → hunting → paused ⇄ hunting → finished` and `cancelled` (any pre-finish). Facts:
- Timers are **server timestamps** (`startedAt`, `headStartEndsAt`, `endsAt`, `endedAt`, `now`, `match.now`); the
  client renders offset + elapsed. Designs must show a countdown that can be **reconciled after reconnect**; no
  local timer authority, no "pause clock" affordance for players.
- **head_start**: Prey hidden, hunters waiting; localisation copy "Prey are hiding. Hunting starts in {mm:ss}";
  Prey do report during head start (fixed in current code) — so "no reports yet" is a valid but not guaranteed state.
- **hunting**: clock, zone, prey reports (hunters only), trails if enabled, tag actions, chat.
- **paused**: "The hunt is paused. The clock is stopped." (copy exists) — resume by huntmaster.
- **finished**: result moment; **cancelled**: "Hunt cancelled"/"Match cancelled" with no winner.
- **eliminated Prey**: become spectator — copy exists: "You were tagged" + "You are spectating this match. You can
  still chat, but you cannot tag or share new positions." This is a required state on `hunt-prey`, not an optional
  nice-to-have.
- **Huntmaster/admin**: can pause/resume/end hunt, edit rules (next match), resolve **disputed** tags only; cannot
  confirm/dispute a pending tag (that is the prey's decision) and gets **no location power** (`SECURITY.md`,
  `server/src/rooms.ts`). Designs must not give the admin UI powers the server doesn't grant.
- **Tag flow**: hunter picks an eligible prey ("Who did you touch?" / "You must be physically touching the prey")
  → claim sent → prey confirms/disputes → confirmed = tagged/eliminated, disputed = huntmaster resolves
  confirm/reject. A claim unresolved for **90 s** becomes a huntmaster dispute. Tag claims are durable and replayed
  on reconnect (`pendingTags`), so the **claim sheet must be able to reappear after backgrounding**; an expired
  claim must be visually distinct from a live one. `tagPolicy` default is `confirm`; the server enum is `confirm|instant` (`server/domain/match.ts`, the `instant`
  path confirms + eliminates immediately, `docs/API.md`). Corrected skill line (design-smith, 2026-11-04, after my
  query): **(a)** one read-only row "Tags need the prey to confirm" (server-enforced) + a NOTES line is the safe
  baseline and is fully acceptable; **(b)** a `confirm`/`instant` choice is an allowed honest costed proposal
  (client-only cost: control + copy + Arabic strings + tests) that must state the real consequence — `confirm` =
  claim sheet appears, `instant` = tag immediately confirmed/eliminated and **no claim sheet** — and flag it in
  NOTES. Reject a third value, anti-cheat claims, or copy implying the claim sheet exists under `instant`.
- **Connection**: WebSocket + 10 s polling fallback; visible states Connecting/Live/Polling, "Connecting to room",
  "Connection lost", "Reconnecting", "Last updated". Data that exists must not blank on socket loss — stale-with-age
  is the designed behaviour (map, board, chat).
- **Zone**: settings `mode: open|zone`; `zone {centerLat, centerLng, radiusM 50–20000}`; optional shrink
  (`intervalSec 30–3600`, `stepM 5–5000`, `minRadiusM 25–5000` and `< start radius`, `warningSec 0–300`);
  `nextShrinkAt` drives "Zone shrinks in mm:ss" (copy exists, with a warning threshold).
- **Report cadence**: `locationIntervalSec` 30–3600 s (default 300 = 5 min); hunters see latest reports + age;
  "Some prey reports are stale (older than two intervals)." is approved copy; `staleAfterMs`/`now` are in the DTO.
- **Report statuses the map must distinguish**: `hasReport` false (no report), fresh, `stale`, `flagged`
  ("Unverified" — anti-cheat heuristic, never auto-penalised), `eliminated` ("Tagged"). Current app renders these
  too similarly (`UI_AUDIT.md` UI-08) — v2 must fix it by **shape + label**, not opacity/colour alone.
- **Eliminated/flagged/stale counts** are derived from `PreyLocationStatus`; do not invent "tagged player" markers
  or per-hunter stats.

### 5.4 Data-contract mismatch watch list (things a beautiful page may imply that do not exist)
| If the design shows… | Reality | Verdict |
|---|---|---|
| Email field, "forgot password", account recovery, social/Google sign-in | Username + password only; **no email collected, no recovery** (`SECURITY.md` residual #6) | Fake affordance → S1 |
| "Secure / encrypted" messaging | Current deployment is **plain HTTP, no TLS** (`SECURITY.md` residual #1) | Deceptive claim → S0 |
| Store badges, ratings, player counts, "trending", urgency counts | Never in this product; brief forbids fake claims | S0 |
| Global/community profile, friends list, leaderboards, past-hunt stats across rooms | None of it exists; history is **room-scoped** (`MatchHistoryEntry` from room endpoint) | S1 |
| Per-match "distance run", "tags per hunter", "accuracy %", heatmaps | No such data is stored/returned | S1 (if presented as real) |
| A "Report now" / manual position send button | Prey position reporting is **automatic** via the foreground tracking service at the room interval; no manual report endpoint in the client UI | Fake affordance → S1 |
| Hunters-nearby / "they're close" / radar sweep implying live hunter proximity for Prey | Prey never receive hunter positions; server restricts location visibility to hunters | **Privacy violation → S0** |
| Prey seeing other Prey positions | Not in the model and not allowed by the server's hunter-only predicate | **Privacy violation → S0** |
| "System" chat entries as a designed, translated event list | System events are **English strings composed server-side** and stored as message bodies (`server/src/rooms.ts`: "joined the room", "tag claim … expired", "tagged …", "confirmed the tag"). The client's source-key Arabic map cannot translate them | Real i18n gap: designs that make system events structural inherit untranslated English in Arabic → flag S1 + engine/protocol note (structured events would be a server change) |
| History row showing "2/2 Prey survived" | `MatchHistoryEntry` has `winner, cancelled, durationSec, prey[], hunters[]` — **no preyAlive/preyTotal** for past matches (those are `MatchDto` fields for the live/final match) | Mismatch → S1 unless derived-only (counts of names) is shown |
| Result page with per-player tagged/eliminated list | Final `MatchDto` carries counts, not per-player final statuses; the current app only shows captured flags when available | Risk: mark as "only if client keeps the snapshot" |
| Rematch settings / per-match custom rematch | "Play again" returns to the same room/lobby; rules are room settings applied next match | Don't sell a rematch config UI as new capability |
| Server URL editing from Settings | Current copy: "To change the server, sign out and edit it on the sign-in screen." | Must be read-only in Settings |
| "System theme" option | Theme toggle is Dark/Light (no System choice in the UI) | Adding a third state = product change; flag |
| Live player location on the lobby/result map | Prey positions only during active hunting, hunters only; after finish the map has no live data | Don't fake live map motion |
| Trail of players while trails are disabled | Server gates trails on `trailsEnabled`; UI must show the disabled/empty state ("No trails available yet") | S2 if contradicted |
| A completed "update downloaded & verified" without states | Real path: check → available → download (real bytes) → verified → install intent → Android confirm | Show all states or none |
| Player avatars/photos | `MemberDto` has username only; the app uses colour-block initials | Original monogram/cut-corner tags are fine; photo avatars are not |

### 5.5 Format and limit facts the UI must respect
- Room code: **6 chars**, alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` — **no I, O, 0, 1**. A code plate must not
  suggest ambiguous glyphs; case is uppercase; entry should uppercase/trim.
- Username: 3–24, letters/digits/underscore only. **Design for 24-char names** (and long Arabic names) in rosters,
  chat headers, claim sheets.
- Room name: 2–30 printable chars. Password: min 8 (max 200). Chat message: 1–500 chars. Numeric settings are
  whole numbers; zone radius/Lat/Lng are the only decimal inputs.
- Settings bounds: the shipped dialog validates whole numbers loosely (head start 0–999, duration 1–999, report
  interval 1–999 minutes) and **the server enforces stricter bounds** (head start 0–1800 s, duration 300–14400 s,
  report interval 30–3600 s, radius 50–20000 m, shrink interval 30–3600 s, step 5–5000 m, min radius 25–5000 m
  and < start radius, warning 0–300 s) — a design that exposes the real limits is better than inheriting the
  loose client ranges. Validation errors must be visible and specific (approved strings exist: "Enter whole numbers
  for the timing fields", "Enter a valid zone radius in metres", "Place the zone centre on the map first", etc.).
  Errors are **strips/inline**, not dialogs (design/redesign states spec + current app).
- Start gate (server `canStart`): active players ≥ `minPlayers` (default 2), **at least one Prey and at least one
  Hunter**, and **everyone ready**; only the admin can start. Team sizes are not fixed by the client; with 2–10
  players the team sheet must scale (design for 8–10 rows without a nested-card stack). The blocker line is
  client-composed from translated strings ("Before you can start", "No prey yet", "No hunters yet", "Waiting for X
  to ready up") and must sit adjacent to the disabled Begin action.

### 5.6 i18n reality (this is where most "RTL-ready" claims fail)
- Mechanism: English is the **source text**; Arabic is a lookup map keyed by the full English string in
  `i18n/Localization.kt`; **missing key = English fallback**. The app has ~350 approved MSA strings, including every
  lobby/roles/result/settings/claim string. `lobby-rtl` is only genuinely feasible if its copy uses those approved
  strings verbatim — **new copy invented for the RTL proof has no approved Arabic** and will surface English. That is
  an S1 against the proof page, and it is also a copy-governance point: new English labels in *any* direction need
  translation before an Arabic user sees the app.
- Numerals/tokens stay **Western digits, LTR**: clock, code, zone radius, version, URL, "ManHunt". Wrap them in LTR
  isolation (designer may do it with CSS `dir="ltr"`/`<bdi>`; Compose uses `Text(textDirection = Ltr)`/local dir).
- Things that must NOT mirror: the drawn Open Zone mark/wordmark, map geography, clock/code digits, physical team
  glyphs, and nothing about the match data. Things that must mirror: layout, rules, gutters, column order, dock
  sides, sheet title row, chat alignment (own messages end-side mirrors), directional icons (back/send/chevrons),
  cut-corner shapes (`CutCornerShape` mirrors).
- Arabic typography: never Big Shoulders/Instrument Sans/Red Hat Mono for Arabic (no Arabic coverage in the bundled
  Latin faces). The shipped app falls back to the platform Arabic sans (`BoardTokens.kt` `LocalBoardArabic`); the
  design env provides **IBM Plex Sans Arabic** (OFL) as the stand-in at `env/fonts/arabic/` via the `--font-arabic`
  CSS variable — use it for Arabic body/UI, keep the brand Latin faces for LTR numerals/codes/state labels. No
  letter-spacing, no `uppercase()`, +2 sp line height, +8–15 % display leading, budget **+15–20 %** width (PAGE
  INVENTORY §15/DESIGN_PLAYBOOK §7). Arabic display words must be allowed to wrap, not shrunk.
- Bidi hazards: `·`, spaced en/em dashes, "5 / 5 READY"-style composites, "LIVE · 41:12", "(3)" counts, "Tariq says
  they physically touched you." with an Arabic name + Latin punctuation. The current code composes counts as
  `"$readyCount / $total " + t("Ready").uppercase()` — a pattern that breaks in Arabic unless isolated. Test the
  RTL proof for mixed runs and for LTR bleed.
- Known current gaps to not inherit: phase word **"Full time" is passed as an English literal in `ScorePage.kt`**
  (not in the Arabic map); server chat system events are English (above); "Cancelled" as a phase word is translated
  only as the uppercase `CANCELLED` key. A v2 design that makes these prominent must flag the translation work.
- Dates/times: room history shows localised date + duration (`durationSec` may be null → show duration only when
  real); use locale-aware formatting, digits LTR. No relative "2m ago" without a defined rule — the map/chat use
  minute ages ("12 min ago") in the current copy; keep a single convention.

### 5.7 Privacy, safety and honesty obligations the UI carries
- **Prey positions are the sensitive datum.** Server rule: only `hunters` may read prey positions; history also
  requires `trailsEnabled`; admin rank grants **no** location power. Any screen that shows or implies position data
  to a non-hunter is an S0. Prey screen shows own position only + zone + clock + report cadence + tag claims.
- **Tracking disclosure**: while a Prey is being tracked, Android shows a permanent notification ("Android requires
  a visible notification while location tracking is active"); precise reports are kept 30 days by default; the
  first-run/roles copy discloses sharing with Hunters. The design must not hide or contradict this; it should make
  the "you are sharing" state legible on the Prey page ("Sharing your position", "Open the app to resume sharing",
  "Location off", "Waiting for GPS" are approved strings).
- **No surveillance language/visuals.** The brand explicitly rejects military/surveillance readings; radar sweeps
  implying capability, "target acquire", crosshairs, "subjects" language are wrong for this product. Keep the
  "friends' game" emotional register even in the hunter view.
- **Safety surface**: the game is played outdoors; approved safety copy includes "Respect property and local law…",
  "Never run while looking at your phone", "Not a safety service". Whatever page carries first-run disclosure must
  keep that content honest and readable; do not bury it in 11 sp grey.
- **No account/social claims**: no email, no recovery, no MFA, no verified identity, no "friends", no profile photo.
- **Server truth**: test deployment is plain HTTP behind a reverse proxy (no TLS), the app is sideloaded APK with a
  SHA-256 in the changelog, updates install over the current app (same signing key), and the server address is a real
  input the player configures — Settings must not present it as a managed/secure service. Auth's server row is
  demoted (brief) but must stay honest and reachable ("Test connection", "Server is reachable"/"Server did not
  respond").
- **No fake product claims / urgency** (brief non-negotiable): no store badges, no ratings, no player counts, no
  countdown-to-purchase, no "only 2 spots left", no push-notification-style fake banners.

### 5.8 Platform / Compose realities (feasibility ground truth)
- **minSdk 26, targetSdk 37, Compose BOM 2026.09 / m3 1.4**; edge-to-edge with `safeDrawingPadding()` at the root;
  dialogs are separate windows and **do not inherit root insets** (UI_AUDIT UI-04); targetSdk ≥35 makes
  `decorFitsSystemWindows` a no-op. Bottom sheets (m3 `ModalBottomSheet`) are the safer overlay primitive; a
  floating dialog card must be inset/IME-aware. A sheet that repeats the current design's "modal alert in the middle"
  pattern needs that work named.
- **Canvas**: 390×844 dp full-bleed, no OS chrome. In the real app the status bar (~24–40 dp) and nav bar (~24–48 dp)
  are system insets; anything a page pins in the outermost ~24 dp top/bottom can move under insets. Keep primary
  actions ≥24 dp up from the bottom edge and critical labels below the top edge; full-bleed *visual* bleeding is fine.
  The brief says the gesture area is usable canvas — use it for visuals, not for the only copy of a critical control.
- **IME**: composer/fields lift above the keyboard on API 26–29 only with `adjustResize`; the chrome must be designed
  to shrink (composer pinned, content scrolls, board may collapse). Design notes should state the composer behaviour
  with keyboard open; a full-screen page that cannot shrink fails.
- **320 dp / 200 % font scale** are the documented failure cases (UI_AUDIT UI-09/10/12): fixed-height buttons,
  one-row headers with title+code+connection+loader, fixed 320 dp map heights in landscape. Every direction gets
  these checked. Use `heightIn(min=…)`, wrap labels, collapse chrome.
- **Rotation/recreation**: no `configChanges`/orientation lock; route/scroll/dialog/match state must survive rotation
  (`rememberSaveable` is the shipped fix). A design with an ephemeral-only state that would be lost is a finding;
  back/predictive-back: Settings/Roles animate back to Home; Room back = **leave confirmation**, not an exit.
- **Map**: osmdroid `MapView` inside `AndroidView`; tiles are OSM raster with a **ColorMatrix dark/deep-teal
  filter** (`map/DarkPalette.kt`), overlays drawn with `Canvas`/`Marker`/`Polygon` (`map/MatchMap.kt`). Feasible:
  dark/teal tonal treatment, zone ring, trail polyline, custom-drawn markers, accuracy rings, labels, quiet chrome.
  **Not feasible without engine work**: custom vector/branded basemap, CSS map filters/blur/masks, map gradients,
  map labels styled by design, per-feature colouring of OSM features. OSM attribution is a legal requirement — map
  pages must show it. Map controls must stay ≥48 dp and labelled (icon-only needs contentDescription); the map needs a
  **text alternative** (summary + prey status list) — currently missing (UI_AUDIT UI-03, the one finding that blocks a
  user group entirely).
- **Fonts**: only the three bundled OFL faces (Big Shoulders, Instrument Sans, Red Hat Mono); Arabic uses the
  platform Arabic sans in the app / IBM Plex Sans Arabic stand-in in the env (`--font-arabic`) — not a new brand
  face. No other families, no variable fonts, no glyphs from a fifth face; no icon font dependency on new Material icons
  (the shipped system uses an original `FieldMarks` vector set — that is the cheap path; a design that introduces a
  fresh custom icon family is buildable but adds cost).
- **Motion**: short durations (120/180/240 ms), reduced-motion respected (`Motion.kt`, startup has a calm static
  variant). Any design moment must have a static/reduced-motion equivalent; no essential information only in motion.
- **Component reuse**: current shipped primitives (`BoardComponents.kt`, `LobbyBoard.kt`, `MatchSheet.kt`,
  `ScorePage.kt`, `FieldMarks.kt`, `BoardInputs.kt`, `theme/BoardTokens.kt`) make MATCHDAY-grammar pages cheaper.
  A direction that introduces a new primitive family across 14 pages must say why it is worth the build.

---

## 6. Per-page checklist (UX / state / truthfulness / feasibility)

For each page: **job** (what the user must be able to do), **real content** it must carry, **states that must be
rendered somewhere** (page or its sheet; NOTES-only does not count), and the traps I will test. The visual
hierarchy/one-gesture checks live in `prep-visual.md` §4 — I do not repeat them; I test whether the page can do
its job on this app.

### 1. `auth` — sign in / create local account
- **Job:** authenticate against the configured server; quiet, trustworthy form; server settings demoted.
- **Content:** brand line; username (3–24, letters/digits/underscore), password (≥8) with reveal; sign-in /
  create-account switch; submit with disabled/loading states and a visible reason; current server row (editable
  here, "Test connection", "Server is reachable"/"Server did not respond"); footer identity/version.
- **States:** empty, partial/typing, invalid (client-side hint), submitting, wrong credentials, server unreachable,
  server address invalid, keyboard open, first-run (no account yet) vs returning.
- **Traps:** any email/recovery/social affordance = fake (S1); any "secure/encrypted" claim = S0 (plain HTTP
  deployment); server row must not compete with the form (brief: demoted, not hidden); password rules must be
  visible before submit (approved copy "At least 8 characters"); 48 dp; CTA not hidden by IME; Arabic notes: server
  URL and password are LTR tokens inside an RTL layout (isolate); no dead end for "forgot password" (there is none).

### 2. `roles` — sides + mode catalogue (first-run / from Home)
- **Job:** explain the game and the two roles; make Classic obviously playable and planned modes honestly planned;
  in first-run, carry the acceptance/permission step and the location-sharing disclosure.
- **Content:** Prey — you hide / Hunters — you chase explanations (approved copy); "How a hunt runs" steps; "What you
  need" (location, notifications, safe place); Classic playable + summary; Single Prey / Shrinking Zone "Coming soon"
  + "Classic is the only playable mode right now" + a non-dead-end "Play Classic instead"; first-run primary
  (accept/permissions) vs browse-to-close variant; mode position affordance (swipe + visible dots or a list). The
  approved safety strings ("Before you play", "Not a safety service", the respect-property/never-run rules) exist in
  `Localization.kt` but v0.16 renders no standalone Safety screen — the direction must state where that disclosure
  lives (roles first-run is the natural place; a new page is a scope question for the Lead, not a silent addition).
- **States:** first-run vs browse; classic vs planned mode; permission request outcome (denied → what next).
- **Traps:** where the location-sharing disclosure lives (see §5.2) — it must be present and honest (sharing with
  Hunters at the room interval, tracking notification, 30-day retention); planned modes not dead ends; long-form
  body at ≥14 sp in dark (no 11 sp grey paragraphs); 3-mode navigation must be discoverable, not hidden; the brief
  lists "from Settings" as an entry — verify the design's IA statement doesn't promise an entry that doesn't exist
  (real app: from Home).

### 3. `home` — host or join
- **Job:** create a hunt or join by code; reach roles/settings; know the current server/account.
- **Content:** host object (room name, default "ManHunt", "Create hunt") and join object (6-char code plate, "Join
  hunt"); roles ("How it works") and settings entries; current server; sign out; recent/last hunt card ("Last hunt",
  "Last hunt: cancelled") when one exists.
- **States:** empty code, valid code (join enabled), creating, joining, create/join error preserving input, server
  unreachable, last-hunt empty vs present, signed-in identity.
- **Traps:** no fake board/clock/player count before a room exists (reviewer-visual 5.2 — a masthead variant is fine,
  a match board is not); code entry must not accept/render ambiguous glyphs as code styling suggests (server alphabet
  has no I/O/0/1 — better to normalise than mislead); host vs join hierarchy deliberate; 24-char room name; both
  actions ≥48 dp; no bottom nav; the account/server row is quiet, not a second hero.

### 4. `lobby` — room lobby (host view, everyone ready)
- **Job:** get the group into a match: share/prepare the room, pick sides, ready up, host begins; everyone can see
  who is ready and why the hunt can't start yet.
- **Content:** room name + code (6 cells) with copy/share first-class ("Room code copied", Android share sheet);
  "LOBBY" state; ready count `x / y`; team sheet two-up with names, ready marks, host badge, "YOU", unassigned
  indicator; ready toggle ("Ready to hunt" / "Stand down"); host-only "Begin the hunt" with the real blocker line
  adjacent (strings exist: "Waiting for … to ready up", "Need N players", "No prey yet"/"No hunters yet"); "Hunt
  rules" entry; leave (confirmed); connection state (Live/Polling/Connecting/Offline); admin transfer notice.
- **States:** all ready (seed), someone not ready, empty team, non-admin view, room load error, busy on
  ready/begin, connection lost, 8–10 players, long names, cancelled/previous match reset.
- **Traps:** disabled Begin with its reason adjacent (UI_AUDIT verified this pattern; keep it); ready state cannot be
  colour-only (word "Ready" + mark); team switch is locked during a match — show why if tapped; 24-char names must
  not break the sheet; no nested plates; code stays LTR in RTL; leave is destructive-adjacent to a title in the
  current app (UI-20) — v2 must move/confirm it; the sheet must not push Begin below the fold at 320 dp.

### 5. `hunt-hunter` — live hunt, Hunter view
- **Job:** read the clock and zone, see the latest prey reports/trails honestly, tag a prey, keep context under
  reconnects and pauses.
- **Content:** board (`LIVE`, `41:12`, `ZONE 240 m`, `PREY 2 / 2`); full-bleed map with zone ring, own position,
  prey report markers (fresh/stale/flagged/eliminated), report ages, trail toggle ("Trails"/"Hide trails",
  "No trails available yet") when `trailsEnabled`; one tag action → target picker ("Who did you touch?" list,
  "No eligible prey" empty state, "You must be physically touching the prey…"); huntmaster pause/resume/end
  (admin only, confirmed); chat entry; "Prey positions are the latest reports" honesty line; stale-report banner;
  OSM attribution; zoom/recenter controls; pending-claim waiting state ("Tag claim sent – waiting for the prey to
  confirm"); offline/reconnecting keeps last map + ages; paused and head-start states; finished → result.
- **States:** no reports yet, stale reports, flagged/unverified, eliminated prey, no eligible tag targets, claim
  pending, GPS off/permission strip, map tiles loading, offline/reconnecting, paused, head start (waiting countdown),
  admin vs player.
- **Traps:** privacy (only hunters may see prey positions — never leak into other pages); no invented "hunter
  proximity" for prey or "danger level"; marker statuses shape+label; map needs a text alternative list; tag target
  list must scroll (UI-13); tag action in thumb zone while walking; map chrome must not compete with clock; no tiny
  map labels; paused must stop the visual clock, not just the copy; report age from `recordedAt` vs `now` with a
  stated rounding rule (current copy uses minutes).

### 6. `hunt-prey` — live hunt, Prey view
- **Job:** survive: know own position, zone, clock, how sharing works; respond to tag claims; continue/understand
  elimination.
- **Content:** own position + zone ring + clock; "Sharing your position" state and the report cadence ("every 5
  minutes", from `locationIntervalSec`) stated honestly; location states ("Location off", "Waiting for GPS", "Open
  the app to resume sharing", "Enable GPS"/"Allow in settings"); tag-claim arrival (sheet 11) + persistent re-entry
  banner; eliminated/spectator state ("You were tagged" + "You are spectating this match. You can still chat, but
  you cannot tag or share new positions."); pause/head-start states; chat entry.
- **States:** sharing active, paused/backgrounded, GPS denied/off, waiting for fix, claim pending, eliminated,
  paused, head start, offline/reconnecting, finished.
- **Traps:** **any other player's position is an S0 privacy violation** (prey see own only; hunters' positions are
  never available to prey); no manual "report now" (automatic); do not claim invisibility — the copy must not say
  hunters can't see you (they get periodic reports); eliminated must be a designed moment that explains the match
  continues (spectating); claim sheet must be able to reappear after backgrounding; report cadence must match the
  minute interval, not a made-up second-level UI.

### 7. `chat` — room field log
- **Job:** talk with the room, see what happened in the match, never lose a draft or a message silently.
- **Content:** player messages (name + team signal + time) and system events distinct (only real event strings exist
  server-side: joins/leaves, admin transfer, tag claim/expiry/confirm, tagged, phase events); own messages; composer
  with 500-char limit; send busy + disabled when empty; pagination ("Load older messages", "Loading older
  messages", "No older messages"); empty state ("No messages yet. Say hello."); send error preserving draft;
  connection lost/reconnecting; IME-safe composer; scroll anchor when loading older; room context (code/clock) still
  available when chat is a tab.
- **States:** empty, filled, loading older, no older, sending, send error, offline, long message, 24-char sender,
  Arabic RTL alignment, system events in Arabic (see gap §5.4).
- **Traps:** no read receipts/typing indicators/reactions/attachments/moderation (no data); system-event copy is
  server-English — a design that makes system events prominent inherits an i18n gap; own-message alignment must
  mirror in RTL with LTR times; message time format consistent (mono gutter); 500-char limit represented without
  turning the composer into a form; chat during hunt must not hide the clock/board context entirely.

### 8. `result` — full time
- **Job:** understand the outcome and choose the next step.
- **Content:** "Hunters win." / "Prey win." / "Hunt cancelled" (sentence case, full stop, no exclamation — the
  shipped `ScorePage.kt` strips the legacy `!`), `FULL TIME`/`CANCELLED` state, score `preyAlive / preyTotal`
  (**canonical: Hunters win, played 18:48, PREY 0 / 2**; prey-win variant is the honest 2 / 2 — never fabricate
  "1 survived"), duration played with note "played", actions "Back to lobby" + "View hunt history"; **rematch is
  a brief-required proposal the app does not ship** — it needs a small server/API addition and MUST be flagged in
  NOTES (PAGE_INVENTORY §20.1); eliminated player's perspective; honest degradation when final counts weren't
  captured (current app shows only what it has); result-sync lag must never hide the winner.
- **States:** hunters win, prey win, cancelled, eliminated-view, rematch busy, history dialog loading/error.
- **Traps:** per-player stats/tag lists/distance = invented data unless declared as needing new state (S1); "Full
  time" has no Arabic mapping in the current localization set — flag translation work; winner colour must be
  semantic (team colour), not a generic green/red success/error pair; no fake share-card with unsupported stats;
  actions ranked and thumb-reachable; full-screen moment, not a centered dialog; cancelled must not show a winner.

### 9. `history` — past hunts
- **Job:** scan past hunts in this room, open one summary, recover context ("did we play here?").
- **Content:** room-scoped list (winner, cancelled, date/time, duration when `durationSec` is real, prey/hunter
  names); exactly one expanded match summary; empty state ("No hunts in this room yet." + "Hunts appear here once
  they finish."); loading ("Loading match history...") and error ("Couldn't load the hunt history. Check your
  connection and try again.") are distinct; cancelled row ("Hunt cancelled", "Last hunt: cancelled").
- **States:** empty, loading, error, list, expanded detail, cancelled entry, long list scroll, long names.
- **Traps:** room-scoped, not a global career — copy must say so; **no `preyAlive`/`preyTotal` in
  `MatchHistoryEntry`** (S1 if a historical row shows a survival score); `durationSec` null → don't render "0 min";
  dates localized with LTR digits; empty ≠ error (the current app has a known bug class here — fix, don't inherit);
  no invented map replay or per-hunter stats; row targets ≥48 dp.

### 10. `settings` — settings
- **Job:** change how the app looks/reads, manage permissions, updates, account/server, storage — without surprises.
- **Content:** theme Dark/Light; text size slider with a live sample and honest apply timing; language
  English/العربية (whole app mirrors immediately); permissions (location allowed/not + manage; notifications
  allowed/not + manage; rationale); updates (installed version, check, available, download with real bytes,
  "Verified. Tap Install update.", install confirmation, "What's new" changelog, error states); server row
  (read-only: "To change the server, sign out and edit it on the sign-in screen."); account (signed in as, sign
  out); storage (cache size, calculating, clear); version footer.
- **States:** update none/checking/available/downloading/verified/install prompt/error; permissions denied; cache
  calculating/clearing; signing out; language switch; theme switch.
- **Traps:** text-size slider 48 dp + value shown LTR in Arabic; no "System theme" third state (§5.4); update
  section must not look like a store (sideloaded APK — "Download", "Install", no badges/ratings); sign-out is
  destructive → confirm; server read-only; five groups must remain scannable at 320 dp/200 % (the current app's
  five-tab pager is an IA risk, not a model to copy); permission rows must show real denied state, not a toggle
  that lies; every row ≥48 dp.

### 11. `sheet-tag-claim` — Prey receives tag claim
- **Job:** decide confirm/dispute under time pressure, knowing the consequence; never lose the decision if the app
  is interrupted.
- **Content:** who + when + physical consequence ("Tariq says they physically touched you. Confirm the tag?" — or
  a design's honest equivalent), claimant team identity, Confirm primary / Dispute secondary as two real targets,
  expiry (90 s claim; then huntmaster decides — `expiresAt`), busy state, send-error retry, background page dimmed
  but context readable (clock continues), dismissed-state re-entry banner ("A tag claim is waiting for your
  answer." + "Confirm or dispute it to keep the hunt fair." + "Review tag claim").
- **States:** live claim, near-expiry, dismissed banner, error/retry, resolved; related huntsman flows: hunter
  "waiting for prey" and huntmaster "Review dispute" (confirm/reject) are separate surfaces — do not merge
  semantics.
- **Traps:** no accidental confirm (spacing/prominence); the claim must be re-showable after backgrounding
  (`pendingTags` replayed); a *disputed/expired* claim must not look identical to a live claim; no "reject" for
  prey (prey confirms or disputes; only huntmaster confirms/rejects a dispute); scrim must not make the clock
  unreadable; announce via live region; claim strings have approved Arabic — good RTL test; the sheet must be
  operable one-handed while walking.

### 12. `sheet-room-settings` — host edits hunt rules
- **Job:** change the next hunt's rules with real bounds and clear feedback; never think a change applied when it
  didn't.
- **Content:** "Applies to the next match. Rules are enforced by the server."; timing (head start minutes, duration
  minutes, report interval minutes); play area (open vs zone, radius m, zone centre via map tap / my location /
  manual lat-lng); shrink (enabled, every min, by m; min-radius relationship); trails on/off; tag policy
  confirm/instant **only if the consequence copy is carried** (design-smith line: read-only "Tags need the prey to
  confirm" is the safe baseline; a confirm/instant choice is an allowed client-only proposal that must say
  `instant` means immediate elimination and no claim sheet, flagged in NOTES); validation messages; Save/Cancel;
  host-only.
- **States:** loading current settings, dirty, saving, saved, invalid field, server error, zone not set ("Place the
  zone centre on the map first"), GPS unavailable/manual entry, shrink disabled, keyboard open, scroll at 60 %
  sheet height.
- **Traps:** server locks settings during an active match (`settings_locked`) — disable/explain, don't let the host
edit and fail; real bounds (§5.5), not free-form values; switches need labels (UI-14); numeric fields must not accept
  letters; units explicit (m vs min); effect timing stated; a map picker inside a sheet is buildable but heavy — if
  the design shows it, name the cost (osmdroid AndroidView inside sheet, state restore); dense form must survive
  320 dp/200 %/Arabic expansion; save disabled vs validation — never silently drop edits; no engine promise ("applies
  live during a hunt" is false unless server allows it — check copy before claiming).

### +1. `lobby-rtl` — Arabic RTL proof (must be the same lobby state as page 4)
- **Job:** prove the system genuinely works in Arabic, not that a page has `dir="rtl"`.
- **Must show:** the *entire* lobby in Arabic (approved MSA strings only), layout mirrored (rules, gutters, column
  order, dock sides, cut-corner shapes, icons that mirror), numerals/code/clock LTR-isolated, mark placed mirrored
  but not mirrored itself, no tracking/uppercase on Arabic, no clipped ascenders/descenders, +20–30 % expansion
  handled, contrast holds, same seed data and state as the LTR lobby.
- **Traps:** any English UI string except approved Latin tokens (ManHunt/code/URL/version/digits) = S1; Latin display
  face on Arabic = S1; "5 / 5 READY"-style composites and `·` bidi hazards; team column order semantically mirrored;
  ready marks and host badge readable; code cells not reordered into nonsense while the code stays LTR; no literal
  mirror of the mark/map; Arabic font fallback working (browser vs Android difference should be noted in NOTES).

### +1. `home-light` — light theme proof (must be the same home state as page 3)
- **Job:** prove a real second theme, not an inverted page.
- **Must show:** same content/state as `home`; daylight surfaces + ink type with AA; team/cyan roles re-weighted for
  light (the shipped light palette uses `#B33A0F` / `#5B21B6` / `#0C6B84`, all ≥5.6:1 on `#F7F9FC`); hairlines
  and input outlines ≥3:1 as UI boundaries; a documented decision for the board (shipped design keeps the board ink
  in daylight — a deliberate, documented alternative is acceptable, an accident is not); visible focus/selected
  states; no shadows/glows (the system is flat); same hierarchy as dark.
- **Traps:** dark-theme accents lifted onto light (coral `#FF7A59` on white is 2.57:1 — UI_AUDIT UI-02); white text
  on light cyan; hairline-only controls invisible in daylight; light theme not a second identity (same type/rules);
  screen must not assume `prefers-color-scheme` — the app theme is an in-app setting.

---

## 7. Cross-cutting tests (every direction)

### 7.1 State completeness matrix
The brief requires real states "where the page has them". Minimum matrix I will check against the render (a state
can live on a variant page, an inset panel or a sheet — but it must be *designed*, and the NOTES state index must
point at it):

| State | Pages where it is required (real product) |
|---|---|
| Empty (nothing yet) | lobby (empty team), hunt-hunter (no reports yet / no eligible prey), chat (no messages), history (no hunts) |
| Loading | auth submit, home create/join, room join/load, map tiles/first fix, chat older page, history, update check/download, cache size |
| Error + retry | auth (creds/network), home create/join, room load/actions, tag claim send, chat send/older, history, update check/download |
| Offline / reconnecting / last updated | lobby, both hunt views, chat — must keep last data and show age, never blank the map/board |
| Paused | both hunt views (clock stopped, "The hunt is paused. The clock is stopped.") |
| Head start | both hunt views ("Prey are hiding. Hunting starts in {mm:ss}") |
| Eliminated / spectating | hunt-prey (required), result (eliminated perspective), lobby after finish |
| Claim pending / disputed / expiring | sheet-tag-claim, hunt-hunter waiting state, huntmaster dispute |
| Permission denied / location off | hunt-prey, hunt-hunter, settings/permissions |
| Update available / verified / installing | settings/updates |
| Cancelled | result, history, (board state word) |
| Long content / long names | rosters, chat, claim sheet, history |
| Narrow + 200 % font scale | all form/dock/board pages (320 dp stress) |
| RTL / Arabic | lobby-rtl proof (and stated system rule) |
| Light theme | home-light proof (and stated system rule) |

Missing state = S1 (or S2 if the page is not core and the state is exotic). Rendering only happy paths is a real
rubric miss on axis 5 regardless of NOTES claims.

### 7.2 Flow & dead-end map
- **Real flows to trace:** first run (roles → auth → home); returning (auth → home); host (home → create → room
  lobby → begin → hunt → claim → result → play again/back to lobby); join (home → code → room; deep link → room
  after consent+session); browse (home → roles; home → settings → back); invite share; room leave (confirm);
  match end (result → back to lobby); eliminated (hunt → spectating → result).
- **Back behaviour:** system back from Settings/Roles returns Home (predictive back exists); from a room, back is
  the **leave confirmation**, not an exit; from an open sheet, back dismisses the sheet first; from a claim sheet,
  back must not silently dismiss a decision that then times out — dismissal must leave the persistent banner.
- **Interruption tests:** rotate mid-claim / mid-settings; background mid-hunt (tracking notification, "Open the app
  to resume sharing"); kill and reopen (session restored, room restored? route restore was fixed with
  `rememberSaveable`); reconnect after socket loss (data repopulates, no blank map); open from deep link while
  already in a room; claim arrives while backgrounded (notification → sheet on resume).
- **Dead ends:** every control leads somewhere or is disabled with a visible reason; planned modes have an escape;
  empty states have an action; errors have a retry or a way out; "no prey to tag" offers a close; settings
  sub-surfaces have back; result always offers two ways forward.
- **Destructive actions:** leave room, end hunt, sign out, dispute a tag, cancel update — guarded, named
  consequences, not adjacent to the primary action.
I will name any dead end with the page + control, and check whether the direction's system defines the recovery.

### 7.3 One-handed night-use rules
- Primary action of each page inside the **bottom third** (thumb zone), with ≥48 dp, reachable without regripping;
  no primary action in the top quarter. Secondary/rare actions may sit high; destructive actions must not sit next to
  the primary (mis-tap).
- Assume the phone is at arm's length, in the dark, glare-capable, possibly wet/cold fingers, and the user is walking.
  So: no precision drags for essentials; no tiny stepper buttons; no swipe-only pagination for a required decision;
  no hover; no 100 ms tap windows; text at a glance; the clock/board readable at 30 % thumbnail.
- Minimise typing while in the hunt: codes are typed in the lobby context only; search boxes/fields do not belong on
  hunt pages; the claim decision is two taps, not a form.
- The claim is a **time-pressured decision while moving** — test one-hand reach to both actions, thumb occlusion, and
  that the clock remains legible in the dimmed background.
- Dark UI: highest-value information at high contrast, decorative hairlines don't fake content, map chrome quiet;
  motion is short and non-essential; reduced-motion has a static equivalent.
- Night colour discipline: cyan/coral/violet stay semantic; don't use error red for anything but errors; don't add
  bright non-semantic accents that steal the glance (this is also reviewer-visual's 5.4 — I check contrast/legibility
  of the result, not the aesthetic).

### 7.4 Touch, focus and interaction affordances
- Every actionable thing ≥48 dp on its **hit box**, with ≥8 dp separation between adjacent decision targets; icon
  buttons need a visible-or-assistive label; switches/checkboxes need a label association.
- Disabled controls still legible (≥3:1 text is good practice) and accompanied by the reason (the shipped
  "start blockers" pattern is the model).
- Focus/selected/active states visible and ≥3:1 against their surroundings (keyboard/pointer and accessibility);
  selected team must be shape+word+border, not colour only.
- Nothing depends on colour alone: team (word+shape+colour), report status (shape+label), ready (word), connection
  (word), error (word+icon), claim state (label), selected language/theme (check/word).
- Tap targets in lists (roster rows, history rows, chat avatars) at least the row height ≥48 dp.

### 7.5 Type, numbers and scaling
- Body ≥14 sp eq., auxiliary ≥12 sp eq. (brief); machine metadata at 11 sp only with ≥7:1 contrast and never for
  anything a player must read; no 9–10 sp labels anywhere.
- Numbers that tick: tabular figures, fixed width, no reflow; clock/countdown at board scale; code in mono; all
  Arabic numerals LTR-isolated.
- 200 % font scale: no clipped labels, no fixed-height buttons/docks/board rows, no overflowing code cells; test the
  longest labels (claim consequence, update explanations, room-rule labels in Arabic) at 200 %.
- Line length ≤ ~68 characters for body; no justified text; hyphenation not needed.
- Uppercase/tracking only for machine state words in a Latin face; Arabic has neither.
- Do not shrink type to win a layout; wrap or grow instead (`heightIn`).

### 7.6 Contrast & colour discipline — reference values (computed, WCAG 2.x formula)
Shipped semantic pairs — use as a sanity baseline for any direction that keeps the palette roles. These are the
brand tokens from `design/redesign/tokens.md` / `BoardTokens.kt`:

| Pair | Ratio | Verdict |
|---|---:|---|
| chalk `#E6EDF7` on field `#0B1220` | 15.89:1 | AAA |
| muted `#A7B6CC` on field `#0B1220` | 9.10:1 | AAA |
| muted `#A7B6CC` on surface `#131C2E` | 8.28:1 | AAA |
| cyan `#22D3EE` on field | 10.36:1 | AAA |
| coral (Prey) `#FF7A59` on field | 7.29:1 | AAA |
| coral `#FF7A59` on surface `#131C2E` | 6.63:1 | AAA |
| violet (Hunters) `#A79BFF` on field | 7.82:1 | AAA |
| violet on surface | 7.12:1 | AAA |
| on-cyan ink `#04222B` on cyan | 9.16:1 | AAA |
| chalkDim `#7C8DA8` on field | 5.56:1 | AA |
| error `#FF8A8A` on field | 8.25:1 | AAA |
| light: ink `#0F172A` on daylight `#F7F9FC` | 16.93:1 | AAA |
| light: muted `#475569` on daylight | 7.18:1 | AA |
| light: cyan `#0C6B84` on daylight | 5.77:1 | AA |
| light: prey `#B33A0F` on daylight | 5.64:1 | AA |
| light: hunters `#5B21B6` on daylight | 8.52:1 | AA |
| light: error `#B91C1C` on daylight | 6.13:1 | AA |
| **dark accent on white (common mistake)** coral `#FF7A59` on `#FFFFFF` | **2.57:1** | FAIL (UI_AUDIT UI-02) |
| **hunters dark accent on white** `#8B7BFF` on `#FFFFFF` | **3.29:1** | FAIL for body text |

Rules I enforce: 4.5:1 body/labels, 3:1 large text and non-text boundaries; team text on tinted backgrounds must be
computed against the **actual tint composite**, not the accent alone; scrims must not reduce required background
context below readable contrast; disabled states need not hit AA but must not disappear; focus rings ≥3:1; the map is
a picture and needs a text alternative (its own contrast doesn't satisfy a11y).

### 7.7 RTL / Arabic / i18n execution checklist
1. Layout mirrored with logical properties; no hard-coded `left/right` in the page CSS for layout.
2. Approved MSA strings only on the proof page (any new English = untranslated in Arabic → S1 for the proof, and a
   translation task for the final design).
3. Numerals/codes/clocks/URLs/version LTR-isolated; no bidi reordering in mixed runs; no `·`/spaced-dash hazards.
4. Arabic set in the platform Arabic sans, not Big Shoulders/Instrument Sans/Red Hat Mono; no tracking, no uppercase,
   line-heights +2 sp, display allowed to wrap.
5. Expansion +20–30 % handled without clipping/truncation; 320 dp × 200 % stress on the RTL page.
6. Icons: directional ones mirror; map/mark/clock/code/team glyphs do not; cut-corner shapes mirror.
7. Team column order, dock sides, header order and chat alignment mirror semantically (not just `text-align:right`).
8. Same seed data/state as the LTR proof; the page is a *proof*, not a simplified mock.

### 7.8 Semantics / assistive-tech checklist (design-level, where a static design can carry it)
- Map: a text alternative — map summary (zone radius, report counts, stale count, own position present) and a
  **prey status list** (name + status + age) on hunter pages; no core information only in raster.
- Status changes (claim arrives, ready changes, error, reconnecting) are announced in the design notes as live-region
  intent; errors are not silent banners.
- Every icon-only control has a label; switches labelled; the loader does not replace a button label; one loading
  announcement per thing.
- Headings/structure exist for TalkBack navigation on long pages (roles, settings, history).
- Focus order = visual order; focus visible; no keyboard traps (sheets close with back/escape).

### 7.9 Feasibility checks I run per page
- **Data**: every datum mapped to `Models.kt` / server field / approved string (see §5.4). Unmapped = flag.
- **Effects**: list CSS-only techniques (filter/mask/blend/blur/gradient, custom map, text-on-path, scroll-driven
  motion) and say what Compose equivalent exists or that it needs engine work. Static vector/CSS-drawable geometry is
  fine; canvas art is fine if reproducible with Canvas/Path; **custom map rendering is not**.
- **Assets**: fonts = the three OFL faces + platform Arabic; icons must be original vector (a new icon family is
  costed, not free); no external images/network assets (brief).
- **Structure**: page maps onto existing routes/sheets; no new navigation paradigm; no new bottom nav; sheet vs page
  choice is cheap; a *new status bar/HUD overlay system* across pages is a build-cost note.
- **State**: timestamps/expiry/ages renderable from real fields (server offset, `now`, `expiresAt`, `recordedAt`,
  `nextShrinkAt`, `serverNow`); no client-authoritative timers.
- **Hardware**: map + GPS + IME + insets + 320 dp + 200 % + rotation survive; motion has reduced-motion; battery
  claims not made.

### 7.10 Honesty / no-fake-claims sweep (S0 category)
Search every page for: player counts not in the room, ratings/stars, store badges, "trusted by", "secure/encrypted",
"real-time tracking" (the app reports at an interval — "live" is wrong for positions), "always visible", "friends
online", "100 % accurate", "we never share your location", urgency timers that aren't real, notifications that
don't exist, "unlimited", "pro", pricing. This product has none of that and the brief forbids it.

---

## 8. Questions I will ask each direction

**Shared (asked via NOTES/designer message, answers judged against pages):**
1. Where is the **state index**? Point me at the render for each of: empty, loading, error, offline/reconnecting,
   paused, head start, eliminated, claim pending, update available. (If it's only described, it doesn't exist.)
2. **Privacy check:** on `hunt-prey`, what position information is visible, and why is it not a violation? On
   `hunt-hunter`, how are no-report / stale / flagged / eliminated reports distinguished without colour alone?
3. **Data check:** for the result score and the history rows, which server fields feed them? For room rules, which
   bounds are enforced in the UI? (I will compare to `Models.kt`/server.)
4. **Report cadence:** how does the page communicate the automatic 5-minute location interval and the sharing
   states (on/paused/GPS off/backgrounded) without implying a manual report action?
5. **Claim lifecycle:** what happens if the claim sheet is dismissed, if the app is backgrounded, if 90 s pass
   (huntmaster dispute)? How is a disputed claim visually distinct from a live one? Is there any way to confirm by
   accident?
6. **One-handed/night:** which control is the primary on each page, where is it, and what is the reach path? Which
   page is worst and why? What breaks at 320 dp / 200 %?
7. **RTL:** which strings on `lobby-rtl` are approved MSA (cite the source), which are new English, and how are
   numerics/codes isolated? Which icons mirror? What did you do about Arabic type (face/leading/tracking)?
8. **Light:** what are the actual text/background pairs in `home-light`, and their ratios? What happens to the board
   and the team roles? Is the daylight translation documented as a rule or ad hoc?
9. **Feasibility:** list the Compose/engine work this design needs beyond existing primitives — sheets, new drawing,
   new data, new API, new fonts, custom map. Which effects are CSS-only? What is the cheapest page to build and the
   most expensive?
10. **Chat system events:** how do you handle the fact that system events are English server strings (untranslated in
    Arabic)? Is the design robust if those are restyled or structured later?
11. **Copy/tone:** which strings are new? Which are approved current copy? Any claim about security, accuracy or
    privacy that the deployment cannot keep?
12. **Dead ends:** where does the user land if they leave/back out at the hardest moment (claim, room entry, result,
    update)? What is the recovery path for each error state?

**Per territory — the UX/feasibility-specific probes (on top of reviewer-visual's visual probes):**
- **A — Matchday, raised:** the board grammar is already shipped; what does v2 do about the pages where the board
  cannot carry hierarchy (auth, roles, settings, chat)? Does the more assertive plate system survive 320 dp/200 %
  and the settings form? Where is the state design (the current app's weak spot), and is the tag claim a moment with
  consequence or still a sheet? What is genuinely cheaper/better to build than the current implementation?
- **B — Street signal:** where does the legibility stress break first (clock, tag action, claim decisions, chat
  text, settings labels)? Is the poster device a system that also works for dense forms and the map HUD, or does it
  degrade into decoration there? How do flat colour fields handle disabled/stale/error/dispute states without a
  second colour system? Is the one-handed night test actually passed on `hunt-hunter`/`hunt-prey`/claim? Which
  elements are cheapest to tone down for implementation?
- **C — Field instrument:** is the density data-honest — does every mono number/marker map to a real field? Can the
  map-first surface be built on osmdroid overlays (no custom basemap)? Where is the human moment and the primary
  action's 48 dp+ target on the map pages? Does the hairline/HUD system survive 200 % text and Arabic expansion on
  settings/room-rules, and is the clock still the first glance? What is the accessibility plan for a canvas-like
  HUD (text alternative list, focus targets)?

---

## 9. Deliverables and protocol (round 1, task-7)

### Files (my write scope: `design/ui-v2/reviews/`)
1. `reviews/round-1-ux.md` — per direction: per-axis score 1–5 with 2–4 sentence justification (focus 5/6/7, cross-
   check 3/4), top 3 strengths, top 3 problems with **one concrete fix each**, worst 3 pages and why, page-by-page
   gap table (page → severity → finding → evidence → fix), feasibility flags, RTL/light read, state-completeness
   table, plus cross-direction **3 worst UX risks** and **3 cheapest wins** (§9.3), per-page UX picks, and the
   designer dialogue log.
2. `reviews/scores-round-1.json` — flat rows, aligned with reviewer-visual's schema:
```json
{
  "reviewer": "reviewer-ux",
  "round": 1,
  "rubric": "design/ui-v2/briefs/02-evaluation.md",
  "baseline": "v0.16 MATCHDAY Board (docs/screenshots/premium)",
  "scores": [
    { "direction": "A", "axis": "hierarchy", "score": 4, "note": "…evidence, page ref…" }
  ]
}
```
   Axes keys exactly: `brand_fit, distinctiveness, hierarchy, consistency, interaction, a11y_rtl, feasibility`
   (same seven; one row per direction per axis = 21 rows). Notes one-two sentences with page refs.
3. `reviews/evidence/` — raw audit output (JSON/CSV) and, if useful, crops for disputed findings. Not a dumping
   ground; keep it referenced from the main file.
4. Dialogue log — append to `round-1-ux.md` under "Dialogue": timestamp, target, message gist, reply, decision
   (accepted / partially accepted / pushed back / fixed).

### §9.3 Cross-direction lists (required by task-7)
- **3 worst UX risks across all directions** — judged by "if this shipped, what hurts most": e.g. a privacy leak, a
  claim decision that can be missed, a map page that can't be used one-handed/stressed, a state the game needs that
  no page renders, a data lie on result/history. Each with severity, which directions share it, and the fix.
- **3 cheapest wins across all directions** — high value / low cost: copy+state additions, one component state, a
  touch-target/contrast fix, a re-entry banner, an LTR-isolation fix. Each with effort (S/M) and where to apply.

### Messaging protocol
- One short message per designer (`designer-a/b/c`, direct) with: their 3 highest-severity UX/a11y/feasibility
  findings + concrete fix each, one thing worth keeping, and an invitation to push back with evidence. Durable detail
  stays in the file. Also send cross-cutting items that affect all three (e.g. claim lifecycle, system-event
  translation, map text alternative) to the relevant designers, not broadcast spam.
- Reviewer-visual: exchange scores after both files exist; reconcile axis by axis; agree the joint table and page
  picks; I contribute the implementation read and a11y/feasibility sections to `FINAL-RECOMMENDATION.md` (task-12,
  reviewer-visual owns).
- Lead: one short report — paths + headline verdict + blockers. Lead only gets the summary; the evidence is in-file.

### Round-2 / final pre-commitment
- Re-score only axes that changed, plus a **regression check on all 14 pages** (a fix that breaks the system is not a
  fix); compare renders to the round-1 evidence, not to intent.
- `FINAL-RECOMMENDATION.md` (with reviewer-visual): final table + dissent, per-page best picks + steals, **my
  implementation read** (tokens to formalize, component inventory, engine/changes needed, risk areas, sequencing),
  top owner questions, honest limitations. The owner makes the taste call; scores are evidence, not a verdict.

---

## 10. What I am waiting on before round 1 (and how I handle absence)

- **`skills/PAGE_INVENTORY.md` + `REVIEW_RUBRIC.md` + `DESIGN_PLAYBOOK.md`** (design-smith) — **received 2026-11-04 and
  reconciled in §12**; authority order for round 1: brief → skills → this prep, with the shipped code as the
  factual tie-breaker (skills state the contract; code is ground truth where they disagree). Any skill/code conflict
  is reported to design-smith/Lead, not silently resolved in a score.
- **`env/README.md` + canvas contract** (design-env) — for exact selectors/URLs my audit script should use (render.mjs /
  serve.mjs exist; README may still be landing); if missing I inspect page sources directly.
- **Renders** — all 14 pages per direction at exactly 1170×2532 with fonts loaded; if a page is missing/defective I
  log it as a delivery issue and do not invent a verdict for it.
- **Direction NOTES.md** — per-page intent, state index, Compose/feasibility notes, known weaknesses; I check claims
  against the render and this document.

## 11. Sources read for this prep (traceability)
`design/ui-v2/briefs/{00-workstream,01-directions,02-evaluation}.md`; `design/ui-v2/README.md`;
`design/ui-v2/reviews/prep-visual.md`; `design/redesign/{direction,tokens,audit}.md` and
`design/redesign/screens/{00-index,01-shell-and-board,02-auth,03-first-run-safety-and-roles,04-home,05-lobby,06-live-hunt,07-chat,08-result-and-history,09-settings-and-updates,10-dialogs-and-sheets,11-states,12-adaptation}.md`;
`docs/{UI_AUDIT,ANDROID_REVIEW,SECURITY,UI_REVIEW,LOBBY_AUDIT}.md`; `docs/screenshots/premium/*` (+ MANIFEST);
Android: `ui/AppRoot.kt`, `ui/RolesScreen.kt`, `ui/HomeScreen.kt`, `ui/SettingsScreen.kt`, `ui/RoomScreen.kt`,
`ui/LobbyBoard.kt`, `ui/BoardComponents.kt`, `ui/BoardInputs.kt`, `ui/MatchSheet.kt`, `ui/ScorePage.kt`,
`ui/FieldMarks.kt`, `ui/HistoryDialog.kt`, `ui/RoomSettingsDialog.kt`, `ui/theme/{Theme,BoardTokens,Motion}.kt`,
`map/{MatchMap,DarkPalette}.kt`, `data/{Models,InputRules,GameModes}.kt`, `i18n/Localization.kt`;
server: `server/src/{app.ts,rooms.ts,domain/match.ts,domain/types.ts}` (read-only, for contract truth);
`design/brand/identity/final/`, `design/brand/motion-kit/assets/fonts/` (available assets).

*This prep is method + constraints. It contains no scores and no direction judgements; those are written only after
the round-1 renders exist.*

---

## 12. Reconciliation with the design-smith skills (read 2026-11-04, after the first draft of this prep)

`skills/REVIEW_RUBRIC.md`, `skills/PAGE_INVENTORY.md` and `skills/DESIGN_PLAYBOOK.md` landed while this prep was
being written. They are now the round-1 operating authority **alongside** the briefs; this section records what
changed and what I adopt so the review file only cites one method.

### 12.1 Adopted from `REVIEW_RUBRIC.md`
- **Anchors and weights**: the rubric §1 anchors supersede my §3 summary for the *published* score justification
  (my §3 stays as the internal test list). Weights per brief; weighted total = Σ(axis × weight) on a 5-point scale.
- **Half points** are allowed only with a written reason (my earlier "integers only" rule yields to the rubric);
  JSON rows may be `x.5` with the reason in the note. Otherwise the score is the rubric anchor the evidence meets.
- **Automatic caps / red flags (rubric §2)**: I apply them before averaging and list them per direction. Mapping to
  my severity scale: banned material/fake content/contradicts-rules/no-genuine-RTL/light-identity/copy-violation
  are **S0/S1** findings; a missing 14th render or an illegible page is a **delivery failure** (report first,
  score after the designer confirms), consistent with rubric §2.3 and prep-visual Rule 5.
- **Deliverable acceptance (rubric §3)** is the **pre-gate**: I check the 14 renders / exact 1170×2532 / NOTES
  sections / seed data / approved assets *before* scoring a direction. A direction failing acceptance is not
  reviewable and gets a delivery report, not a verdict.
- **Page checklist (rubric §4) + system checks (§5)** are walked in addition to my §6/§7; where they overlap, a
  single finding is recorded once and cited to both.
- **Template (rubric §8)**: `round-1-ux.md` uses its per-direction shape (weighted total, axis table with evidence,
  top 3 strengths, top 3 problems + concrete fixes, page gaps vs `PAGE_INVENTORY.md` §18, dialogue log), then adds
  my UX/a11y/feasibility sections and the cross-direction "3 worst risks / 3 cheapest wins".
- **Copy rule correction**: the approved result string in `Localization.kt` contains `!` but the direction copy
  rules ban exclamation marks and the shipped `ScorePage.kt` already strips it — the design should read
  "Hunters win." and the new key needs the copy owner/translation later. I will score the period version and flag
  the key delta, not penalise either way.

### 12.2 Adopted from `PAGE_INVENTORY.md`
- **§0 seed is authoritative**: Riverside Run / K7M2QX / 5 players (3H/2P) / 240 m / 41:12 / 60:00; players
  suggested split Prey **Nadia, Rana**, Hunters **Omar, Selim, Youssef**, host/huntmaster one of them used
  consistently; **result = Hunters win, played 18:48, PREY 0/2**; result variants = Prey win 2/2, cancelled.
- **§2 data contract + client UI state** replaced my shorthand: `connected` exists but is **not rendered** → the
  offline/reconnect state is a designed gap, not an existing screen; one shared `busy`/`error` field means the
  design must localise failure to the action (small client split noted as feasibility work); no per-action "last
  updated" timestamp exists (derive from `receivedAt`/`recordedAt`, don't invent freshness).
- **§3–§16 page blocks** supersede my §6 content bullets where they differ; the extra real details I will use:
  auth version line `v0.16.1 · free APK · Android 8+`, server setup ("Change server", "Test connection"), roles
  pager dots + "Play Classic instead", home masthead/log-in identity via "Playing as", lobby readiness ticks (up to
  8) + host also readies up + "Hunt rules" inline, hunt-hunter stale markers amber `#F0A43A` + `PreyStatusCard`
  text alternative + reports page of 50, hunt-prey "next report in" countdown **needs new client state** (flag),
  chat system rows centred + composer 52 dp + page 50 of up to 500, result drawn field plate vs real map (allowed
  this sprint; no fake street layouts), history row grammar (date group, `HH:mm`, duration, winner word, team
  names) + per-room scope + no `preyAlive` in history data, settings 85–135 % text size in 11 stops, update states,
  permission cards, room-settings zones/shrink/validation copy, tag-policy row flagged as new UI.
- **§17 other surfaces** are usable evidence for states (leave/end confirm, dispute sheet, tag picker, zone picker,
  session-expired, deep-link failure) but never replace a canonical page; **deep-link failure must be a strip, not
  a toast**; **session-expired** needs a state (currently silently bounces Home).
- **§18 state matrix** is the required-state list I will tick first; its "bold" items (offline, paused, eliminated,
  update available, claim) are the proof-of-real-system states. My §7.1 matrix is kept as the test detail.
- **§20 brief-vs-shipped deltas** are watched as feasibility/truthfulness items: rematch (proposal, server/API
  addition, NOTES flag), tag policy (corrected: `confirm|instant` verified server-side + `docs/API.md`; read-only
  row = safe baseline, two-value control = allowed costed proposal carrying the `instant` consequence and the fact
  that no claim sheet appears — see §5.3), roles entry (brief says Settings, app says Home —
  flag or honour with a reason), result score = prey remaining (not a football score), settings server read-only,
  history summary depth limited, offline design + small client work, result map = drawn field plate, chat-tab vs
  page distinction, result/history flow ("Back to lobby" dismisses score page; history opens over room).

### 12.3 Adopted from `DESIGN_PLAYBOOK.md`
- **§7 a11y/RTL**: AA pairs incl. metadata ≥7:1 at ≤12 sp; ≥48 dp incl. inline links (48 dp hit height); body
  ≥14 sp / aux ≥12 sp / nothing below 11 sp; display scales half-rate capped at 1.25× while body 1:1; no fixed text
  heights; focus ring 2 dp cyan + 2 dp offset; board as one grouped node/polite live region; map text alternative
  (`PreyStatusCard` pattern); errors assertive, ready/reconnect polite, one announcement; **no more than one cyan
  surface per page**; destructive actions name consequences and never sit beside the primary; Arabic via IBM Plex
  Sans Arabic stand-in (`--font-arabic`), brand Latin faces only for LTR numerals/code/data labels, Arabic 15–20 %
  longer, no `·` in Arabic, never mirror wordmark/map/numerals; light theme "daylight chalk", board stays ink.
- **§8 Compose feasibility**: the clean/avoid lists replace my §5.8 shorthand — no `backdrop-filter`/blur/blend/
  glass, no sticky/overlap-grid layouts, no fixed heights with text, no fake map tiles or invented street labels
  (drawn field plate allowed if honest in NOTES), no gameplay actions the app lacks (rematch = costed API item),
  tokens not hard-coded, performance rules (one ticking node, no `animateContentSize` on list cards, keyed lists),
  and the HTML→Compose vocabulary table is the feasibility lens I will apply per page.
- **§9 page obligations / §10 12-point self-test** are used as the direction-level sanity list when a NOTES claim
  needs checking against the pages.

### 12.4 Net effect on my method
No change to independence, pass order, severity scale, measurement or messaging. The main deltas: adopt the
rubric's anchors/caps as the public scoring frame, use `PAGE_INVENTORY.md` §18 as the state tick-list and §20 as the
truthfulness checklist, use the playbook's exact a11y/RTL/Compose numbers (esp. metadata 7:1, one-cyan-surface,
IBM Plex Arabic, display half-rate scaling), and treat rematch / tag policy / roles entry / history depth /
server edit as **explicit deltas to flag**, not features to assume.
