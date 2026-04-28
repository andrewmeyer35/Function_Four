'use client'

import { useState, useEffect } from 'react'

interface Suggestion {
  recipeImportId: string | null
  title: string
  reason: string
  expiryIngredients: string[]
  missingIngredients: string[]
  cookTimeMinutes: number | null
  servings: number | null
  urgencyScore: number
}

interface ExpiringItem { name: string; expiration_date: string | null }
interface LowItem { name: string; quantity: number | null; unit: string | null }

interface Props {
  userId: string
  householdId: string | null
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
}

export function SuggestionsTab({ userId: _userId, householdId: _householdId }: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [expiring, setExpiring] = useState<ExpiringItem[]>([])
  const [lowStock, setLowStock] = useState<LowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/meal-suggestions')
      .then((r) => r.json())
      .then((json: { suggestions: Suggestion[]; expiringItems: ExpiringItem[]; lowStockItems: LowItem[] }) => {
        setSuggestions(json.suggestions ?? [])
        setExpiring(json.expiringItems ?? [])
        setLowStock(json.lowStockItems ?? [])
      })
      .catch(() => setError('Could not load suggestions'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <svg className="animate-spin text-green-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
        <p className="text-sm text-gray-400">Analyzing your pantry…</p>
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-600 text-center py-8 px-4">{error}</p>
  }

  const noPantry = expiring.length === 0 && lowStock.length === 0 && suggestions.length === 0

  if (noPantry) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900">No suggestions yet</p>
          <p className="text-sm text-gray-500 mt-1">Add items to your pantry and import recipes — we&apos;ll suggest what to cook based on what&apos;s about to expire.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 flex flex-col gap-5 pb-6">

      {/* Expiry alerts */}
      {expiring.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Use up soon</p>
          <div className="flex flex-wrap gap-2">
            {expiring.map((item, i) => {
              const days = daysUntil(item.expiration_date)
              const urgentColor = days != null && days <= 3
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-amber-100 text-amber-700 border-amber-200'
              return (
                <span key={i} className={`px-2.5 py-1 rounded-full border text-xs font-medium ${urgentColor}`}>
                  {item.name}{days != null ? ` · ${days}d` : ''}
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recommended this week</p>
          {suggestions.map((s, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col gap-2">
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  s.urgencyScore > 0.5 ? 'bg-amber-100' : 'bg-green-100'
                }`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={s.urgencyScore > 0.5 ? '#d97706' : '#16a34a'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{s.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-snug">{s.reason}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {s.cookTimeMinutes && (
                  <span className="text-xs text-gray-400">⏱ {s.cookTimeMinutes} min</span>
                )}
                {s.servings && (
                  <span className="text-xs text-gray-400">🍽 {s.servings} servings</span>
                )}
                {s.expiryIngredients.length > 0 && (
                  <span className="text-xs text-amber-600 font-medium">
                    Uses: {s.expiryIngredients.slice(0, 3).join(', ')}
                  </span>
                )}
              </div>

              {s.missingIngredients.length > 0 && (
                <p className="text-xs text-gray-400">
                  Still need: {s.missingIngredients.slice(0, 4).join(', ')}
                  {s.missingIngredients.length > 4 ? ` +${s.missingIngredients.length - 4} more` : ''}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Low stock */}
      {lowStock.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Running low</p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((item, i) => (
              <span key={i} className="px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                {item.name} — {item.quantity ?? 0}{item.unit ? ` ${item.unit}` : ''}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}