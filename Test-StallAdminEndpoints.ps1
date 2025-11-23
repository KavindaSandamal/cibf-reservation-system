# ============================================================================
# Stall Admin Endpoints Testing Script
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

if (-not $loginResponse.Success -or -not $loginResponse.Data.accessToken) {
    Write-TestResult "Employee Login" $false "Authentication failed"
    exit 1
}

$TOKEN = $loginResponse.Data.accessToken
Write-TestResult "Employee Login" $true "Token obtained successfully"
Write-Host "       Role: $($loginResponse.Data.role)" -ForegroundColor Gray
Write-Host "       Token Preview: $($TOKEN.Substring(0, [Math]::Min(30, $TOKEN.Length)))..." -ForegroundColor Gray

$authHeaders = @{
    "Authorization" = "Bearer $TOKEN"
    "Accept" = "application/json"
}

# ============================================================================
# Step 2: Test Stall Statistics Endpoints
# ============================================================================

Write-TestHeader "STEP 2: Stall Statistics Endpoints"

Write-Host "`n[TEST 1] Get Stall Statistics" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls/statistics" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/stalls/statistics" $true `
        "Total: $($result.Data.totalStalls), Available: $($result.Data.availableStalls), Reserved: $($result.Data.reservedStalls), Occupancy: $($result.Data.occupancyRate)%"
} else {
    Write-TestResult "GET /api/admin/stalls/statistics" $false $result.Error
}

Write-Host "`n[TEST 2] Get Stall Distribution" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls/statistics/distribution" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/stalls/statistics/distribution" $true `
        "Small: $($result.Data.SMALL), Medium: $($result.Data.MEDIUM), Large: $($result.Data.LARGE)"
} else {
    Write-TestResult "GET /api/admin/stalls/statistics/distribution" $false $result.Error
}

Write-Host "`n[TEST 3] Get Occupancy Rate" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls/statistics/occupancy" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/stalls/statistics/occupancy" $true `
        "Total: $($result.Data.totalStalls), Reserved: $($result.Data.reservedStalls), Rate: $($result.Data.occupancyRate)%"
} else {
    Write-TestResult "GET /api/admin/stalls/statistics/occupancy" $false $result.Error
}

# ============================================================================
# Step 3: Test Stall Management Endpoints
# ============================================================================

Write-TestHeader "STEP 3: Stall Management Endpoints"

Write-Host "`n[TEST 4] Get All Stalls - Default Pagination" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls?page=0&sizePerPage=10" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/stalls" $true `
        "Total Elements: $($result.Data.totalElements), Pages: $($result.Data.totalPages), Content Items: $($result.Data.content.Count)"
    
    # Store first stall ID for later tests
    $FIRST_STALL_ID = if ($result.Data.content.Count -gt 0) { $result.Data.content[0].id } else { $null }
} else {
    Write-TestResult "GET /api/admin/stalls" $false $result.Error
    $FIRST_STALL_ID = $null
}

Write-Host "`n[TEST 5] Get Stalls - Filter by Status (AVAILABLE)" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls?status=AVAILABLE&page=0&sizePerPage=10" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/stalls?status=AVAILABLE" $true `
        "Found $($result.Data.content.Count) available stalls"
} else {
    Write-TestResult "GET /api/admin/stalls?status=AVAILABLE" $false $result.Error
}

Write-Host "`n[TEST 6] Get Stalls - Filter by Status (RESERVED)" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls?status=RESERVED&page=0&sizePerPage=10" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/stalls?status=RESERVED" $true `
        "Found $($result.Data.content.Count) reserved stalls"
} else {
    Write-TestResult "GET /api/admin/stalls?status=RESERVED" $false $result.Error
}

Write-Host "`n[TEST 7] Get Stalls - Filter by Size (SMALL)" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls?stallSize=SMALL&page=0&sizePerPage=10" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/stalls?stallSize=SMALL" $true `
        "Found $($result.Data.content.Count) small stalls"
} else {
    Write-TestResult "GET /api/admin/stalls?stallSize=SMALL" $false $result.Error
}

Write-Host "`n[TEST 8] Get Stalls - Filter by Size (MEDIUM)" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls?stallSize=MEDIUM&page=0&sizePerPage=10" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/stalls?stallSize=MEDIUM" $true `
        "Found $($result.Data.content.Count) medium stalls"
} else {
    Write-TestResult "GET /api/admin/stalls?stallSize=MEDIUM" $false $result.Error
}

Write-Host "`n[TEST 9] Get Stalls - Filter by Size (LARGE)" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls?stallSize=LARGE&page=0&sizePerPage=10" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/stalls?stallSize=LARGE" $true `
        "Found $($result.Data.content.Count) large stalls"
} else {
    Write-TestResult "GET /api/admin/stalls?stallSize=LARGE" $false $result.Error
}

Write-Host "`n[TEST 10] Get Stalls - Filter by Status AND Size" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls?status=AVAILABLE&stallSize=LARGE&page=0&sizePerPage=10" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/stalls?status=AVAILABLE&stallSize=LARGE" $true `
        "Found $($result.Data.content.Count) available large stalls"
} else {
    Write-TestResult "GET /api/admin/stalls?status=AVAILABLE&stallSize=LARGE" $false $result.Error
}

# ============================================================================
# Step 4: Test Individual Stall Endpoints
# ============================================================================

Write-TestHeader "STEP 4: Individual Stall Endpoints"

