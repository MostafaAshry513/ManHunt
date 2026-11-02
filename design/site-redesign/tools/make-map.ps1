# ManHunt site redesign â€” real-map plate builder
#
# Builds the site's hero / field-band map plates from real OpenStreetMap raster tiles, filtered
# through the SAME "Deep Teal" colour matrix the Android app ships (android/.../map/DarkPalette.kt),
# so the website's ground matches the in-game map exactly.
#
# Outputs (served from /media/* by the existing allowlist route):
#   server/public/site/map-hero.png   ~1400x1500  hero plate (right column, bleeds off-frame)
#   server/public/site/map-band.png   ~3000x900   wide annotated field band (section 2)
#
# Data: (c) OpenStreetMap contributors, ODbL. Attribution is rendered on the page wherever the
# plates appear. A polite one-off capture: fixed User-Agent, 250 ms between tiles, no caching proxy.
#
# Run from the repo root: powershell -File design/site-redesign/tools/make-map.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Resolve-Path (Join-Path $PSScriptRoot '..\..\..')
$outDir = Join-Path $root 'server\public\site'
$cacheDir = Join-Path $PSScriptRoot 'cache'
$tileDir = Join-Path $cacheDir 'tiles'
New-Item -ItemType Directory -Force $cacheDir | Out-Null
New-Item -ItemType Directory -Force $tileDir | Out-Null

$zoom = 16
$centerLat = 51.5080
$centerLon = -0.1245
$tilesX = 12
$tilesY = 8

function Get-TileCoord([double]$lat, [double]$lon, [int]$z) {
  $n = [math]::Pow(2, $z)
  $x = [math]::Floor(($lon + 180.0) / 360.0 * $n)
  $latRad = $lat * [math]::PI / 180.0
  $y = [math]::Floor((1.0 - [math]::Log([math]::Tan($latRad) + 1.0 / [math]::Cos($latRad)) / [math]::PI) / 2.0 * $n)
  return @([int]$x, [int]$y)
}

$center = Get-TileCoord $centerLat $centerLon $zoom
$x0 = $center[0] - [math]::Floor($tilesX / 2)
$y0 = $center[1] - [math]::Floor($tilesY / 2)
Write-Output "zoom=$zoom center tile=($($center[0]),$($center[1])) grid=${tilesX}x${tilesY} start=($x0,$y0)"

$ua = 'ManHuntSiteDesign/1.0 (one-off static site map plate; OpenStreetMap contributors)'
$rawW = $tilesX * 256
$rawH = $tilesY * 256
$raw = New-Object System.Drawing.Bitmap($rawW, $rawH)
$g = [System.Drawing.Graphics]::FromImage($raw)
$g.Clear([System.Drawing.Color]::FromArgb(255, 11, 18, 32))

for ($ty = 0; $ty -lt $tilesY; $ty++) {
  for ($tx = 0; $tx -lt $tilesX; $tx++) {
    $z = $zoom; $x = $x0 + $tx; $y = $y0 + $ty
    $file = Join-Path $tileDir ("t_{0}_{1}_{2}.png" -f $z, $x, $y)
    if (-not ((Test-Path $file) -and ((Get-Item $file).Length -gt 500))) {
      $url = "https://tile.openstreetmap.org/$z/$x/$y.png"
      try {
        Invoke-WebRequest -Uri $url -UserAgent $ua -OutFile $file -TimeoutSec 30 -UseBasicParsing | Out-Null
      } catch {
        Write-Output "  tile $z/$x/$y failed: $($_.Exception.Message)"
      }
      Start-Sleep -Milliseconds 220
    }
    try {
      $tile = [System.Drawing.Image]::FromFile($file)
      $g.DrawImage($tile, ($tx * 256), ($ty * 256), 256, 256)
      $tile.Dispose()
    } catch { }
  }
}
$g.Dispose()
$rawPath = Join-Path $cacheDir 'raw.png'
$raw.Save($rawPath, [System.Drawing.Imaging.ImageFormat]::Png)
$raw.Dispose()

