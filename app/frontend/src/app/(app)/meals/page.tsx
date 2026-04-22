import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MealsClient } from '@/components/meals/MealsClient'
import { BottomNav } from '@/components/ui/BottomNav'

export const metadata = {
  title: 'Meals — Four Fs',
}

export default async function MealsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userRow } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', user.id)
    .maybeSingle()

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const userName = userRow?.name ?? userRow?.email?.split('@')[0] ?? 'you'

  return (
    <>
      <Suspense fallback={null}>
        <MealsClient
          userId={user.id}
          householdId={membership?.household_id ?? null}
          userName={userName}
        />
      </Suspense>
      <BottomNav />
    </>
  )
}
