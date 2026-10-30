# Security

## Implemented controls

| Area | Control |
|---|---|
| Passwords | scrypt, N=16384/r=8/p=1, 16-byte random salt, 32-byte key, constant-time compare |
| Sessions | 32-byte random opaque tokens, stored as SHA-256, 30-day expiry, server-side revocation |
| Authorization | Every room/match endpoint re-checks membership; admin-only actions verified server-side |
| Teams | Locked while a match is active; server rejects changes |
| Location privacy | Role-based: only `hunters` may read prey positions; history additionally requires `trailsEnabled`. Admin rank grants no location power (regression-tested) |
| Tag integrity | Server decides outcomes; tag claims are stored durably and replayed in room state; prey confirmation/dispute is required; a claim unresolved for 90 s becomes a huntmaster dispute; duplicates for the same prey are rejected (409) and same-hunter retries are idempotent; elimination cannot double-apply |
| Timers/phases | Derived from persisted server timestamps; clients cannot influence them |
| Input validation | zod schemas + domain validation; coordinates, accuracy and timestamps bounded |
| Anti-cheat heuristics | Implied-speed > 55 m/s or accuracy > 500 m flags a report (stored, audited, surfaced; never auto-penalised) |
| Abuse limits | auth 10/min/IP, join 20/min/user, chat 10/10 s, tags 10/min; 256 KB body cap |
| Logging | No coordinates in logs; `/ws` request logging suppressed so the session token in the query string is not written to disk |
| Secrets | None in source; configuration via environment (`PORT`, `HOST`, `DB_PATH`, `SESSION_DAYS`, `PUBLIC_URL`); release signing key only in CI secrets |

## Security review round 1 (2026-10-29)

An independent security review produced [SECURITY_REVIEW.md](SECURITY_REVIEW.md). Confirmed issues
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

1. **No TLS on the public test deployment.** `http://74.208.99.178/` is served over plain HTTP
   behind a reverse proxy, with no domain or certificate. Session tokens, account traffic and GPS
   positions are unencrypted in transit. The Android app uses cleartext HTTP for both debug and
   release builds; do not use the hosted server for real sensitive location data. A TLS terminator
   in front of the server is the next hardening step (see [DEPLOYMENT.md](DEPLOYMENT.md)).
2. **Server listening broadly.** The installed Windows Scheduled Task binds the backend to
   `0.0.0.0:8080`; the reverse proxy only needs `127.0.0.1`. Bind loopback and expose only the
   proxy when hardening.
3. **WebSocket token in the query string.** Request logging for `/ws` is suppressed, but a
   future reverse proxy must redact query strings.
4. **CORS is permissive** (`origin: true`). Bearer tokens limit CSRF exposure; restrict
   before any browser client ships.
5. **Session token in plain SharedPreferences.** `allowBackup` is off; keystore-backed
   storage is the next hardening step.
6. **No account recovery and no verified email.** No email address is collected, so a lost
   password cannot be reset; users create a new account. There is no MFA and no lockout beyond
   rate limiting.
7. **GPS spoofing cannot be prevented** on a compromised device; heuristics only flag.
8. **SQLite single-writer** - correct for one instance, a migration is needed to scale out.
9. **No automated dependency scanning** (a report-only `npm audit --omit=dev` step runs in CI and
   is allowed to fail softly; no Dependabot).

## Secrets handling

- `.env*`, `data/`, `keys/` and logs are gitignored.
- The Android release signing keystore is injected into CI/release jobs from GitHub Actions
  secrets and is never committed. A local copy under `keys/` is gitignored; anyone with it can
  sign updates, so treat it as a production secret and never upload it.
- No credentials are embedded in the APK or the repository.

## Reporting

Do not open a public issue with exploit details. Report the issue privately to the maintainer
(GitHub: [MostafaAshry513](https://github.com/MostafaAshry513)) with steps to reproduce, and allow
time for a fix before disclosure. Controls and known gaps are listed above so reports can skip
what is already known.
