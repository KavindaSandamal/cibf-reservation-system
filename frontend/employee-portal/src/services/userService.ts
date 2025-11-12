import { apiClient } from './api';
import { User, UserResponse } from '../types';
import { generateMockUsers } from '../utils/mockData';

// Cache mock data for consistency
let cachedMockUsers: User[] | null = null;

const getMockUsers = (): User[] => {
  if (!cachedMockUsers) {
    cachedMockUsers = generateMockUsers(20);
  }
  return cachedMockUsers;
};

export const userService = {
  // Get all users with search
  getAllUsers: async (search?: string): Promise<User[]> => {
    try {
      const params: any = {};
      if (search) params.search = search;
      
      const response = await apiClient.get<UserResponse[]>('/api/admin/users', { params });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning mock users list');
        return getMockUsers();
      }
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (id: number): Promise<User> => {
    try {
      const response = await apiClient.get<UserResponse>(`/api/admin/users/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the authentication service.');
      }
      throw error;
    }
  },

  // Get user profile details
  getUserProfile: async (id: number): Promise<any> => {
    try {
      const response = await apiClient.get(`/api/admin/users/${id}/profile`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the user service.');
      }
      throw error;
    }
  },

  // Get user's genres
  getUserGenres: async (id: number): Promise<any[]> => {
    try {
      const response = await apiClient.get(`/api/admin/users/${id}/genres`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the user service.');
      }
      throw error;
    }
  },

  // Get genre statistics
  getGenreStatistics: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/api/admin/statistics/genres');
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the user service.');
      }
      throw error;
    }
  },

  // Get user's reservations count
  getUserReservationCount: async (userId: number): Promise<number> => {
    try {
      // Try to get from reservation service
      const { reservationService } = await import('./reservationService');
      const reservations = await reservationService.getReservationsByUserId(userId);
      return reservations.length;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning 0');
        return 0;
      }
      throw error;
    }
  },
};

