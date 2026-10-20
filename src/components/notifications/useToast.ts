import { useContext } from 'react';
import { ToastContext } from './ToastContext';
import type { ToastContextValue, ToastOptions, ToastType } from './ToastContext';

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast phải được sử dụng bên trong ToastProvider.');
  }
  return context;
}

export type { ToastContextValue, ToastOptions, ToastType };
export default useToast;
