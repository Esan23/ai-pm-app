interface LogoProps {
  className?: string
  withWordmark?: boolean
}

/** Cairn mark: a balanced stack of stones marking the trail. */
export function Logo({ className = '', withWordmark = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-signal-400 to-signal-600 shadow-md shadow-signal-600/30">
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden="true">
          <ellipse cx="16" cy="24" rx="9" ry="3.6" fill="#fff" />
          <ellipse cx="16" cy="17.5" rx="6.8" ry="3" fill="#fff" opacity="0.9" />
          <ellipse cx="16" cy="12" rx="4.6" ry="2.4" fill="#fff" opacity="0.8" />
          <circle cx="16" cy="7" r="2.6" fill="#fff" />
        </svg>
      </span>
      {withWordmark && (
        <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Cairn
        </span>
      )}
    </span>
  )
}
