import type { Priority, Provider, TaskStatus } from './types'

/**
 * Optional demo content, loaded only when a user explicitly asks for it from
 * the empty state. It is never auto-seeded: a new account starts empty so the
 * first thing someone sees is their own work, not Daniel's fictional portfolio.
 *
 * Declared without IDs or absolute dates — the store creates rows in
 * parent-first order (so IDs are fresh and foreign keys resolve) and resolves
 * day offsets against today, so the demo always has a live mix of overdue,
 * due-soon, and upcoming work rather than dates that rot.
 */

export interface DemoTask {
  title: string
  provider: Provider
  status: TaskStatus
  assignee: string | null
  /** Days from today; omit for no due date. Negative = already overdue. */
  dueInDays?: number
}

export interface DemoStory {
  title: string
  asA: string
  iWant: string
  soThat: string
  priority: Priority
  tasks: DemoTask[]
}

export interface DemoProject {
  name: string
  description: string
  /** Days from today for the project target date. */
  targetInDays?: number
  stories: DemoStory[]
}

export interface DemoPortfolio {
  name: string
  description: string
  projects: DemoProject[]
}

export const DEMO_PORTFOLIO: DemoPortfolio = {
  name: 'Q3 AI Bets',
  description: 'Board-level AI initiatives for this quarter.',
  projects: [
    {
      name: 'Support Agent',
      description: 'Autonomous agent that drafts support replies from the knowledge base.',
      targetInDays: 21,
      stories: [
        {
          title: 'Draft replies from the knowledge base',
          asA: 'support engineer',
          iWant: 'the agent to draft a reply grounded in our KB',
          soThat: 'I can approve and send in one click',
          priority: 'high',
          tasks: [
            {
              title: 'Index KB articles into vector store',
              provider: 'Copilot',
              status: 'done',
              assignee: 'Priya',
              dueInDays: -6,
            },
            {
              title: 'Draft-reply prompt + tool schema',
              provider: 'Claude',
              status: 'in_progress',
              assignee: 'Daniel',
              dueInDays: 2,
            },
            {
              title: 'One-click approve & send UI',
              provider: 'Human',
              status: 'todo',
              assignee: 'Marco',
              dueInDays: 9,
            },
          ],
        },
        {
          title: 'Evaluate answer quality before rollout',
          asA: 'AI lead',
          iWant: 'a RAG eval harness with graded test cases',
          soThat: 'I can trust quality before shipping to customers',
          priority: 'medium',
          tasks: [
            {
              title: 'Build graded test set (50 cases)',
              provider: 'ChatGPT',
              status: 'todo',
              assignee: 'Priya',
              dueInDays: -1,
            },
            {
              title: 'Wire eval harness to CI',
              provider: 'Human',
              status: 'todo',
              assignee: null,
              dueInDays: 14,
            },
          ],
        },
      ],
    },
    {
      name: 'Semantic Search',
      description: 'RAG-powered search across product docs and tickets.',
      stories: [],
    },
  ],
}
