import { apiClient } from './api';
import { Employee, LoginData } from '../types';

export interface BackendAuthResponse {
  accessToken: string;
  tokenType?: string;
  role: string;
  businessName?: string;
}

export interface AuthResponse {
  token: string;
  employee: Employee;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  name: string;
  employeeId: string;
  role?: string;
}

export const authService = {
  // Employee login
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<BackendAuthResponse>('/api/auth/employee/login', {
        username: data.email,
        password: data.password,
      });
      
      // Map backend response to frontend format
      const backendResponse = response.data;
      
      // Decode JWT to get employee info
      let employeeInfo: any = {};
      try {
        const tokenParts = backendResponse.accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          employeeInfo = {
            id: payload.sub || payload.userId || payload.id || 1,
            email: payload.sub || data.email,
            name: payload.name || payload.firstName || 'Employee',
            employeeId: payload.employeeId || 'EMP-001',
            role: backendResponse.role || payload.role || 'EMPLOYEE',
          };
        }
      } catch (e) {
        // If token decode fails, use defaults
        employeeInfo = {
          id: 1,
          email: data.email,
          name: 'Employee',
          employeeId: 'EMP-001',
          role: backendResponse.role || 'EMPLOYEE',
        };
      }
      
      return {
        token: backendResponse.accessToken,
        employee: employeeInfo as Employee,
      };
    } catch (error: any) {
      // Provide more helpful error messages
      if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error('Cannot connect to backend server. Please ensure the authentication service is running on port 8081 (or nginx on port 80).');
      }
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Login failed');
    }
  },

  // Employee registration
  register: async (data: RegisterData): Promise<AuthResponse> => {
    try {
      // Backend expects username to be an email (has @Email validation)
      // Use email as username to satisfy backend validation
      const requestPayload = {
        username: data.email, // Backend requires username to be an email
        email: data.email,
        password: data.password,
        name: data.name,
        employeeId: data.employeeId,
        role: data.role || 'EMPLOYEE',
      };
      
      console.log('Sending registration request:', { ...requestPayload, password: '***' });
      
      const response = await apiClient.post<BackendAuthResponse>('/api/auth/employee/register', requestPayload);
      
      // Map backend response to frontend format
      const backendResponse = response.data;
      
      // Create employee object from registration data
      const employee: Employee = {
        id: 0, // Will be set from token or backend
        email: data.email,
        name: data.name,
        employeeId: data.employeeId,
        role: (data.role || 'EMPLOYEE') as 'EMPLOYEE' | 'ADMIN',
      };
      
      // Try to decode token for employee ID
      try {
        const tokenParts = backendResponse.accessToken.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          employee.id = payload.sub || payload.userId || payload.id || 0;
        }
      } catch (e) {
        // Keep default
      }
      
      return {
        token: backendResponse.accessToken,
        employee,
      };
    } catch (error: any) {
      // Provide more helpful error messages
      if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error('Cannot connect to backend server. Please ensure the authentication service is running on port 8081 (or nginx on port 80).');
      }
      
      // Log full error for debugging
      console.error('Registration error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      // Extract error message from various possible response formats
      let errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.response?.data?.errors?.[0]?.defaultMessage ||
        error.response?.data?.title;
      
      // If no error message in response body, provide helpful guidance
      if (!errorMessage && error.response?.status === 500) {
        errorMessage = 'Internal server error. This could be due to:\n' +
          '- Duplicate username/email already exists\n' +
          '- Duplicate employee ID already exists\n' +
          '- Database connection issue\n' +
          '- Please check backend logs for details';
      }
      
      if (!errorMessage) {
        errorMessage = `Registration failed (${error.response?.status || 'Unknown error'})`;
      }
      
      throw new Error(errorMessage);
    }
  },

  // Logout (client-side only)
  logout: (): void => {
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee');
  },
};

