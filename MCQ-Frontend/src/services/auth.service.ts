import axios from 'axios';
import type { AuthResponse, ProfileResponse } from '../types/auth';
import { axiosInstance } from './http';

const FALLBACK_ERROR_MESSAGE = 'Something went wrong';

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message ?? FALLBACK_ERROR_MESSAGE;
    console.error('🔴 [AUTH ERROR]', {
      message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
    });
    return message;
  }

  console.error('🔴 [AUTH ERROR]', { error });
  return FALLBACK_ERROR_MESSAGE;
}

export async function register(
  fullName: string,
  email: string,
  password: string,
): Promise<AuthResponse> {
  console.log('📝 [REGISTER] Starting registration...', {
    fullName,
    email,
    passwordLength: password.length,
    endpoint: '/api/auth/register',
  });

  try {
    // Use relative URL since axiosInstance already has baseURL set
    const { data } = await axiosInstance.post<AuthResponse>('/api/auth/register', {
      fullName,
      email,
      password,
    });
    
    console.log('✅ [REGISTER SUCCESS]', {
      user: data.user,
      hasToken: !!data.token,
      tokenLength: data.token?.length,
    });

    return data;
  } catch (error) {
    console.error('❌ [REGISTER FAILED]', error);
    throw new Error(extractErrorMessage(error));
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  console.log('🔐 [LOGIN] Starting login...', {
    email,
    passwordLength: password.length,
    endpoint: '/api/auth/login',
  });

  try {
    // Use relative URL since axiosInstance already has baseURL set
    const { data } = await axiosInstance.post<AuthResponse>('/api/auth/login', {
      email,
      password,
    });
    
    console.log('✅ [LOGIN SUCCESS]', {
      user: data.user,
      hasToken: !!data.token,
      tokenLength: data.token?.length,
    });

    return data;
  } catch (error) {
    console.error('❌ [LOGIN FAILED]', error);
    throw new Error(extractErrorMessage(error));
  }
}

export async function getProfile(): Promise<ProfileResponse> {
  console.log('👤 [GET PROFILE] Fetching profile...', {
    endpoint: '/api/auth/me',
  });

  try {
    // Use relative URL since axiosInstance already has baseURL set
    const { data } = await axiosInstance.get<ProfileResponse>('/api/auth/me');
    
    console.log('✅ [GET PROFILE SUCCESS]', {
      user: data.user,
    });

    return data;
  } catch (error) {
    console.error('❌ [GET PROFILE FAILED]', error);
    throw new Error(extractErrorMessage(error));
  }
}

export async function updateUserGroup(group: 'PCM' | 'PCB' | 'PCMB'): Promise<AuthResponse> {
  console.log('📝 [UPDATE GROUP] Updating user group...', {
    group,
    endpoint: '/api/auth/profile/group',
  });

  try {
    const { data } = await axiosInstance.put<AuthResponse>('/api/auth/profile/group', {
      group,
    });
    
    console.log('✅ [UPDATE GROUP SUCCESS]', {
      user: data.user,
      group: data.user.group,
    });

    return data;
  } catch (error) {
    console.error('❌ [UPDATE GROUP FAILED]', error);
    throw new Error(extractErrorMessage(error));
  }
}

export async function upgradeSubscription(group?: 'PCM' | 'PCB' | 'PCMB'): Promise<AuthResponse> {
  console.log('💎 [UPGRADE SUBSCRIPTION] Upgrading subscription...', {
    endpoint: '/api/auth/profile/subscription/upgrade',
    group,
  });

  try {
    const { data } = await axiosInstance.put<AuthResponse>('/api/auth/profile/subscription/upgrade', {
      ...(group && { group }),
    });
    
    console.log('✅ [UPGRADE SUBSCRIPTION SUCCESS]', {
      user: data.user,
      subscription: data.user.subscription,
      group: data.user.group,
    });

    return data;
  } catch (error) {
    console.error('❌ [UPGRADE SUBSCRIPTION FAILED]', error);
    throw new Error(extractErrorMessage(error));
  }
}
