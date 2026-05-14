'use client'

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
  recipe: CatalogRecipe
  onAddToPlan: (recipe: CatalogRecipe) => void
}

function pantryBarColor(pct: number): string {
  if (pct >= 60) return 'bg-green-500'
  if (pct >= 30) return 'bg-amber-400'
  return 'bg-red-400'
}

const GREEN_TAGS = new Set(['vegetarian', 'vegan'])
const BLUE_TAGS = new Set(['gluten_free', 'dairy_free'])

function tagLabel(tag: string): string {
  return tag.replace(/_/g, '-').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function CatalogRecipeCard({ recipe, onAddToPlan }: Props) {
  const totalIngredients = recipe.recipe_json.ingredients.length
  const haveCount = totalIngredients - recipe.missingCount

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
      {/* Title */}
      <p className="text-sm font-semibold text-gray-900">{recipe.title}</p>

      {/* Badge row */}
      <div className="flex items-center gap-3">
        {recipe.cookTimeMinutes != null && (
          <span className="text-xs text-gray-400">⏱ {recipe.cookTimeMinutes}min</span>
        )}
        {recipe.servings != null && (
          <span className="text-xs text-gray-400">🍽 {recipe.servings}</span>
        )}
      </div>

      {/* Dietary tags */}
      {recipe.dietaryTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.dietaryTags.map((tag) => {
            const isGreen = GREEN_TAGS.has(tag)
            const isBlue = BLUE_TAGS.has(tag)
            const colorClass = isGreen
              ? 'bg-green-100 text-green-700'
              : isBlue
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600'
            return (
              <span key={tag} className={`text-xs rounded-full px-2 py-0.5 ${colorClass}`}>
                {tagLabel(tag)}
              </span>
            )
          })}
        </div>
      )}

      {/* Pantry match bar */}
      <div className="flex flex-col gap-1">
        <p className="text-xs text-gray-400">
          You have {haveCount} of {totalIngredients} ingredients
        </p>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${pantryBarColor(recipe.pantryMatchPct)}`}
            style={{ width: recipe.pantryMatchPct + '%' }}
          />
        </div>
      </div>

      {/* Add to Plan button */}
      <button
        onClick={() => onAddToPlan(recipe)}
        className="w-full mt-1 rounded-xl bg-indigo-600 text-white text-sm font-medium py-2 hover:bg-indigo-700 active:scale-95 transition-transform"
      >
        Add to Plan
      </button>
    </div>
  )
}
