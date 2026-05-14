'use client'

import { useState } from 'react'
import type { RecipeJSON } from '@/lib/meals/types'

interface Props {
  recipe: RecipeJSON
  confidence: number
  onConfirm: (recipe: RecipeJSON) => void
  onBack: () => void
  saving?: boolean
}

export function RecipePreview({ recipe, confidence, onConfirm, onBack, saving }: Props) {
  const [title, setTitle] = useState(recipe.title)
  const [servings, setServings] = useState<string>(String(recipe.servings ?? ''))

  const lowConfidence = confidence < 0.8

  function handleConfirm() {
    onConfirm({
      ...recipe,
      title: title.trim() || recipe.title,
      servings: servings ? parseInt(servings) : null,
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Confidence notice */}
      {lowConfidence && (
        <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Extraction confidence is low — please review the details before saving.</span>
        </div>
      )}

      {/* Editable title */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Recipe name</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={saving}
          className="px-3 py-2 rounded-xl border border-gray-200 text-base font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Meta row */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Servings</label>
          <input
            type="number"
            min="1"
            max="50"
            value={servings}
            onChange={(e) => setServings(e.target.value)}
            disabled={saving}
            placeholder="—"
            className="w-20 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {recipe.prepTimeMinutes != null && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prep</span>
            <span className="px-3 py-2 text-sm text-gray-700">{recipe.prepTimeMinutes} min</span>
          </div>
        )}
        {recipe.cookTimeMinutes != null && (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cook</span>
            <span className="px-3 py-2 text-sm text-gray-700">{recipe.cookTimeMinutes} min</span>
          </div>
        )}
      </div>

      {/* Ingredients */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          Ingredients
          <span className="ml-1.5 text-gray-400 font-normal">({recipe.ingredients.length})</span>
        </h3>
        <ul className="flex flex-col gap-1.5">
          {recipe.ingredients.map((ing, i) => (
            <li key={i} className="flex items-baseline gap-2 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 mt-1.5" />
              <span>
                {ing.quantity != null && (
                  <span className="font-medium text-gray-900">
                    {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}{' '}
                  </span>
                )}
                <span className="text-gray-700">{ing.name}</span>
                {ing.preparation && (
                  <span className="text-gray-400">, {ing.preparation}</span>
                )}
                {ing.isOptional && (
                  <span className="ml-1 text-xs text-gray-400">(optional)</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Steps */}
      {recipe.steps.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-gray-900">
            Instructions
            <span className="ml-1.5 text-gray-400 font-normal">({recipe.steps.length} steps)</span>
          </h3>
          <ol className="flex flex-col gap-3">
            {recipe.steps.map((step) => (
              <li key={step.stepNumber} className="flex gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {step.stepNumber}
                </span>
                <span className="text-gray-700 leading-relaxed">{step.instruction}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Tags */}
      {recipe.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-600">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onBack}
          disabled={saving}
          className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-40"
        >
          Back
        </button>
        <button
          onClick={handleConfirm}
          disabled={saving || !title.trim()}
          className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-95 transition disabled:opacity-40 disabled:scale-100"
        >
          {saving ? 'Saving…' : 'Save Recipe'}
        </button>
      </div>
    </div>
  )
}
