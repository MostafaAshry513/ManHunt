# 04 — Home (start or join)

**Route:** `Route.Home` → `HomeScreen` (`ui/HomeScreen.kt`, `HomeViewModel`).
**Purpose:** in one glance, answer "how do I get into a game tonight?" — host one or join one. This is the
screen most people see, and the one that must say ManHunt before it says "app".
**Primary action:** Create the hunt (cyan). Secondary: Join hunt.

**Old problem being fixed:** three identical cards (Host / Join / How it works) under a large animated banner,
with the brand repeating itself, an all-caps "HUNT ROSTER"-style label language elsewhere, and the actual
primary action buried in the third viewport on short phones. Home becomes a **matchday plate**: masthead,
one drawn field, the permanent line, two verbs as *different* objects (a hunt you name vs a code you enter).

---

## 1. Hierarchy

1. **Masthead** — lockup (mark + wordmark) + local time + settings. Identity, quiet.
2. **Field plate** — 120–160 dp drawn pitch (static-first), the only illustration.
3. **Permanent line** — `Hide from your friends.` display.l, two lines. The loud beat.
4. **HOST A HUNT** — a `FieldPlate`-like block with the hunt-name field + `Create the hunt` primary. **The
   one cyan surface.** This is the "start" verb and the biggest object under the line.
5. **JOIN A HUNT** — the `CodePlate`. Visually different: a code object, with a secondary Join button.
6. **Footer** — `How it works` inline row, `Playing as {name}`, `Sign out`; version line.

If a player only reads the top half, they should understand: brand, tonight's game, host. The join code is
one thumb-move below.

---

## 2. Layout (phone, 360–430 dp)

```
┌───────────────────────────────────────────────┐
│ ◉ MANHUNT              21:04             [⚙] │  Masthead 56, full-bleed, 1 dp bottom rule
├───────────────────────────────────────────────┤
│                                               │
│        FIELD PLATE 120–160 dp (full-bleed)    │  zone ring · coral trail · violet dots · no text
│                                               │
├───────────────────────────────────────────────┤
│  Hide from                                    │  display.l 48/44 (display.s on short screens)
│  your friends.                                │
│  Real-world GPS hide-and-seek.                │  body.small muted
│                                               │
│  Host a hunt                                  │  title 17 Bold
│  ┌─────────────────────────────────────────┐  │
│  │ Hunt name                               │  │  52 dp plate field (label above, caption)
│  └─────────────────────────────────────────┘  │
│  Name it, or leave it as ManHunt.             │  12 caption muted
│  ┌─────────────────────────────────────────┐  │
│  │            CREATE THE HUNT              │  │  56 primary cyan — the one hot surface
│  └─────────────────────────────────────────┘  │
│  [error strip if create fails]                │
│                                               │
│  ────────────────────────────────────────────  │  ChalkRule
│  Join a hunt                                  │  title 17 Bold
│  ┌────┐┌────┐┌────┐┌────┐┌────┐┌────┐         │
│  │ 1  ││ 2  ││ 3  ││ 4  ││ 5  ││ 6  │ [paste] │  CodePlate 48×48 cells (48 dp tap)
│  └────┘└────┘└────┘└────┘└────┘└────┘         │
│  Ask the host for the six-character code.     │  body.small muted
│  ┌─────────────────────────────────────────┐  │
│  │               JOIN HUNT                 │  │  48 secondary (outline)
│  └─────────────────────────────────────────┘  │
│  [error strip if join fails]                  │
│                                               │
│  ────────────────────────────────────────────  │
│  How it works  →  Read the roles              │  inline row, 48 dp hit
│  Playing as Yasmin                  Sign out  │  body.small / inline action
│  v0.15.1 · free APK · Android 8+              │  data.small muted
└───────────────────────────────────────────────┘
```

**Vertical budget check** (short 640 dp class): 56 masthead + 120 plate + 88 line block + 16 + 120 host + 130
join + 16 + 48 footer = 594 dp minus status/nav insets visible area ≈ 568 dp → the top of the join section may
fall below the first fold, but **Host is fully visible**; that is acceptable because hosting is the primary
action. On ≤ 600 dp heights: plate 96, line `display.s` (28/30), descriptor hidden, host helper hidden. The
rule remains: *Create the hunt is above the fold on every phone.*

### 2.1 Returning / first-run variants

- **First run after safety+auth:** same layout; the field plate is slightly larger (160 dp) and animates once
  (4 s loop) because it is the brand introduction. No onboarding carousel, no tooltip, no "welcome" modal.
- **Returning:** same layout; plate 120 dp static; the hero line stays (it is the app's line, not a one-time
  intro). No "last hunt" content unless the server/room data legitimately provides it — do not invent.
- **A session that has an active room** is not a Home state: the app navigates to the room after
  create/join; Home does not remember rooms across launches. Do not add a "rejoin" card in this sprint.

