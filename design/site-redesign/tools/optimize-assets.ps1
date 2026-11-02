# ManHunt site redesign — derived site images
#
# Produces the page-size images served from /media/*:
#   * phone captures (WebP + JPEG) from the premium screenshot set (docs/screenshots/premium/)
#   * the two real-map plates (hero + field band) from the premium OSM harvest crops, with the
#     app's map-control strip cropped away so no UI fragments appear in the artwork
#   * the film cover (WebP + JPEG)
#
# Sources are explicit and versioned by the screenshot team:
#   docs/screenshots/premium/s07-hunt.png             -> shot-hunt    (key showcase)
#   docs/screenshots/premium/s03-home.png             -> shot-home
#   docs/screenshots/premium/s05-lobby-host.png       -> shot-lobby
#   docs/screenshots/premium/s12-result-hunters.png   -> shot-result   (pending correction run)
#   docs/screenshots/premium/s11-chat.png             -> shot-extra    (optional)
#   docs/screenshots/premium/harvest/map-hero-3x2.png -> map-hero  (crop x170..930, full height)
#   docs/screenshots/premium/harvest/map-hero-16x9.png-> map-band  (crop x170..930, y130..475)
#
# If a premium source is missing the script keeps the existing asset and prints a warning, so the
# pipeline is idempotent while the capture set is still landing.
#
# Run from the repo root: powershell -File design/site-redesign/tools/optimize-assets.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..\..')
$site = Join-Path $root 'server\public\site'
$premium = Join-Path $root 'docs\screenshots\premium'
$ffmpeg = Join-Path $root 'design\.tools\node_modules\ffmpeg-static\ffmpeg.exe'
$tmp = Join-Path $env:TEMP ('mh-assets-' + [guid]::NewGuid().ToString('N').Substring(0, 8))
New-Item -ItemType Directory -Force $tmp | Out-Null

function Save-Derived([string]$srcPng, [string]$baseName, [int]$cropX, [int]$cropY, [int]$cropW, [int]$cropH, [int]$outW, [int]$outH) {
  $img = [System.Drawing.Image]::FromFile($srcPng)
  if ($cropW -le 0) { $cropX = 0; $cropY = 0; $cropW = $img.Width; $cropH = $img.Height }
  if ($outW -le 0) { $outW = $cropW; $outH = $cropH }
  if (($cropX + $cropW) -gt $img.Width -or ($cropY + $cropH) -gt $img.Height) {
    throw ("crop out of bounds for {0} ({1}x{2})" -f $srcPng, $img.Width, $img.Height)
  }
  $bmp = New-Object System.Drawing.Bitmap($outW, $outH)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $outW, $outH)), (New-Object System.Drawing.Rectangle($cropX, $cropY, $cropW, $cropH)), [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose(); $img.Dispose()
  $png = Join-Path $tmp ($baseName + '.png')
  $bmp.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()

  $webp = Join-Path $site ($baseName + '.webp')
  $jpg = Join-Path $site ($baseName + '.jpg')
  & $ffmpeg -hide_banner -loglevel error -y -i $png -c:v libwebp -quality 82 -compression_level 6 $webp
  & $ffmpeg -hide_banner -loglevel error -y -i $png -c:v mjpeg -q:v 3 -pix_fmt yuvj420p $jpg
  Remove-Item $png -Force
  Write-Output ("{0,-16} {1,5}x{2,-5} webp {3,4} KB  jpg {4,4} KB" -f $baseName, $outW, $outH, [int]((Get-Item $webp).Length / 1024), [int]((Get-Item $jpg).Length / 1024))
}

# 1. Phone captures — page display width is ~290-390 CSS px, so 900 px wide is >=2x for any column.
$shots = @(
  @{ Out = 'shot-hunt';   Src = 's07-hunt.png';           Width = 900 },
  @{ Out = 'shot-home';   Src = 's03-home.png';           Width = 900 },
  @{ Out = 'shot-lobby';  Src = 's05-lobby-host.png';     Width = 900 },
  @{ Out = 'shot-result'; Src = 's12-result-hunters.png'; Width = 900 },
  @{ Out = 'shot-extra';  Src = 's11-chat.png';           Width = 900 }
)
foreach ($shot in $shots) {
  $src = Join-Path $premium $shot.Src
  if (-not (Test-Path $src)) {
    Write-Output ("skip {0,-12} (pending: {1})" -f $shot.Out, $shot.Src)
    continue
  }
  $img = [System.Drawing.Image]::FromFile($src)
  $h = [int][math]::Round($shot.Width * ($img.Height / $img.Width))
  if (($h % 2) -ne 0) { $h += 1 }
  $img.Dispose()
  Save-Derived $src $shot.Out 0 0 0 0 $shot.Width $h
}

# 2. Real-map plates from the premium OSM harvest. Crop away the in-app map controls (right strip)
# so the plate is pure ground; the crop keeps the river on the left and the street grid on the right.
$maps = @(
  # Hero plate: the 4:5 harvest of the live hunt map (real OSM + the app's 240 m zone, fresh/stale
  # prey markers and trail). The 3:2 / 16:9 harvests are river-only crops and cannot carry the game
  # state at portrait aspect; the 4:5 crop is the one framed for a portrait hero. The app's board and
  # map controls are cropped away (y290 cuts the board, x<=900 cuts the zoom controls).
  @{ Out = 'map-hero'; Src = 'harvest\board-clock-4x5.png'; CX = 0; CY = 296; CW = 900; CH = 1054; W = 900; H = 1054 },
  # Field band: the 16:9 harvest (river + street grid), annotated by the page.
  @{ Out = 'map-band'; Src = 'harvest\map-hero-16x9.png';  CX = 170; CY = 130; CW = 760; CH = 345; W = 1520; H = 690 }
)
foreach ($map in $maps) {
  $src = Join-Path $premium $map.Src
  if (-not (Test-Path $src)) {
    Write-Output ("skip {0,-12} (pending: {1})" -f $map.Out, $map.Src)
    continue
  }
  Save-Derived $src $map.Out $map.CX $map.CY $map.CW $map.CH $map.W $map.H
}

# 3. Film cover (site asset, not a premium capture).
$cover = Join-Path $site 'explainer-cover.png'
if (Test-Path $cover) { Save-Derived $cover 'explainer-cover' 0 0 0 0 720 1280 }

Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue
Write-Output 'done'
