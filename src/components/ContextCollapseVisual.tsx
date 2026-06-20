import { motion } from 'framer-motion'

const scattered = [
  { label: 'Slack thread', x: '4%', y: '8%', r: -8 },
  { label: 'ChatGPT spec', x: '38%', y: '0%', r: 5 },
  { label: 'Copilot PR', x: '70%', y: '10%', r: 9 },
  { label: 'Jira board', x: '2%', y: '64%', r: 7 },
  { label: 'Gemini research', x: '34%', y: '78%', r: -6 },
  { label: 'Notion doc', x: '66%', y: '70%', r: -10 },
  { label: 'Standup notes', x: '20%', y: '38%', r: 4 },
]

const hierarchy = [
  { label: 'Portfolio · Q3 AI bets', depth: 0, tone: 'bg-signal-600 text-white' },
  { label: 'Project · Support Agent', depth: 1, tone: 'bg-signal-500/15 text-signal-700 dark:text-signal-200' },
  { label: 'Story · Draft replies from KB', depth: 2, tone: 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-200' },
  { label: 'Task · RAG eval harness', depth: 3, tone: 'bg-slate-100 text-slate-700 dark:bg-white/5 dark:text-slate-200' },
]

export function ContextCollapseVisual() {
  return (
    <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
      {/* Scattered, drifting context */}
      <div className="relative h-56 sm:h-64">
        {scattered.map((c, i) => (
          <motion.div
            key={c.label}
            className="absolute rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400"
            style={{ left: c.x, top: c.y, rotate: `${c.r}deg` }}
            animate={{ y: [0, i % 2 ? -5 : 5, 0] }}
            transition={{ duration: 4 + i * 0.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            {c.label}
          </motion.div>
        ))}
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Scattered
        </span>
      </div>

      {/* Arrow */}
      <div className="flex justify-center py-2 sm:py-0">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-signal-400 to-signal-600 text-white shadow-lg shadow-signal-600/30">
          <svg viewBox="0 0 24 24" className="h-5 w-5 rotate-90 sm:rotate-0" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* One legible plan */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/5 dark:border-white/10 dark:bg-white/[0.03]"
      >
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-signal-600 dark:text-signal-300">
            One source of truth
          </span>
          <span className="flex h-2 w-2 rounded-full bg-signal-500" />
        </div>
        <div className="space-y-1.5">
          {hierarchy.map((row, i) => (
            <motion.div
              key={row.label}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.12 }}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${row.tone}`}
              style={{ marginLeft: row.depth * 12 }}
            >
              {row.label}
            </motion.div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-3 dark:border-white/5">
          {['Copilot', 'ChatGPT', 'Gemini', 'Claude'].map((p) => (
            <span
              key={p}
              className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-white/5 dark:text-slate-400"
            >
              {p}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
