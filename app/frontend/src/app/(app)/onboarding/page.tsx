// First-time screen: create a new household or join an existing one by invite code.
// If the user already has a household, we short-circuit back to the feed.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from './OnboardingForm'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: { invite?: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const invite = searchParams.invite
  if (!user) {
    const next = invite ? `/onboarding?invite=${encodeURIComponent(invite)}` : '/onboarding'
    redirect(`/login?next=${encodeURIComponent(next)}`)
  }

  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)

  if (memberships && memberships.length > 0) redirect('/household')

  const initialCode = searchParams.invite ?? ''

  return <OnboardingForm initialCode={initialCode} />
}
