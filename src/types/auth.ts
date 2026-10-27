export interface User {
  id: string;
  email: string;
  fullName: string;
  roles: string[];
  departmentId?: string;
  departmentName?: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshExpiresAt: string;
  user: User;
}

export interface ApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  refreshExpiresAt?: string;
}

export type AuthSyncEventType =
  | 'AUTH_REFRESH_START'
  | 'AUTH_TOKEN_REFRESHED'
  | 'AUTH_REFRESH_FAILED'
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'AUTH_SESSION_EXPIRED';

export interface AuthSyncPayload {
  accessToken?: string;
  refreshToken?: string;
  user?: User;
  reason?: string;
  redirectUrl?: string;
}

export interface AuthSyncMessage {
  type: AuthSyncEventType;
  senderId: string;
  timestamp: number;
  payload?: AuthSyncPayload;
}
