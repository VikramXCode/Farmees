// Centralized API configuration
// This ensures all services use the same backend URL

const PRODUCTION_API_URL = 'https://farmees-backend.vercel.app/api';

// Get the API base URL from environment variable or fallback
// In Vite, environment variables are available at build time via import.meta.env
export const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? PRODUCTION_API_URL : '/api');

export default API_BASE_URL;
