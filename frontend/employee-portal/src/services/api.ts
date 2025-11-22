import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Use environment variable or fallback to your server IP
const API_URL = import.meta.env.VITE_API_URL || 'http://34.213.51.153';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important for CORS with credentials
    });

    // Request interceptor - add JWT token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // Try multiple token keys for compatibility
        const token = 
          localStorage.getItem('employee_token') || 
          localStorage.getItem('authToken') || 
          localStorage.getItem('token');
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          
          // Log in development mode
          if (import.meta.env.DEV) {
            console.log('API Request:', {
              method: config.method?.toUpperCase(),
              url: config.url,
              hasAuth: !!token,
            });
          }
        } else if (import.meta.env.DEV) {
          console.warn('No auth token found in localStorage');
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        const status = error.response?.status;
        const url = error.config?.url || '';
        
        // Handle 401 Unauthorized - token expired or invalid
        if (status === 401) {
          console.warn('401 Unauthorized - redirecting to login');
          localStorage.removeItem('employee_token');
          localStorage.removeItem('authToken');
          localStorage.removeItem('token');
          localStorage.removeItem('employee');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Handle 403 Forbidden - insufficient permissions
        if (status === 403) {
          console.error('403 Forbidden - insufficient permissions');
          const token = 
            localStorage.getItem('employee_token') || 
            localStorage.getItem('authToken') || 
            localStorage.getItem('token');
          
          if (!token) {
            console.warn('No token found - redirecting to login');
            window.location.href = '/login';
          } else {
            console.error('User does not have required role (EMPLOYEE or ADMIN)');
            console.log('Current token:', token.substring(0, 20) + '...');
          }
        }
        
        // Suppress console errors for endpoints that are handled gracefully
        // These errors are expected when services are unavailable
        const isHandledEndpoint = url.includes('/api/admin/stalls/statistics');
        
        if (isHandledEndpoint && status >= 500) {
          // Mark error as handled to prevent console spam
          error.isHandled = true;
        }
        
        return Promise.reject(error);
      }
    );
  }

  get instance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().instance;