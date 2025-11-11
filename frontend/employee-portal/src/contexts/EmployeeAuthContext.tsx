import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Employee, AuthContextType } from '../types';
import { authService } from '../services/authService';

interface EmployeeAuthProviderProps {
  children: ReactNode;
}

export const EmployeeAuthContext = createContext<AuthContextType | undefined>(undefined);

export const EmployeeAuthProvider: React.FC<EmployeeAuthProviderProps> = ({ children }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('employee_token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (token) {
      try {
        // Decode token to get employee info
        let payload;
        if (token.includes('.') && token.split('.').length === 3) {
          payload = JSON.parse(atob(token.split('.')[1])); // Real JWT
        } else {
          payload = JSON.parse(atob(token)); // Mock token
        }
        
        const savedEmployee = localStorage.getItem('employee');
        if (savedEmployee) {
          setEmployee(JSON.parse(savedEmployee));
        } else {
          // Set employee from token payload
          setEmployee({
            id: payload.employeeId || payload.userId || payload.sub || 1,
            email: payload.email || payload.username || '',
            name: payload.name || payload.firstName || 'Employee',
            employeeId: payload.employeeId || 'EMP-001',
            role: payload.role || 'EMPLOYEE',
          });
        }
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('employee_token');
        localStorage.removeItem('employee');
        setToken(null);
        setIsAuthenticated(false);
      }
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const MOCK_MODE = import.meta.env.VITE_MOCK_AUTH === 'true' || import.meta.env.DEV;
    const TEST_EMAIL = 'employee@cibf.com';
    const TEST_PASSWORD = 'password123';

    if (MOCK_MODE && email === TEST_EMAIL && password === TEST_PASSWORD) {
      // Mock login for frontend-only development
      const mockEmployee: Employee = {
        id: 1,
        email: TEST_EMAIL,
        name: 'Test Employee',
        employeeId: 'EMP-001',
        role: 'EMPLOYEE',
      };
      const mockToken = btoa(JSON.stringify({ 
        employeeId: mockEmployee.id,
        email: mockEmployee.email,
        role: mockEmployee.role,
      }));
      
      setToken(mockToken);
      localStorage.setItem('employee_token', mockToken);
      localStorage.setItem('employee', JSON.stringify(mockEmployee));
      setEmployee(mockEmployee);
      setIsAuthenticated(true);
      toast.success('Login successful! (Mock Mode - Backend not required)');
      return;
    }

    try {
      const response = await authService.login({ email, password });
      setToken(response.token);
      localStorage.setItem('employee_token', response.token);
      localStorage.setItem('employee', JSON.stringify(response.employee));
      setEmployee(response.employee);
      setIsAuthenticated(true);
      toast.success('Login successful!');
    } catch (error: any) {
      if (MOCK_MODE && (error.message?.includes('Network Error') || error.message?.includes('ERR_CONNECTION_REFUSED'))) {
        // Fallback to mock login on network error in dev mode
        toast.warning('Backend unavailable. Using mock login for testing.');
        const mockEmployee: Employee = {
          id: 1,
          email: email,
          name: 'Test Employee',
          employeeId: 'EMP-001',
          role: 'EMPLOYEE',
        };
        const mockToken = btoa(JSON.stringify({ 
          employeeId: mockEmployee.id,
          email: mockEmployee.email,
          role: mockEmployee.role,
        }));
        setToken(mockToken);
        localStorage.setItem('employee_token', mockToken);
        localStorage.setItem('employee', JSON.stringify(mockEmployee));
        setEmployee(mockEmployee);
        setIsAuthenticated(true);
        return;
      }
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setEmployee(null);
    setIsAuthenticated(false);
  };

  return (
    <EmployeeAuthContext.Provider
      value={{
        employee,
        token,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </EmployeeAuthContext.Provider>
  );
};

export const useEmployeeAuth = (): AuthContextType => {
  const context = React.useContext(EmployeeAuthContext);
  if (context === undefined) {
    throw new Error('useEmployeeAuth must be used within an EmployeeAuthProvider');
  }
  return context;
};

