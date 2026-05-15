'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Ring } from '@/components/ui/Ring'
import { F_CATEGORIES } from '@shared/types'

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const next = searchParams.get('next') ?? '/household'

  const [mode, setMode] = useState<'magic' | 'password'>('magic')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  function switchMode(next: 'magic' | 'password') {
    setMode(next)
    setError(null)
    setResetSent(false)
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    setSent(true)
    setLoading(false)
  }

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Incorrect email or password.')
      setLoading(false)
      return
    }
    router.push(next)
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Enter your email address above first.')
      return
    }
    setLoading(true)
    setError(null)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    })
    setResetSent(true)
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

  if (resetSent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full surface-card rounded-3xl p-8 text-center space-y-4">
          <div className="text-5xl">🔑</div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-gray-500 text-sm">
            We sent a password reset link to
            <br />
            <strong className="text-gray-800">{email}</strong>
          </p>
          <p className="text-xs text-gray-400 pt-2">
            Click the link to set your password, then sign in here.
          </p>
          <button
            onClick={() => { setResetSent(false); setError(null) }}
            className="text-xs text-gray-500 underline"
          >
            Back to sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-10">
        {/* Hero */}
        <div className="text-center space-y-5">
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

        {/* Mode toggle */}
        <div className="flex rounded-2xl bg-gray-100 p-1 gap-1">
          <button
            type="button"
            onClick={() => switchMode('magic')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
              mode === 'magic'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Magic link
          </button>
          <button
            type="button"
            onClick={() => switchMode('password')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${
              mode === 'password'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Password
          </button>
        </div>

        {/* Magic link form */}
        {mode === 'magic' && (
          <form onSubmit={handleMagicLink} className="space-y-3">
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
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 45%, #6366f1 100%)' }}
            >
              {loading ? 'Sending magic link…' : 'Continue with email →'}
            </button>
            <p className="text-center text-xs text-gray-400">
              We'll send you a magic link — no password needed.
            </p>
          </form>
        )}

        {/* Password form */}
        {mode === 'password' && (
          <form onSubmit={handlePasswordSignIn} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-base shadow-sm"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-base shadow-sm"
            />
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-2xl text-white font-semibold tap-scale disabled:opacity-50 shadow-lg shadow-gray-900/20"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 45%, #6366f1 100%)' }}
            >
              {loading ? 'Signing in…' : 'Sign in →'}
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => void handleForgotPassword()}
                disabled={loading}
                className="text-xs text-gray-400 hover:text-gray-600 underline transition"
              >
                Forgot password / set a password for the first time
              </button>
            </div>
          </form>
        )}
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
