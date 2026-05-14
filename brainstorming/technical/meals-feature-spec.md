# Meals Feature — Technical Spec
## PWA Web Share Target API + /meals Page Architecture
**Date:** 2026-04-21 | **Session:** 7 | **Status:** Spec complete, not yet built

---

## Table of Contents

1. [Part 1 — Web Share Target API](#part-1--web-share-target-api)
   - [1.1 How It Works](#11-how-it-works)
   - [1.2 Browser Support Matrix](#12-browser-support-matrix)
   - [1.3 PWA Installation Requirement](#13-pwa-installation-requirement)
   - [1.4 manifest.json Configuration](#14-manifestjson-configuration)
   - [1.5 Service Worker Share Handler](#15-service-worker-share-handler)
   - [1.6 Next.js Route Handler](#16-nextjs-route-handler)
   - [1.7 URL Share Flow (GET method)](#17-url-share-flow-get-method)
   - [1.8 Share Landing Page Component](#18-share-landing-page-component)
   - [1.9 End-to-End UX Flow](#19-end-to-end-ux-flow)
2. [Part 2 — /meals Page Architecture](#part-2--meals-page-architecture)
   - [2.1 Navigation Integration](#21-navigation-integration)
   - [2.2 Page Layout and Tab Structure](#22-page-layout-and-tab-structure)
   - [2.3 Tab 1: Suggestions](#23-tab-1-suggestions)
   - [2.4 Tab 2: Log Meal](#24-tab-2-log-meal)
   - [2.5 Tab 3: Import Recipe](#25-tab-3-import-recipe)
   - [2.6 Tab 4: History](#26-tab-4-history)
   - [2.7 Shared Ingredient Confirmation Screen](#27-shared-ingredient-confirmation-screen)
   - [2.8 Share Target Deep Link Integration](#28-share-target-deep-link-integration)
   - [2.9 Component List](#29-component-list)
   - [2.10 File Structure](#210-file-structure)

---

---

# PART 1 — Web Share Target API

---

## 1.1 How It Works

The Web Share Target API (Level 2) allows an installed PWA to register itself as a share target — appearing in the native OS share sheet alongside Messages, WhatsApp, and other apps. When the user selects the PWA from the share sheet, the browser navigates to the URL defined in `share_target.action` and delivers the shared payload as either query string parameters (GET) or multipart form data (POST).

There are two distinct share modes:

**Mode A — URL/text sharing (GET)**
The share sheet sends title, text, and URL as query string parameters. The app's page receives them via `useSearchParams()`. No service worker needed. Works for: sharing an Instagram post URL, sharing a recipe website link.

**Mode B — File/image sharing (POST)**
The share sheet sends files as `multipart/form-data`. Because this is a POST with a body, the browser routes the request through the service worker's `fetch` event BEFORE it reaches the server. The service worker must intercept it, store the file in a client-accessible cache (Cache API or IndexedDB), then redirect the user to the app page. The page then reads the cached file and presents the confirmation UI. Works for: sharing an Instagram story screenshot, sharing a photo.

---

## 1.2 Browser Support Matrix

| Browser / Platform | Share API (send) | Share Target API (receive) | File Sharing (Level 2) |
|---|---|---|---|
| **Android Chrome 76+** | YES | YES | YES |
| **Android Samsung Internet** | YES | YES | YES |
| **Android Edge** | YES | YES | YES (via Chrome engine) |
| **Android Firefox** | YES | NO | NO |
| **iOS Safari 15.1+** | YES | **NO** | **NO** |
| **iOS Chrome / Firefox** | YES (uses Safari engine) | **NO** | **NO** |
| **macOS Safari** | YES | **NO** | **NO** |
| **Desktop Chrome** | Partial | **NO** | **NO** |
| **Desktop Edge** | Partial | **NO** | **NO** |
| **Desktop Firefox** | NO | NO | NO |

**Critical finding:** iOS Safari does not support the Web Share Target API as of 2025-2026. The WebKit bug (webkit.org/b/194593) has been open since 2019 with no implementation timeline. iOS users cannot receive shares into the PWA from the share sheet.

**Mitigation strategy for iOS users:** Provide an alternate import path — a "paste a link" input and a camera/file picker "upload screenshot" button inside the app. These work on all platforms including iOS.

**Fallback for non-installed users:** A user who has not installed the PWA will NOT see the app in their share sheet. Provide an in-app prompt to install on first use of any meal feature.

---

## 1.3 PWA Installation Requirement

The share target ONLY works when the PWA is installed to the home screen. There is no fallback for browser-only users.

**How to trigger the Add to Home Screen prompt:**
The browser fires `beforeinstallprompt` when it determines the app is installable. This event can be captured and stored, then triggered by a button in the UI. Installability requirements: the app must have a valid `manifest.json` with `name`, `short_name`, `start_url`, `display: "standalone"`, at least one icon (192x192 and 512x512 PNG), and must be served over HTTPS.

**Install prompt component (add to meals page):**
```tsx
// src/components/ui/InstallPrompt.tsx
'use client'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => setInstalled(true))
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  if (installed || !prompt) return null

  return (
    <div className="mx-4 mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-indigo-900">Install the app</p>
        <p className="text-xs text-indigo-600 mt-0.5">
          Share recipes from Instagram directly to Meals
        </p>
      </div>
      <button
        onClick={async () => {
          await prompt.prompt()
          const { outcome } = await prompt.userChoice
          if (outcome === 'accepted') setInstalled(true)
          setPrompt(null)
        }}
        className="flex-shrink-0 bg-indigo-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
      >
        Add to Home Screen
      </button>
    </div>
  )
}
```

---

## 1.4 manifest.json Configuration

Place at: `app/frontend/public/manifest.json`

This single manifest handles BOTH share modes (URL and files) with two separate `share_target` entries — but note: the spec only allows one `share_target` per manifest. The solution is to handle both in a single entry by accepting files and also mapping text/url params:

```json
{
  "name": "Four Fs",
  "short_name": "Four Fs",
  "description": "Household accountability + smart meals",
  "start_url": "/household",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4f46e5",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "share_target": {
    "action": "/meals/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url",
      "files": [
        {
          "name": "media",
          "accept": ["image/jpeg", "image/png", "image/webp", "image/gif"]
        }
      ]
    }
  }
}
```

**Why POST for everything:** Using POST with `enctype: multipart/form-data` means the route receives all data (files + title + text + url) in one consistent format. The route inspects what it got — file present → image OCR flow; url present + no file → URL extraction flow.

**Note on dual targets:** Some implementations register a second `share_target` with `method: GET` to handle URL-only shares differently (simpler, no service worker needed). However, only one `share_target` key is allowed per manifest. The POST approach unifies both.

**Reference the manifest in layout.tsx:**
```tsx
// In app/frontend/src/app/layout.tsx — add to <head>
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#4f46e5" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

---

## 1.5 Service Worker Share Handler

When the share target uses `method: POST`, the browser sends the POST to `/meals/share`. The service worker intercepts this fetch event BEFORE it hits the server. The service worker stores the file in the Cache API, then redirects to the actual app page with a cache key as a query parameter.

**File:** `app/frontend/public/sw.js`

```js
// public/sw.js
const SHARE_CACHE = 'share-target-v1'

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Only intercept POST to /meals/share
  if (
    event.request.method !== 'POST' ||
    url.pathname !== '/meals/share'
  ) {
    return
  }

  event.respondWith(handleShareTarget(event.request))
})

async function handleShareTarget(request) {
  const formData = await request.formData()

  const title = formData.get('title') || ''
  const text = formData.get('text') || ''
  const url = formData.get('url') || ''
  const files = formData.getAll('media') // matches "name" in manifest

  const shareId = crypto.randomUUID()
  const cache = await caches.open(SHARE_CACHE)

  const metadata = { shareId, title, text, url, fileCount: files.length, ts: Date.now() }

  // Cache the metadata
  await cache.put(
    `/share-meta/${shareId}`,
    new Response(JSON.stringify(metadata), {
      headers: { 'Content-Type': 'application/json' }
    })
  )

  // Cache each file
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const arrayBuffer = await file.arrayBuffer()
    await cache.put(
      `/share-file/${shareId}/${i}`,
      new Response(arrayBuffer, {
        headers: { 'Content-Type': file.type || 'image/jpeg' }
      })
    )
  }

  // Redirect to the meals import tab with the shareId
  const redirectUrl = new URL('/meals', self.location.origin)
  redirectUrl.searchParams.set('tab', 'import')
  redirectUrl.searchParams.set('shareId', shareId)

  return Response.redirect(redirectUrl.toString(), 303)
}

// Clean up share cache entries older than 30 minutes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(SHARE_CACHE)
      const keys = await cache.keys()
      const now = Date.now()
      for (const key of keys) {
        if (key.url.includes('/share-meta/')) {
          const resp = await cache.match(key)
          if (resp) {
            const meta = await resp.json()
            if (now - meta.ts > 30 * 60 * 1000) {
              // Delete metadata
              await cache.delete(key)
              // Delete associated files
              const shareId = meta.shareId
              const fileKeys = keys.filter(k => k.url.includes(`/share-file/${shareId}/`))
              await Promise.all(fileKeys.map(k => cache.delete(k)))
            }
          }
        }
      }
    })()
  )
})

// Standard install/activate lifecycle
self.addEventListener('install', () => self.skipWaiting())
```

**Register the service worker** in the root layout or a client component:

```tsx
// src/app/providers.tsx — add to existing Providers component
'use client'
import { useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error)
    }
  }, [])

  return <>{children}</>
}
```

---

## 1.6 Next.js Route Handler

Even though the service worker intercepts the POST and redirects the user, you STILL need a route at `/meals/share` that the browser initially targets. This is because on first load (or if the SW is not yet installed), the request may reach the server. The route handler also handles the case where the SW is unavailable.

**File:** `src/app/(app)/meals/share/route.ts`

```ts
// src/app/(app)/meals/share/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  try {
    const formData = await req.formData()

    const title = formData.get('title') as string | null
    const text = formData.get('text') as string | null
    const url = formData.get('url') as string | null
    const files = formData.getAll('media') as File[]

    // If a file was shared (image), upload to Supabase Storage
    if (files.length > 0 && files[0] instanceof File) {
      const file = files[0]
      const ext = file.type.split('/')[1] || 'jpg'
      const filename = `share-${user.id}-${Date.now()}.${ext}`

      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const { data: upload, error: uploadError } = await supabase.storage
        .from('meal-photos')
        .upload(`shares/${filename}`, buffer, {
          contentType: file.type,
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('meal-photos')
        .getPublicUrl(`shares/${filename}`)

      // Redirect to meals import tab with the storage URL
      const redirectUrl = new URL('/meals', req.url)
      redirectUrl.searchParams.set('tab', 'import')
      redirectUrl.searchParams.set('sharedImageUrl', publicUrl)
      if (title) redirectUrl.searchParams.set('sharedTitle', title)
      return NextResponse.redirect(redirectUrl, 303)
    }

    // If a URL was shared (no file)
    if (url) {
      const redirectUrl = new URL('/meals', req.url)
      redirectUrl.searchParams.set('tab', 'import')
      redirectUrl.searchParams.set('sharedUrl', url)
      if (title) redirectUrl.searchParams.set('sharedTitle', title)
      return NextResponse.redirect(redirectUrl, 303)
    }

    // Fallback — just open the import tab
    return NextResponse.redirect(new URL('/meals?tab=import', req.url), 303)

  } catch (err) {
    console.error('[share-target] error:', err)
    return NextResponse.redirect(new URL('/meals?tab=import&shareError=1', req.url), 303)
  }
}

// Handle GET requests (for browsers that might use GET mode)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const url = searchParams.get('url') || ''
  const title = searchParams.get('title') || ''

  const redirectUrl = new URL('/meals', req.url)
  redirectUrl.searchParams.set('tab', 'import')
  if (url) redirectUrl.searchParams.set('sharedUrl', url)
  if (title) redirectUrl.searchParams.set('sharedTitle', title)
  return NextResponse.redirect(redirectUrl, 303)
}
```

---

## 1.7 URL Share Flow (GET method)

When a user shares an Instagram post URL or recipe website link, the share sheet sends the URL as a string (in the `url` param of the form data with POST, or as a query string with GET). The flow is simpler — no file caching needed:

1. User taps "Share" on a recipe website in Safari/Chrome
2. Selects "Four Fs" from share sheet
3. Browser sends POST to `/meals/share` with `url=https://...`
4. Service worker intercepts: no file → skips caching → redirects to `/meals?tab=import&sharedUrl=https://...`
5. OR: Next.js route receives it (if SW not yet active) → same redirect
6. `/meals` page opens on Import Recipe tab with the URL pre-loaded in the text field
7. User taps "Extract Recipe" → URL extraction pipeline runs

---

## 1.8 Share Landing Page Component

This component is rendered on the `/meals` page when the Import Recipe tab opens with a `shareId` (from SW cache) or `sharedImageUrl` / `sharedUrl` query params.

**File:** `src/components/meals/ShareLanding.tsx`

```tsx
'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'

type ShareState =
  | { type: 'idle' }
  | { type: 'loading' }
  | { type: 'image'; objectUrl: string; file: File }
  | { type: 'url'; url: string; title: string }
  | { type: 'serverImage'; imageUrl: string }
  | { type: 'error'; message: string }

interface ShareLandingProps {
  onImageReady: (file: File, previewUrl: string) => void
  onUrlReady: (url: string) => void
  onServerImageReady: (imageUrl: string) => void
}

export function ShareLanding({ onImageReady, onUrlReady, onServerImageReady }: ShareLandingProps) {
  const searchParams = useSearchParams()
  const [state, setState] = useState<ShareState>({ type: 'idle' })

  useEffect(() => {
    const shareId = searchParams.get('shareId')
    const sharedImageUrl = searchParams.get('sharedImageUrl')
    const sharedUrl = searchParams.get('sharedUrl')
    const sharedTitle = searchParams.get('sharedTitle') || ''
    const shareError = searchParams.get('shareError')

    if (shareError) {
      setState({ type: 'error', message: 'Something went wrong receiving the share. Try pasting the link manually.' })
      return
    }

    // Path 1: Service worker cached the file — retrieve from Cache API
    if (shareId) {
      setState({ type: 'loading' })
      retrieveFromSwCache(shareId)
        .then((result) => {
          if (!result) {
            setState({ type: 'error', message: 'Cached share expired. Please try sharing again.' })
            return
          }
          if (result.type === 'image') {
            setState(result)
            onImageReady(result.file, result.objectUrl)
          } else if (result.type === 'url') {
            setState(result)
            onUrlReady(result.url)
          }
        })
        .catch(() => setState({ type: 'error', message: 'Failed to read shared content.' }))
      return
    }

    // Path 2: Server uploaded the image to Supabase Storage
    if (sharedImageUrl) {
      setState({ type: 'serverImage', imageUrl: sharedImageUrl })
      onServerImageReady(sharedImageUrl)
      return
    }

    // Path 3: URL was shared
    if (sharedUrl) {
      setState({ type: 'url', url: sharedUrl, title: sharedTitle })
      onUrlReady(sharedUrl)
      return
    }
  }, [searchParams])

  if (state.type === 'idle') return null

  if (state.type === 'loading') {
    return (
      <div className="mx-4 mb-4 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-indigo-700 font-medium">Loading shared content...</p>
        </div>
      </div>
    )
  }

  if (state.type === 'error') {
    return (
      <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
        <p className="text-sm text-red-700">{state.message}</p>
      </div>
    )
  }

  if (state.type === 'image' || state.type === 'serverImage') {
    const imgSrc = state.type === 'image' ? state.objectUrl : state.imageUrl
    return (
      <div className="mx-4 mb-4 p-3 bg-green-50 border border-green-100 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-green-800">Screenshot received</p>
        </div>
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
          <Image src={imgSrc} alt="Shared screenshot" fill className="object-cover" />
        </div>
        <p className="text-xs text-green-700 mt-2">
          Ready to extract recipe ingredients from this image.
        </p>
      </div>
    )
  }

  if (state.type === 'url') {
    return (
      <div className="mx-4 mb-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-4 h-4 text-blue-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-blue-800">Link received</p>
        </div>
        <p className="text-xs text-blue-600 truncate">{state.url}</p>
        <p className="text-xs text-blue-500 mt-1">Ready to extract recipe. Tap "Extract Recipe" below.</p>
      </div>
    )
  }

  return null
}

// Reads from the service worker's Cache API storage
async function retrieveFromSwCache(shareId: string): Promise<ShareState | null> {
  if (!('caches' in window)) return null

  const cache = await caches.open('share-target-v1')

  const metaResponse = await cache.match(`/share-meta/${shareId}`)
  if (!metaResponse) return null

  const meta = await metaResponse.json()

  if (meta.fileCount > 0) {
    const fileResponse = await cache.match(`/share-file/${shareId}/0`)
    if (!fileResponse) return null

    const blob = await fileResponse.blob()
    const file = new File([blob], 'shared-image.jpg', { type: blob.type })
    const objectUrl = URL.createObjectURL(blob)

    return { type: 'image', file, objectUrl }
  }

  if (meta.url) {
    return { type: 'url', url: meta.url, title: meta.title }
  }

  return null
}
```

---

## 1.9 End-to-End UX Flow

### Flow A — Sharing an Instagram screenshot (Android Chrome, PWA installed)

```
1. User is viewing an Instagram story with a recipe
2. Taps the Share button (bottom of screen, native iOS/Android UI)
3. Native share sheet slides up
   → Shows: Messages, WhatsApp, Instagram, [Four Fs], Copy Link, ...
4. User taps "Four Fs"
5. Browser sends POST multipart/form-data to /meals/share
6. Service worker intercepts the POST:
   - Reads the image File from formData
   - Saves to Cache API under /share-file/{shareId}/0
   - Saves metadata to /share-meta/{shareId}
   - Returns HTTP 303 redirect to /meals?tab=import&shareId={shareId}
7. Browser navigates to /meals, Import Recipe tab is active
8. ShareLanding component mounts, reads shareId from URL
9. Fetches file from Cache API → creates object URL → displays image preview
   → "Screenshot received" banner + thumbnail
10. User sees the screenshot preview and the "Extract Recipe" button
11. User taps "Extract Recipe"
    → POST /api/recipe-import/from-image with the File
    → Server runs OCR (Google Cloud Vision) → Claude Haiku recipe parse
    → Returns structured RecipeImport JSON
12. App shows RecipePreview screen (dish name, ingredient list)
13. User reviews → taps [Cook This Week] / [Add to Cart] / [Save Recipe]
```

### Flow B — Sharing a recipe URL (any browser, any platform)

```
1. User is on a recipe website (NYT Cooking, Allrecipes, etc.)
2. Taps browser share button or site's share button
3. Native share sheet shows
4. User taps "Four Fs" (must be installed) — OR — copies URL and opens app
5. Browser sends POST to /meals/share with url=https://...
6. Service worker intercepts:
   - No file in formData
   - Reads url from formData
   - Redirects to /meals?tab=import&sharedUrl=https://...
7. /meals page opens, Import Recipe tab active
8. ShareLanding shows "Link received" banner with the URL
9. URL is pre-populated in the URL input field
10. User taps "Extract Recipe"
    → GET /api/recipe-import/from-url?url=...
    → Server fetches page, tries JSON-LD schema.org/Recipe parsing
    → Falls back to Claude Haiku LLM extraction if no structured data
11. RecipePreview screen displayed
12. User confirms → saved as RecipeImport record
```

### What happens if PWA is not installed (iOS or non-installed Android)?

The app does not appear in the share sheet. The user falls back to:
- Manual: Open app → Meals → Import Recipe → paste link manually
- Manual: Open app → Meals → Import Recipe → upload screenshot via file picker
- The InstallPrompt component on the Meals page prompts them to install

---

---

# PART 2 — /meals Page Architecture

---

## 2.1 Navigation Integration

**Current bottom nav (5 items):** Home | Track | Goals | Board | Profile

**Recommendation:** Replace "Goals" in the bottom nav with "Meals". Goals is an infrequently-visited configuration page; it does not need a permanent bottom nav slot. Move it to the Profile page (accessible via Profile → Goals).

**Updated bottom nav (5 items):** Home | Track | **Meals** | Board | Profile

**Meals nav item spec:**
- Icon: Lucide `ChefHat` (a chef's hat — clear, unique, no ambiguity with other nav items)
- Label: `Meals`
- href: `/meals`
- Active state: filled/colored variant (same pattern as other nav items)

**Desktop sidebar:** Add "Meals" entry between "Goals" and "Board" in the sidebar NAV array. Goals remains in the sidebar.

**BottomNav change:** Remove Goals, add Meals at index 2 (center position — appropriate for a primary feature).

---

## 2.2 Page Layout and Tab Structure

```
/meals
├── [Header] — "Meals" title + InstallPrompt (if not installed)
├── [Tabs] — horizontal pill tabs
│   ├── Suggestions (default)
│   ├── Log Meal
│   ├── Import Recipe
│   └── History
└── [Tab Content Area]
```

**Default tab:** Suggestions. This is the highest-value passive display — users see what they can cook right now. No action required to get value from it.

**Active tab persistence:** Store the active tab in URL search params (`?tab=suggestions|log|import|history`). This enables:
- Deep linking from share target (`?tab=import&shareId=...`)
- Back button returns to correct tab
- No state loss on browser refresh

**Tab switching implementation:** `useSearchParams` + `router.replace` (shallow). No page reload.

---

## 2.3 Tab 1: Suggestions

**Purpose:** Show 3–5 AI-generated meal suggestions based on current pantry contents, near-expiry items, and learned preferences.

**Layout (top to bottom):**

```
[Filter chips — horizontal scroll]
  [All]  [Quick <30min]  [Use Expiring]  [Vegetarian]  [High Protein]

[Refresh button — top right, small, outline style]
"Generating suggestions..." spinner while loading

[MealSuggestionCard × 3–5]
  ┌─────────────────────────────────────┐
  │ [Dish image thumbnail — 80×80px]   │
  │  Chicken Stir Fry              [●] │  ← difficulty dot
  │  25 min · 4 ingredients            │
  │  "2 items expiring this week"       │  ← "why now" text (amber if expiry)
  │  ████████░░ 80% pantry match        │
  │  [Cook This]    [Add Missing]       │
  └─────────────────────────────────────┘

[Load more — text link at bottom, lazy loads 3 more]
```

**MealSuggestionCard fields:**
- `recipeName`: string
- `cookTimeMinutes`: number
- `difficulty`: 'easy' | 'medium' | 'hard' (shown as 1/2/3 dots)
- `whyNow`: string — generated by LLM ("Uses your zucchini expiring Friday")
- `pantryMatchPercent`: number (0–100)
- `missingIngredients`: string[] — items to add to cart
- `spoonacularId`: string — for fetching full recipe

**[Cook This] action:** Opens IngredientConfirmation screen (shared component) pre-populated with this recipe's ingredients matched against pantry.

**[Add Missing to Cart] action:** Generates Instacart link for the `missingIngredients` list only.

**Refresh button:** Calls `GET /api/meal-suggestions?force=true` which busts the cache and calls Spoonacular + LLM again.

**Empty state:** "Add some items to your pantry to get personalized suggestions." with a [Scan an Item] button.

---

## 2.4 Tab 2: Log Meal

**Purpose:** Record what was eaten → deduct from pantry → update consumption tracking.

**Layout — Entry Method Selection (initial state):**

```
[Header] "What did you eat?"

[Three large tap targets — 56px tall each]
  ┌──────────────────────────────────┐
  │  📷  Take a Photo                │
  │      "Point at your meal"        │
  └──────────────────────────────────┘
  ┌──────────────────────────────────┐
  │  🔍  Search a Dish               │
  │      "Type to find any recipe"   │
  └──────────────────────────────────┘
  ┌──────────────────────────────────┐
  │  📋  From Saved Recipe           │
  │      "Use a recently imported..."│
  └──────────────────────────────────┘
```

**After [Take a Photo]:**
1. Opens native camera (via `<input type="file" accept="image/*" capture="environment">`)
2. User takes photo
3. Loading state: "Analyzing your meal..." (spinner + blurred thumbnail)
4. POST /api/meal-photo/analyze → Claude Sonnet 4.6 vision
5. Returns ingredient list → opens shared IngredientConfirmation screen

**After [Search a Dish]:**
1. Shows Spoonacular autocomplete input
2. User types dish name → dropdown shows recipe suggestions
3. User selects → Spoonacular `/recipes/{id}/information` called → ingredient list fetched
4. Servings scaler appears: "How many servings did you eat?" (1 / 2 / 3+ buttons)
5. Ingredient quantities scaled → opens shared IngredientConfirmation screen

**After [From Saved Recipe]:**
1. Shows last 5 RecipeImport records as a list (dish name + thumbnail + date)
2. User taps one → opens shared IngredientConfirmation screen

**Servings scaler component (shown in Search Dish and Saved Recipe flows):**
```
"How many servings?"
  [1]  [2]  [3]  [+]
"Scales ingredient quantities proportionally"
```

---

## 2.5 Tab 3: Import Recipe

**Purpose:** Bring a recipe into the app from any source — URL, screenshot, or share sheet.

**Layout — Method Selection (initial state, no incoming share):**

```
[Header] "Import a Recipe"
[Subtext] "Save recipes and cook from your pantry"

[Three import method cards]
  ┌──────────────────────────────────┐
  │  🔗  Paste a Link                │
  │      Works with 600+ recipe      │
  │      websites                    │
  └──────────────────────────────────┘
  ┌──────────────────────────────────┐
  │  📷  Upload Screenshot           │
  │      Share a photo from your     │
  │      camera roll or Instagram    │
  └──────────────────────────────────┘
  ┌──────────────────────────────────┐
  │  📲  Share from Another App      │
  │      [Install App] if not yet    │
  │      installed, or instructions  │
  └──────────────────────────────────┘
```

**After [Paste a Link] is tapped:**
```
[URL input field — auto-focused]
  placeholder: "https://www.allrecipes.com/recipe/..."
  [Extract Recipe] button (primary, full-width)

[Supported sites note] "Works with NYT Cooking, Allrecipes,
  Serious Eats, 600+ more · Instagram links: screenshot required"
```

On submit → POST /api/recipe-import/from-url → JSON-LD extraction → LLM fallback → RecipePreview

**After [Upload Screenshot] is tapped:**
```
[File drop zone / camera button]
  "Tap to choose from Photos or take a new photo"
  [file input — accept="image/*"]

[Or drag and drop an image here]  ← desktop only
```

After file selected → preview thumbnail + [Extract Recipe] button → POST /api/recipe-import/from-image → OCR → LLM → RecipePreview

**When a share arrives (shareId or sharedUrl or sharedImageUrl in URL params):**

ShareLanding component renders ABOVE the method cards showing the received content. The relevant method card is highlighted/selected. Extraction can begin immediately.

**RecipePreview screen (shown after any extraction method):**
```
[Recipe name — large, editable]
Spaghetti Carbonara

[Source badge] "From: cooking.nytimes.com"

[Ingredient list — scrollable]
  ✓ Pasta (200g)           → 1 box in pantry
  ✓ Eggs (3)               → 4 in pantry  
  ✓ Guanciale (100g)       → Not in pantry ← amber highlight
  ✓ Pecorino Romano (50g)  → Not in pantry
  ✓ Black pepper           → in pantry

[Pantry summary]
  3/5 items in pantry · 2 need to be bought

[Action buttons — stacked]
  [Cook This Week]     ← adds to this week's meal plan
  [Add Missing to Cart] ← Instacart link for 2 missing items
  [Save Recipe]        ← saves RecipeImport without cooking
  [Discard]            ← text link, small
```

---

## 2.6 Tab 4: History

**Purpose:** Chronological log of all logged meals and imported recipes.

**Layout:**

```
[Filter] [This Week ▼]  [All  Cooked  Imported]

[Date group header] "Today"
  ┌──────────────────────────────────┐
  │ [thumbnail 48×48] Chicken Bowl   │
  │                   Logged · 6:32pm│
  │                   4 items deducted│
  └──────────────────────────────────┘

[Date group header] "Yesterday"
  ┌──────────────────────────────────┐
  │ [thumbnail] Spaghetti Carbonara  │
  │             Imported recipe      │
  │             Not yet cooked       │
  └──────────────────────────────────┘
  ...

[Empty state] "No meals logged yet. Start by logging what you ate!"
```

**Tap to expand a history entry:**
Opens a bottom sheet (Shadcn Sheet component) showing:
- Full ingredient list with quantities
- Which items were deducted from pantry (with checkmarks)
- Items that were not in pantry (greyed out)
- Source indicator (photo / search / import / share)
- [Log Again] button — re-runs the same deduction for leftovers

---

## 2.7 Shared Ingredient Confirmation Screen

This screen is used by ALL meal entry flows (Photo, Search, Saved Recipe, Import). It is a full-screen overlay/modal, not a separate page.

**Layout:**

```
[Header] "Confirm Ingredients"
[Subtext] "Spaghetti Carbonara · 2 servings"

[Section: In Your Pantry — pre-checked]
  ✅ Pasta · 200g
      → Will deduct from: "Barilla Spaghetti 500g" (340g remaining)
  ✅ Eggs · 3
      → Will deduct from: "Free Range Eggs ×12" (9 remaining)
  ✅ Black pepper
      → Will deduct: estimated amount (not tracked by quantity)

[Section: Low Confidence — amber warning, pre-checked but highlighted]
  ⚠️ Guanciale · 100g
      → No exact match found. Closest: "Bacon" in pantry
      → [Accept match]  [Skip]

[Section: Not in Pantry — unchecked, greyed]
  ○ Pecorino Romano · 50g   [Add to Cart]
  ○ White wine · 60ml       [Add to Cart]

[Servings reminder] "Amounts shown for 2 servings"

[Bottom actions]
  [Confirm & Deduct] ← primary, full-width
      "Will deduct 3 items from pantry"
  [Skip pantry update] ← secondary text link
```

**Behavior on confirm:**
1. POST /api/meal-photo/confirm or /api/recipe-import/confirm
2. Creates ConsumptionLog entries for each confirmed deduction
3. Updates PantryItem quantities
4. Triggers reorder check (if any item drops below threshold)
5. Shows success toast: "Logged! 3 items deducted from pantry"
6. Navigates to History tab

**Confidence levels (from LLM extraction):**
- `confidence > 0.8` → green check, pre-checked, auto-match
- `confidence 0.4–0.8` → amber warning, pre-checked, shows closest match with accept/skip
- `confidence < 0.4` → greyed out, unchecked, "Not in pantry" section

---

## 2.8 Share Target Deep Link Integration

When the user is redirected to `/meals?tab=import&shareId=...` after sharing from Instagram:

1. The `/meals` page reads the `tab` param and activates the Import Recipe tab
2. The Import Recipe tab renders the `ShareLanding` component at the top
3. `ShareLanding` reads the `shareId` / `sharedImageUrl` / `sharedUrl` param
4. Content is retrieved and displayed
5. If it was an image: the upload screenshot flow is pre-loaded with the image
6. If it was a URL: the URL input is pre-populated
7. The user simply taps [Extract Recipe] — no other action needed

The page **should not auto-trigger extraction** — always require one user tap. This prevents:
- Unexpected API calls
- Wrong images being processed
- LLM costs from unintended shares

---

## 2.9 Component List

All new files to create:

| Component | File Path | Description |
|-----------|-----------|-------------|
| `MealsPage` | `src/app/(app)/meals/page.tsx` | Server component, fetches user + household, renders MealsClient |
| `MealsClient` | `src/components/meals/MealsClient.tsx` | 'use client', manages tab state, URL params, renders tab content |
| `MealsTabs` | `src/components/meals/MealsTabs.tsx` | Horizontal tab bar with 4 tabs + active indicator |
| `SuggestionsTab` | `src/components/meals/SuggestionsTab.tsx` | Full Suggestions tab content |
| `MealSuggestionCard` | `src/components/meals/MealSuggestionCard.tsx` | Single meal suggestion card |
| `SuggestionFilters` | `src/components/meals/SuggestionFilters.tsx` | Horizontal scrollable filter chip row |
| `LogMealTab` | `src/components/meals/LogMealTab.tsx` | Full Log Meal tab content + method selection |
| `MealPhotoCapture` | `src/components/meals/MealPhotoCapture.tsx` | Camera input + thumbnail preview + analyze button |
| `DishSearch` | `src/components/meals/DishSearch.tsx` | Spoonacular autocomplete input + dropdown |
| `ServingsScaler` | `src/components/meals/ServingsScaler.tsx` | 1/2/3/+ button row for serving size |
| `ImportRecipeTab` | `src/components/meals/ImportRecipeTab.tsx` | Full Import Recipe tab content |
| `RecipeUrlInput` | `src/components/meals/RecipeUrlInput.tsx` | URL text input + Extract button |
| `RecipeScreenshotUpload` | `src/components/meals/RecipeScreenshotUpload.tsx` | File picker / drag-drop zone |
| `ShareLanding` | `src/components/meals/ShareLanding.tsx` | Share target received content display (see 1.8) |
| `RecipePreview` | `src/components/meals/RecipePreview.tsx` | Extracted recipe display with ingredient list + action buttons |
| `HistoryTab` | `src/components/meals/HistoryTab.tsx` | Full History tab with date groups |
| `MealHistoryEntry` | `src/components/meals/MealHistoryEntry.tsx` | Single history entry card |
| `MealHistorySheet` | `src/components/meals/MealHistorySheet.tsx` | Bottom sheet expanded view of a history entry |
| `IngredientConfirmation` | `src/components/meals/IngredientConfirmation.tsx` | Shared ingredient review + confirm UI (see 2.7) |
| `IngredientRow` | `src/components/meals/IngredientRow.tsx` | Single ingredient line in confirmation screen |
| `InstallPrompt` | `src/components/ui/InstallPrompt.tsx` | Add to Home Screen prompt banner (see 1.3) |
| `share/route.ts` | `src/app/(app)/meals/share/route.ts` | Share target POST + GET handler (see 1.6) |
| `sw.js` | `public/sw.js` | Service worker with share target intercept (see 1.5) |
| `manifest.json` | `public/manifest.json` | PWA manifest with share_target (see 1.4) |

**API routes to add:**

| Route | File | Description |
|-------|------|-------------|
| `POST /api/meal-photo/analyze` | `src/app/api/meal-photo/analyze/route.ts` | Receives File, runs Claude vision, returns ingredient list |
| `POST /api/meal-photo/confirm` | `src/app/api/meal-photo/confirm/route.ts` | Writes MealPhoto + ConsumptionLog entries |
| `GET /api/meal-suggestions` | `src/app/api/meal-suggestions/route.ts` | Calls Spoonacular findByIngredients + LLM scoring |
| `GET /api/recipe-import/from-url` | `src/app/api/recipe-import/from-url/route.ts` | Fetches URL, JSON-LD parse, LLM fallback |
| `POST /api/recipe-import/from-image` | `src/app/api/recipe-import/from-image/route.ts` | OCR + LLM recipe extraction from uploaded image |
| `POST /api/recipe-import/confirm` | `src/app/api/recipe-import/confirm/route.ts` | Saves RecipeImport + ConsumptionLog deductions |

---

## 2.10 File Structure

Complete additions to the existing Next.js project:

```
app/frontend/
├── public/
│   ├── manifest.json                          ← NEW — PWA manifest
│   ├── sw.js                                  ← NEW — Service worker
│   └── icons/
│       ├── icon-192.png                       ← NEW — PWA icon
│       └── icon-512.png                       ← NEW — PWA icon
│
└── src/
    ├── app/
    │   ├── layout.tsx                         ← MODIFY — add <link rel="manifest">
    │   │
    │   ├── (app)/
    │   │   ├── layout.tsx                     ← no change
    │   │   │
    │   │   └── meals/
    │   │       ├── page.tsx                   ← NEW — /meals server page
    │   │       └── share/
    │   │           └── route.ts               ← NEW — share target POST handler
    │   │
    │   └── api/
    │       ├── meal-photo/
    │       │   ├── analyze/
    │       │   │   └── route.ts               ← NEW
    │       │   └── confirm/
    │       │       └── route.ts               ← NEW
    │       ├── meal-suggestions/
    │       │   └── route.ts                   ← NEW
    │       └── recipe-import/
    │           ├── from-url/
    │           │   └── route.ts               ← NEW
    │           ├── from-image/
    │           │   └── route.ts               ← NEW
    │           └── confirm/
    │               └── route.ts               ← NEW
    │
    ├── components/
    │   ├── meals/                             ← NEW directory
    │   │   ├── MealsClient.tsx
    │   │   ├── MealsTabs.tsx
    │   │   ├── SuggestionsTab.tsx
    │   │   ├── MealSuggestionCard.tsx
    │   │   ├── SuggestionFilters.tsx
    │   │   ├── LogMealTab.tsx
    │   │   ├── MealPhotoCapture.tsx
    │   │   ├── DishSearch.tsx
    │   │   ├── ServingsScaler.tsx
    │   │   ├── ImportRecipeTab.tsx
    │   │   ├── RecipeUrlInput.tsx
    │   │   ├── RecipeScreenshotUpload.tsx
    │   │   ├── ShareLanding.tsx
    │   │   ├── RecipePreview.tsx
    │   │   ├── HistoryTab.tsx
    │   │   ├── MealHistoryEntry.tsx
    │   │   ├── MealHistorySheet.tsx
    │   │   ├── IngredientConfirmation.tsx
    │   │   └── IngredientRow.tsx
    │   │
    │   └── ui/
    │       ├── BottomNav.tsx                  ← MODIFY — Goals → Meals
    │       ├── Sidebar.tsx                    ← MODIFY — add Meals entry
    │       └── InstallPrompt.tsx              ← NEW
    │
    └── lib/
        └── meals/                             ← NEW directory
            ├── extraction.ts                  ← JSON-LD recipe parser + LLM fallback
            ├── pantry-matcher.ts              ← Fuse.js pantry matching logic
            └── types.ts                       ← Shared TypeScript types for meals
```

---

## Navigation Modification Code

**BottomNav.tsx — replace Goals with Meals:**

```tsx
// Replace the Goals tab entry in the TABS array:
{
  label: 'Meals',
  href: '/meals',
  Icon: ({ active }: { active: boolean }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Chef hat icon */}
      <path d="M6 13.87A4 4 0 017.41 6a5.11 5.11 0 019.18 0 4 4 0 011.41 7.87V20H6z" fill={active ? 'currentColor' : 'none'} />
      <line x1="6" y1="17" x2="18" y2="17" />
    </svg>
  ),
},
```

**Sidebar.tsx — add Meals entry:**

```tsx
// Add after the Goals entry in the NAV array:
{
  label: 'Meals',
  href: '/meals',
  icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 13.87A4 4 0 017.41 6a5.11 5.11 0 019.18 0 4 4 0 011.41 7.87V20H6z" />
      <line x1="6" y1="17" x2="18" y2="17" />
    </svg>
  ),
},
```

**Goals page redirect (since Goals leaves the bottom nav on mobile):**
Add a "Goals" link inside the Profile page's settings section so mobile users can still reach it. Sidebar users are unaffected.

---

## MealsPage Server Component

```tsx
// src/app/(app)/meals/page.tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MealsClient } from '@/components/meals/MealsClient'
import { BottomNav } from '@/components/ui/BottomNav'

export default async function MealsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userRow } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .maybeSingle()

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .maybeSingle()

  return (
    <div className="pb-20 md:pb-0">
      <Suspense fallback={null}>
        <MealsClient
          userId={user.id}
          householdId={membership?.household_id ?? null}
          userName={userRow?.name ?? 'you'}
        />
      </Suspense>
      <BottomNav />
    </div>
  )
}
```

**MealsClient skeleton:**

```tsx
// src/components/meals/MealsClient.tsx
'use client'
import { useSearchParams, useRouter } from 'next/navigation'
import { MealsTabs } from './MealsTabs'
import { SuggestionsTab } from './SuggestionsTab'
import { LogMealTab } from './LogMealTab'
import { ImportRecipeTab } from './ImportRecipeTab'
import { HistoryTab } from './HistoryTab'
import { InstallPrompt } from '@/components/ui/InstallPrompt'

type Tab = 'suggestions' | 'log' | 'import' | 'history'

interface Props {
  userId: string
  householdId: string | null
  userName: string
}

export function MealsClient({ userId, householdId, userName }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const rawTab = searchParams.get('tab') as Tab | null
  const activeTab: Tab = rawTab ?? 'suggestions'

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tab)
    // Preserve share params if switching within import
    if (tab !== 'import') {
      params.delete('shareId')
      params.delete('sharedUrl')
      params.delete('sharedImageUrl')
      params.delete('sharedTitle')
    }
    router.replace(`/meals?${params.toString()}`)
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Page header */}
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
      </div>

      {/* PWA install prompt */}
      <InstallPrompt />

      {/* Tab bar */}
      <MealsTabs activeTab={activeTab} onTabChange={setTab} />

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === 'suggestions' && (
          <SuggestionsTab userId={userId} householdId={householdId} />
        )}
        {activeTab === 'log' && (
          <LogMealTab userId={userId} />
        )}
        {activeTab === 'import' && (
          <ImportRecipeTab userId={userId} />
        )}
        {activeTab === 'history' && (
          <HistoryTab userId={userId} />
        )}
      </div>
    </div>
  )
}
```

---

## Key Implementation Notes

1. **Next.js version:** The existing app runs Next.js 14.2.0, not 15. All code is compatible with Next.js 14 App Router.

2. **Shadcn/UI not yet installed:** The existing app uses raw Tailwind, not Shadcn components. Either install Shadcn (`npx shadcn-ui@latest init`) before building this feature, or keep the same raw-Tailwind approach the existing app uses. Recommend adding Shadcn for the Sheet component (bottom drawer for history expansion) and Dialog (ingredient confirmation overlay).

3. **PWA manifest:** The existing `layout.tsx` does not reference a manifest. Create `public/manifest.json` and add `<link rel="manifest" href="/manifest.json" />` to `layout.tsx`. Also add the apple-mobile-web-app meta tags for iOS.

4. **Supabase Storage:** The `/meals/share/route.ts` server handler uploads shared images to a `meal-photos` bucket. This bucket must be created in Supabase Storage with RLS policy: `user_id = auth.uid()` on the path prefix.

5. **Service worker registration:** Must be done client-side. Add to `providers.tsx`. The service worker file must be at `public/sw.js` (Next.js serves `public/` at root). The SW scope is `/` by default — it covers all routes including `/meals/share`.

6. **iOS fallback is critical:** Since iOS Safari does not support share_target, the Import Recipe tab must have excellent manual flows (URL paste, file picker upload) that work without installation. Do not deprioritize these.

7. **Android market is the primary share target audience.** Design and test the share flow primarily on Android Chrome with a PWA installed.

---

*Spec produced: 2026-04-21. Ready for implementation in Session 7 or 8.*
