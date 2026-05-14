'use client'

import { useState, useEffect } from 'react'

interface MissingItem {
  name: string
  quantity: number | null
  unit: string | null
}

interface Props {
  items: MissingItem[]
  weekStart: string
  onClose: () => void
}

type DrawerState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'done' }
  | { kind: 'error'; message: string }

export function MissingIngredientsDrawer({ items, weekStart, onClose }: Props) {
  const [state, setState] = useState<DrawerState>({ kind: 'idle' })

  useEffect(() => {
    if (state.kind === 'done') {
      const timer = setTimeout(() => { onClose() }, 400)
      return () => { clearTimeout(timer) }
    }
  }, [state.kind, onClose])

  async function handleAddAll() {
    setState({ kind: 'saving' })
    try {
      await Promise.all(
        items.map((item) =>
          fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              week_start: weekStart,
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const err = await res.json() as { error?: string }
              throw new Error(err.error ?? 'Failed to add item')
            }
          })
        )
      )
      setState({ kind: 'done' })
    } catch (err: unknown) {
      setState({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to add items',
      })
    }
  }

  const isSaving = state.kind === 'saving'

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-[80vh] overflow-y-auto shadow-xl">
        {/* Drag handle */}
        <div className="mx-auto w-10 h-1 bg-gray-200 rounded-full mb-4" />

        {/* Header */}
        <p className="text-base font-semibold text-gray-900">
          {items.length} item{items.length !== 1 ? 's' : ''} needed
        </p>
        <p className="text-sm text-gray-500 mb-4">Add these to your shopping list?</p>

        {/* Items list */}
        <div className="flex flex-col">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
            >
              <span className="text-sm font-medium text-gray-900">{item.name}</span>
              {(item.quantity != null || item.unit) && (
                <span className="text-xs text-gray-400">
                  {item.quantity != null ? item.quantity : ''}
                  {item.unit ? ` ${item.unit}` : ''}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Add all button */}
        <button
          onClick={handleAddAll}
          disabled={isSaving || state.kind === 'done'}
          className="w-full rounded-xl bg-green-600 text-white text-sm font-medium py-3 mt-4 hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <svg
                className="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
              Adding…
            </>
          ) : (
            'Add all to shopping list'
          )}
        </button>

        {/* Error message */}
        {state.kind === 'error' && (
          <p className="text-sm text-red-600 text-center mt-2">{state.message}</p>
        )}

        {/* Skip link */}
        <p
          className="text-sm text-gray-400 text-center mt-3 cursor-pointer"
          onClick={onClose}
        >
          Skip for now
        </p>
      </div>
    </div>
  )
}
