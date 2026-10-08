function Read-HandoffEnvironment {
    $envFile = Join-Path $PSScriptRoot '.env'
    if (-not (Test-Path -LiteralPath $envFile)) {
        throw 'Missing .env. Run Initialize-Environment.ps1 first.'
    }
    $settings = @{}
    foreach ($line in [IO.File]::ReadAllLines($envFile)) {
        if ($line -match '^\s*(#|$)') { continue }
        $parts = $line -split '=', 2
        if ($parts.Count -eq 2) { $settings[$parts[0].Trim()] = $parts[1] }
    }
    return $settings
}
