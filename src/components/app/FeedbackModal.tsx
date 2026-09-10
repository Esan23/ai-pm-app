import { useState } from 'react'
import { CheckCircleIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { currentContext, submitFeedback } from '../../lib/feedback'
import { useModal } from '../../hooks/useModal'

const FIELD =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-signal-500 dark:border-white/15 dark:bg-white/5 dark:text-white'

const LABEL = 'text-[11px] font-semibold uppercase tracking-wider text-slate-400'

interface Props {
  userId: string | null
  userEmail: string | null
  teamId: string | null
  onClose: () => void
}

/**
 * Deliberately short: one required field.
 *
 * Every extra field costs responses, and a beta needs volume more than it needs
 * structure. Where they were is captured automatically rather than asked for.
 */
export function FeedbackModal({ userId, userEmail, teamId, onClose }: Props) {
  const ref = useModal<HTMLDivElement>(onClose)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const send = async () => {
    setBusy(true)
    setError(null)
    try {
      await submitFeedback(
        message,
        userEmail ?? email,
        userId,
        currentContext(teamId, Boolean(userId)),
      )
      setSent(true)
      window.setTimeout(onClose, 1600)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not send.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[55] grid place-items-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        className="card relative flex max-h-[85vh] w-full max-w-lg flex-col"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-white/10">
          <div>
            <h2
              id="feedback-title"
              className="font-display text-h5 font-bold text-slate-900 dark:text-white"
            >
              Send feedback
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Confusing, broken, missing — all of it is useful.
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
          {sent ? (
            <div className="py-6 text-center">
              <CheckCircleIcon className="mx-auto h-10 w-10 text-signal-500" />
              <p className="mt-3 font-display text-h5 font-bold text-slate-900 dark:text-white">
                Thank you — it&apos;s recorded.
              </p>
            </div>
          ) : (
            <>
              <label className="block">
                <span className={LABEL}>What&apos;s on your mind?</span>
                <textarea
                  autoFocus
                  rows={6}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="What were you trying to do, and what happened?"
                  className={`${FIELD} mt-1 resize-none`}
                />
                <span className="mt-1 block text-right text-[11px] text-slate-400">
                  {message.length}/4000
                </span>
              </label>

              {!userEmail && (
                <label className="mt-3 block">
                  <span className={LABEL}>Email (optional)</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Only if you want a reply"
                    className={`${FIELD} mt-1`}
                  />
                </label>
              )}

              <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
                The page you&apos;re on and your screen size are attached, so nobody has to ask
                which screen you meant. Nothing else is collected.
              </p>

              {error && (
                <p className="mt-3 rounded-lg bg-error-100 px-3 py-2 text-xs text-error-700 dark:bg-error-500/15 dark:text-error-300">
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        {!sent && (
          <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-white/10">
            <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">
              Cancel
            </button>
            <button
              onClick={() => void send()}
              disabled={busy || !message.trim()}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
              {busy ? 'Sending…' : 'Send'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
