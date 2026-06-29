import {
  Squares2X2Icon,
  FingerPrintIcon,
  MicrophoneIcon,
  ShieldExclamationIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline'
import type { ComponentType, SVGProps } from 'react'
import { Reveal } from './Reveal'

interface Feature {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  name: string
  body: string
  metric: string
  metricLabel: string
  rows: { label: string; tag?: string; tone?: string }[]
}

const features: Feature[] = [
  {
    icon: Squares2X2Icon,
    name: 'Enforced portfolio-to-task hierarchy',
    body: 'Cairn structures everything into Portfolio → Project → Story → Task and keeps it enforced — so the whole portfolio stays legible at a glance instead of decaying into a graveyard of stale docs.',
    metric: '< 1 min',
    metricLabel: 'to see the truth of every project',
    rows: [
      { label: 'Portfolio · Q3 AI Bets', tone: 'signal' },
      { label: 'Project · Support Agent' },
      { label: 'Story · Draft replies from KB' },
      { label: 'Task · RAG eval harness' },
    ],
  },
  {
    icon: FingerPrintIcon,
    name: 'Provider-agnostic AI attribution',
    body: 'See which model or human produced every artifact — Copilot, ChatGPT, Gemini, Claude, or you. The cross-provider work-item ledger no incumbent ships: your ground truth, attributed and current.',
    metric: '100%',
    metricLabel: 'of work attributed to its source',
    rows: [
      { label: 'Drafted replies', tag: 'Claude', tone: 'claude' },
      { label: 'Opened the PR', tag: 'Copilot', tone: 'copilot' },
      { label: 'Wrote the spec', tag: 'ChatGPT', tone: 'chatgpt' },
      { label: 'Ran the research', tag: 'Gemini', tone: 'gemini' },
    ],
  },
  {
    icon: MicrophoneIcon,
    name: 'AI capture: from brain-dump to backlog',
    body: 'Talk or paste the messy, real state of a project. Cairn deconstructs the conversation into stories and tasks in seconds — no more re-typing context into a tool that forgets it tomorrow.',
    metric: 'Seconds',
    metricLabel: 'from idea to structured work items',
    rows: [
      { label: '“Build a support agent that drafts replies…”', tone: 'signal' },
      { label: '→ Story: Draft replies from KB' },
      { label: '→ Task: Evaluate answer quality' },
      { label: '→ Task: One-click approve + send' },
    ],
  },
  {
    icon: ShieldExclamationIcon,
    name: 'Drift & risk detection',
    body: 'Cairn works like an AI scrum master — surfacing blockers, aging risks, and stalling work before a project quietly dies. You see the drift before you feel it.',
    metric: 'Before',
    metricLabel: 'it dies, not after the post-mortem',
    rows: [
      { label: 'Risk · RAG eval blocked 6 days', tag: 'Aging', tone: 'warning' },
      { label: 'Blocker · Awaiting API key', tag: 'High', tone: 'error' },
      { label: 'Next · Approve eval harness', tone: 'signal' },
    ],
  },
  {
    icon: ArrowsRightLeftIcon,
    name: 'Azure DevOps & MCP sync',
    body: 'Integrate via MCP rather than rebuilding connectors. Consume agents (Copilot, Claude, Gemini) as inputs and sync work items to your Azure DevOps pipeline — ecosystem-agnostic by design.',
    metric: 'No lock-in',
    metricLabel: 'agents are inputs, not your master',
    rows: [
      { label: 'MCP · Claude', tag: 'Connected', tone: 'claude' },
      { label: 'Azure DevOps · pipeline', tag: 'Synced', tone: 'signal' },
      { label: 'GitHub Copilot · agent', tag: 'Tracked', tone: 'copilot' },
    ],
  },
]

const toneClasses: Record<string, string> = {
  signal: 'bg-signal-500/10 text-signal-700 dark:text-signal-300',
  claude: 'bg-attribution-claude-100 text-attribution-claude-700 dark:bg-attribution-claude-500/15 dark:text-attribution-claude-300',
  copilot: 'bg-attribution-copilot-100 text-attribution-copilot-700 dark:bg-attribution-copilot-500/15 dark:text-attribution-copilot-300',
  chatgpt: 'bg-attribution-chatgpt-100 text-attribution-chatgpt-700 dark:bg-attribution-chatgpt-500/15 dark:text-attribution-chatgpt-300',
  gemini: 'bg-attribution-gemini-100 text-attribution-gemini-700 dark:bg-attribution-gemini-500/15 dark:text-attribution-gemini-300',
  warning: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300',
  error: 'bg-error-100 text-error-700 dark:bg-error-500/15 dark:text-error-300',
}

function FeatureVisual({ feature }: { feature: Feature }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3 dark:border-white/5">
        <span className="h-2.5 w-2.5 rounded-full bg-error/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        <span className="ml-2 text-xs font-medium text-slate-400">{feature.name}</span>
      </div>
      <div className="space-y-2 pt-4">
        {feature.rows.map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-2.5 text-sm text-slate-700 dark:border-white/5 dark:text-slate-200"
            style={{ marginLeft: r.tone === 'signal' ? 0 : Math.min(i, 2) * 12 }}
          >
            <span className="truncate">{r.label}</span>
            {r.tag && (
              <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${toneClasses[r.tone ?? 'signal']}`}>
                {r.tag}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function Features() {
  return (
    <section id="features" className="section bg-slate-50 dark:bg-white/[0.02]">
      <div className="container-cairn">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Platform</span>
          <h2 className="heading mt-5 text-h3 sm:text-h2">
            Calm, legible control over the whole portfolio
          </h2>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            Every capability ties back to one outcome: the truth of your AI work, outside your head.
          </p>
        </Reveal>

        <div className="mt-16 space-y-20 lg:space-y-24">
          {features.map((f, i) => {
            const reverse = i % 2 === 1
            return (
              <div
                key={f.name}
                className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
              >
                <Reveal className={reverse ? 'lg:order-2' : ''}>
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-signal-500/10 text-signal-600 dark:text-signal-300">
                    <f.icon className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <h3 className="mt-5 font-display text-h4 font-bold text-slate-900 dark:text-white">
                    {f.name}
                  </h3>
                  <p className="mt-3 text-lg text-slate-600 dark:text-slate-300">{f.body}</p>
                  <div className="mt-6 inline-flex items-baseline gap-2 rounded-xl bg-signal-500/10 px-4 py-2">
                    <span className="font-display text-h4 font-bold text-signal-700 dark:text-signal-300">
                      {f.metric}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">{f.metricLabel}</span>
                  </div>
                </Reveal>
                <Reveal delay={0.1} className={reverse ? 'lg:order-1' : ''}>
                  <FeatureVisual feature={f} />
                </Reveal>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
