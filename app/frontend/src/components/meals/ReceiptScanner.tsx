'use client'

import { useState, useRef, useEffect } from 'react'
import type { ReceiptMatch } from '@/app/api/cart/receipt/route'

interface Props {
  onClose: () => void
  onRemoved: () => void
}

type Stage =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'review'; matches: ReceiptMatch[] }
  | { kind: 'removing' }
  | { kind: 'done'; count: number }
  | { kind: 'error'; message: string }

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const

export function ReceiptScanner({ onClose, onRemoved }: Props) {
  const [stage, setStage] = useState<Stage>({ kind: 'idle' })
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const fileRef = useRef<HTMLInputElement>(null)
  const mountedRef = useRef(true)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
    }
  }, [])

  async function handleFile(file: File) {
    if (!(ACCEPTED as readonly string[]).includes(file.type as typeof ACCEPTED[number])) {
      setStage({ kind: 'error', message: 'Please choose a JPEG, PNG, WebP, or GIF image.' })
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setStage({ kind: 'error', message: 'Image is too large (max 10 MB).' })
      return
    }
    const controller = new AbortController()
    abortRef.current = controller
    setStage({ kind: 'loading' })
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/cart/receipt', {
        method: 'POST',
        body: form,
        signal: controller.signal,
      })
      const json = await res.json() as { matches?: ReceiptMatch[]; error?: string }
      if (!mountedRef.current) return
      if (!res.ok) throw new Error(json.error ?? 'Unknown error')
      const matches = json.matches ?? []
      setCheckedIds(new Set(matches.map((m) => m.cartItemId)))
      setStage({ kind: 'review', matches })
    } catch (err) {
      if (!mountedRef.current) return
      if (err instanceof Error && err.name === 'AbortError') return
      setStage({ kind: 'error', message: err instanceof Error ? err.message : 'Could not read receipt' })
    }
  }

  function toggleCheck(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleRemove() {
    if (stage.kind !== 'review' || checkedIds.size === 0) return
    const controller = new AbortController()
    abortRef.current = controller
    setStage({ kind: 'removing' })
    let removed = 0
    for (const id of checkedIds) {
      try {
        const res = await fetch(`/api/cart/${id}`, { method: 'DELETE', signal: controller.signal })
        if (res.ok) removed++
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        // non-fatal — continue with remaining items
      }
    }
    if (!mountedRef.current) return
    setStage({ kind: 'done', count: removed })
    onRemoved()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
      onClick={() => { if (stage.kind !== 'removing') onClose() }}
    >
      <div
        className="w-full max-w-lg bg-white rounded-t-3xl p-5 flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-gray-200 mx-auto" />

        <div className="flex items-center justify-between">
          <p className="text-base font-semibold text-gray-900">Scan receipt</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Idle */}
        {stage.kind === 'idle' && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-gray-500">Photo your grocery receipt and we'll automatically check off everything you bought.</p>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED.join(',')}
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleFile(file)
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex items-center justify-center gap-3 py-4 rounded-2xl bg-green-600 text-white font-semibold hover:bg-green-700 transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
              Take photo or choose image
            </button>
          </div>
        )}

        {/* Loading */}
        {stage.kind === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <svg className="animate-spin text-green-600" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <p className="text-sm text-gray-500">Reading receipt…</p>
          </div>
        )}

        {/* Review */}
        {stage.kind === 'review' && (
          <div className="flex flex-col gap-4">
            {stage.matches.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-semibold text-gray-900">No matches found</p>
                <p className="text-sm text-gray-500 mt-1">None of the items on the receipt matched your shopping list.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500">
                  Found {stage.matches.length} match{stage.matches.length !== 1 ? 'es' : ''}. Uncheck any that are wrong.
                </p>
                <div className="flex flex-col gap-2">
                  {stage.matches.map((m) => {
                    const checked = checkedIds.has(m.cartItemId)
                    return (
                      <button
                        key={m.cartItemId}
                        onClick={() => toggleCheck(m.cartItemId)}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition ${
                          checked ? 'bg-green-50 border-green-200' : 'bg-white border-gray-100'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition ${
                          checked ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}>
                          {checked && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 capitalize">{m.cartItemName}</p>
                          <p className="text-xs text-gray-400">matched "{m.receiptName}" on receipt</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              {checkedIds.size > 0 && (
                <button
                  onClick={() => void handleRemove()}
                  className="flex-1 py-3 rounded-2xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition"
                >
                  Remove {checkedIds.size} item{checkedIds.size !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Removing */}
        {stage.kind === 'removing' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <svg className="animate-spin text-green-600" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
            <p className="text-sm text-gray-500">Updating your list…</p>
          </div>
        )}

        {/* Done */}
        {stage.kind === 'done' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-base font-semibold text-gray-900">{stage.count} item{stage.count !== 1 ? 's' : ''} removed</p>
              <p className="text-sm text-gray-500 mt-1">Your shopping list is updated.</p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition"
            >
              Done
            </button>
          </div>
        )}

        {/* Error */}
        {stage.kind === 'error' && (
          <div className="flex flex-col gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
            <p className="text-sm text-red-700">{stage.message}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setStage({ kind: 'idle' })}
                className="text-xs font-medium text-red-600 underline"
              >
                Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
