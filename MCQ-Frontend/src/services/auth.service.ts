import axios from 'axios';
import type { AuthResponse, ProfileResponse, SendOTPResponse, VerifyOTPResponse } from '../types/auth';
import { axiosInstance } from './http';

const FALLBACK_ERROR_MESSAGE = 'Something went wrong';

function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Error is already logged in http.ts interceptor, just extract the message
    return error.response?.data?.message ?? FALLBACK_ERROR_MESSAGE;
  }

  // Only log non-axios errors here
  if (error instanceof Error) {
    return error.message;
  }

  return FALLBACK_ERROR_MESSAGE;
}

export async function register(
  fullName: string,
  email: string,
  phoneNumber: string,
): Promise<AuthResponse> {
  console.log('📝 [REGISTER] Starting registration...', {
    fullName,
    email,
    phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Mask phone number in logs
    endpoint: '/api/auth/register',
  });

  try {
    // Use relative URL since axiosInstance already has baseURL set
    const { data } = await axiosInstance.post<AuthResponse>('/api/auth/register', {
      fullName,
      email,
      phoneNumber,
    });
    
    console.log('✅ [REGISTER SUCCESS]', {
      user: data.user,
      hasToken: !!data.token,
      tokenLength: data.token?.length,
    });

    return data;
  } catch (error) {
    // Error details already logged in http interceptor
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
    // Error details already logged in http interceptor
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
    // Error details already logged in http interceptor
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
    // Error details already logged in http interceptor
    throw new Error(extractErrorMessage(error));
  }
}

export async function sendOTP(phoneNumber: string): Promise<SendOTPResponse> {
  console.log('📱 [SEND OTP] Sending OTP...', {
    phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Mask phone number in logs
    endpoint: '/api/auth/send-otp',
  });

  try {
    const { data } = await axiosInstance.post<SendOTPResponse>('/api/auth/send-otp', {
      phoneNumber,
    });
    
    console.log('✅ [SEND OTP SUCCESS]', {
      expiresIn: data.expiresIn,
    });

    return data;
  } catch (error) {
    // Error details already logged in http interceptor
    throw new Error(extractErrorMessage(error));
  }
}

export async function verifyOTP(phoneNumber: string, otp: string): Promise<AuthResponse> {
  console.log('🔐 [VERIFY OTP] Verifying OTP...', {
    phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'), // Mask phone number in logs
    otpLength: otp.length,
    endpoint: '/api/auth/verify-otp',
  });

  try {
    const { data } = await axiosInstance.post<VerifyOTPResponse>('/api/auth/verify-otp', {
      phoneNumber,
      otp,
    });
    
    console.log('✅ [VERIFY OTP SUCCESS]', {
      user: data.user,
      hasToken: !!data.token,
      tokenLength: data.token?.length,
    });

    return data;
  } catch (error) {
    // Error details already logged in http interceptor
    throw new Error(extractErrorMessage(error));
  }
}

export async function loginWithClass(classId: string, phoneNumber: string): Promise<AuthResponse> {
  console.log('🏫 [CLASS LOGIN] Logging in via class...', {
    classId,
    phoneNumber: phoneNumber.replace(/\d(?=\d{4})/g, '*'),
    endpoint: '/api/mcq/classes/login',
  });

  try {
    const { data } = await axiosInstance.post<AuthResponse>('/api/mcq/classes/login', {
      classId,
      phoneNumber,
    });

    console.log('✅ [CLASS LOGIN SUCCESS]', {
      userId: data.user?._id,
      className: (data.user as any)?.className,
      subscription: data.user?.subscription,
    });

    return data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
