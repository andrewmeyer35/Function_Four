import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import { matchIngredientsToPantry } from '@/lib/meals/matchPantry'
import type { MealPhotoAnalysis, PantryItem } from '@/lib/meals/types'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type AllowedMediaType = (typeof ALLOWED_TYPES)[number]
const MAX_BYTES = 10 * 1024 * 1024

// POST /api/meal-log/analyze-photo
// Accepts multipart/form-data with:
//   file    — image of the meal
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

  // Upload to Supabase Storage
  const ext = file.type.split('/')[1] ?? 'jpg'
  const storagePath = `${user.id}/meal-logs/${Date.now()}.${ext}`
  let photoUrl: string | null = null

  const { error: uploadError } = await supabase.storage
    .from('meal-photos')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (!uploadError) {
    const { data } = supabase.storage.from('meal-photos').getPublicUrl(storagePath)
    photoUrl = data.publicUrl
  }

  // Fetch pantry items (parallel with Claude call would be nice but we need them after)
  const pantryQuery = supabase
    .from('pantry_items')
    .select('id, name, aliases, quantity, unit, expiration_date, category')
    .order('name')

  if (householdId) {
    pantryQuery.eq('household_id', householdId)
  } else {
    pantryQuery.eq('user_id', user.id)
  }

  // Claude vision + pantry fetch in parallel
  const client = new Anthropic()
  const mediaType = file.type as AllowedMediaType
  const base64 = buffer.toString('base64')

  const [visionResult, pantryResult] = await Promise.all([
    client.messages.create({
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
              text: `Analyze this meal photo and return ONLY a valid JSON object.

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
    }),
    pantryQuery,
  ])

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

  // Map DB rows to PantryItem type
  const pantryItems: PantryItem[] = (pantryResult.data ?? []).map((row) => ({
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
