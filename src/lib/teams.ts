import { supabase } from './supabase'
import type { Team, TeamInvite, TeamMember, TeamRole } from './types'

/**
 * Team, membership, and invite queries.
 *
 * Every check enforced here is also enforced by RLS — this layer exists to give
 * the UI something to disable, not to be the security boundary. A viewer who
 * calls an update anyway gets zero rows back from Postgres.
 */

type Row = Record<string, any>

const ms = (v: unknown): number => {
  const parsed = Date.parse(String(v ?? ''))
  return Number.isNaN(parsed) ? Date.now() : parsed
}

function fail(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`${context}: ${error.message}`)
}

const toTeam = (r: Row): Team => ({
  id: r.id,
  name: r.name,
  createdBy: r.created_by,
  createdAt: ms(r.created_at),
})

const toInvite = (r: Row): TeamInvite => ({
  id: r.id,
  teamId: r.team_id,
  email: r.email,
  role: r.role,
  token: r.token,
  createdAt: ms(r.created_at),
  expiresAt: ms(r.expires_at),
  acceptedAt: r.accepted_at ? ms(r.accepted_at) : null,
})

/** Teams the signed-in user belongs to. RLS does the filtering. */
export async function fetchTeams(): Promise<Team[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('teams').select('*').order('created_at')
  fail('load teams', error)
  return (data ?? []).map(toTeam)
}

export async function createTeam(id: string, name: string, userId: string): Promise<Team> {
  if (!supabase) throw new Error('Not connected')
  // A trigger adds the creator as owner in the same transaction, so the team is
  // never briefly memberless (and therefore invisible to its own creator).
  const { data, error } = await supabase
    .from('teams')
    .insert({ id, name, created_by: userId })
    .select()
    .single()
  fail('create team', error)
  return toTeam(data)
}

export async function renameTeam(teamId: string, name: string): Promise<void> {
  if (!supabase) return
  fail('rename team', (await supabase.from('teams').update({ name }).eq('id', teamId)).error)
}

/**
 * Roster with identities. profiles is a separate table, joined client-side
 * because a teammate's row is readable only through the Phase 2 policy.
 */
export async function fetchMembers(teamId: string): Promise<TeamMember[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('team_members')
    .select('*')
    .eq('team_id', teamId)
    .order('joined_at')
  fail('load members', error)
  const rows = data ?? []

  const ids = rows.map((r: Row) => r.user_id)
  const identities = new Map<string, { email: string | null; fullName: string | null }>()
  if (ids.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', ids)
    for (const p of profiles ?? []) {
      identities.set(p.id, { email: p.email ?? null, fullName: p.full_name ?? null })
    }
  }

  return rows.map((r: Row) => ({
    teamId: r.team_id,
    userId: r.user_id,
    role: r.role as TeamRole,
    joinedAt: ms(r.joined_at),
    email: identities.get(r.user_id)?.email ?? null,
    fullName: identities.get(r.user_id)?.fullName ?? null,
  }))
}

export async function setMemberRole(
  teamId: string,
  userId: string,
  role: TeamRole,
): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('team_members')
    .update({ role })
    .eq('team_id', teamId)
    .eq('user_id', userId)
  // The database refuses to demote the last owner; surface that verbatim.
  fail('change role', error)
}

export async function removeMember(teamId: string, userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('team_id', teamId)
    .eq('user_id', userId)
  fail('remove member', error)
}

export async function fetchInvites(teamId: string): Promise<TeamInvite[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('team_invites')
    .select('*')
    .eq('team_id', teamId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false })
  fail('load invites', error)
  return (data ?? []).map(toInvite)
}

export async function createInvite(
  id: string,
  teamId: string,
  email: string,
  role: TeamRole,
  invitedBy: string,
): Promise<TeamInvite> {
  if (!supabase) throw new Error('Not connected')
  const { data, error } = await supabase
    .from('team_invites')
    .insert({ id, team_id: teamId, email: email.trim().toLowerCase(), role, invited_by: invitedBy })
    .select()
    .single()
  fail('create invite', error)
  return toInvite(data)
}

export async function revokeInvite(id: string): Promise<void> {
  if (!supabase) return
  fail('revoke invite', (await supabase.from('team_invites').delete().eq('id', id)).error)
}

/**
 * Redeem an invite. The function checks the token *and* that it was issued to
 * the caller's own email, so a forwarded link does nothing.
 */
export async function acceptInvite(token: string): Promise<string> {
  if (!supabase) throw new Error('Not connected')
  const { data, error } = await supabase.rpc('accept_team_invite', { p_token: token })
  fail('accept invite', error)
  return data as string
}

/** The link a user copies and sends. Email delivery is not wired up yet. */
export function inviteLink(token: string): string {
  return `${window.location.origin}/app?invite=${token}`
}

/** The signed-in user's role in one team, or null if they are not a member. */
export async function fetchMyRole(teamId: string): Promise<TeamRole | null> {
  if (!supabase) return null
  const { data: session } = await supabase.auth.getUser()
  const uid = session.user?.id
  if (!uid) return null
  const { data, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', uid)
    .maybeSingle()
  if (error || !data) return null
  return data.role as TeamRole
}
