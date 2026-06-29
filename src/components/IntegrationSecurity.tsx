import { LockClosedIcon, KeyIcon, UserGroupIcon, ShieldCheckIcon, ArrowRightIcon } from '@heroicons/react/24/outline'
import { Reveal } from './Reveal'

const integrations = [
  'Claude',
  'ChatGPT',
  'Gemini',
  'Copilot',
  'Azure DevOps',
  'GitHub',
  'Slack',
  'Linear',
  'Jira',
  'Notion',
  'Teams',
  'MCP',
]

const badges = ['SOC 2 Type II', 'GDPR', 'ISO 27001', 'CCPA']

const securityFeatures = [
  { icon: LockClosedIcon, label: '256-bit encryption at rest & in transit' },
  { icon: KeyIcon, label: 'SSO / SAML support' },
  { icon: UserGroupIcon, label: 'Role-based access control' },
  { icon: ShieldCheckIcon, label: 'Regular third-party security audits' },
]

export function IntegrationSecurity() {
  return (
    <section id="security" className="section bg-slate-50 dark:bg-white/[0.02]">
      <div className="container-cairn grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Integrations */}
        <Reveal>
          <span className="eyebrow">Integrations</span>
          <h2 className="heading mt-5 text-h3">Connects with your existing stack</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Integrate via MCP — the emerging standard — instead of brittle one-off connectors. Cairn
            consumes your AI tools and syncs to your pipeline.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-4">
            {integrations.map((name) => (
              <div
                key={name}
                className="card grid h-16 place-items-center px-2 text-center text-sm font-semibold text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
              >
                {name}
              </div>
            ))}
          </div>
          <a
            href="#start"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-signal-700 hover:gap-2.5 dark:text-signal-300"
          >
            View all integrations <ArrowRightIcon className="h-4 w-4 transition-all" />
          </a>
        </Reveal>

        {/* Security & compliance */}
        <Reveal delay={0.1}>
          <span className="eyebrow">Security</span>
          <h2 className="heading mt-5 text-h3">Enterprise-grade security by design</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">
            Built to enterprise standards from day one, so technical buyers can say yes.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {badges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
              >
                <ShieldCheckIcon className="h-4 w-4 text-signal-600 dark:text-signal-400" />
                {b}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs italic text-slate-400">Compliance roadmap — certifications in progress.</p>

          <ul className="mt-6 space-y-3">
            {securityFeatures.map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-signal-500/10 text-signal-600 dark:text-signal-300">
                  <f.icon className="h-5 w-5" strokeWidth={2} />
                </span>
                {f.label}
              </li>
            ))}
          </ul>

          <a
            href="#start"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-signal-700 hover:gap-2.5 dark:text-signal-300"
          >
            View security documentation <ArrowRightIcon className="h-4 w-4 transition-all" />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
