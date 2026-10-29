<#
.SYNOPSIS
    Shared helpers for the ManHunt on-device testing scripts.

.DESCRIPTION
    Dot-source this file from the other scripts in this folder:

        . (Join-Path $PSScriptRoot 'common.ps1')

    It provides adb discovery (with a clear error when adb is missing) and a
    small adb wrapper that supports timeouts, so a wedged `adb wait-for-device`
    or an unauthorized phone cannot hang the whole script forever.
#>

function Resolve-AdbPath {
    <#
    .SYNOPSIS
        Returns the full path to adb.exe or throws a clear, actionable error.
    #>
    [CmdletBinding()]
    param(
        [string]$AdbPath
    )

    if ($AdbPath) {
        if (Test-Path -LiteralPath $AdbPath -PathType Leaf) {
            return (Resolve-Path -LiteralPath $AdbPath).ProviderPath
        }
        throw "adb was not found at '$AdbPath'. Pass -AdbPath with the full path to adb.exe (default: C:\Android\Sdk\platform-tools\adb.exe)."
    }

    $candidates = @()
    if ($env:ANDROID_HOME) { $candidates += (Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe') }
    if ($env:ANDROID_SDK_ROOT) { $candidates += (Join-Path $env:ANDROID_SDK_ROOT 'platform-tools\adb.exe') }
    $candidates += 'C:\Android\Sdk\platform-tools\adb.exe'

    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path -LiteralPath $candidate -PathType Leaf)) {
            return (Resolve-Path -LiteralPath $candidate).ProviderPath
        }
    }

    $onPath = Get-Command adb.exe -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($onPath) { return $onPath.Source }

    throw @"
adb.exe was not found, so the phone cannot be reached.

Looked for:
  $($candidates -join "`n  ")
  and for adb.exe on PATH.

Fix one of these and re-run:
  1. Install Android platform-tools (SDK Manager > SDK Tools > Android SDK Platform-Tools).
  2. Put adb on PATH, or pass the full path:
       -AdbPath 'C:\Android\Sdk\platform-tools\adb.exe'
  3. Check with:  adb version
"@
}

function ConvertTo-AdbArgument {
    <#
    .SYNOPSIS
        Quotes a single argument for CreateProcess-style command lines.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [AllowEmptyString()]
        [string]$Value
    )

    if ($Value -eq '') { return '""' }
    # Safe to pass through only when there is no whitespace or quote.
    if ($Value -notmatch '[\s"]') { return $Value }

    $escaped = [regex]::Replace($Value, '(\\*)"', '$1$1\"')
    return '"' + $escaped + '"'
}

