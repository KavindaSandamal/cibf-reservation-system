# Complete Employee Portal API Testing Script
# Tests all admin endpoints across Authentication, Stall, and Reservation services

$EC2_IP = '34.213.51.153'
$BASE_URL = "http://$EC2_IP"

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   CIBF Employee Portal - Complete API Test" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ==================== STEP 1: EMPLOYEE LOGIN ====================
Write-Host "--- STEP 1: Employee Authentication ---" -ForegroundColor Yellow
Write-Host ""

$loginBody = @{
    username = "admin@cibf.lk"    # Changed from admin@cibf.com
    password = "admin123"
} | ConvertTo-Json

try {
    $authResponse = Invoke-RestMethod -Uri "$BASE_URL/api/auth/employee/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    
    $token = $authResponse.accessToken
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Write-Host "[SUCCESS] Employee logged in successfully" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "[ERROR] Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Start-Sleep -Seconds 1

# ==================== AUTHENTICATION SERVICE TESTS ====================
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   AUTHENTICATION SERVICE - Admin Endpoints" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Get Dashboard
Write-Host "Test 1: Get Dashboard" -ForegroundColor Yellow
try {
    $dashboard = Invoke-RestMethod -Uri "$BASE_URL/api/admin/dashboard" -Headers $headers
    Write-Host "[SUCCESS] Dashboard loaded" -ForegroundColor Green
    Write-Host "Total Users: $($dashboard.totalUsers)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get All Users
Write-Host "Test 2: Get All Users (Paginated)" -ForegroundColor Yellow
try {
    $users = Invoke-RestMethod -Uri "$BASE_URL/api/admin/users?page=0&size=10" -Headers $headers
    Write-Host "[SUCCESS] Fetched users" -ForegroundColor Green
    Write-Host "Total Users: $($users.totalItems)" -ForegroundColor White
    Write-Host "Current Page: $($users.currentPage + 1) of $($users.totalPages)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Search Users
Write-Host "Test 3: Search Users" -ForegroundColor Yellow
try {
    $searchResults = Invoke-RestMethod -Uri "$BASE_URL/api/admin/users?search=test" -Headers $headers
    Write-Host "[SUCCESS] Search completed" -ForegroundColor Green
    Write-Host "Found: $($searchResults.totalItems) users" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get User Statistics
Write-Host "Test 4: Get User Statistics" -ForegroundColor Yellow
try {
    $stats = Invoke-RestMethod -Uri "$BASE_URL/api/admin/users/statistics" -Headers $headers
    Write-Host "[SUCCESS] Statistics loaded" -ForegroundColor Green
    Write-Host "Total Users: $($stats.totalUsers)" -ForegroundColor White
    Write-Host "Last 7 Days: $($stats.last7Days)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Export Users to CSV
Write-Host "Test 5: Export Users to CSV" -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "$BASE_URL/api/admin/users/export" `
        -Headers $headers `
        -OutFile "users_export.csv"
    Write-Host "[SUCCESS] Users exported to users_export.csv" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ==================== STALL SERVICE TESTS ====================
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   STALL SERVICE - Admin Endpoints" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Test 6: Get All Stalls
Write-Host "Test 6: Get All Stalls" -ForegroundColor Yellow
try {
    $stalls = Invoke-RestMethod -Uri "$BASE_URL/api/admin/stalls?page=0&sizePerPage=10" -Headers $headers
    Write-Host "[SUCCESS] Fetched stalls" -ForegroundColor Green
    Write-Host "Total Stalls: $($stalls.totalItems)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Get Stalls by Status
Write-Host "Test 7: Get Available Stalls" -ForegroundColor Yellow
try {
    $availableStalls = Invoke-RestMethod -Uri "$BASE_URL/api/admin/stalls?status=AVAILABLE" -Headers $headers
    Write-Host "[SUCCESS] Filtered stalls" -ForegroundColor Green
    Write-Host "Available: $($availableStalls.totalItems)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Get Stall Statistics
Write-Host "Test 8: Get Stall Statistics" -ForegroundColor Yellow
try {
    $stallStats = Invoke-RestMethod -Uri "$BASE_URL/api/admin/stalls/statistics" -Headers $headers
    Write-Host "[SUCCESS] Statistics loaded" -ForegroundColor Green
    Write-Host "Total Stalls: $($stallStats.totalStalls)" -ForegroundColor White
    Write-Host "Available: $($stallStats.availableStalls)" -ForegroundColor White
    Write-Host "Reserved: $($stallStats.reservedStalls)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 9: Get Stalls for Map
Write-Host "Test 9: Get Stalls for Map Display" -ForegroundColor Yellow
try {
    $mapStalls = Invoke-RestMethod -Uri "$BASE_URL/api/admin/stalls/map" -Headers $headers
    Write-Host "[SUCCESS] Map data loaded" -ForegroundColor Green
    Write-Host "Stalls on map: $($mapStalls.Count)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 10: Export Stalls to CSV
Write-Host "Test 10: Export Stalls to CSV" -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "$BASE_URL/api/admin/stalls/export" `
        -Headers $headers `
        -OutFile "stalls_export.csv"
    Write-Host "[SUCCESS] Stalls exported to stalls_export.csv" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Start-Sleep -Seconds 1

# ==================== RESERVATION SERVICE TESTS ====================
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   RESERVATION SERVICE - Admin Endpoints" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# Test 11: Get All Reservations
Write-Host "Test 11: Get All Reservations" -ForegroundColor Yellow
try {
    $reservations = Invoke-RestMethod -Uri "$BASE_URL/api/admin/reservations?page=0&size=10" -Headers $headers
    Write-Host "[SUCCESS] Fetched reservations" -ForegroundColor Green
    Write-Host "Total Reservations: $($reservations.totalItems)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 12: Filter Reservations by Status
Write-Host "Test 12: Get Confirmed Reservations" -ForegroundColor Yellow
try {
    $confirmed = Invoke-RestMethod -Uri "$BASE_URL/api/admin/reservations?status=CONFIRMED" -Headers $headers
    Write-Host "[SUCCESS] Filtered reservations" -ForegroundColor Green
    Write-Host "Confirmed: $($confirmed.totalItems)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 13: Search Reservations
Write-Host "Test 13: Search Reservations" -ForegroundColor Yellow
try {
    $searchRes = Invoke-RestMethod -Uri "$BASE_URL/api/admin/reservations?search=test" -Headers $headers
    Write-Host "[SUCCESS] Search completed" -ForegroundColor Green
    Write-Host "Found: $($searchRes.totalItems) reservations" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 14: Get Reservation Statistics
Write-Host "Test 14: Get Reservation Statistics" -ForegroundColor Yellow
try {
    $resStats = Invoke-RestMethod -Uri "$BASE_URL/api/admin/reservations/statistics" -Headers $headers
    Write-Host "[SUCCESS] Statistics loaded" -ForegroundColor Green
    Write-Host "Total: $($resStats.totalReservations)" -ForegroundColor White
    Write-Host "Confirmed: $($resStats.confirmedReservations)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 15: Get Revenue Statistics
Write-Host "Test 15: Get Revenue Statistics" -ForegroundColor Yellow
try {
    $revenue = Invoke-RestMethod -Uri "$BASE_URL/api/admin/reservations/statistics/revenue?period=monthly" -Headers $headers
    Write-Host "[SUCCESS] Revenue loaded" -ForegroundColor Green
    Write-Host "Total Revenue: Rs. $($revenue.totalRevenue)" -ForegroundColor White
    Write-Host "Reservation Count: $($revenue.reservationCount)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 16: Get Booking Trends
Write-Host "Test 16: Get Booking Trends" -ForegroundColor Yellow
try {
    $trends = Invoke-RestMethod -Uri "$BASE_URL/api/admin/reservations/statistics/trends?period=weekly" -Headers $headers
    Write-Host "[SUCCESS] Trends loaded" -ForegroundColor Green
    Write-Host "Total Bookings: $($trends.totalBookings)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 17: Get Dashboard Summary
Write-Host "Test 17: Get Dashboard Summary" -ForegroundColor Yellow
try {
    $summary = Invoke-RestMethod -Uri "$BASE_URL/api/admin/reservations/statistics/summary" -Headers $headers
    Write-Host "[SUCCESS] Dashboard summary loaded" -ForegroundColor Green
    Write-Host "Total Reservations: $($summary.totalReservations)" -ForegroundColor White
    Write-Host "Total Revenue: Rs. $($summary.totalRevenue)" -ForegroundColor White
    Write-Host "Today's Bookings: $($summary.todayBookings)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 18: Export Reservations to CSV
Write-Host "Test 18: Export Reservations to CSV" -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri "$BASE_URL/api/admin/reservations/export" `
        -Headers $headers `
        -OutFile "reservations_export.csv"
    Write-Host "[SUCCESS] Reservations exported to reservations_export.csv" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "[ERROR] Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# ==================== SUMMARY ====================
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "   TEST COMPLETE" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "All employee portal endpoints tested!" -ForegroundColor Green
Write-Host ""
Write-Host "Exported files:" -ForegroundColor White
Write-Host "  - users_export.csv" -ForegroundColor Gray
Write-Host "  - stalls_export.csv" -ForegroundColor Gray
Write-Host "  - reservations_export.csv" -ForegroundColor Gray
Write-Host ""