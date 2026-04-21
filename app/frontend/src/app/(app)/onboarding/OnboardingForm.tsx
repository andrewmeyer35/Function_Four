'use client'
// First-run form for creating or joining a household. Matches the gradient
// brand system so the first interaction feels continuous with the login screen.
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { F_CATEGORIES } from '@shared/types'
import { F_THEME } from '@/lib/design'

type Mode = 'create' | 'join'

export function OnboardingForm({ initialCode = '' }: { initialCode?: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(initialCode ? 'join' : 'create')
  const [name, setName] = useState('')
  const [code, setCode] = useState(initialCode.toUpperCase())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const url = mode === 'create' ? '/api/households' : '/api/households/join'
      const body = mode === 'create' ? { name } : { code: code.trim() }
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
      router.push('/household')
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-8">
        {/* Tease the four Fs with gradient tiles */}
        <div className="grid grid-cols-4 gap-2">
          {F_CATEGORIES.map((f) => {
            const theme = F_THEME[f.key]
            return (
              <div
                key={f.key}
                className="aspect-square rounded-2xl flex items-center justify-center text-2xl shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                }}
              >
                <span>{f.emoji}</span>
              </div>
            )
          })}
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Welcome to <span className="gradient-text">Four Fs</span></h1>
          <p className="text-sm text-gray-500">
            Start a house for your roommates, or hop into one someone already made.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setMode('create')}
            className={`py-2.5 text-sm font-medium rounded-xl transition-all tap-scale ${
              mode === 'create'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Create
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            className={`py-2.5 text-sm font-medium rounded-xl transition-all tap-scale ${
              mode === 'join'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Join
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'create' ? (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Household name · e.g. 'The Burrow'"
              required
              maxLength={60}
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-base shadow-sm"
            />
          ) : (
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Invite code"
              required
              autoCapitalize="none"
              className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gray-900 text-base font-mono tracking-wider uppercase shadow-sm"
            />
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-2xl text-white font-semibold tap-scale disabled:opacity-50 shadow-lg shadow-gray-900/20"
            style={{
              background:
                'linear-gradient(135deg, #f59e0b 0%, #ec4899 45%, #6366f1 100%)',
            }}
          >
            {submitting
              ? '...'
              : mode === 'create'
                ? 'Create household →'
                : 'Join household →'}
          </button>
        </form>
      </div>
    </main>
  )
}
