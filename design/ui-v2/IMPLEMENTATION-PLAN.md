# UI/UX redesign v2 — implementation plan and vertical-slice breakdown

**Status:** draft v1 — ready for owner review. **Direction gate: pending.** No `android/` or `server/` code is
changed until the owner confirms the ship direction; this plan is the only deliverable of this step.
**Prepared:** 2026-11-04. **Prepared for:** the owner (MostafaAshry513).
**Spec branch:** `design/ui-v2` (this branch; documentation only). **Implementation base:** `master`
(`b4dc286`, shipped app v0.16.1). **Normative design source:** `reviews/FINAL-RECOMMENDATION.md` at `91a2f9f`;
renders at `directions/*/out/` and the owner pack `env/out/` (frozen pack `88ac519`).

> **Authority note.** `reviews/FINAL-RECOMMENDATION.md` (patched in `91a2f9f`) gives the final consolidated
> scores **A 4.60 / B 4.45 / C 4.40** and recommends **Direction A "Matchday, raised" as the base with targeted
> B and C steals**. The update block at the top of `HANDOFF.md` still quotes *A 4.30 / B 4.30 / C 4.15* — those
> are reviewer-visual's independent round-2 numbers, superseded by the consolidated patch. Where the two
> disagree, `FINAL-RECOMMENDATION.md` wins.

---

## 0. The decision this plan waits on

The reviewers' recommendation is:

> **Ship Direction A "Matchday, raised" as the base product, with targeted steals from B and C.**
> (A answers the brief's actual job with the least new-system risk; the A-vs-B call is a documented taste
> call; B's event/identity treatment and C's hunt/claim honesty + state discipline are lifted into the result.)

**The exact direction decision the owner must make:**

1. **`A + steals` (recommended):** approve A "Matchday, raised" as the base, with the B and C steals listed in
   §3.5 and the per-page picks in `FINAL-RECOMMENDATION.md` §3. This plan then proceeds as written.
2. **`B`:** choose "Street signal" as the identity base instead. The A base system in §3 is replaced by B's
   poster system; the implementation plan and most slice contents are rewritten before any code.
3. **`C`:** choose "Field instrument" as the system base. This is an explicit identity decision (C's brand-fit
   axis is 3) and additionally requires the cyan-convention and Arabic-type decisions in §7.

Silence/negative means **no implementation** — the workstream stays on this design branch.

### 0.1 Further choices that gate individual tickets (not the whole plan)

From `FINAL-RECOMMENDATION.md` §5. Each has a safe default; the owner can answer them incrementally while
unrelated slices proceed.

| # | Owner question | If unanswered, the plan uses | Gates |
|---|---|---|---|
| D1 | **How loud should the product be?** (A polished matchday vs B street-poster identity) | A base (recommended) | All tickets |
| D2 | **How committed is light theme?** A's daylight-chalk translation vs B's ink blocks | A's daylight-chalk translation (existing light theme polished, not redesigned) | V2-02, V2-12; light parity in every slice |
| D3 | **Keep the cyan-primary convention, or accept C's "cyan = measurement, chalk = action" reweight?** | A's cyan-primary on operational pages, C/B chalk-event rule only where a team/event field is the page subject (result, claim) — the documented steal | V2-00 (action tokens), V2-05, V2-07, V2-09 |
| D4 | **Build unshipped deltas?** Rematch (small server action) and tag-policy Confirm/Instant control (client-only; server enum already exists) | **Not in the base.** Show current behaviour only; result omits rematch in-app (the design's "Play again" row is marked a proposal and would be removed) | V2-05, V2-09, V2-13, V2-14 |
| D5 | **How much should the mark carry identity, and how much Arabic investment?** masthead lockup vs mark-light; bundle IBM Plex Sans Arabic (~+460 KB) vs system fallback | A's masthead lockup; system Arabic fallback in the base (the design env's IBM Plex is a stand-in, not a shipped face) | V2-01, V2-02, V2-03, V2-12, V2-15 |

**No app code until D1 is confirmed.** A later D2–D5 change re-scopes the named tickets; it does not invalidate
the plan.

### 0.2 After confirmation

1. The **V2-00 design-system foundation** PR is opened against `master` (the only non-user-visible slice).
2. The plan's tickets V2-00…V2-12 are filed as GitHub issues for tracking (the owner may of course adjust the
   split); conditional tickets V2-13…V2-17 are filed only if D4/D5 approve them.
3. Page slices proceed in §4.2 order, each as its own reviewed PR with Before/After evidence.
4. If the owner chooses **B** or **C** instead, this plan is re-cut before any code — the design direction comes
   first, the shared engineering rules in §5/§6 still apply.

---

## 1. Scope

### 1.1 In scope

- **Android Compose UI only** — the 12 canonical pages + 2 proof variants in `skills/PAGE_INVENTORY.md` §1, plus
  the real secondary surfaces in its §17 (leave/end confirm, tag target picker, dispute sheet, zone picker,
  startup brand, room load/error, session-expired, update states, deep-link failure).
- The state bank required by `PAGE_INVENTORY.md` §18 (`reviews/round-2-docket.md` and each direction's NOTES
  record the final copy/layout for every state).
- The design-system port in §3: tokens, type ladder, component grammar, state vocabulary, icons, motion.
- Arabic/RTL completeness (all new copy added to `i18n/Localization.kt`, numeric LTR isolation, Arabic type
  rules), light-theme parity, accessibility floors, semantics.
- Tests and visual evidence for every slice (§5).

### 1.2 Out of scope

- **Game rules, phases, timers, tag validity, readiness, victory, location visibility — the server stays
  authoritative** (`CONTRIBUTING.md`). No engine change; the client only renders server truth.
- **Data-contract changes** (`data/Models.kt`, `docs/API.md`) except the owner-gated additions in §8.
- Brand identity work: Open Zone mark/wordmark geometry, the three OFL Latin faces, approved palette semantics.
- Marketing site, social assets, store listings.
- The design documents themselves (they are the spec; this branch carries no app code).
- Anything not present in the shipped product unless flagged in the designs **and** approved (rematch,
  tag-policy control — see D4/§8). No invented screens, numbers, claims or game actions.

### 1.3 Delivery mechanics

- The spec stays on `design/ui-v2`; implementation branches off `master` and references these docs and PNGs.
- **One PR per slice** (§4). Each PR is independently revertable, passes CI (Server, Android, Emulator), and
  ships a usable, self-reviewed slice — never a half-migrated page.
- This is a single-account deployment: a person merges implementation PRs (no merge CLI configured here); the
  agent never merges its own work or enables auto-merge.
- The design branch is **not** the app source of truth for code; when a slice lands, the app is.

---

## 2. Inputs, authority and the current app

### 2.1 Source documents

