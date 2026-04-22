import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import * as cheerio from 'cheerio'
import type { RecipeJSON, RecipeIngredient, RecipeStep } from '@/lib/meals/types'

// ─── ISO 8601 duration parser (PT1H30M → 90) ─────────────────────────────────

function parseIsoDuration(iso: string | null | undefined): number | null {
  if (!iso) return null
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return null
  return (parseInt(m[1] ?? '0') * 60) + parseInt(m[2] ?? '0')
}

function parseServings(val: unknown): number | null {
  if (val == null) return null
  const n = parseInt(String(val))
  return isNaN(n) ? null : n
}

// Very basic ingredient string parser — "2 cups flour, sifted"
function parseIngredient(raw: string): RecipeIngredient {
  const trimmed = raw.trim()
  // Match: optional-number optional-unit rest, optional-preparation
  const m = trimmed.match(/^([\d.\/]+)?\s*([a-zA-Z]+)?\s+(.+?)(?:,\s*(.+))?$/)
  if (m && m[3]) {
    const qty = m[1] ? parseFloat(m[1]) : null
    return {
      name: m[3].trim(),
      quantity: qty,
      unit: (qty != null && m[2]) ? m[2] : null,
      preparation: m[4]?.trim() ?? null,
      isOptional: /\boptional\b/i.test(raw),
    }
  }
  return { name: trimmed, quantity: null, unit: null, preparation: null, isOptional: false }
}

function mapJsonLdToRecipe(ld: Record<string, unknown>): RecipeJSON {
  const ingredients: RecipeIngredient[] = Array.isArray(ld.recipeIngredient)
    ? (ld.recipeIngredient as string[]).map(parseIngredient)
    : []

  const steps: RecipeStep[] = []
  const instructions = ld.recipeInstructions
  if (Array.isArray(instructions)) {
    instructions.forEach((step: unknown, i: number) => {
      if (typeof step === 'string') {
        steps.push({ stepNumber: i + 1, instruction: step.trim() })
      } else if (step && typeof step === 'object') {
        const s = step as Record<string, unknown>
        const text = String(s.text ?? s.name ?? '').trim()
        if (text) steps.push({ stepNumber: i + 1, instruction: text })
      }
    })
  }

  const title = String(ld.name ?? '').trim()

  const rawTags: string[] = []
  if (typeof ld.keywords === 'string') {
    rawTags.push(...ld.keywords.split(',').map((s) => s.trim()).filter(Boolean))
  } else if (Array.isArray(ld.keywords)) {
    rawTags.push(...(ld.keywords as string[]))
  }
  if (typeof ld.recipeCategory === 'string') rawTags.push(ld.recipeCategory)
  else if (Array.isArray(ld.recipeCategory)) rawTags.push(...(ld.recipeCategory as string[]))

  return {
    title,
    servings: parseServings(ld.recipeYield),
    cookTimeMinutes: parseIsoDuration(ld.cookTime as string | undefined),
    prepTimeMinutes: parseIsoDuration(ld.prepTime as string | undefined),
    sourceText: title.slice(0, 100),
    ingredients,
    steps,
    tags: [...new Set(rawTags.filter(Boolean))],
  }
}

// ─── LLM fallback ─────────────────────────────────────────────────────────────

async function extractWithLLM(pageText: string, url: string): Promise<RecipeJSON> {
  const client = new Anthropic()
  const truncated = pageText.slice(0, 8000)

  const msg = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Extract the recipe from this web page text and return ONLY a valid JSON object.

Required shape:
{
  "title": string,
  "servings": number | null,
  "cookTimeMinutes": number | null,
  "prepTimeMinutes": number | null,
  "sourceText": string,
  "ingredients": [{ "name": string, "quantity": number | null, "unit": string | null, "preparation": string | null, "isOptional": boolean }],
  "steps": [{ "stepNumber": number, "instruction": string }],
  "tags": string[]
}

Return ONLY the JSON object. No markdown fences, no explanation.

Page URL: ${url}

Page text:
${truncated}`,
      },
    ],
  })

  const rawText = msg.content[0].type === 'text' ? msg.content[0].text : ''
  const cleaned = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()

  return JSON.parse(cleaned) as RecipeJSON
}

// ─── Route handler ─────────────────────────────────────────────────────────────

// GET /api/recipe-import/from-url?url=https://...
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rawUrl = req.nextUrl.searchParams.get('url')
  if (!rawUrl) return NextResponse.json({ error: 'Missing url param' }, { status: 400 })

  let targetUrl: URL
  try {
    targetUrl = new URL(rawUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }
  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 })
  }

  // Fetch page HTML
  let html: string
  try {
    const res = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FourFsApp/1.0; recipe-importer)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch page (HTTP ${res.status})` }, { status: 422 })
    }
    html = await res.text()
  } catch (err) {
    return NextResponse.json({ error: `Could not reach URL: ${String(err)}` }, { status: 422 })
  }

  const $ = cheerio.load(html)

  // Attempt JSON-LD extraction
  let recipe: RecipeJSON | null = null
  let method: 'url_jsonld' | 'url_llm' = 'url_jsonld'
  let confidence = 0.95

  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipe) return // already found
    try {
      const json = JSON.parse($(el).html() ?? 'null')
      const candidates: Record<string, unknown>[] = []

      if (Array.isArray(json)) {
        candidates.push(...json)
      } else if (json && typeof json === 'object' && Array.isArray(json['@graph'])) {
        candidates.push(...(json['@graph'] as Record<string, unknown>[]))
      } else if (json && typeof json === 'object') {
        candidates.push(json as Record<string, unknown>)
      }

      for (const c of candidates) {
        const type = c['@type']
        const isRecipe =
          type === 'Recipe' || (Array.isArray(type) && (type as string[]).includes('Recipe'))
        if (isRecipe) {
          recipe = mapJsonLdToRecipe(c)
          return false // break cheerio each
        }
      }
    } catch {
      // Malformed JSON-LD — skip
    }
  })

  // Fall back to LLM if JSON-LD missing or has no ingredients
  if (!recipe || (recipe as RecipeJSON).ingredients.length === 0) {
    method = 'url_llm'
    confidence = 0.75
    const pageText = $('body').text().replace(/\s+/g, ' ').trim()

    try {
      recipe = await extractWithLLM(pageText, rawUrl)
    } catch (err) {
      return NextResponse.json(
        { error: `Could not extract recipe automatically. ${String(err)}` },
        { status: 500 }
      )
    }
  }

  return NextResponse.json({ recipe, method, confidence })
}
