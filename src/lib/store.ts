import { useSyncExternalStore } from 'react'
import type {
  Portfolio,
  Project,
  Story,
  Task,
  TaskStatus,
  Provider,
  Workspace,
} from './types'
import { seedWorkspace } from './seed'
import { supabase } from './supabase'

const KEY = 'cairn-workspace-v1'

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

function load(): Workspace {
  if (typeof window === 'undefined') return seedWorkspace()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return seedWorkspace()
    const parsed = JSON.parse(raw) as Workspace
    if (!parsed.portfolios) return seedWorkspace()
    return parsed
  } catch {
    return seedWorkspace()
  }
}

let state: Workspace = load()
const listeners = new Set<() => void>()

// ---- Remote sync (Supabase, when signed in) ---------------------------
// Guest mode (no syncUserId) is unchanged: localStorage only. When a user
// signs in, the whole workspace is mirrored to a single jsonb row per user.
let syncUserId: string | null = null
let remoteTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRemoteSave() {
  if (!syncUserId || !supabase) return
  if (remoteTimer) clearTimeout(remoteTimer)
  remoteTimer = setTimeout(saveRemote, 800)
}

async function saveRemote() {
  if (!syncUserId || !supabase) return
  try {
    await supabase
      .from('workspaces')
      .upsert({ user_id: syncUserId, data: state, updated_at: new Date().toISOString() })
  } catch {
    /* offline / transient — local cache still holds the data */
  }
}

/**
 * Switch persistence to a signed-in user's remote workspace (or back to guest).
 * On first sign-in with no remote row, the current local workspace is migrated up.
 */
export async function setSyncUser(userId: string | null) {
  syncUserId = userId
  if (!userId || !supabase) return
  try {
    const { data } = await supabase
      .from('workspaces')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()
    if (data?.data && (data.data as Workspace).portfolios) {
      state = data.data as Workspace
      persistLocal()
      listeners.forEach((l) => l())
    } else {
      // No remote workspace yet — seed it from whatever is local.
      await saveRemote()
    }
  } catch {
    /* fall back to local state */
  }
}

function persistLocal() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full / unavailable — keep in-memory */
  }
}

function persist() {
  persistLocal()
  scheduleRemoteSave()
}

function emit() {
  persist()
  listeners.forEach((l) => l())
}

function set(updater: (s: Workspace) => Workspace) {
  state = updater(state)
  emit()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot(): Workspace {
  return state
}

/** React hook: subscribe to the whole workspace. */
export function useWorkspace(): Workspace {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

// ---- Mutations ---------------------------------------------------------

export function addPortfolio(name: string, description = ''): Portfolio {
  const p: Portfolio = { id: uid('pf'), name, description, createdAt: Date.now() }
  set((s) => ({ ...s, portfolios: [...s.portfolios, p] }))
  return p
}

export function addProject(portfolioId: string, name: string, description = ''): Project {
  const p: Project = { id: uid('pr'), portfolioId, name, description, createdAt: Date.now() }
  set((s) => ({ ...s, projects: [...s.projects, p] }))
  return p
}

export function addStory(
  projectId: string,
  fields: Pick<Story, 'title' | 'asA' | 'iWant' | 'soThat' | 'priority'>,
): Story {
  const story: Story = { id: uid('st'), projectId, createdAt: Date.now(), ...fields }
  set((s) => ({ ...s, stories: [...s.stories, story] }))
  return story
}

export function addTask(
  projectId: string,
  title: string,
  opts: { storyId?: string | null; provider?: Provider; status?: TaskStatus } = {},
): Task {
  const task: Task = {
    id: uid('tk'),
    projectId,
    storyId: opts.storyId ?? null,
    title,
    status: opts.status ?? 'todo',
    provider: opts.provider ?? 'Human',
    createdAt: Date.now(),
  }
  set((s) => ({ ...s, tasks: [...s.tasks, task] }))
  return task
}

export function updateTask(id: string, patch: Partial<Omit<Task, 'id'>>) {
  set((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
}

export function moveTask(id: string, status: TaskStatus) {
  updateTask(id, { status })
}

export function deleteTask(id: string) {
  set((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }))
}

export function deleteProject(id: string) {
  set((s) => ({
    ...s,
    projects: s.projects.filter((p) => p.id !== id),
    stories: s.stories.filter((st) => st.projectId !== id),
    tasks: s.tasks.filter((t) => t.projectId !== id),
  }))
}

export function resetWorkspace() {
  state = seedWorkspace()
  emit()
}

export { uid }
