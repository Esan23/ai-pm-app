import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Portfolio, Project, Story, Task, Workspace } from './types'
import { EMPTY_WORKSPACE } from './types'

/**
 * Row-level persistence against the normalized schema
 * (supabase/migrations/20260822143000_normalized_workspace.sql).
 *
 * Every write touches exactly one row, so two tabs editing different tasks no
 * longer overwrite each other — the failure mode of the previous JSONB blob.
 */

export type TableName = 'portfolios' | 'projects' | 'stories' | 'tasks'

export const TABLES: TableName[] = ['portfolios', 'projects', 'stories', 'tasks']

type Row = Record<string, any>

const ms = (value: unknown): number => {
  const parsed = Date.parse(String(value ?? ''))
  return Number.isNaN(parsed) ? Date.now() : parsed
}

const iso = (value: number): string => new Date(value).toISOString()

// ---- row <-> domain ----------------------------------------------------

export const toPortfolio = (r: Row): Portfolio => ({
  id: r.id,
  name: r.name,
  description: r.description ?? '',
  createdAt: ms(r.created_at),
})

export const toProject = (r: Row): Project => ({
  id: r.id,
  portfolioId: r.portfolio_id,
  name: r.name,
  description: r.description ?? '',
  createdAt: ms(r.created_at),
})

export const toStory = (r: Row): Story => ({
  id: r.id,
  projectId: r.project_id,
  title: r.title,
  asA: r.as_a ?? '',
  iWant: r.i_want ?? '',
  soThat: r.so_that ?? '',
  priority: r.priority,
  createdAt: ms(r.created_at),
})

export const toTask = (r: Row): Task => ({
  id: r.id,
  projectId: r.project_id,
  storyId: r.story_id ?? null,
  title: r.title,
  status: r.status,
  provider: r.provider,
  createdAt: ms(r.created_at),
})

const portfolioRow = (p: Portfolio, userId: string): Row => ({
  id: p.id,
  user_id: userId,
  name: p.name,
  description: p.description,
  created_at: iso(p.createdAt),
})

const projectRow = (p: Project, userId: string): Row => ({
  id: p.id,
  user_id: userId,
  portfolio_id: p.portfolioId,
  name: p.name,
  description: p.description,
  created_at: iso(p.createdAt),
})

const storyRow = (s: Story, userId: string): Row => ({
  id: s.id,
  user_id: userId,
  project_id: s.projectId,
  title: s.title,
  as_a: s.asA,
  i_want: s.iWant,
  so_that: s.soThat,
  priority: s.priority,
  created_at: iso(s.createdAt),
})

const taskRow = (t: Task, userId: string): Row => ({
  id: t.id,
  user_id: userId,
  project_id: t.projectId,
  story_id: t.storyId,
  title: t.title,
  status: t.status,
  provider: t.provider,
  created_at: iso(t.createdAt),
})

/** Domain patch -> column patch. Only known fields are forwarded. */
const COLUMN_OF: Record<string, string> = {
  name: 'name',
  description: 'description',
  title: 'title',
  status: 'status',
  provider: 'provider',
  priority: 'priority',
  asA: 'as_a',
  iWant: 'i_want',
  soThat: 'so_that',
  storyId: 'story_id',
  projectId: 'project_id',
  portfolioId: 'portfolio_id',
}

export function toColumns(patch: Record<string, unknown>): Row {
  const row: Row = {}
  for (const [key, value] of Object.entries(patch)) {
    const column = COLUMN_OF[key]
    if (column) row[column] = value
  }
  return row
}

// ---- reads --------------------------------------------------------------

function fail(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`${context}: ${error.message}`)
}

