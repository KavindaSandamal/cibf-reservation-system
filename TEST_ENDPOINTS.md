# Testing Authentication Service Endpoints

## 🔍 Issue: Getting 401 Unauthorized

If you're getting 401 errors, the service might need to be restarted or there's a configuration issue.

## ✅ Solution Steps

### **Step 1: Stop Current Service**

```powershell
# Find and stop the running service
Get-Process | Where-Object {$_.ProcessName -like "*java*"} | Stop-Process -Force

# Or if you know the PID (from netstat)
Stop-Process -Id 16836 -Force
```

### **Step 2: Restart Service Properly**

```powershell
# Navigate to authentication service
cd services/authentication-service

# Clean and rebuild
./gradlew clean build

# Start the service
./gradlew bootRun
```

### **Step 3: Wait for Service to Start**

Wait for this message in the console:
```
Started AuthenticationServiceApplication in X.XXX seconds
```

### **Step 4: Test Endpoints**

**Option A: Use PowerShell Script**

```powershell
# From project root
.\test-auth-endpoint.ps1
```

**Option B: Manual PowerShell Commands**

```powershell
# Test User Registration
$body = @{
    username = "testuser@cibf.com"
    password = "password123"
    businessName = "Test Business"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/auth/register" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**Option C: Use Postman or Insomnia**

- **URL**: `http://localhost:8081/api/auth/register`
- **Method**: POST
- **Headers**: `Content-Type: application/json`
- **Body** (JSON):
```json
{
  "username": "testuser@cibf.com",
  "password": "password123",
  "businessName": "Test Business"
}
```

---

## 🧪 Test All Endpoints

### **1. User Registration**
```powershell
$body = @{
    username = "vendor1@cibf.com"
    password = "password123"
    businessName = "Great Books Publisher"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/auth/register" `
    -Method Post -Body $body -ContentType "application/json"
```

### **2. User Login**
```powershell
$body = @{
    username = "vendor1@cibf.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/auth/login" `
    -Method Post -Body $body -ContentType "application/json"
```

### **3. Employee Registration**
```powershell
$body = @{
    username = "employee1@cibf.com"
    password = "password123"
    name = "Jane Employee"
    email = "employee1@cibf.com"
    employeeId = "EMP-001"
    role = "EMPLOYEE"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/auth/employee/register" `
    -Method Post -Body $body -ContentType "application/json"
```

### **4. Employee Login**
```powershell
$body = @{
    username = "employee1@cibf.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/auth/employee/login" `
    -Method Post -Body $body -ContentType "application/json"
```

---

## 🔧 Troubleshooting

### **If you get 401 Unauthorized:**

1. **Check if service is running:**
   ```powershell
   netstat -ano | findstr :8081
   ```

2. **Check service logs** for errors:
   - Look for Spring Security configuration errors
   - Check if PublicSecurityConfig is being loaded

3. **Verify security configuration:**
   - Ensure `PublicSecurityConfig.java` has `@Order(1)`
   - Ensure `securityMatcher("/api/auth/**")` is correct

4. **Restart the service:**
   ```powershell
   # Stop
   Get-Process java | Stop-Process -Force
   
   # Start
   cd services/authentication-service
   ./gradlew bootRun
   ```

### **If you get Connection Refused:**

- Service is not running
- Start it: `cd services/authentication-service && ./gradlew bootRun`

### **If you get Database Connection Error:**

- Ensure PostgreSQL is running
- Check `application.properties` database connection
- Verify database `cibf_db` exists

---

## ✅ Expected Response

**Successful Registration Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "role": "VENDOR",
  "businessName": "Test Business"
}
```

**Successful Login Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzUxMiJ9...",
  "tokenType": "Bearer",
  "role": "VENDOR",
  "businessName": "Test Business"
}
```

---

## 🎯 Quick Test Command

```powershell
# One-liner test
$body = '{"username":"test@cibf.com","password":"password123","businessName":"Test Business"}'; Invoke-RestMethod -Uri "http://localhost:8081/api/auth/register" -Method Post -Body $body -ContentType "application/json"
```

