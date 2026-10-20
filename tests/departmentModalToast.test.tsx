import { describe, expect, it, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import DepartmentModal from '../src/components/Organization/DepartmentModal';
import ToastProvider from '../src/components/notifications/ToastProvider';
import { ToastContext, type ToastContextValue } from '../src/components/notifications/ToastContext';

describe('Department Modal & Toast Notification (Task 4)', () => {
  describe('DepartmentModal Backdrop Fix', () => {
    it('uses bg-slate-900/40 backdrop-blur-xs instead of invalid bg-black bg-opacity-50', () => {
      const html = renderToString(
        <DepartmentModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          mode="add"
          managers={[]}
          departments={[]}
        />
      );

      // Verify the fix for Tailwind v4 backdrop bug
      expect(html).not.toContain('bg-black bg-opacity-50');
      expect(html).toContain('bg-slate-900/40');
      expect(html).toContain('backdrop-blur-xs');
      expect(html).toContain('Thêm mới Phòng ban');
    });

    it('returns null when isOpen is false', () => {
      const html = renderToString(
        <DepartmentModal
          isOpen={false}
          onClose={vi.fn()}
          onSubmit={vi.fn()}
          mode="add"
          managers={[]}
          departments={[]}
        />
      );

      expect(html).toBe('');
    });
  });

  describe('Global Toast Notification with bottom-right positioning', () => {
    it('renders bottom-right notification container in ToastProvider', () => {
      const html = renderToString(
        <ToastProvider>
          <div>App Content</div>
        </ToastProvider>
      );

      // Verify both top-right and bottom-right containers exist
      expect(html).toContain('fixed top-4 right-4 z-[9999]');
      expect(html).toContain('fixed bottom-4 right-4 z-[9999]');
      expect(html).toContain('Thông báo hệ thống góc dưới');
    });

    it('provides addToast and notify methods accepting bottom-right position in ToastContext', () => {
      let capturedContext: ToastContextValue | null = null;

      const TestConsumer = () => {
        capturedContext = React.useContext(ToastContext);
        return <div>Consumer</div>;
      };

      renderToString(
        <ToastProvider>
          <TestConsumer />
        </ToastProvider>
      );

      expect(capturedContext).not.toBeNull();
      const ctx = capturedContext as unknown as ToastContextValue;
      expect(typeof ctx.addToast).toBe('function');
      expect(typeof ctx.notify).toBe('function');
      expect(typeof ctx.success).toBe('function');
    });
  });
});
