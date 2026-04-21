// Pure helpers for weekly life score, member streaks, and the household leaderboard.
// Kept DB-shape-aware (snake_case) because the household feed query reads rows directly.
import { subWeeks, format, startOfWeek } from 'date-fns'

export type CheckinRow = {
  user_id: string
  week_start: string
  financial_score: number | null
  fitness_score: number | null
  fun_score: number | null
  flirt_score: number | null
  financial_tags: string[] | null
  fitness_tags: string[] | null
  fun_tags: string[] | null
  flirt_tags: string[] | null
}

/** Sum of the four F scores, skipped = 0, for a single check-in row. */
export function rowLifeScore(c: CheckinRow): number {
  return (
    (c.financial_score ?? 0) +
    (c.fitness_score ?? 0) +
    (c.fun_score ?? 0) +
    (c.flirt_score ?? 0)
  )
}

/** Has the user engaged with this F (tagged it or scored it)? Skipped doesn't count. */
export function rowActiveFs(c: CheckinRow): number {
  let n = 0
  if (c.financial_score !== null) n++
  if (c.fitness_score !== null) n++
  if (c.fun_score !== null) n++
  if (c.flirt_score !== null) n++
  return n
}

function mondayOf(date: Date): string {
  return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

/**
 * Streak = number of consecutive weeks ending with the current week in which
 * the user scored at least one F (i.e. any non-null score). If the user hasn't
 * submitted this week yet, we tolerate that and count from last week back.
 */
export function streakForUser(userId: string, rows: CheckinRow[], today: Date = new Date()): number {
  const userRows = rows.filter((r) => r.user_id === userId && rowActiveFs(r) > 0)
  if (userRows.length === 0) return 0
  const weeks = new Set(userRows.map((r) => r.week_start))

  const thisWeek = mondayOf(today)
  let cursor = weeks.has(thisWeek) ? today : subWeeks(today, 1)
  let streak = 0
  // Walk backwards while the week is present.
  // Cap at 104 weeks to avoid pathological loops.
  for (let i = 0; i < 104; i++) {
    const wk = mondayOf(cursor)
    if (weeks.has(wk)) {
      streak++
      cursor = subWeeks(cursor, 1)
    } else {
      break
    }
  }
  return streak
}

export type LeaderboardEntry = {
  userId: string
  name: string
  email: string
  thisWeekScore: number
  streak: number
  activeFs: number
}

/** Build a leaderboard for the household's current week, tiebroken by streak then active Fs. */
export function buildLeaderboard(
  members: { id: string; name: string | null; email: string }[],
  rows: CheckinRow[],
  currentWeekStart: string,
  today: Date = new Date()
): LeaderboardEntry[] {
  const byUser = new Map<string, CheckinRow>()
  for (const r of rows) {
    if (r.week_start === currentWeekStart) byUser.set(r.user_id, r)
  }
  return members
    .map<LeaderboardEntry>((m) => {
      const thisRow = byUser.get(m.id)
      return {
        userId: m.id,
        name: m.name ?? m.email,
        email: m.email,
        thisWeekScore: thisRow ? rowLifeScore(thisRow) : 0,
        streak: streakForUser(m.id, rows, today),
        activeFs: thisRow ? rowActiveFs(thisRow) : 0,
      }
    })
    .sort(
      (a, b) =>
        b.thisWeekScore - a.thisWeekScore ||
        b.streak - a.streak ||
        b.activeFs - a.activeFs ||
        a.name.localeCompare(b.name)
    )
}
