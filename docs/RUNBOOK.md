# ManHunt Runbook

Operational procedures for the ManHunt backend on the Windows Server 2022 host.

> **Current status:** the backend runs as the `ManHuntServer` scheduled task on
> `127.0.0.1:8080` and is publicly reachable as a **plain-HTTP test deployment** at
> <http://74.208.99.178/> through a Caddy reverse proxy on port 80 (no domain, no TLS:
> Caddy runs with `auto_https off`). GitHub CI and tag-driven signed releases are live.
> This is a test service: no availability guarantee, and its data may be reset.

All commands below are Windows PowerShell 5.1 compatible and assume an **elevated**
session (`Run as administrator`) where task registration or removal is involved.

## Paths and assumptions

| Item | Default |
|---|---|
| Repository | `C:\dev\ManHunt` |
| Backend | `C:\dev\ManHunt\server` |
| Entry point | `C:\dev\ManHunt\server\src\server.ts` |
| Database | `C:\dev\ManHunt\server\data\manhunt.db` (WAL mode) |
| Log | `C:\dev\ManHunt\logs\server.out.log` |
| Backups | `C:\dev\ManHunt\backups` |
| Task name | `ManHuntServer` |
| Node | `C:\Program Files\nodejs\node.exe` (24+) |
| Backend listener | `0.0.0.0:8080` as installed (`-ListenHost 0.0.0.0`); `127.0.0.1` is sufficient behind the proxy |
| Public entry point | Caddy on port 80 (HTTP only) -> `127.0.0.1:8080`; config at `C:\ProgramData\caddy\Caddyfile` |

The task runs as `NT AUTHORITY\SYSTEM` and starts at boot. Its launcher
(`run-server.ps1`) restarts Node after a non-zero exit, waiting 10 seconds by default
(`-RestartDelaySeconds`). Task Scheduler restart-on-failure is enabled as a second
layer. The Node path is resolved at install time, so the task does not depend on
`PATH`.

## Install the scheduled task

From an elevated PowerShell:

```powershell
Set-Location C:\dev\ManHunt
.\scripts\deploy\install-service.ps1 `
  -NodePath 'C:\Program Files\nodejs\node.exe' `
  -ServerDir 'C:\dev\ManHunt\server' `
  -Port 8080 `
  -DbPath 'C:\dev\ManHunt\server\data\manhunt.db' `
  -TaskName ManHuntServer `
  -RestartDelaySeconds 10
```

All parameters shown have the same defaults; `.\scripts\deploy\install-service.ps1`
alone is equivalent. Add `-StartNow` to start it immediately. Replacing an existing
task requires `-Force`; the script refuses otherwise. `-WhatIf` prints the intended
action without registering anything.

The install script fails if the session is not elevated, if Node 24+ is not found, or
if `src\server.ts` is missing. It does not create a firewall rule.

## Remove the scheduled task

```powershell
Set-Location C:\dev\ManHunt
.\scripts\deploy\uninstall-service.ps1 -TaskName ManHuntServer
```

This stops the task if running and unregisters it. It does **not** delete the
database, backups, or logs. Running it when the task is absent is a no-op.

## Start, stop, and status

```powershell
Start-ScheduledTask -TaskName ManHuntServer
Stop-ScheduledTask  -TaskName ManHuntServer

Get-ScheduledTask     -TaskName ManHuntServer | Select-Object TaskName, State
Get-ScheduledTaskInfo -TaskName ManHuntServer |
  Format-List LastRunTime, LastTaskResult, NextRunTime, NumberOfMissedRuns
```

Check what is listening:

```powershell
Get-NetTCPConnection -LocalPort 8080 -State Listen |
  Select-Object LocalAddress, LocalPort, OwningProcess
```

`Stop-ScheduledTask` terminates the process tree; it is not a graceful shutdown.
SQLite WAL is crash-safe, but in-flight requests are lost. Start the task again and
verify health before declaring the operation complete.

## Health check

Run the script in a child PowerShell so its `exit` code does not close your current
session:

```powershell
Set-Location C:\dev\ManHunt
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File .\scripts\deploy\healthcheck.ps1 -Port 8080
$LASTEXITCODE
```

