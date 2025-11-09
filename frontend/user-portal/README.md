# CIBF User Portal

Frontend application for the Colombo International Bookfair Reservation System - User Portal.

## Features

### Member 5 Implementation - Stall Reservation & Booking Flow

- **Interactive Stall Map**: Browse and select stalls with visual representation
  - Filter by size (Small, Medium, Large)
  - Search by stall number or name
  - Visual indicators for availability (green), selected (blue), reserved (red)
  - Enforce 3-stall selection limit
  - Real-time selection feedback

- **Multi-Step Booking Wizard**:
  - Step 1: Select Stalls (interactive map)
  - Step 2: Review Selection (summary with prices)
  - Step 3: Confirm Details (user info, date selection)
  - Step 4: Success Confirmation

- **Reservation Management**:
  - View all reservations with filtering by status
  - View detailed reservation information
  - Cancel reservations
  - View and download QR codes

- **QR Code Functionality**:
  - Display QR codes for confirmed reservations
  - Download QR code as PNG
  - Print QR code
  - Full-screen QR code view

## Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling
- **React Router v6** for routing
- **Tailwind CSS** for styling
- **Axios** for API calls
- **Framer Motion** for animations
- **React Toastify** for notifications

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend services running (or configured API URL)

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend/user-portal
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

4. Update `.env` with your API URL:
```env
VITE_API_URL=http://localhost:80
```

### Development

Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
frontend/user-portal/
├── src/
│   ├── components/          # Reusable components
│   │   ├── Layout.tsx       # Main layout with header/nav
│   │   ├── ProtectedRoute.tsx  # Route protection
│   │   └── StallMap.tsx     # Interactive stall map
│   ├── pages/               # Page components
│   │   ├── StallsPage.tsx   # Browse stalls
│   │   ├── BookPage.tsx     # Multi-step booking wizard
│   │   ├── ReservationsPage.tsx  # List of reservations
│   │   ├── ReservationDetailsPage.tsx  # Reservation details
│   │   ├── QRCodePage.tsx   # QR code display
│   │   ├── DashboardPage.tsx  # User dashboard
│   │   ├── LoginPage.tsx    # Login page
│   │   └── RegisterPage.tsx # Registration page
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication context
│   ├── services/            # API services
│   │   ├── api.ts           # Axios configuration
│   │   ├── stallService.ts  # Stall API calls
│   │   └── reservationService.ts  # Reservation API calls
│   ├── types/               # TypeScript types
│   │   └── index.ts         # Type definitions
│   ├── utils/               # Utility functions
│   ├── hooks/               # Custom React hooks
│   ├── App.tsx              # Main app component
│   └── main.tsx             # Entry point
├── public/                  # Static assets
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Key Routes

- `/login` - User login
- `/register` - User registration
- `/dashboard` - User dashboard
- `/stalls` - Browse and select stalls
- `/book` - Multi-step booking wizard
- `/reservations` - List of user's reservations
- `/reservations/:id` - Reservation details
- `/qr/:reservationId` - QR code display

## API Integration

The application integrates with the following backend services:

### Stall Service
- `GET /api/stalls` - Get all stalls
- `GET /api/stalls/available` - Get available stalls
- `GET /api/stalls/{id}` - Get stall by ID
- `GET /api/stalls/size/{size}` - Get stalls by size

### Reservation Service
- `POST /api/reservations` - Create reservation
- `GET /api/reservations/{id}` - Get reservation by ID
- `GET /api/reservations/user/{userId}` - Get user's reservations
- `PUT /api/reservations/{id}/confirm` - Confirm reservation
- `DELETE /api/reservations/{id}` - Cancel reservation

### Authentication Service
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

## Features Implemented

✅ Interactive stall map with selection
✅ 3-stall selection limit enforcement
✅ Filter and search functionality
✅ Multi-step booking wizard
✅ Reservation creation
✅ Reservation listing with filters
✅ Reservation details view
✅ QR code display and download
✅ Reservation cancellation
✅ Responsive design (mobile, tablet, desktop)
✅ Error handling and loading states
✅ Toast notifications
✅ Protected routes
✅ JWT token management

## Environment Variables

- `VITE_API_URL` - Backend API URL (default: `http://localhost:80`)

## Development Notes

- The app uses JWT tokens stored in localStorage for authentication
- API calls are automatically intercepted to include the auth token
- Unauthorized responses (401) automatically redirect to login
- Selected stalls are temporarily stored in sessionStorage when navigating from stalls page to booking page

## Future Enhancements

- Real-time stall availability updates
- Email notification preferences
- Reservation modification
- Advanced filtering and sorting
- Export reservations to PDF
- Multi-language support

## Contributing

This is Member 5's contribution to the CIBF Reservation System project. For questions or issues, please contact the development team.


