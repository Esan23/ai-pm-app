import { Fragment, useEffect, useMemo, useState } from 'react'
import { CheckIcon, MinusIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import { ALL_PERMISSIONS, ROLES, type AdminRoleKey, type Permission } from '../../lib/admin'
import { useAdminData, useCan, setRolePermission } from '../../lib/adminStore'
import { Pagination } from '../ui/Pagination'
import { useToast } from '../ui/Toast'

const roleOrder: AdminRoleKey[] = ['super_admin', 'platform_admin', 'billing_admin', 'support_admin', 'auditor']
const PAGE_SIZE = 8

function toCsv(rows: string[][]): string {
  return rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
}

export function SecurityCompliance({ role, actor }: { role: AdminRoleKey; actor: string }) {
  const { audit, rolePermissions } = useAdminData()
  const can = useCan()
  const notify = useToast()
  const canManageRoles = can(role, 'manage:roles')
  const canExport = can(role, 'export:audit_logs')

  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return audit
    return audit.filter((a) => `${a.actor} ${a.action} ${a.resource}`.toLowerCase().includes(q))
  }, [audit, query])

  useEffect(() => setPage(1), [query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const permitted = (r: AdminRoleKey, perm: Permission) => {
    const p = rolePermissions[r]
    return p === '*' || p.includes(perm)
  }

  const toggle = (r: AdminRoleKey, perm: Permission) => {
    if (!canManageRoles || r === 'super_admin') return
    setRolePermission(r, perm, !permitted(r, perm), actor)
  }

  const exportCsv = () => {
    const header = ['Actor', 'Action', 'Resource', 'Timestamp', 'IP']
    const rows = filtered.map((a) => [a.actor, a.action, a.resource, a.timestamp, a.ip])
    const blob = new Blob([toCsv([header, ...rows])], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'cairn-audit-log.csv'
    link.click()
    URL.revokeObjectURL(url)
    notify(`Exported ${filtered.length} audit ${filtered.length === 1 ? 'row' : 'rows'}.`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h3 font-bold text-slate-900 dark:text-white">Security &amp; compliance</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Roles, permissions, and the audit trail.{canManageRoles ? ' Click a cell to grant or revoke.' : ''}
        </p>
      </div>

      {/* Permission matrix */}
      <div className="card overflow-x-auto">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <h2 className="font-display text-h5 font-semibold text-slate-900 dark:text-white">Role &amp; permission matrix</h2>
        </div>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs text-slate-400 dark:border-white/10">
              <th className="px-4 py-3 font-semibold uppercase tracking-wider">Permission</th>
              {roleOrder.map((r) => (
                <th key={r} className="px-3 py-3 text-center font-semibold">{ROLES[r].displayName.split(' ')[0]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ALL_PERMISSIONS.map((cat) => (
              <Fragment key={cat.category}>
                <tr>
                  <td colSpan={roleOrder.length + 1} className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-white/5 dark:text-slate-400">
                    {cat.category}
                  </td>
                </tr>
                {cat.perms.map((perm) => (
                  <tr key={perm} className="border-b border-slate-100 dark:border-white/5">
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-300">{perm}</td>
                    {roleOrder.map((r) => {
                      const on = permitted(r, perm)
                      const editable = canManageRoles && r !== 'super_admin'
                      const icon = on ? (
                        <CheckIcon className="mx-auto h-4 w-4 text-success" strokeWidth={2.5} />
                      ) : (
                        <MinusIcon className="mx-auto h-4 w-4 text-slate-300 dark:text-white/20" />
                      )
                      return (
                        <td key={r} className="px-3 py-2.5 text-center">
                          {editable ? (
                            <button
                              onClick={() => toggle(r, perm)}
                              aria-label={`${on ? 'Revoke' : 'Grant'} ${perm} for ${ROLES[r].displayName}`}
                              aria-pressed={on}
                              className="mx-auto grid h-7 w-7 place-items-center rounded-md transition hover:bg-slate-100 dark:hover:bg-white/10"
                            >
                              {icon}
                            </button>
                          ) : (
                            icon
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit log */}
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <h2 className="font-display text-h5 font-semibold text-slate-900 dark:text-white">Audit log</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter actions…"
                aria-label="Filter audit log"
                className="h-9 w-44 rounded-lg border border-slate-300 bg-white pl-8 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-signal-500 focus:outline-none focus:ring-2 focus:ring-signal-500/30 dark:border-white/15 dark:bg-white/5 dark:text-white"
              />
            </div>
            {canExport && (
              <button onClick={exportCsv} className="btn-ghost gap-1.5 text-xs">
                <ArrowDownTrayIcon className="h-4 w-4" /> Export
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-400 dark:border-white/10">
                <th className="px-4 py-3 font-semibold">Actor</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Resource</th>
                <th className="px-4 py-3 font-semibold">When</th>
                <th className="px-4 py-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((a) => (
                <tr key={a.id} className="border-b border-slate-100 dark:border-white/5">
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{a.actor}</td>
                  <td className="px-4 py-3"><span className="font-mono text-xs text-signal-700 dark:text-signal-300">{a.action}</span></td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.resource}</td>
                  <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{a.timestamp}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{a.ip}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No audit entries match “{query}”.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={safePage} pageCount={pageCount} total={filtered.length} onPage={setPage} />
      </div>
    </div>
  )
}
