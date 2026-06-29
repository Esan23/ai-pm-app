import type { Provider } from './types'

// ---------------------------------------------------------------------------
// Admin domain types (front-end demo layer — mirrors docs/admin-page-spec.md).
// Seed-driven, no backend; the real schema/RLS/Stripe wiring is a follow-up.
// ---------------------------------------------------------------------------

export type AdminRoleKey =
  | 'super_admin'
  | 'platform_admin'
  | 'billing_admin'
  | 'support_admin'
  | 'auditor'

export type Permission =
  | 'view:users' | 'create:users' | 'update:users' | 'suspend:users' | 'delete:users'
  | 'view:subscriptions' | 'manage:plans' | 'update:subscriptions' | 'view:billing' | 'manage:promotions'
  | 'view:usage' | 'export:usage'
  | 'view:roles' | 'manage:roles' | 'view:audit_logs' | 'export:audit_logs' | 'manage:security'
  | 'view:integrations' | 'manage:integrations' | 'manage:settings'

export interface AdminRole {
  key: AdminRoleKey
  displayName: string
  description: string
  permissions: Permission[] | '*'
}

const USER_PERMS: Permission[] = ['view:users', 'create:users', 'update:users', 'suspend:users']
const SUB_PERMS: Permission[] = ['view:subscriptions', 'manage:plans', 'update:subscriptions', 'view:billing', 'manage:promotions', 'view:usage', 'export:usage']
const SYS_PERMS: Permission[] = ['view:integrations', 'manage:integrations', 'manage:settings']
const SEC_VIEW: Permission[] = ['view:roles', 'view:audit_logs']

export const ROLES: Record<AdminRoleKey, AdminRole> = {
  super_admin: {
    key: 'super_admin',
    displayName: 'Super Administrator',
    description: 'Unrestricted access, including role management and hard deletion.',
    permissions: '*',
  },
  platform_admin: {
    key: 'platform_admin',
    displayName: 'Platform Administrator',
    description: 'Full user, subscription, integration, and settings management.',
    permissions: [...USER_PERMS, ...SUB_PERMS, ...SYS_PERMS, ...SEC_VIEW],
  },
  billing_admin: {
    key: 'billing_admin',
    displayName: 'Billing Administrator',
    description: 'Manage plans, billing, promotions, and usage; read-only elsewhere.',
    permissions: ['view:users', ...SUB_PERMS, 'view:audit_logs'],
  },
  support_admin: {
    key: 'support_admin',
    displayName: 'Support Administrator',
    description: 'Assist customers: lookup, resend invites, unlock, adjust seats within policy.',
    permissions: ['view:users', 'update:users', 'view:subscriptions', 'view:usage'],
  },
  auditor: {
    key: 'auditor',
    displayName: 'Auditor (Read-only)',
    description: 'View-only access to users, subscriptions, and audit logs for compliance.',
    permissions: ['view:users', 'view:subscriptions', 'view:usage', 'view:roles', 'view:audit_logs', 'export:audit_logs'],
  },
}

export const ALL_PERMISSIONS: { category: string; perms: Permission[] }[] = [
  { category: 'User Management', perms: ['view:users', 'create:users', 'update:users', 'suspend:users', 'delete:users'] },
  { category: 'Subscription Management', perms: ['view:subscriptions', 'manage:plans', 'update:subscriptions', 'view:billing', 'manage:promotions'] },
  { category: 'Usage & Analytics', perms: ['view:usage', 'export:usage'] },
  { category: 'Security & Compliance', perms: ['view:roles', 'manage:roles', 'view:audit_logs', 'export:audit_logs', 'manage:security'] },
  { category: 'System Configuration', perms: ['view:integrations', 'manage:integrations', 'manage:settings'] },
]

export function can(role: AdminRoleKey, perm: Permission): boolean {
  const r = ROLES[role]
  return r.permissions === '*' || r.permissions.includes(perm)
}

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------

export type UserStatus = 'active' | 'suspended' | 'pending'
export type PlanName = 'Free' | 'Pro' | 'Enterprise'

