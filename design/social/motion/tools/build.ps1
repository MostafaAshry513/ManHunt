# ManHunt vertical social short - full deterministic build.
# Re-renders every frame from src/ (HTML/CSS/JS), synthesises the original score,
# and encodes the MP4 / WebM / GIF / cover with the static ffmpeg in design/.tools.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/build.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/build.ps1 -SkipFrames
param(
  [switch]$SkipFrames
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$ff = 'C:\dev\ManHunt\design\.tools\node_modules\ffmpeg-static\ffmpeg.exe'
if (-not (Test-Path $ff)) { throw "ffmpeg-static not found at $ff - install it under design/.tools first." }

$out = Join-Path $root 'out'
New-Item -ItemType Directory -Force -Path $out, (Join-Path $out 'frames\master'), (Join-Path $out 'frames\cut'), (Join-Path $out 'stills'), (Join-Path $out 'audio') | Out-Null

Write-Host ''
Write-Host '=== 1/6 original score ===' -ForegroundColor Cyan
node tools/audio.mjs

if (-not $SkipFrames) {
  Write-Host ''
  Write-Host '=== 2/6 master frames (15.0 s at 30 fps, 450 frames) ===' -ForegroundColor Cyan
  node tools/capture.mjs frames master out/frames/master

  Write-Host ''
  Write-Host '=== 3/6 cutdown frames (6.0 s at 15 fps, 90 frames) ===' -ForegroundColor Cyan
  node tools/capture.mjs frames cut out/frames/cut
}

Write-Host ''
Write-Host '=== 4/6 stills (cover, poster) ===' -ForegroundColor Cyan
node tools/capture.mjs still out/stills/cover.png --url "cover=1"
node tools/capture.mjs still out/stills/poster.png --url "t=0.9"

Write-Host ''
Write-Host '=== 5/6 encode MP4 + WebM ===' -ForegroundColor Cyan
& $ff -y -hide_banner -loglevel warning -framerate 30 -i "out/frames/master/frame_%05d.png" -i "out/audio/manhunt_score.wav" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level:v 4.2 -c:a aac -b:a 192k -ar 48000 -af "loudnorm=I=-16:TP=-1.5:LRA=11" -movflags +faststart -shortest "out/manhunt_short_1080x1920.mp4"

& $ff -y -hide_banner -loglevel warning -framerate 30 -i "out/frames/master/frame_%05d.png" -i "out/audio/manhunt_score.wav" -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -pix_fmt yuv420p -c:a libopus -b:a 96k -ar 48000 -af "loudnorm=I=-16:TP=-1.5:LRA=11" -shortest "out/manhunt_short_1080x1920.webm"

Write-Host ''
Write-Host '=== 6/6 GIF cutdown + cover export ===' -ForegroundColor Cyan
& $ff -y -hide_banner -loglevel warning -framerate 15 -i "out/frames/cut/frame_%05d.png" -vf "scale=720:1280:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=128:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" -loop 0 "out/manhunt_cutdown_720x1280.gif"

Copy-Item (Join-Path $out 'stills\cover.png') (Join-Path $out 'manhunt_cover_1080x1920.png') -Force
Copy-Item (Join-Path $out 'stills\poster.png') (Join-Path $out 'manhunt_poster_1080x1920.png') -Force

Write-Host ''
Write-Host '=== done ===' -ForegroundColor Green
Get-ChildItem $out -File | Select-Object Name, @{N='MB';E={[math]::Round($_.Length/1MB,2)}} | Format-Table -AutoSize
