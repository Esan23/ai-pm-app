import { Fragment, useState } from 'react'
import { CheckIcon, MinusIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { Reveal } from './Reveal'

type Billing = 'monthly' | 'annual'

const tiers = [
  {
    name: 'Starter',
    blurb: 'For solo builders getting started.',
    monthly: 0,
    annual: 0,
    cta: 'Start free',
    href: '#start',
    popular: false,
    features: [
      'Portfolio → project → story → task',
      'AI capture (chat & dictation)',
      'Provider attribution (Human + 1 AI)',
      'Up to 3 projects',
      'Prebuilt status dashboards',
    ],
  },
  {
    name: 'Professional',
    blurb: 'For teams shipping AI products.',
    monthly: 25,
    annual: 20,
    cta: 'Start free trial',
    href: '#start',
    popular: true,
    features: [
      'Everything in Starter',
      'Unlimited projects & portfolios',
      'Full multi-provider attribution',
      'Drift & risk detection',
      'Custom + AI-built dashboards',
      'Azure DevOps & MCP sync',
    ],
  },
  {
    name: 'Enterprise',
    blurb: 'For organizations & larger teams.',
    monthly: null,
    annual: null,
    cta: 'Schedule a demo',
    href: '#start',
    popular: false,
    features: [
      'Everything in Professional',
      'Portfolio governance & SSO/SAML',
      'Role-based access control',
      'Dedicated support & SLAs',
      'Bundled users & custom pricing',
    ],
  },
]

const comparison = [
  {
    category: 'Core features',
    rows: [
      { label: 'Enforced hierarchy', values: [true, true, true] },
      { label: 'AI capture → backlog', values: [true, true, true] },
      { label: 'Projects', values: ['3', 'Unlimited', 'Unlimited'] },
    ],
  },
  {
    category: 'AI & attribution',
    rows: [
      { label: 'Provider attribution', values: ['1 AI', 'All providers', 'All providers'] },
      { label: 'Drift & risk detection', values: [false, true, true] },
      { label: 'AI-built dashboards', values: [false, true, true] },
    ],
  },
  {
    category: 'Integrations & support',
    rows: [
      { label: 'Azure DevOps & MCP sync', values: [false, true, true] },
      { label: 'SSO / SAML', values: [false, false, true] },
      { label: 'Dedicated support & SLA', values: [false, false, true] },
    ],
  },
]

const faqs = [
  { q: 'Can I change plans?', a: 'Yes — upgrade, downgrade, or cancel anytime. Changes prorate automatically.' },
  { q: 'What’s included in the trial?', a: 'Every Professional feature for 30 days. No credit card required to start.' },
  { q: 'Do you offer discounts?', a: 'Yes — discounts are available for nonprofits and education. Reach out via the demo form.' },
  { q: 'How does Enterprise pricing work?', a: 'Custom pricing scales with bundled users; contact us for a tailored quote.' },
]

function Cell({ value }: { value: boolean | string }) {
  if (value === true)
    return <CheckIcon className="mx-auto h-5 w-5 text-success" strokeWidth={2.5} />
  if (value === false)
    return <MinusIcon className="mx-auto h-5 w-5 text-slate-300 dark:text-white/20" />
  return <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{value}</span>
}

export function Pricing() {
  const [billing, setBilling] = useState<Billing>('annual')
  const [showTable, setShowTable] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <section id="pricing" className="section">
      <div className="container-cairn">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Pricing</span>
          <h2 className="heading mt-5 text-h3 sm:text-h2">Start free. Pay once it works on your reality.</h2>

          {/* Billing toggle */}
          <div className="mt-7 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/5">
            {(['monthly', 'annual'] as Billing[]).map((b) => (
              <button
                key={b}
                onClick={() => setBilling(b)}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize transition ${
                  billing === b
                    ? 'bg-signal-600 text-white shadow'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {b}
                {b === 'annual' && <span className="ml-1 text-xs opacity-80">· save 20%</span>}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Tier cards */}
        <div className="mx-auto mt-12 grid max-w-5xl items-stretch gap-6 lg:grid-cols-3">
          {tiers.map((t, i) => {
            const price = billing === 'monthly' ? t.monthly : t.annual
            return (
              <Reveal key={t.name} delay={i * 0.08}>
                <div
                  className={`card flex h-full flex-col p-7 ${
                    t.popular
                      ? 'border-signal-500/60 shadow-lg shadow-signal-600/10 lg:-translate-y-2 lg:border-2'
                      : ''
                  }`}
                >
                  {t.popular && (
                    <span className="mb-4 inline-flex w-fit items-center rounded-full bg-signal-600 px-3 py-1 text-xs font-semibold text-white">
                      Most popular
                    </span>
                  )}
                  <h3 className="font-display text-h4 font-bold text-slate-900 dark:text-white">{t.name}</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.blurb}</p>

                  <div className="mt-5 flex items-baseline gap-1">
                    {price === null ? (
                      <span className="font-display text-h2 font-bold text-slate-900 dark:text-white">
                        Custom
                      </span>
                    ) : (
                      <>
                        <span className="font-display text-[2.75rem] font-bold leading-none text-slate-900 dark:text-white">
                          ${price}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">/user/mo</span>
                      </>
                    )}
                  </div>
                  {t.popular && billing === 'annual' && (
                    <p className="mt-1 text-xs text-signal-600 dark:text-signal-300">Billed annually</p>
                  )}

                  <a
                    href={t.href}
                    className={`mt-6 w-full ${t.popular ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {t.cta}
                  </a>

                  <ul className="mt-7 space-y-3">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
                        <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-signal-600 dark:text-signal-400" strokeWidth={2.5} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            )
          })}
        </div>

        {/* Comparison table */}
        <div className="mx-auto mt-10 max-w-5xl">
          <button
            onClick={() => setShowTable((s) => !s)}
            className="mx-auto flex items-center gap-2 text-sm font-semibold text-signal-700 dark:text-signal-300"
            aria-expanded={showTable}
          >
            {showTable ? 'Hide' : 'Compare'} all features
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${showTable ? 'rotate-180' : ''}`} />
          </button>

          {showTable && (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10">
                    <th className="py-3 pr-4 text-sm font-semibold text-slate-900 dark:text-white">Feature</th>
                    {tiers.map((t) => (
                      <th key={t.name} className="px-4 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">
                        {t.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparison.map((cat) => (
                    <Fragment key={cat.category}>
                      <tr>
                        <td colSpan={4} className="bg-slate-50 px-2 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-white/5 dark:text-slate-400">
                          {cat.category}
                        </td>
                      </tr>
                      {cat.rows.map((r) => (
                        <tr key={r.label} className="border-b border-slate-100 dark:border-white/5">
                          <td className="py-3 pr-4 text-sm text-slate-600 dark:text-slate-300">{r.label}</td>
                          {r.values.map((v, i) => (
                            <td key={i} className="px-4 py-3 text-center">
                              <Cell value={v} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* FAQ */}
        <div className="mx-auto mt-14 max-w-2xl">
          <h3 className="text-center font-display text-h4 font-bold text-slate-900 dark:text-white">
            Pricing questions
          </h3>
          <div className="mt-6 divide-y divide-slate-200 dark:divide-white/10">
            {faqs.map((f, i) => (
              <div key={f.q}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  aria-expanded={openFaq === i}
                >
                  <span className="font-medium text-slate-900 dark:text-white">{f.q}</span>
                  <ChevronDownIcon className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <p className="pb-4 text-slate-600 dark:text-slate-300">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
          {['No credit card required', 'Cancel anytime', '30-day money-back guarantee'].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckIcon className="h-4 w-4 text-success" strokeWidth={2.5} />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
