import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { BottomNav } from '@/components/ui/BottomNav'
import { BoardClient } from '@/components/ui/BoardClient'
import { getWeekStartSat, categoryScore, type UserGoal, type DailyLog } from '@/lib/goals'
import { F_CATEGORIES } from '@shared/types'

type Member = { id: string; name: string | null; email: string }

export default async function BoardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get household
  const { data: memberships } = await supabase
    .from('household_members')
    .select('household:households(*)')
    .eq('user_id', user.id)
    .limit(1)

  if (!memberships || memberships.length === 0) redirect('/onboarding')

  const household = memberships[0].household as unknown as {
    id: string
    name: string
    invite_code: string
  }

  // Get all household members
  const { data: membersRaw } = await supabase
    .from('household_members')
    .select('user:users(id, name, email)')
    .eq('household_id', household.id)

  const members: Member[] = ((membersRaw ?? []) as any[])
    .map((m) => m.user)
    .filter(Boolean)

  const weekStart = getWeekStartSat()

  // For each member, fetch their goals and this week's logs in parallel
  const memberData = await Promise.all(
    members.map(async (member) => {
      const [{ data: goalsRaw }, { data: logsRaw }] = await Promise.all([
        supabase
          .from('user_goals')
          .select('*')
          .eq('user_id', member.id)
          .eq('is_active', true),
        supabase
          .from('daily_logs')
          .select('*')
          .eq('user_id', member.id)
          .eq('week_start', weekStart),
      ])

      const goals = (goalsRaw ?? []) as UserGoal[]
      const logs = (logsRaw ?? []) as DailyLog[]

      // Compute per-category scores
      const catScores = Object.fromEntries(
        F_CATEGORIES.map((f) => [f.key, categoryScore(f.key, goals, logs)])
      ) as Record<string, number>

      // Overall weekly completion
      const totalPossible = goals.reduce((s, g) => s + g.target, 0)
      const totalDone = goals.reduce((s, g) => {
        const count = logs.filter((l) => l[g.metric_key as keyof DailyLog] === true).length
        return s + Math.min(count, g.target)
      }, 0)
      const overallPct = totalPossible >= 1 ? Math.round((totalDone / totalPossible) * 100) : 0

      // Goals hit (count >= target)
      const goalsHit = goals.filter((g) => {
        const count = logs.filter((l) => l[g.metric_key as keyof DailyLog] === true).length
        return count >= g.target
      }).length

      // Avg workout intensity this week (days where worked_out is true)
      const workoutLogs = logs.filter((l) => l.worked_out === true && l.workout_intensity != null)
      const avgIntensity = workoutLogs.length >= 1
        ? Math.round(
            workoutLogs.reduce((s, l) => s + (l.workout_intensity ?? 0), 0) / workoutLogs.length * 10
          ) / 10
        : null

      // Total workout distance this week
      const totalDistance = logs.reduce((s, l) => s + (l.workout_distance ?? 0), 0)

      return {
        member,
        goals,
        catScores,
        overallPct,
        goalsHit,
        totalGoals: goals.length,
        avgIntensity,
        totalDistance: totalDistance > 0 ? Math.round(totalDistance * 10) / 10 : null,
        isCurrentUser: member.id === user.id,
      }
    })
  )

  // Sort by overallPct descending
  memberData.sort((a, b) => b.overallPct - a.overallPct)

  return (
    <>
      <main className="px-4 pt-5 pb-24 md:pb-10 md:px-8 md:pt-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Board</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Weekly goal progress - {household.name}
          </p>
        </div>

        <BoardClient
          memberData={memberData}
          weekStart={weekStart}
          inviteCode={household.invite_code}
        />
      </main>
      <BottomNav />
    </>
  )
}
