import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRightOnRectangleIcon,
  EyeIcon,
  MoonIcon,
  PlusIcon,
  SunIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import { Logo } from '../Logo'
import { useTheme } from '../../hooks/useTheme'
import { useAuth } from '../../lib/auth'
import { createTeamAndSwitch, switchTeam, useCanEdit, useTeamState } from '../../lib/store'
import { SignInModal } from './SignInModal'
import { SyncStatus } from './SyncStatus'
import { TeamPanel } from './TeamPanel'

const NEW_TEAM = '__new'

export function AppHeader() {
  const { theme, toggle } = useTheme()
  const { user, configured, signOut } = useAuth()
  const { teams, currentTeamId, role } = useTeamState()
  const canEdit = useCanEdit()
  const [signInOpen, setSignInOpen] = useState(false)
  const [teamOpen, setTeamOpen] = useState(false)

  const onTeamChange = (value: string) => {
    if (value === NEW_TEAM) {
      const name = prompt('Name the new team')?.trim()
      if (name) void createTeamAndSwitch(name)
      return
    }
    void switchTeam(value)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-ink/85">
      <div className="mx-auto flex h-14 w-full max-w-[1320px] items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link to="/" aria-label="Cairn home">
            <Logo />
          </Link>

          {user && teams.length > 0 && (
            <select
              value={currentTeamId ?? ''}
              onChange={(e) => onTeamChange(e.target.value)}
              aria-label="Active team"
              className="max-w-[160px] cursor-pointer truncate rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
              <option value={NEW_TEAM}>+ New team…</option>
            </select>
          )}

          <SyncStatus />

          {user && !canEdit && (
            <span
              className="hidden items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 sm:inline-flex dark:bg-white/10 dark:text-slate-300"
              title={`Your role in this team is ${role ?? 'unknown'}`}
            >
              <EyeIcon className="h-3.5 w-3.5" />
              View only
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {user && currentTeamId && (
            <button
              onClick={() => setTeamOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
              title="Members and invites"
            >
              <UserGroupIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Team</span>
            </button>
          )}
          {user && teams.length === 0 && (
            <button
              onClick={() => onTeamChange(NEW_TEAM)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
            >
              <PlusIcon className="h-4 w-4" />
              New team
            </button>
          )}
          {user && (
            <span className="hidden max-w-[180px] truncate text-xs text-slate-500 lg:inline dark:text-slate-400">
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
                <span className="hidden sm:inline">Sign out</span>
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
      {teamOpen && user && (
        <TeamPanel currentUserId={user.id} onClose={() => setTeamOpen(false)} />
      )}
    </header>
  )
}
