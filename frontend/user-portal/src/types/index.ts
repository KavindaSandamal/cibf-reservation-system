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

// Reservation Types
export enum ReservationStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export interface Reservation {
  id: number;
  userId: number;
  reservationDate: string;
  status: ReservationStatus;
  qrCodeUrl?: string;
  createdAt: string;
  confirmedAt?: string;
  totalAmount: number;
  stalls: Stall[];
}

export interface ReservationRequest {
  userId: number;
  reservationDate: string;
  stallIds: number[];
}

export interface ReservationResponse {
  id: number;
  userId: number;
  reservationDate: string;
  status: ReservationStatus;
  qrCodeUrl?: string;
  createdAt: string;
  confirmedAt?: string;
  totalAmount: number;
  stalls: Stall[];
}

// API Response Types
export interface ApiError {
  message: string;
  status: number;
  errors?: string[];
}

// User Types (for auth context - basic structure)
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}


