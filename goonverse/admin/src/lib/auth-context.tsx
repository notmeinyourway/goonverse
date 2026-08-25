'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from './api-client';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: 'SUPER_ADMIN' | 'MODERATOR' | 'USER';
  createdAt?: string;
}

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isModerator: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Check existing stored session
    const storedToken = localStorage.getItem('goonverse_admin_token');
    const storedUserStr = localStorage.getItem('goonverse_admin_user');

    if (storedToken && storedUserStr) {
      try {
        const parsedUser: AdminUser = JSON.parse(storedUserStr);
        if (parsedUser.role === 'SUPER_ADMIN' || parsedUser.role === 'MODERATOR') {
          setUser(parsedUser);
          // Verify with backend
          apiClient
            .get('/admin/me')
            .then((res) => {
              const updatedUser = {
                ...parsedUser,
                id: res.data.userId,
                email: res.data.email,
                role: res.data.role,
              };
              setUser(updatedUser);
              localStorage.setItem('goonverse_admin_user', JSON.stringify(updatedUser));
            })
            .catch(() => {
              logout();
            })
            .finally(() => setIsLoading(false));
          return;
        }
      } catch {
        logout();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    const response = await apiClient.post('/auth/login', { identifier, password });
    const { accessToken, user: authUser } = response.data;

    // Check RBAC permissions
    if (authUser.role !== 'SUPER_ADMIN' && authUser.role !== 'MODERATOR') {
      throw new Error('Access denied: You do not have administrator or moderator privileges.');
    }

    localStorage.setItem('goonverse_admin_token', accessToken);
    localStorage.setItem('goonverse_admin_user', JSON.stringify(authUser));
    setUser(authUser);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('goonverse_admin_token');
    localStorage.removeItem('goonverse_admin_user');
    setUser(null);
    router.push('/login');
  };

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isModerator = user?.role === 'MODERATOR' || isSuperAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isSuperAdmin,
        isModerator,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