| Document | Use in implementation |
|---|---|
| `reviews/FINAL-RECOMMENDATION.md` | **Normative** direction, scores, per-page picks/steals, implementation read, owner questions |
| `directions/a-matchday-raised/NOTES.md` | **Normative for A**: system (§3), per-page intent (§4), state bank (§6), Compose notes (§9), locked design truth (§11), token deviations (§13), review decisions + S2/S3 handoff items (§15) |
| `directions/b-street-signal/NOTES.md` | **Normative for the B steals**: dock (§3.3), colour rule (§5), component grammar (§7), claim countdown notes (§19.2), deltas (§15) |
| `directions/c-field-instrument/NOTES.md` | **Normative for the C steals**: component grammar (§3.5), state system (§3.10), RTL/light (§3.11), Compose notes (§8), review decisions (§13) |
| `skills/PAGE_INVENTORY.md` | Real surfaces, labels, data contract, states, brief-vs-app deltas — the feasibility authority |
| `skills/TOKENS.md` | Shipped tokens + deviation contract + floors |
| `skills/COMPONENTS.md` | Component grammar, state vocabulary, composition matrix, Compose mapping |
| `skills/DESIGN_PLAYBOOK.md` | Tone/copy, a11y/RTL rules, Compose feasibility rules, page obligations, 12-point self-test |
| `reviews/round-2-docket.md`, `reviews/round-1-*.md`, `reviews/round-2-*.md` | Items that were accepted/closed and residuals deferred to implementation |
| `env/out/` | Owner pack: matrix, per-direction sheets, per-page strips, gallery — the visual reference for "before/after" comparisons |
| `docs/UI_AUDIT.md` | **Historical** v0.8.x technical audit — verify current code before acting; several findings still stand (UI-01/03/08/14 and others) |

### 2.2 Shipped baseline (master `b4dc286`)

- Kotlin + Compose, minSdk 26, `android/app/src/main/java/com/manhunt/app/`:
  `ui/AppRoot.kt` (routes Auth/Safety/Home/Roles/Settings/Room), `ui/AuthScreen.kt`, `ui/HomeScreen.kt`,
  `ui/RolesScreen.kt`, `ui/RoomScreen.kt` (2 664 lines: lobby + hunt + chat tab + sheets),
  `ui/LobbyBoard.kt`, `ui/BoardComponents.kt`, `ui/BoardInputs.kt`, `ui/Components.kt` (legacy card grammar),
  `ui/ChatPanel.kt`, `ui/ScorePage.kt`, `ui/HistoryDialog.kt`, `ui/SettingsScreen.kt`,
  `ui/RoomSettingsDialog.kt`, `ui/MatchSheet.kt`, `ui/FieldMarks.kt`, `ui/BrandMotion.kt`,
  `ui/theme/{Theme,BoardTokens,Motion}.kt`, `map/MatchMap.kt`, `i18n/Localization.kt`, `data/Models.kt`.
- Tests: Robolectric JVM tests incl. `ScreenshotTest.kt` and `GameScreenshotTest.kt` (render real Compose to
  PNG with `@GraphicsMode(NATIVE)`), `AppSmokeTest.kt`, plus behaviour tests. This is the screenshot harness the
  evidence process builds on.
- CI (`.github/workflows/ci.yml`): Server typecheck+tests+live smoke; Android build/JVM tests/release
  R8 build/lint; emulator in-app test. Premium screenshots are a separate manual `workflow_dispatch` workflow.

### 2.3 Known debts the slices must close where they touch them

Verify each against current code first (the audit is historical): UI-01 chat composer measured at 0 dp;
UI-03 map has no text alternative (closed in V2-06); UI-04/05 dialog insets + IME (sheets replace dialogs);
UI-06 rotation state; UI-07 whole-screen recomposition on chat keystroke; UI-08 stale/flagged prey differ only
by colour; UI-09 fixed button heights; UI-11 back handling vs leave confirm; UI-14 unlabeled switches;
UI-18 dark-mode white flash; UI-19/23 lazy-list keys + animated cards.

---

## 3. Target design system (built once, in V2-00)

All values below are the A design with the approved B/C steals. Implementation rule from `TOKENS.md`: never
hard-code a colour/size in a screen; add it to the token layer first and record deviations in the PR.

### 3.1 Token deltas (shipped → target)

| Token | Shipped (v0.16.1) | Target (Direction A) | Note / floor |
|---|---|---|---|
| `field` dark | `#0B1220` | `#0B1220` | unchanged; flat, no gradient |
| `field` light | `#F7F9FC` | `#F5F7FB` | A §13; re-verify light pairs when applied |
| `board` dark | `#131C2E` | `#0E1728` | slightly deeper ink; chalk 15.2:1 |
| `board` light | `#0B1220` | `#0B1220` | Board stays ink in both themes |
| `plate` | `#131C2E` | `#131E33` | plates only where the player acts |
| `plateRaised` | `#1D2840` | `#1B2740` | inputs, code cells, selected segment |
| `muted` | `#A7B6CC` | `#A7B6CC` | 9.1:1 on field |
| **`boardMuted` (new)** | `muted` on ink = **5.34:1** | `chalk @75%` = `#B0B8C3` | **8.95:1** — the A round-2 fix; formalise as its own token |
| `hairline` | `#2A3550` | `#26324B` | non-text |
| `hairlineStrong` | `#5E7198` | `#55688C` | interactive borders ≥3:1 (verify on plate) |
| `cyan` | `#22D3EE` | `#22D3EE` | field/referee/time only |
| `cyan` light | `#0C6B84` | `#0B6B83` | A §3.2; pick one, keep the 6.1:1 floor |
| `coral` / `violet` / `error` | unchanged | unchanged | team text on 10–12 % tints ≥6:1 — see §6 residual R6 |
| **`teamTint` (new)** | ad-hoc 12–16 % | coral/violet at 10–12 % | team text on tint must hold the floor; labels on tints ≥13 sp or use a lighter text token |
| `scrim` | 60 % ink | 62 % dark / 45 % light | A §3.2 |
| type ladder | §3.2 below | **raised A ladder** | display xl 64→84, l 48→60, m 36→44, s 28→30, clock 44→68 live / 52 full time, board.meta 16→20, `state` 11→11.5, `data.small` 11→11.5 (strict 12 option: see §6 R5) |
| page margin | 16 dp | **24 dp** phone (16 dp inside sheets) | A §13; no 10/14/18/22 one-offs |
| Board height | min 84 dp | **148–172 dp content-driven**, two bands | compress to masthead+clock+gutter at ≤700 dp; map min 340 dp |
| buttons | primary 56 / secondary 48 | unchanged heights | inline actions get 48 dp hit height; disabled always names its blocker |
| sheet heights | max 60 % | claim 64 %, room rules 86–91 % | tall rules sheet must become a full-height page + pinned save on short screens |
| switch / segmented | Material switch/pill | switch: 48 dp wrapper + 40×22 visual + ON/OFF word; segmented: 48 dp layout / 38 dp visual inset | never copy the mock's clipped hit test; semantics on the wrapper |
| motion | `Motion.kt` QUICK/STANDARD/EMPHASIZED/LONG | same vocabulary | hard-cut digits; 240 ms sheet; 200 ms wipe; 400–600 ms draws; reduced motion = final static frame |

### 3.2 Type ladder (target)

From `directions/a-matchday-raised/NOTES.md` §3.1, with the round-2 fix: **no functional/readable text below
11.5 sp; machine metadata 11.5 sp with ≥7:1; body/label ≥13 sp; the strict-12 sp option is a one-token bump
(§6 R5).** Display scales at half rate capped 1.25×; body 1:1.

