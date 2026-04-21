// Plain (non-client) module for the check-in form shape so the server page
// and the client wizard can share it without tripping Next.js's rule against
// dotting into a 'use client' module from a server component.
import type { FCategory } from '@shared/types'

export type PerF = {
  score: number | null // 1..10, null = skipped
  tags: string[]
  note: string
}

export type CheckinInitial = Record<FCategory, PerF>

export const EMPTY_CHECKIN: CheckinInitial = {
  financial: { score: 7, tags: [], note: '' },
  fitness: { score: 7, tags: [], note: '' },
  fun: { score: 7, tags: [], note: '' },
  flirt: { score: 7, tags: [], note: '' },
}
