import type { ToastOptions } from './ToastContext';

export * from './ToastContext';
export * from './ToastProvider';
export * from './useToast';
export * from './NotificationBell';
export * from './NotificationDropdown';
export * from './ToggleSwitch';
export * from './NotificationSettingsTable';
export * from '../../constants/notificationRoutes';
export * from '../../utils/notificationPermissionHelper';
export * from '../../hooks/useNotificationRouting';
export * from '../../hooks/useNotificationPreferences';
export * from '../../services/notificationSettingsService';

export const toast = {
  show: (options: ToastOptions | string) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: options }));
    }
  },
  success: (message: string, duration?: number) => {
    toast.show({ type: 'success', message, duration });
  },
  error: (message: string, duration?: number) => {
    toast.show({ type: 'error', message, duration });
  },
  warning: (message: string, duration?: number) => {
    toast.show({ type: 'warning', message, duration });
  },
  info: (message: string, duration?: number) => {
    toast.show({ type: 'info', message, duration });
  },
};

