import type { Priority, Provider, TaskStatus } from './types'
import { addPortfolio, addProject, addStory, addTask } from './store'

/**
 * Azure DevOps import, client half (slice A of docs/ado-integration-spike.md).
 *
 * The token is posted to our own function and used there for one request; it is
 * never stored in the app, in localStorage, or in the URL. Nothing here writes
 * back to Azure DevOps — this is a one-way read.
 */

export interface AdoTaskPreview {
  adoId: number
  parentAdoId: number | null
  title: string
  status: TaskStatus
  provider: Provider
  assignee: string | null
  dueDate: string | null
  completedAt: number | null
}

export interface AdoStoryPreview {
  adoId: number
  parentAdoId: number | null
  title: string
  priority: Priority
}

export interface AdoProjectPreview {
  adoId: number
  name: string
  description: string
  targetDate: string | null
}

export interface AdoPreview {
  org: string
  project: string
  portfolioName: string
  projects: AdoProjectPreview[]
  stories: AdoStoryPreview[]
  tasks: AdoTaskPreview[]
  skipped: { adoId: number; title: string; reason: string }[]
  counts: { read: number; projects: number; stories: number; tasks: number; skipped: number }
}

export async function fetchAdoPreview(
  org: string,
  project: string,
  pat: string,
): Promise<AdoPreview> {
  const res = await fetch('/.netlify/functions/ado-import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ org, project, pat }),
  })

  let data: any = null
  try {
    data = await res.json()
  } catch {
    // Running `vite dev` without netlify dev serves index.html here.
    throw new Error('The import function is not running. Use `netlify dev`, or the deployed site.')
  }
  if (!res.ok) throw new Error(data?.error ?? `Import failed (${res.status}).`)
  return data as AdoPreview
}

export interface ImportResult {
  portfolioId: string
  firstProjectId: string | null
  projects: number
  stories: number
  tasks: number
  unparentedTasks: number
}

/**
 * Create the previewed work in Cairn.
 *
 * Written parent-first because the store's remote queue preserves call order,
 * and a story cannot reference a project the server has not seen yet. Anything
 * whose ADO parent was not imported still lands — attached to a holding project
 * rather than dropped, since silently losing rows would be worse than an
 * untidy import.
 */
export function applyAdoImport(preview: AdoPreview): ImportResult {
  const portfolio = addPortfolio(
    preview.portfolioName,
    `Imported from Azure DevOps · ${preview.org}/${preview.project}`,
  )

  const projectIdByAdo = new Map<number, string>()
  let firstProjectId: string | null = null

  for (const p of preview.projects) {
    const created = addProject(portfolio.id, p.name, p.description)
    projectIdByAdo.set(p.adoId, created.id)
    if (!firstProjectId) firstProjectId = created.id
  }

  /** Created only if something actually needs it. */
  let holdingId: string | null = null
  const holding = (): string => {
    if (!holdingId) {
      const created = addProject(
        portfolio.id,
        'Unsorted',
        'Work whose Azure DevOps parent was outside this import.',
      )
      holdingId = created.id
      if (!firstProjectId) firstProjectId = created.id
    }
    return holdingId
  }

  const storyIdByAdo = new Map<number, string>()
  const storyProjectByAdo = new Map<number, string>()

  for (const s of preview.stories) {
    const projectId =
      (s.parentAdoId !== null ? projectIdByAdo.get(s.parentAdoId) : undefined) ?? holding()
    const created = addStory(projectId, {
      title: s.title,
      asA: '',
      iWant: '',
      soThat: '',
      priority: s.priority,
    })
    storyIdByAdo.set(s.adoId, created.id)
    storyProjectByAdo.set(s.adoId, projectId)
  }

  let unparentedTasks = 0
  for (const t of preview.tasks) {
    const storyId = t.parentAdoId !== null ? storyIdByAdo.get(t.parentAdoId) : undefined
    // A task's ADO parent is usually a story, but it can be a Feature directly.
    const projectId =
      (t.parentAdoId !== null
        ? (storyProjectByAdo.get(t.parentAdoId) ?? projectIdByAdo.get(t.parentAdoId))
        : undefined) ?? holding()
    if (!storyId) unparentedTasks += 1

    addTask(projectId, t.title, {
      storyId: storyId ?? null,
      provider: t.provider,
      status: t.status,
      assignee: t.assignee,
      dueDate: t.dueDate,
      // Preserved rather than stamped as "now": otherwise every imported Done
      // task would look like it shipped today and the status report would say so.
      completedAt: t.completedAt,
    })
  }

  return {
    portfolioId: portfolio.id,
    firstProjectId,
    projects: preview.projects.length + (holdingId ? 1 : 0),
    stories: preview.stories.length,
    tasks: preview.tasks.length,
    unparentedTasks,
  }
}
