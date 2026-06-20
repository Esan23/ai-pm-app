import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

/** Lands here after a magic-link click; Supabase parses the URL, then we redirect. */
export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!supabase) {
      navigate('/app', { replace: true })
      return
    }
    let done = false
    const finish = () => {
      if (done) return
      done = true
      navigate('/app', { replace: true })
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish()
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) finish()
    })
    // Safety net if no session materializes.
    const t = setTimeout(() => {
      if (!done) setError('Sign-in link expired or invalid. Please try again.')
    }, 6000)
    return () => {
      sub.subscription.unsubscribe()
      clearTimeout(t)
    }
  }, [navigate])

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50/40 px-6 dark:bg-ink">
      {error ? (
        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">{error}</p>
          <a href="/app" className="btn-primary mt-4 inline-flex">
            Back to workspace
          </a>
        </div>
      ) : (
        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-signal-500 border-t-transparent" />
          Signing you in…
        </div>
      )}
    </div>
  )
}
