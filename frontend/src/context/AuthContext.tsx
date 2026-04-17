import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  neonColor?: string;
  neonBrightness?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (newUser: User) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Theme application logic
  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      const color = user?.neonColor || '#00f5ff';
      const brightness = user?.neonBrightness !== undefined ? user.neonBrightness : 1.0;
      
      root.style.setProperty('--primary', color);
      root.style.setProperty('--glow-opacity', brightness.toString());
      
      // Calculate a complementary secondary color (optional but nice)
      // For now, we use the primary color with lower opacity for general glows
      root.style.setProperty('--primary-glow', `${color}${Math.round(brightness * 255).toString(16).padStart(2, '0')}`);
    };

    applyTheme();
  }, [user]);

  useEffect(() => {
    const fetchMe = async () => {
      if (token) {
        try {
          const res = await api.get('/me');
          setUser(res.data);
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    fetchMe();
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (newUser: User) => {
    setUser(prev => prev ? { ...prev, ...newUser } : newUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