export interface AdminUser {
  id: string
  name: string
  email: string
  workspace: string
  plan: PlanName
  adminRole: AdminRoleKey | null // null = regular member, not admin staff
  status: UserStatus
  lastActive: string
  providers: Provider[]
}

export interface Plan {
  id: string
  name: PlanName
  priceMonthly: number | null
  priceAnnual: number | null
  seatLimit: number | null
  projectLimit: number | null
  captureQuota: number | null
}

export type SubStatus = 'trialing' | 'active' | 'past_due' | 'canceled'

export interface Subscription {
  id: string
  workspace: string
  plan: PlanName
  status: SubStatus
  cycle: 'monthly' | 'annual'
  seats: number
  mrr: number
  renewal: string
}

export interface ProviderUsage {
  provider: Exclude<Provider, 'Human'>
  captures: number
  tokens: number
  cost: number
}

export interface AuditEntry {
  id: string
  actor: string
  action: string
  resource: string
  timestamp: string
  ip: string
}

export type IntegrationStatus = 'connected' | 'available' | 'error'
export interface Integration {
  name: string
  category: string
  status: IntegrationStatus
}

// ---------------------------------------------------------------------------
// Seed data (illustrative)
// ---------------------------------------------------------------------------

export const PLANS: Plan[] = [
  { id: 'pl_free', name: 'Free', priceMonthly: 0, priceAnnual: 0, seatLimit: 1, projectLimit: 3, captureQuota: 50 },
  { id: 'pl_pro', name: 'Pro', priceMonthly: 25, priceAnnual: 20, seatLimit: null, projectLimit: null, captureQuota: 2000 },
  { id: 'pl_ent', name: 'Enterprise', priceMonthly: null, priceAnnual: null, seatLimit: null, projectLimit: null, captureQuota: null },
]

export const SEED_USERS: AdminUser[] = [
  { id: 'u1', name: 'Daniel Okafor', email: 'daniel@helios.ai', workspace: 'Helios', plan: 'Pro', adminRole: null, status: 'active', lastActive: '2026-06-28', providers: ['Claude', 'Copilot', 'ChatGPT'] },
  { id: 'u2', name: 'Priya Nair', email: 'priya@vela.dev', workspace: 'Vela', plan: 'Pro', adminRole: null, status: 'active', lastActive: '2026-06-27', providers: ['ChatGPT', 'Gemini'] },
  { id: 'u3', name: 'Marcus Tran', email: 'marcus@quanta.io', workspace: 'Quanta', plan: 'Enterprise', adminRole: null, status: 'active', lastActive: '2026-06-28', providers: ['Claude', 'Gemini', 'Copilot'] },
  { id: 'u4', name: 'Alex Rivera', email: 'alex@northwind.ai', workspace: 'Northwind', plan: 'Enterprise', adminRole: null, status: 'active', lastActive: '2026-06-26', providers: ['Claude', 'ChatGPT', 'Copilot', 'Gemini'] },
  { id: 'u5', name: 'Sam Cole', email: 'sam@orbital.app', workspace: 'Orbital', plan: 'Free', adminRole: null, status: 'pending', lastActive: '2026-06-20', providers: ['ChatGPT'] },
  { id: 'u6', name: 'Jordan Lee', email: 'jordan@kestrel.dev', workspace: 'Kestrel', plan: 'Free', adminRole: null, status: 'suspended', lastActive: '2026-05-30', providers: ['Gemini'] },
  { id: 'u0', name: 'Avery Stone', email: 'avery@cairn.app', workspace: 'Cairn (internal)', plan: 'Enterprise', adminRole: 'super_admin', status: 'active', lastActive: '2026-06-28', providers: ['Claude'] },
  { id: 'u7', name: 'Robin Avery', email: 'robin@cairn.app', workspace: 'Cairn (internal)', plan: 'Enterprise', adminRole: 'platform_admin', status: 'active', lastActive: '2026-06-28', providers: ['Claude'] },
  { id: 'u8', name: 'Casey Kim', email: 'casey@cairn.app', workspace: 'Cairn (internal)', plan: 'Enterprise', adminRole: 'support_admin', status: 'active', lastActive: '2026-06-28', providers: ['Claude'] },
  { id: 'u9', name: 'Morgan Diaz', email: 'morgan@cairn.app', workspace: 'Cairn (internal)', plan: 'Enterprise', adminRole: 'billing_admin', status: 'active', lastActive: '2026-06-27', providers: ['Claude'] },
  { id: 'u10', name: 'Taylor Brooks', email: 'taylor@vela.dev', workspace: 'Vela', plan: 'Pro', adminRole: null, status: 'active', lastActive: '2026-06-25', providers: ['Copilot', 'Claude'] },
]

