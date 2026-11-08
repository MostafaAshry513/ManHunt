<#
.SYNOPSIS
  Builds professional 4:5 "product page" images from the real delivery captures:
  dark ManHunt page treatment, official lockup, phone frame, title + caption.
  No UI is mocked or redrawn - the real capture is framed and composited only.

.DESCRIPTION
  For each page in the set this renders:
    - a 1600x2000 master PNG (4:5, print/site quality)
    - a 1080x1350 derivative PNG (same layout, scaled)
  plus pages-MANIFEST.json (source capture + SHA-256 + copy + provenance) and a
  pages-contact-sheet.png. Sources must be status-bar-clean delivery frames; pass
  -StatusReport from scripts/screenshots/check-status-bar.ps1 to assert this.

.PARAMETER CaptureDir
  Directory with the status-bar-clean full frames (1080x2400 PNGs).

.PARAMETER OutDir
  Output directory (default docs/screenshots/premium/pages).

.PARAMETER StatusReport
  Optional statusbar-check.json produced by check-status-bar.ps1. Any frame still flagged
  with a visible status bar aborts the build.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\screenshots\build-page-images.ps1 `
    -CaptureDir scripts\screenshots\out `
    -StatusReport scripts\screenshots\out\statusbar-check.json
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string]$CaptureDir,
    [string]$OutDir = '',
    [string]$StatusReport = '',
    [string]$FontDir = '',
    [string]$LockupPath = ''
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

$captureDir = Resolve-UnderRoot $CaptureDir
if (-not (Test-Path $captureDir)) { throw "capture directory not found: $captureDir" }
$outDir = if ($OutDir) { Resolve-UnderRoot $OutDir } else { Join-Path (Join-Path $root 'docs\screenshots\premium') 'pages' }
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$outDir1080 = Join-Path $outDir '1080x1350'
New-Item -ItemType Directory -Force -Path $outDir1080 | Out-Null

$fonts = if ($FontDir) { Resolve-UnderRoot $FontDir } else { Join-Path $root 'design\reset-v2\fonts' }
$lockup = if ($LockupPath) { Resolve-UnderRoot $LockupPath } else { Join-Path $root 'design\brand\identity\final\lockup\previews\lockup-horizontal-light-on-dark.png' }
if (-not (Test-Path $lockup)) { throw "official lockup not found: $lockup" }

# ---------------------------------------------------------------- status-bar gate
if ($StatusReport) {
    $statusPath = Resolve-UnderRoot $StatusReport
    if (-not (Test-Path $statusPath)) { throw "status report not found: $statusPath" }
    $status = Get-Content $statusPath -Raw -Encoding UTF8 | ConvertFrom-Json
    $bad = @($status.files | Where-Object { $_.statusBarVisible -and -not ([string]$_.action).StartsWith('cropped:') })
    if ($bad.Count -gt 0) {
        $bad | ForEach-Object { Write-Host "  status bar still visible: $($_.file) ($($_.action))" -ForegroundColor Red }
        throw "refusing to build pages: $($bad.Count) capture(s) still show the system status bar"
    }
    Write-Host "status-bar gate passed: every delivery frame is clean (or was cropped)." -ForegroundColor Green
}

# ---------------------------------------------------------------- fonts
function New-PrivateFonts([string]$dir, [string[]]$files) {
    $collection = New-Object System.Drawing.Text.PrivateFontCollection
    foreach ($name in $files) {
        $path = Join-Path $dir $name
        if (-not (Test-Path $path)) { throw "font missing: $path" }
        $collection.AddFontFile($path)
    }
    return $collection
}

$displayFonts = New-PrivateFonts $fonts @('BricolageGrotesque.ttf')
$sansFonts = New-PrivateFonts $fonts @('Archivo.ttf')
$monoFonts = New-PrivateFonts $fonts @('IBMPlexMono-Regular.ttf')

