import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWeekStartSat } from '@/lib/goals'

// GET /api/daily-logs?weekStart=YYYY-MM-DD
// Returns all logs for the current user in the given week
export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('weekStart') ?? getWeekStartSat()

  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .order('log_date')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/daily-logs — upsert one day's log entry
// Body: { log_date, metric_key, value }  — toggles a single field
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { log_date, metric_key, value } = body

  if (!log_date || !metric_key) {
    return NextResponse.json({ error: 'log_date and metric_key are required' }, { status: 400 })
  }

  // Derive week_start (Saturday) for this log_date
  const weekStart = getWeekStartSat(new Date(log_date + 'T12:00:00'))

  // Determine stored value type — numeric fields stay numeric, everything else is boolean
  const NUMERIC_FIELDS = new Set(['workout_intensity', 'workout_distance'])
  const storedValue = NUMERIC_FIELDS.has(metric_key)
    ? (value === null || value === undefined ? null : Number(value))
    : Boolean(value)

  // Get the household_id (optional, for household-scoped queries later)
  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const { data, error } = await supabase
    .from('daily_logs')
    .upsert(
      {
        user_id: user.id,
        household_id: membership?.household_id ?? null,
        log_date,
        week_start: weekStart,
        [metric_key]: storedValue,
      },
      { onConflict: 'user_id,log_date' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
