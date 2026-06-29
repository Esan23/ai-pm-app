import { can, PLANS, SEED_USAGE, usd, type AdminRoleKey, type SubStatus } from '../../lib/admin'
import { useAdminData } from '../../lib/adminStore'

const subStatus: Record<SubStatus, string> = {
  active: 'bg-success/10 text-success',
  trialing: 'bg-info/10 text-info',
  past_due: 'bg-warning/10 text-warning',
  canceled: 'bg-error/10 text-error',
}

export function SubscriptionUsage({ role }: { role: AdminRoleKey }) {
  const { subscriptions } = useAdminData()
  const canManage = can(role, 'manage:plans')
  const totalCaptures = SEED_USAGE.reduce((a, u) => a + u.captures, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-h3 font-bold text-slate-900 dark:text-white">Subscriptions & usage</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Plans, billing health, and metered usage.</p>
        </div>
        {canManage && <button className="btn-primary">New plan</button>}
      </div>

      {/* Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((p) => (
          <div key={p.id} className={`card p-5 ${p.name === 'Pro' ? 'border-signal-500/50' : ''}`}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-h5 font-bold text-slate-900 dark:text-white">{p.name}</h2>
              {p.name === 'Pro' && <span className="rounded-full bg-signal-600 px-2 py-0.5 text-[10px] font-semibold text-white">Popular</span>}
            </div>
            <p className="mt-2 font-display text-h4 font-bold text-slate-900 dark:text-white">
              {p.priceMonthly === null ? 'Custom' : p.priceMonthly === 0 ? 'Free' : `${usd(p.priceMonthly)}/mo`}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
              <li>Seats: {p.seatLimit ?? 'Unlimited'}</li>
              <li>Projects: {p.projectLimit ?? 'Unlimited'}</li>
              <li>AI captures: {p.captureQuota?.toLocaleString() ?? 'Unlimited'}/mo</li>
            </ul>
            {canManage && <button className="btn-ghost mt-5 w-full text-sm">Edit plan</button>}
          </div>
        ))}
      </div>

      {/* Subscriptions table */}
      <div className="card overflow-x-auto">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <h2 className="font-display text-h5 font-semibold text-slate-900 dark:text-white">Customer subscriptions</h2>
        </div>
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400 dark:border-white/10">
              <th className="px-4 py-3 font-semibold">Workspace</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Seats</th>
              <th className="px-4 py-3 font-semibold">MRR</th>
              <th className="px-4 py-3 font-semibold">Renews</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 dark:border-white/5">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{s.workspace}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.plan}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${subStatus[s.status]}`}>
                    {s.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{s.seats}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{usd(s.mrr)}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{s.renewal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Usage by provider */}
      <div className="card p-6">
        <h2 className="font-display text-h5 font-semibold text-slate-900 dark:text-white">Metered AI usage</h2>
        <p className="text-xs text-slate-400">{totalCaptures.toLocaleString()} captures this period · cross-provider cost ledger</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SEED_USAGE.map((u) => (
            <div key={u.provider} className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{u.provider}</p>
              <p className="mt-1 font-display text-h4 font-bold text-slate-900 dark:text-white">{usd(u.cost)}</p>
              <p className="text-xs text-slate-400">{(u.tokens / 1_000_000).toFixed(1)}M tokens · {u.captures.toLocaleString()} captures</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
