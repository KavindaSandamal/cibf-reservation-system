# ============================================================================
# Admin Controller Endpoints Testing Script
# ============================================================================

$BASE_URL = "http://34.213.51.153"
$EMPLOYEE_USERNAME = "emp_test_002@cibf.com"
$EMPLOYEE_PASSWORD = "Test@123"
$ADMIN_USERNAME = "admin@cibf.lk"
$ADMIN_PASSWORD = "admin123"

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
            Write-Host "       Body: $jsonBody" -ForegroundColor DarkGray
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
# Step 1: Login as Employee
# ============================================================================

Write-TestHeader "STEP 1: Authentication - Employee Login"

$loginBody = @{
    username = $EMPLOYEE_USERNAME
    password = $EMPLOYEE_PASSWORD
}

Write-Host "`nAttempting login as Employee: $EMPLOYEE_USERNAME..." -ForegroundColor $INFO_COLOR
$loginResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/api/auth/login" -Body $loginBody

if (-not $loginResponse.Success) {
    Write-TestResult "Employee Login" $false $loginResponse.Error
    Write-Host "`nCannot proceed without employee authentication. Exiting..." -ForegroundColor $ERROR_COLOR
    exit 1
}

# Check for token (could be 'token' or 'accessToken' depending on your implementation)
$EMPLOYEE_TOKEN = if ($loginResponse.Data.token) { $loginResponse.Data.token } elseif ($loginResponse.Data.accessToken) { $loginResponse.Data.accessToken } else { $null }

if (-not $EMPLOYEE_TOKEN) {
    Write-TestResult "Employee Login" $false "No token received in response"
    exit 1
}

Write-TestResult "Employee Login" $true "Token obtained successfully"
Write-Host "       Username: $($loginResponse.Data.username)" -ForegroundColor Gray
Write-Host "       Role: $($loginResponse.Data.role)" -ForegroundColor Gray
Write-Host "       Token Preview: $($EMPLOYEE_TOKEN.Substring(0, [Math]::Min(30, $EMPLOYEE_TOKEN.Length)))..." -ForegroundColor Gray

$employeeHeaders = @{
    "Authorization" = "Bearer $EMPLOYEE_TOKEN"
    "Accept" = "application/json"
}

# ============================================================================
# Step 2: Login as Admin
# ============================================================================

Write-TestHeader "STEP 2: Authentication - Admin Login"

$adminLoginBody = @{
    username = $ADMIN_USERNAME
    password = $ADMIN_PASSWORD
}

Write-Host "`nAttempting login as Admin: $ADMIN_USERNAME..." -ForegroundColor $INFO_COLOR
$adminLoginResponse = Invoke-ApiRequest -Method "POST" -Endpoint "/api/auth/login" -Body $adminLoginBody

if (-not $adminLoginResponse.Success) {
    Write-TestResult "Admin Login" $false $adminLoginResponse.Error
    Write-Host "`nWarning: Admin tests will be skipped..." -ForegroundColor $WARNING_COLOR
    $ADMIN_TOKEN = $null
} else {
    $ADMIN_TOKEN = if ($adminLoginResponse.Data.token) { $adminLoginResponse.Data.token } elseif ($adminLoginResponse.Data.accessToken) { $adminLoginResponse.Data.accessToken } else { $null }
    
    if ($ADMIN_TOKEN) {
        Write-TestResult "Admin Login" $true "Token obtained successfully"
        Write-Host "       Username: $($adminLoginResponse.Data.username)" -ForegroundColor Gray
        Write-Host "       Role: $($adminLoginResponse.Data.role)" -ForegroundColor Gray
        Write-Host "       Token Preview: $($ADMIN_TOKEN.Substring(0, [Math]::Min(30, $ADMIN_TOKEN.Length)))..." -ForegroundColor Gray
    } else {
        Write-TestResult "Admin Login" $false "No token received"
        $ADMIN_TOKEN = $null
    }
}