### 2.2 Join code interaction

- Cells are a single `BasicTextField` visually split; uppercase input, `InputRules.inviteCode` filter; paste
  fills all six; the 6th character focuses the Join button (it does **not** auto-submit — existing behaviour
  preserved; the user taps Join).
- Join is disabled until six characters; disabled explanation is the helper line (it is already true).
- Error: code doesn't match → `ErrorStrip` under the code plate: "That code didn't match a hunt. Check the
  six characters." + "Try again" focuses cell 1; cells do not shake.
- If the deep link / clipboard contains a code at launch, no auto-join on Home (deep-link path already
  handles it in `AppRoot`); do not duplicate.

### 2.3 Host interaction

- Hunt name input is optional: blank → server default "ManHunt" (existing behaviour). Helper states it:
  "Name it, or leave it as ManHunt." Do not use a fake example name as a placeholder (would look like data).
- Create → busy: button label stays "Create the hunt" + 3-tick `LoadingRule`; field disabled; then navigate.
- Error: duplicate/server error strip above the button with the server message; keep the typed name.
- No "Hunt rules" here — rules are configured inside the Lobby (`RoomSettingsDialog`), which is where the
  host already is; Home stays two verbs.

---

## 3. Components

| Element | Spec | Test tag |
|---|---|---|
| Masthead | shell §2.1 `Masthead`: lockup 20 dp cap height, device time `data`, settings 48 dp `FieldMark` | `home_settings`, `masthead` |
| Field plate | shell §5.7; height 120/160; static on returning, motion on first-run (one loop, not endless if reduced) | `home_field_plate` |
| Permanent line | `ManHuntType.display.l`; short screens `display.s`; chalk; max 2 lines | `home_tagline` |
| Descriptor | `body.small` muted; hidden under 700 dp height | — |
| Host block | no plate: title + field + helper + primary, grouped by spacing and a `ChalkRule`? — **no plate**; the block is defined by the rule above it and the button | `home_host_section` |
| Hunt name field | 52 `PlateTextField` (label above "Hunt name", placeholder none, helper below), `InputRules.roomName`, IME Done → create | `home_room_name` |
| Create button | `BoardButton` primary 56, full width, testTag existing `home_create` | `home_create` |
| Join block | `ChalkRule` + title + `CodePlate` + helper + secondary `Join hunt` | `home_join_section` |
| Code plate | shell §5.3 entry mode; 48 dp cells; paste 48 dp button | `home_join_code`, `home_join_paste` |
| Join button | `BoardButton` secondary 48, disabled until 6 chars | `home_join` |
| Error strips | `ErrorStrip` (states spec) | `home_create_error`, `home_join_error` |
| Footer | `ChalkRule`; "How it works" inline row → Roles; "Playing as {name}" + "Sign out" inline; version `data.small` | `home_roles`, `home_signout` |

Removed: the `BrandMotionBanner` card wrapper (the plate is now unframed), two `ScreenCard`s, the "How it
works" card/icon, the third "How it works" card title, the "Signed in as -" line, the settings icon tile
(now a FieldMark in the Masthead), all all-caps labels.

---

## 4. Copy intent

| Slot | English | Notes / Arabic |
|---|---|---|
| Permanent line | **Hide from your friends.** | approved; AR **اختبئ من أصدقائك.** |
| Descriptor | Real-world GPS hide-and-seek. | reuse/add key; AR pending copy review |
| Host title | Host a hunt | sentence case, existing key "Host a hunt" |
| Host helper | Name it, or leave it as ManHunt. | new; short, true, no hype; AR pending |
| Host CTA | Create the hunt | existing key is "Create hunt"; **rename visible string to "Create the hunt"** for action-object consistency (keep key, change value — copy owner to confirm) |
| Join title | Join a hunt | existing |
| Join helper | Ask the host for the six-character code. | replaces "Got an invite code?" — more concrete, same length class; AR pending |
| Join CTA | Join hunt | existing |
| How it works | How it works → Read the roles | existing keys |
| Playing as | Playing as {username} | replaces "Signed in as {username}" and the `-` placeholder: if session is null, **omit the line** |
| Sign out | Sign out | existing |
| Version | v{name} · free APK · Android 8+ | `data.small`; honest, no store implication |
| Create error | (server message) / "Couldn't create the hunt. Try again." | error strip; state what happened |
| Join error | "That code didn't match a hunt. Check the six characters." | existing key may be "Enter the 6-character invite code"; add the specific one if needed |

No exclamation marks; no "Welcome"; no "The city is your playground"; no fake stats.

---

## 5. States

