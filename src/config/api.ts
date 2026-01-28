// Centralized API configuration
// This ensures all services use the same backend URL

// For Vercel: use relative paths that will be rewritten by vercel.json
// For local dev: use localhost
const getApiBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  
  // If explicitly set via environment variable, use it
  if (apiUrl) {
    console.log('[API Config] Using env VITE_API_URL:', apiUrl);
    return apiUrl;
  }
  
  // Check if running on Vercel (production)
  const isVercel = import.meta.env.VITE_VERCEL === 'true' || typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  
  if (isVercel) {
    // On Vercel production, use relative path - it will be rewritten by vercel.json
    console.log('[API Config] Vercel production detected, using relative /api');
    return '/api';
  }
  
  // Local development
  console.log('[API Config] Development mode, using localhost:3001');
  return 'http://localhost:3001/api';
};

export const API_BASE_URL = getApiBaseUrl();

console.log('[API Config] Final API_BASE_URL:', API_BASE_URL);

export default API_BASE_URL;
