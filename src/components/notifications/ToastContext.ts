import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  type?: ToastType;
  message: string;
  duration?: number;
}

export interface ToastContextValue {
  notify: (message: string, type?: ToastType, duration?: number) => void;
  addToast: (options: ToastOptions | string) => void;
  removeToast: (id: string | number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
