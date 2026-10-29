# Deployment

## Current state

| Requirement | Status |
|---|---|
| Application runs locally | Yes, `127.0.0.1:8080` |
| Persistent database | SQLite file `server/data/manhunt.db` (WAL) |
| Health endpoint | `GET /health` |
| Public IP | <server-ip> |
| Domain / DNS | none |
| Inbound port for the app | **not open** (no firewall rule; Windows Firewall enabled) |
| TLS certificate | none |
| Reverse proxy | none installed |
| Process supervision | manual / `Start-Process` today |
| GitHub repo + CI | no `gh` auth, no remote |

**Public HTTPS is therefore NOT verified and NOT claimed.**

## Local run

```powershell
cd C:\dev\ManHunt\server
$env:PORT = '8080'
$env:HOST  = '127.0.0.1'
$env:DB_PATH = 'C:\dev\ManHunt\server\data\manhunt.db'
node src/server.ts
```

Health: `curl http://127.0.0.1:8080/health`

## What is needed to go public (blocked on authorization)

1. **Authorization to open one inbound port** (e.g. 443) or to install a tunnel client.
   Changing firewall policy was explicitly out of scope without approval.
2. **A domain or tunnel** - either DNS A record -> <server-ip>, or a Cloudflare Tunnel
   (needs an account and token).
3. **TLS terminator** - recommended: Caddy as a Windows service (automatic ACME), proxying
   `127.0.0.1:8080`. Alternative: win-acme + IIS/nginx.
4. **Process supervision** - NSSM or a Windows Scheduled Task running at boot, with restart
   on failure and log rotation.
5. **Backups** - nightly copy of `manhunt.db` (+ `-wal`) while the server is stopped or via
   `VACUUM INTO`.

## Hardening before exposure

- Bind the Node process to `127.0.0.1` only; expose exclusively through the TLS proxy.
- Restrict CORS to the real client origins.
- Redact query strings in proxy logs (WS token).
- Set `HOST`/`PORT` via environment, never commit them.
- Rotate the database file permissions to the service account.
- Verify `/health` from an external network, then run the smoke test against the public URL.

## Android release

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release build requires a keystore (not present). Never commit it.
- The app must be pointed at the deployed base URL before distribution; the URL is currently
  a build-time constant, so no credentials or hostnames are hard-coded in source.

## Rollback

1. Stop the service.
2. Restore the previous `manhunt.db` backup if a migration changed the schema.
3. Deploy the previous build.
4. Start the service and check `/health`.
