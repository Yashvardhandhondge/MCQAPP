import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { register as registerRequest, updateUserGroup as updateUserGroupRequest, upgradeSubscription as upgradeSubscriptionRequest, sendOTP as sendOTPRequest, verifyOTP as verifyOTPRequest } from '../services/auth.service';
import { setAuthToken } from '../services/http';
import { registerDeviceWithBackend, setOneSignalUserId, removeOneSignalUserId } from '../services/oneSignal.service';
import type { AuthResponse, User } from '../types/auth';

const AUTH_STORAGE_KEY = '@auth_token';
const USER_STORAGE_KEY = '@auth_user';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  initializing: boolean;
  register: (fullName: string, email: string, phoneNumber: string) => Promise<void>;
  sendOTP: (phoneNumber: string) => Promise<void>;
  loginWithOTP: (phoneNumber: string, otp: string) => Promise<void>;
  updateUserGroup: (group: 'PCM' | 'PCB' | 'PCMB') => Promise<void>;
  upgradeSubscription: (group?: 'PCM' | 'PCB' | 'PCMB') => Promise<void>;
  /** Update user in state and storage (e.g. after payment verification). Keeps existing token. */
  applyUserUpdate: (user: User) => Promise<void>;
  // Local-only profile updates (e.g. name, avatar) without hitting backend
  updateProfile: (updates: Partial<Pick<User, 'fullName' | 'avatarUrl'>>) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // Restore auth state from AsyncStorage on app startup
  useEffect(() => {
    const restoreAuthState = async () => {
      try {
        console.log('🔄 [AUTH CONTEXT] Restoring auth state from storage...');
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem(AUTH_STORAGE_KEY),
          AsyncStorage.getItem(USER_STORAGE_KEY),
        ]);

        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            console.log('✅ [AUTH CONTEXT] Found stored auth state', {
              userId: parsedUser?._id,
              userName: parsedUser?.fullName,
            });
            setUser(parsedUser);
            setToken(storedToken);
            setAuthToken(storedToken);
            
            // Register device with OneSignal when restoring auth state
            // Give OneSignal time to initialize (it's initialized in App.tsx)
            setTimeout(async () => {
              try {
                if (parsedUser?._id) {
                  setOneSignalUserId(parsedUser._id);
                  // Try to register device - it will retry if OneSignal isn't ready yet
                  await registerDeviceWithBackend();
                }
              } catch (error) {
                console.error('Failed to register device on auth restore:', error);
              }
            }, 2000);
          } catch (parseError) {
            console.error('❌ [AUTH CONTEXT] Failed to parse stored user data', parseError);
            // Clear corrupted data
            await Promise.all([
              AsyncStorage.removeItem(AUTH_STORAGE_KEY),
              AsyncStorage.removeItem(USER_STORAGE_KEY),
            ]);
          }
        } else {
          console.log('ℹ️ [AUTH CONTEXT] No stored auth state found');
        }
      } catch (error) {
        console.error('❌ [AUTH CONTEXT] Failed to restore auth state', error);
      } finally {
        setInitializing(false);
      }
    };

    restoreAuthState();
  }, []);

  const applyAuthResponse = useCallback(async (response: AuthResponse) => {
    console.log('🔄 [AUTH CONTEXT] Applying auth response...', {
      userId: response.user?._id,
      userName: response.user?.fullName,
      email: response.user?.email,
      hasToken: !!response.token,
    });

    setUser(response.user);
    setToken(response.token);
    setAuthToken(response.token);

    // Persist to AsyncStorage
    try {
      await Promise.all([
        AsyncStorage.setItem(AUTH_STORAGE_KEY, response.token),
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user)),
      ]);
      console.log('✅ [AUTH CONTEXT] Auth state persisted to storage');
    } catch (error) {
      console.error('❌ [AUTH CONTEXT] Failed to persist auth state', error);
      // Don't throw - auth still works, just won't persist
    }

    // Register device with OneSignal and backend
    try {
      if (response.user?._id) {
        setOneSignalUserId(response.user._id);
        // Delay device registration slightly to ensure OneSignal is initialized
        setTimeout(() => {
          registerDeviceWithBackend().catch((err) => {
            console.error('Failed to register device with backend:', err);
          });
        }, 1000);
      }
    } catch (error) {
      console.error('❌ [AUTH CONTEXT] Failed to register OneSignal device', error);
      // Don't throw - auth still works without device registration
    }

    console.log('✅ [AUTH CONTEXT] Auth state updated successfully');
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

  const applyUserUpdate = useCallback(async (updatedUser: User) => {
    setUser(updatedUser);
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      try {
        const { resetTestCount } = await import('../utils/testTracking');
        await resetTestCount();
      } catch (err) {
        console.warn('Failed to reset test count:', err);
      }
    } catch (error) {
      console.error('❌ [AUTH CONTEXT] Failed to persist user update', error);
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<Pick<User, 'fullName' | 'avatarUrl'>>) => {
    setUser((prev) => {
      const updated = prev ? { ...prev, ...updates } : prev;
      
      // Persist updated user to AsyncStorage
      if (updated) {
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated)).catch((error) => {
          console.error('❌ [AUTH CONTEXT] Failed to persist updated profile', error);
        });
      }
      
      return updated;
    });
  }, []);

  const logout = useCallback(async () => {
    console.log('🚪 [AUTH CONTEXT] Logout called');
    setUser(null);
    setToken(null);
    setAuthToken(null);
    
    // Remove OneSignal user ID
    try {
      removeOneSignalUserId();
    } catch (error) {
      console.error('❌ [AUTH CONTEXT] Failed to remove OneSignal user ID', error);
    }
    
    // Clear AsyncStorage
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_STORAGE_KEY),
        AsyncStorage.removeItem(USER_STORAGE_KEY),
      ]);
      console.log('✅ [AUTH CONTEXT] Auth state cleared from storage');
    } catch (error) {
      console.error('❌ [AUTH CONTEXT] Failed to clear auth state from storage', error);
    }
    
    console.log('✅ [AUTH CONTEXT] Logout complete');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      initializing,
      register,
      sendOTP,
      loginWithOTP,
      updateUserGroup,
      upgradeSubscription,
      applyUserUpdate,
      updateProfile,
      logout,
    }),
    [loading, initializing, logout, register, sendOTP, loginWithOTP, updateUserGroup, upgradeSubscription, applyUserUpdate, updateProfile, token, user],
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
