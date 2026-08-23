/**
 * Calendar-day helpers.
 *
 * Due dates and target dates are `YYYY-MM-DD` strings, never Date objects or
 * timestamps: a task due "the 3rd" is due on the 3rd wherever you open it, and
 * parsing "2026-09-03" as a Date would silently shift it a day for anyone west
 * of UTC.
 */

const MS_PER_DAY = 86_400_000

/** Today as `YYYY-MM-DD` in the viewer's own timezone. */
export function today(): string {
  const now = new Date()
  return toDayString(now)
}

export function toDayString(d: Date): string {
  const month = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

/** Local midnight for a `YYYY-MM-DD` string. */
function atLocalMidnight(day: string): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

/** Whole days from today: negative = past, 0 = today, positive = future. */
export function daysUntil(day: string): number {
  const start = atLocalMidnight(today()).getTime()
  const target = atLocalMidnight(day).getTime()
  return Math.round((target - start) / MS_PER_DAY)
}

export type DueTone = 'overdue' | 'today' | 'soon' | 'later'

export function dueTone(day: string): DueTone {
  const delta = daysUntil(day)
  if (delta < 0) return 'overdue'
  if (delta === 0) return 'today'
  if (delta <= 7) return 'soon'
  return 'later'
}

/** "Sep 3" / "Sep 3, 2027" once it leaves the current year. */
export function formatDay(day: string): string {
  const date = atLocalMidnight(day)
  const sameYear = date.getFullYear() === new Date().getFullYear()
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  })
}

/** "Overdue by 3 days" / "Due today" / "3 days left". */
export function describeDue(day: string): string {
  const delta = daysUntil(day)
  if (delta === 0) return 'Due today'
  if (delta === 1) return '1 day left'
  if (delta === -1) return 'Overdue by 1 day'
  if (delta < 0) return `Overdue by ${Math.abs(delta)} days`
  return `${delta} days left`
}

/** Local midnight N days ago, as a timestamp — the cutoff for "this week". */
export function daysAgo(count: number): number {
  const start = atLocalMidnight(today())
  return start.getTime() - count * MS_PER_DAY
}

/** "Today" / "Yesterday" / "Mon, Sep 1" — the heading for a day of activity. */
export function formatDayHeading(timestamp: number): string {
  const day = toDayString(new Date(timestamp))
  const delta = daysUntil(day)
  if (delta === 0) return 'Today'
  if (delta === -1) return 'Yesterday'
  return atLocalMidnight(day).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}
