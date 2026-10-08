param(
    [ValidateRange(1, 65535)][int]$DatabasePort = 5432,
    [ValidateRange(1, 65535)][int]$ServerPort = 8080
)
$ErrorActionPreference = 'Stop'
$envFile = Join-Path $PSScriptRoot '.env'
if (Test-Path -LiteralPath $envFile) {
    Write-Host '.env already exists. Kept your settings; no password was changed.'
    exit 0
}
function New-RandomValue([int]$Count) {
    $bytes = New-Object byte[] $Count
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($bytes) } finally { $random.Dispose() }
    return [Convert]::ToBase64String($bytes)
}
$values = @{
    DB_URL = "jdbc:postgresql://127.0.0.1:$DatabasePort/ttcs_handoff"
    DB_PORT = [string]$DatabasePort
    DB_PASSWORD = (New-RandomValue 24)
    AUTH_JWT_SECRET = (New-RandomValue 48)
    BOOTSTRAP_ADMIN_PASSWORD = ('Ttcs9-' + (New-RandomValue 18))
    SERVER_PORT = [string]$ServerPort
}
$lines = foreach ($line in [IO.File]::ReadAllLines((Join-Path $PSScriptRoot '.env.example'))) {
    $key = ($line -split '=', 2)[0]
    if ($values.ContainsKey($key)) { "$key=$($values[$key])" } else { $line }
}
[IO.File]::WriteAllLines($envFile, [string[]]$lines, (New-Object Text.UTF8Encoding($false)))
Write-Host 'Created .env with new passwords and signing key for THIS machine.'
Write-Host 'Open .env locally to see BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD.'
Write-Host 'Keep .env private. Changing the bootstrap password does not reset an existing account.'
