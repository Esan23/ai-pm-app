import { UsersIcon, BuildingOffice2Icon, BanknotesIcon, CpuChipIcon } from '@heroicons/react/24/outline'
import { SEED_USAGE, usd } from '../../lib/admin'
import { useAdminData } from '../../lib/adminStore'

const providerColor: Record<string, string> = {
  Claude: 'bg-attribution-claude-500',
  ChatGPT: 'bg-attribution-chatgpt-500',
  Copilot: 'bg-attribution-copilot-500',
  Gemini: 'bg-attribution-gemini-500',
}

export function AdminDashboard() {
  const { users, subscriptions, audit } = useAdminData()
  const totalUsers = users.length
  const activeWorkspaces = new Set(subscriptions.map((s) => s.workspace)).size
  const mrr = subscriptions.reduce((a, s) => a + s.mrr, 0)
  const aiSpend = SEED_USAGE.reduce((a, u) => a + u.cost, 0)
  const maxCost = Math.max(...SEED_USAGE.map((u) => u.cost))

  const kpis = [
    { icon: UsersIcon, label: 'Total users', value: totalUsers.toString(), sub: `${users.filter((u) => u.status === 'active').length} active` },
    { icon: BuildingOffice2Icon, label: 'Workspaces', value: activeWorkspaces.toString(), sub: `${subscriptions.filter((s) => s.status === 'trialing').length} on trial` },
    { icon: BanknotesIcon, label: 'MRR', value: usd(mrr), sub: 'across all plans' },
    { icon: CpuChipIcon, label: 'AI spend / mo', value: usd(aiSpend), sub: 'all providers' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h3 font-bold text-slate-900 dark:text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Platform health at a glance — the source of truth for accounts, revenue, and AI usage.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-signal-500/10 text-signal-600 dark:text-signal-300">
                <k.icon className="h-5 w-5" strokeWidth={2} />
              </span>
            </div>
            <p className="mt-4 font-display text-h3 font-bold text-slate-900 dark:text-white">{k.value}</p>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{k.label}</p>
            <p className="text-xs text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* AI spend by provider */}
        <div className="card p-6">
          <h2 className="font-display text-h5 font-semibold text-slate-900 dark:text-white">AI spend by provider</h2>
          <p className="text-xs text-slate-400">Monthly token cost · cross-provider ledger</p>
          <div className="mt-5 space-y-4">
            {SEED_USAGE.map((u) => (
              <div key={u.provider}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-200">{u.provider}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {usd(u.cost)} · {u.captures.toLocaleString()} captures
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-white/10">
                  <div
                    className={`h-2.5 rounded-full ${providerColor[u.provider]}`}
                    style={{ width: `${Math.round((u.cost / maxCost) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div className="card p-6">
          <h2 className="font-display text-h5 font-semibold text-slate-900 dark:text-white">Recent admin activity</h2>
          <p className="text-xs text-slate-400">From the audit log</p>
          <ul className="mt-4 divide-y divide-slate-100 dark:divide-white/5">
            {audit.slice(0, 5).map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-3 py-3">
                <div>
                  <p className="text-sm text-slate-700 dark:text-slate-200">
                    <span className="font-medium">{a.actor}</span> · {a.action}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{a.resource}</p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{a.timestamp.split(' ')[0]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
