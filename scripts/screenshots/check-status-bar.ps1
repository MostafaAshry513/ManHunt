<#
.SYNOPSIS
  Delivery gate: verifies that premium screenshots contain NO system status bar and can crop
  it cleanly (fallback) if the emulator's immersive-status hide did not take effect.

.DESCRIPTION
  The capture driver applies `settings put global policy_control "immersive.status=*"` before
  the delivery frames. This script independently checks the result against reference strips
  captured with the demo status bar visible:

    reference/statusbar-1080x96.png        dark status bar  (white glyphs on navy)
    reference/statusbar-light-1080x96.png  light status bar (dark glyphs on light theme)

  For every 1080-wide PNG at the top of SourceDir it measures glyph-template coverage and
  precision, writes a top-strip proof sheet for human review, and (with -OutDir) crops the
  top CropHeight pixels for frames confirmed as still containing the bar. Only the system bar
  is removed - no UI is redrawn, edited or invented.

.PARAMETER SourceDir
  Directory with captured PNGs (non-recursive; 1080-wide delivery frames expected).

.PARAMETER OutDir
  Optional directory receiving cropped copies (same filenames). Without it, check only.

.PARAMETER OnlyFiles
  Optional file names (comma separated) to crop even if auto-detection is ambiguous. Use after
  reviewing the proof sheet: -OnlyFiles "s03-home.png,s15-home-light.png".

.PARAMETER CropHeight
  Height removed from the top when cropping (default 96 px; emulator status-bar height).

.PARAMETER RequireClean
  Exit 1 when frames remain with a visible status bar and no crop is produced.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\screenshots\check-status-bar.ps1 -SourceDir scripts\screenshots\out
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$SourceDir,
    [string]$OutDir = '',
    [string]$ReportPath = '',
    [string]$OnlyFiles = '',
    [int]$CropHeight = 96,
    [switch]$RequireClean,
    [switch]$SkipProof
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$scriptDir = Split-Path -Parent $PSCommandPath
$root = Split-Path -Parent (Split-Path -Parent $scriptDir)

function Resolve-UnderRoot([string]$path) {
    if (-not $path) { return '' }
    if ([System.IO.Path]::IsPathRooted($path)) { return $path }
    return (Join-Path $root $path)
}

$source = Resolve-UnderRoot $SourceDir
$out = Resolve-UnderRoot $OutDir
if (-not (Test-Path $source)) { throw "source directory not found: $source" }
if ($out) { New-Item -ItemType Directory -Force -Path $out | Out-Null }

if ($ReportPath) { $reportPath = Resolve-UnderRoot $ReportPath }
elseif ($out) { $reportPath = Join-Path $out 'statusbar-check.json' }
else { $reportPath = Join-Path $source 'statusbar-check.json' }

$cropSet = @()
if ($OnlyFiles) { $cropSet = @($OnlyFiles.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ }) }

$refSpecs = @(
    [pscustomobject]@{ Name = 'dark'; Path = (Join-Path $scriptDir 'reference\statusbar-1080x96.png'); Mode = 'bright'; Threshold = 110; MinCoverage = 0.90; MinPrecision = 0.60 },
    [pscustomobject]@{ Name = 'light'; Path = (Join-Path $scriptDir 'reference\statusbar-light-1080x96.png'); Mode = 'dark'; Threshold = 120; MinCoverage = 0.85; MinPrecision = 0.80 }
)

# ---------------------------------------------------------------- reference masks
$references = New-Object System.Collections.Generic.List[object]
foreach ($spec in $refSpecs) {
    if (-not (Test-Path $spec.Path)) { continue }
    $img = [System.Drawing.Image]::FromFile($spec.Path)
    try {
        $bmp = New-Object System.Drawing.Bitmap($img)
        try {
            $w = $bmp.Width; $h = $bmp.Height
            $mask = New-Object System.Collections.Generic.List[object]
            $maskKeys = New-Object System.Collections.Generic.HashSet[string]
            for ($y = 0; $y -lt $h; $y++) {
                for ($x = 0; $x -lt $w; $x++) {
                    $c = $bmp.GetPixel($x, $y)
                    $lum = 0.2126 * $c.R + 0.7152 * $c.G + 0.0722 * $c.B
                    $isInk = if ($spec.Mode -eq 'bright') { $lum -gt $spec.Threshold } else { $lum -lt $spec.Threshold }
                    if ($isInk) { $mask.Add([pscustomobject]@{ X = $x; Y = $y }); [void]$maskKeys.Add("$x,$y") }
                }
            }
            if ($mask.Count -lt 200) { continue }
            $references.Add([pscustomobject]@{
                Name = $spec.Name; Width = $w; Height = $h; Mode = $spec.Mode; Threshold = $spec.Threshold
                MinCoverage = $spec.MinCoverage; MinPrecision = $spec.MinPrecision
                Mask = $mask; MaskKeys = $maskKeys
            })
        } finally { $bmp.Dispose() }
    } finally { $img.Dispose() }
}
if ($references.Count -eq 0) { throw 'no usable status-bar reference strips found' }
$expectedWidth = $references[0].Width

