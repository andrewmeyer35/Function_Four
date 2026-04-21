// Per-category weekly breakdown for the Home page, driven by daily_logs + user_goals.
import { F_CATEGORIES } from '@shared/types'
import { F_THEME } from '@/lib/design'
import type { UserGoal, DailyLog } from '@/lib/goals'
import { categoryScore, weeklyCount } from '@/lib/goals'

type Props = {
  goals: UserGoal[]
  logs: DailyLog[]
  userName: string
}

export function HomeBreakdown({ goals, logs, userName }: Props) {
  if (goals.length === 0) {
    return (
      <div className="surface-card rounded-2xl px-4 py-8 text-center">
        <p className="text-3xl mb-2">🎯</p>
        <p className="text-sm font-semibold text-gray-800">No goals set yet</p>
        <p className="text-sm text-gray-500 mt-1 mb-4">
          Set your weekly targets to start tracking progress.
        </p>
        <a
          href="/goals"
          className="inline-block px-4 py-2 bg-gray-900 text-white text-xs rounded-xl font-semibold"
        >
          Set goals →
        </a>
      </div>
    )
  }

  // Overall
  const totalPossible = goals.reduce((s, g) => s + g.target, 0)
  const totalDone = goals.reduce((s, g) => {
    const count = logs.filter((l) => l[g.metric_key as keyof DailyLog] === true).length
    return s + Math.min(count, g.target)
  }, 0)
  const overallPct = totalPossible >= 1 ? Math.round((totalDone / totalPossible) * 100) : 0

  const activeCategories = F_CATEGORIES.filter((f) =>
    goals.some((g) => g.category === f.key)
  )

  return (
    <div className="surface-card rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-sm font-bold text-gray-900">{userName}'s week</p>
          <span className="text-lg font-bold text-gray-900 tabular-nums">{overallPct}%</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-400 transition-all duration-700"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      {/* Segmented bar */}
      <div className="flex gap-0.5 px-4 pb-3">
        {activeCategories.map((f) => {
          const score = categoryScore(f.key, goals, logs)
          const theme = F_THEME[f.key]
          return (
            <div
              key={f.key}
              className="h-2 rounded-full transition-all duration-700 flex-1"
              style={{
                opacity: score >= 1 ? 1 : 0.15,
                background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`,
              }}
            />
          )
        })}
      </div>

      <div className="h-px bg-gray-100" />

      {/* Per-category rows */}
      <div className="divide-y divide-gray-100">
        {activeCategories.map((f) => {
          const score = categoryScore(f.key, goals, logs)
          const catGoals = goals.filter((g) => g.category === f.key)
          const goalsHit = catGoals.filter((g) => {
            const count = weeklyCount(g.metric_key, logs)
            return count >= g.target
          }).length
          const theme = F_THEME[f.key]

          return (
            <div key={f.key} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-gray-800">
                  {f.emoji} {f.label}
                </span>
                <span className="text-sm font-bold tabular-nums" style={{ color: theme.from }}>
                  {score}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${score}%`,
                      background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`,
                    }}
                  />
                </div>
                <span className="text-[11px] text-gray-400 flex-shrink-0 tabular-nums">
                  {goalsHit}/{catGoals.length} goals
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer link */}
      <div className="px-4 py-3 border-t border-gray-100">
        <a href="/log" className="text-xs text-indigo-500 font-medium hover:text-indigo-700">
          Log today →
        </a>
      </div>
    </div>
  )
}
