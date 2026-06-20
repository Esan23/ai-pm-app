import type { Workspace } from './types'

/** Demo workspace so /app is alive on first visit (Daniel's AI portfolio). */
export function seedWorkspace(): Workspace {
  const now = Date.now()
  return {
    portfolios: [
      {
        id: 'pf_demo',
        name: 'Q3 AI Bets',
        description: 'Board-level AI initiatives for this quarter.',
        createdAt: now,
      },
    ],
    projects: [
      {
        id: 'pr_agent',
        portfolioId: 'pf_demo',
        name: 'Support Agent',
        description: 'Autonomous agent that drafts support replies from the knowledge base.',
        createdAt: now,
      },
      {
        id: 'pr_search',
        portfolioId: 'pf_demo',
        name: 'Semantic Search',
        description: 'RAG-powered search across product docs and tickets.',
        createdAt: now,
      },
    ],
    stories: [
      {
        id: 'st_kb',
        projectId: 'pr_agent',
        title: 'Draft replies from the knowledge base',
        asA: 'support engineer',
        iWant: 'the agent to draft a reply grounded in our KB',
        soThat: 'I can approve and send in one click',
        priority: 'high',
        createdAt: now,
      },
      {
        id: 'st_eval',
        projectId: 'pr_agent',
        title: 'Evaluate answer quality before rollout',
        asA: 'AI lead',
        iWant: 'a RAG eval harness with graded test cases',
        soThat: 'I can trust quality before shipping to customers',
        priority: 'medium',
        createdAt: now,
      },
    ],
    tasks: [
      { id: 'tk1', projectId: 'pr_agent', storyId: 'st_kb', title: 'Index KB articles into vector store', status: 'done', provider: 'Copilot', createdAt: now },
      { id: 'tk2', projectId: 'pr_agent', storyId: 'st_kb', title: 'Draft-reply prompt + tool schema', status: 'in_progress', provider: 'Claude', createdAt: now },
      { id: 'tk3', projectId: 'pr_agent', storyId: 'st_kb', title: 'One-click approve & send UI', status: 'todo', provider: 'Human', createdAt: now },
      { id: 'tk4', projectId: 'pr_agent', storyId: 'st_eval', title: 'Build graded test set (50 cases)', status: 'todo', provider: 'ChatGPT', createdAt: now },
      { id: 'tk5', projectId: 'pr_agent', storyId: 'st_eval', title: 'Wire eval harness to CI', status: 'todo', provider: 'Human', createdAt: now },
    ],
  }
}
