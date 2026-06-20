import type { Provider } from '../../lib/types'

const STYLES: Record<Provider, string> = {
  Human: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  Claude: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  ChatGPT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  Copilot: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  Gemini: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
}

export function ProviderBadge({ provider, className = '' }: { provider: Provider; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${STYLES[provider]} ${className}`}
      title={`Produced by: ${provider}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {provider}
    </span>
  )
}
