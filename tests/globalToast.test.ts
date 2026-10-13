import { afterEach, describe, expect, it, vi } from 'vitest';
import { toast } from '../src/components/notifications';
import type { ToastType } from '../src/components/notifications';

describe('Global Toast Notification System (AC 1, AC 2, AC 3)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('Standalone Toast Dispatcher & Types (AC 3)', () => {
    it('dispatches app:toast custom events when window is available', () => {
      const dispatchedEvents: CustomEvent[] = [];
      vi.stubGlobal('window', {
        dispatchEvent: (event: CustomEvent) => {
          dispatchedEvents.push(event);
          return true;
        },
      });

      // 1. Success toast
      toast.success('Đăng nhập thành công!');
      expect(dispatchedEvents.length).toBe(1);
      expect(dispatchedEvents[0].type).toBe('app:toast');
      expect(dispatchedEvents[0].detail).toEqual({
        type: 'success',
        message: 'Đăng nhập thành công!',
        duration: undefined,
      });

      // 2. Error toast
      toast.error('Mật khẩu không chính xác!');
      expect(dispatchedEvents.length).toBe(2);
      expect(dispatchedEvents[1].detail).toEqual({
        type: 'error',
        message: 'Mật khẩu không chính xác!',
        duration: undefined,
      });

      // 3. Warning toast
      toast.warning('Tài khoản sắp bị khóa tạm thời!');
      expect(dispatchedEvents.length).toBe(3);
      expect(dispatchedEvents[2].detail).toEqual({
        type: 'warning',
        message: 'Tài khoản sắp bị khóa tạm thời!',
        duration: undefined,
      });

      // 4. Info toast
      toast.info('Hệ thống đang bảo trì');
      expect(dispatchedEvents.length).toBe(4);
      expect(dispatchedEvents[3].detail).toEqual({
        type: 'info',
        message: 'Hệ thống đang bảo trì',
        duration: undefined,
      });
    });

    it('safely does nothing when window is undefined (SSR safe)', () => {
      vi.stubGlobal('window', undefined);
      expect(() => {
        toast.success('SSR message');
        toast.error('SSR error');
      }).not.toThrow();
    });

    it('supports custom duration parameter in toast helpers', () => {
      const dispatchedEvents: CustomEvent[] = [];
      vi.stubGlobal('window', {
        dispatchEvent: (event: CustomEvent) => {
          dispatchedEvents.push(event);
          return true;
        },
      });

      toast.success('Lưu thành công!', 5000);
      expect(dispatchedEvents[0].detail).toEqual({
        type: 'success',
        message: 'Lưu thành công!',
        duration: 5000,
      });
    });

    it('verifies all expected ToastType variants exist', () => {
      const validTypes: ToastType[] = ['success', 'error', 'warning', 'info'];
      expect(validTypes).toHaveLength(4);
      expect(validTypes).toContain('success');
      expect(validTypes).toContain('error');
      expect(validTypes).toContain('warning');
      expect(validTypes).toContain('info');
    });
  });
});

