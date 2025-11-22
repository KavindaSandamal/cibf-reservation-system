import React, { createContext, useState, useContext, useEffect } from 'react';
import authApi from '../services/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (!token) {
        setLoading(false);
        return;
      }

      console.log('🔵 Token found, fetching fresh user info...');
      
      // Always fetch fresh user info from server (ensures we have the ID)
      try {
        const response = await authApi.get('/api/auth/me');
        console.log('✅ User info retrieved from server:', response.data);
        
        // Update localStorage with fresh data
        localStorage.setItem('user', JSON.stringify(response.data));
        setUser(response.data);
        
      } catch (error) {
        console.error('❌ Failed to fetch user info:', error);
        
        // Fallback to stored user if API call fails
        if (storedUser && storedUser !== 'undefined') {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log('⚠️ Using stored user data:', parsedUser);
            setUser(parsedUser);
          } catch (parseError) {
            console.error('❌ Failed to parse stored user:', parseError);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        } else {
          // If no stored user and API fails, clear everything
          localStorage.removeItem('token');
        }
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    try {
      console.log('🔵 Attempting login with:', username);
      console.log('🔵 Sending login request to:', authApi.defaults.baseURL + '/api/auth/login');
      
      const response = await authApi.post('/api/auth/login', { 
        username, 
        password 
      });

      console.log('✅ Login response received:', response.data);

      const { accessToken, role, businessName } = response.data;

      if (!accessToken) {
        throw new Error('No access token received from server');
      }

      // Store token FIRST (required for subsequent API calls)
      localStorage.setItem('token', accessToken);
      console.log('✅ Token stored in localStorage');

      // Fetch full user info with ID from /api/auth/me
      try {
        console.log('🔵 Fetching full user info from /api/auth/me...');
        const userInfoResponse = await authApi.get('/api/auth/me');
        console.log('✅ Full user info retrieved:', userInfoResponse.data);
        
        // Store complete user data in localStorage
        localStorage.setItem('user', JSON.stringify(userInfoResponse.data));
        
        // Set complete user object with ID
        setUser(userInfoResponse.data);
        console.log('✅ User logged in successfully with ID:', userInfoResponse.data);
        
        return { success: true };
        
      } catch (meError) {
        console.error('❌ Failed to fetch user info from /me endpoint:', meError);
        console.error('❌ Error details:', meError.response?.data);
        
        // Fallback: use basic info from login response (without ID)
        const basicUserInfo = {
          username,
          role,
          businessName
        };
        
        localStorage.setItem('user', JSON.stringify(basicUserInfo));
        setUser(basicUserInfo);
        console.log('⚠️ Using basic user info (no ID):', basicUserInfo);
        
        return { 
          success: true,
          warning: 'Could not fetch complete user info. Some features may be limited.'
        };
      }
    } catch (error) {
      console.error('❌ Login failed:', error);
      console.error('❌ Error response:', error.response?.data);
      
      // Extract error message
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data?.message 
          || error.response.data?.error 
          || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const register = async (userData) => {
    try {
      console.log('🔵 Sending registration request');
      const response = await authApi.post('/api/auth/register', userData);
      console.log('✅ Registration successful:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response) {
        errorMessage = error.response.data?.message 
          || error.response.data?.error 
          || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('✅ User logged out');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};