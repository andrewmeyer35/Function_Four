'use client'

import { useState, useEffect } from 'react'
import type { HistoryItem } from '@/app/api/meal-history/route'

const SOURCE_LABELS: Record<string, string> = {
  url_jsonld: 'URL',
  url_llm: 'URL',
  screenshot_ocr: 'Screenshot',
  manual_entry: 'Manual',
  catalog: 'Catalog',
}

function dateLabel(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) / 86_400_000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const hours = Math.floor(diff / 3_600_000)
  const days = Math.floor(diff / 86_400_000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours}h ago`
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

interface Props {
  userId: string
  householdId: string | null
}

export function HistoryTab({ userId: _userId, householdId: _householdId }: Props) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/meal-history')
      .then(async (r) => {
        if (!r.ok) {
          const err = await r.json() as { error?: string }
          throw new Error(err.error ?? 'Failed to load history')
        }
        return r.json() as Promise<{ items: HistoryItem[] }>
      })
      .then((json) => setItems(json.items ?? []))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load history'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin text-amber-500" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-600 text-center py-8 px-4">{error}</p>
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900">No history yet</p>
          <p className="text-sm text-gray-500 mt-1">Log a meal or import a recipe to see it here.</p>
        </div>
      </div>
    )
  }

  // Group by date label
  const groups: { label: string; items: HistoryItem[] }[] = []
  const seen = new Map<string, number>()
  for (const item of items) {
    const label = dateLabel(item.date)
    const idx = seen.get(label)
    if (idx !== undefined) {
      groups[idx].items.push(item)
    } else {
      seen.set(label, groups.length)
      groups.push({ label, items: [item] })
    }
  }

  return (
    <div className="px-4 flex flex-col gap-5 pb-6">
      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{group.label}</p>

          {group.items.map((item) => {
            const isOpen = expanded === item.id
            const isPhoto = item.type === 'photo'

            return (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left"
                >
                  {/* Thumbnail or icon */}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-10 h-10 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPhoto ? 'bg-blue-50' : 'bg-green-50'}`}>
                      {isPhoto ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
                        </svg>
                      )}
                    </div>
                  )}

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate capitalize">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-gray-400">{timeAgo(item.date)}</span>
                      {item.ingredientCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                          {item.ingredientCount} ingredients
                        </span>
                      )}
                      {!isPhoto && item.sourceType && (
                        <span className="px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                          {SOURCE_LABELS[item.sourceType] ?? item.sourceType}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.ingredients.length > 0 && (
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"
                      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  )}
                </button>

                {isOpen && item.ingredients.length > 0 && (
                  <div className="px-4 pb-3 border-t border-gray-50">
                    <p className="text-xs font-semibold text-gray-500 mt-2 mb-1.5">Ingredients</p>
                    <div className="flex flex-col gap-1">
                      {item.ingredients.map((ing, i) => (
                        <p key={i} className="text-xs text-gray-700">
                          • {ing.quantity != null ? `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''} ` : ''}{ing.name}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
