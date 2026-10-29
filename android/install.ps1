# Installs the debug APK on a connected device/phone and launches it.
# Device setup (real phone over Wi-Fi):
#   adb pair <ip:port>      # once, using the code from Developer options > Wireless debugging
#   adb connect <ip:port>
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$adb = 'C:\Android\Sdk\platform-tools\adb.exe'
$apk = Join-Path $root 'app\build\outputs\apk\debug\app-debug.apk'

if (-not (Test-Path $apk)) {
    & "$root\build.ps1"
}

$devices = & $adb devices | Select-String -Pattern '\tdevice$'
if (-not $devices) {
    Write-Host "No device connected." -ForegroundColor Yellow
    Write-Host "Enable Developer options > Wireless debugging on your phone, then run:"
    Write-Host "  adb pair <ip:port>"
    Write-Host "  adb connect <ip:port>"
    exit 1
}

& $adb install -r $apk
& $adb shell am start -n com.manhunt.app/.MainActivity
