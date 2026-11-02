<#
  Windows PowerShell 5.1 compatible (the Windows host ships 5.1; no pwsh 7 required).

.SYNOPSIS
  Local dry-run of the premium-screenshot game seed against an isolated dev server.

.DESCRIPTION
  Starts the real ManHunt Node server on a non-production port with a throwaway SQLite DB,
  then runs the same game-control commands the GitHub Actions capture uses, in shotlist
  order:

      seed -> verify lobby -> waiting lobby -> start-hunt -> force-hunting -> sync-clock
           -> report-trails -> verify hunting -> tag out Leila -> claim on Yasmin
           -> verify claim -> confirm claim -> verify Hunters-win result
           -> rematch -> tag Leila -> end match -> verify Prey-win result

  Production (port 8080 + server\data\manhunt.db) is never touched. This verifies the
  believable scenario ("Riverside Run", 5 players, 2 Prey / 3 Hunters, fresh + stale
  reports, 41:12 clock, tag flows, both results) without needing an Android device.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\screenshots\verify-game-local.ps1
#>
[CmdletBinding()]
param(
    [int]$Port = 8090,
    [string]$RuntimeDir = (Join-Path $env:TEMP 'manhunt-premium-verify')
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$script = Join-Path $PSScriptRoot 'game-control.mjs'
$base = "http://127.0.0.1:$Port"
$statePath = Join-Path $RuntimeDir 'premium-state.json'
$dbPath = Join-Path $RuntimeDir 'premium-verify.db'
$serverOut = Join-Path $RuntimeDir 'server.out.log'
$serverErr = Join-Path $RuntimeDir 'server.err.log'
$presenceOut = Join-Path $RuntimeDir 'presence.out.log'
$presenceErr = Join-Path $RuntimeDir 'presence.err.log'

$server = $null
$presence = $null

function Write-Step([string]$message) {
    Write-Host "`n=== $message ===" -ForegroundColor Cyan
}

function Invoke-Game([string[]]$arguments) {
    & node $script @arguments --base $base --state $statePath --db-path $dbPath
    if ($LASTEXITCODE -ne 0) { throw "game-control $($arguments -join ' ') failed (exit $LASTEXITCODE)" }
}

function Invoke-Verify([string]$stage) {
    Invoke-Game @('verify', '--stage', $stage) | Where-Object { $_ -match 'ok - |PASS' } | ForEach-Object { Write-Host "  $_" }
}

try {
    New-Item -ItemType Directory -Force -Path $RuntimeDir | Out-Null
    Get-ChildItem $RuntimeDir -File -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

    Write-Step "Starting isolated server on $base (DB: $dbPath)"
    $env:PORT = "$Port"
    $env:HOST = '127.0.0.1'
    $env:DB_PATH = $dbPath
    $server = Start-Process -FilePath 'node' -ArgumentList 'src/server.ts' `
        -WorkingDirectory (Join-Path $repoRoot 'server') `
        -RedirectStandardOutput $serverOut -RedirectStandardError $serverErr -PassThru
    Remove-Item Env:PORT, Env:DB_PATH -ErrorAction SilentlyContinue

    $healthy = $false
    $response = $null
    foreach ($attempt in 1..40) {
        try {
            $response = Invoke-RestMethod -Uri "$base/health" -TimeoutSec 2
            if ($response.ok) { $healthy = $true; break }
        } catch {
            Start-Sleep -Milliseconds 500
        }
    }
    if (-not $healthy) {
        Write-Host '--- server stdout ---'; Get-Content $serverOut -ErrorAction SilentlyContinue
        Write-Host '--- server stderr ---'; Get-Content $serverErr -ErrorAction SilentlyContinue
        throw "Server did not become healthy on $base"
    }
    Write-Host "server is healthy (version $($response.version))"

    Write-Step 'Seeding Riverside Run (5 players)'
    Invoke-Game @('seed') | Out-Null

    Write-Step 'Holding WebSocket presence for all five players'
    $presence = Start-Process -FilePath 'node' -ArgumentList @($script, 'presence', '--base', $base, '--state', $statePath) `
        -RedirectStandardOutput $presenceOut -RedirectStandardError $presenceErr -PassThru
    $presenceReady = $false
    foreach ($attempt in 1..40) {
        Start-Sleep -Milliseconds 500
        try {
            if ((Get-Content $presenceOut -Raw -ErrorAction Stop) -match 'holding connections') { $presenceReady = $true; break }
        } catch {
            # The log file is still being written; keep waiting.
        }
        if ($presence.HasExited) { break }
    }
    if (-not $presenceReady) {
        Get-Content $presenceOut, $presenceErr -ErrorAction SilentlyContinue
        throw 'Presence sockets did not subscribe'
    }

    Write-Step 'Verifying the all-ready lobby'
    Invoke-Verify 'lobby'

    Write-Step 'Verifying the waiting-player lobby (Leila not ready)'
    Invoke-Game @('set-ready', '--user', 'leila', '--ready', 'false') | Out-Null
    Invoke-Verify 'lobby-waiting'
    Invoke-Game @('set-ready', '--user', 'leila', '--ready', 'true') | Out-Null

    Write-Step 'Starting the hunt and jumping to hunting (41:12 on the clock)'
    Invoke-Game @('start-hunt')
    Invoke-Game @('force-hunting')
    Invoke-Game @('sync-clock', '--trigger-user', 'sara')
    Invoke-Game @('report-trails')
    Invoke-Verify 'hunting'

    Write-Step 'Tagging Leila out, then a claim on Yasmin (Prey view)'
    Invoke-Game @('tag-prey', '--hunter', 'tariq', '--prey', 'leila', '--confirm')
    Invoke-Game @('claim-on-yasmin')
    Invoke-Verify 'claim'

    Write-Step 'Normalising the chat clock (21:04 capture clock)'
    Invoke-Game @('chat', '--user', 'sara', '--body', "One left. She's not going far.")
    Invoke-Game @('chat-clock', '--end', '2052')

    Write-Step 'Confirming the claim -> Hunters win'
    Invoke-Game @('set-played')
    Invoke-Game @('confirm-claim')
    Invoke-Verify 'result-hunters'

    Write-Step 'Rematch -> Prey win (1 of 2 survives)'
    Invoke-Game @('rematch-ready')
    Invoke-Game @('start-hunt')
    Invoke-Game @('force-hunting')
    Invoke-Game @('set-played')
    Invoke-Game @('tag-prey', '--hunter', 'tariq', '--prey', 'leila', '--confirm')
    Invoke-Game @('end-match')
    Invoke-Verify 'result-prey'

    Write-Step 'Checking the secondary room + leave flows'
    Invoke-Game @('create-room', '--user', 'omar', '--name', 'Riverside Run') | Out-Null
    Invoke-Game @('leave-room', '--user', 'yasmin')

    Write-Host "`nLocal game-state dry run: PASS" -ForegroundColor Green
    Write-Host "Artifacts: $RuntimeDir"
    exit 0
} catch {
    Write-Host "`nLocal game-state dry run: FAIL" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
} finally {
    if ($presence -and -not $presence.HasExited) { Stop-Process -Id $presence.Id -Force -ErrorAction SilentlyContinue }
    if ($server -and -not $server.HasExited) { Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue }
}
