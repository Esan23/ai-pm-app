import { useState } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { Task, TaskStatus, Provider } from '../../lib/types'
import { STATUS_LABELS, PROVIDERS } from '../../lib/types'
import { addTask, moveTask, deleteTask, updateTask } from '../../lib/store'
import { ProviderBadge } from './ProviderBadge'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done']
const DOT: Record<TaskStatus, string> = {
  todo: 'bg-slate-400',
  in_progress: 'bg-amber-400',
  done: 'bg-signal-500',
}

interface KanbanProps {
  projectId: string
  tasks: Task[]
}

export function KanbanBoard({ projectId, tasks }: KanbanProps) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<TaskStatus | null>(null)
  const [addingIn, setAddingIn] = useState<TaskStatus | null>(null)
  const [draft, setDraft] = useState('')

  const drop = (status: TaskStatus) => {
    if (dragId) moveTask(dragId, status)
    setDragId(null)
    setOver(null)
  }

  const submitAdd = (status: TaskStatus) => {
    const value = draft.trim()
    if (value) addTask(projectId, value, { status })
    setDraft('')
    setAddingIn(null)
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {COLUMNS.map((status) => {
        const colTasks = tasks.filter((t) => t.status === status)
        return (
          <div
            key={status}
            onDragOver={(e) => {
              e.preventDefault()
              setOver(status)
            }}
            onDragLeave={() => setOver((o) => (o === status ? null : o))}
            onDrop={() => drop(status)}
            className={`flex flex-col rounded-2xl border p-3 transition ${
              over === status
                ? 'border-signal-400 bg-signal-500/5'
                : 'border-slate-200 bg-slate-50/50 dark:border-white/10 dark:bg-white/[0.02]'
            }`}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${DOT[status]}`} />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {STATUS_LABELS[status]}
                </span>
                <span className="text-xs text-slate-400">{colTasks.length}</span>
              </div>
              <button
                onClick={() => {
                  setAddingIn(status)
                  setDraft('')
                }}
                aria-label={`Add task to ${STATUS_LABELS[status]}`}
                className="grid h-6 w-6 place-items-center rounded-md text-slate-400 hover:bg-slate-200/60 dark:hover:bg-white/10"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>

            <div className="flex min-h-[60px] flex-1 flex-col gap-2">
              {addingIn === status && (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => submitAdd(status)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') submitAdd(status)
                    if (e.key === 'Escape') setAddingIn(null)
                  }}
                  placeholder="Task title…"
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm outline-none focus:border-signal-500 dark:border-white/15 dark:bg-white/5 dark:text-white"
                />
              )}

              {colTasks.map((t) => (
                <div
                  key={t.id}
                  draggable
                  onDragStart={() => setDragId(t.id)}
                  onDragEnd={() => setDragId(null)}
                  className={`group cursor-grab rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition active:cursor-grabbing dark:border-white/10 dark:bg-white/[0.04] ${
                    dragId === t.id ? 'opacity-40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm leading-snug text-slate-800 dark:text-slate-100 ${
                        status === 'done' ? 'line-through opacity-60' : ''
                      }`}
                    >
                      {t.title}
                    </p>
                    <button
                      onClick={() => deleteTask(t.id)}
                      aria-label="Delete task"
                      className="hidden h-5 w-5 shrink-0 place-items-center rounded text-slate-400 hover:text-red-500 group-hover:grid"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <select
                      value={t.provider}
                      onChange={(e) => updateTask(t.id, { provider: e.target.value as Provider })}
                      aria-label="Attribution"
                      className="-ml-0.5 cursor-pointer rounded-md bg-transparent text-[10px] font-semibold text-slate-500 outline-none dark:text-slate-400"
                    >
                      {PROVIDERS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <ProviderBadge provider={t.provider} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
