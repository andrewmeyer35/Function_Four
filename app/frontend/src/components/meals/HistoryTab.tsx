'use client'

import { useState, useEffect } from 'react'
import type { RecipeJSON } from '@/lib/meals/types'

interface SavedRecipe {
  id: string
  recipe_json: RecipeJSON
  source_type: string
  source_url: string | null
  created_at: string
}

interface LoggedMeal {
  id: string
  dish_name: string
  cuisine: string | null
  estimated_servings: number | null
  created_at: string
}

const SOURCE_LABELS: Record<string, string> = {
  url_jsonld: 'URL',
  url_llm: 'URL',
  screenshot_ocr: 'Screenshot',
  manual_entry: 'Manual',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
  userId: string
  householdId: string | null
}

export function HistoryTab({ userId: _userId, householdId: _householdId }: Props) {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [meals, setMeals] = useState<LoggedMeal[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/recipe-import/history')
      .then((r) => r.json())
      .then((json: { recipes: SavedRecipe[]; meals: LoggedMeal[] }) => {
        setRecipes(json.recipes ?? [])
        setMeals(json.meals ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin text-green-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      </div>
    )
  }

  const empty = recipes.length === 0 && meals.length === 0

  if (empty) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900">No history yet</p>
          <p className="text-sm text-gray-500 mt-1">Import a recipe or log a meal to see it here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 flex flex-col gap-5 pb-6">

      {/* Saved recipes */}
      {recipes.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-gray-900">Saved recipes</p>
          {recipes.map((r) => {
            const isOpen = expanded === r.id
            const recipe = r.recipe_json
            return (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{recipe?.title}</p>
                    <p className="text-xs text-gray-400">
                      {SOURCE_LABELS[r.source_type] ?? r.source_type} · {timeAgo(r.created_at)}
                      {recipe?.ingredients?.length ? ` · ${recipe.ingredients.length} ingredients` : ''}
                    </p>
                  </div>
                  <svg
                    width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isOpen && recipe?.ingredients && (
                  <div className="px-4 pb-3 border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-500 mt-2 mb-1.5">Ingredients</p>
                    <div className="flex flex-col gap-1">
                      {recipe.ingredients.map((ing, i) => (
                        <p key={i} className="text-xs text-gray-700">
                          • {ing.quantity != null ? `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''} ` : ''}{ing.name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Logged meals */}
      {meals.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold text-gray-900">Logged meals</p>
          {meals.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate capitalize">{m.dish_name}</p>
                <p className="text-xs text-gray-400">
                  {timeAgo(m.created_at)}
                  {m.cuisine ? ` · ${m.cuisine}` : ''}
                  {m.estimated_servings ? ` · ${m.estimated_servings} servings` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
