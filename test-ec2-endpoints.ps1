# Get EC2 public IP
$INSTANCE_ID = "i-03f8342de6a3a4e7c"
$EC2_IP = aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].PublicIpAddress' --output text --region us-west-2

Write-Host "Testing Authentication Service on EC2: $EC2_IP" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "http://$EC2_IP"

# Test 0: Health Check
Write-Host "Test 0: Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$BASE_URL/health" -Method Get
    Write-Host "✅ SUCCESS! Response: $response" -ForegroundColor Green
} catch {
    Write-Host "❌ FAILED! Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 1: User Registration
Write-Host "Test 1: User Registration" -ForegroundColor Yellow
try {
    $body = @{
        username = "testuseraws@cibf.com"
        password = "password123"
        businessName = "Test Aws Business"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/register" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: User Login
Write-Host "Test 2: User Login" -ForegroundColor Yellow
try {
    $body = @{
        username = "testuseraws@cibf.com"
        password = "password123"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/login" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Token: $($response.accessToken)" -ForegroundColor Green
    
    # Save token for future tests
    $global:authToken = $response.accessToken
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""

# Test 3: Employee Registration
Write-Host "Test 3: Employee Registration" -ForegroundColor Yellow
try {
    $body = @{
        username = "employeeaws@cibf.com"
        password = "password123"
        name = "Jane Employee"
        email = "employeeaws@cibf.com"
        employeeId = "EMP-002"
        role = "EMPLOYEE"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$BASE_URL/api/auth/employee/register" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "❌ FAILED!" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Complete!" -ForegroundColor Cyan
Write-Host "EC2 Public IP: $EC2_IP" -ForegroundColor Cyan
Write-Host "Base URL: $BASE_URL" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan