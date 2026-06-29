import { CheckIcon } from '@heroicons/react/24/outline'
import { Reveal } from './Reveal'

const trust = ['30-day trial', 'No credit card', 'Cancel anytime', 'Setup in minutes']

export function FinalCTA() {
  return (
    <section id="cta" className="section">
      <div className="container-cairn">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-signal-600 to-signal-800 px-6 py-16 text-center sm:px-16 sm:py-20">
            <div className="surface-gradient pointer-events-none absolute inset-0 opacity-40" />
            <div className="relative">
              <h2 className="heading mx-auto max-w-2xl text-h3 text-white sm:text-h2">
                Ready to stop being the human source of truth?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-lg text-signal-50/90">
                Join the teams using Cairn to turn scattered AI work into one legible plan. Start your
                free trial today — no credit card required.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href="/app"
                  className="inline-flex items-center justify-center rounded-xl bg-white px-7 py-4 text-base font-semibold text-signal-700 shadow-lg transition hover:bg-signal-50"
                >
                  Start free trial
                </a>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center rounded-xl border border-white/40 px-7 py-4 text-base font-semibold text-white transition hover:bg-white/10"
                >
                  Schedule a demo
                </a>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-signal-50/90">
                {trust.map((t) => (
                  <span key={t} className="flex items-center gap-1.5">
                    <CheckIcon className="h-4 w-4" strokeWidth={2.5} />
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
