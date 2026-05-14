'use client'

import { useState } from 'react'
import type { PantryMatchResult } from '@/lib/meals/types'

export interface ConfirmationItem {
  ingredientName: string
  pantryItemId: string | null
  pantryItemName: string | null
  matchConfidence: number
  deductQuantity: number | null
  deductUnit: string | null
  included: boolean
}

interface Props {
  items: ConfirmationItem[]
  onChange: (items: ConfirmationItem[]) => void
  disabled?: boolean
}

export function buildConfirmationItems(
  matches: PantryMatchResult[],
  servingsMultiplier: number
): ConfirmationItem[] {
  return matches.map((m) => ({
    ingredientName: m.extractedIngredient.name,
    pantryItemId: m.pantryItemId,
    pantryItemName: m.pantryItemName,
    matchConfidence: m.matchConfidence,
    deductQuantity:
      m.suggestedDeductionQuantity != null
        ? parseFloat((m.suggestedDeductionQuantity * servingsMultiplier).toFixed(2))
        : null,
    deductUnit: m.suggestedDeductionUnit,
    // Include matched items by default; exclude unmatched ones
    included: m.pantryItemId !== null,
  }))
}

export function IngredientConfirmation({ items, onChange, disabled }: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  function toggle(idx: number) {
    onChange(items.map((item, i) => (i === idx ? { ...item, included: !item.included } : item)))
  }

  function setQty(idx: number, raw: string) {
    const qty = parseFloat(raw)
    onChange(
      items.map((item, i) =>
        i === idx ? { ...item, deductQuantity: isNaN(qty) ? null : qty } : item
      )
    )
  }

  const includedCount = items.filter((i) => i.included).length

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">
          Pantry deductions
        </h3>
        <span className="text-xs text-gray-400">{includedCount} of {items.length} selected</span>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No ingredients to deduct.</p>
      )}

      <ul className="flex flex-col gap-2">
        {items.map((item, idx) => {
          const matched = item.pantryItemId !== null
          const expanded = expandedIdx === idx

          return (
            <li
              key={idx}
              className={[
                'rounded-2xl border transition',
                item.included
                  ? matched
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-white'
                  : 'border-gray-100 bg-gray-50 opacity-60',
              ].join(' ')}
            >
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Checkbox */}
                <button
                  type="button"
                  onClick={() => !disabled && toggle(idx)}
                  disabled={disabled}
                  className={[
                    'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition',
                    item.included
                      ? matched
                        ? 'bg-green-500 border-green-500'
                        : 'bg-gray-500 border-gray-500'
                      : 'border-gray-300 bg-white',
                  ].join(' ')}
                  aria-label={item.included ? 'Deselect' : 'Select'}
                >
                  {item.included && (
                    <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                      <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>

                {/* Name + match info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate capitalize">
                    {item.ingredientName}
                  </p>
                  {matched ? (
                    <p className="text-xs text-green-700">
                      Matches "{item.pantryItemName}" · {Math.round(item.matchConfidence * 100)}% confidence
                    </p>
                  ) : (
                    <p className="text-xs text-gray-400">Not in pantry</p>
                  )}
                </div>

                {/* Quantity badge + expand toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  {item.deductQuantity != null && item.included && (
                    <span className="text-xs font-medium text-gray-600 tabular-nums">
                      −{item.deductQuantity}{item.deductUnit ? ` ${item.deductUnit}` : ''}
                    </span>
                  )}
                  {matched && item.included && (
                    <button
                      type="button"
                      onClick={() => setExpandedIdx(expanded ? null : idx)}
                      disabled={disabled}
                      className="text-gray-400 hover:text-gray-600 transition"
                      aria-label="Edit quantity"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded quantity editor */}
              {expanded && (
                <div className="px-4 pb-3 flex items-center gap-2 border-t border-green-100 pt-3">
                  <label className="text-xs text-gray-500 w-28">Deduct quantity:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.deductQuantity ?? ''}
                    onChange={(e) => setQty(idx, e.target.value)}
                    disabled={disabled}
                    className="w-20 px-2 py-1 rounded-lg border border-gray-200 text-sm outline-none focus:ring-2 focus:ring-green-500"
                  />
                  {item.deductUnit && (
                    <span className="text-xs text-gray-500">{item.deductUnit}</span>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {items.some((i) => !i.pantryItemId) && (
        <p className="text-xs text-gray-400">
          Unmatched ingredients won't adjust your pantry but will be logged.
        </p>
      )}
    </div>
  )
}
