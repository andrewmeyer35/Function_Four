import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import type { CartItemRow } from '../route'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type AllowedMediaType = (typeof ALLOWED_TYPES)[number]

const MAX_BYTES = 10 * 1024 * 1024

export interface ReceiptMatch {
  cartItemId: string
  cartItemName: string
  receiptName: string
  quantity: number | null
  unit: string | null
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
}

function fuzzyMatch(receiptItem: string, cartItem: string): boolean {
  const r = normalize(receiptItem)
  const c = normalize(cartItem)
  if (r === c) return true
  // strip trailing 's' for plural matching
  const rStem = r.replace(/s$/, '')
  const cStem = c.replace(/s$/, '')
  if (rStem === cStem) return true
  // substring match: one contains the other (min 4 chars to avoid noise)
  if (r.length >= 4 && c.includes(r)) return true
  if (c.length >= 4 && r.includes(c)) return true
  return false
}

// POST /api/cart/receipt
// Body: multipart/form-data with field `file` (image of a receipt)
// Returns: { matches: ReceiptMatch[] }
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
  if (!file) return NextResponse.json({ error: 'Missing file field' }, { status: 400 })

  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: `Unsupported image type: ${file.type}` }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
  }

  // Fetch current cart items
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()
  const householdId = membership?.household_id ?? null

  let cartQuery = supabase
    .from('cart_items')
    .select('*')
    .is('checked_at', null)
    .order('created_at', { ascending: true })

  if (householdId) {
    cartQuery = cartQuery.eq('household_id', householdId)
  } else {
    cartQuery = cartQuery.eq('user_id', user.id)
  }

  const { data: cartItems } = await cartQuery
  const items = (cartItems ?? []) as CartItemRow[]

  if (items.length === 0) {
    return NextResponse.json({ matches: [] })
  }

  // Call Claude vision to extract receipt items
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const base64 = buffer.toString('base64')
  const mediaType = file.type as AllowedMediaType

  const client = new Anthropic()

  let receiptItems: string[]
  try {
    const msg = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
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
              text: `This is a grocery receipt photo. List every food or grocery item purchased on this receipt.
Return ONLY a JSON array of item name strings, lowercased, singular form.
Example: ["eggs", "milk", "chicken breast", "frozen peas"]
No quantities, no prices, no markdown, no explanation. Just the JSON array.`,
            },
          ],
        },
      ],
    }, { signal: AbortSignal.timeout(15_000) })

    const rawText = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
    const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    const parsed = JSON.parse(cleaned) as unknown
    if (!Array.isArray(parsed)) throw new Error('Expected array')
    receiptItems = parsed.filter((x): x is string => typeof x === 'string')
  } catch (err) {
    return NextResponse.json({ error: `Receipt parsing failed: ${String(err)}` }, { status: 500 })
  }

  // Match receipt items to cart items
  const matches: ReceiptMatch[] = []
  const matchedCartIds = new Set<string>()

  for (const receiptName of receiptItems) {
    for (const cartItem of items) {
      if (matchedCartIds.has(cartItem.id)) continue
      if (fuzzyMatch(receiptName, cartItem.name)) {
        matches.push({ cartItemId: cartItem.id, cartItemName: cartItem.name, receiptName, quantity: cartItem.quantity ?? null, unit: cartItem.unit ?? null })
        matchedCartIds.add(cartItem.id)
        break
      }
    }
  }

  return NextResponse.json({ matches })
}
