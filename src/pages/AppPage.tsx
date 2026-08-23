import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DocumentTextIcon } from '@heroicons/react/24/outline'
import {
  refreshTeams,
  setSyncUser,
  switchTeam,
  useCanEdit,
  useSyncState,
  useWorkspace,
} from '../lib/store'
import { acceptInvite } from '../lib/teams'
import { AuthProvider, useAuth } from '../lib/auth'
import { AppHeader } from '../components/app/AppHeader'
import { ProjectSidebar } from '../components/app/ProjectSidebar'
import { ProjectHeader } from '../components/app/ProjectHeader'
import { CaptureBar } from '../components/app/CaptureBar'
import { StoryList } from '../components/app/StoryList'
import { KanbanBoard } from '../components/app/KanbanBoard'
import { AttributionSummary } from '../components/app/AttributionSummary'
import { ActivityFeed } from '../components/app/ActivityFeed'
import { EmptyWorkspace } from '../components/app/EmptyWorkspace'
import { StatusReport } from '../components/app/StatusReport'
import {
  BoardFilters,
  NO_FILTERS,
  filterTasks,
  isFiltered,
  type BoardFilterState,
} from '../components/app/BoardFilters'

export default function AppPage() {
  return (
    <AuthProvider>
      <Workspace />
    </AuthProvider>
  )
}

function Workspace() {
  const ws = useWorkspace()
  const sync = useSyncState()
  const { user, loading: authLoading } = useAuth()
  const canEdit = useCanEdit()
  const [activeId, setActiveId] = useState<string | null>(ws.projects[0]?.id ?? null)
  const [filters, setFilters] = useState<BoardFilterState>(NO_FILTERS)
  const [reportOpen, setReportOpen] = useState(false)
  const [params, setParams] = useSearchParams()
  const [inviteNote, setInviteNote] = useState<string | null>(null)

  // Switch persistence between guest (localStorage) and the signed-in user's
  // rows. Held until auth resolves so a returning session isn't treated as a
  // sign-out, which would clear the cached workspace.
  useEffect(() => {
    if (authLoading) return
    void setSyncUser(user?.id ?? null)
  }, [user, authLoading])

  // An /app?invite=<token> link. Redeeming needs a session, so an invite that
  // arrives signed-out waits in the URL until sign-in rather than being lost.
  const inviteToken = params.get('invite')
  useEffect(() => {
    if (!inviteToken || authLoading) return
    if (!user) {
      setInviteNote('Sign in with the invited email address to join this team.')
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const teamId = await acceptInvite(inviteToken)
        if (cancelled) return
        await refreshTeams()
        await switchTeam(teamId)
        setInviteNote('You joined the team.')
      } catch (e) {
        if (!cancelled) setInviteNote(e instanceof Error ? e.message : 'That invite did not work.')
      } finally {
        if (!cancelled) {
          params.delete('invite')
          setParams(params, { replace: true })
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [inviteToken, user, authLoading, params, setParams])

  // Keep selection valid as projects are added/removed.
  useEffect(() => {
    if (activeId && ws.projects.some((p) => p.id === activeId)) return
    setActiveId(ws.projects[0]?.id ?? null)
  }, [ws.projects, activeId])

  // A filter set for one project would be misleading on the next.
  useEffect(() => setFilters(NO_FILTERS), [activeId])

  const project = ws.projects.find((p) => p.id === activeId) ?? null
  const stories = ws.stories.filter((s) => s.projectId === activeId)
  const tasks = useMemo(
    () => ws.tasks.filter((t) => t.projectId === activeId),
    [ws.tasks, activeId],
  )
  const visibleTasks = useMemo(() => filterTasks(tasks, filters), [tasks, filters])
  const activity = useMemo(
    () => ws.activity.filter((e) => e.projectId === activeId),
    [ws.activity, activeId],
  )
  const isLoading = authLoading || sync.status === 'loading'

  return (
    <div className="min-h-screen bg-slate-50/40 dark:bg-ink">
      <AppHeader />

      {inviteNote && (
        <div className="mx-auto w-full max-w-[1320px] px-4 pt-4 sm:px-6">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-signal-500/30 bg-signal-500/10 px-4 py-2.5 text-sm text-signal-800 dark:text-signal-200">
            <span>{inviteNote}</span>
            <button
              onClick={() => setInviteNote(null)}
              className="text-xs font-semibold underline underline-offset-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto flex w-full max-w-[1320px] gap-6 px-4 py-6 sm:px-6">
        {/* Sidebar — hidden until there's something to navigate. */}
        {ws.projects.length > 0 && (
          <div className="hidden w-60 shrink-0 rounded-2xl border border-slate-200 bg-white py-2 lg:block dark:border-white/10 dark:bg-white/[0.02]">
            <ProjectSidebar ws={ws} activeProjectId={activeId} onSelect={setActiveId} />
          </div>
        )}

        {/* Main */}
        <main className="min-w-0 flex-1">
          {ws.projects.length > 0 && (
            <div className="mb-4 lg:hidden">
              <select
                value={activeId ?? ''}
                onChange={(e) => setActiveId(e.target.value)}
                aria-label="Select project"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium dark:border-white/15 dark:bg-white/5 dark:text-white"
              >
                {ws.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isLoading && ws.projects.length === 0 ? (
            <div className="mx-auto max-w-lg animate-pulse rounded-2xl border border-slate-200 p-12 dark:border-white/10">
              <div className="mx-auto h-4 w-40 rounded bg-slate-200 dark:bg-white/10" />
              <div className="mx-auto mt-3 h-3 w-64 rounded bg-slate-100 dark:bg-white/5" />
            </div>
          ) : project ? (
            <div className="space-y-6">
              <ProjectHeader project={project} tasks={tasks} />

              {canEdit && <CaptureBar projectId={project.id} />}

              <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
                <div className="space-y-6">
                  <section>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                        Execution board
                      </h2>
                      <button
                        onClick={() => setReportOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-signal-600 dark:text-slate-400 dark:hover:bg-white/10"
                      >
                        <DocumentTextIcon className="h-4 w-4" />
                        Status report
                      </button>
                    </div>
                    <BoardFilters
                      value={filters}
                      onChange={setFilters}
                      tasks={tasks}
                      matched={visibleTasks.length}
                    />
                    <KanbanBoard
                      projectId={project.id}
                      tasks={visibleTasks}
                      stories={stories}
                    />
                    {isFiltered(filters) && visibleTasks.length === 0 && tasks.length > 0 && (
                      <p className="mt-3 text-center text-xs text-slate-400">
                        No tasks match these filters.
                      </p>
                    )}
                  </section>

                  <section>
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                      User stories
                    </h2>
                    {/* Stories always summarize every task, filtered or not. */}
                    <StoryList stories={stories} tasks={tasks} />
                  </section>
                </div>

                <div className="space-y-6">
                  <AttributionSummary tasks={tasks} />
                  <ActivityFeed events={activity} />
                </div>
              </div>
            </div>
          ) : canEdit ? (
            <EmptyWorkspace onReady={setActiveId} />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center dark:border-white/15">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nothing has been shared with you in this team yet.
              </p>
            </div>
          )}
        </main>
      </div>

      {reportOpen && project && (
        <StatusReport ws={ws} projectId={project.id} onClose={() => setReportOpen(false)} />
      )}
    </div>
  )
}
