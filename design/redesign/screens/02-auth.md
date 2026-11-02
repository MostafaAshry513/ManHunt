# 02 — Auth (sign in / create account)

**Route:** `Route.Auth` → `AuthScreen` (`ui/AuthScreen.kt`, `AuthViewModel`).
**Purpose:** get a player into a name with the least ceremony possible, and make the app look like ManHunt
before the first tap. Server setup is plumbing: present, honest, quiet.
**Primary action:** Sign in (or Create account in register mode).

---

## 1. Hierarchy (what the eye should hit, in order)

1. **The permanent line** — `Hide from your friends.` in `display.l` Big Shoulders, chalk, on the drawn
   field plate. This is the only loud thing on the screen.
2. **The form** — two fields and one 56 dp cyan button. Unmissable, directly under the line.
3. **The mode switch** — "New here? Create an account." (inline action, 48 dp).
4. **The field plate** — a drawn borrowed-pitch diagram with the zone/dot/trail; atmosphere, not information.
5. **The server disclosure** — one quiet footer row, expandable. Never a card, never above the form.

Nothing else. No lock icon, no "Welcome back" card, no server card, no gradient hero, no second button.

---

## 2. Layout

### 2.1 Sign in (default, phone 360–430 dp)

```
┌───────────────────────────────────────────────┐   status bar (transparent, chalk icons)
│ 16                                             │
│  ┌─────────────────────────────────────────┐  │
│  │        FIELD PLATE (4:3, drawn)          │  │  ← 200–240 dp tall, full-bleed within margins?
│  │   zone ring · coral dot · violet dots    │  │    Plate is edge-to-edge (no side margin) on phones;
│  └─────────────────────────────────────────┘  │    copy overlays bottom-left inside 16 dp margin
│  Hide from                                     │
│  your friends.                                 │  ← display.l 48/44, chalk, max 2 lines
│  Real-world GPS hide-and-seek.                 │  ← body.small muted, descriptor
│                                                │
│  PLAYER NAME                                   │  ← caption 12 muted above field (not floating label)
│  ┌─────────────────────────────────────────┐  │
│  │                                         │  │  ← 52 dp, plateRaised, 1 dp control border
│  └─────────────────────────────────────────┘  │
│  PASSWORD                                  [◉] │  ← eye FieldMark 48 dp target
│  ┌─────────────────────────────────────────┐  │
│  │                                         │  │
│  └─────────────────────────────────────────┘  │
│                                                │
│  ┌─────────────────────────────────────────┐  │
│  │                 SIGN IN                 │  │  ← 56 dp primary cyan, only cyan surface
│  └─────────────────────────────────────────┘  │
│  New here? Create an account                   │  ← inline action, 48 dp hit, start-aligned
│                                                │
│  ────────────────────────────────────────────  │  ← ChalkRule
│  Game server · 74.208.99.178          Change   │  ← 48 dp row, data 12 + inline action
│  v0.15.1 · free APK · Android 8+               │  ← data.small muted (BuildConfig.VERSION_NAME)
│ 36                                             │
└───────────────────────────────────────────────┘
```

On a 360 × 640 dp screen the form's primary button must be visible without scrolling when the keyboard is
closed; the field plate shrinks to 160 dp (`BoxWithConstraints`), the descriptor may be dropped. On screens
< 700 dp tall the plate becomes 16:9 160 dp, and on landscape the layout is two columns (plate left 42 %,
form right) with the same copy.

### 2.2 Create account (mode toggle — same screen, different copy)

- Form heading is **not** a card title and not "Welcome back": the permanent line stays; the mode is
  communicated by the primary label and the inline switch.
- Primary: `CREATE ACCOUNT` (button labels are sentence case per UI rules — use "Create account"; the
  display face is reserved for the permanent line in this screen).
- Password helper: "At least 8 characters." (existing key "At least 8 characters"); never "encrypted",
  "private", "never leaves your phone" — it goes to the configured server in plain HTTP.
- Inline switch: "I already have an account." (existing key).
- Autofill: `ContentType.NewUsername` / `NewPassword` in register mode (already implemented — keep).

### 2.3 Server disclosure (collapsed by default)

