import { apiClient } from './api';
import { Reservation, ReservationRequest, ReservationResponse } from '../types';

// Mock data for when backend is unavailable
const getMockReservations = (): Reservation[] => {
  return [];
};

const isBackendAvailable = async (): Promise<boolean> => {
  try {
    await apiClient.get('/health');
    return true;
  } catch {
    return false;
  }
};

export const reservationService = {
  // Create a new reservation
  createReservation: async (data: ReservationRequest): Promise<Reservation> => {
    try {
      const response = await apiClient.post<ReservationResponse>('/api/reservations', data);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the reservation service.');
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
      // If backend is unavailable, try to get from sessionStorage (for mock reservations)
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, checking sessionStorage for reservation');
        const savedReservation = sessionStorage.getItem(`reservation_${id}`);
        if (savedReservation) {
          try {
            const reservation = JSON.parse(savedReservation);
            // Ensure QR code data is available (we'll generate it on frontend)
            return reservation;
          } catch (e) {
            console.error('Error parsing saved reservation:', e);
          }
        }
        throw new Error('Backend service unavailable. Please start the reservation service.');
      }
      throw error;
    }
  },

  // Get all reservations for a user
  getUserReservations: async (userId: number): Promise<Reservation[]> => {
    try {
      const response = await apiClient.get<ReservationResponse[]>(`/api/reservations/user/${userId}`);
      return response.data;
    } catch (error: any) {
      // If backend is unavailable, return empty array instead of throwing error
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning empty reservations list');
        return getMockReservations();
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
};


