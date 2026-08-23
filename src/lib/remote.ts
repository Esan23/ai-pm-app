import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { ActivityEvent, Portfolio, Project, Story, Task, Workspace } from './types'
import { EMPTY_WORKSPACE } from './types'

/**
 * Row-level persistence against the normalized schema
 * (supabase/migrations/20260823022606_normalized_workspace.sql, extended by the
 * Phase 1 tracking-fields migration).
 *
 * Every write touches exactly one row, so two tabs editing different tasks no
 * longer overwrite each other — the failure mode of the previous JSONB blob.
 */

export type TableName = 'portfolios' | 'projects' | 'stories' | 'tasks' | 'activity_events'

export const TABLES: TableName[] = ['portfolios', 'projects', 'stories', 'tasks', 'activity_events']

/** How much history to pull on load; the rest stays on the server. */
export const ACTIVITY_PAGE = 200

/**
 * Who is writing, and into which team. `user_id` records the author;
 * `team_id` is what RLS actually checks (Phase 2).
 */
export interface WriteContext {
  userId: string
  teamId: string
}

type Row = Record<string, any>

const ms = (value: unknown): number => {
  const parsed = Date.parse(String(value ?? ''))
  return Number.isNaN(parsed) ? Date.now() : parsed
}

/** Nullable timestamp: absent stays absent rather than becoming "now". */
const msOrNull = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Date.parse(String(value))
  return Number.isNaN(parsed) ? null : parsed
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
  targetDate: r.target_date ?? null,
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
  assignee: r.assignee ?? null,
  dueDate: r.due_date ?? null,
  completedAt: msOrNull(r.completed_at),
  createdAt: ms(r.created_at),
})

export const toActivity = (r: Row): ActivityEvent => ({
  id: r.id,
  projectId: r.project_id ?? null,
  entityType: r.entity_type,
  entityId: r.entity_id,
  entityTitle: r.entity_title ?? '',
  action: r.action,
  detail: r.detail ?? '',
  createdAt: ms(r.created_at),
})

const portfolioRow = (p: Portfolio, ctx: WriteContext): Row => ({
  id: p.id,
  user_id: ctx.userId,
  team_id: ctx.teamId,
  name: p.name,
  description: p.description,
  created_at: iso(p.createdAt),
})

const projectRow = (p: Project, ctx: WriteContext): Row => ({
  id: p.id,
  user_id: ctx.userId,
  team_id: ctx.teamId,
  portfolio_id: p.portfolioId,
  name: p.name,
  description: p.description,
  target_date: p.targetDate,
  created_at: iso(p.createdAt),
})

const storyRow = (s: Story, ctx: WriteContext): Row => ({
  id: s.id,
  user_id: ctx.userId,
  team_id: ctx.teamId,
  project_id: s.projectId,
  title: s.title,
  as_a: s.asA,
  i_want: s.iWant,
  so_that: s.soThat,
  priority: s.priority,
  created_at: iso(s.createdAt),
})

const taskRow = (t: Task, ctx: WriteContext): Row => ({
  id: t.id,
  user_id: ctx.userId,
  team_id: ctx.teamId,
  project_id: t.projectId,
  story_id: t.storyId,
  title: t.title,
  status: t.status,
  provider: t.provider,
  assignee: t.assignee,
  due_date: t.dueDate,
  completed_at: t.completedAt === null ? null : iso(t.completedAt),
  created_at: iso(t.createdAt),
})

const activityRow = (e: ActivityEvent, ctx: WriteContext): Row => ({
  id: e.id,
  user_id: ctx.userId,
  team_id: ctx.teamId,
  project_id: e.projectId,
  entity_type: e.entityType,
  entity_id: e.entityId,
  entity_title: e.entityTitle,
  action: e.action,
  detail: e.detail,
  created_at: iso(e.createdAt),
})

/**
 * Domain patch -> column patch. Only known fields are forwarded, and the few
 * that change representation on the way out are converted here.
 */
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
  assignee: 'assignee',
  dueDate: 'due_date',
  targetDate: 'target_date',
  completedAt: 'completed_at',
}

const ENCODE: Record<string, (v: unknown) => unknown> = {
  completedAt: (v) => (typeof v === 'number' ? iso(v) : null),
}

export function toColumns(patch: Record<string, unknown>): Row {
  const row: Row = {}
  for (const [key, value] of Object.entries(patch)) {
    const column = COLUMN_OF[key]
    if (!column) continue
    row[column] = ENCODE[key] ? ENCODE[key](value) : value
  }
  return row
}

