
$BASE_URL = "http://34.213.51.153"
$ADMIN_USERNAME = "admin@cibf.lk"
$ADMIN_PASSWORD = "admin123"
$USER_ID = 26

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

# Test 2: Check alternative endpoints
Write-Host "[4] Checking for alternative public endpoints..." -ForegroundColor Yellow

$publicUrls = @(
    "$BASE_URL/api/reservations/user/$USER_ID"
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

# Step 3: Delete user
Write-Host "[2/2] Deleting user ID: $USER_ID..." -ForegroundColor Yellow

$deleteUrl = "$BASE_URL/api/admin/users/$USER_ID"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $deleteResult = Invoke-RestMethod -Uri $deleteUrl -Method Delete -Headers $headers
    
    Write-Host ""
    Write-Host "SUCCESS: User deleted successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    Write-Host ($deleteResult | ConvertTo-Json -Depth 5)
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to delete user" -ForegroundColor Red
    Write-Host ""
    
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP Status: $statusCode" -ForegroundColor Yellow
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        $reader.Close()
        
        Write-Host "Server Response:" -ForegroundColor Yellow
        Write-Host $errorBody -ForegroundColor White
    }
    
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "=== Diagnosis Complete ===" -ForegroundColor Cyan