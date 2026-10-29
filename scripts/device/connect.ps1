<#
.SYNOPSIS
    Connects to a phone over adb TCP/IP, installs the ManHunt debug APK and
    optionally launches it.

.DESCRIPTION
    Typical use (phone already has adb-over-TCP enabled on port 5555):

        .\scripts\device\connect.ps1 -Host 100.101.102.103

        .\scripts\device\connect.ps1 -Host 100.101.102.103 -Launch

        .\scripts\device\connect.ps1 -Host 100.101.102.103 -Apk D:\build\app-debug.apk

        .\scripts\device\connect.ps1 -Host 100.101.102.103 -Disconnect

    The phone is addressed as <Host>:<Port>; adb needs no USB cable once
    adb-over-TCP is enabled (see docs/DEVICE_TESTING.md for the phone side).

.PARAMETER Host
    Phone IP address or DNS name reachable from this PC (LAN IP, Tailscale
    100.x.y.z address, or 127.0.0.1 when using an SSH reverse tunnel).

.PARAMETER Port
    adb TCP port on the phone. Default 5555.

.PARAMETER Apk
    Path to the APK. Relative paths are resolved against the current directory
    and then against the repository root. Default: the standard debug build
    output.

.PARAMETER Package
    Android application id, used by -Launch. Default com.manhunt.app.

.PARAMETER Launch
    Launch the app after a successful install.

.PARAMETER Disconnect
    Disconnect this host from adb and exit (no install).

.PARAMETER WaitSeconds
    How long to wait for the phone to come online. Default 60.

.PARAMETER InstallTimeoutSeconds
    How long to allow `adb install` to run. Default 300.

.PARAMETER AdbPath
    Full path to adb.exe. Defaults to ANDROID_HOME / ANDROID_SDK_ROOT /
    C:\Android\Sdk\platform-tools\adb.exe / PATH, in that order.

.EXAMPLE
    .\scripts\device\connect.ps1 -Host 100.101.102.103 -Launch -Verbose
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true, Position = 0, HelpMessage = 'Phone IP address or hostname reachable over adb TCP/IP')]
    [Alias('Host', 'Ip', 'Address')]
    [string]$DeviceHost,

    [ValidateRange(1, 65535)]
    [int]$Port = 5555,

    [string]$Apk = 'android\app\build\outputs\apk\debug\app-debug.apk',

    [string]$Package = 'com.manhunt.app',

    [switch]$Launch,

    [switch]$Disconnect,

    [ValidateRange(1, 3600)]
    [int]$WaitSeconds = 60,

    [ValidateRange(10, 3600)]
    [int]$InstallTimeoutSeconds = 300,

    [string]$AdbPath
)

$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'common.ps1')

function Resolve-ApkPath {
    param([string]$Path)

    if ([System.IO.Path]::IsPathRooted($Path)) {
        if (Test-Path -LiteralPath $Path -PathType Leaf) {
            return (Resolve-Path -LiteralPath $Path).ProviderPath
        }
        return $null
    }

    $repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
    $attempts = @(
        (Join-Path (Get-Location).ProviderPath $Path),
        (Join-Path $repoRoot $Path)
    )
    foreach ($attempt in $attempts) {
        if (Test-Path -LiteralPath $attempt -PathType Leaf) {
            return (Resolve-Path -LiteralPath $attempt).ProviderPath
        }
    }
    return $null
}

function Invoke-AdbConnect {
    param(
        [string]$Adb,
        [string]$Serial
    )

    Write-Host "Connecting to $Serial ..." -ForegroundColor Cyan
    $result = Invoke-Adb -Adb $Adb -Arguments @('connect', $Serial) -TimeoutSeconds 30 -AllowFailure
    $text = (@($result.StdOut.Trim(), $result.StdErr.Trim()) | Where-Object { $_ }) -join ' '
    Write-Host "  adb: $text"

    if ($result.TimedOut) {
        throw "adb connect to $Serial timed out. The phone is not reachable (see docs/DEVICE_TESTING.md, 'Reachability options')."
    }
    if ($text -match 'failed to connect|cannot connect|unable to connect|refused|No route to host|timed out') {
        throw @"
Could not connect to $Serial.

Check, in this order:
  1. adb-over-TCP is enabled on the phone and survives reboots
     (docs/DEVICE_TESTING.md > 'Enable adb over TCP on a rooted phone').
  2. The port is right: default 5555, override with -Port.
  3. The phone is reachable from this PC:  Test-NetConnection '$($Serial.Split(':')[0])' -Port $Port
  4. Nothing else grabbed the port (Tailscale IP vs LAN IP, port forwarding, SSH tunnel).
  5. If the phone rebooted, re-enable adb TCP or re-run the tunnel.
"@
    }
    if ($text -notmatch 'connected to|already connected') {
        throw "Unexpected response from 'adb connect $Serial': $text"
    }
}

