import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  district: string;
  area: string;
  language: 'english' | 'malayalam';
}

interface LanguageContextType {
  language: 'english' | 'malayalam';
  setLanguage: (lang: 'english' | 'malayalam') => void;
  t: (key: string) => string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: Partial<User> & { id?: string; _id?: string }) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Accepts user object from backend (with id)
  const login = (userData: Partial<User> & { id?: string; _id?: string }) => {
    const newUser = {
      ...userData,
      id: userData.id || userData._id || '',
    };
    setUser(newUser as User);
    localStorage.setItem('farmease_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('farmease_user');
  };

  React.useEffect(() => {
    const savedUser = localStorage.getItem('farmease_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

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