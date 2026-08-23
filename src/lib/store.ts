import { useSyncExternalStore } from 'react'
import type {
  Portfolio,
  Project,
  Story,
  SyncState,
  Task,
  TaskStatus,
  Provider,
  Workspace,
} from './types'
import { EMPTY_WORKSPACE } from './types'
import { DEMO_PORTFOLIO } from './seed'
import { supabase } from './supabase'
import {
  deleteRow,
  fetchWorkspace,
  insertPortfolio,
  insertProject,
  insertStory,
  insertTask,
  pushWorkspace,
  subscribeToWorkspace,
  toPortfolio,
  toProject,
  toStory,
  toTask,
  updateRow,
  type RemoteChange,
} from './remote'

/**
 * Workspace store.
 *
 * Local state is the source of truth for the UI and is updated optimistically;
 * every mutation also enqueues a single-row write to Supabase. Writes are
 * serialized through one promise chain so a child never reaches the server
 * before its parent (foreign keys), and inbound realtime events merge in so a
 * second tab or device converges instead of overwriting.
 *
 * Signed out, none of that runs: the workspace lives in localStorage alone.
 */

const KEY = 'cairn-workspace-v2'
const LEGACY_KEY = 'cairn-workspace-v1'

interface Cache {
  /** Which account this cache belongs to; null = guest. */
  ownerId: string | null
  workspace: Workspace
}

function uid(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 20)
      : Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
  return `${prefix}_${rand}`
}

function loadCache(): Cache {
  if (typeof window === 'undefined') return { ownerId: null, workspace: EMPTY_WORKSPACE }
  try {
    // The v1 blob held auto-seeded demo data; a fresh start is the point of v2.
    localStorage.removeItem(LEGACY_KEY)
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ownerId: null, workspace: EMPTY_WORKSPACE }
    const parsed = JSON.parse(raw) as Cache
    if (!parsed?.workspace?.portfolios) return { ownerId: null, workspace: EMPTY_WORKSPACE }
    return { ownerId: parsed.ownerId ?? null, workspace: parsed.workspace }
  } catch {
    return { ownerId: null, workspace: EMPTY_WORKSPACE }
  }
}

const cached = loadCache()
let state: Workspace = cached.workspace
let cacheOwnerId: string | null = cached.ownerId
let sync: SyncState = { status: 'guest' }

const listeners = new Set<() => void>()

function persistLocal() {
  try {
    const payload: Cache = { ownerId: cacheOwnerId, workspace: state }
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    /* storage full / unavailable — keep in memory */
  }
}

function emit() {
  listeners.forEach((l) => l())
}

function setWorkspace(next: Workspace) {
  state = next
  persistLocal()
  emit()
}

function setSync(next: SyncState) {
  sync = next
  emit()
}

export function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getSnapshot(): Workspace {
  return state
}

export function getSyncSnapshot(): SyncState {
  return sync
}

/** React hook: subscribe to the whole workspace. */
export function useWorkspace(): Workspace {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

/** React hook: subscribe to persistence status. */
export function useSyncState(): SyncState {
  return useSyncExternalStore(subscribe, getSyncSnapshot, getSyncSnapshot)
}

// ---- remote write queue -------------------------------------------------

let userId: string | null = null
let unsubscribeRemote: (() => void) | null = null
let queue: Promise<unknown> = Promise.resolve()
let pending = 0
let reconcileQueued = false

const messageOf = (e: unknown): string =>
  e instanceof Error ? e.message : 'Could not reach the server'

/**
 * Queue one remote write. Ordering matters: `addStory` immediately followed by
 * `addTask` must hit the server in that order or the task's foreign key fails.
 */
function enqueue(op: () => Promise<void>) {
  if (!userId || !supabase) return
  pending += 1
  if (sync.status !== 'error') setSync({ status: 'saving' })
  queue = queue
    .then(op)
    .then(() => {
      pending -= 1
      if (pending === 0 && sync.status !== 'error') setSync({ status: 'synced', at: Date.now() })
    })
    .catch((e) => {
      pending -= 1
      setSync({ status: 'error', message: messageOf(e) })
      scheduleReconcile()
    })
}

/** Re-pull from the server so local state converges after a failed write. */
function scheduleReconcile() {
  if (reconcileQueued || !userId) return
  reconcileQueued = true
  queue = queue.then(async () => {
    reconcileQueued = false
    if (!userId) return
    try {
      const remote = await fetchWorkspace()
      setWorkspace(remote)
      if (pending === 0) setSync({ status: 'synced', at: Date.now() })
    } catch {
      /* still unreachable — leave the error visible, local edits stay cached */
    }
  })
}

/** Manual retry from the sync indicator. */
export function retrySync() {
  if (!userId) return
  setSync({ status: 'loading' })
  scheduleReconcile()
}

// ---- inbound realtime ---------------------------------------------------

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const index = list.findIndex((x) => x.id === item.id)
  if (index === -1) return [...list, item]
  const next = [...list]
  next[index] = item
  return next
}

