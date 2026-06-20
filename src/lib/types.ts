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
