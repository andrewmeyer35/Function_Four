import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/recipe-import/history
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('recipe_imports')
    .select('id, recipe_json, source_type, created_at')
    .eq('user_id', user.id)
    .eq('status', 'confirmed')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ recipes: data ?? [] })
}
