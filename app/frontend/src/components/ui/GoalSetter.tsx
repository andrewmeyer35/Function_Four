'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { F_CATEGORIES } from '@shared/types'
import { F_THEME } from '@/lib/design'
import { GOAL_OPTIONS, type UserGoal, type GoalOption } from '@/lib/goals'

type LocalGoal = {
  metric_key: string
  target: number
  is_active: boolean
}

function buildInitialState(initialGoals: UserGoal[]): Record<string, LocalGoal> {
  const map: Record<string, LocalGoal> = {}
  // Seed defaults for every option
  for (const opt of GOAL_OPTIONS) {
    map[opt.key] = { metric_key: opt.key, target: opt.defaultTarget, is_active: false }
  }
  // Overlay saved goals from DB
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
  const [saved, setSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  function toggle(key: string) {
    setGoals((prev) => ({
      ...prev,
      [key]: { ...prev[key], is_active: !prev[key].is_active },
    }))
    setSaved(false)
  }

  function setTarget(key: string, delta: number) {
    const opt = GOAL_OPTIONS.find((g) => g.key === key)!
    setGoals((prev) => {
      const current = prev[key].target
      const next = Math.max(1, Math.min(opt.maxTarget, current + delta))
      return { ...prev, [key]: { ...prev[key], target: next } }
    })
    setSaved(false)
  }

  async function saveAll() {
    setIsSaving(true)
    setSaved(false)
    setSaveError(null)
    try {
      // Send one POST per goal, capture body of any failures
      const results = await Promise.all(
        Object.values(goals).map(async (g) => {
          const res = await fetch('/api/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(g),
          })
          if (!res.ok) {
            const body = await res.json().catch(() => ({}))
            return { ok: false as const, error: body.error ?? `HTTP ${res.status}` }
          }
          return { ok: true as const }
        })
      )
      const failed = results.filter((r) => !r.ok)
      if (failed.length >= 1) {
        const msg = failed[0].ok === false ? failed[0].error : 'unknown error'
        setSaveError(`Save failed: ${msg}`)
      } else {
        setSaved(true)
        router.refresh()
      }
    } catch (err) {
      setSaveError(`Network error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsSaving(false)
    }
  }

  const activeCount = Object.values(goals).filter((g) => g.is_active).length

  return (
    <div className="space-y-5">
      {F_CATEGORIES.map((f) => {
        const theme = F_THEME[f.key]
        const opts = GOAL_OPTIONS.filter((o) => o.category === f.key)
        return (
          <div key={f.key} className="surface-card rounded-2xl overflow-hidden">
            {/* Category header */}
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

            {/* Goal rows */}
            <div className="divide-y divide-gray-100">
              {opts.map((opt) => {
                const g = goals[opt.key]
                return (
                  <GoalRow
                    key={opt.key}
                    opt={opt}
                    goal={g}
                    themeColor={theme.from}
                    onToggle={() => toggle(opt.key)}
                    onDecrement={() => setTarget(opt.key, -1)}
                    onIncrement={() => setTarget(opt.key, 1)}
                  />
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Save bar */}
      <div className="sticky bottom-20 md:bottom-4 bg-white/95 backdrop-blur rounded-2xl border border-gray-100 shadow-lg px-4 py-3 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-600">
            <span className="font-bold text-gray-900">{activeCount}</span> active goal{activeCount !== 1 ? 's' : ''}
          </p>
          {saveError && (
            <p className="text-[11px] text-red-500 mt-0.5">{saveError}</p>
          )}
        </div>
        <button
          onClick={saveAll}
          disabled={isSaving}
          className="px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-opacity tap-scale"
        >
          {saved ? '✓ Saved' : isSaving ? 'Saving…' : 'Save goals'}
        </button>
      </div>
    </div>
  )
}

function GoalRow({
  opt,
  goal,
  themeColor,
  onToggle,
  onDecrement,
  onIncrement,
}: {
  opt: GoalOption
  goal: LocalGoal
  themeColor: string
  onToggle: () => void
  onDecrement: () => void
  onIncrement: () => void
}) {
  return (
    <div className={`px-4 py-3 flex items-center gap-3 transition-colors ${goal.is_active ? '' : 'opacity-50'}`}>
      {/* Toggle */}
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

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {opt.emoji} {opt.label}
        </p>
        <p className="text-[11px] text-gray-400">
          {goal.target} {opt.unit} / week
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={onDecrement}
          disabled={!goal.is_active || goal.target <= 1}
          className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center disabled:opacity-30 tap-scale"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-bold text-gray-900 tabular-nums">
          {goal.target}
        </span>
        <button
          onClick={onIncrement}
          disabled={!goal.is_active || goal.target >= opt.maxTarget}
          className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 font-bold text-lg flex items-center justify-center disabled:opacity-30 tap-scale"
        >
          +
        </button>
      </div>
    </div>
  )
}
