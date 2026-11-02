# ManHunt app redesign — audit

**Author:** app-redesigner (independent product/UI design), 2026-11-02.
**Method:** read the shipped Compose source, the Robolectric screenshot tests, the committed screenshots and
the brand/strategy documents; treated the app as a player would. No device/emulator run in this workstream
(light theme and some states are inferred from `Theme.kt`/code and are flagged as such). This is a **visual,
hierarchical and interaction** audit; the earlier technical audits (`docs/UI_AUDIT.md`,
`docs/LOBBY_AUDIT.md`, `docs/ANDROID_REVIEW.md`) are still valid and are referenced where they overlap, not
repeated.

**Inputs:** `docs/screenshots/*.png` (7 committed images; 1233×2673 and 1080×2400 mixed), `ScreenshotTest.kt`
and `GameScreenshotTest.kt` (the source of the repo images), `AuthScreen.kt`, `HomeScreen.kt`, `RoomScreen.kt`,
`ChatPanel.kt`, `RolesScreen.kt`, `SettingsScreen.kt`, `Components.kt`, `Theme.kt`, `MatchMap.kt`,
`BrandMotion.kt`, the identity/strategy package (`design/brand/…`) and the app's own UI/UX docs.
**Output:** this diagnosis, the direction (`direction.md`), the token system (`tokens.md`) and the screen
specs (`screens/`).

---

## 1. Verdict (one paragraph)

The app is **competently built but visually generic**. It has a real identity available (Open Zone, PICKUP,
chalk/asphalt palette, a motion kit), and it applies that identity as **decoration** — one animated hero banner
above the actual task, plus cyan as the accent — while every idea on every screen is delivered through the same
20 dp rounded card with a tinted icon tile, a bold Roboto title and a grey subtitle. The core game data (clock,
zone, team, prey status) is small and duplicated; the core emotional beats (receiving a tag claim, tagging,
the result) are default `AlertDialog`s; the core brand object (the drawn wordmark) appears only inside the
decorative banner. The palette and contrast are good; the typography, iconography, hierarchy, states, icon
tiles and card system are the problem. The redesign's job is not "make it prettier" — it is to **replace the
container system with a matchday board system** and let the game's own data become the visual language.

---

## 2. Screen-by-screen diagnosis

### 2.1 Auth — `01-auth.png`, `AuthScreen.kt`

**What is here:** a 20 dp-radius animated radar banner (MANHUNT wordmark, "Hide from your friends.", Prey/Hunters
legend) → a card with a lock icon and "Welcome back" → two outlined fields → a disabled grey Sign in → "New
here? Create an account" → a second card "Game server" with `http://10.0.2.2:8080`, Change server, Test
connection → large empty bottom.

| Axis | Finding |
|---|---|
| Hierarchy | The banner is the loudest thing, but it is decoration; the task (sign in) is in a card below it; the secondary plumbing (server) gets a full card equal to the form. Three competing blocks, none obviously primary. |
| Density | Airy but wasteful: the banner takes ~15 % of the screen and repeats the brand, while the form has no expression of who ManHunt is at the point of action. |
| Typography | Roboto Black + 16 sp labels; no display voice; "Welcome back" is a generic app phrase with a lock icon; no relationship to the drawn wordmark. |
| Card fatigue | Two cards, one of which (Game server) is developer plumbing given equal weight; the lock is a 34 dp icon without a tile here but the pattern is the same. |
| Colour | Cyan is used for the lock, the links and the test button — the field/referee signal is spent on decoration; the disabled Sign in is low-contrast grey with no reason. |
| States | No visible inline validation in the committed shot; the button is disabled with no explanation; server test has an inline status; errors use the shared red banner. |
| RTL | Mechanically supported (fields/labels mirrored) but the banner art/lockup and the server row are not designed for Arabic; mixed LTR strings in RTL (address) unisolated. |
| One-hand | The primary button sits at ~55 % height; the server card pushes nothing critical, but the banner is dead weight. |
| Accessibility | Visible text is fine contrast-wise; the lock/person icons are decorative; the disabled button is not explained; the server row is a text field inside a tall page. |

