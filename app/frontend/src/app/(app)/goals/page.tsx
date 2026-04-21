import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { GoalSetter } from '@/components/ui/GoalSetter'
import type { UserGoal } from '@/lib/goals'

export default async function GoalsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: goalsRaw } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('category')

  const goals = (goalsRaw ?? []) as UserGoal[]

  return (
    <main className="max-w-2xl mx-auto px-4 pt-5 pb-24 md:pb-10 md:px-8 md:pt-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Goals</h1>
        <p className="text-sm text-gray-500 mt-1">
          Set your weekly targets for each pillar. Week runs Saturday through Friday.
        </p>
      </div>

      <GoalSetter initialGoals={goals} />
    </main>
  )
}
