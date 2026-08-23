import { useState } from 'react'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { Priority, Story, Task } from '../../lib/types'
import { deleteStory, updateStory, useCanEdit } from '../../lib/store'

const PRIORITY_STYLES: Record<Priority, string> = {
  high: 'bg-error-100 text-error-700 dark:bg-error-500/15 dark:text-error-300',
  medium: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300',
  low: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high']

const FIELD =
  'w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-signal-500 dark:border-white/15 dark:bg-white/5 dark:text-white'

interface StoryListProps {
  stories: Story[]
  tasks: Task[]
}

export function StoryList({ stories, tasks }: StoryListProps) {
  const canEdit = useCanEdit()
  const [editingId, setEditingId] = useState<string | null>(null)

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

        if (editingId === s.id) {
          return <StoryEditor key={s.id} story={s} onClose={() => setEditingId(null)} />
        }

        return (
          <div
            key={s.id}
            className="group rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]"
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
              <div className="flex shrink-0 items-center gap-1">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_STYLES[s.priority]}`}
                >
                  {s.priority}
                </span>
                {canEdit && (
                  <>
                    <button
                      onClick={() => setEditingId(s.id)}
                      aria-label="Edit story"
                      className="hidden h-6 w-6 place-items-center rounded text-slate-400 hover:text-signal-500 group-hover:grid"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete the story "${s.title}"? Its tasks are kept.`))
                          deleteStory(s.id)
                      }}
                      aria-label="Delete story"
                      className="hidden h-6 w-6 place-items-center rounded text-slate-400 hover:text-error-500 group-hover:grid"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
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

function StoryEditor({ story, onClose }: { story: Story; onClose: () => void }) {
  const [draft, setDraft] = useState({
    title: story.title,
    asA: story.asA,
    iWant: story.iWant,
    soThat: story.soThat,
    priority: story.priority,
  })

  const save = () => {
    const title = draft.title.trim()
    if (!title) return
    updateStory(story.id, { ...draft, title })
    onClose()
  }

  return (
    <div className="rounded-2xl border border-signal-400 bg-white p-4 dark:bg-white/[0.05]">
      <div className="space-y-2">
        <input
          autoFocus
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Story title"
          aria-label="Story title"
          className={`${FIELD} font-semibold`}
        />
        <div className="grid gap-2 sm:grid-cols-3">
          <input
            value={draft.asA}
            onChange={(e) => setDraft({ ...draft, asA: e.target.value })}
            placeholder="As a…"
            aria-label="As a"
            className={FIELD}
          />
          <input
            value={draft.iWant}
            onChange={(e) => setDraft({ ...draft, iWant: e.target.value })}
            placeholder="I want…"
            aria-label="I want"
            className={FIELD}
          />
          <input
            value={draft.soThat}
            onChange={(e) => setDraft({ ...draft, soThat: e.target.value })}
            placeholder="So that…"
            aria-label="So that"
            className={FIELD}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <select
          value={draft.priority}
          onChange={(e) => setDraft({ ...draft, priority: e.target.value as Priority })}
          aria-label="Priority"
          className={`${FIELD} w-auto cursor-pointer`}
        >
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
          >
            Cancel
          </button>
          <button onClick={save} className="btn-primary px-3 py-1.5 text-xs">
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
