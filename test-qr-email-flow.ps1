$EC2_IP = "35.92.81.202"  # Your EC2 IP
$BASE_URL = "http://$EC2_IP"

Write-Host "=== CIBF Complete Flow: QR Code + Email Test ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Register User
Write-Host "Step 1: Register User" -ForegroundColor Yellow
$registerBody = @{
    username = "testvendor@gmail.com"  # Use a real email you can check
    password = "password123"
    businessName = "The Book Haven"
    contactNumber = "+94771234567"
    address = "123 Galle Road, Colombo 03"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "$BASE_URL:8081/api/auth/register" `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json"
    
    $token = $authResponse.accessToken
    Write-Host "✅ User registered successfully" -ForegroundColor Green
    Write-Host "   Business: The Book Haven" -ForegroundColor Gray
} catch {
    Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 2
Write-Host ""

# Step 2: Get Available Stalls
Write-Host "Step 2: Getting Available Stalls" -ForegroundColor Yellow
try {
    $stalls = Invoke-RestMethod -Uri "$BASE_URL:8082/api/stalls/available" `
        -Method Get
    
    Write-Host "✅ Found $($stalls.Count) available stalls" -ForegroundColor Green
    
    # Select 2 stalls
    $selectedStalls = @($stalls[0].id, $stalls[1].id)
    Write-Host "   Selected: $($stalls[0].stallName), $($stalls[1].stallName)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to get stalls: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 2
Write-Host ""

# Step 3: Create Reservation
Write-Host "Step 3: Creating Reservation" -ForegroundColor Yellow
$reservationBody = @{
    stallIds = $selectedStalls
    businessName = "The Book Haven"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    $reservation = Invoke-RestMethod -Uri "$BASE_URL:8083/api/reservations" `
        -Method Post `
        -Headers $headers `
        -Body $reservationBody
    
    $reservationId = $reservation.id
    Write-Host "✅ Reservation created: #$reservationId" -ForegroundColor Green
    Write-Host "   Status: $($reservation.status)" -ForegroundColor Gray
    Write-Host "   Total: Rs. $($reservation.totalAmount)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Failed to create reservation: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 2
Write-Host ""

# Step 4: Confirm Reservation (Triggers QR + Email)
Write-Host "Step 4: Confirming Reservation (Generating QR + Sending Email)" -ForegroundColor Yellow
Write-Host "   This will:" -ForegroundColor Gray
Write-Host "   - Generate QR code" -ForegroundColor Gray
Write-Host "   - Upload to S3" -ForegroundColor Gray
Write-Host "   - Send confirmation email with QR code" -ForegroundColor Gray
Write-Host ""

try {
    $confirmed = Invoke-RestMethod -Uri "$BASE_URL:8083/api/reservations/$reservationId/confirm" `
        -Method Put `
        -Headers $headers
    
    Write-Host "✅ Reservation confirmed successfully!" -ForegroundColor Green
    Write-Host "   Status: $($confirmed.status)" -ForegroundColor Cyan
    Write-Host "   QR Code URL: $($confirmed.qrCodeUrl)" -ForegroundColor Cyan
    Write-Host ""
    
    # Display QR code URL with better formatting
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host "🎉 SUCCESS! Reservation Confirmed" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "📧 Email Details:" -ForegroundColor Yellow
    Write-Host "   To: testvendor@gmail.com" -ForegroundColor White
    Write-Host "   Subject: Colombo International Bookfair - Reservation Confirmed #$reservationId" -ForegroundColor White
    Write-Host ""
    Write-Host "🎫 QR Code:" -ForegroundColor Yellow
    Write-Host "   $($confirmed.qrCodeUrl)" -ForegroundColor White
    Write-Host ""
    Write-Host "📥 Download QR Code:" -ForegroundColor Yellow
    
    # Try to download QR code
    $qrLocalPath = "qr-code-$reservationId.png"
    try {
        Invoke-WebRequest -Uri $confirmed.qrCodeUrl -OutFile $qrLocalPath
        Write-Host "   ✅ QR code downloaded: $qrLocalPath" -ForegroundColor Green
        
        # Open QR code (Windows)
        if (Test-Path $qrLocalPath) {
            Start-Process $qrLocalPath
            Write-Host "   ✅ QR code opened in default viewer" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️  Could not download QR code: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
    Write-Host ""
    Write-Host "📧 CHECK YOUR EMAIL: testvendor@gmail.com" -ForegroundColor Green
    Write-Host "   You should receive a confirmation email with:" -ForegroundColor White
    Write-Host "   ✓ Reservation details" -ForegroundColor White
    Write-Host "   ✓ Stall information" -ForegroundColor White
    Write-Host "   ✓ QR code image (embedded)" -ForegroundColor White
    Write-Host "   ✓ Download button for QR code" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "❌ Failed to confirm reservation: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host "=== Test Complete! ===" -ForegroundColor Cyan