// employeeService.ts
import axios from 'axios';
import { authService } from './authService';

const API_URL = import.meta.env.VITE_API_URL || 'http://34.213.51.153';

export interface CreateStaffPayload {
  username: string;
  email: string;
  password: string;
  name: string;
  employeeId: string;
  contactNumber?: string;
  department?: string;
}

export interface DuplicateCheckResult {
  email: boolean;
  employeeId: boolean;
}

class EmployeeService {
  /**
   * Wrapper to create a staff member (employee or admin)
   */
  async createStaff(payload: CreateStaffPayload, role: 'ADMIN' | 'EMPLOYEE') {
    try {
      if (role === 'ADMIN') {
        return await this.createAdmin(payload);
      } else {
        return await this.createEmployee(payload);
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error(`Failed to create ${role.toLowerCase()}`);
    }
  }

  /**
   * Create a new employee (EMPLOYEE role)
   */
  async createEmployee(payload: CreateStaffPayload) {
    const response = await axios.post(`${API_URL}/api/admin/employees`, payload, {
      headers: {
        Authorization: `Bearer ${authService.getToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  /**
   * Create a new admin (ADMIN role)
   */
  async createAdmin(payload: CreateStaffPayload) {
    const response = await axios.post(`${API_URL}/api/admin/admins`, payload, {
      headers: {
        Authorization: `Bearer ${authService.getToken()}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  }

  /**
   * Delete an employee
   */
  async deleteEmployee(employeeId: number) {
    const response = await axios.delete(`${API_URL}/api/admin/employees/${employeeId}`, {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
    return response.data;
  }

  /**
   * Check if email or employeeId already exists
   */
  async checkExists(email: string, employeeId: string): Promise<DuplicateCheckResult> {
    try {
      const response = await axios.get(`${API_URL}/api/admin/employees/check-duplicate`, {
        params: { email, employeeId },
        headers: { Authorization: `Bearer ${authService.getToken()}` },
      });
      // API should return something like { email: true/false, employeeId: true/false }
      return response.data;
    } catch (error: any) {
      console.warn('Duplicate check failed', error);
      return { email: false, employeeId: false }; // fail safe
    }
  }

  async getSettings(): Promise<string> {
    const response = await axios.get(`${API_URL}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${authService.getToken()}` },
    });
    return response.data; // adjust based on what your API returns
  }
}

export const employeeService = new EmployeeService();
