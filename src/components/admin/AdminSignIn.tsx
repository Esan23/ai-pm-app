import { Link } from 'react-router-dom'
import { ShieldCheckIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Logo } from '../Logo'
import { ROLES } from '../../lib/admin'
import { useAdminData } from '../../lib/adminStore'
import { signInAsAdmin } from '../../lib/adminAuth'

/**
 * Demo auth gate for /admin. Real deployments must gate this behind admin
 * authentication + server-side authorization (Supabase RLS); this front-end
 * picker only models the flow and which role drives the UI.
 */
export function AdminSignIn() {
  const { users } = useAdminData()
  const staff = users.filter((u) => u.adminRole)

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-ink">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
            <ArrowLeftIcon className="h-4 w-4" /> Back to site
          </Link>
        </div>

        <div className="card p-7">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal-500/10 text-signal-600 dark:text-signal-300">
            <ShieldCheckIcon className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-display text-h4 font-bold text-slate-900 dark:text-white">Admin sign-in</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            The admin console is restricted to staff. Choose an account to continue.
          </p>

          <div className="mt-6 space-y-2">
            {staff.map((u) => (
              <button
                key={u.id}
                onClick={() => signInAsAdmin(u.id)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left transition hover:border-signal-500/50 hover:bg-signal-500/[0.04] dark:border-white/10"
              >
                <span>
                  <span className="block text-sm font-medium text-slate-900 dark:text-white">{u.name}</span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">{u.email}</span>
                </span>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600 dark:bg-white/10 dark:text-slate-300">
                  {u.adminRole ? ROLES[u.adminRole].displayName : ''}
                </span>
              </button>
            ))}
          </div>

          <p className="mt-6 text-xs italic text-slate-400">
            Demo gate — not a real security boundary. Production enforces admin auth + Supabase RLS server-side.
          </p>
        </div>
      </div>
    </div>
  )
}
