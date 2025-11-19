# Backend Setup for Employee Portal

## Quick Start

The employee portal frontend needs the backend services to be running. You have two options:

### Option 1: Using Docker Compose (Recommended)

This starts all services including Nginx reverse proxy on port 80:

```bash
# From project root directory
docker-compose up -d

# Check if services are running
docker-compose ps

# View logs
docker-compose logs -f auth-service
```

The frontend will connect to `http://localhost:80` (via Vite proxy).

### Option 2: Direct Service Connection (Development)

If you want to run services individually without Docker:

1. **Start Authentication Service** (port 8081):
   ```bash
   cd services/authentication-service
   ./gradlew bootRun
   ```

2. **Update Vite Config** to point directly to the service:
   - Edit `vite.config.ts`
   - Change proxy target to `http://localhost:8081` for `/api/auth` routes

Or set environment variable:
```bash
# Create .env file in frontend/employee-portal/
VITE_API_URL=http://localhost:8081
```

## Service Ports

- **Nginx (Reverse Proxy)**: Port 80 (routes to all services)
- **Authentication Service**: Port 8081
- **Stall Service**: Port 8082
- **Reservation Service**: Port 8083
- **User Service**: Port 8086

## Troubleshooting

### Error: `ERR_CONNECTION_REFUSED`

This means the backend service is not running. 

**Solution:**
1. Check if services are running:
   ```bash
   # For Docker
   docker-compose ps
   
   # For direct services
   # Check if port 8081 is listening
   netstat -ano | findstr :8081  # Windows
   lsof -i :8081  # Mac/Linux
   ```

2. Start the authentication service:
   ```bash
   # Using Docker
   docker-compose up -d auth-service
   
   # Or directly
   cd services/authentication-service
   ./gradlew bootRun
   ```

3. Verify the service is accessible:
   ```bash
   curl http://localhost:8081/actuator/health
   # Or
   curl http://localhost:80/health
   ```

### Error: CORS Issues

If you see CORS errors, make sure:
1. The backend CORS configuration allows `http://localhost:5174`
2. Or use the Nginx proxy which handles CORS

## Environment Variables

Create a `.env` file in `frontend/employee-portal/`:

```env
# Use nginx proxy (default)
VITE_API_URL=http://localhost:80

# Or connect directly to auth service
# VITE_API_URL=http://localhost:8081
```

## Testing Backend Connection

You can test if the backend is accessible:

```bash
# Test authentication service directly
curl http://localhost:8081/actuator/health

# Test through nginx proxy
curl http://localhost:80/health

# Test registration endpoint (should return 400 without body, but connection should work)
curl -X POST http://localhost:8081/api/auth/employee/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123","name":"Test","employeeId":"EMP-001"}'
```

