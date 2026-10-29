# Skill matrix

Skill ecosystem as found on 2026-10-29 (OpenCode 2.x, Windows host).

## What the environment supports

- Built-in skills in this session: `opencode`, `report` (only).
- V2 skill discovery: `.opencode/skills/<name>/SKILL.md` (auto), plus `skills` paths/URLs in
  `opencode.json(c)`. No MCP servers configured, no user/project skills existed.
- Installing into `.opencode/skills/` works on disk, but the **running session's skill catalog
  was built at startup**, so `skill("<new-id>")` returns "Unable to load". The files were read
  and applied directly; a future session will auto-discover them.

## Installed skills (source: github.com/android/skills, Apache-2.0)

| Skill | Domain | Why | Status | Applied to |
|---|---|---|---|---|
| `adaptive` | Compose adaptive layouts / window sizes | Small vs large screens, foldables | installed, read | UI layout review; confirms explicit insets are required on our edge-to-edge screens |
| `compose-performance` | Recomposition, lists, stability | Map/chat room screens, polling | installed, read | Reviewed polling / state updates; no unbounded recomposition introduced |
| `testing-setup` | Android test stack selection | Robolectric vs instrumentation vs screenshots | installed, read | Confirmed our JVM/Robolectric choice; flagged missing screenshot tests |
| `android-permissions-security` | Runtime permissions, location | GPS + FGS flow | installed, read | Verified foreground-only request; added settings fallback for permanent denial |

## Third-party design skills (MIT, reviewed)

Sources: `github.com/lottiefiles/motion-design-skill`, `github.com/jakubkrehel/skills`.
Both cloned, scanned for unsafe commands (clean), licenses vendored.

| Skill | Applied values |
|---|---|
| `motion-design` | "Energetic" archetype: 120 ms micro, 180 ms standard, 240 ms spatial; ease-out-expo entrance, ease-in-out exit. Encoded in `ui/theme/Motion.kt` |
| `better-ui` | Consistent radii (12/20/28), 1 dp tonal card borders instead of heavy shadows, 48 dp+ touch targets |
| `better-layout` | 12 dp inside groups, 16–20 dp between groups; content inset 16–20 dp; no edge-to-edge text |
| `better-colors` | One accent ramp (teal), role hues for prey/hunters kept distinct from error; contrast checked on the scheme values we use |
| `better-typography` | Tighter display tracking, 15 sp body, 13 sp metadata, explicit line heights |

License files: `ANDROID_SKILLS_LICENSE.txt`, `MOTION_DESIGN_LICENSE.txt`,
`INTERFACE_SKILLS_LICENSE.txt`.

## Domain coverage

| Area | Guidance used | Status / gap |
|---|---|---|
| Architecture & contracts | `docs/ARCHITECTURE.md`, `DECISIONS.md`; built-in `opencode` for config facts | Covered |
| Compose UI / insets | `adaptive` (read); official Compose insets docs | Covered; `safeDrawingPadding` at root |
| Compose performance | `compose-performance` (read) | Covered; no profiling on device (gap) |
| Runtime permissions | `android-permissions-security` (read) | Covered; background location intentionally not requested |
| Foreground location | Official FGS docs (`docs/RESEARCH.md`) | Covered; device behaviour unverified |
| Maps / OSM policy | OSM tile policy (RESEARCH) | Covered; no skill exists for this |
| Backend / Fastify | Official docs (RESEARCH) | No skill available; docs used |
| Database / SQLite | Official `node:sqlite` docs | No skill available; migrations + tests |
| AuthN/AuthZ | Independent security review (`SECURITY_REVIEW.md`) | Covered by review + tests |
| Real-time / WS | Contract tests + live sim | No skill available; tests used |
| Security review | `SECURITY_REVIEW.md`, `ANDROID_REVIEW.md` | Covered; TLS still pending |
| Testing | `testing-setup` (read) | Covered for JVM; screenshot + device tests missing (gap) |
| CI/CD | Official GitHub Actions docs; CI now green | Covered |
| Windows deployment | `docs/RUNBOOK.md`, deploy scripts | Covered |
| Accessibility | `adaptive` partial; audit delegated | Gap until audit lands |

## Retroactive gap fill (2026-10-29)

Every area previously recorded as "no skill" was searched again. Results:

| Gap | Source found | Skill | Applied evidence |
|---|---|---|---|
| Backend API design | `addyosmani/agent-skills` (MIT) | `api-and-interface-design` | Verified one error shape `{error:{code,message}}`, camelCase fields, plural resources; action endpoints (`/start`, `/pause`) kept as a deliberate, documented exception |
| Application security | `addyosmani/agent-skills` (MIT) | `security-and-hardening` | OWASP-style trust-boundary pass over auth/rooms/locations; supply-chain step `npm audit --omit=dev` → **0 vulnerabilities** |
| Test design | `addyosmani/agent-skills` (MIT) | `test-driven-development` | Invariants defined before adding assertions |
| Property-based testing | `trailofbits/skills` (CC BY-SA 4.0) | `property-based-testing` | `server/test/properties.test.ts`: 5 properties, 2,000 generated cases. Found a bug in the generator harness (time offset redrawn per step) which was fixed |
| Security diff review | `trailofbits/skills` (CC BY-SA 4.0) | `differential-review` | Reviewed recent auth/location/permission commits; no new authorization findings |
| Observability | `addyosmani/agent-skills` (MIT) | `observability-and-instrumentation` | Confirmed structured Fastify logs with reqId, audit events table, `/health`; gap: no metrics endpoint |
| CI/CD | `addyosmani/agent-skills` (MIT) | `ci-cd-and-automation` | CI hardened (concurrency, least-privilege, advisory-only audit) and green in GitHub Actions |

Still no reputable skill found (documented, official docs + tests used instead):

- **SQLite / schema migrations** — no maintained SQLite-specific skill; the available database skills target Postgres/Supabase/Azure SQL.
- **WebSocket / real-time server design** — nothing vendor-neutral and reviewed; covered by contract tests and the 13-check multi-client simulation.
- **Windows Server TLS / reverse proxy** — nothing reputable; blocked anyway because providers only expose 80/443 and 443 is occupied by OpenCode.

Licenses vendored: `ADDYOSMANI_LICENSE.txt` (MIT), `TRAILOFBITS_LICENSE.txt` (CC BY-SA 4.0).

## Current inventory

16 skills installed under `.opencode/skills/`: adaptive, android-permissions-security,
api-and-interface-design, better-colors, better-layout, better-typography, better-ui,
ci-cd-and-automation, compose-performance, differential-review, motion-design,
observability-and-instrumentation, property-based-testing, security-and-hardening,
test-driven-development, testing-setup.

## Not applicable

- Navigation 3 skill: we use a small state-based router for 3 screens; adopting Nav3 now would
  add churn for no user-visible benefit.
- Camera/media/wear/cars/tv/xr skills: out of scope.
- Auth/passkey skills: we use opaque server sessions, no passkeys.

## Rules applied when installing

1. Official Google repository only, Apache-2.0.
2. Read SKILL.md before use; scanned for shell/credential patterns (only benign guidance and
   Google-hosted install URLs were found).
3. No skill may disable Defender, open firewall ports, or handle secrets.
4. Skills supplement official docs; platform facts still come from developer.android.com.
