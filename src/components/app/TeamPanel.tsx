import { useCallback, useEffect, useState } from 'react'
import {
  ClipboardDocumentIcon,
  PaperAirplaneIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import type { TeamInvite, TeamMember, TeamRole } from '../../lib/types'
import { INVITABLE_ROLES, ROLE_BLURB, canAdmin } from '../../lib/types'
import { refreshTeams, uid, useTeamState } from '../../lib/store'
import {
  createInvite,
  fetchInvites,
  fetchMembers,
  inviteLink,
  removeMember,
  revokeInvite,
  setMemberRole,
} from '../../lib/teams'
import { useModal } from '../../hooks/useModal'

const FIELD =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-signal-500 dark:border-white/15 dark:bg-white/5 dark:text-white'

const LABEL = 'text-[11px] font-semibold uppercase tracking-wider text-slate-400'

const ROLE_STYLE: Record<TeamRole, string> = {
  owner: 'bg-signal-500/10 text-signal-700 dark:text-signal-300',
  admin: 'bg-warning-100 text-warning-700 dark:bg-warning-500/15 dark:text-warning-300',
  member: 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300',
  viewer: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400',
}

interface Props {
  currentUserId: string
  onClose: () => void
}

/**
 * The roster for the active team. Every control here is mirrored by an RLS
 * policy — hiding a button is a courtesy, not the security boundary.
 */
export function TeamPanel({ currentUserId, onClose }: Props) {
  const ref = useModal<HTMLDivElement>(onClose)
  const { teams, currentTeamId, role } = useTeamState()
  const team = teams.find((t) => t.id === currentTeamId) ?? null

  const [members, setMembers] = useState<TeamMember[]>([])
  const [invites, setInvites] = useState<TeamInvite[]>([])
  const [email, setEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<TeamRole>('member')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const admin = canAdmin(role)

  const load = useCallback(async () => {
    if (!currentTeamId) return
    try {
      const [m, i] = await Promise.all([
        fetchMembers(currentTeamId),
        admin ? fetchInvites(currentTeamId) : Promise.resolve([]),
      ])
      setMembers(m)
      setInvites(i)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load the team')
    }
  }, [currentTeamId, admin])

  useEffect(() => {
    void load()
  }, [load])

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await fn()
      await load()
      await refreshTeams()
    } catch (e) {
      // Surfaces database rules verbatim, e.g. "A team must keep at least one owner".
      setError(e instanceof Error ? e.message : 'That did not work')
    } finally {
      setBusy(false)
    }
  }

  const invite = () => {
    const address = email.trim().toLowerCase()
    if (!address || !currentTeamId) return
    void run(async () => {
      await createInvite(uid('iv'), currentTeamId, address, inviteRole, currentUserId)
      setEmail('')
    })
  }

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(inviteLink(token))
      setCopied(token)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setError('Could not copy — select the link manually')
    }
  }

  return (
    <div className="fixed inset-0 z-[55] grid place-items-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-panel-title"
        className="card relative flex max-h-[85vh] w-full max-w-xl flex-col"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-white/10">
          <div>
            <h2 id="team-panel-title" className="font-display text-h5 font-bold text-slate-900 dark:text-white">
              {team?.name ?? 'Team'}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {members.length} {members.length === 1 ? 'member' : 'members'}
              {role && ` · you are ${role === 'owner' || role === 'admin' ? 'an' : 'a'} ${role}`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Only this middle section scrolls, so the title and both close
            actions stay reachable however long the roster gets. */}
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {error && (
          <p className="mt-3 rounded-lg bg-error-100 px-3 py-2 text-xs text-error-700 dark:bg-error-500/15 dark:text-error-300">
            {error}
          </p>
        )}

        {/* Roster */}
        <ul className="space-y-1.5">
          {members.map((m) => {
            const isSelf = m.userId === currentUserId
            return (
              <li
                key={m.userId}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2 dark:border-white/10"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {m.fullName || m.email || 'Teammate'}
                    {isSelf && <span className="text-slate-400"> (you)</span>}
                  </p>
                  {m.email && m.fullName && (
                    <p className="truncate text-xs text-slate-400">{m.email}</p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {admin && !isSelf ? (
                    <select
                      value={m.role}
                      disabled={busy}
                      onChange={(e) =>
                        void run(() =>
                          setMemberRole(m.teamId, m.userId, e.target.value as TeamRole),
                        )
                      }
                      aria-label={`Role for ${m.email ?? 'teammate'}`}
                      className="cursor-pointer rounded-md border border-slate-300 bg-white px-1.5 py-1 text-[11px] font-semibold dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
                    >
                      <option value="owner">owner</option>
                      <option value="admin">admin</option>
                      <option value="member">member</option>
                      <option value="viewer">viewer</option>
                    </select>
                  ) : (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${ROLE_STYLE[m.role]}`}
                    >
                      {m.role}
                    </span>
                  )}
                  {admin && !isSelf && (
                    <button
                      onClick={() => void run(() => removeMember(m.teamId, m.userId))}
                      disabled={busy}
                      aria-label={`Remove ${m.email ?? 'teammate'}`}
                      className="grid h-6 w-6 place-items-center rounded text-slate-400 hover:text-error-500"
                    >
                      <TrashIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {admin ? (
          <>
            <div className="mt-6">
              <span className={LABEL}>Invite someone</span>
              <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') invite()
                  }}
                  placeholder="teammate@company.com"
                  aria-label="Invite email"
                  className={`${FIELD} flex-1`}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as TeamRole)}
                  aria-label="Invite role"
                  className={`${FIELD} sm:w-32 cursor-pointer`}
                >
                  {INVITABLE_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  onClick={invite}
                  disabled={busy || !email.trim()}
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-40"
                >
                  <PaperAirplaneIcon className="h-4 w-4" />
                  Invite
                </button>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-400">{ROLE_BLURB[inviteRole]}</p>
            </div>

            {invites.length > 0 && (
              <div className="mt-5">
                <span className={LABEL}>Pending invites</span>
                <ul className="mt-1.5 space-y-1.5">
                  {invites.map((i) => (
                    <li
                      key={i.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-slate-300 px-3 py-2 dark:border-white/15"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-700 dark:text-slate-200">
                          {i.email}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {i.role} · expires {new Date(i.expiresAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => void copy(i.token)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/10"
                        >
                          <ClipboardDocumentIcon className="h-3.5 w-3.5" />
                          {copied === i.token ? 'Copied' : 'Copy link'}
                        </button>
                        <button
                          onClick={() => void run(() => revokeInvite(i.id))}
                          disabled={busy}
                          aria-label={`Revoke invite for ${i.email}`}
                          className="grid h-6 w-6 place-items-center rounded text-slate-400 hover:text-error-500"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-[11px] text-slate-400">
                  Send the link yourself — invite emails aren&apos;t wired up yet. It only works for
                  the address it was issued to.
                </p>
              </div>
            )}
          </>
        ) : (
            <p className="mt-5 text-xs text-slate-400">
              Ask an owner or admin to invite people or change roles.
            </p>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4 dark:border-white/10">
          <button onClick={onClose} className="btn-ghost px-4 py-2 text-sm">
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
