# Four Fs — Project Progress Log

Live URL: https://function-four.vercel.app
Repo: https://github.com/andrewmeyer35/Function_Four
Supabase: project configured with RLS policies
Last updated: 2026-04-22
Working branch: `claude/jolly-euclid` (git worktree at `C:\Users\andre\Function_4\.claude\worktrees\jolly-euclid`)

---

## ⚡ PHASE 5 PICKUP — START HERE NEXT SESSION

### What to build: Suggestions tab + History tab

**Context:** Phases 1–4 fully committed and type-check clean. Branch `claude/jolly-euclid`. `/meals` has 4 tabs; `SuggestionsTab` and `HistoryTab` are still stubs. Phase 5 completes the feature.

### Phase 5 task order

#### 5A — SQL to run in Supabase before testing (if not done)
```sql
-- Pantry decrement RPC (needed by Phase 4 confirm route)
create or replace function decrement_pantry_quantity(
  p_item_id uuid, p_amount numeric
) returns void language sql security definer as $$
  update pantry_items set quantity = greatest(0, quantity - p_amount), updated_at = now()
  where id = p_item_id;
$$;
```

#### 5B — Suggestions Tab
1. **`GET /api/meal-suggestions`** route:
   - Fetch `pantry_items` (household-scoped, order by expiration_date asc nulls last, limit 20)
   - Call Spoonacular `findByIngredients` with top 10 ingredient names: `GET /recipes/findByIngredients?ingredients={csv}&number=10&ranking=2&ignorePantry=true`
   - Batch fetch recipe info: `GET /recipes/informationBulk?ids={csv}&includeNutrition=false`
   - Score: `(usedCount / (usedCount + missedCount)) * 0.6 + expiryBonus * 0.4`
     - `expiryBonus = 1.0` if any used ingredient expires within 3 days, else `0`
   - Build `MealSuggestion[]` (type in `src/lib/meals/types.ts`), return top 5
   - Cache result in `recipe_suggestions` table (expires 6 hours)
   - Graceful fallback: if `SPOONACULAR_API_KEY` absent, return 3 static placeholder suggestions

2. **`SuggestionsTab.tsx`** UI (replace stub at `src/components/meals/SuggestionsTab.tsx`):
   - On mount: fetch `/api/meal-suggestions`, show loading skeleton (3 card placeholders)
   - `SuggestionCard` component per result:
     - Dish name (bold) + cuisine badge + cook time
     - Pantry match % bar (green gradient, `pantryMatchPercent`)
     - Key ingredients list (up to 4, comma-separated)
     - Missing ingredients in amber if any
     - `whyNow` text (italic, gray)
     - "Cook this" button → `router.push('/meals?tab=log&dishId={spoonacularId}')`
   - "Refresh" button top-right to re-fetch
   - Empty state if pantry is empty: "Add items to your pantry to get meal suggestions"
   - Error state with retry

#### 5C — LogMealTab pre-fill from Suggestions (small wiring)
In `src/components/meals/LogMealTab.tsx`, add at the top of the component:
```tsx
const searchParams = useSearchParams()
const router = useRouter()
const dishIdParam = searchParams.get('dishId')
useEffect(() => {
  if (dishIdParam && stage.kind === 'idle') {
    handleDishSelect({ id: parseInt(dishIdParam), title: '' })
    // Clear the param so back navigation works cleanly
    const p = new URLSearchParams(searchParams.toString())
    p.delete('dishId')
    router.replace(`/meals?${p.toString()}`)
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [dishIdParam])
```

#### 5D — History Tab
1. **`GET /api/meal-history`** route:
   - Query `meal_photos` for user/household, `order by created_at desc`, limit 20
   - Query `recipe_imports` where `status = 'confirmed'`, `order by created_at desc`, limit 20
   - Merge + sort by date
   - For each `meal_photos` row, count `consumption_logs` where `meal_photo_id = id`
   - Return `{ items: [{ id, type: 'photo'|'recipe', title, imageUrl|null, date, ingredientCount }] }`

2. **`HistoryTab.tsx`** UI (replace stub):
   - Fetch `/api/meal-history` on mount
   - Date section headers: "Today", "Yesterday", then formatted date strings
   - `HistoryCard`: thumbnail (or green dish icon), title, date, ingredient count badge
   - Empty state: "No meals logged yet — photo a meal or import a recipe to get started"
   - Tap card → expandable inline detail with ingredient list (from `analysis_json` or `recipe_json`)

#### 5E — Commit + PROGRESS.md update

