// Server-side Supabase client for Server Components, Route Handlers, and Server Actions.
// Uses cookies to read/refresh the user's session.
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // In Server Components the cookie store is read-only; swallow those attempts.
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // no-op
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // no-op
          }
        },
      },
    }
  )
}
