import type { Task, Provider } from '../../lib/types'
import { PROVIDERS } from '../../lib/types'
import { ProviderBadge } from './ProviderBadge'

const BAR: Record<Provider, string> = {
  Human: 'bg-slate-400',
  Claude: 'bg-orange-400',
  ChatGPT: 'bg-emerald-400',
  Copilot: 'bg-violet-400',
  Gemini: 'bg-sky-400',
}

/** The differentiator: who/what produced the work in this project. */
export function AttributionSummary({ tasks }: { tasks: Task[] }) {
  const total = tasks.length
  const counts = PROVIDERS.map((p) => ({
    provider: p,
    count: tasks.filter((t) => t.provider === p).length,
  })).filter((c) => c.count > 0)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">AI attribution</h3>
        <span className="text-xs text-slate-400">{total} tasks</span>
      </div>
      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        What every model and tool actually shipped.
      </p>

      {total > 0 ? (
        <>
          <div className="mt-3 flex h-2.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
            {counts.map((c) => (
              <div
                key={c.provider}
                className={BAR[c.provider]}
                style={{ width: `${(c.count / total) * 100}%` }}
                title={`${c.provider}: ${c.count}`}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5">
            {counts.map((c) => (
              <span key={c.provider} className="inline-flex items-center gap-1.5">
                <ProviderBadge provider={c.provider} />
                <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                  {c.count}
                </span>
              </span>
            ))}
          </div>
        </>
      ) : (
        <p className="mt-3 text-xs text-slate-400">No tasks yet.</p>
      )}
    </div>
  )
}
