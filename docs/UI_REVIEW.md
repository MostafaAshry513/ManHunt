# ManHunt UI/UX review — v0.12.0

Screens are captured by `ScreenshotTest` (Robolectric, real Compose tree) and the
`InGameSmokeTest` emulator run (lobby/hunting/chat/result). The 0.12.0 pass reviewed
every screen plus the primary actions' enabled/disabled/loading states.

## Rubric

Each screen was scored 1–10 on: hierarchy and scanability, spacing/layout, design-system
consistency, contrast/accessibility, state feedback (empty/loading/disabled), and
interaction clarity.

| Screen | Before | After | What changed |
|---|---:|---:|---|
| Sign in | 7.5 | 8.5 | CTA disabled until username + 8-char password; live password hint; keyboard Done submits |
| Create account | 7.5 | 8.5 | same form fixes; disabled CTA makes the requirement visible |
| Home | 6.5 | 8.5 | brand tagline; “How it works” card linking to Roles; join CTA disabled until a 6-char code; Done joins |
| Roles — Classic | 8.0 | 8.5 | centered mode title/tagline |
| Roles — Single Prey | 6.5 | 7.5 | “Play Classic instead” escape hatch instead of a dead end |
| Roles — Shrinking Zone | 6.5 | 7.5 | same |
| Settings — Appearance | 8.0 | 8.5 | whole app scales live while dragging; preview is real themed text (the old preview double-scaled after the value was persisted) |
| Settings — Language | 8.0 | 8.0 | no changes needed |
| Settings — Permissions | 7.5 | 7.5 | clear allow actions and why they are needed; no change |
| Settings — Updates | 7.5 | 7.5 | split check/download busy states already present |
| Settings — Account | 7.0 | 8.0 | removed duplicate “Server” label above the URL |
| Room — Lobby | 8.0 | 8.0 | no change (blockers + disabled start already explain themselves) |
| Room — Hunting | 7.5 | 7.5 | no change (map cards/HUD reviewed; CI map is tile-less) |
| Room — Chat | 8.0 | 8.5 | IME Send now sends; send button shows a progress spinner while sending |
| Result dialog | 8.0 | 8.0 | hierarchy/actions reviewed; no change |

## Action-state audit (clickable / disabled / loading)

| Control | Contract | Result |
|---|---|---|
| Sign in / Create account | disabled while loading, or username blank, or password < 8 | fixed + covered by `ButtonStateTest` |
| Password reveal | disabled while a request is loading | fixed |
| Home — Create hunt | enabled unless busy; blank name intentionally defaults to “ManHunt” | verified |
| Home — Join hunt | disabled unless busy=false and code length is 6 | fixed + covered by `ButtonStateTest` |
| Home — Roles / Settings icons | always enabled, 48 dp targets | verified |
| Roles — Let's play / Close | enabled; permission request happens only on first run | verified |
| Roles — mode dots / Play Classic | always enabled; 36 dp dot targets | verified |
| Chat — Send | disabled while blank or sending; spinner while sending | fixed + covered by `ButtonStateTest` |
| Settings — tabs, theme/language chips | always enabled | verified |
| Settings — Check for updates / Download / Install | split `checking`/`downloading` states (fixed in 0.10) | verified |
| Settings — Sign out | always enabled, error color | verified |
| Room — Ready | disabled while a request is in flight | verified |
| Room — Begin the hunt | disabled until admin + everyone ready; blocker text alongside | verified |
| Room — Pause/Resume/End | huntmaster + phase gated; End has confirmation | verified |
| Room — Tag / confirm / dispute | only when hunting and claim pending; busy disables repeats | verified |
| Room — zone “Use my location” | disabled until a GPS fix exists | verified |
| Result / history / share / copy | enabled when the data is present | verified |

## Known gaps

- Dialogs (tag claim, zone picker, room settings, history) are covered by code review,
  not by a committed screenshot; the emulator tour covers lobby → hunting → chat → result.
- Tablet/foldable layouts are bounded at 640 dp but not visually tested on a tablet image.
- `design-mobile-apps` (Sleek) was not used: it requires a Sleek API key/paid plan.
