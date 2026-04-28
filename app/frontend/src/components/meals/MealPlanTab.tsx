'use client'

import { useState, useEffect, useCallback } from 'react'
import { MealPlanDay } from './MealPlanDay'
import { RecipePicker } from './RecipePicker'
import { ShoppingList } from './ShoppingList'
import type { RecipeJSON } from '@/lib/meals/types'

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

interface ShoppingItem {
  ingredientName: string
  neededQty: number | null
  unit: string | null
  haveQty: number
  buyQty: number | null
  pantryItemId: string | null
  reason: 'from_meal_plan' | 'low_stock'
  mealAttribution: string[]
}

interface LowStockItem {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  min_quantity: number | null
}

function getWeekStart(): string {
  const today = new Date()
  const day = today.getDay() // 0=Sun, 6=Sat
  const diffToSat = day === 6 ? 0 : -(day + 1)
  const sat = new Date(today)
  sat.setDate(today.getDate() + diffToSat)
  return sat.toISOString().slice(0, 10)
}

interface Props {
  userId: string
  householdId: string | null
}

export function MealPlanTab({ userId: _userId, householdId: _householdId }: Props) {
  const weekStart = getWeekStart()
  const [entries, setEntries] = useState<PlanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [pickerDay, setPickerDay] = useState<number | null>(null)
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [listLoading, setListLoading] = useState(false)

  const loadPlan = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/meal-plan?weekStart=${weekStart}`)
      const json = await res.json() as { entries: PlanEntry[] }
      setEntries(json.entries ?? [])
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  const loadShoppingList = useCallback(async () => {
    setListLoading(true)
    try {
      const res = await fetch(`/api/shopping-list?weekStart=${weekStart}`)
      const json = await res.json() as { shoppingItems: ShoppingItem[]; lowStockItems: LowStockItem[] }
      setShoppingItems(json.shoppingItems ?? [])
      setLowStockItems(json.lowStockItems ?? [])
    } finally {
      setListLoading(false)
    }
  }, [weekStart])

  useEffect(() => { void loadPlan() }, [loadPlan])
  useEffect(() => { void loadShoppingList() }, [loadShoppingList])

  async function handleRecipeSelect(recipe: SavedRecipe) {
    if (pickerDay === null) return
    setPickerDay(null)

    const res = await fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekStart,
        dayOfWeek: pickerDay,
        mealType: 'dinner',
        recipeImportId: recipe.id,
        customDishName: null,
        servings: recipe.recipe_json?.servings ?? 2,
      }),
    })
    if (res.ok) {
      await loadPlan()
      await loadShoppingList()
    }
  }

  async function handleRemove(entryId: string) {
    setEntries((prev) => prev.filter((e) => e.id !== entryId))
    await fetch(`/api/meal-plan/${entryId}`, { method: 'DELETE' })
    await loadShoppingList()
  }

  const entryByDay = (day: number) => entries.find((e) => e.day_of_week === day) ?? null

  // Format week range for display
  const weekEndDate = new Date(weekStart)
  weekEndDate.setDate(weekEndDate.getDate() + 6)
  const weekLabel = `${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${weekEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return (
    <div className="px-4 flex flex-col gap-5 pb-6">
      {/* Week header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">This week</p>
          <p className="text-xs text-gray-400">{weekLabel}</p>
        </div>
        <span className="text-xs text-gray-400">{entries.length}/7 days planned</span>
      </div>

      {/* Day grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <svg className="animate-spin text-green-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        </div>
      ) : (
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
      )}

      {/* Shopping list */}
      <div className="border-t border-gray-100 pt-4">
        <ShoppingList
          shoppingItems={shoppingItems}
          lowStockItems={lowStockItems}
          weekStart={weekStart}
          loading={listLoading}
          onBought={loadShoppingList}
        />
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
