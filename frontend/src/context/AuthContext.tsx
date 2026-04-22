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

// Helper: check if JWT is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return false;
    // exp is in seconds, Date.now() in ms
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // invalid token format → treat as expired
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Theme application
  useEffect(() => {
    const root = document.documentElement;
    const color = user?.neonColor || '#00f5ff';
    const brightness = user?.neonBrightness !== undefined ? user.neonBrightness : 1.0;
    root.style.setProperty('--primary', color);
    root.style.setProperty('--glow-opacity', brightness.toString());
    root.style.setProperty('--primary-glow', `${color}${Math.round(brightness * 255).toString(16).padStart(2, '0')}`);
  }, [user]);

  // On mount: validate token from localStorage
  useEffect(() => {
    const init = async () => {
      const storedToken = localStorage.getItem('token');

      // No token → not logged in
      if (!storedToken) {
        setLoading(false);
        return;
      }

      // Token is expired → clear it
      if (isTokenExpired(storedToken)) {
        localStorage.removeItem('token');
        setLoading(false);
        return;
      }

      // Token looks valid → verify with server
      try {
        const res = await api.get('/me', {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        setToken(storedToken);
        setUser(res.data);
      } catch {
        // Server rejected token (deleted user, revoked, etc.)
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  // Periodically re-validate token every 5 minutes
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      if (isTokenExpired(token)) {
        logout();
        return;
      }
      // Also re-verify with server
      api.get('/me').catch(() => logout());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [token]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    // Also clear any session/cache data
    sessionStorage.clear();
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
