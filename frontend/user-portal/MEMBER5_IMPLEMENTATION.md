# Member 5 Implementation - Stall Reservation & Booking Flow

## Overview

This document outlines the implementation of Member 5's part of the CIBF Reservation System - the User Portal's stall reservation and booking flow.

## Implementation Summary

### Week 1-2: Interactive Stall Map ✅

**Completed Features:**
- Interactive stall map component (`StallMap.tsx`)
- Grid-based visualization of stalls
- Color coding:
  - Green: Available stalls
  - Blue: Selected stalls
  - Red: Reserved stalls
- Click/tap to select stalls
- Enforce 3-stall selection limit
- Selected count indicator
- Filters and search:
  - Filter by size (Small/Medium/Large)
  - Filter by availability
  - Search by stall number/name
- Fully responsive design (mobile, tablet, desktop)
- Loading states and error handling

### Week 2-3: Reservation Booking Flow ✅

**Completed Features:**
- Multi-step booking wizard (`BookPage.tsx`):
  1. **Step 1: Select Stalls** - Interactive stall map
  2. **Step 2: Review Selection** - Summary with prices and date selection
  3. **Step 3: Confirm Details** - Final confirmation with terms
  4. **Step 4: Success** - Confirmation message
- Progress indicator showing current step
- Form validation
- Integration with Reservation Service API
- Error handling and user feedback
- Smooth transitions using Framer Motion

### Week 3-4: Reservation Management & QR Display ✅

**Completed Features:**
- Enhanced "My Reservations" page (`ReservationsPage.tsx`):
  - List all user reservations
  - Filter by status (All, Pending, Confirmed, Cancelled)
  - Display reservation cards with key information
  - Quick actions (View Details, View QR, Cancel)
  
- Reservation Details page (`ReservationDetailsPage.tsx`):
  - Full reservation information
  - List of reserved stalls with details
  - QR code display (large view)
  - Download QR code button
  - Cancel reservation functionality
  
- QR Code page (`QRCodePage.tsx`):
  - Full-screen QR code display
  - Download QR as PNG file
  - Print QR functionality
  - Reservation information display

### Week 4: Polish & Integration ✅

**Completed Features:**
- Comprehensive error handling
- Loading states for all API calls
- Empty states (no reservations, no stalls)
- Toast notifications for user feedback
- Responsive design across all pages
- Routing integration with React Router
- Protected routes with authentication
- Layout component with navigation
- Dashboard page with statistics

## File Structure

```
frontend/user-portal/
├── src/
│   ├── components/
│   │   ├── Layout.tsx              # Main layout with header/nav
│   │   ├── ProtectedRoute.tsx      # Route protection
│   │   └── StallMap.tsx            # Interactive stall map ⭐
│   ├── pages/
│   │   ├── StallsPage.tsx          # Browse stalls page
│   │   ├── BookPage.tsx            # Multi-step booking wizard ⭐
│   │   ├── ReservationsPage.tsx    # My reservations list ⭐
│   │   ├── ReservationDetailsPage.tsx  # Reservation details ⭐
│   │   ├── QRCodePage.tsx          # QR code display ⭐
│   │   ├── DashboardPage.tsx       # User dashboard
│   │   ├── LoginPage.tsx           # Login page
│   │   └── RegisterPage.tsx        # Registration page
│   ├── services/
│   │   ├── api.ts                  # Axios configuration
│   │   ├── stallService.ts         # Stall API calls
│   │   └── reservationService.ts   # Reservation API calls
│   ├── types/
│   │   └── index.ts                # TypeScript type definitions
│   ├── contexts/
│   │   └── AuthContext.tsx         # Authentication context
│   ├── App.tsx                     # Main app component
│   └── main.tsx                    # Entry point
```

⭐ = Core Member 5 implementation

## Key Components

### 1. StallMap Component

**Location:** `src/components/StallMap.tsx`

**Features:**
- Fetches stalls from `/api/stalls/available`
- Renders stalls in a responsive grid
- Handles stall selection with 3-stall limit
- Provides filters and search functionality
- Visual feedback for hover and selection states
- Legend for color coding

