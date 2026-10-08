$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Read-Environment.ps1')
$settings = Read-HandoffEnvironment
foreach ($key in @('DB_URL', 'DB_USERNAME', 'DB_PASSWORD', 'AUTH_JWT_SECRET')) {
    if (-not $settings[$key]) { throw "Missing $key in .env." }
}
$java = if ($env:JAVA_HOME -and (Test-Path -LiteralPath (Join-Path $env:JAVA_HOME 'bin\java.exe'))) {
    Join-Path $env:JAVA_HOME 'bin\java.exe'
} else { (Get-Command java -ErrorAction Stop).Source }
$jar = Join-Path $PSScriptRoot 'backend\ttcs-backend.jar'
if (-not (Test-Path -LiteralPath $jar)) { throw 'Missing backend/ttcs-backend.jar. Extract the complete ZIP.' }
Push-Location $PSScriptRoot
try {
    Write-Host 'Starting backend in this window. Press Ctrl+C to stop.'
    & $java -jar $jar
    if ($LASTEXITCODE -ne 0) { throw "Backend exited with code $LASTEXITCODE. Read the error above." }
} finally { Pop-Location }
