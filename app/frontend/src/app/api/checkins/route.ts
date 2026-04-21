// POST /api/checkins — upsert the current user's check-in for the current week.
// Unique constraint (user_id, household_id, week_start) means resubmitting edits in place.
// Accepts the new structured shape: per-F score (1-10 or null for skipped), tag array, and optional note.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWeekStart } from '@/lib/week'

// Coerce untrusted input into a valid 1..10 integer or null.
function parseScore(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  if (!Number.isFinite(n)) return null
  const i = Math.round(n)
  if (i < 1 || i > 10) return null
  return i
}

// Coerce tags into a trimmed string[]; drop non-strings and cap length.
function parseTags(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 12)
}

function parseNote(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  return trimmed ? trimmed.slice(0, 2000) : null
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const householdId = typeof body.householdId === 'string' ? body.householdId : null
  if (!householdId)
    return NextResponse.json({ error: 'householdId required' }, { status: 400 })

  // Confirm the user actually belongs to this household.
  const { data: membership } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('household_id', householdId)
    .maybeSingle()
  if (!membership)
    return NextResponse.json({ error: 'Not a member of this household' }, { status: 403 })

  const weekStart = getWeekStart()

  const row = {
    user_id: user.id,
    household_id: householdId,
    week_start: weekStart,
    financial_text: parseNote(body.financial),
    fitness_text: parseNote(body.fitness),
    fun_text: parseNote(body.fun),
    flirt_text: parseNote(body.flirt),
    financial_score: parseScore(body.financialScore),
    fitness_score: parseScore(body.fitnessScore),
    fun_score: parseScore(body.funScore),
    flirt_score: parseScore(body.flirtScore),
    financial_tags: parseTags(body.financialTags),
    fitness_tags: parseTags(body.fitnessTags),
    fun_tags: parseTags(body.funTags),
    flirt_tags: parseTags(body.flirtTags),
  }

  const { data, error } = await supabase
    .from('checkins')
    .upsert(row, { onConflict: 'user_id,household_id,week_start' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
