import { useMemo, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ClipboardDocumentIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { Workspace } from '../../lib/types'
import { buildReport, reportInput } from '../../lib/report'
import { useModal } from '../../hooks/useModal'

const WINDOWS = [7, 14, 30]

interface Props {
  ws: Workspace
  projectId: string
  onClose: () => void
}

/** Preview, copy, or download the status report as Markdown. */
export function StatusReport({ ws, projectId, onClose }: Props) {
  const ref = useModal<HTMLDivElement>(onClose)
  const [days, setDays] = useState(7)
  const [copied, setCopied] = useState(false)

  const markdown = useMemo(() => {
    const input = reportInput(ws, projectId, days)
    return input ? buildReport(input) : ''
  }, [ws, projectId, days])

  const projectName = ws.projects.find((p) => p.id === projectId)?.name ?? 'project'

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(markdown)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — the text is on screen and selectable */
    }
  }

  const download = () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-status.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 z-[55] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-report-title"
        className="card relative flex max-h-[85vh] w-full max-w-2xl flex-col p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2
              id="status-report-title"
              className="font-display text-h5 font-bold text-slate-900 dark:text-white"
            >
              Status report
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Built from completion times and the activity log — no model call, nothing to
              hallucinate.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Window
          </span>
          {WINDOWS.map((w) => (
            <button
              key={w}
              onClick={() => setDays(w)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                days === w
                  ? 'bg-signal-500/10 text-signal-700 dark:text-signal-300'
                  : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10'
              }`}
            >
              {w} days
            </button>
          ))}
        </div>

        <pre className="mt-3 flex-1 overflow-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-700 dark:bg-white/5 dark:text-slate-300">
          {markdown}
        </pre>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={copy} className="btn-ghost px-4 py-2 text-sm">
            <ClipboardDocumentIcon className="h-4 w-4" />
            {copied ? 'Copied' : 'Copy Markdown'}
          </button>
          <button onClick={download} className="btn-primary px-4 py-2 text-sm">
            <ArrowDownTrayIcon className="h-4 w-4" />
            Download .md
          </button>
        </div>
      </div>
    </div>
  )
}
