import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWeekStartSat, type UserGoal, type DailyLog } from '@/lib/goals'
import { WeeklyTracker } from '@/components/ui/WeeklyTracker'

export default async function LogPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const weekStart = getWeekStartSat()

  const [{ data: goalsRaw }, { data: logsRaw }] = await Promise.all([
    supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('category'),
    supabase
      .from('daily_logs')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start', weekStart),
  ])

  const goals = (goalsRaw ?? []) as UserGoal[]
  const logs = (logsRaw ?? []) as DailyLog[]

  const hasGoals = goals.length >= 1

  return (
    <main className="max-w-2xl mx-auto px-4 pt-5 pb-24 md:pb-10 md:px-8 md:pt-8">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">This week</h1>
        <p className="text-sm text-gray-500 mt-1">
          Saturday → Friday · check off each day as you go
        </p>
      </div>

      {!hasGoals ? (
        <div className="surface-card rounded-2xl px-6 py-10 text-center">
          <p className="text-3xl mb-3">🎯</p>
          <p className="text-base font-semibold text-gray-800">No goals set yet</p>
          <p className="text-sm text-gray-500 mt-1 mb-5">
            Head to the Goals tab to pick what you want to track each week.
          </p>
          <a
            href="/goals"
            className="inline-block px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl tap-scale"
          >
            Set goals →
          </a>
        </div>
      ) : (
        <WeeklyTracker
          weekStart={weekStart}
          goals={goals}
          initialLogs={logs}
        />
      )}
    </main>
  )
}
