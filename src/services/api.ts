import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Base URL configuration - uses centralized config
const BASE_URL = API_BASE_URL;

// Helper function to get headers with demo mode
export const getApiHeaders = (skipContentType = false): Record<string, string> => {
    const headers: Record<string, string> = {};
    
    if (!skipContentType) {
        headers['Content-Type'] = 'application/json';
    }
    
    try {
        const savedUser = localStorage.getItem('farmease_user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            if (user.isDemo) {
                headers['X-Demo-Mode'] = 'true';
            }
        }
    } catch (error) {
        console.error('Error checking demo mode:', error);
    }
    
    return headers;
};

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Check if user is in demo mode and attach flag
        try {
            const savedUser = localStorage.getItem('farmease_user');
            if (savedUser) {
                const user = JSON.parse(savedUser);
                if (user.isDemo) {
                    config.headers['X-Demo-Mode'] = 'true';
                    // Add isDemo flag to request body if it's a POST/PUT
                    if (config.data && typeof config.data === 'object') {
                        config.data.isDemo = true;
                    }
                }
            }
        } catch (error) {
            console.error('Error checking demo mode:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
    (response) => {
        return response.data; // Return only data by default to simplify call sites
    },
    (error) => {
        // Uniform error handling
        if (!error.response) {
            // Network error / Offline
            console.error('Network Error:', error);
            const netError = new Error('Network error. Please check your connection.');
            (netError as any).__noRetry = true;
            return Promise.reject(netError);
        }

        // Server errors
        const message = error.response.data?.error || error.response.data?.message || 'An unexpected error occurred';
        return Promise.reject(new Error(message));
    }
);

export default api;
