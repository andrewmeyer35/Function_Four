'use client'

import { useState } from 'react'
import { MealPhotoCapture } from './MealPhotoCapture'
import { DishSearch } from './DishSearch'
import { ServingsScaler } from './ServingsScaler'
import { IngredientConfirmation, buildConfirmationItems } from './IngredientConfirmation'
import type { ConfirmationItem } from './IngredientConfirmation'
import type { MealPhotoAnalysis, PantryMatchResult } from '@/lib/meals/types'

interface Props {
  userId: string
  householdId: string | null
}

type Stage =
  | { kind: 'idle' }
  | { kind: 'loading'; label: string }
  | {
      kind: 'confirm'
      dishName: string
      defaultServings: number
      matches: PantryMatchResult[]
      photoUrl: string | null
      analysisJson: MealPhotoAnalysis | null
      sourceType: 'meal_photo_estimated' | 'confirmed'
    }
  | { kind: 'saving'; dishName: string; sourceType: 'meal_photo_estimated' | 'confirmed'; photoUrl: string | null; analysisJson: MealPhotoAnalysis | null }
  | { kind: 'success'; dishName: string; loggedCount: number }
  | { kind: 'error'; message: string }

export function LogMealTab({ userId: _userId, householdId }: Props) {
  const [stage, setStage] = useState<Stage>({ kind: 'idle' })
  const [servings, setServings] = useState(1)
  const [items, setItems] = useState<ConfirmationItem[]>([])

  // ── Photo path ────────────────────────────────────────────────────────────

  async function handlePhoto(file: File) {
    setStage({ kind: 'loading', label: 'Analyzing your meal…' })
    try {
      const form = new FormData()
      form.append('file', file)
      if (householdId) form.append('householdId', householdId)

      const res = await fetch('/api/meal-log/analyze-photo', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Unknown error')

      const analysis: MealPhotoAnalysis = json.analysis
      const matches: PantryMatchResult[] = json.matches

      const detected = analysis.estimatedServings ?? 1
      setServings(detected)
      const initialItems = buildConfirmationItems(matches, 1) // multiplier applied on render
      setItems(initialItems)

      setStage({
        kind: 'confirm',
        dishName: analysis.dish,
        defaultServings: detected,
        matches,
        photoUrl: json.photoUrl ?? null,
        analysisJson: analysis,
        sourceType: 'meal_photo_estimated',
      })
    } catch (err) {
      setStage({ kind: 'error', message: `Photo analysis failed: ${String(err)}` })
    }
  }

  // ── Dish search path ──────────────────────────────────────────────────────

  async function handleDishSelect(dish: { id: number; title: string }) {
    setStage({ kind: 'loading', label: `Loading ingredients for "${dish.title}"…` })
    try {
      const params = new URLSearchParams({ id: String(dish.id) })
      if (householdId) params.set('householdId', householdId)

      const res = await fetch(`/api/meal-log/dish-ingredients?${params.toString()}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Unknown error')

      const matches: PantryMatchResult[] = json.matches
      const detected: number = json.defaultServings ?? 2

      setServings(detected)
      setItems(buildConfirmationItems(matches, 1))

      setStage({
        kind: 'confirm',
        dishName: json.dishName,
        defaultServings: detected,
        matches,
        photoUrl: null,
        analysisJson: null,
        sourceType: 'confirmed',
      })
    } catch (err) {
      setStage({ kind: 'error', message: `Could not load dish ingredients: ${String(err)}` })
    }
  }

  // ── Servings change → rescale deduction quantities ─────────────────────

  function handleServingsChange(newServings: number) {
    if (stage.kind !== 'confirm') return
    const multiplier = newServings / Math.max(servings, 1)
    setServings(newServings)
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        deductQuantity:
          item.deductQuantity != null
            ? parseFloat((item.deductQuantity * multiplier).toFixed(2))
            : null,
      }))
    )
  }

  // ── Confirm / save ────────────────────────────────────────────────────────

  async function handleConfirm() {
    if (stage.kind !== 'confirm') return

    setStage({ kind: 'saving', dishName: stage.dishName, sourceType: stage.sourceType, photoUrl: stage.photoUrl, analysisJson: stage.analysisJson })
    try {
      const res = await fetch('/api/meal-log/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishName: stage.dishName,
          servings,
          householdId,
          photoUrl: stage.photoUrl,
          analysisJson: stage.analysisJson,
          sourceType: stage.sourceType,
          items,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Unknown error')

      setStage({
        kind: 'success',
        dishName: stage.dishName,
        loggedCount: json.loggedCount as number,
      })
    } catch (err) {
      setStage({ kind: 'error', message: `Could not save meal log: ${String(err)}` })
    }
  }

  function reset() {
    setStage({ kind: 'idle' })
    setServings(1)
    setItems([])
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const isConfirmStage = stage.kind === 'confirm' || stage.kind === 'saving'

  return (
    <div className="px-4 flex flex-col gap-5">

      {/* Loading */}
      {stage.kind === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <svg
            className="animate-spin text-green-600"
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          <p className="text-sm text-gray-500">{stage.label}</p>
        </div>
      )}

      {/* Confirm stage */}
      {isConfirmStage && (
        <div className="flex flex-col gap-4">
          {/* Dish header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 capitalize">{stage.dishName}</p>
              <p className="text-xs text-gray-400">
                {stage.sourceType === 'meal_photo_estimated' ? 'Detected from photo' : 'From dish search'}
              </p>
            </div>
          </div>

          <ServingsScaler
            servings={servings}
            onChange={handleServingsChange}
            disabled={stage.kind === 'saving'}
          />

          <IngredientConfirmation
            items={items}
            onChange={setItems}
            disabled={stage.kind === 'saving'}
          />

          <div className="flex gap-3 pt-1">
            <button
              onClick={reset}
              disabled={stage.kind === 'saving'}
              className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-40"
            >
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={stage.kind === 'saving'}
              className="flex-1 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 active:scale-95 transition disabled:opacity-40 disabled:scale-100"
            >
              {stage.kind === 'saving' ? 'Logging…' : 'Log Meal'}
            </button>
          </div>
        </div>
      )}

      {/* Success */}
      {stage.kind === 'success' && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Meal logged!</p>
            <p className="text-sm text-gray-500 mt-1">
              {stage.dishName} — {stage.loggedCount} ingredient{stage.loggedCount !== 1 ? 's' : ''} deducted from pantry.
            </p>
          </div>
          <button
            onClick={reset}
            className="mt-2 px-5 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
          >
            Log another meal
          </button>
        </div>
      )}

      {/* Error */}
      {stage.kind === 'error' && (
        <div className="flex flex-col gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
          <div className="flex items-start gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <p className="text-sm text-red-700">{stage.message}</p>
          </div>
          <button onClick={reset} className="self-start text-xs font-medium text-red-600 underline">
            Try again
          </button>
        </div>
      )}

      {/* Idle — entry points */}
      {stage.kind === 'idle' && (
        <div className="flex flex-col gap-6 py-2">
          {/* Photo section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">Photo your meal</p>
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">AI</span>
            </div>
            <MealPhotoCapture onFile={handlePhoto} />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          {/* Dish search section */}
          <DishSearch onSelect={handleDishSelect} />
        </div>
      )}
    </div>
  )
}
