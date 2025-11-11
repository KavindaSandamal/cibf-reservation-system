# Backend Services Start Guide

## Problem: Registration Failed - Connection Refused

The error `POST http://localhost/api/auth/register net::ERR_CONNECTION_REFUSED` means the backend services are not running.

## Solution: Start Backend Services

### Option 1: Using Docker Compose (Recommended)

#### Step 1: Check if you have a .env file
Create a `.env` file in the project root if it doesn't exist:
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

#### Step 2: Start the services
```bash
# From project root
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Authentication Service (port 8081)
- Nginx reverse proxy (port 80)

#### Step 3: Check if services are running
```bash
docker-compose ps
```

You should see all services running.

#### Step 4: Check logs if there are issues
```bash
# Check authentication service logs
docker-compose logs auth-service

# Check all logs
docker-compose logs
```

### Option 2: Start Authentication Service Manually (Without Docker)

If Docker is not working or you prefer to run the service directly:

#### Step 1: Navigate to authentication service
```bash
cd services/authentication-service
```

#### Step 2: Check if you have application.properties configured
The file should be at: `services/authentication-service/src/main/resources/application.properties`

#### Step 3: Build and run the service
```bash
# Windows (PowerShell)
./gradlew.bat clean build
./gradlew.bat bootRun

# Linux/Mac
./gradlew clean build
./gradlew bootRun
```

#### Step 4: Update frontend API URL
Since Nginx won't be running, update `frontend/user-portal/.env`:
```env
VITE_API_URL=http://localhost:8081
```

### Option 3: Quick Test - Mock the Backend (For UI Testing Only)

If you just want to test the frontend UI without the backend, you can temporarily modify the AuthContext to bypass the API call.

**⚠️ Warning: This is only for UI testing. Don't use in production!**

## Verification Steps

### 1. Check if services are running

**Docker:**
```bash
docker-compose ps
```

**Manual:**
- Check if port 8081 is listening: `netstat -an | findstr 8081` (Windows) or `lsof -i :8081` (Linux/Mac)

### 2. Test the API endpoint

**Using PowerShell:**
```powershell
# Test health endpoint
Invoke-RestMethod -Uri "http://localhost:80/health"

# Test registration endpoint
$body = @{
    email = "test@example.com"
    password = "password123"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:80/api/auth/register" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**Using curl:**
```bash
# Test health
curl http://localhost:80/health

# Test registration
curl -X POST http://localhost:80/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'
```

### 3. Check browser console
- Open browser DevTools (F12)
- Go to Network tab
- Try registering again
- Check if the request is going to the right URL
- Check the response status

## Common Issues and Solutions

### Issue 1: Port 80 already in use
**Solution:** Stop the service using port 80 or change the port in docker-compose.yml

### Issue 2: Port 5432 (PostgreSQL) already in use
**Solution:** Stop existing PostgreSQL service or change the port mapping

### Issue 3: JWT_SECRET not set
**Solution:** Create `.env` file with `JWT_SECRET=your-secret-key`

### Issue 4: Database connection failed
**Solution:** 
- Check if PostgreSQL container is running: `docker-compose ps postgres`
- Check database logs: `docker-compose logs postgres`
- Verify database credentials in docker-compose.yml

### Issue 5: Service builds but doesn't start
**Solution:**
- Check service logs: `docker-compose logs auth-service`
- Verify application.properties configuration
- Check if required environment variables are set

## Next Steps After Starting Backend

1. ✅ Backend services are running
2. ✅ Frontend can connect to backend
3. ✅ Try registration again in the frontend
4. ✅ If successful, you should see a success message
5. ✅ Check the browser console for any remaining errors

## Stopping Services

**To stop all services:**
```bash
docker-compose down
```

**To stop and remove volumes (clean slate):**
```bash
docker-compose down -v
```

## Need Help?

- Check `TEST_ENDPOINTS.md` for endpoint testing
- Check service logs: `docker-compose logs [service-name]`
- Verify network connectivity: `docker network ls`


