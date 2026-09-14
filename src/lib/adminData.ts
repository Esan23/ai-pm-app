import { useEffect, useSyncExternalStore } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'
import {
  PLANS,
  SEED_FEEDBACK,
  SEED_USAGE,
  type AdminRoleKey,
  type AdminUser,
  type AuditEntry,
  type FeedbackEntry,
  type FeedbackRowContext,
  type Integration,
  type IntegrationStatus,
  type Permission,
  type Plan,
  type PlanName,
  type ProviderUsage,
  type Subscription,
  type SubStatus,
  type UserStatus,
} from './admin'
import {
  useAdminData,
  createUser as demoCreateUser,
  updateUser as demoUpdateUser,
  setUserStatus as demoSetUserStatus,
  resendInvite as demoResendInvite,
  setRolePermission as demoSetRolePermission,
  setIntegrationStatus as demoSetIntegrationStatus,
  updateSetting as demoUpdateSetting,
  type AdminSettings,
  type NewUserInput,
} from './adminStore'

/**
 * Unified admin data layer.
 * Live mode (Supabase configured): all sections read RLS-protected tables;
 * config writes (role permissions, integrations, settings) go straight to
 * the DB where RLS enforces the permission and audit triggers log the change
 * atomically. User mutations go through the service-role Netlify function.
 * Demo mode: the localStorage adminStore, unchanged.
 */

export const isLiveAdmin = isSupabaseConfigured

export type RolePermissionMap = Record<AdminRoleKey, Permission[] | '*'>

export interface UnifiedAdminState {
  ready: boolean
  users: AdminUser[]
  audit: AuditEntry[]
  plans: Plan[]
  subscriptions: Subscription[]
  usage: ProviderUsage[]
  usageIsLive: boolean
  integrations: Integration[]
  settings: AdminSettings
  rolePermissions: RolePermissionMap
  feedback: FeedbackEntry[]
}

// ---- Live store (module singleton, useSyncExternalStore) ----------------

const EMPTY_PERMS: RolePermissionMap = {
  super_admin: '*',
  platform_admin: [],
  billing_admin: [],
  support_admin: [],
  auditor: [],
}

const DEFAULT_SETTINGS: AdminSettings = {
  transactionalEmail: true,
  trialReminders: true,
  overageAlerts: true,
  enterpriseWhiteLabel: false,
  locale: 'English (US)',
  currency: 'USD ($)',
}

let liveState: UnifiedAdminState = {
  ready: false,
  users: [],
  audit: [],
  plans: [],
  subscriptions: [],
  usage: SEED_USAGE,
  usageIsLive: false,
  integrations: [],
  settings: DEFAULT_SETTINGS,
  rolePermissions: EMPTY_PERMS,
  feedback: [],
}

const listeners = new Set<() => void>()
function emit() {
  listeners.forEach((l) => l())
}
function subscribeLive(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}
function getLiveSnapshot() {
  return liveState
}

const PROVIDER_LABEL: Record<string, ProviderUsage['provider']> = {
  claude: 'Claude',
  chatgpt: 'ChatGPT',
  copilot: 'Copilot',
  gemini: 'Gemini',
}

