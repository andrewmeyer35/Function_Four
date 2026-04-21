// Animated SVG progress ring — Apple Fitness-inspired, gradient-filled.
// `pct` is 0..1. Renders a single circle ring; the SVG parent can embed multiple.
import { F_THEME } from '@/lib/design'
import type { FCategory } from '@shared/types'

type Props = {
  pct: number
  size?: number
  stroke?: number
  f?: FCategory
  // Optional override gradient (takes precedence over `f`).
  gradient?: { id: string; from: string; to: string }
  // Center label inside the ring.
  children?: React.ReactNode
  className?: string
  // Show the track ring behind the progress.
  track?: boolean
}

export function Ring({
  pct,
  size = 140,
  stroke = 14,
  f,
  gradient,
  children,
  className,
  track = true,
}: Props) {
  const clamped = Math.max(0, Math.min(1, pct))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - clamped)

  const grad = gradient ?? (f ? { id: F_THEME[f].gradientId, from: F_THEME[f].from, to: F_THEME[f].to } : null)
  if (!grad) throw new Error('Ring needs either `f` or `gradient`')

  const gradId = `${grad.id}-${size}-${stroke}`

  return (
    <div className={`relative inline-flex items-center justify-center ring-animate ${className ?? ''}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block -rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={grad.from} />
            <stop offset="100%" stopColor={grad.to} />
          </linearGradient>
        </defs>
        {track && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={stroke}
          />
        )}
        <circle
          className="ring-fg"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center text-center">
          {children}
        </div>
      )}
    </div>
  )
}
