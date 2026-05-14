import Fuse from 'fuse.js'
import type { PantryItem, PantryMatchResult, MatchMethod, ExtractedIngredient } from './types'

interface SimpleIngredient {
  name: string
  quantity: number | null
  unit: string | null
}

// Build a flat corpus from pantry items + their aliases so Fuse can rank across all of them
interface CorpusEntry {
  item: PantryItem
  searchName: string
}

/**
 * Match extracted ingredients against the current pantry using Fuse.js fuzzy search.
 * Returns one PantryMatchResult per ingredient, sorted in the same order as input.
 */
export function matchIngredientsToPantry(
  ingredients: SimpleIngredient[],
  pantryItems: PantryItem[]
): PantryMatchResult[] {
  if (pantryItems.length === 0) {
    return ingredients.map((ing) => emptyMatch(ing))
  }

  const corpus: CorpusEntry[] = pantryItems.flatMap((item) => [
    { item, searchName: item.name },
    ...item.aliases.map((alias) => ({ item, searchName: alias })),
  ])

  const fuse = new Fuse(corpus, {
    keys: ['searchName'],
    threshold: 0.4,        // 0 = exact, 1 = match anything
    includeScore: true,
    ignoreLocation: true,
  })

  return ingredients.map((ing) => {
    const results = fuse.search(ing.name)
    const best = results[0]

    if (!best || best.score == null || best.score > 0.4) {
      return emptyMatch(ing)
    }

    const matchConfidence = parseFloat((1 - best.score).toFixed(3))
    const method: MatchMethod =
      matchConfidence >= 0.95
        ? 'exact'
        : matchConfidence >= 0.7
        ? 'fuzzy'
        : 'alias'

    const extracted: ExtractedIngredient = {
      name: ing.name,
      estimatedQuantity: ing.quantity,
      unit: ing.unit,
      quantityConfidence: matchConfidence >= 0.85 ? 'high' : matchConfidence >= 0.65 ? 'medium' : 'low',
      alternatives: [],
      isOptionalGarnish: false,
    }

    return {
      extractedIngredient: extracted,
      pantryItemId: best.item.item.id,
      pantryItemName: best.item.item.name,
      matchConfidence,
      matchMethod: method,
      suggestedDeductionQuantity: ing.quantity,
      suggestedDeductionUnit: ing.unit ?? best.item.item.unit ?? null,
    } satisfies PantryMatchResult
  })
}

function emptyMatch(ing: SimpleIngredient): PantryMatchResult {
  return {
    extractedIngredient: {
      name: ing.name,
      estimatedQuantity: ing.quantity,
      unit: ing.unit,
      quantityConfidence: 'low',
      alternatives: [],
      isOptionalGarnish: false,
    },
    pantryItemId: null,
    pantryItemName: null,
    matchConfidence: 0,
    matchMethod: 'none',
    suggestedDeductionQuantity: null,
    suggestedDeductionUnit: null,
  }
}
