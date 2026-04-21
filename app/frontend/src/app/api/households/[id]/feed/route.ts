// GET /api/households/:id/feed — returns the household feed grouped by week_start.
// Kept around for future client-side re-fetch / polling. The /household page itself
// renders server-side and doesn't call this route today.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Membership gate.
  const { data: membership } = await supabase
    .from('household_members')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('household_id', params.id)
    .maybeSingle()
  if (!membership)
    return NextResponse.json({ error: 'Not a member of this household' }, { status: 403 })

  const [{ data: checkins, error }, { data: members }] = await Promise.all([
    supabase
      .from('checkins')
      .select('*, user:users(*), reactions(*, user:users(*))')
      .eq('household_id', params.id)
      .order('week_start', { ascending: false })
      .limit(80),
    supabase
      .from('household_members')
      .select('*, user:users(*)')
      .eq('household_id', params.id),
  ])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const byWeek = new Map<string, any[]>()
  for (const c of checkins ?? []) {
    if (!byWeek.has(c.week_start)) byWeek.set(c.week_start, [])
    byWeek.get(c.week_start)!.push(c)
  }

  const feed = Array.from(byWeek.entries()).map(([weekStart, wCheckins]) => {
    const checkedInIds = new Set(wCheckins.map((c: any) => c.user_id))
    const missingMembers = (members ?? [])
      .filter((m: any) => !checkedInIds.has(m.user_id))
      .map((m: any) => m.user)
    return { weekStart, checkins: wCheckins, missingMembers }
  })

  return NextResponse.json(feed)
}
