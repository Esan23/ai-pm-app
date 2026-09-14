import { useEffect, useState } from 'react'
import {
  HomeIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import { AdminSidebar, type NavItem } from '../components/admin/AdminSidebar'
import { AdminHeader } from '../components/admin/AdminHeader'
import { AdminSignIn } from '../components/admin/AdminSignIn'
import { AdminSignInLive, AdminNotAuthorized, AdminLoading } from '../components/admin/AdminSignInLive'
import { AdminDashboard } from '../components/admin/AdminDashboard'
import { UserManagement } from '../components/admin/UserManagement'
import { FeedbackInbox } from '../components/admin/FeedbackInbox'
import { SubscriptionUsage } from '../components/admin/SubscriptionUsage'
import { SecurityCompliance } from '../components/admin/SecurityCompliance'
import { SystemConfig } from '../components/admin/SystemConfig'
import { ToastProvider } from '../components/ui/Toast'
import { ROLES, type AdminRoleKey, type Permission } from '../lib/admin'
import {
  useCanUnified,
  useUnifiedAdminData,
  isLiveAdmin,
  countNewFeedback,
  feedbackSeenAt,
  markFeedbackSeen,
} from '../lib/adminData'
import { useAdminSession, signOutAdmin } from '../lib/adminAuth'
import { isSupabaseConfigured } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { fetchAdminContext } from '../lib/adminSupabase'

interface Section extends NavItem {
  perm: Permission | null
}

const SECTIONS: Section[] = [
  { key: 'dashboard', label: 'Dashboard', icon: HomeIcon, perm: null },
  { key: 'users', label: 'Users', icon: UsersIcon, perm: 'view:users' },
  { key: 'feedback', label: 'Feedback', icon: ChatBubbleLeftRightIcon, perm: 'view:feedback' },
  { key: 'subscriptions', label: 'Subscriptions', icon: CreditCardIcon, perm: 'view:subscriptions' },
  { key: 'security', label: 'Security', icon: ShieldCheckIcon, perm: 'view:audit_logs' },
  { key: 'system', label: 'System', icon: Cog6ToothIcon, perm: 'view:integrations' },
]

export default function AdminPage() {
  // Live backend when Supabase is configured; otherwise the demo gate + store.
  return isSupabaseConfigured ? <LiveAdminGate /> : <DemoAdminGate />
}

/** Demo gate: staff-picker + localStorage store. Not a security boundary. */
function DemoAdminGate() {
  const { currentAdmin } = useAdminSession()
  if (!currentAdmin) return <AdminSignIn />
  return (
    <AdminShell
      adminName={currentAdmin.name}
      adminRole={currentAdmin.adminRole as AdminRoleKey}
      onSignOut={signOutAdmin}
    />
  )
}

/** Live gate: Supabase magic-link auth + DB-backed platform-admin check. */
function LiveAdminGate() {
  const { user, loading, signOut } = useAuth()
  const [state, setState] = useState<{ status: 'loading' | 'ok' | 'forbidden'; role?: AdminRoleKey }>({
    status: 'loading',
  })

  useEffect(() => {
    if (!user) return
    let alive = true
    setState({ status: 'loading' })
    fetchAdminContext(user.id).then((ctx) => {
      if (!alive) return
      setState(ctx ? { status: 'ok', role: ctx.role } : { status: 'forbidden' })
    })
    return () => {
      alive = false
    }
  }, [user])

  if (loading) return <AdminLoading />
  if (!user) return <AdminSignInLive />
  if (state.status === 'loading') return <AdminLoading />
  if (state.status === 'forbidden') return <AdminNotAuthorized email={user.email} onSignOut={signOut} />
  return <AdminShell adminName={user.email ?? 'Admin'} adminRole={state.role!} onSignOut={signOut} />
}

/** The console. Identity + sign-out are supplied by whichever gate mounted it. */
function AdminShell({
  adminName,
  adminRole,
  onSignOut,
}: {
  adminName: string
  adminRole: AdminRoleKey
  onSignOut: () => void
}) {
  const can = useCanUnified()
  const { ready, feedback } = useUnifiedAdminData()
  const [active, setActive] = useState('dashboard')
  // Two marks, deliberately. `seenAt` drives the sidebar badge and moves to
  // "now" the moment the section is opened, so the pill clears immediately.
  // `highlightSince` stays where it was, so the entries that were new when he
  // clicked keep their New tag while he is reading them.
  const [seenAt, setSeenAt] = useState<string | null>(() => feedbackSeenAt())
  const [highlightSince, setHighlightSince] = useState<string | null>(seenAt)
  const [search, setSearch] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const isSuper = adminRole === 'super_admin'
  const [previewRole, setPreviewRole] = useState<AdminRoleKey>(adminRole)

  const role: AdminRoleKey = isSuper ? previewRole : adminRole
  const actor = adminName
  const allowed = SECTIONS.filter((s) => s.perm === null || can(role, s.perm))
  const newFeedback = countNewFeedback(feedback, seenAt)
  const navItems = allowed.map((s) =>
    s.key === 'feedback' && active !== 'feedback' ? { ...s, badge: newFeedback } : s,
  )

  const onSelect = (key: string) => {
    if (key === 'feedback') {
      // Marked on open, not on read: the badge answers "has anything arrived
      // since I last looked", which is a question about looking.
      const now = new Date().toISOString()
      markFeedbackSeen(now)
      setHighlightSince(seenAt)
      setSeenAt(now)
    }
    setActive(key)
  }

  useEffect(() => {
    if (ready && !allowed.some((s) => s.key === active)) setActive('dashboard')
  }, [ready, allowed, active])

  // Live mode: role permissions arrive with the first fetch — wait so the
  // nav doesn't render half-gated.
  if (isLiveAdmin && !ready) return <AdminLoading />

  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-700 dark:bg-ink dark:text-slate-300">
        <AdminHeader
          adminName={adminName}
          adminRole={adminRole}
          isSuper={isSuper}
          previewRole={previewRole}
          onPreviewRole={setPreviewRole}
          search={search}
          onSearch={setSearch}
          onMenu={() => setDrawerOpen(true)}
          onSignOut={onSignOut}
        />

        <div className="flex flex-1">
          <AdminSidebar
            items={navItems}
            active={active}
            onSelect={onSelect}
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
          />

          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1180px]">
              {active === 'dashboard' && <AdminDashboard />}
              {active === 'users' && <UserManagement role={role} actor={actor} search={search} />}
              {active === 'feedback' && <FeedbackInbox seenAt={highlightSince} />}
              {active === 'subscriptions' && <SubscriptionUsage role={role} />}
              {active === 'security' && <SecurityCompliance role={role} actor={actor} />}
              {active === 'system' && <SystemConfig role={role} actor={actor} />}
            </div>
          </main>
        </div>

        <footer className="border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-400 dark:border-white/10">
          Cairn Admin · signed in as {adminName}
          {isSuper ? ` · previewing as ${ROLES[role].displayName}` : ` · ${ROLES[role].displayName}`}
          {isSupabaseConfigured ? ' · live backend' : ' · demo data'} · ISM6427c
        </footer>
      </div>
    </ToastProvider>
  )
}
