# ============================================================
# Create Admin by Admin - Robust PowerShell Script
# ============================================================

$BASE_URL = "http://34.213.51.153"
$ADMIN_USERNAME = "admin@cibf.lk"
$ADMIN_PASSWORD = "admin123"

function Success($m) { Write-Host $m -ForegroundColor Green }
function ErrorMsg($m) { Write-Host $m -ForegroundColor Red }
function Info($m) { Write-Host $m -ForegroundColor Cyan }
function Warn($m) { Write-Host $m -ForegroundColor Yellow }

Write-Host ""
Write-Host "=== Create Admin by Admin Test ===" -ForegroundColor Magenta
Write-Host ""

# ============================================================
# STEP 1 - Admin Login
# ============================================================
Info "STEP 1: Admin Login..."

$loginBody = @{
    username = $ADMIN_USERNAME
    password = $ADMIN_PASSWORD
} | ConvertTo-Json -Compress

try {
    $loginRes = Invoke-RestMethod "$BASE_URL/api/auth/employee/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json; charset=utf-8" `
        -ErrorAction Stop `
        -UseBasicParsing

    # Inspect response to find token and role fields
    Write-Host "Login Response JSON:" -ForegroundColor Gray
    Write-Host ($loginRes | ConvertTo-Json -Depth 5) -ForegroundColor DarkGray

    # Assign token and role with null-check
    $token = $loginRes.token
    if (-not $token -and $loginRes.accessToken) { $token = $loginRes.accessToken }
    $role = $loginRes.role
    if (-not $role -and $loginRes.userRole) { $role = $loginRes.userRole }

    if (-not $token) {
        ErrorMsg "Login succeeded but token is null. Cannot continue."
        exit
    }

    Success "Login successful."
    Write-Host ("  Role: {0}" -f $role) -ForegroundColor Gray
    Write-Host ("  Token: {0}..." -f $token.Substring(0, [Math]::Min(50, $token.Length))) -ForegroundColor DarkGray

    if ($role -ne "ADMIN") {
        ErrorMsg "User is not an ADMIN. Exiting."
        exit
    }
}
catch {
    ErrorMsg "Admin login failed."
    Write-Host "Error: $_" -ForegroundColor Yellow
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
    exit
}

# ============================================================
# STEP 2 - Create Admin
# ============================================================
Info "STEP 2: Creating Admin..."

$newUser = @{
    username = "admintest@cibf.lk"
    password = "admin123"
    name = "Test Admin"
    email = "admintest@cibf.lk"
    employeeId = "ADM-005"
    contactNumber = "+94771234567"
    department = "IT Administration"
} | ConvertTo-Json -Compress

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json; charset=utf-8"
}

try {
    $createRes = Invoke-RestMethod "$BASE_URL/api/admin/admins" `
        -Method Post `
        -Body $newUser `
        -Headers $headers `
        -ErrorAction Stop `
        -UseBasicParsing

    Success "Admin created successfully."
    $newAdminId = $createRes.id
    Write-Host ("  ID: {0}" -f $newAdminId) -ForegroundColor Gray
    Write-Host ("  Username: {0}" -f $createRes.username) -ForegroundColor Gray
    Write-Host ("  Email: {0}" -f $createRes.email) -ForegroundColor Gray
}
catch {
    ErrorMsg "Admin creation failed!"
    Write-Host "Error: $_" -ForegroundColor Yellow
    $newAdminId = $null

    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Yellow
        Write-Host "Status Description: $($_.Exception.Response.StatusDescription)" -ForegroundColor Yellow
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody" -ForegroundColor Gray
        }
        catch {
            Write-Host "Could not read response body" -ForegroundColor Yellow
        }
    }
}

if (-not $newAdminId) {
    Warn "Skipping remaining tests since admin creation failed"
    exit
}

# ============================================================
# STEP 3 - Verify Login of New Admin
# ============================================================
Info "STEP 3: Verify New Admin Login..."

$loginNew = @{
    username = "admintest@cibf.lk"
    password = "admin123"
} | ConvertTo-Json -Compress

try {
    $loginNewRes = Invoke-RestMethod "$BASE_URL/api/auth/employee/login" `
        -Method Post `
        -Body $loginNew `
        -ContentType "application/json; charset=utf-8" `
        -ErrorAction Stop `
        -UseBasicParsing

    # Assign token safely
    $newAdminToken = $loginNewRes.token
    if (-not $newAdminToken -and $loginNewRes.accessToken) { $newAdminToken = $loginNewRes.accessToken }

    if (-not $newAdminToken) {
        ErrorMsg "New admin login returned null token."
        exit
    }

    Success "New admin login successful."
    Write-Host ("  Role: {0}" -f $loginNewRes.role) -ForegroundColor Gray
}
catch {
    ErrorMsg "New admin login failed."
    Write-Host "Error: $_" -ForegroundColor Yellow
    exit
}

# ============================================================
# STEP 4 - Dashboard Access
# ============================================================
Info "STEP 4: Dashboard Access..."

$dashboardHeaders = @{
    "Authorization" = "Bearer $newAdminToken"
}

try {
    $dashRes = Invoke-RestMethod "$BASE_URL/api/admin/dashboard" `
        -Method Get `
        -Headers $dashboardHeaders `
        -ErrorAction Stop `
        -UseBasicParsing

    Success "Dashboard access OK."
    if ($dashRes.statistics) {
        Write-Host ("  Total Users: {0}" -f $dashRes.statistics.totalUsers) -ForegroundColor Gray
    }
}
catch {
    ErrorMsg "Dashboard access failed."
    Write-Host "Error: $_" -ForegroundColor Yellow
}

# ============================================================
# STEP 5 - User List Access
# ============================================================
Info "STEP 5: Fetch Users..."

try {
    $usersRes = Invoke-RestMethod "$BASE_URL/api/admin/users?page=0&size=5" `
        -Method Get `
        -Headers $dashboardHeaders `
        -ErrorAction Stop `
        -UseBasicParsing

    Success "User list accessible."
    Write-Host ("  Found {0} users" -f $usersRes.totalItems) -ForegroundColor Gray
}
catch {
    ErrorMsg "User list fetch failed."
    Write-Host "Error: $_" -ForegroundColor Yellow
}

# ============================================================
# STEP 6 - Duplicate Check
# ============================================================
Info "STEP 6: Duplicate Check..."

try {
    Invoke-RestMethod "$BASE_URL/api/admin/admins" `
        -Method Post `
        -Body $newUser `
        -Headers $headers `
        -ErrorAction Stop `
        -UseBasicParsing

    Warn "Duplicate was allowed unexpectedly."
}
catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Success "Duplicate rejected as expected."
    }
    else {
        Warn "Duplicate check returned unexpected status: $($_.Exception.Response.StatusCode.value__)"
    }
}

# ============================================================
# Summary
# ============================================================
Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Magenta
Success "Script completed."
Write-Host ("Created Admin ID: {0}" -f $newAdminId) -ForegroundColor Gray
Write-Host ("Username: admintest@cibf.lk") -ForegroundColor Gray
Write-Host ""
Write-Host "To delete this admin:" -ForegroundColor Yellow
Write-Host ("  DELETE: {0}/api/admin/employees/{1}" -f $BASE_URL, $newAdminId) -ForegroundColor Gray
Write-Host ""
Write-Host "Curl command to delete:" -ForegroundColor Yellow
Write-Host "curl -X DELETE '$BASE_URL/api/admin/employees/$newAdminId' -H 'Authorization: Bearer $token'" -ForegroundColor Gray
