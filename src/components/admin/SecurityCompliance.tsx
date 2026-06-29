import { Fragment } from 'react'
import { CheckIcon, MinusIcon } from '@heroicons/react/24/outline'
import { ALL_PERMISSIONS, ROLES, can, type AdminRoleKey } from '../../lib/admin'
import { useAdminData } from '../../lib/adminStore'

const roleOrder: AdminRoleKey[] = ['super_admin', 'platform_admin', 'billing_admin', 'support_admin', 'auditor']

export function SecurityCompliance({ role }: { role: AdminRoleKey }) {
  const { audit } = useAdminData()
  const canExport = can(role, 'export:audit_logs')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h3 font-bold text-slate-900 dark:text-white">Security & compliance</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Roles, permissions, and the audit trail.</p>
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
                    {roleOrder.map((r) => (
                      <td key={r} className="px-3 py-2.5 text-center">
                        {can(r, perm) ? (
                          <CheckIcon className="mx-auto h-4 w-4 text-success" strokeWidth={2.5} />
                        ) : (
                          <MinusIcon className="mx-auto h-4 w-4 text-slate-300 dark:text-white/20" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Audit log */}
      <div className="card overflow-x-auto">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-white/10">
          <h2 className="font-display text-h5 font-semibold text-slate-900 dark:text-white">Audit log</h2>
          {canExport && <button className="btn-ghost text-xs">Export</button>}
        </div>
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
            {audit.map((a) => (
              <tr key={a.id} className="border-b border-slate-100 dark:border-white/5">
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{a.actor}</td>
                <td className="px-4 py-3"><span className="font-mono text-xs text-signal-700 dark:text-signal-300">{a.action}</span></td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{a.resource}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{a.timestamp}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-400">{a.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
