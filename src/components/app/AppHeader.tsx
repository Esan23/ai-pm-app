import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MoonIcon, SunIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { Logo } from '../Logo'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../lib/auth'
import { SignInModal } from './SignInModal'
import { SyncStatus } from './SyncStatus'

export function AppHeader() {
  const { theme, toggle } = useTheme()
  const { user, configured, signOut } = useAuth()
  const [signInOpen, setSignInOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-ink/85">
      <div className="mx-auto flex h-14 w-full max-w-[1320px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link to="/" aria-label="Cairn home">
            <Logo />
          </Link>
          <SyncStatus />
        </div>

        <div className="flex items-center gap-1.5">
          {user && (
            <span className="hidden max-w-[220px] truncate text-xs text-slate-500 sm:inline dark:text-slate-400">
              {user.email}
            </span>
          )}
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
          >
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>

          {configured ? (
            user ? (
              <button
                onClick={signOut}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
                title="Sign out"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Sign out
              </button>
            ) : (
              <button onClick={() => setSignInOpen(true)} className="btn-primary px-3 py-2 text-xs">
                Sign in
              </button>
            )
          ) : (
            <Link to="/" className="btn-ghost px-3 py-2 text-xs">
              Exit to site
            </Link>
          )}
        </div>
      </div>

      <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
    </header>
  )
}
