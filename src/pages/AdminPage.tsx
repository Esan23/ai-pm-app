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
import { AdminDashboard } from '../components/admin/AdminDashboard'
import { UserManagement } from '../components/admin/UserManagement'
import { SubscriptionUsage } from '../components/admin/SubscriptionUsage'
import { SecurityCompliance } from '../components/admin/SecurityCompliance'
import { SystemConfig } from '../components/admin/SystemConfig'
import { can, ROLES, type AdminRoleKey, type Permission } from '../lib/admin'

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
  const [role, setRole] = useState<AdminRoleKey>('super_admin')
  const [active, setActive] = useState('dashboard')
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)

  const allowed = SECTIONS.filter((s) => s.perm === null || can(role, s.perm))

  // If the current role can't see the active section, fall back to dashboard.
  useEffect(() => {
    if (!allowed.some((s) => s.key === active)) setActive('dashboard')
  }, [role, active, allowed])

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-700 dark:bg-ink dark:text-slate-300">
      <AdminHeader
        role={role}
        onRoleChange={setRole}
        search={search}
        onSearch={setSearch}
        onMenu={() => setDrawerOpen(true)}
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
            {active === 'users' && <UserManagement role={role} search={search} />}
            {active === 'subscriptions' && <SubscriptionUsage role={role} />}
            {active === 'security' && <SecurityCompliance role={role} />}
            {active === 'system' && <SystemConfig role={role} />}
          </div>
        </main>
      </div>

      <footer className="border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-400 dark:border-white/10">
        Cairn Admin · viewing as {ROLES[role].displayName} · demo data · A concept project — ISM6427c
      </footer>
    </div>
  )
}
