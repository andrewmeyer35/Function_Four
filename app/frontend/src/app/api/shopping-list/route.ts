import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { matchIngredientsToPantry } from '@/lib/meals/matchPantry'
import { aggregateIngredients } from '@/lib/meals/normalizeUnits'
import type { PantryItem, RecipeJSON } from '@/lib/meals/types'

export interface ShoppingItem {
  ingredientName: string
  neededQty: number | null
  unit: string | null
  haveQty: number
  buyQty: number | null
  pantryItemId: string | null
  reason: 'from_meal_plan' | 'low_stock'
  mealAttribution: string[]  // e.g. ["Mon dinner", "Wed dinner"]
}

export interface LowStockItem {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  min_quantity: number | null
}

// GET /api/shopping-list?weekStart=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekStart = req.nextUrl.searchParams.get('weekStart')
  if (!weekStart) return NextResponse.json({ error: 'Missing weekStart' }, { status: 400 })

  const DAY_LABELS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri']

  // Track each ingredient with its meal attribution
  const ingredientsByName = new Map<string, {
    qty: number | null
    unit: string | null
    attributions: string[]
  }>()

  // Run household lookup + meal plan join in parallel (plan only needs user.id)
  const [membershipResult, planResult] = await Promise.all([
    supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('meal_plans')
      .select(`
        id,
        meal_plan_entries (
          servings, day_of_week, meal_type,
          recipe_imports ( recipe_json )
        )
      `)
      .eq('user_id', user.id)
      .eq('week_start', weekStart)
      .maybeSingle(),
  ])

  const householdId = membershipResult.data?.household_id ?? null
  const planEntries = (planResult.data?.meal_plan_entries ?? []) as unknown as Array<{
    servings: number
    day_of_week: number
    meal_type: string
    recipe_imports: { recipe_json: RecipeJSON } | null
  }>

  // Fetch pantry now that we have householdId
  const pantryQueryBuilder = supabase
    .from('pantry_items')
    .select('id, name, aliases, quantity, unit, min_quantity, expiration_date, category')
    .order('name')
  if (householdId) {
    pantryQueryBuilder.eq('household_id', householdId)
  } else {
    pantryQueryBuilder.eq('user_id', user.id)
  }
  const { data: pantryRows } = await pantryQueryBuilder

  for (const e of planEntries) {
    const ri = e.recipe_imports
    if (!ri?.recipe_json) continue

    const recipe = ri.recipe_json
    const servings = e.servings as number
    const scale = recipe.servings && recipe.servings > 0 ? servings / recipe.servings : 1
    const dayLabel = `${DAY_LABELS[e.day_of_week as number]} ${e.meal_type as string}`

    for (const ing of recipe.ingredients ?? []) {
      if (ing.isOptional) continue
      const key = ing.name.toLowerCase().trim()
      const existing = ingredientsByName.get(key)
      const scaled = ing.quantity != null ? ing.quantity * scale : null

      if (!existing) {
        ingredientsByName.set(key, {
          qty: scaled,
          unit: ing.unit ?? null,
          attributions: [dayLabel],
        })
      } else {
        ingredientsByName.set(key, {
          qty: existing.qty != null && scaled != null ? existing.qty + scaled : (existing.qty ?? scaled),
          unit: existing.unit ?? ing.unit ?? null,
          attributions: [...existing.attributions, dayLabel],
        })
      }
    }
  }

  // Normalize units across combined ingredients
  const rawIngredients = Array.from(ingredientsByName.entries()).map(([name, v]) => ({
    name,
    quantity: v.qty,
    unit: v.unit,
  }))
  const normalized = aggregateIngredients(rawIngredients)

  // Restore attributions after normalization (key: lowercased ingredient name)
  const attributionMap = new Map(
    Array.from(ingredientsByName.entries()).map(([k, v]) => [k, v.attributions])
  )

  const pantryItems: PantryItem[] = (pantryRows ?? []).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    aliases: (r.aliases as string[]) ?? [],
    quantity: (r.quantity as number) ?? 0,
    unit: (r.unit as string) ?? '',
    expirationDate: (r.expiration_date as string) ?? null,
    category: (r.category as string) ?? '',
  }))

  const shoppingItems: ShoppingItem[] = []

  if (normalized.length > 0) {
    const matches = matchIngredientsToPantry(normalized.map((n) => ({
      name: n.name,
      quantity: n.quantity,
      unit: n.unit,
    })), pantryItems)

    for (const match of matches) {
      const ing = match.extractedIngredient
      const needed = ing.estimatedQuantity
      const pantryItem = pantryItems.find((p) => p.id === match.pantryItemId)
      const have = pantryItem?.quantity ?? 0
      const attributions = attributionMap.get(ing.name.toLowerCase().trim()) ?? []

      let buyQty: number | null = null
      if (needed != null) {
        buyQty = Math.max(0, needed - have)
      }

      if (match.matchMethod === 'none' || (buyQty !== null && buyQty > 0) || buyQty === null) {
        shoppingItems.push({
          ingredientName: ing.name,
          neededQty: needed ?? null,
          unit: ing.unit ?? null,
          haveQty: have,
          buyQty,
          pantryItemId: match.pantryItemId,
          reason: 'from_meal_plan',
          mealAttribution: attributions,
        })
      }
    }
  }

  // Low stock items (below min_quantity, not already in shopping list from meal plan)
  const shoppingNames = new Set(shoppingItems.map((s) => s.ingredientName.toLowerCase()))
  const lowStockItems: LowStockItem[] = (pantryRows ?? [])
    .filter((r) => {
      const minQty = r.min_quantity as number | null
      const qty = (r.quantity as number) ?? 0
      return minQty != null && qty <= minQty && !shoppingNames.has((r.name as string).toLowerCase())
    })
    .map((r) => ({
      id: r.id as string,
      name: r.name as string,
      quantity: r.quantity as number | null,
      unit: r.unit as string | null,
      min_quantity: r.min_quantity as number | null,
    }))

  return NextResponse.json({ shoppingItems, lowStockItems })
}