# Deep Teal matrix, verbatim from DarkPalette.kt.
# GDI+ layout: Matrix<row=input channel><col=output channel>; the translation lives in row 4,
# and translation values are normalised (1.0 == 255). So Android's output-R row maps to the
# GDI+ column 0 (M00,M10,M20) + M40.
$cm = New-Object System.Drawing.Imaging.ColorMatrix
$cm.Matrix00 = -0.09867; $cm.Matrix10 = -0.19371; $cm.Matrix20 = -0.03762; $cm.Matrix30 = 0; $cm.Matrix40 = (86.7 / 255.0)
$cm.Matrix01 = -0.25714; $cm.Matrix11 = -0.50482; $cm.Matrix21 = -0.09804; $cm.Matrix31 = 0; $cm.Matrix41 = (229.5 / 255.0)
$cm.Matrix02 = -0.26910; $cm.Matrix12 = -0.52830; $cm.Matrix22 = -0.10260; $cm.Matrix32 = 0; $cm.Matrix42 = (255.0 / 255.0)
$cm.Matrix03 = 0; $cm.Matrix13 = 0; $cm.Matrix23 = 0; $cm.Matrix33 = 1; $cm.Matrix43 = 0
$cm.Matrix04 = 0; $cm.Matrix14 = 0; $cm.Matrix24 = 0; $cm.Matrix34 = 0; $cm.Matrix44 = 1
$attr = New-Object System.Drawing.Imaging.ImageAttributes
$attr.SetColorMatrix($cm)

$source = [System.Drawing.Image]::FromFile($rawPath)
$filtered = New-Object System.Drawing.Bitmap($rawW, $rawH)
$fg = [System.Drawing.Graphics]::FromImage($filtered)
$fg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$dest = New-Object System.Drawing.Rectangle(0, 0, $rawW, $rawH)
$fg.DrawImage($source, $dest, 0, 0, $source.Width, $source.Height, [System.Drawing.GraphicsUnit]::Pixel, $attr)
$fg.Dispose()
$source.Dispose()
$filteredPath = Join-Path $cacheDir 'filtered.png'
$filtered.Save($filteredPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Crop + save helper (keeps aspect). Writes WebP (primary) + JPEG (fallback) from one lossless PNG:
# these plates sit under dark scrims and vector overlays, so quality 80 WebP is visually clean and
# keeps each file a third of the PNG's weight.
$ffmpeg = Join-Path $root 'design\.tools\node_modules\ffmpeg-static\ffmpeg.exe'
function Save-Crop([string]$inPath, [string]$baseName, [int]$cx, [int]$cy, [int]$cw, [int]$ch, [int]$ow, [int]$oh) {
  $img = [System.Drawing.Image]::FromFile($inPath)
  $bmp = New-Object System.Drawing.Bitmap($ow, $oh)
  $g2 = [System.Drawing.Graphics]::FromImage($bmp)
  $g2.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g2.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g2.DrawImage($img, (New-Object System.Drawing.Rectangle(0, 0, $ow, $oh)), (New-Object System.Drawing.Rectangle($cx, $cy, $cw, $ch)), [System.Drawing.GraphicsUnit]::Pixel)
  $g2.Dispose()
  $png = Join-Path $cacheDir ($baseName + '.png')
  $bmp.Save($png, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose(); $img.Dispose()

  $webp = Join-Path $outDir ($baseName + '.webp')
  $jpg = Join-Path $outDir ($baseName + '.jpg')
  & $ffmpeg -hide_banner -loglevel error -y -i $png -c:v libwebp -quality 80 -compression_level 6 $webp
  & $ffmpeg -hide_banner -loglevel error -y -i $png -c:v mjpeg -q:v 3 -pix_fmt yuvj420p $jpg
  Write-Output ("{0}  {1}x{2}  webp {3} KB  jpg {4} KB" -f $baseName, $ow, $oh, [int]((Get-Item $webp).Length / 1024), [int]((Get-Item $jpg).Length / 1024))
}

# Hero plate: portrait crop from the right half of the stitched map (dense streets + river edge).
# raw is 3072 x 2048; 1200x1290 is enough for a 600x645 CSS plate at 2x.
Save-Crop $filteredPath 'map-hero' 1500 260 1350 1450 1200 1290
# Field band: wide crop through the middle; annotations are positioned relative to this crop's frame.
Save-Crop $filteredPath 'map-band' 0 560 3000 1170 2400 936

Remove-Item (Join-Path $cacheDir 'raw.png'),(Join-Path $cacheDir 'filtered.png'),(Join-Path $cacheDir 'map-hero.png'),(Join-Path $cacheDir 'map-band.png') -Force -ErrorAction SilentlyContinue
Write-Output "done"

