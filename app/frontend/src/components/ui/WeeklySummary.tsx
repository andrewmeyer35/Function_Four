// Plain-language weekly summary card per spec §5.3.
// Reads this week's row (if any) + last week's row and produces:
//   • headline (score + delta arrow)
//   • 1-3 celebrations ("Best Fitness week yet", "2 Fs hit 8+")
//   • 1 simple insight tip tied to the weakest F
//
// Intentionally friendly, second-person, never scolding. This is the "your
// coach just texted you" moment — it should feel warm.
import type { FCategory } from '@shared/types'
import { F_CATEGORIES } from '@shared/types'
import type { CheckinRow } from '@/lib/scoring'
import { rowLifeScore } from '@/lib/scoring'
import { F_THEME } from '@/lib/design'

type Props = {
  current: CheckinRow | null
  previous: CheckinRow | null
  userName: string
}

const TIPS: Record<FCategory, string[]> = {
  financial: [
    'Pick one small win — check your balance or skip one takeout.',
    'Try a 10-minute money check tomorrow morning.',
    'Log one expense as a gentle nudge into the habit.',
  ],
  fitness: [
    'Just one walk this week counts. Start with 10 minutes.',
    'Pick your workout for tomorrow tonight.',
    'A short stretch before bed is a real rep.',
  ],
  fun: [
    'Text one friend today. One ping, one plan.',
    'Block a coffee hangout on the calendar.',
    'Say yes to one low-effort thing this week.',
  ],
  flirt: [
    'Reach out to one person on your mind.',
    'Plan one small date-style activity — solo or with a partner.',
    'Do one thing today that makes you feel like yourself.',
  ],
}

function getF(row: CheckinRow | null, key: FCategory): number | null {
  if (!row) return null
  return row[`${key}_score` as keyof CheckinRow] as number | null
}

export function WeeklySummary({ current, previous, userName }: Props) {
  const hasCurrent = !!current

  const total = current ? rowLifeScore(current) : 0
  const prevTotal = previous ? rowLifeScore(previous) : 0
  const delta = hasCurrent && previous ? total - prevTotal : 0

  // Celebrations
  const wins: string[] = []
  if (hasCurrent) {
    const highFs = F_CATEGORIES.filter((f) => (getF(current, f.key) ?? 0) >= 8)
    if (highFs.length >= 2) {
      wins.push(`${highFs.length} Fs hit 8+ — that's a strong week.`)
    } else if (highFs.length === 1) {
      wins.push(`${highFs[0].emoji} ${highFs[0].label} hit ${getF(current, highFs[0].key)}/10.`)
    }
    if (previous) {
      // Biggest jump
      let bestJump: { f: FCategory; emoji: string; label: string; jump: number } | null = null
      for (const f of F_CATEGORIES) {
        const cur = getF(current, f.key) ?? 0
        const prev = getF(previous, f.key) ?? 0
        const jump = cur - prev
        if (jump >= 2 && (!bestJump || jump > bestJump.jump)) {
          bestJump = { f: f.key, emoji: f.emoji, label: f.label, jump }
        }
      }
      if (bestJump) {
        wins.push(
          `${bestJump.emoji} ${bestJump.label} up ${bestJump.jump} — nice momentum.`
        )
      }
    }
  }

  // Insight tip: pick the lowest-scoring (or skipped) F and hand a bite-size nudge.
  let tip: { f: FCategory; emoji: string; label: string; text: string } | null = null
  if (hasCurrent) {
    let weakest: { f: FCategory; emoji: string; label: string; score: number } | null = null
    for (const f of F_CATEGORIES) {
      const s = getF(current, f.key)
      const effective = s ?? 0 // skipped counts as 0 for tip purposes
      if (!weakest || effective < weakest.score) {
        weakest = { f: f.key, emoji: f.emoji, label: f.label, score: effective }
      }
    }
    if (weakest && weakest.score < 7) {
      const pool = TIPS[weakest.f]
      const text = pool[Math.floor(Math.random() * pool.length)]
      tip = { ...weakest, text }
    }
  }

  // Empty state: no check-in this week yet
  if (!hasCurrent) {
    return (
      <section className="surface-card rounded-[24px] p-5">
        <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-semibold mb-2">
          Your week at a glance
        </div>
        <div className="flex items-start gap-3">
          <span className="text-2xl">✨</span>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {userName === 'you' ? 'You' : userName} haven&apos;t checked in yet this week.
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              It takes under 2 minutes. Small moves, real week.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const deltaLabel =
    delta > 0 ? `+${delta} vs last week` : delta < 0 ? `${delta} vs last week` : previous ? 'Same as last week' : 'First week — let’s go'

  return (
    <section className="surface-card rounded-[24px] p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.18em] text-gray-400 font-semibold">
          Your week at a glance
        </div>
        <div
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            delta > 0
              ? 'bg-emerald-50 text-emerald-700'
              : delta < 0
                ? 'bg-rose-50 text-rose-700'
                : 'bg-gray-50 text-gray-500'
          }`}
        >
          {delta > 0 ? '▲ ' : delta < 0 ? '▼ ' : ''}
          {deltaLabel}
        </div>
      </div>

      {wins.length > 0 && (
        <ul className="space-y-1.5">
          {wins.map((w, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-800">
              <span className="text-amber-500 flex-shrink-0 mt-0.5">★</span>
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}

      {tip && (
        <div
          className={`rounded-2xl p-3 ${F_THEME[tip.f].bgSoft} border ${F_THEME[tip.f].border}`}
        >
          <div className={`text-[10px] uppercase tracking-wider font-semibold ${F_THEME[tip.f].textClass} mb-1`}>
            One small move · {tip.emoji} {tip.label}
          </div>
          <p className="text-sm text-gray-800">{tip.text}</p>
        </div>
      )}
    </section>
  )
}
