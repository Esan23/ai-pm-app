import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SparklesIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import {
  requestDeconstruction,
  applyDeconstruction,
  type DeconstructedStory,
  type CaptureSource,
} from '../../lib/capture'
import { ProviderBadge } from './ProviderBadge'

interface CaptureBarProps {
  projectId: string
}

const EXAMPLE =
  'Build a support agent that drafts replies from our knowledge base, evaluate answer quality before rollout, and add a one-click approve and send UI.'

export function CaptureBar({ projectId }: CaptureBarProps) {
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<DeconstructedStory[] | null>(null)
  const [source, setSource] = useState<CaptureSource>('demo')
  const [loading, setLoading] = useState(false)

  const run = async () => {
    const value = text.trim()
    if (!value || loading) return
    setLoading(true)
    try {
      const result = await requestDeconstruction(value)
      setPreview(result.stories)
      setSource(result.source)
    } finally {
      setLoading(false)
    }
  }

  const accept = () => {
    if (!preview) return
    applyDeconstruction(projectId, preview)
    setPreview(null)
    setText('')
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
        <SparklesIcon className="h-5 w-5 text-signal-500" />
        Capture
        <span className="rounded-full bg-signal-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-signal-600 dark:text-signal-300">
          AI
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Describe what you&apos;re building. Cairn deconstructs it into user stories and tasks.
      </p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run()
          }}
          rows={2}
          placeholder={EXAMPLE}
          className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-signal-500 focus:ring-2 focus:ring-signal-500/30 dark:border-white/15 dark:bg-white/5 dark:text-white"
        />
        <div className="flex gap-2 sm:flex-col">
          <button
            onClick={run}
            disabled={loading}
            className="btn-primary flex-1 px-4 py-2 text-sm sm:flex-none disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Thinking…
              </>
            ) : (
              'Deconstruct'
            )}
          </button>
          <button
            onClick={() => setText(EXAMPLE)}
            className="btn-ghost flex-1 px-4 py-2 text-xs sm:flex-none"
            type="button"
          >
            Use example
          </button>
        </div>
      </div>

      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-white/5">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                Proposed — {preview.length} {preview.length === 1 ? 'story' : 'stories'}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] ${
                    source === 'ai'
                      ? 'bg-attribution-claude-100 text-attribution-claude-700 dark:bg-attribution-claude-500/15 dark:text-attribution-claude-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                  }`}
                >
                  {source === 'ai' ? 'via Claude' : 'demo heuristic'}
                </span>
              </p>
              {preview.map((s, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-white/10 dark:bg-white/[0.02]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {s.title}
                    </span>
                    <span className="text-[10px] font-semibold uppercase text-slate-400">
                      {s.priority}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    As a {s.asA}, I want {s.iWant}.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {s.tasks.map((t, j) => (
                      <span
                        key={j}
                        className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-[11px] text-slate-600 ring-1 ring-slate-200 dark:bg-white/5 dark:text-slate-300 dark:ring-white/10"
                      >
                        {t.title}
                        <ProviderBadge provider={t.provider} />
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-1">
                <button onClick={accept} className="btn-primary px-4 py-2 text-sm">
                  Add to project
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
                <button onClick={() => setPreview(null)} className="btn-ghost px-4 py-2 text-sm">
                  Discard
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
