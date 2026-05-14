import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { MealPhotoAnalysis } from '@/lib/meals/types'

interface ConfirmItem {
  ingredientName: string
  pantryItemId: string | null
  deductQuantity: number | null
  deductUnit: string | null
  included: boolean
  matchConfidence: number
}

interface ConfirmBody {
  dishName: string
  servings: number
  householdId: string | null
  photoUrl: string | null
  analysisJson: MealPhotoAnalysis | null
  sourceType: 'meal_photo_estimated' | 'confirmed'
  items: ConfirmItem[]
}

// POST /api/meal-log/confirm
// 1. Optionally inserts a meal_photos row
// 2. For each included item with a pantryItemId: decrements pantry_items.quantity
// 3. Inserts consumption_logs rows for all included items
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: ConfirmBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { dishName, servings, householdId, photoUrl, analysisJson, sourceType, items } = body
  const includedItems = items.filter((i) => i.included)

  // 1. Insert meal_photos row if we have a photo
  let mealPhotoId: string | null = null
  if (photoUrl && analysisJson) {
    const { data: photoRow, error: photoErr } = await supabase
      .from('meal_photos')
      .insert({
        user_id: user.id,
        household_id: householdId,
        image_url: photoUrl,
        dish_name: dishName,
        dish_confidence: analysisJson.dishConfidence,
        cuisine: analysisJson.cuisine,
        estimated_servings: servings,
        analysis_json: analysisJson as unknown as Record<string, unknown>,
      })
      .select('id')
      .single()

    if (!photoErr && photoRow) {
      mealPhotoId = photoRow.id as string
    }
  }

  // 2. Decrement pantry quantities for matched items
  const pantryUpdates = includedItems
    .filter((i) => i.pantryItemId && i.deductQuantity != null)
    .map((i) =>
      supabase.rpc('decrement_pantry_quantity', {
        p_item_id: i.pantryItemId,
        p_amount: i.deductQuantity,
      })
    )

  // Run pantry decrements (best-effort; failures logged but don't block the response)
  await Promise.allSettled(pantryUpdates)

  // 3. Insert consumption_logs
  if (includedItems.length > 0) {
    const logRows = includedItems.map((i) => ({
      user_id: user.id,
      household_id: householdId,
      pantry_item_id: i.pantryItemId ?? null,
      ingredient_name: i.ingredientName,
      quantity_consumed: i.deductQuantity ?? null,
      unit: i.deductUnit ?? null,
      source_type: sourceType,
      confidence: i.matchConfidence,
      meal_photo_id: mealPhotoId,
    }))

    const { error: logErr } = await supabase.from('consumption_logs').insert(logRows)
    if (logErr) {
      return NextResponse.json({ error: logErr.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true, mealPhotoId, loggedCount: includedItems.length })
}