function Measure-Strip([string]$path, $reference) {
    $img = [System.Drawing.Image]::FromFile($path)
    try {
        $bmp = New-Object System.Drawing.Bitmap($img)
        try {
            if ($bmp.Width -ne $reference.Width) { return $null }
            $hit = 0
            foreach ($p in $reference.Mask) {
                $c = $bmp.GetPixel($p.X, $p.Y)
                $lum = 0.2126 * $c.R + 0.7152 * $c.G + 0.0722 * $c.B
                if ($reference.Mode -eq 'bright') { if ($lum -gt $reference.Threshold) { $hit++ } }
                else { if ($lum -lt $reference.Threshold) { $hit++ } }
            }
            $coverage = $hit / $reference.Mask.Count
            $inkPixels = 0
            $inkOnMask = 0
            for ($y = 0; $y -lt $reference.Height; $y++) {
                for ($x = 0; $x -lt $reference.Width; $x++) {
                    $c = $bmp.GetPixel($x, $y)
                    $lum = 0.2126 * $c.R + 0.7152 * $c.G + 0.0722 * $c.B
                    $isInk = if ($reference.Mode -eq 'bright') { $lum -gt $reference.Threshold } else { $lum -lt $reference.Threshold }
                    if ($isInk) {
                        $inkPixels++
                        if ($reference.MaskKeys.Contains("$x,$y")) { $inkOnMask++ }
                    }
                }
            }
            $precision = if ($inkPixels -gt 0) { $inkOnMask / $inkPixels } else { 0 }
            return [pscustomobject]@{
                Reference = $reference.Name
                Coverage  = [math]::Round($coverage, 4)
                Precision = [math]::Round($precision, 4)
                Visible   = [bool]($coverage -ge $reference.MinCoverage -and $precision -ge $reference.MinPrecision)
            }
        } finally { $bmp.Dispose() }
    } finally { $img.Dispose() }
}

function Get-ImageSize([string]$path) {
    $img = [System.Drawing.Image]::FromFile($path)
    try { return [pscustomobject]@{ Width = $img.Width; Height = $img.Height } } finally { $img.Dispose() }
}

function Crop-Top([string]$inPath, [string]$outPath, [int]$height) {
    $img = [System.Drawing.Image]::FromFile($inPath)
    try {
        $newH = $img.Height - $height
        if ($newH -le 0) { throw "crop height $height leaves no image for $inPath" }
        $bmp = New-Object System.Drawing.Bitmap($img.Width, $newH)
        try {
            $g = [System.Drawing.Graphics]::FromImage($bmp)
            try {
                $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $img.Width, $newH)), (New-Object System.Drawing.Rectangle(0, $height, $img.Width, $newH)), [System.Drawing.GraphicsUnit]::Pixel)
            } finally { $g.Dispose() }
            $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
        } finally { $bmp.Dispose() }
    } finally { $img.Dispose() }
}

# ---------------------------------------------------------------- check every frame
$files = @(Get-ChildItem -LiteralPath $source -Filter '*.png' -File | Sort-Object Name)
if ($files.Count -eq 0) { throw "no PNG files in $source" }

