'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { MealPlanDay } from './MealPlanDay'
import { RecipePicker } from './RecipePicker'
import { ImportRecipeTab } from './ImportRecipeTab'
import type { RecipeJSON } from '@/lib/meals/types'
import { getWeekStart } from '@/lib/meals/utils'

const DAY_LABELS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

interface SavedRecipe {
  id: string
  recipe_json: RecipeJSON
  source_type: string
  created_at: string
}

interface PlanEntry {
  id: string
  day_of_week: number
  meal_type: string
  servings: number
  custom_dish_name: string | null
  recipe_import_id: string | null
  recipe_imports: { id: string; recipe_json: RecipeJSON; source_type: string } | null
}

interface Props {
  userId: string
  householdId: string | null
}

export function MealPlanTab({ userId, householdId }: Props) {
  const [importOpen, setImportOpen] = useState(false)
  const weekStart = getWeekStart()
  const [entries, setEntries] = useState<PlanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pickerDay, setPickerDay] = useState<number | null>(null)
  const mountedRef = useRef(true)
  const planAbortRef = useRef<AbortController | null>(null)

  useEffect(() => () => {
    mountedRef.current = false
    planAbortRef.current?.abort()
  }, [])

  const loadPlan = useCallback(async () => {
    planAbortRef.current?.abort()
    const controller = new AbortController()
    planAbortRef.current = controller
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/meal-plan?weekStart=${weekStart}`, { signal: controller.signal })
      if (!mountedRef.current) return
      const json = await res.json() as { entries: PlanEntry[] }
      if (!mountedRef.current) return
      setEntries(json.entries ?? [])
    } catch (err) {
      if (!mountedRef.current) return
      if (err instanceof Error && err.name === 'AbortError') return
      setError('Could not load meal plan')
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [weekStart])

  useEffect(() => { void loadPlan() }, [loadPlan])

  async function handleRecipeSelect(recipe: SavedRecipe) {
    if (pickerDay === null) return
    const day = pickerDay
    setPickerDay(null)
    try {
      const res = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weekStart,
          dayOfWeek: day,
          mealType: 'dinner',
          recipeImportId: recipe.id,
          customDishName: null,
          servings: recipe.recipe_json?.servings ?? 2,
        }),
      })
      if (res.ok) await loadPlan()
    } catch {
      // silently fail — user can retry by re-opening picker
    }
  }

  async function handleRemove(entryId: string) {
    const snapshot = entries
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
    try {
      const res = await fetch(`/api/meal-plan/${entryId}`, { method: 'DELETE' })
      if (!res.ok) setEntries(snapshot)
    } catch {
      setEntries(snapshot)
    }
  }

  const entryByDay = (day: number) => entries.find((e) => e.day_of_week === day) ?? null

  const weekEndDate = new Date(weekStart)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const weekLabel = `${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return (
    <div className="px-4 flex flex-col gap-5 pb-6">
      {/* Week header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-base font-semibold text-gray-900">This week</p>
          <p className="text-xs text-gray-400">{weekLabel}</p>
        </div>
        <span className="text-xs text-gray-400">{entries.length}/7 days planned</span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-3 py-2.5 bg-red-50 rounded-xl border border-red-100">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Day grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <svg className="animate-spin text-green-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {DAY_LABELS.map((label, i) => (
              <MealPlanDay
                key={i}
                dayLabel={label}
                dayIndex={i}
                entry={entryByDay(i)}
                onAdd={setPickerDay}
                onRemove={handleRemove}
              />
            ))}
          </div>
          {entries.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-1">No meals planned yet — tap + to add</p>
          )}
        </>
      )}

      {/* Import a recipe */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={() => setImportOpen((v) => !v)}
          className="w-full flex items-center justify-between px-1 py-2 text-left"
        >
          <span className="text-base font-semibold text-blue-600">Import a recipe</span>
          <svg
            width="16" height="16" viewBox="0 0 16 16" fill="none"
            stroke="#2563eb" strokeWidth="2" strokeLinecap="round"
            className={`transition-transform ${importOpen ? 'rotate-180' : ''}`}
          >
            <polyline points="3 6 8 11 13 6" />
          </svg>
        </button>
        {importOpen && (
          <div className="mt-3">
            <ImportRecipeTab userId={userId} householdId={householdId} embedded />
          </div>
        )}
      </div>

      {/* Recipe picker modal */}
      {pickerDay !== null && (
        <RecipePicker
          onSelect={handleRecipeSelect}
          onClose={() => setPickerDay(null)}
        />
      )}
    </div>
  )
}
