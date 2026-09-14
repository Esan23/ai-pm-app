import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import type { FeedbackEntry } from '../../lib/admin'
import { isLiveAdmin, useUnifiedAdminData } from '../../lib/adminData'
import { formatDayHeading, formatTime } from '../../lib/dates'
import { Pagination } from '../ui/Pagination'
import { useToast } from '../ui/Toast'

/**
 * The read side of in-app feedback.
 *
 * Feedback has been collectable since the Feedback button shipped, and until
 * now nothing in the product could read it back — the only way to see what
 * anyone said was to open the Supabase dashboard. "Ship it and listen" does
 * not work if listening happens somewhere the product cannot reach.
 *
 * Cards rather than a table: this is prose somebody wrote, and a table column
 * would truncate the one thing worth reading.
 */

const PAGE_SIZE = 10

function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
}

/** "Today · 3:12 PM", falling back to the raw value if the row is malformed. */
function when(iso: string): string {
  const ts = Date.parse(iso)
  if (Number.isNaN(ts)) return iso
  return `${formatDayHeading(ts)} · ${formatTime(ts)}`
}

export function FeedbackInbox({ seenAt }: { seenAt: string | null }) {
  const { feedback, refresh } = useUnifiedAdminData()
  const notify = useToast()

  const [query, setQuery] = useState('')
  const [replyableOnly, setReplyableOnly] = useState(false)
  const [page, setPage] = useState(1)

  // No mark yet (first visit, or storage unavailable) means everything is new,
  // which is what the sidebar badge counted. The two must agree.
  const cutoff = seenAt ? Date.parse(seenAt) : NaN
  const isNewSince = (iso: string) => Number.isNaN(cutoff) || Date.parse(iso) > cutoff

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return feedback.filter((f) => {
      if (replyableOnly && !f.email) return false
      if (!q) return true
      return `${f.message} ${f.email ?? ''} ${f.context.route ?? ''}`.toLowerCase().includes(q)
    })
  }, [feedback, query, replyableOnly])

  useEffect(() => setPage(1), [query, replyableOnly])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const exportCsv = () => {
    const header = ['When', 'Email', 'Signed in', 'Route', 'Viewport', 'Message']
    const rows = filtered.map((f) => [
      f.createdAt,
      f.email ?? '',
      f.context.signedIn ? 'yes' : 'no',
      f.context.route ?? '',
      f.context.viewport ?? '',
      f.message,
    ])
    const blob = new Blob([toCsv([header, ...rows])], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cairn-feedback.csv'
    link.click()
    URL.revokeObjectURL(url)
    notify(`Exported ${filtered.length} ${filtered.length === 1 ? 'entry' : 'entries'}.`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h3 font-bold text-slate-900 dark:text-white">Feedback</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Everything sent from the Feedback button in the app, newest first — guests included
          {isLiveAdmin ? '' : ' · illustrative'}.
        </p>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <h2 className="font-display text-h5 font-semibold text-slate-900 dark:text-white">
            Inbox
            <span className="ml-2 text-sm font-normal text-slate-400">
              {feedback.length} total
            </span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search feedback…"
                aria-label="Search feedback"
                className="h-9 w-48 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-signal-500 focus:outline-none focus:ring-2 focus:ring-signal-500/30 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
            </div>
            <button
              onClick={() => setReplyableOnly((v) => !v)}
              aria-pressed={replyableOnly}
              title="Only entries that left an email address"
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${
                replyableOnly
                  ? 'border-signal-500/40 bg-signal-500/10 text-signal-700 dark:text-signal-300'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-white/15 dark:text-slate-300 dark:hover:bg-white/5'
              }`}
            >
              <EnvelopeIcon className="h-4 w-4" /> Can reply
            </button>
            {isLiveAdmin && (
              <button onClick={refresh} className="btn-ghost gap-1.5 text-xs">
                <ArrowPathIcon className="h-4 w-4" /> Refresh
              </button>
            )}
            {filtered.length > 0 && (
              <button onClick={exportCsv} className="btn-ghost gap-1.5 text-xs">
                <ArrowDownTrayIcon className="h-4 w-4" /> Export
              </button>
            )}
          </div>
        </div>

        {feedback.length === 0 ? (
          <EmptyInbox />
        ) : filtered.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-slate-400">
            Nothing matches that filter.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-white/5">
            {paged.map((f) => (
              <FeedbackCard key={f.id} entry={f} isNew={isNewSince(f.createdAt)} />
            ))}
          </ul>
        )}

        <Pagination page={safePage} pageCount={pageCount} total={filtered.length} onPage={setPage} />
      </div>
    </div>
  )
}

function FeedbackCard({ entry, isNew }: { entry: FeedbackEntry; isNew: boolean }) {
  const { route, viewport, signedIn, teamId } = entry.context

  // Drafts a reply in whatever mail client they use. Nothing is sent from here.
  const mailto = entry.email
    ? `mailto:${encodeURIComponent(entry.email)}?subject=${encodeURIComponent(
        'Re: your Cairn feedback',
      )}&body=${encodeURIComponent(`\n\n— — —\nYou wrote:\n${entry.message}\n`)}`
    : null

  return (
    <li className="px-4 py-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {isNew && (
          <span className="rounded-full bg-signal-500/10 px-2 py-0.5 font-semibold text-signal-700 dark:text-signal-300">
            New
          </span>
        )}
        <span className="text-slate-500 dark:text-slate-400" title={entry.createdAt}>
          {when(entry.createdAt)}
        </span>
        <span className="text-slate-300 dark:text-white/20">·</span>
        {entry.email ? (
          <span className="font-medium text-slate-700 dark:text-slate-200">{entry.email}</span>
        ) : (
          <span className="text-slate-400">{signedIn ? 'Signed in, no email given' : 'Guest'}</span>
        )}
        {mailto && (
          <a
            href={mailto}
            className="inline-flex items-center gap-1 text-signal-700 underline underline-offset-2 hover:no-underline dark:text-signal-300"
          >
            <EnvelopeIcon className="h-3.5 w-3.5" /> Reply
          </a>
        )}
      </div>

      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-100">
        {entry.message}
      </p>

      {/* The context the submitter never had to type: which screen, how big it
          was, whether they had an account. Usually explains the complaint. */}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] text-slate-400">
        {route && <span>{route}</span>}
        {viewport && <span>{viewport}</span>}
        <span>{signedIn ? 'signed in' : 'guest'}</span>
        {teamId && <span className="truncate">team {teamId}</span>}
      </div>
    </li>
  )
}

function EmptyInbox() {
  return (
    <div className="px-6 py-14 text-center">
      <ChatBubbleLeftRightIcon className="mx-auto h-8 w-8 text-slate-300 dark:text-white/20" />
      <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
        No feedback yet.
      </p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-slate-400">
        The Feedback button in the app header writes here — from guests too, which is the
        point. An empty inbox means nobody has written, not that nothing was recorded.
      </p>
    </div>
  )
}
