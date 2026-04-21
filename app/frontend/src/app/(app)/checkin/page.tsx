// Server wrapper — resolves the user's household and any existing check-in for the current week,
// then hands off to the client-side wizard which actually handles the sliders / tags / note.
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getWeekStart } from '@/lib/week'
import { SKIPPED_TAG } from '@shared/types'
import { CheckinWizard } from './CheckinWizard'
import { EMPTY_CHECKIN, type CheckinInitial } from './types'

export default async function CheckinPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberships } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .limit(1)
  if (!memberships || memberships.length === 0) redirect('/onboarding')

  const householdId = memberships[0].household_id as string
  const weekStart = getWeekStart()

  // Load any existing check-in for this week so the wizard can pre-fill (edit mode).
  const { data: existing } = await supabase
    .from('checkins')
    .select('*')
    .eq('user_id', user.id)
    .eq('household_id', householdId)
    .eq('week_start', weekStart)
    .maybeSingle()

  // Build initial form state. When editing, prefer the stored score / tags / note;
  // otherwise fall back to EMPTY_CHECKIN's sensible 7/10 default.
  const initial: CheckinInitial = existing
    ? {
        financial: {
          score: existing.financial_score ?? null,
          tags: (existing.financial_tags as string[] | null) ?? [],
          note: existing.financial_text ?? '',
        },
        fitness: {
          score: existing.fitness_score ?? null,
          tags: (existing.fitness_tags as string[] | null) ?? [],
          note: existing.fitness_text ?? '',
        },
        fun: {
          score: existing.fun_score ?? null,
          tags: (existing.fun_tags as string[] | null) ?? [],
          note: existing.fun_text ?? '',
        },
        flirt: {
          score: existing.flirt_score ?? null,
          tags: (existing.flirt_tags as string[] | null) ?? [],
          note: existing.flirt_text ?? '',
        },
      }
    : EMPTY_CHECKIN

  // If the stored tags include 'Skipped' but score is null, that's consistent; no fix-up needed.
  // If score is null and tags are empty (legacy rows), mark as Skipped so UI stays coherent.
  for (const key of ['financial', 'fitness', 'fun', 'flirt'] as const) {
    const f = initial[key]
    if (f.score === null && f.tags.length === 0) f.tags = [SKIPPED_TAG]
  }

  return <CheckinWizard householdId={householdId} initial={initial} />
}
