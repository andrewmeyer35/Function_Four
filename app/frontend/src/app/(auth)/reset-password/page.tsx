'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setDone(true)
    setTimeout(() => router.push('/household'), 1500)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h1 className="text-2xl font-bold">Password saved!</h1>
          <p className="text-gray-500 text-sm">Taking you home…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Set your password</h1>
          <p className="text-gray-500 text-sm mt-1">
            You'll use this to sign in — no magic link needed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (8+ characters)"
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-base shadow-sm"
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm password"
            required
            autoComplete="new-password"
            className="w-full px-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-base shadow-sm"
          />
          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl text-white font-semibold disabled:opacity-50 shadow-lg shadow-gray-900/20"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 45%, #6366f1 100%)' }}
          >
            {loading ? 'Saving…' : 'Save password →'}
          </button>
        </form>
      </div>
    </div>
  )
}
