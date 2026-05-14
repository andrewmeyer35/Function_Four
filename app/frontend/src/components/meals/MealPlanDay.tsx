'use client'

import type { RecipeJSON } from '@/lib/meals/types'

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
  dayLabel: string
  dayIndex: number
  entry: PlanEntry | null
  onAdd: (dayIndex: number) => void
  onRemove: (entryId: string) => void
}

const MEAL_COLORS: Record<string, { bg: string; border: string; dot: string; label: string }> = {
  breakfast: { bg: 'bg-amber-50',  border: 'border-amber-200',  dot: 'bg-amber-400',  label: 'Breakfast' },
  lunch:     { bg: 'bg-blue-50',   border: 'border-blue-200',   dot: 'bg-blue-400',   label: 'Lunch'     },
  dinner:    { bg: 'bg-green-50',  border: 'border-green-200',  dot: 'bg-green-400',  label: 'Dinner'    },
  snack:     { bg: 'bg-purple-50', border: 'border-purple-200', dot: 'bg-purple-400', label: 'Snack'     },
}
const DEFAULT_COLORS = { bg: 'bg-white', border: 'border-gray-100', dot: 'bg-gray-300', label: '' }

export function MealPlanDay({ dayLabel, dayIndex, entry, onAdd, onRemove }: Props) {
  const recipe = entry?.recipe_imports?.recipe_json
  const title = recipe?.title ?? entry?.custom_dish_name ?? null
  const colors = MEAL_COLORS[entry?.meal_type ?? ''] ?? DEFAULT_COLORS

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{dayLabel}</p>

      {title ? (
        <div className={`relative ${colors.bg} rounded-2xl border ${colors.border} shadow-sm px-3 py-2.5 min-h-[72px]`}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`w-2 h-2 rounded-full shrink-0 ${colors.dot}`} />
            {colors.label && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{colors.label}</span>
            )}
          </div>
          <p className="text-xs font-semibold text-gray-900 leading-snug pr-5 truncate">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {entry?.servings ?? 2} servings
            {recipe?.cookTimeMinutes ? ` · ${recipe.cookTimeMinutes} min` : ''}
          </p>
          <button
            onClick={() => entry && onRemove(entry.id)}
            className="absolute top-2 right-2 text-gray-300 hover:text-red-400 transition"
            aria-label="Remove"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={() => onAdd(dayIndex)}
          className="flex items-center justify-center min-h-[72px] rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-green-300 hover:text-green-600 transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      )}
    </div>
  )
}
