'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { MealsTabs, type Tab } from './MealsTabs'
import { SuggestionsTab } from './SuggestionsTab'
import { LogMealTab } from './LogMealTab'
import { ImportRecipeTab } from './ImportRecipeTab'
import { HistoryTab } from './HistoryTab'

interface Props {
  userId: string
  householdId: string | null
  userName: string
}

export function MealsClient({ userId, householdId, userName }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const rawTab = searchParams.get('tab') as Tab | null
  const validTabs: Tab[] = ['suggestions', 'log', 'import', 'history']
  const activeTab: Tab = rawTab && validTabs.includes(rawTab) ? rawTab : 'suggestions'

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    // Clear share params when navigating away from import tab
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
      {/* Page header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Log meals, import recipes, and get smart suggestions.
        </p>
      </div>

      {/* Tab bar */}
      <MealsTabs activeTab={activeTab} onTabChange={setTab} />

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'suggestions' && (
          <SuggestionsTab userId={userId} householdId={householdId} />
        )}
        {activeTab === 'log' && (
          <LogMealTab userId={userId} householdId={householdId} />
        )}
        {activeTab === 'import' && (
          <ImportRecipeTab userId={userId} householdId={householdId} />
        )}
        {activeTab === 'history' && (
          <HistoryTab userId={userId} householdId={householdId} />
        )}
      </div>
    </div>
  )
}
