import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { XMarkIcon, CheckCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import { Logo } from './Logo'

type Result = 'magic' | 'sim'

/**
 * Sign-up, opened by any CTA via the #start URL hash. Uses real Supabase
 * magic-link auth when configured (Supabase is dynamically imported on submit
 * so it stays out of the landing bundle); falls back to a simulated success
 * that opens the guest workspace when unconfigured.
 */
export function SignUpModal() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const sync = () => setOpen(window.location.hash === '#start')
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const close = () => {
    history.pushState('', document.title, window.location.pathname + window.location.search)
    setOpen(false)
    setTimeout(() => {
      setResult(null)
      setError(null)
    }, 200)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && open && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!value || busy) return
    setBusy(true)
    setError(null)
    try {
      // Dynamic import keeps @supabase/supabase-js out of the landing bundle.
      const { supabase, isSupabaseConfigured } = await import('../lib/supabase')
      if (isSupabaseConfigured && supabase) {
        const { error: err } = await supabase.auth.signInWithOtp({
          email: value,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        })
        if (err) throw err
        setResult('magic')
      } else {
        setResult('sim')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={close} />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-2xl dark:border-white/10 dark:bg-ink"
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            {result === 'magic' ? (
              <div className="py-4 text-center">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-signal-500" />
                <h3 className="mt-4 font-display text-h5 font-semibold text-slate-900 dark:text-white">
                  Check your email
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  We sent a magic sign-in link to <span className="font-medium">{email}</span>. Open
                  it to start — your workspace will sync to your account.
                </p>
                <button onClick={close} className="btn-ghost mt-6 w-full">
                  Done
                </button>
              </div>
            ) : result === 'sim' ? (
              <div className="py-4 text-center">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-signal-500" />
                <h3 className="mt-4 font-display text-h5 font-semibold text-slate-900 dark:text-white">
                  You&apos;re in.
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Your guest workspace is ready — jump in and turn a description into a plan.
                </p>
                <Link to="/app" onClick={close} className="btn-primary mt-6 w-full">
                  Open the workspace →
                </Link>
              </div>
            ) : (
              <>
                <Logo />
                <h3 className="mt-5 font-display text-h5 font-semibold text-slate-900 dark:text-white">
                  Start free
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                  Get your first project legible in minutes. No password, no credit card.
                </p>
                <form onSubmit={submit} className="mt-5 space-y-3">
                  <div className="relative">
                    <EnvelopeIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pl-10 text-sm text-slate-900 outline-none transition focus:border-signal-500 focus:ring-2 focus:ring-signal-500/30 dark:border-white/15 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                  {error && (
                    <p className="rounded-lg bg-error-50 px-3 py-2 text-xs text-error-600 dark:bg-error-500/10 dark:text-error-300">
                      {error}
                    </p>
                  )}
                  <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
                    {busy ? 'Sending…' : 'Get started'}
                  </button>
                </form>
                <p className="mt-4 text-center text-xs text-slate-400">
                  You can also{' '}
                  <Link to="/app" onClick={close} className="font-medium text-signal-600 hover:underline dark:text-signal-400">
                    explore as a guest
                  </Link>{' '}
                  first.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
