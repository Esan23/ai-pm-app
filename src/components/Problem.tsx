import { Reveal } from './Reveal'

const frustrations = [
  {
    quote: '“Where does this live?”',
    body: 'Tasks and user stories live in five places — Jira, Notion, a spreadsheet, your head — and none of them are current.',
  },
  {
    quote: '“Who owns this?”',
    body: 'You re-explain the same project context across Slack, standups, and three AI chats because nothing connects.',
  },
  {
    quote: '“What actually shipped?”',
    body: 'Copilot PRs, ChatGPT specs, and Gemini research produce output that never lands cleanly back into the plan as trackable progress.',
  },
]

export function Problem() {
  return (
    <section id="problem" className="border-y border-slate-100 bg-slate-50/60 py-20 sm:py-28 dark:border-white/5 dark:bg-white/[0.02]">
      <div className="container-cairn">
        <Reveal className="max-w-2xl">
          <span className="eyebrow">The daily tax</span>
          <h2 className="heading mt-5 text-3xl sm:text-4xl">
            You can&apos;t get one honest answer to{' '}
            <span className="text-signal-600 dark:text-signal-400">
              “what&apos;s the status of everything?”
            </span>
          </h2>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            Generic tools weren&apos;t built for AI work. They assume a tidy linear sprint — not messy
            experimentation across models, IDEs, and chat windows. So you become the human source of
            truth, rebuilding the picture in your head every morning.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {frustrations.map((f, i) => (
            <Reveal key={f.quote} delay={i * 0.08}>
              <div className="h-full rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="font-display text-xl font-semibold text-slate-900 dark:text-white">
                  {f.quote}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {f.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
