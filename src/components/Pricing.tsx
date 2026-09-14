import { useState } from 'react'
import { CheckIcon, ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Reveal } from './Reveal'

/**
 * Pricing during the beta.
 *
 * This page used to advertise Starter / Professional / Enterprise at $0 / $25 /
 * Custom, with a 30-day trial, a money-back guarantee and a billing toggle —
 * none of which exist. There is no checkout in the product, so a visitor either
 * tried to pay and nothing happened, or wondered whether they were about to be
 * charged for something they had already been given for free.
 *
 * So: one honest card, the gaps next to it, and the intended tiers shown as
 * direction rather than as something purchasable. Every claim below is
 * checkable against the README's Status section, and the two lists are meant to
 * be edited together — a feature that ships moves across, it does not simply
 * appear on the left.
 */

/** Shipped and running in production. */
const included = [
  'Portfolio → project → story → task, on a Kanban board',
  'Provider attribution — Human, Claude, ChatGPT, Copilot, Gemini',
  'Due dates, owners, completion stamps, % complete, overdue counts',
  'An activity log that answers “what changed this week”',
  'Teams with roles: owner, admin, member, viewer',
  'Read-only Azure DevOps import — re-importing refreshes in place',
  'Markdown status report you can paste anywhere',
  'Guest mode — usable with no account at all',
]

/** Not built. Named here so nobody discovers them by being disappointed. */
const missing = [
  'Billing. There is no checkout, which is why this page has no prices.',
  'Invite emails — you copy the invite link and send it yourself.',
  'Capture runs a local heuristic; the Claude-powered version needs an API key that is not funded yet. The app labels which one produced your backlog.',
  'Two-way Azure DevOps sync. Import is one-way today.',
  'SSO / SAML, dedicated support, anything with an SLA.',
]

/** Direction only. Deliberately has no prices attached and no buttons. */
const planned = [
  {
    name: 'Starter',
    intent: 'Stays free. Solo work, a handful of projects, full attribution.',
  },
  {
    name: 'Team',
    intent: 'Per seat. Unlimited projects, two-way Azure DevOps sync, drift detection.',
  },
  {
    name: 'Enterprise',
    intent: 'Custom. SSO, portfolio governance, support commitments.',
  },
]

const faqs = [
  {
    q: 'What does it cost?',
    a: 'Nothing, and there is no way to pay even if you wanted to. No card is collected at sign-up, so there is nothing on file that could start charging you.',
  },
  {
    q: 'Will it start costing money later?',
    a: 'Probably, once enough of the "not built yet" list has shipped to be worth paying for. It will be announced before it happens, and since no card exists, nothing can quietly begin billing in the meantime.',
  },
  {
    q: 'Is it safe to put real work in?',
    a: 'Work is stored in Postgres with row-level security, and that isolation was tested by signing in as a different account and trying to read another team’s rows. Guest mode never leaves your browser. It is still a beta, so the Markdown status report is there whenever you want your own copy.',
  },
  {
    q: 'How do I get help?',
    a: 'The Feedback button in the app header — it goes straight to the person who built this, from guests as well as signed-in users. No ticket queue and no SLA; that is what beta means.',
  },
]

export function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <section id="pricing" className="section">
      <div className="container-cairn">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">Pricing</span>
          <h2 className="heading mt-5 text-h3 sm:text-h2">Free while Cairn is in beta.</h2>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            No checkout, no card, no trial clock. Everyone gets everything that works today — and
            what isn’t built yet is on this page too, so you can decide with your eyes open.
          </p>
        </Reveal>

        <div className="mx-auto mt-12 grid max-w-5xl items-stretch gap-6 lg:grid-cols-2">
          {/* What you actually get */}
          <Reveal>
            <div className="card flex h-full flex-col border-signal-500/60 p-7 shadow-lg shadow-signal-600/10 lg:border-2">
              <span className="mb-4 inline-flex w-fit items-center rounded-full bg-signal-600 px-3 py-1 text-xs font-semibold text-white">
                Beta
              </span>
              <h3 className="font-display text-h4 font-bold text-slate-900 dark:text-white">
                Everything, free
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                For as long as the beta runs.
              </p>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-display text-[2.75rem] font-bold leading-none text-slate-900 dark:text-white">
                  $0
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">/user/mo</span>
              </div>

              <a href="#start" className="btn-primary mt-6 w-full">
                Start free
              </a>
              <p className="mt-2 text-center text-xs text-slate-400">
                No card. Nothing to cancel.
              </p>

              <ul className="mt-7 space-y-3">
                {included.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300"
                  >
                    <CheckIcon
                      className="mt-0.5 h-4 w-4 shrink-0 text-signal-600 dark:text-signal-400"
                      strokeWidth={2.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* What you do not get, said out loud */}
          <Reveal delay={0.08}>
            <div className="card flex h-full flex-col p-7">
              <h3 className="font-display text-h4 font-bold text-slate-900 dark:text-white">
                Not built yet
              </h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                The honest half of the page.
              </p>

              <ul className="mt-7 space-y-3">
                {missing.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300"
                  >
                    <XMarkIcon
                      className="mt-0.5 h-4 w-4 shrink-0 text-slate-400"
                      strokeWidth={2.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <p className="mt-auto pt-7 text-xs text-slate-400">
                This is the same gap list the repository’s README carries. It gets shorter as
                things ship.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Direction, explicitly not a price list */}
        <Reveal className="mx-auto mt-10 max-w-5xl">
          <div className="rounded-2xl border border-dashed border-slate-300 p-6 dark:border-white/15">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-h5 font-semibold text-slate-900 dark:text-white">
                Where pricing is headed
              </h3>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Not purchasable
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Direction, not a price list. None of this can be bought today, and the shape will
              change before it can be.
            </p>
            <div className="mt-6 grid gap-5 sm:grid-cols-3">
              {planned.map((t) => (
                <div key={t.name}>
                  <p className="font-display text-base font-semibold text-slate-700 dark:text-slate-200">
                    {t.name}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t.intent}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

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
                  <ChevronDownIcon
                    className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${
                      openFaq === i ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === i && <p className="pb-4 text-slate-600 dark:text-slate-300">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Three claims that are actually true */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
          {['No card, not even asked for', 'Works without an account', 'Export your status as Markdown'].map(
            (t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckIcon className="h-4 w-4 text-success" strokeWidth={2.5} />
                {t}
              </span>
            ),
          )}
        </div>
      </div>
    </section>
  )
}
