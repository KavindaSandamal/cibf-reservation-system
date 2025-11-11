import { apiClient } from './api';
import { Employee, LoginData } from '../types';

export interface AuthResponse {
  token: string;
  employee: Employee;
}

export const authService = {
  // Employee login
  login: async (data: LoginData): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/employee/login', {
        username: data.email,
        password: data.password,
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  // Logout (client-side only)
  logout: (): void => {
    localStorage.removeItem('employee_token');
    localStorage.removeItem('employee');
  },
};

