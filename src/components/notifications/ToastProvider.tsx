import { useCallback, useEffect, useRef, useState, type FC, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { ToastContext } from './ToastContext';
import type { ToastContextValue, ToastOptions, ToastType } from './ToastContext';

export interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

export interface ToastProviderProps {
  children: ReactNode;
}

const DEFAULT_DURATION_MS = 3000;

interface ToastTypeStyle {
  icon: ReactNode;
  borderClass: string;
  badgeClass: string;
  label: string;
}

const TOAST_STYLES: Record<ToastType, ToastTypeStyle> = {
  success: {
    icon: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" strokeWidth={2.2} />,
    borderClass: 'border-l-4 border-l-emerald-500',
    badgeClass: 'text-emerald-700 bg-emerald-50',
    label: 'Thành công',
  },
  error: {
    icon: <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" strokeWidth={2.2} />,
    borderClass: 'border-l-4 border-l-rose-500',
    badgeClass: 'text-rose-700 bg-rose-50',
    label: 'Lỗi',
  },
  warning: {
    icon: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" strokeWidth={2.2} />,
    borderClass: 'border-l-4 border-l-amber-500',
    badgeClass: 'text-amber-700 bg-amber-50',
    label: 'Cảnh báo',
  },
  info: {
    icon: <Info className="h-5 w-5 text-blue-500 shrink-0" strokeWidth={2.2} />,
    borderClass: 'border-l-4 border-l-blue-500',
    badgeClass: 'text-blue-700 bg-blue-50',
    label: 'Thông tin',
  },
};

export const ToastProvider: FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, type: ToastType = 'info', duration: number = DEFAULT_DURATION_MS) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, message, type }]);

      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration),
        );
      }
    },
    [dismiss],
  );

  const addToast = useCallback(
    (options: ToastOptions | string) => {
      if (typeof options === 'string') {
        notify(options, 'info', DEFAULT_DURATION_MS);
      } else {
        notify(options.message, options.type ?? 'info', options.duration ?? DEFAULT_DURATION_MS);
      }
    },
    [notify],
  );

  const removeToast = useCallback(
    (id: string | number) => {
      dismiss(typeof id === 'number' ? id : Number(id));
    },
    [dismiss],
  );

  const success = useCallback(
    (message: string, duration?: number) => notify(message, 'success', duration),
    [notify],
  );

  const error = useCallback(
    (message: string, duration?: number) => notify(message, 'error', duration),
    [notify],
  );

  const warning = useCallback(
    (message: string, duration?: number) => notify(message, 'warning', duration),
    [notify],
  );

  const info = useCallback(
    (message: string, duration?: number) => notify(message, 'info', duration),
    [notify],
  );

  // Global window listener for external dispatches (e.g. Axios interceptor or non-react helpers)
  useEffect(() => {
    const handleGlobalToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastOptions | string>;
      if (customEvent.detail) {
        addToast(customEvent.detail);
      }
    };

    window.addEventListener('app:toast', handleGlobalToast);
    return () => {
      window.removeEventListener('app:toast', handleGlobalToast);
    };
  }, [addToast]);

  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    };
  }, []);

  const contextValue: ToastContextValue = {
    notify,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        aria-label="Thông báo hệ thống"
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-sm sm:max-w-md"
      >
        {toasts.map((toast) => {
          const style = TOAST_STYLES[toast.type] ?? TOAST_STYLES.info;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xl shadow-slate-900/10 transition-all duration-300 animate-toast-slide-in ${style.borderClass}`}
              role={toast.type === 'error' ? 'alert' : 'status'}
              aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            >
              <div className="mt-0.5">{style.icon}</div>
              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={`inline-block rounded px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider ${style.badgeClass}`}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-800 leading-snug break-words">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={() => dismiss(toast.id)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
