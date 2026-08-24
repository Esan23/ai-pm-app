import type { Handler } from '@netlify/functions'

/**
 * Read-only Azure DevOps import (slice A of docs/ado-integration-spike.md).
 *
 * Why a function rather than calling Azure DevOps from the browser: the ADO
 * REST API does not permit cross-origin browser calls, so a direct fetch from
 * the app would fail regardless of the token.
 *
 * The personal access token is used for the lifetime of one request and then
 * discarded. It is never persisted, never logged, and never returned to the
 * client. That is the whole reason this slice needs no Entra registration — and
 * also the reason it is a stopgap: a real integration stores a delegated OAuth
 * token instead of asking anyone to paste a PAT. See §7 of the spike.
 *
 * Read-only by construction: only GET and the WIQL POST (which is a query, not
 * a mutation) are issued.
 */

const API = 'api-version=7.1'

type Row = Record<string, any>

export interface AdoTaskPreview {
  adoId: number
  parentAdoId: number | null
  title: string
  status: 'todo' | 'in_progress' | 'done'
  provider: string
  assignee: string | null
  dueDate: string | null
  completedAt: number | null
}

export interface AdoStoryPreview {
  adoId: number
  parentAdoId: number | null
  title: string
  priority: 'low' | 'medium' | 'high'
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
  /** Work items read but not imported, with the reason. */
  skipped: { adoId: number; title: string; reason: string }[]
  counts: { read: number; projects: number; stories: number; tasks: number; skipped: number }
}

/** Cairn's three statuses come from ADO's state *category*, never its name. */
const STATUS_BY_CATEGORY: Record<string, 'todo' | 'in_progress' | 'done' | null> = {
  Proposed: 'todo',
  InProgress: 'in_progress',
  Resolved: 'in_progress',
  Completed: 'done',
  Removed: null,
}

const PRIORITY_BY_ADO: Record<number, 'low' | 'medium' | 'high'> = {
  1: 'high',
  2: 'high',
  3: 'medium',
  4: 'low',
}

const PROVIDERS = ['Human', 'Claude', 'ChatGPT', 'Copilot', 'Gemini']

function providerFromTags(tags: unknown): string {
  const hit = String(tags ?? '')
    .split(';')
    .map((t) => t.trim())
    .find((t) => t.toLowerCase().startsWith('cairn-provider:'))
  const name = hit ? hit.slice(hit.indexOf(':') + 1).trim() : ''
  return PROVIDERS.find((p) => p.toLowerCase() === name.toLowerCase()) ?? 'Human'
}

const day = (v: unknown): string | null => (v ? String(v).slice(0, 10) : null)
const ms = (v: unknown): number | null => {
  if (!v) return null
  const parsed = Date.parse(String(v))
  return Number.isNaN(parsed) ? null : parsed
}

