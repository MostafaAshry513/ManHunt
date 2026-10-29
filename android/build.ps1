# Builds the debug APK and prints where it is.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:JAVA_HOME = 'C:\Android\jdk-21'

& "$root\gradlew.bat" :app:assembleDebug
if ($LASTEXITCODE -ne 0) { throw "Build failed" }

$apk = Join-Path $root 'app\build\outputs\apk\debug\app-debug.apk'
Write-Host ""
Write-Host "APK: $apk" -ForegroundColor Green
