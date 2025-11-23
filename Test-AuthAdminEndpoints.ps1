$BASE_URL = "http://34.213.51.153"
$ADMIN_USERNAME = "admin@cibf.lk"
$ADMIN_PASSWORD = "admin123"
$USER_ID = 11

# Disable SSL certificate validation
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "Authenticating..." -ForegroundColor Cyan

$loginUrl = "$BASE_URL/api/auth/login"
$body = @{
    username = $ADMIN_USERNAME
    password = $ADMIN_PASSWORD
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -Body $body

Write-Host "Login response type: $($login.GetType().Name)" -ForegroundColor Gray
Write-Host "Login response: $($login | ConvertTo-Json -Depth 5)" -ForegroundColor Yellow

# Check for token in both possible field names
$token = if ($login.token) { $login.token } elseif ($login.accessToken) { $login.accessToken } else { $null }

Write-Host "Token extracted: $token" -ForegroundColor Gray

if (-not $token) {
    Write-Host "Failed to get token from response" -ForegroundColor Red
    Write-Host "Available properties: $($login | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name)" -ForegroundColor Yellow
    exit 1
}

Write-Host "Token received - Length: $($token.Length)" -ForegroundColor Green

$deleteUrl = "$BASE_URL/api/admin/users/$USER_ID"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

Write-Host "Deleting user $USER_ID..." -ForegroundColor Cyan
Write-Host "URL: $deleteUrl" -ForegroundColor Gray

try {
    $result = Invoke-RestMethod -Uri $deleteUrl -Method Delete -Headers $headers -ContentType "application/json"
    Write-Host "✓ User deleted successfully" -ForegroundColor Green
    Write-Host ($result | ConvertTo-Json)
} catch {
    Write-Host "✗ Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $statusCode = [int]$_.Exception.Response.StatusCode
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
    }
    exit 1
}