$adminHeaders = if ($ADMIN_TOKEN) { 
    @{
        "Authorization" = "Bearer $ADMIN_TOKEN"
        "Accept" = "application/json"
    }
} else { $null }

# ============================================================================
# Step 3: Dashboard Tests
# ============================================================================

Write-TestHeader "STEP 3: Dashboard Endpoints"

Write-Host "`n[TEST 1] Get Dashboard - Employee Access" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/dashboard" -Headers $employeeHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/dashboard (Employee)" $true `
        "Total Users: $($result.Data.totalUsers), Message: $($result.Data.message)"
} else {
    Write-TestResult "GET /api/admin/dashboard (Employee)" $false $result.Error
}

if ($adminHeaders) {
    Write-Host "`n[TEST 2] Get Dashboard - Admin Access" -ForegroundColor $WARNING_COLOR
    $result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/dashboard" -Headers $adminHeaders
    if ($result.Success) {
        Write-TestResult "GET /api/admin/dashboard (Admin)" $true `
            "Total Users: $($result.Data.totalUsers), Message: $($result.Data.message)"
    } else {
        Write-TestResult "GET /api/admin/dashboard (Admin)" $false $result.Error
    }
}

# ============================================================================
# Step 4: User Management Tests
# ============================================================================

Write-TestHeader "STEP 4: User Management Endpoints"

Write-Host "`n[TEST 3] Get All Users - Default Pagination" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users" -Headers $employeeHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/users" $true `
        "Total: $($result.Data.totalItems), Pages: $($result.Data.totalPages), Current Page: $($result.Data.currentPage)"
    $FIRST_USER_ID = if ($result.Data.users.Count -gt 0) { $result.Data.users[0].id } else { $null }
} else {
    Write-TestResult "GET /api/admin/users" $false $result.Error
    $FIRST_USER_ID = $null
}

Write-Host "`n[TEST 4] Get Users - Custom Pagination (page=0, size=5)" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users?page=0&size=5&sortBy=createdAt&sortDir=DESC" -Headers $employeeHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/users (Paginated)" $true "Retrieved $($result.Data.users.Count) users"
} else {
    Write-TestResult "GET /api/admin/users (Paginated)" $false $result.Error
}

Write-Host "`n[TEST 5] Search Users - Search term 'test'" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users?search=test" -Headers $employeeHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/users?search=test" $true "Found $($result.Data.users.Count) matching users"
} else {
    Write-TestResult "GET /api/admin/users?search=test" $false $result.Error
}

Write-Host "`n[TEST 6] Search Users - Search by email domain '@cibf'" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users?search=@cibf" -Headers $employeeHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/users?search=@cibf" $true "Found $($result.Data.users.Count) matching users"
} else {
    Write-TestResult "GET /api/admin/users?search=@cibf" $false $result.Error
}

