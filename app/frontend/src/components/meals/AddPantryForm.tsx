'use client'

import { useState } from 'react'

interface Props {
  onAdd: (item: {
    name: string
    quantity: number | null
    unit: string | null
    min_quantity: number | null
    expiration_date: string | null
    category: string | null
    package_size: number | null
    package_unit: string | null
  }) => Promise<void>
}

export function AddPantryForm({ onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [unit, setUnit] = useState('')
  const [minQty, setMinQty] = useState('')
  const [expiry, setExpiry] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    try {
      const qty = quantity ? parseFloat(quantity) : null
      await onAdd({
        name: name.trim(),
        quantity: qty,
        unit: unit.trim() || null,
        min_quantity: minQty ? parseFloat(minQty) : null,
        expiration_date: expiry || null,
        category: null,
        package_size: qty,
        package_unit: unit.trim() || null,
      })
      setName(''); setQuantity(''); setUnit(''); setMinQty(''); setExpiry('')
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-500 hover:border-green-300 hover:text-green-700 transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Add pantry item
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card rounded-2xl p-4 flex flex-col gap-3 border border-green-100">
      <p className="text-sm font-semibold text-gray-900">New item</p>

      <input
        required
        placeholder="Item name *"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-green-400"
      />

      <div className="flex gap-2">
        <input
          type="number"
          step="any"
          min="0"
          placeholder="Qty"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-green-400"
        />
        <input
          placeholder="Unit (g, cups…)"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-green-400"
        />
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          step="any"
          min="0"
          placeholder="Reorder when below"
          value={minQty}
          onChange={(e) => setMinQty(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-green-400"
        />
        <input
          type="date"
          value={expiry}
          onChange={(e) => setExpiry(e.target.value)}
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:border-green-400 text-gray-700"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-40 transition"
        >
          {saving ? 'Adding…' : 'Add'}
        </button>
      </div>
    </form>
  )
}
