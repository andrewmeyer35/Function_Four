// ─── Meal Photo / Vision ──────────────────────────────────────────────────

export type QuantityConfidence = 'high' | 'medium' | 'low'

export interface ExtractedIngredient {
  name: string
  estimatedQuantity: number | null
  unit: string | null
  quantityConfidence: QuantityConfidence
  alternatives: string[]
  isOptionalGarnish: boolean
}

export interface MealPhotoAnalysis {
  dish: string
  dishConfidence: number      // 0.0 – 1.0
  cuisine: string | null
  estimatedServings: number
  ingredients: ExtractedIngredient[]
  uncertaintyNotes: string | null
}

// ─── Pantry Matching ──────────────────────────────────────────────────────

export type MatchMethod = 'exact' | 'fuzzy' | 'alias' | 'none'

export interface PantryItem {
  id: string
  name: string
  aliases: string[]
  quantity: number
  unit: string
  expirationDate: string | null
  category: string
}

export interface PantryMatchResult {
  extractedIngredient: ExtractedIngredient
  pantryItemId: string | null
  pantryItemName: string | null
  matchConfidence: number       // 0.0 – 1.0
  matchMethod: MatchMethod
  suggestedDeductionQuantity: number | null
  suggestedDeductionUnit: string | null
}

// ─── Recipe ───────────────────────────────────────────────────────────────

export interface RecipeIngredient {
  name: string
  quantity: number | null
  unit: string | null
  preparation: string | null   // "diced", "minced", etc.
  isOptional: boolean
}

export interface RecipeStep {
  stepNumber: number
  instruction: string
}

export interface RecipeJSON {
  title: string
  servings: number | null
  cookTimeMinutes: number | null
  prepTimeMinutes: number | null
  sourceText: string           // first 100 chars for attribution
  ingredients: RecipeIngredient[]
  steps: RecipeStep[]
  tags: string[]
}

// ─── Recipe Import ────────────────────────────────────────────────────────

export type RecipeImportSourceType =
  | 'url_jsonld'
  | 'url_llm'
  | 'screenshot_ocr'
  | 'manual_entry'

export type RecipeImportStatus = 'draft' | 'confirmed' | 'abandoned'

export interface PantryDeduction {
  pantryItemId: string
  quantity: number
  unit: string
  status: 'pending' | 'confirmed' | 'skipped'
}

export interface CartItem {
  ingredientName: string
  quantity: number
  unit: string
  instacartSearchQuery: string
}

export interface RecipeImport {
  id: string
  householdId: string
  userId: string
  sourceUrl: string | null
  sourceType: RecipeImportSourceType
  sourceImageUrl: string | null
  recipe: RecipeJSON
  extractionConfidence: number
  pantryDeductions: PantryDeduction[]
  cartItems: CartItem[]
  status: RecipeImportStatus
  createdAt: string
  confirmedAt: string | null
}

// ─── Meal Suggestions ─────────────────────────────────────────────────────

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface MealSuggestion {
  rank: number
  dishName: string
  cuisine: string
  cookTimeMinutes: number
  whyNow: string
  keyIngredients: string[]
  missingIngredients: Array<{ name: string; quantity: number; unit: string }>
  pantryMatchPercent: number
  difficultyLevel: DifficultyLevel
  spoonacularId?: number
}

// ─── User Preferences ─────────────────────────────────────────────────────

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'gluten_free'
  | 'dairy_free'
  | 'nut_free'
  | 'halal'
  | 'kosher'
  | 'low_carb'
  | 'keto'
  | 'paleo'

export interface InferredFavorite {
  dishName: string
  frequency: number
  lastCooked: string | null
}

export interface InferredIngredientPreference {
  ingredientName: string
  usageScore: number  // 0–1
}

export interface MealPreferenceProfile {
  id: string
  userId: string
  householdId: string
  dietaryRestrictions: DietaryRestriction[]
  allergens: string[]
  preferredCuisines: string[]
  dislikedIngredients: string[]
  maxCookTimeMinutes: number | null
  servingSize: number
  inferredFavorites: InferredFavorite[]
  inferredIngredientPreferences: InferredIngredientPreference[]
  onboardingCompletedAt: string | null
  updatedAt: string
}
