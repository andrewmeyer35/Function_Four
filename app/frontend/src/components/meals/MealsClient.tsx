'use client'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { MealsTabs, type Tab } from './MealsTabs'
import { SuggestionsTab } from './SuggestionsTab'
import { MealPlanTab } from './MealPlanTab'
import { LogMealTab } from './LogMealTab'
import { ImportRecipeTab } from './ImportRecipeTab'
import { PantryTab } from './PantryTab'
import { HistoryTab } from './HistoryTab'

interface Props {
  userId: string
  householdId: string | null
  userName: string
}

export function MealsClient({ userId, householdId, userName: _userName }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const rawTab = searchParams.get('tab') as Tab | null
  const validTabs: Tab[] = ['suggest', 'plan', 'log', 'import', 'pantry', 'history']
  const activeTab: Tab = rawTab && validTabs.includes(rawTab) ? rawTab : 'suggest'

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    if (tab !== 'import') {
      params.delete('shareId')
      params.delete('sharedUrl')
      params.delete('sharedImageUrl')
      params.delete('sharedTitle')
      params.delete('shareError')
    }
    router.replace(`/meals?${params.toString()}`)
  }

  return (
    <div className="max-w-lg mx-auto pb-24 md:pb-8">
      <div className="px-4 pt-6 pb-4 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Plan your week, track your pantry, and minimize food waste.
          </p>
        </div>
        <Link
          href="/meals/preferences"
          aria-label="Food preferences"
          className="mt-1 flex-shrink-0 p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </Link>
      </div>

      <MealsTabs activeTab={activeTab} onTabChange={setTab} />

      <div className="mt-4">
        {activeTab === 'suggest' && (
          <SuggestionsTab userId={userId} householdId={householdId} />
        )}
        {activeTab === 'plan' && (
          <MealPlanTab userId={userId} householdId={householdId} />
        )}
        {activeTab === 'log' && (
          <LogMealTab userId={userId} householdId={householdId} />
        )}
        {activeTab === 'import' && (
          <ImportRecipeTab userId={userId} householdId={householdId} />
        )}
        {activeTab === 'pantry' && (
          <PantryTab userId={userId} householdId={householdId} />
        )}
        {activeTab === 'history' && (
          <HistoryTab userId={userId} householdId={householdId} />
        )}
      </div>
    </div>
  )
}