'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: {
    id: string;
    name: string;
    permissions: string[];
  };
  organizationId: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.success && data.user && data.accessToken) {
        // Store tokens
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        // Set user
        setUser(data.user);
        
        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      // Call logout API to clear cookies
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }

    // Clear ALL storage
    localStorage.clear();
    sessionStorage.clear();

    // Clear cookies from client side as backup
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=' + window.location.hostname;
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=' + window.location.hostname;
    document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

    // Clear user state
    setUser(null);

    // Hard redirect to login page to ensure clean state
    window.location.href = '/login';
  }, []);

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refresh = localStorage.getItem('refreshToken');
      if (!refresh) {
        return false;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      const data = await response.json();

      if (data.success && data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user || !user.role) return false;
    return user.role.permissions.includes(permission) || user.role.permissions.includes('*');
  };

  const hasRole = (role: string): boolean => {
    if (!user || !user.role) return false;
    return user.role.name === role || user.role.name === 'Admin';
  };

  const checkAuthStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Verify token with backend
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Try to refresh token
        const refreshed = await refreshToken();
        if (!refreshed) {
          logout();
        } else {
          // Retry with new token
          await checkAuthStatus();
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Auto refresh token before it expires
  useEffect(() => {
    if (user) {
      const interval = setInterval(async () => {
        await refreshToken();
      }, 10 * 60 * 1000); // Refresh every 10 minutes

      return () => clearInterval(interval);
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    refreshToken,
    hasPermission,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};