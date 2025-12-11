export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: string;
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
