// Flat household leaderboard list — replaces the old 3-column podium.
// Matches the screenshot's numbered-row design with avatar, name/email, score, and streak.
import type { LeaderboardEntry } from '@/lib/scoring'

export function Podium({
  entries,
  currentUserId,
  inviteCode,
}: {
  entries: LeaderboardEntry[]
  currentUserId: string
  inviteCode: string
}) {
  if (entries.length === 0) return null

  return (
    <div className="space-y-1">
      {entries.map((entry, idx) => {
        const isMe = entry.userId === currentUserId
        const rank = idx + 1
        const initial = (entry.name?.[0] ?? entry.email?.[0] ?? '?').toUpperCase()
        return (
          <div
            key={entry.userId}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              isMe ? 'bg-gray-50 ring-1 ring-gray-200' : 'hover:bg-gray-50'
            }`}
          >
            {/* Rank */}
            <span className="w-5 text-center text-xs text-gray-400 font-medium tabular-nums flex-shrink-0">
              {rank}
            </span>

            {/* Avatar */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
                isMe ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {initial}
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate leading-tight">
                {entry.name ?? entry.email.split('@')[0]}
              </p>
              <p className="text-[11px] text-gray-400 truncate leading-tight">{entry.email}</p>
            </div>

            {/* Score + streak */}
            <div className="flex flex-col items-end flex-shrink-0">
              <span className="text-base font-bold text-gray-900 tabular-nums leading-tight">
                {entry.thisWeekScore}
              </span>
              {entry.streak >= 1 && (
                <span className="text-[11px] text-orange-500 font-medium leading-tight">
                  🔥 {entry.streak} streak
                </span>
              )}
            </div>
          </div>
        )
      })}

      {/* Invite row */}
      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-gray-200 mt-2">
        <div className="w-5 flex-shrink-0 text-center text-gray-300 text-sm">+</div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">Invite roommates to start a real race</p>
        </div>
        <div className="flex-shrink-0">
          <span className="text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">
            {inviteCode}
          </span>
        </div>
      </div>
    </div>
  )
}
