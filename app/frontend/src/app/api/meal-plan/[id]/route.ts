import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/meal-plan/[id]  — remove a single plan entry
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify ownership via join to meal_plans
  const { data: entry } = await supabase
    .from('meal_plan_entries')
    .select('id, meal_plans!inner(user_id)')
    .eq('id', params.id)
    .maybeSingle()

  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { error } = await supabase
    .from('meal_plan_entries')
    .delete()
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
