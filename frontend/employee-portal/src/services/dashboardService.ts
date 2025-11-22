import { apiClient } from './api';
import { DashboardStats, Reservation, Stall } from '../types';
import { 
  generateMockDashboardStats, 
  generateMockReservations, 
  generateMockStalls, 
  generateMockUsers 
} from '../utils/mockData';

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

// Helper to check if error is a network/connection error
const isNetworkError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }
  
  const err = error as { 
    code?: string; 
    message?: string; 
    response?: { status?: number } 
  };
  
  const hasNetworkCode = err.code === 'ERR_NETWORK';
  const hasNetworkMessage = Boolean(err.message?.includes('Network Error'));
  const hasConnectionRefused = Boolean(err.message?.includes('ERR_CONNECTION_REFUSED') || err.message?.includes('ECONNREFUSED'));
  
  return hasNetworkCode || hasNetworkMessage || hasConnectionRefused;
};

// Helper to check if error is a server error that should fallback to mock
const shouldUseMockData = (error: unknown): boolean => {
  if (isNetworkError(error)) {
    return true;
  }
  
  if (!error || typeof error !== 'object') {
    return false;
  }
  
  const err = error as { response?: { status?: number } };
  const status = err.response?.status;
  
  // Only use mock for server errors (500+) or service unavailable (503)
  // Don't use mock for 404 - that indicates wrong endpoint
  if (status === undefined) {
    return false;
  }
  
  return status >= 500;
};

export const dashboardService = {
  // Get dashboard statistics summary from Reservation Service
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      // FIXED: Use correct backend endpoint path
      const summaryResponse = await apiClient.get('/api/admin/reservations/statistics/summary');
      const summary = summaryResponse.data;
      
      // Try to get stall statistics from stall service
      let stallStats = { 
        totalStalls: 0, 
        availableStalls: 0, 
        reservedStalls: 0, 
        occupancyRate: 0 
      };
      
      try {
        // FIXED: Use correct backend endpoint path
        const stallResponse = await apiClient.get('/api/admin/stalls/statistics');
        stallStats = stallResponse.data;
      } catch (stallError) {
        // Silently handle stall statistics errors - service may be unavailable
        // Only log in development mode for debugging
        if (import.meta.env.DEV) {
          const err = stallError as { response?: { status?: number }; message?: string };
          console.warn(
            'Stall statistics unavailable:', 
            err.response?.status || err.message
          );
        }
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
    } catch (error) {
      // Handle network errors or server errors by falling back to mock data
      if (shouldUseMockData(error)) {
        const err = error as { response?: { status?: number }; message?: string };
        if (import.meta.env.DEV) {
          console.warn(
            'Backend unavailable, returning mock dashboard stats', 
            err.response?.status || err.message
          );
        }
        return getMockDashboardStats();
      }
      
      // Re-throw other errors (like 404, 401, 403, etc.)
      throw error;
    }
  },
  
  // Get revenue statistics
  getRevenueStats: async (period?: string): Promise<any> => {
    try {
      const params = period ? { period } : {};
      // FIXED: Use correct backend endpoint path
      const response = await apiClient.get('/api/admin/reservations/statistics/revenue', { params });
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        throw new Error('Backend service unavailable');
      }
      throw error;
    }
  },
  
  // Get booking trends
  getBookingTrends: async (period?: string): Promise<any> => {
    try {
      const params = period ? { period } : {};
      // FIXED: Use correct backend endpoint path
      const response = await apiClient.get('/api/admin/reservations/statistics/trends', { params });
      return response.data;
    } catch (error) {
      if (isNetworkError(error)) {
        throw new Error('Backend service unavailable');
      }
      throw error;
    }
  },
};