import { Reveal } from './Reveal'
import {
  RectangleStackIcon,
  CpuChipIcon,
  ArrowsRightLeftIcon,
  ChartBarSquareIcon,
  ShieldExclamationIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

const features = [
  {
    icon: RectangleStackIcon,
    title: 'Enforced hierarchy',
    body: 'Portfolio → project → user story → task. One structure that aligns strategy to the work actually being executed — at the individual, team, or enterprise level.',
  },
  {
    icon: CpuChipIcon,
    title: 'Provider-agnostic AI attribution',
    body: 'See which model or tool produced which artifact — Copilot, ChatGPT, Gemini, Claude — with cost and token visibility. No incumbent does this.',
    highlight: true,
  },
  {
    icon: ArrowsRightLeftIcon,
    title: 'Azure DevOps pipeline sync',
    body: 'Two-way sync of work items and pipeline status so Cairn stays the source of truth without ripping out the tooling your org already runs.',
  },
  {
    icon: SparklesIcon,
    title: 'AI scrum master',
    body: 'What did you complete, what’s planned, what’s blocking you? Cairn summarizes progress, flags next steps, and keeps risks and decisions documented.',
  },
  {
    icon: ChartBarSquareIcon,
    title: 'Dashboards that decide',
    body: 'Project health, sprint, backlog, risk, and portfolio views. Ask in plain language — “show overdue tasks by priority” — and Cairn builds the dashboard.',
  },
  {
    icon: ShieldExclamationIcon,
    title: 'Risk & roadblock radar',
    body: 'Cairn scans tasks, notes, and dependencies to surface blockers and aging risks before a project quietly drifts the way the last one did.',
  },
]

export function Features() {
  return (
    <section
      id="features"
      className="border-y border-slate-100 bg-slate-50/60 py-20 sm:py-28 dark:border-white/5 dark:bg-white/[0.02]"
    >
      <div className="container-cairn">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">Built for how AI work actually moves</span>
          <h2 className="heading mt-5 text-3xl sm:text-4xl">
            Calm, legible control over the whole portfolio
          </h2>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            Not another bloated board built for managers. Cairn is built for makers — small inputs,
            outsized leverage, and a system that holds it together so your stamina doesn&apos;t have to.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 0.08}>
              <div
                className={`h-full rounded-2xl border p-6 transition ${
                  f.highlight
                    ? 'border-signal-300 bg-gradient-to-br from-signal-500/10 to-transparent dark:border-signal-500/40'
                    : 'border-slate-200 bg-white hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/20'
                }`}
              >
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-signal-500/10 text-signal-600 dark:text-signal-300">
                  <f.icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 flex items-center gap-2 font-display text-lg font-semibold text-slate-900 dark:text-white">
                  {f.title}
                  {f.highlight && (
                    <span className="rounded-full bg-signal-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Whitespace
                    </span>
                  )}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {f.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