| Token | Size/LH | Face | Use |
|---|---|---|---|
| `display.xl` | 84/78 | Big Shoulders 700, −0.015 em | Result winner only, max 2 lines |
| `display.l` | 60/56 | Big Shoulders 700, −0.012 em | Auth/Home permanent line, first-run title |
| `display.m` | 44/42 | Big Shoulders 700, −0.008 em | Moment/sheet titles, score numerals |
| `display.s` | 30/32 | Big Shoulders 700 | One-line declarations |
| `board.clock` | 68/62 live, 52/50 full-time | Big Shoulders 700 tabular | Board's one number |
| `board.meta` | 20/22 | Big Shoulders 700 | Board gutter numerals, step numbers |
| `headline` | 21/27 | Instrument Sans 700 | Page/header titles |
| `title` | 17/22 | Instrument Sans 700 | Rows, team names, sheet sections |
| `body` / `body.small` | 15/22 / 13/19 | Instrument Sans 400 | Copy |
| `label` | 13/16 | Instrument Sans 700 | Buttons, tags, row actions |
| `caption` | 12/16 | Instrument Sans 400 | Muted metadata |
| `data` / `data.small` | 12/16 / 11.5/15 | Red Hat Mono, +0.04–0.06 em | Code, times, coordinates, attribution (≥7:1) |
| `state` | 11.5/15, +0.12 em, upper | Red Hat Mono | `LOBBY` `HEAD START` `LIVE` `PAUSED` `FULL TIME` `CANCELLED` only |

Arabic: system Arabic face (base; optional bundled IBM Plex in §8), no tracking, +4–6 sp line height over the
Latin value, larger leading, Latin tabular numerals/code stay LTR. Never Arabic in Big Shoulders.

### 3.3 Component disposition

| Target component | Shipped source | Disposition |
|---|---|---|
| `MatchBoard` (Masthead / Lobby / Live / FullTime variants) | `ui/BoardComponents.kt` `MatchBoard` | **Extend** into one variant system + two bands, "one number" slot, readiness ticks; keep one per screen |
| `ChalkRule`, `FieldMark`s | `BoardComponents.kt`, `FieldMarks.kt` | Reuse; add the few marks a page needs (24 grid, 2 dp butt caps, original — no Material look-alikes) |
| `BoardButton`, inline action | `BoardComponents.kt` | Reuse; add inline 48 dp hit wrapper and the chalk-event variant (B/C steal) |
| `TeamTag` / `StateTag` / `TeamSheet` | `BoardComponents.kt`, `LobbyBoard.kt` | Reuse; sentence-case data labels, 3 dp team rule, counts at `display.m`, RTL-correct cut corner |
| `CodePlate` | `BoardComponents.kt` | Reuse on Home; explicit LTR isolate in RTL; lobby uses the Board big row (A §13 deviation) |
| `MatchSheet` (+ tall rules variant) | `ui/MatchSheet.kt` | Reuse; replace `RoomSettingsDialog` AlertDialog; add 86 % tall variant; no AlertDialog for game moments |
| Dock (primary + reason line) | `LobbyDock`, hunt action bar | **Replace** with one `BoardDock` composable with slots |
| Masthead | `BoardHeader`/`MatchBoard` masthead | Reuse/extend; visible "Settings" label + 48 dp target |
| `FieldPlate` (drawn pitch / dial) | `BrandMotion.kt`, `BrandMapMotion.kt` | Port the static SVG geometry to `Canvas` paths (one vector asset); no animation requirement |
| State vocabulary: `EmptyState`, `ErrorStrip`, `LoadingRule`, `SkeletonRows`, `OfflineStrip`, `PermissionStrip`, `NoticeStrip` | partial legacy `Components.kt` (`ErrorBanner`, `EmptyState`, `ManHuntLoader`) | **New** `ui/board/BoardStates.kt`; retire legacy usage screen by screen (C §3.5 / COMPONENTS §12 grammar) |
| Settings controls: `SegmentedChoice`, `Stepper`, `SwitchRow`, `SliderRow` | `BoardInputs.kt` partial + Material controls | **New** ruled controls; 48 dp semantics wrappers |
| `LogLine` (chat) | `ChatPanel.kt` | Reuse grammar; sender = kit-tag/team-coloured label (B steal); system events = ruled separators |
| `ReportStrip` + map markers | `PreyStatusCard`, `MatchMap.kt` overlays | **Extend**: fresh/stale/tagged by shape + word + age/accuracy (C steal); per-prey list as map text alternative (closes UI-03) |
| `Stamp` / tape treatment | — | **New, event surfaces only** (result, claim): rotation via `graphicsLayer`, semantics cleared, decorative only (B steal) |
| `FieldNote` (paper match record) | — | **New**, result + claim context only; one human moment (C steal) |
| `PlayedTimeRuler` | — | **New** `Canvas` ruler on result when duration is known (C steal) |
| `MapChrome` | `MatchMap.kt` | Reuse map; new chrome/strip/dock/controls; do not rebuild tiles; keep OSM attribution |

### 3.4 State vocabulary (one system, everywhere)

`EmptyState` (what will appear + how to make it appear), `ErrorStrip` (local to the action, retry preserves
input, assertive), `LoadingRule`/`SkeletonRows` (no spinner), `OfflineStrip` (`connected` as source of truth,
last-update age, server actions disabled with a reason, last-known data kept), `PermissionStrip` (at the point
of need only), `NoticeStrip` (transient confirmations; never toast-only), disabled states always name their
blocker. Copy/layout for every page/state is in `directions/a-matchday-raised/NOTES.md` §6 + §11 and
`PAGE_INVENTORY.md` §18; C's rendered `state-paused`, `state-offline`, `state-eliminated` frames are the
state-discipline templates (see §3.5).

### 3.5 The steals, exactly

