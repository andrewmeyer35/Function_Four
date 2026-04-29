# Four Fs — Claude Code Instructions

---

## SESSION START PROTOCOL — run every session before writing any code

**Step 1 — Read the progress log**
```bash
# In the worktree root
cat PROGRESS.md
```
Understand: what phase we're on, what's done, what's next, any open bugs.

**Step 2 — Orient on main (what's deployed)**
```bash
cd C:\Users\andre\Function_4
git log --oneline -6
```
This is what's live on Vercel. Know it before touching anything.

**Step 3 — Orient on the worktree (what's in progress)**
```bash
cd C:\Users\andre\Function_4\.claude\worktrees\jolly-euclid
git log --oneline origin/main..HEAD   # commits ahead of main
git status --short                     # uncommitted changes
```
Understand: how many commits ahead of main, any unstaged work.

**Step 4 — Scan main's working directory for stranded work**
```bash
cd C:\Users\andre\Function_4
git status --short
```
If you see untracked feature files here, they were written in the wrong place. Do NOT commit them to main. Either:
- Copy relevant new files to the worktree if the worktree doesn't have them
- Discard with `git restore .` if the worktree already has the canonical version
- Ask the user before deleting untracked files that might contain unreplicated work

**Step 5 — Summarize the delta for the user**
Report in 2–3 sentences: what's live, what's ahead of main, any stranded work, what the plan is for this session. Then ask before writing any code.

---

## Branch & merge discipline

### Rule 1 — All feature work lives in the worktree
```
WRITE CODE HERE:     C:\Users\andre\Function_4\.claude\worktrees\jolly-euclid\
NEVER WRITE HERE:    C:\Users\andre\Function_4\   ← main working directory
```
The main directory is for reference and merge operations only. If a file edit touches `C:\Users\andre\Function_4\app\` directly (not via the worktree path), stop and redirect to the worktree.

### Rule 2 — Main = production
Main auto-deploys to Vercel on every push. Never push half-finished work to main.

### Rule 3 — Merge criteria (all must be true)
Before recommending a merge to main, verify every box:
- [ ] Feature works end-to-end in local `npm run dev`
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] Peer-review agent found no critical or warning issues
- [ ] Auth check (`getUser()` + 401) on every API route
- [ ] Loading, error, and empty states in every new tab component
- [ ] All pending SQL migrations documented and ready for user to run
- [ ] `PROGRESS.md` updated with session log and next steps
- [ ] No secrets or `.env.local` values committed

### Rule 4 — How to merge
```bash
# From repo root (main worktree)
git checkout main
git merge claude/jolly-euclid
git push origin main
# Vercel deploys automatically in ~2 min
```
After merge: user must add new env vars to Vercel, run any pending SQL migrations in Supabase.

### Rule 5 — New feature = new worktree
When starting work that should be kept separate from the current branch:
```bash
git worktree add .claude/worktrees/new-feature-name -b claude/new-feature-name
```
Work there. Never stack unrelated work on the current branch.

### Rule 6 — Clean up after merge
After a successful merge to main:
```bash
git worktree remove .claude/worktrees/jolly-euclid
git branch -d claude/jolly-euclid
```
Start the next cycle in a fresh worktree.

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

The `/meals` page has 6 tabs driven by `?tab=` URL param (managed in `MealsClient`):
- **suggestions** — `SuggestionsTab` — AI-ranked recipes, expiry-aware (Phase 7 complete)
- **plan** — `MealPlanTab` — 7-day meal planner + shopping list with Realtime cart
- **log** — `LogMealTab` — photo recognition, dish search, pantry deduction (Phase 4 complete)
- **import** — `ImportRecipeTab` — URL paste, screenshot OCR, PWA share (Phase 3 complete)
- **pantry** — `PantryTab` — inventory management, expiry tracking
- **history** — `HistoryTab` — saved recipes + logged meal timeline

Key libs:
- `src/lib/meals/matchPantry.ts` — Fuse.js fuzzy match, threshold 0.4, expands aliases
- `src/lib/meals/normalizeUnits.ts` — volume/weight unit normalization
- `src/lib/meals/storeSection.ts` — grocery store section grouping for shopping list
- `src/lib/meals/preferences.ts` — dietary/cuisine preference types

Claude model for all AI calls: `claude-sonnet-4-6`

## Current worktree

- **Branch:** `claude/jolly-euclid`
- **Path:** `C:\Users\andre\Function_4\.claude\worktrees\jolly-euclid`
- **App root:** `app/frontend/` inside the worktree
- **Progress log:** `PROGRESS.md` at worktree root

## Do not

- Do not add `router.refresh()` unless stale server data is specifically the problem
- Do not use `useTransition` for async operations
- Do not use `find` or `grep` shell commands — use the Glob/Grep tools
- Do not commit `.env.local` or API keys
- Do not push to remote unless explicitly asked
- Do not merge `claude/jolly-euclid` → `main` unless explicitly asked
- Do not add Shadcn, Radix, or any component library
- Do not write code without first checking if a parallel research agent should run
- Do not write feature code in `C:\Users\andre\Function_4\app\` (main directory) — always use the worktree

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
