# ============================================================================
# Reservation Admin Endpoints Testing Script - FIXED
# ============================================================================

$BASE_URL = "http://34.213.51.153"
$USERNAME = "emp_test_002@cibf.com"
$PASSWORD = "Test@123"

# Disable SSL certificate validation
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Colors
$SUCCESS_COLOR = "Green"
$ERROR_COLOR = "Red"
$INFO_COLOR = "Cyan"
$WARNING_COLOR = "Yellow"

function Write-TestHeader {
    param([string]$Message)
    Write-Host "`n============================================================================" -ForegroundColor $INFO_COLOR
    Write-Host $Message -ForegroundColor $INFO_COLOR
    Write-Host "============================================================================" -ForegroundColor $INFO_COLOR
}

function Write-TestResult {
    param([string]$TestName, [bool]$Success, [string]$Details = "")
    if ($Success) {
        Write-Host "[PASS] $TestName" -ForegroundColor $SUCCESS_COLOR
        if ($Details) { Write-Host "       $Details" -ForegroundColor Gray }
    } else {
        Write-Host "[FAIL] $TestName" -ForegroundColor $ERROR_COLOR
        if ($Details) { Write-Host "       $Details" -ForegroundColor $ERROR_COLOR }
    }
}

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [object]$Body = $null,
        [int]$TimeoutSec = 30
    )
    
    try {
        $uri = "$BASE_URL$Endpoint"
        Write-Host "       Request: $Method $uri" -ForegroundColor DarkGray
        
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
            TimeoutSec = $TimeoutSec
            UseBasicParsing = $true
        }
        
        if ($Body) {
            $jsonBody = ($Body | ConvertTo-Json -Depth 10 -Compress)
            $params.Body = $jsonBody
        }
        
        $response = Invoke-RestMethod @params
        Write-Host "       Response: Success" -ForegroundColor DarkGray
        
        return @{
            Success = $true
            Data = $response
            StatusCode = 200
        }
    }
    catch {
        $errorMessage = $_.Exception.Message
        $statusCode = "N/A"
        
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        Write-Host "       Error: $errorMessage (Status: $statusCode)" -ForegroundColor DarkGray
        
        return @{
            Success = $false
            Error = $errorMessage
            StatusCode = $statusCode
        }
    }
}

# ============================================================================
# Step 1: Login and Get Token
# ============================================================================

Write-TestHeader "STEP 1: Authentication"

$loginBody = @{
    username = $USERNAME
    password = $PASSWORD
}

Write-Host "`nAttempting login as $USERNAME..." -ForegroundColor $INFO_COLOR
$loginResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/api/auth/employee/login" -Body $loginBody

if (-not $loginResponse.Success) {
    Write-TestResult "Employee Login" $false $loginResponse.Error
    Write-Host "`nCannot proceed without authentication. Exiting..." -ForegroundColor $ERROR_COLOR
    exit 1
}

# FIXED: Check for accessToken instead of token
if (-not $loginResponse.Data.accessToken) {
    Write-TestResult "Employee Login" $false "No accessToken received in response"
    exit 1
}

$TOKEN = $loginResponse.Data.accessToken
Write-TestResult "Employee Login" $true "Token obtained successfully"
Write-Host "       Role: $($loginResponse.Data.role)" -ForegroundColor Gray
Write-Host "       Business Name: $($loginResponse.Data.businessName)" -ForegroundColor Gray
Write-Host "       Token Type: $($loginResponse.Data.tokenType)" -ForegroundColor Gray
Write-Host "       Token Preview: $($TOKEN.Substring(0, [Math]::Min(30, $TOKEN.Length)))..." -ForegroundColor Gray

$authHeaders = @{
    "Authorization" = "Bearer $TOKEN"
    "Accept" = "application/json"
}

# ============================================================================
# Step 2: Test Statistics Endpoints
# ============================================================================

Write-TestHeader "STEP 2: Statistics Endpoints"

Write-Host "`n[TEST 1] Dashboard Summary" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/reservations/statistics/summary" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/reservations/statistics/summary" $true `
        "Total: $($result.Data.totalReservations), Confirmed: $($result.Data.confirmedReservations), Revenue: $($result.Data.totalRevenue)"
} else {
    Write-TestResult "GET /api/admin/reservations/statistics/summary" $false $result.Error
}

Write-Host "`n[TEST 2] Reservation Statistics" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/reservations/statistics/reservations" -Headers $authHeaders
Write-TestResult "GET /api/admin/reservations/statistics/reservations" $result.Success $(if($result.Success){"Statistics retrieved"}else{$result.Error})

Write-Host "`n[TEST 3] Revenue Statistics - Monthly" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/reservations/statistics/revenue?period=monthly" -Headers $authHeaders
Write-TestResult "GET /api/admin/reservations/statistics/revenue?period=monthly" $result.Success $(if($result.Success){"Revenue data retrieved"}else{$result.Error})

