import { useMemo, useState } from 'react'
import { XMarkIcon, NoSymbolIcon, CheckCircleIcon, PaperAirplaneIcon, PlusIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { ProviderBadge } from '../app/ProviderBadge'
import { ConfirmDialog } from '../ui/ConfirmDialog'
import { useToast } from '../ui/Toast'
import { useModal } from '../../hooks/useModal'
import { can, ROLES, type AdminRoleKey, type AdminUser, type PlanName, type UserStatus } from '../../lib/admin'
import { useAdminData, createUser, updateUser, setUserStatus, resendInvite } from '../../lib/adminStore'

const statusStyles: Record<UserStatus, string> = {
  active: 'bg-success/10 text-success',
  suspended: 'bg-error/10 text-error',
  pending: 'bg-warning/10 text-warning',
}

const ADMIN_ROLE_OPTIONS: (AdminRoleKey | 'member')[] = ['member', 'support_admin', 'billing_admin', 'platform_admin', 'super_admin']

export function UserManagement({ role, actor, search }: { role: AdminRoleKey; actor: string; search: string }) {
  const { users } = useAdminData()
  const notify = useToast()
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [pendingSuspend, setPendingSuspend] = useState<{ id: string; name: string } | null>(null)

  const canCreate = can(role, 'create:users')

  const selected = users.find((u) => u.id === selectedId) ?? null

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return users.filter((u) => {
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (planFilter !== 'all' && u.plan !== planFilter) return false
      if (q && !`${u.name} ${u.email} ${u.workspace}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [users, statusFilter, planFilter, search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-h3 font-bold text-slate-900 dark:text-white">User management</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {filtered.length} of {users.length} users{search ? ` · matching “${search}”` : ''}
          </p>
        </div>
        {canCreate && (
          <button onClick={() => setShowCreate(true)} className="btn-primary gap-2">
            <PlusIcon className="h-4 w-4" /> New user
          </button>
        )}
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
                onClick={() => setSelectedId(u.id)}
                className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50 dark:border-white/5 dark:hover:bg-white/5"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 dark:text-white">{u.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                </td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.workspace}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.plan}</td>
                <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.adminRole ? ROLES[u.adminRole].displayName : 'Member'}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${statusStyles[u.status]}`}>{u.status}</span>
                </td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.lastActive}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">No users match your filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <UserDrawer
          key={selected.id}
          user={selected}
          role={role}
          actor={actor}
          onClose={() => setSelectedId(null)}
          onRequestSuspend={() => setPendingSuspend({ id: selected.id, name: selected.name })}
        />
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={(input) => {
            createUser(input, actor)
            setShowCreate(false)
            notify(`Created ${input.email} and sent an invite.`)
          }}
        />
      )}

      {pendingSuspend && (
        <ConfirmDialog
          title="Suspend user?"
          message={`${pendingSuspend.name} will lose access until reactivated. This is recorded in the audit log.`}
          confirmLabel="Suspend"
          onConfirm={() => {
            setUserStatus(pendingSuspend.id, 'suspended', actor)
            notify(`${pendingSuspend.name} suspended.`, 'info')
            setPendingSuspend(null)
          }}
          onCancel={() => setPendingSuspend(null)}
        />
      )}
    </div>
  )
}

