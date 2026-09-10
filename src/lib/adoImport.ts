import type { Priority, Provider, TaskStatus, Workspace } from './types'
import {
  addPortfolio,
  addProject,
  addStory,
  addTask,
  getSnapshot,
  updateProject,
  updateStory,
  updateTask,
} from './store'

/**
 * Azure DevOps import, client half (slice A of docs/ado-integration-spike.md).
 *
 * The token is posted to our own function and used there for one request; it is
 * never stored in the app, in localStorage, or in the URL. Nothing here writes
 * back to Azure DevOps — this is a one-way read.
 *
 * A second import of the same project **refreshes** what is already here rather
 * than duplicating it, matched on the Azure DevOps work item id.
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

// ---- matching -----------------------------------------------------------

const sameSource = (a: string | null, b: string): boolean =>
  (a ?? '').toLowerCase() === b.toLowerCase()

/** The portfolio a previous import of this org/project created, if any. */
function findPortfolio(ws: Workspace, preview: AdoPreview) {
  return (
    ws.portfolios.find(
      (p) => sameSource(p.adoOrg, preview.org) && sameSource(p.adoProject, preview.project),
    ) ?? null
  )
}

export interface ImportPlan {
  /** Whether this refreshes an existing import or creates a new portfolio. */
  refreshing: boolean
  created: { projects: number; stories: number; tasks: number }
  updated: { projects: number; stories: number; tasks: number }
  /** Previously imported rows that Azure DevOps no longer returns. */
  goneFromAdo: number
}

/**
 * What a commit would do, without doing it. The modal shows this so nobody
 * discovers after the fact that they created a second copy of their backlog.
 */
export function planImport(preview: AdoPreview, ws: Workspace = getSnapshot()): ImportPlan {
  const portfolio = findPortfolio(ws, preview)
  const has = (list: { adoId: number | null }[], adoId: number) =>
    list.some((x) => x.adoId === adoId)

  const created = { projects: 0, stories: 0, tasks: 0 }
  const updated = { projects: 0, stories: 0, tasks: 0 }

  for (const p of preview.projects) has(ws.projects, p.adoId) ? updated.projects++ : created.projects++
  for (const s of preview.stories) has(ws.stories, s.adoId) ? updated.stories++ : created.stories++
  for (const t of preview.tasks) has(ws.tasks, t.adoId) ? updated.tasks++ : created.tasks++

  // Only counted within this portfolio: linked rows elsewhere are somebody
  // else's import and none of this import's business.
  const inScope = (projectId: string) =>
    portfolio ? ws.projects.some((p) => p.id === projectId && p.portfolioId === portfolio.id) : false
  const seen = new Set(preview.tasks.map((t) => t.adoId))
  const goneFromAdo = ws.tasks.filter(
    (t) => t.adoId !== null && inScope(t.projectId) && !seen.has(t.adoId),
  ).length

  return { refreshing: portfolio !== null, created, updated, goneFromAdo }
}

export interface ImportResult {
  portfolioId: string
  firstProjectId: string | null
  plan: ImportPlan
}

/**
 * Create or refresh the previewed work.
 *
 * **Merge policy: Azure DevOps wins where Azure DevOps has a value; Cairn keeps
 * what Azure DevOps does not track.** That distinction matters more than it
 * sounds:
 *
 * - `dueDate` maps to `FinishDate`, which is usually empty in ADO. Letting an
 *   empty value win would silently wipe every due date set in Cairn.
 * - `provider` comes from a `cairn-provider:` tag that most work items will
 *   never carry. Overwriting it would reset the attribution this product
 *   exists to record — back to "Human", on every refresh.
 *
 * Rows previously imported but no longer returned by ADO are left alone rather
 * than deleted. A work item can vanish from a query for reasons that are not
 * deletion, and quietly destroying tracked work is far worse than leaving a
 * stale row for someone to remove deliberately.
 */
