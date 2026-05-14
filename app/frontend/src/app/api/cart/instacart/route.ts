import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CartItem {
  name: string
  qty: string
}

interface InstacartIngredient {
  name: string
  display_text: string
}

// GET /api/cart/instacart?weekStart=YYYY-MM-DD
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const weekStart = req.nextUrl.searchParams.get('weekStart')
  if (!weekStart) return NextResponse.json({ error: 'Missing weekStart' }, { status: 400 })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) {
    return NextResponse.json({ error: 'weekStart must be YYYY-MM-DD' }, { status: 400 })
  }

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  const householdId = membership?.household_id ?? null

  // Fetch unchecked custom cart items for the week (include items with no week_start)
  let query = supabase
    .from('cart_items')
    .select('name, quantity, unit')
    .is('checked_at', null)
    .or(`week_start.eq.${weekStart},week_start.is.null`)
    .order('created_at', { ascending: true })

  if (householdId) {
    query = query.eq('household_id', householdId)
  } else {
    query = query.eq('user_id', user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Build display items
  const items: CartItem[] = (data ?? []).map((row) => {
    const name = row.name as string
    const quantity = row.quantity as number | null
    const unit = row.unit as string | null

    let qty: string
    if (quantity != null && unit) {
      qty = `${quantity} ${unit}`
    } else if (quantity != null) {
      qty = String(quantity)
    } else {
      qty = ''
    }

    return { name, qty }
  })

  const apiKey = process.env.INSTACART_API_KEY

  if (apiKey) {
    const ingredients: InstacartIngredient[] = items.map((item) => ({
      name: item.name,
      display_text: item.qty,
    }))

    try {
      const resp = await fetch('https://connect.instacart.com/v1/recipe_collections', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept-Version': '2021-09-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Shopping list',
          image_url: null,
          link_type: 'recipe',
          instructions: [],
          ingredients,
        }),
        signal: AbortSignal.timeout(8000),
      })

      if (resp.ok) {
        const json = await resp.json() as { data?: { url?: string } }
        const url = json.data?.url ?? null
        return NextResponse.json({ url, items })
      }
      // API returned a non-OK status — fall through to no-key path
    } catch {
      // Timeout or network error — fall through to no-key path
    }
  }

  // No key or API failed: return items only (client will copy to clipboard)
  return NextResponse.json({ url: null, items })
}
