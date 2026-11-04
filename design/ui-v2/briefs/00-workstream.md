# Workstream brief — UI/UX redesign v2

## Why

The shipped app (v0.16, MATCHDAY Board) is coherent but was a first pass at the "match equipment" idea.
Owner wants to push the UI/UX to a finished, distinctive product: rethink every page of the game at full
fidelity, compare competing directions, and keep the best. This is a **design exploration**, not a refactor:
we produce full-page designs first; implementation is a later, separate task.

## What is fixed

- Product: **ManHunt** — real-world hide-and-seek, Prey vs Hunters, server-kept rules.
- Approved identity: **Open Zone** mark, **PICKUP** direction, palette roles (field/bg `#0B1220`, chalk
  `#E6EDF7`, signal cyan `#22D3EE`, prey coral `#FF7A59`, hunters violet `#A79BFF`), bundled OFL faces
  Big Shoulders / Instrument Sans / Red Hat Mono. The logo/mark geometry is not redesigned.
- Feature set and rules: room codes, two teams, ready/begin, head start, live hunt with reports/trails/zone/
  clock, physical tag with confirm/dispute/huntmaster resolve, chat, history, result, settings, updates.
- Facts and vocabulary: Prey, Hunters, Hunt, Room, Code, Zone, Trail, Report, Tag, Full time, Huntmaster.
- Copy family stays provisional-but-current: "Hide from your friends." etc. `skills/` will define allowed copy.

## What is open

Layout system, typography scale, component grammar, colour expression, navigation/IA, screen composition,
state design, motion intent, and the emotional register of each page.

## Canvas and page set

- One direction = one coherent design system applied to the **whole** canonical set.
- Logical canvas **390 × 844 dp** (reference Android phone), rendered at **1170 × 2532 px** (3×).
- **Full-bleed app page: no status bar, no navigation bar, no keyboard overlay, no browser chrome, no device
  frame.** Bottom gesture/home indicator area is usable canvas. Respect 24 dp outer margins by default.
- Canonical pages (12) + 2 proof variants, English copy except where noted:

| # | id | Page | Must show |
|---|---|---|---|
| 1 | `auth` | Sign in / create local account | quiet form, server row demoted, brand line |
| 2 | `roles` | Sides + mode catalogue (first run / from Settings) | Prey vs Hunters explained, Classic playable, planned modes honest |
| 3 | `home` | Host or join | host action, join-by-code, profile/settings entry |
| 4 | `lobby` | Room lobby (host view, everyone ready) | room code, team sheet, readiness, begin dock |
| 5 | `hunt-hunter` | Live hunt, Hunter view | map-first, reports + trails + zone, clock, tag action |
| 6 | `hunt-prey` | Live hunt, Prey view | own position, zone/clock, report cadence, no other prey positions |
| 7 | `chat` | Room field log | messages + system events, composer |
| 8 | `result` | Full time | winner, final score, duration, actions (rematch, lobby, history) |
| 9 | `history` | Past hunts | list + one match summary |
| 10 | `settings` | Settings | theme, text size, language, permissions, updates, server |
| 11 | `sheet-tag-claim` | Prey receives tag claim | confirm / dispute, who/when, consequence copy |
| 12 | `sheet-room-settings` | Host edits hunt rules | timers, zone/shrink, trails, report interval, tag policy |
| +1 | `lobby-rtl` | Arabic RTL proof | genuinely mirrored lobby, LTR numerals/code |
| +1 | `home-light` | Light theme proof | same Home in "daylight chalk" light theme |

- Seed scenario (fictional, consistent everywhere): **"Riverside Run"**, code **K7M2QX**, 5 players
  (3 Hunters / 2 Prey), zone 240 m, clock 41:12, duration 60:00. Player names: Nadia, Omar, Selim, Rana, Youssef.
- Overlays (11, 12) are rendered as full-page app states with the page behind them dimmed — still no OS chrome.

## Non-negotiables

- Original vector/CSS work only: no stock images, no AI imagery, no network assets. Brand mark and fonts from
  `design/brand/` and `design/brand/motion-kit/assets/fonts/`.
- Accessibility: WCAG AA contrast, ≥48 dp touch targets, body text ≥14 sp equivalent (auxiliary ≥12 sp),
  visible focus/selected states, colour never the only signal.
- Internationalisation: layouts must work in Arabic RTL (one proof page), avoid hard-coded directional
  assumptions in the system notes.
- Light and dark theming must both be plausible (one light proof page; system notes for the rest).
- Realistic states where the page has them: empty/loading/error/offline/reconnecting/paused/eliminated.
- Implementable in Jetpack Compose on minSdk 26 with the existing data contract; note anything that would
  require engine work instead of pretending it is free.
- No fake product claims, player counts, store badges, ratings or urgency.

## Quality bar

Ship-ready screen design at a fidelity where an engineer could build it: typographic scale, spacing,
hierarchy, component states, copy intent, iconography and motion notes. Not a mood board. Coherent within a
direction, comparable across directions (same page set, states and seed data).

## Process

1. Environment + app-specific design skills land first (design-env, design-smith).
2. Three designers each execute one direction across the full page set (round 1).
3. Two reviewers score and critique every direction/page, then message designers directly.
4. Designers and reviewers talk, revise (round 2), re-render.
5. Reviewers consolidate final scores and a ranked recommendation; Lead assembles the owner review pack.
6. **Owner picks the direction** (and any per-page steals) before any implementation.
