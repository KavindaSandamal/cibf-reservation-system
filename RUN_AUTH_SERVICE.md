# Running Authentication Service Manually (Without Docker)

## Problem
Docker build is failing due to network/TLS issues downloading Maven dependencies.

## Solution: Run Service Locally

### Step 1: PostgreSQL is Already Running ✅
PostgreSQL container is running on port 5432.

### Step 2: Update Frontend Configuration
Update `frontend/user-portal/.env`:
```env
VITE_API_URL=http://localhost:8081
```

This bypasses Nginx and connects directly to the authentication service.

### Step 3: Build and Run Authentication Service

```powershell
# Navigate to authentication service
cd services/authentication-service

# Build the service (downloads dependencies)
./gradlew.bat clean build

# Run the service
./gradlew.bat bootRun
```

### Step 4: Wait for Service to Start
Look for this message in the console:
```
Started AuthenticationServiceApplication in X.XXX seconds
```

### Step 5: Test Registration
1. Frontend should now connect to `http://localhost:8081/api/auth/register`
2. Try registering a user
3. Should work! ✅

## Alternative: Quick Test with PowerShell

Test the API directly:
```powershell
$body = @{
    email = "test@example.com"
    password = "password123"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/auth/register" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

## Troubleshooting

### Port 8081 Already in Use
```powershell
# Find process using port 8081
netstat -ano | findstr :8081

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Database Connection Failed
- Make sure PostgreSQL container is running: `docker ps`
- Check database logs: `docker logs postgres-db`
- Verify connection: `docker exec -it postgres-db psql -U postgres -d cibf_db`

### Build Fails
- Check internet connection
- Try: `./gradlew.bat build --refresh-dependencies`
- Clear Gradle cache: `./gradlew.bat clean`


