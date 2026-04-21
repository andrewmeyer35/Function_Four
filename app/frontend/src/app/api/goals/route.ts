import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GOAL_OPTIONS } from '@/lib/goals'

// GET /api/goals — fetch the current user's active goals
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', user.id)
    .order('category')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

// POST /api/goals — upsert a single goal
// Body: { metric_key, target, is_active }
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { metric_key, target, is_active } = body

  const option = GOAL_OPTIONS.find((g) => g.key === metric_key)
  if (!option) return NextResponse.json({ error: 'Unknown metric_key' }, { status: 400 })

  const clampedTarget = Math.max(1, Math.min(option.maxTarget, Number(target)))

  const { data, error } = await supabase
    .from('user_goals')
    .upsert(
      {
        user_id: user.id,
        category: option.category,
        metric_key,
        label: option.label,
        target: clampedTarget,
        is_active: Boolean(is_active),
      },
      { onConflict: 'user_id,metric_key' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
