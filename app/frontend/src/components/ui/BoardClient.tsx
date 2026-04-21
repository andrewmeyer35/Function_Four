'use client'
import { useState } from 'react'
import { F_CATEGORIES } from '@shared/types'
import { F_THEME } from '@/lib/design'

type MemberEntry = {
  member: { id: string; name: string | null; email: string }
  catScores: Record<string, number>
  overallPct: number
  goalsHit: number
  totalGoals: number
  avgIntensity: number | null
  totalDistance: number | null
  isCurrentUser: boolean
}

type Props = {
  memberData: MemberEntry[]
  weekStart: string
  inviteCode: string
}

function displayName(m: MemberEntry['member']): string {
  return m.name ?? m.email.split('@')[0]
}

function initial(m: MemberEntry['member']): string {
  return (displayName(m)[0] ?? '?').toUpperCase()
}

export function BoardClient({ memberData, weekStart, inviteCode }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  if (memberData.length === 0) {
    return (
      <div className="surface-card rounded-2xl p-8 text-center">
        <p className="text-4xl mb-3">🏠</p>
        <p className="text-sm font-semibold text-gray-700">No members yet</p>
        <p className="text-xs text-gray-400 mt-1">
          Invite people with code{' '}
          <span className="font-mono text-gray-600">{inviteCode}</span>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">

      {/* Week label */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          This week
        </p>
        {memberData.length === 1 && (
          <span className="text-[11px] text-gray-400">
            Invite code: <span className="font-mono text-gray-600">{inviteCode}</span>
          </span>
        )}
      </div>

      {/* Member cards */}
      {memberData.map((entry, rank) => {
        const name = displayName(entry.member)
        const ini = initial(entry.member)
        const isOpen = expanded === entry.member.id

        return (
          <div
            key={entry.member.id}
            className={`surface-card rounded-2xl overflow-hidden transition-all ${
              entry.isCurrentUser ? 'ring-2 ring-indigo-200' : ''
            }`}
          >
            {/* Main row */}
            <button
              className="w-full px-4 py-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(isOpen ? null : entry.member.id)}
            >
              {/* Rank */}
              <div className="w-5 flex-shrink-0 text-center">
                <span className="text-sm font-bold text-gray-400 tabular-nums">
                  {rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : `${rank + 1}`}
                </span>
              </div>

              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                  entry.isCurrentUser ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {ini}
              </div>

              {/* Name + sub */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
                  {entry.isCurrentUser && (
                    <span className="text-[10px] font-semibold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      you
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {entry.goalsHit}/{entry.totalGoals} goals hit
                  {entry.avgIntensity != null ? ` · L${entry.avgIntensity} avg intensity` : ''}
                  {entry.totalDistance != null ? ` · ${entry.totalDistance}km` : ''}
                </p>
              </div>

              {/* Overall % */}
              <div className="flex-shrink-0 text-right">
                <p className="text-lg font-bold text-gray-900 tabular-nums">{entry.overallPct}%</p>
                <p className="text-[10px] text-gray-400">overall</p>
              </div>

              {/* Chevron */}
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className={`text-gray-300 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              >
                <polyline points="2 4 6 8 10 4" />
              </svg>
            </button>

            {/* Progress bar row */}
            <div className="px-4 pb-3">
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-400 transition-all duration-500"
                  style={{ width: `${entry.overallPct}%` }}
                />
              </div>
            </div>

            {/* Expanded: per-category breakdown */}
            {isOpen && (
              <div className="border-t border-gray-100 px-4 py-4 grid grid-cols-2 gap-3">
                {F_CATEGORIES.map((f) => {
                  const score = entry.catScores[f.key] ?? 0
                  const theme = F_THEME[f.key]
                  return (
                    <div key={f.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{f.emoji}</span>
                          <span className="text-[11px] font-semibold text-gray-600">{f.label}</span>
                        </div>
                        <span className="text-xs font-bold tabular-nums text-gray-800">{score}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${score}%`,
                            background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Invite row (multi-member households) */}
      {memberData.length >= 1 && (
        <div className="surface-card rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-gray-700">Invite others</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Code: <span className="font-mono text-gray-600">{inviteCode}</span>
            </p>
          </div>
          <button
            onClick={() => navigator.clipboard?.writeText(inviteCode)}
            className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  )
}
