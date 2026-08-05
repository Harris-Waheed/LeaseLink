import axios from 'axios';
import toast from 'react-hot-toast';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const tenantToken = localStorage.getItem('tenant_token');
    const adminToken = localStorage.getItem('token');
    const token = tenantToken || adminToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Let the browser set the Content-Type automatically for FormData to include the correct boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('tenant_token');
        localStorage.removeItem('user');
        localStorage.removeItem('leaseLinkUser');
        window.location.href = '/landlord'; // Redirect to login
        toast.error('Session expired. Please log in again.');
      } 
      // Handle 422 Unprocessable Entity (FastAPI Validation Error)
      else if (error.response.status === 422) {
        const details = error.response.data?.detail;
        if (Array.isArray(details)) {
          details.forEach((err) => {
            const field = err.loc[err.loc.length - 1];
            toast.error(`${field}: ${err.msg}`);
          });
        } else if (typeof details === 'string') {
          toast.error(details);
        } else {
          toast.error('Validation error occurred.');
        }
      } else {
        // Generic fallback for other errors
        toast.error(error.response.data?.detail || error.message || 'An error occurred.');
      }
    } else {
      // The request was made but no response was received (network error, server down, CORS, etc.)
      toast.error('Network Error: Cannot reach the server. Please check your internet connection.');
    }
    return Promise.reject(error);
  }
);