function UserDrawer({
  user, role, actor, onClose, onRequestSuspend,
}: {
  user: AdminUser
  role: AdminRoleKey
  actor: string
  onClose: () => void
  onRequestSuspend: () => void
}) {
  const ref = useModal<HTMLDivElement>(onClose)
  const notify = useToast()
  const [editing, setEditing] = useState(false)
  const canUpdate = can(role, 'update:users')
  const canSuspend = can(role, 'suspend:users')

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="User detail"
        className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-slate-200 bg-white dark:border-white/10 dark:bg-ink"
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-white/10">
          <h2 className="font-display text-h5 font-semibold text-slate-900 dark:text-white">User detail</h2>
          <button onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <p className="font-display text-h5 font-bold text-slate-900 dark:text-white">{user.name}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
            <span className={`mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${statusStyles[user.status]}`}>{user.status}</span>
          </div>

          {editing && canUpdate ? (
            <EditForm
              initial={{ name: user.name, plan: user.plan, adminRole: user.adminRole }}
              onCancel={() => setEditing(false)}
              onSave={(patch) => {
                updateUser(user.id, patch, actor)
                setEditing(false)
                notify(`Saved changes to ${patch.name}.`)
              }}
            />
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-slate-400">Workspace</dt><dd className="text-slate-700 dark:text-slate-200">{user.workspace}</dd></div>
                <div><dt className="text-slate-400">Plan</dt><dd className="text-slate-700 dark:text-slate-200">{user.plan}</dd></div>
                <div><dt className="text-slate-400">Admin role</dt><dd className="text-slate-700 dark:text-slate-200">{user.adminRole ? ROLES[user.adminRole].displayName : 'Member'}</dd></div>
                <div><dt className="text-slate-400">Last active</dt><dd className="text-slate-700 dark:text-slate-200">{user.lastActive}</dd></div>
              </dl>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">AI providers used</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {user.providers.length ? user.providers.map((p) => <ProviderBadge key={p} provider={p} />) : <span className="text-sm text-slate-400">None yet</span>}
                </div>
              </div>

              <div className="space-y-2 border-t border-slate-100 pt-5 dark:border-white/5">
                {!canUpdate && !canSuspend && <p className="text-sm text-slate-400">Your role has read-only access to users.</p>}
                {canUpdate && (
                  <button onClick={() => setEditing(true)} className="btn-ghost w-full justify-start gap-2">
                    <PencilSquareIcon className="h-4 w-4" /> Edit user
                  </button>
                )}
                {user.status === 'pending' && canUpdate && (
                  <button onClick={() => { resendInvite(user.id, actor); notify(`Invite re-sent to ${user.email}.`) }} className="btn-ghost w-full justify-start gap-2">
                    <PaperAirplaneIcon className="h-4 w-4" /> Resend magic-link invite
                  </button>
                )}
                {canSuspend && user.status !== 'suspended' && (
                  <button onClick={onRequestSuspend} className="btn-ghost w-full justify-start gap-2 text-error">
                    <NoSymbolIcon className="h-4 w-4" /> Suspend user
                  </button>
                )}
                {canSuspend && user.status === 'suspended' && (
                  <button onClick={() => { setUserStatus(user.id, 'active', actor); notify(`${user.name} reactivated.`) }} className="btn-ghost w-full justify-start gap-2 text-success">
                    <CheckCircleIcon className="h-4 w-4" /> Reactivate user
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  )
}

function EditForm({
  initial, onSave, onCancel,
}: {
  initial: { name: string; plan: PlanName; adminRole: AdminRoleKey | null }
  onSave: (patch: { name: string; plan: PlanName; adminRole: AdminRoleKey | null }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial.name)
  const [plan, setPlan] = useState<PlanName>(initial.plan)
  const [roleSel, setRoleSel] = useState<AdminRoleKey | 'member'>(initial.adminRole ?? 'member')

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); onSave({ name: name.trim(), plan, adminRole: roleSel === 'member' ? null : roleSel }) }}
      className="space-y-3 border-t border-slate-100 pt-5 dark:border-white/5"
    >
      <label className="block text-sm">
        <span className="text-slate-500 dark:text-slate-400">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required className="input-field mt-1" />
      </label>
      <label className="block text-sm">
        <span className="text-slate-500 dark:text-slate-400">Plan</span>
        <select value={plan} onChange={(e) => setPlan(e.target.value as PlanName)} className="input-field mt-1">
          <option>Free</option><option>Pro</option><option>Enterprise</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-slate-500 dark:text-slate-400">Admin role</span>
        <select value={roleSel} onChange={(e) => setRoleSel(e.target.value as AdminRoleKey | 'member')} className="input-field mt-1">
          {ADMIN_ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>{r === 'member' ? 'Member' : ROLES[r].displayName}</option>
          ))}
        </select>
      </label>
      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn-primary flex-1">Save changes</button>
        <button type="button" onClick={onCancel} className="btn-ghost">Cancel</button>
      </div>
    </form>
  )
}

function CreateModal({
  onClose, onCreate,
}: {
  onClose: () => void
  onCreate: (input: { name: string; email: string; workspace: string; plan: PlanName; adminRole: AdminRoleKey | null }) => void
}) {
  const ref = useModal<HTMLDivElement>(onClose)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [workspace, setWorkspace] = useState('')
  const [plan, setPlan] = useState<PlanName>('Free')
  const [roleSel, setRoleSel] = useState<AdminRoleKey | 'member'>('member')

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label="Create user" className="card relative w-full max-w-md p-6">
        <h2 className="font-display text-h5 font-bold text-slate-900 dark:text-white">Create user</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">A magic-link invite is sent on creation.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); onCreate({ name: name.trim(), email: email.trim(), workspace: workspace.trim() || 'New workspace', plan, adminRole: roleSel === 'member' ? null : roleSel }) }}
          className="mt-5 space-y-3 text-sm"
        >
          <label className="block">
            <span className="text-slate-500 dark:text-slate-400">Full name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required className="input-field mt-1" />
          </label>
          <label className="block">
            <span className="text-slate-500 dark:text-slate-400">Work email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="input-field mt-1" />
          </label>
          <label className="block">
            <span className="text-slate-500 dark:text-slate-400">Workspace</span>
            <input value={workspace} onChange={(e) => setWorkspace(e.target.value)} className="input-field mt-1" placeholder="e.g. Helios" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-slate-500 dark:text-slate-400">Plan</span>
              <select value={plan} onChange={(e) => setPlan(e.target.value as PlanName)} className="input-field mt-1">
                <option>Free</option><option>Pro</option><option>Enterprise</option>
              </select>
            </label>
            <label className="block">
              <span className="text-slate-500 dark:text-slate-400">Admin role</span>
              <select value={roleSel} onChange={(e) => setRoleSel(e.target.value as AdminRoleKey | 'member')} className="input-field mt-1">
                {ADMIN_ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r === 'member' ? 'Member' : ROLES[r].displayName}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1">Create & invite</button>
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
