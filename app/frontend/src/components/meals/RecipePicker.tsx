'use client'

import { useState, useEffect } from 'react'
import type { RecipeJSON } from '@/lib/meals/types'

interface SavedRecipe {
  id: string
  recipe_json: RecipeJSON
  source_type: string
  created_at: string
}

interface Props {
  onSelect: (recipe: SavedRecipe) => void
  onClose: () => void
}

export function RecipePicker({ onSelect, onClose }: Props) {
  const [recipes, setRecipes] = useState<SavedRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetch('/api/recipe-import/history')
      .then((r) => r.json())
      .then((json: { recipes: SavedRecipe[] }) => setRecipes(json.recipes ?? []))
      .catch(() => setRecipes([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = recipes.filter((r) =>
    r.recipe_json?.title?.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-5 flex flex-col gap-4 max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="font-semibold text-gray-900">Pick a recipe</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <input
          placeholder="Search saved recipes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-green-400"
          autoFocus
        />

        <div className="flex flex-col gap-2 overflow-y-auto">
          {loading && <p className="text-sm text-gray-400 text-center py-4">Loading…</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">
              {recipes.length === 0 ? 'No saved recipes yet — import one first!' : 'No matches'}
            </p>
          )}
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(r)}
              className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-green-50 transition text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{r.recipe_json?.title}</p>
                <p className="text-xs text-gray-400">
                  {r.recipe_json?.ingredients?.length ?? 0} ingredients
                  {r.recipe_json?.cookTimeMinutes ? ` · ${r.recipe_json.cookTimeMinutes} min` : ''}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
