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
    console.log('[API Config] Using env VITE_API_URL:', apiUrl);
    return apiUrl;
  }
  
  // In production builds (Vercel), always use the backend URL
  if (isProd) {
    console.log('[API Config] Production mode detected, using:', PRODUCTION_API_URL);
    return PRODUCTION_API_URL;
  }
  
  // In development, use the proxy
  console.log('[API Config] Development mode, using proxy:', DEVELOPMENT_API_URL);
  return DEVELOPMENT_API_URL;
};

export const API_BASE_URL = getApiBaseUrl();

console.log('[API Config] Final API_BASE_URL:', API_BASE_URL);

export default API_BASE_URL;
