// Tiered streak pill. Size variants for hero (md) and leaderboard rows (sm).
import { streakTier } from '@/lib/design'

type Props = {
  streak: number
  size?: 'sm' | 'md'
  className?: string
}

export function StreakFlame({ streak, size = 'md', className }: Props) {
  const t = streakTier(streak)
  const isSm = size === 'sm'
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full ${t.bgClass} ${t.colorClass} ${
        t.shimmer ? 'flame-shimmer' : ''
      } ${isSm ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm font-semibold'} ${className ?? ''}`}
      title={t.label}
    >
      <span className={`${t.pulse ? 'flame-pulse' : ''} ${isSm ? 'text-sm' : 'text-base'}`} aria-hidden>
        {t.emoji}
      </span>
      <span className="tabular-nums">{streak}</span>
      {!isSm && <span className="text-[11px] opacity-80 font-medium">day streak</span>}
    </div>
  )
}
