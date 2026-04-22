'use client'

import { useState } from 'react'

interface Props {
  onSubmit: (url: string) => void
  disabled?: boolean
}

export function RecipeUrlInput({ onSubmit, disabled }: Props) {
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)

  function isValidUrl(s: string) {
    try {
      const u = new URL(s)
      return u.protocol === 'http:' || u.protocol === 'https:'
    } catch {
      return false
    }
  }

  const invalid = touched && value.trim() !== '' && !isValidUrl(value)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched(true)
    if (!isValidUrl(value)) return
    onSubmit(value.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">Paste a recipe URL</label>
      <div className="flex gap-2">
        <input
          type="url"
          placeholder="https://..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          className={[
            'flex-1 px-3 py-2.5 rounded-xl border text-sm outline-none transition',
            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            invalid ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-white',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className={[
            'px-4 py-2.5 rounded-xl text-sm font-semibold transition',
            'bg-blue-600 text-white',
            'hover:bg-blue-700 active:scale-95',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100',
          ].join(' ')}
        >
          Import
        </button>
      </div>
      {invalid && (
        <p className="text-xs text-red-500">Please enter a valid URL starting with https://</p>
      )}
    </form>
  )
}
