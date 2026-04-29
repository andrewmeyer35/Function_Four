import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { RecipeJSON, PantryItem } from '@/lib/meals/types'
import { matchIngredientsToPantry } from '@/lib/meals/matchPantry'

interface AddToPlanBody {
  weekStart: string
  dayOfWeek: number
  mealType: string
  servings: number
}

interface MissingItem {
  name: string
  quantity: number | null
  unit: string | null
}

// POST /api/catalog-recipes/[id]  — add catalog recipe to meal plan
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = params

  let body: AddToPlanBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { weekStart, dayOfWeek, mealType, servings } = body

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
  if (!weekStart || !DATE_RE.test(weekStart)) return NextResponse.json({ error: 'Invalid weekStart' }, { status: 400 })

  const VALID_MEAL_TYPES = new Set(['Breakfast', 'Lunch', 'Dinner', 'Snack', 'breakfast', 'lunch', 'dinner', 'snack'])
  if (!mealType || !VALID_MEAL_TYPES.has(mealType)) return NextResponse.json({ error: 'Invalid mealType' }, { status: 400 })

  if (dayOfWeek == null || typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6) {
    return NextResponse.json({ error: 'dayOfWeek must be 0–6' }, { status: 400 })
  }

  if (typeof servings !== 'number' || !Number.isFinite(servings) || servings < 1 || servings > 100) {
    return NextResponse.json({ error: 'servings must be 1–100' }, { status: 400 })
  }

  // Fetch the catalog recipe
  const { data: catalog, error: catalogError } = await supabase
    .from('catalog_recipes')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (catalogError) return NextResponse.json({ error: catalogError.message }, { status: 500 })
  if (!catalog) return NextResponse.json({ error: 'Catalog recipe not found' }, { status: 404 })

  const catalogRecipe = catalog as {
    id: string
    title: string
    recipe_json: RecipeJSON
  }

  // Get household membership
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const householdId = membership?.household_id ?? null

  // Check if this catalog recipe has already been imported by this user
  const catalogSourceUrl = `catalog:${id}`

  const { data: existingImport } = await supabase
    .from('recipe_imports')
    .select('id')
    .eq('user_id', user.id)
    .eq('source_url', catalogSourceUrl)
    .maybeSingle()

  let recipeImportId: string

  if (existingImport) {
    recipeImportId = existingImport.id as string
  } else {
    // Insert a new recipe_imports row for this catalog recipe
    const { data: newImport, error: importError } = await supabase
      .from('recipe_imports')
      .insert({
        user_id: user.id,
        household_id: householdId,
        source_type: 'catalog',
        source_url: catalogSourceUrl,
        source_image_url: null,
        recipe_json: catalogRecipe.recipe_json as unknown as Record<string, unknown>,
        extraction_confidence: 1.0,
        pantry_deductions: [],
        cart_items: [],
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (importError) return NextResponse.json({ error: importError.message }, { status: 500 })
    recipeImportId = newImport.id as string
  }

  // Upsert meal_plans row
  const { data: plan, error: planError } = await supabase
    .from('meal_plans')
    .upsert(
      { user_id: user.id, household_id: householdId, week_start: weekStart },
      { onConflict: 'user_id,week_start' }
    )
    .select('id')
    .single()

  if (planError) return NextResponse.json({ error: planError.message }, { status: 500 })

  // Upsert meal_plan_entries row
  const { data: entry, error: entryError } = await supabase
    .from('meal_plan_entries')
    .upsert(
      {
        meal_plan_id: plan.id,
        day_of_week: dayOfWeek,
        meal_type: mealType,
        recipe_import_id: recipeImportId,
        servings,
      },
      { onConflict: 'meal_plan_id,day_of_week,meal_type' }
    )
    .select('id')
    .single()

  if (entryError) return NextResponse.json({ error: entryError.message }, { status: 500 })

  // Compute missing ingredients (scaled to requested servings)
  const rj = catalogRecipe.recipe_json
  const recipeServings = rj.servings ?? 1
  const scale = servings / recipeServings

  const scaledIngredients = (rj.ingredients ?? []).map((ing) => ({
    name: ing.name,
    quantity: ing.quantity != null ? ing.quantity * scale : null,
    unit: ing.unit ?? null,
  }))

  // Fetch pantry for missing ingredient computation
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

  const matchResults = scaledIngredients.length > 0
    ? matchIngredientsToPantry(scaledIngredients, pantryItems)
    : []

  const missingIngredients: MissingItem[] = matchResults
    .filter((r) => r.matchMethod === 'none')
    .map((r) => ({
      name: r.extractedIngredient.name,
      quantity: r.extractedIngredient.estimatedQuantity,
      unit: r.extractedIngredient.unit,
    }))

  return NextResponse.json({
    planEntryId: entry.id,
    missingIngredients,
  })
}
