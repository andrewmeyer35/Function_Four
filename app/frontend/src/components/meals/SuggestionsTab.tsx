'use client'

interface Props {
  userId: string
  householdId: string | null
}

export function SuggestionsTab({ userId, householdId }: Props) {
  return (
    <div className="px-4 py-6 flex flex-col items-center justify-center text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 13.87A4 4 0 017.41 6a5.11 5.11 0 019.18 0 4 4 0 011.41 7.87V20H6z" />
          <line x1="6" y1="17" x2="18" y2="17" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-900">Meal Suggestions</p>
        <p className="text-sm text-gray-500 mt-1">
          AI-powered suggestions based on your pantry — coming in Phase 5.
        </p>
      </div>
    </div>
  )
}
