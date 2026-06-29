import { useState } from 'react'
import { can, SEED_INTEGRATIONS, type AdminRoleKey, type IntegrationStatus } from '../../lib/admin'

const statusDot: Record<IntegrationStatus, string> = {
  connected: 'bg-success',
  available: 'bg-slate-300 dark:bg-white/20',
  error: 'bg-error',
}
const statusLabel: Record<IntegrationStatus, string> = {
  connected: 'Connected',
  available: 'Available',
  error: 'Action needed',
}

function Toggle({ label, on, onToggle, disabled }: { label: string; on: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
      <button
        onClick={onToggle}
        disabled={disabled}
        role="switch"
        aria-checked={on}
        aria-label={label}
        className={`relative h-6 w-11 rounded-full transition disabled:opacity-40 ${on ? 'bg-signal-600' : 'bg-slate-300 dark:bg-white/20'}`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </button>
    </div>
  )
}

export function SystemConfig({ role }: { role: AdminRoleKey }) {
  const canManage = can(role, 'manage:integrations') || can(role, 'manage:settings')
  const [settings, setSettings] = useState({
    transactionalEmail: true,
    trialReminders: true,
    overageAlerts: true,
    enterpriseWhiteLabel: false,
  })

  const toggle = (k: keyof typeof settings) => canManage && setSettings((s) => ({ ...s, [k]: !s[k] }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-h3 font-bold text-slate-900 dark:text-white">System configuration</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Integrations, notifications, and branding.</p>
      </div>

      {/* Integrations */}
      <div className="card p-6">
        <h2 className="font-display text-h5 font-semibold text-slate-900 dark:text-white">Integrations</h2>
        <p className="text-xs text-slate-400">Provider & tool connectors (via MCP where available)</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SEED_INTEGRATIONS.map((i) => (
            <div key={i.name} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 dark:border-white/10">
              <div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{i.name}</p>
                <p className="text-xs text-slate-400">{i.category}</p>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span className={`h-2 w-2 rounded-full ${statusDot[i.status]}`} />
                {statusLabel[i.status]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-h5 font-semibold text-slate-900 dark:text-white">Email & notifications</h2>
          <div className="mt-2 divide-y divide-slate-100 dark:divide-white/5">
            <Toggle label="Transactional email (magic links, invites)" on={settings.transactionalEmail} onToggle={() => toggle('transactionalEmail')} disabled={!canManage} />
            <Toggle label="Trial-ending reminders" on={settings.trialReminders} onToggle={() => toggle('trialReminders')} disabled={!canManage} />
            <Toggle label="Usage overage alerts" on={settings.overageAlerts} onToggle={() => toggle('overageAlerts')} disabled={!canManage} />
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-display text-h5 font-semibold text-slate-900 dark:text-white">Localization & branding</h2>
          <div className="mt-4 space-y-3 text-sm">
            <label className="block">
              <span className="text-slate-500 dark:text-slate-400">Default locale</span>
              <select disabled={!canManage} className="input-field mt-1 disabled:opacity-50">
                <option>English (US)</option>
                <option>English (UK)</option>
                <option>Español</option>
                <option>Français</option>
              </select>
            </label>
            <label className="block">
              <span className="text-slate-500 dark:text-slate-400">Default currency</span>
              <select disabled={!canManage} className="input-field mt-1 disabled:opacity-50">
                <option>USD ($)</option>
                <option>EUR (€)</option>
                <option>GBP (£)</option>
              </select>
            </label>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              <Toggle label="Enterprise white-label / custom domain" on={settings.enterpriseWhiteLabel} onToggle={() => toggle('enterpriseWhiteLabel')} disabled={!canManage} />
            </div>
          </div>
        </div>
      </div>

      {!canManage && <p className="text-sm text-slate-400">Your role can view but not change system settings.</p>}
    </div>
  )
}
