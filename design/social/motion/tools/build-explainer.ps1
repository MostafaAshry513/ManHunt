# ManHunt v5 explainer build: 60s master + 30s + 15s cuts + 6s GIF + covers.
# Renders every frame from src/ with headless Chrome (JPEG frames for speed),
# uses the pre-generated original scores, and encodes with the static ffmpeg.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/build-explainer.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/build-explainer.ps1 -SkipFrames
param(
  [switch]$SkipFrames,
  [string]$OutDir = 'out/v5'
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$ff = 'C:\dev\ManHunt\design\.tools\node_modules\ffmpeg-static\ffmpeg.exe'
if (-not (Test-Path $ff)) { throw "ffmpeg-static not found at $ff" }
$out = Join-Path $root $OutDir
New-Item -ItemType Directory -Force -Path $out, (Join-Path $out 'frames\long60'), (Join-Path $out 'frames\short30'), (Join-Path $out 'frames\short15'), (Join-Path $out 'frames\gif6'), (Join-Path $out 'stills'), (Join-Path $out 'qa') | Out-Null

Write-Host ''
Write-Host '=== 1/6 original scores (15 / 30 / 60) ===' -ForegroundColor Cyan
node tools/audio.mjs 15
node tools/audio.mjs 30
node tools/audio.mjs 60

if (-not $SkipFrames) {
  Write-Host ''
  Write-Host '=== 2/6 60s master frames (1800 @30fps jpeg) ===' -ForegroundColor Cyan
  node tools/capture.mjs frames long60 "$OutDir/frames/long60" --format jpeg --quality 90

  Write-Host ''
  Write-Host '=== 3/6 30s cut frames (900 @30fps jpeg) ===' -ForegroundColor Cyan
  node tools/capture.mjs frames short30 "$OutDir/frames/short30" --format jpeg --quality 90

  Write-Host ''
  Write-Host '=== 4/6 15s cut frames (450 @30fps jpeg) ===' -ForegroundColor Cyan
  node tools/capture.mjs frames short15 "$OutDir/frames/short15" --format jpeg --quality 90

  Write-Host ''
  Write-Host '=== 5/6 6s GIF teaser frames (90 @15fps jpeg) ===' -ForegroundColor Cyan
  node tools/capture.mjs frames gif6 "$OutDir/frames/gif6" --format jpeg --quality 92
}

Write-Host ''
Write-Host '=== 6/6 stills + encodes ===' -ForegroundColor Cyan
node tools/capture.mjs still "$OutDir/stills/cover.png" --url "cover=1"
node tools/capture.mjs still "$OutDir/stills/poster.png" --url "t=0.9&timeline=master15"

# MP4 master (60s)
& $ff -y -hide_banner -loglevel warning -framerate 30 -i "$OutDir/frames/long60/frame_%05d.jpg" -i "out/audio/manhunt_score_60.wav" -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -profile:v high -level:v 4.2 -c:a aac -b:a 192k -ar 48000 -af "loudnorm=I=-16:TP=-1.5:LRA=11" -movflags +faststart -shortest "$OutDir/manhunt_explainer_60s_1080x1920.mp4"

# MP4 30s cut
& $ff -y -hide_banner -loglevel warning -framerate 30 -i "$OutDir/frames/short30/frame_%05d.jpg" -i "out/audio/manhunt_score_30.wav" -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -profile:v high -level:v 4.2 -c:a aac -b:a 192k -ar 48000 -af "loudnorm=I=-16:TP=-1.5:LRA=11" -movflags +faststart -shortest "$OutDir/manhunt_explainer_30s_1080x1920.mp4"

# MP4 15s cut
& $ff -y -hide_banner -loglevel warning -framerate 30 -i "$OutDir/frames/short15/frame_%05d.jpg" -i "out/audio/manhunt_score.wav" -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p -profile:v high -level:v 4.2 -c:a aac -b:a 192k -ar 48000 -af "loudnorm=I=-16:TP=-1.5:LRA=11" -movflags +faststart -shortest "$OutDir/manhunt_15s_1080x1920.mp4"

# WebM master (60s) — cpu-used 8/crf 40 for a practical encode time on this host
& $ff -y -hide_banner -loglevel warning -framerate 30 -i "$OutDir/frames/long60/frame_%05d.jpg" -i "out/audio/manhunt_score_60.wav" -c:v libvpx-vp9 -crf 40 -b:v 0 -row-mt 1 -cpu-used 8 -pix_fmt yuv420p -c:a libopus -b:a 96k -ar 48000 -af "loudnorm=I=-16:TP=-1.5:LRA=11" -shortest "$OutDir/manhunt_explainer_60s_1080x1920.webm"

# 6s GIF teaser
& $ff -y -hide_banner -loglevel warning -framerate 15 -i "$OutDir/frames/gif6/frame_%05d.jpg" -vf "scale=720:1280:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" -loop 0 "$OutDir/manhunt_teaser_720x1280.gif"

Copy-Item "$OutDir/stills/cover.png" "$OutDir/manhunt_explainer_cover_1080x1920.png" -Force
Copy-Item "$OutDir/stills/poster.png" "$OutDir/manhunt_explainer_poster_1080x1920.png" -Force
& $ff -y -hide_banner -loglevel error -i "$OutDir/stills/cover.png" -vf "crop=1080:1080:0:280" "$OutDir/manhunt_thumbnail_1080x1080.png"

Write-Host ''
Write-Host '=== done ===' -ForegroundColor Green
Get-ChildItem $out -File | Select-Object Name, @{N='MB';E={[math]::Round($_.Length/1MB,2)}} | Format-Table -AutoSize
