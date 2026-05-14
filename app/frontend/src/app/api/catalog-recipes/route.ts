import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { RecipeJSON, PantryItem } from '@/lib/meals/types'
import { matchIngredientsToPantry } from '@/lib/meals/matchPantry'

interface CatalogRecipeRow {
  id: string
  title: string
  description: string | null
  cuisines: string[]
  dietary_tags: string[]
  recipe_json: RecipeJSON
}

export interface CatalogRecipe {
  id: string
  title: string
  description: string | null
  cuisines: string[]
  dietaryTags: string[]
  cookTimeMinutes: number | null
  servings: number | null
  pantryMatchPct: number
  missingCount: number
  recipe_json: RecipeJSON
}

// GET /api/catalog-recipes?cuisine=italian&dietary=vegetarian
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cuisine = req.nextUrl.searchParams.get('cuisine') ?? null
  const dietary = req.nextUrl.searchParams.get('dietary') ?? null

  // Build catalog query
  let query = supabase
    .from('catalog_recipes')
    .select('id, title, description, cuisines, dietary_tags, recipe_json')

  if (cuisine) {
    query = query.contains('cuisines', [cuisine])
  }
  if (dietary) {
    query = query.contains('dietary_tags', [dietary])
  }

  const { data: catalogRows, error: catalogError } = await query
  if (catalogError) return NextResponse.json({ error: catalogError.message }, { status: 500 })

  const rows = (catalogRows ?? []) as CatalogRecipeRow[]

  // Fetch user pantry (household-scoped if available)
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const householdId = membership?.household_id ?? null

  const pantryQuery = supabase
    .from('pantry_items')
    .select('id, name, quantity, unit')

  if (householdId) {
    pantryQuery.eq('household_id', householdId)
  } else {
    pantryQuery.eq('user_id', user.id)
  }

  const { data: pantryData } = await pantryQuery

  const pantryItems: PantryItem[] = (pantryData ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    aliases: [],
    quantity: (row.quantity as number) ?? 0,
    unit: (row.unit as string) ?? '',
    expirationDate: null,
    category: '',
  }))

  // Compute pantry match for each catalog recipe
  const recipes: CatalogRecipe[] = rows.map((row) => {
    const rj = row.recipe_json
    const ingredients = (rj.ingredients ?? []).map((ing) => ({
      name: ing.name,
      quantity: ing.quantity ?? null,
      unit: ing.unit ?? null,
    }))

    let pantryMatchPct = 0
    let missingCount = 0

    if (ingredients.length > 0) {
      const matchResults = matchIngredientsToPantry(ingredients, pantryItems)
      const matchedCount = matchResults.filter((r) => r.matchMethod !== 'none').length
      missingCount = ingredients.length - matchedCount
      pantryMatchPct = Math.round((matchedCount / ingredients.length) * 100)
    }

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      cuisines: row.cuisines,
      dietaryTags: row.dietary_tags,
      cookTimeMinutes: rj.cookTimeMinutes ?? null,
      servings: rj.servings ?? null,
      pantryMatchPct,
      missingCount,
      recipe_json: rj,
    }
  })

  // Sort by pantry match descending
  recipes.sort((a, b) => b.pantryMatchPct - a.pantryMatchPct)

  return NextResponse.json({ recipes })
}
