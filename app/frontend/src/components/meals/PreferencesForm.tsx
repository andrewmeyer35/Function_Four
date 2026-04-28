'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import type { UserPreferences, DietaryRestriction, CuisinePreference, CookingTime } from '@/lib/meals/preferences'
import { DIETARY_OPTIONS, CUISINE_OPTIONS } from '@/lib/meals/preferences'

interface Props {
  initialPreferences: UserPreferences
  fetchError: string | null
}

type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string }

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  )
}

// ─── Multi-select chip grid ───────────────────────────────────────────────────

interface ChipGridProps<T extends string> {
  options: { value: T; label: string }[]
  selected: T[]
  onChange: (next: T[]) => void
  disabled?: boolean
}

function ChipGrid<T extends string>({ options, selected, onChange, disabled }: ChipGridProps<T>) {
  function toggle(value: T) {
    if (disabled) return
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isSelected = selected.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            disabled={disabled}
            className={[
              'px-3 py-1.5 rounded-full border text-sm transition select-none',
              isSelected
                ? 'bg-green-100 text-green-800 border-green-300 font-semibold'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  label,
  subtext,
  children,
}: {
  label: string
  subtext?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-semibold text-gray-900">{label}</p>
        {subtext && <p className="text-xs text-gray-500 mt-0.5">{subtext}</p>}
      </div>
      {children}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PreferencesForm({ initialPreferences, fetchError }: Props) {
  const [dietary, setDietary] = useState<DietaryRestriction[]>(
    initialPreferences.dietary_restrictions ?? []
  )
  const [cuisines, setCuisines] = useState<CuisinePreference[]>(
    initialPreferences.cuisine_preferences ?? []
  )
  const [householdSize, setHouseholdSize] = useState<number>(
    initialPreferences.household_size ?? 2
  )
  const [cookTime, setCookTime] = useState<CookingTime>(
    initialPreferences.weekly_cooking_time ?? 'medium'
  )
  const [disliked, setDisliked] = useState<string[]>(
    initialPreferences.disliked_ingredients ?? []
  )
  const [ingredientInput, setIngredientInput] = useState('')
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' })
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [])

  // ── Disliked ingredient input ───────────────────────────────────────────────

  function addIngredient(raw: string) {
    // Split on commas to support pasting multiple at once
    const names = raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0 && !disliked.includes(s))
    if (names.length > 0) {
      setDisliked((prev) => [...prev, ...names])
    }
    setIngredientInput('')
  }

  function handleIngredientKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addIngredient(ingredientInput)
    } else if (e.key === 'Backspace' && ingredientInput === '' && disliked.length > 0) {
      setDisliked((prev) => prev.slice(0, -1))
    }
  }

  function removeIngredient(name: string) {
    setDisliked((prev) => prev.filter((v) => v !== name))
  }

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (saveState.kind === 'saving') return
    setSaveState({ kind: 'saving' })

    try {
      const res = await fetch('/api/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dietary_restrictions: dietary,
          cuisine_preferences: cuisines,
          household_size: householdSize,
          weekly_cooking_time: cookTime,
          disliked_ingredients: disliked,
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error((json as { error?: string }).error ?? 'Save failed')

      if (!mountedRef.current) return
      setSaveState({ kind: 'saved' })

      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => {
        if (mountedRef.current) setSaveState({ kind: 'idle' })
      }, 2000)
    } catch (err) {
      if (!mountedRef.current) return
      setSaveState({ kind: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
      savedTimerRef.current = setTimeout(() => {
        if (mountedRef.current) setSaveState({ kind: 'idle' })
      }, 5000)
    }
  }, [saveState.kind, dietary, cuisines, householdSize, cookTime, disliked])

  const isSaving = saveState.kind === 'saving'

  // ── Fetch error state ───────────────────────────────────────────────────────

  if (fetchError) {
    return (
      <div className="flex flex-col gap-4">
        <a
          href="/meals"
          className="text-sm text-gray-500 hover:text-gray-700 transition inline-flex items-center gap-1"
        >
          ← Back to meals
        </a>
        <div className="rounded-2xl bg-red-50 border border-red-200 p-5 flex flex-col gap-3">
          <p className="text-sm font-semibold text-red-700">Could not load preferences</p>
          <p className="text-xs text-red-600">{fetchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="self-start px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // ── Main form ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">

      {/* Back nav */}
      <div className="flex items-center justify-between">
        <a
          href="/meals"
          className="text-sm text-gray-500 hover:text-gray-700 transition inline-flex items-center gap-1"
        >
          ← Back to meals
        </a>
      </div>

      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Food preferences</h1>
        <p className="text-sm text-gray-500 mt-1">
          Personalise recipe suggestions and meal plans.
        </p>
      </div>

      {/* ── Dietary restrictions ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
        <Section
          label="Dietary restrictions"
          subtext="We'll filter recipes to match."
        >
          <ChipGrid<DietaryRestriction>
            options={DIETARY_OPTIONS}
            selected={dietary}
            onChange={setDietary}
            disabled={isSaving}
          />
        </Section>
      </div>

      {/* ── Cuisine preferences ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4">
        <Section
          label="Favourite cuisines"
          subtext="Suggestions will favour these."
        >
          <ChipGrid<CuisinePreference>
            options={CUISINE_OPTIONS}
            selected={cuisines}
            onChange={setCuisines}
            disabled={isSaving}
          />
        </Section>
      </div>

      {/* ── Household size ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <Section
          label="Cooking for"
          subtext="Sets default servings."
        >
          <div className="flex items-center gap-4 mt-1">
            <button
              type="button"
              onClick={() => setHouseholdSize((n) => Math.max(1, n - 1))}
              disabled={isSaving || householdSize <= 1}
              aria-label="Decrease household size"
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-700 text-lg font-semibold hover:bg-gray-50 active:scale-95 transition disabled:opacity-40 disabled:scale-100"
            >
              −
            </button>
            <span className="w-8 text-center text-xl font-bold text-gray-900 tabular-nums select-none">
              {householdSize}
            </span>
            <button
              type="button"
              onClick={() => setHouseholdSize((n) => Math.min(10, n + 1))}
              disabled={isSaving || householdSize >= 10}
              aria-label="Increase household size"
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-700 text-lg font-semibold hover:bg-gray-50 active:scale-95 transition disabled:opacity-40 disabled:scale-100"
            >
              +
            </button>
            <span className="text-sm text-gray-500">
              {householdSize === 1 ? 'person' : 'people'}
            </span>
          </div>
        </Section>
      </div>

      {/* ── Cooking time ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <Section label="Typical cook time">
          <div className="flex gap-2 flex-wrap mt-1">
            {(
              [
                { value: 'quick', label: 'Quick', sub: '<30 min' },
                { value: 'medium', label: 'Medium', sub: '30–60 min' },
                { value: 'elaborate', label: 'Elaborate', sub: '60+ min' },
              ] as { value: CookingTime; label: string; sub: string }[]
            ).map((opt) => {
              const isSelected = cookTime === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => !isSaving && setCookTime(opt.value)}
                  disabled={isSaving}
                  className={[
                    'flex-1 min-w-[90px] flex flex-col items-center gap-0.5 py-3 px-2 rounded-xl border text-center transition',
                    isSelected
                      ? 'bg-green-50 border-green-300 text-green-800'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300',
                    isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                  ].join(' ')}
                >
                  <span className={`text-sm font-semibold ${isSelected ? 'text-green-800' : 'text-gray-700'}`}>
                    {opt.label}
                  </span>
                  <span className={`text-xs ${isSelected ? 'text-green-600' : 'text-gray-400'}`}>
                    {opt.sub}
                  </span>
                </button>
              )
            })}
          </div>
        </Section>
      </div>

      {/* ── Disliked ingredients ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <Section
          label="Ingredients to avoid"
          subtext="These will be excluded from suggestions."
        >
          {/* Tag display + input */}
          <div
            className={[
              'min-h-[44px] flex flex-wrap gap-2 items-center px-3 py-2 rounded-xl border transition',
              isSaving
                ? 'bg-gray-50 border-gray-100 cursor-not-allowed'
                : 'bg-white border-gray-200 focus-within:border-green-400',
            ].join(' ')}
          >
            {disliked.map((name) => (
              <span
                key={name}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removeIngredient(name)}
                  disabled={isSaving}
                  aria-label={`Remove ${name}`}
                  className="w-3.5 h-3.5 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition disabled:pointer-events-none"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              onKeyDown={handleIngredientKeyDown}
              onBlur={() => {
                if (ingredientInput.trim()) addIngredient(ingredientInput)
              }}
              disabled={isSaving}
              placeholder={disliked.length === 0 ? 'e.g. coriander, anchovies…' : 'Add more…'}
              className="flex-1 min-w-[120px] text-sm bg-transparent outline-none placeholder-gray-400 disabled:cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-gray-400">
            Press Enter or comma to add. Backspace to remove last.
          </p>
        </Section>
      </div>

      {/* ── Save button + status ── */}
      <div className="flex flex-col gap-2 pb-2">
        {saveState.kind === 'error' && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#dc2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 mt-0.5"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-sm text-red-700">{saveState.message}</p>
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3.5 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:scale-[0.98] transition disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-2"
        >
          {saveState.kind === 'saving' && <Spinner className="text-white" />}
          {saveState.kind === 'saving' && 'Saving…'}
          {saveState.kind === 'saved' && (
            <>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Saved ✓
            </>
          )}
          {(saveState.kind === 'idle' || saveState.kind === 'error') && 'Save preferences'}
        </button>
      </div>
    </div>
  )
}