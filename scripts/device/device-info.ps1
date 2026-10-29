<#
.SYNOPSIS
    Reports the details needed before testing ManHunt on a physical phone:
    model, Android version, ABI, root status, screen geometry/density and
    whether com.manhunt.app is installed.

.DESCRIPTION
    With -Host, the script connects over adb TCP/IP first. Without -Host it
    uses the single already-connected device (USB or TCP) and fails clearly if
    there are zero or several devices.

        .\scripts\device\device-info.ps1 -Host 100.101.102.103
        .\scripts\device\device-info.ps1
        .\scripts\device\device-info.ps1 -Host 100.101.102.103 -Json

.PARAMETER Host
    Phone IP address or DNS name reachable from this PC. Omit to use the
    device adb already knows about.

.PARAMETER Port
    adb TCP port on the phone. Default 5555.

.PARAMETER Package
    Application id to check. Default com.manhunt.app.

.PARAMETER Json
    Emit a single JSON object instead of the labelled report (handy for logs).

.PARAMETER AdbPath
    Full path to adb.exe. Defaults to ANDROID_HOME / ANDROID_SDK_ROOT /
    C:\Android\Sdk\platform-tools\adb.exe / PATH, in that order.
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0, HelpMessage = 'Phone IP address or hostname; omit to use the connected device')]
    [Alias('Host', 'Ip', 'Address')]
    [string]$DeviceHost,

    [ValidateRange(1, 65535)]
    [int]$Port = 5555,

    [string]$Package = 'com.manhunt.app',

    [switch]$Json,

    [string]$AdbPath
)

$ErrorActionPreference = 'Stop'

. (Join-Path $PSScriptRoot 'common.ps1')

function Get-ConnectedSerials {
    param([string]$Adb)

    $result = Invoke-Adb -Adb $Adb -Arguments @('devices') -TimeoutSeconds 30 -AllowFailure
    $serials = @()
    foreach ($line in ($result.StdOut -split "`r?`n")) {
        if ($line -match '^\s*(\S+)\s+device\b') { $serials += $Matches[1] }
    }
    return $serials
}

function Get-DeviceOutput {
    param(
        [string]$Adb,
        [string]$Serial,
        [string[]]$Arguments,
        [int]$TimeoutSeconds = 30
    )

    $result = Invoke-Adb -Adb $Adb -Arguments (@('-s', $Serial) + $Arguments) -TimeoutSeconds $TimeoutSeconds -AllowFailure
    $text = (@($result.StdOut.Trim(), $result.StdErr.Trim()) | Where-Object { $_ }) -join "`n"
    return $text
}

function Get-DeviceProperty {
    param(
        [string]$Adb,
        [string]$Serial,
        [string]$Name
    )

    $value = Get-DeviceOutput -Adb $Adb -Serial $Serial -Arguments @('shell', 'getprop', $Name)
    if (-not $value) { return '' }
    return ($value -split "`r?`n" | Select-Object -First 1).Trim()
}