```
────────────────────────────────────────────
Game server · 74.208.99.178 (test)    Change
```
Expanded (inline, no card):
```
SERVER ADDRESS
[ http://server:8080                     ]
[ SAVE SERVER ]  [ CANCEL ]                ← secondary + secondary (Save is primary only when editing)
[ TEST CONNECTION ]                        ← secondary/inline
Server is reachable.                       ← body.small, cyan? No: chalk success, error for failure
```
- Honesty: label the hosted server as a test deployment ("test" in `data`); keep the existing
  "hosted server is a plain-HTTP test deployment" disclosure text in Settings → Account and on the install
  page — on Auth a single muted line is enough: "The hosted server is a test deployment on plain HTTP."
- The server row is **below** the form and the rule; it must never push the primary action down.

---

## 3. Components

| Element | Component / spec | Data |
|---|---|---|
| Field plate | `FieldPlate` (shell §5.7), aspect 4:3 or 16:9 on short screens; static-first; motion only if reduced-motion off | drawn art, no text |
| Permanent line | `ManHuntType.display.l`, chalk | i18n: `Hide from your friends.` (existing key `Hide from your friends.`) |
| Descriptor | `body.small`, muted | `Real-world GPS hide-and-seek.` (existing key `Real-world GPS hide-and-seek` if present; else add) |
| Player name | 52 dp `PlateTextField`, label above in `caption`, `autofillType` username, IME Next, testTag `auth_username` | existing `Username` key |
| Password | same + trailing 48 dp visibility `FieldMark` (eye/eye-off), IME Done, testTag `auth_password` | existing `Password` key; helper `At least 8 characters` |
| Primary | `BoardButton` primary 56, full width, testTag `auth_submit` | `Sign in` / `Create account` |
| Mode switch | inline action, start-aligned, 48 dp hit | `New here? Create an account` / `I already have an account` |
| Rule | `ChalkRule` | — |
| Server row | one 48 dp row: `data` label + address + inline `Change`; testTag `auth_server_row` | existing `Game server`, `Change server`, `Cancel`, `Save server`, `Test connection`, `Server is reachable`, `Server did not respond. Check the address.` |
| Version line | `data.small` muted, non-tappable | `v${BuildConfig.VERSION_NAME} · free APK · Android 8+` — honest, no Play Store implication |
| Error strip | `ErrorStrip` below the form, above the primary; announced | existing server error message or "Username or password is wrong." |

Remove: the `Lock`/`Person` icons, the `ScreenCard` wrapper, the "Welcome back" title, the "Game server"
card, the gradient `HeroBanner`.

---

## 4. Copy intent (exact provisional strings)

| Slot | English | Arabic |
|---|---|---|
| Permanent line | **Hide from your friends.** | **اختبئ من أصدقائك.** (approved rendering, slogan-v2 §6) |
| Descriptor | Real-world GPS hide-and-seek. | لعبة الاختباء والبحث في العالم الحقيقي. (copy-language review required) |
| Field 1 label | Player name | اسم اللاعب (existing key for Username may be `اسم المستخدم`; reuse existing to avoid churn) |
| Field 2 label | Password | كلمة المرور (existing) |
| Primary (sign in) | Sign in | تسجيل الدخول (existing) |
| Primary (register) | Create account | إنشاء حساب (existing) |
| Switch | New here? Create an account. | جديد هنا؟ أنشئ حسابًا. (copy-language review required) |
| Server row | Game server · {address} | خادم اللعبة · {address} (address LTR isolate) |
| Change | Change | تغيير (existing) |
| Version | v{name} · free APK · Android 8+ | same, Latin isolate |
| Errors | The server didn't respond. Check the address and try again. / Username or password is wrong. | existing keys where present; do not machine-invent |

Copy rules: no "Welcome back", no "Sign in to continue", no "Join the hunt" marketing header, no
"Email address", no placeholder email claims, no exclamation. The line is the hook; the form is the action.

---

## 5. States

