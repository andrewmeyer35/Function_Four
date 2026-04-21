// "This week's breakdown" card — shows a single person's per-F scores, tags, and notes.
// Matches the screenshot layout: score/progress header, segmented bar, per-F rows.
import { F_CATEGORIES } from '@shared/types'
import { F_THEME } from '@/lib/design'
import { rowLifeScore, type CheckinRow } from '@/lib/scoring'

type CheckinWithMeta = CheckinRow & {
  id: string
  financial_text: string | null
  fitness_text: string | null
  fun_text: string | null
  flirt_text: string | null
  user: { id: string; email: string; name: string | null }
}

type Props = {
  checkin: CheckinWithMeta | null
  userName: string
  /** All members to show a switcher if multiple. Currently renders the given checkin. */
  memberInitial: string
}

export function WeeklyBreakdown({ checkin, userName, memberInitial }: Props) {
  if (!checkin) {
    return (
      <div className="surface-card rounded-2xl px-4 py-8 text-center">
        <p className="text-3xl mb-2">👋</p>
        <p className="text-sm text-gray-500 max-w-[220px] mx-auto">
          No check-in yet this week. Log yours to see the breakdown.
        </p>
        <a
          href="/checkin"
          className="inline-block mt-4 px-4 py-2 bg-gray-900 text-white text-xs rounded-xl font-semibold"
        >
          Log now →
        </a>
      </div>
    )
  }

  const total = rowLifeScore(checkin)
  const pct = Math.round((total / 40) * 100)

  // Per-F score segments for the colored progress bar
  const segments = F_CATEGORIES.map((f) => {
    const score = checkin[`${f.key}_score` as keyof CheckinRow] as number | null
    return { key: f.key, score, theme: F_THEME[f.key] }
  })

  return (
    <div className="surface-card rounded-2xl overflow-hidden">
      {/* Score header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-baseline justify-between mb-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-900 tabular-nums">{total}</span>
            <span className="text-sm text-gray-400">/ 40 points</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-gray-400">Week progress</span>
            <span className="text-[11px] font-semibold text-gray-700">{pct}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-400 transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Segmented bar showing each F's contribution */}
      <div className="flex gap-0.5 px-4 pb-3">
        {segments.map(({ key, score, theme }) => {
          const w = score !== null ? (score / 40) * 100 : 0
          return (
            <div
              key={key}
              className="h-2 rounded-full transition-all duration-700"
              style={{
                width: `${w}%`,
                minWidth: w >= 1 ? '6px' : '0',
                background: `linear-gradient(90deg, ${theme.from}, ${theme.to})`,
              }}
            />
          )
        })}
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-100" />

      {/* Per-F rows */}
      <div className="divide-y divide-gray-100">
        {F_CATEGORIES.map((f) => {
          const score = checkin[`${f.key}_score` as keyof CheckinRow] as number | null
          const tags = (checkin[`${f.key}_tags` as keyof CheckinRow] as string[] | null) ?? []
          const note = checkin[`${f.key}_text` as keyof CheckinRow] as string | null
          const theme = F_THEME[f.key]
          const skipped = score === null

          return (
            <div key={f.key} className="px-4 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-semibold text-gray-800">
                  {f.emoji} {f.label}
                </span>
                {skipped ? (
                  <span className="text-xs font-semibold" style={{ color: theme.from }}>
                    skip
                  </span>
                ) : (
                  <span className="text-sm font-bold" style={{ color: theme.from }}>
                    {score}/10
                  </span>
                )}
              </div>

              {tags.length >= 1 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {note && (
                <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{note}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