function Invoke-Adb {
    <#
    .SYNOPSIS
        Runs adb with a hard timeout and returns ExitCode / StdOut / StdErr / TimedOut.

    .PARAMETER AllowFailure
        Return the result object instead of throwing on a non-zero exit code.
        Timeouts still throw unless they are allowed too (they are returned as
        TimedOut = $true when -AllowFailure is set).
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Adb,

        [Parameter(Mandatory = $true)]
        [string[]]$Arguments,

        [int]$TimeoutSeconds = 120,

        [switch]$AllowFailure
    )

    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $Adb
    $psi.Arguments = (@($Arguments | ForEach-Object { ConvertTo-AdbArgument ([string]$_) }) -join ' ')
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

    $commandLine = "$Adb $($psi.Arguments)"

    try {
        $process = [System.Diagnostics.Process]::Start($psi)
    }
    catch {
        throw "Could not start adb ('$Adb'). Check -AdbPath and that the file is executable. $($_.Exception.Message)"
    }

    # Read both streams asynchronously so a chatty adb cannot deadlock us.
    $stdoutTask = $process.StandardOutput.ReadToEndAsync()
    $stderrTask = $process.StandardError.ReadToEndAsync()

    $timedOut = $false
    if (-not $process.WaitForExit($TimeoutSeconds * 1000)) {
        $timedOut = $true
        try { $process.Kill() } catch { }
        try { [void]$process.WaitForExit(5000) } catch { }
    }

    $stdout = ''
    $stderr = ''
    try { $stdout = $stdoutTask.GetAwaiter().GetResult() } catch { }
    try { $stderr = $stderrTask.GetAwaiter().GetResult() } catch { }

    $exitCode = -1
    if (-not $timedOut) {
        try { $exitCode = $process.ExitCode } catch { $exitCode = -1 }
    }

    $result = [pscustomobject]@{
        ExitCode = $exitCode
        TimedOut = $timedOut
        StdOut   = $stdout
        StdErr   = $stderr
        Command  = $commandLine
    }

    if ($timedOut -and -not $AllowFailure) {
        throw "adb command timed out after $TimeoutSeconds s: $commandLine"
    }
    if (-not $timedOut -and $exitCode -ne 0 -and -not $AllowFailure) {
        $details = @($stderr.Trim(), $stdout.Trim()) | Where-Object { $_ }
        if (-not $details) { $details = @("exit code $exitCode") }
        throw "adb command failed: $commandLine`n$($details -join "`n")"
    }

    return $result
}

function Show-AdbDevices {
    <#
    .SYNOPSIS
        Prints `adb devices -l` in a readable way.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Adb
    )

    $result = Invoke-Adb -Adb $Adb -Arguments @('devices', '-l') -TimeoutSeconds 30 -AllowFailure

    Write-Host ''
    Write-Host 'Devices (adb devices -l):' -ForegroundColor Cyan
    $lines = @($result.StdOut -split "`r?`n" | Where-Object { $_.Trim() })
    if (-not $lines) {
        Write-Host '  (no output)' -ForegroundColor DarkGray
    }
    foreach ($line in $lines) { Write-Host "  $line" }
    if ($result.StdErr.Trim()) {
        Write-Host "  adb: $($result.StdErr.Trim())" -ForegroundColor Yellow
    }
}

function Wait-ForAdbDevice {
    <#
    .SYNOPSIS
        Waits until the given serial reports state "device".

    .DESCRIPTION
        Polls `adb -s <serial> get-state` (fast, bounded) instead of relying on
        an unbounded `wait-for-device`. Surfaces the unauthorized / offline case
        with an actionable message instead of hanging.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$Adb,

        [Parameter(Mandatory = $true)]
        [string]$Serial,

        [int]$TimeoutSeconds = 60
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $lastState = 'unknown'
    $lastError = ''

    do {
        $state = Invoke-Adb -Adb $Adb -Arguments @('-s', $Serial, 'get-state') -TimeoutSeconds 15 -AllowFailure
        $stdout = $state.StdOut.Trim()
        $stderr = $state.StdErr.Trim()
        if ($stdout) { $lastState = $stdout }
        if ($stderr) {
            $lastError = $stderr
            if ($stderr -match 'unauthorized') { $lastState = 'unauthorized' }
            elseif ($stderr -match 'offline') { $lastState = 'offline' }
            elseif ($stderr -match 'not found|no devices|unable to connect') { $lastState = 'connecting' }
        }

        switch ($lastState) {
            'device' { return $lastState }
            'unauthorized' {
                throw @"
The phone is connected but not authorized for USB/adb debugging.

On the phone:
  1. Unlock the screen.
  2. Accept the 'Allow USB debugging?' prompt (check 'Always allow from this computer').
  3. If no prompt appears: Developer options > Revoke USB debugging authorizations,
     then reconnect and accept the prompt again.

Then re-run this script.
"@
            }
            'offline' {
                # adb says offline while the daemon handshakes; give it time.
            }
        }

        Start-Sleep -Seconds 1
    } while ((Get-Date) -lt $deadline)

    $hint = ''
    if ($lastState -eq 'connecting') {
        $hint = @"

The adb daemon could not reach $Serial.
  - Is adb-over-TCP enabled on the phone? (see docs/DEVICE_TESTING.md)
  - Is the phone on the same network / Tailscale tailnet as this PC?
  - Try: adb disconnect $Serial ; adb connect $Serial
"@
    }
    elseif ($lastError) {
        $hint = "`nLast adb message: $lastError"
    }

    throw "Timed out after $TimeoutSeconds s waiting for device '$Serial' (last state: $lastState).$hint"
}
