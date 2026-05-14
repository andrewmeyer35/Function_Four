'use client'

import { useRef, useState } from 'react'

interface Props {
  onFile: (file: File) => void
  disabled?: boolean
}

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_MB = 10

export function MealPhotoCapture({ onFile, disabled }: Props) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function validate(file: File): string | null {
    if (!ACCEPTED.includes(file.type)) return 'Please use a JPEG or PNG photo.'
    if (file.size > MAX_MB * 1024 * 1024) return `Photo must be under ${MAX_MB} MB.`
    return null
  }

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    const err = validate(file)
    if (err) { setError(err); return }
    setError(null)
    setPreview(URL.createObjectURL(file))
    onFile(file)
  }

  return (
    <div className="flex flex-col gap-3">
      {preview ? (
        <div className="relative rounded-2xl overflow-hidden border border-gray-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Meal preview" className="w-full max-h-56 object-cover" />
          {!disabled && (
            <button
              type="button"
              onClick={() => { setPreview(null); setError(null) }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center text-xs font-bold hover:bg-black/70"
            >
              ✕
            </button>
          )}
        </div>
      ) : (
        <div className="flex gap-3">
          {/* Take photo (opens camera on mobile) */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => cameraRef.current?.click()}
            className={[
              'flex-1 flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition',
              'hover:bg-gray-100 active:scale-95',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span className="text-xs text-gray-500 font-medium">Take Photo</span>
          </button>

          {/* Choose from gallery */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => galleryRef.current?.click()}
            className={[
              'flex-1 flex flex-col items-center justify-center gap-2 py-5 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 transition',
              'hover:bg-gray-100 active:scale-95',
              disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span className="text-xs text-gray-500 font-medium">Gallery</span>
          </button>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept={ACCEPTED.join(',')}
        capture="environment"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <input
        ref={galleryRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
