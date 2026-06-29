import { Reveal } from './Reveal'

const quotes = [
  {
    quote:
      'For the first time I can open one view and see the truth of every AI project. The status meeting basically writes itself.',
    name: 'Head of AI Engineering',
    detail: 'Series B SaaS',
  },
  {
    quote:
      'The attribution view ended the “what did the model actually ship?” debate. We finally trust the plan again.',
    name: 'Staff Engineer',
    detail: 'Applied AI team',
  },
  {
    quote:
      'It reads like it was built by someone who has actually shipped AI — not by people who’ve never written code.',
    name: 'Founder / CTO',
    detail: 'Seed-stage agent startup',
  },
]

export function SocialProof() {
  return (
    <section className="border-y border-slate-100 bg-slate-50/60 py-20 sm:py-28 dark:border-white/5 dark:bg-white/[0.02]">
      <div className="container-cairn">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Built for the people shipping AI</span>
          <h2 className="heading mt-5 text-h3 sm:text-h2">
            Make shipping AI look easy and inevitable
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {quotes.map((q, i) => (
            <Reveal key={q.name} delay={i * 0.08}>
              <figure className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
                <blockquote className="flex-1 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                  “{q.quote}”
                </blockquote>
                <figcaption className="mt-5 border-t border-slate-100 pt-4 dark:border-white/5">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{q.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{q.detail}</div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          Testimonials are illustrative personas for this concept, not verified customers.
        </p>
      </div>
    </section>
  )
}