let inFlight = false
export async function refreshLive(): Promise<void> {
  if (!supabase || inFlight) return
  inFlight = true
  try {
    const [profiles, staff, audit, plans, subs, usage, integrations, settings, rolePerms, feedback] =
      await Promise.all([
        supabase.from('profiles').select('id,email,full_name,plan,status,last_active_at').order('created_at'),
        supabase.from('admin_users').select('user_id,role_key'),
        supabase
          .from('audit_logs')
          .select('id,actor_name,action,resource,ip,created_at')
          .order('created_at', { ascending: false })
          .limit(200),
        supabase.from('subscription_plans').select('*').order('price_monthly', { ascending: true, nullsFirst: false }),
        supabase.from('customer_subscriptions').select('*, subscription_plans(name)').order('created_at'),
        supabase.from('usage_records').select('provider,quantity,cost,metric'),
        supabase.from('integrations').select('id,name,category,status').order('category').order('name'),
        supabase.from('platform_settings').select('settings').eq('id', true).maybeSingle(),
        supabase.from('role_permissions').select('role_key,permission_key'),
        // RLS returns nothing rather than an error when this admin lacks
        // view:feedback, so no separate permission check is needed here.
        supabase
          .from('feedback')
          .select('id,user_id,email,message,context,created_at')
          .order('created_at', { ascending: false })
          .limit(500),
      ])

    const roleByUser = new Map(
      (staff.data ?? []).map((s) => [s.user_id as string, s.role_key as AdminRoleKey]),
    )

    const users: AdminUser[] = (profiles.data ?? []).map((p) => ({
      id: p.id as string,
      name: (p.full_name as string) || (p.email as string) || (p.id as string),
      email: (p.email as string) ?? '',
      workspace: '—',
      plan: ((p.plan as string) || 'Free') as PlanName,
      adminRole: roleByUser.get(p.id as string) ?? null,
      status: ((p.status as string) || 'active') as UserStatus,
      lastActive: p.last_active_at ? String(p.last_active_at).slice(0, 10) : '—',
      providers: [],
    }))

    const auditRows: AuditEntry[] = (audit.data ?? []).map((a) => ({
      id: a.id as string,
      actor: (a.actor_name as string) ?? '—',
      action: a.action as string,
      resource: (a.resource as string) ?? '',
      timestamp: String(a.created_at).slice(0, 16).replace('T', ' '),
      ip: (a.ip as string) ?? '—',
    }))

    const planRows: Plan[] = (plans.data ?? []).map((p) => ({
      id: p.id as string,
      name: p.name as PlanName,
      priceMonthly: p.price_monthly === null ? null : Number(p.price_monthly),
      priceAnnual: p.price_annual === null ? null : Number(p.price_annual),
      seatLimit: p.seat_limit as number | null,
      projectLimit: p.project_limit as number | null,
      captureQuota: p.capture_quota as number | null,
    }))

    const subRows: Subscription[] = (subs.data ?? []).map((s) => ({
      id: s.id as string,
      workspace: (s.workspace_name as string) ?? '—',
      plan: (((s.subscription_plans as { name?: string } | null)?.name as PlanName) ?? 'Free') as PlanName,
      status: s.status as SubStatus,
      cycle: s.billing_cycle as 'monthly' | 'annual',
      seats: (s.seats as number) ?? 1,
      mrr: Number(s.mrr ?? 0),
      renewal: s.current_period_end ? String(s.current_period_end).slice(0, 10) : '—',
    }))

    // Aggregate metered usage per provider; fall back to the illustrative
    // seed until real metering lands.
    const byProvider = new Map<string, ProviderUsage>()
    for (const r of usage.data ?? []) {
      const label = PROVIDER_LABEL[(r.provider as string) ?? '']
      if (!label) continue
      const cur = byProvider.get(label) ?? { provider: label, captures: 0, tokens: 0, cost: 0 }
      if (r.metric === 'captures') cur.captures += Number(r.quantity ?? 0)
      if (r.metric === 'tokens') cur.tokens += Number(r.quantity ?? 0)
      cur.cost += Number(r.cost ?? 0)
      byProvider.set(label, cur)
    }
    const usageIsLive = byProvider.size > 0

    const perms: RolePermissionMap = {
      super_admin: '*',
      platform_admin: [],
      billing_admin: [],
      support_admin: [],
      auditor: [],
    }
    for (const rp of rolePerms.data ?? []) {
      const role = rp.role_key as AdminRoleKey
      if (role === 'super_admin') continue
      const list = perms[role]
      if (Array.isArray(list)) list.push(rp.permission_key as Permission)
    }

    const feedbackRows: FeedbackEntry[] = (feedback.data ?? []).map((f) => ({
      id: f.id as string,
      userId: (f.user_id as string) ?? null,
      email: (f.email as string) ?? null,
      message: (f.message as string) ?? '',
      createdAt: String(f.created_at),
      context: (f.context as FeedbackRowContext) ?? {},
    }))

    liveState = {
      ready: true,
      users,
      audit: auditRows,
      plans: planRows,
      subscriptions: subRows,
      usage: usageIsLive ? [...byProvider.values()] : SEED_USAGE,
      usageIsLive,
      integrations: (integrations.data ?? []) as Integration[],
      settings: { ...DEFAULT_SETTINGS, ...((settings.data?.settings as Partial<AdminSettings>) ?? {}) },
      rolePermissions: perms,
      feedback: feedbackRows,
    }
    emit()
  } finally {
    inFlight = false
  }
}

let fetchedOnce = false
function ensureLiveFetched() {
  if (!fetchedOnce) {
    fetchedOnce = true
    void refreshLive()
  }
}

// ---- Unified hooks ------------------------------------------------------

export function useUnifiedAdminData(): UnifiedAdminState & { refresh: () => void } {
  const demo = useAdminData()
  const live = useSyncExternalStore(subscribeLive, getLiveSnapshot, getLiveSnapshot)

  useEffect(() => {
    if (isLiveAdmin) ensureLiveFetched()
  }, [])

  if (!isLiveAdmin) {
    return {
      ready: true,
      users: demo.users,
      audit: demo.audit,
      plans: PLANS,
      subscriptions: demo.subscriptions,
      usage: SEED_USAGE,
      usageIsLive: false,
      integrations: demo.integrations,
      settings: demo.settings,
      rolePermissions: demo.rolePermissions,
      feedback: SEED_FEEDBACK,
      refresh: () => {},
    }
  }
  return { ...live, refresh: () => void refreshLive() }
}

