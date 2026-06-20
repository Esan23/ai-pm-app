import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'

// Code-split the workspace so the landing page ships a lean bundle.
const AppPage = lazy(() => import('./pages/AppPage'))

function AppLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-50/40 dark:bg-ink">
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-signal-500 border-t-transparent" />
        Loading workspace…
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/app"
          element={
            <Suspense fallback={<AppLoading />}>
              <AppPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