/** Pull the signed-in user's entire workspace. RLS scopes it to them. */
export async function fetchWorkspace(): Promise<Workspace> {
  if (!supabase) return EMPTY_WORKSPACE
  const [portfolios, projects, stories, tasks] = await Promise.all([
    supabase.from('portfolios').select('*').order('created_at'),
    supabase.from('projects').select('*').order('created_at'),
    supabase.from('stories').select('*').order('created_at'),
    supabase.from('tasks').select('*').order('created_at'),
  ])
  fail('load portfolios', portfolios.error)
  fail('load projects', projects.error)
  fail('load stories', stories.error)
  fail('load tasks', tasks.error)
  return {
    portfolios: (portfolios.data ?? []).map(toPortfolio),
    projects: (projects.data ?? []).map(toProject),
    stories: (stories.data ?? []).map(toStory),
    tasks: (tasks.data ?? []).map(toTask),
  }
}

// ---- writes -------------------------------------------------------------

export async function insertPortfolio(p: Portfolio, userId: string): Promise<void> {
  if (!supabase) return
  fail('save portfolio', (await supabase.from('portfolios').insert(portfolioRow(p, userId))).error)
}

export async function insertProject(p: Project, userId: string): Promise<void> {
  if (!supabase) return
  fail('save project', (await supabase.from('projects').insert(projectRow(p, userId))).error)
}

export async function insertStory(s: Story, userId: string): Promise<void> {
  if (!supabase) return
  fail('save story', (await supabase.from('stories').insert(storyRow(s, userId))).error)
}

export async function insertTask(t: Task, userId: string): Promise<void> {
  if (!supabase) return
  fail('save task', (await supabase.from('tasks').insert(taskRow(t, userId))).error)
}

export async function updateRow(
  table: TableName,
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  if (!supabase) return
  const columns = toColumns(patch)
  if (Object.keys(columns).length === 0) return
  fail(`update ${table}`, (await supabase.from(table).update(columns).eq('id', id)).error)
}

export async function deleteRow(table: TableName, id: string): Promise<void> {
  if (!supabase) return
  fail(`delete ${table}`, (await supabase.from(table).delete().eq('id', id)).error)
}

/**
 * Push a whole local (guest) workspace up on first sign-in.
 * Ordered parent-first so foreign keys resolve.
 */
export async function pushWorkspace(ws: Workspace, userId: string): Promise<void> {
  if (!supabase) return
  if (ws.portfolios.length) {
    fail(
      'migrate portfolios',
      (await supabase.from('portfolios').insert(ws.portfolios.map((p) => portfolioRow(p, userId))))
        .error,
    )
  }
  if (ws.projects.length) {
    fail(
      'migrate projects',
      (await supabase.from('projects').insert(ws.projects.map((p) => projectRow(p, userId)))).error,
    )
  }
  if (ws.stories.length) {
    fail(
      'migrate stories',
      (await supabase.from('stories').insert(ws.stories.map((s) => storyRow(s, userId)))).error,
    )
  }
  if (ws.tasks.length) {
    fail(
      'migrate tasks',
      (await supabase.from('tasks').insert(ws.tasks.map((t) => taskRow(t, userId)))).error,
    )
  }
}

// ---- realtime -----------------------------------------------------------

export interface RemoteChange {
  table: TableName
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  row: Row
}

/**
 * Subscribe to this user's rows. Inbound changes are what make a second tab or
 * device converge instead of clobbering — the whole point of Phase 0.
 */
export function subscribeToWorkspace(
  userId: string,
  onChange: (change: RemoteChange) => void,
): (() => void) | null {
  if (!supabase) return null
  const channel: RealtimeChannel = supabase.channel(`workspace:${userId}`)
  for (const table of TABLES) {
    channel.on(
      'postgres_changes' as any,
      { event: '*', schema: 'public', table, filter: `user_id=eq.${userId}` },
      (payload: any) => {
        onChange({
          table,
          type: payload.eventType,
          row: payload.eventType === 'DELETE' ? payload.old : payload.new,
        })
      },
    )
  }
  channel.subscribe()
  return () => {
    void supabase?.removeChannel(channel)
  }
}