function applyRemoteChange(change: RemoteChange) {
  const id = change.row?.id as string | undefined
  if (!id) return
  const removing = change.type === 'DELETE'

  switch (change.table) {
    case 'portfolios':
      setWorkspace({
        ...state,
        portfolios: removing
          ? state.portfolios.filter((p) => p.id !== id)
          : upsertById(state.portfolios, toPortfolio(change.row)),
      })
      break
    case 'projects':
      setWorkspace(
        removing
          ? {
              ...state,
              projects: state.projects.filter((p) => p.id !== id),
              stories: state.stories.filter((s) => s.projectId !== id),
              tasks: state.tasks.filter((t) => t.projectId !== id),
            }
          : { ...state, projects: upsertById(state.projects, toProject(change.row)) },
      )
      break
    case 'stories':
      setWorkspace(
        removing
          ? {
              ...state,
              stories: state.stories.filter((s) => s.id !== id),
              tasks: state.tasks.map((t) => (t.storyId === id ? { ...t, storyId: null } : t)),
            }
          : { ...state, stories: upsertById(state.stories, toStory(change.row)) },
      )
      break
    case 'tasks':
      setWorkspace({
        ...state,
        tasks: removing
          ? state.tasks.filter((t) => t.id !== id)
          : upsertById(state.tasks, toTask(change.row)),
      })
      break
  }
}

// ---- session ------------------------------------------------------------

function hasRows(ws: Workspace): boolean {
  return (
    ws.portfolios.length > 0 ||
    ws.projects.length > 0 ||
    ws.stories.length > 0 ||
    ws.tasks.length > 0
  )
}

/** Local rows the server doesn't know about yet (guest work to migrate up). */
function notIn(local: Workspace, remote: Workspace): Workspace {
  const has = (list: { id: string }[], id: string) => list.some((x) => x.id === id)
  return {
    portfolios: local.portfolios.filter((p) => !has(remote.portfolios, p.id)),
    projects: local.projects.filter((p) => !has(remote.projects, p.id)),
    stories: local.stories.filter((s) => !has(remote.stories, s.id)),
    tasks: local.tasks.filter((t) => !has(remote.tasks, t.id)),
  }
}

function merge(remote: Workspace, extra: Workspace): Workspace {
  return {
    portfolios: [...remote.portfolios, ...extra.portfolios],
    projects: [...remote.projects, ...extra.projects],
    stories: [...remote.stories, ...extra.stories],
    tasks: [...remote.tasks, ...extra.tasks],
  }
}

let initialized = false

/**
 * Point persistence at a signed-in user's rows, or back at guest mode.
 *
 * On first sign-in a guest workspace is migrated up; a cache belonging to the
 * same account is replaced by server state (the server is authoritative), and
 * a cache belonging to a different account is discarded.
 */
export async function setSyncUser(id: string | null) {
  if (initialized && id === userId) return
  const previous = userId
  initialized = true
  userId = id

  unsubscribeRemote?.()
  unsubscribeRemote = null

  if (!id || !supabase) {
    if (previous) {
      // Signed out — don't leave one account's work in the next person's browser.
      cacheOwnerId = null
      setWorkspace(EMPTY_WORKSPACE)
    }
    setSync({ status: 'guest' })
    return
  }

  setSync({ status: 'loading' })
  try {
    const remote = await fetchWorkspace()
    const guestWork = cacheOwnerId === null ? notIn(state, remote) : EMPTY_WORKSPACE

    if (cacheOwnerId !== null && cacheOwnerId !== id) {
      // Cache belongs to someone else on this browser.
      setWorkspace(EMPTY_WORKSPACE)
    }

    cacheOwnerId = id

    if (hasRows(guestWork)) {
      await pushWorkspace(guestWork, id)
      setWorkspace(merge(remote, guestWork))
    } else {
      setWorkspace(remote)
    }

    setSync({ status: 'synced', at: Date.now() })
    unsubscribeRemote = subscribeToWorkspace(id, applyRemoteChange)
  } catch (e) {
    setSync({ status: 'error', message: messageOf(e) })
  }
}

