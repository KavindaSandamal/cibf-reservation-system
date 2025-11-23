$BASE_URL = "http://34.213.51.153"
$ADMIN_USERNAME = "admin@cibf.lk"
$ADMIN_PASSWORD = "admin123"
$USER_ID = 11

[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "=== Diagnosing Reservation Endpoint Access ===" -ForegroundColor Cyan
Write-Host ""

# Authenticate
Write-Host "[1] Authenticating..." -ForegroundColor Yellow
$loginUrl = "$BASE_URL/api/auth/login"
$loginBody = @{
    username = $ADMIN_USERNAME
    password = $ADMIN_PASSWORD
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -Body $loginBody
    $token = $response.accessToken
    Write-Host "SUCCESS: Authenticated" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "ERROR: Authentication failed" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 1: Try the endpoint WITH authentication
Write-Host "[2] Testing: /api/admin/reservations/reservations/user/$USER_ID (WITH auth)" -ForegroundColor Yellow
$url1 = "$BASE_URL/api/admin/reservations/reservations/user/$USER_ID"

try {
    $result1 = Invoke-RestMethod -Uri $url1 -Method Get -Headers $headers
    Write-Host "SUCCESS: Got $($result1.Count) reservations" -ForegroundColor Green
    $activeCount = ($result1 | Where-Object { $_.status -ne "CANCELLED" }).Count
    Write-Host "Active (non-cancelled): $activeCount" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "FAILED: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# Test 2: Try the endpoint WITHOUT authentication
Write-Host "[3] Testing: Same endpoint WITHOUT auth (how backend calls it)" -ForegroundColor Yellow

try {
    $result2 = Invoke-RestMethod -Uri $url1 -Method Get
    Write-Host "SUCCESS: Works without auth" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "FAILED: Requires authentication" -ForegroundColor Red
    Write-Host "THIS IS THE PROBLEM - RestTemplate needs auth headers!" -ForegroundColor Yellow
    Write-Host ""
}

# Test 3: Check alternative endpoints
Write-Host "[4] Checking for alternative public endpoints..." -ForegroundColor Yellow

$publicUrls = @(
    "$BASE_URL/api/reservations/user/$USER_ID",
    "$BASE_URL/api/admin/reservations/user/$USER_ID"
)

foreach ($url in $publicUrls) {
    Write-Host "Testing: $url" -ForegroundColor DarkGray
    try {
        $result = Invoke-RestMethod -Uri $url -Method Get -Headers $headers
        Write-Host "SUCCESS: Got $($result.Count) reservations" -ForegroundColor Green
    } catch {
        Write-Host "FAILED" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Diagnosis Complete ===" -ForegroundColor Cyan