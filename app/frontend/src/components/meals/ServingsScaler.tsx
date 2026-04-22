'use client'

interface Props {
  servings: number
  onChange: (servings: number) => void
  disabled?: boolean
}

export function ServingsScaler({ servings, onChange, disabled }: Props) {
  function decrement() {
    if (servings > 1) onChange(servings - 1)
  }
  function increment() {
    if (servings < 20) onChange(servings + 1)
  }

  return (
    <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border border-green-100">
      <div>
        <p className="text-sm font-semibold text-gray-900">Servings eaten</p>
        <p className="text-xs text-gray-500 mt-0.5">Deductions scale with serving count</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={decrement}
          disabled={disabled || servings <= 1}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold text-lg flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Decrease servings"
        >
          −
        </button>
        <span className="w-6 text-center font-bold text-gray-900 text-lg tabular-nums">
          {servings}
        </span>
        <button
          type="button"
          onClick={increment}
          disabled={disabled || servings >= 20}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-600 font-bold text-lg flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Increase servings"
        >
          +
        </button>
      </div>
    </div>
  )
}
