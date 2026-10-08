$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Read-Environment.ps1')
$settings = Read-HandoffEnvironment
$base = 'http://localhost:' + $settings.SERVER_PORT + '/api/v1'
$health = Invoke-RestMethod -Uri "$base/health" -TimeoutSec 15
$body = @{ email = $settings.BOOTSTRAP_ADMIN_EMAIL; password = $settings.BOOTSTRAP_ADMIN_PASSWORD } | ConvertTo-Json
$login = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType 'application/json; charset=utf-8' -Body $body -TimeoutSec 15
if (-not $login.accessToken -or -not $login.user.roles) { throw 'Login response does not match the API contract.' }
$headers = @{ Authorization = 'Bearer ' + $login.accessToken }
$me = Invoke-RestMethod -Uri "$base/auth/me" -Headers $headers -TimeoutSec 15
[pscustomobject]@{ Health = $health.status; Email = $login.user.email; Roles = ($login.user.roles -join ', '); AccessTokenReceived = $true; ProtectedApi = 'OK' }
Write-Host 'Test uses the initial admin password. After changing that password, log in with your new password.'
