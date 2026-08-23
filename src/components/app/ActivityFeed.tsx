import { useMemo, useState } from 'react'
import type { ActivityAction, ActivityEvent } from '../../lib/types'
import { daysAgo, formatDayHeading, formatTime, toDayString } from '../../lib/dates'

const VERB: Record<ActivityAction, string> = {
  created: 'created',
  renamed: 'renamed',
  updated: 'updated',
  status_changed: 'moved',
  completed: 'completed',
  reopened: 'reopened',
  assigned: 'assigned',
  scheduled: 'scheduled',
  deleted: 'deleted',
}

const DOT: Record<ActivityAction, string> = {
  created: 'bg-slate-300 dark:bg-white/25',
  renamed: 'bg-slate-300 dark:bg-white/25',
  updated: 'bg-slate-300 dark:bg-white/25',
  status_changed: 'bg-warning-400',
  completed: 'bg-signal-500',
  reopened: 'bg-warning-400',
  assigned: 'bg-slate-400',
  scheduled: 'bg-slate-400',
  deleted: 'bg-error-400',
}

/**
 * What changed, newest first. This is the view a status update is written
 * from — before Phase 1 the workspace had no memory of anything that happened.
 */
export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const [showAll, setShowAll] = useState(false)

  const cutoff = daysAgo(7)
  const visible = useMemo(
    () => (showAll ? events : events.filter((e) => e.createdAt >= cutoff)),
    [events, showAll, cutoff],
  )

  const groups = useMemo(() => {
    const byDay = new Map<string, ActivityEvent[]>()
    for (const event of visible) {
      const key = toDayString(new Date(event.createdAt))
      const bucket = byDay.get(key)
      if (bucket) bucket.push(event)
      else byDay.set(key, [event])
    }
    return [...byDay.entries()]
  }, [visible])

  const weekCount = events.filter((e) => e.createdAt >= cutoff).length

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {showAll ? 'All activity' : 'This week'}
        </h3>
        <button
          onClick={() => setShowAll((v) => !v)}
          className="text-[11px] font-semibold text-slate-400 underline underline-offset-2 transition hover:text-signal-600 dark:hover:text-signal-300"
        >
          {showAll ? 'Last 7 days' : 'Show all'}
        </button>
      </div>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        {showAll
          ? `${events.length} ${events.length === 1 ? 'change' : 'changes'} on record`
          : `${weekCount} ${weekCount === 1 ? 'change' : 'changes'} in the last 7 days`}
      </p>

      {visible.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">
          {events.length === 0
            ? 'Nothing yet — moving a task or setting a due date shows up here.'
            : 'Nothing in the last 7 days.'}
        </p>
      ) : (
        <div className="mt-3 max-h-[420px] space-y-4 overflow-y-auto pr-1">
          {groups.map(([day, dayEvents]) => (
            <div key={day}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {formatDayHeading(dayEvents[0].createdAt)}
              </p>
              <ul className="mt-1.5 space-y-2">
                {dayEvents.map((event) => (
                  <li key={event.id} className="flex gap-2">
                    <span
                      className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${DOT[event.action]}`}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="text-xs leading-snug text-slate-600 dark:text-slate-300">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">
                          {VERB[event.action]}
                        </span>{' '}
                        {event.entityType}{' '}
                        <span className="font-medium text-slate-800 dark:text-slate-100">
                          {event.entityTitle}
                        </span>
                      </p>
                      {event.detail && (
                        <p className="text-[11px] leading-snug text-slate-400">{event.detail}</p>
                      )}
                      <p className="text-[10px] text-slate-400">{formatTime(event.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