### Key Spoonacular endpoints
```
findByIngredients:  GET /recipes/findByIngredients?apiKey=&ingredients={csv}&number=10&ranking=2&ignorePantry=true
informationBulk:    GET /recipes/informationBulk?apiKey=&ids={csv}&includeNutrition=false
single info:        GET /recipes/{id}/information?apiKey=&includeNutrition=false
```
Response shapes:
- `findByIngredients`: `[{id, title, usedIngredientCount, missedIngredientCount, missedIngredients[{name,amount,unit}]}]`
- `informationBulk`: `[{id, title, servings, readyInMinutes, dishTypes[], cuisines[], extendedIngredients[]}]`

### MealSuggestion type (already in src/lib/meals/types.ts)
```ts
{ rank, dishName, cuisine, cookTimeMinutes, whyNow, keyIngredients: string[],
  missingIngredients: [{name, quantity, unit}], pantryMatchPercent: number,
  difficultyLevel: 'easy'|'medium'|'hard', spoonacularId?: number }
```
Derive `difficultyLevel` from `readyInMinutes`: ≤20 = easy, ≤45 = medium, else hard.
Derive `whyNow`: "Uses your [ingredient] expiring soon" or "Great use of your pantry".

---

## 1. Project Overview

Four Fs is a lifestyle accountability web app for households tracking four life pillars:
- 💰 **Financial** — saving, avoiding impulse spending, eating at home
- 💪 **Fitness** — workouts, sleep, nutrition
- 🎉 **Fun/Friends** — social activity, meaningful connections
- 💘 **Flirt/Fervier** — dating activity, self care

Week runs **Saturday → Friday**. Users set weekly goals, check off daily progress, compete on household leaderboard.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14.2.0 (App Router), TypeScript, TailwindCSS v3 |
| Backend | Supabase (PostgreSQL + Auth + Storage + RLS) |
| Auth | Supabase magic link (email OTP) |
| AI | Anthropic SDK — `claude-sonnet-4-6` |
| Recipe data | Spoonacular API |
| Fuzzy match | Fuse.js v7 |
| HTML parse | Cheerio v1 |
| State | Zustand + React Query |
| Hosting | Vercel (auto-deploys from `main`) |
| Repo | GitHub — andrewmeyer35/Function_Four |

**CRITICAL: Next.js 14.2.0 NOT 15. App Router. No Prisma — raw Supabase JS client only.**

**Key config:**
- `app/frontend/postcss.config.js` — required for Tailwind
- `app/frontend/next.config.js` — webpack `@shared/*` alias
- `app/frontend/tsconfig.json` — `@/*` and `@shared/*` path aliases

**Environment variables (`.env.local` + Vercel dashboard):**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY          ← Phases 3 & 4 (vision + LLM fallback)
SPOONACULAR_API_KEY        ← Phases 4 & 5 (dish search + suggestions)
INSTACART_API_KEY          ← Phase 5 stretch, not blocking
CRON_SECRET                ← Phase 5 cron jobs
```

---

## 3. Database Schema

### Migrations 001–004 (pre-meals)
```sql
-- 001
users (id, email, name, created_at)
households (id, name, invite_code, created_at)
household_members (id, user_id, household_id, role, joined_at)
-- 002 legacy
checkins (id, user_id, household_id, week_start, *_score, *_tags, *_text, created_at)
-- 003 current system
user_goals (id, user_id, category, metric_key, label, target, is_active, created_at, updated_at)
  UNIQUE(user_id, metric_key)
daily_logs (id, user_id, household_id, log_date, week_start, saved_toward_goal, no_impulse_spend,
            meals_ate_in, worked_out, sleep_7plus, good_nutrition, had_social_activity,
            quality_connection, dating_activity, self_care, notes, created_at, updated_at)
  UNIQUE(user_id, log_date)
