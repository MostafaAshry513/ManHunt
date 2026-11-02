# ManHunt MATCHDAY social pack build.
# Frames + stills from real premium captures, encodes with the static ffmpeg.
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/build.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File tools/build.ps1 -SkipFrames
param(
  [switch]$SkipFrames,
  [string]$OutDir = 'out'
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$ff = 'C:\dev\ManHunt\design\.tools\node_modules\ffmpeg-static\ffmpeg.exe'
if (-not (Test-Path $ff)) { throw "ffmpeg-static not found at $ff" }
$out = Join-Path $root $OutDir
New-Item -ItemType Directory -Force -Path $out, (Join-Path $out 'frames\reel15'), (Join-Path $out 'frames\reel30'), (Join-Path $out 'frames\gif6'), (Join-Path $out 'stills'), (Join-Path $out 'qa'), (Join-Path $out 'audio') | Out-Null

Write-Host ''
Write-Host '=== 1/5 original scores (15 / 30 / 6) ===' -ForegroundColor Cyan
node tools/audio.mjs 15
node tools/audio.mjs 30
node tools/audio.mjs 6

if (-not $SkipFrames) {
  Write-Host ''
  Write-Host '=== 2/5 reel frames (15s 450f / 30s 900f / gif 90f, jpeg) ===' -ForegroundColor Cyan
  node tools/capture.mjs frames reel15 "$OutDir/frames/reel15" --format jpeg --quality 92
  node tools/capture.mjs frames reel30 "$OutDir/frames/reel30" --format jpeg --quality 92
  node tools/capture.mjs frames gif6 "$OutDir/frames/gif6" --format jpeg --quality 92
}

Write-Host ''
Write-Host '=== 3/5 stills: poster, cover, static pack ===' -ForegroundColor Cyan
node tools/capture.mjs still "$OutDir/stills/poster.png" --url "t=0.55&timeline=reel15"
node tools/capture.mjs still "$OutDir/stills/cover.png" --page statics --url "layout=cover" --size 1080x1920
node tools/capture.mjs still "$out/manhunt_matchday_feed-1x1.png" --page statics --url "layout=feed1x1" --size 1080x1080
node tools/capture.mjs still "$out/manhunt_matchday_feed-1x1-result.png" --page statics --url "layout=feed1x1b" --size 1080x1080
node tools/capture.mjs still "$out/manhunt_matchday_portrait-4x5.png" --page statics --url "layout=portrait4x5" --size 1080x1350
node tools/capture.mjs still "$out/manhunt_matchday_story-9x16.png" --page statics --url "layout=story916" --size 1080x1920
node tools/capture.mjs still "$out/manhunt_matchday_story-end-9x16.png" --page statics --url "layout=storyend" --size 1080x1920
$carNames = @('hook', 'home', 'lobby', 'hunt', 'end')
for ($i = 1; $i -le 5; $i++) {
  $n = $i - 1
  node tools/capture.mjs still "$out/manhunt_matchday_carousel-$i-$($carNames[$n]).png" --page statics --url "layout=carousel&panel=$i" --size 1080x1350
}
Copy-Item "$OutDir/stills/cover.png" "$out/manhunt_matchday_cover_1080x1920.png" -Force
Copy-Item "$OutDir/stills/poster.png" "$out/manhunt_matchday_poster_1080x1920.png" -Force

Write-Host ''
Write-Host '=== 4/5 encodes: 15s MP4/WebM, 30s MP4, 6s GIF ===' -ForegroundColor Cyan
& $ff -y -hide_banner -loglevel warning -framerate 30 -i "$OutDir/frames/reel15/frame_%05d.jpg" -i "out/audio/matchday_score_15.wav" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level:v 4.2 -c:a aac -b:a 192k -ar 48000 -af "loudnorm=I=-16:TP=-1.5:LRA=11" -movflags +faststart -shortest "$out/manhunt_matchday_reel_15s_1080x1920.mp4"

& $ff -y -hide_banner -loglevel warning -framerate 30 -i "$OutDir/frames/reel15/frame_%05d.jpg" -i "out/audio/matchday_score_15.wav" -c:v libvpx-vp9 -crf 40 -b:v 0 -row-mt 1 -cpu-used 8 -pix_fmt yuv420p -c:a libopus -b:a 96k -ar 48000 -af "loudnorm=I=-16:TP=-1.5:LRA=11" -shortest "$out/manhunt_matchday_reel_15s_1080x1920.webm"

& $ff -y -hide_banner -loglevel warning -framerate 30 -i "$OutDir/frames/reel30/frame_%05d.jpg" -i "out/audio/matchday_score_30.wav" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level:v 4.2 -c:a aac -b:a 192k -ar 48000 -af "loudnorm=I=-16:TP=-1.5:LRA=11" -movflags +faststart -shortest "$out/manhunt_matchday_reel_30s_1080x1920.mp4"

& $ff -y -hide_banner -loglevel warning -framerate 15 -i "$OutDir/frames/gif6/frame_%05d.jpg" -vf "scale=480:854:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=64:stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" -loop 0 "$out/manhunt_matchday_teaser_6s_480x854.gif"

Write-Host ''
Write-Host '=== 5/5 QA + contact sheet ===' -ForegroundColor Cyan
$times = @(@('0.5','hook'), @('2.4','home'), @('6.1','lobby'), @('9.6','hunt'), @('11.1','claim'), @('12.3','result'), @('14.5','end'))
foreach ($p in $times) {
  & $ff -y -hide_banner -loglevel error -ss $p[0] -i "$out/manhunt_matchday_reel_15s_1080x1920.mp4" -frames:v 1 "$out/qa/15-$($p[1]).png"
  & $ff -y -hide_banner -loglevel error -ss $p[0] -i "$out/manhunt_matchday_reel_15s_1080x1920.mp4" -frames:v 1 -vf "scale=390:-1" "$out/qa/phone-$($p[1]).png"
}
& $ff -y -hide_banner -loglevel error -ss 20.0 -i "$out/manhunt_matchday_reel_30s_1080x1920.mp4" -frames:v 1 "$out/qa/30-chat.png"
& $ff -y -hide_banner -loglevel error -i "$out/manhunt_matchday_teaser_6s_480x854.gif" -vf "select='eq(n,89)'" -vsync 0 "$out/qa/gif-end.png"
& $ff -y -hide_banner -loglevel error -ss 9.8 -i "$out/manhunt_matchday_reel_15s_1080x1920.mp4" -frames:v 1 "$out/manhunt_matchday_reel15_frame.png"
& $ff -y -hide_banner -loglevel error -ss 10.0 -i "$out/manhunt_matchday_reel_30s_1080x1920.mp4" -frames:v 1 "$out/manhunt_matchday_reel30_frame.png"
node tools/capture.mjs still "$out/manhunt_matchday_contact-sheet.png" --page statics --url "layout=contact" --size 1600x2400

Write-Host ''
Write-Host '=== done ===' -ForegroundColor Green
Get-ChildItem $out -File | Select-Object Name, @{N='MB';E={[math]::Round($_.Length/1MB,2)}} | Format-Table -AutoSize
