import { useState } from 'react'
import { PlusIcon, FolderIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { Workspace } from '../../lib/types'
import { addProject, deleteProject } from '../../lib/store'

interface SidebarProps {
  ws: Workspace
  activeProjectId: string | null
  onSelect: (projectId: string) => void
}

export function ProjectSidebar({ ws, activeProjectId, onSelect }: SidebarProps) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')

  const portfolio = ws.portfolios[0]

  const submit = () => {
    const value = name.trim()
    if (!value || !portfolio) return
    const p = addProject(portfolio.id, value)
    setName('')
    setAdding(false)
    onSelect(p.id)
  }

  const taskCount = (projectId: string) => ws.tasks.filter((t) => t.projectId === projectId).length
  const doneCount = (projectId: string) =>
    ws.tasks.filter((t) => t.projectId === projectId && t.status === 'done').length

  return (
    <aside className="flex h-full flex-col">
      <div className="px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Portfolio</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-900 dark:text-white">
          {portfolio?.name ?? 'Workspace'}
        </p>
      </div>

      <div className="flex items-center justify-between px-3 pt-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Projects
        </span>
        <button
          onClick={() => setAdding((a) => !a)}
          aria-label="Add project"
          className="grid h-6 w-6 place-items-center rounded-md text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
        >
          <PlusIcon className="h-4 w-4" />
        </button>
      </div>

      {adding && (
        <div className="px-3 py-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
              if (e.key === 'Escape') setAdding(false)
            }}
            placeholder="New project name"
            className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-signal-500 dark:border-white/15 dark:bg-white/5 dark:text-white"
          />
        </div>
      )}

      <nav className="mt-1 flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {ws.projects.map((p) => {
          const active = p.id === activeProjectId
          const total = taskCount(p.id)
          const done = doneCount(p.id)
          return (
            <div
              key={p.id}
              className={`group flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition ${
                active
                  ? 'bg-signal-500/10 text-signal-700 dark:text-signal-200'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
              }`}
            >
              <button onClick={() => onSelect(p.id)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <FolderIcon className={`h-4 w-4 shrink-0 ${active ? 'text-signal-500' : 'text-slate-400'}`} />
                <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                <span className="shrink-0 text-[10px] tabular-nums text-slate-400">
                  {done}/{total}
                </span>
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete project "${p.name}" and its stories/tasks?`)) deleteProject(p.id)
                }}
                aria-label="Delete project"
                className="hidden h-6 w-6 place-items-center rounded text-slate-400 hover:text-red-500 group-hover:grid"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
        {ws.projects.length === 0 && (
          <p className="px-3 py-6 text-center text-xs text-slate-400">
            No projects yet. Add one above.
          </p>
        )}
      </nav>
    </aside>
  )
}
