<#
.SYNOPSIS
    Creates a consistent, timestamped backup of the ManHunt SQLite database.

.DESCRIPTION
    Uses Node's built-in node:sqlite module with VACUUM INTO to produce a
    single-file snapshot while the server is running. VACUUM INTO reads a
    consistent snapshot including the WAL, so no downtime is required.

    The backup is written to <repo>\backups\manhunt-<UTC timestamp>[-label].db.
    An existing file is never overwritten. The snapshot is then reopened
    read-only and checked with PRAGMA integrity_check.

    This script does NOT delete old backups. Retention is an explicit operator
    decision.

.PARAMETER DbPath
    Source SQLite database. Defaults to <repo>\server\data\manhunt.db.

.PARAMETER BackupDir
    Destination directory. Defaults to <repo>\backups.

.PARAMETER NodePath
    Path to node.exe, or a command name such as 'node' (default).

.PARAMETER Label
    Optional suffix for the filename (for example 'preupdate'). Characters
    outside A-Z, a-z, 0-9, dot, underscore and hyphen are replaced with '-'.

.EXAMPLE
    .\backup-db.ps1

.EXAMPLE
    .\backup-db.ps1 -Label preupdate -BackupDir D:\ManHuntBackups

.NOTES
    Requires Node.js 24+ (node:sqlite). No external modules.
    Prints the absolute path of the created backup.
#>
[CmdletBinding()]
param(
    [string]$DbPath = '',

    [string]$BackupDir = '',

    [string]$NodePath = 'node',

    [string]$Label = ''
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

$repoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

if ([string]::IsNullOrWhiteSpace($DbPath)) {
    $DbPath = Join-Path $repoRoot 'server\data\manhunt.db'
}
$DbPath = [IO.Path]::GetFullPath($DbPath)

if ([string]::IsNullOrWhiteSpace($BackupDir)) {
    $BackupDir = Join-Path $repoRoot 'backups'
}
$BackupDir = [IO.Path]::GetFullPath($BackupDir)

if (-not (Test-Path -LiteralPath $DbPath -PathType Leaf)) {
    throw "Database not found: $DbPath"
}

if (Test-Path -LiteralPath $NodePath -PathType Leaf) {
    $nodeExe = (Resolve-Path -LiteralPath $NodePath).Path
}
else {
    $nodeCommand = Get-Command -Name $NodePath -CommandType Application -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($null -eq $nodeCommand) {
        throw "Node executable not found: '$NodePath'. Install Node.js 24+ or pass -NodePath."
    }
    $nodeExe = $nodeCommand.Source
}

New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null

$stamp = (Get-Date).ToUniversalTime().ToString('yyyyMMdd-HHmmss-fff')
$fileName = "manhunt-$stamp"
if (-not [string]::IsNullOrWhiteSpace($Label)) {
    $safeLabel = $Label -replace '[^A-Za-z0-9._-]', '-'
    if ([string]::IsNullOrWhiteSpace($safeLabel)) {
        throw "Label '$Label' does not contain any usable characters."
    }
    $fileName = "$fileName-$safeLabel"
}
$outPath = Join-Path $BackupDir ($fileName + '.db')

if (Test-Path -LiteralPath $outPath) {
    throw "Refusing to overwrite existing backup: $outPath. Retry with a different -Label."
}

# Keep the embedded JavaScript free of double quotes: Windows PowerShell 5.1
# strips them when passing a -e argument to a native executable.
$js = @'
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const src = process.env.MANHUNT_BACKUP_SRC;
const dst = process.env.MANHUNT_BACKUP_DST;
if (!src || !dst) { console.error('MANHUNT_BACKUP_SRC/DST are not set'); process.exit(2); }
if (!fs.existsSync(src)) { console.error('source database not found: ' + src); process.exit(2); }
if (fs.existsSync(dst)) { console.error('refusing to overwrite: ' + dst); process.exit(3); }
const db = new DatabaseSync(src, { readOnly: true });
try {
  const q = String.fromCharCode(39);
  db.exec('VACUUM INTO ' + q + dst.split(q).join(q + q) + q);
} finally {
  db.close();
}
const check = new DatabaseSync(dst, { readOnly: true });
try {
  const row = check.prepare('PRAGMA integrity_check').get();
  const result = row ? Object.values(row)[0] : 'unknown';
  if (result !== 'ok') { console.error('integrity_check failed: ' + result); process.exit(4); }
} finally {
  check.close();
}
'@

$oldSrc = [Environment]::GetEnvironmentVariable('MANHUNT_BACKUP_SRC', 'Process')
$oldDst = [Environment]::GetEnvironmentVariable('MANHUNT_BACKUP_DST', 'Process')
try {
    [Environment]::SetEnvironmentVariable('MANHUNT_BACKUP_SRC', $DbPath, 'Process')
    [Environment]::SetEnvironmentVariable('MANHUNT_BACKUP_DST', $outPath, 'Process')

    & $nodeExe -e $js
    $nodeExitCode = $LASTEXITCODE
}
finally {
    [Environment]::SetEnvironmentVariable('MANHUNT_BACKUP_SRC', $oldSrc, 'Process')
    [Environment]::SetEnvironmentVariable('MANHUNT_BACKUP_DST', $oldDst, 'Process')
}

if ($nodeExitCode -ne 0) {
    throw "Backup failed (node exit code $nodeExitCode). Partial file may exist at: $outPath"
}
if (-not (Test-Path -LiteralPath $outPath -PathType Leaf)) {
    throw "Backup command reported success but no file exists at: $outPath"
}

$size = (Get-Item -LiteralPath $outPath).Length
Write-Host ("Backup created: {0} ({1:N0} bytes)" -f $outPath, $size)
Write-Host 'Integrity check: ok'
Write-Output $outPath
