export interface User {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
  roles?: string[];
}

export interface LoginResponse {
  token: string;
  refreshToken?: string;
  user: User;
}

export interface ApiError {
  message: string;
}
