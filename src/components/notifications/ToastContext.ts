import { createContext } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-right' | 'bottom-right';

export interface ToastOptions {
  type?: ToastType;
  message: string;
  duration?: number;
  position?: ToastPosition;
}

export interface ToastContextValue {
  notify: (message: string, type?: ToastType, duration?: number, position?: ToastPosition) => void;
  addToast: (options: ToastOptions | string) => void;
  removeToast: (id: string | number) => void;
  success: (message: string, duration?: number, position?: ToastPosition) => void;
  error: (message: string, duration?: number, position?: ToastPosition) => void;
  warning: (message: string, duration?: number, position?: ToastPosition) => void;
  info: (message: string, duration?: number, position?: ToastPosition) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