$records = New-Object System.Collections.Generic.List[object]
foreach ($file in $files) {
    $size = Get-ImageSize $file.FullName
    if ($size.Width -ne $expectedWidth) {
        $records.Add([pscustomobject]@{
            file = $file.Name; width = $size.Width; height = $size.Height
            flags = @(); statusBarVisible = $false; action = 'skipped:not-a-1080-wide-delivery-frame'
            output = $null; sha256 = (Get-FileHash $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        })
        continue
    }
    $measurements = @()
    $visible = $false
    foreach ($reference in $references) {
        $m = Measure-Strip $file.FullName $reference
        if ($null -ne $m) { $measurements += $m; if ($m.Visible) { $visible = $true } }
    }
    $cropRequested = ($cropSet.Count -eq 0) -or ($cropSet -contains $file.Name)
    $action = 'clean'
    $outputPath = $null
    if ($visible -and $out -and $cropRequested) {
        $outputPath = Join-Path $out $file.Name
        Crop-Top $file.FullName $outputPath $CropHeight
        $stillVisible = $false
        foreach ($reference in $references) {
            $recheck = Measure-Strip $outputPath $reference
            if ($null -ne $recheck -and $recheck.Visible) { $stillVisible = $true }
        }
        $action = if ($stillVisible) { "cropped:$CropHeight (STILL VISIBLE - review)" } else { "cropped:$CropHeight" }
    } elseif ($visible) {
        $action = 'visible (no crop requested)'
    } elseif ($out) {
        # No status bar: copy the clean frame so OutDir is always a complete delivery set.
        $outputPath = Join-Path $out $file.Name
        Copy-Item -LiteralPath $file.FullName -Destination $outputPath -Force
        $action = 'clean (copied)'
    }
    $records.Add([pscustomobject]@{
        file = $file.Name; width = $size.Width; height = $size.Height
        flags = @($measurements | ForEach-Object { [pscustomobject]@{ reference = $_.Reference; coverage = $_.Coverage; precision = $_.Precision; visible = $_.Visible } })
        statusBarVisible = [bool]$visible
        action = $action
        output = $outputPath
        sha256 = (Get-FileHash $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
    })
}

# ---------------------------------------------------------------- top-strip proof sheet
$proofPath = $null
if (-not $SkipProof) {
    $stripRows = 160
    $rowH = 120
    $proofH = 70 + $records.Count * $rowH
    $proof = New-Object System.Drawing.Bitmap(1080, $proofH)
    $g = [System.Drawing.Graphics]::FromImage($proof)
    try {
        $g.Clear([System.Drawing.Color]::FromArgb(11, 18, 32))
        $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
        $font = New-Object System.Drawing.Font('Consolas', 11)
        $white = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(230, 237, 247))
        $coral = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 122, 89))
        $cyan = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(34, 211, 238))
        try {
            $g.DrawString('STATUS-BAR PROOF - first 160 px, 50% scale. CLEAN = app content at row 0; FLAG = review/crop.', $font, $white, 12, 10)
            $row = 0
            foreach ($rec in $records) {
                $y = 40 + $row * $rowH
                $flag = if ($rec.statusBarVisible) { 'FLAG' } else { 'CLEAN' }
                $text = "$($rec.file)  [$flag]  $($rec.action)"
                $brush = if ($rec.statusBarVisible) { $coral } else { $cyan }
                $g.DrawString($text, $font, $brush, 12, $y)
                $img = [System.Drawing.Image]::FromFile((Join-Path $source $rec.file))
                try {
                    $srcRect = New-Object System.Drawing.Rectangle(0, 0, $img.Width, [math]::Min($stripRows, $img.Height))
                    $dstRect = New-Object System.Drawing.Rectangle(12, ($y + 20), [int]($img.Width * 0.5), [int]($srcRect.Height * 0.5))
                    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                    $g.DrawImage($img, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
                } finally { $img.Dispose() }
                $row++
            }
        } finally { $font.Dispose(); $white.Dispose(); $coral.Dispose(); $cyan.Dispose() }
    } finally { $g.Dispose() }
    $proofDir = if ($out) { $out } else { $source }
    $proofPath = Join-Path $proofDir 'statusbar-topstrips.png'
    $proof.Save($proofPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $proof.Dispose()
}

# ---------------------------------------------------------------- report
$refJsonInfo = @()
foreach ($reference in $references) {
    $refJsonInfo += [pscustomobject]@{ name = $reference.Name; width = $reference.Width; height = $reference.Height; mode = $reference.Mode; threshold = $reference.Threshold }
}
$anyVisible = $false
$croppedAny = $false
foreach ($recordItem in $records) {
    if ($recordItem.statusBarVisible) { $anyVisible = $true }
    $recordAction = [string]$recordItem.action
    if ($recordAction.StartsWith('cropped:')) { $croppedAny = $true }
}
$payload = [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    sourceDir   = $source
    cropDir     = $out
    cropHeight  = $CropHeight
    references  = $refJsonInfo
    proofSheet  = $proofPath
    anyVisible  = $anyVisible
    croppedAny  = $croppedAny
    files       = $records.ToArray()
}
try {
    $reportDir = Split-Path -Parent $reportPath
    if ($reportDir) { New-Item -ItemType Directory -Force -Path $reportDir | Out-Null }
    $json = $payload | ConvertTo-Json -Depth 8
    [System.IO.File]::WriteAllText($reportPath, $json, (New-Object System.Text.UTF8Encoding($false)))
} catch {
    Write-Host "REPORT WRITE FAILED: $($_.Exception.GetType().FullName): $($_.Exception.Message)"
    Write-Host "STACK: $($_.ScriptStackTrace)"
    throw
}

Write-Host ''
Write-Host 'Status-bar delivery gate' -ForegroundColor Cyan
$records | ForEach-Object {
    $state = if ($_.statusBarVisible) { 'STATUS BAR VISIBLE' } else { 'clean' }
    $flagText = ''
    if ($_.flags.Count -gt 0) { $flagText = ($_.flags | ForEach-Object { "$($_.reference):c$($_.coverage)/p$($_.precision)" }) -join '  ' }
    Write-Host ("  {0,-26} {1,-18} {2,8}  {3}" -f $_.file, $state, $_.action, $flagText)
}
Write-Host ''
Write-Host "report: $reportPath"
if ($proofPath) { Write-Host "proof:  $proofPath" }

$remaining = @()
foreach ($recordItem in $records) {
    $recordAction = [string]$recordItem.action
    if ($recordItem.statusBarVisible -and -not ($recordAction.StartsWith('cropped:'))) { $remaining += $recordItem }
}
if ($remaining.Count -gt 0) {
    Write-Host ''
    Write-Host ("{0} frame(s) still show a status bar and were NOT cropped." -f $remaining.Count) -ForegroundColor Yellow
    $remaining | ForEach-Object { Write-Host "  - $($_.file)" }
    if ($RequireClean) { exit 1 }
}
exit 0
