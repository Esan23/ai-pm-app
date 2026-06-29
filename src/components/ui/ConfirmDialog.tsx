import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { useModal } from '../../hooks/useModal'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

/** Render only when a confirmation is pending (mount = open). */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  const ref = useModal<HTMLDivElement>(onCancel)

  return (
    <div className="fixed inset-0 z-[55] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="card relative w-full max-w-sm p-6"
      >
        <div className="flex items-start gap-3">
          {tone === 'danger' && (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-error/10 text-error">
              <ExclamationTriangleIcon className="h-5 w-5" />
            </span>
          )}
          <div>
            <h2 id="confirm-title" className="font-display text-h5 font-bold text-slate-900 dark:text-white">
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onCancel} className="btn-ghost">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={
              tone === 'danger'
                ? 'inline-flex items-center justify-center gap-2 rounded-xl bg-error px-5 py-3 text-sm font-semibold text-white transition hover:bg-error-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-error/50'
                : 'btn-primary'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
