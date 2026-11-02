# 09 — Settings, Updates and the field log

**Route:** `Route.Settings` → `SettingsScreen` (`ui/SettingsScreen.kt`), update state via `UpdateManager`.
**Purpose:** a player-owned manual page: how the app looks, speaks, what it is allowed to use, how it updates,
and the account/server it talks to. Today it is an icon-only tab bar over cards; it should read like the back
matter of a field guide: ruled sections, plain rows, no cards.
**Primary action:** no single primary; each section has one clear row action. The only destructive action is
Sign out (confirmed).

**Old problem being fixed:** five unlabeled icon tabs (`SettingsTab`), cards for every group, a `FilterChip`
pill row for theme, a slider with an unclear preview, permission rows that look like switches but are not,
an update card mixed with changelog prose, and a cache/sign-out card. New: one ruled page with sections,
sentence-case labels, honest states, and an Updates section that behaves like a **field log** (version entries
+ one download action).

---

## 1. Hierarchy

1. **Header** — back + "Settings" + version line (small).
2. **Appearance** — theme selector, text size, (optional) reduce motion. The only section with live preview.
3. **Language** — English / العربية, immediate.
4. **Permissions** — location and notifications with current system status + "Open settings".
5. **Updates** — current version, check state, available update + "Download and install", changelog entries.
6. **Account** — player name, server, cache, sign out.
7. **Footer** — version/build/OS support + MIT/open-source note if already shown elsewhere; OSM not needed.

Sections are separated by `ChalkRule`; there are no plates except the text-size preview (a control preview)
and the update progress (a status surface). Each row is 56–72 dp with a 1 dp hairline between rows. No icons
inside tinted tiles; section headers are sentence case (`title` 17) with a `caption` description where useful.

---

## 2. Layout

```
┌───────────────────────────────────────────────┐
│ [←]  Settings                                 │  header 56
│      v0.15.1                                  │  data.small muted under title? — in header subtitle
├───────────────────────────────────────────────┤
│  Appearance                                   │  title 17 + 1 dp rule under section headers
│  Theme                                        │  row: label 17 + value
│          [ DARK ][ LIGHT ]                    │  2-cell selector, 48 dp, selected = 2 dp cyan rule
│  Text size                          1.0×      │  row: label + value data
│  ──────●───────────────                       │  slider (chalk track, 48 dp touch)
│  ┌─────────────────────────────────────────┐  │
│  │  The hunt starts in 04:12.              │  │  preview plate: sample styles at the chosen scale
│  └─────────────────────────────────────────┘  │  (committed on release, existing behaviour)
│  Reduce motion                      [ off ]   │  optional, Phase 4 (see motion.md §7); switch
│  ─────────────────────────────────────────────  │
│  Language                                     │
│  English / العربية                [ EN | ع ]  │  2-cell selector; applies immediately
│  Language applies immediately and mirrors…    │  body.small muted
│  ─────────────────────────────────────────────  │
│  Permissions                                  │
│  Location                 Granted · Change    │  status data + inline action (system settings)
│  Notifications            Not granted · Allow │
│  Match notifications… (explanation)           │  body.small muted
│  ─────────────────────────────────────────────  │
│  Updates                                      │
│  ManHunt v0.15.1 · Android 8+                 │  data
│  [ Check for updates ]                        │  secondary 48
│  (up to date) You're up to date.              │  body.small muted
│  (available)  v0.16.0 · 2.3 MB                │  title + data
│  [ Download and install ]                     │  primary 56 (one cyan surface)
│  Updates install over the current app. Android│  body.small muted (honest, not on Play Store)
│  will ask you to confirm once.                │
│  Field log                                    │  caption
│  0.15.1 · 2026-11-01                          │  data date; changelog entries below
│   · …changelog line…                          │  body.small
│  0.14.0 · 2026-10-20                          │
│  ─────────────────────────────────────────────  │
│  Account                                      │
│  Signed in as Yasmin                          │  title + row
│  Server  74.208.99.178 (test)                 │  data; "Change it on the sign-in screen."
│  Cache   0 B                       Clear cache│  data + inline action (destructive-ish? not)
│  [ SIGN OUT ]                                 │  destructive 48 outline → confirm sheet
│  ─────────────────────────────────────────────  │
│  ManHunt · free APK · MIT licence · OpenStreetMap data © contributors   │  data.small
└───────────────────────────────────────────────┘
```

