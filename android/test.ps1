# Runs all JVM tests (fast - no emulator or device needed).
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:JAVA_HOME = 'C:\Android\jdk-21'

& "$root\gradlew.bat" :app:testDebugUnitTest
if ($LASTEXITCODE -ne 0) { throw "Tests failed" }

Write-Host ""
Write-Host "Report: $root\app\build\reports\tests\testDebugUnitTest\index.html" -ForegroundColor Green
