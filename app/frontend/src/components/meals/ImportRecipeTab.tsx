'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { RecipeUrlInput } from './RecipeUrlInput'
import { RecipeScreenshotUpload } from './RecipeScreenshotUpload'
import { ShareLanding } from './ShareLanding'
import { RecipePreview } from './RecipePreview'
import type { RecipeJSON, RecipeImportSourceType } from '@/lib/meals/types'

interface Props {
  userId: string
  householdId: string | null
}

type Stage =
  | { kind: 'idle' }
  | { kind: 'loading'; label: string }
  | { kind: 'preview'; recipe: RecipeJSON; method: RecipeImportSourceType; confidence: number; sourceUrl?: string; sourceImageUrl?: string }
  | { kind: 'saving'; recipe: RecipeJSON; method: RecipeImportSourceType; confidence: number; sourceUrl?: string; sourceImageUrl?: string }
  | { kind: 'success'; title: string }
  | { kind: 'error'; message: string }

import { useState } from 'react'

export function ImportRecipeTab({ userId: _userId, householdId }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const shareId = searchParams.get('shareId') ?? ''
  const sharedUrl = searchParams.get('sharedUrl')
  const shareError = searchParams.get('shareError')

  const [stage, setStage] = useState<Stage>({ kind: 'idle' })

  // ── URL import ────────────────────────────────────────────────────────────

  async function handleUrl(url: string) {
    setStage({ kind: 'loading', label: 'Fetching and parsing recipe…' })
    try {
      const res = await fetch(`/api/recipe-import/from-url?url=${encodeURIComponent(url)}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Unknown error')
      setStage({
        kind: 'preview',
        recipe: json.recipe,
        method: json.method as RecipeImportSourceType,
        confidence: json.confidence,
        sourceUrl: url,
      })
    } catch (err) {
      setStage({ kind: 'error', message: `Could not import recipe: ${String(err)}` })
    }
  }

  // ── Screenshot / image import ─────────────────────────────────────────────

  async function handleFile(file: File) {
    setStage({ kind: 'loading', label: 'Extracting recipe from image…' })
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/recipe-import/from-image', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Unknown error')
      setStage({
        kind: 'preview',
        recipe: json.recipe,
        method: 'screenshot_ocr',
        confidence: json.confidence,
        sourceImageUrl: json.imageUrl ?? undefined,
      })
    } catch (err) {
      setStage({ kind: 'error', message: `Could not extract recipe: ${String(err)}` })
    }
  }

  // ── Confirm / save ────────────────────────────────────────────────────────

  async function handleConfirm(recipe: RecipeJSON) {
    if (stage.kind !== 'preview') return
    const { method, confidence, sourceUrl, sourceImageUrl } = stage

    setStage({ kind: 'saving', recipe, method, confidence, sourceUrl, sourceImageUrl })
    try {
      const res = await fetch('/api/recipe-import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe,
          sourceUrl: sourceUrl ?? null,
          sourceImageUrl: sourceImageUrl ?? null,
          sourceType: method,
          householdId,
          extractionConfidence: confidence,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Unknown error')

      // Clear share params from URL after successful save
      const params = new URLSearchParams(searchParams.toString())
      params.delete('shareId')
      params.delete('sharedUrl')
      params.delete('sharedImageUrl')
      params.delete('sharedTitle')
      params.delete('shareError')
      router.replace(`/meals?${params.toString()}`)

      setStage({ kind: 'success', title: recipe.title })
    } catch (err) {
      setStage({ kind: 'error', message: `Could not save recipe: ${String(err)}` })
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  // PWA share target — resolve the shared content first
  const hasShareParams = !!(shareId || sharedUrl || shareError)

  return (
    <div className="px-4 flex flex-col gap-5">

      {/* ShareLanding — fires once when share params are present */}
      {hasShareParams && stage.kind === 'idle' && (
        <ShareLanding
          shareId={shareId}
          sharedUrl={sharedUrl}
          shareError={shareError}
          onFile={handleFile}
          onUrl={handleUrl}
          onError={(msg) => setStage({ kind: 'error', message: msg })}
        />
      )}

      {/* Loading */}
      {stage.kind === 'loading' && (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
          <svg
            className="animate-spin text-blue-600"
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

      {/* Recipe preview */}
      {(stage.kind === 'preview' || stage.kind === 'saving') && (
        <RecipePreview
          recipe={stage.recipe}
          confidence={stage.confidence}
          saving={stage.kind === 'saving'}
          onConfirm={handleConfirm}
          onBack={() => setStage({ kind: 'idle' })}
        />
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
            <p className="font-semibold text-gray-900">Recipe saved!</p>
            <p className="text-sm text-gray-500 mt-1">"{stage.title}" is in your meal history.</p>
          </div>
          <button
            onClick={() => setStage({ kind: 'idle' })}
            className="mt-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition"
          >
            Import another
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
          <button
            onClick={() => setStage({ kind: 'idle' })}
            className="self-start text-xs font-medium text-red-600 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Idle — show import method inputs */}
      {stage.kind === 'idle' && (
        <div className="flex flex-col gap-6 py-2">
          <RecipeUrlInput onSubmit={handleUrl} />

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-400 font-medium">or</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <RecipeScreenshotUpload onFile={handleFile} />

          {/* PWA share hint */}
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            <p className="text-xs text-blue-700 leading-relaxed">
              <strong>Share from Instagram or Safari:</strong> Install this app to your home screen, then use the Share button in any browser or app to send a recipe directly here.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
