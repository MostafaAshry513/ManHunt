# ManHunt app redesign — independent workstream (task-48)

**Status:** complete. This folder is the design authority for the premium app redesign that feeds the
implementation task (task-51) and the premium screenshot capture (task-49 / `screenshot-shotlist.md`).
**No app or server code lives here; nothing was committed. Copy is provisional (owner approval pending).**

**The direction in three lines:** *Matchday Board.* The app is a piece of match equipment — scoreboard, team
sheet, chalked pitch, field log, match report — not a stack of generic dark cards. One full-bleed **Board**
strip carries the game state (clock, zone, teams); **one plate, one decisive gesture** per screen; display
type and tabular numerals make the game's data the visual voice; all-caps eyebrow labels, tinted icon tiles,
20 dp cards and the gradient hero are removed.

---

## Read in this order

| Who | Start here |
|---|---|
| Lead / owner review | [`direction.md`](direction.md) (the decision + territories), [`refs/out/direction-board.png`](refs/out/direction-board.png), then the rendered screens in [`refs/out/`](refs/out/). |
| Implementation (task-51) | [`direction.md`](direction.md) → [`tokens.md`](tokens.md) → [`screens/00-index.md`](screens/00-index.md) → the screen spec you are building → [`motion.md`](motion.md). |
| Screenshot capture (task-49) | [`screenshot-shotlist.md`](screenshot-shotlist.md) → [`refs/out/`](refs/out/) for the intended look → screen specs for state details. |
| Site / presentation (task-50) | [`direction.md`](direction.md) §6, the rendered refs, and the shotlist's harvest crops. |
| Audit / QA | [`audit.md`](audit.md) (diagnosis + ranked problems + acceptance), [`screens/12-adaptation.md`](screens/12-adaptation.md) (RTL/light/adaptive/a11y checks). |

---

## File map

| File | Contents |
|---|---|
| [`audit.md`](audit.md) | Screen-by-screen visual/UX diagnosis, the 16 worst problems ranked (with severity + where the fix lives), what is already good, limitations. |
| [`direction.md`](direction.md) | 3 territories (Matchday Board chosen; Pickup Poster as campaign layer; Field Instrument rejected), evaluation, the system-level design, what to remove, implementation phases, acceptance tests, assumptions/kill criteria. |
| [`tokens.md`](tokens.md) | Typefaces + bundle budget, Latin/Arabic type scales, colour roles + contrast table, spacing/Board metrics, shapes/borders/elevation, icon grammar, component metrics, motion tokens, RTL rules, a11y rules, Compose mapping, banned list. |
| [`motion.md`](motion.md) | Startup, transitions, Board clock, map/HUD motion, tag snap, reduced motion, haptics, performance budgets, motion acceptance tests. |
| [`screens/`](screens/) | 13 spec files: index + shell/Board + Auth, Safety/Roles, Home, Lobby, Live Hunt, Chat, Result/History, Settings/Updates, dialogs/sheets, states, adaptation. Each has hierarchy, layout sketches, components, copy intent (EN + Arabic notes), states, Compose notes, screenshot brief, a11y/RTL/adaptive checks. |
| [`screenshot-shotlist.md`](screenshot-shotlist.md) | Capture rig, clean-status-bar demo mode, seeded "Riverside Run" scenario, 16-shot list + harvest crops, capture sequence, quality/rejection checklist, manifest requirements. |
| [`refs/`](refs/) | Rendered concept refs (HTML + PNG) with the official inlined lockup and OFL brand fonts; provenance/rights and re-render instructions in [`refs/README.md`](refs/README.md). |

## Rendered refs at a glance

