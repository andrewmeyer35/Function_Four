import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { RecipeJSON, RecipeImportSourceType } from '@/lib/meals/types'

interface ConfirmBody {
  recipe: RecipeJSON
  sourceUrl?: string | null
  sourceImageUrl?: string | null
  sourceType: RecipeImportSourceType
  householdId: string | null
  extractionConfidence: number
}

// POST /api/recipe-import/confirm
// Saves a confirmed recipe import to the recipe_imports table.
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

  const { recipe, sourceUrl, sourceImageUrl, sourceType, householdId, extractionConfidence } = body

  if (!recipe?.title) {
    return NextResponse.json({ error: 'recipe.title is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('recipe_imports')
    .insert({
      user_id: user.id,
      household_id: householdId ?? null,
      source_url: sourceUrl ?? null,
      source_type: sourceType,
      source_image_url: sourceImageUrl ?? null,
      recipe_json: recipe as unknown as Record<string, unknown>,
      extraction_confidence: extractionConfidence,
      pantry_deductions: [],
      cart_items: [],
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
