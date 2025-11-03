'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { xanoClient } from './xano-client';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const initAuth = async () => {
      const token = xanoClient.getAuthToken();
      if (token) {
        try {
          const currentUser = await xanoClient.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to fetch user:', error);
          xanoClient.logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    await xanoClient.login({ email, password });
    // Fetch full user data including overtime_account
    const currentUser = await xanoClient.getCurrentUser();
    setUser(currentUser);
  };

  const signup = async (email: string, password: string, name: string) => {
    await xanoClient.signup({ email, password, name });
    // Fetch full user data including overtime_account
    const currentUser = await xanoClient.getCurrentUser();
    setUser(currentUser);
  };

  const logout = () => {
    xanoClient.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    if (xanoClient.getAuthToken()) {
      const currentUser = await xanoClient.getCurrentUser();
      setUser(currentUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refreshUser }}>
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
