# Contributing

Thanks for helping. The project is a monorepo: `server/` (Node + SQLite) and
`android/` (Kotlin + Compose).

## Before a PR

```powershell
# Backend
cd server
npm ci
npx tsc --noEmit
npm test

# Android
cd ..\android
.\build.ps1
.\test.ps1
.\gradlew.bat :app:lintDebug
```

CI runs the same checks on every push. A PR with failing tests will not be merged.

## Ground rules

- The **server is authoritative**: never let the client decide phases, timers,
  tag validity, readiness or victory.
- Location visibility is role-based: only players on the Hunters team may read
  prey positions, and only during `hunting`. Admins get no extra location power.
- Never commit secrets, keystores, databases or real user locations. Use the
  documentation IP ranges (`203.0.113.0/24`) in examples.
- Keep the Android build working without an emulator: UI tests use Robolectric.
- Add a test for every behaviour change, especially auth, locations and tags.

## Style

- Kotlin: 4 spaces, Compose-first, no new dependency without a reason.
- TypeScript: strict, no `any` unless justified; validate input at the boundary.
- Commit messages: imperative, one logical change.

## Where things live

| Area | Path |
|---|---|
| REST + WS | `server/src/app.ts`, `server/src/rooms.ts` |
| Game rules | `server/src/domain/` |
| Android UI | `android/app/src/main/java/com/manhunt/app/ui/` |
| Android data layer | `android/app/src/main/java/com/manhunt/app/data/` |
| Tests | `server/test/`, `android/app/src/test/` |

By contributing you agree your work is licensed under the MIT License.
