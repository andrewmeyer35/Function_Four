// Four Fs — Service Worker
// Handles Web Share Target (POST /meals/share) for image and URL sharing

const SHARE_CACHE = 'share-target-v1'
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

// ─── Share Target Handler ──────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only intercept POST requests to /meals/share
  if (event.request.method !== 'POST' || url.pathname !== '/meals/share') {
    return
  }

  event.respondWith(handleShareTarget(event.request))
})

async function handleShareTarget(request) {
  try {
    const formData = await request.formData()

    const title = formData.get('title') || ''
    const text  = formData.get('text')  || ''
    const url   = formData.get('url')   || ''
    const files = formData.getAll('media') // matches "name" in manifest.json

    const shareId = crypto.randomUUID()
    const cache = await caches.open(SHARE_CACHE)

    // Store metadata so the app page can read it
    const metadata = {
      shareId,
      title,
      text,
      url,
      fileCount: files.length,
      ts: Date.now(),
    }

    await cache.put(
      `/share-meta/${shareId}`,
      new Response(JSON.stringify(metadata), {
        headers: { 'Content-Type': 'application/json' },
      })
    )

    // Store each shared file
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const arrayBuffer = await file.arrayBuffer()
      await cache.put(
        `/share-file/${shareId}/${i}`,
        new Response(arrayBuffer, {
          headers: { 'Content-Type': file.type || 'image/jpeg' },
        })
      )
    }

    // Redirect to the Import Recipe tab with the share ID
    const redirectUrl = new URL('/meals', self.location.origin)
    redirectUrl.searchParams.set('tab', 'import')
    redirectUrl.searchParams.set('shareId', shareId)

    return Response.redirect(redirectUrl.toString(), 303)
  } catch (err) {
    // If anything fails, fall through to the server handler
    const fallback = new URL('/meals', self.location.origin)
    fallback.searchParams.set('tab', 'import')
    fallback.searchParams.set('shareError', '1')
    return Response.redirect(fallback.toString(), 303)
  }
}

// ─── Lifecycle ────────────────────────────────────────────────────────────

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up share cache entries older than 30 minutes
      try {
        const cache = await caches.open(SHARE_CACHE)
        const keys = await cache.keys()
        const now = Date.now()

        for (const key of keys) {
          if (!key.url.includes('/share-meta/')) continue
          const resp = await cache.match(key)
          if (!resp) continue
          const meta = await resp.json()
          if (now - meta.ts > CACHE_TTL_MS) {
            await cache.delete(key)
            // Delete associated file entries
            const staleFileKeys = keys.filter((k) =>
              k.url.includes(`/share-file/${meta.shareId}/`)
            )
            await Promise.all(staleFileKeys.map((k) => cache.delete(k)))
          }
        }
      } catch {
        // Non-critical — ignore cleanup errors
      }

      await self.clients.claim()
    })()
  )
})
