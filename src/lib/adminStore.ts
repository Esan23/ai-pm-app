import { useSyncExternalStore } from 'react'
import {
  ROLES,
  SEED_USERS,
  SEED_SUBSCRIPTIONS,
  SEED_AUDIT,
  SEED_INTEGRATIONS,
  type AdminUser,
  type Subscription,
  type AuditEntry,
  type Integration,
  type IntegrationStatus,
  type UserStatus,
  type PlanName,
  type AdminRoleKey,
  type Permission,
} from './admin'

export type RolePermissions = Record<AdminRoleKey, Permission[] | '*'>

function seedRolePermissions(): RolePermissions {
  return Object.fromEntries(
    Object.entries(ROLES).map(([k, r]) => [k, r.permissions === '*' ? '*' : [...r.permissions]]),
  ) as RolePermissions
}

export interface AdminSettings {
  transactionalEmail: boolean
  trialReminders: boolean
  overageAlerts: boolean
  enterpriseWhiteLabel: boolean
  locale: string
  currency: string
}

export interface AdminState {
  users: AdminUser[]
  subscriptions: Subscription[]
  audit: AuditEntry[]
  integrations: Integration[]
  settings: AdminSettings
  rolePermissions: RolePermissions
}

const KEY = 'cairn-admin-v1'

function seed(): AdminState {
  return {
    users: SEED_USERS.map((u) => ({ ...u })),
    subscriptions: SEED_SUBSCRIPTIONS.map((s) => ({ ...s })),
    audit: SEED_AUDIT.map((a) => ({ ...a })),
    integrations: SEED_INTEGRATIONS.map((i) => ({ ...i })),
    settings: {
      transactionalEmail: true,
      trialReminders: true,
      overageAlerts: true,
      enterpriseWhiteLabel: false,
      locale: 'English (US)',
      currency: 'USD ($)',
    },
    rolePermissions: seedRolePermissions(),
  }
}

function load(): AdminState {
  if (typeof window === 'undefined') return seed()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seed()
    const parsed = JSON.parse(raw) as AdminState
    if (!parsed.users) return seed()
    // Merge in defaults for fields added after this row was first persisted.
    return { ...seed(), ...parsed, rolePermissions: parsed.rolePermissions ?? seedRolePermissions() }
  } catch {
    return seed()
  }
}

let state: AdminState = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable — keep in-memory */
  }
}

function emit() {
  persist()
  listeners.forEach((l) => l())
}

function set(updater: (s: AdminState) => AdminState) {
  state = updater(state)
  emit()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot(): AdminState {
  return state
}

export function useAdminData(): AdminState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

/** Append an immutable audit entry (newest first). */
export function logAction(actor: string, action: string, resource: string) {
  const entry: AuditEntry = {
    id: uid('a'),
    actor,
    action,
    resource,
    timestamp: timestamp(),
    ip: 'session',
  }
  set((s) => ({ ...s, audit: [entry, ...s.audit] }))
}

// ---- Mutations (each writes an audit entry) ---------------------------

export interface NewUserInput {
  name: string
  email: string
  workspace: string
  plan: PlanName
  adminRole: AdminRoleKey | null
}

export function createUser(input: NewUserInput, actor: string): AdminUser {
  const user: AdminUser = {
    id: uid('u'),
    ...input,
    status: 'pending',
    lastActive: '—',
    providers: [],
  }
  set((s) => ({ ...s, users: [user, ...s.users] }))
  logAction(actor, 'create:users', `${input.email} (${input.plan})`)
  return user
}

export function updateUser(id: string, patch: Partial<AdminUser>, actor: string) {
  let label = ''
  set((s) => ({
    ...s,
    users: s.users.map((u) => {
      if (u.id !== id) return u
      label = u.email
      return { ...u, ...patch }
    }),
  }))
  const fields = Object.keys(patch).join(', ')
  logAction(actor, 'update:users', `${label} · ${fields}`)
}

export function setUserStatus(id: string, status: UserStatus, actor: string) {
  let label = ''
  set((s) => ({
    ...s,
    users: s.users.map((u) => {
      if (u.id !== id) return u
      label = u.email
      return { ...u, status }
    }),
  }))
  const action = status === 'suspended' ? 'suspend:users' : 'update:users'
  logAction(actor, action, `${label} → ${status}`)
}

export function resendInvite(id: string, actor: string) {
  const u = state.users.find((x) => x.id === id)
  logAction(actor, 'resend:invite', u?.email ?? id)
}

export function setIntegrationStatus(name: string, status: IntegrationStatus, actor: string) {
  set((s) => ({
    ...s,
    integrations: s.integrations.map((i) => (i.name === name ? { ...i, status } : i)),
  }))
  logAction(actor, 'manage:integrations', `${name} → ${status}`)
}

export function updateSetting<K extends keyof AdminSettings>(
  key: K,
  value: AdminSettings[K],
  actor: string,
) {
  set((s) => ({ ...s, settings: { ...s.settings, [key]: value } }))
  logAction(actor, 'manage:settings', `${key} → ${value}`)
}

export function setRolePermission(role: AdminRoleKey, perm: Permission, on: boolean, actor: string) {
  set((s) => {
    const cur = s.rolePermissions[role]
    if (cur === '*') return s // Super Administrator is always full-access
    const next = on ? Array.from(new Set([...cur, perm])) : cur.filter((p) => p !== perm)
    return { ...s, rolePermissions: { ...s.rolePermissions, [role]: next } }
  })
  logAction(actor, 'manage:roles', `${ROLES[role].displayName}: ${on ? 'granted' : 'revoked'} ${perm}`)
}

/** Store-aware permission check (reflects live role-permission edits). */
export function useCan() {
  const { rolePermissions } = useAdminData()
  return (role: AdminRoleKey, perm: Permission) => {
    const p = rolePermissions[role]
    return p === '*' || p.includes(perm)
  }
}

export function resetAdminData() {
  state = seed()
  emit()
}