Write-Host "`n[TEST 4] Revenue Statistics - Weekly" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/reservations/statistics/revenue?period=weekly" -Headers $authHeaders
Write-TestResult "GET /api/admin/reservations/statistics/revenue?period=weekly" $result.Success $(if($result.Success){"Revenue data retrieved"}else{$result.Error})

Write-Host "`n[TEST 5] Booking Trends - Weekly" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/reservations/statistics/trends?period=weekly" -Headers $authHeaders
Write-TestResult "GET /api/admin/reservations/statistics/trends?period=weekly" $result.Success $(if($result.Success){"Trends data retrieved"}else{$result.Error})

Write-Host "`n[TEST 6] Booking Trends - Monthly" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/reservations/statistics/trends?period=monthly" -Headers $authHeaders
Write-TestResult "GET /api/admin/reservations/statistics/trends?period=monthly" $result.Success $(if($result.Success){"Trends data retrieved"}else{$result.Error})

# ============================================================================
# Step 3: Test Reservation Management Endpoints
# ============================================================================

Write-TestHeader "STEP 3: Reservation Management Endpoints"

Write-Host "`n[TEST 7] Get All Reservations - Default" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/reservations/reservations?page=0&size=10" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/reservations/reservations" $true `
        "Total: $($result.Data.totalItems), Pages: $($result.Data.totalPages), Items: $($result.Data.reservations.Count)"
    $FIRST_RESERVATION_ID = if ($result.Data.reservations.Count -gt 0) { $result.Data.reservations[0].id } else { $null }
} else {
    Write-TestResult "GET /api/admin/reservations/reservations" $false $result.Error
    $FIRST_RESERVATION_ID = $null
}

Write-Host "`n[TEST 8] Get Reservations - Filtered by CONFIRMED" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/reservations/reservations?status=CONFIRMED&page=0&size=10" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/reservations/reservations?status=CONFIRMED" $true "Found $($result.Data.reservations.Count) reservations"
} else {
    Write-TestResult "GET /api/admin/reservations/reservations?status=CONFIRMED" $false $result.Error
}

Write-Host "`n[TEST 9] Get Reservations - Search by 'C2'" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/reservations/reservations?search=C2&page=0&size=10" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/reservations/reservations?search=C2" $true "Found $($result.Data.reservations.Count) results"
} else {
    Write-TestResult "GET /api/admin/reservations/reservations?search=C2" $false $result.Error
}

if ($FIRST_RESERVATION_ID) {
    Write-Host "`n[TEST 10] Get Reservation by ID: $FIRST_RESERVATION_ID" -ForegroundColor $WARNING_COLOR
    $result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/reservations/reservations/$FIRST_RESERVATION_ID" -Headers $authHeaders
    if ($result.Success) {
        Write-TestResult "GET /api/admin/reservations/reservations/$FIRST_RESERVATION_ID" $true `
            "ID: $($result.Data.id), Status: $($result.Data.status), Stall: $($result.Data.stallName)"
    } else {
        Write-TestResult "GET /api/admin/reservations/reservations/$FIRST_RESERVATION_ID" $false $result.Error
    }
} else {
    Write-Host "`n[TEST 10] Get Reservation by ID: SKIPPED" -ForegroundColor $WARNING_COLOR
    Write-TestResult "GET /api/admin/reservations/reservations/{id}" $false "No reservations available"
}

Write-Host "`n[TEST 11] Get Reservation by Stall ID: 1" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/reservations/reservations/stall/1" -Headers $authHeaders
Write-TestResult "GET /api/admin/reservations/reservations/stall/1" $result.Success $(if($result.Success){"Stall data retrieved"}else{$result.Error})

# ============================================================================
# Step 4: Test Debug Endpoint
# ============================================================================

Write-TestHeader "STEP 4: Debug Endpoint"

Write-Host "`n[TEST 12] Debug Auth Status" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/reservations/debug/auth" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/reservations/debug/auth" $true `
        "User: $($result.Data.name), Auth: $($result.Data.authenticated), Roles: $($result.Data.authorities -join ', ')"
} else {
    Write-TestResult "GET /api/admin/reservations/debug/auth" $false $result.Error
}

# ============================================================================
# Test Summary
# ============================================================================

Write-TestHeader "TEST SUMMARY"

Write-Host "`nAll tests completed!" -ForegroundColor $SUCCESS_COLOR
Write-Host "Base URL: $BASE_URL" -ForegroundColor Gray
Write-Host "Authenticated as: $USERNAME" -ForegroundColor Gray
Write-Host "Role: $($loginResponse.Data.role)" -ForegroundColor Gray
Write-Host "Completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

Write-Host "`nNote: Destructive operations (confirm, cancel, delete) were not tested." -ForegroundColor $WARNING_COLOR
Write-Host "`n"