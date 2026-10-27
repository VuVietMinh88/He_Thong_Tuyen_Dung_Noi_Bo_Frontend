import { AUTH_CHANNELS, AUTH_CONFIG, AUTH_SYNC_EVENTS } from '../constants/auth.constants';
import type { AuthSyncEventType, AuthSyncMessage, AuthSyncPayload, User } from '../types/auth';

type MessageHandler = (message: AuthSyncMessage) => void;

class AuthSyncService {
  private channel: BroadcastChannel | null = null;
  private senderId: string;
  private listeners: Set<MessageHandler> = new Set();
  private remoteRefreshingUntil = 0;

  constructor() {
    this.senderId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `tab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    this.initChannel();
  }

  public initChannel(): void {
    const BC =
      typeof BroadcastChannel !== 'undefined'
        ? BroadcastChannel
        : typeof window !== 'undefined' && (window as unknown as { BroadcastChannel?: typeof BroadcastChannel }).BroadcastChannel
        ? (window as unknown as { BroadcastChannel: typeof BroadcastChannel }).BroadcastChannel
        : null;

    if (!BC) {
      return;
    }

    try {
      if (this.channel) {
        try {
          this.channel.close();
        } catch {
          // Ignore
        }
      }

      this.channel = new BC(AUTH_CHANNELS.SYNC);
      this.channel.onmessage = (event: MessageEvent<AuthSyncMessage>) => {
        const message = event.data;
        if (!message || message.senderId === this.senderId) {
          return;
        }

        if (message.type === AUTH_SYNC_EVENTS.REFRESH_START) {
          this.remoteRefreshingUntil = Date.now() + AUTH_CONFIG.REMOTE_REFRESH_LOCK_TIMEOUT_MS;
        } else if (
          message.type === AUTH_SYNC_EVENTS.TOKEN_REFRESHED ||
          message.type === AUTH_SYNC_EVENTS.REFRESH_FAILED ||
          message.type === AUTH_SYNC_EVENTS.SESSION_EXPIRED
        ) {
          this.remoteRefreshingUntil = 0;
        }

        this.listeners.forEach((listener) => {
          try {
            listener(message);
          } catch (err) {
            console.error('Error in authSync listener:', err);
          }
        });
      };
    } catch (err) {
      console.warn('BroadcastChannel initialization failed, running in single-tab mode:', err);
      this.channel = null;
    }
  }

  public getSenderId(): string {
    return this.senderId;
  }

  public isRemoteRefreshing(): boolean {
    return Date.now() < this.remoteRefreshingUntil;
  }

  public postMessage(type: AuthSyncEventType, payload?: AuthSyncPayload): void {
    if (!this.channel) {
      // Re-try channel init if BroadcastChannel became available (e.g. stubbed in test)
      this.initChannel();
    }
    if (!this.channel) return;

    const message: AuthSyncMessage = {
      type,
      senderId: this.senderId,
      timestamp: Date.now(),
      payload,
    };

    try {
      this.channel.postMessage(message);
    } catch (err) {
      console.warn('Failed to post auth sync message:', err);
    }
  }

  public broadcastRefreshStart(): void {
    this.postMessage(AUTH_SYNC_EVENTS.REFRESH_START);
  }

  public broadcastTokenRefreshed(payload: {
    accessToken: string;
    refreshToken: string;
    user?: User;
  }): void {
    this.remoteRefreshingUntil = 0;
    this.postMessage(AUTH_SYNC_EVENTS.TOKEN_REFRESHED, payload);
  }

  public broadcastRefreshFailed(reason?: string): void {
    this.remoteRefreshingUntil = 0;
    this.postMessage(AUTH_SYNC_EVENTS.REFRESH_FAILED, { reason });
  }

  public broadcastLogin(payload: {
    accessToken: string;
    refreshToken: string;
    user: User;
  }): void {
    this.postMessage(AUTH_SYNC_EVENTS.LOGIN, payload);
  }

  public broadcastLogout(): void {
    this.remoteRefreshingUntil = 0;
    this.postMessage(AUTH_SYNC_EVENTS.LOGOUT);
  }

  public broadcastSessionExpired(redirectUrl?: string): void {
    this.remoteRefreshingUntil = 0;
    this.postMessage(AUTH_SYNC_EVENTS.SESSION_EXPIRED, { redirectUrl });
  }

  public subscribe(handler: MessageHandler): () => void {
    this.listeners.add(handler);
    return () => {
      this.listeners.delete(handler);
    };
  }

  public close(): void {
    if (this.channel) {
      try {
        this.channel.close();
      } catch {
        // Safe ignore
      }
      this.channel = null;
    }
    this.listeners.clear();
  }
}

export const authSyncService = new AuthSyncService();
