import { ArrowRightIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { Reveal } from './Reveal'

const beforeItems = ['5 browser tabs', '3 AI chat windows', 'An out-of-date board', 'A Slack you can’t keep up with', 'The truth, only in your head']
const afterItems = ['One legible portfolio view', 'Stories & tasks, always current', 'Every artifact attributed', 'Drift surfaced before it bites', 'Source of truth outside your head']

export function Solution() {
  return (
    <section id="solution" className="section">
      <div className="container-cairn">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="eyebrow">The solution</span>
          <h2 className="heading mt-5 text-h3 sm:text-h2">
            One legible system, built for how AI work actually moves
          </h2>
        </Reveal>

        <div className="mx-auto mt-8 max-w-3xl space-y-4 text-lg text-slate-600 dark:text-slate-300">
          <Reveal>
            <p>
              The problem was never you. It&apos;s that you&apos;ve never had a system built for the way
              AI work actually moves — sprawling, multi-model, and messy — instead of the tidy little
              sprint everyone else&apos;s tools imagined.
            </p>
          </Reveal>
          <Reveal delay={0.06}>
            <p>
              Cairn assembles the chaos into an enforced hierarchy — portfolio, projects, user stories,
              tasks — and attributes every artifact to the model or human that produced it. You consume
              Copilot, ChatGPT, Gemini, and Claude as inputs; Cairn keeps the ledger.
            </p>
          </Reveal>
          <Reveal delay={0.12}>
            <p>
              The result is calm competence: open one view, see the truth of every project in under a
              minute, and spend your hours on the work and the team instead of chasing status.
            </p>
          </Reveal>
        </div>

        {/* Before / After transformation */}
        <Reveal delay={0.1}>
          <div className="mx-auto mt-14 grid max-w-4xl items-stretch gap-4 md:grid-cols-[1fr_auto_1fr]">
            <div className="card border-error/30 p-6 dark:border-error/30">
              <p className="text-xs font-semibold uppercase tracking-wider text-error">Before Cairn</p>
              <ul className="mt-4 space-y-2.5">
                {beforeItems.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-slate-500 line-through decoration-error/40 dark:text-slate-400">
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid place-items-center">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-signal-600 text-white shadow-lg shadow-signal-600/30">
                <ArrowRightIcon className="h-5 w-5" />
              </span>
            </div>

            <div className="card border-signal-500/40 p-6 dark:border-signal-500/40">
              <p className="text-xs font-semibold uppercase tracking-wider text-signal-600 dark:text-signal-300">
                With Cairn
              </p>
              <ul className="mt-4 space-y-2.5">
                {afterItems.map((t) => (
                  <li key={t} className="flex items-start gap-2 text-slate-700 dark:text-slate-200">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal-500" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>

        {/* UVP callout */}
        <Reveal delay={0.15}>
          <div className="surface-gradient mx-auto mt-12 flex max-w-3xl items-start gap-4 rounded-2xl border border-signal-500/30 p-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-signal-600 text-white">
              <SparklesIcon className="h-5 w-5" />
            </span>
            <p className="text-lg text-slate-700 dark:text-slate-200">
              <span className="font-semibold text-slate-900 dark:text-white">
                Unlike generic CRMs and PM tools,
              </span>{' '}
              Cairn attributes every artifact to the model or human that produced it — so you see your
              ground truth, not a guess.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