Exit codes: `0` healthy (`{"ok":true}`), `1` responded but unhealthy/invalid JSON,
`2` request failed (connection refused, timeout, non-success HTTP status). The HTTP
status and response body are printed.

Equivalent manual check:

```powershell
curl.exe -sS --max-time 10 http://127.0.0.1:8080/health
```

Expected response:

```json
{"ok":true,"now":1793233013194,"service":"manhunt","version":"0.1.0"}
```

The `version` field is a static server constant and does not track the Android app version; the
install page reads the real app version from the published update manifest.

## Logs

```powershell
Get-Content C:\dev\ManHunt\logs\server.out.log -Tail 100
Get-Content C:\dev\ManHunt\logs\server.out.log -Tail 100 -Wait
Select-String -Path C:\dev\ManHunt\logs\server.out.log -Pattern 'error|fatal' -CaseSensitive:$false
```

Each line is prefixed with a UTC timestamp. There is **no automatic rotation** and the
file grows without bound. Rotate only while the task is stopped:

```powershell
Stop-ScheduledTask -TaskName ManHuntServer
Move-Item C:\dev\ManHunt\logs\server.out.log `
  C:\dev\ManHunt\logs\server.out.log.20261029
Start-ScheduledTask -TaskName ManHuntServer
```

## Backup

`VACUUM INTO` produces a consistent single-file snapshot including WAL contents; the
server can keep running. The script refuses to overwrite an existing file, runs
`PRAGMA integrity_check` on the result, and prints the absolute backup path.

```powershell
Set-Location C:\dev\ManHunt
.\scripts\deploy\backup-db.ps1
.\scripts\deploy\backup-db.ps1 -Label preupdate
```

Custom location:

```powershell
.\scripts\deploy\backup-db.ps1 `
  -DbPath 'C:\dev\ManHunt\server\data\manhunt.db' `
  -BackupDir 'D:\ManHuntBackups' `
  -Label nightly
```

Output example:

```text
Backup created: C:\dev\ManHunt\backups\manhunt-20261029-001644-742-preupdate.db (12,288 bytes)
Integrity check: ok
C:\dev\ManHunt\backups\manhunt-20261029-001644-742-preupdate.db
```

The script does not delete old backups. Retention and off-host copies are operator
decisions. A backup that only exists on this host is not a disaster-recovery plan.

## Restore

Restore only while the task is stopped, and keep a safety copy of the current file.

```powershell
$task = 'ManHuntServer'
$db   = 'C:\dev\ManHunt\server\data\manhunt.db'
$backup = 'C:\dev\ManHunt\backups\manhunt-20261029-001644-742-preupdate.db'

Stop-ScheduledTask -TaskName $task
Copy-Item $db "$db.pre-restore-$(Get-Date -Format yyyyMMdd-HHmmss)"
Copy-Item $backup $db -Force
Remove-Item "$db-wal", "$db-shm" -ErrorAction SilentlyContinue
Start-ScheduledTask -TaskName $task

powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File C:\dev\ManHunt\scripts\deploy\healthcheck.ps1 -Port 8080
$LASTEXITCODE
```

The `-wal` and `-shm` files belong to the replaced database and must not be left
behind. If health fails, stop the task and restore the `.pre-restore-*` copy.

## Update

The repository has a GitHub remote and the host is authenticated with the GitHub CLI
(`MostafaAshry513`), and CI is live, so a normal update is: fetch, verify, restart. The Android
APK is not built on this host — GitHub Actions builds and signs it, and
`scripts/ci/pull-latest-apk.ps1` publishes the release to the install page.

```powershell
Set-Location C:\dev\ManHunt
.\scripts\deploy\backup-db.ps1 -Label preupdate

Stop-ScheduledTask -TaskName ManHuntServer

git status --short
git pull --ff-only

Set-Location C:\dev\ManHunt\server
npm ci
npm run typecheck
npm test
Set-Location C:\dev\ManHunt

Start-ScheduledTask -TaskName ManHuntServer
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File C:\dev\ManHunt\scripts\deploy\healthcheck.ps1 -Port 8080
$LASTEXITCODE

# Publish the newest signed release APK + update manifest to the install page
.\scripts\ci\pull-latest-apk.ps1
```

