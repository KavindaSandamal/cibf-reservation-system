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
  // Get dashboard statistics summary from Reservation Service
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      // Try to get summary from reservation service
      const summaryResponse = await apiClient.get('/api/admin/statistics/summary');
      const summary = summaryResponse.data;
      
      // Try to get stall statistics from stall service
      let stallStats = { totalStalls: 0, availableStalls: 0, reservedStalls: 0, occupancyRate: 0 };
      try {
        const stallResponse = await apiClient.get('/api/admin/statistics/stalls');
        stallStats = stallResponse.data;
      } catch (stallError) {
        console.warn('Stall statistics unavailable');
      }
      
      // Combine data into DashboardStats format
      return {
        totalReservations: summary.totalReservations || 0,
        activeReservations: summary.confirmedReservations || 0,
        pendingReservations: summary.pendingReservations || 0,
        cancelledReservations: summary.cancelledReservations || 0,
        stallOccupancyRate: stallStats.occupancyRate || 0,
        totalRevenue: summary.totalRevenue || 0,
        reservationsByStatus: {
          pending: summary.pendingReservations || 0,
          confirmed: summary.confirmedReservations || 0,
          cancelled: summary.cancelledReservations || 0,
        },
        reservationsByDate: summary.reservationsByDate || [],
      };
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning mock dashboard stats');
        return getMockDashboardStats();
      }
      throw error;
    }
  },
  
  // Get revenue statistics
  getRevenueStats: async (period?: string): Promise<any> => {
    try {
      const params = period ? { period } : {};
      const response = await apiClient.get('/api/admin/statistics/revenue', { params });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable');
      }
      throw error;
    }
  },
  
  // Get booking trends
  getBookingTrends: async (period?: string): Promise<any> => {
    try {
      const params = period ? { period } : {};
      const response = await apiClient.get('/api/admin/statistics/trends', { params });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable');
      }
      throw error;
    }
  },
};

