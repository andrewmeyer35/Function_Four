// Goal definitions, weekly-window helpers, and progress computation.
// Week = Saturday (day 1) through Friday (day 7).
import { format, startOfWeek, addDays } from 'date-fns'
import type { FCategory } from '@shared/types'

// ── Week helpers (Sat-Fri) ────────────────────────────────────────────────────

/** Return the ISO date string for the Saturday that starts the week containing `date`. */
export function getWeekStartSat(date: Date = new Date()): string {
  const sat = startOfWeek(date, { weekStartsOn: 6 }) // 6 = Saturday
  return format(sat, 'yyyy-MM-dd')
}

/** Return all 7 dates in the Sat-Fri week that starts on `weekStart`. */
export function getWeekDays(weekStart: string): Date[] {
  const base = new Date(weekStart + 'T00:00:00')
  return Array.from({ length: 7 }, (_, i) => addDays(base, i))
}

/** Short label for a day column: "Sat", "Sun", … "Fri" */
export const DAY_LABELS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const

/** "Day N of 7" for today within the current Sat-Fri week. */
export function dayOfWeek(date: Date = new Date()): number {
  const wStart = new Date(getWeekStartSat(date) + 'T00:00:00')
  const diff = Math.floor((date.getTime() - wStart.getTime()) / 86_400_000)
  return Math.max(0, Math.min(6, diff)) + 1
}

// ── Goal catalogue ────────────────────────────────────────────────────────────

export type GoalOption = {
  key: string          // matches a column in daily_logs
  category: FCategory
  label: string
  emoji: string
  unit: string         // e.g. "days", "sessions", "meals"
  defaultTarget: number
  maxTarget: number
}

export const GOAL_OPTIONS: GoalOption[] = [
  // Financial
  { key: 'saved_toward_goal', category: 'financial', label: 'Save toward goal',         emoji: '💰', unit: 'days',     defaultTarget: 5, maxTarget: 7  },
  { key: 'no_impulse_spend',  category: 'financial', label: 'Avoid impulse spending',   emoji: '🚫', unit: 'days',     defaultTarget: 5, maxTarget: 7  },
  { key: 'meals_ate_in',      category: 'financial', label: 'Cook / eat at home',        emoji: '🏠', unit: 'days',     defaultTarget: 5, maxTarget: 7  },

  // Fitness
  { key: 'worked_out',        category: 'fitness',   label: 'Work out',                  emoji: '💪', unit: 'sessions', defaultTarget: 4, maxTarget: 7  },
  { key: 'sleep_7plus',       category: 'fitness',   label: 'Sleep 7+ hours',            emoji: '😴', unit: 'nights',   defaultTarget: 5, maxTarget: 7  },
  { key: 'good_nutrition',    category: 'fitness',   label: 'Eat clean or balanced',     emoji: '🥗', unit: 'days',     defaultTarget: 4, maxTarget: 7  },

  // Fun / Friends
  { key: 'had_social_activity', category: 'fun',    label: 'Social activity',            emoji: '🎉', unit: 'times',    defaultTarget: 3, maxTarget: 7  },
  { key: 'quality_connection',  category: 'fun',    label: 'Meaningful connection',      emoji: '🤝', unit: 'times',    defaultTarget: 2, maxTarget: 7  },

  // Flirt / Fervier
  { key: 'dating_activity',  category: 'flirt',    label: 'Dating / romantic activity', emoji: '💘', unit: 'times',    defaultTarget: 2, maxTarget: 7  },
  { key: 'self_care',         category: 'flirt',    label: 'Self care / glow up',        emoji: '✨', unit: 'days',     defaultTarget: 3, maxTarget: 7  },
]

export const GOAL_BY_KEY = Object.fromEntries(GOAL_OPTIONS.map((g) => [g.key, g]))

// ── Stored goal type (mirrors DB row) ─────────────────────────────────────────

export type UserGoal = {
  id: string
  user_id: string
  category: FCategory
  metric_key: string
  label: string
  target: number
  is_active: boolean
}

// ── Daily log type (mirrors DB row) ──────────────────────────────────────────

export type DailyLog = {
  id?: string
  user_id?: string
  log_date: string      // 'YYYY-MM-DD'
  week_start: string    // 'YYYY-MM-DD' — a Saturday
  saved_toward_goal?: boolean | null
  no_impulse_spend?: boolean | null
  meals_ate_in?: boolean | null
  worked_out?: boolean | null
  sleep_7plus?: boolean | null
  good_nutrition?: boolean | null
  had_social_activity?: boolean | null
  quality_connection?: boolean | null
  dating_activity?: boolean | null
  self_care?: boolean | null
  workout_intensity?: number | null  // 1-7 scale
  workout_distance?: number | null   // km or miles
  notes?: string | null
}

// ── Progress helpers ──────────────────────────────────────────────────────────

/** Count how many days in the week the given metric was logged as true. */
export function weeklyCount(
  metricKey: string,
  logs: DailyLog[]
): number {
  return logs.filter((l) => l[metricKey as keyof DailyLog] === true).length
}

/** 0-100 score for a category based on its active goals and weekly progress. */
export function categoryScore(
  category: FCategory,
  goals: UserGoal[],
  logs: DailyLog[]
): number {
  const active = goals.filter((g) => g.category === category && g.is_active)
  if (active.length === 0) return 0
  const total = active.reduce((sum, g) => {
    const achieved = Math.min(weeklyCount(g.metric_key, logs), g.target)
    return sum + achieved / g.target
  }, 0)
  return Math.round((total / active.length) * 100)
}
