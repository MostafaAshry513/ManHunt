# ManHunt redesign — screen specs index

**Status:** implementation specs for task-51. Authority order: [`../direction.md`](../direction.md) →
[`../tokens.md`](../tokens.md) → this folder → the existing app code (only for behaviour/testTags, never
for visual decisions).

The app's screens are unchanged in **function** (Auth → Safety → Home → Lobby → Hunt → Chat → Result;
Settings / Updates / Roles; same dialogs, same game rules, same server contract). Only hierarchy,
composition, components and motion change. Do not add, rename or remove gameplay actions.

---

## 1. Screen map

| # | Spec | Route / composable | Purpose | Primary action | Board? |
|---|---|---|---|---|---|
| 01 | [`01-shell-and-board.md`](01-shell-and-board.md) | `AppRoot`, shared chrome | Frame, navigation, `MatchBoard`, `Masthead`, docks, sheets, rules | — | — |
| 02 | [`02-auth.md`](02-auth.md) | `Route.Auth` → `AuthScreen` | Sign in / create account; local server setup (demoted) | Sign in / Create account | No |
| 03 | [`03-first-run-safety-and-roles.md`](03-first-run-safety-and-roles.md) | `Route.Safety` / `Route.Roles` → `RolesScreen` | First-run safety + how the game works + all modes | Accept / Let's play | No |
| 04 | [`04-home.md`](04-home.md) | `Route.Home` → `HomeScreen` | Start a hunt (host) or join one (code) | Create hunt / Join hunt | Masthead |
| 05 | [`05-lobby.md`](05-lobby.md) | `Route.Room` lobby page | Room code, teams, readiness, start | Ready / Begin the hunt | Yes |
| 06 | [`06-live-hunt.md`](06-live-hunt.md) | `Route.Room` tactical page | Map, clock, zone, prey reports, trails, tag | Tag prey / (Prey) status | Yes |
| 07 | [`07-chat.md`](07-chat.md) | `Route.Room` chat tab → `ChatPanel` | Field log during the hunt | Send | Compact header |
| 08 | [`08-result-and-history.md`](08-result-and-history.md) | finished match overlay → `ScorePage`; `HistoryDialog` | Match result, re-match, history | Back to lobby / Rematch | Full-time |
| 09 | [`09-settings-and-updates.md`](09-settings-and-updates.md) | `Route.Settings` → `SettingsScreen` | Appearance, language, permissions, updates, account | per row | No |
| 10 | [`10-dialogs-and-sheets.md`](10-dialogs-and-sheets.md) | `AlertDialog`s, `RoomSettingsDialog`, update sheet, tag picker, claim/dispute, end-hunt, leave | Consequential decisions | contextual | No |
| 11 | [`11-states.md`](11-states.md) | all | Empty, loading, error, offline, permission, update, long-content states + copy | recovery action | — |
| 12 | [`12-adaptation.md`](12-adaptation.md) | all | RTL/Arabic, light/dark, phone/fold/tablet/desktop, 320 dp, 1.5–2× text, a11y pass | — | — |

Also: [`../tokens.md`](../tokens.md) (values), [`../motion.md`](../motion.md) (motion),
[`../screenshot-shotlist.md`](../screenshot-shotlist.md) (captures), [`../refs/`](../refs/) (rendered
concepts), [`../audit.md`](../audit.md) (diagnosis).

---

## 2. State matrix (what must exist and be designed)

`●` = designed state required; `–` = not applicable. Every `●` has copy and layout in the linked spec or
[`11-states.md`](11-states.md).

| Screen | Empty | Loading | Error | Offline / reconnect | Permission | Long content | RTL | Light |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Auth | – | ● submit | ● auth/server | ● server | – | – | ● | ● |
| First-run safety | – | – | – | – | (location explained, not asked here) | ● scroll | ● | ● |
| Roles | – | – | – | – | – | ● pager | ● | ● |
| Home | ● no active hunt / first-run | ● create/join | ● create/join/server | ● | – | ● small screens | ● | ● |
| Lobby | – | ● room load | ● leave/kick/start blockers | ● | – | ● 8+ players | ● | ● |
| Live hunt | ● no prey reports yet | ● map tiles / first fix | ● GPS off / no permission / server | ● | ● location + notifications | ● many prey + long names | ● | ● |
| Chat | ● no messages | ● load older | ● send failed / load failed | ● | – | ● long thread | ● | ● |
| Result | – | ● result sync | ● result fetch | – | – | ● many players | ● | ● |
| History | ● no hunts | ● load | ● load failed | – | – | ● many matches | ● | ● |
| Settings | – | ● cache size / update check | ● update check/download | ● | ● permission rows (system) | ● 5 sections | ● | ● |
| Update sheet | ● up to date | ● checking/downloading | ● download failed | ● | unknown-sources | ● changelog | ● | ● |
| Dialogs/sheets | – | ● busy | ● action failed | – | – | ● many targets | ● | ● |

---

## 3. Component inventory (build once, use everywhere)

Specified fully in [`01-shell-and-board.md`](01-shell-and-board.md) §5 unless noted. Files are suggestions
for the implementer.

