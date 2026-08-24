import { useSyncExternalStore } from 'react'
import type {
  ActivityAction,
  ActivityEvent,
  EntityType,
  Portfolio,
  Project,
  Story,
  SyncState,
  Task,
  TaskStatus,
  Team,
  TeamRole,
  Provider,
  Workspace,
} from './types'
import { EMPTY_WORKSPACE, STATUS_LABELS, canWrite } from './types'
import { DEMO_PORTFOLIO } from './seed'
import { formatDay, toDayString } from './dates'
import { supabase } from './supabase'
import {
  deleteRow,
  fetchWorkspace,
  insertActivity,
  insertPortfolio,
  insertProject,
  insertStory,
  insertTask,
  pushWorkspace,
  subscribeToMembership,
  subscribeToWorkspace,
  toActivity,
  toPortfolio,
  toProject,
  toStory,
  toTask,
  updateRow,
  type RemoteChange,
  type WriteContext,
} from './remote'
import { createTeam, fetchMyRole, fetchTeams } from './teams'

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

/** Local history cap. The server keeps everything; the browser keeps recent. */
const ACTIVITY_LOCAL_CAP = 500

interface Cache {
  /** Which account this cache belongs to; null = guest. */
  ownerId: string | null
  /** Which team it holds. A cache from another team must not be shown. */
  teamId: string | null
  workspace: Workspace
}

function uid(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().replace(/-/g, '').slice(0, 20)
      : Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
  return `${prefix}_${rand}`
}

/**
 * Fill in fields a cache written by an older build never had. Without this a
 * pre-Phase-1 task arrives with `dueDate: undefined`, which slips past a
 * `!== null` guard and reaches the date parser as undefined.
 */
function normalizeWorkspace(ws: Workspace): Workspace {
  return {
    portfolios: ws.portfolios ?? [],
    projects: (ws.projects ?? []).map((p) => ({ ...p, targetDate: p.targetDate ?? null })),
    stories: ws.stories ?? [],
    tasks: (ws.tasks ?? []).map((t) => ({
      ...t,
      assignee: t.assignee ?? null,
      dueDate: t.dueDate ?? null,
      completedAt: t.completedAt ?? null,
    })),
    activity: ws.activity ?? [],
  }
}

function loadCache(): Cache {
  const empty: Cache = { ownerId: null, teamId: null, workspace: EMPTY_WORKSPACE }
  if (typeof window === 'undefined') return empty
  try {
    // The v1 blob held auto-seeded demo data; a fresh start is the point of v2.
    localStorage.removeItem(LEGACY_KEY)
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Cache
    if (!parsed?.workspace?.portfolios) return empty
    return {
      ownerId: parsed.ownerId ?? null,
      teamId: parsed.teamId ?? null,
      workspace: normalizeWorkspace({ ...EMPTY_WORKSPACE, ...parsed.workspace }),
    }
  } catch {
    return empty
  }
}

const cached = loadCache()
let state: Workspace = cached.workspace
let cacheOwnerId: string | null = cached.ownerId
let sync: SyncState = { status: 'guest' }

/**
 * Team context (Phase 2). Guest mode has none: the local workspace belongs to
 * the browser, and `role` is null but editing is allowed.
 */
interface TeamState {
  teams: Team[]
  currentTeamId: string | null
  role: TeamRole | null
}

let team: TeamState = { teams: [], currentTeamId: cached.teamId, role: null }

const listeners = new Set<() => void>()

