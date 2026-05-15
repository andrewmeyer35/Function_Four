'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ShoppingList } from './ShoppingList'
import { getWeekStart } from '@/lib/meals/utils'

interface ShoppingItem {
  ingredientName: string
  neededQty: number | null
  unit: string | null
  haveQty: number
  buyQty: number | null
  pantryItemId: string | null
  reason: 'from_meal_plan' | 'low_stock'
  mealAttribution: string[]
}

interface LowStockItem {
  id: string
  name: string
  quantity: number | null
  unit: string | null
  min_quantity: number | null
}

interface Props {
  userId: string
  householdId: string | null
}

export function GroceryTab({ userId, householdId }: Props) {
  const weekStart = getWeekStart()
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([])
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([])
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(true)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => {
    mountedRef.current = false
    abortRef.current?.abort()
  }, [])

  const loadShoppingList = useCallback(async () => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    try {
      const res = await fetch(`/api/shopping-list?weekStart=${weekStart}`, { signal: controller.signal })
      if (!mountedRef.current) return
      const json = await res.json() as { shoppingItems: ShoppingItem[]; lowStockItems: LowStockItem[] }
      if (!mountedRef.current) return
      setShoppingItems(json.shoppingItems ?? [])
      setLowStockItems(json.lowStockItems ?? [])
    } catch (err) {
      if (!mountedRef.current) return
      if (err instanceof Error && err.name === 'AbortError') return
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }, [weekStart])

  useEffect(() => { void loadShoppingList() }, [loadShoppingList])

  return (
    <div className="px-4 pb-6">
      <ShoppingList
        shoppingItems={shoppingItems}
        lowStockItems={lowStockItems}
        weekStart={weekStart}
        userId={userId}
        householdId={householdId}
        loading={loading}
        onBought={loadShoppingList}
      />
    </div>
  )
}
