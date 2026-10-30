# Deployment

How ManHunt is deployed today, what the public test deployment does and does not provide, and
what is still missing before it could be called production.

## Current public deployment (test only)

| Item | Status |
|---|---|
| Install page | <http://74.208.99.178/> — plain HTTP on port 80 |
| Update channel | `GET /api/app/latest` (version, size, SHA-256, download URL) |
| Backend | Fastify on `127.0.0.1:8080`, reverse-proxied by Caddy on port 80 |
| TLS certificate / domain | **none** (Caddy runs with `auto_https off`; the site is HTTP-only) |
| Process supervision | Windows Scheduled Task `ManHuntServer` (runs as `SYSTEM`, restarts on exit) |
| Database | SQLite file `server/data/manhunt.db` (WAL mode, single writer) |
| Backups | `scripts/deploy/backup-db.ps1` (`VACUUM INTO`), run manually/nightly |
| APK publishing | `scripts/ci/pull-latest-apk.ps1` downloads the newest signed GitHub Release APK, verifies its SHA-256, serves it as `/app.apk` and writes `server/data/app-latest.json` |
| CI / releases | GitHub Actions: CI on every push; signed release APK + `.sha256` on every `v*` tag |

This is a **test deployment**: plain HTTP, a bare IP, one small VM and no availability or data
guarantee. Session tokens and GPS positions travel unencrypted. Do not use it for real sensitive
location data, and expect the database to be reset if needed.

`PUBLIC_URL` can be set to the public base URL (e.g. `http://74.208.99.178`); the install page
falls back to the request's `Host` header when it is unset.

## Self-hosting (recommended for real use)

Requirements: Node.js 24+, one writable directory for the SQLite file. No database server, Docker
or reverse proxy is required for a small game on a trusted network.

```bash
git clone https://github.com/MostafaAshry513/ManHunt.git
cd ManHunt/server
npm ci
HOST=0.0.0.0 PORT=8080 node src/server.ts   # PowerShell: $env:HOST='0.0.0.0'; npm start
```

- Health: `GET http://<host>:8080/health`
- App: sign in screen → **Server** → enter `http://<host>:8080` → **Save server** (changing the
  server signs the user out).
- SQLite files (`manhunt.db`, `-wal`, `-shm`) are created next to `server/data/` by default; back
  them up together.
- For an internet-facing instance, put a TLS reverse proxy (Caddy, nginx, etc.) in front, bind
  Fastify to `127.0.0.1` and only expose the proxy.

## What production would still need

1. **Domain and TLS.** A DNS name and a certificate in front of the server. The Android app and
   the update channel must then use `https://`.
2. **TLS-only proxying.** Bind the backend to `127.0.0.1` and expose only the proxy; redact query
   strings in proxy logs because the WebSocket session token travels in the query string.
3. **Restricted CORS.** `@fastify/cors` currently accepts any origin (`origin: true`). Restrict it
   before a browser client exists.
4. **Off-host backups and retention.** `backup-db.ps1` writes locally; copy backups off the host
   and decide a retention policy.
5. **Process supervision that is verified.** The Windows Scheduled Task works on the current host;
   on Linux use a systemd unit (or similar) with restart-on-failure and log rotation.
6. **Monitoring.** `/health` only proves the process is alive and SQLite answers `SELECT 1`.

## Android release

- Release APKs are built and signed by `.github/workflows/release.yml` on every `v*` tag. The
  keystore is injected from GitHub Actions secrets; it is never committed and must not be.
- Each release ships `manhunt-<tag>.apk` and `manhunt-<tag>.apk.sha256`.
- The in-app updater verifies the SHA-256 from the server's `/api/app/latest` manifest before
  installing; the release build defaults to `http://74.208.99.178`.
- To publish a new release to the install page, tag the commit and run
  `scripts/ci/pull-latest-apk.ps1` on the host, then restart the service if the manifest directory
  moved.

## Rollback

1. Repoint the install page/update channel at the previous release APK (`pull-latest-apk.ps1 -Tag <previous>`).
2. Stop the scheduled task, restore the pre-update database backup if the schema changed, start
   the task again.
3. Re-run `scripts/deploy/healthcheck.ps1` and check `GET /health`.
4. Never point an older server build at a newer database schema without a backup.

See [RUNBOOK.md](RUNBOOK.md) for exact service, log, backup and restore commands.
