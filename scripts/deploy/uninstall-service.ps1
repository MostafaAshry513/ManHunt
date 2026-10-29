<#
.SYNOPSIS
    Removes the ManHunt backend scheduled task.

.DESCRIPTION
    Stops the task if it is running, then unregisters it. The backend files,
    database, and logs are left untouched. Running this when the task does not
    exist is a no-op (with a warning), so it is safe to use during cleanup.

    This script does NOT close or modify firewall rules and does NOT delete
    data. Those are separate, explicit operations.

.PARAMETER TaskName
    Scheduled task name. Defaults to ManHuntServer.

.EXAMPLE
    # Elevated PowerShell
    .\uninstall-service.ps1

.EXAMPLE
    .\uninstall-service.ps1 -TaskName ManHuntServer -WhatIf

.NOTES
    Requires an elevated PowerShell session. Uses built-in ScheduledTasks
    cmdlets only; no external modules.
#>
[CmdletBinding(SupportsShouldProcess = $true)]
param(
    [string]$TaskName = 'ManHuntServer'
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version 2.0

function Test-IsElevated {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($identity)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-IsElevated)) {
    throw ('Administrator rights are required to remove a scheduled task that runs as SYSTEM. ' +
        'Close this window, open PowerShell with "Run as administrator", and run the script again.')
}

if ([string]::IsNullOrWhiteSpace($TaskName)) {
    throw 'TaskName must not be empty.'
}

$task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
if ($null -eq $task) {
    Write-Warning "Scheduled task '$TaskName' is not registered. Nothing to remove."
    return
}

if ($PSCmdlet.ShouldProcess($TaskName, 'Stop and unregister scheduled task')) {
    if ($task.State -eq 'Running') {
        Write-Host ("Stopping scheduled task '{0}'..." -f $TaskName)
        Stop-ScheduledTask -TaskName $TaskName
    }

    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host ("Removed scheduled task '{0}'. Logs, backups and database were not changed." -f $TaskName)
}