function persistLocal() {
  try {
    const payload: Cache = {
      ownerId: cacheOwnerId,
      teamId: team.currentTeamId,
      workspace: state,
    }
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

export function getTeamSnapshot(): TeamState {
  return team
}

/** React hook: teams, the active one, and this user's role in it. */
export function useTeamState(): TeamState {
  return useSyncExternalStore(subscribe, getTeamSnapshot, getTeamSnapshot)
}

function setTeam(next: TeamState) {
  team = next
  emit()
}

/**
 * Whether the UI should offer editing. Guests edit their own local workspace;
 * signed-in users need a writing role. RLS enforces the same rule server-side —
 * this only decides what to render.
 */
export function useCanEdit(): boolean {
  const t = useTeamState()
  const s = useSyncState()
  if (s.status === 'guest') return true
  return canWrite(t.role)
}

// ---- remote write queue -------------------------------------------------

let userId: string | null = null
let unsubscribeRemote: (() => void) | null = null
let unsubscribeMembership: (() => void) | null = null

/** Drop both live channels. Always paired — they share a team's lifetime. */
function unsubscribeAll() {
  unsubscribeRemote?.()
  unsubscribeRemote = null
  unsubscribeMembership?.()
  unsubscribeMembership = null
}

/**
 * The roster changed. If it was this user's row, re-read the role so the UI
 * reflects the privilege they actually have now rather than the one they had
 * at sign-in. A removed membership resolves to null, which `canWrite` treats
 * as read-only.
 */
async function onMembershipChange(changedUserId: string) {
  if (!userId || changedUserId !== userId) return
  const teamId = team.currentTeamId
  if (!teamId) return
  try {
    const role = await fetchMyRole(teamId)
    if (team.currentTeamId === teamId && role !== team.role) {
      setTeam({ ...team, role })
    }
  } catch {
    // A failed re-read must not disturb the workspace: the role on screen is
    // stale at worst, and RLS still refuses the write.
  }
}

/** Non-null only when signed in with a team; guest writes stay local. */
function writeContext(): WriteContext | null {
  if (!userId || !team.currentTeamId) return null
  return { userId, teamId: team.currentTeamId }
}
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
  if (!writeContext() || !supabase) return
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
      const teamId = team.currentTeamId
      if (!teamId) return
      const remote = await fetchWorkspace(teamId)
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

// ---- activity -----------------------------------------------------------

interface ActivityInput {
  projectId: string | null
  entityType: EntityType
  entityId: string
  entityTitle: string
  action: ActivityAction
  detail?: string
}

/**
 * Record what just happened. Written client-side rather than by a database
 * trigger so guest mode keeps a history too — the app has to work signed out.
 */
function logActivity(input: ActivityInput) {
  const event: ActivityEvent = {
    id: uid('ac'),
    projectId: input.projectId,
    entityType: input.entityType,
    entityId: input.entityId,
    entityTitle: input.entityTitle,
    action: input.action,
    detail: input.detail ?? '',
    createdAt: Date.now(),
  }
  const activity = [event, ...state.activity].slice(0, ACTIVITY_LOCAL_CAP)
  setWorkspace({ ...state, activity })
  enqueue(() => insertActivity(event, writeContext()!))
}

/** Newest first — the order the feed reads in. */
function sortActivity(events: ActivityEvent[]): ActivityEvent[] {
  return [...events].sort((a, b) => b.createdAt - a.createdAt).slice(0, ACTIVITY_LOCAL_CAP)
}

type TaskPatch = Partial<Omit<Task, 'id' | 'createdAt' | 'projectId'>>

const describeDate = (day: string | null): string => (day ? formatDay(day) : 'no date')

/**
 * Turn a task edit into one feed entry. A single save from the detail panel can
 * change several fields; the most significant one names the event and the rest
 * ride along in the detail, rather than spraying four entries into the feed.
 */
function describeTaskPatch(
  prev: Task,
  patch: TaskPatch,
): { action: ActivityAction; detail: string } | null {
  const changes: { action: ActivityAction; rank: number; text: string }[] = []

  if (patch.status !== undefined && patch.status !== prev.status) {
    changes.push({
      action: patch.status === 'done' ? 'completed' : prev.status === 'done' ? 'reopened' : 'status_changed',
      rank: 6,
      text: `${STATUS_LABELS[prev.status]} → ${STATUS_LABELS[patch.status]}`,
    })
  }
  if (patch.assignee !== undefined && patch.assignee !== prev.assignee) {
    changes.push({
      action: 'assigned',
      rank: 5,
      text: patch.assignee ? `assigned to ${patch.assignee}` : 'unassigned',
    })
  }
  if (patch.dueDate !== undefined && patch.dueDate !== prev.dueDate) {
    changes.push({
      action: 'scheduled',
      rank: 4,
      text: patch.dueDate
        ? `due ${describeDate(patch.dueDate)}`
        : `due date cleared (was ${describeDate(prev.dueDate)})`,
    })
  }
  if (patch.title !== undefined && patch.title !== prev.title) {
    changes.push({ action: 'renamed', rank: 3, text: `renamed from "${prev.title}"` })
  }
  if (patch.provider !== undefined && patch.provider !== prev.provider) {
    changes.push({ action: 'updated', rank: 2, text: `${prev.provider} → ${patch.provider}` })
  }
  if (patch.storyId !== undefined && patch.storyId !== prev.storyId) {
    const story = state.stories.find((s) => s.id === patch.storyId)
    changes.push({
      action: 'updated',
      rank: 1,
      text: story ? `linked to "${story.title}"` : 'unlinked from its story',
    })
  }

  if (changes.length === 0) return null
  const headline = changes.reduce((best, c) => (c.rank > best.rank ? c : best))
  return { action: headline.action, detail: changes.map((c) => c.text).join(' · ') }
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
    case 'activity_events':
      // Append-only server-side; a delete can only mean a cascade.
      setWorkspace({
        ...state,
        activity: removing
          ? state.activity.filter((e) => e.id !== id)
          : sortActivity(upsertById(state.activity, toActivity(change.row))),
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
    activity: local.activity.filter((e) => !has(remote.activity, e.id)),
  }
}

function merge(remote: Workspace, extra: Workspace): Workspace {
  return {
    portfolios: [...remote.portfolios, ...extra.portfolios],
    projects: [...remote.projects, ...extra.projects],
    stories: [...remote.stories, ...extra.stories],
    tasks: [...remote.tasks, ...extra.tasks],
    activity: sortActivity([...remote.activity, ...extra.activity]),
  }
}

let initialized = false

/** Deterministic personal-team id, matching the Phase 2 migration's backfill. */
function personalTeamId(id: string): string {
  return `tm_${id.replace(/-/g, '').slice(0, 16)}`
}

/** Load a team's rows, replacing whatever is on screen, and resubscribe. */
async function openTeam(teamId: string, options: { migrateGuestWork?: boolean } = {}) {
  if (!userId) return
  unsubscribeAll()
  setSync({ status: 'loading' })

  const remote = await fetchWorkspace(teamId)
  const guestWork =
    options.migrateGuestWork && cacheOwnerId === null ? notIn(state, remote) : EMPTY_WORKSPACE

  const role = await fetchMyRole(teamId)
  cacheOwnerId = userId
  setTeam({ ...team, currentTeamId: teamId, role })

  if (hasRows(guestWork) && canWrite(role)) {
    await pushWorkspace(guestWork, { userId, teamId })
    setWorkspace(merge(remote, guestWork))
  } else {
    setWorkspace(remote)
  }

  setSync({ status: 'synced', at: Date.now() })
  unsubscribeRemote = subscribeToWorkspace(teamId, applyRemoteChange)
  unsubscribeMembership = subscribeToMembership(teamId, (changed) => {
    void onMembershipChange(changed)
  })
}

/**
 * Point persistence at a signed-in user's team, or back at guest mode.
 *
 * On first sign-in a guest workspace is migrated into the team; a cache from a
 * different account or a different team is discarded rather than shown.
 */
export async function setSyncUser(id: string | null) {
  if (initialized && id === userId) return
  const previous = userId
  initialized = true
  userId = id

  unsubscribeAll()

  if (!id || !supabase) {
    if (previous) {
      // Signed out — don't leave one account's work in the next person's browser.
      cacheOwnerId = null
      setTeam({ teams: [], currentTeamId: null, role: null })
      setWorkspace(EMPTY_WORKSPACE)
    }
    setSync({ status: 'guest' })
    return
  }

  setSync({ status: 'loading' })
  try {
    let teams = await fetchTeams()
    if (teams.length === 0) {
      // First sign-in: everyone gets a personal team so there is always
      // somewhere for work to live. A trigger makes the creator its owner.
      await createTeam(personalTeamId(id), 'My Workspace', id)
      teams = await fetchTeams()
    }

    const remembered = teams.find((t) => t.id === cached.teamId)
    const active = remembered ?? teams[0]

    // A cache belonging to someone else, or to another team, must not be shown
    // and must certainly not be pushed up as if it were this team's work.
    const foreignCache = cacheOwnerId !== null && cacheOwnerId !== id
    if (foreignCache) setWorkspace(EMPTY_WORKSPACE)

    setTeam({ teams, currentTeamId: active.id, role: null })
    await openTeam(active.id, { migrateGuestWork: !foreignCache })
  } catch (e) {
    setSync({ status: 'error', message: messageOf(e) })
  }
}

/** Switch the active team. */
export async function switchTeam(teamId: string) {
  if (!userId || teamId === team.currentTeamId) return
  try {
    await openTeam(teamId)
  } catch (e) {
    setSync({ status: 'error', message: messageOf(e) })
  }
}

/** Re-read the team list and the caller's role (after an invite or a change). */
export async function refreshTeams() {
  if (!userId) return
  try {
    const teams = await fetchTeams()
    const role = team.currentTeamId ? await fetchMyRole(team.currentTeamId) : null
    setTeam({ ...team, teams, role })
  } catch (e) {
    setSync({ status: 'error', message: messageOf(e) })
  }
}

/** Create a team and move into it. The new team starts empty. */
export async function createTeamAndSwitch(name: string): Promise<Team | null> {
  if (!userId) return null
  try {
    const created = await createTeam(uid('tm'), name, userId)
    setTeam({ ...team, teams: [...team.teams, created] })
    await openTeam(created.id)
    return created
  } catch (e) {
    setSync({ status: 'error', message: messageOf(e) })
    return null
  }
}

// ---- mutations ----------------------------------------------------------

export function addPortfolio(name: string, description = ''): Portfolio {
  const p: Portfolio = { id: uid('pf'), name, description, createdAt: Date.now() }
  setWorkspace({ ...state, portfolios: [...state.portfolios, p] })
  enqueue(() => insertPortfolio(p, writeContext()!))
  logActivity({
    projectId: null,
    entityType: 'portfolio',
    entityId: p.id,
    entityTitle: p.name,
    action: 'created',
  })
  return p
}

/** The portfolio new projects land in, created on demand for a new account. */
export function ensurePortfolio(): Portfolio {
  return state.portfolios[0] ?? addPortfolio('My Portfolio')
}

export function addProject(portfolioId: string, name: string, description = ''): Project {
  const p: Project = {
    id: uid('pr'),
    portfolioId,
    name,
    description,
    targetDate: null,
    createdAt: Date.now(),
  }
  setWorkspace({ ...state, projects: [...state.projects, p] })
  enqueue(() => insertProject(p, writeContext()!))
  logActivity({
    projectId: p.id,
    entityType: 'project',
    entityId: p.id,
    entityTitle: p.name,
    action: 'created',
  })
  return p
}

export function updateProject(
  id: string,
  patch: Partial<Pick<Project, 'name' | 'description' | 'targetDate'>>,
) {
  const prev = state.projects.find((p) => p.id === id)
  if (!prev) return
  setWorkspace({
    ...state,
    projects: state.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
  })
  enqueue(() => updateRow('projects', id, patch))

  if (patch.targetDate !== undefined && patch.targetDate !== prev.targetDate) {
    logActivity({
      projectId: id,
      entityType: 'project',
      entityId: id,
      entityTitle: patch.name ?? prev.name,
      action: 'scheduled',
      detail: patch.targetDate
        ? `target ${describeDate(patch.targetDate)}`
        : `target cleared (was ${describeDate(prev.targetDate)})`,
    })
  } else if (patch.name !== undefined && patch.name !== prev.name) {
    logActivity({
      projectId: id,
      entityType: 'project',
      entityId: id,
      entityTitle: patch.name,
      action: 'renamed',
      detail: `renamed from "${prev.name}"`,
    })
  }
}

export function deleteProject(id: string) {
  const prev = state.projects.find((p) => p.id === id)
  setWorkspace({
    ...state,
    projects: state.projects.filter((p) => p.id !== id),
    stories: state.stories.filter((st) => st.projectId !== id),
    tasks: state.tasks.filter((t) => t.projectId !== id),
  })
  // Stories and tasks go with it server-side (on delete cascade).
  enqueue(() => deleteRow('projects', id))
  if (prev) {
    // projectId null: the project's own activity rows cascade away with it.
    logActivity({
      projectId: null,
      entityType: 'project',
      entityId: id,
      entityTitle: prev.name,
      action: 'deleted',
    })
  }
}

export function addStory(
  projectId: string,
  fields: Pick<Story, 'title' | 'asA' | 'iWant' | 'soThat' | 'priority'>,
): Story {
  const story: Story = { id: uid('st'), projectId, createdAt: Date.now(), ...fields }
  setWorkspace({ ...state, stories: [...state.stories, story] })
  enqueue(() => insertStory(story, writeContext()!))
  logActivity({
    projectId,
    entityType: 'story',
    entityId: story.id,
    entityTitle: story.title,
    action: 'created',
  })
  return story
}

export function updateStory(
  id: string,
  patch: Partial<Pick<Story, 'title' | 'asA' | 'iWant' | 'soThat' | 'priority'>>,
) {
  const prev = state.stories.find((s) => s.id === id)
  if (!prev) return
  setWorkspace({
    ...state,
    stories: state.stories.map((s) => (s.id === id ? { ...s, ...patch } : s)),
  })
  enqueue(() => updateRow('stories', id, patch))

  const renamed = patch.title !== undefined && patch.title !== prev.title
  const reprioritized = patch.priority !== undefined && patch.priority !== prev.priority
  logActivity({
    projectId: prev.projectId,
    entityType: 'story',
    entityId: id,
    entityTitle: patch.title ?? prev.title,
    action: renamed ? 'renamed' : 'updated',
    detail: [
      renamed ? `renamed from "${prev.title}"` : '',
      reprioritized ? `priority ${prev.priority} → ${patch.priority}` : '',
    ]
      .filter(Boolean)
      .join(' · '),
  })
}

export function deleteStory(id: string) {
  const prev = state.stories.find((s) => s.id === id)
  setWorkspace({
    ...state,
    stories: state.stories.filter((s) => s.id !== id),
    // Tasks survive their story — losing tracked work to a story edit would be worse.
    tasks: state.tasks.map((t) => (t.storyId === id ? { ...t, storyId: null } : t)),
  })
  enqueue(() => deleteRow('stories', id))
  if (prev) {
    logActivity({
      projectId: prev.projectId,
      entityType: 'story',
      entityId: id,
      entityTitle: prev.title,
      action: 'deleted',
      detail: 'its tasks were kept',
    })
  }
}

export function addTask(
  projectId: string,
  title: string,
  opts: {
    storyId?: string | null
    provider?: Provider
    status?: TaskStatus
    assignee?: string | null
    dueDate?: string | null
    /** Only honoured for a task created as done — import preserves the real
     *  completion time so history is not backdated to the moment of import. */
    completedAt?: number | null
  } = {},
): Task {
  const status = opts.status ?? 'todo'
  const task: Task = {
    id: uid('tk'),
    projectId,
    storyId: opts.storyId ?? null,
    title,
    status,
    provider: opts.provider ?? 'Human',
    assignee: opts.assignee ?? null,
    dueDate: opts.dueDate ?? null,
    completedAt: status === 'done' ? (opts.completedAt ?? Date.now()) : null,
    createdAt: Date.now(),
  }
  setWorkspace({ ...state, tasks: [...state.tasks, task] })
  enqueue(() => insertTask(task, writeContext()!))
  logActivity({
    projectId,
    entityType: 'task',
    entityId: task.id,
    entityTitle: task.title,
    action: 'created',
    detail: status === 'todo' ? '' : `in ${STATUS_LABELS[status]}`,
  })
  return task
}

export function updateTask(id: string, patch: TaskPatch) {
  const prev = state.tasks.find((t) => t.id === id)
  if (!prev) return

  // Completion is derived, never hand-set: status is the single source of truth
  // (the database enforces the same rule with a trigger).
  const full: TaskPatch = { ...patch }
  if (patch.status !== undefined && patch.status !== prev.status) {
    full.completedAt = patch.status === 'done' ? Date.now() : null
  }

  const change = describeTaskPatch(prev, patch)
  setWorkspace({ ...state, tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...full } : t)) })
  enqueue(() => updateRow('tasks', id, full))

  if (change) {
    logActivity({
      projectId: prev.projectId,
      entityType: 'task',
      entityId: id,
      entityTitle: patch.title ?? prev.title,
      action: change.action,
      detail: change.detail,
    })
  }
}

