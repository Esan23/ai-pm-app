import { StarIcon } from '@heroicons/react/24/solid'
import { ArrowRightIcon } from '@heroicons/react/24/outline'
import { Reveal } from './Reveal'

const caseMetrics = [
  { value: '3×', label: 'more projects shipped to production' },
  { value: '60%', label: 'less time reconciling status' },
  { value: '0', label: 'projects lost to silent drift' },
]

const testimonials = [
  {
    quote:
      'For the first time I can open one view and see the truth of every AI project — without rebuilding it in my head every morning.',
    name: 'Daniel O.',
    title: 'Head of AI Engineering',
    company: 'Helios',
  },
  {
    quote:
      'The attribution ledger is the thing I didn’t know I was starving for. I finally know what Copilot vs ChatGPT actually shipped.',
    name: 'Priya N.',
    title: 'Staff Engineer',
    company: 'Vela',
  },
  {
    quote:
      'We stopped losing projects to “no decision.” Cairn surfaces the drift before it becomes a post-mortem.',
    name: 'Marcus T.',
    title: 'VP Product',
    company: 'Quanta',
  },
]

const stats = [
  { value: '500+', label: 'teams onboarding' },
  { value: '10k+', label: 'work items attributed' },
  { value: '94%', label: 'monthly retention' },
  { value: '4.8/5', label: 'average rating' },
]

export function SocialProof() {
  return (
    <section id="customers" className="section bg-slate-50 dark:bg-white/[0.02]">
      <div className="container-cairn">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Customer proof</span>
          <h2 className="heading mt-5 text-h3 sm:text-h2">Make shipping AI look easy and inevitable</h2>
        </Reveal>

        {/* Featured case study */}
        <Reveal delay={0.08}>
          <div className="card mt-12 overflow-hidden p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-center">
              <div>
                <span className="wordmark !text-2xl">Northwind AI</span>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Series B · 140 employees · AI-native product team
                </p>
                <blockquote className="mt-6 text-xl text-slate-700 dark:text-slate-200">
                  “Cairn became our system of record overnight. The portfolio is legible, the work is
                  attributed, and I got my mornings back.”
                </blockquote>
                <p className="mt-4 text-sm font-semibold text-slate-900 dark:text-white">
                  Alex R. · VP Engineering, Northwind AI
                </p>
                <a
                  href="#start"
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-signal-700 hover:gap-2.5 dark:text-signal-300"
                >
                  Read the full case study <ArrowRightIcon className="h-4 w-4 transition-all" />
                </a>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {caseMetrics.map((m) => (
                  <div key={m.label} className="rounded-xl bg-signal-500/[0.06] p-5 text-center">
                    <p className="font-display text-h2 font-bold text-signal-700 dark:text-signal-300">
                      {m.value}
                    </p>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>

        {/* Testimonial grid */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <figure className="card card-hover flex h-full flex-col p-6">
                <div className="flex gap-0.5 text-warning">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <StarIcon key={s} className="h-4 w-4" />
                  ))}
                </div>
                <blockquote className="mt-4 flex-1 text-slate-700 dark:text-slate-200">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t.title}</p>
                  </div>
                  <span className="wordmark !text-base">{t.company}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {/* Stats bar */}
        <Reveal delay={0.1}>
          <div className="mt-10 grid grid-cols-2 gap-6 rounded-2xl border border-slate-200 bg-white py-8 sm:grid-cols-4 dark:border-white/10 dark:bg-white/[0.03]">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-h3 font-bold text-slate-900 dark:text-white">{s.value}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <p className="mt-6 text-center text-xs italic text-slate-400">
          Customer names, logos, quotes, and figures are illustrative.
        </p>
      </div>
    </section>
  )
}
