import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { XMarkIcon, EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Logo } from '../Logo'
import { useAuth } from '../../lib/auth'

export function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (open) {
      setSent(false)
      setError(null)
      setEmail('')
    }
  }, [open])

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
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
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
              onClick={onClose}
              aria-label="Close"
              className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            {sent ? (
              <div className="py-4 text-center">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-signal-500" />
                <h3 className="mt-4 font-display text-xl font-semibold text-slate-900 dark:text-white">
                  Check your email
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  We sent a magic sign-in link to <span className="font-medium">{email}</span>. Open
                  it on this device to continue — your workspace will sync to your account.
                </p>
                <button onClick={onClose} className="btn-ghost mt-6 w-full">
                  Done
                </button>
              </div>
            ) : (
              <>
                <Logo />
                <h3 className="mt-5 font-display text-xl font-semibold text-slate-900 dark:text-white">
                  Sign in to sync
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                  Save your workspace and pick it up on any device. We&apos;ll email you a magic link —
                  no password.
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
                    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-300">
                      {error}
                    </p>
                  )}
                  <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-60">
                    {busy ? 'Sending…' : 'Email me a link'}
                  </button>
                </form>
                <p className="mt-4 text-center text-xs text-slate-400">
                  Your current guest workspace will be saved to your account on first sign-in.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
