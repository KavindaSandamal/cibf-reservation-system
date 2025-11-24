import { apiClient } from './api';

/**
 * Employee Management Service
 * Admin-only functions following AdminController.java pattern
 */
export const employeeService = {
  /**
   * Create new employee account (Admin only)
   * POST /api/admin/employees
   */
  createEmployee: async (employeeData: {
    username: string;
    email: string;
    password: string;
    name: string;
    employeeId: string;
    contactNumber?: string;
    department?: string;
  }): Promise<any> => {
    try {
      const response = await apiClient.post('/api/admin/employees', employeeData);
      if (response.status >= 400) {
        const errorMessage = response.data?.message || response.data?.error || `Failed to create employee: ${response.status}`;
        throw new Error(errorMessage);
      }
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the authentication service.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin role required to create employees.');
      }
      throw error;
    }
  },

  /**
   * Delete an employee account (Admin only)
   * DELETE /api/admin/employees/{id}
   */
  deleteEmployee: async (id: number): Promise<void> => {
    try {
      const response = await apiClient.delete(`/api/admin/employees/${id}`);
      if (response.status >= 400) {
        // Extract error message from response
        const errorData = response.data || {};
        const errorMessage = errorData.message || errorData.error || `Failed to delete employee: ${response.status}`;
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the authentication service.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin role required to delete employees.');
      }
      if (error.response?.status === 400) {
        // Bad request - extract message from response
        const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message;
        throw new Error(errorMessage);
      }
      if (error.response?.status === 500) {
        // Internal server error - try to extract meaningful message
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 
          'Server error occurred while deleting employee. Please check if employee is the last admin or has database constraints.';
        throw new Error(errorMessage);
      }
      // Re-throw with original message if it's already an Error
      if (error.message) {
        throw error;
      }
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Failed to delete employee');
    }
  },

  /**
   * Get admin settings (Admin only)
   * GET /api/admin/settings
   */
  getSettings: async (): Promise<string> => {
    try {
      const response = await apiClient.get('/api/admin/settings');
      if (response.status >= 400) {
        const errorMessage = response.data?.message || response.data?.error || `Failed to get settings: ${response.status}`;
        throw new Error(errorMessage);
      }
      return response.data;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        throw new Error('Backend service unavailable. Please start the authentication service.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin role required to access settings.');
      }
      throw error;
    }
  },
};

