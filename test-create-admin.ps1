# ============================================================
# Create Admin by Admin - Clean Test Script (ASCII SAFE)
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
} | ConvertTo-Json

try {
    $loginRes = Invoke-RestMethod "$BASE_URL/api/auth/employee/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop

    $token = $loginRes.token
    $role = $loginRes.role

    Success "Login successful."
    Write-Host ("  Role: {0}" -f $role) -ForegroundColor Gray

    if ($role -ne "ADMIN") {
        ErrorMsg "User is not an ADMIN."
        exit
    }
}
catch {
    ErrorMsg "Admin login failed."
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
} | ConvertTo-Json

$headers = @{ Authorization = "Bearer $token" }

try {
    $createRes = Invoke-RestMethod "$BASE_URL/api/admin/admins" `
        -Method Post `
        -Body $newUser `
        -ContentType "application/json" `
        -Headers $headers `
        -ErrorAction Stop

    Success "Admin created successfully."
    $newAdminId = $createRes.id
    Write-Host ("  ID: {0}" -f $newAdminId) -ForegroundColor Gray
}
catch {
    Write-Host "Admin creation failed!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    Write-Host "Response Body: $($_.Exception.Response.Content)" -ForegroundColor Gray
}


# ============================================================
# STEP 3 - Verify Login of New Admin
# ============================================================
Info "STEP 3: Verify New Admin Login..."

$loginNew = @{
    username = "admintest@cibf.lk"
    password = "admin123"
} | ConvertTo-Json

try {
    $loginNewRes = Invoke-RestMethod "$BASE_URL/api/auth/employee/login" `
        -Method Post `
        -Body $loginNew `
        -ContentType "application/json" `
        -ErrorAction Stop

    Success "New admin login successful."
    $newAdminToken = $loginNewRes.token
}
catch {
    ErrorMsg "New admin login failed."
}

# ============================================================
# STEP 4 - Dashboard Access
# ============================================================
Info "STEP 4: Dashboard Access..."

try {
    Invoke-RestMethod "$BASE_URL/api/admin/dashboard" `
        -Method Get `
        -Headers @{ Authorization = "Bearer $newAdminToken" } `
        -ErrorAction Stop

    Success "Dashboard access OK."
}
catch {
    ErrorMsg "Dashboard access failed."
}

# ============================================================
# STEP 5 - User List Access
# ============================================================
Info "STEP 5: Fetch Users..."

try {
    Invoke-RestMethod "$BASE_URL/api/admin/users?page=0&size=5" `
        -Method Get `
        -Headers @{ Authorization = "Bearer $newAdminToken" } `
        -ErrorAction Stop

    Success "User list accessible."
}
catch {
    ErrorMsg "User list fetch failed."
}

# ============================================================
# STEP 6 - Duplicate Should Fail
# ============================================================
Info "STEP 6: Duplicate Check..."

try {
    Invoke-RestMethod "$BASE_URL/api/admin/admins" `
        -Method Post `
        -Body $newUser `
        -ContentType "application/json" `
        -Headers $headers `
        -ErrorAction Stop

    Warn "Duplicate was allowed unexpectedly."
}
catch {
    Success "Duplicate rejected as expected."
}

# ============================================================
# Summary
# ============================================================
Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Magenta
Success "Script completed."
Write-Host ("Created Admin ID: {0}" -f $newAdminId) -ForegroundColor Gray
Write-Host ("DELETE: {0}/api/admin/employees/{1}" -f $BASE_URL, $newAdminId) -ForegroundColor Gray
