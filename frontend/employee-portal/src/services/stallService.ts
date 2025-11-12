import { apiClient } from './api';
import { Stall, StallResponse, StallSize } from '../types';
import { generateMockStalls } from '../utils/mockData';

// Cache mock data for consistency
let cachedMockStalls: Stall[] | null = null;

const getMockStalls = (): Stall[] => {
  if (!cachedMockStalls) {
    cachedMockStalls = generateMockStalls(30);
  }
  return cachedMockStalls;
};

export const stallService = {
  // Get all stalls with filters
  getAllStalls: async (filters?: {
    status?: string;
    size?: string;
  }): Promise<Stall[]> => {
    try {
      const params: any = {};
      if (filters?.status) params.status = filters.status;
      if (filters?.size) params.size = filters.size;
      
      const response = await apiClient.get<StallResponse[]>('/api/admin/stalls', { params });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning mock stalls list');
        return getMockStalls();
      }
      throw error;
    }
  },

  // Get available stalls
  getAvailableStalls: async (): Promise<Stall[]> => {
    try {
      const response = await apiClient.get<StallResponse[]>('/api/admin/stalls', {
        params: { status: 'AVAILABLE' }
      });
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning mock stalls list');
        return getMockStalls();
      }
      throw error;
    }
  },

  // Get stall by ID
  getStallById: async (id: number): Promise<Stall> => {
    try {
      const response = await apiClient.get<StallResponse>(`/api/admin/stalls/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the stall service.');
      }
      throw error;
    }
  },

  // Get reservation info for a stall
  getStallReservation: async (id: number): Promise<any> => {
    try {
      const response = await apiClient.get(`/api/admin/stalls/${id}/reservation`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the stall service.');
      }
      // If stall is available, it might return 404, which is fine
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  // Get stall statistics
  getStallStatistics: async (): Promise<any> => {
    try {
      const response = await apiClient.get('/api/admin/statistics/stalls');
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the stall service.');
      }
      throw error;
    }
  },

  // Update stall
  updateStall: async (id: number, data: Partial<Stall>): Promise<Stall> => {
    try {
      const response = await apiClient.put<StallResponse>(`/api/admin/stalls/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the stall service.');
      }
      throw error;
    }
  },
};

