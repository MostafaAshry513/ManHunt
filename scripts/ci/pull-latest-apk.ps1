# Builds in CI, not locally.
#
# Downloads the newest successful CI artifact (Actions-built APK) and copies it
# to the path the local install page serves: /app.apk.
#
#   .\scripts\ci\pull-latest-apk.ps1
#
#Requires -Version 5.1
[CmdletBinding()]
param(
    [string]$Workflow = 'ci.yml',
    [string]$Destination = 'C:\dev\ManHunt\android\app\build\outputs\apk\debug\app-debug.apk'
)

$ErrorActionPreference = 'Stop'
$gh = 'C:\Program Files\GitHub CLI\gh.exe'
if (-not (Test-Path $gh)) { $gh = 'gh' }
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

$runId = & $gh run list --workflow $Workflow --status success --limit 1 --json databaseId --jq '.[0].databaseId'
if ([string]::IsNullOrWhiteSpace($runId)) {
    throw "No successful '$Workflow' run found. Push a commit and wait for CI."
}

$temp = Join-Path $env:TEMP "manhunt-ci-$runId"
Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $temp | Out-Null

& $gh run download $runId --name manhunt-debug-apk --dir $temp
$apk = Get-ChildItem $temp -Recurse -Filter *.apk | Select-Object -First 1
if (-not $apk) { throw 'Artifact downloaded but no APK found.' }

New-Item -ItemType Directory -Force (Split-Path -Parent $Destination) | Out-Null
Copy-Item $apk.FullName $Destination -Force
Remove-Item $temp -Recurse -Force

Write-Host "Serving CI build from run $runId"
Write-Host "  $Destination"
Write-Host "  $([math]::Round((Get-Item $Destination).Length/1MB,2)) MB"

# Publish the update manifest the app checks.
$buildTools = Get-ChildItem 'C:\Android\Sdk\build-tools' -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
$aapt2 = if ($buildTools) { Join-Path $buildTools.FullName 'aapt2.exe' } else { '' }
$versionName = '0.0.0'
$versionCode = 0
if ($aapt2 -and (Test-Path $aapt2)) {
    $badging = & $aapt2 dump badging $Destination 2>$null | Select-String '^package:'
    if ($badging -and $badging.Line -match "versionCode='(\d+)'") { $versionCode = [int]$Matches[1] }
    if ($badging -and $badging.Line -match "versionName='([^']+)'") { $versionName = $Matches[1] }
}
$sha = (Get-FileHash $Destination -Algorithm SHA256).Hash.ToLower()
$manifest = [ordered]@{
    versionCode = $versionCode
    versionName = $versionName
    url         = '/app.apk'
    sha256      = $sha
    size        = (Get-Item $Destination).Length
    publishedAt = (Get-Date).ToUniversalTime().ToString('o')
    notes       = "Built by GitHub Actions run $runId"
}
$manifestPath = Join-Path $repoRoot 'server\data\app-latest.json'
New-Item -ItemType Directory -Force (Split-Path -Parent $manifestPath) | Out-Null
$manifest | ConvertTo-Json | Set-Content $manifestPath -Encoding UTF8
Write-Host "Update manifest: $manifestPath (v$versionName code=$versionCode)"