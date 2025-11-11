import { apiClient } from './api';
import { DashboardStats, Reservation, Stall } from '../types';
import { generateMockDashboardStats, generateMockReservations, generateMockStalls, generateMockUsers } from '../utils/mockData';

// Cache mock data for consistency
let cachedMockReservations: Reservation[] | null = null;
let cachedMockStalls: Stall[] | null = null;

const getMockDashboardStats = (): DashboardStats => {
  // Generate mock data if not cached
  if (!cachedMockStalls) {
    cachedMockStalls = generateMockStalls(30);
  }
  if (!cachedMockReservations) {
    const mockUsers = generateMockUsers(20);
    cachedMockReservations = generateMockReservations(mockUsers, cachedMockStalls, 50);
  }
  return generateMockDashboardStats(cachedMockReservations, cachedMockStalls);
};

export const dashboardService = {
  // Get dashboard statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const response = await apiClient.get<DashboardStats>('/api/dashboard/stats');
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning mock dashboard stats');
        return getMockDashboardStats();
      }
      throw error;
    }
  },
};

