'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

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
  image_url: string | null
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
  const [imageUrl, setImageUrl] = useState<string | null>(item.image_url)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isLowStock =
    item.min_quantity != null &&
    (item.quantity ?? 0) <= item.min_quantity

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const ext = file.type.includes('png') ? 'png' : 'jpg'
      const path = `${user.id}/${item.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('pantry-photos')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('pantry-photos').getPublicUrl(path)
      // Cache-bust so the new image shows immediately after upsert
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

      const res = await fetch(`/api/pantry/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_url: urlData.publicUrl }),
      })
      if (!res.ok) throw new Error('Failed to save photo URL')

      setImageUrl(publicUrl)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Photo thumbnail + camera button */}
      <div className="relative shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="w-10 h-10 rounded-xl object-cover"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </div>
        )}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 transition disabled:opacity-50"
          aria-label={imageUrl ? 'Change photo' : 'Add photo'}
          title={imageUrl ? 'Change photo' : 'Add photo'}
        >
          {uploading ? (
            <svg className="animate-spin text-gray-400" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => void handleFileSelect(e)}
        />
      </div>

      {/* Text content */}
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
          {uploadError && (
            <span className="text-xs text-red-500">{uploadError}</span>
          )}
        </div>
      </div>

      {/* Delete button */}
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
