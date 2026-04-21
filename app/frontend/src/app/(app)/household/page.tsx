import { redirect } from 'next/navigation'
import { subWeeks, format } from 'date-fns'
import { createClient } from '@/lib/supabase/server'
import { F_CATEGORIES } from '@shared/types'
import { F_THEME } from '@/lib/design'
import {
  getWeekStartSat,
  categoryScore,
  weeklyCount,
  type UserGoal,
  type DailyLog,
} from '@/lib/goals'
import { LifeScoreHero } from '@/components/ui/LifeScoreHero'
import { HomeBreakdown } from '@/components/ui/HomeBreakdown'
import { BottomNav } from '@/components/ui/BottomNav'
import { SignOutButton } from '@/components/features/auth/SignOutButton'

type Member = { id: string; name: string | null; email: string }

// ── helpers ──────────────────────────────────────────────────────────────────

function overallPct(goals: UserGoal[], logs: DailyLog[]): number {
  const possible = goals.reduce((s, g) => s + g.target, 0)
  if (possible === 0) return 0
  const done = goals.reduce((s, g) => {
    const count = logs.filter((l) => l[g.metric_key as keyof DailyLog] === true).length
    return s + Math.min(count, g.target)
  }, 0)
  return Math.round((done / possible) * 100)
}

function goalsHitCount(goals: UserGoal[], logs: DailyLog[]): number {
  return goals.filter((g) => weeklyCount(g.metric_key, logs) >= g.target).length
}

// ── page ─────────────────────────────────────────────────────────────────────

