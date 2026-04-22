'use client'

interface Props {
  userId: string
  householdId: string | null
}

export function ImportRecipeTab({ userId, householdId }: Props) {
  return (
    <div className="px-4 py-6 flex flex-col gap-4">

      {/* Coming soon banner */}
      <div className="flex flex-col items-center justify-center text-center gap-3 py-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900">Import a Recipe</p>
          <p className="text-sm text-gray-500 mt-1">
            Paste a link, upload a screenshot, or share from Instagram — coming in Phase 3.
          </p>
        </div>
      </div>

      {/* Import method cards — wired up in Phase 3 */}
      <div className="flex flex-col gap-3 opacity-50 pointer-events-none">
        {[
          { emoji: '🔗', label: 'Paste a Link', sub: 'Works with 600+ recipe sites' },
          { emoji: '📷', label: 'Upload Screenshot', sub: 'Camera roll or Instagram photo' },
          { emoji: '📲', label: 'Share from Another App', sub: 'Install the app to enable' },
        ].map(({ emoji, label, sub }) => (
          <div
            key={label}
            className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-2xl"
          >
            <span className="text-2xl">{emoji}</span>
            <div>
              <p className="font-semibold text-sm text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