Do not start the task if typecheck or tests fail. CI (`.github/workflows/ci.yml`) runs the same
gates on every push plus the Android build and emulator test; the local commands above are the
fast pre-flight. If the update changes the database schema, take the backup before pulling.

## Rollback

```powershell
Stop-ScheduledTask -TaskName ManHuntServer
Set-Location C:\dev\ManHunt
git log --oneline -10
git switch --detach <previous-commit>
Set-Location C:\dev\ManHunt\server
npm ci
npm test
Set-Location C:\dev\ManHunt
Start-ScheduledTask -TaskName ManHuntServer
```

Return to the main line later with `git switch main` (or `master`). If the bad release
applied a schema migration, also restore the pre-update database backup using the
Restore procedure; an older binary must not be pointed at a newer schema. Verify
`/health` after every rollback.

## Certificate renewal (PLACEHOLDER)

**No TLS terminator is installed and no certificate exists.** Caddy currently proxies plain HTTP
on port 80 with `auto_https off`; there is no domain, so no certificate can be issued yet. This
section is a placeholder for the eventual domain + TLS setup described in
[DEPLOYMENT.md](DEPLOYMENT.md); the commands below are illustrative and have not been executed.

After a TLS proxy is approved and a domain is configured, renewal will depend on the chosen tool.
Replace this placeholder with the verified command for that tool:

```powershell
# Caddy (not installed) - example only
& 'C:\Caddy\caddy.exe' validate --config 'C:\Caddy\Caddyfile'
& 'C:\Caddy\caddy.exe' reload   --config 'C:\Caddy\Caddyfile'

# win-acme (not installed) - example only
& 'C:\win-acme\wacs.exe' --renew --quiet
```

After renewal, verify the certificate expiry and the public endpoint from outside the
host, then run the health check through the proxy. Do not open firewall ports as part
of renewal without explicit authorization.

## Troubleshooting

| Symptom | Check |
|---|---|
| Task will not register | Session elevated? Node 24+? `src\server.ts` present? Task name already exists without `-Force`? |
| Task registered but not listening | `Get-ScheduledTaskInfo` result, log tail, `Get-NetTCPConnection -LocalPort 8080 -State Listen` |
| Health returns exit 2 | Process not running, wrong port, or firewall/proxy in front; check listener and log |
| Health returns exit 1 | Process is up but `/health` failed its DB `SELECT 1` or returned invalid JSON; check log |
| Task exits immediately | Log shows missing `node.exe`, missing entry point, bad `DB_PATH`, or permission denied |
| DB/log permission errors | `icacls C:\dev\ManHunt\server\data` and `icacls C:\dev\ManHunt\logs`; the task runs as SYSTEM and needs modify access. Do not grant broad access. |

`LastTaskResult` values: `0` success, `267009` (`0x41301`) running, `267011`
(`0x41303`) has not run yet. Any other non-zero value is a failure; inspect the log
and Task Scheduler event history.

## Known operational risks

- The task runs as `SYSTEM` because that avoids storing a password. A dedicated
  low-privilege service account is not implemented.
- `Stop-ScheduledTask` is not graceful. SQLite WAL protects integrity, not in-flight
  work.
- Log rotation and backup retention are manual; the log has no size cap.
- Backups are local only unless an operator copies them off-host.
- The launcher retries indefinitely with a fixed delay, so a persistent
  misconfiguration will keep retrying and logging.
- Task Scheduler restart-on-failure is configured, but local testing did not
  observe it restart the task after the child process was force-killed. The
  launcher's internal restart loop is the tested recovery mechanism.
- `/health` only proves the process is alive and SQLite answers `SELECT 1`.
- There is no TLS, domain or certificate: the public site is a plain-HTTP test deployment.
  The backend is installed listening on `0.0.0.0:8080`; binding it to `127.0.0.1` and exposing
  only the reverse proxy is the recommended hardening step.
