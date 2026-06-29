import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

type ToastType = 'success' | 'error' | 'info'
interface Toast {
  id: number
  message: string
  type: ToastType
}

const ToastContext = createContext<(message: string, type?: ToastType) => void>(() => {})

export function useToast() {
  return useContext(ToastContext)
}

const tone: Record<ToastType, { icon: typeof CheckCircleIcon; cls: string }> = {
  success: { icon: CheckCircleIcon, cls: 'text-success' },
  error: { icon: ExclamationTriangleIcon, cls: 'text-error' },
  info: { icon: InformationCircleIcon, cls: 'text-signal-600 dark:text-signal-300' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const notify = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = Date.now() + Math.random()
      setToasts((t) => [...t, { id, message, type }])
      setTimeout(() => remove(id), 3800)
    },
    [remove],
  )

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const T = tone[t.type]
          return (
            <div
              key={t.id}
              className="pointer-events-auto flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-lg dark:border-white/10 dark:bg-ink"
            >
              <T.icon className={`mt-0.5 h-5 w-5 shrink-0 ${T.cls}`} />
              <p className="flex-1 text-sm text-slate-700 dark:text-slate-200">{t.message}</p>
              <button
                onClick={() => remove(t.id)}
                aria-label="Dismiss"
                className="text-slate-400 transition hover:text-slate-700 dark:hover:text-white"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