export default async function HouseholdPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Household
  const { data: memberships } = await supabase
    .from('household_members')
    .select('household:households(*)')
    .eq('user_id', user.id)
    .limit(1)

  if (!memberships || memberships.length === 0) redirect('/onboarding')

  const household = memberships[0].household as unknown as {
    id: string; name: string; invite_code: string
  }

  // User profile
  const { data: userRow } = await supabase
    .from('users')
    .select('name, email')
    .eq('id', user.id)
    .maybeSingle()

  const myName = userRow?.name ?? userRow?.email?.split('@')[0] ?? 'You'

  // All household members
  const { data: membersRaw } = await supabase
    .from('household_members')
    .select('user:users(id, name, email)')
    .eq('household_id', household.id)

  const members: Member[] = ((membersRaw ?? []) as any[]).map((m) => m.user).filter(Boolean)

  // Current week
  const weekStart = getWeekStartSat()

  // 7-week history week starts (oldest first)
  const historyWeeks = Array.from({ length: 7 }, (_, i) =>
    getWeekStartSat(subWeeks(new Date(), 6 - i))
  )
  const oldestWeek = historyWeeks[0]

  // My goals + logs (current week + 7-week history)
  const [{ data: myGoalsRaw }, { data: myCurrentLogsRaw }, { data: myHistoryLogsRaw }] =
    await Promise.all([
      supabase.from('user_goals').select('*').eq('user_id', user.id).eq('is_active', true),
      supabase.from('daily_logs').select('*').eq('user_id', user.id).eq('week_start', weekStart),
      supabase
        .from('daily_logs')
        .select('log_date, week_start, ' +
          'saved_toward_goal, no_impulse_spend, meals_ate_in, ' +
          'worked_out, sleep_7plus, good_nutrition, ' +
          'had_social_activity, quality_connection, ' +
          'dating_activity, self_care')
        .eq('user_id', user.id)
        .gte('week_start', oldestWeek),
    ])

  const myGoals = (myGoalsRaw ?? []) as UserGoal[]
  const myCurrentLogs = (myCurrentLogsRaw ?? []) as DailyLog[]
  const myHistoryLogs = (myHistoryLogsRaw ?? []) as unknown as DailyLog[]

  // Per-category scores (0-100)
  const myScores = {
    financial: myGoals.some((g) => g.category === 'financial')
      ? categoryScore('financial', myGoals, myCurrentLogs) : null,
    fitness: myGoals.some((g) => g.category === 'fitness')
      ? categoryScore('fitness', myGoals, myCurrentLogs) : null,
    fun: myGoals.some((g) => g.category === 'fun')
      ? categoryScore('fun', myGoals, myCurrentLogs) : null,
    flirt: myGoals.some((g) => g.category === 'flirt')
      ? categoryScore('flirt', myGoals, myCurrentLogs) : null,
  }

  const myOverallPct = overallPct(myGoals, myCurrentLogs)
  const myGoalsHit = goalsHitCount(myGoals, myCurrentLogs)

  // Best pillar
  const bestPillar = F_CATEGORIES.reduce<{
    label: string; emoji: string; score: number; colorHex: string
  } | null>((best, f) => {
    const score = myScores[f.key as keyof typeof myScores]
    if (score === null) return best
    if (!best || score >= best.score + 1) {
      return { label: f.label, emoji: f.emoji, score, colorHex: F_THEME[f.key].accentHex }
    }
    return best
  }, null)

  // 7-week history (overall %)
  const history: (number | null)[] = historyWeeks.map((ws) => {
    const weekLogs = myHistoryLogs.filter((l) => l.week_start === ws)
    if (weekLogs.length === 0) return null
    return overallPct(myGoals, weekLogs)
  })

  // Streak: consecutive weeks (going back from last week) with any activity
  let streak = 0
  for (let i = 5; i >= 0; i--) {
    const ws = historyWeeks[i]
    const hasActivity = myHistoryLogs.some((l) => l.week_start === ws)
    if (hasActivity) streak++
    else break
  }
  // Also count this week if already active
  if (myCurrentLogs.length >= 1) streak++

  // Leaderboard: all members' current-week progress
  const leaderboardData = await Promise.all(
    members.map(async (member) => {
      if (member.id === user.id) {
        return {
          member,
          pct: myOverallPct,
          goalsHit: myGoalsHit,
          totalGoals: myGoals.length,
          isMe: true,
        }
      }
      const [{ data: gRaw }, { data: lRaw }] = await Promise.all([
        supabase.from('user_goals').select('*').eq('user_id', member.id).eq('is_active', true),
        supabase.from('daily_logs').select('*').eq('user_id', member.id).eq('week_start', weekStart),
      ])
      const g = (gRaw ?? []) as UserGoal[]
      const l = (lRaw ?? []) as DailyLog[]
      return {
        member,
        pct: overallPct(g, l),
        goalsHit: goalsHitCount(g, l),
        totalGoals: g.length,
        isMe: false,
      }
    })
  )
  leaderboardData.sort((a, b) => b.pct - a.pct)

  return (
    <>
      <main className="px-4 pt-5 pb-24 md:pb-10 md:px-8 md:pt-8 max-w-5xl mx-auto">

        {/* Mobile header */}
        <header className="flex items-start justify-between mb-4 md:hidden">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">{myName}</h1>
            <p className="text-[11px] uppercase tracking-[0.16em] text-gray-400 font-medium mt-0.5">
              This week · {household.name}
            </p>
          </div>
          <SignOutButton />
        </header>

        {/* Desktop header */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{myName}</h1>
            <p className="text-sm text-gray-400 mt-0.5">This week · {household.name}</p>
          </div>
          <a
            href="/log"
            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors tap-scale"
          >
            Track today →
          </a>
        </div>

        {/* 2-column grid */}
        <div className="md:grid md:grid-cols-2 md:gap-6 space-y-4 md:space-y-0">

          {/* LEFT: personal hero */}
          <div className="space-y-4">
            <LifeScoreHero
              scores={myScores}
              total={myOverallPct}
              streak={streak}
              goalsHit={myGoalsHit}
              totalGoals={myGoals.length}
              bestPillar={bestPillar}
              weekLabel="This week"
              userName={myName}
              history={history}
            />
          </div>

          {/* RIGHT: leaderboard + breakdown */}
          <div className="space-y-4">

            {/* Leaderboard */}
            <div className="surface-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-900">House leaderboard</h2>
                <span className="text-[11px] text-gray-400">this week</span>
              </div>
              <div className="space-y-1">
                {leaderboardData.map((entry, rank) => {
                  const name = entry.member.name ?? entry.member.email.split('@')[0]
                  const ini = (name[0] ?? '?').toUpperCase()
                  const medal = rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : null
                  return (
                    <div
                      key={entry.member.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${
                        entry.isMe ? 'bg-gray-50 ring-1 ring-gray-200' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span className="w-5 text-center text-xs text-gray-400 flex-shrink-0">
                        {medal ?? rank + 1}
                      </span>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        entry.isMe ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {ini}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                          {entry.isMe && (
                            <span className="text-[10px] text-indigo-500 font-semibold flex-shrink-0">you</span>
                          )}
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-300 transition-all"
                            style={{ width: `${entry.pct}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-sm font-bold text-gray-900 tabular-nums">{entry.pct}%</p>
                        <p className="text-[10px] text-gray-400">{entry.goalsHit}/{entry.totalGoals}</p>
                      </div>
                    </div>
                  )
                })}

                {/* Invite row */}
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-dashed border-gray-200 mt-2">
                  <div className="w-5 text-center text-gray-300 text-sm flex-shrink-0">+</div>
                  <p className="flex-1 text-xs text-gray-400">Invite roommates</p>
                  <span className="text-[11px] font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded-lg flex-shrink-0">
                    {household.invite_code}
                  </span>
                </div>
              </div>
            </div>

            {/* My breakdown */}
            <HomeBreakdown
              goals={myGoals}
              logs={myCurrentLogs}
              userName={myName}
            />

          </div>
        </div>
      </main>

      <BottomNav />
    </>
  )
}
