import { motion } from 'framer-motion'
import { ContextCollapseVisual } from './ContextCollapseVisual'

export function Hero() {
  return (
    <section id="top" className="surface-gradient relative overflow-hidden">
      <div className="container-cairn grid gap-14 py-20 sm:py-28 lg:grid-cols-[1.05fr_1fr] lg:items-center">
        <div>
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="eyebrow"
          >
            The system of record for AI projects
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="heading mt-5 text-4xl leading-[1.08] sm:text-5xl lg:text-6xl"
          >
            One source of truth for{' '}
            <span className="bg-gradient-to-r from-signal-500 to-signal-300 bg-clip-text text-transparent">
              every AI project
            </span>
            .
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-300"
          >
            Your AI work lives in five places and none of them are current. Cairn turns scattered
            context across Copilot, ChatGPT, Gemini, and Claude into one legible plan — portfolio to
            project to story to task — and tracks what every model actually shipped.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <a href="#start" className="btn-primary px-6 py-3.5 text-base">
              Start free
            </a>
            <a href="#how" className="btn-ghost px-6 py-3.5 text-base">
              See how it works
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="mt-5 text-sm text-slate-500 dark:text-slate-400"
          >
            Free for solo builders · No credit card · A real workflow working in minutes, not a
            three-week migration.
          </motion.p>
        </div>

        <ContextCollapseVisual />
      </div>
    </section>
  )
}