-- 004
ALTER TABLE daily_logs ADD COLUMN workout_intensity SMALLINT CHECK (1–7), workout_distance NUMERIC(6,2)
```

### Phase 1 Migrations (meals — run manually in Supabase SQL Editor)
```sql
create table pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  household_id uuid references households,
  name text not null, aliases text[] default '{}',
  quantity numeric(10,3) not null default 0, unit text, category text,
  expiration_date date, auto_reorder boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table consumption_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null, household_id uuid references households,
  pantry_item_id uuid references pantry_items, ingredient_name text not null,
  quantity_consumed numeric(10,3), unit text,
  source_type text not null,  -- 'meal_photo_estimated'|'confirmed'|'recipe_import'
  confidence numeric(4,3), meal_photo_id uuid, created_at timestamptz default now()
);
create table meal_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null, household_id uuid references households,
  image_url text not null, dish_name text, dish_confidence numeric(4,3),
  cuisine text, estimated_servings integer, analysis_json jsonb,
  created_at timestamptz default now()
);
create table recipe_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null, household_id uuid references households,
  source_url text, source_type text not null, source_image_url text,
  recipe_json jsonb not null, extraction_confidence numeric(4,3),
  pantry_deductions jsonb default '[]', cart_items jsonb default '[]',
  status text default 'confirmed', confirmed_at timestamptz, created_at timestamptz default now()
);
create table meal_preference_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null, household_id uuid references households,
  dietary_restrictions text[] default '{}', allergens text[] default '{}',
  preferred_cuisines text[] default '{}', disliked_ingredients text[] default '{}',
  max_cook_time_minutes integer, serving_size integer default 2,
  inferred_favorites jsonb default '[]', inferred_ingredient_preferences jsonb default '[]',
  onboarding_completed_at timestamptz, updated_at timestamptz default now()
);
create table recipe_suggestions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid references households, user_id uuid references auth.users not null,
  suggestions_json jsonb not null, pantry_snapshot jsonb,
  generated_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '6 hours')
);
-- RLS (repeat for all 6 tables)
alter table pantry_items enable row level security;
create policy "all" on pantry_items for all using (true) with check (true);
```

**Storage bucket:**
```
bucket name: meal-photos (public)
Policy — run in SQL Editor (UI has a bug with policy builder):
  create policy "Allow users to manage their own files"
  on storage.objects for all
  using (bucket_id = 'meal-photos') with check (bucket_id = 'meal-photos');
```

**RPC (run if not yet done):**
```sql
create or replace function decrement_pantry_quantity(p_item_id uuid, p_amount numeric)
returns void language sql security definer as $$
  update pantry_items set quantity = greatest(0, quantity - p_amount), updated_at = now()
  where id = p_item_id;
$$;
```

> ⚠️ All migrations run manually in Supabase SQL Editor — NOT auto-applied.

---

## 4. Pages & Routes

| Route | Type | Description |
|-------|------|-------------|
| `/login` | Public | Magic link login |
| `/onboarding` | Auth | Create or join household (`?invite=CODE`) |
| `/household` | Auth | Home — hero rings, leaderboard, breakdown |
| `/log` | Auth | Weekly tracker |
| `/goals` | Auth | Goal setter |
| `/board` | Auth | Household leaderboard |
| `/profile` | Auth | User info + invite panel |
| `/meals` | Auth | Meals — 4 tabs (suggestions, log, import, history) |
| `/meals/share` | System | PWA Web Share Target fallback |
| `/auth/callback` | System | Supabase magic link callback |

### API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/goals` | GET/POST | Goals CRUD |
| `/api/daily-logs` | GET/POST | Daily log CRUD |
| `/api/households` | POST | Create household |
| `/api/households/join` | POST | Join via invite code |
| `/api/recipe-import/from-url` | GET | JSON-LD + LLM recipe extract |
| `/api/recipe-import/from-image` | POST | Claude vision OCR |
| `/api/recipe-import/confirm` | POST | Save recipe_imports row |
| `/api/meal-log/analyze-photo` | POST | Claude vision + Fuse.js match |
| `/api/meal-log/search-dish` | GET | Spoonacular autocomplete |
| `/api/meal-log/dish-ingredients` | GET | Spoonacular recipe + pantry match |
| `/api/meal-log/confirm` | POST | Write DB, decrement pantry |
| `/api/meal-suggestions` | GET | **Phase 5** Spoonacular + scoring |
| `/api/meal-history` | GET | **Phase 5** unified history |

---

## 5. Meals Feature File Map

