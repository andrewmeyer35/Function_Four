# Four Fs — Claude Code Instructions

## Working context

- **Worktree:** `C:\Users\andre\Function_4\.claude\worktrees\jolly-euclid` on branch `claude/jolly-euclid`
- **Always work in the worktree**, not the main directory
- **App root:** `app/frontend/` inside the worktree
- **Progress log:** `PROGRESS.md` at repo root — read at session start, update at session end

---

## Agent orchestration — HOW TO WORK

This project uses a **head agent + specialist agent** pattern. As the head agent (main conversation), your job is to orchestrate, synthesize, and decide — not to do every unit of work serially.

### When to spawn agents

| Situation | Action |
|-----------|--------|
| New feature with 3+ independent pieces | Spawn parallel Explore + Plan agents before writing any code |
| Any non-trivial implementation (>50 lines) | Spawn a peer-review agent after writing, before committing |
| Researching an unfamiliar API or pattern | Spawn an Explore agent; don't search manually |
| Two files can be implemented independently | Spawn two general-purpose agents in parallel |
| Uncertainty about best approach | Spawn two Plan agents with different briefs, compare outputs |

### The parallel research pattern (use at phase start)

Before implementing any phase, fire these two agents simultaneously in a single message:

```
Agent 1 (Explore): "Read all existing files in src/components/meals/ and src/app/api/ and
  summarize: exact component props, state machine shapes, API response formats, and any
  patterns I should match for consistency."

Agent 2 (Plan): "Given [feature description], design two alternative implementations —
  one simpler, one more capable. For each: list files to create/modify, key decisions,
  trade-offs, and potential bugs. Stack: Next.js 14 App Router, Supabase JS client,
  raw Tailwind, no libraries."
```

Synthesize both results before writing a single line of code.

### The peer review pattern (use before every commit)

After implementing any non-trivial feature, spawn this agent:

```
Agent (general-purpose): "Review the following implementation for this Next.js 14 /
  Supabase / Tailwind project. Check for:
  1. TypeScript correctness — union type exhaustiveness, missing null checks
  2. Security — unvalidated user input, missing auth checks, secrets in client code
  3. UX gaps — missing loading states, error states, empty states, disabled states
  4. Bugs — race conditions, missing cleanup (timeouts, event listeners), stale closures
  5. Performance — unnecessary re-renders, missing debounce, large payload fetches
  6. Consistency — does it match existing patterns in MealsClient/LogMealTab state machines?

  Report: list of issues by severity (critical / warning / minor). For each critical/warning,
  provide the exact fix."

  [paste the implementation files]
```

Apply all critical and warning fixes before committing. Minor items are optional.

### The competing solutions pattern (use when approach is unclear)

When there are two valid ways to solve something (e.g., client-side cache vs. server cache, URL state vs. React state):

1. Spawn two Plan agents simultaneously, each briefed to argue for one approach
2. Read both outputs
3. Make the call yourself based on: fewer moving parts wins, less client JS wins, simpler state wins
4. Document the decision in a comment if non-obvious

### Parallel implementation pattern (use for independent files)

When building an API route and its UI component (they don't depend on each other until wired):

```
// Spawn simultaneously:
Agent 1: "Implement GET /api/meal-suggestions route. [full spec]"
Agent 2: "Implement SuggestionsTab.tsx UI component. [full spec + mock data shape]"
```

Wire them together in the main conversation after both return.

---

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
- **suggestions** — `SuggestionsTab` (Phase 5 stub → target)
- **log** — `LogMealTab` (Phase 4 complete)
- **import** — `ImportRecipeTab` (Phase 3 complete)
- **history** — `HistoryTab` (Phase 5 stub → target)

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
- Do not write code without first checking if a parallel research agent should run

## Commit pattern

```bash
git add <specific files>
git commit -m "Phase N: short description

- bullet what changed and why

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Type-check must pass before every commit: `cd app/frontend && npx tsc --noEmit`

## Quality gate before every commit

Run peer-review agent (see orchestration section above). Must pass:
- [ ] No TypeScript errors (`npx tsc --noEmit` clean)
- [ ] Auth check on every API route
- [ ] Loading + error + empty states present in every tab component
- [ ] No secrets or env vars referenced in client components
- [ ] Graceful degradation if optional API keys absent