| Ref | What it proves |
|---|---|
| [`refs/out/direction-board.png`](refs/out/direction-board.png) | The whole direction on one plate (start here). |
| [`refs/out/home.png`](refs/out/home.png) | Home: masthead + field plate + permanent line + host/code verbs. |
| [`refs/out/lobby.png`](refs/out/lobby.png) | Lobby: Board + code + team sheets + pinned Begin dock. |
| [`refs/out/hunt.png`](refs/out/hunt.png) | The game: Board clock/zone/prey, field, reports/trails, one action, OSM credit. |
| [`refs/out/result.png`](refs/out/result.png) | Result as a full-screen scoreboard. |
| [`refs/out/chat.png`](refs/out/chat.png) | Chat as a field log. |
| [`refs/out/settings.png`](refs/out/settings.png) | Settings as a ruled manual page. |
| [`refs/out/auth.png`](refs/out/auth.png) | Auth: brand line + quiet form, server demoted. |
| [`refs/out/home-light.png`](refs/out/home-light.png) | Light theme = daylight chalk. |
| [`refs/out/lobby-rtl.png`](refs/out/lobby-rtl.png) | Real Arabic RTL, including mirrored layout + LTR code/clock. |

---

## Five biggest changes (summary for the Lead)

1. **Card system → Board system.** A full-bleed `MatchBoard` (state, clock, zone, teams) becomes the signature;
   grouping uses 1 px chalk rules and one 2 dp plate only where the player acts. The tinted icon tile, the
   20 dp card and the stacked-card hierarchy are removed.
2. **Brand as structure, not wallpaper.** Big Shoulders Display + Instrument Sans + Red Hat Mono (already OFL
   in `design/brand/motion-kit/assets/fonts/`) replace Roboto default; the official wordmark appears as a small
   masthead lockup; the clock is the loudest object in the app; cyan is reserved for the field/referee, coral
   Prey, violet Hunters.
3. **Two verbs and one action.** Home becomes masthead + permanent line + a **host** object (name + create) and
   a **code** object (six-cell `CodePlate`); the Lobby becomes team sheets + a pinned readiness/Begin dock;
   Auth demotes server setup to a footer row.
4. **The match beats become match sheets and a scoreboard.** Tag claim/dispute/end are `MatchSheet`s with the
   consequence as the title and persistent decision strips; the result is a full-screen `ScorePage`
   (FULL TIME Board, winner word, map trail, final team sheets) — never an `AlertDialog` over the keyboard.
5. **A field-guide states + adaptation system, and a capture spec that makes it legible.** New
   `EmptyState`/`ErrorStrip`/`LoadingRule`/`OfflineStrip`/`PermissionStrip` vocabulary; RTL/light/320 dp/1.5–2×
   rules mapped to the existing UI audit; and a shotlist that captures a real seeded game with clean status
   bars, real OSM tiles, Arabic/light sets and no dev strings — replacing the stale, mixed-resolution,
   test-data-leaking screenshots.

---

## Constraints honoured

- Gameplay, navigation graph, ViewModels, server contract and existing test tags are unchanged; the specs say
  where old composable signatures must keep compiling.
- Only the approved Open Zone identity/palette; no new logo, colours, gradients, glow, stock or trademarks.
- Copy stays within the provisional family and the tone-of-voice/claims guardrails (no safety/store/urgency
  claims); Arabic reuses the app's approved MSA strings, new strings flagged for copy-language review.
- Rendered refs use the official mark/wordmark geometry inlined verbatim and OFL brand fonts; all other
  geometry is original; no OSM tiles/stock.
- No commits, no posts, no app/server edits. Repo working tree shows this folder as untracked only
  (other teammates' in-progress implementation changes are theirs).

## Known limits

- The audit is visual/UX and code-based; no device run was part of this workstream (live-hunt chrome was
  audited from source + the JVM map test; light/Arabic states were inferred). The implemented build is the
  evidence; the shotlist defines how to prove it.
- The rendered refs are concept illustrations, not pixel-exact handoff (drawn maps instead of OSM tiles,
  Windows Arabic fallback, static clock). Where refs and specs differ, the **token values + screen specs win**.
