export interface User {
  id: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
  refreshToken?: string;
}

export interface ApiError {
  message: string;
}
