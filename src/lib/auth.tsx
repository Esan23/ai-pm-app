import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from './supabase'

interface AuthState {
  /** null = guest (not signed in, or Supabase unconfigured). */
  user: User | null
  loading: boolean
  configured: boolean
  /** Send a magic-link email. Throws if Supabase is unconfigured. */
  signInWithEmail: (email: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setUser(data.session?.user ?? null)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signInWithEmail = async (email: string) => {
    if (!supabase) throw new Error('Auth is not configured')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) throw error
  }

  const signOut = async () => {
    if (!supabase) return
    // scope: 'local' signs out this browser only.
    //
    // supabase-js defaults to 'global', which revokes every refresh token the
    // account holds — so signing out on a laptop also signed the user out on
    // their phone, and on every other machine. That is a "sign out everywhere"
    // action, not a sign-out, and nobody asked for it.
    //
    // Other tabs in the *same* browser still sign out, because they share one
    // stored session. That part is correct.
    await supabase.auth.signOut({ scope: 'local' })
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, configured: isSupabaseConfigured, signInWithEmail, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