// ---- reads --------------------------------------------------------------

function fail(context: string, error: { message: string } | null): void {
  if (error) throw new Error(`${context}: ${error.message}`)
}

/** Pull one team's workspace. RLS independently confirms membership. */
export async function fetchWorkspace(teamId: string): Promise<Workspace> {
  if (!supabase) return EMPTY_WORKSPACE
  const [portfolios, projects, stories, tasks, activity] = await Promise.all([
    supabase.from('portfolios').select('*').eq('team_id', teamId).order('created_at'),
    supabase.from('projects').select('*').eq('team_id', teamId).order('created_at'),
    supabase.from('stories').select('*').eq('team_id', teamId).order('created_at'),
    supabase.from('tasks').select('*').eq('team_id', teamId).order('created_at'),
    supabase
      .from('activity_events')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(ACTIVITY_PAGE),
  ])
  fail('load portfolios', portfolios.error)
  fail('load projects', projects.error)
  fail('load stories', stories.error)
  fail('load tasks', tasks.error)
  fail('load activity', activity.error)
  return {
    portfolios: (portfolios.data ?? []).map(toPortfolio),
    projects: (projects.data ?? []).map(toProject),
    stories: (stories.data ?? []).map(toStory),
    tasks: (tasks.data ?? []).map(toTask),
    activity: (activity.data ?? []).map(toActivity),
  }
}

// ---- writes -------------------------------------------------------------

export async function insertPortfolio(p: Portfolio, ctx: WriteContext): Promise<void> {
  if (!supabase) return
  fail('save portfolio', (await supabase.from('portfolios').insert(portfolioRow(p, ctx))).error)
}

export async function insertProject(p: Project, ctx: WriteContext): Promise<void> {
  if (!supabase) return
  fail('save project', (await supabase.from('projects').insert(projectRow(p, ctx))).error)
}

export async function insertStory(s: Story, ctx: WriteContext): Promise<void> {
  if (!supabase) return
  fail('save story', (await supabase.from('stories').insert(storyRow(s, ctx))).error)
}

export async function insertTask(t: Task, ctx: WriteContext): Promise<void> {
  if (!supabase) return
  fail('save task', (await supabase.from('tasks').insert(taskRow(t, ctx))).error)
}

export async function insertActivity(e: ActivityEvent, ctx: WriteContext): Promise<void> {
  if (!supabase) return
  fail(
    'save activity',
    (await supabase.from('activity_events').insert(activityRow(e, ctx))).error,
  )
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
export async function pushWorkspace(ws: Workspace, ctx: WriteContext): Promise<void> {
  if (!supabase) return
  if (ws.portfolios.length) {
    fail(
      'migrate portfolios',
      (await supabase.from('portfolios').insert(ws.portfolios.map((p) => portfolioRow(p, ctx))))
        .error,
    )
  }
  if (ws.projects.length) {
    fail(
      'migrate projects',
      (await supabase.from('projects').insert(ws.projects.map((p) => projectRow(p, ctx)))).error,
    )
  }
  if (ws.stories.length) {
    fail(
      'migrate stories',
      (await supabase.from('stories').insert(ws.stories.map((s) => storyRow(s, ctx)))).error,
    )
  }
  if (ws.tasks.length) {
    fail(
      'migrate tasks',
      (await supabase.from('tasks').insert(ws.tasks.map((t) => taskRow(t, ctx)))).error,
    )
  }
  if (ws.activity.length) {
    fail(
      'migrate activity',
      (await supabase.from('activity_events').insert(ws.activity.map((e) => activityRow(e, ctx))))
        .error,
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
 * Subscribe to this team's rows. Inbound changes are what make a second tab,
 * device, or teammate converge instead of clobbering.
 */
export function subscribeToWorkspace(
  teamId: string,
  onChange: (change: RemoteChange) => void,
): (() => void) | null {
  if (!supabase) return null
  const channel: RealtimeChannel = supabase.channel(`workspace:${teamId}`)
  for (const table of TABLES) {
    channel.on(
      'postgres_changes' as any,
      // Filtered on team, not user: a teammate's edits carry their own user_id,
      // so the Phase 1 filter would have silently ignored every one of them.
      { event: '*', schema: 'public', table, filter: `team_id=eq.${teamId}` },
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
