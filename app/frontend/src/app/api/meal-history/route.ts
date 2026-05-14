import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { RecipeJSON } from '@/lib/meals/types'

export interface HistoryItem {
  id: string
  type: 'photo' | 'recipe'
  title: string
  imageUrl: string | null
  date: string
  ingredientCount: number
  ingredients: Array<{ name: string; quantity: number | null; unit: string | null }>
  sourceType?: string
}

interface MealPhotoRow {
  id: string
  image_url: string
  dish_name: string
  analysis_json: { ingredients?: Array<{ name: string; quantity?: number | null; unit?: string | null }> } | null
  created_at: string
}

interface RecipeImportRow {
  id: string
  image_url: string | null
  source_type: string
  recipe_json: RecipeJSON
  created_at: string
}

// GET /api/meal-history — merged timeline of logged photos + confirmed recipe imports
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [photosResult, recipesResult] = await Promise.all([
    supabase
      .from('meal_photos')
      .select('id, image_url, dish_name, analysis_json, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('recipe_imports')
      .select('id, image_url, source_type, recipe_json, created_at')
      .eq('user_id', user.id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const photoItems: HistoryItem[] = ((photosResult.data ?? []) as MealPhotoRow[]).map((p) => {
    const rawIngredients = p.analysis_json?.ingredients ?? []
    const ingredients = rawIngredients.map((i) => ({
      name: i.name,
      quantity: i.quantity ?? null,
      unit: i.unit ?? null,
    }))
    return {
      id: p.id,
      type: 'photo',
      title: p.dish_name,
      imageUrl: p.image_url,
      date: p.created_at,
      ingredientCount: ingredients.length,
      ingredients,
    }
  })

  const recipeItems: HistoryItem[] = ((recipesResult.data ?? []) as RecipeImportRow[]).map((r) => {
    const rj = r.recipe_json
    const ingredients = (rj?.ingredients ?? []).map((i) => ({
      name: i.name,
      quantity: i.quantity ?? null,
      unit: i.unit ?? null,
    }))
    return {
      id: r.id,
      type: 'recipe',
      title: rj?.title ?? 'Untitled recipe',
      imageUrl: r.image_url,
      date: r.created_at,
      ingredientCount: ingredients.length,
      ingredients,
      sourceType: r.source_type,
    }
  })

  const items = [...photoItems, ...recipeItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return NextResponse.json({ items })
}
