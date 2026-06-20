import { Logo } from './Logo'

const cols = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', href: '#how' },
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#top' },
      { label: 'Research', href: 'https://github.com/Esan23/ai-pm-app' },
      { label: 'Contact', href: '#start' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white dark:border-white/5 dark:bg-ink">
      <div className="container-cairn py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              The system of record for AI projects. Track what every model and tool actually shipped,
              from user story to deployed agent.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {c.title}
              </h4>
              <ul className="mt-4 space-y-3">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-slate-600 transition hover:text-signal-600 dark:text-slate-300 dark:hover:text-signal-400"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row dark:border-white/5">
          <p>© {new Date().getFullYear()} Cairn. A concept project — not affiliated with any named tool.</p>
          <p>Built for ISM6427c.</p>
        </div>
      </div>
    </footer>
  )
}
