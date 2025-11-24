import { apiClient } from './api';
import { Reservation, ReservationResponse, ReservationStatus } from '../types';
import { generateMockReservations, generateMockStalls, generateMockUsers } from '../utils/mockData';

type PaginatedResponse<T> = {
  content?: T[];           // Spring's default format
  reservations?: T[];      // Your custom backend format
  totalElements?: number;
  totalItems?: number;     // Your custom backend format
  totalPages?: number;
  size?: number;
  pageSize?: number;       // Your custom backend format
  number?: number;
  currentPage?: number;    // Your custom backend format
};

type ReservationListResponse = ReservationResponse[] | PaginatedResponse<ReservationResponse>;

// Helper function to safely convert date to ISO string
const convertToISOString = (dateValue: string | Date | undefined | null): string => {
  if (!dateValue) return '';
  
  try {
    if (typeof dateValue === 'string') {
      // If it's already a valid ISO string, return it
      if (dateValue.includes('T') || dateValue.includes('Z') || /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      // Try parsing as-is
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      return '';
    } else if (dateValue instanceof Date) {
      if (!isNaN(dateValue.getTime())) {
        return dateValue.toISOString();
      }
      return '';
    }
    return '';
  } catch (e) {
    console.warn('Error converting date:', dateValue, e);
    return '';
  }
};

// Map backend ReservationResponse to frontend Reservation
const mapReservationToFrontend = (response: ReservationResponse): Reservation => {
  // Convert createdAt to ISO string for both reservationDate and createdAt
  const createdAtISO = convertToISOString(response.createdAt);
  const confirmedAtISO = response.confirmedAt ? convertToISOString(response.confirmedAt) : undefined;
  
  return {
    id: response.id,
    userId: response.userId || 0,
    user: response.user, // May not be populated
    reservationDate: createdAtISO, // Use createdAt as reservationDate since backend doesn't have reservationDate
    status: (response.status as any) || 'PENDING',
    qrCodeUrl: response.qrCodeUrl,
    createdAt: createdAtISO,
    confirmedAt: confirmedAtISO,
    totalAmount: typeof response.totalAmount === 'number' 
      ? response.totalAmount 
      : (typeof response.totalAmount === 'string' ? parseFloat(response.totalAmount) || 0 : 0),
    stalls: (response.stalls || []).map(stall => ({
      id: stall.id,
      stallNumber: stall.stallName || `Stall ${stall.id}`, // Backend returns stallName, not stallNumber
      stallName: stall.stallName || `Stall ${stall.id}`,
      size: (stall.size as any) || 'MEDIUM',
      location: '', // Not provided by backend
      description: stall.dimension || '',
      isAvailable: false, // Not provided by backend
      price: typeof stall.price === 'number' 
        ? stall.price 
        : (typeof stall.price === 'string' ? parseFloat(stall.price) || 0 : 0),
    })),
  };
};

const normalizeReservationsResponse = (data: ReservationListResponse): Reservation[] => {
  // Direct array response
  if (Array.isArray(data)) {
    return data.map(mapReservationToFrontend);
  }

  // Spring's default Page format (content property)
  if (Array.isArray(data.content)) {
    return data.content.map(mapReservationToFrontend);
  }

  // Your custom backend format (reservations property)
  if (Array.isArray(data.reservations)) {
    return data.reservations.map(mapReservationToFrontend);
  }

  console.warn('Unexpected reservation response format:', data);
  return [];
};

// Cache mock data for consistency
let cachedMockReservations: Reservation[] | null = null;

const getMockReservations = (): Reservation[] => {
  if (!cachedMockReservations) {
    const mockUsers = generateMockUsers(20);
    const mockStalls = generateMockStalls(30);
    cachedMockReservations = generateMockReservations(mockUsers, mockStalls, 50);
  }
  return cachedMockReservations;
};

export const reservationService = {
  // Get all reservations with filters
  // Backend: ReservationAdminController.getAllReservations() 
  // GET /api/admin/reservations?page=0&size=20&status=CONFIRMED&search=ABC&startDate=...&endDate=...
  getAllReservations: async (filters?: {
    status?: ReservationStatus | string;
    search?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }): Promise<{
    reservations: Reservation[];
    pagination?: {
      currentPage: number;
      totalItems: number;
      totalPages: number;
      pageSize: number;
    };
  }> => {
    try {
      const params: any = {};
      
      // Backend expects page to be 0-based (default 0), frontend uses 1-based
      params.page = filters?.page !== undefined ? filters.page - 1 : 0;
      params.size = filters?.size || 10; // Match frontend default itemsPerPage
      
      // Backend filters
      if (filters?.status && filters.status !== 'ALL' && filters.status !== '') {
        params.status = String(filters.status).toUpperCase();
      }
      
      // Backend searches userEmail and businessName (case-insensitive)
      // Important: Send search parameter even if empty string to ensure backend receives it
      if (filters?.search !== undefined) {
        const trimmedSearch = filters.search.trim();
        if (trimmedSearch !== '') {
          params.search = trimmedSearch;
        }
        // If search is empty string, don't send it (backend will ignore null/undefined)
      }
      
      // Backend expects ISO_DATE_TIME format for dates (e.g., "2024-01-15T00:00:00")
      // Date input gives us YYYY-MM-DD format
      if (filters?.startDate) {
        const dateStr = filters.startDate.trim();
        if (dateStr) {
          // If already in ISO format, use as-is; otherwise convert YYYY-MM-DD to ISO_DATE_TIME
          if (dateStr.includes('T')) {
            // Already has time component, but ensure it's in correct format
            const parts = dateStr.split('T');
            if (parts.length === 2 && !parts[1].includes(':')) {
              // Has T but no time, add time
              params.startDate = `${parts[0]}T00:00:00`;
            } else {
              // Already has time, use as-is but remove timezone if present
              params.startDate = dateStr.split('.')[0].replace('Z', '').replace(/[+-]\d{2}:\d{2}$/, '');
            }
          } else {
            // YYYY-MM-DD format, add time
            params.startDate = `${dateStr}T00:00:00`;
          }
        }
      }
      
      if (filters?.endDate) {
        const dateStr = filters.endDate.trim();
        if (dateStr) {
          // If already in ISO format, use as-is; otherwise convert YYYY-MM-DD to ISO_DATE_TIME with end of day
          if (dateStr.includes('T')) {
            // Already has time component
            const parts = dateStr.split('T');
            if (parts.length === 2 && !parts[1].includes(':')) {
              // Has T but no time, add end of day time
              params.endDate = `${parts[0]}T23:59:59`;
            } else {
              // Already has time, use date part and set to end of day
              const datePart = parts[0];
              params.endDate = `${datePart}T23:59:59`;
            }
          } else {
            // YYYY-MM-DD format, add end of day time
            params.endDate = `${dateStr}T23:59:59`;
          }
        }
      }
      
      // Remove undefined/null/empty values to clean up params
      const cleanParams: any = {};
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null && value !== '') {
          cleanParams[key] = value;
        }
      });
      
      // Backend endpoint: 
      // Controller: @RequestMapping("/api/admin/reservations")
      // Method: @GetMapping("/reservations")
      // Full path: /api/admin/reservations/reservations
      // Backend returns: { reservations: [...], currentPage: 0, totalItems: 25, totalPages: 3, pageSize: 10 }
      const response = await apiClient.get<PaginatedResponse<ReservationResponse>>('/api/admin/reservations/reservations', { params: cleanParams });
      
      // Check if response status indicates an error
      if (response.status >= 400) {
        if (response.status === 403 || response.status === 404) {
          return { reservations: [], pagination: undefined };
        }
        const errorData = response.data as any;
        const errorMessage = errorData?.message || errorData?.error || `Failed to fetch reservations: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      // Backend returns paginated response with reservations array and pagination metadata
      const data = response.data || response;
      
      // Debug logging to see what we're getting
      if (import.meta.env.DEV) {
        console.log('Reservation API Request:', {
          url: '/api/admin/reservations/reservations',
          params: cleanParams,
          searchParam: cleanParams.search,
          statusParam: cleanParams.status,
          startDateParam: cleanParams.startDate,
          endDateParam: cleanParams.endDate,
          pageParam: cleanParams.page,
          sizeParam: cleanParams.size
        });
        console.log('Reservation API Response:', {
          hasData: !!data,
          isArray: Array.isArray(data),
          hasReservations: !!(data as any)?.reservations,
          hasContent: !!(data as any)?.content,
          keys: data ? Object.keys(data) : [],
          reservationsCount: Array.isArray((data as any)?.reservations) ? (data as any).reservations.length : 0,
          currentPage: (data as any)?.currentPage,
          totalItems: (data as any)?.totalItems,
          totalPages: (data as any)?.totalPages
        });
      }
      
      // Extract reservations array
      const reservationsArray = normalizeReservationsResponse(data);
      
      // Extract pagination info (backend returns 0-based currentPage, convert to 1-based for frontend)
      const pagination = data && typeof data === 'object' && !Array.isArray(data) ? {
        currentPage: typeof (data as any).currentPage === 'number' ? (data as any).currentPage + 1 : 1, // Convert 0-based to 1-based
        totalItems: typeof (data as any).totalItems === 'number' ? (data as any).totalItems : (typeof (data as any).totalItems === 'string' ? parseInt((data as any).totalItems, 10) : 0),
        totalPages: typeof (data as any).totalPages === 'number' ? (data as any).totalPages : (typeof (data as any).totalPages === 'string' ? parseInt((data as any).totalPages, 10) : 0),
        pageSize: typeof (data as any).pageSize === 'number' ? (data as any).pageSize : (typeof (data as any).pageSize === 'string' ? parseInt((data as any).pageSize, 10) : itemsPerPage),
      } : undefined;
      
      return {
        reservations: reservationsArray,
        pagination
      };
    } catch (error: any) {
      const isNetworkError =
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('ERR_CONNECTION_REFUSED');
      const isServerError = error.response?.status >= 500;
      const isAuthError = error.response?.status === 401 || error.response?.status === 403;
      
      // For auth errors, don't fall back to mock - let the error propagate so user can see the issue
      if (isAuthError) {
        throw error;
      }
      
      if (isNetworkError || isServerError) {
        console.warn('Reservation service unavailable, returning mock reservations list');
        return getMockReservations();
      }
      throw error;
    }
  },

  // Get reservation by ID
  getReservationById: async (id: number): Promise<Reservation> => {
    try {
      const response = await apiClient.get<ReservationResponse>(`/api/admin/reservations/reservations/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the reservation service.');
      }
      throw error;
    }
  },

  // Confirm a reservation
  confirmReservation: async (id: number): Promise<Reservation> => {
    try {
      const response = await apiClient.put<ReservationResponse>(`/api/admin/reservations/reservations/${id}/confirm`);
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the reservation service.');
      }
      throw error;
    }
  },

  // Cancel a reservation
  cancelReservation: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/api/admin/reservations/reservations/${id}`);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the reservation service.');
      }
      throw error;
    }
  },

  // Resend confirmation email
  resendConfirmationEmail: async (id: number): Promise<void> => {
    try {
      await apiClient.post(`/api/admin/reservations/reservations/${id}/resend-email`);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the reservation service.');
      }
      throw error;
    }
  },

  // Get reservations by user ID
  getReservationsByUserId: async (userId: number): Promise<Reservation[]> => {
    try {
      const response = await apiClient.get<ReservationListResponse>(`/api/admin/reservations/reservations/user/${userId}`);
      return normalizeReservationsResponse(response.data);
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the reservation service.');
      }
      throw error;
    }
  },

  // Get reservations by status
  getReservationsByStatus: async (status: ReservationStatus): Promise<Reservation[]> => {
    try {
      const response = await apiClient.get<ReservationListResponse>(`/api/admin/reservations/reservations`, {
        params: { status },
      });
      return normalizeReservationsResponse(response.data);
    } catch (error: any) {
      const isNetworkError =
        error.code === 'ERR_NETWORK' ||
        error.message?.includes('Network Error') ||
        error.message?.includes('ERR_CONNECTION_REFUSED');
      const isServerError = error.response?.status >= 500;
      
      if (isNetworkError || isServerError) {
        console.warn('Reservation service unavailable, returning mock reservations list');
        return getMockReservations();
      }
      throw error;
    }
  },
};