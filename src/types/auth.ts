export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: string;
  roles?: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  refreshExpiresAt?: string;
  user: User;
}

export interface ApiError {
  message: string;
}
