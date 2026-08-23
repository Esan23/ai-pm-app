export type Provider = 'Human' | 'Claude' | 'ChatGPT' | 'Copilot' | 'Gemini'

export const PROVIDERS: Provider[] = ['Human', 'Claude', 'ChatGPT', 'Copilot', 'Gemini']

export type TaskStatus = 'todo' | 'in_progress' | 'done'

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

export type Priority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  projectId: string
  storyId: string | null
  title: string
  status: TaskStatus
  provider: Provider
  /** Free-text owner. Becomes a real member reference in Phase 2. */
  assignee: string | null
  /** Calendar day, `YYYY-MM-DD` — kept as a string so no timezone shifts it. */
  dueDate: string | null
  /** Set when the task enters Done, cleared when it leaves. */
  completedAt: number | null
  createdAt: number
}

export interface Story {
  id: string
  projectId: string
  title: string
  asA: string
  iWant: string
  soThat: string
  priority: Priority
  createdAt: number
}

export interface Project {
  id: string
  portfolioId: string
  name: string
  description: string
  /** Calendar day the project is aimed at, `YYYY-MM-DD`. */
  targetDate: string | null
  createdAt: number
}

export interface Portfolio {
  id: string
  name: string
  description: string
  createdAt: number
}

export type EntityType = 'portfolio' | 'project' | 'story' | 'task'

export type ActivityAction =
  | 'created'
  | 'renamed'
  | 'updated'
  | 'status_changed'
  | 'completed'
  | 'reopened'
  | 'assigned'
  | 'scheduled'
  | 'deleted'

/**
 * One thing that happened. Written by the store on every mutation so the
 * workspace can answer "what changed this week" — the question a status update
 * is actually made of.
 */
export interface ActivityEvent {
  id: string
  projectId: string | null
  entityType: EntityType
  entityId: string
  /** Denormalized: the log must still read correctly after a delete. */
  entityTitle: string
  action: ActivityAction
  detail: string
  createdAt: number
}

export interface Workspace {
  portfolios: Portfolio[]
  projects: Project[]
  stories: Story[]
  tasks: Task[]
  activity: ActivityEvent[]
}

export const EMPTY_WORKSPACE: Workspace = {
  portfolios: [],
  projects: [],
  stories: [],
  tasks: [],
  activity: [],
}

export function isEmptyWorkspace(ws: Workspace): boolean {
  return ws.portfolios.length === 0 && ws.projects.length === 0
}

/**
 * Persistence state surfaced in the app header, so a user can tell whether
 * their work actually reached the server.
 *
 * - `guest`   — signed out; localStorage only.
 * - `loading` — pulling the signed-in workspace.
 * - `saving`  — one or more writes in flight.
 * - `synced`  — every write acknowledged by the server.
 * - `error`   — the last write failed; local edits are cached and the store
 *               re-syncs from the server to converge.
 */
export type SyncState =
  | { status: 'guest' }
  | { status: 'loading' }
  | { status: 'saving' }
  | { status: 'synced'; at: number }
  | { status: 'error'; message: string }
