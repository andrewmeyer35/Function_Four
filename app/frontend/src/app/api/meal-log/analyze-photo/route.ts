import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { matchIngredientsToPantry } from '@/lib/meals/matchPantry'
import type { MealPhotoAnalysis, PantryItem, ExtractedIngredient, RecipeIngredient } from '@/lib/meals/types'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type AllowedMediaType = (typeof ALLOWED_TYPES)[number]
const MAX_BYTES = 10 * 1024 * 1024

const DAY_NAMES = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

function currentWeekStart(): string {
  const today = new Date()
  const day = today.getDay()
  const diffToSat = day === 6 ? 0 : -(day + 1)
  const sat = new Date(today)
  sat.setDate(today.getDate() + diffToSat)
  const y = sat.getFullYear()
  const m = String(sat.getMonth() + 1).padStart(2, '0')
  const d = String(sat.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// POST /api/meal-log/analyze-photo
// Accepts multipart/form-data with:
//   file        — image of the meal
//   householdId — optional, for pantry lookup
//
// Returns { analysis, matches, photoUrl }
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  const householdId = formData.get('householdId') as string | null

  if (!file) return NextResponse.json({ error: 'Missing file field' }, { status: 400 })
  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: `Unsupported image type: ${file.type}` }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.type.split('/')[1] ?? 'jpg'
  const storagePath = `${user.id}/meal-logs/${Date.now()}.${ext}`

  // Build pantry and meal plan queries
  const pantryQuery = supabase
    .from('pantry_items')
    .select('id, name, aliases, quantity, unit, expiration_date, category')
    .order('quantity', { ascending: false })
    .limit(30)

  if (householdId) {
    pantryQuery.eq('household_id', householdId)
  } else {
    pantryQuery.eq('user_id', user.id)
  }

  const weekStart = currentWeekStart()
  const mealPlanQuery = supabase
    .from('meal_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .maybeSingle()

  // Phase 1: upload + context fetches in parallel
  const [uploadResult, pantryResult, planResult] = await Promise.all([
    supabase.storage
      .from('meal-photos')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false }),
    pantryQuery,
    mealPlanQuery,
  ])

  let photoUrl: string | null = null
  if (!uploadResult.error) {
    const { data } = supabase.storage.from('meal-photos').getPublicUrl(storagePath)
    photoUrl = data.publicUrl
  }

  // Build meal plan context (fetch entries + recipes if plan exists)
  interface PlannedMeal { title: string; dayOfWeek: number; mealType: string; ingredients: RecipeIngredient[] }
  const plannedMeals: PlannedMeal[] = []
  if (planResult.data) {
    const { data: entries } = await supabase
      .from('meal_plan_entries')
      .select('day_of_week, meal_type, recipe_import_id')
      .eq('meal_plan_id', planResult.data.id)
      .limit(14)

    if (entries && entries.length > 0) {
      const recipeIds = (entries as Array<{ recipe_import_id: string | null }>)
        .map((e) => e.recipe_import_id)
        .filter((id): id is string => id !== null)

      if (recipeIds.length > 0) {
        const { data: recipes } = await supabase
          .from('recipe_imports')
          .select('id, recipe_json')
          .in('id', recipeIds)

        const recipeMap = new Map(
          (recipes ?? []).map((r) => [r.id as string, r.recipe_json as { title?: string; ingredients?: RecipeIngredient[] }])
        )

        for (const entry of entries as Array<{ day_of_week: number; meal_type: string; recipe_import_id: string | null }>) {
          if (!entry.recipe_import_id) continue
          const rj = recipeMap.get(entry.recipe_import_id)
          if (rj?.title) {
            plannedMeals.push({
              title: rj.title,
              dayOfWeek: entry.day_of_week,
              mealType: entry.meal_type,
              ingredients: rj.ingredients ?? [],
            })
          }
        }
      }
    }
  }

  // Build context strings
  const pantryRows = pantryResult.data ?? []
  const pantryContext = pantryRows.length > 0
    ? `Pantry currently contains: ${pantryRows
        .slice(0, 20)
        .map((r) => `${r.name as string}${(r.quantity as number | null) != null ? ` (${r.quantity}${r.unit ? ` ${r.unit}` : ''})` : ''}`)
        .join(', ')}.`
    : ''

  const mealPlanContext = plannedMeals.length > 0
    ? `This week's planned meals:\n${plannedMeals
        .map((m) => `${DAY_NAMES[m.dayOfWeek] ?? `Day ${m.dayOfWeek}`} ${m.mealType} - ${m.title}`)
        .join('\n')}`
    : ''

  const contextBlock = [pantryContext, mealPlanContext].filter(Boolean).join('\n\n')
  const contextPrefix = contextBlock
    ? `Context to help with identification:\n${contextBlock}\n\n`
    : ''

  // Phase 2: Claude vision call with context
  const client = new Anthropic()
  const mediaType = file.type as AllowedMediaType
  const base64 = buffer.toString('base64')

  let visionResult
  try {
    visionResult = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `${contextPrefix}Analyze this meal photo and return ONLY a valid JSON object.

Required shape:
{
  "dish": string,                  // name of the dish
  "dishConfidence": number,        // 0.0–1.0
  "cuisine": string | null,
  "estimatedServings": number,     // integer, how many people this serves
  "ingredients": [
    {
      "name": string,
      "estimatedQuantity": number | null,
      "unit": string | null,
      "quantityConfidence": "high" | "medium" | "low",
      "alternatives": string[],
      "isOptionalGarnish": boolean
    }
  ],
  "uncertaintyNotes": string | null
}

Focus on identifying all major ingredients visible or implied by the dish. Include typical pantry staples used to cook it (oil, butter, salt, flour, etc.) even if not clearly visible.

Return ONLY the JSON. No markdown, no explanation.`,
            },
          ],
        },
      ],
    }, { signal: AbortSignal.timeout(25_000) })
  } catch (err) {
    const isTimeout = err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')
    if (isTimeout) {
      return NextResponse.json({ error: 'Photo analysis timed out — try a smaller image or retake the photo.' }, { status: 504 })
    }
    return NextResponse.json({ error: `Vision API failed: ${String(err)}` }, { status: 500 })
  }

  // Parse vision response
  let analysis: MealPhotoAnalysis
  try {
    const rawText = visionResult.content[0].type === 'text' ? visionResult.content[0].text : ''
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()
    analysis = JSON.parse(cleaned) as MealPhotoAnalysis
  } catch (err) {
    return NextResponse.json({ error: `Vision parsing failed: ${String(err)}` }, { status: 500 })
  }

  // If confident match with a planned meal, use its recipe ingredients for accuracy
  if (analysis.dishConfidence >= 0.75 && plannedMeals.length > 0) {
    const dishLower = analysis.dish.toLowerCase()
    const matched = plannedMeals.find((m) => {
      const planTitle = m.title.toLowerCase()
      const words = planTitle.split(' ')
      return words.every(w => dishLower.includes(w)) && dishLower.length < planTitle.length * 2
    })
    if (matched && matched.ingredients.length > 0) {
      analysis = {
        ...analysis,
        ingredients: matched.ingredients.map((ing): ExtractedIngredient => ({
          name: ing.name,
          estimatedQuantity: ing.quantity,
          unit: ing.unit,
          quantityConfidence: 'high',
          alternatives: [],
          isOptionalGarnish: ing.isOptional,
        })),
      }
    }
  }

  // Map DB rows to PantryItem type
  const pantryItems: PantryItem[] = pantryRows.map((row) => ({
    id: row.id as string,
    name: row.name as string,
    aliases: (row.aliases as string[]) ?? [],
    quantity: row.quantity as number,
    unit: (row.unit as string) ?? '',
    expirationDate: (row.expiration_date as string) ?? null,
    category: (row.category as string) ?? '',
  }))

  // Fuse.js matching
  const matches = matchIngredientsToPantry(
    analysis.ingredients.map((ing) => ({
      name: ing.name,
      quantity: ing.estimatedQuantity,
      unit: ing.unit,
    })),
    pantryItems
  )

  return NextResponse.json({ analysis, matches, photoUrl })
}
