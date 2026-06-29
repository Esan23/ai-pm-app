import { Reveal } from './Reveal'
import { CheckIcon } from '@heroicons/react/20/solid'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'for solo builders',
    audience: 'Individuals getting started',
    features: [
      'Capture from chat & dictation',
      'Projects, stories & tasks',
      'Light AI assistance',
      'Selected prebuilt dashboards',
    ],
    cta: 'Start free',
    featured: false,
  },
  {
    name: 'Pro',
    price: '$25',
    cadence: 'per user / month',
    audience: 'Advanced builders & small teams',
    features: [
      'Everything in Free',
      'Connect Claude, ChatGPT & Copilot',
      'AI-built custom dashboards',
      'AI attribution & cost visibility',
      'Azure DevOps sync',
    ],
    cta: 'Start free trial',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cadence: 'bundled users',
    audience: 'Organizations & larger teams',
    features: [
      'Portfolio & strategy alignment',
      'Governance & executive dashboards',
      'Org-wide reporting & admin',
      'Bundled-user pricing',
      'SSO & priority support',
    ],
    cta: 'Talk to us',
    featured: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-20 sm:py-28">
      <div className="container-cairn">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Pricing</span>
          <h2 className="heading mt-5 text-h3 sm:text-h2">Start free. Pay once it works on your reality.</h2>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            $25/user/month is a rounding error against the cost of one stalled AI project — but you
            won&apos;t pay for a promise. Prove it on your own messy backlog first.
          </p>
        </Reveal>

        <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-start">
          {tiers.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div
                className={`flex h-full flex-col rounded-2xl border p-7 ${
                  t.featured
                    ? 'border-signal-400 bg-white shadow-2xl shadow-signal-600/10 lg:-mt-4 lg:pb-10 dark:border-signal-500/50 dark:bg-white/[0.04]'
                    : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-white">
                    {t.name}
                  </h3>
                  {t.featured && (
                    <span className="rounded-full bg-signal-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                      Most popular
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="font-display text-4xl font-bold text-slate-900 dark:text-white">
                    {t.price}
                  </span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{t.cadence}</span>
                </div>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t.audience}</p>

                <ul className="mt-6 space-y-3">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-signal-600 dark:text-signal-400" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#start"
                  className={`mt-8 ${t.featured ? 'btn-primary' : 'btn-ghost'} w-full`}
                >
                  {t.cta}
                </a>
              </div>
            </Reveal>
          ))}
        </div>
        <p className="mt-8 text-center text-xs text-slate-400">
          Pricing shown is illustrative for this concept and subject to change.
        </p>
      </div>
    </section>
  )
}
