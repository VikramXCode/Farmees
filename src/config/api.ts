// Centralized API configuration
// This ensures all services use the same backend URL

// Always use the backend URL in production (Vercel deployment)
const PRODUCTION_API_URL = 'https://farmees-backend.vercel.app/api';
const DEVELOPMENT_API_URL = '/api';

// Get the API base URL
// Priority: 1. VITE_API_URL env var, 2. Production URL if PROD mode, 3. Dev proxy
const getApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  const isProd = import.meta.env.PROD;
  
  if (apiUrl) {
    return apiUrl;
  }
  
  // In production builds (Vercel), always use the backend URL
  if (isProd) {
    return PRODUCTION_API_URL;
  }
  
  // In development, use the proxy
  return DEVELOPMENT_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();

// Debug log in development
if (import.meta.env.DEV) {
  console.log('[API Config] Using API Base URL:', API_BASE_URL);
}

export default API_BASE_URL;
