// Shared types used by both web and mobile (future)
// Import from '@shared/types' in both Next.js and Expo

export type FCategory = 'financial' | 'fitness' | 'fun' | 'flirt'

export const F_CATEGORIES: {
  key: FCategory
  label: string
  emoji: string
  prompt: string
  // Gradient classes for the step card background
  bg: string
  // Solid accent color (Tailwind class suffix) used for the slider thumb + chips
  accent: string
  // Low / high mood emoji for the slider endpoints
  lowEmoji: string
  highEmoji: string
  // Human-readable helper under the slider (10-point scale)
  scaleLabel: string
}[] = [
  {
    key: 'financial',
    label: 'Financial',
    emoji: '💰',
    prompt: "How'd your money week go?",
    bg: 'bg-amber-50 border-amber-100',
    accent: 'amber',
    lowEmoji: '💸',
    highEmoji: '📈',
    scaleLabel: 'bleeding cash → stacking it',
  },
  {
    key: 'fitness',
    label: 'Fitness',
    emoji: '💪',
    prompt: "How'd you treat your body?",
    bg: 'bg-green-50 border-green-100',
    accent: 'green',
    lowEmoji: '😴',
    highEmoji: '🔥',
    scaleLabel: 'couch mode → absolutely crushed it',
  },
  {
    key: 'fun',
    label: 'Fun / Friends',
    emoji: '🎉',
    prompt: 'How social were you this week?',
    bg: 'bg-blue-50 border-blue-100',
    accent: 'blue',
    lowEmoji: '🧍',
    highEmoji: '🎊',
    scaleLabel: 'hermit arc → main character',
  },
  {
    key: 'flirt',
    label: 'Flirt / Fervier',
    emoji: '❤️',
    prompt: "How's the love life looking?",
    bg: 'bg-pink-50 border-pink-100',
    accent: 'pink',
    lowEmoji: '🫥',
    highEmoji: '💘',
    scaleLabel: 'radio silence → on fire',
  },
]

// Curated, one-tap tags per F. Order matters — most-common first.
// "Skipped" is always last and mutually-exclusive with the others in the UI.
export const F_TAGS: Record<FCategory, string[]> = {
  financial: [
    '💵 Saved',
    '📊 Tracked budget',
    '📈 Invested',
    '💳 Paid debt',
    '🤝 Negotiated',
    '💼 Side hustle',
    '🛍️ Big purchase',
    '🚫 Skipped',
  ],
  fitness: [
    '🏋️ Gym',
    '🏃 Run',
    '🚶 Walk',
    '🧘 Yoga',
    '⚽ Sports',
    '🏊 Cardio',
    '🤸 Stretched',
    '💤 Rest day',
    '🚫 Skipped',
  ],
  fun: [
    '🍻 Hangout',
    '🍽️ Dinner',
    '🎊 Party',
    '✈️ Trip',
    '🎬 Movie',
    '🎮 Game night',
    '🎤 Concert',
    '🎨 Hobby',
    '🚫 Skipped',
  ],
  flirt: [
    '💘 Date',
    '👀 New people',
    '📱 Apps',
    '😉 Flirted',
    '💞 Relationship time',
    '✨ Solo glow-up',
    '🚫 Skipped',
  ],
}

export const SKIPPED_TAG = '🚫 Skipped'

export interface User {
  id: string
  email: string
  name: string | null
  avatarUrl: string | null
  createdAt: string
}

export interface Household {
  id: string
  name: string
  inviteCode: string
  createdAt: string
  members: HouseholdMember[]
}

export interface HouseholdMember {
  userId: string
  householdId: string
  role: 'owner' | 'member'
  joinedAt: string
  user: User
}

// Client-facing check-in shape. DB columns use snake_case; we normalise at the boundary.
export interface Checkin {
  id: string
  userId: string
  householdId: string
  weekStart: string // ISO date string, always Monday
  // Free-text notes (optional)
  financialText: string | null
  fitnessText: string | null
  funText: string | null
  flirtText: string | null
  // Scored sliders 1..10 (null = skipped)
  financialScore: number | null
  fitnessScore: number | null
  funScore: number | null
  flirtScore: number | null
  // Tag arrays
  financialTags: string[]
  fitnessTags: string[]
  funTags: string[]
  flirtTags: string[]
  createdAt: string
  user: User
  reactions: Reaction[]
}

export interface Reaction {
  id: string
  checkinId: string
  userId: string
  emoji: string
  createdAt: string
  user: User
}

export interface WeeklyFeed {
  weekStart: string
  checkins: Checkin[]
  missingMembers: User[]
}

// Compute a weekly 0-40 "life score" from per-F sliders. Skipped Fs count as 0.
export function lifeScore(scores: {
  financialScore: number | null
  fitnessScore: number | null
  funScore: number | null
  flirtScore: number | null
}): number {
  return (
    (scores.financialScore ?? 0) +
    (scores.fitnessScore ?? 0) +
    (scores.funScore ?? 0) +
    (scores.flirtScore ?? 0)
  )
}
