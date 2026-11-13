param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-z0-9-]+$')]
  [string]$ProfileName
)

$ErrorActionPreference = 'Stop'
$scriptPath = Join-Path $PSScriptRoot 'start-zalo-personal.ps1'
$taskName = "Hermes Zalo Personal - $ProfileName"
$argument = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`" -ProfileName `"$ProfileName`""
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $argument
$trigger = New-ScheduledTaskTrigger -AtLogOn -User "$env:USERDOMAIN\$env:USERNAME"
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Description "Start Hermes Zalo Personal profile $ProfileName." -Force | Out-Null
Write-Output "Đã đăng ký Scheduled Task: $taskName"
