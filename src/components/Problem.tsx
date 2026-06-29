import { ArrowTrendingDownIcon, RectangleStackIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { Reveal } from './Reveal'

const pains = [
  {
    icon: ArrowTrendingDownIcon,
    title: 'Projects that quietly drift',
    body: 'Work sprawls across experiments and dead ends. No one can give an honest answer to "what’s the status of everything?" — until a project has already stalled.',
    stat: '1 in 3',
    statLabel: 'AI initiatives stall before production — industry research (illustrative)',
  },
  {
    icon: RectangleStackIcon,
    title: 'Context scattered everywhere',
    body: 'The truth lives in Slack threads, chat tabs, a stale board, and your own head. You become the human source of truth, rebuilding the picture by hand every morning.',
    stat: '9+ hrs',
    statLabel: 'per person per week lost reconciling status — industry research (illustrative)',
  },
  {
    icon: EyeSlashIcon,
    title: 'No AI ground truth',
    body: 'Copilot, ChatGPT, Gemini, and Claude all produce output — but nothing tells you which tool actually shipped what, or whether it landed back in the plan.',
    stat: '0',
    statLabel: 'generic tools attribute work across AI providers',
  },
]

export function Problem() {
  return (
    <section id="problem" className="section bg-slate-50 dark:bg-white/[0.02]">
      <div className="container-cairn">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">The daily tax</span>
          <h2 className="heading mt-5 text-h3 sm:text-h2">
            Still running AI projects on{' '}
            <span className="text-signal-600 dark:text-signal-400">scattered tabs and guesswork?</span>
          </h2>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            Generic tools weren&apos;t built for AI work. They assume a tidy linear sprint — not messy
            experimentation across models, IDEs, and chat windows.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pains.map((p, i) => (
            <Reveal key={p.title} delay={i * 0.08}>
              <div className="card card-hover h-full p-7">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-signal-500/10 text-signal-600 dark:text-signal-300">
                  <p.icon className="h-6 w-6" strokeWidth={2} />
                </span>
                <h3 className="mt-5 font-display text-h5 font-semibold text-slate-900 dark:text-white">
                  {p.title}
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300">{p.body}</p>
                <div className="mt-6 border-t border-slate-100 pt-5 dark:border-white/5">
                  <p className="font-display text-[2.75rem] font-bold leading-none text-slate-900 dark:text-white">
                    {p.stat}
                  </p>
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{p.statLabel}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        <p className="mt-6 text-xs italic text-slate-400">Figures illustrative.</p>
      </div>
    </section>
  )
}
