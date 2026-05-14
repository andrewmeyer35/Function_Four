import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CookingTime, DietaryRestriction, CuisinePreference } from '@/lib/meals/preferences'

export type { UserPreferences } from '@/lib/meals/preferences'

// ─── Validation helpers ───────────────────────────────────────────────────

const VALID_COOKING_TIMES: CookingTime[] = ['quick', 'medium', 'elaborate']

const VALID_DIETARY_RESTRICTIONS: DietaryRestriction[] = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
  'nut-free', 'shellfish-free', 'halal', 'kosher',
]

const VALID_CUISINE_PREFERENCES: CuisinePreference[] = [
  'italian', 'asian', 'mexican', 'mediterranean', 'american',
  'indian', 'middle-eastern', 'french', 'greek', 'japanese',
]

// ─── Default shape returned when no row exists ────────────────────────────

const DEFAULT_PREFERENCES = {
  id: '',
  user_id: '',
  dietary_restrictions: [] as DietaryRestriction[],
  disliked_ingredients: [] as string[],
  cuisine_preferences: [] as CuisinePreference[],
  household_size: 2,
  weekly_cooking_time: 'medium' as CookingTime,
  default_servings: 2,
  created_at: '',
  updated_at: '',
}

// ─── GET /api/preferences ─────────────────────────────────────────────────

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!data) {
    // Return defaults — do not insert a row on GET
    return NextResponse.json({ ...DEFAULT_PREFERENCES, user_id: user.id })
  }

  return NextResponse.json(data)
}

// ─── PUT /api/preferences ─────────────────────────────────────────────────

interface PutBody {
  dietary_restrictions?: unknown
  disliked_ingredients?: unknown
  cuisine_preferences?: unknown
  household_size?: unknown
  weekly_cooking_time?: unknown
  default_servings?: unknown
}

export async function PUT(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: PutBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ── Validate weekly_cooking_time ────────────────────────────────────────
  if (
    body.weekly_cooking_time !== undefined &&
    !VALID_COOKING_TIMES.includes(body.weekly_cooking_time as CookingTime)
  ) {
    return NextResponse.json(
      { error: `weekly_cooking_time must be one of: ${VALID_COOKING_TIMES.join(', ')}` },
      { status: 400 },
    )
  }

  // ── Validate household_size ─────────────────────────────────────────────
  if (body.household_size !== undefined) {
    if (typeof body.household_size !== 'number') {
      return NextResponse.json({ error: 'household_size must be a number' }, { status: 400 })
    }
    if (!Number.isInteger(body.household_size) || body.household_size < 1 || body.household_size > 10) {
      return NextResponse.json(
        { error: 'household_size must be an integer between 1 and 10' },
        { status: 400 },
      )
    }
  }

  // ── Validate default_servings ───────────────────────────────────────────
  if (body.default_servings !== undefined) {
    if (typeof body.default_servings !== 'number') {
      return NextResponse.json({ error: 'default_servings must be a number' }, { status: 400 })
    }
    if (!Number.isInteger(body.default_servings) || body.default_servings < 1 || body.default_servings > 20) {
      return NextResponse.json(
        { error: 'default_servings must be an integer between 1 and 20' },
        { status: 400 },
      )
    }
  }

  // ── Validate dietary_restrictions ──────────────────────────────────────
  if (body.dietary_restrictions !== undefined) {
    if (!Array.isArray(body.dietary_restrictions)) {
      return NextResponse.json(
        { error: 'dietary_restrictions must be an array' },
        { status: 400 },
      )
    }
    const invalid = (body.dietary_restrictions as unknown[]).filter(
      (v) => !VALID_DIETARY_RESTRICTIONS.includes(v as DietaryRestriction),
    )
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid dietary_restrictions: ${invalid.join(', ')}` },
        { status: 400 },
      )
    }
  }

  // ── Validate cuisine_preferences ───────────────────────────────────────
  if (body.cuisine_preferences !== undefined) {
    if (!Array.isArray(body.cuisine_preferences)) {
      return NextResponse.json(
        { error: 'cuisine_preferences must be an array' },
        { status: 400 },
      )
    }
    const invalid = (body.cuisine_preferences as unknown[]).filter(
      (v) => !VALID_CUISINE_PREFERENCES.includes(v as CuisinePreference),
    )
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid cuisine_preferences: ${invalid.join(', ')}` },
        { status: 400 },
      )
    }
  }

  // ── Validate disliked_ingredients ──────────────────────────────────────
  if (body.disliked_ingredients !== undefined) {
    if (!Array.isArray(body.disliked_ingredients)) {
      return NextResponse.json({ error: 'disliked_ingredients must be an array' }, { status: 400 })
    }
    if ((body.disliked_ingredients as unknown[]).some((v) => typeof v !== 'string')) {
      return NextResponse.json({ error: 'disliked_ingredients must be an array of strings' }, { status: 400 })
    }
    const items = body.disliked_ingredients as string[]
    if (items.some((v) => v.length > 100)) {
      return NextResponse.json({ error: 'Each disliked ingredient must be 100 characters or fewer' }, { status: 400 })
    }
    if (items.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 disliked ingredients' }, { status: 400 })
    }
  }

  // ── Build upsert payload ────────────────────────────────────────────────
  const payload: Record<string, unknown> = { user_id: user.id }

  if (body.dietary_restrictions !== undefined)
    payload.dietary_restrictions = body.dietary_restrictions
  if (body.disliked_ingredients !== undefined)
    payload.disliked_ingredients = body.disliked_ingredients
  if (body.cuisine_preferences !== undefined)
    payload.cuisine_preferences = body.cuisine_preferences
  if (body.household_size !== undefined)
    payload.household_size = body.household_size as number
  if (body.weekly_cooking_time !== undefined)
    payload.weekly_cooking_time = body.weekly_cooking_time
  if (body.default_servings !== undefined)
    payload.default_servings = body.default_servings as number

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
