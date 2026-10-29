#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Allows the ManHunt API only from specific client IPs.

.DESCRIPTION
    Creates (or replaces) an inbound Windows Firewall rule for the API port,
    scoped to the IP addresses you pass in. The port is never opened to the
    whole internet by this script.

.EXAMPLE
    .\allow-client.ps1 -RemoteAddress 203.0.113.10

.EXAMPLE
    .\allow-client.ps1 -RemoteAddress 203.0.113.10,198.51.100.7 -Port 8080

.EXAMPLE
    .\allow-client.ps1 -Remove
#>
[CmdletBinding(SupportsShouldProcess)]
param(
    [Parameter(Mandatory = $false)]
    [string[]]$RemoteAddress = @(),

    [int]$Port = 8080,

    [string]$RuleName = 'ManHunt API (scoped clients)',

    [switch]$Remove
)

$ErrorActionPreference = 'Stop'

function Assert-Elevated {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw 'Run this script from an elevated PowerShell window.'
    }
}

Assert-Elevated

$existing = Get-NetFirewallRule -DisplayName $RuleName -ErrorAction SilentlyContinue
if ($existing) {
    if ($PSCmdlet.ShouldProcess($RuleName, 'Remove existing rule')) {
        Remove-NetFirewallRule -DisplayName $RuleName
        Write-Host "Removed existing rule '$RuleName'."
    }
}

if ($Remove) {
    Write-Host 'No rule remains.'
    return
}

if (-not $RemoteAddress -or $RemoteAddress.Count -eq 0) {
    throw 'Pass at least one -RemoteAddress (your public IP), or use -Remove.'
}

foreach ($address in $RemoteAddress) {
    $parsed = $null
    if (-not [System.Net.IPAddress]::TryParse($address, [ref]$parsed)) {
        throw "'$address' is not a valid IPv4/IPv6 address. Ranges are not accepted by design."
    }
}

if ($PSCmdlet.ShouldProcess($RuleName, "Allow TCP $Port from $($RemoteAddress -join ', ')")) {
    New-NetFirewallRule `
        -DisplayName $RuleName `
        -Description 'ManHunt API, restricted to approved client IPs' `
        -Direction Inbound `
        -Action Allow `
        -Protocol TCP `
        -LocalPort $Port `
        -RemoteAddress $RemoteAddress `
        -Profile Any `
        -Enabled True | Out-Null
}

$rule = Get-NetFirewallRule -DisplayName $RuleName
$filter = $rule | Get-NetFirewallPortFilter
$addresses = $rule | Get-NetFirewallAddressFilter

Write-Host "Rule '$RuleName' enabled=$($rule.Enabled) port=$($filter.LocalPort) from=$($addresses.RemoteAddress -join ', ')"
Write-Host "Test from an approved device: http://<server-public-ip>:$Port/health"
Write-Host 'Reminder: this is cleartext HTTP. Put TLS (Caddy) in front before real public use.'