export function moveTask(id: string, status: TaskStatus) {
  updateTask(id, { status })
}

export function deleteTask(id: string) {
  const prev = state.tasks.find((t) => t.id === id)
  setWorkspace({ ...state, tasks: state.tasks.filter((t) => t.id !== id) })
  enqueue(() => deleteRow('tasks', id))
  if (prev) {
    logActivity({
      projectId: prev.projectId,
      entityType: 'task',
      entityId: id,
      entityTitle: prev.title,
      action: 'deleted',
    })
  }
}

/**
 * Load the demo portfolio on request from the empty state. Created through the
 * normal mutations so it persists exactly like real work — and so a signed-in
 * user's demo lands in their account in parent-first order.
 */
export function loadDemoWorkspace(): Project | null {
  const dayFromNow = (offset: number): string => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return toDayString(d)
  }

  const portfolio = addPortfolio(DEMO_PORTFOLIO.name, DEMO_PORTFOLIO.description)
  let first: Project | null = null
  for (const project of DEMO_PORTFOLIO.projects) {
    const created = addProject(portfolio.id, project.name, project.description)
    if (!first) first = created
    if (project.targetInDays !== undefined) {
      updateProject(created.id, { targetDate: dayFromNow(project.targetInDays) })
    }
    for (const story of project.stories) {
      const { tasks, ...fields } = story
      const createdStory = addStory(created.id, fields)
      for (const task of tasks) {
        addTask(created.id, task.title, {
          storyId: createdStory.id,
          provider: task.provider,
          status: task.status,
          assignee: task.assignee,
          dueDate: task.dueInDays === undefined ? null : dayFromNow(task.dueInDays),
        })
      }
    }
  }
  return first
}

export { uid }
