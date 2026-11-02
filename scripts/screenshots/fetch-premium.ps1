#requires -Version 5.1
<#
.SYNOPSIS
  Downloads, verifies and installs the premium screenshot set captured by the
  "Premium screenshots" GitHub Actions workflow.

.DESCRIPTION
  Pipeline:
    1. finds the chosen (or latest successful) `premium-screenshots` workflow run,
    2. downloads its artifact with `gh run download`,
    3. verifies every full frame (real PNG, exact dimensions, minimum size = blank-frame guard),
    4. copies the curated set into docs/screenshots/premium/ (old CI captures in
       docs/screenshots/*.png are left untouched),
    5. cuts the harvest crops listed in scripts/screenshots/harvest-crops.json into
       docs/screenshots/premium/harvest/ (crops only, never re-renders),
    6. writes docs/screenshots/premium/MANIFEST.json (scenario, dimensions, SHA-256 per image
       and per crop, including its source shot) and docs/screenshots/premium/contact-sheet.png.

.PARAMETER RunId
  Workflow run id to download. Defaults to the latest successful run of premium-screenshots.yml.

.PARAMETER LocalPath
  Instead of downloading, verify/install an already-downloaded artifact directory
  (the directory that contains the *.png files).

.PARAMETER UseMapAlt
  Use the second live-map capture (s07-hunt-alt.png) as the hero s07-hunt.png. Pick this
  after visually comparing the two hero frames, then re-run.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\screenshots\fetch-premium.ps1

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\screenshots\fetch-premium.ps1 -RunId 1234567890
#>
[CmdletBinding()]
param(
    [string]$RunId = '',
    [string]$Repo = '',
    [string]$ArtifactName = 'premium-screenshots',
    [string]$LocalPath = '',
    [string]$Destination = '',
    [string]$CropsPath = '',
    [switch]$UseMapAlt,
    [switch]$SkipCrops
)

$ErrorActionPreference = 'Stop'
$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$destination = if ($Destination) {
    if ([System.IO.Path]::IsPathRooted($Destination)) { $Destination } else { Join-Path (Get-Location).Path $Destination }
} else { Join-Path $repoRoot 'docs\screenshots\premium' }
$cropsFile = if ($CropsPath) { $CropsPath } else { Join-Path $PSScriptRoot 'harvest-crops.json' }
$workflowFile = 'premium-screenshots.yml'

# ---------------------------------------------------------------- expected full frames

$expected = @(
    [pscustomobject]@{ File = 's01-auth.png'; Role = 'S01-auth'; Width = 1080; Height = 2400; MinBytes = 40000; Required = $true
        Scenario = 'Auth, dark, fields empty, keyboard closed, real server row' },
    [pscustomobject]@{ File = 's02-safety.png'; Role = 'S02-safety'; Width = 1080; Height = 2400; MinBytes = 40000; Required = $true
        Scenario = 'First-run safety / before you play' },
    [pscustomobject]@{ File = 's03-home.png'; Role = 'S03-home'; Width = 1080; Height = 2400; MinBytes = 45000; Required = $true
        Scenario = 'Home dark: masthead, permanent line, host block with Riverside Run typed, join block, playing as Omar' },
    [pscustomobject]@{ File = 's04-home-rtl.png'; Role = 'S04-home-rtl'; Width = 1080; Height = 2400; MinBytes = 45000; Required = $true
        Scenario = 'Home Arabic RTL, dark' },
    [pscustomobject]@{ File = 's05-lobby-host.png'; Role = 'S05-lobby'; Width = 1080; Height = 2400; MinBytes = 45000; Required = $true
        Scenario = 'Lobby host view: Riverside Run, 5 players (2 Prey / 3 Hunters), all ready, real code' },
    [pscustomobject]@{ File = 's06-lobby-player.png'; Role = 'S06-lobby-player'; Width = 1080; Height = 2400; MinBytes = 45000; Required = $true
        Scenario = 'Lobby player view: Omar ready, Leila not ready, waiting status' },
    [pscustomobject]@{ File = 's07-hunt.png'; Role = 'S07-hunt-hero'; Width = 1080; Height = 2400; MinBytes = 150000; Required = $true
        Scenario = 'Live hunt hero: real OSM tiles, 240 m zone ring, fresh + stale prey markers, trail, clock 41:12, Tag dock' },
    [pscustomobject]@{ File = 's08-hunt-claim.png'; Role = 'S08-hunt-claim'; Width = 1080; Height = 2400; MinBytes = 100000; Required = $true
        Scenario = 'Prey view: tag claim from Tariq with review/confirm action' },
    [pscustomobject]@{ File = 's09-tag-target-sheet.png'; Role = 'S09-tag-target'; Width = 1080; Height = 2400; MinBytes = 100000; Required = $true
        Scenario = 'Tag target sheet over the map, eligible prey list' },
    [pscustomobject]@{ File = 's10-hunt-sheet.png'; Role = 'S10-hunt-sheet'; Width = 1080; Height = 2400; MinBytes = 120000; Required = $true
        Scenario = 'Hunt sheet expanded: prey reports/ages, trails toggle, attribution visible' },
    [pscustomobject]@{ File = 's11-chat.png'; Role = 'S11-chat'; Width = 1080; Height = 2400; MinBytes = 40000; Required = $true
        Scenario = 'Field log chat: seeded hunt messages, phase separator, composer empty, keyboard closed' },
    [pscustomobject]@{ File = 's12-result-hunters.png'; Role = 'S12-result-hunters'; Width = 1080; Height = 2400; MinBytes = 45000; Required = $true
        Scenario = 'Result: Hunters win, both prey tagged, full-time score' },
    [pscustomobject]@{ File = 's13-result-prey.png'; Role = 'S13-result-prey'; Width = 1080; Height = 2400; MinBytes = 45000; Required = $true
        Scenario = 'Result: Prey win variant, one prey survived' },
    [pscustomobject]@{ File = 's14-settings.png'; Role = 'S14-settings'; Width = 1080; Height = 2400; MinBytes = 40000; Required = $true
        Scenario = 'Settings: appearance (dark, text size), language, manual page' },
    [pscustomobject]@{ File = 's15-home-light.png'; Role = 'S15-home-light'; Width = 1080; Height = 2400; MinBytes = 45000; Required = $true
        Scenario = 'Home light theme' },
    [pscustomobject]@{ File = 's16-lobby-rtl.png'; Role = 'S16-lobby-rtl'; Width = 1080; Height = 2400; MinBytes = 45000; Required = $false
        Scenario = 'Lobby Arabic RTL' },
    [pscustomobject]@{ File = 's17-empty-chat.png'; Role = 'S17-empty-chat'; Width = 1080; Height = 2400; MinBytes = 40000; Required = $false
        Scenario = 'Empty chat state ("No messages yet")' },
    [pscustomobject]@{ File = 's18-auth-loading.png'; Role = 'S18-auth-loading'; Width = 1080; Height = 2400; MinBytes = 40000; Required = $false
        Scenario = 'Auth submit loading state' },
    [pscustomobject]@{ File = 's19-auth-error.png'; Role = 'S19-auth-error'; Width = 1080; Height = 2400; MinBytes = 40000; Required = $false
        Scenario = 'Auth server-error state' },
    [pscustomobject]@{ File = 's07-hunt-wide.png'; Role = 'S07-hunt-wide'; Width = 2400; Height = 1080; MinBytes = 150000; Required = $false
        Scenario = 'Landscape live-hunt map band (2400x1080)' }
)

# Raw alternates are never installed into docs/screenshots/premium.
$alternates = @('s07-hunt-alt.png')

# Installation order (fractional prefixes sort predictably on disk and in the contact sheet).
$installOrder = @(
    's01-auth.png', 's02-safety.png', 's03-home.png', 's04-home-rtl.png', 's05-lobby-host.png',
    's06-lobby-player.png', 's07-hunt.png', 's07-hunt-wide.png', 's08-hunt-claim.png',
    's09-tag-target-sheet.png', 's10-hunt-sheet.png', 's11-chat.png', 's12-result-hunters.png',
    's13-result-prey.png', 's14-settings.png', 's15-home-light.png', 's16-lobby-rtl.png',
    's17-empty-chat.png', 's18-auth-loading.png', 's19-auth-error.png'
)

# ---------------------------------------------------------------- helpers

function Write-Step([string]$message) {
    Write-Host "`n=== $message ===" -ForegroundColor Cyan
}

function Get-PngDimensions([string]$path) {
    $bytes = [System.IO.File]::ReadAllBytes($path)
    if ($bytes.Length -lt 24) { return $null }
    $signature = (($bytes[0..7] | ForEach-Object { $_.ToString('x2') }) -join '')
    if ($signature -ne '89504e470d0a1a0a') { return $null }
    $width = ([int]$bytes[16] -shl 24) -bor ([int]$bytes[17] -shl 16) -bor ([int]$bytes[18] -shl 8) -bor [int]$bytes[19]
    $height = ([int]$bytes[20] -shl 24) -bor ([int]$bytes[21] -shl 16) -bor ([int]$bytes[22] -shl 8) -bor [int]$bytes[23]
    return [pscustomobject]@{ Width = $width; Height = $height }
}

function Get-Sha256([string]$path) {
    return (Get-FileHash -Path $path -Algorithm SHA256).Hash.ToLowerInvariant()
}

function Resolve-Repo {
    if ($Repo) { return $Repo }
    try {
        $url = (& git -C $repoRoot remote get-url origin 2>$null)
        if ($LASTEXITCODE -eq 0 -and $url -match 'github\.com[:/](?<slug>[^/]+/[^/.]+)') {
            return $Matches['slug']
        }
    } catch { }
    throw 'Could not determine the GitHub repository; pass -Repo owner/name.'
}

function Resolve-RunId([string]$repository) {
    if ($RunId) { return $RunId }
    Write-Step "Looking up the latest successful '$workflowFile' run"
    $raw = & gh run list --repo $repository --workflow $workflowFile --limit 20 --json databaseId,status,conclusion,headSha,createdAt,displayTitle 2>$null
    if ($LASTEXITCODE -ne 0 -or -not $raw) {
        throw "gh run list failed. Is the workflow committed to the default branch and is 'gh' authenticated?"
    }
    $runs = $raw | ConvertFrom-Json
    $success = $runs | Where-Object { $_.status -eq 'completed' -and $_.conclusion -eq 'success' } | Select-Object -First 1
    if (-not $success) {
        $latest = $runs | Select-Object -First 1
        if ($latest) {
            throw ("No successful premium-screenshots run yet (latest run {0} is {1}). See: gh run view {0} --log-failed" -f $latest.databaseId, $latest.conclusion)
        }
        throw "No premium-screenshots workflow runs found. Trigger one: gh workflow run $workflowFile --ref master"
    }
    return "$($success.databaseId)"
}

# ---------------------------------------------------------------- download + verify

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    throw "GitHub CLI 'gh' is not installed or not on PATH."
}

$repository = Resolve-Repo
$sourceDir = ''
$runInfo = $null

if ($LocalPath) {
    $sourceDir = (Resolve-Path -LiteralPath $LocalPath).Path
    Write-Step "Using local artifact directory $sourceDir"
} else {
    $resolvedRunId = Resolve-RunId $repository
    Write-Step "Downloading premium-screenshots artifact from run $resolvedRunId ($repository)"
    $downloadDir = Join-Path $repoRoot ("scripts\screenshots\.artifacts\{0}" -f $resolvedRunId)
    if (Test-Path $downloadDir) { Remove-Item $downloadDir -Recurse -Force }
    New-Item -ItemType Directory -Force -Path (Split-Path $downloadDir) | Out-Null
    & gh run download $resolvedRunId --repo $repository --name $ArtifactName --dir $downloadDir
    if ($LASTEXITCODE -ne 0) {
        throw "gh run download failed for run $resolvedRunId. Check: gh run view $resolvedRunId --repo $repository"
    }
    $sourceDir = $downloadDir
    try {
        $runInfo = (& gh run view $resolvedRunId --repo $repository --json headSha,url,createdAt,displayTitle,workflowName 2>$null) | ConvertFrom-Json
    } catch {
        $runInfo = $null
    }
}

Write-Step 'Verifying captured full frames'

# The capture metadata travels with the artifact (no tokens): room/scenario, timings,
# pending shots and honest data gaps. Read it before verification so pending shots are
# allowed to be absent (recorded, never substituted with old UI).
$meta = $null
$metaPath = Join-Path $sourceDir 'capture-meta.json'
if (Test-Path $metaPath) {
    try { $meta = Get-Content $metaPath -Raw | ConvertFrom-Json } catch { $meta = $null }
}
$pending = @()
if ($meta -and $meta.pending) {
    $pending = @($meta.pending | ForEach-Object { "$_".Trim().ToLowerInvariant() } | Where-Object { $_ })
}
$dataGaps = @()
if ($meta -and $meta.dataGaps) { $dataGaps = @($meta.dataGaps | ForEach-Object { "$_" }) }

function Test-IsPending([object]$spec) {
    $short = $spec.File.Substring(0, 3).ToLowerInvariant()
    $base = $spec.File.ToLowerInvariant() -replace '\.png$', ''
    foreach ($entry in $pending) {
        if ($entry -eq $short -or $entry -eq $base -or $entry -eq $spec.Role.ToLowerInvariant()) { return $true }
    }
    return $false
}

$verified = New-Object System.Collections.Generic.List[object]
$pendingRecords = New-Object System.Collections.Generic.List[object]
$failures = New-Object System.Collections.Generic.List[string]
foreach ($spec in $expected) {
    $path = Join-Path $sourceDir $spec.File
    if (-not (Test-Path $path)) {
        if ($spec.Required) {
            if (Test-IsPending $spec) {
                # A pending shot is allowed to be absent: record it in the manifest, never fake it.
                $pendingRecords.Add([pscustomobject]@{
                    File     = $spec.File
                    Role     = $spec.Role
                    Scenario = $spec.Scenario
                    Width    = $spec.Width
                    Height   = $spec.Height
                })
                Write-Host ("pend {0}  (not in this verified build; recorded in MANIFEST)" -f $spec.File)
            } else {
                $failures.Add("$($spec.File): missing")
            }
        }
        continue
    }
    $dimensions = Get-PngDimensions $path
    $bytes = (Get-Item $path).Length
    if (-not $dimensions) {
        $failures.Add("$($spec.File): not a valid PNG")
        continue
    }
    if ($dimensions.Width -ne $spec.Width -or $dimensions.Height -ne $spec.Height) {
        $failures.Add("$($spec.File): $($dimensions.Width)x$($dimensions.Height), expected $($spec.Width)x$($spec.Height)")
        continue
    }
    if ($bytes -lt $spec.MinBytes) {
        $failures.Add("$($spec.File): only $bytes bytes (< $($spec.MinBytes)); likely blank")
        continue
    }
    $verified.Add([pscustomobject]@{
        File     = $spec.File
        Role     = $spec.Role
        Scenario = $spec.Scenario
        Width    = $dimensions.Width
        Height   = $dimensions.Height
        Bytes    = $bytes
        Sha256   = (Get-Sha256 $path)
        Required = $spec.Required
        Pending  = (Test-IsPending $spec)
    })
    $state = if (-not $spec.Required) { 'ok* ' } elseif (Test-IsPending $spec) { 'pend ' } else { 'ok  ' }
    Write-Host ("{0}{1}  {2}x{3}  {4} KiB" -f $state, $spec.File, $dimensions.Width, $dimensions.Height, [math]::Round($bytes / 1KB))
}

if ($pendingRecords.Count -gt 0) {
    Write-Host ("`npending shots recorded (not captured in this verified build): " + (($pendingRecords | ForEach-Object { $_.File }) -join ', ')) -ForegroundColor Yellow
}

if ($failures.Count -gt 0) {
    Write-Host "`nThe capture set failed verification:" -ForegroundColor Red
    $failures | ForEach-Object { Write-Host " - $_" -ForegroundColor Red }
    Write-Host "`nRaw artifact: $sourceDir"
    Write-Host 'Re-run the workflow after fixing the capture; do not publish a partial set.'
    exit 1
}

if ($UseMapAlt) {
    $altPath = Join-Path $sourceDir 's07-hunt-alt.png'
    if (Test-Path $altPath) {
        $mapRecord = $verified | Where-Object { $_.File -eq 's07-hunt.png' }
        $altDimensions = Get-PngDimensions $altPath
        if ($mapRecord -and $altDimensions -and $altDimensions.Width -eq 1080 -and $altDimensions.Height -eq 2400) {
            Write-Host "`nUsing s07-hunt-alt.png as the hero s07-hunt.png" -ForegroundColor Yellow
            $mapRecord.Sha256 = (Get-Sha256 $altPath)
            $mapRecord.Bytes = (Get-Item $altPath).Length
            $script:heroSwapSource = $altPath
        } else {
            Write-Warning 's07-hunt-alt.png is missing or invalid; keeping the first hero frame.'
        }
    } else {
        Write-Warning 's07-hunt-alt.png not present in the artifact; keeping the first hero frame.'
    }
}
$heroSwapSource = Get-Variable -Name heroSwapSource -ValueOnly -ErrorAction SilentlyContinue

# ---------------------------------------------------------------- install full frames

Write-Step "Installing the curated set into docs/screenshots/premium"
New-Item -ItemType Directory -Force -Path $destination | Out-Null
Get-ChildItem $destination -Filter '*.png' -File -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem (Join-Path $destination 'harvest') -Filter '*.png' -File -ErrorAction SilentlyContinue | Remove-Item -Force

foreach ($file in $installOrder) {
    $record = $verified | Where-Object { $_.File -eq $file }
    if (-not $record) { continue }
    $sourcePath = Join-Path $sourceDir $file
    if ($file -eq 's07-hunt.png' -and $heroSwapSource) { $sourcePath = $heroSwapSource }
    Copy-Item -LiteralPath $sourcePath -Destination (Join-Path $destination $file) -Force
}

# ---------------------------------------------------------------- harvest crops

$crops = New-Object System.Collections.Generic.List[object]
$harvestDir = Join-Path $destination 'harvest'
if (-not $SkipCrops) {
    if (-not (Test-Path $cropsFile)) {
        Write-Warning "Crop spec not found: $cropsFile (skipping harvest crops)"
    } else {
        Write-Step 'Cutting harvest crops'
        New-Item -ItemType Directory -Force -Path $harvestDir | Out-Null
        Add-Type -AssemblyName System.Drawing
        $spec = Get-Content $cropsFile -Raw | ConvertFrom-Json
        foreach ($crop in $spec.crops) {
            $sourceFile = Join-Path $destination $crop.source
            if (-not (Test-Path $sourceFile)) {
                Write-Warning "crop $($crop.name): source $($crop.source) missing"
                continue
            }
            $sourceImage = [System.Drawing.Image]::FromFile($sourceFile)
            try {
                $x = [int]$crop.x
                $y = [int]$crop.y
                $w = [int]$crop.width
                $h = [int]$crop.height
                if ($x -lt 0 -or $y -lt 0 -or ($x + $w) -gt $sourceImage.Width -or ($y + $h) -gt $sourceImage.Height) {
                    Write-Warning "crop $($crop.name): rectangle $x,$y ${w}x${h} outside $($sourceImage.Width)x$($sourceImage.Height)"
                    continue
                }
                $expectedAspect = switch ($crop.aspect) {
                    '16:9' { 16 / 9 }
                    '3:2' { 3 / 2 }
                    '4:5' { 4 / 5 }
                    '1:1' { 1 }
                    default { $null }
                }
                if ($expectedAspect -and ([math]::Abs(($w / $h) - $expectedAspect) -gt 0.01)) {
                    Write-Warning "crop $($crop.name): ${w}x${h} is not $($crop.aspect)"
                    continue
                }
                $outputPath = Join-Path $harvestDir ($crop.name + '.png')
                $bitmap = New-Object System.Drawing.Bitmap($w, $h)
                $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $destinationRect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
                $sourceRect = New-Object System.Drawing.Rectangle($x, $y, $w, $h)
                $graphics.DrawImage($sourceImage, $destinationRect, $sourceRect, [System.Drawing.GraphicsUnit]::Pixel)
                $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
                $graphics.Dispose()
                $bitmap.Dispose()
                $dimensions = Get-PngDimensions $outputPath
                $crops.Add([pscustomobject]@{
                    Name        = $crop.name
                    File        = "harvest/$($crop.name).png"
                    SourceShot  = $crop.source
                    Aspect      = $crop.aspect
                    Width       = $dimensions.Width
                    Height      = $dimensions.Height
                    Bytes       = (Get-Item $outputPath).Length
                    Sha256      = (Get-Sha256 $outputPath)
                    Description = $crop.note
                })
                Write-Host ("  {0}  {1}x{2}  from {3}" -f $crop.name, $dimensions.Width, $dimensions.Height, $crop.source)
            } finally {
                $sourceImage.Dispose()
            }
        }
    }
}

# ---------------------------------------------------------------- MANIFEST.json

Write-Step 'Writing MANIFEST.json'
$commit = ''
if ($runInfo -and $runInfo.headSha) { $commit = $runInfo.headSha }
elseif ($meta -and $meta.commit -and $meta.commit -ne 'unknown') { $commit = $meta.commit }
else {
    try { $commit = (& git -C $repoRoot rev-parse HEAD 2>$null) } catch { $commit = 'unknown' }
}

$gameInfo = [ordered]@{
    name     = 'Riverside Run'
    roomCode = if ($meta -and $meta.roomCode) { $meta.roomCode } else { $null }
    players  = @(
        [ordered]@{ username = 'Yasmin'; team = 'prey'; role = 'host (Prey)' },
        [ordered]@{ username = 'Leila'; team = 'prey'; role = 'Prey (stale report, no trail)' },
        [ordered]@{ username = 'Omar'; team = 'hunters'; role = 'capture device (Hunter)' },
        [ordered]@{ username = 'Tariq'; team = 'hunters'; role = 'Hunter' },
        [ordered]@{ username = 'Sara'; team = 'hunters'; role = 'Hunter' }
    )
    state = 'Lobby (all ready) -> live hunt 41:12 remaining/18:48 played (fresh + stale reports, trail, 240 m zone) -> claim -> Hunters win (0/2) -> rematch: honest Prey-win state (data-gap: survivor count unavailable)'
}
if ($meta -and $meta.players) {
    $gameInfo.players = @($meta.players | ForEach-Object { [ordered]@{ username = $_.username; team = $_.team } })
}

$manifest = [ordered]@{
    title       = 'ManHunt premium screenshots'
    shotlist    = 'design/redesign/screenshot-shotlist.md'
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    source      = 'Real Android emulator capture of the ManHunt debug build (no mockups, no compositing)'
    workflow    = [ordered]@{
        name   = $workflowFile
        runId  = if ($RunId) { $RunId } else { $null }
        runUrl = if ($runInfo) { $runInfo.url } else { $null }
        commit = $commit
        repo   = $repository
    }
    device      = 'Android emulator, Pixel 6 profile (1080x2400 @ 420 dpi), Android 16 / API 36'
    theme       = 'Dark (Deep Teal night palette) except s15-home-light.png (light) and the RTL set'
    language    = 'English; s04-home-rtl.png and s16-lobby-rtl.png are Arabic RTL'
    statusBar   = 'SystemUI demo mode: clock 21:04, battery 100% unplugged, clean cellular signal (no Wi-Fi warning badge), notifications hidden'
    timings     = [ordered]@{
        huntingStarted       = if ($meta -and $meta.timings) { $meta.timings.huntingStarted } else { '20:45:12' }
        remainingAtCapture   = if ($meta -and $meta.timings) { $meta.timings.remainingAtCapture } else { '41:12' }
        finalPlayedDuration  = if ($meta -and $meta.timings) { $meta.timings.finalPlayedDuration } else { '18:48' }
        chatWindow           = if ($meta -and $meta.timings) { $meta.timings.chatWindow } else { '20:46-20:52' }
    }
    mapTiles    = 'Live OpenStreetMap raster tiles (copyright OpenStreetMap contributors), Riverside Park, Manhattan; zone centre 40.7995, -73.9735, radius 240 m'
    game        = $gameInfo
    pending     = @($pendingRecords | ForEach-Object { $_.File })
    dataGaps    = @($dataGaps)
    images      = @()
    crops       = @()
    notes       = @(
        'Full frames are 1080x2400 portrait PNGs (s07-hunt-wide.png, when the optional landscape capture is enabled, is 2400x1080).',
        'Harvest crops are cut from the captured full frames only (no stretching, no re-render); each crop records its source shot.',
        'The old CI/Robolectric captures in docs/screenshots/*.png are untouched for comparison.',
        'Hero shots for the site/GitHub page: s07-hunt.png (vertical) plus harvest/map-hero-16x9.png and harvest/map-hero-3x2.png ready-made site bands (cut from the captured full frame).',
        's07-hunt-alt.png is a raw alternate hero frame kept only in the workflow artifact, not in this folder.',
        'Result timing: 41:12 is the remaining time at the S07 moment; the finished match ran 18:48 (never "41:12 played").',
        'S13 data-gap: survivor count unavailable - the server resets eliminations at match finish, so the app can only expose the honest Prey-win state.',
        'Pending shots are screens not captured/clean in the verified build run (listed above); they are omitted and recorded here, never substituted with old UI.'
    )
}
foreach ($file in $installOrder) {
    $record = $verified | Where-Object { $_.File -eq $file }
    if (-not $record) { continue }
    $manifest.images += [ordered]@{
        file     = $record.File
        role     = $record.Role
        scenario = $record.Scenario
        width    = $record.Width
        height   = $record.Height
        bytes    = $record.Bytes
        sha256   = $record.Sha256
        required = $record.Required
        status   = if ($record.Pending) { 'pending' } else { 'captured' }
    }
}
foreach ($pendingRecord in $pendingRecords) {
    $manifest.images += [ordered]@{
        file     = $pendingRecord.File
        role     = $pendingRecord.Role
        scenario = $pendingRecord.Scenario
        width    = $pendingRecord.Width
        height   = $pendingRecord.Height
        bytes    = $null
        sha256   = $null
        required = $false
        status   = 'pending'
    }
}
foreach ($crop in $crops) {
    $manifest.crops += [ordered]@{
        file        = $crop.File
        name        = $crop.Name
        source      = $crop.SourceShot
        aspect      = $crop.Aspect
        width       = $crop.Width
        height      = $crop.Height
        bytes       = $crop.Bytes
        sha256      = $crop.Sha256
        description = $crop.Description
    }
}
$json = $manifest | ConvertTo-Json -Depth 8
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText((Join-Path $destination 'MANIFEST.json'), $json + "`n", $utf8NoBom)

# ---------------------------------------------------------------- contact sheet

function New-ContactSheet {
    param([string]$OutputPath, [string[]]$Files)
    Add-Type -AssemblyName System.Drawing
    $columns = 4
    $thumbWidth = 260
    $gap = 20
    $labelHeight = 44
    $titleHeight = 92

    $items = New-Object System.Collections.Generic.List[object]
    foreach ($file in $Files) {
        $path = Join-Path $destination $file
        if (-not (Test-Path $path)) { continue }
        $image = [System.Drawing.Image]::FromFile($path)
        $items.Add([pscustomobject]@{
            File        = $file
            Image       = $image
            ThumbHeight = [int][math]::Round($thumbWidth * $image.Height / $image.Width)
        })
    }
    if ($items.Count -eq 0) { return }

    $rows = New-Object System.Collections.Generic.List[object]
    for ($index = 0; $index -lt $items.Count; $index += $columns) {
        $chunk = $items[$index..([math]::Min($index + $columns - 1, $items.Count - 1))]
        $rowHeight = ($chunk | Measure-Object -Property ThumbHeight -Maximum).Maximum
        $rows.Add([pscustomobject]@{ Items = $chunk; Height = $rowHeight + $labelHeight })
    }

    $canvasWidth = $gap + $columns * ($thumbWidth + $gap)
    $canvasHeight = $titleHeight + ($rows | Measure-Object -Property Height -Sum).Sum + $gap
    $bitmap = New-Object System.Drawing.Bitmap($canvasWidth, $canvasHeight)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([System.Drawing.Color]::FromArgb(11, 18, 32))
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias
    $titleFont = New-Object System.Drawing.Font('Segoe UI', 20, [System.Drawing.FontStyle]::Bold)
    $subtitleFont = New-Object System.Drawing.Font('Segoe UI', 10)
    $labelFont = New-Object System.Drawing.Font('Segoe UI', 9)
    $titleBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 237, 247))
    $mutedBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(167, 182, 204))
    $accentBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 211, 238))

    $graphics.DrawString('MANHUNT  -  premium screenshots', $titleFont, $titleBrush, $gap, 20)
    $graphics.DrawString('Riverside Run  |  real emulator capture  |  1080x2400 + 2400x1080 band  |  shotlist S01-S19', $subtitleFont, $mutedBrush, $gap, 58)

    $y = $titleHeight
    foreach ($row in $rows) {
        $x = $gap
        foreach ($item in $row.Items) {
            $destinationRect = New-Object System.Drawing.Rectangle($x, $y, $thumbWidth, $item.ThumbHeight)
            $graphics.DrawImage($item.Image, $destinationRect)
            $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(58, 72, 103), 1)
            $graphics.DrawRectangle($pen, $destinationRect)
            $pen.Dispose()
            $graphics.DrawString($item.File, $labelFont, $accentBrush, ($x + 2), ($y + $item.ThumbHeight + 5))
            $graphics.DrawString('ManHunt', $labelFont, $mutedBrush, ($x + 2), ($y + $item.ThumbHeight + 20))
            $x += $thumbWidth + $gap
        }
        $y += $row.Height
    }

    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    foreach ($item in $items) { $item.Image.Dispose() }
    $graphics.Dispose()
    $bitmap.Dispose()
    $titleFont.Dispose(); $subtitleFont.Dispose(); $labelFont.Dispose()
    $titleBrush.Dispose(); $mutedBrush.Dispose(); $accentBrush.Dispose()
}

function New-ContactSheetSafe {
    param([string]$OutputPath, [string[]]$Files)
    try {
        New-ContactSheet -OutputPath $OutputPath -Files $Files
        Write-Host "contact sheet: $OutputPath"
    } catch {
        Write-Warning "Could not render the contact sheet: $($_.Exception.Message)"
    }
}

Write-Step 'Rendering contact sheet'
$installedFiles = @($installOrder | Where-Object { Test-Path (Join-Path $destination $_) })
New-ContactSheetSafe -OutputPath (Join-Path $destination 'contact-sheet.png') -Files $installedFiles

# ---------------------------------------------------------------- report

Write-Step 'Premium set installed'
Write-Host "Directory: $destination"
Get-ChildItem $destination -File | Sort-Object Name | Select-Object Name, @{ Name = 'KiB'; Expression = { [math]::Round($_.Length / 1KB) } } | Format-Table -AutoSize
if ($crops.Count -gt 0) {
    Write-Host 'Harvest crops:'
    $crops | Select-Object File, Width, Height, SourceShot | Format-Table -AutoSize
}
Write-Host 'Site/GitHub-ready shots:' -ForegroundColor Green
Write-Host '  Map hero:          s07-hunt.png (1080x2400) + s07-hunt-wide.png (2400x1080) + harvest/map-hero-16x9.png'
Write-Host '  README set:        s03-home, s05-lobby-host, s07-hunt, s12-result-hunters (+ harvest/home-line-16x9, harvest/result-score-4x5)'
Write-Host '  Extras:            s01-auth, s02-safety, s04-home-rtl, s06-lobby-player, s08-hunt-claim, s09-tag-target-sheet,'
Write-Host '                     s10-hunt-sheet, s11-chat, s13-result-prey, s14-settings, s15-home-light, s16-lobby-rtl, s17-s19 states'
Write-Host 'MANIFEST.json records scenario, dimensions, SHA-256, crop provenance, pending shots and data gaps.'
if ($pendingRecords.Count -gt 0) {
    Write-Host ("PENDING shots (not redesigned in the verified build; recorded, not substituted): " + (($pendingRecords | ForEach-Object { $_.File }) -join ', ')) -ForegroundColor Yellow
}
if ($dataGaps.Count -gt 0) {
    Write-Host 'DATA GAPS recorded in MANIFEST:'
    $dataGaps | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}
Write-Host 'Old CI captures in docs/screenshots/*.png were not modified.'

