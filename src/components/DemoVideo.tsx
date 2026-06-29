import { PlayIcon } from '@heroicons/react/24/solid'
import { Reveal } from './Reveal'

const chapters = [
  { time: '0:00', label: 'The 2:47 a.m. problem' },
  { time: '0:45', label: 'Capture the chaos → hierarchy' },
  { time: '1:30', label: 'Provider attribution ledger' },
  { time: '2:20', label: 'Dashboards & drift detection' },
]

export function DemoVideo() {
  return (
    <section id="demo" className="section">
      <div className="container-cairn">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Watch the demo</span>
          <h2 className="heading mt-5 text-h3 sm:text-h2">See Cairn in action</h2>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            A 3-minute tour: dump three messy AI projects in, and watch them assemble into one legible,
            attributed plan.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-10 max-w-3xl">
            {/* 16:9 video placeholder */}
            <button
              className="surface-gradient group relative grid aspect-video w-full place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 dark:border-white/10"
              aria-label="Play product demo video"
            >
              <span className="grid h-20 w-20 place-items-center rounded-full bg-white/90 text-signal-700 shadow-xl transition group-hover:scale-110">
                <PlayIcon className="ml-1 h-9 w-9" />
              </span>
              <span className="absolute bottom-4 left-4 rounded-md bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur">
                Product tour · 3:00
              </span>
            </button>

            {/* Chapters */}
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {chapters.map((c) => (
                <div key={c.time} className="rounded-lg border border-slate-200 px-3 py-2 dark:border-white/10">
                  <p className="font-display text-sm font-bold text-signal-700 dark:text-signal-300">{c.time}</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{c.label}</p>
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-slate-600 dark:text-slate-300">
              Ready to try it yourself?{' '}
              <a href="#start" className="font-semibold text-signal-700 hover:underline dark:text-signal-300">
                Schedule a personalized demo →
              </a>
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
