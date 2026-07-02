import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShieldCheckIcon, EnvelopeIcon, CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { Logo } from '../Logo'
import { useAuth } from '../../lib/auth'

/** Real admin sign-in (Supabase magic link) — shown when Supabase is configured. */
export function AdminSignInLive() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || busy) return
    setBusy(true)
    setError(null)
    try {
      await signInWithEmail(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the link.')
    } finally {
      setBusy(false)
    }
  }

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
          {sent ? (
            <div className="text-center">
              <CheckCircleIcon className="mx-auto h-12 w-12 text-signal-500" />
              <h1 className="mt-4 font-display text-h5 font-bold text-slate-900 dark:text-white">Check your email</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                We sent a sign-in link to <span className="font-medium">{email}</span>. Open it on this
                device to enter the admin console.
              </p>
            </div>
          ) : (
            <>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal-500/10 text-signal-600 dark:text-signal-300">
                <ShieldCheckIcon className="h-6 w-6" />
              </span>
              <h1 className="mt-4 font-display text-h4 font-bold text-slate-900 dark:text-white">Admin sign-in</h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Restricted to platform staff. We&apos;ll email you a magic link — no password.
              </p>
              <form onSubmit={submit} className="mt-6 space-y-3">
                <div className="relative">
                  <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="input-field pl-10"
                  />
                </div>
                {error && (
                  <p className="rounded-lg bg-error-50 px-3 py-2 text-xs text-error-600 dark:bg-error-500/10 dark:text-error-300">
                    {error}
                  </p>
                )}
                <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
                  {busy ? 'Sending…' : 'Email me a link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminNotAuthorized({ email, onSignOut }: { email?: string | null; onSignOut: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-4 dark:bg-ink">
      <div className="card w-full max-w-md p-7 text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-error/10 text-error">
          <ShieldCheckIcon className="h-6 w-6" />
        </span>
        <h1 className="mt-4 font-display text-h4 font-bold text-slate-900 dark:text-white">Not authorized</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {email ? <><span className="font-medium">{email}</span> isn&apos;t </> : 'This account isn&apos;t '}
          a Cairn platform admin. Ask a Super Administrator to grant you access.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={onSignOut} className="btn-ghost">Sign out</button>
          <Link to="/" className="btn-primary">Back to site</Link>
        </div>
      </div>
    </div>
  )
}

export function AdminLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-ink">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-signal-500 border-t-transparent" />
    </div>
  )
}
