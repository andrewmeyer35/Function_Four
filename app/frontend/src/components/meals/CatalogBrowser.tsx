'use client'

import { useState, useEffect } from 'react'
import { CatalogRecipeCard } from './CatalogRecipeCard'

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

interface Props {
  onAddToPlan: (recipe: CatalogRecipe) => void
}

const CUISINE_OPTIONS: Array<{ label: string; value: string | null }> = [
  { label: 'All', value: null },
  { label: 'Italian', value: 'italian' },
  { label: 'Asian', value: 'asian' },
  { label: 'Mexican', value: 'mexican' },
  { label: 'Mediterranean', value: 'mediterranean' },
  { label: 'American', value: 'american' },
  { label: 'Breakfast', value: 'breakfast' },
]

const DIETARY_OPTIONS: Array<{ label: string; value: string | null }> = [
  { label: 'All', value: null },
  { label: 'Vegetarian', value: 'vegetarian' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Gluten-Free', value: 'gluten_free' },
]

export function CatalogBrowser({ onAddToPlan }: Props) {
  const [cuisine, setCuisine] = useState<string | null>(null)
  const [dietary, setDietary] = useState<string | null>(null)
  const [recipes, setRecipes] = useState<CatalogRecipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    if (cuisine) params.set('cuisine', cuisine)
    if (dietary) params.set('dietary', dietary)

    fetch(`/api/catalog-recipes?${params.toString()}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json() as { error?: string }
          throw new Error(err.error ?? 'Failed to load recipes')
        }
        return res.json() as Promise<{ recipes: CatalogRecipe[] }>
      })
      .then((json) => {
        if (!cancelled) {
          setRecipes(json.recipes ?? [])
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load recipes')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [cuisine, dietary])

  return (
    <div className="flex flex-col gap-3">
      {/* Cuisine filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {CUISINE_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => !loading && setCuisine(opt.value)}
            disabled={loading}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-opacity ${
              cuisine === opt.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600'
            } ${loading ? 'opacity-50' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Dietary filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {DIETARY_OPTIONS.map((opt) => (
          <button
            key={opt.label}
            onClick={() => !loading && setDietary(opt.value)}
            disabled={loading}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-opacity ${
              dietary === opt.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600'
            } ${loading ? 'opacity-50' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-10">
          <svg
            className="animate-spin text-indigo-600"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          <p className="text-sm text-gray-400">Loading recipes…</p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <p className="text-sm text-red-600 text-center py-4">{error}</p>
      )}

      {/* Empty state */}
      {!loading && !error && recipes.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">No recipes found.</p>
      )}

      {/* Recipe grid */}
      {!loading && !error && recipes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          {recipes.map((recipe) => (
            <CatalogRecipeCard
              key={recipe.id}
              recipe={recipe}
              onAddToPlan={onAddToPlan}
            />
          ))}
        </div>
      )}
    </div>
  )
}
