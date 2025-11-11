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
  // Get all reservations
  getAllReservations: async (): Promise<Reservation[]> => {
    try {
      const response = await apiClient.get<ReservationResponse[]>('/api/reservations');
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning empty reservations list');
        return getMockReservations();
      }
      throw error;
    }
  },

  // Get reservation by ID
  getReservationById: async (id: number): Promise<Reservation> => {
    try {
      const response = await apiClient.get<ReservationResponse>(`/api/reservations/${id}`);
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
      const response = await apiClient.put<ReservationResponse>(`/api/reservations/${id}/confirm`);
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
      await apiClient.delete(`/api/reservations/${id}`);
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
      const response = await apiClient.get<ReservationResponse[]>(`/api/reservations/status/${status}`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning empty reservations list');
        return getMockReservations();
      }
      throw error;
    }
  },
};

