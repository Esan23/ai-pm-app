import type { Provider } from '../../lib/types'

const STYLES: Record<Provider, string> = {
  Human: 'bg-attribution-human-100 text-attribution-human-700 dark:bg-attribution-human-500/15 dark:text-attribution-human-300',
  Claude: 'bg-attribution-claude-100 text-attribution-claude-700 dark:bg-attribution-claude-500/15 dark:text-attribution-claude-300',
  ChatGPT: 'bg-attribution-chatgpt-100 text-attribution-chatgpt-700 dark:bg-attribution-chatgpt-500/15 dark:text-attribution-chatgpt-300',
  Copilot: 'bg-attribution-copilot-100 text-attribution-copilot-700 dark:bg-attribution-copilot-500/15 dark:text-attribution-copilot-300',
  Gemini: 'bg-attribution-gemini-100 text-attribution-gemini-700 dark:bg-attribution-gemini-500/15 dark:text-attribution-gemini-300',
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
