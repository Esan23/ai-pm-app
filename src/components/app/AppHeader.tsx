import { Link } from 'react-router-dom'
import { MoonIcon, SunIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { Logo } from '../Logo'
import { useTheme } from '../../hooks/useTheme'
import { resetWorkspace } from '../../lib/store'

export function AppHeader() {
  const { theme, toggle } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-ink/85">
      <div className="mx-auto flex h-14 w-full max-w-[1320px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/" aria-label="Cairn home">
            <Logo />
          </Link>
          <span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-500 sm:inline dark:bg-white/10 dark:text-slate-300">
            Guest workspace · saved in this browser
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              if (confirm('Reset the workspace back to the demo data?')) resetWorkspace()
            }}
            className="hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 sm:inline-flex dark:text-slate-400 dark:hover:bg-white/10"
            title="Reset demo data"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Reset
          </button>
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
          >
            {theme === 'dark' ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
          <Link to="/" className="btn-ghost px-3 py-2 text-xs">
            Exit to site
          </Link>
        </div>
      </div>
    </header>
  )
}
