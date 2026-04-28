'use client'

export type Tab = 'suggest' | 'plan' | 'log' | 'import' | 'pantry' | 'history'

const TABS: { id: Tab; label: string }[] = [
  { id: 'suggest', label: 'Suggest' },
  { id: 'plan',    label: 'Plan' },
  { id: 'log',     label: 'Log Meal' },
  { id: 'import',  label: 'Import' },
  { id: 'pantry',  label: 'Pantry' },
  { id: 'history', label: 'History' },
]

interface Props {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function MealsTabs({ activeTab, onTabChange }: Props) {
  return (
    <div className="px-4">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`flex-shrink-0 px-2 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
              activeTab === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}