$BASE_URL = "http://34.213.51.153"
$ADMIN_USERNAME = "admin@cibf.lk"
$ADMIN_PASSWORD = "admin123"
$USER_ID = 26

[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "=== CIBF User Reservations Lookup ===" -ForegroundColor Cyan
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
    Write-Host ""

} catch {
    Write-Host "ERROR: Authentication failed" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Step 2: Get user reservations
Write-Host "[2/2] Fetching reservations for user ID: $USER_ID..." -ForegroundColor Yellow
Write-Host ""

$reservationsUrl = "$BASE_URL/api/admin/reservations/reservations/user/$USER_ID"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $reservations = Invoke-RestMethod -Uri $reservationsUrl -Method Get -Headers $headers
    
    if ($reservations.Count -eq 0) {
        Write-Host "No reservations found for user ID: $USER_ID" -ForegroundColor Yellow
        Write-Host ""
    } else {
        Write-Host "SUCCESS: Found $($reservations.Count) reservation(s)" -ForegroundColor Green
        Write-Host ""
        Write-Host "=" * 80 -ForegroundColor DarkGray
        
        foreach ($reservation in $reservations) {
            Write-Host ""
            Write-Host "Reservation ID: $($reservation.id)" -ForegroundColor Cyan
            Write-Host "Business Name: $($reservation.businessName)" -ForegroundColor White
            Write-Host "Email: $($reservation.userEmail)" -ForegroundColor White
            Write-Host "Status: $($reservation.status)" -ForegroundColor $(
                if ($reservation.status -eq "CONFIRMED") { "Green" }
                elseif ($reservation.status -eq "PENDING") { "Yellow" }
                elseif ($reservation.status -eq "CANCELLED") { "Red" }
                else { "Gray" }
            )
            Write-Host "Total Amount: Rs. $($reservation.totalAmount)" -ForegroundColor White
            Write-Host "Created At: $($reservation.createdAt)" -ForegroundColor DarkGray
            
            if ($reservation.stalls -and $reservation.stalls.Count -gt 0) {
                Write-Host "Stalls:" -ForegroundColor Cyan
                foreach ($stall in $reservation.stalls) {
                    Write-Host "  - $($stall.stallName) ($($stall.size)) - Rs. $($stall.price)" -ForegroundColor White
                }
            }
            
            if ($reservation.qrCodeUrl) {
                Write-Host "QR Code: $($reservation.qrCodeUrl)" -ForegroundColor DarkGray
            }
            
            Write-Host ""
            Write-Host "=" * 80 -ForegroundColor DarkGray
        }
        
        Write-Host ""
        Write-Host "Summary:" -ForegroundColor Cyan
        Write-Host "--------" -ForegroundColor DarkGray
        
        $confirmed = ($reservations | Where-Object { $_.status -eq "CONFIRMED" }).Count
        $pending = ($reservations | Where-Object { $_.status -eq "PENDING" }).Count
        $cancelled = ($reservations | Where-Object { $_.status -eq "CANCELLED" }).Count
        
        Write-Host "Total Reservations: $($reservations.Count)" -ForegroundColor White
        Write-Host "Confirmed: $confirmed" -ForegroundColor Green
        Write-Host "Pending: $pending" -ForegroundColor Yellow
        Write-Host "Cancelled: $cancelled" -ForegroundColor Red
        
        $totalAmount = ($reservations | Where-Object { $_.status -eq "CONFIRMED" } | Measure-Object -Property totalAmount -Sum).Sum
        if ($totalAmount) {
            Write-Host "Total Revenue (Confirmed): Rs. $totalAmount" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    Write-Host "Full JSON Response:" -ForegroundColor DarkGray
    Write-Host ($reservations | ConvertTo-Json -Depth 10) -ForegroundColor DarkGray
    
} catch {
    Write-Host "ERROR: Failed to fetch reservations" -ForegroundColor Red
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