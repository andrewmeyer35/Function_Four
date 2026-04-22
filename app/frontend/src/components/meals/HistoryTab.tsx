'use client'

interface Props {
  userId: string
  householdId: string | null
}

export function HistoryTab({ userId, householdId }: Props) {
  return (
    <div className="px-4 py-6 flex flex-col items-center justify-center text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-900">Meal History</p>
        <p className="text-sm text-gray-500 mt-1">
          Your logged meals and imported recipes will appear here — coming in Phase 5.
        </p>
      </div>
    </div>
  )
}
