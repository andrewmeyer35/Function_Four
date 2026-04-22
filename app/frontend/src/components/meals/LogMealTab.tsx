'use client'

interface Props {
  userId: string
  householdId: string | null
}

export function LogMealTab({ userId, householdId }: Props) {
  return (
    <div className="px-4 py-6 flex flex-col items-center justify-center text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 7l-7 5-7-5V5a2 2 0 012-2h10a2 2 0 012 2z" />
          <path d="M1 1l22 22" />
        </svg>
      </div>
      <div>
        <p className="font-semibold text-gray-900">Log a Meal</p>
        <p className="text-sm text-gray-500 mt-1">
          Photo recognition, dish search, and pantry deduction — coming in Phase 4.
        </p>
      </div>
    </div>
  )
}
