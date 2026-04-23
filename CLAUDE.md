# Four Fs — Claude Code Instructions

## Working context

- **Worktree:** `C:\Users\andre\Function_4\.claude\worktrees\jolly-euclid` on branch `claude/jolly-euclid`
- **Always work in the worktree**, not the main directory
- **App root:** `app/frontend/` inside the worktree
- **Progress log:** `PROGRESS.md` at repo root — read at session start, update at session end

## Stack — critical facts

- **Next.js 14.2.0** (App Router) — NOT Next.js 15. Never use Next.js 15 APIs
- **Supabase JS client directly** — no Prisma, no ORM
- **Raw Tailwind v3** — no Shadcn, no component libraries
- **TypeScript strict** — always run `npx tsc --noEmit` before committing
- **React 18** — `useTransition` does not track async. Use `useState` for loading states
- Path alias `@/*` = `src/`, `@shared/*` = shared backend types

## Supabase patterns

```ts
// Server components / API routes
import { createClient } from '@/lib/supabase/server'
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

// Client components
import { createClient } from '@/lib/supabase/client'
```

- All RLS policies: `USING (true) WITH CHECK (true)` — user scoping is in app logic
- Add Supabase Storage RLS via SQL Editor (not UI — the UI policy builder has a syntax bug)
- All DB migrations run manually in Supabase SQL Editor — never auto-applied

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY        ← vision + LLM fallback (Phases 3–4)
SPOONACULAR_API_KEY      ← dish search + suggestions (Phases 4–5)
INSTACART_API_KEY        ← Phase 5 stretch, not blocking
CRON_SECRET              ← Phase 5 cron jobs
```

Never read these in client components — server/API routes only for secrets.

## Code style

- No Shadcn, no UI libraries — write Tailwind utility classes directly
- Rounded corners: `rounded-xl` (small), `rounded-2xl` (cards), `rounded-full` (pills/badges)
- Color palette: blue for import, green for log/meals, indigo for suggestions, amber for history
- State machines in tab components use discriminated unions: `{ kind: 'idle' | 'loading' | 'confirm' | 'saving' | 'success' | 'error' }`
- When a `saving` stage needs data from the prior `confirm` stage, carry all fields forward into saving — TypeScript will enforce this
- Always `import type` for types-only imports

## API route conventions

```ts
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // ...
}
```

- Graceful degradation: if optional API key (Spoonacular, Instacart) is absent, return empty/fallback — never crash
- Fetch with `AbortSignal.timeout(ms)` — always set timeouts on external calls
- External fetches: 5s timeout for autocomplete, 8–10s for full recipe fetches

## Meals feature architecture

The `/meals` page has 4 tabs driven by `?tab=` URL param (managed in `MealsClient`):
- **suggestions** — `SuggestionsTab` (Phase 5 stub → done)
- **log** — `LogMealTab` (Phase 4 complete)
- **import** — `ImportRecipeTab` (Phase 3 complete)
- **history** — `HistoryTab` (Phase 5 stub → done)

Key lib: `src/lib/meals/matchPantry.ts` — Fuse.js fuzzy match, threshold 0.4, expands aliases.

Claude model for all AI calls: `claude-sonnet-4-6`

## Do not

- Do not add `router.refresh()` unless stale server data is specifically the problem
- Do not use `useTransition` for async operations
- Do not use `find` or `grep` shell commands — use the Glob/Grep tools
- Do not commit `.env.local` or API keys
- Do not push to remote unless explicitly asked
- Do not merge `claude/jolly-euclid` → `main` unless explicitly asked
- Do not add Shadcn, Radix, or any component library

## Commit pattern

```bash
git add <specific files>
git commit -m "Phase N: short description

- bullet what changed and why

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Type-check must pass before every commit: `cd app/frontend && npx tsc --noEmit`