**Worst issue:** the first screen spends its strongest visual area on a banner and its second-strongest area on
**server configuration**, while the actual entry action is an anonymous card. It should be: brand line + form,
with server as a footnote.

### 2.2 Safety / Roles — `03-roles.png`, `RolesScreen.kt`

**What is here:** back + "Roles"; a **gradient** hero card with a paw icon, "Roles" and a subtitle; centred
"Classic hunt" + cyan tagline; a card "The two sides" with long Prey/Hunters paragraphs; a card "How a hunt
runs" cut off by the fold; small pager dots; a full-width "Close" button; footer "ManHunt · Hide from your
friends."; large empty areas.

| Axis | Finding |
|---|---|
| Hierarchy | The screen is a marketing page: title hero, centred display, sections, footer. The safety content — the actual reason the screen exists on first run — is buried in prose cards. |
| Density | Long prose at `bodyMedium` in a card; the page is simultaneously airy and dense: no scanning structure, no diagrams, and the card cut by the fold makes the screen look broken. |
| Typography | The only "display" is a centred Roboto headline; "Roles" is set as a page hero but the content is a manual. The footer repeats the brand line. |
| Card fatigue | Two identical `ScreenCard`s with icons (GpsFixed, Checklist) and paragraphs; the pattern continues from the rest of the app. |
| Colour | **The gradient hero violates the approved brand rule ("flat fills only, no gradients", the install page is the only accepted exception).** The paw icon anthropomorphises Prey. Cyan is used as a generic accent. |
| Content | Safety copy is genuinely good and honest (the strongest writing in the app) but visually treated like marketing, not a briefing. |
| States | Pager dots are tiny; there is no indication which modes are playable beyond a faint line; the "Coming soon" card exists in code. |
| RTL | Arabic safety strings exist and are good; layout mirrors, but the gradient hero and the paw are unchanged and the pager/typography are not adapted (Latin display voice is absent anyway). |
| One-hand | "Close"/accept is at the bottom — good; the content requires scrolling. |
| Accessibility | Centred long text is harder to scan; no headings semantics per section; the pager dots are small targets; the layout uses cards for prose. |

**Worst issue:** the trust moment looks like a brochure, and the hero breaks the brand's own flat-fill rule.
It should be a **field-guide plate** with three rules and the full note, plus a pinned accept action.

### 2.3 Home — `02-home.png`, `HomeScreen.kt`

**What is here:** the same radar banner (now with a settings gear floating on it) → "Host a hunt" card with an
icon tile, subtitle, Hunt name field, big cyan Create button → "Join a hunt" card with icon tile, invite field,
disabled grey Join → "How it works" card with info icon, a sentence and a Read the roles button → footer
"Signed in as -" and Sign out.

| Axis | Finding |
|---|---|
| Hierarchy | Three identical cards under the banner; the primary action (Create) is inside card 2 of 3 and only one of two verbs has prominence. The settings gear floats on the banner, detached from the footer identity. |
| Density | The banner (~22 % of the first viewport) + three cards + footer is the whole screen; on a 640 dp phone the Join section falls near/below the fold. |
| Typography | Bold Roboto card titles + 13–15 sp subtitles; **all three cards use the same type recipe**, so "How it works" has the same importance as "Host a hunt". |
| Card fatigue | The archetype: icon tile (cyan 12 %) + title + subtitle + content, repeated three times, with identical radius/border/padding. This is the owner's "generic dark cards" in one image. |
| Colour | Cyan appears on two icon tiles, the section labels, the Join icon, the Create button, the Read-the-roles button and the links — at least six cyan moments; the eye has no "this is the one action" signal. |
| States | Create/Join have inline errors; there is no empty/first-run difference; the "Signed in as -" placeholder is a shipped dev string. |
| One-hand | Create at ~55 % height, Join at ~72 %, How it works at ~82 %; the settings gear is top-right (hard reach). |
| RTL | The banner mirrors the radar but the wordmark stays; Arabic hero art/copy will need explicit handling; the "·"-based strings elsewhere are a bidi risk; no Arabic screenshot exists. |
| Accessibility | Icon tiles are decorative but announced? (icons `contentDescription = null` — fine); buttons full-width; "Signed in as -" is meaningless to a screen reader; no headings for the two actions. |

