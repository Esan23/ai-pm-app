import { useState } from 'react'
import { CalendarIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Project, Task } from '../../lib/types'
import { updateProject, useCanEdit } from '../../lib/store'
import { daysUntil, describeDue, formatDay } from '../../lib/dates'

const TARGET_TONE: Record<'overdue' | 'tight' | 'ok', string> = {
  overdue: 'bg-error-100 text-error-700 dark:bg-error-500/15 dark:text-error-300',
  tight: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300',
  ok: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
}

/**
 * Project name, description, and the two numbers a status update is built
 * from: how much is done, and how much time is left to do the rest.
 */
export function ProjectHeader({ project, tasks }: { project: Project; tasks: Task[] }) {
  const canEdit = useCanEdit()
  const [editingTarget, setEditingTarget] = useState(false)
  const [draft, setDraft] = useState(project.targetDate ?? '')

  const done = tasks.filter((t) => t.status === 'done').length
  const total = tasks.length
  const pct = total ? Math.round((done / total) * 100) : 0
  const overdue = tasks.filter(
    (t) => t.status !== 'done' && Boolean(t.dueDate) && daysUntil(t.dueDate!) < 0,
  ).length

  const delta = project.targetDate ? daysUntil(project.targetDate) : null
  const tone = delta === null ? 'ok' : delta < 0 ? 'overdue' : delta <= 7 ? 'tight' : 'ok'

  const commitTarget = () => {
    updateProject(project.id, { targetDate: draft || null })
    setEditingTarget(false)
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-h3 font-bold text-slate-900 dark:text-white">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{project.description}</p>
          )}
        </div>

        {editingTarget ? (
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTarget()
                if (e.key === 'Escape') setEditingTarget(false)
              }}
              aria-label="Project target date"
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-signal-500 dark:border-white/15 dark:bg-white/5 dark:text-white"
            />
            <button
              onClick={commitTarget}
              aria-label="Save target date"
              className="grid h-7 w-7 place-items-center rounded-lg text-signal-600 hover:bg-signal-500/10"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditingTarget(false)}
              aria-label="Cancel"
              className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              if (!canEdit) return
              setDraft(project.targetDate ?? '')
              setEditingTarget(true)
            }}
            disabled={!canEdit && !project.targetDate}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              canEdit ? 'hover:opacity-80' : 'cursor-default'
            } ${TARGET_TONE[tone]}`}
          >
            <CalendarIcon className="h-4 w-4" />
            {project.targetDate ? (
              <>
                Target {formatDay(project.targetDate)}
                <span className="font-normal opacity-75">· {describeDue(project.targetDate)}</span>
              </>
            ) : (
              canEdit ? 'Set target date' : 'No target date'
            )}
          </button>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-signal-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400">
          {pct}%
        </span>
      </div>
      <p className="mt-1.5 text-xs text-slate-400">
        {done} of {total} {total === 1 ? 'task' : 'tasks'} done
        {overdue > 0 && (
          <span className="font-semibold text-error-600 dark:text-error-400">
            {' · '}
            {overdue} overdue
          </span>
        )}
      </p>
    </div>
  )
}
