# Team tasks

Statuses: planned / running / review / integrated / done / blocked.

| ID | Task | Owner | Model | Status | Verification |
|---|---|---|---|---|---|
| T1 | Security + threat review | Agent A | V4 Pro | done | 11 findings; 6 fixed with tests |
| T2 | History API, pause/resume, spectator | Agent B | V4 Flash | done | 9 new tests; suite 43 -> 45 after lead fixes |
| T3 | CI hardening + deploy scripts + runbook | Agent C | V4 Flash | done | 5/5 scripts parse; health 0/2; backup integrity ok |
| T4 | Android match settings UI | Lead | V4 Flash | done | builds, tests green |
| T5 | Android spectator/results/history | Lead | V4 Flash | done | builds, tests green |
| T6 | Multi-client gameplay simulation | Lead | V4 Flash | done | 13/13 checks |
| T7 | Public HTTPS deployment | Lead | - | blocked | needs inbound port + domain authorization |
| T8 | Android client adversarial review | Agent D | V4 Pro | done | 3 High found -> fixed (A1-A3) |
| T9 | Load/performance measurement | Agent E | V4 Flash | done | `docs/PERF.md`, real numbers |
| T10 | README + API reference | Agent F | V4 Flash | done | cross-checked against routes |
| T11 | Rematch + GPS flag regressions | Lead | V4 Flash | done | `test/rematch.test.ts` |

## Verified totals (2026-10-29)

- Backend: 45 tests, typecheck clean.
- Live: smoke 11 checks, match sim 13 checks.
- Android: build OK, 21 JVM tests, lint 0 errors.
- APK: `android/app/build/outputs/apk/debug/app-debug.apk`.
- CI: committed; never executed (no GitHub auth on this host).
