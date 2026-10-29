<#
.SYNOPSIS
    Launcher used by the ManHunt scheduled task.

.DESCRIPTION
    Sets the backend environment variables, appends stdout/stderr to
    logs\server.out.log, and runs `node src/server.ts` in the foreground.
    If Node exits with a non-zero code, the launcher logs the failure, waits
    RestartDelaySeconds, and starts it again. A clean exit (code 0) ends the
    launcher. Task Scheduler's restart-on-failure setting remains enabled as a
    second layer in case the launcher itself fails.

    This file is normally invoked by the ManHuntServer scheduled task created
    by install-service.ps1. It is safe to run manually for diagnostics.

.PARAMETER NodePath
    Full path to node.exe.

.PARAMETER ServerDir
    Full path to the server directory (the one containing src\server.ts).

.PARAMETER Port
    TCP port for the HTTP listener.

.PARAMETER DbPath
    Full path to the SQLite database file.

.PARAMETER ListenHost
    Interface to bind. Defaults to 127.0.0.1 (local only).

.PARAMETER SessionDays
    Session lifetime in days passed to the server as SESSION_DAYS.

.PARAMETER RestartDelaySeconds
    Seconds to wait before restarting Node after a non-zero exit. Defaults to 10.

.EXAMPLE
    .\run-server.ps1 -NodePath 'C:\Program Files\nodejs\node.exe' `
        -ServerDir 'C:\dev\ManHunt\server' -Port 8080 `
        -DbPath 'C:\dev\ManHunt\server\data\manhunt.db'

.NOTES
    Does not open firewall ports or change machine-wide settings.
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$NodePath,

    [Parameter(Mandatory = $true)]
    [string]$ServerDir,

    [Parameter(Mandatory = $true)]
    [ValidateRange(1, 65535)]
    [int]$Port,

    [Parameter(Mandatory = $true)]
    [string]$DbPath,

    [string]$ListenHost = '127.0.0.1',

    [ValidateRange(1, 3650)]
    [int]$SessionDays = 30,

    [ValidateRange(1, 3600)]
    [int]$RestartDelaySeconds = 10
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$logDir = Join-Path $repoRoot 'logs'
$logPath = Join-Path $logDir 'server.out.log'
$entryPoint = Join-Path $ServerDir 'src\server.ts'

if (-not (Test-Path -LiteralPath $NodePath -PathType Leaf)) {
    throw "Node executable not found: $NodePath"
}
if (-not (Test-Path -LiteralPath $entryPoint -PathType Leaf)) {
    throw "Server entry point not found: $entryPoint"
}

New-Item -ItemType Directory -Path $logDir -Force | Out-Null

$env:PORT = [string]$Port
$env:HOST = $ListenHost
$env:DB_PATH = $DbPath
$env:SESSION_DAYS = [string]$SessionDays
$env:NODE_ENV = 'production'

function Write-ServerLog {
    param([string]$Text)
    $stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    Add-Content -LiteralPath $logPath -Value ("[{0}] {1}" -f $stamp, $Text) -Encoding UTF8
}

$exitCode = 0
while ($true) {
    Write-ServerLog ("starting: {0} {1} (host={2} port={3} db={4})" -f $NodePath, $entryPoint, $ListenHost, $Port, $DbPath)

    $exitCode = 1
    Push-Location -LiteralPath $ServerDir
    try {
        & $NodePath $entryPoint 2>&1 | ForEach-Object {
            if ($_ -is [System.Management.Automation.ErrorRecord]) {
                Write-ServerLog ('stderr: ' + $_.ToString())
            }
            else {
                Write-ServerLog ([string]$_)
            }
        }
        if ($null -ne $LASTEXITCODE) {
            $exitCode = $LASTEXITCODE
        }
    }
    catch {
        Write-ServerLog ('fatal: ' + $_.Exception.Message)
        $exitCode = 1
    }
    finally {
        Pop-Location
    }

    Write-ServerLog ("exited with code {0}" -f $exitCode)
    if ($exitCode -eq 0) {
        break
    }

    Write-ServerLog ("restarting in {0} seconds" -f $RestartDelaySeconds)
    Start-Sleep -Seconds $RestartDelaySeconds
}

exit $exitCode
