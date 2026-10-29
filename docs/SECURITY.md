# Security

## Implemented controls

| Area | Control |
|---|---|
| Passwords | scrypt, N=16384/r=8/p=1, 16-byte random salt, 32-byte key, constant-time compare |
| Sessions | 32-byte random opaque tokens, stored as SHA-256, 30-day expiry, server-side revocation |
| Authorization | Every room/match endpoint re-checks membership; admin-only actions verified server-side |
| Teams | Locked while a match is active; server rejects changes |
| Location privacy | Role-based: only `hunters` may read prey positions; history additionally requires `trailsEnabled`. Admin rank grants no location power (regression-tested) |
| Tag integrity | Server decides outcomes; hunter claims need prey confirmation; duplicates idempotent for 60 s; elimination cannot double-apply |
| Timers/phases | Derived from persisted server timestamps; clients cannot influence them |
| Input validation | zod schemas + domain validation; coordinates, accuracy and timestamps bounded |
| Anti-cheat heuristics | Implied-speed > 55 m/s or accuracy > 500 m flags a report (stored, audited, surfaced; never auto-penalised) |
| Abuse limits | auth 10/min/IP, join 20/min/user, chat 10/10 s, tags 10/min; 256 KB body cap |
| Logging | No coordinates in logs; `/ws` request logging suppressed so the session token in the query string is not written to disk |
| Secrets | None in source; configuration via environment (`PORT`, `HOST`, `DB_PATH`, `SESSION_DAYS`) |

## Security review round 1 (2026-10-29)

Independent review (DeepSeek V4 Pro) produced `docs/SECURITY_REVIEW.md`. Confirmed issues
were fixed in the same pass, each with a regression test where testable:

| Finding | Fix |
|---|---|
| High: WebSocket `prey_location` filter let an admin who plays prey receive coordinates | Visibility is now one shared predicate, hunters only, used by REST and WS (`canSeePreyLocations`). Test: `security_fixes.test.ts`. |
| Medium: admins could resolve a `pending` tag, bypassing prey confirmation | Only `disputed` tags can be resolved by an admin (`tag_not_disputed`). Test added. |
| Low: room codes used `Math.random()` | `crypto.randomInt()` now generates join codes. |
| Medium: no rate limit on location reports | 20 reports/minute/user. |
| Medium: precise GPS kept forever | `LOCATION_RETENTION_DAYS` (default 30) purges old `location_reports` every 6 h; match summaries are retained. Test covers the purge. |
| Medium: `android:allowBackup="true"` exposed the token to backups | Set to `false`. |

## Residual risks / known gaps

1. **No TLS yet.** The server binds `127.0.0.1`. Public exposure needs a TLS terminator and
   an authorized inbound port; until then the Android debug build uses cleartext HTTP.
2. **WebSocket token in the query string.** Request logging for `/ws` is suppressed, but a
   future reverse proxy must redact query strings.
3. **CORS is permissive** (`origin: true`). Bearer tokens limit CSRF exposure; restrict
   before any browser client ships.
4. **Session token in plain SharedPreferences.** `allowBackup` is off; keystore-backed
   storage is the next hardening step.
5. **No account lockout beyond rate limiting**, no verified emails, no MFA.
6. **GPS spoofing cannot be prevented** on a compromised device; heuristics only flag.
7. **SQLite single-writer** - correct for one instance, a migration is needed to scale out.
8. **No automated dependency scanning yet** (a report-only `npm audit` step exists in CI).

## Secrets handling

- `.env*` and `data/` are gitignored.
- Android signing keys are not present; only debug builds are produced.
- No credentials are embedded in the APK or the repository.

## Reporting

If a vulnerability is found, do not open a public issue with exploit details; record it in
`docs/SECURITY.md` with severity and mitigation status.