| State | Design |
|---|---|
| **Idle** | As layout above; primary disabled until the username/password rules pass (existing `canSubmit`), disabled style = 38 % label, 12 % fill; the fields show inline validation only after first submit (`submitted`), never on first keystroke beyond the existing "At least N characters" helper. |
| **Loading (submit)** | Primary keeps its label + 3-tick `LoadingRule`; both fields disabled; mode switch disabled; no full-screen spinner; the field plate keeps animating (it is not a loading indicator). |
| **Auth error** | `ErrorStrip` under the password field: message + "Try again" inline calls submit again; focus returns to the password field; `liveRegion = Assertive`. |
| **Server unreachable** | Same strip with "The server didn't respond. Check the address and try again." + inline "Game server" opens the disclosure; the test-connection action is available there. |
| **Test connection busy/success/failure** | Inline row in the disclosure: 3-tick rule + "Testing connection…"; success "Server is reachable."; failure "Server did not respond. Check the address." in `error`; no alert dialog. |
| **Register mode** | Same states, labels swapped; `submitted` resets on mode toggle (existing behaviour). |
| **Keyboard open** | Scroll to keep the focused field + primary visible above IME; the plate scrolls away first; the primary may remain pinned? — no dock on Auth; rely on `imePadding` + scroll. |
| **Offline** | Not a special screen: submit fails into the server-unreachable strip; the version/server row remains. |
| **RTL** | Mirror the whole layout; field plate canvas mirrored (art only); lockup/wordmark not mirrored; password eye at end; address/code LTR isolates; labels right-aligned. |
| **Light** | Chalk ground, ink text, plate white; field plate stays dark-ish (it is drawn art on `board`? — for light theme, use the light `FieldPlate` variant: chalk ground, ink blocks, cyan zone, coral/violet dots — keep team colours). Primary cyan uses light token `#0C6B84` with white label. |
| **Reduced motion** | Field plate static first frame. |

---

## 6. Compose implementation notes

- Keep `AuthViewModel` exactly as is (`ui` state, `submit`, `testServer`, `saveServer`, `toggleMode`,
  `toggleServer`, `InputRules`). Only the composable changes.
- Structure: `Box(Modifier.fillMaxSize().background(field))` → `Column(verticalScroll)` with
  `padding(horizontal = 16.dp)`; the FieldPlate is a child with `Modifier.fillMaxWidth().height(...)`,
  outside horizontal padding (use negative offset? — simplest: put the plate in a `Box` that is full width and
  apply side padding only to the copy/form; the plate can have 0 horizontal margin and copy overlays with
  16 dp inner padding).
- `BoxWithConstraints` for height: `maxHeight < 700.dp` → plate 160 dp / 16:9 and hide descriptor; else
  4:3/200 dp. Use `LocalConfiguration`? Prefer `BoxWithConstraints`.
- Buttons: `BoardButton` (new); keep `testTag`s `auth_username`, `auth_password`, `auth_submit`,
  `auth_test_server`; add `auth_server_row`, `auth_version`.
- Error: replace `ErrorBanner` with `ErrorStrip` (composable signature can be new) in the form; keep the
  `serverStatus` inline text.
- Focus: `FocusRequester` on username on first composition (not auto-opening the IME); IME Next moves to
  password, Done submits if `canSubmit`. Show/hide password keeps focus.
- Autofill: keep `ContentType` wiring; ensure the password field uses `PasswordVisualTransformation`.
- Do not log credentials; do not prefill the server address in a placeholder (existing comment is right).
- Semantics: permanent line has `heading()`; form labels are associated (`Modifier.semantics` or use
  `label` param); error strip `liveRegion = Assertive`; version `data.small` readable (no click).

---

## 7. Premium screenshot brief (capture team)

- **Shot:** dark theme, signed-out, keyboard closed, sign-in mode; 1080 × 2400; status bar 21:04, dark icons.
- **Content:** field plate visible, permanent line readable, form filled with a believable name ("Yasmin")
  and a password dot row? — a password field with content is fine (no real secret; use "••••••••••"); primary
  enabled; server footer shows the public test server line (or a neutral "Game server" row) — **no
  `10.0.2.2`**, no emulator strings.
- **Crop:** full screen, no device frame baked in; the screenshot should read as the app's first impression.
- **Reject:** any card-wrapped form, any gradient, any lock icon, any "Welcome back".

---

## 8. A11y / RTL / adaptive checklist

- Contrast: line chalk 15.9:1; labels muted 9.1:1; button label on cyan 9.2:1; error 8.3:1.
- Touch targets: fields 52, button 56, inline 48, eye 48.
- Focus order: plate (decorative, skipped) → permanent line (heading) → username → password → visibility →
  sign in → mode switch → server row → change/version.
- 200 % font: form scrolls; button label never clipped (`heightIn(min = 56.dp)`); permanent line wraps to 2
  lines at 48 sp display half-rate (max 1.25×).
- Arabic: password/username autofill content types still work; no bidi mix in server row; address isolated.
- Tablet ≥600: reading column max 560 dp, centred in the screen but **start-aligned text**; plate grows to
  16:9 but capped at 560 dp width; form does not stretch wider than 560.
- Landscape: two columns (plate 40 %, form 60 %), scroll only if the IME is open.
