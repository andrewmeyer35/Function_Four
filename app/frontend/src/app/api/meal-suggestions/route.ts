import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'
import Fuse from 'fuse.js'
import type { RecipeJSON } from '@/lib/meals/types'

interface RecipeRow {
  id: string
  recipe_json: RecipeJSON
  source_type: string
}

interface PantryRow {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  expiration_date: string | null
  min_quantity: number | null
}

interface Suggestion {
  recipeImportId: string | null
  title: string
  reason: string
  expiryIngredients: string[]   // expiring items this recipe uses
  missingIngredients: string[]  // ingredients not in pantry
  cookTimeMinutes: number | null
  servings: number | null
  urgencyScore: number          // 0-1, higher = more urgent (expiry-driven)
}

// GET /api/meal-suggestions
// Returns recipe suggestions prioritizing food waste reduction:
// 1. Score saved recipes by how many expiring pantry items they use
// 2. Use Claude to enrich top candidates with "why now" reasoning
// 3. Also surface any expiring items that have no matching saved recipe
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

  // Fetch pantry
  const pantryQuery = supabase
    .from('pantry_items')
    .select('id, name, quantity, unit, expiration_date, min_quantity')
    .order('name')
  if (householdId) {
    pantryQuery.eq('household_id', householdId)
  } else {
    pantryQuery.eq('user_id', user.id)
  }
  const { data: pantryRows } = await pantryQuery
  const pantry: PantryRow[] = (pantryRows ?? []) as PantryRow[]

  // Identify expiring items (≤7 days) and low-stock items
  const now = Date.now()
  const expiringItems = pantry.filter((p) => {
    if (!p.expiration_date) return false
    const days = Math.ceil((new Date(p.expiration_date).getTime() - now) / 86_400_000)
    return days <= 7
  })
  const lowStockItems = pantry.filter(
    (p) => p.min_quantity != null && (p.quantity ?? 0) <= p.min_quantity
  )

  // Fetch user preferences
  const { data: prefsRow } = await supabase
    .from('user_preferences')
    .select('dietary_restrictions, disliked_ingredients, cuisine_preferences')
    .eq('user_id', user.id)
    .maybeSingle()

  const dietaryRestrictions: string[] = (prefsRow?.dietary_restrictions as string[]) ?? []
  const dislikedIngredients: string[] = ((prefsRow?.disliked_ingredients as string[]) ?? [])
    .filter((d) => typeof d === 'string')
    .map((d) => d.replace(/[`"\\]/g, '').slice(0, 100))
  const cuisinePreferences: string[] = (prefsRow?.cuisine_preferences as string[]) ?? []

  // Fetch saved recipes
  const { data: recipeRows } = await supabase
    .from('recipe_imports')
    .select('id, recipe_json, source_type')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(50)

  const allRecipes: RecipeRow[] = (recipeRows ?? []) as RecipeRow[]

  // Filter out recipes that contain disliked ingredients
  const recipes = dislikedIngredients.length > 0
    ? allRecipes.filter((recipe) => {
        const ings = recipe.recipe_json?.ingredients ?? []
        return !ings.some(
          (ing) =>
            !ing.isOptional &&
            dislikedIngredients.some(
              (d) =>
                ing.name.toLowerCase().includes(d.toLowerCase()) ||
                d.toLowerCase().includes(ing.name.toLowerCase()),
            ),
        )
      })
    : allRecipes

  if (pantry.length === 0 && recipes.length === 0) {
    return NextResponse.json({ suggestions: [], expiringItems: [], lowStockItems: [] })
  }

  // Build pantry name corpus for fuzzy matching
  const pantryCorpus = pantry.map((p) => ({ id: p.id, name: p.name }))
  const fuse = new Fuse(pantryCorpus, { keys: ['name'], threshold: 0.4, includeScore: true })

  // Score each recipe
  const scored = recipes.map((recipe) => {
    const ingredients = recipe.recipe_json?.ingredients ?? []
    let expiryMatches: string[] = []
    let missingIngredients: string[] = []

    for (const ing of ingredients) {
      if (ing.isOptional) continue
      const results = fuse.search(ing.name)
      const best = results[0]

      if (!best || (best.score ?? 1) > 0.4) {
        missingIngredients.push(ing.name)
      } else {
        const pantryItem = pantry.find((p) => p.id === best.item.id)
        if (pantryItem) {
          const isExpiring = expiringItems.some((e) => e.id === pantryItem.id)
          if (isExpiring) expiryMatches.push(pantryItem.name)
        }
      }
    }

    const urgencyScore = ingredients.length > 0
      ? expiryMatches.length / Math.max(ingredients.length * 0.5, 1)
      : 0

    return {
      recipeImportId: recipe.id,
      title: recipe.recipe_json?.title ?? 'Untitled',
      cookTimeMinutes: recipe.recipe_json?.cookTimeMinutes ?? null,
      servings: recipe.recipe_json?.servings ?? null,
      expiryIngredients: expiryMatches,
      missingIngredients,
      urgencyScore: Math.min(1, urgencyScore),
      reason: '',
    } satisfies Suggestion
  })

  // Sort: most expiry-urgent first, then by fewest missing ingredients
  scored.sort((a, b) => {
    if (b.urgencyScore !== a.urgencyScore) return b.urgencyScore - a.urgencyScore
    return a.missingIngredients.length - b.missingIngredients.length
  })

  const topCandidates = scored.slice(0, 5)

  // Claude enrichment — add "why now" reasoning
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (apiKey && (expiringItems.length > 0 || topCandidates.length > 0)) {
    try {
      const client = new Anthropic({ apiKey })
      const pantryContext = expiringItems.length > 0
        ? `Expiring soon (≤7 days): ${expiringItems.map((e) => `${e.name}${e.expiration_date ? ` (exp ${e.expiration_date})` : ''}`).join(', ')}`
        : 'No items expiring this week.'

      const recipeContext = topCandidates.length > 0
        ? topCandidates.map((r, i) =>
            `${i + 1}. "${r.title}" — uses expiring: [${r.expiryIngredients.join(', ') || 'none'}], missing from pantry: [${r.missingIngredients.slice(0, 4).join(', ') || 'none'}]`
          ).join('\n')
        : 'No saved recipes yet.'

      const prefContext = [
        dietaryRestrictions.length > 0 ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}.` : '',
        cuisinePreferences.length > 0 ? `Preferred cuisines: ${cuisinePreferences.join(', ')}.` : '',
      ].filter(Boolean).join(' ')

      const msg = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `You are a helpful meal planning assistant focused on minimizing food waste.
${prefContext ? `\nUser preferences: ${prefContext}` : ''}
Pantry status:
${pantryContext}

Saved recipes (ranked by waste-reduction score):
${recipeContext}

For each recipe listed, write ONE short sentence (max 12 words) explaining why it's a good choice THIS week — focus on which expiring ingredients it uses up or how it minimizes waste. Be specific and practical.

Return ONLY a JSON array of strings in the same order as the recipes. Example: ["Uses up your spinach and feta before they expire.", "Great use of the coconut milk opened earlier."]

Return ONLY the JSON array. No markdown.`,
        }],
      })

      const rawText = msg.content[0].type === 'text' ? msg.content[0].text : '[]'
      const cleaned = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
      const reasons = JSON.parse(cleaned) as string[]

      reasons.forEach((reason, i) => {
        if (topCandidates[i]) topCandidates[i].reason = reason
      })
    } catch {
      // Non-fatal — suggestions still work without AI reasoning
    }
  }

  // Fill in default reasons for any without Claude reasoning
  topCandidates.forEach((s) => {
    if (!s.reason) {
      if (s.expiryIngredients.length > 0) {
        s.reason = `Uses up ${s.expiryIngredients.slice(0, 2).join(' and ')} before it expires.`
      } else if (s.missingIngredients.length === 0) {
        s.reason = 'You have everything in your pantry right now.'
      } else {
        s.reason = `Only missing ${s.missingIngredients.length} ingredient${s.missingIngredients.length !== 1 ? 's' : ''}.`
      }
    }
  })

  return NextResponse.json({
    suggestions: topCandidates,
    expiringItems: expiringItems.map((e) => ({ name: e.name, expiration_date: e.expiration_date })),
    lowStockItems: lowStockItems.map((e) => ({ name: e.name, quantity: e.quantity, unit: e.unit })),
  })
}
