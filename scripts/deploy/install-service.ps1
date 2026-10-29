<#
.SYNOPSIS
    Registers the ManHunt backend as a Windows Scheduled Task.

.DESCRIPTION
    Creates a scheduled task that starts the backend at boot as
    NT AUTHORITY\SYSTEM. The task runs run-server.ps1, which sets PORT, HOST,
    DB_PATH and SESSION_DAYS for the Node process, appends output to
    <repo>\logs\server.out.log, and restarts Node after a non-zero exit.
    Task Scheduler restart-on-failure is enabled as a second layer.

    The task is registered but not started unless -StartNow is supplied.
    Re-running without -Force is refused so an existing task is not silently
    replaced.

    This script does NOT open firewall ports, install a TLS proxy, or change
    machine-wide security settings. Public exposure of the app is a separate,
    explicitly authorized step.

.PARAMETER NodePath
    Path to node.exe, or a command name such as 'node' (default). The resolved
    executable is stored in the task so it does not depend on PATH at boot.

.PARAMETER ServerDir
    Server directory containing src\server.ts. Defaults to <repo>\server.

.PARAMETER Port
    TCP port for the backend. Defaults to 8080.

.PARAMETER DbPath
    SQLite database path. Defaults to <ServerDir>\data\manhunt.db.

.PARAMETER TaskName
    Scheduled task name. Defaults to ManHuntServer.

.PARAMETER ListenHost
    Interface to bind. Defaults to 127.0.0.1 (local only).

.PARAMETER SessionDays
    Session lifetime in days. Defaults to 30.

.PARAMETER RestartDelaySeconds
    Seconds the launcher waits before restarting Node after a non-zero exit.
    Defaults to 10.

.PARAMETER Force
    Replace an existing scheduled task with the same name.

.PARAMETER StartNow
    Start the task immediately after registering it.

.EXAMPLE
    # Elevated PowerShell
    .\install-service.ps1 -Port 8080

