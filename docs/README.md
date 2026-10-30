# ManHunt documentation

Start here. This index says what each document is, who it is for, and whether it reflects the
current code. The root [README](../README.md) covers what the game is and how to install it.

**Status legend:** **Current** = matches the current build; **Snapshot** = accurate when captured,
kept for the environment history it records; **Historical** = an internal review/audit from an
earlier version, findings partly fixed, kept for traceability; **Archived** = AI-agent process
records with no ongoing value for the product.

## By audience

| I want to… | Read |
|---|---|
| Understand how the game and code fit together | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Call the API / build a client | [API.md](API.md) |
| Know why things are built this way | [DECISIONS.md](DECISIONS.md) |
| Self-host or deploy the server | [DEPLOYMENT.md](DEPLOYMENT.md), [RUNBOOK.md](RUNBOOK.md) |
| Know what is secure and what is not | [SECURITY.md](SECURITY.md) |
| Run the test suites myself | [TESTING.md](TESTING.md) |
| Change themes, language or the server address | [CUSTOMIZATION.md](CUSTOMIZATION.md) |
| See performance numbers | [PERF.md](PERF.md) |

## Start here

| Document | What it covers | Status |
|---|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Components, match state machine, data model, REST/WS contracts, security boundaries | Current |
| [API.md](API.md) | Full REST API and WebSocket reference, room settings, phases, error codes | Current (v0.9.0: `pendingTags` durable tag claims) |
| [DECISIONS.md](DECISIONS.md) | Architecture decision records: Node/Fastify, SQLite, opaque tokens, tagging, maps, zones | Current |
| [RESEARCH.md](RESEARCH.md) | Sources and conclusions behind platform choices (foreground services, OSM tile policy, scrypt) | Current reference |
| [CUSTOMIZATION.md](CUSTOMIZATION.md) | Theme, language, server address, room settings, forking the app | Current |

## Operations and security

| Document | What it covers | Status |
|---|---|---|
| [DEPLOYMENT.md](DEPLOYMENT.md) | Current public test deployment (plain HTTP), how to self-host, what TLS/production still needs | Current |
| [RUNBOOK.md](RUNBOOK.md) | Windows scheduled-task service, logs, health checks, backup/restore, update and rollback | Current |
| [ENVIRONMENT.md](ENVIRONMENT.md) | Snapshot of the build/hosting machine: toolchain versions, host-specific fixes, CI/emulator differences | Snapshot (2026-10-28 capture) |
| [SECURITY.md](SECURITY.md) | Implemented controls, residual risks, known gaps, secrets handling, how to report | Current |

## Quality and testing

| Document | What it covers | Status |
|---|---|---|
| [TESTING.md](TESTING.md) | Every test command (backend, Android JVM, live smoke, CI emulator) and what is not covered | Current |
| [PERF.md](PERF.md) | Load-test numbers with explicit localhost caveats and reproducible commands | Current (numbers captured 2026-10-29) |
| [DEVICE_TESTING.md](DEVICE_TESTING.md) | Long guide for testing on a real phone over adb (rooted device setup, screenshots, log capture) | Historical guide, still usable |

## Internal audits (historical)

These are internal review reports from earlier versions. They are kept because the reasoning and
method are useful, but specific findings and file:line references may be out of date — check the
current code before acting on them.

| Document | What it covers | Status |
|---|---|---|
| [UI_AUDIT.md](UI_AUDIT.md) | Accessibility, adaptive layout and edge-to-edge audit of the Android UI | Historical |
| [LOBBY_AUDIT.md](LOBBY_AUDIT.md) | Lobby state/layout/error/accessibility audit | Historical |
| [ANDROID_REVIEW.md](ANDROID_REVIEW.md) | Adversarial review of the Android client | Historical |
| [SECURITY_REVIEW.md](SECURITY_REVIEW.md) | Security and privacy review with threat scenarios and fixes | Historical |

## Archive

AI-agent process records (team plans, task boards, skill catalogues, autonomous progress logs,
the old implementation plan). They describe how an earlier phase was run, not how ManHunt works
today. Kept in [`archive/`](archive/README.md) for traceability, not linked as product docs:

AUTONOMOUS_PROGRESS · IMPLEMENTATION_PLAN · TEAM_PLAN · TEAM_TASKS · TEAM_DECISIONS · SKILLS · SKILL_MATRIX

## Maintaining these docs

- Add or move a document: update this index in the same change.
- Prefer "Current" docs that match the code; if a document is a snapshot or a one-off audit, mark
  it here rather than leaving it to look authoritative.
- Screenshots live in [`screenshots/`](screenshots) and are regenerated from the current build;
  see the root README.
