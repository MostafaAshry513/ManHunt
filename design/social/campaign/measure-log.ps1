# ManHunt — campaign log reader (read-only)
#
# Reads the Fastify request log written by the hosted ManHunt server and reports the campaign's
# tagged traffic. It NEVER writes to the log, the database, the app or the server.
#
# Usage (from the repo root; Windows PowerShell 5.1 works, `pwsh` is optional):
#   powershell -NoProfile -ExecutionPolicy Bypass -File design/social/campaign/measure-log.ps1
#   powershell -NoProfile -ExecutionPolicy Bypass -File design/social/campaign/measure-log.ps1 -Campaign launch14
#   powershell -NoProfile -ExecutionPolicy Bypass -File design/social/campaign/measure-log.ps1 -LogPath C:\backup\server.out.log -Since 2026-11-02
#
# What is reliable vs directional:
#   - Tagged install-page hits (?utm_campaign=launch14) are the cleanest campaign signal in the log.
#   - Raw "/" hits are NOT a KPI: the public IP receives constant scanner/probe traffic.
#   - /app.apk downloads include in-app update downloads and bots; treat as directional.
#   - The install page's "accounts created" counters and the game database are the trustworthy funnel.
# See launch-playbook.md section 7-8 for the full measurement plan.

[CmdletBinding()]
param(
    [string] $LogPath = '',
    [string] $Campaign = 'launch14',
    [string] $Since = '',        # optional yyyy-MM-dd lower bound
    [int]    $MaxLines = 0        # 0 = entire file; otherwise only the last N lines
)

$ErrorActionPreference = 'Stop'

# Resolve the default log path inside the script body: $PSScriptRoot is not reliably populated
# while PowerShell evaluates parameter defaults under `powershell -File`.
if (-not $LogPath) {
    $root = if ($PSScriptRoot) { $PSScriptRoot } else { (Get-Location).Path }
    $LogPath = [System.IO.Path]::GetFullPath((Join-Path $root '..\..\..\logs\server.out.log'))
}

if (-not (Test-Path -LiteralPath $LogPath)) {
    Write-Host "Log not found: $LogPath" -ForegroundColor Red
    Write-Host "Pass -LogPath with the server log you copied from the deployment." -ForegroundColor Yellow
    exit 1
}

$log = Get-Content -LiteralPath $LogPath
if ($MaxLines -gt 0 -and $log.Count -gt $MaxLines) {
    $log = $log[($log.Count - $MaxLines)..($log.Count - 1)]
    Write-Host "Scanning the last $MaxLines log lines." -ForegroundColor DarkGray
}

$lineRx = [regex]'^\[(?<ts>[^\]]+)\]\s+(?<json>\{.*)$'
$records = New-Object System.Collections.Generic.List[object]
$scanned = 0
$badJson = 0

foreach ($line in $log) {
    $m = $lineRx.Match($line)
    if (-not $m.Success) { continue }
    $scanned++
    try { $obj = $m.Groups['json'].Value | ConvertFrom-Json } catch { $badJson++; continue }
    if ($null -eq $obj.req -or $null -eq $obj.req.url) { continue }

    $url = [string] $obj.req.url
    $query = ''
    $path = $url
    $qi = $url.IndexOf('?')
    if ($qi -ge 0) { $path = $url.Substring(0, $qi); $query = $url.Substring($qi + 1) }

    $records.Add([pscustomobject]@{
        Day    = $m.Groups['ts'].Value.Substring(0, 10)
        Method = [string] $obj.req.method
        Path   = $path
        Query  = $query
        Status = if ($null -ne $obj.res) { [int] $obj.res.statusCode } else { 0 }
    })
}

if ($Since) {
    $records = @($records | Where-Object { $_.Day -ge $Since })
}

$campaignRx = [regex]::Escape($Campaign)
$tagged = @($records | Where-Object { $_.Path -eq '/' -and $_.Query -match "utm_campaign=$campaignRx" })

function Get-Utm([string] $query, [string] $key) {
    $m = [regex]::Match($query, "(?:^|&)$key=([^&]*)")
    if ($m.Success) { [System.Uri]::UnescapeDataString($m.Groups[1].Value) } else { '' }
}

Write-Host ''
Write-Host 'ManHunt campaign log reader (read-only)' -ForegroundColor Cyan
Write-Host ("log:      {0}" -f (Resolve-Path -LiteralPath $LogPath))
Write-Host ("campaign: {0}" -f $Campaign)
Write-Host ("scanned:  {0} request records ({1} unparsable)" -f $scanned, $badJson)
Write-Host ''

