// POST /api/households — create a household and add the current user as owner.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const { data: household, error: hErr } = await supabase
    .from('households')
    .insert({ name })
    .select()
    .single()
  if (hErr) return NextResponse.json({ error: hErr.message }, { status: 500 })

  const { error: mErr } = await supabase
    .from('household_members')
    .insert({ user_id: user.id, household_id: household.id, role: 'owner' })
  if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })

  return NextResponse.json(household, { status: 201 })
}