try {
    $adb = Resolve-AdbPath -AdbPath $AdbPath

    if ($DeviceHost) {
        $serial = "$DeviceHost`:$Port"
        $connect = Invoke-Adb -Adb $adb -Arguments @('connect', $serial) -TimeoutSeconds 30 -AllowFailure
        $connectText = (@($connect.StdOut.Trim(), $connect.StdErr.Trim()) | Where-Object { $_ }) -join ' '
        if (-not $Json) { Write-Host "adb: $connectText" -ForegroundColor DarkGray }
        if ($connect.TimedOut -or $connectText -match 'failed|cannot|unable|refused') {
            throw "Could not connect to $serial. Enable adb-over-TCP on the phone (docs/DEVICE_TESTING.md) and check reachability."
        }
    }
    else {
        $serials = Get-ConnectedSerials -Adb $adb
        if ($serials.Count -eq 0) {
            throw @"
No device is connected.

Connect one first:
  .\scripts\device\connect.ps1 -Host <phone-ip>
or plug the phone in over USB and accept the debugging prompt, then re-run.
"@
        }
        if ($serials.Count -gt 1) {
            throw "More than one device is attached ($($serials -join ', ')). Re-run with -Host <phone-ip> (or disconnect the others)."
        }
        $serial = $serials[0]
    }

    Invoke-Adb -Adb $adb -Arguments @('-s', $serial, 'wait-for-device') -TimeoutSeconds 30 -AllowFailure | Out-Null
    [void](Wait-ForAdbDevice -Adb $adb -Serial $serial -TimeoutSeconds 60)

    $model = Get-DeviceProperty -Adb $adb -Serial $serial -Name 'ro.product.model'
    $manufacturer = Get-DeviceProperty -Adb $adb -Serial $serial -Name 'ro.product.manufacturer'
    $device = Get-DeviceProperty -Adb $adb -Serial $serial -Name 'ro.product.device'
    $release = Get-DeviceProperty -Adb $adb -Serial $serial -Name 'ro.build.version.release'
    $sdk = Get-DeviceProperty -Adb $adb -Serial $serial -Name 'ro.build.version.sdk'
    $buildType = Get-DeviceProperty -Adb $adb -Serial $serial -Name 'ro.build.type'
    $debuggable = Get-DeviceProperty -Adb $adb -Serial $serial -Name 'ro.debuggable'
    $abi = Get-DeviceProperty -Adb $adb -Serial $serial -Name 'ro.product.cpu.abi'
    $abiList = Get-DeviceProperty -Adb $adb -Serial $serial -Name 'ro.product.cpu.abilist'

    $idText = Get-DeviceOutput -Adb $adb -Serial $serial -Arguments @('shell', 'id')
    $isRoot = $idText -match 'uid=0'
    $suPath = Get-DeviceOutput -Adb $adb -Serial $serial -Arguments @('shell', 'which', 'su')
    $suPath = ($suPath -split "`r?`n" | Where-Object { $_ -and $_ -notmatch 'not found|No such' } | Select-Object -First 1)
    if ($suPath) { $suPath = $suPath.Trim() }
    $selinux = Get-DeviceOutput -Adb $adb -Serial $serial -Arguments @('shell', 'getenforce')
    $selinux = ($selinux -split "`r?`n" | Select-Object -First 1).Trim()

    $screenSize = Get-DeviceOutput -Adb $adb -Serial $serial -Arguments @('shell', 'wm', 'size')
    $screenDensity = Get-DeviceOutput -Adb $adb -Serial $serial -Arguments @('shell', 'wm', 'density')
    $physicalSize = ($screenSize -split "`r?`n" | Where-Object { $_ -match 'Physical size' } | Select-Object -First 1)
    $overrideSize = ($screenSize -split "`r?`n" | Where-Object { $_ -match 'Override size' } | Select-Object -First 1)
    $physicalDensity = ($screenDensity -split "`r?`n" | Where-Object { $_ -match 'Physical density' } | Select-Object -First 1)
    $overrideDensity = ($screenDensity -split "`r?`n" | Where-Object { $_ -match 'Override density' } | Select-Object -First 1)

    $packageList = Get-DeviceOutput -Adb $adb -Serial $serial -Arguments @('shell', 'pm', 'list', 'packages', $Package)
    $isInstalled = [bool]($packageList -split "`r?`n" | Where-Object { $_.Trim() -eq "package:$Package" })
    $versionName = ''
    $versionCode = ''
    $debuggableFlag = ''
    if ($isInstalled) {
        $dump = Get-DeviceOutput -Adb $adb -Serial $serial -Arguments @('shell', 'dumpsys', 'package', $Package) -TimeoutSeconds 60
        $vn = ($dump -split "`r?`n" | Where-Object { $_ -match 'versionName=' } | Select-Object -First 1)
        if ($vn -and $vn -match 'versionName=(\S+)') { $versionName = $Matches[1] }
        $vc = ($dump -split "`r?`n" | Where-Object { $_ -match 'versionCode=' } | Select-Object -First 1)
        if ($vc -and $vc -match 'versionCode=(\d+)') { $versionCode = $Matches[1] }
        if ($dump -match '\bDEBUGGABLE\b') { $debuggableFlag = 'yes' } else { $debuggableFlag = 'no' }
    }

    $rootSummary = if ($isRoot) { 'adbd is running as root (uid=0)' }
                   elseif ($suPath) { "adbd is not root, but su is available at $suPath" }
                   else { 'no root (adbd not uid=0 and no su binary found)' }

    $report = [pscustomobject][ordered]@{
        Serial           = $serial
        Model            = if ($model) { "$manufacturer $model".Trim() } else { 'unknown' }
        Codename         = if ($device) { $device } else { 'unknown' }
        AndroidVersion   = if ($release) { "$release (API $sdk)" } else { 'unknown' }
        BuildType        = if ($buildType) { $buildType } else { 'unknown' }
        DebuggableBuild  = if ($debuggable) { $debuggable } else { 'unknown' }
        Abi              = if ($abi) { $abi } else { 'unknown' }
        AbiList          = if ($abiList) { $abiList } else { 'n/a' }
        AdbIdentity      = if ($idText) { ($idText -split "`r?`n" | Select-Object -First 1).Trim() } else { 'unknown' }
        Root             = $rootSummary
        SuBinary         = if ($suPath) { $suPath } else { 'not found' }
        Selinux          = if ($selinux) { $selinux } else { 'unknown' }
        ScreenSize       = if ($physicalSize) { $physicalSize.Trim() } else { ($screenSize -split "`r?`n" | Select-Object -First 1) }
        ScreenOverride   = if ($overrideSize) { $overrideSize.Trim() } else { 'none' }
        ScreenDensity    = if ($physicalDensity) { $physicalDensity.Trim() } else { ($screenDensity -split "`r?`n" | Select-Object -First 1) }
        DensityOverride  = if ($overrideDensity) { $overrideDensity.Trim() } else { 'none' }
        Package          = $Package
        Installed        = if ($isInstalled) { 'yes' } else { 'no' }
        VersionName      = if ($versionName) { $versionName } else { 'n/a' }
        VersionCode      = if ($versionCode) { $versionCode } else { 'n/a' }
        DebuggableApp    = if ($isInstalled) { $debuggableFlag } else { 'n/a' }
    }

    if ($Json) {
        $report | ConvertTo-Json -Depth 4
        exit 0
    }

    Write-Host ''
    Write-Host "Device report for $serial" -ForegroundColor Cyan
    Write-Host ('-' * 60)
    $report.PSObject.Properties | ForEach-Object {
        Write-Host ('{0,-16} {1}' -f $_.Name, $_.Value)
    }
    Write-Host ('-' * 60)

    if (-not $isInstalled) {
        Write-Host "NOTE: $Package is not installed. Run .\scripts\device\connect.ps1 -Host <phone-ip> to install it." -ForegroundColor Yellow
    }
    if ($isRoot) {
        Write-Host 'Root: adbd already runs as root; root-only shell commands work without su.' -ForegroundColor Green
    }
    elseif ($suPath) {
        Write-Host 'Root: the phone is rooted (su present) but adbd is not root. Prefix privileged commands with: adb shell su -c "..."' -ForegroundColor Green
    }
    else {
        Write-Host 'Root: no root detected. Root-only ManHunt tests will fail on this device.' -ForegroundColor Yellow
    }

    exit 0
}
catch {
    $message = $_.Exception.Message
    if ($Json) {
        [pscustomobject]@{ Ok = $false; Error = $message } | ConvertTo-Json -Depth 4
    }
    else {
        Write-Host ''
        Write-Host "ERROR: $message" -ForegroundColor Red
    }
    exit 1
}
