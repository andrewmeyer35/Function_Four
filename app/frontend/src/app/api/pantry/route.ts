import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/pantry
export async function GET() {
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

  const query = supabase
    .from('pantry_items')
    .select('id, name, aliases, quantity, unit, min_quantity, expiration_date, category, package_size, package_unit, updated_at')
    .order('name')

  if (householdId) {
    query.eq('household_id', householdId)
  } else {
    query.eq('user_id', user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

interface AddBody {
  name: string
  quantity: number | null
  unit: string | null
  min_quantity: number | null
  expiration_date: string | null
  category: string | null
  package_size: number | null
  package_unit: string | null
}

// POST /api/pantry
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: AddBody
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const { data, error } = await supabase
    .from('pantry_items')
    .insert({
      user_id: user.id,
      household_id: membership?.household_id ?? null,
      name: body.name.trim(),
      quantity: body.quantity ?? null,
      unit: body.unit?.trim() || null,
      min_quantity: body.min_quantity ?? null,
      expiration_date: body.expiration_date || null,
      category: body.category?.trim() || null,
      package_size: body.package_size ?? null,
      package_unit: body.package_unit?.trim() || null,
    })
    .select('id, name, aliases, quantity, unit, min_quantity, expiration_date, category, package_size, package_unit, updated_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