| State | Design |
|---|---|
| Idle | As above. Host name field empty, code empty. |
| Host busy | Primary loading, field disabled; plate continues (motion is not a progress bar). |
| Host error | `ErrorStrip` directly above the primary; message + "Try again"; `liveRegion = Assertive`. |
| Join busy | Join button loading; code plate read-only; no duplicate taps. |
| Join error | Strip under code plate; code remains; focus first cell. |
| First run (after safety) | Plate animates once on entry; no other difference. |
| Empty session name | Footer omits "Playing as" (never "Signed in as -"). |
| Offline | Host/join failures show the same strips with the network message; no global banner on Home (there is nothing to sync). |
| 320 dp width | Plates scale: line 2 lines, cells 40×44 (still 48 tap target via wrapper? — cells min 44 visual, 48 hit), buttons full width; footer wraps. |
| 2× text | Line wraps 3 lines max then truncates? — no: display half-rate capped prevents >2 lines; host helper hidden; footer stacks. |
| RTL | Masthead mirrors (lockup start = right), settings end; plate canvas mirrored; code LTR; helper text right; buttons full width. |
| Light | Chalk ground, ink line/type, plate art light variant, cyan light primary; Masthead rules `hairline`; lockup dark-on-light asset (use the official `wordmark-dark-on-light`/`mark-dark-on-light` — never recolour). |
| Reduced motion | Static plate; no loop. |

---

## 6. Compose implementation notes

- Keep `HomeViewModel` API (`onRoomName`, `onJoinCode`, `createRoom`, `joinRoom`, `consumeNavigation`); only
  the composable and a few new test tags change. Keep `home_room_name`, `home_create`, `home_join_code`,
  `home_join`, `home_settings`, `home_roles_card` (rename tag allowed? **keep existing tags** for tests;
  add new ones alongside).
- Layout: `Column` (scroll) inside `Box(Modifier.fillMaxWidth().widthIn(max = 560.dp))`; the FieldPlate and
  Masthead are siblings full-bleed outside the horizontal padding. Use `Arrangement.spacedBy(0)` and explicit
  16/24 gaps so rules land on the spacing grid.
- `CodePlate` needs a hidden `BasicTextField` with `KeyboardOptions(capitalization = Characters, keyboardType =
  Text)`, `InputRules.inviteCode`; display cells read the value. Paste from clipboard via
  `LocalClipboardManager` (trim, uppercase, filter) and an optional `Paste` inline action.
- Buttons: `BoardButton`; loading state must not change width/height (reserve space for 3-tick rule).
- The Masthead's local time updates once per minute (not per second) and is locale-formatted
  (`DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT)`); it is decorative but real.
- `BrandMotionBanner`/`BrandRadar`: extract a static `FieldPlate` from the existing canvas; keep the 4 s loop
  only on first-run and only when motion is enabled and the screen is RESUMED. Do not animate the plate on
  scroll.
- Error strips: use the new `ErrorStrip`; keep the server error text from `ApiException` (existing).
- The settings button is an `IconButton` (48) with `FieldMark.settings`, not an icon tile.
- Accessibility: permanent line `heading()`; host/join sections each have a `heading()` title; error strips
  `liveRegion`; version is `data.small`; decorative plate `contentDescription = null`.
- Insets: leave the root `safeDrawingPadding()` in `AppRoot`; Home itself does not add inset padding.

---

## 7. Premium screenshot brief

- **Shot A (primary):** dark, 1080 × 2400, status 21:04. Masthead, plate, line, Host block filled with hunt
  name "Riverside Run", join code cells empty, footer "Playing as Yasmin", v0.15.1. No keyboard, no error.
- **Shot B (join focus):** dark, code cells filled "K7M2QX", Join button enabled (secondary), host name empty.
  A capture of the CodePlate is a good detail/hero crop for the site.
- **Shot C (light):** same screen in light theme — proves the "daylight chalk" translation and the ink
  Masthead.
- **Shot D (Arabic RTL):** plate mirrored, line "اختبئ من أصدقائك.", host/join mirrored, code LTR.
- **Reject:** old 3-card stack, gradient banner, "Signed in as -", `10.0.2.2`, icon tiles, all-caps labels.

---

## 8. A11y / RTL / adaptive checklist

- Target sizes: settings 48, name field 52, create 56, code cells 48, join 48, footer inline 48.
- Contrast: line chalk/field 15.9, helper muted/field 9.1, primary 9.2, error 8.3, version `data.small` muted
  9.1 (≥7 required).
- Focus order: settings → name field → create → paste → code → join → roles → sign out.
- Arabic: no `·` in translated strings; code LTR; clock LTR; plate mirrored; buttons full width; text right.
- Tablet ≥840: two columns — left 45 % plate + line, right 55 % (max 480) host+join; both start-aligned; masthead
  spans full width; bottom of the right column ends with footer. Phone: single column.
- Font scale 2×: create button remains above the fold if possible; if not, scroll is acceptable but the button
  must not clip; code cells grow to 56 height; helper text wraps.
- Landscape phone: two columns as tablet; no fixed heights; plate capped 160 dp.
