# ManHunt site redesign — fonts
#
# The site uses the SAME three open-licence faces as the approved app redesign
# (design/redesign/direction.md §4.1): Big Shoulders Display (display type),
# Instrument Sans (body), Red Hat Mono (machine data). The TTFs are already in the repo
# (design/brand/motion-kit/assets/fonts and android/app/src/main/res/font, with OFL licences).
#
# This script subsets them to the Latin ranges the page actually needs and converts to WOFF2
# so the page ships ~70 KB of type instead of ~265 KB of TTF. Requires:
#   python -m pip install fonttools brotli
#
# Run from the repo root:  pwsh -File design/site-redesign/tools/build-fonts.ps1
$ErrorActionPreference = 'Stop'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..\..')
$src  = Join-Path $root 'design\brand\motion-kit\assets\fonts'
$out  = Join-Path $root 'server\public\site'
$spec = Join-Path $root 'design\site-redesign\fonts'

# Latin + punctuation the page uses (curly quotes, dashes, middot, multiplication sign, arrows, ellipsis).
$unicode = 'U+0020-007E,U+00A0-00FF,U+2010-2015,U+2018-201D,U+2020-2022,U+2026,U+2032-2033,U+00B7,U+00D7,U+2190-2193'

$jobs = @(
  @{ In = 'BigShoulders-Bold.ttf';   Out = 'big-shoulders-700.woff2' },
  @{ In = 'InstrumentSans-Regular.ttf'; Out = 'instrument-sans-400.woff2' },
  @{ In = 'InstrumentSans-Bold.ttf'; Out = 'instrument-sans-700.woff2' },
  @{ In = 'RedHatMono-Regular.ttf';  Out = 'red-hat-mono-400.woff2' }
)

foreach ($job in $jobs) {
  $inPath = Join-Path $src $job.In
  $outPath = Join-Path $out $job.Out
  python -m fontTools.subset $inPath `
    --output-file=$outPath `
    --flavor=woff2 `
    --unicodes=$unicode `
    --layout-features='kern,liga,tnum,case' `
    --no-hinting `
    --desubroutinize
  if ($LASTEXITCODE -ne 0) { throw "subset failed for $($job.In)" }
  $size = (Get-Item $outPath).Length
  Write-Output ("{0,-28} -> {1,-30} {2,6} KB" -f $job.In, $job.Out, [int]($size / 1024))
}

# Keep the licence texts next to the design spec (OFL requires the licence to travel with the font).
foreach ($lic in 'BigShoulders-OFL.txt', 'InstrumentSans-OFL.txt', 'RedHatMono-OFL.txt') {
  Copy-Item (Join-Path $src $lic) (Join-Path $spec $lic) -Force
}
Write-Output "licences copied to design/site-redesign/fonts/"