# ---- 1. tagged campaign visits -------------------------------------------------------------
Write-Host 'Campaign-tagged install-page visits' -ForegroundColor White
if ($tagged.Count -eq 0) {
    Write-Host "  none yet - no request carried utm_campaign=$Campaign." -ForegroundColor Yellow
    Write-Host '  (Expected until the owner posts a tagged link. Check the link uses:'
    Write-Host "   http://74.208.99.178/?utm_source=...&utm_medium=...&utm_campaign=$Campaign&utm_content=...)"
} else {
    $bySource = $tagged | ForEach-Object {
        [pscustomobject]@{
            utm_source   = (Get-Utm $_.Query 'utm_source')
            utm_medium   = (Get-Utm $_.Query 'utm_medium')
            utm_content  = (Get-Utm $_.Query 'utm_content')
            Day          = $_.Day
        }
    }
    Write-Host ("  total: {0}" -f $tagged.Count)
    $bySource | Group-Object utm_source, utm_medium | Sort-Object Count -Descending |
        Select-Object Count, @{n = 'source'; e = { $_.Group[0].utm_source } }, @{n = 'medium'; e = { $_.Group[0].utm_medium } } |
        Format-Table -AutoSize | Out-String | Write-Host
    Write-Host '  by content id:'
    $bySource | Group-Object utm_content | Sort-Object Count -Descending |
        Select-Object Count, Name | Format-Table -AutoSize | Out-String | Write-Host
    Write-Host '  by day:'
    $bySource | Group-Object Day | Sort-Object Name |
        Select-Object Name, Count | Format-Table -AutoSize | Out-String | Write-Host
}

# ---- 2. apk downloads (directional) --------------------------------------------------------
$apk = @($records | Where-Object { $_.Path -eq '/app.apk' -and ($_.Method -eq 'GET' -or $_.Method -eq 'HEAD') })
Write-Host 'APK downloads (directional: includes in-app updaters and bots)' -ForegroundColor White
Write-Host ("  total requests: {0}" -f $apk.Count)
$apk | Group-Object Day | Sort-Object Name |
    Select-Object Name, Count | Format-Table -AutoSize | Out-String | Write-Host

# ---- 3. room invite landings (share loop proxy) -------------------------------------------
$joins = @($records | Where-Object { $_.Path -eq '/join' })
Write-Host 'Room-invite landing-page hits (/join?code=..., share-loop proxy)' -ForegroundColor White
Write-Host ("  total requests: {0}" -f $joins.Count)
if ($joins.Count -gt 0) {
    $joins | Group-Object Day | Sort-Object Name |
        Select-Object Name, Count | Format-Table -AutoSize | Out-String | Write-Host
}

# ---- 4. untagged install-page volume (noise warning) --------------------------------------
$untagged = @($records | Where-Object { $_.Path -eq '/' -and $_.Query -notmatch "utm_campaign=$campaignRx" })
Write-Host 'Untagged install-page hits (NOT a KPI - scanner/probe noise included)' -ForegroundColor White
Write-Host ("  total requests: {0}" -f $untagged.Count)
$probe = @($untagged | Where-Object {
    $_.Query -match '\.env|wp-config|phpinfo|jndi|rest_route|\.aws|login\.aspx|autodiscover|configPath|unix:|WBM-XSS'
})
Write-Host ("  of which look like probes/scanners: ~{0}" -f $probe.Count)
Write-Host ''

# ---- 5. funnel reminder --------------------------------------------------------------------
Write-Host 'Trustworthy funnel (run these read-only queries; see launch-playbook.md section 7):' -ForegroundColor White
Write-Host @'
  node -e "const {DatabaseSync}=require('node:sqlite');
  const db=new DatabaseSync('C:/dev/ManHunt/server/data/manhunt.db',{readOnly:true});
  console.table({
    users:    db.prepare('SELECT COUNT(*) n FROM users').get().n,
    accountsToday: db.prepare("SELECT COUNT(*) n FROM users WHERE date(created_at/1000,'unixepoch')=date('now')").get().n,
    rooms2plus: db.prepare('SELECT COUNT(*) n FROM (SELECT room_id FROM room_members GROUP BY room_id HAVING COUNT(*)>=2)').get().n,
    matches:  db.prepare('SELECT COUNT(*) n FROM matches').get().n,
    finished: db.prepare("SELECT COUNT(*) n FROM matches WHERE status='finished'").get().n,
    tags:     db.prepare('SELECT COUNT(*) n FROM tags').get().n
  }); db.close();"
'@ -ForegroundColor DarkGray
Write-Host 'Reminder: snapshot the install page daily and label accounts as including test accounts.' -ForegroundColor DarkGray
exit 0