if ($FIRST_STALL_ID) {
    Write-Host "`n[TEST 11] Get Stall Details by ID: $FIRST_STALL_ID" -ForegroundColor $WARNING_COLOR
    $result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls/$FIRST_STALL_ID" -Headers $authHeaders
    if ($result.Success) {
        Write-TestResult "GET /api/admin/stalls/$FIRST_STALL_ID" $true `
            "Stall: $($result.Data.stall.stallName), Status: $($result.Data.stall.status)"
    } else {
        Write-TestResult "GET /api/admin/stalls/$FIRST_STALL_ID" $false $result.Error
    }

    Write-Host "`n[TEST 12] Get Stall Reservation Info by ID: $FIRST_STALL_ID" -ForegroundColor $WARNING_COLOR
    $result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls/$FIRST_STALL_ID/reservation" -Headers $authHeaders
    if ($result.Success) {
        if ($result.Data.reserved -eq $false) {
            Write-TestResult "GET /api/admin/stalls/$FIRST_STALL_ID/reservation" $true "Stall not reserved"
        } else {
            Write-TestResult "GET /api/admin/stalls/$FIRST_STALL_ID/reservation" $true `
                "Reservation info retrieved"
        }
    } else {
        Write-TestResult "GET /api/admin/stalls/$FIRST_STALL_ID/reservation" $false $result.Error
    }
} else {
    Write-Host "`n[TEST 11] Get Stall Details: SKIPPED" -ForegroundColor $WARNING_COLOR
    Write-TestResult "GET /api/admin/stalls/{id}" $false "No stalls available to test"
    
    Write-Host "`n[TEST 12] Get Stall Reservation Info: SKIPPED" -ForegroundColor $WARNING_COLOR
    Write-TestResult "GET /api/admin/stalls/{id}/reservation" $false "No stalls available to test"
}

# Test with known stall IDs (1, 2, 3, etc.)
Write-Host "`n[TEST 13] Get Stall Details - Stall ID: 1" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls/1" -Headers $authHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/stalls/1" $true `
        "Stall: $($result.Data.stall.stallName), Status: $($result.Data.stall.status)"
} else {
    Write-TestResult "GET /api/admin/stalls/1" $false $result.Error
}

Write-Host "`n[TEST 14] Get Stall Reservation Info - Stall ID: 2" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls/2/reservation" -Headers $authHeaders
if ($result.Success) {
    if ($result.Data.reserved -eq $false) {
        Write-TestResult "GET /api/admin/stalls/2/reservation" $true "Stall not reserved"
    } else {
        Write-TestResult "GET /api/admin/stalls/2/reservation" $true "Reservation info retrieved"
    }
} else {
    Write-TestResult "GET /api/admin/stalls/2/reservation" $false $result.Error
}

# ============================================================================
# Step 5: Test Map and Export Endpoints
# ============================================================================

Write-TestHeader "STEP 5: Map and Export Endpoints"

Write-Host "`n[TEST 15] Get Stalls for Map Display" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/stalls/map" -Headers $authHeaders
if ($result.Success) {
    $stallCount = if ($result.Data -is [Array]) { $result.Data.Count } else { 1 }
    Write-TestResult "GET /api/admin/stalls/map" $true "Retrieved $stallCount stalls for map"
} else {
    Write-TestResult "GET /api/admin/stalls/map" $false $result.Error
}

# ============================================================================
# Step 6: CSV Export Test
# ============================================================================

Write-Host "`n[TEST 16] Export Stalls to CSV" -ForegroundColor $WARNING_COLOR
try {
    $response = Invoke-WebRequest `
        -Uri "$BASE_URL/api/admin/stalls/export" `
        -Method GET `
        -Headers $authHeaders `
        -TimeoutSec 30 `
        -UseBasicParsing
    
    if ($response.StatusCode -eq 200) {
        # FIXED: Get content as string directly
        $csvContent = $response.Content
        $lines = ($csvContent -split "`r?`n").Where({ $_ -ne "" })
        
        Write-TestResult "GET /api/admin/stalls/export" $true "CSV exported with $($lines.Count) lines (including header)"
        
        # Show first few lines
        Write-Host "       Header: $($lines[0])" -ForegroundColor Gray
        Write-Host "       Stalls exported: $($lines.Count - 1)" -ForegroundColor Gray
        
        # Optionally save to file
        $csvFile = "stalls_export_$(Get-Date -Format 'yyyyMMdd_HHmmss').csv"
        $csvContent | Out-File -FilePath $csvFile -Encoding UTF8
        Write-Host "       Saved to: $csvFile" -ForegroundColor Gray
    } else {
        Write-TestResult "GET /api/admin/stalls/export" $false "Unexpected status code: $($response.StatusCode)"
    }
}
catch {
    Write-TestResult "GET /api/admin/stalls/export" $false $_.Exception.Message
}

# ============================================================================
# Test Summary
# ============================================================================

Write-TestHeader "TEST SUMMARY"

Write-Host "`nAll stall admin endpoint tests completed!" -ForegroundColor $SUCCESS_COLOR
Write-Host "Base URL: $BASE_URL" -ForegroundColor Gray
Write-Host "Authenticated as: $USERNAME" -ForegroundColor Gray
Write-Host "Role: $($loginResponse.Data.role)" -ForegroundColor Gray
Write-Host "Completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

Write-Host "`nEndpoints Tested:" -ForegroundColor $INFO_COLOR
Write-Host "  - Statistics (3 endpoints)" -ForegroundColor Gray
Write-Host "  - Stall Management (7 filtering variations)" -ForegroundColor Gray
Write-Host "  - Individual Stall Details (4 tests)" -ForegroundColor Gray
Write-Host "  - Map & Export (2 endpoints)" -ForegroundColor Gray
Write-Host "  Total: 16 tests" -ForegroundColor Gray
Write-Host "`n"