/** Permission check backed by the same source the matrix edits (DB or demo). */
export function useCanUnified(): (role: AdminRoleKey, perm: Permission) => boolean {
  const { rolePermissions } = useUnifiedAdminData()
  return (role, perm) => {
    if (role === 'super_admin') return true
    const p = rolePermissions[role]
    return p === '*' || (Array.isArray(p) && p.includes(perm))
  }
}

// ---- User mutations (service-role function in live mode) ----------------

async function callAdminFn(body: Record<string, unknown>): Promise<void> {
  if (!supabase) throw new Error('Not configured')
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('Not signed in')
  const res = await fetch('/.netlify/functions/admin-users', {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
}

export async function createUserUnified(input: NewUserInput, actor: string): Promise<void> {
  if (!isLiveAdmin) {
    demoCreateUser(input, actor)
    return
  }
  await callAdminFn({
    action: 'create',
    email: input.email,
    fullName: input.name,
    plan: input.plan,
    roleKey: input.adminRole,
  })
}

export async function updateUserUnified(
  id: string,
  patch: { name: string; plan: PlanName; adminRole: AdminRoleKey | null },
  actor: string,
): Promise<void> {
  if (!isLiveAdmin) {
    demoUpdateUser(id, patch, actor)
    return
  }
  await callAdminFn({ action: 'update', userId: id, fullName: patch.name, plan: patch.plan, roleKey: patch.adminRole })
}

export async function setUserStatusUnified(id: string, status: UserStatus, actor: string): Promise<void> {
  if (!isLiveAdmin) {
    demoSetUserStatus(id, status, actor)
    return
  }
  await callAdminFn({ action: status === 'suspended' ? 'suspend' : 'reactivate', userId: id })
}

export async function resendInviteUnified(id: string, email: string, actor: string): Promise<void> {
  if (!isLiveAdmin) {
    demoResendInvite(id, actor)
    return
  }
  if (!supabase) throw new Error('Not configured')
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) throw error
}

// ---- Config mutations (direct, RLS-gated; audit via DB triggers) ---------

function throwIfError(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

export async function setRolePermissionUnified(
  role: AdminRoleKey,
  perm: Permission,
  on: boolean,
  actor: string,
): Promise<void> {
  if (!isLiveAdmin) {
    demoSetRolePermission(role, perm, on, actor)
    return
  }
  if (!supabase) throw new Error('Not configured')
  if (on) {
    const { error } = await supabase.from('role_permissions').insert({ role_key: role, permission_key: perm })
    throwIfError(error)
  } else {
    const { error } = await supabase.from('role_permissions').delete().match({ role_key: role, permission_key: perm })
    throwIfError(error)
  }
  await refreshLive()
}

export async function setIntegrationStatusUnified(
  integration: Integration,
  status: IntegrationStatus,
  actor: string,
): Promise<void> {
  if (!isLiveAdmin) {
    demoSetIntegrationStatus(integration.name, status, actor)
    return
  }
  if (!supabase) throw new Error('Not configured')
  const { error } = await supabase.from('integrations').update({ status }).eq('name', integration.name)
  throwIfError(error)
  await refreshLive()
}

export async function updateSettingUnified<K extends keyof AdminSettings>(
  key: K,
  value: AdminSettings[K],
  current: AdminSettings,
  actor: string,
): Promise<void> {
  if (!isLiveAdmin) {
    demoUpdateSetting(key, value, actor)
    return
  }
  if (!supabase) throw new Error('Not configured')
  const merged = { ...current, [key]: value }
  const { error } = await supabase
    .from('platform_settings')
    .update({ settings: merged, updated_at: new Date().toISOString() })
    .eq('id', true)
  throwIfError(error)
  await refreshLive()
}

// ---- Feedback: "new since you last looked" ------------------------------

const FEEDBACK_SEEN_KEY = 'cairn.admin.feedbackSeenAt'

/**
 * When this browser last opened the feedback inbox.
 *
 * Per-browser rather than per-account on purpose: the feedback table is
 * append-only by design — no row may be updated at any role — so there is
 * nowhere to record "read" without giving somebody the power to edit
 * feedback. A local high-water mark buys the badge without that trade.
 */
export function feedbackSeenAt(): string | null {
  try {
    return localStorage.getItem(FEEDBACK_SEEN_KEY)
  } catch {
    return null
  }
}

export function markFeedbackSeen(at: string): void {
  try {
    localStorage.setItem(FEEDBACK_SEEN_KEY, at)
  } catch {
    // Private window, or storage blocked. The badge just keeps counting.
  }
}

/** How many entries arrived after `seenAt`. Everything counts when it is null. */
export function countNewFeedback(rows: FeedbackEntry[], seenAt: string | null): number {
  if (!seenAt) return rows.length
  const cutoff = Date.parse(seenAt)
  if (Number.isNaN(cutoff)) return rows.length
  return rows.filter((r) => Date.parse(r.createdAt) > cutoff).length
}
