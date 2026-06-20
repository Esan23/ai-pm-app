import { Reveal } from './Reveal'
import {
  ChatBubbleLeftRightIcon,
  Squares2X2Icon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'

const steps = [
  {
    icon: ChatBubbleLeftRightIcon,
    title: 'Capture',
    body: 'Talk or type what you’re building. Cairn pulls ideas from chat and dictation as you work — no form-filling, no context lost to a Slack thread.',
  },
  {
    icon: Squares2X2Icon,
    title: 'Deconstruct',
    body: 'Cairn breaks the conversation into a real backlog: portfolios, projects, user stories, and tasks — with requirements documented, not buried.',
  },
  {
    icon: CheckCircleIcon,
    title: 'Track',
    body: 'See what’s done, what’s outstanding, and what every model and tool actually shipped — attribution included, from user story to deployed agent.',
  },
  {
    icon: ArrowTrendingUpIcon,
    title: 'See what’s next',
    body: 'An AI scrum master reviews progress, clarifies priorities, surfaces roadblocks, and logs risks, issues, and decisions so nothing drifts.',
  },
]

export function HowItWorks() {
  return (
    <section id="how" className="py-20 sm:py-28">
      <div className="container-cairn">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">How it works</span>
          <h2 className="heading mt-5 text-3xl sm:text-4xl">
            From a conversation to a legible plan
          </h2>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            Describe what you&apos;re building — an app, an agent, a feature. Cairn does the wrangling
            so you spend your hours on the work and the team, not on chasing status.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-signal-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-signal-500/40">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-signal-500/10 text-signal-600 dark:text-signal-300">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="font-mono text-xs font-semibold text-slate-400">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-slate-900 dark:text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
