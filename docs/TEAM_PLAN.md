# Team plan

## Objective

Ship a playable, tested ManHunt: server-authoritative backend + Android client.

## Current phase

Phase 5-6: GPS/map integration, tagging UX, history, spectator rules, hardening.

## Ownership (avoid concurrent edits)

| Area | Owner | Files |
|---|---|---|
| Android client | Lead | `android/**` |
| Backend | Agent B | `server/**` |
| Security review | Agent A (V4 Pro) | `docs/SECURITY_REVIEW.md` only |
| CI / deploy scripts | Agent C | `.github/**`, `scripts/deploy/**`, `docs/RUNBOOK.md` |

No agent may edit another area. Shared contracts live in `docs/ARCHITECTURE.md`.

## Contracts (frozen unless lead updates)

- REST paths and error shape: `docs/ARCHITECTURE.md` section "REST API".
- WS events: `hello`, `room`, `chat`, `prey_location`, `tag_request`, `tag_disputed`, `pong`.
- Match phases: `lobby | head_start | hunting | paused | finished | cancelled`.
- Location rules: hunters read prey only during `hunting`; trails require `trailsEnabled`;
  admins get no extra location power while playing prey.
- Tag rules: hunter claim -> prey confirm/dispute -> admin resolve; server decides.

## Integration strategy

1. Agents work in disjoint directories.
2. Lead reviews every diff before commit.
3. `npm test` + `npx tsc --noEmit` for backend; `gradlew assembleDebug testDebugUnitTest`
   for Android.
4. Never commit with a red suite; document anything unverified.

## Risks

- No device/emulator: GPS, FGS, map rendering remain unverified.
- Shared working tree: mitigated by ownership above.
- Kotlin library versions must match AGP's bundled Kotlin 2.2.10.