export const SEED_SUBSCRIPTIONS: Subscription[] = [
  { id: 's1', workspace: 'Helios', plan: 'Pro', status: 'active', cycle: 'annual', seats: 6, mrr: 120, renewal: '2027-01-12' },
  { id: 's2', workspace: 'Vela', plan: 'Pro', status: 'active', cycle: 'monthly', seats: 4, mrr: 100, renewal: '2026-07-14' },
  { id: 's3', workspace: 'Quanta', plan: 'Enterprise', status: 'active', cycle: 'annual', seats: 40, mrr: 1600, renewal: '2026-11-01' },
  { id: 's4', workspace: 'Northwind', plan: 'Enterprise', status: 'active', cycle: 'annual', seats: 60, mrr: 2400, renewal: '2026-09-09' },
  { id: 's5', workspace: 'Orbital', plan: 'Free', status: 'trialing', cycle: 'monthly', seats: 1, mrr: 0, renewal: '2026-07-04' },
  { id: 's6', workspace: 'Kestrel', plan: 'Free', status: 'past_due', cycle: 'monthly', seats: 1, mrr: 0, renewal: '2026-06-30' },
]

export const SEED_USAGE: ProviderUsage[] = [
  { provider: 'Claude', captures: 4820, tokens: 18_400_000, cost: 642 },
  { provider: 'ChatGPT', captures: 3110, tokens: 12_900_000, cost: 388 },
  { provider: 'Copilot', captures: 2240, tokens: 8_700_000, cost: 274 },
  { provider: 'Gemini', captures: 1680, tokens: 6_300_000, cost: 151 },
]

export const SEED_AUDIT: AuditEntry[] = [
  { id: 'a1', actor: 'Robin Avery', action: 'update:subscriptions', resource: 'Quanta → Enterprise (40 seats)', timestamp: '2026-06-28 14:22', ip: '10.0.4.18' },
  { id: 'a2', actor: 'Casey Kim', action: 'resend:invite', resource: 'sam@orbital.app', timestamp: '2026-06-28 13:05', ip: '10.0.4.22' },
  { id: 'a3', actor: 'Morgan Diaz', action: 'manage:promotions', resource: 'Coupon EDU-30 created', timestamp: '2026-06-27 17:41', ip: '10.0.4.31' },
  { id: 'a4', actor: 'Robin Avery', action: 'suspend:users', resource: 'jordan@kestrel.dev', timestamp: '2026-06-27 11:12', ip: '10.0.4.18' },
  { id: 'a5', actor: 'Robin Avery', action: 'manage:integrations', resource: 'Azure DevOps sync enabled · Northwind', timestamp: '2026-06-26 09:58', ip: '10.0.4.18' },
  { id: 'a6', actor: 'Morgan Diaz', action: 'manage:plans', resource: 'Pro annual price → $20/mo', timestamp: '2026-06-25 16:30', ip: '10.0.4.31' },
]

export const SEED_INTEGRATIONS: Integration[] = [
  { name: 'Claude (MCP)', category: 'AI Provider', status: 'connected' },
  { name: 'ChatGPT / OpenAI', category: 'AI Provider', status: 'connected' },
  { name: 'GitHub Copilot', category: 'AI Provider', status: 'connected' },
  { name: 'Gemini', category: 'AI Provider', status: 'connected' },
  { name: 'Azure DevOps', category: 'Pipeline', status: 'connected' },
  { name: 'GitHub', category: 'Repo', status: 'connected' },
  { name: 'Slack', category: 'Comms', status: 'available' },
  { name: 'Linear', category: 'Issues', status: 'available' },
  { name: 'Jira', category: 'Issues', status: 'available' },
  { name: 'Notion', category: 'Docs', status: 'error' },
]

export const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
