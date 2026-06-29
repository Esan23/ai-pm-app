import { useSyncExternalStore } from 'react'
import type { AdminUser } from './admin'
import { useAdminData } from './adminStore'

// Lightweight demo admin session: which admin staff member is "signed in".
// NOTE: this is a front-end demo gate, not a real security boundary — real
// enforcement must live server-side / in Supabase RLS (see admin-page-spec).

const KEY = 'cairn-admin-session'

function loadId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

let adminId: string | null = loadId()
const listeners = new Set<() => void>()

function emit() {
  try {
    if (adminId) localStorage.setItem(KEY, adminId)
    else localStorage.removeItem(KEY)
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): string | null {
  return adminId
}

export function signInAsAdmin(id: string) {
  adminId = id
  emit()
}

export function signOutAdmin() {
  adminId = null
  emit()
}

/** Resolves the signed-in admin from the live admin store (null if none/invalid). */
export function useAdminSession(): { currentAdmin: AdminUser | null } {
  const id = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const { users } = useAdminData()
  const currentAdmin = id ? users.find((u) => u.id === id && u.adminRole) ?? null : null
  return { currentAdmin }
}
