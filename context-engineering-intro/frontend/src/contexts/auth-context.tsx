'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService, User } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, first_name: string, last_name: string) => Promise<User>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (authService.isAuthenticated()) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Failed to load user:', error);
          // Token invalid, clear it
          await authService.logout();
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const { user } = await authService.login({ email, password });
    setUser(user);
    return user;
  };

  const register = async (email: string, password: string, first_name: string, last_name: string): Promise<User> => {
    const { user } = await authService.register({ email, password, first_name, last_name });
    setUser(user);
    return user;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    router.push('/login');
  };

  const refetchUser = async () => {
    if (authService.isAuthenticated()) {
      const userData = await authService.getMe();
      setUser(userData);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    refetchUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
