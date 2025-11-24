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
      // Backend UserResponse DTO has: id, email, businessName, contactNumber, address, role, createdAt
      // Frontend User interface expects: id, email, firstName, lastName, businessName, createdAt
      // Map backend response to frontend format
      const mapUserResponse = (userResponse: UserResponse): User => {
        return {
          id: userResponse.id,
          email: userResponse.email || '',
          firstName: '', // Backend doesn't provide firstName
          lastName: '', // Backend doesn't provide lastName
          businessName: userResponse.businessName,
          createdAt: userResponse.createdAt 
            ? (typeof userResponse.createdAt === 'string' 
                ? userResponse.createdAt 
                : new Date(userResponse.createdAt).toISOString())
            : undefined,
          reservationCount: undefined, // Not provided by backend
        };
      };

      // Extract the users array from the response
      if (response.data && Array.isArray(response.data.users)) {
        return response.data.users.map(mapUserResponse);
      }
      // Fallback: if response is already an array (legacy format)
      if (Array.isArray(response.data)) {
        return response.data.map(mapUserResponse);
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
      // Map backend UserResponse to frontend User
      const userResponse = response.data;
      return {
        id: userResponse.id,
        email: userResponse.email || '',
        firstName: '', // Backend doesn't provide firstName
        lastName: '', // Backend doesn't provide lastName
        businessName: userResponse.businessName,
        createdAt: userResponse.createdAt 
          ? (typeof userResponse.createdAt === 'string' 
              ? userResponse.createdAt 
              : new Date(userResponse.createdAt).toISOString())
          : undefined,
        reservationCount: undefined, // Not provided by backend
      };
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

  // ==================== ADMIN ONLY FUNCTIONS ====================
  // Following AdminController.java pattern - Admin only endpoints

  /**
   * Delete a user/vendor account (Admin only)
   * DELETE /api/admin/users/{id}
   * Note: If user is an employee, use deleteEmployee instead
   */
  deleteUser: async (id: number): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/admin/users/${id}`);
      if (response.status >= 400) {
        // Extract error message from response
        const errorData = response.data || {};
        const errorMessage = errorData.message || errorData.error || `Failed to delete user: ${response.status}`;
        
        // Check if it's an employee account error
        if (errorMessage.includes('employee') || errorMessage.includes('Employee')) {
          throw new Error('This is an employee account. Please use the employee deletion option.');
        }
        
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the authentication service.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin role required to delete users.');
      }
      if (error.response?.status === 400) {
        // Bad request - extract message from response
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error(errorMessage);
      }
      if (error.response?.status === 500) {
        // Internal server error - try to extract meaningful message
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 
          'Server error occurred while deleting user. Please check if user has active reservations or database constraints.';
        throw new Error(errorMessage);
      }
      // Re-throw with original message if it's already an Error
      if (error.message) {
        throw error;
      }
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to delete user');
    }
  },

  /**
   * Bulk delete users (Admin only)
   * DELETE /api/admin/users/bulk
   * Body: { "userIds": [1, 2, 3] }
   */
  bulkDeleteUsers: async (userIds: number[]): Promise<{ deleted: number; failed: number; errors: string[] }> => {
    try {
      const response = await apiClient.delete('/api/admin/users/bulk', {
        data: { userIds },
      });
      if (response.status >= 400) {
        const errorMessage = response.data?.message || response.data?.error || `Failed to bulk delete users: ${response.status}`;
        throw new Error(errorMessage);
      }
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the authentication service.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin role required to delete users.');
      }
      throw error;
    }
  },

  /**
   * Create new user/vendor account (Admin only)
   * POST /api/admin/users
   */
  createUser: async (userData: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    businessName?: string;
    contactNumber?: string;
    address?: string;
  }): Promise<any> => {
    try {
      const response = await apiClient.post('/api/admin/users', userData);
      if (response.status >= 400) {
        const errorMessage = response.data?.message || response.data?.error || `Failed to create user: ${response.status}`;
        throw new Error(errorMessage);
      }
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the authentication service.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin role required to create users.');
      }
      throw error;
    }
  },
};

