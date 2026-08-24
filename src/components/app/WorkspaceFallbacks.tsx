import { useState } from 'react'
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { createTeamAndSwitch, retrySync } from '../../lib/store'

/**
 * What to show when there is no project on screen.
 *
 * These used to collapse into one message — "nothing has been shared with you"
 * — which was rendered whenever `canEdit` was false. But `canEdit` is false
 * both for a viewer and for a session whose team never loaded, so a failed
 * write announced itself as a calm, confident empty state. A load that failed
 * has to look different from a workspace that is genuinely empty.
 */

const SHELL =
  'mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-white/[0.03]'

/** The last operation failed and there is nothing cached to fall back on. */
export function LoadFailed({ message }: { message: string }) {
  const [retrying, setRetrying] = useState(false)

  return (
    <div className={`${SHELL} border-error-200 dark:border-error-500/30`}>
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-error-100 dark:bg-error-500/15">
        <ExclamationTriangleIcon className="h-6 w-6 text-error-600 dark:text-error-400" />
      </div>
      <h2 className="mt-4 font-display text-h5 font-bold text-slate-900 dark:text-white">
        We couldn&apos;t load this workspace
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Your work is safe — nothing was lost. This is a problem reaching the server, not a problem
        with your data.
      </p>
      {message && (
        <p className="mt-3 break-words rounded-lg bg-slate-50 px-3 py-2 text-left font-mono text-[11px] text-slate-600 dark:bg-white/5 dark:text-slate-400">
          {message}
        </p>
      )}
      <button
        onClick={() => {
          setRetrying(true)
          retrySync()
          window.setTimeout(() => setRetrying(false), 1500)
        }}
        className="btn-primary mt-5 px-4 py-2 text-sm"
      >
        <ArrowPathIcon className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
        Try again
      </button>
    </div>
  )
}

/**
 * Signed in, but no team exists. A team is normally created on first sign-in,
 * so reaching this means that failed — offer the action rather than a shrug.
 */
export function NoTeam() {
  const [busy, setBusy] = useState(false)

  return (
    <div className={SHELL}>
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-signal-500/10">
        <UserGroupIcon className="h-6 w-6 text-signal-500" />
      </div>
      <h2 className="mt-4 font-display text-h5 font-bold text-slate-900 dark:text-white">
        Your workspace isn&apos;t set up yet
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Every project belongs to a team, and yours hasn&apos;t been created. This usually happens
        automatically when you sign in.
      </p>
      <button
        onClick={() => {
          setBusy(true)
          void createTeamAndSwitch('My Workspace').finally(() => setBusy(false))
        }}
        disabled={busy}
        className="btn-primary mt-5 px-4 py-2 text-sm disabled:opacity-50"
      >
        {busy ? 'Creating…' : 'Create my workspace'}
      </button>
    </div>
  )
}

/** A real viewer in a real team that simply has no projects yet. */
export function NothingShared({ teamName }: { teamName: string | null }) {
  return (
    <div className={SHELL}>
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 dark:bg-white/10">
        <EyeIcon className="h-6 w-6 text-slate-400" />
      </div>
      <h2 className="mt-4 font-display text-h5 font-bold text-slate-900 dark:text-white">
        Nothing shared with you yet
      </h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        You have view-only access to {teamName ? <strong>{teamName}</strong> : 'this team'}. Projects
        will show up here as soon as someone creates one.
      </p>
    </div>
  )
}
