// POST /api/households/join — look up an invite code and add the current user as a member.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const code = typeof body.code === 'string' ? body.code.trim() : ''
  if (!code) return NextResponse.json({ error: 'Invite code required' }, { status: 400 })

  const { data: household, error: hErr } = await supabase
    .from('households')
    .select('*')
    .eq('invite_code', code)
    .maybeSingle()
  if (hErr) return NextResponse.json({ error: hErr.message }, { status: 500 })
  if (!household) return NextResponse.json({ error: 'Invalid invite code' }, { status: 404 })

  // Upsert so re-joining the same household is idempotent.
  const { error: mErr } = await supabase
    .from('household_members')
    .upsert({ user_id: user.id, household_id: household.id, role: 'member' })
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

  return NextResponse.json(household, { status: 200 })
}