**Worst issue:** Home does not answer "start or join" as two *different* objects; it shows the same card twice.
It should be a matchday plate: the brand line, a **hosting** object (name + create) and a **code** object, with
one cyan surface.

### 2.4 Lobby / room game page — `04-lobby.png`, `RoomScreen.kt`

**What is here:** a header with back, room name "Cl Room", a code chip `AAZHZX`, a cyan Live dot, share and
history; a Material `TabRow` "Game"/"Chat" with icons and a cyan indicator; "HUNT ROSTER (2)" card with
`alice74354 HUNTMASTER` / `bob74354 Offline`, role pills `PREY`/`HUNTERS`; "CHOOSE YOUR SIDE" card with two
large team cards (paw and crosshair) and a big cyan "Ready to hunt"; "THE HUNT" card with `LOBBY`, an
instruction, an orange blocker line "Before you can start: Waiting for alice74354 to ready up", a disabled
"Begin the hunt" and a "Hunt rules" button.

| Axis | Finding |
|---|---|
| Hierarchy | The same card weight for roster, side choice and phase; the **most important action for the host (Begin) is disabled at the bottom and its reason is a small orange line far above it**; three separate areas repeat hunt state (header Live, phase card, blockers). |
| Density | Three cards of dense content + tabs; the roster is tiny text; the team cards are huge and empty-ish; the screen scrolls while the primary is inside the scroll. |
| Typography | All-caps 11 sp labels with tracking (`HUNT ROSTER (2)`, `CHOOSE YOUR SIDE`, `THE HUNT`, `HUNTMASTER`, role pills) — the exact pattern the brand strategy forbids; the room name is 22 sp Roboto; no display type. |
| Card fatigue | Three more cards, same radius/border; the screen is a card stack, not a room. |
| Colour | Cyan appears on the shared icons, the tabs, the Live dot, the icon tiles, the Ready button and links; coral/violet pills compete; no clear referee/live signal. |
| Data / copy | Test-room name "Cl Room", code `AAZHZX`-style, `alice74354`/`bob74354`, "Waiting for alice74354 to ready up" — shipped screenshots and possibly defaults read as test data. |
| States | Offline/ready/not-ready states are tiny text under names; "Begin" disabled has a reason far from the button; no all-ready or lone-player-coded layout; error banners live in card. |
| One-hand | Ready at ~72 % height; Begin below the fold for the host (the one action they need); tab bar and share/history at the top. |
| RTL | Tabs/code chip mirror via layout direction; the code chip is a Latin string in a tinted box; the `·` separators and "n/n" strings risk bidi; no Arabic lobby capture exists. |
| Accessibility | Icon-only tab labels? (labels exist but icon+text); role pills rely on colour; tiny 11 sp labels; the Live dot is colour-only; the blocker line is orange (team coral) for a non-team state. |

**Worst issue:** the lobby is an information pile, not a team sheet. The host's "Begin" and its reason must be
together at the thumb, and the teams should be the screen's main object.

### 2.5 Active hunt / map — inferred from `RoomScreen.kt` + `MatchMap.kt` + `GameScreenshotTest`

**Not in the committed screenshot set at all** — there is no published hunting-map screenshot; the only map
render is a JVM test output with **no tiles** (`GameScreenshotTest` renders overlays on a blank ground). For a
GPS hide-and-seek game whose hero screen is the live map, this is a presentation failure in itself.

**What the code builds:** full-bleed `MatchMap` with Deep Teal tile filter, own/prey markers, zone, trails;
top-left HUD chips (`HudChip`) for phase/timer/prey count/stale; top/bottom radial `ScreenScrim`s; a bottom
sheet (`HuntSheet`, 26 dp top corners) with status lines, action bar, attribution, expandable details.