- **The page scrolls as one page** (no tabs). On phones the sections are in flowing order; the header stays.
- **Theme selector** is a 2-cell segmented rule: a 1 dp hairline box split in two (not a `FilterChip` pill),
  each cell 48 dp, selected cell has a 2 dp cyan rule on its bottom edge + chalk label; the unselected cell is
  muted. It is the only interactive "plate".
- **Text size slider:** track = 1 dp hairline with 5 tick marks (0.85, 1.0, 1.15, 1.3, 1.45? — use the app's
  actual range from the existing slider; do not invent bounds); thumb = 12 dp square, chalk; value `data` at
  the end ("1.0×"). Preview plate shows three lines at the *target* scale (display line "The hunt starts in
  04:12.", body line, caption line); commit on release (existing task-31 behaviour), with the helper "Applies
  when you let go." if the current implementation previews only.
- **Language:** 2-cell selector; applies immediately; the explanation uses the existing translated string.
- **Permissions:** rows, not switches: label + status text (Granted/Not granted/Denied/Off) + inline action
  "Open settings" (or "Allow" if the app can request in-place). Match the existing permission logic; the
  explanation for notifications is the existing paragraph. Never show a `Switch` for a system permission.
- **Updates:** state machine:
  - idle → "Check for updates" secondary.
  - checking → secondary disabled + 3-tick `LoadingRule` + "Checking for updates…" (existing string
    "Checking..." can be updated).
  - up to date → "You're up to date." (body.small muted) + version; check again allowed.
  - available → version, size, "New version available" honest label; primary "Download and install";
    `data` explanation of unknown sources; optional changelog in the field log.
  - downloading → determinate 2 dp cyan progress rule + `data` "Downloading 1.2 of 2.3 MB"; cancel? Only if
    the existing UpdateManager supports cancellation — do not add.
  - downloaded → "Install update" (opens the system installer); status line "Android will ask you to confirm."
  - failed → `ErrorStrip` with the existing message + "Try again".
  - unknown sources blocked → honest explanation + "Open settings" to app settings; do not hide the step.
  - The section must state it is a sideloaded APK, not Play Store: "Updates install over the current app.
    Android will ask you to confirm once." (existing string).
- **Field log:** changelog entries rendered as ruled rows: `data` version + date on one line, entries as
  `body.small`; the most recent 3 versions visible, older behind "Show older versions" inline (48). This
  replaces the `ChangelogCard` card. Changelog text comes from `Changelog.kt`; do not rewrite it.
- **Account:** player name from session; server address with an honest label when it is the hosted test server
  ("hosted test server" in `data`); "Change it on the sign-in screen." (the app currently only allows changing
  after sign-out — that is the truth; do not add server editing here in this sprint); cache size + clear cache
  (inline, disabled while clearing, shows "Clearing…" then "0 B"); Sign out destructive with confirm sheet.
- **Footer:** version + "free APK" + MIT + OSM credit (OSM credit is normally on the map; a footer credit is
  acceptable and honest; keep it small). No fake support email; no social links (not in app).

---

## 3. Components

| Element | Spec | Test tag |
|---|---|---|
| Header | shell §3: back + "Settings" + subtitle version `data.small` | `settings_back` |
| Section header | `title` 17 + 1 dp `ChalkRule` below (or rule above + title below; keep consistent: title then rule 8 dp below); optional `caption` description | — |
| Row | 56–72 dp, label `body` 15 (or `title` 15 Bold for the row anchor), value `data`/`body.small` muted end-aligned, inline action 48, 1 dp hairline between rows; no chevrons (rows are not navigation) | per section |
| Segmented control | 2 or 3 cells, 48 dp high, 1 dp `hairlineStrong` box, 2 dp cyan underline on selected, labels `label`; RTL mirrors order | `settings_theme_dark`, `settings_theme_light`, `settings_language_en`, `settings_language_ar` (keep existing `settings_tab_*` tags on the equivalent controls for test compatibility if the screenshot tests use them) |
| Text size | slider 48 dp touch, ticks, value `data`, preview plate | `settings_text_scale` |
| Preview plate | `plate` 2 dp radius, 16 dp padding, 3 sample lines at target scale; no motion | `settings_text_preview` |
| Permission row | status + action; no switch | `settings_permission_location`, `settings_permission_notifications` |
| Primary action in Updates | `BoardButton` primary 56 (one cyan surface on this page) | `settings_update_download` |
| Secondary actions | `BoardButton` secondary 48 / inline | `settings_check_updates` |
| Progress rule | 2 dp cyan determinate + `data` | `settings_update_progress` |
| Error strip | `ErrorStrip` | `settings_update_error` |
| Changelog row | `data` version + date, body.small entries, hairline | — |
| Cache row | data size + inline "Clear cache"; busy "Clearing…" | — |
| Sign out | destructive 48 outline → `MatchSheet` confirm "Sign out of this phone?" body "You'll need your username and password to sign in again." | `settings_signout` |
| Footer | `data.small` muted, non-tappable | — |

Removed: `TabRow` + icon tabs, `ScreenCard` groups, `FilterChip` pills, `Switch` beside plain text without
semantics, "Appearance/Language/Permissions/Updates/Account" icon-only discoverability problem, the
`ChangelogCard` card, the "Storage" card, the black screen with back arrow only.

---

## 4. Copy intent

| Slot | English | Notes / Arabic |
|---|---|---|
| Title | Settings | existing |
| Appearance | Appearance | existing |
| Theme / Dark / Light | Theme / Dark / Light | existing |
| Text size | Text size | existing; value "1.0×" |
| Preview | The hunt starts in 04:12. | sample string; Arabic sample with Arabic text + LTR clock |
| Reduce motion | Reduce motion | new, optional; body "Turns off field, sweep and transition animation." (honest) |
| Language | Language | existing |
| Language explanation | Language applies immediately and mirrors the whole layout. | existing |
| Permissions | Permissions | existing |
| Location | Location | existing |
| Granted / Not granted / Denied / Off | existing keys where present | status data |
| Open settings | Open settings | existing |
| Notifications | Notifications | existing |
| Match notifications | Match notifications | existing |
| Permissions explanation | (existing paragraph) | reuse |
| Updates | Updates | existing |
| Check for updates | Check for updates | existing "Check for updates" if present |
| Checking | Checking for updates… | existing "Checking..." may remain; update value for clarity |
| Up to date | You're up to date. | new |
| Available | New version available. v{name} · {size} | honest; no urgency words |
| Download and install | Download and install | existing |
| Downloading | Downloading {done} of {total} | data |
| Install | Install update | existing if present; opens system installer |
| Updates install note | Updates install over the current app. Android will ask you to confirm once. | existing |
| Unknown sources | Android needs permission to install from ManHunt. It will ask once. | honest; no "Play Protect approved" |
| Download failed | Download failed. Check your connection and try again. | existing |
| Field log | Field log | new label for the changelog; body entries from Changelog.kt unchanged |
| Show older | Show older versions | new |
| Account | Account | existing |
| Signed in as | Signed in as {name} | existing |
| Server | Server | existing |
| Server change note | Change it on the sign-in screen. | existing concept |
| Cache | Cache / Clear cache / Clearing… | existing |
| Sign out | Sign out / Sign out of this phone? / You'll need your username and password to sign in again. | existing sign out; confirm copy new |
| Footer | ManHunt · free APK · MIT licence · Map data © OpenStreetMap contributors | honest |

Arabic: reuse existing keys for all Settings labels (Localization.kt has them); new strings (You're up to
date., Field log, New version available, sign-out consequence, Reduce motion) need copy-language review; no
`·` in Arabic; server address LTR isolate.

---

## 5. States

| State | Design |
|---|---|
| Static page | All sections visible; only data-dependent rows show loading inline (cache size, update state). |
| Cache size loading | "Calculating…" `data`; then "0 B"; clearing disables the action and shows "Clearing…". |
| Update checking | Button disabled + `LoadingRule` + sentence; no dialog. |
| Update available | Inline block under Updates: version/size, primary Download; changelog in field log. |
| Downloading | Determinate 2 dp rule + byte counts; action disabled; no fake speed/time. |
| Downloaded | Primary becomes "Install update"; explanation; the system installer may background the app. |
| Update error | Error strip + Try again; last known state preserved. |
| Permissions denied/off | Status `data` in `error` for denied? — use chalk + error only if the permission blocks the game ("Location: Off — needed as Prey"); action opens settings. |
| Language switch | Whole app re-renders RTL/LTR immediately; Settings stays open (route preserved). |
| Theme switch | Immediate; no white flash; Board stays ink in light. |
| Sign-out busy | Confirm sheet primary loading; on success → Auth; on error → strip in the sheet. |
| 200 % / 320 dp | Rows wrap; segmented controls full width; slider label stacks; preview plate grows. |
| RTL | Sections/rows mirror; server/cache values LTR; switch labels right; slider direction RTL-aware (or force LTR for a physical scale? — slider should mirror, value LTR). |
| Light | Chalk ground, ink text, white plates; cyan light; segment selected rule cyan light. |
| Reduced motion | No transitions on page change; update progress rule still shows progress (it is information, not decoration) — allowed with reduced motion (it's not an animation loop). |

---

## 6. Compose implementation notes

- Keep `SettingsScreen(onBack, initialTab)` signature (screenshot tests call it) even if the page becomes one
  scroll: `initialTab` can scroll/expand the corresponding section (0 Appearance, 1 Language, 2 Permissions,
  3 Updates, 4 Account) — use it to `animateScrollToItem` or to set the selected section on tablets. If a
  tab-based test taps `settings_tab_N`, either keep invisible/anchored `testTag("settings_tab_$N")` on section
  headers or update the tests — **prefer keeping the tags** on section headers to avoid test churn, and note in
  the PR that the tab bar is gone.
- Reuse the existing repo flows: `repo.darkTheme`, `repo.setTextScale`, `repo.language`, `repo.textScale`,
  `UpdateManager` state, `AppStorage.cacheSizeBytes`, permission checks, `repo.logout()`. Do not change
  persistence keys.
- The text-size slider must keep the task-31 behaviour: preview at target scale inside a nested
  `ManHuntTheme(fontScale = previewScale)`, commit on release; labels outside the nested theme.
- Segmented controls: new `ChalkSegmented` composable (48 dp cells, 2 dp selected underline, one border);
  do not use `FilterChip` or `Switch` for theme/language.
- Updates: reuse the existing `UpdateTab` logic/state names; replace its card layout with rows + progress rule;
  keep the `UpdateManager` calls unchanged. Do not add background downloads.
- Permissions: use the existing `PermissionRow`, restyled to the row spec; remove switches and fix `contentDescription`.
- Sign-out confirm: `MatchSheet` (shell §5.6) with destructive primary; keep `repo.logout()` call.
- Semantics: section headers `heading()`; segmented controls `Role.RadioButton` with `selectableGroup`;
  slider standard semantics with content description "Text size"; update progress `progressBarRangeInfo`
  where applicable; error strips live region.
- Adaptive: at ≥840 dp, a 240 dp sticky section rail (Appearance/Language/Permissions/Updates/Account) with
  the content column 560 dp; on tablet the rail labels are the same anchors; no tabs. At ≥1200 dp cap content
  at 560 and show the rail; mouse hover/focus rings visible.

---

## 7. Premium screenshot brief

- **Shot A (appearance, dark):** full page top: Appearance (theme segmented Dark selected, text size 1.0×
  slider + preview plate "The hunt starts in 04:12."), Language, start of Permissions. No tabs, no cards.
- **Shot B (updates available):** Updates section with version, honest size, primary "Download and install",
  field-log entries with dates; error-free; no fake progress.
- **Shot C (light):** same page light — white plates, ink type, no cream.
- **Shot D (Arabic RTL):** mirrored page, Arabic labels, server/version LTR.
- **Reject:** icon-tab row, FilterChip pills, switches with no labels, "0 B" cache card with no action, changelog
  wall, fake "up to date" while update exists.

---

## 8. A11y / RTL / adaptive checklist

- Contrast: body 15.9; muted 9.1; `data` 12 muted 8.3; error 8.3; selected segment label chalk on plate 14.5;
  primary 9.2.
- Touch: rows actions 48; slider 48; segments 48; update button 56; sign-out 48.
- Focus order = visual order; section headers headings; slider announced with value; switch (reduce motion)
  has a single merged semantics node with its label (fix audit UI-14).
- 200 % text: no row clips; segmented controls wrap to two lines or grow; slider label above.
- RTL: mirror layout; numeric values LTR; slider direction mirrors (value text stays LTR); server address
  isolated; no `·` in Arabic.
- Tablet/desktop: rail + 560 content; no giant full-width rows (cap row width 640).
- Tabletop: content top pane, rail can become a bottom nav? — keep rail on the left edge of the top pane;
  avoid splitting a row across the hinge.