**From B — identity/event treatment (adapted into A's system):**

| Steal | What lands | Where | Guardrail |
|---|---|---|---|
| Tag-claim event treatment | consequence-first title at `display.m` ("Omar says he tagged you."), coral 3 dp top rule, who/when data line, "Confirming means you're out." consequence, `expiresAt` countdown, dismissal keeps a persistent coral claim strip | `sheet-tag-claim` + prey hunt banner | the claim sheet is the app's loudest moment after full time; keep one display line; no stamp animation on the hunt page itself |
| Two-verb Home dock | Create/Join as two distinct objects inside the reach zone: primary cyan **Create** block + outlined **Join** block (B's larger verb scale), riding above the code entry | `home` | one cyan fill per page; the verbs keep the app's real labels and flows |
| Kit-tag sender grammar | solid/cut team-colour name tag + `HOST`/`YOU`/state glyph in chat and roster rows, pair with name in team colour; "sentence-case data labels" | chat, lobby/result team sheets | name + word always; colour never the only cue |
| Cyan-operational / chalk-event primary rule | documented rule: one filled cyan surface per page for operational actions; where the page's subject is a team/event field (result winner, claim), the primary action uses a chalk/paper block so only one hot field competes | result dock, claim actions | D3 owner question; do not let the rule migrate cyan away from the field/time role |
| Ticket-stub/perforation record grammar (optional, low risk) | the history row as a ruled record with dashed perforation and mono duration | history | real fields only; no per-match survival scores |

**From C — hunt/claim honesty and state discipline (mandatory keeps):**

| Steal | What lands | Where | Guardrail / acceptance |
|---|---|---|---|
| Per-prey report honesty | per-prey list showing name + age (from `receivedAt`/`recordedAt`) + accuracy (from `accuracy`), fresh/stale/tagged by **shape + word + colour**, "Latest reports — not a live track" note; this list is the map's **text alternative** | `hunt-hunter`, claim background | closes `docs/UI_AUDIT.md` UI-03; semantics: map grouped node + hidden per-prey status list; never show a freshness that is not derivable |
| Claim countdown + transition | "Answer in MM:SS" = `pendingTag.expiresAt − RoomState.serverNow` (server offset, never device clock); at zero the sheet closes and the claim moves to the "no answer → the huntmaster decides" disputed state (verify `server/src/rooms.ts` path); persistent strip after dismissal | `sheet-tag-claim`, prey banner | non-negotiable per FINAL §4; one Text node ticking at second boundaries, no whole-sheet recomposition per second |
| State discipline | paused (frozen clock, pause strip, Resume), eliminated/spectating ("You were tagged. You are spectating…"), offline/reconnecting (strip + retained ages + disabled actions with reason) rendered as first-class frames | hunt pages, lobby, chat, auth/home errors | reuse C's rendered frames as the template; every state has a static equivalent |
| FieldNote paper match record | paper surface + 2 dp rotation + one hand-scored vector mark + real fields only | result (and claim body if A's sheet needs the human moment) | one human moment per page; 11:1 paper metadata; no fake street labels |
| Played-time ruler | `Canvas` ruler of played/total time, only when duration is known | result | honest omission if duration missing |
| Stepper/rocker/readout grammar | ruled instrument controls + mono state labels | room rules sheet, settings | re-styled to A's type; no second system |

**Guardrails for all steals:** B's poster loudness (tape/stamp/stencil/rotation) is limited to ceremony/event
surfaces; it must **not** appear on hunt, claim-stress, lobby or settings operation screens. Stolen elements are
re-cut into A's ladder/rules/colour roles, not pasted as a second language. Every stolen element keeps a static
reduced-motion frame and must pass the floors in §3.6.

### 3.6 Non-negotiable acceptance floors (every slice)

1. **Honesty:** real `Models.kt` data only; no invented numbers/clocks/players/claims; OSM attribution wherever
   tiles show; honest degradations (omit unknown stats, never fabricate); server is authoritative.
2. **Composition:** ≤1 Board, ≤1 primary filled surface, ≤1 display moment per screen; no rounded-card stacks,
   no nested plates, no plates for prose; 24 dp page margin.
3. **Accessibility:** body/label ≥4.5:1, large display ≥3:1, non-text interactive boundaries ≥3:1, metadata
   ≤12 sp ≥7:1; ≥48 dp targets; readable text ≥13 sp (machine metadata ≥11.5 sp, §6 R5); colour never the only
   signal; visible 2 dp focus ring; Board grouped semantics; errors assertive; reduced-motion static frame;
   text scale 200 % / 320 dp reflow with no clipping or fixed text heights.
4. **RTL/Arabic:** logical start/end; clock/code/numerals LTR-isolated; no tracking; no `·` in Arabic; Arabic
   face (system fallback) with taller line boxes; every new English string added to `Localization.kt` and
   reviewed in Arabic.
5. **Light theme:** daylight-chalk translation, ink Board, no cream, same composition.
6. **Performance:** one ticking clock node (no whole-screen recomposition), stable `LazyColumn` keys, no
   `animateContentSize` on list cards, no per-frame map/sheet recomposition, static field plate.

---

## 4. Vertical-slice delivery plan

### 4.1 Principles

- **Vertical, not horizontal:** a slice is one screen/flow end-to-end — Compose UI + every real state + a11y/
  RTL/light behaviour + tests + before/after evidence. No "all tokens then all pages" big-bang.
- **Foundation once:** V2-00 lands the token/component layer the rest of the slices consume; it is the only
  non-user-visible ticket and it must keep every existing screen working (token-only changes, no page rewrites).
- **Server untouched:** UI renders the shipped contract. Client-only additions (rendering `connected`,
  last-report client state, claim countdown) are UI work; anything requiring an API/server change is owner-gated
  in §8 and never implied by a UI slice.
- **Each PR shippable and revertable:** CI green, evidence attached, existing tests updated only when a
  deliberate behaviour change is documented.
- **Ticket IDs are this plan's decomposition:** they become GitHub issues only after the owner confirms D1 (or
  on request); this plan is the deliverable of the current step.

### 4.2 Order and dependencies

```
V2-00 Design-system foundation
  ├─► V2-01 auth
  ├─► V2-02 home (+ light proof)
  ├─► V2-03 roles / first run
  ├─► V2-04 lobby ──────────────► V2-05 room-rules sheet
  ├─► V2-06 hunt shell + hunter
  │      └─────────────────────► V2-07 prey + tag-claim moment
  ├─► V2-08 chat
  ├─► V2-10 history
  ├─► V2-11 settings
  └─► V2-09 result (after V2-04/V2-06 for Board/TeamSheet variants)
V2-12 convergence/hardening (after all page slices)
Conditional, owner-gated: V2-13 rematch · V2-14 tag-policy control · V2-15 Arabic face · V2-16 system-chat i18n
· V2-17 result map snapshot (§8)
```

Suggested merge order for a single-engineer lane: `00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11
→ 12`. Independent parallel lane after 00: auth/roles/history/settings/chat can be built in parallel with the
lobby/hunt/result chain if multiple workers are available — but V2-06/V2-07 both own `RoomScreen.kt` and must
not run concurrently (see §6 R8).

### 4.3 Slice index

| ID | Slice | Size | Depends on | Primary files | Design reference | Owner gate |
|---|---|---|---|---|---|---|
| V2-00 | Design-system foundation | L | D1 | `ui/theme/BoardTokens.kt`, `Theme.kt`, `BoardComponents.kt`, `BoardInputs.kt`, new `ui/board/` primitives + states, `FieldMarks.kt` | A NOTES §3/§9; COMPONENTS §12/§15 | D1 |
| V2-01 | Auth ("first frame is the game") | M | V2-00 | `ui/AuthScreen.kt` | A `auth`; C dial option | D5 (mark/Arabic) |
| V2-02 | Home + light proof | L | V2-00 | `ui/HomeScreen.kt`, `BoardInputs.kt` Masthead | A `home`, `home-light`; B two-verb dock | D2, D5 |
| V2-03 | Roles / first run | M | V2-00 | `ui/RolesScreen.kt`, `data/GameModes.kt` (read-only) | A `roles`; B two-team split | — |
| V2-04 | Lobby | L | V2-00 | `RoomScreen.kt` lobby branch, `ui/LobbyBoard.kt` | A `lobby`, `lobby-rtl`; C room-record line | — |
| V2-05 | Room-rules sheet | L | V2-04 | `ui/RoomSettingsDialog.kt` → `MatchSheet`, `ui/ZonePickerDialog` entry | A `sheet-room-settings`; C stepper grammar; B consequence copy | D3, D4 |
| V2-06 | Hunt shell + Hunter view | XL | V2-00 | `RoomScreen.kt` `TacticalHuntPage`/`HuntSheet`/`HuntActionBar`, `map/MatchMap.kt` chrome | A `hunt-hunter`; C report honesty; B fresh-report ring | D3 |
| V2-07 | Prey view + tag-claim moment | L | V2-06 | `RoomScreen.kt` prey branch, `MatchSheet` content, claim banner | A `hunt-prey`, `sheet-tag-claim`; C claim countdown/states | D3 |
| V2-08 | Chat / field log | M | V2-00 | `ui/ChatPanel.kt` | A `chat`; B kit-tag senders; C room-record header | — |
| V2-09 | Result / full time | L | V2-00, V2-04, V2-06 | `ui/ScorePage.kt` | A `result`; B winner event; C FieldNote/played-time ruler | D3, D4 |
| V2-10 | History | M | V2-00 | `ui/HistoryDialog.kt` | A `history`; C expanded summary layout | — |
| V2-11 | Settings | L | V2-00 | `ui/SettingsScreen.kt` | A `settings`; C section ticks/"Daylight"; B update card | — |
| V2-12 | Convergence + hardening | L | all page slices | cross-cutting; mostly tokens/a11y/RTL/motion audits + fixes | FINAL §4 non-negotiable keeps; PLAYBOOK §7/§10 | D2, D5 |
| V2-13 | Rematch (conditional) | M | V2-09 | `server` room action + `ScorePage.kt` + `data/` client call | A/B/C result proposals | **D4 = yes** |
| V2-14 | Tag-policy control (conditional) | S | V2-05 | `RoomSettingsDialog` content + `data/` + `Localization.kt` | B/A room-rules proposals | **D4 = yes** |
| V2-15 | Bundled Arabic display face (conditional) | S | V2-00 | `res/font/`, `res/raw/`, `theme` Arabic family | C §3.11 / TOKENS §1 | **D5 = bundle** |
| V2-16 | System-chat i18n (conditional) | M | V2-08 | `server` system message structure + client rendering | CHAT/PAGE_INVENTORY deltas | **D5 / Arabic driver** |
| V2-17 | Result map snapshot (conditional) | L | V2-09 | client map snapshot + engine review | FINAL §4 item 4 | owner choice |

Size key: S ≈ half a day, M ≈ 1–2 days, L ≈ 3–5 days, XL ≈ 5+ days of focused work. Sizes are ordering
signals, not commitments.

### 4.4 Ticket details

Each ticket's PR must contain: the slice working end-to-end, all listed states, tests, and labelled Before/After
evidence (§5). Copy/labels come from `PAGE_INVENTORY.md` + the design NOTES; no new copy is invented without a
`[NEW COPY]` + Arabic-review flag in the PR.

#### V2-00 — Design-system foundation

- **Goal:** one token + primitive layer so every page slice only composes; no page is redesigned here.
- **Build:** token deltas §3.1 (incl. `boardMuted`, team tints, focus ring, type ladder raise, margins, board
  height, sheet heights); component disposition §3.3 (`MatchBoard` variant system, `BoardDock`, state
  vocabulary, ruled controls, `CodePlate` LTR isolate, `FieldPlate` Canvas port); icon additions; a
  `DesignTokens`/`BoardMetrics` extension; keep old public composable signatures compiling for untouched
  screens (or migrate call-sites in the same PR only where signatures must change).
- **Acceptance:** all existing tests green; every untouched screen still renders; new JVM `TokenContrastTest`
  computes WCAG ratios for every text pair in §3.1 and fails below the floors (dark+light); new
  `DesignScreensTest` renders the primitive sheet + Board variants in dark/light/RTL to
  `build/screenshots/ui-v2/`; no gradients/shadows/pills introduced; no text below the floors.
- **Evidence:** before/after captures of the Board variants + one untouched screen proving token-only change.
- **Risk:** wide token blast radius — keep renames mechanical, verify each screen in the screenshot suite.

#### V2-01 — Auth

- **Goal:** the game is the first frame: drawn field dial plate, "Hide from your friends." at `display.l`, quiet
  ruled form, server row demoted, honest version/install footer.
- **Surfaces/states:** sign-in/register toggle, validation, submit busy (label + rule, fields disabled), server
  error strip with "Try again", server setup expanded (address/Test/Save/Cancel), light + RTL notes; keep the
  real helper/error copy and the real server flow (`AuthScreen.kt`).
- **Steal:** C's dial drawing as the plate alternative (a decorative Canvas path, no fake data).
- **Acceptance:** verify all client-side validation/input rules unchanged (tests), labels are the real ones,
  no dev host/string in primary UI, 48 dp targets, floors, no `AlertDialog` for server setup.
- **Evidence:** default / register / validation / busy / server-error / setup-expanded (dark, plus light).

#### V2-02 — Home (+ light proof)

- **Goal:** the matchday programme cover: Masthead with lockup/local time/labelled Settings, drawn field plate,
  permanent line at `display.l`, then two different objects: **Create the hunt** (name field + cyan primary) and
  **Join hunt** (six-cell code + outline action), footer entries.
- **Steal:** B's two-verb dock scale/reach (see §3.5), keeping the shipped host/join semantics.
- **Surfaces/states:** form validation (host name, code length), create/join busy, create/join error strips that
  keep typed input, deep-link join failure, offline disabled with reason; light-theme proof must be the identical
  state as dark (A's round-2 fix) and same DOM/composition.
- **Acceptance:** real strings/data; one cyan primary; code plate LTR; 320 dp / 200 % no clipping; screenshot
  pair `home` dark/`home-light` proves parity.
- **Evidence:** default, partial/full code, host name filled, errors, light (same state).

#### V2-03 — Roles / first run

- **Goal:** the field guide: mode title at `display.m`, honest hook, 3:2 mode diagram, the two sides as team
  tags with one sentence each (B's two-team split), steps using `board.meta` numerals, planned modes honest
  ("Coming soon", "Playable today"), tick rail, dock; first-run variant with safety/permission moment.
- **Surfaces/states:** first-run vs re-read entry, classic vs planned-mode pages, permission moment, long
  scroll, RTL/light.
- **Acceptance:** replace legacy `ScreenCard`/`HeroBanner`/paw usage on this screen; approved copy only; planned
  modes never marketed; no invented counters; real `GameModes.all` source.
- **Evidence:** first-run, classic, planned-mode page, light/RTL note.

#### V2-04 — Lobby

- **Goal:** the room is a social object: Board's big row is the invite code + Share, readiness as `5 / 5 READY`
  + ticks in the gutter, two-column `TeamSheet` with counts at `display.m`, honest blockers/status, host
  controls, chat tab restyle.
- **Surfaces/states:** host everyone-ready; blockers (disabled Begin names its blocker); player view; empty
  team; >5 players (8-tick cap, long names); member offline; room load ("Connecting to room") + error + Try
  again; leave/end confirm sheets; room-code copy notice; deep-link/invite state; RTL proof (`lobby-rtl`,
  mirrored columns, LTR code/numerals, Arabic names); light parity notes.
- **Acceptance:** the lobby never shows stale TAGGED from a previous match; host can ready/stand down and switch
  side (shipped behaviour must remain reachable); no duplicate readiness line below the Board; 48 dp; floors.
- **Evidence:** host-ready, blockers, player view, empty team, load error, RTL, light.

#### V2-05 — Room-rules sheet

- **Goal:** rules are equipment: replace the Material `AlertDialog` with the tall `MatchSheet`/full page — title
  at `display.m`, honesty lead ("Applies to the next hunt. The server enforces these."), ruled TIMING / FIELD /
  VISIBILITY sections, numeric steppers, Open/Zone segmented control, "use my location"/zone-centre/map picker,
  shrink controls, trails switch, honest tag-policy row.
- **Surfaces/states:** seed rules; zone expanded + shrink; validation errors (exact shipped strings); save/busy;
  saved notice; locating/zone-centre-not-set; short-screen fallback (full page + pinned save); RTL (coordinates
  LTR, slider direction); light.
- **Acceptance:** all existing validation/client limits unchanged (tests); no third tag-policy value; if D4 says
  no, the tag-policy row is read-only and says enforced; no AlertDialog; all inputs 48 dp.
- **Evidence:** seed rules, zone expanded, validation error, busy/saved, RTL.

#### V2-06 — Hunt shell + Hunter view

- **Goal:** map-first live hunt: pinned scoreboard (LIVE + clock at 68 + ZONE + PREY 2/2), full-bleed OSM map
  with zone ring, own position, fresh/stale prey markers by shape+word+age, trails, square 48 dp controls, peek
  sheet (status, zone/shrink, report strip, OSM credit), dock "Tag prey"; huntmaster controls in the sheet.
- **Steals (mandatory):** C's report honesty + per-prey text alternative (closes UI-03); B's fresh-report ring
  styling; A's clock dominance/two-band Board. Head start (no tag action, hunting countdown), paused, no-reports
  empty state, GPS/permission strip for the map, offline strip (render `connected`, keep last-known positions,
  disable Tag with reason), tag picker sheet + claim-sent notice + error states, trails empty notice.
- **Acceptance:** prey positions never shown to Prey; no ally/hunter positions invented; stale never colour-only;
  map has semantics text alternative + visible report list; one ticking clock node; OSM attribution visible;
  tag action only in `hunting`; reduced-motion static frame.
- **Evidence:** LIVE fresh+stale, head start, paused, no-reports, offline, tag picker, details open (dark; light
  and RTL screenshots where layout-sensitive).

#### V2-07 — Prey view + tag-claim moment

- **Goal:** the exposed side of the field: Board LIVE with clock + ZONE only, map own position + zone only, coral
  position-report band ("SHARING YOUR POSITION", every `locationIntervalSec`, last report), no tag action; the
  claim is a moment, not a dialog: scrimmed hunt behind, consequence-first title at `display.m`, real who/when
  data, `expiresAt` countdown + "no answer → the huntmaster decides", Confirm/Dispute stacked, dismissal keeps
  the persistent coral strip.
- **Surfaces/states:** sharing/GPS (permission not asked/denied/permanently denied/services off/waiting fix),
  paused, eliminated/spectating, claim incoming/busy/error + retry, dismissed banner, disputed-huntmaster sheet
  + resolution notice, offline, RTL (name/sentence order, time LTR), light.
- **Acceptance:** countdown uses `pendingTag.expiresAt` vs `RoomState.serverNow`; at zero the sheet closes and
  the claim moves to "huntmaster decides" (verify server auto-dispute path); no other Prey ever visible; report
  cadence honest (interval real; "last report" from real timestamps/client send state; if last-send state is not
  built, show interval only); persistent strip never loses the decision.
- **Evidence:** sharing, claim moment, countdown, dismissed banner, eliminated, paused, GPS denied, disputed.

#### V2-08 — Chat / field log

- **Goal:** the log reads like a match report being written live: 40 dp mono time gutter, kit-tag senders in
  team colour, body 15, system events as ruled mono separators, own message = chalk start rule + tint, pinned
  composer.
- **Surfaces/states:** populated incl. system events, empty ("No messages yet."), sending, send failure (draft
  preserved, retry), load-older busy/loaded, offline composer disabled with reason, long thread/names, RTL
  (composer alignment, time gutter mirror, numerals LTR), light.
- **Steals:** B kit-tag sender grammar; C "room record · n entries" header.
- **Acceptance:** closes UI-01 (composer must be measured > 0 and above IME; add an assertion test); stable
  lazy keys (UI-19); no bubbles/pills; no toast-only errors.
- **Evidence:** populated, empty, send-failure, load-older, offline, RTL.

#### V2-09 — Result / full time

- **Goal:** the loudest page: FullTime Board (frozen clock), winner word at `display.xl` ("Hunters win."), honest
  summary, "Prey remaining 0 / 2" score line omitted when unknown, trail plate (labelled stand-in), final team
  sheets from captured flags only, dock "Back to lobby" primary + "View hunt history" outline; B's winner
  event treatment + C's FieldNote/played-time ruler adapted (§3.5).
- **Surfaces/states:** Hunters win, Prey win (honest 2/2), cancelled (no winner word), result-sync loading never
  hides the winner, final stats/map unavailable → omit honestly, many players, RTL (winner/board/sheets, numerals
  LTR), light.
- **Acceptance:** derived stats only from snapshotted final state; if final flags/score are unavailable show
  winner + duration only; "Play again" only if D4 approves rematch (V2-13), otherwise not shown in-app; team
  colours + word, never colour alone; no exclamation marks.
- **Evidence:** Hunters win, Prey win, cancelled, sync/partial data, light, RTL.

#### V2-10 — History

- **Goal:** the match-report ledger: header, last-hunt summary block (real fields only), ruled list grouped by
  date with mono times + result + duration, cancelled match honest; C's expanded summary layout.
- **Surfaces/states:** populated (3–5 matches incl. cancelled + in-progress), single summary/expansion, loading
  skeleton rows, empty ("No hunts in this room yet." + invitation), error strip with retry (never disguised as
  empty), many matches, RTL, light.
- **Acceptance:** rows/summary use only `MatchHistoryEntry` fields (no per-match survival score — B's capped
  item); no chevrons/cards; per-room data source preserved.
- **Evidence:** populated, summary expanded, empty, error, loading, RTL.

#### V2-11 — Settings

- **Goal:** the manual's back matter: one ruled scrolling page instead of 5 icon tabs — Appearance (Dark/Light
  segmented + text-size slider with live preview), Language, Permissions (location + tracking notice + match
  notifications), Updates (all real states), Account (identity, read-only server explanation, cache, sign out).
- **Surfaces/states:** default; text-size preview; language switch (RTL immediately); permission allowed/denied;
  notifications on/off; update available (required state), up to date, checking, download %, download failed,
  install ready, blocked; cache calculating/cleared; sign-out confirm; RTL; light.
- **Steals:** C section ticks + "Daylight" label; B update card.
- **Acceptance:** server row is read-only with the real explanation (no editable field without a save path); no
  dev hosts; update data from real `AppUpdate`; all controls 48 dp; no pills.
- **Evidence:** appearance default, update available, permissions, account, RTL, light.

#### V2-12 — Convergence and hardening

- **Goal:** cross-cutting pass after all page slices: fix residuals, prove the system.
- **Work:** full a11y/contrast audit on rendered pages (not just tokens); 48 dp audit; semantics pass (Board
  grouped node, map alternatives, switch labels, error live regions); text-scale 200 % + 320 dp reflow on home/
  lobby/roles/hunt/result; RTL full pass incl. every new string in `Localization.kt`; light parity pass; motion
  reduced-motion pass; performance pass (recomposition/map churn/list keys); re-run the 12-point self-test from
  `DESIGN_PLAYBOOK.md` §10; refresh the Before/After evidence set.
- **Acceptance:** all §3.6 floors proven; no known a11y/contrast deficit; premium screenshot workflow run (manual,
  after the program lands) reviewed by the owner; residual list documented in the PR description.
- **Evidence:** per-page final captures + a residual table (open/mitigated).

### 4.5 Conditional tickets (owner-gated, §8)

`V2-13 rematch` (server restart endpoint + client action + happy/error tests), `V2-14 tag-policy control`
(client-only Confirm/Instant control; `instant` hides the claim sheet — copy must say so), `V2-15 bundled Arabic
face` (res/font + licence + Arabic family; +~460 KB APK), `V2-16 system-chat i18n` (structured system events so
Arabic field logs are not English), `V2-17 result map snapshot` (replace the allowed drawn stand-in). Each is
independent; none is needed to ship the A base.

---

## 5. Tests, evidence and CI

### 5.1 Per-slice verification

| Layer | How |
|---|---|
| Build | CI: `assembleDebug`, `testDebugUnitTest`, `assembleRelease` (R8 + shrink), `lintDebug` |
| Behaviour | Existing JVM tests stay green; add/extend tests for changed flows (auth validation, home create/join, lobby readiness/blockers, room-rules validation, claim lifecycle, result honesty, history states, settings prefs/update states, chat send/retry). Robolectric first (`sdk = 36`), emulator suite in CI |
| Screenshots | Robolectric `@GraphicsMode(NATIVE)` renders for each page/state at the canonical viewport (390×844 dp → 1170×2532 px — align the test qualifier to the design canvas); dark default, light + RTL where relevant; saved to `build/screenshots/ui-v2/` |
| A11y | `TokenContrastTest` (pure JVM math, dark+light pairs, fails below floors); Compose semantics assertions: 48 dp bounds for every interactive node on the slice, map text alternative present + per-prey list content, switch/row labels, error live region, Board grouped semantics, clock announcement policy; 200 % font-scale render smoke |
| RTL | Compose tests under `LocalLayoutDirection.Rtl` for the slice's layout-sensitive pages; assert LTR text direction on code/clock/numerals; no clipping/overlap in Arabic screenshots; new strings present in both dictionaries (`LocalizationTest`) |
| Manual | Real-device check for the slice's gestures/motion/IME (map drag, sheets, composer) — noted in the PR; the emulator CI job covers basic instrumentation |

### 5.2 Before/After evidence (required on every UI PR)

- Same scenario, viewport, theme and UI state for baseline and changed revision.
- **Baseline** = the current screen captured from the PR's base commit (`master` at branch point), stored with the
  commit SHA; **After** = PR head. Evidence PNGs are committed under `docs/screenshots/ui-v2/<ticket>/` so the PR
  body can embed them with a stable path (the repo already carries design captures this way) and labelled
  `Before` / `After` with both SHAs in the PR description.
- States shown per slice are the ones listed in its ticket; if a state cannot be captured on the baseline (it did
  not exist), say so and show the after state only with an honest note.
- This satisfies the delivery requirement that UI PRs carry both baseline and changed evidence, not only "after"
  screenshots. No private content/credentials in captures.

### 5.3 CI and review

- Every implementation PR must pass the three CI jobs (server, Android, emulator) before a person merges it.
  No auto-merge; the agent never approves/merges its own work (no merge CLI in this deployment).
- Review: human review is expected (A's "raised" scale and per-page composition are design decisions reviewers
  already audited). Automated/review findings are assessed on evidence and code, never applied blindly.
- Docs-only PRs (like this one) still run CI because the workflow has no path filter; that is expected.

### 5.4 Definition of done (per PR)

- [ ] Slice matches the referenced design page + steals, with the §3.6 floors.
- [ ] All listed states implemented with real copy; honest empty/loading/error/offline behaviour.
- [ ] New tests pass; full local check (`assembleDebug`, `testDebugUnitTest`, `assembleRelease`, `lintDebug`).
- [ ] Before/After evidence committed and embedded in the PR description with SHAs.
- [ ] Every new string added to `Localization.kt` (English + Arabic) or flagged `[NEW COPY — needs Arabic
      review]`; no hard-coded directional CSS assumptions; no hard-coded token values.
- [ ] PR description states the user-visible outcome, material limitations, and any deferred residual.
- [ ] No server/engine change (unless the ticket is one of §8).

---

## 6. Risks and mitigations

| ID | Risk | Mitigation |
|---|---|---|
| R1 | **Board height eats the map on short phones** (A's residual) | content-driven heights; compress to masthead+clock+gutter at ≤700 dp; map min 340 dp; test 320 dp/200 % in the hunt slice |
| R2 | **Poster steals bleed into stress screens**, hurting usability | explicit guardrail in §3.5; loudness only on ceremony/event surfaces; review checks hunt/claim/lobby/settings are quiet |
| R3 | **RTL regressions** (physical-direction thinking, numerics reorder, Arabic line-box clipping) | logical start/end; explicit LTR isolates; C §13.6 line-height rule (+4–6 px Arabic line box, never tracking); RTL screenshot per slice |
| R4 | **Contrast/type floors regress** in real Compose (different from HTML mocks) | token math test + rendered screenshot review; boardMuted fix is mandatory; residual tint pairs fixed at build (labels ≥13 sp or lighter team-text token) |
| R5 | **Type floor ambiguity** — A's renders keep 33 nodes at 11 px (shipped `data.small`) | plan adopts readable ≥13 sp / machine metadata ≥11.5 sp at ≥7:1; strict ≥12 sp for everything is a one-token bump the owner can request before V2-00 |
| R6 | **Team-tint contrast** (A residual: 6.49–6.5:1 metadata on tints) | fix in V2-00: labels on tints become ≥13 sp (large/label floor) or a lighter team-text token; re-run audit |
| R7 | **Screenshot tests are brittle** across GPU/font environments | render-not-diff tests + committed evidence reviewed by a human; avoid pixel-golden assertions in CI |
| R8 | **`RoomScreen.kt` is 2 664 lines** — hunt/lobby/chat slices collide | sequential ordering for 04/05/06/07/08; extract page composables into dedicated files *while touching them* (behaviour-neutral refactor, tests first); do not parallelise these tickets |
| R9 | **Compose feasibility of the raised scale / FieldPlate / 84 sp winner** | A's §9 notes are the contract; V2-00 proves the Board/field primitives before page work; test at 320 dp/200 % |
| R10 | **Fake-data regressions** (survival scores in history, invented counts, fake GPS) | data-contract checklist per ticket; reviews re-check against `Models.kt`; B's capped items remain out |
| R11 | **CI time** (emulator job ~45 min) per PR | batch related states in one slice, keep PRs focused; run local JVM suite first; do not skip CI |
| R12 | **Arabic copy gaps** — many `[NEW COPY]` strings across designs | V2-12 owns the full dictionary audit; each slice flags its new strings; native Arabic review is an owner dependency (D5) |
| R13 | **Scope creep into game rules** (rematch/tag policy/engine) | §8 gate: no server change without owner approval; UI base must ship with current behaviour |
| R14 | **Design/implementation drift** (screens deviate silently) | each PR links the design page + states; V2-12 renders the final set side-by-side with `env/out/`; deviations documented |

---

## 7. Owner decisions and what changes if answered differently

**D1 — direction (blocks everything).** `A + steals` (recommended) → this plan. `B` → §3 foundation becomes B's
poster system (dock 60 dp blocks, paper/sticker surfaces, stencil/tape grammar, two-register loudness budget) and
the slice list is re-cut; the A-specific Board-led page compositions change. `C` → §3 becomes C's instrument
system (readout band, calibrated rulers, zero filled-cyan reweight) with the brand-fit risk the reviewers
recorded; the cyan convention (D3) and Arabic native pass become shipping conditions.

**D2 — light theme.** A's daylight-chalk translation (default) vs B's ink-block daylight vs C's graph-paper
daylight. Only changes light tokens/composition in V2-02 and the light-parity part of V2-12; the dark base is
unchanged.

**D3 — cyan convention.** Default: A's cyan-primary on operational pages + the B/C chalk-event rule only where
the page subject is a team/event field (result, claim). Choosing C's reweight changes V2-00 action tokens and
the hunt/claim/result primaries; it must be decided consistently across slices.

**D4 — unshipped deltas.** Default off: no rematch in-app, tag-policy row read-only. Turning either on creates
§8 tickets: rematch needs a small server action (room restart copying teams/settings + client refresh), tag
policy is client-only (server enum `confirm|instant` already exists; `instant` hides the claim sheet and must
say so). Neither changes game rules beyond what the server already supports.

**D5 — brand/Arabic investment.** Default: masthead lockup per A; system Arabic fallback (the shipped app's
current behaviour). Bundling IBM Plex Sans Arabic (+~460 KB for two weights) is V2-15; a native-Arabic copy
review is still required for the new strings either way.

**D6 — doc authority (no action needed, recorded).** `HANDOFF.md`'s update block quotes reviewer-visual's
independent scores; `FINAL-RECOMMENDATION.md` (patched `91a2f9f`) is authoritative. A one-line doc fix can ride
the first docs housekeeping PR that touches `HANDOFF.md`; it does not affect implementation.

---

## 8. Conditional (owner-gated) additions

1. **Rematch — V2-13.** Needed only if the "Play again" row ships as a real action. Requires a server action
   (e.g. restart the room with the same teams/settings and refresh client state) + tests; the shipped app has
   Back to lobby + View hunt history. Owner decision D4; otherwise the in-app row is omitted (the design's
   proposal tag exists only in the spec).
2. **Tag-policy control — V2-14.** `SettingsDto.tagPolicy` already holds `confirm|instant`; server enforces both
   (`server/src/domain/match.ts`, `server/src/rooms.ts`). Client-only control + copy + Arabic + tests; must state
   the consequence (instant = no claim sheet, prey eliminated immediately). Owner decision D4.
3. **Bundled Arabic display face — V2-15.** +~460 KB APK cost; app currently uses the device Arabic fallback.
   Owner decision D5; new-copy review still required.
4. **System-chat i18n — V2-16.** System events are server-composed English, so Arabic field logs show English
   lines. Small server change (structured system message kinds) + client rendering. Recommended as a follow-up
   if Arabic quality matters.
5. **Result map snapshot — V2-17.** The result trail plate is an allowed drawn stand-in; a real snapshot needs
   client/engine work and an honest fallback. Not required for the A base.
6. **Premium screenshot capture.** The manual `premium-screenshots.yml` workflow (real emulator, real OSM tiles)
   should run once after V2-12 with the owner's approval to refresh the marketing set; it is not part of PR CI.

---

## 9. Appendix A — page → design artifact → code → slice

| Page | Design artifact (A unless noted) | Shipped surface / file | Slice |
|---|---|---|---|
| `auth` | `directions/a-matchday-raised/out/auth.png` (C dial option) | `ui/AuthScreen.kt` | V2-01 |
| `roles` | `out/roles.png` (B two-team split) | `ui/RolesScreen.kt` | V2-03 |
| `home` | `out/home.png` | `ui/HomeScreen.kt` | V2-02 |
| `home-light` | `out/home-light.png` | `HomeScreen.kt` under light theme | V2-02 |
| `lobby` | `out/lobby.png` | `RoomScreen.kt` lobby + `ui/LobbyBoard.kt` | V2-04 |
| `lobby-rtl` | `out/lobby-rtl.png` | same under RTL + `i18n/Localization.kt` | V2-04/V2-12 |
| `hunt-hunter` | `out/hunt-hunter.png` + `hunt-paused`/`hunt-eliminated` extras | `RoomScreen.kt` `TacticalHuntPage`, `map/MatchMap.kt` | V2-06 |
| `hunt-prey` | `out/hunt-prey.png` | `RoomScreen.kt` prey branch | V2-07 |
| `chat` | `out/chat.png` | `ui/ChatPanel.kt` | V2-08 |
| `result` | `out/result.png` | `ui/ScorePage.kt` | V2-09 |
| `history` | `out/history.png` | `ui/HistoryDialog.kt` | V2-10 |
| `settings` | `out/settings.png` | `ui/SettingsScreen.kt` | V2-11 |
| `sheet-tag-claim` | `out/sheet-tag-claim.png` | `MatchSheet` content in `RoomScreen.kt` + banner | V2-07 |
| `sheet-room-settings` | `out/sheet-room-settings.png` | `ui/RoomSettingsDialog.kt` (+ `ZonePickerDialog`) | V2-05 |

Secondary surfaces: leave/end confirm (V2-04), tag picker (V2-06), disputed tag (V2-07), zone picker (V2-05),
startup brand (V2-00/V2-12), room load/error (V2-04), session expired/deep link (V2-01/V2-02), update states
(V2-11).

## Appendix B — review commitments carried into implementation

Non-negotiable keeps from `FINAL-RECOMMENDATION.md` §4, to be checked in every relevant PR:

1. A **visible per-prey report list as the map's text alternative** wherever hunters see prey positions
   (closes `UI_AUDIT` UI-03 — the one audit finding that blocks a user group).
2. The claim sheet's **`expiresAt` countdown + "no answer → the huntmaster decides"** transition (a real claim
   decision is never lost), with the persistent strip after dismissal.
3. The honest-result rules: winner shown immediately, derived stats omitted when unknown, no fabricated scores.
4. Team identity = colour + glyph + word; stale/tagged = shape + word, never colour alone.
5. OSM attribution visible; no fake street/place labels; drawn plates labelled as stand-ins.
6. The type floor / contrast / 48 dp / RTL rules in §3.6, proven on rendered UI — not only in token code.

## Appendix C — sizing and sequencing key

| Size | Meaning |
|---|---|
| S | ≤ 1 focused day; copy/control/state-only change |
| M | 1–2 days; one screen + states + tests |
| L | 3–5 days; screen with systemic components or shared sheet/Board variant |
| XL | 5+ days; hunt shell combines Board/map/sheet/dock + many states — split internally into commits but one coherent slice |

Program total: **13 base tickets (V2-00…V2-12) — 1 foundation, 11 page slices, 1 hardening** — then up to 5
conditional tickets if the owner approves them. The plan intentionally keeps the server untouched for the base;
the only API work is owner-gated (§8).
