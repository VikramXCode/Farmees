import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  district: string;
  area: string;
  language: 'english' | 'tamil';
  role: 'farmer' | 'coordinator' | 'worker';
  isDemo?: boolean;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { name: string; phone: string; password: string; role: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const API_BASE = '/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Initialize from localStorage synchronously to prevent flash
    try {
      const savedUser = localStorage.getItem('farmease_user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (error) {
      console.error('Failed to parse saved user:', error);
      localStorage.removeItem('farmease_user');
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  // Login with phone and password
  const login = async (phone: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const userData = await response.json();
      const newUser: User = {
        id: userData.id || userData._id || '',
        name: userData.name || '',
        role: userData.role || 'farmer',
        isDemo: userData.isDemo || false,
        district: userData.district || '',
        area: userData.area || '',
        phone: userData.phone || phone,
        language: 'english',
      };
      setUser(newUser);
      localStorage.setItem('farmease_user', JSON.stringify(newUser));
    } finally {
      setLoading(false);
    }
  };

  // Register new user
  const register = async (data: { name: string; phone: string; password: string; role: string }): Promise<void> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const userData = await response.json();
      const newUser: User = {
        id: userData.id || userData._id || '',
        name: userData.name || data.name,
        role: (userData.role || data.role) as User['role'],
        isDemo: false,
        district: userData.district || '',
        area: userData.area || '',
        phone: userData.phone || data.phone,
        language: 'english',
      };
      setUser(newUser);
      localStorage.setItem('farmease_user', JSON.stringify(newUser));
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('farmease_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}