| Component | Where used | Suggested file |
|---|---|---|
| `MatchBoard` (variants: `Masthead`, `Lobby`, `Live`, `FullTime`) | Home, Lobby, Hunt, Result | `ui/components/MatchBoard.kt` |
| `ChalkRule` + `SurveyTick` | every screen | `ui/components/ChalkRule.kt` |
| `BoardButton` (primary/secondary/destructive/inline) | every screen | `ui/components/BoardButton.kt` |
| `FieldPlate` (drawn pitch/radar) | Auth, Home first-run, Roles, empty states | reuse `BrandMotion` canvas / new static variant |
| `CodePlate` | Home join, Lobby invite | `ui/components/CodePlate.kt` |
| `TeamTag`, `StateTag` | Lobby, Hunt, Chat, Result, Roster | `ui/components/Tags.kt` |
| `TeamSheet`, `RosterRow` | Lobby, Hunt sheet, Result | `ui/components/TeamSheet.kt` |
| `FieldMark` icon set | everywhere | `ui/components/FieldMarks.kt` |
| `MatchSheet` (sheet + dialog + scrim + insets) | dialogs, hunt details | `ui/components/MatchSheet.kt` |
| `BottomDock` | Lobby, Hunt, Result | `ui/components/BottomDock.kt` |
| `EmptyState` / `ErrorStrip` / `LoadingRule` | all states | `ui/components/States.kt` |
| `ScorePage` | result | `ui/screens/ScorePage.kt` |
| `FieldLog` message row | chat | inside `ChatPanel` |
| `SettingsRow`, `RulesGroup` | settings | inside `SettingsScreen` |

Keep the existing composable names/signatures compiling where other files call them (task-51 contract). New
system gets new files; old call sites are swapped screen by screen.

---

## 4. Cross-screen invariants (review will check these on every screen)

1. **One primary action**, in the bottom 40 % of the screen (thumb zone), styled as `BoardButton` primary.
2. **At most two plates** on a screen; none nested; none for prose. Everything else is rules + space.
3. **One cyan surface** (see tokens §3.2). No cyan icon tints, no cyan links.
4. **No icon tile** behind an icon. No `Material` feature icons. No paw, no crosshair, no gear.
5. **No all-caps** except `StateTag`; no "01/02/03" decoration; no mono prose.
6. **Board or Masthead at the top of every screen except Auth/Safety/Roles/Chat**; full-bleed, safe-area
   aware, one per screen.
7. **Every number that can change** is tabular and LTR (clock, code, count, radius, version).
8. **Every empty/loading/error state** has: what happened, what to do, one action, and no fake content.
9. **Every destructive action names the consequence** in the title, not "Are you sure?".
10. **Nothing below 48 dp** tappable; nothing clipped at 1.5× or 2× text scale; every fixed height becomes
    `heightIn`.
11. **RTL is the same layout mirrored**, except wordmark/mark, map, numerals, and the physical team glyphs.
12. **No dev strings** ("10.0.2.2", "Signed in as -", "CI Room", "[test]") can render in a release build;
    placeholders are either real data or absent.

---

## 5. Flow (unchanged game, new surfaces)

```
cold start → StartupBrand 0.9 s (skippable)
   └→ Safety (first run only) ── "I understand and I'll play safely"
        └→ Auth ── sign in / create account ── (server disclosure, not a card)
             └→ Home ── Masthead + permanent line
                  ├─ HOST:  name → create ─→ Lobby (host)
                  ├─ JOIN:  CodePlate (6 chars) → join ─→ Lobby
                  └─ footer: How it works → Roles / Settings / Sign out
Lobby ── Board(LOBBY, room name, code) ─┬─ TeamSheet + choose side → Ready (dock)
        └─ host: rules sheet → Begin the hunt (dock, disabled + reason)
Hunt  ── Board(LIVE, clock, zone, prey) + full-bleed map + dock(Tag) + match sheet
   ├─ tag: target sheet → "Tag Yasmin?" → request → Prey confirms/disputes → result or continue
   ├─ pause/resume/end (host, rules sheet)
   ├─ Chat tab (field log)
   └─ finish → ScorePage (full-time Board, winner, score, trail map) → lobby / rematch / history
Settings ── appearance / language / permissions / updates (sheet) / account
```

Every dialog is a `MatchSheet` (bottom sheet full-width) except the update sheet and the result, which are
own screens/sheets; no floating `AlertDialog` cards.

---

## 6. Implementation phases (same as direction.md §7)

| Phase | Deliverable | Screens/files |
|---|---|---|
| **0** | Tokens, fonts, FieldMarks, Board/Masthead, rules/buttons/tags, root frame | `ui/theme/*`, `ui/components/*` |
| **1** | Credible slice: Auth, Home, Lobby, Live Hunt | specs 02, 04, 05, 06 |
| **2** | Match beats: tag/claim/dispute/end sheets, Result `ScorePage`, History | specs 08, 10 |
| **3** | Manual: Chat field log, Roles/Safety field guide, Settings/Updates | specs 03, 07, 09 |
| **4** | States + adaptation + screenshots pass | specs 11, 12; shotlist |

Mapping to the current code (do not rewrite behaviour):
`AuthScreen.kt` (02), `RolesScreen.kt` (03), `HomeScreen.kt` (04), lobby branch of `RoomScreen.kt` (05),
tactical branch + `HuntSheet`/`HuntActionBar` (06), `ChatPanel.kt` (07), result dialog + `HistoryDialog.kt`
(08), `SettingsScreen.kt` (09), all `AlertDialog`s + `RoomSettingsDialog.kt` (10), `BrandMotion.kt` /
`BrandMapMotion.kt` / `StartupBrand.kt` (motion).
