import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PreferencesForm } from '@/components/meals/PreferencesForm'
import type { UserPreferences, CookingTime, DietaryRestriction, CuisinePreference } from '@/lib/meals/preferences'

export const metadata = {
  title: 'Food Preferences — Four Fs',
}

export default async function PreferencesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Query Supabase directly — no need to hit own API route from a server component
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  const fetchError = error?.message ?? null

  const preferences: UserPreferences = data
    ? (data as UserPreferences)
    : {
        id: '',
        user_id: user.id,
        dietary_restrictions: [] as DietaryRestriction[],
        disliked_ingredients: [] as string[],
        cuisine_preferences: [] as CuisinePreference[],
        household_size: 2,
        weekly_cooking_time: 'medium' as CookingTime,
        default_servings: 2,
        created_at: '',
        updated_at: '',
      }

  return (
    <main className="max-w-lg mx-auto px-4 pt-6 pb-24 md:pb-10 md:pt-8">
      <PreferencesForm
        initialPreferences={preferences}
        fetchError={fetchError}
      />
    </main>
  )
}