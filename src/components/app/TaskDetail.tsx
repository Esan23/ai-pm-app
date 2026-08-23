import { useState } from 'react'
import { TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Provider, Story, Task, TaskStatus } from '../../lib/types'
import { PROVIDERS, STATUS_LABELS } from '../../lib/types'
import { deleteTask, updateTask, useCanEdit } from '../../lib/store'
import { describeDue, formatDay, formatTime, toDayString } from '../../lib/dates'
import { useModal } from '../../hooks/useModal'

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'done']

const FIELD =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-signal-500 dark:border-white/15 dark:bg-white/5 dark:text-white'

const LABEL = 'text-[11px] font-semibold uppercase tracking-wider text-slate-400'

interface Props {
  task: Task
  stories: Story[]
  onClose: () => void
}

/**
 * Everything about one task in one place. The Kanban card stays scannable —
 * title, dates, owner — and the fields you set less often live here.
 */
export function TaskDetail({ task, stories, onClose }: Props) {
  const canEdit = useCanEdit()
  const ref = useModal<HTMLDivElement>(onClose)
  const [draft, setDraft] = useState({
    title: task.title,
    status: task.status,
    provider: task.provider,
    storyId: task.storyId ?? '',
    assignee: task.assignee ?? '',
    dueDate: task.dueDate ?? '',
  })

  const save = () => {
    const title = draft.title.trim()
    if (!title) return
    // One update call, so a multi-field edit reads as one line in the activity
    // feed instead of five.
    updateTask(task.id, {
      title,
      status: draft.status,
      provider: draft.provider,
      storyId: draft.storyId || null,
      assignee: draft.assignee.trim() || null,
      dueDate: draft.dueDate || null,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[55] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
        className="card relative w-full max-w-lg p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="task-detail-title" className={LABEL}>
            Task details
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 space-y-4">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            aria-label="Title"
            className={`${FIELD} font-semibold`}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Status</span>
              <select
                value={draft.status}
                onChange={(e) => setDraft({ ...draft, status: e.target.value as TaskStatus })}
                className={`${FIELD} mt-1 cursor-pointer`}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className={LABEL}>Due date</span>
              <input
                type="date"
                value={draft.dueDate}
                onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                className={`${FIELD} mt-1`}
              />
              {draft.dueDate && (
                <span className="mt-1 block text-[11px] text-slate-400">
                  {describeDue(draft.dueDate)}
                </span>
              )}
            </label>

            <label className="block">
              <span className={LABEL}>Owner</span>
              <input
                value={draft.assignee}
                onChange={(e) => setDraft({ ...draft, assignee: e.target.value })}
                placeholder="Unassigned"
                className={`${FIELD} mt-1`}
              />
            </label>

            <label className="block">
              <span className={LABEL}>Attribution</span>
              <select
                value={draft.provider}
                onChange={(e) => setDraft({ ...draft, provider: e.target.value as Provider })}
                className={`${FIELD} mt-1 cursor-pointer`}
              >
                {PROVIDERS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block">
            <span className={LABEL}>User story</span>
            <select
              value={draft.storyId}
              onChange={(e) => setDraft({ ...draft, storyId: e.target.value })}
              className={`${FIELD} mt-1 cursor-pointer`}
            >
              <option value="">No story</option>
              {stories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>

          <p className="text-[11px] text-slate-400">
            Created {formatDay(toDayString(new Date(task.createdAt)))}
            {task.completedAt !== null && (
              <>
                {' · '}
                Completed {formatDay(toDayString(new Date(task.completedAt)))} at{' '}
                {formatTime(task.completedAt)}
              </>
            )}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-between">
          {canEdit ? (
          <button
            onClick={() => {
              deleteTask(task.id)
              onClose()
            }}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-error-50 hover:text-error-600 dark:text-slate-400 dark:hover:bg-error-500/10"
          >
            <TrashIcon className="h-4 w-4" />
            Delete task
          </button>
          ) : (
            <span className="text-xs text-slate-400">View only</span>
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">
              {canEdit ? 'Cancel' : 'Close'}
            </button>
            {canEdit && (
              <button onClick={save} className="btn-primary px-4 py-2 text-sm">
                Save
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
