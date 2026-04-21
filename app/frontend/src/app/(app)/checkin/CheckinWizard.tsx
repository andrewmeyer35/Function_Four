'use client'
// Check-in flow redesign.
//   - Per-F full-bleed card with a themed gradient header and emoji "character"
//   - Big tactile slider with live numeric readout + mood-emoji endpoints
//   - Quick-tap tag chips with gradient active state
//   - Optional freeform note
//   - Live ring preview in the progress bar so you feel the week taking shape
//   - Confetti burst + count-up on submit
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { F_CATEGORIES, F_TAGS, SKIPPED_TAG, lifeScore } from '@shared/types'
import type { FCategory } from '@shared/types'
import type { CheckinInitial, PerF } from './types'
import { F_THEME } from '@/lib/design'
import { Ring } from '@/components/ui/Ring'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Confetti } from '@/components/ui/Confetti'

export function CheckinWizard({
  householdId,
  initial,
}: {
  householdId: string
  initial: CheckinInitial
}) {
  const router = useRouter()
  const [form, setForm] = useState<CheckinInitial>(initial)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const currentF = F_CATEGORIES[step]
  const isLastStep = step === F_CATEGORIES.length - 1
  const cur = form[currentF.key]
  const theme = F_THEME[currentF.key]

  const total = useMemo(
    () =>
      lifeScore({
        financialScore: form.financial.score,
        fitnessScore: form.fitness.score,
        funScore: form.fun.score,
        flirtScore: form.flirt.score,
      }),
    [form]
  )

  function updateF(key: FCategory, patch: Partial<PerF>) {
    setForm((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }))
  }

  function toggleTag(tag: string) {
    const tags = cur.tags
    const isSkipped = tag === SKIPPED_TAG
    let next: string[]
    if (isSkipped) {
      next = tags.includes(tag) ? [] : [SKIPPED_TAG]
    } else {
      next = tags.includes(tag)
        ? tags.filter((t) => t !== tag)
        : [...tags.filter((t) => t !== SKIPPED_TAG), tag]
    }
    const patch: Partial<PerF> = { tags: next }
    if (isSkipped && next.includes(SKIPPED_TAG)) patch.score = null
    if (isSkipped && !next.includes(SKIPPED_TAG) && cur.score === null) patch.score = 7
    updateF(currentF.key, patch)
  }

  function setScore(n: number) {
    const nextTags = cur.tags.filter((t) => t !== SKIPPED_TAG)
    updateF(currentF.key, { score: n, tags: nextTags })
  }

  function skipF() {
    updateF(currentF.key, { score: null, tags: [SKIPPED_TAG] })
  }

  async function handleSubmit() {
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          householdId,
          financial: form.financial.note,
          fitness: form.fitness.note,
          fun: form.fun.note,
          flirt: form.flirt.note,
          financialScore: form.financial.score,
          fitnessScore: form.fitness.score,
          funScore: form.fun.score,
          flirtScore: form.flirt.score,
          financialTags: form.financial.tags,
          fitnessTags: form.fitness.tags,
          funTags: form.fun.tags,
          flirtTags: form.flirt.tags,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to submit')
      }
      setDone(true)
      // Celebrate for a beat, then hand off to the home feed.
      setTimeout(() => {
        router.push('/household')
        router.refresh()
      }, 1800)
    } catch (e: any) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  const skipped = cur.tags.includes(SKIPPED_TAG)

  // Success overlay after submit — celebratory, brief.
  if (done) {
    return (
      <main className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-amber-50 via-rose-50 to-indigo-50 z-40">
        <Confetti run duration={2400} />
        <div className="text-6xl mb-4 animate-bounce">🎉</div>
        <div className="font-display text-7xl font-black gradient-text">
          <AnimatedNumber value={total} />
        </div>
        <div className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium mt-1">
          / 40 life score
        </div>
        <div className="text-lg font-semibold mt-5">Check-in locked in</div>
        <div className="text-sm text-gray-500">Dropping you on the leaderboard...</div>
      </main>
    )
  }

  return (
    <main className="max-w-lg mx-auto px-4 pt-6 pb-6 min-h-screen flex flex-col">
      {/* Header: back + step dots + running score */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => (step > 0 ? setStep((s) => s - 1) : router.back())}
          className="w-9 h-9 rounded-full bg-white shadow-sm border border-gray-100 text-gray-500 hover:text-gray-900 flex items-center justify-center tap-scale"
          aria-label="Back"
        >
          ←
        </button>
        <div className="flex-1 flex gap-1.5">
          {F_CATEGORIES.map((f, i) => {
            const active = i === step
            const done = i < step
            const t = F_THEME[f.key]
            return (
              <div
                key={f.key}
                className="h-2 flex-1 rounded-full overflow-hidden bg-gray-200 relative"
              >
                {(active || done) && (
                  <div
                    className="absolute inset-0 rounded-full transition-all"
                    style={{
                      background: `linear-gradient(90deg, ${t.from}, ${t.to})`,
                      width: done ? '100%' : active ? '55%' : '0%',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-display font-bold text-gray-900 text-base tabular-nums">
            <AnimatedNumber value={total} duration={500} />
          </span>
          <span className="text-gray-400">/40</span>
        </div>
      </div>

      {/* Main card: gradient header + form */}
      <div className="flex-1 rounded-[28px] overflow-hidden surface-card">
        {/* Gradient header */}
        <div
          className="relative px-6 pt-6 pb-5 overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`,
          }}
        >
          {/* Big background emoji as "character" — capped so it never overflows */}
          <div
            aria-hidden
            className="absolute -right-4 -bottom-8 text-[140px] leading-none select-none opacity-20 pointer-events-none"
          >
            {currentF.emoji}
          </div>
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/85 font-semibold">
                Step {step + 1} of {F_CATEGORIES.length}
              </div>
              <h2 className="text-2xl font-extrabold text-white mt-1 truncate">
                {currentF.label}
              </h2>
              <p className="text-white/90 text-sm mt-0.5 line-clamp-2">
                {currentF.prompt}
              </p>
            </div>
            {/* Live ring preview for this F */}
            <div className="flex-shrink-0">
              <Ring f={currentF.key} pct={skipped ? 0 : (cur.score ?? 0) / 10} size={64} stroke={7} track>
                <div className="text-center">
                  <div className="font-display font-black text-white text-base leading-none">
                    {skipped ? '—' : cur.score}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-white/85">
                    /10
                  </div>
                </div>
              </Ring>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-6 space-y-7 bg-white/60">
          {/* Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-[0.15em] text-gray-500 font-semibold">
                Rate the week
              </span>
              <span className="text-[11px] text-gray-400">{currentF.scaleLabel}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-2xl" aria-hidden>
                {currentF.lowEmoji}
              </span>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={cur.score ?? 7}
                onChange={(e) => setScore(Number(e.target.value))}
                disabled={skipped}
                className={`flex-1 ${skipped ? 'opacity-40' : ''}`}
                style={{ color: theme.accentHex }}
                aria-label={`${currentF.label} score`}
              />
              <span className="text-2xl" aria-hidden>
                {currentF.highEmoji}
              </span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 px-0.5 tabular-nums">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <span key={n} className={n === cur.score ? 'text-gray-900 font-semibold' : ''}>
                  {n}
                </span>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-[0.15em] text-gray-500 font-semibold">
              What happened? · tap all that apply
            </div>
            <div className="flex flex-wrap gap-2">
              {F_TAGS[currentF.key].map((tag) => {
                const selected = cur.tags.includes(tag)
                const isSkip = tag === SKIPPED_TAG
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`chip ${
                      selected
                        ? isSkip
                          ? 'bg-gray-900 text-white border-gray-900'
                          : theme.bgChipActive
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Optional note */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-[0.15em] text-gray-500 font-semibold">
              Anything to add? · optional
            </label>
            <textarea
              value={cur.note}
              onChange={(e) => updateF(currentF.key, { note: e.target.value })}
              placeholder="A sentence or two is plenty..."
              rows={2}
              className={`w-full bg-white border border-gray-200 rounded-2xl p-3 text-sm resize-none focus:outline-none focus:ring-2 ${theme.ring}`}
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}

      {/* Footer: primary + skip */}
      <div className="pt-4 space-y-2">
        {isLastStep ? (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 rounded-2xl font-semibold text-white text-base tap-scale disabled:opacity-60 shadow-lg shadow-gray-900/20"
            style={{
              background:
                'linear-gradient(135deg, #f59e0b 0%, #ec4899 45%, #6366f1 100%)',
            }}
          >
            {submitting ? 'Submitting...' : `Submit · ${total}/40 🎉`}
          </button>
        ) : (
          <button
            onClick={() => setStep((s) => s + 1)}
            className="w-full py-4 rounded-2xl bg-gray-900 text-white font-semibold hover:bg-gray-800 tap-scale shadow-md"
          >
            Next · {F_CATEGORIES[step + 1].label} {F_CATEGORIES[step + 1].emoji}
          </button>
        )}
        {!skipped && (
          <button
            type="button"
            onClick={skipF}
            className="w-full py-2 text-xs text-gray-400 hover:text-gray-600"
          >
            Skip this F for the week
          </button>
        )}
      </div>
    </main>
  )
}
