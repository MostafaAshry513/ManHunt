<#
.SYNOPSIS
    Checks the ManHunt backend health endpoint.

.DESCRIPTION
    Calls GET http://127.0.0.1:<Port>/health with a timeout, prints the HTTP
    status and response body, and exits:
      0  HTTP success and body contains "ok": true
      1  endpoint responded but is not healthy or not valid JSON
      2  request failed (connection refused, timeout, non-success HTTP status)

    Intended for scheduled checks and post-deploy verification. It does not
    restart anything and makes no changes.

.PARAMETER Port
    Backend port. Defaults to 8080.

.PARAMETER ListenHost
    Address to probe. Defaults to 127.0.0.1.

.PARAMETER TimeoutSeconds
    Request timeout in seconds. Defaults to 10.

.PARAMETER Path
    Health endpoint path. Defaults to /health.

.EXAMPLE
    .\healthcheck.ps1

.EXAMPLE
    $code = (powershell.exe -NoProfile -ExecutionPolicy Bypass -File `
        .\healthcheck.ps1 -Port 8080); Write-Host "exit=$LASTEXITCODE"

.NOTES
    PowerShell 5.1 compatible. No external modules.

    The script sets an explicit process exit code with `exit`. When calling it
    from an interactive session, run it through powershell.exe -File so the
    exit does not close the current session.
#>
[CmdletBinding()]
param(
    [ValidateRange(1, 65535)]
    [int]$Port = 8080,

    [string]$ListenHost = '127.0.0.1',

    [ValidateRange(1, 120)]
    [int]$TimeoutSeconds = 10,

    [string]$Path = '/health'
)

$ErrorActionPreference = 'Stop'

if (-not $Path.StartsWith('/')) {
    $Path = '/' + $Path
}
$url = 'http://{0}:{1}{2}' -f $ListenHost, $Port, $Path

$body = $null
try {
    $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec $TimeoutSeconds
    $body = [string]$response.Content
    Write-Output ('HTTP {0} {1}' -f [int]$response.StatusCode, $response.StatusDescription)
    Write-Output $body
}
catch {
    $message = $_.Exception.Message
    $statusCode = $null

    if ($null -ne $_.Exception.PSObject.Properties['Response'] -and $null -ne $_.Exception.Response) {
        try {
            $webResponse = $_.Exception.Response
            $statusCode = [int]$webResponse.StatusCode
            $stream = $webResponse.GetResponseStream()
            if ($null -ne $stream) {
                $reader = New-Object System.IO.StreamReader($stream)
                $body = $reader.ReadToEnd()
                $reader.Dispose()
                $stream.Dispose()
            }
        }
        catch {
            # Fall back to the exception message below.
        }
    }

    Write-Output ('Health check request failed: {0}' -f $message)
    if ($null -ne $statusCode) {
        Write-Output ('HTTP {0}' -f $statusCode)
    }
    if (-not [string]::IsNullOrWhiteSpace($body)) {
        Write-Output $body
    }
    exit 2
}

try {
    $payload = $body | ConvertFrom-Json
}
catch {
    Write-Output 'Health check failed: response was not valid JSON.'
    exit 2
}

if ($null -eq $payload.ok -or $payload.ok -ne $true) {
    Write-Output 'Health check failed: response did not contain "ok": true.'
    exit 1
}

Write-Output 'Health check passed: "ok": true.'
exit 0
