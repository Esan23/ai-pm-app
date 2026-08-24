#!/usr/bin/env node
/**
 * Azure DevOps -> Cairn import (spike prototype).
 *
 * Reads a real ADO project and prints the Cairn workspace it would produce, so
 * the mapping in docs/ado-integration-spike.md can be checked against actual
 * data instead of assumed. Read-only: it never writes to Azure DevOps.
 *
 *   AZURE_DEVOPS_EXT_PAT=<pat> node scripts/ado-import-spike.mjs \
 *     --org esjurgensen --project Cairn [--json]
 *
 * This is spike code, not a shipping integration. What it demonstrates:
 *   - one WIQL query plus one batched read covers a whole project
 *   - state *categories* (not state names) are what map cleanly onto Cairn
 *   - hierarchy comes from System.LinkTypes.Hierarchy-Forward relations
 *   - AI attribution survives a round trip in Tags, with no custom field and
 *     therefore no process-template change and no org admin rights
 */

const API = 'api-version=7.1'

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : process.argv[i + 1]
}

const ORG = arg('org', 'esjurgensen')
const PROJECT = arg('project', 'Cairn')
const AS_JSON = process.argv.includes('--json')
const PAT = process.env.AZURE_DEVOPS_EXT_PAT

if (!PAT) {
  console.error('Set AZURE_DEVOPS_EXT_PAT first.')
  process.exit(1)
}

const auth = 'Basic ' + Buffer.from(`:${PAT}`).toString('base64')

