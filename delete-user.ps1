$BASE_URL = "http://34.213.51.153"
$ADMIN_USERNAME = "admin@cibf.lk"
$ADMIN_PASSWORD = "admin123"
$USER_ID = 11

[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "=== CIBF User Deletion Script ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Authenticate
Write-Host "[1/2] Authenticating as admin..." -ForegroundColor Yellow

$loginUrl = "$BASE_URL/api/auth/login"
$loginBody = @{
    username = $ADMIN_USERNAME
    password = $ADMIN_PASSWORD
} | ConvertTo-Json

$token = $null

try {
    $response = Invoke-RestMethod -Uri $loginUrl -Method Post -ContentType "application/json" -Body $loginBody
    $token = $response.accessToken

    if (-not $token) {
        Write-Host "ERROR: No token received from server" -ForegroundColor Red
        exit 1
    }

    Write-Host "SUCCESS: Authenticated" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 30))..." -ForegroundColor DarkGray
    Write-Host ""

} catch {
    Write-Host "ERROR: Authentication failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 2: Delete user
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

Write-Host "=== Script Complete ===" -ForegroundColor Cyan