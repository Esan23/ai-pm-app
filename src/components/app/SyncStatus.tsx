import {
  ArrowPathIcon,
  CheckCircleIcon,
  CloudIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { retrySync, useSyncState } from '../../lib/store'

/**
 * Tells the user whether their work actually reached the server. The previous
 * store swallowed every write failure, so "I typed it, therefore it's saved"
 * was an assumption rather than a fact.
 */
export function SyncStatus() {
  const sync = useSyncState()

  const base =
    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold'

  if (sync.status === 'guest') {
    return (
      <span
        className={`${base} bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300`}
        title="Sign in to sync this workspace across devices"
      >
        <CloudIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Guest · saved in this browser</span>
        <span className="sm:hidden">Guest</span>
      </span>
    )
  }

  if (sync.status === 'error') {
    return (
      <span
        className={`${base} bg-error-100 text-error-700 dark:bg-error-500/15 dark:text-error-300`}
        title={sync.message}
      >
        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Not saved</span>
        <button
          onClick={retrySync}
          className="underline underline-offset-2 hover:no-underline"
        >
          Retry
        </button>
      </span>
    )
  }

  if (sync.status === 'loading' || sync.status === 'saving') {
    return (
      <span className={`${base} bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300`}>
        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
        {sync.status === 'loading' ? 'Loading…' : 'Saving…'}
      </span>
    )
  }

  return (
    <span
      className={`${base} bg-signal-500/10 text-signal-700 dark:text-signal-300`}
      title={`Last saved ${new Date(sync.at).toLocaleTimeString()}`}
    >
      <CheckCircleIcon className="h-3.5 w-3.5" />
      Saved
    </span>
  )
}
