'use client'
// Magic-link login with a gamified, branded entry moment:
// a 4-ring constellation "loading screen for your life," vivid gradient title,
// and a calm single-input form.
import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Ring } from '@/components/ui/Ring'
import { F_CATEGORIES } from '@shared/types'

function LoginForm() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/household'

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full surface-card rounded-3xl p-8 text-center space-y-4">
          <div className="text-5xl">📬</div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-gray-500 text-sm">
            We sent a magic link to
            <br />
            <strong className="text-gray-800">{email}</strong>
          </p>
          <p className="text-xs text-gray-400 pt-2">
            Tap the link to sign in. Nothing to remember.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-10">
        {/* Hero */}
        <div className="text-center space-y-5">
          {/* Four rings in a row — one per F. Clean, scannable, no overlap. */}
          <div className="flex items-center justify-center gap-3 ring-halo">
            {F_CATEGORIES.map((f) => (
              <div key={f.key} className="relative">
                <Ring f={f.key} pct={0.75} size={56} stroke={6} track>
                  <span className="text-lg">{f.emoji}</span>
                </Ring>
              </div>
            ))}
          </div>
          <div>
            <h1 className="font-display text-5xl font-black tracking-tight gradient-text">
              Four Fs
            </h1>
            <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
              Hold your house accountable on the things that actually shape your life.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-base shadow-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-semibold tap-scale disabled:opacity-50 shadow-lg shadow-gray-900/20"
            style={{
              background:
                'linear-gradient(135deg, #f59e0b 0%, #ec4899 45%, #6366f1 100%)',
            }}
          >
            {loading ? 'Sending magic link...' : 'Continue with email →'}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400">
          We'll send you a magic link — no password needed.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
