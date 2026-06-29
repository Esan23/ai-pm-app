import { useEffect, useState } from 'react'
import { useWorkspace, setSyncUser } from '../lib/store'
import { AuthProvider, useAuth } from '../lib/auth'
import { AppHeader } from '../components/app/AppHeader'
import { ProjectSidebar } from '../components/app/ProjectSidebar'
import { CaptureBar } from '../components/app/CaptureBar'
import { StoryList } from '../components/app/StoryList'
import { KanbanBoard } from '../components/app/KanbanBoard'
import { AttributionSummary } from '../components/app/AttributionSummary'

export default function AppPage() {
  return (
    <AuthProvider>
      <Workspace />
    </AuthProvider>
  )
}

function Workspace() {
  const ws = useWorkspace()
  const { user } = useAuth()
  const [activeId, setActiveId] = useState<string | null>(ws.projects[0]?.id ?? null)

  // Switch persistence between guest (localStorage) and the signed-in user's remote workspace.
  useEffect(() => {
    setSyncUser(user?.id ?? null)
  }, [user])

  // Keep selection valid as projects are added/removed.
  useEffect(() => {
    if (activeId && ws.projects.some((p) => p.id === activeId)) return
    setActiveId(ws.projects[0]?.id ?? null)
  }, [ws.projects, activeId])

  const project = ws.projects.find((p) => p.id === activeId) ?? null
  const stories = ws.stories.filter((s) => s.projectId === activeId)
  const tasks = ws.tasks.filter((t) => t.projectId === activeId)

  return (
    <div className="min-h-screen bg-slate-50/40 dark:bg-ink">
      <AppHeader />

      <div className="mx-auto flex w-full max-w-[1320px] gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar */}
        <div className="hidden w-60 shrink-0 rounded-2xl border border-slate-200 bg-white py-2 lg:block dark:border-white/10 dark:bg-white/[0.02]">
          <ProjectSidebar ws={ws} activeProjectId={activeId} onSelect={setActiveId} />
        </div>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Mobile project selector */}
          <div className="mb-4 lg:hidden">
            <select
              value={activeId ?? ''}
              onChange={(e) => setActiveId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium dark:border-white/15 dark:bg-white/5 dark:text-white"
            >
              {ws.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {project ? (
            <div className="space-y-6">
              <div>
                <h1 className="font-display text-h3 font-bold text-slate-900 dark:text-white">
                  {project.name}
                </h1>
                {project.description && (
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {project.description}
                  </p>
                )}
              </div>

              <CaptureBar projectId={project.id} />

              <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
                <div className="space-y-6">
                  <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                      Execution board
                    </h2>
                    <KanbanBoard projectId={project.id} tasks={tasks} />
                  </section>

                  <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                      User stories
                    </h2>
                    <StoryList stories={stories} tasks={tasks} />
                  </section>
                </div>

                <div className="space-y-6">
                  <AttributionSummary tasks={tasks} />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-white/15">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No project selected. Create one from the sidebar to get started.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
