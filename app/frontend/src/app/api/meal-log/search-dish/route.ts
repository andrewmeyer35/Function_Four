import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface SpoonacularAutocomplete {
  id: number
  title: string
}

// GET /api/meal-log/search-dish?q=pasta
// Returns: [{ id, title }]
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const apiKey = process.env.SPOONACULAR_API_KEY
  if (!apiKey) {
    // Spoonacular not configured — return empty so UI degrades gracefully
    return NextResponse.json([])
  }

  try {
    const url = new URL('https://api.spoonacular.com/recipes/autocomplete')
    url.searchParams.set('apiKey', apiKey)
    url.searchParams.set('query', q)
    url.searchParams.set('number', '8')

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5_000),
      headers: { Accept: 'application/json' },
    })

    if (!res.ok) {
      return NextResponse.json({ error: `Spoonacular error: HTTP ${res.status}` }, { status: 502 })
    }

    const data = (await res.json()) as SpoonacularAutocomplete[]
    return NextResponse.json(data.map((d) => ({ id: d.id, title: d.title })))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
