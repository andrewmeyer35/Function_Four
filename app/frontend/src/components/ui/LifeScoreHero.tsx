'use client'
import { F_CATEGORIES } from '@shared/types'
import { F_THEME, lifeScoreVibe } from '@/lib/design'

// All scores are 0-100 (percent completion for each category)
type PerFScores = {
  financial: number | null
  fitness: number | null
  fun: number | null
  flirt: number | null
}

type Props = {
  scores: PerFScores
  total: number          // 0-100 overall weekly completion %
  streak: number         // consecutive weeks with activity
  goalsHit: number       // how many individual goals hit target this week
  totalGoals: number
  bestPillar: { label: string; emoji: string; score: number; colorHex: string } | null
  weekLabel: string
  userName: string
  history: (number | null)[]  // 7 entries, each 0-100 or null
}

function getVibeBg(pct: number): string {
  if (pct >= 80) return 'bg-emerald-100 text-emerald-800'
  if (pct >= 55) return 'bg-sky-100 text-sky-800'
  if (pct >= 35) return 'bg-amber-100 text-amber-800'
  if (pct >= 1) return 'bg-orange-100 text-orange-800'
  return 'bg-gray-100 text-gray-600'
}

function getVibeText(pct: number): { title: string; sub: string } {
  if (pct >= 90) return { title: 'Peak week', sub: 'Absolutely dialed in. This is the one.' }
  if (pct >= 75) return { title: 'Living well', sub: 'Strong across the board. Keep it going.' }
  if (pct >= 55) return { title: 'Solid week', sub: 'Real progress on the stuff that matters.' }
  if (pct >= 35) return { title: 'Mixed bag', sub: 'Some Fs fired, some fizzled. You got this.' }
  if (pct >= 10) return { title: 'Rebuilding', sub: 'Every streak starts with one rep. Today counts.' }
  if (pct >= 1) return { title: 'Barely there', sub: 'Small moves. Tomorrow is a fresh shot.' }
  return { title: 'Fresh slate', sub: 'The week is yours. Go plant some flags.' }
}

function barHeight(pct: number | null): number {
  if (pct === null || pct === 0) return 4
  return Math.max(4, Math.round((pct / 100) * 28))
}

export function LifeScoreHero({
  scores,
  total,
  streak,
  goalsHit,
  totalGoals,
  bestPillar,
  history,
}: Props) {
  const vibe = getVibeText(total)
  const vibeBg = getVibeBg(total)
  const weekLabels = ['6w', '5w', '4w', '3w', '2w', '1w', 'Now']

  return (
    <div className="surface-card rounded-2xl overflow-hidden">

      {/* Vibe header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${vibeBg}`}>
          {vibe.title}
        </span>
        <p className="text-xs text-gray-500 leading-tight">{vibe.sub}</p>
      </div>

      <div className="h-px bg-gray-100 mx-4" />

      {/* Per-F rings */}
      <div className="grid grid-cols-4 gap-1 px-3 py-4">
        {F_CATEGORIES.map((f) => {
          const score = scores[f.key as keyof PerFScores]
          const pct = score !== null ? score / 100 : 0
          const theme = F_THEME[f.key]
          return (
            <div key={f.key} className="flex flex-col items-center gap-1.5">
              <div className="relative">
                <HeroRing
                  size={70}
                  stroke={5.5}
                  pct={pct}
                  fromColor={theme.from}
                  toColor={theme.to}
                  gradientId={`hero-${f.key}`}
                  isEmpty={score === null}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  {score !== null ? (
                    <span
                      className="text-[14px] font-bold tabular-nums leading-none"
                      style={{ color: theme.from }}
                    >
                      {score}%
                    </span>
                  ) : (
                    <span className="text-[13px] text-gray-300 font-medium">-</span>
                  )}
                </div>
              </div>
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold text-center leading-tight">
                {f.key === 'fun' ? 'Social' : f.label}
              </span>
            </div>
          )
        })}
      </div>

      <div className="h-px bg-gray-100 mx-4" />

      {/* 2x2 stats grid */}
      <div className="grid grid-cols-2 divide-x divide-y divide-gray-100">
        <div className="px-4 py-3">
          <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-0.5">Streak</p>
          <p className="text-xl font-bold text-red-500 leading-none tabular-nums">{streak}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {streak === 1 ? 'week in a row' : 'weeks in a row'}
          </p>
        </div>

        <div className="px-4 py-3">
          <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-0.5">This Week</p>
          <p className="text-xl font-bold text-gray-900 leading-none tabular-nums">{total}%</p>
          <p className="text-[11px] text-gray-400 mt-0.5">of targets hit</p>
        </div>

        <div className="px-4 py-3">
          <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-0.5">Goals Hit</p>
          <p className="text-xl font-bold text-gray-900 leading-none tabular-nums">{goalsHit}/{totalGoals}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">this week</p>
        </div>

        <div className="px-4 py-3">
          <p className="text-[9px] uppercase tracking-widest text-gray-400 font-semibold mb-0.5">Best Pillar</p>
          {bestPillar ? (
            <>
              <p className="text-xl font-bold leading-none" style={{ color: bestPillar.colorHex }}>
                {bestPillar.emoji} {bestPillar.label.split(' /')[0]}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{bestPillar.score}% this week</p>
            </>
          ) : (
            <>
              <p className="text-xl font-bold text-gray-300 leading-none">-</p>
              <p className="text-[11px] text-gray-400 mt-0.5">not yet</p>
            </>
          )}
        </div>
      </div>

      <div className="h-px bg-gray-100 mx-4" />

      {/* 7-week mini bar chart */}
      <div className="px-4 py-3">
        <div className="flex items-end justify-between gap-1">
          {history.map((pct, i) => {
            const h = barHeight(pct)
            const isNow = i === 6
            const hasData = pct !== null && pct >= 1
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-sm ${
                    isNow && hasData ? 'bg-emerald-400' :
                    hasData ? 'bg-emerald-300 opacity-60' : 'bg-gray-200'
                  }`}
                  style={{ height: `${h}px` }}
                />
                <span className="text-[8px] text-gray-400 tabular-nums">{weekLabels[i]}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Link to Track */}
      <div className="px-4 pb-4 pt-1 text-center">
        <a
          href="/log"
          className="text-xs text-indigo-500 font-medium hover:text-indigo-700 transition-colors"
        >
          Track today's goals →
        </a>
      </div>

    </div>
  )
}

function HeroRing({
  size, stroke, pct, fromColor, toColor, gradientId, isEmpty,
}: {
  size: number; stroke: number; pct: number
  fromColor: string; toColor: string; gradientId: string; isEmpty: boolean
}) {
  const clamped = Math.max(0, Math.min(1, pct))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - clamped)
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 ring-animate">
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={fromColor} />
          <stop offset="100%" stopColor={toColor} />
        </linearGradient>
      </defs>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={isEmpty ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.07)'} strokeWidth={stroke} />
      {!isEmpty && (
        <circle className="ring-fg" cx={size/2} cy={size/2} r={r} fill="none"
          stroke={`url(#${gradientId})`} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round" />
      )}
    </svg>
  )
}
