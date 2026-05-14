import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { matchIngredientsToPantry } from '@/lib/meals/matchPantry'
import type { PantryItem } from '@/lib/meals/types'

interface SpoonacularIngredient {
  id: number
  name: string
  amount: number
  unit: string
  measures?: {
    us?: { amount: number; unitShort: string }
    metric?: { amount: number; unitShort: string }
  }
}

interface SpoonacularRecipeInfo {
  id: number
  title: string
  servings: number
  extendedIngredients: SpoonacularIngredient[]
}

// GET /api/meal-log/dish-ingredients?id={spoonacularId}&householdId={...}
// Fetches recipe details from Spoonacular, runs Fuse.js matching against pantry.
// Returns { dishName, defaultServings, matches }
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const recipeId = req.nextUrl.searchParams.get('id')
  const householdId = req.nextUrl.searchParams.get('householdId')

  if (!recipeId) return NextResponse.json({ error: 'Missing id param' }, { status: 400 })

  const apiKey = process.env.SPOONACULAR_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Spoonacular API key not configured. Add SPOONACULAR_API_KEY to your environment.' },
      { status: 503 }
    )
  }

  // Fetch recipe info + pantry in parallel
  const spoonUrl = new URL(`https://api.spoonacular.com/recipes/${recipeId}/information`)
  spoonUrl.searchParams.set('apiKey', apiKey)
  spoonUrl.searchParams.set('includeNutrition', 'false')

  const pantryQuery = supabase
    .from('pantry_items')
    .select('id, name, aliases, quantity, unit, expiration_date, category')
    .order('name')

  if (householdId) {
    pantryQuery.eq('household_id', householdId)
  } else {
    pantryQuery.eq('user_id', user.id)
  }

  const [spoonRes, pantryResult] = await Promise.all([
    fetch(spoonUrl.toString(), {
      signal: AbortSignal.timeout(8_000),
      headers: { Accept: 'application/json' },
    }),
    pantryQuery,
  ])

  if (!spoonRes.ok) {
    return NextResponse.json(
      { error: `Spoonacular error: HTTP ${spoonRes.status}` },
      { status: 502 }
    )
  }

  const recipeInfo = (await spoonRes.json()) as SpoonacularRecipeInfo

  const pantryItems: PantryItem[] = (pantryResult.data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    aliases: (row.aliases as string[]) ?? [],
    quantity: row.quantity as number,
    unit: (row.unit as string) ?? '',
    expirationDate: (row.expiration_date as string) ?? null,
    category: (row.category as string) ?? '',
  }))

  const ingredients = recipeInfo.extendedIngredients.map((ing) => ({
    name: ing.name,
    quantity: ing.amount ?? null,
    unit: ing.unit || null,
  }))

  const matches = matchIngredientsToPantry(ingredients, pantryItems)

  return NextResponse.json({
    dishName: recipeInfo.title,
    defaultServings: recipeInfo.servings ?? 2,
    matches,
  })
}
