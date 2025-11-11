# Test Credentials for Development

## 🔑 Hardcoded Test Credentials

For easy testing and development, the login page now includes pre-filled test credentials:

```
Email: test@example.com
Password: password123
```

## ✨ Features Added

### 1. Pre-filled Login Form
- The login form automatically fills with test credentials in development mode
- You can still edit them if needed

### 2. Quick Login Button
- A green "🚀 Quick Login (Test Account)" button appears in development mode
- Click it to instantly login with test credentials
- Only visible when running in development (`npm run dev`)

### 3. Mock Login Mode
- If the backend is unavailable, the app automatically uses mock login
- Works even without the authentication service running
- Perfect for testing the frontend UI without backend

### 4. Development Mode Indicator
- A blue info box shows the test credentials
- Only visible in development mode

## 🚀 How to Use

### Option 1: Use Pre-filled Credentials
1. Go to `/login`
2. Credentials are already filled in
3. Click "Sign in" button

### Option 2: Quick Login Button
1. Go to `/login`
2. Click the green "🚀 Quick Login (Test Account)" button
3. Instantly logged in!

### Option 3: Manual Entry
1. Go to `/login`
2. Enter: `test@example.com` / `password123`
3. Click "Sign in"

## 🔧 Mock Login (No Backend Required)

If the backend authentication service is not running:

1. The app will automatically detect the network error
2. It will use mock authentication (no API call needed)
3. You'll see: "Mock login successful! (Backend unavailable)"
4. You can still test all frontend features!

## 📝 Notes

- **Development Only**: Test credentials and quick login only work in development mode
- **Production**: These features are automatically disabled in production builds
- **Backend Available**: If backend is running, it will use real authentication
- **Backend Unavailable**: Automatically falls back to mock login for testing

## 🎯 Testing Scenarios

### With Backend Running
1. Start authentication service: `cd services/authentication-service && ./gradlew.bat bootRun`
2. Use test credentials to login
3. Real JWT token from backend

### Without Backend (Mock Mode)
1. Don't start backend service
2. Use test credentials to login
3. Mock token is created (frontend only)
4. Can test all UI features

## 🔒 Security Note

⚠️ **Important**: These test credentials are for **development only**. They are automatically disabled in production builds. Never use these in production!

## 📋 Customizing Test Credentials

To change the test credentials, edit `src/pages/LoginPage.tsx`:

```typescript
const TEST_CREDENTIALS = {
  email: 'your-test-email@example.com',
  password: 'your-test-password',
};
```

And update `src/contexts/AuthContext.tsx` with the same credentials in the `login` function.


