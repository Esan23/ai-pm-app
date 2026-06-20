import type { Story, Task } from '../../lib/types'

const PRIORITY_STYLES: Record<Story['priority'], string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
}

interface StoryListProps {
  stories: Story[]
  tasks: Task[]
}

export function StoryList({ stories, tasks }: StoryListProps) {
  if (stories.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
        No user stories yet. Use <span className="font-semibold">Capture</span> above to generate
        some from a description.
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {stories.map((s) => {
        const storyTasks = tasks.filter((t) => t.storyId === s.id)
        const done = storyTasks.filter((t) => t.status === 'done').length
        const pct = storyTasks.length ? Math.round((done / storyTasks.length) * 100) : 0
        return (
          <div
            key={s.id}
            className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                  {s.title}
                </h4>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-600 dark:text-slate-300">As a</span> {s.asA},{' '}
                  <span className="font-medium text-slate-600 dark:text-slate-300">I want</span> {s.iWant},{' '}
                  <span className="font-medium text-slate-600 dark:text-slate-300">so that</span> {s.soThat}.
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_STYLES[s.priority]}`}
              >
                {s.priority}
              </span>
            </div>

            {storyTasks.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                  <div className="h-full rounded-full bg-signal-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-[11px] tabular-nums text-slate-400">
                  {done}/{storyTasks.length}
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
