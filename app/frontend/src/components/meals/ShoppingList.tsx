'use client'

import { useState } from 'react'
import { getStoreSection, SECTION_ORDER } from '@/lib/meals/storeSection'

export interface ShoppingItem {
  ingredientName: string
  neededQty: number | null
  unit: string | null
  haveQty: number
  buyQty: number | null
  pantryItemId: string | null
  reason: 'from_meal_plan' | 'low_stock'
  mealAttribution: string[]
}

export interface LowStockItem {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  min_quantity: number | null
}

interface BuyConfirm {
  item: ShoppingItem | LowStockItem
  qty: number
  unit: string
  pantryItemId: string | null
  isLowStock: boolean
}

interface Props {
  shoppingItems: ShoppingItem[]
  lowStockItems: LowStockItem[]
  loading?: boolean
  onBought?: () => void  // called after a successful mark-as-bought to refresh pantry
}

export function ShoppingList({ shoppingItems, lowStockItems, loading, onBought }: Props) {
  const [bought, setBought] = useState<Set<string>>(new Set())
  const [confirm, setConfirm] = useState<BuyConfirm | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <svg className="animate-spin text-green-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      </div>
    )
  }

  const allEmpty = shoppingItems.length === 0 && lowStockItems.length === 0

  // Build section groups once (used by both copy and render)
  function buildSections() {
    const groups = new Map<string, { plan: ShoppingItem[]; low: LowStockItem[] }>()
    for (const s of SECTION_ORDER) groups.set(s, { plan: [], low: [] })

    for (const item of shoppingItems) {
      const s = getStoreSection(item.ingredientName)
      groups.get(s)!.plan.push(item)
    }
    for (const item of lowStockItems) {
      const s = getStoreSection(item.name)
      groups.get(s)!.low.push(item)
    }
    return groups
  }

  function buildCopyText() {
    const groups = buildSections()
    const lines: string[] = []
    for (const section of SECTION_ORDER) {
      const { plan, low } = groups.get(section)!
      const sectionLines: string[] = []
      for (const i of plan) {
        if (bought.has(`plan-${i.ingredientName}`)) continue
        const qty = i.buyQty != null ? `${i.buyQty}${i.unit ? ` ${i.unit}` : ''}` : ''
        sectionLines.push(`• ${i.ingredientName}${qty ? ` — ${qty}` : ''}`)
      }
      for (const i of low) {
        if (bought.has(`low-${i.id}`)) continue
        sectionLines.push(`• ${i.name} (low stock)`)
      }
      if (sectionLines.length > 0) {
        lines.push(section, ...sectionLines, '')
      }
    }
    return lines.join('\n').trimEnd()
  }

  function openConfirm(item: ShoppingItem | LowStockItem, isLowStock: boolean) {
    const si = item as ShoppingItem
    const ls = item as LowStockItem
    setConfirm({
      item,
      qty: isLowStock ? (ls.min_quantity ?? 1) : (si.buyQty ?? si.neededQty ?? 1),
      unit: isLowStock ? (ls.unit ?? '') : (si.unit ?? ''),
      pantryItemId: isLowStock ? ls.id : si.pantryItemId,
      isLowStock,
    })
    setSaveError(null)
  }

  async function handleConfirmBuy() {
    if (!confirm) return
    setSaving(true)
    setSaveError(null)
    try {
      const si = confirm.item as ShoppingItem
      const ls = confirm.item as LowStockItem
      const name = confirm.isLowStock ? ls.name : si.ingredientName

      const res = await fetch('/api/pantry/mark-bought', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredientName: name,
          quantity: confirm.qty || null,
          unit: confirm.unit || null,
          pantryItemId: confirm.pantryItemId,
        }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to save')

      const key = confirm.isLowStock
        ? `low-${(confirm.item as LowStockItem).id}`
        : `plan-${(confirm.item as ShoppingItem).ingredientName}`
      setBought((prev) => new Set([...prev, key]))
      setConfirm(null)
      onBought?.()
    } catch (err) {
      setSaveError(String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">Shopping list</p>
        {!allEmpty && (
          <button
            onClick={() => void navigator.clipboard.writeText(buildCopyText())}
            className="flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-800 transition"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            Copy list
          </button>
        )}
      </div>

      {allEmpty ? (
        <div className="flex items-center gap-2 px-3 py-3 bg-green-50 rounded-xl border border-green-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-xs text-green-700 font-medium">Your pantry covers everything planned this week!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {(() => {
            const groups = buildSections()
            return SECTION_ORDER
              .filter((section) => {
                const g = groups.get(section)!
                return g.plan.length > 0 || g.low.length > 0
              })
              .map((section) => {
                const { plan, low } = groups.get(section)!
                return (
                  <div key={section} className="flex flex-col gap-1.5">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">{section}</p>

                    {plan.map((item) => {
                      const key = `plan-${item.ingredientName}`
                      const isBought = bought.has(key)
                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border shadow-sm transition ${isBought ? 'opacity-40 border-gray-100' : 'border-gray-100'}`}
                        >
                          <button
                            onClick={() => !isBought && openConfirm(item, false)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                              isBought
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 hover:border-green-400'
                            }`}
                          >
                            {isBought && (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium capitalize truncate ${isBought ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {item.ingredientName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.buyQty != null
                                ? `Buy ${item.buyQty}${item.unit ? ` ${item.unit}` : ''}`
                                : 'Add to cart'}
                              {item.haveQty > 0 ? ` · have ${item.haveQty}` : ''}
                              {item.mealAttribution.length > 0 && (
                                <span className="text-gray-300"> · {item.mealAttribution.join(', ')}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    })}

                    {low.map((item) => {
                      const key = `low-${item.id}`
                      const isBought = bought.has(key)
                      return (
                        <div
                          key={key}
                          className={`flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border shadow-sm transition ${isBought ? 'opacity-40 border-gray-100' : 'border-red-100'}`}
                        >
                          <button
                            onClick={() => !isBought && openConfirm(item, true)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                              isBought
                                ? 'bg-green-500 border-green-500'
                                : 'border-red-300 hover:border-green-400'
                            }`}
                          >
                            {isBought && (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isBought ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                              {item.name}
                            </p>
                            <p className="text-xs text-red-400">
                              Low stock — {item.quantity ?? 0}{item.unit ? ` ${item.unit}` : ''} left
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })
          })()}
        </div>
      )}

      {/* Confirm quantity modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setConfirm(null)}>
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl p-5 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-semibold text-gray-900">
              Mark as bought — {confirm.isLowStock
                ? (confirm.item as LowStockItem).name
                : (confirm.item as ShoppingItem).ingredientName}
            </p>
            <p className="text-xs text-gray-500">Confirm how much you bought. This will be added to your pantry.</p>

            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                min="0"
                value={confirm.qty}
                onChange={(e) => setConfirm((c) => c ? { ...c, qty: parseFloat(e.target.value) || 0 } : null)}
                className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-green-400"
              />
              <input
                value={confirm.unit}
                onChange={(e) => setConfirm((c) => c ? { ...c, unit: e.target.value } : null)}
                placeholder="unit"
                className="w-24 px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-green-400"
              />
            </div>

            {saveError && <p className="text-xs text-red-600">{saveError}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleConfirmBuy()}
                disabled={saving}
                className="flex-1 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-40 transition"
              >
                {saving ? 'Saving…' : 'Add to pantry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}