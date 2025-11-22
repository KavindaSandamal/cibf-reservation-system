import { createContext, useContext, useState, useEffect } from 'react';
import authApi from '../services/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app load
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (token && userData && userData !== 'undefined') {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        console.log('✅ User restored from localStorage:', parsedUser);
      } catch (err) {
        console.error('❌ Failed to parse user data:', err);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }

    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
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

      // Create user object
      const userData = { 
        username,
        role, 
        businessName 
      };

      // Save to localStorage
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Update state
      setUser(userData);

      console.log('✅ User logged in successfully:', userData);

      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Extract error message
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        // Server responded with error
        errorMessage = error.response.data?.message 
          || error.response.data?.error 
          || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Cannot connect to server. Please check your connection.';
      } else {
        // Something else happened
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
    console.log('🔵 Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    console.log('✅ User logged out');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};