**Props:**
- `onStallsSelect`: Callback when stalls are selected
- `selectedStallIds`: Array of selected stall IDs
- `maxSelection`: Maximum number of stalls (default: 3)

### 2. BookPage Component

**Location:** `src/pages/BookPage.tsx`

**Features:**
- Multi-step wizard with progress indicator
- Step 1: Stall selection using StallMap
- Step 2: Review selection with price calculation
- Step 3: Confirm details with terms acceptance
- Step 4: Success confirmation
- Smooth animations between steps
- Form validation
- API integration for reservation creation

### 3. ReservationsPage Component

**Location:** `src/pages/ReservationsPage.tsx`

**Features:**
- Displays all user reservations
- Filter by status (All, Pending, Confirmed, Cancelled)
- Reservation cards with key information
- Quick actions (View Details, View QR, Cancel)
- Empty state when no reservations
- Loading states

### 4. ReservationDetailsPage Component

**Location:** `src/pages/ReservationDetailsPage.tsx`

**Features:**
- Full reservation details
- List of reserved stalls
- QR code display
- Download QR code functionality
- Cancel reservation with confirmation
- Status badges
- Loading and error states

### 5. QRCodePage Component

**Location:** `src/pages/QRCodePage.tsx`

**Features:**
- Full-screen QR code display
- Download QR code as PNG
- Print QR code functionality
- Reservation information
- Navigation to reservation details

## API Integration

### Stall Service Endpoints
- `GET /api/stalls` - Get all stalls
- `GET /api/stalls/available` - Get available stalls
- `GET /api/stalls/{id}` - Get stall by ID
- `GET /api/stalls/size/{size}` - Get stalls by size

### Reservation Service Endpoints
- `POST /api/reservations` - Create reservation
- `GET /api/reservations/{id}` - Get reservation by ID
- `GET /api/reservations/user/{userId}` - Get user's reservations
- `PUT /api/reservations/{id}/confirm` - Confirm reservation
- `DELETE /api/reservations/{id}` - Cancel reservation

## Key Features Delivered

✅ Interactive stall map with selection
✅ 3-stall selection limit enforcement
✅ Filter and search functionality
✅ Multi-step booking wizard (4 steps)
✅ Reservation creation
✅ Reservation listing with filters
✅ Reservation details view
✅ QR code display and download
✅ Reservation cancellation
✅ Responsive design
✅ Error handling
✅ Loading states
✅ Toast notifications
✅ Protected routes
✅ JWT token management

## Technical Decisions

1. **State Management**: Used React Context API for authentication state
2. **Styling**: Tailwind CSS for responsive, utility-first styling
3. **Animations**: Framer Motion for smooth page transitions
4. **Notifications**: React Toastify for user feedback
5. **API Client**: Axios with interceptors for JWT token management
6. **Routing**: React Router v6 with protected routes
7. **Type Safety**: Full TypeScript implementation

## Testing Considerations

The implementation includes:
- Error handling for API failures
- Loading states for async operations
- Form validation
- User feedback via toast notifications
- Empty states for better UX

## Future Enhancements

Potential improvements:
- Real-time stall availability updates (WebSockets)
- Reservation modification
- Advanced filtering and sorting
- Export reservations to PDF
- Multi-language support
- Accessibility improvements (ARIA labels)
- Unit tests and integration tests

## Dependencies

- react: ^18.2.0
- react-dom: ^18.2.0
- react-router-dom: ^6.20.0
- axios: ^1.6.2
- react-toastify: ^9.1.3
- framer-motion: ^10.16.16
- tailwindcss: ^3.3.6
- typescript: ^5.2.2
- vite: ^5.0.8

## Setup Instructions

1. Navigate to `frontend/user-portal`
2. Install dependencies: `npm install`
3. Create `.env` file with `VITE_API_URL=http://localhost:80`
4. Run development server: `npm run dev`
5. Build for production: `npm run build`

## Notes

- The implementation assumes Member 4 has set up the basic authentication flow
- The app uses JWT tokens stored in localStorage
- Selected stalls are temporarily stored in sessionStorage when navigating from stalls page to booking page
- All API calls include authentication headers automatically via Axios interceptors


