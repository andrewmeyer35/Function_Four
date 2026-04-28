'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { F_CATEGORIES } from '@shared/types'
import { F_THEME } from '@/lib/design'
import { GOAL_OPTIONS, type UserGoal, type GoalOption } from '@/lib/goals'

type LocalGoal = {
  metric_key: string
  target: number
  is_active: boolean
}

type GoalSaveStatus =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string }

function buildInitialState(initialGoals: UserGoal[]): Record<string, LocalGoal> {
  const map: Record<string, LocalGoal> = {}
  for (const opt of GOAL_OPTIONS) {
    map[opt.key] = { metric_key: opt.key, target: opt.defaultTarget, is_active: false }
  }
  for (const g of initialGoals) {
    map[g.metric_key] = { metric_key: g.metric_key, target: g.target, is_active: g.is_active }
  }
  return map
}

export function GoalSetter({ initialGoals }: { initialGoals: UserGoal[] }) {
  const router = useRouter()
  const [goals, setGoals] = useState<Record<string, LocalGoal>>(() =>
    buildInitialState(initialGoals)
  )
  const [goalStatus, setGoalStatus] = useState<Record<string, GoalSaveStatus>>({})

  // Keep a ref to latest goals so timer callbacks read fresh state
  const goalsRef = useRef(goals)
  useEffect(() => { goalsRef.current = goals }, [goals])

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const statusTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
      Object.values(saveTimers.current).forEach(clearTimeout)
      Object.values(statusTimers.current).forEach(clearTimeout)
    }
  }, [])

  const saveGoal = useCallback(async (key: string, goal: LocalGoal) => {
    if (!mountedRef.current) return
    setGoalStatus((prev) => ({ ...prev, [key]: { kind: 'saving' } }))
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }
      if (!mountedRef.current) return
      setGoalStatus((prev) => ({ ...prev, [key]: { kind: 'saved' } }))
      router.refresh()
      if (statusTimers.current[key]) clearTimeout(statusTimers.current[key])
      statusTimers.current[key] = setTimeout(() => {
        if (mountedRef.current) setGoalStatus((prev) => ({ ...prev, [key]: { kind: 'idle' } }))
      }, 2000)
    } catch (err) {
      if (!mountedRef.current) return
      setGoalStatus((prev) => ({
        ...prev,
        [key]: { kind: 'error', message: err instanceof Error ? err.message : String(err) },
      }))
      // Auto-clear error badge after 5 s
      if (statusTimers.current[key]) clearTimeout(statusTimers.current[key])
      statusTimers.current[key] = setTimeout(() => {
        if (mountedRef.current) setGoalStatus((prev) => ({ ...prev, [key]: { kind: 'idle' } }))
      }, 5000)
    }
  }, [router])

  function scheduleSave(key: string) {
    if (saveTimers.current[key]) clearTimeout(saveTimers.current[key])
    if (statusTimers.current[key]) clearTimeout(statusTimers.current[key])
    saveTimers.current[key] = setTimeout(() => {
      void saveGoal(key, goalsRef.current[key])
    }, 600)
  }

  function toggle(key: string) {
    setGoals((prev) => ({
      ...prev,
      [key]: { ...prev[key], is_active: !prev[key].is_active },
    }))
    scheduleSave(key)
  }

  function setTarget(key: string, value: number) {
    const opt = GOAL_OPTIONS.find((g) => g.key === key)
    if (!opt) return
    const clamped = Math.max(1, Math.min(opt.maxTarget, value))
    setGoals((prev) => ({ ...prev, [key]: { ...prev[key], target: clamped } }))
    scheduleSave(key)
  }

  const activeCount = Object.values(goals).filter((g) => g.is_active).length

  return (
    <div className="space-y-5 pb-4">
      <p className="text-xs text-gray-400 px-1">
        <span className="font-semibold text-gray-700">{activeCount}</span> active goal{activeCount !== 1 ? 's' : ''}
        {' · '}changes save automatically
      </p>

      {F_CATEGORIES.map((f) => {
        const theme = F_THEME[f.key]
        const opts = GOAL_OPTIONS.filter((o) => o.category === f.key)
        return (
          <div key={f.key} className="surface-card rounded-2xl overflow-hidden">
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ background: `linear-gradient(135deg, ${theme.from}18, ${theme.to}10)` }}
            >
              <span className="text-xl">{f.emoji}</span>
              <div>
                <p className="text-sm font-bold text-gray-900">{f.label}</p>
                <p className="text-[11px] text-gray-500">{f.prompt}</p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {opts.map((opt) => {
                const g = goals[opt.key]
                const status = goalStatus[opt.key] ?? { kind: 'idle' }
                return (
                  <GoalRow
                    key={opt.key}
                    opt={opt}
                    goal={g}
                    themeColor={theme.from}
                    status={status}
                    onToggle={() => toggle(opt.key)}
                    onSetTarget={(val) => setTarget(opt.key, val)}
                  />
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function GoalRow({
  opt,
  goal,
  themeColor,
  status,
  onToggle,
  onSetTarget,
}: {
  opt: GoalOption
  goal: LocalGoal
  themeColor: string
  status: GoalSaveStatus
  onToggle: () => void
  onSetTarget: (val: number) => void
}) {
  return (
    <div className="px-4 py-3 flex items-center gap-3 transition-colors">
      {/* Toggle — always full opacity */}
      <button
        onClick={onToggle}
        className="flex-shrink-0 w-10 h-6 rounded-full relative transition-colors duration-200 tap-scale"
        style={{ background: goal.is_active ? themeColor : '#e5e7eb' }}
        aria-label={goal.is_active ? 'Disable goal' : 'Enable goal'}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
          style={{ transform: goal.is_active ? 'translateX(16px)' : 'translateX(0)' }}
        />
      </button>

      {/* Label — always full opacity so inactive goals remain readable */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-gray-900 truncate">
            {opt.emoji} {opt.label}
          </p>
          {status.kind === 'saving' && (
            <span className="flex-shrink-0 w-3 h-3 rounded-full border-2 border-gray-300 border-t-transparent animate-spin" />
          )}
          {status.kind === 'saved' && (
            <span className="flex-shrink-0 text-[11px] font-bold" style={{ color: themeColor }}>✓</span>
          )}
          {status.kind === 'error' && (
            <span className="flex-shrink-0 text-[11px] text-red-500" title={status.message}>!</span>
          )}
        </div>
        <p className={`text-[11px] mt-0.5 transition-colors ${goal.is_active ? 'text-gray-400' : 'text-gray-300'}`}>
          {goal.target} {opt.unit} / week
        </p>
      </div>

      {/* Range slider — dimmed + locked when inactive */}
      <div
        className={`flex items-center gap-2 flex-shrink-0 w-28 transition-opacity ${
          goal.is_active ? 'opacity-100' : 'opacity-30 pointer-events-none'
        }`}
      >
        <input
          type="range"
          min={1}
          max={opt.maxTarget}
          value={goal.target}
          onChange={(e) => onSetTarget(Number(e.target.value))}
          className="flex-1 cursor-pointer"
          style={{ accentColor: themeColor }}
          aria-label={`${opt.label} weekly target`}
        />
        <span className="text-sm font-bold text-gray-900 tabular-nums w-4 text-right">
          {goal.target}
        </span>
      </div>
    </div>
  )
}