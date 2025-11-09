# Quick Start Guide

## 🚀 Running the Application

### Step 1: Install Dependencies (if not done)
```bash
cd frontend/user-portal
npm install
```

### Step 2: Create Environment File
Create a `.env` file in `frontend/user-portal/` with:
```env
VITE_API_URL=http://localhost:80
```

Or use this command:
```bash
echo "VITE_API_URL=http://localhost:80" > .env
```

### Step 3: Start Development Server
```bash
npm run dev
```

The application will start at: **http://localhost:3000**

### Step 4: Access the Application
Open your browser and navigate to:
- **http://localhost:3000**

## 📝 Available Routes

- `/login` - User login page
- `/register` - User registration page
- `/dashboard` - User dashboard
- `/stalls` - Browse and select stalls
- `/book` - Multi-step booking wizard
- `/reservations` - View all reservations
- `/reservations/:id` - Reservation details
- `/qr/:reservationId` - QR code display

## ⚙️ Configuration

### API URL
Update the `VITE_API_URL` in `.env` file to point to your backend:
- Local development: `http://localhost:80`
- Production: Your production API URL

### Port
The default port is **3000**. To change it, modify `vite.config.ts`:
```typescript
server: {
  port: 3000, // Change this to your desired port
}
```

## 🔧 Other Commands

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

## 📋 Prerequisites

- Node.js 18+ installed
- npm or yarn installed
- Backend services running (for full functionality)

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is already in use, Vite will automatically try the next available port.

### API Connection Issues
- Make sure your backend services are running
- Check that the `VITE_API_URL` in `.env` is correct
- Verify CORS is configured on the backend

### Module Not Found Errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### Build Errors
```bash
npm run build
```
Check the error messages in the terminal.

## ✅ Next Steps

1. Make sure backend services are running:
   - Authentication Service (Port 8081)
   - Stall Service (Port 8082)
   - Reservation Service (Port 8083)

2. Test the application:
   - Register/Login
   - Browse stalls
   - Create a reservation
   - View reservations
   - Download QR codes

## 📚 More Information

- See `README.md` for detailed documentation
- See `MEMBER5_IMPLEMENTATION.md` for implementation details


