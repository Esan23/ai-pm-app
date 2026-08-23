import { useCallback, useSyncExternalStore } from 'react'

type Theme = 'light' | 'dark'

const KEY = 'cairn-theme'

/**
 * Theme state.
 *
 * The `dark` class is owned by this module and by the inline script in
 * index.html — not by whichever header happens to be mounted. Previously the
 * class was applied in a `useEffect` inside this hook, so a route that rendered
 * no header (the signed-out /admin gate) never applied the user's preference
 * at all, and every route flashed light before React mounted.
 *
 * State lives at module scope so the three headers that expose a toggle share
 * one source of truth rather than each holding a private copy.
 */

function read(): Theme {
  if (typeof window === 'undefined') return 'light'
  try {
    const stored = localStorage.getItem(KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

let theme: Theme = read()
const listeners = new Set<() => void>()

function apply(next: Theme) {
  theme = next
  document.documentElement.classList.toggle('dark', next === 'dark')
  try {
    localStorage.setItem(KEY, next)
  } catch {
    /* storage unavailable — the class still applies for this session */
  }
  listeners.forEach((l) => l())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot(): Theme {
  return theme
}

/** Server snapshot: no DOM to read, and nothing renders it anyway. */
function getServerSnapshot(): Theme {
  return 'light'
}

export function setTheme(next: Theme) {
  if (next !== theme) apply(next)
}

export function toggleTheme() {
  apply(theme === 'dark' ? 'light' : 'dark')
}

export function useTheme() {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const toggle = useCallback(() => toggleTheme(), [])
  return { theme: current, toggle }
}
