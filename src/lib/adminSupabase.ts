import { supabase } from './supabase'
import type { AdminRoleKey } from './admin'

export interface AdminContext {
  role: AdminRoleKey
}

/**
 * Resolve the signed-in user's platform-admin role from the database.
 * Returns null when the user is authenticated but not a platform admin
 * (RLS on admin_users also enforces this server-side).
 */
export async function fetchAdminContext(userId: string): Promise<AdminContext | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('admin_users')
    .select('role_key')
    .eq('user_id', userId)
    .maybeSingle()
  if (error || !data) return null
  return { role: data.role_key as AdminRoleKey }
}
