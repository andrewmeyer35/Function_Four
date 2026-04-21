'use client'
import { useState } from 'react'
import { format } from 'date-fns'
import {
  getWeekDays,
  DAY_LABELS,
  weeklyCount,
  GOAL_BY_KEY,
  type UserGoal,
  type DailyLog,
} from '@/lib/goals'
import { F_CATEGORIES } from '@shared/types'
import { F_THEME } from '@/lib/design'

type Props = {
  weekStart: string
  goals: UserGoal[]
  initialLogs: DailyLog[]
}

// Which date is currently showing the workout detail panel
type WorkoutDetailKey = string | null // 'YYYY-MM-DD'

async function postLog(log_date: string, metric_key: string, value: unknown) {
  await fetch('/api/daily-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ log_date, metric_key, value }),
  })
}

export function WeeklyTracker({ weekStart, goals, initialLogs }: Props) {
  const [logs, setLogs] = useState<Record<string, DailyLog>>(() => {
    const map: Record<string, DailyLog> = {}
    for (const l of initialLogs) map[l.log_date] = l
    return map
  })
  const [pending, setPending] = useState<Record<string, boolean>>({})
  const [workoutDetail, setWorkoutDetail] = useState<WorkoutDetailKey>(null)

  const days = getWeekDays(weekStart)
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  async function toggle(metricKey: string, date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd')
    const key = `${metricKey}:${dateStr}`

    const currentVal = logs[dateStr]?.[metricKey as keyof DailyLog] === true
    const nextVal = !currentVal

    setLogs((prev) => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] ?? { log_date: dateStr, week_start: weekStart }),
        [metricKey]: nextVal,
      } as DailyLog,
    }))
    setPending((p) => ({ ...p, [key]: true }))

    // When worked_out is toggled on, open detail panel for today
    if (metricKey === 'worked_out' && nextVal) {
      setWorkoutDetail(dateStr)
    } else if (metricKey === 'worked_out' && !nextVal) {
      setWorkoutDetail(null)
    }

    try {
      await postLog(dateStr, metricKey, nextVal)
    } catch {
      setLogs((prev) => ({
        ...prev,
        [dateStr]: {
          ...(prev[dateStr] ?? { log_date: dateStr, week_start: weekStart }),
          [metricKey]: currentVal,
        } as DailyLog,
      }))
    } finally {
      setPending((p) => {
        const next = { ...p }
        delete next[key]
        return next
      })
    }
  }

  async function saveWorkoutDetail(dateStr: string, intensity: number | null, distance: string) {
    const distNum = distance.trim() === '' ? null : parseFloat(distance)
    setLogs((prev) => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] ?? { log_date: dateStr, week_start: weekStart }),
        workout_intensity: intensity,
        workout_distance: isNaN(distNum as number) ? null : distNum,
      } as DailyLog,
    }))
    setWorkoutDetail(null)
    if (intensity !== null) await postLog(dateStr, 'workout_intensity', intensity)
    if (distNum !== null && !isNaN(distNum)) await postLog(dateStr, 'workout_distance', distNum)
  }

  const byCategory = F_CATEGORIES.map((f) => ({
    f,
    goals: goals.filter((g) => g.category === f.key),
  })).filter((c) => c.goals.length >= 1)

  const allLogs = Object.values(logs)
  const totalDone = goals.reduce((s, g) => s + weeklyCount(g.metric_key, allLogs), 0)
  const totalPossible = goals.reduce((s, g) => s + g.target, 0)
  const overallPct = totalPossible >= 1 ? Math.round((totalDone / totalPossible) * 100) : 0

  const todayDayIndex = days.findIndex((d) => format(d, 'yyyy-MM-dd') === todayStr)
  const effectiveTodayIndex = todayDayIndex === -1 ? 6 : todayDayIndex

  return (
    <div className="space-y-4">

      {/* Weekly progress summary */}
      <div className="surface-card rounded-2xl px-4 py-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-bold text-gray-900">Weekly progress</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {format(days[0], 'MMM d')} - {format(days[6], 'MMM d')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{overallPct}%</p>
            <p className="text-[11px] text-gray-400">{totalDone}/{totalPossible} done</p>
          </div>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-400 transition-all duration-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>

        {/* Day column labels */}
        <div className="grid grid-cols-7 gap-1 mt-3">
          {days.map((d, i) => {
            const isToday = format(d, 'yyyy-MM-dd') === todayStr
            return (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className={`text-[9px] font-semibold uppercase ${isToday ? 'text-indigo-500' : 'text-gray-400'}`}>
                  {DAY_LABELS[i]}
                </span>
                <span className={`text-[10px] tabular-nums ${isToday ? 'text-indigo-500 font-bold' : 'text-gray-400'}`}>
                  {format(d, 'd')}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Per-category goal rows */}
      {byCategory.map(({ f, goals: catGoals }) => {
        const theme = F_THEME[f.key]
        return (
          <div key={f.key} className="surface-card rounded-2xl overflow-hidden">
            <div
              className="px-4 py-2.5 flex items-center gap-2 border-b border-gray-100"
              style={{ background: `linear-gradient(135deg, ${theme.from}15, ${theme.to}08)` }}
            >
              <span className="text-base">{f.emoji}</span>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.from }}>
                {f.label}
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {catGoals.map((goal) => {
                const opt = GOAL_BY_KEY[goal.metric_key]
                const count = weeklyCount(goal.metric_key, allLogs)
                const isHit = count >= goal.target

                return (
                  <div key={goal.metric_key} className="px-3 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-800">
                        {opt?.emoji} {goal.label}
                      </p>
                      <span
                        className={`text-xs font-bold tabular-nums px-2 py-0.5 rounded-full ${
                          isHit
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {count}/{goal.target}
                        {isHit ? ' ✓' : ''}
                      </span>
                    </div>

                    {/* 7-day checkbox grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {days.map((d, i) => {
                        const dateStr = format(d, 'yyyy-MM-dd')
                        const checked = logs[dateStr]?.[goal.metric_key as keyof DailyLog] === true
                        const isFuture = i >= effectiveTodayIndex + 1
                        const isToday = i === effectiveTodayIndex
                        const loadKey = `${goal.metric_key}:${dateStr}`
                        const isLoading = !!pending[loadKey]

                        return (
                          <button
                            key={i}
                            onClick={() => !isFuture && toggle(goal.metric_key, d)}
                            disabled={isFuture || isLoading}
                            className={`
                              h-9 rounded-lg flex items-center justify-center transition-all tap-scale
                              ${isFuture ? 'opacity-25 cursor-default' : 'cursor-pointer'}
                              ${isToday && !checked ? 'ring-2 ring-offset-1' : ''}
                              ${checked
                                ? 'text-white shadow-sm'
                                : 'bg-gray-100 text-gray-300 hover:bg-gray-200'}
                            `}
                            style={
                              checked
                                ? { background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }
                                : isToday
                                ? { ringColor: theme.from }
                                : undefined
                            }
                            aria-label={`${format(d, 'EEE MMM d')}: ${checked ? 'done' : 'not done'}`}
                          >
                            {isLoading ? (
                              <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            ) : checked ? (
                              <CheckIcon />
                            ) : (
                              <span className="w-2 h-2 rounded-full bg-current opacity-30" />
                            )}
                          </button>
                        )
                      })}
                    </div>

                    {/* Workout detail panel — shown per checked day when worked_out */}
                    {goal.metric_key === 'worked_out' && (
                      <div className="mt-2 space-y-1">
                        {days.map((d, i) => {
                          const dateStr = format(d, 'yyyy-MM-dd')
                          const checked = logs[dateStr]?.worked_out === true
                          const isOpen = workoutDetail === dateStr
                          if (!checked) return null

                          const savedIntensity = logs[dateStr]?.workout_intensity ?? null
                          const savedDistance = logs[dateStr]?.workout_distance ?? null

                          return (
                            <WorkoutDetail
                              key={dateStr}
                              dateStr={dateStr}
                              dayLabel={DAY_LABELS[i]}
                              isOpen={isOpen}
                              savedIntensity={savedIntensity}
                              savedDistance={savedDistance}
                              theme={theme}
                              onOpen={() => setWorkoutDetail(isOpen ? null : dateStr)}
                              onSave={saveWorkoutDetail}
                            />
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Motivational footer */}
      <div className="text-center py-2">
        {overallPct >= 100 ? (
          <p className="text-sm font-semibold text-emerald-600">Perfect week so far. Keep going!</p>
        ) : overallPct >= 50 ? (
          <p className="text-sm text-gray-500">Over halfway there. Finish strong.</p>
        ) : (
          <p className="text-sm text-gray-400">Each check is a step forward.</p>
        )}
        <a href="/goals" className="text-xs text-indigo-400 mt-1 inline-block hover:text-indigo-600">
          Edit goals
        </a>
      </div>
    </div>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="2 7 6 11 12 3" />
    </svg>
  )
}

type WorkoutDetailProps = {
  dateStr: string
  dayLabel: string
  isOpen: boolean
  savedIntensity: number | null | undefined
  savedDistance: number | null | undefined
  theme: { from: string; to: string }
  onOpen: () => void
  onSave: (dateStr: string, intensity: number | null, distance: string) => void
}

function WorkoutDetail({
  dateStr, dayLabel, isOpen, savedIntensity, savedDistance, theme, onOpen, onSave,
}: WorkoutDetailProps) {
  const [intensity, setIntensity] = useState<number | null>(savedIntensity ?? null)
  const [distance, setDistance] = useState<string>(savedDistance != null ? String(savedDistance) : '')

  const hasSaved = savedIntensity != null || (savedDistance != null && savedDistance > 0)

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <button
        onClick={onOpen}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-medium text-gray-600">
          {dayLabel} workout details
        </span>
        <div className="flex items-center gap-2">
          {hasSaved && (
            <span className="text-[10px] text-gray-400">
              {savedIntensity != null ? `L${savedIntensity}` : ''}
              {savedIntensity != null && savedDistance != null ? ' · ' : ''}
              {savedDistance != null && savedDistance > 0 ? `${savedDistance}km` : ''}
            </span>
          )}
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="2 4 6 8 10 4" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 space-y-3 border-t border-gray-100 pt-3">
          {/* Intensity 1-7 */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Intensity
            </p>
            <div className="flex gap-1">
              {[1,2,3,4,5,6,7].map((n) => {
                const active = intensity === n
                return (
                  <button
                    key={n}
                    onClick={() => setIntensity(active ? null : n)}
                    className={`flex-1 h-8 rounded-lg text-xs font-bold transition-all ${
                      active ? 'text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    style={active ? { background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` } : undefined}
                  >
                    {n}
                  </button>
                )
              })}
            </div>
            <div className="flex justify-between mt-1 px-0.5">
              <span className="text-[9px] text-gray-400">Easy</span>
              <span className="text-[9px] text-gray-400">Max</span>
            </div>
          </div>

          {/* Distance */}
          <div>
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
              Avg distance (km)
            </p>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="e.g. 5.0"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-gray-300"
            />
          </div>

          <button
            onClick={() => onSave(dateStr, intensity, distance)}
            className="w-full h-9 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: `linear-gradient(135deg, ${theme.from}, ${theme.to})` }}
          >
            Save
          </button>
        </div>
      )}
    </div>
  )
}