| Axis | Finding |
|---|---|
| Hierarchy | The clock is a **small label inside a chip** ("LIVE 6:26" in `labelMedium`), not the primary instrument; the sheet repeats phase/clock/zone; the map is the biggest area but its overlays are quiet; the Tag action is in the sheet, not in a thumb-reachable bar. |
| Density | Chips + scrims + sheet + attribution + expand toggle; the map is busy at the edges and the command surface is at the bottom but small. |
| Typography | No display numerals; `fontFeatureSettings="tnum"` is applied in places (good) but only at 12–14 sp. |
| Colour | Team markers use theme colours (good); HUD chips are pills with tinted backgrounds; cyan is used for chrome and markers alike; stale prey is a text "Stale" rather than a distinct marker treatment (known audit UI-08). |
| States | GPS denied/off, stale reports, tagged self, pending claims are handled functionally but visually as small banners/cards; the result is a dialog (see 2.9). |
| One-hand | Tag in the sheet is reachable; pause/end/rules in expanded sheet are fine; the map controls are top-right? (recenter added by client polish). |
| RTL | Map not mirrored (correct), chrome mirrors; sheet scroll + map gestures conflict risk; no RTL capture. |
| Accessibility | No map semantics (audit UI-03); gesture-only map; chip text 11–12 sp; attribution small. |

**Worst issue:** the game's most dramatic data (the clock, the zone, the chase) is visually subordinate to
chrome. The Board direction fixes exactly this.

### 2.6 Chat — `06-chat.png`, `ChatPanel.kt`

**What is here:** a full-screen list of rounded chat bubbles; system messages as grey pills; sender names in
cyan; own messages as a large cyan bubble with dark text; timestamps under bubbles; a huge empty field; a
rounded composer and a circular send button.

| Axis | Finding |
|---|---|
| Hierarchy | Messages are the only content (fine), but the bubble chrome competes with text; sender/time hierarchy is inconsistent (name above, time below); system lines look like messages. |
| Density | Huge empty space; bubbles are very wide (max width not constrained enough? own bubble spans 65 %); at 891 dp tall the chat has lots of dead air. |
| Typography | Roboto 17 sp body; names 13 sp cyan; timestamps 12 sp grey; no team-coding; no field-log structure. |
| Card fatigue | Bubbles are the generic messenger archetype, unrelated to the brand (no rules, no tags, no chalk). |
| Colour | Cyan for own bubble + sender names + send button; coral/violet unused (chat is outside the team colour system); system pill grey-on-grey. |
| States | Empty state is a centred sentence; error banner exists; load-older added; draft retention fixed. |
| RTL | A Robolectric Arabic chat render exists in `build/` but is **not committed**; the shipped screenshot is LTR only. Bubble alignment mirrors mechanically. |
| One-hand | Composer bottom — good; send button 48-ish. |
| Accessibility | Merged bubble semantics? not guaranteed; times read separately; no headings needed. |

**Worst issue:** it is a generic messenger; the brand disappears. A field log uses the same components as the
rest of the app and reads at a glance during a hunt.

### 2.7 Tag claim / dispute / tag picker — `RoomScreen.kt` dialogs

**What is here:** `AlertDialog`s: "Tag claim" with "…says they physically touched you. Confirm the tag?" /
Confirm / Dispute; "Disputed tag" with Confirm/Reject; "Who did you tag?" with a non-scrollable list of text
buttons; "Leave the room?"; "End the hunt?". The committed `08-hunt-result.png` shows a "Tag confirmed"
banner behind the result dialog.

| Axis | Finding |
|---|---|
| Hierarchy | The most consequential moments in the game are system dialogs with `TextButton`s; the player's answer ("Confirm/Dispute") is a text link, not a decision surface. |
| Density | Test buttons in a column, non-scrollable (audit UI-13); long titles. |
| Typography | Default dialog typography; the claim title "Tag claim" does not state who/what; "physically touched you" is awkward and clinical. |
| Colour | No team semantics in the claim (it concerns the Prey), no consequence styling for destructive resolution. |
| States | Busy/error handling in dialogs is thin; dismissed claims remain as banners (good functional thinking) but the banner is a generic tinted card. |
| RTL | Dialog content mirrors; no test. |
| Accessibility | Dialog insets bypass root padding (audit UI-04); focus handling default; confirm/dispute order ambiguous. |