```
src/
  lib/meals/
    types.ts            ← all shared TS types
    matchPantry.ts      ← Fuse.js matching utility (threshold 0.4)

  app/
    (app)/meals/
      page.tsx          ← server: auth guard + household lookup
      share/route.ts    ← PWA Web Share Target fallback
    api/
      recipe-import/from-url/route.ts    ← JSON-LD → LLM fallback
      recipe-import/from-image/route.ts  ← Claude vision OCR
      recipe-import/confirm/route.ts     ← save recipe_imports
      meal-log/analyze-photo/route.ts    ← vision + parallel pantry + Fuse.js
      meal-log/search-dish/route.ts      ← Spoonacular autocomplete
      meal-log/dish-ingredients/route.ts ← Spoonacular info + Fuse.js
      meal-log/confirm/route.ts          ← DB writes + pantry decrement

  components/meals/
    MealsClient.tsx          ← tab state via URL params
    MealsTabs.tsx            ← 4-tab pill bar
    SuggestionsTab.tsx       ← ⚠️ STUB → Phase 5
    LogMealTab.tsx           ← full (photo/search → confirm → save)
    ImportRecipeTab.tsx      ← full (URL/screenshot/share → preview → save)
    HistoryTab.tsx           ← ⚠️ STUB → Phase 5
    MealPhotoCapture.tsx     ← camera + gallery, preview thumbnail
    DishSearch.tsx           ← debounced Spoonacular autocomplete
    ServingsScaler.tsx       ← +/− stepper, rescales deductions
    IngredientConfirmation.tsx ← toggle + qty editor, color-coded
    RecipeUrlInput.tsx       ← URL paste + validation
    RecipeScreenshotUpload.tsx ← drag-drop + file picker
    ShareLanding.tsx         ← reads from SW Cache API
    RecipePreview.tsx        ← editable display, confirm/back

public/
  manifest.json  ← PWA share_target config
  sw.js          ← intercepts POST /meals/share, caches file, redirects
```

---

## 6. Session Log

### Sessions 1–4 — Core app (pre-2026-04-22)
Auth, goals, daily logs, leaderboard, workout tracking, invite system, Vercel deployment.

### Session 5 — Meals Feature Phases 1–4 (2026-04-22)

**Phase 1** (`9643510`): PWA manifest + SW, 6 DB table migrations, `types.ts`, `.env.local.example`, Storage bucket setup.

**Phase 2** (`be39eb8`): BottomNav + Sidebar Goals→Meals. `/meals` server page. `MealsClient`, `MealsTabs`, 4 stub tabs.

**Phase 3** (`af19ee3`): Recipe import tab fully wired. `from-url` (JSON-LD + Anthropic LLM via cheerio). `from-image` (Claude vision, Storage upload). `confirm` route. PWA share fallback. `RecipeUrlInput`, `RecipeScreenshotUpload`, `ShareLanding`, `RecipePreview`, `ImportRecipeTab` state machine.

**Phase 4** (`6744579`): Log meal tab fully wired. `matchPantry.ts` Fuse.js. `analyze-photo` (vision + parallel pantry). `search-dish` (Spoonacular, graceful degradation). `dish-ingredients` (Spoonacular + Fuse.js). `confirm` (meal_photos, RPC decrement, consumption_logs). `MealPhotoCapture`, `DishSearch`, `ServingsScaler`, `IngredientConfirmation`, `LogMealTab` state machine.

---

## 7. Known Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| No CSS rendered | Missing `postcss.config.js` | Created the file |
| `@shared/*` not resolved | Missing webpack alias | Created `next.config.js` |
| SWC parse error on `>` | Bare `>` misread as JSX | Use `>=` |
| Goals not saving silently | `useTransition` + async React 18 | Replaced with `useState` |
| Track tab stale data | Server cache not invalidated | Added `router.refresh()` |
| Table not found | Migrations not run | Run SQL in Supabase SQL Editor |
| Vercel TS build error | Partial select type | Cast via `as unknown as Type[]` |
| Vercel CSS build error | `ringColor` not valid CSS | Removed |
| Magic link not arriving | Live URL missing from Supabase auth | Added to Site URL + Redirect URLs |
| Supabase Storage RLS UI error | Policy builder bug | Run SQL directly in SQL Editor |
| TS union error on saving stage | Saving stage missing parent fields | Carry all confirm-stage fields into saving |

---

## 8. Deployment

- **Live URL:** https://function-four.vercel.app
- **Root directory:** `app/frontend`
- **Auto-deploy:** push to `main`
- **Required Vercel env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `SPOONACULAR_API_KEY`
- **Supabase Auth:** Site URL + Redirect URL = `https://function-four.vercel.app(/auth/callback)`

**To deploy meals feature when Phase 5 complete:**
```bash
git checkout main && git merge claude/jolly-euclid && git push
```

---

## 9. Backlog (non-meals)

- [ ] Push notifications when roommate logs a workout
- [ ] Weekly summary email (Sunday recap)
- [ ] Streak freeze / grace day feature
- [ ] Historical weekly view — browse past weeks in Track tab
- [ ] Goal suggestions based on category performance
- [ ] Dark mode
- [ ] Custom goal creation (beyond 10 preset options)
- [ ] Upgrade Next.js from 14.2.0 (flagged security advisory)
