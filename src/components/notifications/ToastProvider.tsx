import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ToastContext } from './ToastContext'
import type { ToastType } from './ToastContext'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastProviderProps {
  children: ReactNode
}

const toastStyles: Record<ToastType, { icon: string; color: string }> = {
  success: { icon: '✓', color: 'border-green-500 bg-green-50 text-green-800' },
  error: { icon: '!', color: 'border-red-500 bg-red-50 text-red-800' },
  warning: { icon: '!', color: 'border-yellow-500 bg-yellow-50 text-yellow-900' },
  info: { icon: 'i', color: 'border-blue-500 bg-blue-50 text-blue-800' },
}

function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(0)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const notify = useCallback((message: string, type: ToastType = 'info', duration = 4000) => {
    const id = nextId.current++
    setToasts((current) => [...current, { id, message, type }])

    if (duration > 0) {
      timers.current.set(id, setTimeout(() => dismiss(id), duration))
    }
  }, [dismiss])

  useEffect(() => () => {
    timers.current.forEach(clearTimeout)
    timers.current.clear()
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div
        aria-label="Thông báo"
        className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6"
      >
        {toasts.map((toast) => {
          const style = toastStyles[toast.type]

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 rounded-lg border-l-4 px-4 py-3 shadow-lg shadow-slate-900/10 transition-all ${style.color}`}
              role={toast.type === 'error' ? 'alert' : 'status'}
              aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
            >
              <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-sm font-bold">
                {style.icon}
              </span>
              <p className="flex-1 pt-0.5 text-sm font-medium">{toast.message}</p>
              <button
                type="button"
                aria-label="Đóng thông báo"
                onClick={() => dismiss(toast.id)}
                className="rounded p-1 text-current opacity-70 transition hover:bg-black/5 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export default ToastProvider