**Worst issue:** the tag decision — the only physical verb in the game — looks like a settings dialog. It
should be a **match sheet with the consequence as the title**, a persistent strip until answered, and an
explicit consequence in the admin dispute.

### 2.8 Settings — `07-settings.png`, `SettingsScreen.kt`

**What is here:** back + "Settings"; a Material `TabRow` of **five icon-only tabs** (palette, translate,
location, download, person) with cyan selected; Account card "Signed in as -"; Server card with
`http://10.0.2.2:8080` and an explanation of how to change it; Storage card "Cache: 0 B" + "Clear cache" (grey);
"Sign out" outline; large empty bottom.

| Axis | Finding |
|---|---|
| Hierarchy | The tab bar is unlabeled (icons only) and each tab is a card group; Account is first and says "-"; the page is mostly empty; the most important settings (theme/language/text size) are hidden behind unlabeled icons. |
| Density | Three cards with sparse rows; the empty area is huge; the server plumbing is explained twice (Auth + Settings). |
| Typography | Default card titles; signed-in fallback "-"; 12 sp labels; no section rhythm. |
| Card fatigue | Card groups for Account/Server/Storage; no rules/lists. |
| Colour | Cyan icon-only tabs + cyan icons; server plumbing as equal weight; Sign out coral (team colour used for a non-team action? — theme uses error #FF8A8A for "Sign out"? The screenshot shows salmon; this collides with Prey). |
| States | Cache loading/clearing, update states, permission states exist but are inside cards; no inline "checking" rhythm. |
| RTL | Tab icons/rows mirror; language Arabic is here; no RTL capture of Settings. |
| One-hand | Tabs at top, rows at top; sign out near bottom (good); most actions in the top half. |
| Accessibility | Icon-only tabs have no visible labels (contentDescription may exist); `Switch` without label (audit UI-14); small touch targets for chips/tabs? TabRow items are large. |

**Worst issue:** the manual for the app has no readable structure, and it exposes developer plumbing as a
first-class card. It should be a ruled manual page with labeled sections and an honest Update/log section.

### 2.9 Result — `08-hunt-result.png`, `RoomScreen.kt` result Dialog

**What is here:** a `Dialog` with a 24 dp radius surface and **6 dp tonal elevation**, a violet crosshair icon,
"Hunt result", "Hunters win!", "Prey remaining: 0/1", "View hunt history" text and a cyan "Back to lobby",
**opened over the chat with the keyboard up**, a "Tag confirmed" banner behind it, status bar 8:20 while the
chat shot shows 6:26.

| Axis | Finding |
|---|---|
| Hierarchy | The result is a notification-sized card; the winner is 24 sp; the score is a single line; the keyboard covers most of the screen; two actions sit side by side. |
| Density | Cramped inside the card; huge keyboard; background chat. |
| Typography | Roboto headline with an exclamation mark (brand bans exclamation marks); no display moment; "Hunt result" label is redundant. |
| Colour | Violet crosshair for hunters, coral paw for prey, plus cyan button: three colours on the payoff moment; no chalk/scoreboard. |
| States | Cancelled variant, rematch absent; dispute at finish not represented; keyboard not dismissed. |
| RTL | Dialog mirrors; no test. |
| Accessibility | Result announced? Dialog has crosshair decorative; keyboard focus; the winner is not a heading; buttons side by side ambiguous. |

**Worst issue:** the payoff of the game is a dialog, and the screenshot itself shows it over a keyboard. It
should be a **full-screen scoreboard page**.

### 2.10 Startup — `StartupBrand.kt`

A 1.4 s ring/dot/wordmark reveal with survey ticks; good brand work, reduced-motion aware. Problems: 1.4 s on
every cold start, not skippable; it is the only place the brand motion is used; the copy-free composition is
stronger than any screen that follows it. Keep, shorten to ~0.9 s, make skippable, never replay on rotation.

### 2.11 States, empty, loading, error (cross-screen)

- `EmptyState`: 52 dp tinted icon square + centred title + message + action — the same generic pattern.
- `ErrorBanner`: red-tinted rounded card with optional Try again; appears inline in cards; not announced
  (audit UI-15).
- Loading: Material spinners (`ManHuntLoader`, circular progress) and text "Loading" — including a loader that
  replaces the sign-in label, and duplicate "Loading" announcements (audit UI-16).
- History: shows "No hunts in this room yet." for errors (known bug fixed in review pass? the committed code
  may still hide errors — the redesign spec requires error ≠ empty).
- No designed offline state; reconnecting is a small chip/flag.
- No designed permission state beyond buttons launched from the sheet; location denial has a banner but no
  clear "what fails" explanation at the point of need.

This is why a whole `screens/11-states.md` exists: states are half the product.

---

## 3. Cross-cutting failures

### 3.1 Card fatigue and the missing hierarchy system

One component (`ScreenCard`: 20 dp radius, 1 px outline, 18 dp padding, tinted 34 dp icon tile, Bold title,
13 sp subtitle) is used for actions, content, status, settings, prose and dialogs across every screen. Because
everything is a card, nothing is important. There is no secondary/tertiary container language, no rules, no
bands, no plates. The redesign replaces this with **one plate type, rules, a Board and cut-corner tags**
(`direction.md` §4).

### 3.2 The brand is applied, not used

- Wordmark: only inside the animated banner; never a small lockup in a header, never a signature.
- Palette: applied as accents (cyan icons, coral/violet pills) but not as structure (no big clock, no team
  sheets, no field plates).
- Type: system Roboto Black; the brand's athletic grotesque (already in `motion-kit/assets/fonts`) is unused
  in the app.
- Motion: brand radar is beautiful but only decorative; the app's own transitions are Material default.
- Rule breaks: `HeroBanner` uses a linear gradient (forbidden); `Pill` uppercases labels; all-caps tracked
  section labels everywhere; paw/crosshair icons (one infantilising, one a target — the brand explicitly
  rejects crosshair-only imagery).

### 3.3 Type and numbers

- No display face; no tabular setting for the clock in most places; the most important number in the game is
  12–22 sp in a chip.
- All-caps 11 sp tracked labels are hard to read and are a brand-forbidden pattern.
- Fixed font sizes with `fontScale` multiplication only; no display half-rate strategy; 40 sp headline × 2 =
  80 sp can overflow.
- Mixed-size hierarchy is inconsistent across screens ("Roles" 30 sp, "Settings" 22 sp, card titles 17 sp).

### 3.4 Colour discipline

Cyan is used for: icon tiles, section labels, links, tab indicator, role icons, primary buttons, sync dot,
markers, app chrome. It therefore means "generic accent" instead of "field/referee/live". Coral and violet are
used as role pills but also for blocker text (coral/orange), sign-out (salmon), and decorative icons. The one
genuinely good thing is the base palette's contrast (AAA on the field).

### 3.5 States, feedback and error honesty

- Errors are red rounded banners; loading is spinners; empty is centred grey text; the result is a dialog.
- Disabled actions often have no explanation next to them (Auth Sign in, Home Join, Lobby Begin with the
  reason far away).
- No offline/systematic state: connection loss appears as text somewhere; actions fail into banners.
- The result being over the chat keyboard is a small but telling failure of care.

### 3.6 RTL / Arabic

- Functionally present (Localization ~35 KB, RTL layout, Arabic chat test exists) and the safety paragraphs
  are excellent MSA. But no Arabic screen is in the committed screenshot set; several strings join with `·`
  (bidi flip), numerals/mixed Latin tokens are not isolated, and the visual system has no Arabic display
  treatment. The redesign adds explicit RTL rules, isolates, and Arabic type rules (`screens/12`).

### 3.7 One-hand reach

Primary actions sit in the middle of scrolling pages (Home Create ~55 %, Lobby Ready ~72 %, Begin below the
fold) while the top-right holds the settings gear. The one place the thumb is naturally is the hunt sheet —
the map screen is better at reach than the lobby. The redesign puts the primary in a bottom dock everywhere it
matters.

### 3.8 Adaptive / foldable / large screens

- Home caps at 640 dp; Room/lobby has no reading-width cap and no panes; Settings uses a phone `TabRow`.
- Fixed map height (audit UI-12); fixed dialog heights; dialogs don't see insets (audit UI-04).
- Screenshot tests are phone-only (411×891), dark-only, no Arabic; there is no foldable/tablet/large-width
  verification.
- `minSdk 26` + target 37: `adjustResize` missing (audit UI-05), 320 dp header crowding (UI-10).

### 3.9 Motion

- Good: brand motion kit, startup, map motion module; reduced-motion for the brand loop.
- Bad: UI transitions are generic fade+slide; `animateContentSize()` on every card; a per-second phase ticker
  recomposes the card (audit UI-17); no motion vocabulary tied to game events (tag, ready, report); no haptics.
- Missing: a motion language for the Board, the tag snap, the sheet; no reduced-motion path for UI motion.

### 3.10 Accessibility (still open from the audits)

Map has no text alternative; dialogs bypass insets; team colours fail AA in light theme in the old
implementation (theme tokens now darker but UI must verify); fixed-height buttons clip at 200 %; errors not
announced; icon-only settings tabs; `Switch` without label; back exits the app from a room; tiny 11 sp labels.
The redesign specs map each to a fix (`screens/12` §7) but only implementation + verification closes them.

### 3.11 The published screenshots (the owner's explicit complaint)

The committed set (`docs/screenshots/`) is the product's shop window and it is not good enough:

- **Only 7 shots**, missing the live hunting map (the hero screen), Arabic/RTL, light theme, empty/loading/
  error states, dialogs and the settings tabs.
- **Mixed resolution and device chrome**: 1233×2673 (Robolectric) vs 1080×2400 (device); different status-bar
  times (6:26, 8:20), one shot with the keyboard up.
- **Test data leaks**: "Cl Room", `AAZHZX`, `alice74354`, `bob74354`, "Signed in as -", `10.0.2.2:8080`,
  "Waiting for alice74354 to ready up".
- **No story**: shots are screens, not a sequence; no seeded believable game; no map with tiles/markers/trails;
  nothing shows the product as a group activity.
- They were generated by JVM tests (`ScreenshotTest`) that explicitly capture `darkTheme = true` only and
  render the map without tiles, then committed as if they were product shots.

This is why `screenshot-shotlist.md` is a first-class deliverable: the redesign is only credible when the
captures show a real, seeded, live game.

---

## 4. Ranked worst problems (with the fix's home)

| # | Severity | Problem | Why it hurts | Fix in |
|---|---|---|---|---|
| 1 | **Critical** | Every idea is the same 20 dp card with a tinted icon tile; no hierarchy system | Nothing reads as more important; this is the "generic dark cards" verdict | direction §4–5, tokens §5, screens/01 |
| 2 | **Critical** | Brand is decoration (radar banner), not structure; wordmark only in the banner; no display type | The app looks like it belongs to no one; brand assets exist but are unused at the moments that matter | direction §4.1–4.2, tokens §2 |
| 3 | **Critical** | The clock/zone/teams/prey status are tiny and duplicated; the game's data is not glanceable | A hunt HUD exists to answer "how long, where, who" in 1 s; it currently doesn't | screens/01 §2, 06 |
| 4 | **High** | Lobby information architecture: roster/side/phase as equal cards, host Begin buried, blocker far from the action | The host can't see how to start; players can't see teams/readiness | screens/05 |
| 5 | **High** | Result/tag claim/dispute are default dialogs (one over the keyboard) | The emotional beats of the game are notifications; screenshots expose it | screens/08, 10 |
| 6 | **High** | Published screenshots are stale/incomplete/test-data-laden; no map/Arabic/light/state set | The owner judges the app by these; they undersell it and leak dev names | screenshot-shotlist, task-49 |
| 7 | **High** | Typography is system Roboto Black + all-caps 11 sp tracked labels; brand-forbidden patterns | Template tell; hard to read; no athletic/street character | tokens §2, direction §5 |
| 8 | **High** | Colour discipline: cyan everywhere; team colours used for non-team states; gradient hero | The field/referee/team semantics stop meaning anything; brand rule broken | tokens §3, direction §4.5 |
| 9 | **High** | Iconography: generic Material icons, tinted icon tiles, paw and crosshair | Off-brand and (paw/crosshair) wrong metaphor for a chase | direction §4.4, tokens §6 |
| 10 | **Medium** | States are generic (empty sentence, spinner, red card); disabled actions unexplained; no offline design | Users don't know what to do next; errors are not actionable | screens/11 |
| 11 | **Medium** | One-hand reach: primaries mid-page, settings gear top-right, host Begin below fold | Field use is one-handed, often moving; reach matters | screens/01 §4, 04, 05 |
| 12 | **Medium** | RTL is mechanical, not designed; no Arabic capture; bidi separators/isolates unhandled; display type absent | Arabic is a first-class language for this app; half the product is unaudited | screens/12 §1 |
| 13 | **Medium** | Adaptive/fold/tablet ignored; fixed map heights; phone-only tests | Large screens and foldables look stretched/broken; audit UI-12 etc. | screens/12 §3 |
| 14 | **Medium** | Motion: generic transitions; `animateContentSize` on cards; per-second whole-card tick; no event motion | Feels like a form app, not a live game; causes jank | motion.md |
| 15 | **Low–Medium** | Copy/terminology inconsistency and dev strings in shipped data ("Game"/"Hunt"/"Room"; "Cl Room"; "-"; "Welcome back"; "Prey remaining: 0/1") | Erodes trust and brand voice | screens/02–11 copy tables |
| 16 | **Low–Medium** | Accessibility gaps already documented (map semantics, dialog insets, back exits, labels) | Excludes users and fails the bar the project claims | screens/12 §7 |

---

## 5. What is already good (keep)

- **Palette and contrast**: the field/chalk/cyan/coral/violet system is distinctive and AAA on the field.
- **Identity assets**: the Open Zone mark and drawn wordmark are strong, original and already shipped.
- **Brand motion kit**: the 4 s radar, report pings, trail and tag snap are the right motion language, already
  implemented in-app (`BrandMotion`, `BrandMapMotion`, `StartupBrand`) and in social assets.
- **Safety/trust content**: the safety copy is honest, specific and well-written; it must survive the redesign
  verbatim (only its layout changes).
- **Localisation foundation**: full Arabic dictionary, RTL layout and tests exist; the redesign builds on them
  rather than replacing them.
- **Functional groundwork**: insets at the root, predictive back, test tags, draft preservation, stable chat
  keys, tag-claim durability and the map palette show the team already cares about the right details.
- **The map itself** (Deep Teal filter, zone/trail/report overlays) is a genuine asset; it needs hierarchy,
  not a new map.

---

## 6. Limitations of this audit

- No device/emulator run in this workstream: the live-hunt chrome was audited from source and the JVM map test,
  not from a current device capture; light theme and several states are inferred from `Theme.kt`/code.
- The committed screenshots may be stale relative to `master` (they are generated by tests and committed
  manually); findings are labelled with the code path where they came from.
- This is a design audit, not a security/perf audit; the earlier reviews remain authoritative for those axes.
- Arabic findings are structural (layout/bidi/format), not a native-speaker copy review; the copy audit remains
  with the copy-language workstream.

---

## 7. Audit → redesign traceability

Every ranked problem has a named fix in the direction and a screen spec that implements it. The five
highest-leverage moves (detailed in `direction.md`):

1. Replace the card system with **one plate + rules + the Board** and a strict hierarchy per screen.
2. Make **display type and tabular numerals** the visual voice (Big Shoulders / Instrument Sans / Red Hat Mono).
3. Turn the game's data into the signature: **Board clock + team sheets + team tags + code plate**.
4. Turn the emotional beats into **match sheets and a full-screen scoreboard**, with persistent decision
   strips.
5. Replace generic icons/motion/state chrome with the **FieldMark set, event motion and the state vocabulary** —
   and recapture the product with a real, seeded, live game (`screenshot-shotlist.md`).

**Acceptance for the redesign pass:** the squint/thumbnail tests in `direction.md` §7 pass on the new build,
the screen set in `screens/` is implemented with the tokens, the state matrix is reachable, and the premium
screenshot set from `screenshot-shotlist.md` looks like one product — a field sport played with phones, not a
settings app.
