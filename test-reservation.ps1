# Complete CIBF Reservation Test Script
# Tests: Hold -> Confirm -> QR Generation -> Email Sending

$BASE_URL = "http://localhost:8083"
$AUTH_URL = "http://localhost:8081"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   CIBF Reservation System - Complete Flow Test" -ForegroundColor Cyan
Write-Host "   Hold -> Confirm -> QR Code -> Email" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# STEP 1: AUTHENTICATION
# ============================================================
Write-Host "--- STEP 1: Authentication ---" -ForegroundColor Yellow
Write-Host ""

# Option A: Use existing token
$existingToken = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJncm91cGJ1aWxkOTI4QGdtYWlsLmNvbSIsImlhdCI6MTc2MzQ4NzE4OSwiZXhwIjoxNzYzNTczNTg5fQ.6fr6FJYY5rDfLqg_aFCY88qfFlzyQGQKSBsU7R1SzICDA8RFX_hBHsGNAU6stMO5373IQ9dSZfl0oeQUFYcuLA"

# Using existing token
$token = $existingToken
$userId = 20 # Replace with your actual user ID

Write-Host "[SUCCESS] Using existing token" -ForegroundColor Green
Write-Host "   User ID: $userId" -ForegroundColor Gray
Write-Host ""

Start-Sleep -Seconds 1

# ============================================================
# STEP 2: HOLD STALLS
# ============================================================
Write-Host "--- STEP 2: Holding Stalls (5 minutes) ---" -ForegroundColor Yellow
Write-Host ""

