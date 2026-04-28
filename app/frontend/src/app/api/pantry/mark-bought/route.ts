import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Fuse from 'fuse.js'

interface MarkBoughtBody {
  ingredientName: string
  quantity: number | null
  unit: string | null
  pantryItemId: string | null  // if already matched to a pantry item
}

// POST /api/pantry/mark-bought
// Called when a user checks off a shopping list item as purchased.
// - If pantryItemId is provided: increment that item's quantity.
// - Otherwise: fuzzy-search existing pantry items by name.
//   - Match found: increment quantity.
//   - No match: create new pantry item.
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: MarkBoughtBody
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { ingredientName, quantity, unit, pantryItemId } = body
  if (!ingredientName?.trim()) {
    return NextResponse.json({ error: 'ingredientName is required' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  const householdId = membership?.household_id ?? null

  // If we have a direct pantry item ID, just increment it
  if (pantryItemId) {
    const { data: existing } = await supabase
      .from('pantry_items')
      .select('quantity, package_size')
      .eq('id', pantryItemId)
      .maybeSingle()

    const newQty = (existing?.quantity ?? 0) + (quantity ?? 0)
    // Set package_size if this is the first buy and it wasn't set before
    const pkgUpdate = existing?.package_size == null && quantity != null
      ? { quantity: newQty, package_size: quantity, package_unit: unit, updated_at: new Date().toISOString() }
      : { quantity: newQty, updated_at: new Date().toISOString() }

    const { data, error } = await supabase
      .from('pantry_items')
      .update(pkgUpdate)
      .eq('id', pantryItemId)
      .select('id, name, quantity, unit, package_size, package_unit')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'updated', item: data })
  }

  // Fetch existing pantry items and fuzzy-match by name
  const pantryQuery = supabase
    .from('pantry_items')
    .select('id, name, aliases, quantity, unit, package_size, package_unit')
  if (householdId) {
    pantryQuery.eq('household_id', householdId)
  } else {
    pantryQuery.eq('user_id', user.id)
  }
  const { data: pantryRows } = await pantryQuery

  let matchedId: string | null = null
  if (pantryRows && pantryRows.length > 0) {
    const corpus = pantryRows.flatMap((r) => [
      { id: r.id as string, name: r.name as string },
      ...((r.aliases as string[]) ?? []).map((a) => ({ id: r.id as string, name: a })),
    ])
    const fuse = new Fuse(corpus, { keys: ['name'], threshold: 0.3, includeScore: true })
    const results = fuse.search(ingredientName)
    if (results.length > 0 && (results[0].score ?? 1) < 0.3) {
      matchedId = results[0].item.id
    }
  }

  if (matchedId) {
    const existing = pantryRows?.find((r) => r.id === matchedId)
    const newQty = ((existing?.quantity as number) ?? 0) + (quantity ?? 0)
    const pkgUpdate = (existing?.package_size == null) && quantity != null
      ? { quantity: newQty, package_size: quantity, package_unit: unit, updated_at: new Date().toISOString() }
      : { quantity: newQty, updated_at: new Date().toISOString() }

    const { data, error } = await supabase
      .from('pantry_items')
      .update(pkgUpdate)
      .eq('id', matchedId)
      .select('id, name, quantity, unit, package_size, package_unit')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ action: 'updated', item: data })
  }

  // No match — create new pantry item
  const { data, error } = await supabase
    .from('pantry_items')
    .insert({
      user_id: user.id,
      household_id: householdId,
      name: ingredientName.trim(),
      quantity: quantity ?? null,
      unit: unit ?? null,
      package_size: quantity ?? null,
      package_unit: unit ?? null,
    })
    .select('id, name, quantity, unit, package_size, package_unit')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ action: 'created', item: data })
}