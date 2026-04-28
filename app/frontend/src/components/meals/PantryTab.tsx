'use client'

import { useState, useEffect, useCallback } from 'react'
import { AddPantryForm } from './AddPantryForm'
import { PantryItemCard } from './PantryItemCard'

interface PantryRow {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  min_quantity: number | null
  expiration_date: string | null
  category: string | null
  package_size: number | null
  package_unit: string | null
}

interface Props {
  userId: string
  householdId: string | null
}

export function PantryTab({ userId: _userId, householdId: _householdId }: Props) {
  const [items, setItems] = useState<PantryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/pantry')
      const json = await res.json() as PantryRow[] | { error: string }
      if (!res.ok) throw new Error((json as { error: string }).error)
      setItems(json as PantryRow[])
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleAdd(body: {
    name: string; quantity: number | null; unit: string | null
    min_quantity: number | null; expiration_date: string | null; category: string | null
    package_size: number | null; package_unit: string | null
  }) {
    const res = await fetch('/api/pantry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json() as PantryRow | { error: string }
    if (!res.ok) throw new Error((json as { error: string }).error)
    setItems((prev) => [...prev, json as PantryRow].sort((a, b) => a.name.localeCompare(b.name)))
  }

  async function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    const res = await fetch(`/api/pantry/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      // restore on failure
      void load()
    }
  }

  const lowStockItems = items.filter((i) => i.min_quantity != null && (i.quantity ?? 0) <= i.min_quantity)
  const expiringItems = items.filter((i) => {
    if (!i.expiration_date) return false
    return Math.ceil((new Date(i.expiration_date).getTime() - Date.now()) / 86_400_000) <= 7
  })

  return (
    <div className="px-4 flex flex-col gap-4 pb-6">

      {/* Alerts */}
      {(lowStockItems.length > 0 || expiringItems.length > 0) && (
        <div className="flex flex-col gap-2">
          {lowStockItems.length > 0 && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 rounded-xl border border-red-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-xs text-red-700 font-medium">
                {lowStockItems.map((i) => i.name).join(', ')} {lowStockItems.length === 1 ? 'is' : 'are'} running low
              </p>
            </div>
          )}
          {expiringItems.length > 0 && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 rounded-xl border border-amber-100">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs text-amber-700 font-medium">
                {expiringItems.map((i) => i.name).join(', ')} expiring soon
              </p>
            </div>
          )}
        </div>
      )}

      <AddPantryForm onAdd={handleAdd} />

      {loading && (
        <div className="flex justify-center py-8">
          <svg className="animate-spin text-green-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 text-center py-4">{error}</p>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6.5M17 13l1.5 6.5M9 19.5a1 1 0 11-2 0 1 1 0 012 0zM20 19.5a1 1 0 11-2 0 1 1 0 012 0z" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-gray-900">Your pantry is empty</p>
          <p className="text-xs text-gray-500">Add items above to start tracking your stock</p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <PantryItemCard key={item.id} item={item} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
