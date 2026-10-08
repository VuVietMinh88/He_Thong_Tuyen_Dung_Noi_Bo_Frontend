$ErrorActionPreference = 'Stop'
Get-Command docker -ErrorAction Stop | Out-Null
if (-not (Test-Path -LiteralPath (Join-Path $PSScriptRoot '.env'))) { throw 'Run Initialize-Environment.ps1 first.' }
Push-Location $PSScriptRoot
try {
    & docker compose --env-file .env -f compose.yaml up --build
    if ($LASTEXITCODE -ne 0) { throw "Docker Compose exited with code $LASTEXITCODE." }
} finally { Pop-Location }