.EXAMPLE
    .\install-service.ps1 -NodePath 'C:\Program Files\nodejs\node.exe' `
        -ServerDir 'C:\dev\ManHunt\server' `
        -DbPath 'C:\dev\ManHunt\server\data\manhunt.db' `
        -TaskName ManHuntServer -StartNow

.NOTES
    Requirements: Windows PowerShell 5.1+, elevated session, Node.js 24+.
    No external modules are used.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$NodePath = 'node',

    [string]$ServerDir = '',

    [ValidateRange(1, 65535)]
    [int]$Port = 8080,

    [string]$DbPath = '',

    [string]$TaskName = 'ManHuntServer',

    [string]$ListenHost = '127.0.0.1',

    [ValidateRange(1, 3650)]
    [int]$SessionDays = 30,

    [ValidateRange(1, 3600)]
    [int]$RestartDelaySeconds = 10,

    [switch]$Force,

    [switch]$StartNow
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

function Test-IsElevated {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsElevated)) {
    throw ('Administrator rights are required to register a scheduled task that runs as SYSTEM. ' +
        'Close this window, open PowerShell with "Run as administrator", and run the script again.')
}

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if ([string]::IsNullOrWhiteSpace($ServerDir)) {
    $ServerDir = Join-Path $repoRoot 'server'
}
$ServerDir = [IO.Path]::GetFullPath($ServerDir)

if ([string]::IsNullOrWhiteSpace($DbPath)) {
    $DbPath = Join-Path $ServerDir 'data\manhunt.db'
}
$DbPath = [IO.Path]::GetFullPath($DbPath)

if ([string]::IsNullOrWhiteSpace($TaskName)) {
    throw 'TaskName must not be empty.'
}
if ($TaskName -match '[\\/]') {
    throw "TaskName must not contain path separators: $TaskName"
}

$entryPoint = Join-Path $ServerDir 'src\server.ts'
if (-not (Test-Path -LiteralPath $entryPoint -PathType Leaf)) {
    throw "Server entry point not found: $entryPoint. Check -ServerDir."
}

$launcher = Join-Path $PSScriptRoot 'run-server.ps1'
if (-not (Test-Path -LiteralPath $launcher -PathType Leaf)) {
    throw "Launcher script not found: $launcher"
}

$powershellExe = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
if (-not (Test-Path -LiteralPath $powershellExe -PathType Leaf)) {
    throw "Windows PowerShell executable not found: $powershellExe"
}

if (Test-Path -LiteralPath $NodePath -PathType Leaf) {
    $nodeExe = (Resolve-Path -LiteralPath $NodePath).Path
}
else {
    $nodeCommand = Get-Command -Name $NodePath -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($null -eq $nodeCommand) {
        throw ("Node executable not found: '$NodePath'. Install Node.js 24+ or pass " +
            "-NodePath 'C:\Program Files\nodejs\node.exe'.")
    }
    $nodeExe = $nodeCommand.Source
}

$nodeVersion = & $nodeExe --version
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($nodeVersion)) {
    throw "Could not determine the Node.js version using: $nodeExe"
}
if ($nodeVersion -notmatch '^v(?<major>\d+)\.') {
    throw "Unexpected Node.js version output: $nodeVersion"
}
if ([int]$Matches['major'] -lt 24) {
    throw "Node.js 24 or newer is required (found $nodeVersion)."
}

$logsDir = Join-Path $repoRoot 'logs'
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

foreach ($value in @($nodeExe, $ServerDir, $DbPath, $launcher, $powershellExe, $ListenHost)) {
    if ($value.Contains('"')) {
        throw "A path or host value contains a double quote, which cannot be passed safely: $value"
    }
}

$existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($null -ne $existingTask -and -not $Force) {
    throw ("Scheduled task '$TaskName' already exists. Use uninstall-service.ps1 to remove it, " +
        'or re-run with -Force to replace it.')
}

$arguments = @(
    '-NoProfile',
    '-NonInteractive',
    '-ExecutionPolicy', 'Bypass',
    '-File', ('"{0}"' -f $launcher),
    '-NodePath', ('"{0}"' -f $nodeExe),
    '-ServerDir', ('"{0}"' -f $ServerDir),
    '-Port', [string]$Port,
    '-DbPath', ('"{0}"' -f $DbPath),
    '-ListenHost', ('"{0}"' -f $ListenHost),
    '-SessionDays', [string]$SessionDays,
    '-RestartDelaySeconds', [string]$RestartDelaySeconds
) -join ' '

$action = New-ScheduledTaskAction -Execute $powershellExe -Argument $arguments -WorkingDirectory $ServerDir
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet `
    -StartWhenAvailable `
    -RestartCount 999 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero) `
    -MultipleInstances IgnoreNew `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId 'NT AUTHORITY\SYSTEM' -LogonType ServiceAccount -RunLevel Highest

$healthUrl = 'http://127.0.0.1:{0}/health' -f $Port

if ($PSCmdlet.ShouldProcess($TaskName, 'Register scheduled task')) {
    if ($null -ne $existingTask) {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }

    Register-ScheduledTask `
        -TaskName $TaskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description 'ManHunt backend (Node.js). Local-only listener; no firewall changes.' `
        | Out-Null

    if ($StartNow) {
        Start-ScheduledTask -TaskName $TaskName
    }

    Write-Host ''
    Write-Host ("Registered scheduled task '{0}'." -f $TaskName)
    Write-Host ("  Node:     {0} ({1})" -f $nodeExe, $nodeVersion)
    Write-Host ("  Server:   {0}" -f $ServerDir)
    Write-Host ("  Bind:     {0}:{1}" -f $ListenHost, $Port)
    Write-Host ("  Database: {0}" -f $DbPath)
    Write-Host ("  Log:      {0}" -f (Join-Path $logsDir 'server.out.log'))
    Write-Host ("  Health:   {0}" -f $healthUrl)
    Write-Host ("  Restart:  {0}s after a non-zero exit" -f $RestartDelaySeconds)
    Write-Host ''
    Write-Host 'No firewall rule was created. The backend is bound to the address above only.'
    if (-not $StartNow) {
        Write-Host ("Start it with: Start-ScheduledTask -TaskName '{0}'" -f $TaskName)
    }

    Get-ScheduledTask -TaskName $TaskName | Select-Object TaskName, State
}
