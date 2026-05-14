// Unit normalization for ingredient aggregation across recipes.
// Converts common cooking units to a base unit within each dimension
// so quantities can be summed across meals correctly.

export type Dimension = 'volume' | 'weight' | 'count' | 'unknown'

interface NormEntry {
  dimension: Dimension
  toBase: number  // multiply by this to get base unit
  baseUnit: string
}

// Base units: ml (volume), g (weight), piece (count)
const UNIT_MAP: Record<string, NormEntry> = {
  // Volume
  ml:    { dimension: 'volume', toBase: 1,       baseUnit: 'ml' },
  mL:    { dimension: 'volume', toBase: 1,       baseUnit: 'ml' },
  l:     { dimension: 'volume', toBase: 1000,    baseUnit: 'ml' },
  L:     { dimension: 'volume', toBase: 1000,    baseUnit: 'ml' },
  liter: { dimension: 'volume', toBase: 1000,    baseUnit: 'ml' },
  litre: { dimension: 'volume', toBase: 1000,    baseUnit: 'ml' },
  tsp:   { dimension: 'volume', toBase: 4.929,   baseUnit: 'ml' },
  tbsp:  { dimension: 'volume', toBase: 14.787,  baseUnit: 'ml' },
  'fl oz': { dimension: 'volume', toBase: 29.574, baseUnit: 'ml' },
  cup:   { dimension: 'volume', toBase: 236.588, baseUnit: 'ml' },
  cups:  { dimension: 'volume', toBase: 236.588, baseUnit: 'ml' },
  pt:    { dimension: 'volume', toBase: 473.176, baseUnit: 'ml' },
  pint:  { dimension: 'volume', toBase: 473.176, baseUnit: 'ml' },
  qt:    { dimension: 'volume', toBase: 946.353, baseUnit: 'ml' },
  quart: { dimension: 'volume', toBase: 946.353, baseUnit: 'ml' },
  gal:   { dimension: 'volume', toBase: 3785.41, baseUnit: 'ml' },
  gallon:{ dimension: 'volume', toBase: 3785.41, baseUnit: 'ml' },

  // Weight
  g:     { dimension: 'weight', toBase: 1,       baseUnit: 'g' },
  gram:  { dimension: 'weight', toBase: 1,       baseUnit: 'g' },
  grams: { dimension: 'weight', toBase: 1,       baseUnit: 'g' },
  kg:    { dimension: 'weight', toBase: 1000,    baseUnit: 'g' },
  oz:    { dimension: 'weight', toBase: 28.3495, baseUnit: 'g' },
  lb:    { dimension: 'weight', toBase: 453.592, baseUnit: 'g' },
  lbs:   { dimension: 'weight', toBase: 453.592, baseUnit: 'g' },
  pound: { dimension: 'weight', toBase: 453.592, baseUnit: 'g' },
  pounds:{ dimension: 'weight', toBase: 453.592, baseUnit: 'g' },

  // Count
  piece:  { dimension: 'count', toBase: 1, baseUnit: 'piece' },
  pieces: { dimension: 'count', toBase: 1, baseUnit: 'piece' },
  clove:  { dimension: 'count', toBase: 1, baseUnit: 'clove' },
  cloves: { dimension: 'count', toBase: 1, baseUnit: 'clove' },
  head:   { dimension: 'count', toBase: 1, baseUnit: 'head' },
  can:    { dimension: 'count', toBase: 1, baseUnit: 'can' },
  cans:   { dimension: 'count', toBase: 1, baseUnit: 'can' },
  slice:  { dimension: 'count', toBase: 1, baseUnit: 'slice' },
  slices: { dimension: 'count', toBase: 1, baseUnit: 'slice' },
  bunch:  { dimension: 'count', toBase: 1, baseUnit: 'bunch' },
  stalk:  { dimension: 'count', toBase: 1, baseUnit: 'stalk' },
  stalks: { dimension: 'count', toBase: 1, baseUnit: 'stalk' },
  sprig:  { dimension: 'count', toBase: 1, baseUnit: 'sprig' },
  sprigs: { dimension: 'count', toBase: 1, baseUnit: 'sprig' },
}

function lookupUnit(unit: string | null): NormEntry | null {
  if (!unit) return null
  return UNIT_MAP[unit.trim()] ?? UNIT_MAP[unit.trim().toLowerCase()] ?? null
}

// Convert a base-unit value back to a human-friendly display unit
function friendlyUnit(baseVal: number, baseUnit: string): { qty: number; unit: string } {
  if (baseUnit === 'ml') {
    if (baseVal >= 1000) return { qty: parseFloat((baseVal / 1000).toFixed(2)), unit: 'L' }
    if (baseVal >= 240) return { qty: parseFloat((baseVal / 236.588).toFixed(1)), unit: 'cups' }
    if (baseVal >= 15) return { qty: parseFloat((baseVal / 14.787).toFixed(1)), unit: 'tbsp' }
    return { qty: parseFloat(baseVal.toFixed(0)), unit: 'ml' }
  }
  if (baseUnit === 'g') {
    if (baseVal >= 1000) return { qty: parseFloat((baseVal / 1000).toFixed(2)), unit: 'kg' }
    if (baseVal >= 454) return { qty: parseFloat((baseVal / 453.592).toFixed(1)), unit: 'lbs' }
    return { qty: parseFloat(baseVal.toFixed(0)), unit: 'g' }
  }
  return { qty: parseFloat(baseVal.toFixed(2)), unit: baseUnit }
}

export interface RawIngredient {
  name: string
  quantity: number | null
  unit: string | null
}

export interface NormalizedIngredient {
  name: string
  quantity: number | null
  unit: string | null
  dimension: Dimension
}

// Aggregate a list of ingredients (possibly from multiple recipes), combining
// same-name same-dimension items into one entry.
export function aggregateIngredients(ingredients: RawIngredient[]): NormalizedIngredient[] {
  // Group by lowercased name
  const byName = new Map<string, { qty: number | null; baseUnit: string; dimension: Dimension; origUnit: string | null }[]>()

  for (const ing of ingredients) {
    const key = ing.name.toLowerCase().trim()
    const entry = lookupUnit(ing.unit)
    const group = byName.get(key) ?? []

    if (ing.quantity != null && entry) {
      const baseQty = ing.quantity * entry.toBase
      group.push({ qty: baseQty, baseUnit: entry.baseUnit, dimension: entry.dimension, origUnit: ing.unit })
    } else {
      group.push({ qty: ing.quantity, baseUnit: ing.unit ?? '', dimension: 'unknown', origUnit: ing.unit })
    }
    byName.set(key, group)
  }

  const result: NormalizedIngredient[] = []

  for (const [name, entries] of byName) {
    // Group sub-entries by baseUnit (can't combine volume + weight)
    const byBase = new Map<string, typeof entries>()
    for (const e of entries) {
      const list = byBase.get(e.baseUnit) ?? []
      list.push(e)
      byBase.set(e.baseUnit, list)
    }

    for (const [baseUnit, group] of byBase) {
      const allKnown = group.every((e) => e.qty != null)
      if (allKnown) {
        const total = group.reduce((sum, e) => sum + (e.qty ?? 0), 0)
        const dim = group[0].dimension
        if (dim === 'volume' || dim === 'weight') {
          const { qty, unit } = friendlyUnit(total, baseUnit)
          result.push({ name, quantity: qty, unit, dimension: dim })
        } else {
          result.push({ name, quantity: total, unit: baseUnit || null, dimension: dim })
        }
      } else {
        result.push({ name, quantity: null, unit: group[0].origUnit, dimension: group[0].dimension })
      }
    }
  }

  return result
}