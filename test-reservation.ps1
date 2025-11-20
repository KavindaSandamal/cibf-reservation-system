$EC2_IP = '34.209.143.5'
$BASE_URL = "http://$EC2_IP"

Write-Host 'Testing Complete Reservation Flow with RabbitMQ' -ForegroundColor Cyan
Write-Host '===================================================' -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
$loginBody = @{
    username = 'imksandamal99@gmail.com'
    password = 'kavinda123'
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" -Method Post -Body $loginBody -ContentType 'application/json'
    
    $token = $loginResponse.accessToken
    $role = $loginResponse.role
    $businessName = $loginResponse.businessName
    
    Write-Host ' - Login successful!' -ForegroundColor Green
    Write-Host "   Token: $($token.Substring(0,30))..." -ForegroundColor Cyan
    Write-Host "   Role: $role" -ForegroundColor Cyan
    Write-Host "   Business: $businessName" -ForegroundColor Cyan
    
} catch {
    Write-Host ' - Login failed!' -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit
}

# Step 2: Get user info to get userId
Write-Host "`n2. Getting user info..." -ForegroundColor Yellow
$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type'  = 'application/json'
}

try {
    $userInfo = Invoke-RestMethod -Uri "$BASE_URL/api/auth/me" -Method Get -Headers $headers
    $userId = $userInfo.id
    
    Write-Host ' - User info retrieved!' -ForegroundColor Green
    Write-Host "   User ID: $userId" -ForegroundColor Cyan
    
} catch {
    Write-Host ' - Could not get user info, using default userId=1' -ForegroundColor Yellow
    $userId = 1
}

# Step 3: Hold stalls
Write-Host "`n3. Holding stalls..." -ForegroundColor Yellow
$holdBody = @{
    userId       = $userId
    stallIds     = @(1)
    businessName = 'Kavinda Books'
} | ConvertTo-Json

try {
    $holdResponse = Invoke-RestMethod -Uri "$BASE_URL/api/reservations/hold" -Method Post -Body $holdBody -Headers $headers
    $holdToken = $holdResponse.holdToken
    $expiresAt = $holdResponse.expiresAt
    
    Write-Host ' - Stalls held successfully!' -ForegroundColor Green
    Write-Host "   Hold Token: $holdToken" -ForegroundColor Cyan
    Write-Host "   Expires At: $expiresAt" -ForegroundColor Cyan
    
} catch {
    Write-Host ' - Failed to hold stalls!' -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit
}

# Step 4: Confirm reservation (THIS TRIGGERS RABBITMQ!)
Write-Host "`n4. Confirming reservation (RabbitMQ event triggered)..." -ForegroundColor Yellow
$confirmBody = @{
    userId       = $userId
    holdToken    = $holdToken
    businessName = 'Kavinda Books'
    userEmail    = 'imksandamal99@gmail.com'
} | ConvertTo-Json

try {
    $confirmResponse = Invoke-RestMethod -Uri "$BASE_URL/api/reservations/confirm" -Method Post -Body $confirmBody -Headers $headers
    
    Write-Host ' - Reservation confirmed!' -ForegroundColor Green
    Write-Host "   Reservation ID: $($confirmResponse.id)" -ForegroundColor Cyan
    Write-Host "   Status: $($confirmResponse.status)" -ForegroundColor Cyan
    Write-Host "   Total Amount: $($confirmResponse.totalAmount)" -ForegroundColor Cyan
    Write-Host "   QR Code: $($confirmResponse.qrCodeUrl)" -ForegroundColor Yellow
    
    Write-Host "`n - RabbitMQ Processing Started!" -ForegroundColor Green
    Write-Host '   Event published to reservation.queue' -ForegroundColor White
    Write-Host '   Email will be sent asynchronously' -ForegroundColor White
    Write-Host '   QR code will be generated asynchronously' -ForegroundColor White
    
} catch {
    Write-Host ' - Failed to confirm reservation!' -ForegroundColor Red
    Write-Host $_.Exception.Message
    exit
}

# Step 5: Monitor progress
Write-Host "`n Monitor RabbitMQ Processing:" -ForegroundColor Cyan
Write-Host '================================================' -ForegroundColor Cyan
# Note: Used ${EC2_IP} to safely separate the variable from the colon
Write-Host "   1. RabbitMQ UI: http://${EC2_IP}:15672" -ForegroundColor White
Write-Host '      Login: admin / changeme123' -ForegroundColor Gray
Write-Host '      Check: Queues tab -> See message flow' -ForegroundColor Gray
Write-Host ''
Write-Host '   2. Check Logs (SSH to EC2):' -ForegroundColor White
Write-Host '      docker logs -f auth-service' -ForegroundColor Gray
Write-Host ''
Write-Host '   3. Expected Timeline:' -ForegroundColor White
Write-Host '      • Now: Event published to RabbitMQ' -ForegroundColor Gray
Write-Host '      • 1-2s: ReservationConsumer processes event' -ForegroundColor Gray
Write-Host '      • 2-3s: QR code generated' -ForegroundColor Gray
Write-Host '      • 3-5s: Email sent' -ForegroundColor Gray
Write-Host '      • 5-10s: You receive email!' -ForegroundColor Gray
Write-Host ''

Write-Host ' - Test completed successfully!' -ForegroundColor Green
Write-Host ' - Check your email: imksandamal99@gmail.com' -ForegroundColor Yellow