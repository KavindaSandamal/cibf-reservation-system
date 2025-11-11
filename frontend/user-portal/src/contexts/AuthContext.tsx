import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, RegisterData } from '../types';
import { apiClient } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!localStorage.getItem('token'));

  useEffect(() => {
    // Load user from token if available
    if (token) {
      // Decode token to get user info (simplified - in production, validate token with backend)
      try {
        // Check if it's a mock token (not a real JWT)
        let payload;
        if (token.includes('.') && token.split('.').length === 3) {
          // Real JWT format: header.payload.signature
          payload = JSON.parse(atob(token.split('.')[1]));
        } else {
          // Mock token: just base64 encoded JSON
          payload = JSON.parse(atob(token));
        }
        
        setUser({
          id: payload.userId || payload.sub || 1,
          email: payload.email || '',
          firstName: payload.firstName || 'Test',
          lastName: payload.lastName || 'User',
        });
      } catch (error) {
        console.error('Error decoding token:', error);
        // If token is invalid, clear it
        localStorage.removeItem('token');
        setToken(null);
        setIsAuthenticated(false);
      }
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    // Development mode: Mock login for testing when backend is unavailable
    const MOCK_MODE = import.meta.env.VITE_MOCK_AUTH === 'true' || import.meta.env.DEV;
    const TEST_EMAIL = 'test@example.com';
    const TEST_PASSWORD = 'password123';

    if (MOCK_MODE && email === TEST_EMAIL && password === TEST_PASSWORD) {
      // Mock login - creates a fake token and user for testing
      const mockToken = btoa(JSON.stringify({
        userId: 1,
        email: TEST_EMAIL,
        firstName: 'Test',
        lastName: 'User',
        exp: Math.floor(Date.now() / 1000) + 86400, // 24 hours
      }));
      
      setToken(mockToken);
      localStorage.setItem('token', mockToken);
      setUser({
        id: 1,
        email: TEST_EMAIL,
        firstName: 'Test',
        lastName: 'User',
      });
      setIsAuthenticated(true);
      toast.success('Login successful! (Mock Mode - Backend not required)');
      return;
    }

    try {
      const response = await apiClient.post('/api/auth/login', { email, password });
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setUser(userData);
      setIsAuthenticated(true);
      toast.success('Login successful!');
    } catch (error: any) {
      // If backend is unavailable and we're in dev mode, offer mock login
      if (MOCK_MODE && (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error'))) {
        toast.warning('Backend unavailable. Using mock login for testing.');
        // Auto-login with mock credentials
        const mockToken = btoa(JSON.stringify({
          userId: 1,
          email: email || TEST_EMAIL,
          firstName: 'Test',
          lastName: 'User',
          exp: Math.floor(Date.now() / 1000) + 86400,
        }));
        
        setToken(mockToken);
        localStorage.setItem('token', mockToken);
        setUser({
          id: 1,
          email: email || TEST_EMAIL,
          firstName: 'Test',
          lastName: 'User',
        });
        setIsAuthenticated(true);
        toast.success('Mock login successful! (Backend unavailable)');
        return;
      }
      
      toast.error(error.response?.data?.message || 'Login failed');
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.post('/api/auth/register', data);
      const { token: newToken, user: userData } = response.data;
      
      setToken(newToken);
      localStorage.setItem('token', newToken);
      setUser(userData);
      setIsAuthenticated(true);
      toast.success('Registration successful!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Registration failed');
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    toast.info('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

