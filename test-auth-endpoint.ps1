# PowerShell script to test authentication endpoints
# Run this from project root

Write-Host "Testing Authentication Service Endpoints..." -ForegroundColor Cyan
Write-Host ""

# Test 1: User Registration
Write-Host "Test 1: User Registration" -ForegroundColor Yellow
try {
    $body = @{
        username = "testuser@cibf.com"
        password = "password123"
        businessName = "Test Business"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/register" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test 2: User Login" -ForegroundColor Yellow
try {
    $body = @{
        username = "testuser@cibf.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Token: $($response.accessToken)" -ForegroundColor Green
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Test 3: Employee Registration" -ForegroundColor Yellow
try {
    $body = @{
        username = "employee1@cibf.com"
        password = "password123"
        name = "Jane Employee"
        email = "employee1@cibf.com"
        employeeId = "EMP-001"
        role = "EMPLOYEE"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:8081/api/auth/employee/register" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing Complete!" -ForegroundColor Cyan

