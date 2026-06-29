import { motion } from 'framer-motion'
import { SparklesIcon, ArrowTrendingUpIcon, CheckBadgeIcon } from '@heroicons/react/24/solid'
import { ContextCollapseVisual } from './ContextCollapseVisual'

const trustLogos = ['Northwind', 'Helios', 'Vela', 'Quanta', 'Orbital', 'Kestrel']

export function Hero() {
  return (
    <section id="top" className="surface-gradient relative overflow-hidden">
      <div className="container-cairn grid min-h-[90vh] items-center gap-14 py-16 lg:grid-cols-[3fr_2fr] lg:py-24">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="eyebrow"
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            Built for the messy reality of multi-model AI work
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="heading mt-5 text-h2 sm:text-h1 lg:text-display"
          >
            Transform scattered AI work into{' '}
            <span className="bg-gradient-to-r from-signal-500 to-signal-300 bg-clip-text text-transparent">
              one source of truth
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-300"
          >
            Your AI work lives in five places and none of them are current. Cairn unifies Copilot,
            ChatGPT, Gemini, and Claude into one legible plan — portfolio to task — and tracks what
            every model actually shipped.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <a href="#start" className="btn-primary btn-lg">
              Schedule a demo
            </a>
            <a href="#demo" className="btn-ghost btn-lg">
              See how it works
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-5 text-sm text-slate-500 dark:text-slate-400"
          >
            Free consultation · No credit card required · 30-day trial
          </motion.p>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.36 }}
            className="mt-12"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Trusted by AI-native teams
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-3">
              {trustLogos.map((name) => (
                <span key={name} className="wordmark">
                  {name}
                </span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Visual with metric overlays */}
        <div className="relative">
          <ContextCollapseVisual />

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="card absolute -left-3 top-6 hidden items-center gap-2 px-3 py-2 sm:flex"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-success/10 text-success">
              <ArrowTrendingUpIcon className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900 dark:text-white">+38%</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">shipping velocity</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.62 }}
            className="card absolute -right-3 bottom-8 hidden items-center gap-2 px-3 py-2 sm:flex"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-signal-500/10 text-signal-600 dark:text-signal-300">
              <CheckBadgeIcon className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-900 dark:text-white">100%</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">work attributed</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
