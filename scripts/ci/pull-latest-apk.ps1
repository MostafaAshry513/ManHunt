# Builds happen in CI; this script only publishes an already-built release.
#
# Downloads the newest GitHub Release APK (the signed `assembleRelease` build),
# verifies its SHA-256, copies it to the path the install page serves (`/app.apk`),
# and writes the in-app update manifest without a UTF-8 BOM.
#
#   .\scripts\ci\pull-latest-apk.ps1
#   .\scripts\ci\pull-latest-apk.ps1 -Tag v0.7.3
#
#Requires -Version 5.1
[CmdletBinding()]
param(
    [string]$Tag = '',
    [string]$Destination = 'C:\dev\ManHunt\android\app\build\outputs\apk\debug\app-debug.apk'
)

$ErrorActionPreference = 'Stop'
$gh = 'C:\Program Files\GitHub CLI\gh.exe'
if (-not (Test-Path $gh)) { $gh = 'gh' }
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $repoRoot

if ([string]::IsNullOrWhiteSpace($Tag)) {
    $Tag = (& $gh release view --json tagName --jq '.tagName').Trim()
    if ([string]::IsNullOrWhiteSpace($Tag)) {
        throw 'No GitHub Release found. Tag a green commit first (release.yml builds it).'
    }
}
if ($Tag -notmatch '^v[0-9A-Za-z._-]+$') { throw "Invalid tag: $Tag" }

$temp = Join-Path $env:TEMP "manhunt-release-$Tag"
Remove-Item $temp -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $temp | Out-Null

& $gh release download $Tag --pattern '*.apk' --pattern '*.sha256' --dir $temp
$apk = Get-ChildItem $temp -Recurse -Filter *.apk | Select-Object -First 1
if (-not $apk) { throw "Release $Tag has no APK asset." }

$shaFile = Get-ChildItem $temp -Recurse -Filter *.sha256 | Select-Object -First 1
$actual = (Get-FileHash $apk.FullName -Algorithm SHA256).Hash.ToLower()
if ($shaFile) {
    $expected = ((Get-Content $shaFile.FullName -Raw).Trim() -split '\s+')[0].ToLower()
    if ($expected -ne $actual) {
        throw "Release APK checksum mismatch: expected $expected, got $actual"
    }
    Write-Host 'SHA-256 verified against the release checksum.'
} else {
    Write-Warning 'Release has no .sha256 asset; publishing the APK hash anyway.'
}

New-Item -ItemType Directory -Force (Split-Path -Parent $Destination) | Out-Null
Copy-Item $apk.FullName $Destination -Force
Remove-Item $temp -Recurse -Force

Write-Host "Serving release $Tag"
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
$manifest = [ordered]@{
    versionCode = $versionCode
    versionName = $versionName
    url         = '/app.apk'
    sha256      = $actual
    size        = (Get-Item $Destination).Length
    publishedAt = (Get-Date).ToUniversalTime().ToString('o')
    notes       = "ManHunt $Tag"
}

# Prefer the release body generated from CHANGELOG.md; it is what the Updates page shows
# as the changelog. Falls back to a neutral one-liner for older releases with generated
# "Full Changelog" bodies.
try {
    $release = (& $gh release view $Tag --json body,publishedAt | ConvertFrom-Json)
    $body = ($release.body | Out-String).Trim()
    if (-not [string]::IsNullOrWhiteSpace($body) -and $body -notmatch '^Full Changelog') {
        # Keep the manifest readable in-app: drop Markdown heading markers and link syntax.
        $body = $body -replace '(?m)^#{1,6}\s*', ''
        $body = $body -replace '\[([^\]]+)\]\([^)]+\)', '$1'
        $body = $body -replace '(?m)^\*\s+', '- '
        if ($body.Length -gt 4000) { $body = $body.Substring(0, 4000).Trim() + '…' }
        $manifest.notes = $body
    }
    if ($release.publishedAt) {
        $manifest.publishedAt = ([DateTimeOffset]$release.publishedAt).ToUniversalTime().ToString('o')
    }
} catch {
    Write-Warning "Could not read release notes for $Tag; keeping the fallback notes."
}
$manifestPath = Join-Path $repoRoot 'server\data\app-latest.json'
New-Item -ItemType Directory -Force (Split-Path -Parent $manifestPath) | Out-Null
# Write UTF-8 without BOM: Android's JSON parser rejects a leading BOM.
[IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json), (New-Object System.Text.UTF8Encoding($false)))
Write-Host "Update manifest: $manifestPath (v$versionName code=$versionCode)"
