'use client'

import { useEffect, useState } from 'react'

interface Props {
  shareId: string
  sharedUrl: string | null
  shareError: string | null
  onFile: (file: File) => void
  onUrl: (url: string) => void
  onError: (msg: string) => void
}

// ShareLanding handles the result of the PWA Web Share Target flow.
//
// After the user shares an image from another app, the service worker
// intercepts the POST to /meals/share, stores the image blob in Cache API
// under the key `/share-cache/{shareId}`, and redirects to
// /meals?tab=import&shareId={shareId}.
//
// This component reads that cache entry and hands the file off to the parent.
export function ShareLanding({ shareId, sharedUrl, shareError, onFile, onUrl, onError }: Props) {
  const [status, setStatus] = useState<'loading' | 'done'>('loading')

  useEffect(() => {
    if (shareError) {
      onError(
        shareError === 'sw_not_ready'
          ? 'The app needs to be installed to home screen before sharing from other apps. Try the file picker below instead.'
          : 'Something went wrong with the share. Please try again.'
      )
      setStatus('done')
      return
    }

    // If a URL was shared (text share), use the URL import flow
    if (sharedUrl) {
      onUrl(sharedUrl)
      setStatus('done')
      return
    }

    // If a shareId is present, retrieve the cached image from the service worker
    if (!shareId) {
      setStatus('done')
      return
    }

    async function retrieveFromCache() {
      try {
        if (!('caches' in window)) {
          onError('Cache API not supported. Please use the file picker instead.')
          return
        }

        const cache = await caches.open('share-cache')
        const cached = await cache.match(`/share-cache/${shareId}`)

        if (!cached) {
          onError('Shared image not found (may have expired). Please use the file picker instead.')
          return
        }

        const blob = await cached.blob()
        const mimeType = blob.type || 'image/jpeg'
        const ext = mimeType.split('/')[1] ?? 'jpg'
        const file = new File([blob], `shared-image.${ext}`, { type: mimeType })

        // Clean up cache entry after retrieval
        await cache.delete(`/share-cache/${shareId}`)

        onFile(file)
      } catch (err) {
        onError(`Failed to retrieve shared image: ${String(err)}`)
      } finally {
        setStatus('done')
      }
    }

    retrieveFromCache()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId, sharedUrl, shareError])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-500">
        <svg
          className="animate-spin"
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
        Loading shared content…
      </div>
    )
  }

  return null
}
