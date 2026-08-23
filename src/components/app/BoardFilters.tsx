import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Provider, Task } from '../../lib/types'
import { PROVIDERS } from '../../lib/types'
import { daysUntil } from '../../lib/dates'

export type DueFilter = 'any' | 'overdue' | 'week' | 'none'

export interface BoardFilterState {
  text: string
  assignee: string
  provider: string
  due: DueFilter
}

export const NO_FILTERS: BoardFilterState = { text: '', assignee: '', provider: '', due: 'any' }

export function isFiltered(f: BoardFilterState): boolean {
  return f.text !== '' || f.assignee !== '' || f.provider !== '' || f.due !== 'any'
}

/** Apply the filter bar to a project's tasks. */
export function filterTasks(tasks: Task[], f: BoardFilterState): Task[] {
  const needle = f.text.trim().toLowerCase()
  return tasks.filter((t) => {
    if (needle && !t.title.toLowerCase().includes(needle)) return false
    if (f.assignee === '__none' && t.assignee !== null) return false
    if (f.assignee !== '' && f.assignee !== '__none' && t.assignee !== f.assignee) return false
    if (f.provider && t.provider !== f.provider) return false
    if (f.due === 'none' && t.dueDate) return false
    if (f.due === 'overdue') {
      // A finished task isn't overdue, however late it was.
      if (!t.dueDate || t.status === 'done' || daysUntil(t.dueDate) >= 0) return false
    }
    if (f.due === 'week') {
      if (!t.dueDate) return false
      const delta = daysUntil(t.dueDate)
      if (delta < 0 || delta > 7) return false
    }
    return true
  })
}

/** Distinct owners in this project, for the dropdown. */
export function assigneesOf(tasks: Task[]): string[] {
  return [...new Set(tasks.map((t) => t.assignee).filter((a): a is string => Boolean(a)))].sort()
}

const CONTROL =
  'rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none transition focus:border-signal-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-200'

interface Props {
  value: BoardFilterState
  onChange: (next: BoardFilterState) => void
  tasks: Task[]
  matched: number
}

export function BoardFilters({ value, onChange, tasks, matched }: Props) {
  const owners = assigneesOf(tasks)
  const active = isFiltered(value)

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={value.text}
          onChange={(e) => onChange({ ...value, text: e.target.value })}
          placeholder="Search tasks…"
          aria-label="Search tasks"
          className={`${CONTROL} w-44 pl-7`}
        />
      </div>

      <select
        value={value.assignee}
        onChange={(e) => onChange({ ...value, assignee: e.target.value })}
        aria-label="Filter by owner"
        className={`${CONTROL} cursor-pointer`}
      >
        <option value="">Any owner</option>
        <option value="__none">Unassigned</option>
        {owners.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      <select
        value={value.provider}
        onChange={(e) => onChange({ ...value, provider: e.target.value as Provider | '' })}
        aria-label="Filter by attribution"
        className={`${CONTROL} cursor-pointer`}
      >
        <option value="">Any attribution</option>
        {PROVIDERS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>

      <select
        value={value.due}
        onChange={(e) => onChange({ ...value, due: e.target.value as DueFilter })}
        aria-label="Filter by due date"
        className={`${CONTROL} cursor-pointer`}
      >
        <option value="any">Any due date</option>
        <option value="overdue">Overdue</option>
        <option value="week">Due within 7 days</option>
        <option value="none">No due date</option>
      </select>

      {active && (
        <>
          <span className="text-xs tabular-nums text-slate-400">
            {matched} of {tasks.length}
          </span>
          <button
            onClick={() => onChange(NO_FILTERS)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
          >
            <XMarkIcon className="h-3.5 w-3.5" />
            Clear
          </button>
        </>
      )}
    </div>
  )
}
