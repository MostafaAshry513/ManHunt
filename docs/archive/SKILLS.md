# Skills

## What was available

The OpenCode catalog for this workspace exposes exactly two skills:

| Skill | Relevance |
|---|---|
| `opencode` | Harness/configuration questions. Used indirectly for build-environment setup. |
| `report` | Issue reporting. Not relevant to game implementation. |

No Android, Kotlin, Compose, GPS, backend, database, testing, security or DevOps skill was
present in the catalog, and no MCP server was configured to supply one.

## What was searched

- The available-skill catalog injected into this session (complete list above).
- OpenCode project-level and user-level skill locations: none beyond the catalog.
- Web research for maintained skill repositories (e.g. the Android `skills` repository
  referenced by AGP release notes). Those repositories are tooling/agent artifacts; the
  relevant Android ones target build-system upgrades, not gameplay implementation, and
  installing unreviewed third-party instruction sets that can request shell execution was
  judged an unnecessary risk for this build.

## Decision

No third-party skill was installed. Per the operating rules, when no suitable skill exists
the project falls back to official documentation and established engineering practice, and
records the search. This is stated plainly rather than claiming a skill was used.

## Practices actually applied

| Area | Source of practice |
|---|---|
| AGP 9 / built-in Kotlin / API 37 | Official Android release notes (see `RESEARCH.md`) |
| Foreground location service | Official FGS service-type documentation |
| OSM tile etiquette | OSM Foundation tile usage policy |
| Password hashing | OWASP Password Storage Cheat Sheet (scrypt parameters) |
| Server-authoritative state | Established multiplayer-server design; enforced by tests |
| Test strategy | node:test (`inject` + live smoke) and Robolectric for JVM UI tests |
