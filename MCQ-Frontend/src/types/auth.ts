export interface User {
  _id: string;
  fullName: string;
  email?: string; // Optional for OTP-based login
  phoneNumber?: string; // Phone number for OTP login
  role: string;
  group?: 'PCM' | 'PCB' | 'PCMB' | null;
  subscription?: 'free' | 'premium';
  // Optional profile image URL (local or remote) for avatar
  avatarUrl?: string | null;
  // Optional coaching class association for class-based premium users
  classId?: string | null;
  className?: string | null;
  classLogoUrl?: string | null;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user: User;
  token: string;
}

export interface ProfileResponse {
  success: boolean;
  user: User;
}

export interface SendOTPResponse {
  success: boolean;
  message?: string;
  expiresIn?: number; // OTP expiry time in seconds
}

export interface VerifyOTPResponse extends AuthResponse {
  // Same as AuthResponse - returns user and token after successful verification
}
