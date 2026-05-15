import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/meal-plan?weekStart=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekStart = req.nextUrl.searchParams.get('weekStart')
  if (!weekStart) return NextResponse.json({ error: 'Missing weekStart' }, { status: 400 })

  // Single join query instead of two sequential round-trips
  const { data: plan, error } = await supabase
    .from('meal_plans')
    .select(`
      id,
      meal_plan_entries (
        id,
        day_of_week,
        meal_type,
        servings,
        custom_dish_name,
        recipe_import_id,
        recipe_imports ( id, recipe_json, source_type )
      )
    `)
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!plan) return NextResponse.json({ entries: [] })

  const entries = [...((plan.meal_plan_entries ?? []) as unknown[])].sort(
    (a, b) => (a as { day_of_week: number }).day_of_week - (b as { day_of_week: number }).day_of_week
  )

  return NextResponse.json({ planId: plan.id, entries })
}

interface UpsertBody {
  weekStart: string
  dayOfWeek: number
  mealType: string
  recipeImportId: string | null
  customDishName: string | null
  servings: number
}

// POST /api/meal-plan  — upsert one entry
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: UpsertBody
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  // Ensure meal_plan row exists
  const { data: plan, error: planErr } = await supabase
    .from('meal_plans')
    .upsert(
      { user_id: user.id, household_id: membership?.household_id ?? null, week_start: body.weekStart },
      { onConflict: 'user_id,week_start' }
    )
    .select('id')
    .single()

  if (planErr) return NextResponse.json({ error: planErr.message }, { status: 500 })

  const { data: entry, error: entryErr } = await supabase
    .from('meal_plan_entries')
    .upsert(
      {
        meal_plan_id: plan.id,
        day_of_week: body.dayOfWeek,
        meal_type: body.mealType,
        recipe_import_id: body.recipeImportId ?? null,
        custom_dish_name: body.customDishName ?? null,
        servings: body.servings,
      },
      { onConflict: 'meal_plan_id,day_of_week,meal_type' }
    )
    .select('id, day_of_week, meal_type, servings, custom_dish_name, recipe_import_id')
    .single()

  if (entryErr) return NextResponse.json({ error: entryErr.message }, { status: 500 })
  return NextResponse.json(entry)
}