// ---- mutations ----------------------------------------------------------

export function addPortfolio(name: string, description = ''): Portfolio {
  const p: Portfolio = { id: uid('pf'), name, description, createdAt: Date.now() }
  setWorkspace({ ...state, portfolios: [...state.portfolios, p] })
  enqueue(() => insertPortfolio(p, userId!))
  return p
}

/** The portfolio new projects land in, created on demand for a new account. */
export function ensurePortfolio(): Portfolio {
  return state.portfolios[0] ?? addPortfolio('My Portfolio')
}

export function addProject(portfolioId: string, name: string, description = ''): Project {
  const p: Project = { id: uid('pr'), portfolioId, name, description, createdAt: Date.now() }
  setWorkspace({ ...state, projects: [...state.projects, p] })
  enqueue(() => insertProject(p, userId!))
  return p
}

export function updateProject(id: string, patch: Partial<Pick<Project, 'name' | 'description'>>) {
  setWorkspace({
    ...state,
    projects: state.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  })
  enqueue(() => updateRow('projects', id, patch))
}

export function deleteProject(id: string) {
  setWorkspace({
    ...state,
    projects: state.projects.filter((p) => p.id !== id),
    stories: state.stories.filter((st) => st.projectId !== id),
    tasks: state.tasks.filter((t) => t.projectId !== id),
  })
  // Stories and tasks go with it server-side (on delete cascade).
  enqueue(() => deleteRow('projects', id))
}

export function addStory(
  projectId: string,
  fields: Pick<Story, 'title' | 'asA' | 'iWant' | 'soThat' | 'priority'>,
): Story {
  const story: Story = { id: uid('st'), projectId, createdAt: Date.now(), ...fields }
  setWorkspace({ ...state, stories: [...state.stories, story] })
  enqueue(() => insertStory(story, userId!))
  return story
}

export function updateStory(
  id: string,
  patch: Partial<Pick<Story, 'title' | 'asA' | 'iWant' | 'soThat' | 'priority'>>,
) {
  setWorkspace({
    ...state,
    stories: state.stories.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  })
  enqueue(() => updateRow('stories', id, patch))
}

export function deleteStory(id: string) {
  setWorkspace({
    ...state,
    stories: state.stories.filter((s) => s.id !== id),
    // Tasks survive their story — losing tracked work to a story edit would be worse.
    tasks: state.tasks.map((t) => (t.storyId === id ? { ...t, storyId: null } : t)),
  })
  enqueue(() => deleteRow('stories', id))
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
  setWorkspace({ ...state, tasks: [...state.tasks, task] })
  enqueue(() => insertTask(task, userId!))
  return task
}

export function updateTask(id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) {
  setWorkspace({ ...state, tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })
  enqueue(() => updateRow('tasks', id, patch))
}

export function moveTask(id: string, status: TaskStatus) {
  updateTask(id, { status })
}

export function deleteTask(id: string) {
  setWorkspace({ ...state, tasks: state.tasks.filter((t) => t.id !== id) })
  enqueue(() => deleteRow('tasks', id))
}

/**
 * Load the demo portfolio on request from the empty state. Created through the
 * normal mutations so it persists exactly like real work — and so a signed-in
 * user's demo lands in their account in parent-first order.
 */
export function loadDemoWorkspace(): Project | null {
  const portfolio = addPortfolio(DEMO_PORTFOLIO.name, DEMO_PORTFOLIO.description)
  let first: Project | null = null
  for (const project of DEMO_PORTFOLIO.projects) {
    const created = addProject(portfolio.id, project.name, project.description)
    if (!first) first = created
    for (const story of project.stories) {
      const { tasks, ...fields } = story
      const createdStory = addStory(created.id, fields)
      for (const task of tasks) {
        addTask(created.id, task.title, {
          storyId: createdStory.id,
          provider: task.provider,
          status: task.status,
        })
      }
    }
  }
  return first
}

export { uid }
