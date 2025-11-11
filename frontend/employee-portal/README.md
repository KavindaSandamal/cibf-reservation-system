# CIBF Employee Portal

Employee portal for managing reservations, users, and stalls in the CIBF Reservation System.

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

Dependencies are already installed. If you need to reinstall:

```bash
npm install
```

### Running the Development Server

To start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Test Credentials

For development/testing, you can use these hardcoded credentials:

- **Email**: `employee@cibf.com`
- **Password**: `password123`

Or click the "Quick Login (Test Account)" button on the login page (only visible in development mode).

### Available Routes

- `/employee/login` - Employee login page
- `/employee/dashboard` - Employee dashboard (protected)
- `/employee/reservations` - Reservations management (protected)
- `/employee/users` - Users management (protected)
- `/employee/stalls` - Stalls overview (protected)

### Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/       # Reusable React components
│   ├── Layout.tsx    # Main layout with navigation
│   └── ProtectedRoute.tsx  # Route protection
├── contexts/         # React contexts
│   └── EmployeeAuthContext.tsx  # Authentication context
├── pages/            # Page components
│   ├── EmployeeLoginPage.tsx
│   ├── EmployeeDashboardPage.tsx
│   ├── ReservationsManagementPage.tsx
│   ├── UsersManagementPage.tsx
│   └── StallsOverviewPage.tsx
├── services/         # API service functions
│   ├── api.ts        # Axios configuration
│   ├── authService.ts
│   ├── dashboardService.ts
│   ├── reservationService.ts
│   ├── stallService.ts
│   └── userService.ts
├── types/            # TypeScript type definitions
│   └── index.ts
└── utils/            # Utility functions
```

## Environment Variables

Create a `.env` file in the root directory (optional):

```env
VITE_API_URL=http://localhost:80
VITE_MOCK_AUTH=true
```

- `VITE_API_URL`: Backend API base URL (defaults to `http://localhost:80`)
- `VITE_MOCK_AUTH`: Enable mock authentication for frontend-only development (defaults to `true` in dev mode)

## Development Notes

- The application uses **mock authentication** by default in development mode
- Backend connection is optional - the app will gracefully fall back to mock data if the backend is unavailable
- All API services include error handling for network failures

## Next Steps

1. Implement the Employee Dashboard with statistics and charts
2. Complete the Reservations Management page with data table
3. Implement Users Management page
4. Complete Stalls Overview page
5. Add navigation and layout improvements

