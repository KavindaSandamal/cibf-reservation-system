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
  createdAt?: string;
  reservationCount?: number;
  role?: string; // User role: VENDOR, EMPLOYEE, ADMIN
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
  businessName?: string;
  userEmail?: string;
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

// Reservation Response - matches backend ReservationResponse DTO
export interface ReservationResponse {
  id: number;
  userId?: number;
  stallId?: number;
  userEmail?: string;
  businessName?: string;
  status: string; // Backend returns String from ReservationStatus.name()
  totalAmount: number | string; // Backend returns BigDecimal
  notes?: string;
  createdAt: string | Date; // Backend returns LocalDateTime
  confirmedAt?: string | Date; // Backend returns LocalDateTime
  qrCodeUrl?: string;
  stalls?: Array<{
    id: number;
    stallName: string;
    size: string;
    dimension?: string;
    price: number | string;
  }>;
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
// Backend UserResponse DTO - matches com.cibf.dto.UserResponse
export interface UserResponse {
  id: number;
  email: string;
  businessName?: string;
  contactNumber?: string;
  address?: string;
  role?: string;
  createdAt: string | Date; // Backend returns LocalDateTime
}