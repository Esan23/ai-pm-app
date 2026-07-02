import type { Handler } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

/**
 * Privileged admin-user operations. Runs with the service-role key (server
 * only) because creating/inviting/banning users requires the Supabase Admin
 * API, which RLS-scoped clients cannot call.
 *
 * Security model (defense in depth):
 * 1. Caller must present a valid Supabase JWT (Authorization: Bearer …).
 * 2. Caller must be platform staff (row in admin_users), and their role must
 *    hold the permission for the requested action (checked here, in SQL terms,
 *    not trusted from the client).
 * 3. Every mutation appends an audit_logs row attributed to the verified
 *    caller, in the same request.
 */

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  'https://bfrjukznqwxultdkfvlz.supabase.co'

type Action = 'create' | 'suspend' | 'reactivate' | 'update'

const PERMISSION_FOR: Record<Action, string> = {
  create: 'create:users',
  suspend: 'suspend:users',
  reactivate: 'suspend:users',
  update: 'update:users',
}

// Effectively-permanent ban used for "suspend" (Supabase has no ban flag).
const SUSPEND_BAN = '87600h' // 10 years

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return json(501, { error: 'Admin backend not configured (missing service key)' })

  const token = (event.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return json(401, { error: 'Missing Authorization token' })

  let payload: { action?: Action; userId?: string; email?: string; fullName?: string; plan?: string; roleKey?: string | null }
  try {
    payload = JSON.parse(event.body || '{}')
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }
  const action = payload.action
  if (!action || !(action in PERMISSION_FOR)) return json(400, { error: 'Unknown action' })

  // Realtime is unused here, but supabase-js constructs its client eagerly and
  // Netlify's Node 20 Lambda lacks native WebSocket — supply ws as transport.
  const db = createClient(SUPABASE_URL, serviceKey, {
    auth: { persistSession: false },
    realtime: { transport: ws as unknown as undefined },
  })

  // 1) Verify the caller's JWT.
  const { data: caller, error: authErr } = await db.auth.getUser(token)
  if (authErr || !caller?.user) return json(401, { error: 'Invalid or expired session' })
  const actorId = caller.user.id
  const actorName = caller.user.email ?? actorId

  // 2) Verify the caller is staff with the required permission.
  const { data: staff } = await db.from('admin_users').select('role_key').eq('user_id', actorId).maybeSingle()
  if (!staff) return json(403, { error: 'Not a platform admin' })
  if (staff.role_key !== 'super_admin') {
    const { data: grant } = await db
      .from('role_permissions')
      .select('permission_key')
      .eq('role_key', staff.role_key)
      .eq('permission_key', PERMISSION_FOR[action])
      .maybeSingle()
    if (!grant) return json(403, { error: `Your role lacks ${PERMISSION_FOR[action]}` })
  }

  const audit = (auditAction: string, resource: string, changes?: unknown) =>
    db.from('audit_logs').insert({
      actor_id: actorId,
      actor_name: actorName,
      action: auditAction,
      resource,
      changes: changes ?? null,
      ip: event.headers['x-nf-client-connection-ip'] ?? null,
    })

  try {
    switch (action) {
      case 'create': {
        const email = (payload.email || '').trim().toLowerCase()
        if (!email) return json(400, { error: 'Missing email' })
        const { data: invited, error } = await db.auth.admin.inviteUserByEmail(email, {
          data: { full_name: payload.fullName || email.split('@')[0] },
        })
        if (error) return json(409, { error: error.message })
        const newId = invited.user.id
        // The signup trigger created the profiles row; enrich it.
        await db
          .from('profiles')
          .update({ plan: payload.plan ?? 'Free', status: 'pending', full_name: payload.fullName ?? null })
          .eq('id', newId)
        if (payload.roleKey) {
          await db.from('admin_users').upsert({ user_id: newId, role_key: payload.roleKey })
        }
        await audit('create:users', `${email} (${payload.plan ?? 'Free'})`)
        return json(200, { ok: true, userId: newId })
      }

      case 'suspend':
      case 'reactivate': {
        const userId = payload.userId
        if (!userId) return json(400, { error: 'Missing userId' })
        const suspend = action === 'suspend'
        const { error } = await db.auth.admin.updateUserById(userId, {
          ban_duration: suspend ? SUSPEND_BAN : 'none',
        })
        if (error) return json(400, { error: error.message })
        await db.from('profiles').update({ status: suspend ? 'suspended' : 'active' }).eq('id', userId)
        const { data: prof } = await db.from('profiles').select('email').eq('id', userId).maybeSingle()
        await audit(suspend ? 'suspend:users' : 'update:users', `${prof?.email ?? userId} → ${suspend ? 'suspended' : 'active'}`)
        return json(200, { ok: true })
      }

      case 'update': {
        const userId = payload.userId
        if (!userId) return json(400, { error: 'Missing userId' })
        const patch: Record<string, unknown> = {}
        if (payload.fullName !== undefined) patch.full_name = payload.fullName
        if (payload.plan !== undefined) patch.plan = payload.plan
        if (Object.keys(patch).length) await db.from('profiles').update(patch).eq('id', userId)
        if (payload.roleKey !== undefined) {
          if (payload.roleKey) await db.from('admin_users').upsert({ user_id: userId, role_key: payload.roleKey })
          else await db.from('admin_users').delete().eq('user_id', userId)
        }
        const { data: prof } = await db.from('profiles').select('email').eq('id', userId).maybeSingle()
        await audit('update:users', `${prof?.email ?? userId} · ${[...Object.keys(patch), ...(payload.roleKey !== undefined ? ['role'] : [])].join(', ')}`)
        return json(200, { ok: true })
      }
    }
  } catch (err) {
    console.error('admin-users error:', err)
    return json(500, { error: 'Internal error' })
  }
  return json(400, { error: 'Unhandled action' })
}
