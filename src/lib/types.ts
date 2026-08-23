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
  createdAt: number
}

export interface Portfolio {
  id: string
  name: string
  description: string
  createdAt: number
}

export interface Workspace {
  portfolios: Portfolio[]
  projects: Project[]
  stories: Story[]
  tasks: Task[]
}

export const EMPTY_WORKSPACE: Workspace = {
  portfolios: [],
  projects: [],
  stories: [],
  tasks: [],
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
