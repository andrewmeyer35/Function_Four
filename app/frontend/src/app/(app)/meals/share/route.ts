import { NextRequest, NextResponse } from 'next/server'

// PWA Web Share Target fallback handler.
//
// Normally the service worker (public/sw.js) intercepts POST /meals/share
// before it ever reaches the server, stores the shared file in Cache API,
// and redirects to /meals?tab=import&shareId={uuid}.
//
// This route only fires when:
//   a) the service worker hasn't activated yet on first install, or
//   b) the browser doesn't support service workers.
//
// In both cases we redirect to the import tab with an error flag so the
// UI can prompt the user to try the manual file picker instead.
export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin
  return NextResponse.redirect(`${origin}/meals?tab=import&shareError=sw_not_ready`, {
    status: 303, // POST → GET redirect
  })
}
