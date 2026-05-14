'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface DishResult {
  id: number
  title: string
}

interface Props {
  onSelect: (dish: DishResult) => void
  disabled?: boolean
}

const DEBOUNCE_MS = 350

export function DishSearch({ onSelect, disabled }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<DishResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/meal-log/search-dish?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setResults(data)
        setOpen(data.length > 0)
      }
    } catch {
      // silently fail — search is best-effort
    } finally {
      setLoading(false)
    }
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), DEBOUNCE_MS)
  }

  function handleSelect(dish: DishResult) {
    setQuery(dish.title)
    setOpen(false)
    onSelect(dish)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">Search for a dish</label>
      <div className="relative">
        <input
          type="search"
          placeholder="e.g. spaghetti carbonara, chicken tacos…"
          value={query}
          onChange={handleChange}
          onFocus={() => results.length > 0 && setOpen(true)}
          disabled={disabled}
          className={[
            'w-full px-3 py-2.5 pr-9 rounded-xl border border-gray-200 text-sm outline-none transition',
            'focus:ring-2 focus:ring-green-500 focus:border-green-500',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        />
        {loading && (
          <svg
            className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute top-full mt-1 w-full z-20 bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
          {results.map((dish) => (
            <li key={dish.id}>
              <button
                type="button"
                onClick={() => handleSelect(dish)}
                className="w-full text-left px-4 py-3 text-sm text-gray-800 hover:bg-gray-50 transition first:pt-3.5 last:pb-3.5"
              >
                {dish.title}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && query.length >= 2 && results.length === 0 && !open && (
        <p className="text-xs text-gray-400">No dishes found. Try a different name.</p>
      )}
    </div>
  )
}
