param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-z0-9-]+$')]
  [string]$ProfileName
)

$ErrorActionPreference = 'Stop'
$profileCommand = Get-Command $ProfileName -ErrorAction Stop
& $profileCommand.Source gateway stop
