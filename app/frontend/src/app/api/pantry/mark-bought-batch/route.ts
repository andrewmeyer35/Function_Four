import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Fuse from 'fuse.js'

interface BatchItem {
  ingredientName: string
  quantity: number | null
  unit: string | null
  pantryItemId: string | null
}

interface BatchResult {
  ingredientName: string
  status: 'ok' | 'error'
  action?: 'updated' | 'created'
  error?: string
}

// POST /api/pantry/mark-bought-batch
// Batch version of mark-bought: 1 auth check, 1 household lookup, 1 pantry SELECT,
// then parallel UPDATEs + 1 batch INSERT — vs N of each in the single-item route.
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { items?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'items must be a non-empty array' }, { status: 400 })
  }
  if (body.items.length > 50) {
    return NextResponse.json({ error: 'Too many items (max 50)' }, { status: 400 })
  }
  const items = body.items as BatchItem[]

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  const householdId = membership?.household_id ?? null

  // Single SELECT of all pantry items — used for both fuzzy matching and newQty computation
  const pantryQuery = supabase
    .from('pantry_items')
    .select('id, name, aliases, quantity, unit, package_size, package_unit')
  householdId ? pantryQuery.eq('household_id', householdId) : pantryQuery.eq('user_id', user.id)
  const { data: pantryData } = await pantryQuery
  const rows = pantryData ?? []

  // Build Fuse corpus once for all fuzzy lookups
  const corpus = rows.flatMap((r) => [
    { id: r.id as string, name: r.name as string },
    ...((r.aliases as string[]) ?? []).map((a) => ({ id: r.id as string, name: a })),
  ])
  const fuse = rows.length > 0
    ? new Fuse(corpus, { keys: ['name'], threshold: 0.3, includeScore: true })
    : null

  const rowsById = new Map(rows.map((r) => [r.id as string, r]))

  // Resolve target pantry item ID for each input item
  const resolvedIds: Array<string | null> = items.map((item) => {
    if (item.pantryItemId) return item.pantryItemId
    if (!fuse) return null
    const results = fuse.search(item.ingredientName)
    if (results.length > 0 && (results[0].score ?? 1) < 0.3) return results[0].item.id
    return null
  })

  const resultMap = new Map<number, BatchResult>()
  const toInsert: Array<{ index: number; item: BatchItem }> = []
  const updatePromises: Promise<void>[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const targetId = resolvedIds[i]

    if (targetId === null) {
      toInsert.push({ index: i, item })
      continue
    }

    const existing = rowsById.get(targetId)
    const newQty = ((existing?.quantity as number) ?? 0) + (item.quantity ?? 0)
    const pkgUpdate = (existing?.package_size == null) && item.quantity != null
      ? { quantity: newQty, package_size: item.quantity, package_unit: item.unit, updated_at: new Date().toISOString() }
      : { quantity: newQty, updated_at: new Date().toISOString() }

    const idx = i
    const captured = item
    updatePromises.push(
      (async () => {
        const { error } = await supabase
          .from('pantry_items')
          .update(pkgUpdate)
          .eq('id', targetId)
        resultMap.set(idx, {
          ingredientName: captured.ingredientName,
          status: error ? 'error' : 'ok',
          action: 'updated',
          error: error?.message,
        })
      })()
    )
  }

  await Promise.allSettled(updatePromises)

  // Batch INSERT for items with no pantry match
  if (toInsert.length > 0) {
    const insertRows = toInsert.map(({ item }) => ({
      user_id: user.id,
      household_id: householdId,
      name: item.ingredientName.trim(),
      quantity: item.quantity ?? null,
      unit: item.unit ?? null,
      package_size: item.quantity ?? null,
      package_unit: item.unit ?? null,
    }))
    const { error: insertError } = await supabase
      .from('pantry_items')
      .insert(insertRows)

    for (const { index, item } of toInsert) {
      resultMap.set(index, {
        ingredientName: item.ingredientName,
        status: insertError ? 'error' : 'ok',
        action: 'created',
        error: insertError?.message,
      })
    }
  }

  const results: BatchResult[] = items.map((_, i) => resultMap.get(i) ?? {
    ingredientName: items[i].ingredientName,
    status: 'error',
    error: 'No result recorded',
  })

  return NextResponse.json({ results })
}
