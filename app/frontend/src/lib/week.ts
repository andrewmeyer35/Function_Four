import { startOfWeek, format, addWeeks, subWeeks } from 'date-fns'

/**
 * Get the ISO date string for the Monday of the week containing `date`.
 * This is used as the canonical weekStart key for check-ins.
 */
export function getWeekStart(date: Date = new Date()): string {
  const monday = startOfWeek(date, { weekStartsOn: 1 })
  return format(monday, 'yyyy-MM-dd')
}

export function getWeekLabel(weekStart: string): string {
  const date = new Date(weekStart + 'T00:00:00')
  const now = new Date()
  const thisWeek = getWeekStart(now)
  const lastWeek = getWeekStart(subWeeks(now, 1))

  if (weekStart === thisWeek) return 'This week'
  if (weekStart === lastWeek) return 'Last week'
  return format(date, 'MMM d')
}
