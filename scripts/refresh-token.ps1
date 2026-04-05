# Exchanges the current Meta Access Token for a fresh long-lived token
# (roughly 60 days) and updates dashboard/.env in place.
#
# Requires META_APP_ID, META_APP_SECRET and META_ACCESS_TOKEN to be set
# in dashboard/.env.
#
# Usage: powershell -ExecutionPolicy Bypass -File scripts\refresh-token.ps1

$ErrorActionPreference = 'Stop'

$ProjectRoot = Resolve-Path (Join-Path $PSScriptRoot '..')
$EnvFile = Join-Path $ProjectRoot 'dashboard\.env'
$GraphVersion = 'v21.0'

if (-not (Test-Path $EnvFile)) {
    Write-Error "dashboard\.env not found. Run scripts\setup.ps1 first."
    exit 1
}

# Parse .env file into a hashtable
$envVars = @{}
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*#') { return }
    if ($_ -match '^\s*$') { return }
    if ($_ -match '^([^=]+)=(.*)$') {
        $envVars[$matches[1].Trim()] = $matches[2].Trim()
    }
}

$MetaToken     = $envVars['META_ACCESS_TOKEN']
$MetaAppSecret = $envVars['META_APP_SECRET']
$MetaAppId     = $envVars['META_APP_ID']

if ([string]::IsNullOrWhiteSpace($MetaToken) -or
    [string]::IsNullOrWhiteSpace($MetaAppSecret) -or
    [string]::IsNullOrWhiteSpace($MetaAppId)) {
    Write-Error "META_ACCESS_TOKEN, META_APP_SECRET and META_APP_ID must all be set in dashboard\.env."
    Write-Host "Edit the file or run scripts\setup.ps1 again."
    exit 1
}

Write-Host "Requesting a fresh long-lived token from Meta..."

$Uri = "https://graph.facebook.com/$GraphVersion/oauth/access_token"
try {
    $response = Invoke-RestMethod -Uri $Uri -Method Get -Body @{
        grant_type        = 'fb_exchange_token'
        client_id         = $MetaAppId
        client_secret     = $MetaAppSecret
        fb_exchange_token = $MetaToken
    }
} catch {
    Write-Error "Could not refresh token: $($_.Exception.Message)"
    Write-Host "Generate a new token at https://developers.facebook.com/tools/explorer/ and run scripts\setup.ps1 again."
    exit 1
}

$NewToken = $response.access_token
$ExpiresIn = [int]$response.expires_in
$Days = [math]::Floor($ExpiresIn / 86400)

if ([string]::IsNullOrWhiteSpace($NewToken)) {
    Write-Error "Meta did not return a new token."
    exit 1
}

$stamp = Get-Date -Format 'yyyy-MM-dd HH:mm'
@"
# Meta Ads API Credentials
# Refreshed by scripts\refresh-token.ps1 on $stamp
# Long-lived token expires in ~$Days days
# Do not commit this file.
META_ACCESS_TOKEN=$NewToken
META_APP_SECRET=$MetaAppSecret
META_APP_ID=$MetaAppId
"@ | Set-Content -Path $EnvFile -Encoding UTF8

Write-Host ""
Write-Host "Token refreshed. Expires in ~$Days days." -ForegroundColor Green
Write-Host "Restart the dev server for the new token to take effect."
Write-Host ""
