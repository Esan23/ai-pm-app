import { useState } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { Story, Task, TaskStatus, Provider } from '../../lib/types'
import { STATUS_LABELS, PROVIDERS } from '../../lib/types'
import { addTask, moveTask, deleteTask, updateTask } from '../../lib/store'
import { ProviderBadge } from './ProviderBadge'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done']
const DOT: Record<TaskStatus, string> = {
  todo: 'bg-slate-400',
  in_progress: 'bg-warning-400',
  done: 'bg-signal-500',
}

interface KanbanProps {
  projectId: string
  tasks: Task[]
  stories: Story[]
}

export function KanbanBoard({ projectId, tasks, stories }: KanbanProps) {
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<TaskStatus | null>(null)
  const [addingIn, setAddingIn] = useState<TaskStatus | null>(null)
  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

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

  const startEdit = (task: Task) => {
    setEditingId(task.id)
    setEditDraft(task.title)
  }

  /** Commit on blur/Enter rather than per keystroke — one write, no churn. */
  const commitEdit = (task: Task) => {
    const value = editDraft.trim()
    if (value && value !== task.title) updateTask(task.id, { title: value })
    setEditingId(null)
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

              {colTasks.map((t) => {
                const editing = editingId === t.id
                return (
                  <div
                    key={t.id}
                    draggable={!editing}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => setDragId(null)}
                    className={`group rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm transition dark:border-white/10 dark:bg-white/[0.04] ${
                      editing ? '' : 'cursor-grab active:cursor-grabbing'
                    } ${dragId === t.id ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {editing ? (
                        <input
                          autoFocus
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          onBlur={() => commitEdit(t)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit(t)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          aria-label="Task title"
                          className="w-full rounded-md border border-signal-400 bg-white px-1.5 py-1 text-sm outline-none dark:bg-white/10 dark:text-white"
                        />
                      ) : (
                        <button
                          onClick={() => startEdit(t)}
                          title="Click to rename"
                          className={`min-w-0 flex-1 text-left text-sm leading-snug text-slate-800 dark:text-slate-100 ${
                            t.status === 'done' ? 'line-through opacity-60' : ''
                          }`}
                        >
                          {t.title}
                        </button>
                      )}
                      {!editing && (
                        <button
                          onClick={() => deleteTask(t.id)}
                          aria-label="Delete task"
                          className="hidden h-5 w-5 shrink-0 place-items-center rounded text-slate-400 hover:text-error-500 group-hover:grid"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Story link: tasks added here used to be orphaned, which
                        made story progress under-count. */}
                    {stories.length > 0 && (
                      <select
                        value={t.storyId ?? ''}
                        onChange={(e) => updateTask(t.id, { storyId: e.target.value || null })}
                        aria-label="Linked user story"
                        className="mt-2 w-full cursor-pointer truncate rounded-md bg-slate-50 px-1.5 py-1 text-[10px] font-medium text-slate-500 outline-none dark:bg-white/5 dark:text-slate-400"
                      >
                        <option value="">No story</option>
                        {stories.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.title}
                          </option>
                        ))}
                      </select>
                    )}

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
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
