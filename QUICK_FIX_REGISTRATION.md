# Quick Fix for Registration Failed Error

## The Problem
`POST http://localhost/api/auth/register net::ERR_CONNECTION_REFUSED`

This means the backend authentication service is not running.

## Quick Solutions

### ✅ Solution 1: Start Docker Desktop and Run Services (Easiest)

1. **Start Docker Desktop** on your Windows machine
   - Look for Docker Desktop in your Start menu
   - Wait for it to fully start (whale icon in system tray)

2. **Start the backend services:**
```powershell
# From project root
docker-compose up -d
```

3. **Wait for services to start** (about 30-60 seconds)

4. **Verify services are running:**
```powershell
docker-compose ps
```

5. **Try registration again** in your frontend

---

### ✅ Solution 2: Run Authentication Service Manually (If Docker Not Available)

#### Step 1: Navigate to Authentication Service
```powershell
cd services/authentication-service
```

#### Step 2: Check Database Connection
Make sure PostgreSQL is running. If not, you can:
- Use Docker just for PostgreSQL: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:15-alpine`
- Or install PostgreSQL locally

#### Step 3: Update application.properties
Edit `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/cibf_db
spring.datasource.username=postgres
spring.datasource.password=postgres
server.port=8081
```

#### Step 4: Build and Run
```powershell
# Build the service
./gradlew.bat clean build

# Run the service
./gradlew.bat bootRun
```

#### Step 5: Update Frontend API URL
Edit `frontend/user-portal/.env`:
```env
VITE_API_URL=http://localhost:8081
```

#### Step 6: Restart Frontend
```powershell
cd ../../frontend/user-portal
npm run dev
```

---

### ✅ Solution 3: Test with Direct API Call First

Before fixing the frontend, test if the backend works:

1. **Start the backend** (using Solution 1 or 2)

2. **Test registration with PowerShell:**
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

If this works, the backend is fine. The issue is just the frontend connection.

---

## Most Common Issue: Docker Desktop Not Running

**Symptoms:**
- Error: `error during connect: this error may indicate that the docker daemon is not running`

**Solution:**
1. Open Docker Desktop application
2. Wait for it to fully start (check system tray)
3. Try `docker-compose up -d` again

---

## Verify Everything is Working

### Check 1: Backend is running
```powershell
# Test health endpoint
Invoke-RestMethod -Uri "http://localhost:8081/actuator/health"
# Or
Invoke-RestMethod -Uri "http://localhost:80/health"
```

### Check 2: Database is connected
Check the authentication service logs:
```powershell
docker-compose logs auth-service
```

You should see: "Started AuthenticationServiceApplication"

### Check 3: Frontend can reach backend
Open browser DevTools (F12) → Network tab → Try registration → Check if request goes through

---

## Step-by-Step: Complete Setup

### 1. Start Docker Desktop
- Open Docker Desktop
- Wait for it to start (whale icon appears in system tray)

### 2. Start Backend Services
```powershell
cd "E:\8 semester\software arcitecture\project new\cibf-reservation-system"
docker-compose up -d
```

### 3. Wait for Services (30-60 seconds)
```powershell
# Watch the logs
docker-compose logs -f auth-service
```

### 4. Verify Services
```powershell
docker-compose ps
```

All services should show "Up" status.

### 5. Test Backend API
```powershell
# Test health
Invoke-RestMethod -Uri "http://localhost:80/health"
```

### 6. Try Frontend Registration Again
- Go to http://localhost:3000/register
- Fill in the form
- Click "Create account"
- Should work now! ✅

---

## Still Having Issues?

### Check Logs
```powershell
# Authentication service logs
docker-compose logs auth-service

# All services logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f
```

### Common Errors

**Error: Port 80 already in use**
- Solution: Stop other services using port 80 (IIS, Apache, etc.)
- Or change port in docker-compose.yml

**Error: Port 5432 already in use**
- Solution: Stop local PostgreSQL if running
- Or change port mapping in docker-compose.yml

**Error: JWT_SECRET not set**
- Solution: Create `.env` file with `JWT_SECRET=your-secret-key`

---

## Need More Help?

1. Check `BACKEND_START_GUIDE.md` for detailed instructions
2. Check `TEST_ENDPOINTS.md` for API testing
3. Review service logs for specific errors


