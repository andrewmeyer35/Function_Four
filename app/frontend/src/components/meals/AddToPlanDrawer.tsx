'use client'

import { useState, useEffect } from 'react'

interface CatalogRecipe {
  id: string
  title: string
  description: string | null
  cuisines: string[]
  dietaryTags: string[]
  cookTimeMinutes: number | null
  servings: number | null
  pantryMatchPct: number
  missingCount: number
  recipe_json: {
    title: string
    servings: number | null
    cookTimeMinutes: number | null
    prepTimeMinutes: number | null
    sourceText: string
    ingredients: Array<{ name: string; quantity: number | null; unit: string | null; preparation: string | null; isOptional: boolean }>
    steps: Array<{ stepNumber: number; instruction: string }>
    tags: string[]
  }
}

interface MissingItem {
  name: string
  quantity: number | null
  unit: string | null
}

interface Props {
  recipe: CatalogRecipe | null
  weekStart: string
  onClose: () => void
  onAdded: (missing: MissingItem[]) => void
}

type DrawerState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'error'; message: string }

const DAY_LABELS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'] as const
type MealType = typeof MEAL_TYPES[number]

export function AddToPlanDrawer({ recipe, weekStart, onClose, onAdded }: Props) {
  const [dayOfWeek, setDayOfWeek] = useState(1) // default Sunday
  const [mealType, setMealType] = useState<MealType>('Dinner')
  const [servings, setServings] = useState<number>(recipe?.servings ?? 2)
  const [state, setState] = useState<DrawerState>({ kind: 'idle' })

  useEffect(() => {
    if (recipe) {
      setDayOfWeek(1)
      setMealType('Dinner')
      setServings(recipe.servings ?? 2)
      setState({ kind: 'idle' })
    }
  }, [recipe?.id])

  if (!recipe) return null

  async function handleSubmit() {
    if (!recipe) return
    setState({ kind: 'saving' })
    try {
      const res = await fetch(`/api/catalog-recipes/${recipe.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weekStart, dayOfWeek, mealType, servings }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        setState({ kind: 'error', message: err.error ?? 'Failed to add recipe' })
        return
      }
      const data = await res.json() as { planEntryId: string; missingIngredients: MissingItem[] }
      onAdded(data.missingIngredients ?? [])
    } catch {
      setState({ kind: 'error', message: 'Network error — try again' })
    }
  }

  const isSaving = state.kind === 'saving'

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto shadow-xl">
        {/* Drag handle */}
        <div className="mx-auto w-10 h-1 bg-gray-200 rounded-full mb-4" />

        {/* Recipe title */}
        <p className="text-base font-semibold text-gray-900 mb-4">{recipe.title}</p>

        {/* Day picker */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Day</p>
          <div className="flex flex-wrap gap-2">
            {DAY_LABELS.map((label, index) => (
              <button
                key={label}
                onClick={() => setDayOfWeek(index)}
                className={`px-2.5 py-1.5 rounded-full text-xs font-medium ${
                  dayOfWeek === index
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Meal type */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Meal</p>
          <div className="flex flex-wrap gap-2">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setMealType(type)}
                className={`px-2.5 py-1.5 rounded-full text-xs font-medium ${
                  mealType === type
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Servings stepper */}
        <div className="mb-4">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Servings</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              disabled={isSaving || servings <= 1}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-medium disabled:opacity-40"
            >
              −
            </button>
            <span className="text-sm font-medium text-gray-900 w-8 text-center">{servings}</span>
            <button
              onClick={() => setServings((s) => s + 1)}
              disabled={isSaving}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 text-lg font-medium disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={isSaving}
          className="w-full rounded-xl bg-indigo-600 text-white text-sm font-medium py-3 mt-4 hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <svg
                className="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Adding…
            </>
          ) : (
            'Add to Plan'
          )}
        </button>

        {/* Error message */}
        {state.kind === 'error' && (
          <p className="text-sm text-red-600 text-center mt-2">{state.message}</p>
        )}
      </div>
    </div>
  )
}
