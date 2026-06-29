import { Bars3Icon, MagnifyingGlassIcon, MoonIcon, SunIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline'
import { Logo } from '../Logo'
import { useTheme } from '../../hooks/useTheme'
import { ROLES, type AdminRoleKey, type AdminUser } from '../../lib/admin'

interface Props {
  currentAdmin: AdminUser
  isSuper: boolean
  previewRole: AdminRoleKey
  onPreviewRole: (r: AdminRoleKey) => void
  search: string
  onSearch: (s: string) => void
  onMenu: () => void
  onSignOut: () => void
}

export function AdminHeader({
  currentAdmin, isSuper, previewRole, onPreviewRole, search, onSearch, onMenu, onSignOut,
}: Props) {
  const { theme, toggle } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-ink/85">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
        <button
          onClick={onMenu}
          aria-label="Open menu"
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-white/10"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        <Logo />
        <span className="hidden rounded-full bg-signal-500/10 px-2.5 py-1 text-[11px] font-semibold text-signal-700 sm:inline dark:text-signal-300">
          Admin
        </span>

        {/* Search */}
        <div className="relative ml-auto hidden max-w-xs flex-1 sm:block">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search users, workspaces…"
            className="h-9 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-signal-500 focus:outline-none focus:ring-2 focus:ring-signal-500/30 dark:border-white/15 dark:bg-white/5 dark:text-white"
            aria-label="Global search"
          />
        </div>

        {/* Super admins can preview the console as a lower role */}
        {isSuper ? (
          <label className="ml-auto flex items-center gap-2 sm:ml-0">
            <span className="hidden text-xs text-slate-500 md:inline dark:text-slate-400">Preview as</span>
            <select
              value={previewRole}
              onChange={(e) => onPreviewRole(e.target.value as AdminRoleKey)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 focus:border-signal-500 focus:outline-none focus:ring-2 focus:ring-signal-500/30 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
              aria-label="Preview as role"
            >
              {Object.values(ROLES).map((r) => (
                <option key={r.key} value={r.key}>{r.displayName}</option>
              ))}
            </select>
          </label>
        ) : (
          <span className="ml-auto rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 sm:ml-0 dark:bg-white/10 dark:text-slate-300">
            {currentAdmin.adminRole ? ROLES[currentAdmin.adminRole].displayName : ''}
          </span>
        )}

        <button
          onClick={toggle}
          aria-label="Toggle dark mode"
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
        >
          {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
        </button>

        <span className="hidden text-xs font-medium text-slate-600 lg:inline dark:text-slate-300">
          {currentAdmin.name}
        </span>
        <button
          onClick={onSignOut}
          aria-label="Sign out"
          title="Sign out"
          className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5" />
        </button>
      </div>
    </header>
  )
}
