import { useState } from 'react'
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { applyAdoImport, fetchAdoPreview, type AdoPreview } from '../../lib/adoImport'
import { useModal } from '../../hooks/useModal'

const FIELD =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-signal-500 dark:border-white/15 dark:bg-white/5 dark:text-white'

const LABEL = 'text-[11px] font-semibold uppercase tracking-wider text-slate-400'

interface Props {
  onClose: () => void
  onImported: (projectId: string | null) => void
}

/**
 * Read-only Azure DevOps import: preview first, then commit.
 *
 * Preview exists because import writes a whole portfolio into the workspace,
 * and there is no undo. Seeing the counts before agreeing is the difference
 * between an import and a surprise.
 */
export function AdoImportModal({ onClose, onImported }: Props) {
  const ref = useModal<HTMLDivElement>(onClose)
  const [org, setOrg] = useState('')
  const [project, setProject] = useState('')
  const [pat, setPat] = useState('')
  const [preview, setPreview] = useState<AdoPreview | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setBusy(true)
    setError(null)
    try {
      setPreview(await fetchAdoPreview(org, project, pat))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not read that project.')
      setPreview(null)
    } finally {
      setBusy(false)
    }
  }

  const commit = () => {
    if (!preview) return
    const result = applyAdoImport(preview)
    // The token has no further use; drop it from memory as soon as it does.
    setPat('')
    onImported(result.firstProjectId)
    onClose()
  }

  const ready = org.trim() && project.trim() && pat.trim()

  return (
    <div className="fixed inset-0 z-[55] grid place-items-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ado-import-title"
        className="card relative flex max-h-[85vh] w-full max-w-xl flex-col"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-white/10">
          <div>
            <h2
              id="ado-import-title"
              className="font-display text-h5 font-bold text-slate-900 dark:text-white"
            >
              Import from Azure DevOps
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Reads a project and creates it here. Nothing is written back.
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

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className={LABEL}>Organization</span>
              <input
                value={org}
                onChange={(e) => setOrg(e.target.value)}
                placeholder="contoso"
                className={`${FIELD} mt-1`}
              />
            </label>
            <label className="block">
              <span className={LABEL}>Project</span>
              <input
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder="Payments Platform"
                className={`${FIELD} mt-1`}
              />
            </label>
          </div>

          <label className="mt-3 block">
            <span className={LABEL}>Personal access token</span>
            <input
              type="password"
              value={pat}
              onChange={(e) => setPat(e.target.value)}
              placeholder="••••••••••••"
              autoComplete="off"
              className={`${FIELD} mt-1 font-mono`}
            />
            <span className="mt-1.5 block text-[11px] leading-relaxed text-slate-400">
              Needs <strong>Work Items: Read</strong> only. Used for this one request and never
              stored — not by the browser, and not on the server.
            </span>
          </label>

          {error && (
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-error-100 px-3 py-2 text-xs text-error-700 dark:bg-error-500/15 dark:text-error-300">
              <ExclamationTriangleIcon className="mt-px h-4 w-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {preview && (
            <div className="mt-5 rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {preview.portfolioName}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {preview.counts.read} work items read from {preview.org}/{preview.project}
              </p>

              <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
                {[
                  ['Projects', preview.counts.projects],
                  ['Stories', preview.counts.stories],
                  ['Tasks', preview.counts.tasks],
                ].map(([label, n]) => (
                  <div key={label} className="rounded-lg bg-slate-50 py-2 dark:bg-white/5">
                    <dd className="font-display text-h5 font-bold text-slate-900 dark:text-white">
                      {n}
                    </dd>
                    <dt className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {label}
                    </dt>
                  </div>
                ))}
              </dl>

              {preview.counts.skipped > 0 && (
                <p className="mt-3 text-[11px] text-slate-400">
                  {preview.counts.skipped} item{preview.counts.skipped === 1 ? '' : 's'} skipped —
                  removed in Azure DevOps.
                </p>
              )}
              {preview.counts.projects === 0 && preview.counts.stories === 0 && (
                <p className="mt-3 text-[11px] text-warning-700 dark:text-warning-300">
                  No Features or User Stories found. Anything imported will land under
                  &ldquo;Unsorted&rdquo;.
                </p>
              )}

              <p className="mt-3 border-t border-slate-200 pt-3 text-[11px] leading-relaxed text-slate-400 dark:border-white/10">
                Epics become the description on each project, since Cairn shows one portfolio.
                Importing the same project twice creates a second copy — there is no link back to
                Azure DevOps yet.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-white/10">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">
            Cancel
          </button>
          {preview ? (
            <button onClick={commit} className="btn-primary px-4 py-2 text-sm">
              <ArrowDownTrayIcon className="h-4 w-4" />
              Import {preview.counts.tasks + preview.counts.stories} items
            </button>
          ) : (
            <button
              onClick={load}
              disabled={!ready || busy}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
            >
              {busy && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
              {busy ? 'Reading…' : 'Preview'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
