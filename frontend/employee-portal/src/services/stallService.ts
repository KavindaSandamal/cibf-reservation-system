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

type PaginatedResponse<T> = {
  content?: T[];
  stalls?: T[];
  totalElements?: number;
  totalItems?: number;
  totalPages?: number;
  size?: number;
  pageSize?: number;
  number?: number;
  currentPage?: number;
};

type StallListResponse = StallResponse[] | PaginatedResponse<StallResponse>;

const normalizeStallsResponse = (data: StallListResponse): Stall[] => {
  // Direct array response
  if (Array.isArray(data)) {
    return data as Stall[];
  }

  // Spring's default Page format (content property)
  if (Array.isArray(data.content)) {
    return data.content as Stall[];
  }

  // Custom format (stalls property)
  if (Array.isArray(data.stalls)) {
    return data.stalls as Stall[];
  }

  console.warn('Unexpected stalls response format:', data);
  return [];
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
      if (filters?.size) params.stallSize = filters.size;
      
      // Add pagination params
      params.page = 0;
      params.sizePerPage = 100; // Get more stalls for client-side filtering
      
      const response = await apiClient.get<StallListResponse>('/api/admin/stalls', { params });
      
      // Debug logging
      console.log('Stall API Response:', {
        hasData: !!response.data,
        isArray: Array.isArray(response.data),
        hasContent: !!(response.data as any)?.content,
        hasStalls: !!(response.data as any)?.stalls,
        keys: response.data ? Object.keys(response.data) : []
      });
      
      return normalizeStallsResponse(response.data);
    } catch (error: any) {
      // Log error for debugging
      console.error('Error loading stalls:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      // Fall back to mock data for network errors or 404s
      if (error.code === 'ERR_NETWORK' || 
          error.message?.includes('Network Error') || 
          error.message?.includes('ERR_CONNECTION_REFUSED') ||
          error.response?.status === 404) {
        console.warn('Backend unavailable or endpoint not found, returning mock stalls list');
        return getMockStalls();
      }
      throw error;
    }
  },

  // Get available stalls
  getAvailableStalls: async (): Promise<Stall[]> => {
    try {
      const params = {
        status: 'AVAILABLE',
        page: 0,
        sizePerPage: 100
      };
      const response = await apiClient.get<StallListResponse>('/api/admin/stalls', { params });
      return normalizeStallsResponse(response.data);
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
      const response = await apiClient.get<{ stall: StallResponse }>(`/api/admin/stalls/${id}`);
      return response.data.stall || response.data as any;
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
      const response = await apiClient.get('/api/admin/stalls/statistics');
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