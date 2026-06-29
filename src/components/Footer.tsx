import { useState } from 'react'
import { Logo } from './Logo'

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Integrations', href: '#security' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Security', href: '#security' },
      { label: 'Changelog', href: '#' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '#' },
      { label: 'Case studies', href: '#customers' },
      { label: 'Help center', href: '#' },
      { label: 'API docs', href: 'https://github.com/Esan23/ai-pm-app' },
      { label: 'Webinars', href: '#demo' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#start' },
      { label: 'Press kit', href: '#' },
      { label: 'Partners', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', href: '#' },
      { label: 'Terms of service', href: '#' },
      { label: 'Cookie policy', href: '#' },
      { label: 'GDPR', href: '#' },
      { label: 'Acceptable use', href: '#' },
    ],
  },
]

const socials = ['LinkedIn', 'Twitter', 'GitHub', 'YouTube']

export function Footer() {
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault()
    if (email.trim()) setDone(true)
  }

  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-ink">
      <div className="container-cairn py-16">
        {/* Newsletter */}
        <div className="mb-12 flex flex-col items-start justify-between gap-6 border-b border-slate-200 pb-12 md:flex-row md:items-center dark:border-white/10">
          <div>
            <h3 className="font-display text-h5 font-bold text-slate-900 dark:text-white">
              Get product updates and AI-delivery insights
            </h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Occasional, useful, no spam.</p>
          </div>
          {done ? (
            <p className="text-sm font-semibold text-success">Thanks — you’re subscribed.</p>
          ) : (
            <form onSubmit={subscribe} className="flex w-full max-w-md gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="input-field"
                aria-label="Email address"
              />
              <button type="submit" className="btn-primary shrink-0">
                Subscribe
              </button>
            </form>
          )}
        </div>

        {/* Columns */}
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">
              The system of record for AI projects — one source of truth, from portfolio to task.
            </p>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1">
              {socials.map((s) => (
                <a
                  key={s}
                  href="#"
                  className="text-xs font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      className="text-sm text-slate-500 transition hover:text-signal-600 dark:text-slate-400 dark:hover:text-signal-400"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-6 text-xs text-slate-400 sm:flex-row dark:border-white/10">
          <p>© {new Date().getFullYear()} Cairn. A concept project — not affiliated with any named tool.</p>
          <p>Built for ISM6427c.</p>
        </div>
      </div>
    </footer>
  )
}
