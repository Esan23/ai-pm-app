import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Logo } from './Logo'

/** Front-end-only sign-up, opened by any CTA via the #start URL hash. */
export function SignUpModal() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const sync = () => setOpen(window.location.hash === '#start')
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  const close = () => {
    history.pushState('', document.title, window.location.pathname + window.location.search)
    setOpen(false)
    setTimeout(() => setDone(false), 200)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && open && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    // Simulated — wire to real auth / waitlist before launch.
    setDone(true)
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

            {done ? (
              <div className="py-6 text-center">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-signal-500" />
                <h3 className="mt-4 font-display text-xl font-semibold text-slate-900 dark:text-white">
                  You&apos;re on the list.
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Your workspace is ready — jump in and turn a description into a plan.
                </p>
                <Link to="/app" onClick={close} className="btn-primary mt-6 w-full">
                  Open the workspace →
                </Link>
              </div>
            ) : (
              <>
                <Logo />
                <h3 className="mt-5 font-display text-xl font-semibold text-slate-900 dark:text-white">
                  Start free
                </h3>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                  Get your first project legible in minutes. No credit card.
                </p>
                <form onSubmit={submit} className="mt-5 space-y-3">
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-signal-500 focus:ring-2 focus:ring-signal-500/30 dark:border-white/15 dark:bg-white/5 dark:text-white"
                  />
                  <button type="submit" className="btn-primary w-full">
                    Get started
                  </button>
                </form>
                <p className="mt-4 text-center text-xs text-slate-400">
                  Demo sign-up — front-end only. No data is sent anywhere.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
