param([string]$PostgresBin, [string]$AdminUser = 'postgres')
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Read-Environment.ps1')
$settings = Read-HandoffEnvironment
if (-not $PostgresBin) {
    $command = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($command) { $PostgresBin = Split-Path $command.Source }
    else {
        $install = Get-ChildItem 'C:\Program Files\PostgreSQL' -Directory -ErrorAction SilentlyContinue |
            Where-Object { $_.Name -match '^\d+$' } |
            Sort-Object { [int]$_.Name } -Descending | Select-Object -First 1
        if ($install) { $PostgresBin = Join-Path $install.FullName 'bin' }
    }
}
if (-not $PostgresBin -or -not (Test-Path -LiteralPath (Join-Path $PostgresBin 'psql.exe'))) {
    throw 'Install PostgreSQL 16, or provide -PostgresBin pointing to its bin folder.'
}
$psql = Join-Path $PostgresBin 'psql.exe'
$database = $settings.DB_NAME
$dbUser = $settings.DB_USERNAME
foreach ($name in @($database, $dbUser)) {
    if ($name -notmatch '^[a-z][a-z0-9_]{0,62}$') { throw 'Use lowercase letters, digits and underscore for database/user names.' }
}
if (-not $settings.DB_PASSWORD) { throw 'DB_PASSWORD is empty.' }
$previousPassword = $env:PGPASSWORD
try {
    if (-not $env:PGPASSWORD) {
        $securePassword = Read-Host "Password of PostgreSQL administrator $AdminUser (not the app password)" -AsSecureString
        $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
        try { $env:PGPASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
        finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
    }
    $connection = @('-X', '-w', '-h', $settings.DB_HOST, '-p', $settings.DB_PORT, '-U', $AdminUser, '-d', 'postgres', '-v', 'ON_ERROR_STOP=1')
    $exists = & $psql @connection -At -c "SELECT 1 FROM pg_database WHERE datname = '$database' UNION ALL SELECT 1 FROM pg_roles WHERE rolname = '$dbUser';"
    if ($LASTEXITCODE -ne 0) { throw 'Could not connect as PostgreSQL administrator. Check host, port and password.' }
    if ($exists) { throw 'Database or app user already exists. Kept existing data. If already set up, continue with Run-Backend.ps1.' }
    $quotedPassword = $settings.DB_PASSWORD.Replace("'", "''")
    "CREATE ROLE $dbUser LOGIN PASSWORD '$quotedPassword';" | & $psql @connection
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the app user.' }
    "CREATE DATABASE $database OWNER $dbUser ENCODING 'UTF8' TEMPLATE template0;" | & $psql @connection
    if ($LASTEXITCODE -ne 0) { throw 'Could not create the database. The app user was created; inspect before retrying.' }
    Write-Host 'Created an empty database. The backend creates tables on first startup.'
} finally { $env:PGPASSWORD = $previousPassword }
