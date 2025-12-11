import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { login as loginRequest, register as registerRequest } from '../services/auth.service';
import { setAuthToken } from '../services/http';
import type { AuthResponse, User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const applyAuthResponse = useCallback((response: AuthResponse) => {
    console.log('🔄 [AUTH CONTEXT] Applying auth response...', {
      userId: response.user?._id,
      userName: response.user?.fullName,
      email: response.user?.email,
      hasToken: !!response.token,
    });

    setUser(response.user);
    setToken(response.token);
    setAuthToken(response.token);

    console.log('✅ [AUTH CONTEXT] Auth state updated successfully');
    // TODO: Persist token/user in AsyncStorage for automatic login on app restart.
  }, []);

  const handleAuthError = useCallback((error: unknown, fallback: string) => {
    const message = error instanceof Error ? error.message : fallback;
    console.error('🔴 [AUTH CONTEXT ERROR]', {
      message,
      error,
    });
    throw new Error(message);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      console.log('🔐 [AUTH CONTEXT] Login called', { email });
      setLoading(true);
      try {
        const response = await loginRequest(email, password);
        console.log('✅ [AUTH CONTEXT] Login request successful, applying response...');
        applyAuthResponse(response);
        console.log('✅ [AUTH CONTEXT] Login complete');
      } catch (error) {
        console.error('❌ [AUTH CONTEXT] Login failed', error);
        handleAuthError(error, 'Unable to login');
      } finally {
        setLoading(false);
      }
    },
    [applyAuthResponse, handleAuthError],
  );

  const register = useCallback(
    async (fullName: string, email: string, password: string) => {
      console.log('📝 [AUTH CONTEXT] Register called', { fullName, email });
      setLoading(true);
      try {
        const response = await registerRequest(fullName, email, password);
        console.log('✅ [AUTH CONTEXT] Register request successful, applying response...');
        applyAuthResponse(response);
        console.log('✅ [AUTH CONTEXT] Register complete');
      } catch (error) {
        console.error('❌ [AUTH CONTEXT] Register failed', error);
        handleAuthError(error, 'Unable to register');
      } finally {
        setLoading(false);
      }
    },
    [applyAuthResponse, handleAuthError],
  );

  const logout = useCallback(() => {
    console.log('🚪 [AUTH CONTEXT] Logout called');
    setUser(null);
    setToken(null);
    setAuthToken(null);
    console.log('✅ [AUTH CONTEXT] Logout complete');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
    }),
    [loading, login, logout, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
