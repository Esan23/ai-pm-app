import { useState } from 'react'
import { FolderPlusIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { addProject, ensurePortfolio, loadDemoWorkspace } from '../../lib/store'

/**
 * First-run state. A new account starts empty and is asked what it's working
 * on — demo content is opt-in, so nobody has to delete a fictional portfolio
 * before they can track their own.
 */
export function EmptyWorkspace({ onReady }: { onReady: (projectId: string) => void }) {
  const [name, setName] = useState('')

  const create = () => {
    const value = name.trim()
    if (!value) return
    const portfolio = ensurePortfolio()
    const project = addProject(portfolio.id, value)
    setName('')
    onReady(project.id)
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-signal-500/10">
        <FolderPlusIcon className="h-6 w-6 text-signal-500" />
      </div>

      <h1 className="mt-4 font-display text-h4 font-bold text-slate-900 dark:text-white">
        Track your first project
      </h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        Name what you&apos;re working on. Then describe it once and Cairn breaks it into user
        stories and tasks you can move across the board.
      </p>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') create()
          }}
          placeholder="e.g. Support Agent"
          aria-label="Project name"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-signal-500 dark:border-white/15 dark:bg-white/5 dark:text-white"
        />
        <button onClick={create} disabled={!name.trim()} className="btn-primary px-4 py-2.5 text-sm disabled:opacity-40">
          Create project
        </button>
      </div>

      <div className="mt-6 border-t border-slate-200 pt-4 dark:border-white/10">
        <button
          onClick={() => {
            const project = loadDemoWorkspace()
            if (project) onReady(project.id)
          }}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-signal-600 dark:text-slate-400 dark:hover:text-signal-300"
        >
          <SparklesIcon className="h-4 w-4" />
          Or explore with demo data
        </button>
      </div>
    </div>
  )
}
