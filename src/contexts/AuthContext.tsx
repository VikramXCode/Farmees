import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';

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
  login: (userData: Partial<User> & { id?: string; _id?: string }) => void;
  logout: () => void;
  loading: boolean;
}

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

  // Accepts user object from backend (with id)
  const login = (userData: Partial<User> & { id?: string; _id?: string; isDemo?: boolean; phone?: string }) => {
    const newUser = {
      ...userData,
      id: userData.id || userData._id || '',
      role: userData.role || 'farmer',
      isDemo: userData.isDemo || false,
      district: userData.district || '',
      area: userData.area || '',
      phone: userData.phone || ''
    };
    setUser(newUser as User);
    localStorage.setItem('farmease_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('farmease_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
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