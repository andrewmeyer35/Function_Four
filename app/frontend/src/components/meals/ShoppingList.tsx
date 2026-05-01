'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getStoreSection, SECTION_ORDER } from '@/lib/meals/storeSection'
import type { CartItemRow } from '@/app/api/cart/route'

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

interface BatchEditItem {
  key: string
  name: string
  qty: number
  unit: string
  pantryItemId: string | null
  isLowStock: boolean
}

type AddItemState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'error'; message: string }

interface Props {
  shoppingItems: ShoppingItem[]
  lowStockItems: LowStockItem[]
  weekStart: string
  userId?: string
  householdId?: string | null
  loading?: boolean
  onBought?: () => void
}

export function ShoppingList({ shoppingItems, lowStockItems, weekStart, userId, householdId, loading, onBought }: Props) {
  // ── Bought tracking ───────────────────────────────────────────────────────
  const [bought, setBought] = useState<Set<string>>(new Set())

  // ── Multi-select state ────────────────────────────────────────────────────
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [batchItems, setBatchItems] = useState<BatchEditItem[]>([])
  const [batchOpen, setBatchOpen] = useState(false)
  const [batchSaving, setBatchSaving] = useState(false)
  const [batchError, setBatchError] = useState<string | null>(null)

  // ── Custom cart items ─────────────────────────────────────────────────────
  const [customItems, setCustomItems] = useState<CartItemRow[]>([])
  const [customLoading, setCustomLoading] = useState(true)

  // ── Add item form ─────────────────────────────────────────────────────────
  const [addName, setAddName] = useState('')
  const [addQty, setAddQty] = useState('')
  const [addUnit, setAddUnit] = useState('')
  const [addState, setAddState] = useState<AddItemState>({ kind: 'idle' })

  // ── Undo toast (custom items only) ────────────────────────────────────────
  const [undoEntry, setUndoEntry] = useState<{ id: string; name: string } | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Instacart ─────────────────────────────────────────────────────────────
  const [instacartLoading, setInstacartLoading] = useState(false)
  const [instacartMsg, setInstacartMsg] = useState<string | null>(null)
  const instacartMsgTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Checked-items panel toggle ────────────────────────────────────────────
  const [showChecked, setShowChecked] = useState(false)

  const mountedRef = useRef(true)
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      if (instacartMsgTimerRef.current) clearTimeout(instacartMsgTimerRef.current)
    }
  }, [])

  // ── Fetch custom cart items ───────────────────────────────────────────────
  const fetchCustomItems = useCallback(async () => {
    try {
      const res = await fetch(`/api/cart?weekStart=${weekStart}`)
      if (!res.ok) return
      const json = await res.json() as { items: CartItemRow[] }
      if (mountedRef.current) setCustomItems(json.items ?? [])
    } catch {
      // non-fatal — list still shows recipe items
    } finally {
      if (mountedRef.current) setCustomLoading(false)
    }
  }, [weekStart])

  useEffect(() => { void fetchCustomItems() }, [fetchCustomItems])

  // ── Supabase Realtime — sync custom items across household ────────────────
  useEffect(() => {
    const supabase = createClient()
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const filter = householdId && UUID_RE.test(householdId)
      ? `household_id=eq.${householdId}`
      : userId && UUID_RE.test(userId) ? `user_id=eq.${userId}` : undefined
    const channel = supabase
      .channel(`cart_items_${weekStart}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_items', filter }, () => {
        void fetchCustomItems()
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [fetchCustomItems, weekStart, userId, householdId])

  // ── Add a custom item ─────────────────────────────────────────────────────
  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault()
    const name = addName.trim()
    if (!name || addState.kind === 'saving') return
    setAddState({ kind: 'saving' })
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          quantity: addQty ? (parseFloat(addQty) || null) : null,
          unit: addUnit.trim() || null,
          week_start: weekStart,
        }),
      })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to add')
      if (!mountedRef.current) return
      setAddName('')
      setAddQty('')
      setAddUnit('')
      setAddState({ kind: 'idle' })
      void fetchCustomItems()
    } catch (err) {
      if (!mountedRef.current) return
      setAddState({ kind: 'error', message: err instanceof Error ? err.message : 'Failed to add item' })
    }
  }

  // ── Check off a custom item ───────────────────────────────────────────────
  async function handleCheckCustom(item: CartItemRow) {
    if (item.checked_at) return
    try {
      const res = await fetch(`/api/cart/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: true }),
      })
      if (!res.ok) return
      void fetchCustomItems()
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
      if (mountedRef.current) {
        setUndoEntry({ id: item.id, name: item.name })
        undoTimerRef.current = setTimeout(() => {
          if (mountedRef.current) setUndoEntry(null)
        }, 5000)
      }
    } catch { /* non-fatal */ }
  }

  // ── Undo check-off ────────────────────────────────────────────────────────
  async function handleUndo() {
    if (!undoEntry) return
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current)
    const { id } = undoEntry
    setUndoEntry(null)
    try {
      await fetch(`/api/cart/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: false }),
      })
      void fetchCustomItems()
    } catch { /* non-fatal */ }
  }

  // ── Delete a custom item ──────────────────────────────────────────────────
  async function handleDeleteCustom(id: string) {
    try {
      const res = await fetch(`/api/cart/${id}`, { method: 'DELETE' })
      if (!res.ok) return
      void fetchCustomItems()
    } catch { /* non-fatal */ }
  }

  // ── Instacart / copy list ─────────────────────────────────────────────────
  async function handleInstacart() {
    if (instacartLoading) return
    setInstacartLoading(true)
    setInstacartMsg(null)
    try {
      const res = await fetch(`/api/cart/instacart?weekStart=${weekStart}`)
      if (!res.ok) {
        if (mountedRef.current) setInstacartMsg('Could not load list')
        return
      }
      const json = await res.json() as { url: string | null; items: { name: string; qty: string }[] }
      if (!mountedRef.current) return
      if (json.url) {
        window.open(json.url, '_blank', 'noopener,noreferrer')
      } else {
        const text = json.items
          .map((i) => `• ${i.name}${i.qty ? ` — ${i.qty}` : ''}`)
          .join('\n')
        await navigator.clipboard.writeText(text)
        if (instacartMsgTimerRef.current) clearTimeout(instacartMsgTimerRef.current)
        setInstacartMsg('Copied for Instacart')
        instacartMsgTimerRef.current = setTimeout(() => {
          if (mountedRef.current) setInstacartMsg(null)
        }, 3000)
      }
    } catch { /* non-fatal */ } finally {
      if (mountedRef.current) setInstacartLoading(false)
    }
  }

  // ── Multi-select helpers ──────────────────────────────────────────────────
  function toggleSelected(key: string) {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleOpenBatch() {
    const items: BatchEditItem[] = []
    const staleKeys: string[] = []
    for (const key of selectedKeys) {
      if (key.startsWith('plan-')) {
        const name = key.slice(5)
        const item = shoppingItems.find((i) => i.ingredientName === name)
        if (item) {
          items.push({
            key,
            name: item.ingredientName,
            qty: item.buyQty ?? item.neededQty ?? 1,
            unit: item.unit ?? '',
            pantryItemId: item.pantryItemId,
            isLowStock: false,
          })
        } else {
          staleKeys.push(key)
        }
      } else if (key.startsWith('low-')) {
        const id = key.slice(4)
        const item = lowStockItems.find((i) => i.id === id)
        if (item) {
          items.push({
            key,
            name: item.name,
            qty: item.min_quantity ?? 1,
            unit: item.unit ?? '',
            pantryItemId: item.id,
            isLowStock: true,
          })
        } else {
          staleKeys.push(key)
        }
      }
    }
    if (staleKeys.length > 0) {
      setSelectedKeys((prev) => {
        const next = new Set(prev)
        staleKeys.forEach((k) => next.delete(k))
        return next
      })
    }
    if (items.length === 0) return
    setBatchItems(items)
    setBatchOpen(true)
    setBatchError(null)
  }

  async function handleSaveAll() {
    if (batchSaving || batchItems.length === 0) return
    const snapshot = batchItems  // capture before any awaits
    setBatchSaving(true)
    setBatchError(null)

    // Optimistic: mark all as bought immediately
    setBought((prev) => new Set([...prev, ...snapshot.map((i) => i.key)]))

    try {
      const results = await Promise.allSettled(
        snapshot.map((item) =>
          fetch('/api/pantry/mark-bought', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ingredientName: item.name,
              quantity: item.qty > 0 ? item.qty : null,
              unit: item.unit || null,
              pantryItemId: item.pantryItemId,
            }),
          }).then(async (r) => {
            if (!r.ok) {
              const err = await r.json() as { error?: string }
              throw new Error(err.error ?? `${item.name} failed`)
            }
          })
        )
      )

      if (!mountedRef.current) return

      const failedItems = snapshot.filter((_, i) => results[i].status === 'rejected')

      if (failedItems.length > 0) {
        // Revert only failed items
        setBought((prev) => {
          const next = new Set(prev)
          failedItems.forEach((i) => next.delete(i.key))
          return next
        })
        // Remove succeeded items from selection so they can't be re-submitted
        const failedKeys = new Set(failedItems.map((i) => i.key))
        setSelectedKeys((prev) => {
          const next = new Set(prev)
          snapshot.forEach((i) => { if (!failedKeys.has(i.key)) next.delete(i.key) })
          return next
        })
        // Drawer shows only failed items for retry
        setBatchItems(failedItems)
        setBatchError(`Failed to save: ${failedItems.map((i) => i.name).join(', ')}`)
      } else {
        setBatchOpen(false)
        setSelectedKeys(new Set())
        onBought?.()
      }
    } finally {
      if (mountedRef.current) setBatchSaving(false)
    }
  }

  // ── Section grouping ──────────────────────────────────────────────────────
  const uncheckedCustom = customItems.filter((i) => !i.checked_at)
  const checkedCustom = customItems.filter((i) => !!i.checked_at)

  function buildSections() {
    const groups = new Map<string, { plan: ShoppingItem[]; low: LowStockItem[]; custom: CartItemRow[] }>()
    for (const s of SECTION_ORDER) groups.set(s, { plan: [], low: [], custom: [] })

    for (const item of shoppingItems) {
      if (bought.has(`plan-${item.ingredientName}`)) continue
      const s = getStoreSection(item.ingredientName)
      groups.get(s)!.plan.push(item)
    }
    for (const item of lowStockItems) {
      if (bought.has(`low-${item.id}`)) continue
      const s = getStoreSection(item.name)
      groups.get(s)!.low.push(item)
    }
    for (const item of uncheckedCustom) {
      const s = getStoreSection(item.name)
      groups.get(s)!.custom.push(item)
    }
    return groups
  }

  function buildCopyText() {
    const groups = buildSections()
    const lines: string[] = []
    for (const section of SECTION_ORDER) {
      const { plan, low, custom } = groups.get(section)!
      const sectionLines: string[] = []
      for (const i of plan) {
        const qty = i.buyQty != null ? `${i.buyQty}${i.unit ? ` ${i.unit}` : ''}` : ''
        sectionLines.push(`• ${i.ingredientName}${qty ? ` — ${qty}` : ''}`)
      }
      for (const i of low) {
        sectionLines.push(`• ${i.name} (low stock)`)
      }
      for (const i of custom) {
        const qty = i.quantity != null ? `${i.quantity}${i.unit ? ` ${i.unit}` : ''}` : ''
        sectionLines.push(`• ${i.name}${qty ? ` — ${qty}` : ''}`)
      }
      if (sectionLines.length > 0) {
        lines.push(section, ...sectionLines, '')
      }
    }
    return lines.join('\n').trimEnd()
  }

  const groups = buildSections()
  const hasUnchecked = SECTION_ORDER.some((s) => {
    const g = groups.get(s)!
    return g.plan.length > 0 || g.low.length > 0 || g.custom.length > 0
  })
  const hasChecked = bought.size > 0 || checkedCustom.length > 0
  const allEmpty = !hasUnchecked && !hasChecked && !customLoading

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <svg className="animate-spin text-green-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900">Shopping list</p>
        <div className="flex items-center gap-2">
          {!allEmpty && (
            <button
              onClick={() => void handleInstacart()}
              disabled={instacartLoading}
              className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 transition disabled:opacity-50"
              title="Send to Instacart or copy list"
            >
              {instacartLoading ? (
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 001.98 1.61h9.72a2 2 0 001.98-1.61L23 6H6" />
                </svg>
              )}
              {instacartMsg ?? 'Instacart'}
            </button>
          )}
          {!allEmpty && (
            <button
              onClick={() => void navigator.clipboard.writeText(buildCopyText())}
              className="flex items-center gap-1.5 text-xs font-medium text-green-700 hover:text-green-800 transition"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy
            </button>
          )}
        </div>
      </div>

      {/* ── Add custom item ── */}
      <form onSubmit={(e) => void handleAddItem(e)} className="flex gap-2">
        <input
          type="text"
          value={addName}
          onChange={(e) => setAddName(e.target.value)}
          placeholder="Add any item…"
          maxLength={200}
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-green-400 placeholder-gray-400"
        />
        <input
          type="number"
          value={addQty}
          onChange={(e) => setAddQty(e.target.value)}
          placeholder="Qty"
          min="0.001"
          step="any"
          className="w-14 px-2 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-green-400 text-center"
        />
        <input
          type="text"
          value={addUnit}
          onChange={(e) => setAddUnit(e.target.value)}
          placeholder="unit"
          maxLength={50}
          className="w-16 px-2 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-green-400"
        />
        <button
          type="submit"
          disabled={!addName.trim() || addState.kind === 'saving'}
          className="px-3 py-2 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-40 transition shrink-0"
        >
          {addState.kind === 'saving' ? '…' : '+'}
        </button>
      </form>
      {addState.kind === 'error' && (
        <p className="text-xs text-red-500 px-1">{addState.message}</p>
      )}

      {/* ── Empty state ── */}
      {allEmpty ? (
        <div className="flex items-center gap-2 px-3 py-3 bg-green-50 rounded-xl border border-green-100">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p className="text-xs text-green-700 font-medium">Your pantry covers everything planned this week!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">

          {/* ── Store section groups (unchecked items) ── */}
          {SECTION_ORDER
            .filter((section) => {
              const g = groups.get(section)!
              return g.plan.length > 0 || g.low.length > 0 || g.custom.length > 0
            })
            .map((section) => {
              const { plan, low, custom } = groups.get(section)!
              return (
                <div key={section} className="flex flex-col gap-1.5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">{section}</p>

                  {/* Recipe items — multi-select */}
                  {plan.map((item) => {
                    const key = `plan-${item.ingredientName}`
                    const isSelected = selectedKeys.has(key)
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border shadow-sm transition ${
                          isSelected ? 'border-green-300 bg-green-50' : 'border-gray-100'
                        }`}
                      >
                        <button
                          onClick={() => toggleSelected(key)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                          aria-label={`${isSelected ? 'Deselect' : 'Select'} ${item.ingredientName}`}
                        >
                          {isSelected && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium capitalize truncate text-gray-900">
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

                  {/* Low-stock items — multi-select */}
                  {low.map((item) => {
                    const key = `low-${item.id}`
                    const isSelected = selectedKeys.has(key)
                    return (
                      <div
                        key={key}
                        className={`flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border shadow-sm transition ${
                          isSelected ? 'border-green-300 bg-green-50' : 'border-red-100'
                        }`}
                      >
                        <button
                          onClick={() => toggleSelected(key)}
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? 'bg-green-500 border-green-500'
                              : 'border-red-300 hover:border-green-400'
                          }`}
                          aria-label={`${isSelected ? 'Deselect' : 'Select'} ${item.name}`}
                        >
                          {isSelected && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-gray-900">{item.name}</p>
                          <p className="text-xs text-red-400">
                            Low stock — {item.quantity ?? 0}{item.unit ? ` ${item.unit}` : ''} left
                          </p>
                        </div>
                      </div>
                    )
                  })}

                  {/* Custom cart items — quick tap check-off */}
                  {custom.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-indigo-100 shadow-sm"
                    >
                      <button
                        onClick={() => void handleCheckCustom(item)}
                        className="w-5 h-5 rounded-md border-2 border-indigo-300 hover:border-green-400 flex items-center justify-center shrink-0 transition"
                        aria-label={`Mark ${item.name} as got`}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate text-gray-900">{item.name}</p>
                        {(item.quantity != null || item.unit) && (
                          <p className="text-xs text-indigo-400">
                            {item.quantity != null ? item.quantity : ''}{item.unit ? ` ${item.unit}` : ''}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => void handleDeleteCustom(item.id)}
                        className="w-6 h-6 flex items-center justify-center rounded-full text-gray-300 hover:text-red-400 hover:bg-red-50 transition shrink-0"
                        aria-label={`Remove ${item.name}`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )
            })}

          {/* ── In your cart ✓ (checked items) ── */}
          {hasChecked && (
            <div className="flex flex-col gap-1.5">
              <button
                onClick={() => setShowChecked((v) => !v)}
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 hover:text-gray-600 transition"
              >
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className={`transition-transform ${showChecked ? 'rotate-180' : ''}`}
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                In your cart ✓ ({bought.size + checkedCustom.length})
              </button>

              {showChecked && (
                <div className="flex flex-col gap-1.5">
                  {Array.from(bought).map((key) => {
                    const isPlan = key.startsWith('plan-')
                    const name = isPlan ? key.slice(5) : key.slice(4)
                    return (
                      <div key={key} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-gray-100 opacity-50">
                        <div className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center shrink-0">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-400 line-through truncate capitalize">{name}</p>
                      </div>
                    )
                  })}
                  {checkedCustom.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 bg-white rounded-xl border border-gray-100 opacity-50">
                      <div className="w-5 h-5 rounded-md bg-green-500 flex items-center justify-center shrink-0">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-400 line-through truncate">{item.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Sticky Done bar (shown when items are selected) ── */}
      {selectedKeys.size > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
          <div className="w-full max-w-lg flex items-center justify-between gap-3 px-4 py-3 bg-gray-900 text-white rounded-2xl shadow-xl pointer-events-auto">
            <span className="text-sm font-medium">
              {selectedKeys.size} item{selectedKeys.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedKeys(new Set())}
                className="text-xs text-gray-400 hover:text-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleOpenBatch}
                className="px-4 py-2 bg-green-500 text-white text-sm font-semibold rounded-xl hover:bg-green-400 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Batch-edit drawer ── */}
      {batchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => { if (!batchSaving) { setBatchOpen(false) } }}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-3xl p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <p className="font-semibold text-gray-900">
                Add to pantry — {batchItems.length} item{batchItems.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-500 mt-1">Adjust quantities, then save all at once.</p>
            </div>

            <div className="flex flex-col gap-2">
              {batchItems.map((item, i) => (
                <div key={item.key} className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium text-gray-900 capitalize truncate">{item.name}</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={item.qty || ''}
                    disabled={batchSaving}
                    onChange={(e) => setBatchItems((prev) => prev.map((b, j) =>
                      j === i ? { ...b, qty: parseFloat(e.target.value) || 0 } : b
                    ))}
                    className="w-20 px-2 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-green-400 text-center disabled:opacity-50"
                  />
                  <input
                    value={item.unit}
                    disabled={batchSaving}
                    onChange={(e) => setBatchItems((prev) => prev.map((b, j) =>
                      j === i ? { ...b, unit: e.target.value } : b
                    ))}
                    placeholder="unit"
                    maxLength={50}
                    className="w-20 px-2 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-green-400 disabled:opacity-50"
                  />
                </div>
              ))}
            </div>

            {batchError && <p className="text-xs text-red-600">{batchError}</p>}

            <div className="flex gap-2">
              <button
                onClick={() => { setBatchOpen(false); setSelectedKeys(new Set()) }}
                disabled={batchSaving}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => void handleSaveAll()}
                disabled={batchSaving}
                className="flex-1 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-40 transition"
              >
                {batchSaving ? 'Saving…' : `Save ${batchItems.length > 1 ? 'all' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Undo toast ── */}
      {undoEntry && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 bg-gray-900 text-white text-sm rounded-2xl shadow-lg">
          <span className="truncate max-w-[160px]">{undoEntry.name} added to cart</span>
          <button
            onClick={() => void handleUndo()}
            className="font-semibold text-green-400 hover:text-green-300 shrink-0 transition"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  )
}
