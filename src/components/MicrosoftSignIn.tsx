import { useEffect, useState } from 'react'

/**
 * "Continue with Microsoft" — shown only when the provider is actually enabled.
 *
 * Supabase reports which external providers a project has configured at
 * /auth/v1/settings, so this button appears by itself the moment Microsoft is
 * switched on in the dashboard, and stays hidden until then. No feature flag to
 * remember, and no dead button offered to users while it is unconfigured.
 *
 * Self-contained on purpose: the landing page's sign-up modal lives outside
 * AuthProvider, and its Supabase import is dynamic so the client stays out of
 * the landing bundle. Both are preserved here.
 */

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

let cached: Promise<boolean> | null = null

/** Is the Microsoft (Entra) provider enabled on this project? */
function microsoftEnabled(): Promise<boolean> {
  if (!URL_ || !KEY) return Promise.resolve(false)
  if (!cached) {
    cached = fetch(`${URL_}/auth/v1/settings`, { headers: { apikey: KEY } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => Boolean(d?.external?.azure))
      .catch(() => false)
  }
  return cached
}

interface Props {
  /** Where Microsoft should return to. Defaults to the magic-link callback. */
  redirectTo?: string
  onError?: (message: string) => void
}

export function MicrosoftSignIn({ redirectTo, onError }: Props) {
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    void microsoftEnabled().then((v) => {
      if (alive) setEnabled(v)
    })
    return () => {
      alive = false
    }
  }, [])

  if (!enabled) return null

  const start = async () => {
    setBusy(true)
    try {
      const { supabase } = await import('../lib/supabase')
      if (!supabase) throw new Error('Auth is not configured')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: redirectTo ?? `${window.location.origin}/auth/callback`,
          // openid/email/profile is the minimum that yields a usable identity;
          // asking for more would be a consent prompt nobody needs to read.
          scopes: 'openid email profile',
        },
      })
      if (error) throw error
      // On success the browser navigates to Microsoft; nothing after this runs.
    } catch (e) {
      setBusy(false)
      onError?.(e instanceof Error ? e.message : 'Could not start Microsoft sign-in.')
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
      >
        {/* Microsoft's four squares, per their brand guidance for sign-in buttons. */}
        <svg aria-hidden viewBox="0 0 21 21" className="h-4 w-4">
          <rect x="1" y="1" width="9" height="9" fill="#f25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
          <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
        </svg>
        {busy ? 'Redirecting…' : 'Continue with Microsoft'}
      </button>

      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </div>
    </>
  )
}
