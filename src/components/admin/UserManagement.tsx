import { useMemo, useState } from 'react'
import { XMarkIcon, NoSymbolIcon, CheckCircleIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'
import { ProviderBadge } from '../app/ProviderBadge'
import { can, ROLES, SEED_USERS, type AdminRoleKey, type AdminUser, type UserStatus } from '../../lib/admin'

const statusStyles: Record<UserStatus, string> = {
  active: 'bg-success/10 text-success',
  suspended: 'bg-error/10 text-error',
  pending: 'bg-warning/10 text-warning',
}

export function UserManagement({ role, search }: { role: AdminRoleKey; search: string }) {
  const [users, setUsers] = useState<AdminUser[]>(SEED_USERS)
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [selected, setSelected] = useState<AdminUser | null>(null)

  const canUpdate = can(role, 'update:users')
  const canSuspend = can(role, 'suspend:users')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (planFilter !== 'all' && u.plan !== planFilter) return false
      if (q && !`${u.name} ${u.email} ${u.workspace}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [users, statusFilter, planFilter, search])

  const setStatus = (id: string, status: UserStatus) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)))
    setSelected((s) => (s && s.id === id ? { ...s, status } : s))
  }

  const suspend = (u: AdminUser) => {
    if (!canSuspend) return
    if (confirm(`Suspend ${u.name}? They will lose access until reactivated.`)) setStatus(u.id, 'suspended')
  }
  const activate = (u: AdminUser) => canSuspend && setStatus(u.id, 'active')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h3 font-bold text-slate-900 dark:text-white">User management</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {filtered.length} of {users.length} users{search ? ` · matching “${search}”` : ''}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="pending">Pending</option>
        </select>
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm dark:border-white/15 dark:bg-white/5 dark:text-slate-200">
          <option value="all">All plans</option>
          <option value="Free">Free</option>
          <option value="Pro">Pro</option>
          <option value="Enterprise">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400 dark:border-white/10">
              <th className="px-4 py-3 font-semibold">User</th>
              <th className="px-4 py-3 font-semibold">Workspace</th>
              <th className="px-4 py-3 font-semibold">Plan</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Last active</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr
                key={u.id}
                onClick={() => setSelected(u)}
                className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.workspace}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.plan}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                  {u.adminRole ? ROLES[u.adminRole].displayName : 'Member'}
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${statusStyles[u.status]}`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.lastActive}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">No users match your filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-slate-200 bg-white dark:border-white/10 dark:bg-ink">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-white/10">
              <h2 className="font-display text-h5 font-semibold text-slate-900 dark:text-white">User detail</h2>
              <button onClick={() => setSelected(null)} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-5">
              <div>
                <p className="font-display text-h5 font-bold text-slate-900 dark:text-white">{selected.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{selected.email}</p>
                <span className={`mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${statusStyles[selected.status]}`}>
                  {selected.status}
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-slate-400">Workspace</dt><dd className="text-slate-700 dark:text-slate-200">{selected.workspace}</dd></div>
                <div><dt className="text-slate-400">Plan</dt><dd className="text-slate-700 dark:text-slate-200">{selected.plan}</dd></div>
                <div><dt className="text-slate-400">Admin role</dt><dd className="text-slate-700 dark:text-slate-200">{selected.adminRole ? ROLES[selected.adminRole].displayName : 'Member'}</dd></div>
                <div><dt className="text-slate-400">Last active</dt><dd className="text-slate-700 dark:text-slate-200">{selected.lastActive}</dd></div>
              </dl>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI providers used</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {selected.providers.map((p) => (
                    <ProviderBadge key={p} provider={p} />
                  ))}
                </div>
              </div>

              {/* Actions (role-gated) */}
              <div className="space-y-2 border-t border-slate-100 pt-5 dark:border-white/5">
                {!canUpdate && !canSuspend && (
                  <p className="text-sm text-slate-400">Your role has read-only access to users.</p>
                )}
                {selected.status === 'pending' && canUpdate && (
                  <button
                    onClick={() => alert(`Magic-link invite re-sent to ${selected.email}`)}
                    className="btn-ghost w-full justify-start gap-2"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" /> Resend magic-link invite
                  </button>
                )}
                {canSuspend && selected.status !== 'suspended' && (
                  <button onClick={() => suspend(selected)} className="btn-ghost w-full justify-start gap-2 text-error">
                    <NoSymbolIcon className="h-4 w-4" /> Suspend user
                  </button>
                )}
                {canSuspend && selected.status === 'suspended' && (
                  <button onClick={() => activate(selected)} className="btn-ghost w-full justify-start gap-2 text-success">
                    <CheckCircleIcon className="h-4 w-4" /> Reactivate user
                  </button>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
