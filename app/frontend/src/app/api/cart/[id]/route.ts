import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CartItemRow } from '../route'

// Returns null if not found or not authorized
async function getOwnedItem(
  supabase: SupabaseClient,
  id: string,
  userId: string,
  householdId: string | null,
): Promise<CartItemRow | null> {
  const { data } = await supabase
    .from('cart_items')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  if (data.household_id && data.household_id === householdId) return data as CartItemRow
  if (data.user_id === userId) return data as CartItemRow
  return null
}

interface Params { params: { id: string } }

interface PatchBody {
  name?: string
  quantity?: number | null
  unit?: string | null
  checked?: boolean
}

// PATCH /api/cart/[id] — edit a cart item
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: PatchBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  const householdId = membership?.household_id ?? null

  const existing = await getOwnedItem(supabase, params.id, user.id, householdId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Validate name if provided
  if (body.name !== undefined) {
    const trimmed = typeof body.name === 'string' ? body.name.trim() : ''
    if (!trimmed) return NextResponse.json({ error: 'name must be non-empty' }, { status: 400 })
    if (trimmed.length > 200) return NextResponse.json({ error: 'name must be 200 characters or fewer' }, { status: 400 })
  }

  // Validate quantity if provided
  if (body.quantity !== undefined && body.quantity !== null) {
    if (typeof body.quantity !== 'number' || !isFinite(body.quantity) || body.quantity <= 0) {
      return NextResponse.json({ error: 'quantity must be a positive finite number' }, { status: 400 })
    }
  }

  // Validate unit if provided
  if (body.unit !== undefined && body.unit !== null && typeof body.unit !== 'string') {
    return NextResponse.json({ error: 'unit must be a string' }, { status: 400 })
  }

  // Build patch payload
  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.name !== undefined) {
    payload.name = (body.name as string).trim()
  }
  if (body.quantity !== undefined) {
    payload.quantity = body.quantity
  }
  if (body.unit !== undefined) {
    payload.unit = typeof body.unit === 'string' ? body.unit.trim().slice(0, 50) || null : null
  }
  if (body.checked === true) {
    payload.checked_at = new Date().toISOString()
  } else if (body.checked === false) {
    payload.checked_at = null
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update(payload)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data as CartItemRow })
}

// DELETE /api/cart/[id] — remove a cart item
export async function DELETE(_req: NextRequest, { params }: Params) {
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

  const existing = await getOwnedItem(supabase, params.id, user.id, householdId)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// Re-export so the type is usable from sibling routes if needed
export type { CartItemRow }
