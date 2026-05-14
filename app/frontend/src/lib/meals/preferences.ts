// ─── User Preferences Types ───────────────────────────────────────────────

export type DietaryRestriction =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-free'
  | 'shellfish-free'
  | 'halal'
  | 'kosher'

export type CuisinePreference =
  | 'italian'
  | 'asian'
  | 'mexican'
  | 'mediterranean'
  | 'american'
  | 'indian'
  | 'middle-eastern'
  | 'french'
  | 'greek'
  | 'japanese'

export type CookingTime = 'quick' | 'medium' | 'elaborate'

export interface UserPreferences {
  id: string
  user_id: string
  dietary_restrictions: DietaryRestriction[]
  disliked_ingredients: string[]
  cuisine_preferences: CuisinePreference[]
  household_size: number
  weekly_cooking_time: CookingTime
  default_servings: number
  created_at: string
  updated_at: string
}

// ─── UI Option Arrays ─────────────────────────────────────────────────────

export const DIETARY_OPTIONS: { value: DietaryRestriction; label: string }[] = [
  { value: 'vegetarian',    label: 'Vegetarian' },
  { value: 'vegan',         label: 'Vegan' },
  { value: 'gluten-free',   label: 'Gluten-free' },
  { value: 'dairy-free',    label: 'Dairy-free' },
  { value: 'nut-free',      label: 'Nut-free' },
  { value: 'shellfish-free', label: 'Shellfish-free' },
  { value: 'halal',         label: 'Halal' },
  { value: 'kosher',        label: 'Kosher' },
]

export const CUISINE_OPTIONS: { value: CuisinePreference; label: string }[] = [
  { value: 'italian',        label: 'Italian' },
  { value: 'asian',          label: 'Asian' },
  { value: 'mexican',        label: 'Mexican' },
  { value: 'mediterranean',  label: 'Mediterranean' },
  { value: 'american',       label: 'American' },
  { value: 'indian',         label: 'Indian' },
  { value: 'middle-eastern', label: 'Middle Eastern' },
  { value: 'french',         label: 'French' },
  { value: 'greek',          label: 'Greek' },
  { value: 'japanese',       label: 'Japanese' },
]