const json = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
})

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Use POST' })

  let org = ''
  let project = ''
  let pat = ''
  try {
    const parsed = JSON.parse(event.body ?? '{}')
    org = String(parsed.org ?? '').trim()
    project = String(parsed.project ?? '').trim()
    pat = String(parsed.pat ?? '').trim()
  } catch {
    return json(400, { error: 'Malformed request body' })
  }

  if (!org || !project || !pat) {
    return json(400, { error: 'Organization, project, and token are all required.' })
  }
  // Guard against an org/project being used to reshape the URL.
  if (!/^[\w.-]{1,64}$/.test(org) || !/^[\w.\s-]{1,64}$/.test(project)) {
    return json(400, { error: 'That organization or project name is not valid.' })
  }

  const auth = 'Basic ' + Buffer.from(`:${pat}`).toString('base64')
  const base = `https://dev.azure.com/${encodeURIComponent(org)}`
  const proj = encodeURIComponent(project)

  async function ado(path: string, init: Record<string, any> = {}) {
    const res = await fetch(`${base}/${path}`, {
      ...init,
      headers: { Authorization: auth, 'content-type': 'application/json' },
    })
    if (res.status === 401 || res.status === 203) {
      // ADO answers a bad PAT with a sign-in page carrying 203, not a 401.
      throw new Error('Azure DevOps rejected that token. Check the PAT and its scopes (Work Items: Read).')
    }
    if (res.status === 404) throw new Error(`No project named "${project}" in "${org}".`)
    if (!res.ok) throw new Error(`Azure DevOps returned ${res.status} ${res.statusText}.`)
    return res.json()
  }

  try {
    // 1. State name -> category, straight from the project's own definitions,
    //    so this works on Agile, Scrum, Basic or a customized process.
    const types = await ado(`${proj}/_apis/wit/workitemtypes?${API}`)
    const category = new Map<string, string>()
    for (const t of types.value ?? []) {
      for (const s of t.states ?? []) category.set(`${t.name}|${s.name}`, s.category)
    }

    // 2. Ids, then one batched read carrying the hierarchy relations.
    const wiql = await ado(`${proj}/_apis/wit/wiql?${API}`, {
      method: 'POST',
      body: JSON.stringify({
        query: `SELECT [System.Id] FROM WorkItems
                WHERE [System.TeamProject] = @project
                AND [System.WorkItemType] IN ('Epic','Feature','User Story','Task','Bug')
                ORDER BY [System.Id]`,
      }),
    })
    const ids: number[] = (wiql.workItems ?? []).map((w: Row) => w.id)

    const items: Row[] = []
    for (let i = 0; i < ids.length; i += 200) {
      const batch = await ado(`_apis/wit/workitemsbatch?${API}`, {
        method: 'POST',
        body: JSON.stringify({ ids: ids.slice(i, i + 200), $expand: 'relations' }),
      })
      items.push(...(batch.value ?? []))
    }

    // 3. Map. An ADO project becomes ONE Cairn portfolio: Cairn's sidebar shows
    //    a single portfolio, so importing Epics as portfolios would hide all but
    //    the first. Epics survive as the description on each project instead of
    //    being silently dropped.
    const parentOf = new Map<number, number>()
    const titleOf = new Map<number, string>()
    const typeOf = new Map<number, string>()
    for (const item of items) {
      titleOf.set(item.id, item.fields['System.Title'])
      typeOf.set(item.id, item.fields['System.WorkItemType'])
      const parent = (item.relations ?? []).find(
        (r: Row) => r.rel === 'System.LinkTypes.Hierarchy-Reverse',
      )
      if (parent) parentOf.set(item.id, Number(String(parent.url).split('/').pop()))
    }

    const preview: AdoPreview = {
      org,
      project,
      portfolioName: project,
      projects: [],
      stories: [],
      tasks: [],
      skipped: [],
      counts: { read: items.length, projects: 0, stories: 0, tasks: 0, skipped: 0 },
    }

    for (const item of items) {
      const f = item.fields
      const type = f['System.WorkItemType']
      const status = STATUS_BY_CATEGORY[category.get(`${type}|${f['System.State']}`) ?? '']

      if (type === 'Feature') {
        const epic = parentOf.get(item.id)
        preview.projects.push({
          adoId: item.id,
          name: f['System.Title'],
          description: epic && titleOf.has(epic) ? `Epic: ${titleOf.get(epic)}` : '',
          targetDate: day(f['Microsoft.VSTS.Scheduling.TargetDate']),
        })
      } else if (type === 'User Story') {
        preview.stories.push({
          adoId: item.id,
          parentAdoId: parentOf.get(item.id) ?? null,
          title: f['System.Title'],
          priority: PRIORITY_BY_ADO[f['Microsoft.VSTS.Common.Priority']] ?? 'medium',
        })
      } else if (type === 'Task' || type === 'Bug') {
        if (status === null || status === undefined) {
          preview.skipped.push({
            adoId: item.id,
            title: f['System.Title'],
            reason: 'state category Removed',
          })
          continue
        }
        preview.tasks.push({
          adoId: item.id,
          parentAdoId: parentOf.get(item.id) ?? null,
          title: f['System.Title'],
          status,
          provider: providerFromTags(f['System.Tags']),
          assignee: f['System.AssignedTo']?.displayName ?? null,
          dueDate: day(f['Microsoft.VSTS.Scheduling.FinishDate']),
          completedAt: ms(f['Microsoft.VSTS.Common.ClosedDate']),
        })
      }
      // Epics are deliberately not imported as entities; see above.
    }

    preview.counts = {
      read: items.length,
      projects: preview.projects.length,
      stories: preview.stories.length,
      tasks: preview.tasks.length,
      skipped: preview.skipped.length,
    }

    return json(200, preview)
  } catch (e) {
    // Deliberately no logging here: the request body carries a token.
    return json(502, { error: e instanceof Error ? e.message : 'Could not reach Azure DevOps.' })
  }
}
