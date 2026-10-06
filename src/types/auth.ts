export interface User {
  id: string;
  email: string;
  role?: string;
  roles?: string[];
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface ApiError {
  message: string;
}