export function applyAdoImport(preview: AdoPreview): ImportResult {
  const ws = getSnapshot()
  const plan = planImport(preview, ws)

  const existingPortfolio = findPortfolio(ws, preview)
  const portfolio =
    existingPortfolio ??
    addPortfolio(
      preview.portfolioName,
      `Imported from Azure DevOps · ${preview.org}/${preview.project}`,
      { org: preview.org, project: preview.project },
    )

  const projectIdByAdo = new Map<number, string>()
  let firstProjectId: string | null = null

  for (const p of preview.projects) {
    const existing = ws.projects.find((x) => x.adoId === p.adoId)
    if (existing) {
      updateProject(existing.id, {
        name: p.name,
        description: p.description,
        targetDate: p.targetDate ?? existing.targetDate,
      })
      projectIdByAdo.set(p.adoId, existing.id)
      if (!firstProjectId) firstProjectId = existing.id
    } else {
      const created = addProject(portfolio.id, p.name, p.description, {
        targetDate: p.targetDate,
        adoId: p.adoId,
      })
      projectIdByAdo.set(p.adoId, created.id)
      if (!firstProjectId) firstProjectId = created.id
    }
  }

  /** Created only if something actually needs it. */
  let holdingId: string | null = null
  const holding = (): string => {
    if (!holdingId) {
      const existing = ws.projects.find(
        (p) => p.portfolioId === portfolio.id && p.name === 'Unsorted',
      )
      holdingId =
        existing?.id ??
        addProject(portfolio.id, 'Unsorted', 'Work whose Azure DevOps parent was outside this import.')
          .id
      if (!firstProjectId) firstProjectId = holdingId
    }
    return holdingId
  }

  const storyIdByAdo = new Map<number, string>()
  const storyProjectByAdo = new Map<number, string>()

  for (const s of preview.stories) {
    const projectId =
      (s.parentAdoId !== null ? projectIdByAdo.get(s.parentAdoId) : undefined) ?? holding()
    const existing = ws.stories.find((x) => x.adoId === s.adoId)
    if (existing) {
      updateStory(existing.id, { title: s.title, priority: s.priority, projectId })
      storyIdByAdo.set(s.adoId, existing.id)
    } else {
      const created = addStory(projectId, {
        title: s.title,
        asA: '',
        iWant: '',
        soThat: '',
        priority: s.priority,
        adoId: s.adoId,
      })
      storyIdByAdo.set(s.adoId, created.id)
    }
    storyProjectByAdo.set(s.adoId, projectId)
  }

  for (const t of preview.tasks) {
    const storyId = t.parentAdoId !== null ? storyIdByAdo.get(t.parentAdoId) : undefined
    const projectId =
      (t.parentAdoId !== null
        ? (storyProjectByAdo.get(t.parentAdoId) ?? projectIdByAdo.get(t.parentAdoId))
        : undefined) ?? holding()

    const existing = ws.tasks.find((x) => x.adoId === t.adoId)
    if (existing) {
      updateTask(existing.id, {
        title: t.title,
        status: t.status,
        projectId,
        storyId: storyId ?? null,
        // ADO only wins where it actually has something to say.
        assignee: t.assignee ?? existing.assignee,
        dueDate: t.dueDate ?? existing.dueDate,
        provider: t.provider === 'Human' ? existing.provider : t.provider,
        // ADO's real close time, so a refresh does not restamp old work as
        // finished today.
        ...(t.completedAt !== null ? { completedAt: t.completedAt } : {}),
      })
    } else {
      addTask(projectId, t.title, {
        storyId: storyId ?? null,
        provider: t.provider,
        status: t.status,
        assignee: t.assignee,
        dueDate: t.dueDate,
        // Preserved rather than stamped as "now": otherwise every imported Done
        // task would look like it shipped today and the status report would say so.
        completedAt: t.completedAt,
        adoId: t.adoId,
      })
    }
  }

  return { portfolioId: portfolio.id, firstProjectId, plan }
}
