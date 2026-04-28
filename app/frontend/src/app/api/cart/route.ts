import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export interface CartItemRow {
  id: string
  user_id: string
  household_id: string | null
  name: string
  quantity: number | null
  unit: string | null
  checked_at: string | null
  source: 'custom' | 'override'
  week_start: string | null
  created_at: string
  updated_at: string
}

const WEEK_START_RE = /^\d{4}-\d{2}-\d{2}$/

// GET /api/cart?weekStart=YYYY-MM-DD (weekStart optional)
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  const householdId = membership?.household_id ?? null

  const weekStart = req.nextUrl.searchParams.get('weekStart')
  if (weekStart && !WEEK_START_RE.test(weekStart)) {
    return NextResponse.json({ error: 'weekStart must be YYYY-MM-DD' }, { status: 400 })
  }

  let query = supabase
    .from('cart_items')
    .select('*')
    .order('created_at', { ascending: true })

  if (householdId) {
    query = query.eq('household_id', householdId)
  } else {
    query = query.eq('user_id', user.id)
  }

  if (weekStart) {
    query = query.or(`week_start.eq.${weekStart},week_start.is.null`)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ items: (data ?? []) as CartItemRow[] })
}

interface PostBody {
  name: string
  quantity?: number | null
  unit?: string | null
  week_start?: string | null
}

// POST /api/cart — add a custom cart item
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: PostBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate name
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
  if (name.length > 200) return NextResponse.json({ error: 'name must be 200 characters or fewer' }, { status: 400 })

  // Validate quantity
  if (body.quantity !== undefined && body.quantity !== null) {
    if (typeof body.quantity !== 'number' || !isFinite(body.quantity) || body.quantity <= 0) {
      return NextResponse.json({ error: 'quantity must be a positive finite number' }, { status: 400 })
    }
  }
  const quantity = body.quantity ?? null

  // Validate unit
  if (body.unit !== undefined && body.unit !== null && typeof body.unit !== 'string') {
    return NextResponse.json({ error: 'unit must be a string' }, { status: 400 })
  }
  const unit = typeof body.unit === 'string' ? body.unit.trim().slice(0, 50) || null : null

  // Validate week_start
  if (body.week_start !== undefined && body.week_start !== null) {
    if (typeof body.week_start !== 'string' || !WEEK_START_RE.test(body.week_start)) {
      return NextResponse.json({ error: 'week_start must be YYYY-MM-DD' }, { status: 400 })
    }
  }
  const weekStart = body.week_start ?? null

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  const householdId = membership?.household_id ?? null

  const { data, error } = await supabase
    .from('cart_items')
    .insert({
      user_id: user.id,
      household_id: householdId,
      name,
      quantity,
      unit,
      source: 'custom',
      week_start: weekStart,
      checked_at: null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data as CartItemRow }, { status: 201 })
}
