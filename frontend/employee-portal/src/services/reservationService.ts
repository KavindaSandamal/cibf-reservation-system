import { apiClient } from './api';
import { Reservation, ReservationResponse, ReservationStatus } from '../types';
import { generateMockReservations, generateMockStalls, generateMockUsers } from '../utils/mockData';

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
      if (filters?.page) params.page = filters.page;
      if (filters?.size) params.size = filters.size;
      
      const response = await apiClient.get<ReservationResponse[]>('/api/admin/reservations', { params });
      // Handle paginated response
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.data?.content && Array.isArray(response.data.content)) {
        return response.data.content;
      }
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning mock reservations list');
        return getMockReservations();
      }
      throw error;
    }
  },

  // Get reservation by ID
  getReservationById: async (id: number): Promise<Reservation> => {
    try {
      const response = await apiClient.get<ReservationResponse>(`/api/admin/reservations/${id}`);
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
      const response = await apiClient.put<ReservationResponse>(`/api/admin/reservations/${id}/confirm`);
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
      await apiClient.delete(`/api/admin/reservations/${id}`);
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
      await apiClient.post(`/api/admin/reservations/${id}/resend-email`);
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
      const response = await apiClient.get<ReservationResponse[]>(`/api/admin/reservations/user/${userId}`);
      return response.data;
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
      const response = await apiClient.get<ReservationResponse[]>(`/api/admin/reservations`, {
        params: { status }
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning mock reservations list');
        return getMockReservations();
      }
      throw error;
    }
  },
};

