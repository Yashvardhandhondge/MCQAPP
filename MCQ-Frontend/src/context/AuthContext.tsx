import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { register as registerRequest, updateUserGroup as updateUserGroupRequest, upgradeSubscription as upgradeSubscriptionRequest, sendOTP as sendOTPRequest, verifyOTP as verifyOTPRequest } from '../services/auth.service';
import { setAuthToken } from '../services/http';
import type { AuthResponse, User } from '../types/auth';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  register: (fullName: string, email: string, phoneNumber: string) => Promise<void>;
  sendOTP: (phoneNumber: string) => Promise<void>;
  loginWithOTP: (phoneNumber: string, otp: string) => Promise<void>;
  updateUserGroup: (group: 'PCM' | 'PCB' | 'PCMB') => Promise<void>;
  upgradeSubscription: (group?: 'PCM' | 'PCB' | 'PCMB') => Promise<void>;
  // Local-only profile updates (e.g. name, avatar) without hitting backend
  updateProfile: (updates: Partial<Pick<User, 'fullName' | 'avatarUrl'>>) => void;
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
    // Only log non-network errors here (network errors already logged in http interceptor)
    if (!(error instanceof Error && error.message.includes('Request failed'))) {
      console.error('🔴 [AUTH CONTEXT ERROR]', { message });
    }
    throw new Error(message);
  }, []);

  const register = useCallback(
    async (fullName: string, email: string, phoneNumber: string) => {
      console.log('📝 [AUTH CONTEXT] Register called', {
        fullName,
        email,
        phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
      });
      setLoading(true);
      try {
        // We intentionally do NOT log the user in after registration.
        // The flow is:
        // 1) User signs up
        // 2) User is redirected to OTP login screen
        // 3) User logs in only after verifying OTP
        await registerRequest(fullName, email, phoneNumber);
        console.log('✅ [AUTH CONTEXT] Register request successful (no auto-login)');
      } catch (error) {
        console.error('❌ [AUTH CONTEXT] Register failed', error);
        handleAuthError(error, 'Unable to register');
      } finally {
        setLoading(false);
      }
    },
    [handleAuthError],
  );

  const sendOTP = useCallback(
    async (phoneNumber: string) => {
      console.log('📱 [AUTH CONTEXT] Send OTP called', { phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') });
      setLoading(true);
      try {
        await sendOTPRequest(phoneNumber);
        console.log('✅ [AUTH CONTEXT] OTP sent successfully');
      } catch (error) {
        // Error already logged in service layer or http interceptor
        handleAuthError(error, 'Unable to send OTP');
      } finally {
        setLoading(false);
      }
    },
    [handleAuthError],
  );

  const loginWithOTP = useCallback(
    async (phoneNumber: string, otp: string) => {
      console.log('🔐 [AUTH CONTEXT] Login with OTP called', { phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*') });
      setLoading(true);
      try {
        const response = await verifyOTPRequest(phoneNumber, otp);
        console.log('✅ [AUTH CONTEXT] OTP verification successful, applying response...');
        applyAuthResponse(response);
        console.log('✅ [AUTH CONTEXT] Login with OTP complete');
      } catch (error) {
        console.error('❌ [AUTH CONTEXT] Login with OTP failed', error);
        handleAuthError(error, 'Unable to verify OTP');
      } finally {
        setLoading(false);
      }
    },
    [applyAuthResponse, handleAuthError],
  );

  const updateUserGroup = useCallback(
    async (group: 'PCM' | 'PCB' | 'PCMB') => {
      console.log('📝 [AUTH CONTEXT] Update group called', { group });
      setLoading(true);
      try {
        const response = await updateUserGroupRequest(group);
        console.log('✅ [AUTH CONTEXT] Update group request successful, applying response...');
        applyAuthResponse(response);
        console.log('✅ [AUTH CONTEXT] Update group complete');
      } catch (error) {
        console.error('❌ [AUTH CONTEXT] Update group failed', error);
        handleAuthError(error, 'Unable to update group');
      } finally {
        setLoading(false);
      }
    },
    [applyAuthResponse, handleAuthError],
  );

  const upgradeSubscription = useCallback(
    async (group?: 'PCM' | 'PCB' | 'PCMB') => {
      console.log('💎 [AUTH CONTEXT] Upgrade subscription called', { group });
      setLoading(true);
      try {
        const response = await upgradeSubscriptionRequest(group);
        console.log('✅ [AUTH CONTEXT] Upgrade subscription request successful, applying response...');
        applyAuthResponse(response);
        // Reset test count when upgrading to premium
        try {
          const { resetTestCount } = await import('../utils/testTracking');
          await resetTestCount();
        } catch (err) {
          console.warn('Failed to reset test count:', err);
        }
        console.log('✅ [AUTH CONTEXT] Upgrade subscription complete');
      } catch (error) {
        console.error('❌ [AUTH CONTEXT] Upgrade subscription failed', error);
        handleAuthError(error, 'Unable to upgrade subscription');
      } finally {
        setLoading(false);
      }
    },
    [applyAuthResponse, handleAuthError],
  );

  const updateProfile = useCallback((updates: Partial<Pick<User, 'fullName' | 'avatarUrl'>>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }, []);

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
      register,
      sendOTP,
      loginWithOTP,
      updateUserGroup,
      upgradeSubscription,
      updateProfile,
      logout,
    }),
    [loading, logout, register, sendOTP, loginWithOTP, updateUserGroup, upgradeSubscription, updateProfile, token, user],
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
