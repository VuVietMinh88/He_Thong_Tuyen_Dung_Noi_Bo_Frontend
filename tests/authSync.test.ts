import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authSyncService } from '../src/services/authSync.service';
import { AUTH_CHANNELS, AUTH_SYNC_EVENTS } from '../src/constants/auth.constants';
import type { AuthSyncMessage } from '../src/types/auth';

class MockBroadcastChannel {
  name: string;
  onmessage: ((event: MessageEvent<AuthSyncMessage>) => void) | null = null;
  static instances: MockBroadcastChannel[] = [];

  constructor(name: string) {
    this.name = name;
    MockBroadcastChannel.instances.push(this);
  }

  postMessage(data: AuthSyncMessage): void {
    // Deliver to all other instances listening to the same channel
    MockBroadcastChannel.instances.forEach((instance) => {
      if (instance !== this && instance.name === this.name && instance.onmessage) {
        instance.onmessage(new MessageEvent('message', { data }));
      }
    });
  }

  close(): void {
    const idx = MockBroadcastChannel.instances.indexOf(this);
    if (idx !== -1) {
      MockBroadcastChannel.instances.splice(idx, 1);
    }
  }

  static reset(): void {
    MockBroadcastChannel.instances = [];
  }
}

describe('Multi-tab Token Sync (BroadcastChannel)', () => {
  beforeEach(() => {
    MockBroadcastChannel.reset();
    vi.stubGlobal('BroadcastChannel', MockBroadcastChannel);
    if (typeof window !== 'undefined') {
      (window as unknown as { BroadcastChannel?: unknown }).BroadcastChannel = MockBroadcastChannel;
    }
    authSyncService.initChannel();
  });

  afterEach(() => {
    authSyncService.close();
    vi.unstubAllGlobals();
  });

  it('broadcasts REFRESH_START and marks remote refresh in progress for other tabs', () => {
    // Other tab connects to the channel
    const otherTabChannel = new MockBroadcastChannel(AUTH_CHANNELS.SYNC);
    const receivedMessages: AuthSyncMessage[] = [];
    otherTabChannel.onmessage = (event) => receivedMessages.push(event.data);

    expect(authSyncService.isRemoteRefreshing()).toBe(false);

    // Current tab starts refreshing
    authSyncService.broadcastRefreshStart();

    expect(receivedMessages).toHaveLength(1);
    expect(receivedMessages[0].type).toBe(AUTH_SYNC_EVENTS.REFRESH_START);
    expect(receivedMessages[0].senderId).toBe(authSyncService.getSenderId());
  });

  it('prevents redundant refresh API calls by detecting remote refresh from another tab', () => {
    // Simulating remote tab sending REFRESH_START to current tab
    const remoteTab = new MockBroadcastChannel(AUTH_CHANNELS.SYNC);

    expect(authSyncService.isRemoteRefreshing()).toBe(false);

    remoteTab.postMessage({
      type: AUTH_SYNC_EVENTS.REFRESH_START,
      senderId: 'remote-tab-999',
      timestamp: Date.now(),
    });

    // Current tab detects that remote tab is already refreshing
    expect(authSyncService.isRemoteRefreshing()).toBe(true);

    // Remote tab completes refresh
    remoteTab.postMessage({
      type: AUTH_SYNC_EVENTS.TOKEN_REFRESHED,
      senderId: 'remote-tab-999',
      timestamp: Date.now(),
      payload: {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      },
    });

    // Remote lock is released
    expect(authSyncService.isRemoteRefreshing()).toBe(false);
  });

  it('syncs token refreshed payload to subscribers across tabs', () => {
    const handler = vi.fn();
    const unsubscribe = authSyncService.subscribe(handler);

    const remoteTab = new MockBroadcastChannel(AUTH_CHANNELS.SYNC);
    remoteTab.postMessage({
      type: AUTH_SYNC_EVENTS.TOKEN_REFRESHED,
      senderId: 'tab-hr-02',
      timestamp: Date.now(),
      payload: {
        accessToken: 'token-synced-123',
        refreshToken: 'refresh-synced-456',
        user: {
          id: 'u-1',
          email: 'hr@smartrecruitment.vn',
          fullName: 'HR User',
          roles: ['HR_MANAGER'],
        },
      },
    });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: AUTH_SYNC_EVENTS.TOKEN_REFRESHED,
        payload: expect.objectContaining({
          accessToken: 'token-synced-123',
        }),
      }),
    );

    unsubscribe();
  });

  it('broadcasts LOGOUT event to other tabs', () => {
    const otherTabChannel = new MockBroadcastChannel(AUTH_CHANNELS.SYNC);
    const received: AuthSyncMessage[] = [];
    otherTabChannel.onmessage = (event) => received.push(event.data);

    authSyncService.broadcastLogout();

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe(AUTH_SYNC_EVENTS.LOGOUT);
  });

  it('broadcasts SESSION_EXPIRED event with redirectUrl', () => {
    const otherTabChannel = new MockBroadcastChannel(AUTH_CHANNELS.SYNC);
    const received: AuthSyncMessage[] = [];
    otherTabChannel.onmessage = (event) => received.push(event.data);

    authSyncService.broadcastSessionExpired('/dashboard/candidates');

    expect(received).toHaveLength(1);
    expect(received[0].type).toBe(AUTH_SYNC_EVENTS.SESSION_EXPIRED);
    expect(received[0].payload?.redirectUrl).toBe('/dashboard/candidates');
  });
});
