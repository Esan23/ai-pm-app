import { useCallback, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'
import type { AdminRoleKey, AdminUser, AuditEntry, PlanName, UserStatus } from './admin'
import {
  useAdminData,
  createUser as demoCreateUser,
  updateUser as demoUpdateUser,
  setUserStatus as demoSetUserStatus,
  resendInvite as demoResendInvite,
  type NewUserInput,
} from './adminStore'

/**
 * Unified admin data layer.
 * Live mode (Supabase configured): users come from profiles + admin_users and
 * the audit trail from audit_logs (all RLS-protected); mutations go through
 * the service-role Netlify function, which re-checks permissions and writes
 * the audit row server-side.
 * Demo mode: the localStorage adminStore, unchanged.
 */

export const isLiveAdmin = isSupabaseConfigured

// ---- Live fetchers ------------------------------------------------------

interface ProfileRow {
  id: string
  email: string | null
  full_name: string | null
  plan: string | null
  status: string | null
  last_active_at: string | null
}

async function fetchLiveUsers(): Promise<AdminUser[]> {
  if (!supabase) return []
  const [{ data: profiles }, { data: staff }] = await Promise.all([
    supabase.from('profiles').select('id,email,full_name,plan,status,last_active_at').order('created_at'),
    supabase.from('admin_users').select('user_id,role_key'),
  ])
  const roleByUser = new Map((staff ?? []).map((s) => [s.user_id as string, s.role_key as AdminRoleKey]))
  return ((profiles ?? []) as ProfileRow[]).map((p) => ({
    id: p.id,
    name: p.full_name || p.email || p.id,
    email: p.email ?? '',
    workspace: '—', // workspace naming lands with the workspace admin milestone
    plan: (p.plan as PlanName) || 'Free',
    adminRole: roleByUser.get(p.id) ?? null,
    status: (p.status as UserStatus) || 'active',
    lastActive: p.last_active_at ? p.last_active_at.slice(0, 10) : '—',
    providers: [],
  }))
}

async function fetchLiveAudit(): Promise<AuditEntry[]> {
  if (!supabase) return []
  const { data } = await supabase
    .from('audit_logs')
    .select('id,actor_name,action,resource,ip,created_at')
    .order('created_at', { ascending: false })
    .limit(200)
  return (data ?? []).map((a) => ({
    id: a.id as string,
    actor: (a.actor_name as string) ?? '—',
    action: a.action as string,
    resource: (a.resource as string) ?? '',
    timestamp: String(a.created_at).slice(0, 16).replace('T', ' '),
    ip: (a.ip as string) ?? '—',
  }))
}

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

// ---- Unified hooks ------------------------------------------------------

/** Users + audit with a refresh handle. Demo mode delegates to the store. */
export function useUnifiedAdminData(): { users: AdminUser[]; audit: AuditEntry[]; refresh: () => void } {
  const demo = useAdminData()
  const [live, setLive] = useState<{ users: AdminUser[]; audit: AuditEntry[] }>({ users: [], audit: [] })

  const refresh = useCallback(() => {
    if (!isLiveAdmin) return
    Promise.all([fetchLiveUsers(), fetchLiveAudit()]).then(([users, audit]) => setLive({ users, audit }))
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  if (!isLiveAdmin) return { users: demo.users, audit: demo.audit, refresh: () => {} }
  return { ...live, refresh }
}

// ---- Unified mutations (throw on failure; callers toast) ----------------

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
  // Magic links are self-service: sending one to the user's address needs no
  // admin privilege, so this goes straight through the anon client.
  if (!supabase) throw new Error('Not configured')
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  })
  if (error) throw error
}
