import type { ComponentType, SVGProps } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Logo } from '../Logo'

export interface NavItem {
  key: string
  label: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

interface Props {
  items: NavItem[]
  active: string
  onSelect: (key: string) => void
  open: boolean
  onClose: () => void
}

export function AdminSidebar({ items, active, onSelect, open, onClose }: Props) {
  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {items.map((it) => {
        const isActive = active === it.key
        return (
          <button
            key={it.key}
            onClick={() => {
              onSelect(it.key)
              onClose()
            }}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-signal-500/10 text-signal-700 dark:text-signal-300'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
            }`}
          >
            <it.icon className="h-5 w-5 shrink-0" strokeWidth={2} />
            {it.label}
          </button>
        )
      })}
    </nav>
  )

  return (
    <>
      {/* Desktop */}
      <aside className="hidden w-60 shrink-0 border-r border-slate-200 bg-white lg:block dark:border-white/10 dark:bg-ink">
        {nav}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-slate-200 bg-white dark:border-white/10 dark:bg-ink">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-white/10">
              <Logo />
              <button onClick={onClose} aria-label="Close menu" className="grid h-9 w-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            {nav}
          </aside>
        </div>
      )}
    </>
  )
}
