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
  // Get all stalls
  getAllStalls: async (): Promise<Stall[]> => {
    try {
      const response = await apiClient.get<StallResponse[]>('/api/stalls');
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning empty stalls list');
        return getMockStalls();
      }
      throw error;
    }
  },

  // Get available stalls
  getAvailableStalls: async (): Promise<Stall[]> => {
    try {
      const response = await apiClient.get<StallResponse[]>('/api/stalls/available');
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning empty stalls list');
        return getMockStalls();
      }
      throw error;
    }
  },

  // Get stall by ID
  getStallById: async (id: number): Promise<Stall> => {
    try {
      const response = await apiClient.get<StallResponse>(`/api/stalls/${id}`);
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
      const response = await apiClient.put<StallResponse>(`/api/stalls/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the stall service.');
      }
      throw error;
    }
  },
};

