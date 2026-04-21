// Design tokens — single source of truth for per-F styling across the app.
// Each F exposes a gradient id, stop hexes (for inline SVG), and Tailwind classes.
import type { FCategory } from '@shared/types'

export type FTheme = {
  gradientId: string
  from: string
  to: string
  // Tailwind classes ready for use:
  textClass: string // dark text on light bg
  bgSoft: string // soft tint background
  bgChipActive: string // gradient fill for active chip
  border: string
  ring: string // used for focus rings / slider thumb outlines
  accentHex: string // single color for slider thumb border
}

export const F_THEME: Record<FCategory, FTheme> = {
  financial: {
    gradientId: 'grad-financial',
    from: '#fbbf24',
    to: '#f97316',
    textClass: 'text-amber-900',
    bgSoft: 'bg-amber-50/80',
    bgChipActive: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white border-transparent shadow-md shadow-amber-500/30',
    border: 'border-amber-200/70',
    ring: 'focus:ring-amber-400',
    accentHex: '#f59e0b',
  },
  fitness: {
    gradientId: 'grad-fitness',
    from: '#a3e635',
    to: '#10b981',
    textClass: 'text-emerald-900',
    bgSoft: 'bg-emerald-50/80',
    bgChipActive: 'bg-gradient-to-br from-lime-400 to-emerald-500 text-white border-transparent shadow-md shadow-emerald-500/30',
    border: 'border-emerald-200/70',
    ring: 'focus:ring-emerald-400',
    accentHex: '#10b981',
  },
  fun: {
    gradientId: 'grad-fun',
    from: '#38bdf8',
    to: '#6366f1',
    textClass: 'text-indigo-900',
    bgSoft: 'bg-sky-50/80',
    bgChipActive: 'bg-gradient-to-br from-sky-400 to-indigo-500 text-white border-transparent shadow-md shadow-indigo-500/30',
    border: 'border-sky-200/70',
    ring: 'focus:ring-sky-400',
    accentHex: '#6366f1',
  },
  flirt: {
    gradientId: 'grad-flirt',
    from: '#fb7185',
    to: '#d946ef',
    textClass: 'text-fuchsia-900',
    bgSoft: 'bg-rose-50/80',
    bgChipActive: 'bg-gradient-to-br from-rose-400 to-fuchsia-500 text-white border-transparent shadow-md shadow-fuchsia-500/30',
    border: 'border-rose-200/70',
    ring: 'focus:ring-rose-400',
    accentHex: '#ec4899',
  },
}

/** Tiered streak flame. Returns the visual to render plus a little brag text. */
export function streakTier(streak: number): {
  emoji: string
  label: string
  pulse: boolean
  shimmer: boolean
  colorClass: string
  bgClass: string
} {
  if (streak >= 100)
    return {
      emoji: '🔥',
      label: 'Legend',
      pulse: true,
      shimmer: true,
      colorClass: 'text-white',
      bgClass: 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-indigo-500',
    }
  if (streak >= 30)
    return {
      emoji: '🔥',
      label: 'On fire',
      pulse: true,
      shimmer: true,
      colorClass: 'text-white',
      bgClass: 'bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400',
    }
  if (streak >= 7)
    return {
      emoji: '🔥',
      label: 'Rolling',
      pulse: true,
      shimmer: false,
      colorClass: 'text-orange-900',
      bgClass: 'bg-gradient-to-r from-amber-300 to-orange-400',
    }
  if (streak >= 1)
    return {
      emoji: '🔥',
      label: 'Starting',
      pulse: false,
      shimmer: false,
      colorClass: 'text-amber-900',
      bgClass: 'bg-amber-100',
    }
  return {
    emoji: '✨',
    label: 'No streak yet',
    pulse: false,
    shimmer: false,
    colorClass: 'text-gray-500',
    bgClass: 'bg-gray-100',
  }
}

/** Descriptive vibe text keyed off life score (0..40). */
export function lifeScoreVibe(total: number): { title: string; sub: string } {
  if (total >= 36) return { title: 'Peak week', sub: 'Absolutely dialed in. This is the one.' }
  if (total >= 30) return { title: 'Living well', sub: 'Strong across the board. Keep it going.' }
  if (total >= 22) return { title: 'Solid week', sub: 'Real progress on the stuff that matters.' }
  if (total >= 14) return { title: 'Mixed bag', sub: 'Some Fs fired, some fizzled. You got this.' }
  if (total >= 6) return { title: 'Rebuilding', sub: 'Every streak starts with one rep. Today counts.' }
  if (total > 0) return { title: 'Barely there', sub: 'Small moves. Tomorrow is a fresh shot.' }
  return { title: 'Fresh slate', sub: 'The week is yours. Go plant some flags.' }
}
