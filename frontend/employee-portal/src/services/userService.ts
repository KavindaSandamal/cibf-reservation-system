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
      
      const response = await apiClient.get<any>('/api/admin/users', { params });
      
      // Backend returns paginated response: {users: [], currentPage: 0, totalItems: 0, totalPages: 0}
      // Extract the users array from the response
      if (response.data && Array.isArray(response.data.users)) {
        return response.data.users;
      }
      // Fallback: if response is already an array (legacy format)
      if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error: any) {
      // Log detailed error for debugging
      console.error('Error loading users:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning mock users list');
        return getMockUsers();
      }
      
      // For 500 errors, provide more context
      if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           'Internal server error. Check backend logs for database connection issues.';
        console.error('Backend error:', errorMessage);
        throw new Error(errorMessage);
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

