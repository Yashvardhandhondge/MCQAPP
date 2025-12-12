export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
  group?: 'PCM' | 'PCB' | 'PCMB' | null;
  subscription?: 'free' | 'premium';
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
