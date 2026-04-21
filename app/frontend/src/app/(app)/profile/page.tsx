import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'
import { InvitePanel } from '@/components/ui/InvitePanel'

export default async function ProfilePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: userRow }, { data: memberships }] = await Promise.all([
    supabase.from('users').select('name, email').eq('id', user.id).maybeSingle(),
    supabase
      .from('household_members')
      .select('household:households(id, name, invite_code)')
      .eq('user_id', user.id)
      .limit(1),
  ])

  const household = memberships?.[0]?.household as
    | { id: string; name: string; invite_code: string }
    | null
    | undefined

  const userName = userRow?.name ?? userRow?.email?.split('@')[0] ?? 'You'
  const userEmail = userRow?.email ?? ''
  const initial = userName[0].toUpperCase()

  return (
    <>
      <main className="max-w-2xl mx-auto px-4 pt-5 pb-24 md:pb-10 md:px-8 md:pt-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

        {/* User card */}
        <div className="surface-card rounded-2xl px-4 py-4 flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-gray-900 text-white flex items-center justify-center text-lg font-bold flex-shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-base font-bold text-gray-900 truncate">{userName}</p>
            <p className="text-sm text-gray-400 truncate">{userEmail}</p>
          </div>
        </div>

        {/* Household + invite */}
        {household ? (
          <InvitePanel
            householdName={household.name}
            inviteCode={household.invite_code}
          />
        ) : (
          <div className="surface-card rounded-2xl px-4 py-6 text-center">
            <p className="text-sm text-gray-500">Not in a household yet.</p>
            <a
              href="/onboarding"
              className="mt-3 inline-block px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl"
            >
              Create or join one
            </a>
          </div>
        )}
      </main>
      <BottomNav />
    </>
  )
}
