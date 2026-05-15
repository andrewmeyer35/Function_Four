// Sat→Fri week: returns local YYYY-MM-DD of the most recent Saturday
export function getWeekStart(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun … 6=Sat
  const diffToSat = day === 6 ? 0 : -(day + 1)
  d.setDate(d.getDate() + diffToSat)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const n = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${n}`
}