async function ado(path, init = {}) {
  const res = await fetch(`https://dev.azure.com/${ORG}/${path}`, {
    ...init,
    headers: {
      Authorization: auth,
      'Content-Type': init.body ? 'application/json' : 'application/json',
      ...init.headers,
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} on ${path}`)
  return res.json()
}

// ---- mapping ------------------------------------------------------------

/**
 * Cairn's three statuses come from ADO's state *category*, not its name.
 * Category is stable across process templates, so this same mapping holds for
 * Agile ("Active"), Scrum ("Committed"/"Done") and Basic ("Doing") without a
 * per-template lookup table.
 */
const STATUS_BY_CATEGORY = {
  Proposed: 'todo',
  InProgress: 'in_progress',
  Resolved: 'in_progress',
  Completed: 'done',
  Removed: null, // dropped on import rather than shown as a phantom task
}

const TYPE_TO_LEVEL = {
  Epic: 'portfolio',
  Feature: 'project',
  'User Story': 'story',
  Task: 'task',
  Bug: 'task', // a bug is work on the board like anything else
}

const PRIORITY_BY_ADO = { 1: 'high', 2: 'high', 3: 'medium', 4: 'low' }

/** Attribution rides in a tag, so no custom field is needed. */
function providerFromTags(tags) {
  const hit = (tags ?? '')
    .split(';')
    .map((t) => t.trim())
    .find((t) => t.toLowerCase().startsWith('cairn-provider:'))
  const name = hit ? hit.split(':')[1]?.trim() : ''
  const known = ['Human', 'Claude', 'ChatGPT', 'Copilot', 'Gemini']
  return known.find((p) => p.toLowerCase() === name.toLowerCase()) ?? 'Human'
}

const day = (v) => (v ? String(v).slice(0, 10) : null)
const ms = (v) => (v ? Date.parse(v) : null)

// ---- read ---------------------------------------------------------------

async function fetchWorkItems() {
  const wiql = {
    query: `SELECT [System.Id] FROM WorkItems
            WHERE [System.TeamProject] = '${PROJECT}'
            AND [System.WorkItemType] IN ('Epic','Feature','User Story','Task','Bug')
            ORDER BY [System.Id]`,
  }
  const { workItems } = await ado(`${PROJECT}/_apis/wit/wiql?${API}`, {
    method: 'POST',
    body: JSON.stringify(wiql),
  })
  const ids = workItems.map((w) => w.id)
  if (!ids.length) return []

  // Batched read: 200 per call is the documented ceiling, and $expand=relations
  // is what carries the parent/child edges.
  const out = []
  for (let i = 0; i < ids.length; i += 200) {
    const { value } = await ado(`_apis/wit/workitemsbatch?${API}`, {
      method: 'POST',
      body: JSON.stringify({ ids: ids.slice(i, i + 200), $expand: 'relations' }),
    })
    out.push(...value)
  }
  return out
}

/** State name -> category, from the project's own type definitions. */
async function categoryLookup() {
  const { value } = await ado(`${PROJECT}/_apis/wit/workitemtypes?${API}`)
  const map = new Map()
  for (const type of value) {
    for (const s of type.states ?? []) map.set(`${type.name}|${s.name}`, s.category)
  }
  return map
}

// ---- transform ----------------------------------------------------------

function toCairn(items, categories) {
  const parentOf = new Map()
  for (const item of items) {
    const parent = (item.relations ?? []).find(
      (r) => r.rel === 'System.LinkTypes.Hierarchy-Reverse',
    )
    if (parent) parentOf.set(item.id, Number(parent.url.split('/').pop()))
  }

  const ws = { portfolios: [], projects: [], stories: [], tasks: [], skipped: [] }
  const idOf = (n) => `ado_${n}`

  for (const item of items) {
    const f = item.fields
    const type = f['System.WorkItemType']
    const level = TYPE_TO_LEVEL[type]
    if (!level) continue

    const category = categories.get(`${type}|${f['System.State']}`)
    const status = STATUS_BY_CATEGORY[category]
    const createdAt = ms(f['System.CreatedDate']) ?? Date.now()
    const parent = parentOf.get(item.id)

    if (level === 'portfolio') {
      ws.portfolios.push({
        id: idOf(item.id),
        name: f['System.Title'],
        description: '',
        createdAt,
      })
    } else if (level === 'project') {
      ws.projects.push({
        id: idOf(item.id),
        portfolioId: parent ? idOf(parent) : null,
        name: f['System.Title'],
        description: '',
        targetDate: day(f['Microsoft.VSTS.Scheduling.TargetDate']),
        createdAt,
      })
    } else if (level === 'story') {
      ws.stories.push({
        id: idOf(item.id),
        projectId: parent ? idOf(parent) : null,
        title: f['System.Title'],
        asA: '',
        iWant: '',
        soThat: '',
        priority: PRIORITY_BY_ADO[f['Microsoft.VSTS.Common.Priority']] ?? 'medium',
        createdAt,
      })
    } else {
      if (status === null) {
        ws.skipped.push({ id: item.id, title: f['System.Title'], reason: 'Removed' })
        continue
      }
      ws.tasks.push({
        id: idOf(item.id),
        parentAdoId: parent ?? null,
        title: f['System.Title'],
        status,
        provider: providerFromTags(f['System.Tags']),
        assignee: f['System.AssignedTo']?.displayName ?? null,
        dueDate: day(f['Microsoft.VSTS.Scheduling.FinishDate']),
        completedAt: ms(f['Microsoft.VSTS.Common.ClosedDate']),
        createdAt,
      })
    }
  }
  return ws
}

// ---- run ----------------------------------------------------------------

const [items, categories] = await Promise.all([fetchWorkItems(), categoryLookup()])
const ws = toCairn(items, categories)

if (AS_JSON) {
  console.log(JSON.stringify(ws, null, 2))
} else {
  console.log(`Azure DevOps ${ORG}/${PROJECT} -> Cairn\n`)
  console.log(`  read          ${items.length} work items`)
  console.log(`  portfolios    ${ws.portfolios.length}  (from Epic)`)
  console.log(`  projects      ${ws.projects.length}  (from Feature)`)
  console.log(`  stories       ${ws.stories.length}  (from User Story)`)
  console.log(`  tasks         ${ws.tasks.length}  (from Task + Bug)`)
  console.log(`  skipped       ${ws.skipped.length}  (state category Removed)`)

  const byStatus = ws.tasks.reduce((a, t) => ({ ...a, [t.status]: (a[t.status] ?? 0) + 1 }), {})
  console.log(`\n  task status   ${JSON.stringify(byStatus)}`)
  console.log(`  with owner    ${ws.tasks.filter((t) => t.assignee).length}`)
  console.log(`  with due date ${ws.tasks.filter((t) => t.dueDate).length}`)
  console.log(`  completed at  ${ws.tasks.filter((t) => t.completedAt).length}`)
  const orphans = ws.tasks.filter((t) => !t.parentAdoId).length
  console.log(`  unparented    ${orphans}`)

  console.log('\n  sample tasks:')
  for (const t of ws.tasks.slice(0, 5)) {
    console.log(
      `    #${t.id.padEnd(9)} ${String(t.status).padEnd(12)} ${(t.assignee ?? '-').padEnd(14)} ${t.title.slice(0, 46)}`,
    )
  }
}
