param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-z0-9-]+$')]
  [string]$ProfileName
)

$ErrorActionPreference = 'Stop'
$profileCommand = Get-Command $ProfileName -ErrorAction Stop
$sessionFile = Join-Path $env:LOCALAPPDATA "hermes\profiles\$ProfileName\zalo_personal\credentials.json"
if (-not (Test-Path -LiteralPath $sessionFile)) {
  throw "Chưa đăng nhập Zalo cho profile $ProfileName. Chạy: $ProfileName zalo_personal login"
}

$status = & $profileCommand.Source gateway status 2>$null
if (($status -join "`n") -match 'Gateway process running|Gateway is running') {
  Write-Output "Gateway $ProfileName đang chạy."
  exit 0
}
Start-Process -FilePath $profileCommand.Source -ArgumentList 'gateway', 'run' -WindowStyle Hidden
Write-Output "Đã khởi động gateway $ProfileName nền."
