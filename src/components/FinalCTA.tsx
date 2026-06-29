import { Reveal } from './Reveal'

export function FinalCTA() {
  return (
    <section className="py-20 sm:py-28">
      <div className="container-cairn">
        <Reveal>
          <div className="surface-gradient relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 px-8 py-16 text-center sm:px-16 dark:border-white/10">
            <h2 className="heading mx-auto max-w-2xl text-h3 text-white sm:text-h2">
              Stop being the human source of truth.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
              Get a calm, legible system where you open one view and see the truth of every project.
              Set it up in minutes — relief this quarter, not after a migration.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a href="#start" className="btn-primary px-7 py-3.5 text-base">
                Start free
              </a>
              <a href="#how" className="btn-ghost border-white/20 px-7 py-3.5 text-base text-white hover:bg-white/10">
                See how it works
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
