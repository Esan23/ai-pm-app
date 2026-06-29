import { useEffect, useState } from 'react'
import {
  HomeIcon,
  UsersIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { AdminSidebar, type NavItem } from '../components/admin/AdminSidebar'
import { AdminHeader } from '../components/admin/AdminHeader'
import { AdminSignIn } from '../components/admin/AdminSignIn'
import { AdminDashboard } from '../components/admin/AdminDashboard'
import { UserManagement } from '../components/admin/UserManagement'
import { SubscriptionUsage } from '../components/admin/SubscriptionUsage'
import { SecurityCompliance } from '../components/admin/SecurityCompliance'
import { SystemConfig } from '../components/admin/SystemConfig'
import { ToastProvider } from '../components/ui/Toast'
import { can, ROLES, type AdminRoleKey, type Permission } from '../lib/admin'
import { useAdminSession, signOutAdmin } from '../lib/adminAuth'

interface Section extends NavItem {
  perm: Permission | null
}

const SECTIONS: Section[] = [
  { key: 'dashboard', label: 'Dashboard', icon: HomeIcon, perm: null },
  { key: 'users', label: 'Users', icon: UsersIcon, perm: 'view:users' },
  { key: 'subscriptions', label: 'Subscriptions', icon: CreditCardIcon, perm: 'view:subscriptions' },
  { key: 'security', label: 'Security', icon: ShieldCheckIcon, perm: 'view:audit_logs' },
  { key: 'system', label: 'System', icon: Cog6ToothIcon, perm: 'view:integrations' },
]

export default function AdminPage() {
  const { currentAdmin } = useAdminSession()
  const [active, setActive] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [previewRole, setPreviewRole] = useState<AdminRoleKey>('super_admin')

  // Gate: no signed-in admin → sign-in screen.
  if (!currentAdmin) return <AdminSignIn />

  const isSuper = currentAdmin.adminRole === 'super_admin'
  const role: AdminRoleKey = isSuper ? previewRole : (currentAdmin.adminRole as AdminRoleKey)
  const actor = currentAdmin.name

  const allowed = SECTIONS.filter((s) => s.perm === null || can(role, s.perm))

  return <AdminShell
    role={role}
    actor={actor}
    currentAdmin={currentAdmin}
    isSuper={isSuper}
    previewRole={previewRole}
    setPreviewRole={setPreviewRole}
    allowed={allowed}
    active={active}
    setActive={setActive}
    search={search}
    setSearch={setSearch}
    drawerOpen={drawerOpen}
    setDrawerOpen={setDrawerOpen}
  />
}

// Inner shell keeps hooks stable after the auth gate's early return.
function AdminShell(props: {
  role: AdminRoleKey
  actor: string
  currentAdmin: NonNullable<ReturnType<typeof useAdminSession>['currentAdmin']>
  isSuper: boolean
  previewRole: AdminRoleKey
  setPreviewRole: (r: AdminRoleKey) => void
  allowed: Section[]
  active: string
  setActive: (s: string) => void
  search: string
  setSearch: (s: string) => void
  drawerOpen: boolean
  setDrawerOpen: (b: boolean) => void
}) {
  const {
    role, actor, currentAdmin, isSuper, previewRole, setPreviewRole,
    allowed, active, setActive, search, setSearch, drawerOpen, setDrawerOpen,
  } = props

  // If the effective role can't see the active section, fall back to dashboard.
  useEffect(() => {
    if (!allowed.some((s) => s.key === active)) setActive('dashboard')
  }, [allowed, active, setActive])

  return (
    <ToastProvider>
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-700 dark:bg-ink dark:text-slate-300">
      <AdminHeader
        currentAdmin={currentAdmin}
        isSuper={isSuper}
        previewRole={previewRole}
        onPreviewRole={setPreviewRole}
        search={search}
        onSearch={setSearch}
        onMenu={() => setDrawerOpen(true)}
        onSignOut={signOutAdmin}
      />

      <div className="flex flex-1">
        <AdminSidebar
          items={allowed}
          active={active}
          onSelect={setActive}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1180px]">
            {active === 'dashboard' && <AdminDashboard />}
            {active === 'users' && <UserManagement role={role} actor={actor} search={search} />}
            {active === 'subscriptions' && <SubscriptionUsage role={role} />}
            {active === 'security' && <SecurityCompliance role={role} />}
            {active === 'system' && <SystemConfig role={role} actor={actor} />}
          </div>
        </main>
      </div>

      <footer className="border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-400 dark:border-white/10">
        Cairn Admin · signed in as {currentAdmin.name}
        {isSuper ? ` · previewing as ${ROLES[role].displayName}` : ` · ${ROLES[role].displayName}`} · demo data · ISM6427c
      </footer>
    </div>
    </ToastProvider>
  )
}
