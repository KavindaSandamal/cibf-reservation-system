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
  // Get all users
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await apiClient.get<UserResponse[]>('/api/users');
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning empty users list');
        return getMockUsers();
      }
      throw error;
    }
  },

  // Get user by ID
  getUserById: async (id: number): Promise<User> => {
    try {
      const response = await apiClient.get<UserResponse>(`/api/users/${id}`);
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
      const response = await apiClient.get<{ count: number }>(`/api/users/${userId}/reservations/count`);
      return response.data.count;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning 0');
        return 0;
      }
      throw error;
    }
  },
};

