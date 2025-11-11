// Employee Types
export interface Employee {
  id: number;
  email: string;
  name: string;
  employeeId: string;
  role: 'EMPLOYEE' | 'ADMIN';
}

// User Types (for employee portal)
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  createdAt: string;
  reservationCount?: number;
}

// Reservation Types
export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export interface Reservation {
  id: number;
  userId: number;
  user?: User;
  reservationDate: string;
  status: ReservationStatus;
  qrCodeUrl?: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  totalAmount: number;
  stalls: Stall[];
}

// Stall Types
export enum StallSize {
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
}

export interface Stall {
  id: number;
  stallNumber: string;
  stallName: string;
  size: StallSize;
  location: string;
  description?: string;
  isAvailable: boolean;
  price: number;
}

// Auth Types
export interface AuthContextType {
  employee: Employee | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export interface LoginData {
  email: string;
  password: string;
}

// API Response Types
export interface ApiError {
  message: string;
  status: number;
  errors?: string[];
}

// Dashboard Statistics
export interface DashboardStats {
  totalReservations: number;
  activeReservations: number;
  pendingReservations: number;
  cancelledReservations: number;
  stallOccupancyRate: number;
  totalRevenue: number;
  reservationsByStatus: {
    pending: number;
    confirmed: number;
    cancelled: number;
  };
  reservationsByDate: {
    date: string;
    count: number;
  }[];
}

// Reservation Response
export interface ReservationResponse {
  id: number;
  userId: number;
  reservationDate: string;
  status: ReservationStatus;
  qrCodeUrl?: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  totalAmount: number;
  stalls: Stall[];
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    businessName?: string;
  };
}

// Stall Response
export interface StallResponse {
  id: number;
  stallNumber: string;
  stallName: string;
  size: StallSize;
  location: string;
  description?: string;
  isAvailable: boolean;
  price: number;
}

// User Response
export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  businessName?: string;
  createdAt: string;
}

