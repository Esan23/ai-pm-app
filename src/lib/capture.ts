import type { Priority, Provider } from './types'
import { addStory, addTask } from './store'

export interface DeconstructedStory {
  title: string
  asA: string
  iWant: string
  soThat: string
  priority: Priority
  tasks: { title: string; provider: Provider }[]
}

const ROLE_HINTS: { re: RegExp; role: string }[] = [
  { re: /support|ticket|customer|help\s?desk/i, role: 'support engineer' },
  { re: /admin|dashboard|report|analytics/i, role: 'team lead' },
  { re: /agent|automation|workflow/i, role: 'operator' },
  { re: /search|find|discover/i, role: 'user' },
  { re: /api|integrat|webhook|sync/i, role: 'developer' },
]

const PROVIDER_HINTS: { re: RegExp; provider: Provider }[] = [
  { re: /\bcode\b|implement|build|wire|endpoint|refactor|component/i, provider: 'Copilot' },
  { re: /prompt|reasoning|draft|summar|classif/i, provider: 'Claude' },
  { re: /research|explore|investigat|compare|spec/i, provider: 'ChatGPT' },
  { re: /design|ui|layout|mockup/i, provider: 'Human' },
]

function pickRole(text: string): string {
  return ROLE_HINTS.find((h) => h.re.test(text))?.role ?? 'user'
}

function pickProvider(taskTitle: string): Provider {
  return PROVIDER_HINTS.find((h) => h.re.test(taskTitle))?.provider ?? 'Human'
}

function splitGoals(text: string): string[] {
  // Break on sentence/clause boundaries and obvious list markers.
  return text
    .split(/[\n.;]|,? (?:and|then|also) /i)
    .map((s) => s.replace(/^[\s\-*•\d.)]+/, '').trim())
    .filter((s) => s.length > 3)
    .slice(0, 5)
}

const TASK_TEMPLATES = (goal: string): string[] => [
  `Define requirements & acceptance criteria for "${goal}"`,
  `Implement ${goal}`,
  `Add tests / eval for ${goal}`,
  `Review & ship ${goal}`,
]

/**
 * Demo deconstruction — a deterministic, client-side heuristic that turns a
 * free-text description into structured user stories + tasks. No API key needed.
 * Swap this for a real LLM call (e.g. a Netlify function) without touching the UI.
 */
export function deconstruct(description: string): DeconstructedStory[] {
  const goals = splitGoals(description)
  const seeds = goals.length ? goals : [description.trim() || 'the new capability']

  return seeds.map((goal, i) => {
    const lower = goal.toLowerCase()
    const cleanGoal = goal.charAt(0).toLowerCase() + goal.slice(1)
    return {
      title: goal.charAt(0).toUpperCase() + goal.slice(1),
      asA: pickRole(lower),
      iWant: cleanGoal.replace(/^(i\s+)?(want|need|would like)\s+(to\s+)?/i, ''),
      soThat: 'I can move the work forward without losing context',
      priority: (i === 0 ? 'high' : i === 1 ? 'medium' : 'low') as Priority,
      tasks: TASK_TEMPLATES(cleanGoal)
        .slice(0, 3)
        .map((t) => ({ title: t, provider: pickProvider(t) })),
    }
  })
}

export type CaptureSource = 'ai' | 'demo'

export interface CaptureResult {
  stories: DeconstructedStory[]
  source: CaptureSource
}

const VALID_PROVIDERS: Provider[] = ['Human', 'Claude', 'ChatGPT', 'Copilot', 'Gemini']
const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high']

/** Defensively coerce a server-returned story into our shape. */
function sanitize(raw: unknown): DeconstructedStory[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((s: any) => ({
      title: String(s?.title ?? '').slice(0, 160),
      asA: String(s?.asA ?? 'user'),
      iWant: String(s?.iWant ?? ''),
      soThat: String(s?.soThat ?? ''),
      priority: VALID_PRIORITIES.includes(s?.priority) ? s.priority : 'medium',
      tasks: Array.isArray(s?.tasks)
        ? s.tasks.slice(0, 6).map((t: any) => ({
            title: String(t?.title ?? '').slice(0, 200),
            provider: VALID_PROVIDERS.includes(t?.provider) ? t.provider : 'Human',
          }))
        : [],
    }))
    .filter((s) => s.title.length > 0)
}

/**
 * Deconstruct via the Claude-backed Netlify function, falling back to the local
 * heuristic when the function is unreachable (e.g. plain `vite dev`) or runs in
 * demo mode (no ANTHROPIC_API_KEY configured server-side).
 */
export async function requestDeconstruction(description: string): Promise<CaptureResult> {
  try {
    const res = await fetch('/.netlify/functions/capture', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ description }),
    })
    if (res.ok) {
      const data = await res.json()
      const stories = sanitize(data?.stories)
      if (data?.source === 'ai' && stories.length > 0) {
        return { stories, source: 'ai' }
      }
    }
  } catch {
    /* function unreachable — fall through to local heuristic */
  }
  return { stories: deconstruct(description), source: 'demo' }
}

/** Persist a deconstruction into the workspace under the given project. */
export function applyDeconstruction(projectId: string, stories: DeconstructedStory[]) {
  stories.forEach((s) => {
    const story = addStory(projectId, {
      title: s.title,
      asA: s.asA,
      iWant: s.iWant,
      soThat: s.soThat,
      priority: s.priority,
    })
    s.tasks.forEach((t) => addTask(projectId, t.title, { storyId: story.id, provider: t.provider }))
  })
}