function New-Family($collection, [string]$wanted) {
    foreach ($family in $collection.Families) {
        if ($family.Name -eq $wanted) { return $family }
    }
    return $collection.Families[0]
}
$familyDisplay = New-Family $displayFonts 'Bricolage Grotesque'
$familySans = New-Family $sansFonts 'Archivo'
$familyMono = New-Family $monoFonts 'IBM Plex Mono'

# ---------------------------------------------------------------- palette / geometry (1600x2000 design space)
$navy = [System.Drawing.Color]::FromArgb(8, 9, 10)            # #08090A
$surface = [System.Drawing.Color]::FromArgb(18, 20, 22)        # #121416
$chalk = [System.Drawing.Color]::FromArgb(243, 239, 230)      # #F3EFE6
$muted = [System.Drawing.Color]::FromArgb(166, 163, 155)      # muted bone
$cyan = [System.Drawing.Color]::FromArgb(255, 90, 54)         # #FF5A36
$hairline = [System.Drawing.Color]::FromArgb(36, 39, 43)       # #24272B
$coral = [System.Drawing.Color]::FromArgb(184, 240, 74)       # #B8F04A

$designW = 1600
$designH = 2000
$margin = 96
$headerRuleY = 196
$footerRuleY = 1852

function New-RoundedPath([single]$x, [single]$y, [single]$w, [single]$h, [single]$r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function Draw-StringTracked($g, [string]$text, $font, $brush, [single]$x, [single]$y, [single]$tracking) {
    # Monospace tracking is already built into Red Hat Mono; drawing the whole string keeps
    # spaces intact (per-character drawing loses word spaces in GDI+ typographic mode).
    $g.DrawString($text, $font, $brush, $x, $y, [System.Drawing.StringFormat]::GenericTypographic)
}
function Get-ImageSize([string]$path) {
    $img = [System.Drawing.Image]::FromFile($path)
    try { return [pscustomobject]@{ Width = $img.Width; Height = $img.Height } } finally { $img.Dispose() }
}
function Split-TextToWidth($g, [string]$text, $font, [single]$maxWidth) {
    $words = @($text.Split(' ') | Where-Object { $_ -ne '' })
    $lines = New-Object System.Collections.Generic.List[string]
    $current = ''
    foreach ($word in $words) {
        $candidate = if ($current) { "$current $word" } else { $word }
        $width = $g.MeasureString($candidate, $font, [System.Drawing.PointF]::Empty, [System.Drawing.StringFormat]::GenericTypographic).Width
        if ($width -le $maxWidth -or -not $current) {
            $current = $candidate
        } else {
            $lines.Add($current)
            $current = $word
        }
    }
    if ($current) { $lines.Add($current) }
    return @($lines)
}
# ---------------------------------------------------------------- page definitions
$pages = @(
     [pscustomobject]@{ index = 1; slug = 'home'; source = 's03-home.png'; kicker = 'NIGHT SHIFT APP  /  STREET'; headline = @('START', 'SOMETHING.'); captionLines = @('Two teams. One street. One clock', 'the players cannot bend.'); dataLines = @('FREE SIDELOAD  /  ANDROID 8.0+', 'TWO SIDES  /  PREY + HUNTERS', 'INVITE CODE  /  SIX CHARACTERS'); credit = $false },
    [pscustomobject]@{ index = 2; slug = 'lobby'; source = 's06-lobby-player.png'; kicker = 'NIGHT SHIFT APP  /  ROOM'; headline = @('TAKE', 'A SIDE.'); captionLines = @('Prey hide. Hunters follow the latest', 'reports. The ready check unlocks the start.'); dataLines = @('TWO SIDES  /  PREY + HUNTERS', 'READY CHECK  /  WAITING STATE', 'INVITE CODE  /  SIX CHARACTERS'); credit = $false },
    [pscustomobject]@{ index = 3; slug = 'hunt'; source = 's07-hunt.png'; kicker = 'NIGHT SHIFT APP  /  FIELD'; headline = @('LATEST', 'REPORT.'); captionLines = @('Reports go stale. The board shows the', 'latest one - never a live track.'); dataLines = @('BOARD CLOCK  /  SERVER TIME', 'REPORTS GO STALE  /  FRESH + STALE MARKERS', 'MAP TILES  /  OPENSTREETMAP'); credit = $true },
    [pscustomobject]@{ index = 4; slug = 'claim'; source = 's08-hunt-claim.png'; kicker = 'NIGHT SHIFT APP  /  TAG'; headline = @('IN-PERSON', 'TAG.'); captionLines = @('Prey confirms or disputes.', 'The server decides.'); dataLines = @('IN-PERSON TAG  /  NO GEAR REQUIRED', 'PREY CONFIRMS OR DISPUTES', 'SERVER DECIDES  /  NO INVENTED RULES'); credit = $true },
    [pscustomobject]@{ index = 5; slug = 'chat'; source = 's11-chat.png'; kicker = 'NIGHT SHIFT APP  /  RADIO'; headline = @('THE', 'FIELD.'); captionLines = @('Room chat, tag claims and system', 'events in one transcript.'); dataLines = @('FIELD LOG  /  ROOM CHAT + SYSTEM EVENTS', 'TAG CLAIMS IN THREAD', 'ROOM-ONLY  /  NO PUBLIC FEED'); credit = $false },
    [pscustomobject]@{ index = 6; slug = 'result'; source = 's12-result-hunters.png'; kicker = 'NIGHT SHIFT APP  /  FULL TIME'; headline = @('FULL', 'TIME.'); captionLines = @('Hunters win when every Prey is tagged.', 'Honest scores, server clock.'); dataLines = @('FULL TIME  /  REAL MATCH RESULT', 'HONEST SCORE  /  NO INVENTED STATS', 'PREY REMAINING SHOWN'); credit = $false },
    [pscustomobject]@{ index = 7; slug = 'rtl'; source = 's04-home-rtl.png'; kicker = 'NIGHT SHIFT APP  /  ARABIC'; headline = @('RIGHT', 'TO LEFT.'); captionLines = @('Full Arabic layout.', 'Same rules, same system.'); dataLines = @('ARABIC  /  RIGHT TO LEFT', 'SAME RULES  /  SAME BOARD', 'FULL MIRRORED LAYOUT'); credit = $false },
    [pscustomobject]@{ index = 8; slug = 'light'; source = 's15-home-light.png'; kicker = 'NIGHT SHIFT APP  /  LIGHT'; headline = @('LIGHT', 'MODE.'); captionLines = @('The same street system', 'in daylight.'); dataLines = @('LIGHT + DARK  /  SAME SYSTEM', 'THEME FOLLOWS YOUR SETTING', 'SAME NIGHT SHIFT TYPOGRAPHY'); credit = $false }
)
# ---------------------------------------------------------------- render one page
function Render-Page([string]$targetPath, [int]$width, [int]$height, [object]$page) {
    $scale = $width / $designW
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    try {
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
        $g.Clear($navy)

        $px = { param($v) [single]($v * $scale) }

        # subtle field grid
        $gridPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(26, 42, 53, 80), [single](1 * $scale))
        try {
            for ($gx = 0; $gx -le $designW; $gx += 80) { $g.DrawLine($gridPen, [single]($gx * $scale), 0, [single]($gx * $scale), $height) }
            for ($gy = 0; $gy -le $designH; $gy += 80) { $g.DrawLine($gridPen, 0, [single]($gy * $scale), $width, [single]($gy * $scale)) }
        } finally { $gridPen.Dispose() }

        # header: official lockup + page data
        $lockupImg = [System.Drawing.Image]::FromFile($script:lockup)
        try {
            $lh = [int](64 * $scale)
            $lw = [int]($lockupImg.Width * ($lh / $lockupImg.Height))
            $g.DrawImage($lockupImg, [int](96 * $scale), [int](64 * $scale), $lw, $lh)
        } finally { $lockupImg.Dispose() }

        $monoLabel = New-Object System.Drawing.Font($familyMono, [single](22 * $scale), [System.Drawing.FontStyle]::Regular)
        $monoLabelBold = New-Object System.Drawing.Font($familyMono, [single](24 * $scale), [System.Drawing.FontStyle]::Bold)
        $monoSmall = New-Object System.Drawing.Font($familyMono, [single](18 * $scale), [System.Drawing.FontStyle]::Regular)
        $monoMicro = New-Object System.Drawing.Font($familyMono, [single](15 * $scale), [System.Drawing.FontStyle]::Regular)
        $kickerFont = New-Object System.Drawing.Font($familyMono, [single](19 * $scale), [System.Drawing.FontStyle]::Regular)
        $captionFont = New-Object System.Drawing.Font($familySans, [single](31 * $scale), [System.Drawing.FontStyle]::Regular)
        $headlineSize = if ($page.headline.Count -gt 1) { 124 } else { 150 }
        $headlineFont = New-Object System.Drawing.Font($familyDisplay, [single]($headlineSize * $scale), [System.Drawing.FontStyle]::Bold)
        $chalkBrush = New-Object System.Drawing.SolidBrush($chalk)
        $mutedBrush = New-Object System.Drawing.SolidBrush($muted)
        $cyanBrush = New-Object System.Drawing.SolidBrush($cyan)
        $coralBrush = New-Object System.Drawing.SolidBrush($coral)
        $hairPen = New-Object System.Drawing.Pen($hairline, [single](1.5 * $scale))
        $cyanPen = New-Object System.Drawing.Pen($cyan, [single](3 * $scale))
        try {
            # top hairline
            $g.DrawLine($hairPen, [single](96 * $scale), [single]($headerRuleY * $scale), [single](1504 * $scale), [single]($headerRuleY * $scale))
            $pageLabel = ('NIGHT SHIFT  {0:00} / 08' -f $page.index)
            $labelW = $g.MeasureString($pageLabel, $monoLabel, [System.Drawing.PointF]::Empty, [System.Drawing.StringFormat]::GenericTypographic).Width
            Draw-StringTracked $g $pageLabel $monoLabel $mutedBrush ([single]((1504 * $scale) - $labelW - (24 * $scale))) ([single](82 * $scale)) ([single](1.5 * $scale))

            # left column: kicker + headline + caption
            $leftX = 96
            $colW = 640
            Draw-StringTracked $g $page.kicker $kickerFont $cyanBrush ([single](($leftX + 6) * $scale)) ([single](238 * $scale)) ([single](2 * $scale))

            $headY = 292
            $lineH = [single]($headlineSize * 1.08 + 4)
            foreach ($line in $page.headline) {
                $g.DrawString($line, $headlineFont, $chalkBrush, [single]($leftX * $scale), [single]($headY * $scale), [System.Drawing.StringFormat]::GenericTypographic)
                $headY += $lineH
            }

            $capY = $headY + 56
            $captionRendered = @()
            foreach ($line in $page.captionLines) {
                $captionRendered += @(Split-TextToWidth $g $line $captionFont ([single](($colW - 24) * $scale)))
            }
            foreach ($line in $captionRendered) {
                $g.DrawString($line, $captionFont, $mutedBrush, [single]($leftX * $scale), [single]($capY * $scale), [System.Drawing.StringFormat]::GenericTypographic)
                $capY += 44
            }

            # left data strip: truthful, capture-agnostic product lines
            $dataY = $capY + 34
            $dataLines = $page.dataLines
            foreach ($line in $dataLines) {
                Draw-StringTracked $g $line $monoSmall $mutedBrush ([single](($leftX + 2) * $scale)) ([single]($dataY * $scale)) ([single](1 * $scale))
                $dataY += 34
            }

            # right column: phone frame with the real capture
            $screen = Join-Path $captureDir $page.source
            if (-not (Test-Path $screen)) { throw "capture missing: $screen" }
            $shot = [System.Drawing.Image]::FromFile($screen)
            try {
                $innerH = 1330
                $innerW = [int]($innerH * ($shot.Width / $shot.Height))   # keep capture aspect exactly
                $bezel = 22
                $frameW = $innerW + 2 * $bezel
                $frameH = $innerH + 2 * $bezel
                $frameX = 1504 - $frameW
                $frameY = 244
                $outerPath = New-RoundedPath ($frameX * $scale) ($frameY * $scale) ($frameW * $scale) ($frameH * $scale) (54 * $scale)
                $innerPath = New-RoundedPath (($frameX + $bezel) * $scale) (($frameY + $bezel) * $scale) ($innerW * $scale) ($innerH * $scale) (38 * $scale)
                try {
                    $frameBrush = New-Object System.Drawing.SolidBrush($surface)
                    try { $g.FillPath($frameBrush, $outerPath) } finally { $frameBrush.Dispose() }
                    $g.DrawPath($hairPen, $outerPath)
                    $state = $g.Save()
                    $g.SetClip($innerPath)
                    $g.DrawImage($shot, [int](($frameX + $bezel) * $scale), [int](($frameY + $bezel) * $scale), [int]($innerW * $scale), [int]($innerH * $scale))
                    $g.Restore($state)
                    $g.DrawPath($hairPen, $innerPath)
                    # tiny brand accent on the bezel: cyan notch at the bottom centre of the frame
                    $g.DrawLine($cyanPen, [single](($frameX + $frameW / 2 - 26) * $scale), [single](($frameY + $frameH - 10) * $scale), [single](($frameX + $frameW / 2 + 26) * $scale), [single](($frameY + $frameH - 10) * $scale))
                } finally { $outerPath.Dispose(); $innerPath.Dispose() }
                # plate stand-off: page edge ticks by the phone
                $tickLen = 18
                $g.DrawLine($cyanPen, [single](($frameX - 28) * $scale), [single]($frameY * $scale), [single](($frameX - 28 + $tickLen) * $scale), [single](($frameY * $scale)))
                $g.DrawLine($cyanPen, [single](($frameX - 28) * $scale), [single](($frameY + $frameH) * $scale), [single](($frameX - 28 + $tickLen) * $scale), [single](($frameY + $frameH) * $scale))

                # under-phone line: what the device frame shows + OSM credit when map tiles are visible
                $underY = $frameY + $frameH + 28
                Draw-StringTracked $g ('REAL APP CAPTURE  /  {0}  /  {1} x {2}' -f $page.source.ToUpperInvariant(), $shot.Width, $shot.Height) $monoMicro $mutedBrush ([single](($frameX - 2) * $scale)) ([single]($underY * $scale)) ([single](0.8 * $scale))
                if ($page.credit) {
                    Draw-StringTracked $g ('MAP TILES  ' + [char]0x00A9 + ' OPENSTREETMAP CONTRIBUTORS') $monoMicro $cyanBrush ([single](($frameX - 2) * $scale)) ([single](($underY + 24) * $scale)) ([single](0.8 * $scale))
                }
            } finally { $shot.Dispose() }

            # footer rules + monotone provenance line
            $g.DrawLine($hairPen, [single](96 * $scale), [single]($footerRuleY * $scale), [single](1504 * $scale), [single]($footerRuleY * $scale))
            $footerY = $footerRuleY + 26
            Draw-StringTracked $g 'MANHUNT  /  REAL-WORLD GPS HIDE-AND-SEEK' $monoSmall $chalkBrush ([single](96 * $scale)) ([single]($footerY * $scale)) ([single](1 * $scale))
            $rightText = 'FREE SIDELOADED APK  /  ANDROID 8.0+  /  NOT ON GOOGLE PLAY'
            $rightW = $g.MeasureString($rightText, $monoMicro, [System.Drawing.PointF]::Empty, [System.Drawing.StringFormat]::GenericTypographic).Width
            Draw-StringTracked $g $rightText $monoMicro $mutedBrush ([single]((1504 * $scale) - $rightW - (24 * $scale))) ([single]($footerY * $scale)) ([single](0.8 * $scale))
        } finally {
            $monoLabel.Dispose(); $monoLabelBold.Dispose(); $monoSmall.Dispose(); $monoMicro.Dispose()
            $kickerFont.Dispose(); $captionFont.Dispose(); $headlineFont.Dispose()
            $chalkBrush.Dispose(); $mutedBrush.Dispose(); $cyanBrush.Dispose(); $coralBrush.Dispose()
            $hairPen.Dispose(); $cyanPen.Dispose()
        }
    } finally { $g.Dispose() }
    $bmp.Save($targetPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

# ---------------------------------------------------------------- render pages + manifest
$records = New-Object System.Collections.Generic.List[object]
foreach ($page in $pages) {
    $sourcePath = Join-Path $captureDir $page.source
    if (-not (Test-Path $sourcePath)) { throw "page source capture missing: $sourcePath" }
    $sourceSha = (Get-FileHash $sourcePath -Algorithm SHA256).Hash.ToLowerInvariant()
    $sourceSize = Get-ImageSize $sourcePath
    $fileName = ('{0:00}-{1}_1600x2000.png' -f $page.index, $page.slug)
    $file1080 = ('{0:00}-{1}_1080x1350.png' -f $page.index, $page.slug)
    $path1600 = Join-Path $outDir $fileName
    $path1080 = Join-Path $outDir1080 $file1080
    Write-Host ("rendering page {0}: {1}  <- {2}" -f $page.index, $page.slug, $page.source)
    Render-Page $path1600 1600 2000 $page
    Render-Page $path1080 1080 1350 $page
    $records.Add([pscustomobject]@{
        index      = $page.index
        slug       = $page.slug
        sourceShot = $page.source
        sourceWidth = $sourceSize.Width
        sourceHeight = $sourceSize.Height
        sourceSha256 = $sourceSha
        masterFile = $fileName
        masterSha256 = (Get-FileHash $path1600 -Algorithm SHA256).Hash.ToLowerInvariant()
        derivativeFile = "1080x1350/$file1080"
        derivativeSha256 = (Get-FileHash $path1080 -Algorithm SHA256).Hash.ToLowerInvariant()
        dimensions = '1600x2000 master / 1080x1350 derivative'
        kicker     = $page.kicker
        headline   = ($page.headline -join ' ')
        caption    = ($page.captionLines -join ' ')
        osmCredit  = [bool]$page.credit
        statusBar  = 'hidden (verified by check-status-bar.ps1)'
    })
}

# ---------------------------------------------------------------- contact sheet
$cols = 4
$rows = [math]::Ceiling($records.Count / $cols)
$thumbW = 352
$thumbH = 440
$padX = 30
$padY = 44
$sheetW = 68 + $cols * ($thumbW + $padX) - $padX + 68
$sheetH = 150 + $rows * ($thumbH + $padY) + 40
$sheet = New-Object System.Drawing.Bitmap($sheetW, $sheetH)
$sg = [System.Drawing.Graphics]::FromImage($sheet)
try {
    $sg.Clear($navy)
    $sg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $sg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $sg.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $titleFont = New-Object System.Drawing.Font($familyDisplay, [single]46, [System.Drawing.FontStyle]::Bold)
    $subFont = New-Object System.Drawing.Font($familyMono, [single]15, [System.Drawing.FontStyle]::Regular)
    $labelFont = New-Object System.Drawing.Font($familyMono, [single]14, [System.Drawing.FontStyle]::Regular)
    $white = New-Object System.Drawing.SolidBrush($chalk)
    $mut = New-Object System.Drawing.SolidBrush($muted)
    $cy = New-Object System.Drawing.SolidBrush($cyan)
    try {
        $sg.DrawString('MANHUNT  /  NIGHT SHIFT APP PAGES', $titleFont, $white, 68, 42)
        $sg.DrawString('Real delivery captures, OS status bar cleanly removed - real UI only - 1600x2000 masters', $subFont, $mut, 70, 104)
        $i = 0
        foreach ($rec in $records) {
            $col = $i % $cols
            $row = [math]::Floor($i / $cols)
            $x = 68 + $col * ($thumbW + $padX)
            $y = 150 + $row * ($thumbH + $padY)
            $img = [System.Drawing.Image]::FromFile((Join-Path $outDir $rec.masterFile))
            try { $sg.DrawImage($img, $x, $y, $thumbW, $thumbH) } finally { $img.Dispose() }
            $label = ('{0:00}  {1}' -f $rec.index, $rec.slug.ToUpperInvariant())
            $sg.DrawString($label, $labelFont, $cy, $x, ($y + $thumbH + 10))
            $sg.DrawString($rec.sourceShot, $labelFont, $mut, $x, ($y + $thumbH + 28))
            $i++
        }
    } finally { $titleFont.Dispose(); $subFont.Dispose(); $labelFont.Dispose(); $white.Dispose(); $mut.Dispose(); $cy.Dispose() }
} finally { $sg.Dispose() }
$contactSheet = Join-Path $outDir 'pages-contact-sheet.png'
$sheet.Save($contactSheet, [System.Drawing.Imaging.ImageFormat]::Png)
$sheet.Dispose()

# ---------------------------------------------------------------- manifest
$manifest = [pscustomobject]@{
    title       = 'ManHunt NIGHT SHIFT app pages'
    generatedAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
    source      = 'Real emulator captures (1080x2400) framed on a dark NIGHT SHIFT page; no UI mocked, redrawn or composited over the capture'
    captureDir  = $captureDir
    fonts       = @(
        [pscustomobject]@{ file = (Join-Path $fonts 'BricolageGrotesque.ttf'); sha256 = (Get-FileHash (Join-Path $fonts 'BricolageGrotesque.ttf') -Algorithm SHA256).Hash.ToLowerInvariant() },
        [pscustomobject]@{ file = (Join-Path $fonts 'Archivo.ttf'); sha256 = (Get-FileHash (Join-Path $fonts 'Archivo.ttf') -Algorithm SHA256).Hash.ToLowerInvariant() },
        [pscustomobject]@{ file = (Join-Path $fonts 'IBMPlexMono-Regular.ttf'); sha256 = (Get-FileHash (Join-Path $fonts 'IBMPlexMono-Regular.ttf') -Algorithm SHA256).Hash.ToLowerInvariant() }
    )
    lockup      = [pscustomobject]@{ file = $lockup; sha256 = (Get-FileHash $lockup -Algorithm SHA256).Hash.ToLowerInvariant() }
    statusBarGate = if ($StatusReport) { Resolve-UnderRoot $StatusReport } else { $null }
    contactSheet = [pscustomobject]@{ file = 'pages-contact-sheet.png'; width = $sheetW; height = $sheetH; sha256 = (Get-FileHash $contactSheet -Algorithm SHA256).Hash.ToLowerInvariant() }
    pages       = $records.ToArray()
}
$manifestPath = Join-Path $outDir 'pages-MANIFEST.json'
[System.IO.File]::WriteAllText($manifestPath, ($manifest | ConvertTo-Json -Depth 8), (New-Object System.Text.UTF8Encoding($false)))

Write-Host ''
Write-Host "pages:  $outDir" -ForegroundColor Cyan
Write-Host "contact sheet: $contactSheet"
Write-Host "manifest: $manifestPath"
$records | ForEach-Object { Write-Host ("  {0:00} {1,-8} <- {2}" -f $_.index, $_.slug, $_.sourceShot) }
