import { apiClient } from './api';
import { Stall, StallSize, StallResponse } from '../types';

// Mock data for when backend is unavailable
const getMockStalls = (): Stall[] => {
  return [];
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

  // Get available stalls only
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

  // Get stalls by size
  getStallsBySize: async (size: StallSize): Promise<Stall[]> => {
    try {
      const response = await apiClient.get<StallResponse[]>(`/api/stalls/size/${size}`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.warn('Backend unavailable, returning empty stalls list');
        return getMockStalls();
      }
      throw error;
      }
  },
};