try {
    $adb = Resolve-AdbPath -AdbPath $AdbPath
    $serial = "$DeviceHost`:$Port"

    Write-Host "adb:    $adb" -ForegroundColor DarkGray
    Write-Host "target: $serial" -ForegroundColor DarkGray

    if ($Disconnect) {
        $result = Invoke-Adb -Adb $adb -Arguments @('disconnect', $serial) -TimeoutSeconds 30 -AllowFailure
        $text = (@($result.StdOut.Trim(), $result.StdErr.Trim()) | Where-Object { $_ }) -join ' '
        # adb exits 0 and says "no such device" when it was not connected, which
        # is still the desired end state.
        if ($text -match 'no such device|not found') {
            Write-Host "Not connected: $serial ($text)" -ForegroundColor Yellow
        }
        else {
            Write-Host "Disconnected: $text" -ForegroundColor Green
        }
        Show-AdbDevices -Adb $adb
        exit 0
    }

    $apkPath = Resolve-ApkPath -Path $Apk
    if (-not $apkPath) {
        throw @"
APK not found: $Apk

Build it first (from the repository root):
  .\gradlew.bat :app:assembleDebug

Then either re-run this script or point at the artifact explicitly:
  -Apk android\app\build\outputs\apk\debug\app-debug.apk
"@
    }

    Invoke-AdbConnect -Adb $adb -Serial $serial

    # wait-for-device is bounded, and Wait-ForAdbDevice turns an unauthorized or
    # offline phone into a clear message instead of an endless hang.
    Invoke-Adb -Adb $adb -Arguments @('-s', $serial, 'wait-for-device') -TimeoutSeconds $WaitSeconds -AllowFailure | Out-Null
    [void](Wait-ForAdbDevice -Adb $adb -Serial $serial -TimeoutSeconds $WaitSeconds)

    Write-Host ''
    Write-Host "Installing $apkPath" -ForegroundColor Cyan
    Write-Host '  (adb install -r ...)' -ForegroundColor DarkGray

    $install = Invoke-Adb -Adb $adb -Arguments @('-s', $serial, 'install', '-r', $apkPath) -TimeoutSeconds $InstallTimeoutSeconds -AllowFailure
    $installText = (@($install.StdOut.Trim(), $install.StdErr.Trim()) | Where-Object { $_ }) -join "`n"

    if ($install.TimedOut) {
        throw "adb install timed out after $InstallTimeoutSeconds s. The phone may be slow or the link may be flaky; retry or raise -InstallTimeoutSeconds."
    }
    if ($install.ExitCode -ne 0 -or $installText -notmatch 'Success') {
        $hint = ''
        if ($installText -match 'INSTALL_FAILED_UPDATE_INCOMPATIBLE|signatures do not match') {
            $hint = @"

The installed build was signed with a different key. Uninstall and reinstall:
  adb -s $serial uninstall $Package
"@
        }
        elseif ($installText -match 'INSTALL_FAILED_VERSION_DOWNGRADE') {
            $hint = "`nThe phone has a newer version installed. Add -d or uninstall $Package first."
        }
        elseif ($installText -match 'INSTALL_FAILED_INSUFFICIENT_STORAGE') {
            $hint = "`nFree space on the phone, or clear old builds: adb -s $serial shell pm uninstall -k $Package"
        }
        elseif ($installText -match 'INSTALL_FAILED_TEST_ONLY') {
            $hint = "`nThis APK is marked testOnly; build with assembleDebug (not test) or install with 'adb install -r -t'."
        }
        throw "Install failed (exit $($install.ExitCode)).`n$installText$hint"
    }
    Write-Host "  $($installText.Trim())" -ForegroundColor Green

    if ($Launch) {
        Write-Host ''
        Write-Host "Launching $Package ..." -ForegroundColor Cyan

        $launchTarget = $null
        $resolved = Invoke-Adb -Adb $adb -Arguments @('-s', $serial, 'shell', 'cmd', 'package', 'resolve-activity', '--brief', $Package) -TimeoutSeconds 30 -AllowFailure
        if ($resolved.ExitCode -eq 0) {
            $candidate = @($resolved.StdOut -split "`r?`n" | Where-Object { $_ -match '/' } | Select-Object -Last 1)
            if ($candidate) { $launchTarget = $candidate.Trim() }
        }

        if ($launchTarget) {
            $start = Invoke-Adb -Adb $adb -Arguments @('-s', $serial, 'shell', 'am', 'start', '-n', $launchTarget) -TimeoutSeconds 30 -AllowFailure
            $startText = (@($start.StdOut.Trim(), $start.StdErr.Trim()) | Where-Object { $_ }) -join ' '
            if ($startText -match 'Error|Exception') {
                throw "Could not launch $launchTarget : $startText"
            }
            Write-Host "  Started $launchTarget" -ForegroundColor Green
        }
        else {
            Write-Host "  Could not resolve a launcher activity; falling back to monkey." -ForegroundColor Yellow
            $monkey = Invoke-Adb -Adb $adb -Arguments @('-s', $serial, 'shell', 'monkey', '-p', $Package, '-c', 'android.intent.category.LAUNCHER', '1') -TimeoutSeconds 30 -AllowFailure
            $monkeyText = (@($monkey.StdOut.Trim(), $monkey.StdErr.Trim()) | Where-Object { $_ }) -join ' '
            if ($monkey.ExitCode -ne 0 -or $monkeyText -match 'No activities found|monkey aborted') {
                throw "Could not launch $Package (is it installed? does it declare a launcher activity?).`n$monkeyText"
            }
            Write-Host "  Launched via monkey." -ForegroundColor Green
        }
    }

    Show-AdbDevices -Adb $adb
    Write-Host ''
    Write-Host "Ready: $serial ($Package installed)" -ForegroundColor Green
    exit 0
}
catch {
    Write-Host ''
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
