'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { CatalogBrowser } from './CatalogBrowser'
import { AddToPlanDrawer } from './AddToPlanDrawer'
import { MissingIngredientsDrawer } from './MissingIngredientsDrawer'
import { getWeekStart } from '@/lib/meals/utils'

interface Suggestion {
  recipeImportId: string | null
  title: string
  reason: string
  expiryIngredients: string[]
  missingIngredients: string[]
  cookTimeMinutes: number | null
  servings: number | null
  urgencyScore: number
}

interface ExpiringItem { name: string; expiration_date: string | null }
interface LowItem { name: string; quantity: number | null; unit: string | null }

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
  userId: string
  householdId: string | null
}


function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

export function SuggestionsTab({ userId: _userId, householdId: _householdId }: Props) {
  const weekStart = useMemo(() => getWeekStart(), [])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [expiring, setExpiring] = useState<ExpiringItem[]>([])
  const [lowStock, setLowStock] = useState<LowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedRecipe, setSelectedRecipe] = useState<CatalogRecipe | null>(null)
  const [missingItems, setMissingItems] = useState<MissingItem[]>([])
  const mountedRef = useRef(true)

  useEffect(() => {
    const ctrl = new AbortController()
    fetch('/api/meal-suggestions', { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json() as { error?: string }
          throw new Error(err.error ?? 'Failed to load suggestions')
        }
        return r.json() as Promise<{ suggestions: Suggestion[]; expiringItems: ExpiringItem[]; lowStockItems: LowItem[] }>
      })
      .then((json) => {
        if (!mountedRef.current) return
        setSuggestions(json.suggestions ?? [])
        setExpiring(json.expiringItems ?? [])
        setLowStock(json.lowStockItems ?? [])
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return
        if (!mountedRef.current) return
        setError('Could not load suggestions')
      })
      .finally(() => {
        if (mountedRef.current) setLoading(false)
      })
    return () => { mountedRef.current = false; ctrl.abort() }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <svg className="animate-spin text-green-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
        <p className="text-base text-gray-400">Analyzing your pantry…</p>
      </div>
    )
  }

  if (error) {
    return <p className="text-base text-red-600 text-center py-8 px-4">{error}</p>
  }

  const noPantry = expiring.length === 0 && lowStock.length === 0 && suggestions.length === 0

  return (
    <div className="px-4 flex flex-col gap-5 pb-6">

      {/* Expiry alerts */}
      {expiring.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Use up soon</p>
          <div className="flex flex-wrap gap-2">
            {expiring.map((item, i) => {
              const days = daysUntil(item.expiration_date)
              const urgentColor = days != null && days <= 3
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-amber-100 text-amber-700 border-amber-200'
              return (
                <span key={i} className={`px-2.5 py-1 rounded-full border text-xs font-medium ${urgentColor}`}>
                  {item.name}{days != null ? ` · ${days}d` : ''}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* AI Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recommended this week</p>
          {suggestions.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  s.urgencyScore > 0.5 ? 'bg-amber-100' : 'bg-green-100'
                }`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.urgencyScore > 0.5 ? '#d97706' : '#16a34a'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-semibold text-gray-900 truncate">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{s.reason}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {s.cookTimeMinutes && (
                  <span className="text-xs text-gray-400">⏱ {s.cookTimeMinutes} min</span>
                )}
                {s.servings && (
                  <span className="text-xs text-gray-400">🍽 {s.servings} servings</span>
                )}
                {s.expiryIngredients.length > 0 && (
                  <span className="text-xs text-amber-600 font-medium">
                    Uses: {s.expiryIngredients.slice(0, 3).join(', ')}
                  </span>
                )}
              </div>

              {s.missingIngredients.length > 0 && (
                <p className="text-xs text-gray-400">
                  Still need: {s.missingIngredients.slice(0, 4).join(', ')}
                  {s.missingIngredients.length > 4 ? ` +${s.missingIngredients.length - 4} more` : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Low stock */}
      {lowStock.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Running low</p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((item, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                {item.name} — {item.quantity ?? 0}{item.unit ? ` ${item.unit}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty pantry prompt — shown inline so catalog is still visible */}
      {noPantry && (
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-gray-900">Ready when you are</p>
            <p className="text-base text-gray-500 mt-1">Add a few pantry items and we'll start suggesting recipes that use what you have. The more you add, the better the picks.</p>
          </div>
        </div>
      )}

      {/* Recipe catalog */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-base font-semibold text-gray-900 mb-3">Browse all recipes</p>
        <CatalogBrowser onAddToPlan={(recipe) => setSelectedRecipe(recipe)} />
      </div>

      {/* Add-to-plan drawer */}
      {selectedRecipe && (
        <AddToPlanDrawer
          recipe={selectedRecipe}
          weekStart={weekStart}
          onClose={() => setSelectedRecipe(null)}
          onAdded={(missing) => { setSelectedRecipe(null); setMissingItems(missing) }}
        />
      )}

      {/* Missing ingredients drawer */}
      {missingItems.length > 0 && (
        <MissingIngredientsDrawer
          items={missingItems}
          weekStart={weekStart}
          onClose={() => setMissingItems([])}
        />
      )}
    </div>
  )
}
