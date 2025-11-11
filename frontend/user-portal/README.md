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

```bash
cd frontend/user-portal
npm install
cp .env.example .env
