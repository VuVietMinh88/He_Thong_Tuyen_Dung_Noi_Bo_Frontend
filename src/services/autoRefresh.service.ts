import axios from 'axios';
import { AUTH_CONFIG } from '../constants/auth.constants';
import { tokenService } from './token.service';
import { authSyncService } from './authSync.service';
import type { LoginResponse } from '../types/auth';

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'mousemove',
];

const REFRESH_COOLDOWN_MS = 60 * 1000; // 1 minute cooldown between activity refreshes

class AutoRefreshService {
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastActivityRefreshTime = 0;
  private isAutoRefreshing = false;
  private isListening = false;
  private boundOnActivity: (() => void) | null = null;

  /**
   * Parses the JWT payload to get expiration timestamp in milliseconds.
   */
  public getTokenExpirationMs(token: string | null): number | null {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length < 2) return null;
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const padLength = (4 - (base64.length % 4)) % 4;
      const paddedBase64 = base64.padEnd(base64.length + padLength, '=');
      if (typeof atob !== 'function') return null;
      const decodedJson = atob(paddedBase64);
      const payload = JSON.parse(decodedJson) as { exp?: number };
      return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  /**
   * Determines if the current access token is close to expiry (within 5 minutes).
   */
  public isTokenExpiringSoon(thresholdMs = 5 * 60 * 1000): boolean {
    const accessToken = tokenService.getAccessToken();
    if (!accessToken) return false;

    const expirationMs = this.getTokenExpirationMs(accessToken);
    if (!expirationMs) {
      // If not a JWT with exp, rely on cooldown-based activity refresh
      return Date.now() - this.lastActivityRefreshTime >= 5 * 60 * 1000;
    }

    return expirationMs - Date.now() <= thresholdMs;
  }

  /**
   * Silently refreshes the auth token in background.
   */
  public async refreshTokensSilently(): Promise<boolean> {
    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken || this.isAutoRefreshing || authSyncService.isRemoteRefreshing()) {
      return false;
    }

    this.isAutoRefreshing = true;
    authSyncService.broadcastRefreshStart();

    try {
      const baseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api/v1')
        .toString()
        .trim()
        .replace(/\/+$/, '');
      const normalizedBaseUrl = /\/api\/v1$/i.test(baseUrl)
        ? baseUrl
        : /\/v1$/i.test(baseUrl)
        ? baseUrl
        : `${baseUrl}/api/v1`;

      const response = await axios.post<LoginResponse>(
        `${normalizedBaseUrl}/auth/refresh`,
        { refreshToken },
        { headers: { 'Content-Type': 'application/json' }, timeout: AUTH_CONFIG.TOKEN_REFRESH_TIMEOUT_MS },
      );

      const data = response.data;
      if (data && data.accessToken && data.refreshToken) {
        tokenService.saveTokens(data.accessToken, data.refreshToken);
        if (data.user) {
          tokenService.setUserData(data.user);
        }
        this.lastActivityRefreshTime = Date.now();
        authSyncService.broadcastTokenRefreshed({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: data.user,
        });
        window.dispatchEvent(new Event('auth:changed'));
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Auto-refresh failed during user activity:', error);
      authSyncService.broadcastRefreshFailed();
      return false;
    } finally {
      this.isAutoRefreshing = false;
    }
  }

  /**
   * Debounced activity handler.
   */
  public handleUserActivity = (): void => {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(async () => {
      const accessToken = tokenService.getAccessToken();
      const refreshToken = tokenService.getRefreshToken();

      if (!accessToken || !refreshToken) {
        return;
      }

      // Check if cooldown has passed
      const now = Date.now();
      if (now - this.lastActivityRefreshTime < REFRESH_COOLDOWN_MS) {
        return;
      }

      // Trigger refresh if token is expiring soon or sufficient active time elapsed
      if (this.isTokenExpiringSoon()) {
        await this.refreshTokensSilently();
      }
    }, AUTH_CONFIG.ACTIVITY_DEBOUNCE_MS);
  };

  /**
   * Starts listening to user activity events.
   */
  public start(): void {
    if (this.isListening || typeof window === 'undefined') return;

    this.boundOnActivity = this.handleUserActivity;
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, this.boundOnActivity!, { passive: true });
    });
    this.isListening = true;
  }

  /**
   * Stops listening to user activity events and clears pending timers.
   */
  public stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    if (this.isListening && typeof window !== 'undefined' && this.boundOnActivity) {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, this.boundOnActivity!);
      });
      this.boundOnActivity = null;
      this.isListening = false;
    }
  }
}

export const autoRefreshService = new AutoRefreshService();