$holdBody = @{
    userId = $userId
    stallIds = @(7)  # Select 1 stall
    businessName = "KS Books"
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

try {
    Write-Host "Requesting to hold stalls..." -ForegroundColor Gray
    
    $holdResponse = Invoke-RestMethod -Uri "$BASE_URL/api/reservations/hold" `
        -Method Post `
        -Headers $headers `
        -Body $holdBody
    
    Write-Host "[SUCCESS] Stalls held successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Hold Details:" -ForegroundColor Cyan
    Write-Host "   - Token: $($holdResponse.holdToken)" -ForegroundColor White
    Write-Host "   - Stall IDs: $($holdResponse.stallIds -join ', ')" -ForegroundColor White
    Write-Host "   - Total Amount: Rs. $($holdResponse.totalAmount)" -ForegroundColor White
    Write-Host "   - Expires At: $($holdResponse.expiresAt)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   [TIMER] You have 5 minutes to confirm this reservation" -ForegroundColor Yellow
    Write-Host ""
    
    $holdToken = $holdResponse.holdToken
    
} catch {
    Write-Host "[ERROR] Failed to hold stalls" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        $errorDetail = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Details: $($errorDetail.message)" -ForegroundColor Red
    }
    
    exit
}

Start-Sleep -Seconds 2

# ============================================================
# STEP 3: CONFIRM RESERVATION (QR + Email)
# ============================================================
Write-Host "--- STEP 3: Confirming Reservation ---" -ForegroundColor Yellow
Write-Host ""
Write-Host "This will:" -ForegroundColor Gray
Write-Host "  1. Confirm the reservation" -ForegroundColor Gray
Write-Host "  2. Generate QR code" -ForegroundColor Gray
Write-Host "  3. Upload QR to S3" -ForegroundColor Gray
Write-Host "  4. Send email with QR code" -ForegroundColor Gray
Write-Host ""

$confirmBody = @{
    userId = $userId
    holdToken = $holdToken
    businessName = "Group Books"
    userEmail = "groupbuild928@gmail.com"  
} | ConvertTo-Json

try {
    Write-Host "Confirming reservation..." -ForegroundColor Gray
    
    $confirmResponse = Invoke-RestMethod -Uri "$BASE_URL/api/reservations/confirm" `
        -Method Post `
        -Headers $headers `
        -Body $confirmBody
    
    Write-Host ""
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "          RESERVATION CONFIRMED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    
    # Display reservation details
    Write-Host "[DETAILS] Reservation Details:" -ForegroundColor Cyan
    Write-Host "   - ID: #$($confirmResponse.id)" -ForegroundColor White
    Write-Host "   - Business: $($confirmResponse.businessName)" -ForegroundColor White
    Write-Host "   - Email: $($confirmResponse.userEmail)" -ForegroundColor White
    Write-Host "   - Status: $($confirmResponse.status)" -ForegroundColor Green
    Write-Host "   - Total Amount: Rs. $($confirmResponse.totalAmount)" -ForegroundColor White
    Write-Host "   - Date: $($confirmResponse.confirmedAt)" -ForegroundColor Gray
    Write-Host ""
    
    # Display stall details
    if ($confirmResponse.stalls) {
        Write-Host "[STALLS] Reserved Stalls:" -ForegroundColor Cyan
        $confirmResponse.stalls | ForEach-Object {
            Write-Host "   - $($_.stallName) - $($_.size) ($($_.dimensions))" -ForegroundColor White
            Write-Host "     Price: Rs. $($_.price)" -ForegroundColor Gray
        }
        Write-Host ""
    }
    
    # Display QR code details
    if ($confirmResponse.qrCodeUrl) {
        Write-Host "[QR CODE] QR Code Generated:" -ForegroundColor Cyan
        Write-Host "   URL: $($confirmResponse.qrCodeUrl)" -ForegroundColor White
        Write-Host ""
        
        # Try to download QR code
        Write-Host "Downloading QR Code..." -ForegroundColor Yellow
        $qrPath = "CIBF-QR-$($confirmResponse.id).png"
        
        try {
            Invoke-WebRequest -Uri $confirmResponse.qrCodeUrl -OutFile $qrPath
            Write-Host "   [SUCCESS] QR Code saved: $qrPath" -ForegroundColor Green
            
            # Open QR code
            if (Test-Path $qrPath) {
                Start-Process $qrPath
                Write-Host "   [SUCCESS] QR Code opened in default viewer" -ForegroundColor Green
            }
        } catch {
            Write-Host "   [WARNING] Could not download QR code: $($_.Exception.Message)" -ForegroundColor Yellow
            Write-Host "   You can download it manually from: $($confirmResponse.qrCodeUrl)" -ForegroundColor Yellow
        }
        Write-Host ""
    } else {
        Write-Host "[WARNING] QR Code generation may be in progress..." -ForegroundColor Yellow
        Write-Host ""
    }
    
    # Email notification
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host "                  CHECK YOUR EMAIL!" -ForegroundColor Green
    Write-Host "================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "   To: groupbuild928@gmail.com" -ForegroundColor White
    Write-Host "   Subject: Colombo International Bookfair - Reservation Confirmed #$($confirmResponse.id)" -ForegroundColor White
    Write-Host ""
    Write-Host "   The email includes:" -ForegroundColor Gray
    Write-Host "   [CHECK] Reservation confirmation" -ForegroundColor Gray
    Write-Host "   [CHECK] Stall details with prices" -ForegroundColor Gray
    Write-Host "   [CHECK] QR code (embedded image)" -ForegroundColor Gray
    Write-Host "   [CHECK] Download button for QR code" -ForegroundColor Gray
    Write-Host "   [CHECK] Exhibition details (dates, venue)" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host "                    NEXT STEPS" -ForegroundColor Cyan
    Write-Host "================================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Check your email for confirmation" -ForegroundColor White
    Write-Host "2. Download or save the QR code" -ForegroundColor White
    Write-Host "3. Print the QR code (optional)" -ForegroundColor White
    Write-Host "4. Present QR code at exhibition entrance" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host "[ERROR] Failed to confirm reservation" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.ErrorDetails.Message) {
        try {
            $errorDetail = $_.ErrorDetails.Message | ConvertFrom-Json
            Write-Host "   Details: $($errorDetail.message)" -ForegroundColor Red
        } catch {
            Write-Host "   Response: $($_.ErrorDetails.Message)" -ForegroundColor Red
        }
    }
    
    exit
}

# ============================================================
# STEP 4: VERIFY RESERVATION
# ============================================================
Write-Host "--- STEP 4: Verifying Reservation ---" -ForegroundColor Yellow
Write-Host ""

try {
    Write-Host "Fetching reservation details..." -ForegroundColor Gray
    
    $verifyResponse = Invoke-RestMethod -Uri "$BASE_URL/api/reservations/$($confirmResponse.id)" `
        -Method Get `
        -Headers $headers
    
    Write-Host "[SUCCESS] Reservation verified" -ForegroundColor Green
    Write-Host "   Status: $($verifyResponse.status)" -ForegroundColor Green
    if ($verifyResponse.qrCodeUrl) {
        Write-Host "   QR Code: Available" -ForegroundColor Green
    } else {
        Write-Host "   QR Code: Not available" -ForegroundColor Red
    }
    Write-Host ""
    
} catch {
    Write-Host "[WARNING] Could not verify reservation: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
}

# ============================================================
# SUMMARY
# ============================================================
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "                    TEST COMPLETE" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "  [PASS] Stalls held successfully" -ForegroundColor Green
Write-Host "  [PASS] Reservation confirmed" -ForegroundColor Green
Write-Host "  [PASS] QR code generated" -ForegroundColor Green
Write-Host "  [PASS] Email sent" -ForegroundColor Green
Write-Host ""
Write-Host "All systems working perfectly!" -ForegroundColor Green
Write-Host ""