if ($FIRST_USER_ID) {
    Write-Host "`n[TEST 7] Get User by ID: $FIRST_USER_ID" -ForegroundColor $WARNING_COLOR
    $result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users/$FIRST_USER_ID" -Headers $employeeHeaders
    if ($result.Success) {
        Write-TestResult "GET /api/admin/users/$FIRST_USER_ID" $true `
            "Email: $($result.Data.email), Role: $($result.Data.role), Total Reservations: $($result.Data.totalReservations)"
    } else {
        Write-TestResult "GET /api/admin/users/$FIRST_USER_ID" $false $result.Error
    }
} else {
    Write-Host "`n[TEST 7] Get User by ID: SKIPPED" -ForegroundColor $WARNING_COLOR
    Write-TestResult "GET /api/admin/users/{id}" $false "No users available"
}

Write-Host "`n[TEST 8] Get User Statistics" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users/statistics" -Headers $employeeHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/users/statistics" $true `
        "Total: $($result.Data.totalUsers), Last 7 Days: $($result.Data.last7Days), Vendors: $($result.Data.vendorCount)"
} else {
    Write-TestResult "GET /api/admin/users/statistics" $false $result.Error
}

Write-Host "`n[TEST 9] Export Users to CSV" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users/export" -Headers $employeeHeaders
Write-TestResult "GET /api/admin/users/export" $result.Success $(if($result.Success){"CSV export successful"}else{$result.Error})

# ============================================================================
# Step 5: Sorting Tests
# ============================================================================

Write-TestHeader "STEP 5: Sorting and Pagination Tests"

Write-Host "`n[TEST 10] Sort by Email - Ascending" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users?sortBy=email&sortDir=ASC&page=0&size=5" -Headers $employeeHeaders
Write-TestResult "GET /api/admin/users?sortBy=email&sortDir=ASC" $result.Success $(if($result.Success){"Retrieved $($result.Data.users.Count) users"}else{$result.Error})

Write-Host "`n[TEST 11] Sort by Business Name - Descending" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users?sortBy=businessName&sortDir=DESC&page=0&size=5" -Headers $employeeHeaders
Write-TestResult "GET /api/admin/users?sortBy=businessName&sortDir=DESC" $result.Success $(if($result.Success){"Retrieved $($result.Data.users.Count) users"}else{$result.Error})

Write-Host "`n[TEST 12] Sort by Created Date - Ascending" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users?sortBy=createdAt&sortDir=ASC&page=0&size=5" -Headers $employeeHeaders
Write-TestResult "GET /api/admin/users?sortBy=createdAt&sortDir=ASC" $result.Success $(if($result.Success){"Retrieved $($result.Data.users.Count) users"}else{$result.Error})

Write-Host "`n[TEST 13] Combined: Search + Sort + Pagination" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users?search=test&page=0&size=3&sortBy=createdAt&sortDir=DESC" -Headers $employeeHeaders
if ($result.Success) {
    Write-TestResult "GET /api/admin/users (Combined)" $true "Found $($result.Data.users.Count) results"
} else {
    Write-TestResult "GET /api/admin/users (Combined)" $false $result.Error
}

# ============================================================================
# Step 6: Admin-Only Operations
# ============================================================================

Write-TestHeader "STEP 6: Admin-Only Operations"

if ($adminHeaders) {
    Write-Host "`n[TEST 14] Create Employee (Admin)" -ForegroundColor $WARNING_COLOR
    $newEmployee = @{
        username = "emp_test_new_$(Get-Date -Format 'yyyyMMddHHmmss')@cibf.com"
        password = "NewEmp@123"
        name = "Test Employee $(Get-Date -Format 'HHmmss')"
        employeeId = "EMP-TEST-$(Get-Date -Format 'HHmmss')"
        email = "emp_test_new_$(Get-Date -Format 'yyyyMMddHHmmss')@cibf.com"
        contactNumber = "+94771234567"
        department = "Testing"
        role = "EMPLOYEE"
    }
    $result = Invoke-ApiRequest -Method "POST" -Endpoint "/api/admin/employees" -Headers $adminHeaders -Body $newEmployee
    if ($result.Success) {
        Write-TestResult "POST /api/admin/employees" $true "Employee created successfully"
        $NEW_EMPLOYEE_ID = $result.Data.userId
    } else {
        Write-TestResult "POST /api/admin/employees" $false $result.Error
        $NEW_EMPLOYEE_ID = $null
    }

    Write-Host "`n[TEST 15] Create Vendor/User (Admin)" -ForegroundColor $WARNING_COLOR
    $newVendor = @{
        username = "vendor_test_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
        password = "Vendor@123"
        businessName = "Test Publishers $(Get-Date -Format 'HHmmss')"
        email = "vendor_test_$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
        contactNumber = "+94779876543"
        address = "Test Address, Colombo"
    }
    $result = Invoke-ApiRequest -Method "POST" -Endpoint "/api/admin/users" -Headers $adminHeaders -Body $newVendor
    if ($result.Success) {
        Write-TestResult "POST /api/admin/users" $true "Vendor created successfully"
        $NEW_VENDOR_ID = $result.Data.userId
    } else {
        Write-TestResult "POST /api/admin/users" $false $result.Error
        $NEW_VENDOR_ID = $null
    }

    Write-Host "`n[TEST 16] Get Admin Settings (Admin)" -ForegroundColor $WARNING_COLOR
    $result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/settings" -Headers $adminHeaders
    Write-TestResult "GET /api/admin/settings (Admin)" $result.Success $(if($result.Success){"Settings accessed"}else{$result.Error})

    Write-Host "`n[TEST 17] Get Admin Settings (Employee - Should Fail)" -ForegroundColor $WARNING_COLOR
    $result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/settings" -Headers $employeeHeaders
    if (-not $result.Success -and $result.StatusCode -eq 403) {
        Write-TestResult "GET /api/admin/settings (Employee Access Denied)" $true "Correctly denied access (403)"
    } else {
        Write-TestResult "GET /api/admin/settings (Employee Access Denied)" $false "Should have been denied but got: $($result.StatusCode)"
    }

} else {
    Write-Host "`n[SKIPPED] Admin-only operations - Admin authentication failed" -ForegroundColor $WARNING_COLOR
}

# ============================================================================
# Step 7: Delete Operations (Admin Only)
# ============================================================================

Write-TestHeader "STEP 7: Delete Operations (Admin Only)"

if ($adminHeaders) {
    
    if ($NEW_VENDOR_ID) {
        Write-Host "`n[TEST 18] Delete Vendor (Admin)" -ForegroundColor $WARNING_COLOR
        $result = Invoke-ApiRequest -Method "DELETE" -Endpoint "/api/admin/users/$NEW_VENDOR_ID" -Headers $adminHeaders
        if ($result.Success) {
            Write-TestResult "DELETE /api/admin/users/$NEW_VENDOR_ID" $true "Vendor deleted: $($result.Data.message)"
        } else {
            Write-TestResult "DELETE /api/admin/users/$NEW_VENDOR_ID" $false $result.Error
        }
    } else {
        Write-Host "`n[TEST 18] Delete Vendor: SKIPPED (No vendor created)" -ForegroundColor $WARNING_COLOR
    }

    if ($NEW_EMPLOYEE_ID) {
        Write-Host "`n[TEST 19] Delete Employee (Admin)" -ForegroundColor $WARNING_COLOR
        $result = Invoke-ApiRequest -Method "DELETE" -Endpoint "/api/admin/employees/$NEW_EMPLOYEE_ID" -Headers $adminHeaders
        if ($result.Success) {
            Write-TestResult "DELETE /api/admin/employees/$NEW_EMPLOYEE_ID" $true "Employee deleted: $($result.Data.message)"
        } else {
            Write-TestResult "DELETE /api/admin/employees/$NEW_EMPLOYEE_ID" $false $result.Error
        }
    } else {
        Write-Host "`n[TEST 19] Delete Employee: SKIPPED (No employee created)" -ForegroundColor $WARNING_COLOR
    }

    Write-Host "`n[TEST 20] Try Delete with Employee Token (Should Fail)" -ForegroundColor $WARNING_COLOR
    $result = Invoke-ApiRequest -Method "DELETE" -Endpoint "/api/admin/users/999" -Headers $employeeHeaders
    if (-not $result.Success -and ($result.StatusCode -eq 403 -or $result.StatusCode -eq 401)) {
        Write-TestResult "DELETE with Employee Token (Access Denied)" $true "Correctly denied access"
    } else {
        Write-TestResult "DELETE with Employee Token (Access Denied)" $false "Should have been denied"
    }

    Write-Host "`n[TEST 21] Delete Non-Existent User" -ForegroundColor $WARNING_COLOR
    $result = Invoke-ApiRequest -Method "DELETE" -Endpoint "/api/admin/users/99999" -Headers $adminHeaders
    if (-not $result.Success) {
        Write-TestResult "DELETE /api/admin/users/99999 (Non-existent)" $true "Correctly failed to delete non-existent user"
    } else {
        Write-TestResult "DELETE /api/admin/users/99999 (Non-existent)" $false "Should have failed"
    }

} else {
    Write-Host "`n[SKIPPED] Delete operations - Admin authentication failed" -ForegroundColor $WARNING_COLOR
}

# ============================================================================
# Step 8: Error Handling Tests
# ============================================================================

Write-TestHeader "STEP 8: Error Handling Tests"

Write-Host "`n[TEST 22] Get User with Invalid ID" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users/99999" -Headers $employeeHeaders
if (-not $result.Success) {
    Write-TestResult "GET /api/admin/users/99999 (Invalid ID)" $true "Correctly handled invalid ID"
} else {
    Write-TestResult "GET /api/admin/users/99999 (Invalid ID)" $false "Should have failed"
}

Write-Host "`n[TEST 23] Search with Empty Query" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users?search=" -Headers $employeeHeaders
Write-TestResult "GET /api/admin/users?search= (Empty)" $result.Success $(if($result.Success){"Handled empty search"}else{$result.Error})

Write-Host "`n[TEST 24] Invalid Sort Field" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users?sortBy=invalidField&sortDir=ASC" -Headers $employeeHeaders
Write-TestResult "GET /api/admin/users?sortBy=invalidField" $result.Success $(if($result.Success){"Handled invalid sort field"}else{$result.Error})

Write-Host "`n[TEST 25] Negative Page Number" -ForegroundColor $WARNING_COLOR
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/api/admin/users?page=-1&size=10" -Headers $employeeHeaders
Write-TestResult "GET /api/admin/users?page=-1" $result.Success $(if($result.Success){"Handled negative page"}else{$result.Error})

# ============================================================================
# Test Summary
# ============================================================================

Write-TestHeader "TEST SUMMARY"

Write-Host "`nAll tests completed!" -ForegroundColor $SUCCESS_COLOR
Write-Host "Base URL: $BASE_URL" -ForegroundColor Gray
Write-Host "Employee: $EMPLOYEE_USERNAME" -ForegroundColor Gray
Write-Host "Admin: $ADMIN_USERNAME" -ForegroundColor Gray
Write-Host "Completed at: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

Write-Host "`nEndpoints Tested:" -ForegroundColor $INFO_COLOR
Write-Host "  - Dashboard (GET /api/admin/dashboard)" -ForegroundColor Gray
Write-Host "  - Get All Users (GET /api/admin/users)" -ForegroundColor Gray
Write-Host "  - Search Users (GET /api/admin/users?search=...)" -ForegroundColor Gray
Write-Host "  - Get User by ID (GET /api/admin/users/{id})" -ForegroundColor Gray
Write-Host "  - User Statistics (GET /api/admin/users/statistics)" -ForegroundColor Gray
Write-Host "  - Export CSV (GET /api/admin/users/export)" -ForegroundColor Gray
Write-Host "  - Create Employee (POST /api/admin/employees)" -ForegroundColor Gray
Write-Host "  - Create Vendor (POST /api/admin/users)" -ForegroundColor Gray
Write-Host "  - Delete User (DELETE /api/admin/users/{id})" -ForegroundColor Gray
Write-Host "  - Delete Employee (DELETE /api/admin/employees/{id})" -ForegroundColor Gray
Write-Host "  - Admin Settings (GET /api/admin/settings)" -ForegroundColor Gray

Write-Host "`nNote: Bulk delete operations were not tested to preserve data." -ForegroundColor $WARNING_COLOR
Write-Host "`n"