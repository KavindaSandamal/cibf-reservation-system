import { apiClient } from './api';
import { Reservation, ReservationResponse, ReservationStatus } from '../types';
import { generateMockReservations, generateMockStalls, generateMockUsers } from '../utils/mockData';

type PaginatedResponse<T> = {
  content?: T[];           // Spring's default format
  reservations?: T[];      // Your custom backend format
  totalElements?: number;
  totalItems?: number;     // Your custom backend format
  totalPages?: number;
  size?: number;
  pageSize?: number;       // Your custom backend format
  number?: number;
  currentPage?: number;    // Your custom backend format
};

type ReservationListResponse = ReservationResponse[] | PaginatedResponse<ReservationResponse>;

const normalizeReservationsResponse = (data: ReservationListResponse): Reservation[] => {
  // Direct array response
  if (Array.isArray(data)) {
    return data as Reservation[];
  }

  // Spring's default Page format (content property)
  if (Array.isArray(data.content)) {
    return data.content as Reservation[];
  }

  // Your custom backend format (reservations property)
  if (Array.isArray(data.reservations)) {
    return data.reservations as Reservation[];
  }

  console.warn('Unexpected reservation response format:', data);
  return [];
};

// Cache mock data for consistency
let cachedMockReservations: Reservation[] | null = null;

const getMockReservations = (): Reservation[] => {
  if (!cachedMockReservations) {
    const mockUsers = generateMockUsers(20);
    const mockStalls = generateMockStalls(30);
    cachedMockReservations = generateMockReservations(mockUsers, mockStalls, 50);
  }
  return cachedMockReservations;
};

export const reservationService = {
  // Get all reservations with filters
  getAllReservations: async (filters?: {
    status?: ReservationStatus | string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Promise<Reservation[]> => {
    try {
      const params: any = {};
      if (filters?.status && filters.status !== 'ALL') params.status = filters.status;
      if (filters?.search) params.search = filters.search;
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;
      if (filters?.page !== undefined) params.page = filters.page;
      if (filters?.size) params.size = filters.size;
      
      // Using /reservations/reservations to match your backend endpoint
      const response = await apiClient.get<ReservationListResponse>('/api/admin/reservations/reservations', { params });
      
      // Debug logging to see what we're getting
      console.log('Reservation API Response:', {
        hasData: !!response.data,
        isArray: Array.isArray(response.data),
        hasReservations: !!(response.data as any)?.reservations,
        hasContent: !!(response.data as any)?.content,
        keys: response.data ? Object.keys(response.data) : []
      });
      
      return normalizeReservationsResponse(response.data);
    } catch (error: any) {
      const isNetworkError =
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('ERR_CONNECTION_REFUSED');
      const isServerError = error.response?.status >= 500;
      const isAuthError = error.response?.status === 401 || error.response?.status === 403;
      
      // For auth errors, don't fall back to mock - let the error propagate so user can see the issue
      if (isAuthError) {
        throw error;
      }
      
      if (isNetworkError || isServerError) {
        console.warn('Reservation service unavailable, returning mock reservations list');
        return getMockReservations();
      }
      throw error;
    }
  },

  // Get reservation by ID
  getReservationById: async (id: number): Promise<Reservation> => {
    try {
      const response = await apiClient.get<ReservationResponse>(`/api/admin/reservations/reservations/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the reservation service.');
      }
      throw error;
    }
  },

  // Confirm a reservation
  confirmReservation: async (id: number): Promise<Reservation> => {
    try {
      const response = await apiClient.put<ReservationResponse>(`/api/admin/reservations/reservations/${id}/confirm`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the reservation service.');
      }
      throw error;
    }
  },

  // Cancel a reservation
  cancelReservation: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/admin/reservations/reservations/${id}`);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the reservation service.');
      }
      throw error;
    }
  },

  // Resend confirmation email
  resendConfirmationEmail: async (id: number): Promise<void> => {
    try {
      await apiClient.post(`/api/admin/reservations/reservations/${id}/resend-email`);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the reservation service.');
      }
      throw error;
    }
  },

  // Get reservations by user ID
  getReservationsByUserId: async (userId: number): Promise<Reservation[]> => {
    try {
      const response = await apiClient.get<ReservationListResponse>(`/api/admin/reservations/reservations/user/${userId}`);
      return normalizeReservationsResponse(response.data);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the reservation service.');
      }
      throw error;
    }
  },

  // Get reservations by status
  getReservationsByStatus: async (status: ReservationStatus): Promise<Reservation[]> => {
    try {
      const response = await apiClient.get<ReservationListResponse>(`/api/admin/reservations/reservations`, {
        params: { status },
      });
      return normalizeReservationsResponse(response.data);
    } catch (error: any) {
      const isNetworkError =
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('ERR_CONNECTION_REFUSED');
      const isServerError = error.response?.status >= 500;
      
      if (isNetworkError || isServerError) {
        console.warn('Reservation service unavailable, returning mock reservations list');
        return getMockReservations();
      }
      throw error;
    }
  },
};