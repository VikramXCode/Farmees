// Centralized API configuration
// This ensures all services use the same backend URL

const PRODUCTION_API_URL = 'https://farmees-backend.vercel.app/api';

// Determine if we're in production (Vite sets this)
const isProduction = typeof import.meta !== 'undefined' && (import.meta as any).env?.PROD;

// Get the API base URL
// Priority: Environment variable > Production URL > Development proxy
export const API_BASE_URL = 
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL) ||
  (isProduction ? PRODUCTION_API_URL : '/api');

export default API_BASE_URL;
