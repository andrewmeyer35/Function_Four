'use client'

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
  item: PantryRow
  onDelete: (id: string) => void
}

function expiryColor(dateStr: string | null): string {
  if (!dateStr) return ''
  const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000)
  if (days <= 3) return 'text-red-600'
  if (days <= 7) return 'text-amber-600'
  return 'text-green-600'
}

function formatExpiry(dateStr: string | null): string | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function PantryItemCard({ item, onDelete }: Props) {
  const isLowStock =
    item.min_quantity != null &&
    (item.quantity ?? 0) <= item.min_quantity

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
          {isLowStock && (
            <span className="px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium shrink-0">
              Low stock
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          {item.quantity != null ? (
            <span className="text-xs text-gray-500">
              {item.quantity}{item.unit ? ` ${item.unit}` : ''}
              {item.package_size != null && (
                <> of {item.package_size}{item.package_unit ? ` ${item.package_unit}` : ''}</>
              )}
              {item.min_quantity != null ? ` · reorder at ${item.min_quantity}` : ''}
            </span>
          ) : (
            <span className="text-xs text-gray-400">No quantity set</span>
          )}
          {item.expiration_date && (
            <span className={`text-xs font-medium ${expiryColor(item.expiration_date)}`}>
              Exp {formatExpiry(item.expiration_date)}
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onDelete(item.id)}
        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition shrink-0"
        aria-label={`Delete ${item.name}`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14H6L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4h6v2" />
        </svg>
      </button>
    </div>
  )
}
