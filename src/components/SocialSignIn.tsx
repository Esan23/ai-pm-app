import { useEffect, useState } from 'react'
import type { Provider as OAuthProvider } from '@supabase/supabase-js'

/**
 * One-click sign-in for whichever OAuth providers this project has enabled.
 *
 * Supabase reports enabled providers at /auth/v1/settings, so buttons appear by
 * themselves the moment one is switched on in the dashboard, and stay hidden
 * until then. No feature flag to remember, and no dead button offered to users.
 *
 * Deliberately not tied to a single provider: registering an app is the part
 * that depends on accounts and admin rights someone may not have — a personal
 * Microsoft account often cannot register an Entra app at all. Whichever one is
 * available is the right one, and adding another later needs no code change.
 *
 * Self-contained on purpose: the landing page's sign-up modal renders outside
 * AuthProvider, and its Supabase import is dynamic so the client stays out of
 * the landing bundle. Both are preserved here.
 */

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

interface ProviderSpec {
  /** Supabase's provider id, which is also the key in /auth/v1/settings. */
  id: OAuthProvider
  label: string
  icon: JSX.Element
}

/** Ordered by how easily a solo founder can register the app. */
const PROVIDERS: ProviderSpec[] = [
  {
    id: 'github',
    label: 'GitHub',
    icon: (
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12.01 12.01 0 0024 12.5C24 5.87 18.63.5 12 .5z" />
      </svg>
    ),
  },
  {
    id: 'google',
    label: 'Google',
    icon: (
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4">
        <path
          fill="#4285F4"
          d="M23.06 12.25c0-.85-.08-1.67-.22-2.45H12v4.64h6.2a5.3 5.3 0 01-2.3 3.48v2.9h3.72c2.18-2 3.44-4.96 3.44-8.57z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.1 0 5.7-1.03 7.62-2.79l-3.72-2.88c-1.03.69-2.35 1.1-3.9 1.1-2.98 0-5.5-2.01-6.4-4.72H1.75v2.97A11.99 11.99 0 0012 24z"
        />
        <path fill="#FBBC05" d="M5.6 14.71a7.2 7.2 0 010-4.6V7.14H1.75a12 12 0 000 10.53l3.85-2.96z" />
        <path
          fill="#EA4335"
          d="M12 4.75c1.68 0 3.19.58 4.38 1.72l3.28-3.28C17.7 1.2 15.1 0 12 0 7.3 0 3.25 2.7 1.75 7.14L5.6 10.1C6.5 7.4 9.02 4.75 12 4.75z"
        />
      </svg>
    ),
  },
  {
    id: 'azure',
    label: 'Microsoft',
    icon: (
      <svg aria-hidden viewBox="0 0 21 21" className="h-4 w-4">
        <rect x="1" y="1" width="9" height="9" fill="#f25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
        <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
        <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
      </svg>
    ),
  },
]

let cached: Promise<Set<string>> | null = null

/** Which external providers this project has switched on. */
function enabledProviders(): Promise<Set<string>> {
  if (!URL_ || !KEY) return Promise.resolve(new Set<string>())
  if (!cached) {
    cached = fetch(`${URL_}/auth/v1/settings`, { headers: { apikey: KEY } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const ext = (d?.external ?? {}) as Record<string, boolean>
        return new Set(Object.keys(ext).filter((k) => ext[k]))
      })
      .catch(() => new Set<string>())
  }
  return cached
}

interface Props {
  /** Where the provider should return to. Defaults to the auth callback. */
  redirectTo?: string
  onError?: (message: string) => void
}

export function SocialSignIn({ redirectTo, onError }: Props) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    void enabledProviders().then((v) => {
      if (alive) setEnabled(v)
    })
    return () => {
      alive = false
    }
  }, [])

  const available = PROVIDERS.filter((p) => enabled.has(p.id))
  if (available.length === 0) return null

  const start = async (p: ProviderSpec) => {
    setBusy(p.id)
    try {
      const { supabase } = await import('../lib/supabase')
      if (!supabase) throw new Error('Auth is not configured')
      const { error } = await supabase.auth.signInWithOAuth({
        provider: p.id,
        options: {
          redirectTo: redirectTo ?? `${window.location.origin}/auth/callback`,
          // The minimum that yields a usable identity. Asking for more would be
          // a consent prompt nobody needs to read.
          scopes: p.id === 'azure' ? 'openid email profile' : undefined,
        },
      })
      if (error) throw error
      // On success the browser navigates away; nothing after this runs.
    } catch (e) {
      setBusy(null)
      onError?.(e instanceof Error ? e.message : `Could not start ${p.label} sign-in.`)
    }
  }

  return (
    <>
      <div className="space-y-2">
        {available.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => void start(p)}
            disabled={busy !== null}
            className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
          >
            {p.icon}
            {busy === p.id ? 'Redirecting…' : `Continue with ${p.label}`}
          </button>
        ))}
      </div>

      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
      </div>
    </>
  )
}
