import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import type { RecipeJSON } from '@/lib/meals/types'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
type AllowedMediaType = (typeof ALLOWED_TYPES)[number]

const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

// POST /api/recipe-import/from-image
// Body: multipart/form-data with field `file` (image)
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
    return NextResponse.json(
      { error: `Unsupported image type: ${file.type}` },
      { status: 400 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  // Upload to Supabase Storage for attribution/audit trail
  const ext = file.type.split('/')[1] ?? 'jpg'
  const storagePath = `${user.id}/recipe-screenshots/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('meal-photos')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  let imageUrl: string | null = null
  if (!uploadError) {
    const { data } = supabase.storage.from('meal-photos').getPublicUrl(storagePath)
    imageUrl = data.publicUrl
  }
  // Non-fatal — continue even if storage upload fails

  // Call Claude vision
  const client = new Anthropic()
  const base64 = buffer.toString('base64')
  const mediaType = file.type as AllowedMediaType

  let recipe: RecipeJSON
  try {
    const msg = await client.messages.create({
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
              text: `This image contains a recipe (screenshot, photo of a recipe card, or handwritten recipe). Extract every detail and return ONLY a valid JSON object.

Required shape:
{
  "title": string,
  "servings": number | null,
  "cookTimeMinutes": number | null,
  "prepTimeMinutes": number | null,
  "sourceText": "From screenshot",
  "ingredients": [{ "name": string, "quantity": number | null, "unit": string | null, "preparation": string | null, "isOptional": boolean }],
  "steps": [{ "stepNumber": number, "instruction": string }],
  "tags": string[]
}

If the image does not contain a recipe, return: { "title": "", "notARecipe": true }

Return ONLY the JSON. No markdown, no explanation.`,
            },
          ],
        },
      ],
    })

    const rawText = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim()

    const parsed = JSON.parse(cleaned) as RecipeJSON & { notARecipe?: boolean }
    if (parsed.notARecipe) {
      return NextResponse.json(
        { error: 'Image does not appear to contain a recipe' },
        { status: 422 }
      )
    }
    recipe = parsed
  } catch (err) {
    return NextResponse.json(
      { error: `Vision extraction failed: ${String(err)}` },
      { status: 500 }
    )
  }

  return NextResponse.json({
    recipe,
    method: 'screenshot_ocr',
    confidence: 0.8,
    imageUrl,
  })
}
