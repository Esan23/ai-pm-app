import { useEffect, useRef, useState } from 'react'
import { Reveal } from './Reveal'

const TIME_SAVED = 0.6 // Cairn reclaims ~60% of status-reconciliation time

function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(target)
  const fromRef = useRef(target)
  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      fromRef.current = target
      setValue(target)
      return
    }
    const from = fromRef.current
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(from + (target - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = target
    }
    raf = requestAnimationFrame(tick)
    // Fallback: guarantee the final value lands even if rAF is throttled
    // (e.g. a backgrounded tab), so the figure is never left stale.
    const settle = window.setTimeout(() => {
      fromRef.current = target
      setValue(target)
    }, duration + 80)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(settle)
    }
  }, [target, duration])
  return value
}

const usd = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (n: number) => void
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</span>
        <span className="font-display text-sm font-bold text-signal-700 dark:text-signal-300">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-signal-600 dark:bg-white/10"
        aria-label={label}
      />
    </label>
  )
}

export function ROICalculator() {
  const [team, setTeam] = useState(8)
  const [hours, setHours] = useState(6)
  const [rate, setRate] = useState(75)
  const [projects, setProjects] = useState(3)

  const weeklyCoordHours = team * hours
  const annualHoursReclaimed = Math.round(weeklyCoordHours * TIME_SAVED * 52)
  const annualValue = annualHoursReclaimed * rate
  const afterWeekly = Math.round(weeklyCoordHours * (1 - TIME_SAVED))

  const animatedValue = useCountUp(annualValue)
  const animatedHours = useCountUp(annualHoursReclaimed)

  const afterPct = weeklyCoordHours === 0 ? 0 : Math.round((afterWeekly / weeklyCoordHours) * 100)

  return (
    <section id="roi" className="section">
      <div className="container-cairn">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="eyebrow">ROI calculator</span>
          <h2 className="heading mt-5 text-h3 sm:text-h2">What is the status-chasing tax costing you?</h2>
          <p className="mt-5 text-lg text-slate-600 dark:text-slate-300">
            Estimate the time and budget your team reclaims when the source of truth lives in Cairn —
            not in everyone&apos;s heads.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 lg:grid-cols-[1fr_1fr]">
            {/* Inputs */}
            <div className="card p-7">
              <div className="space-y-6">
                <Slider label="Team members" value={team} min={1} max={50} onChange={setTeam} />
                <Slider
                  label="Hours/week each spends reconciling status"
                  value={hours}
                  min={0}
                  max={20}
                  suffix=" hrs"
                  onChange={setHours}
                />
                <label className="block">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                    Average loaded hourly cost
                  </span>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-slate-400">$</span>
                    <input
                      type="number"
                      min={0}
                      value={rate}
                      onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
                      className="input-field"
                    />
                  </div>
                </label>
                <Slider
                  label="AI projects in flight"
                  value={projects}
                  min={1}
                  max={30}
                  onChange={setProjects}
                />
              </div>
            </div>

            {/* Output */}
            <div className="card flex flex-col justify-between border-signal-500/40 bg-signal-500/[0.04] p-7 dark:border-signal-500/40">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                  Estimated annual value reclaimed
                </p>
                <p className="mt-1 font-display text-[3.25rem] font-bold leading-none text-signal-700 dark:text-signal-300">
                  {usd(animatedValue)}
                </p>

                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
                    <span className="text-slate-600 dark:text-slate-300">Hours reclaimed / year</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {Math.round(animatedHours).toLocaleString()} hrs
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
                    <span className="text-slate-600 dark:text-slate-300">Projects kept on track</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{projects}</span>
                  </div>

                  {/* Before / after bar viz */}
                  <div className="pt-2">
                    <p className="mb-2 text-slate-600 dark:text-slate-300">
                      Weekly hours on coordination
                    </p>
                    <div className="space-y-2">
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>Today</span>
                          <span>{weeklyCoordHours} hrs</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-white/10">
                          <div className="h-3 rounded-full bg-error/70" style={{ width: '100%' }} />
                        </div>
                      </div>
                      <div>
                        <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
                          <span>With Cairn</span>
                          <span>{afterWeekly} hrs</span>
                        </div>
                        <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-white/10">
                          <div
                            className="h-3 rounded-full bg-signal-500 transition-all duration-500"
                            style={{ width: `${afterPct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <a href="#start" className="btn-primary mt-7 w-full">
                Get your custom ROI report
              </a>
            </div>
          </div>
        </Reveal>

        <p className="mt-6 text-center text-xs italic text-slate-400">
          Estimate only, based on a 60% reduction in status-reconciliation time. Your results will vary.
        </p>
      </div>
    </section>
  )
}
