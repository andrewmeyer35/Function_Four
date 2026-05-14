# Four Fs — Project Progress Log

Live URL: https://function-four.vercel.app
Repo: https://github.com/andrewmeyer35/Function_Four
Supabase: project configured with RLS policies
Last updated: 2026-05-13 (Session 17)
Working branch: `claude/jolly-euclid` (git worktree at `C:\Users\andre\Function_4\.claude\worktrees\jolly-euclid`)

---

## ⚡ START HERE — read this first, then say "continue"

**Branch:** `claude/jolly-euclid` · **Worktree:** `C:\Users\andre\Function_4\.claude\worktrees\jolly-euclid`
**Session ended:** 2026-05-13 (Session 17)

### 🟢 MERGED TO MAIN — Phase 12 complete
Task: Shopping list color coding, meal planner tiles, receipt scanner
Status: Committed (`248c23c`) and merged to `main`

Files changed this session:
- `app/frontend/src/components/meals/ShoppingList.tsx` — color-coded left-border accents (green/amber/blue), sub-headers per item type, smart purchase-size suggestions (STORE_UNITS, 35 ingredients), dedup of custom/low-stock against plan items
- `app/frontend/src/components/meals/MealPlanDay.tsx` — color-coded meal tiles (breakfast=amber, lunch=blue, dinner=green, snack=purple)
- `app/frontend/src/components/meals/ReceiptScanner.tsx` — new component: bottom-sheet drawer, photo upload, Claude vision receipt parse, match review, bulk cart removal
- `app/frontend/src/app/api/cart/receipt/route.ts` — new route: multipart upload, Claude vision, fuzzy match against cart, returns ReceiptMatch[]

Exact next action:
> Implement the plan at `C:\Users\andre\.claude\plans\lets-build-out-option-sleepy-pretzel.md`
> Part 1: Receipt scanner → pantry (receipt/route.ts + ReceiptScanner.tsx)
> Part 2: Codebase review fixes (analyze-photo timeout, meal-suggestions timeout, MealPlanTab/SuggestionsTab/LogMealTab/PantryTab lifecycle, extract getWeekStart utility)

Blockers / notes:
- Migration 012 still needs to be run manually in Supabase SQL Editor before pantry photos work
- pantry-photos Storage bucket still needs to be created manually in Supabase Dashboard
- Plan file: `C:\Users\andre\.claude\plans\lets-build-out-option-sleepy-pretzel.md` — full spec for Part 1 + Part 2
- UX design spec plan at `C:\Users\andre\.claude\plans\read-progress-md-and-develope-atomic-lampson.md` — refer to it for remaining T2/T3 items (T2-3 badges, T2-4 streak grace, T2-6 vibe tooltip)

### What is done (all committed to `claude/jolly-euclid`)
- Migrations 005–010 committed to branch
- `GET/POST /api/cart`, `PATCH/DELETE /api/cart/[id]`, `GET /api/cart/instacart`
- `ShoppingList.tsx` — add-item form, Realtime sync, 5s undo toast, Instacart button
- `GET /api/meal-suggestions` — 6-hour cache keyed on pantry hash
- `MealPlanTab.tsx` — fixed `userId`/`householdId` prop forwarding + timezone-safe weekStart
- **Phase 8 (Session 13):** Recipe catalog — migration 011, 25 seed recipes, full browse/filter/add-to-plan flow
  - `GET /api/catalog-recipes` — pantry-scored, cuisine + dietary filters
  - `POST /api/catalog-recipes/[id]` — copy to recipe_imports, upsert plan entry, return missing ingredients
  - `GET /api/recipe-import/history` — fixed missing route (was breaking RecipePicker)
  - `CatalogBrowser`, `CatalogRecipeCard`, `AddToPlanDrawer`, `MissingIngredientsDrawer`
  - `SuggestionsTab.tsx` — catalog section below AI picks; all peer-review fixes applied
- **Phase 9 (Session 14):** All priorities complete
  - **P1 — Cart multi-select:** `ShoppingList.tsx` — checkbox multi-select, sticky Done bar, batch-edit drawer, `Promise.all` save, optimistic UI with partial failure revert
  - **P2 — Pantry photos:** Migration 012 (`image_url TEXT`), `PantryItemCard.tsx` camera upload + thumbnail, `PATCH /api/pantry/[id]` accepts `image_url`, GET/POST pantry routes include `image_url`
  - **P3 — HistoryTab:** `GET /api/meal-history` (merges meal_photos + confirmed recipe_imports, sorted by date), `HistoryTab.tsx` unified date-grouped timeline (Today/Yesterday/MMM D) with expandable ingredient lists
  - **P4 — Smarter photo log:** `analyze-photo/route.ts` now fetches pantry (top 30) + weekly meal plan before Claude call, injects as context, replaces ingredients with recipe's exact data if confident dish match (≥0.75)
  - **Bug fix:** Instagram URL import now returns helpful error + redirects user to screenshot path
  - **ARCHITECTURE.md** committed to main branch (team onboarding reference, 13 sections)
- CLAUDE.md — Session Start + End Protocol + Branch & Merge Discipline
- All peer-review fixes applied; `tsc --noEmit` clean
- **Phase 10 (Session 15):** Performance improvements
  - `POST /api/pantry/mark-bought-batch` — batch endpoint replacing N parallel mark-bought calls
  - `ShoppingList.tsx` — batch save + 300ms Realtime debounce
  - `shopping-list/route.ts` — parallelized meal plan + pantry fetches with Promise.all
  - `MealPlanTab.tsx` — consolidated useEffect mount fetches
- **Phase 11 (Session 16):** UX research-backed design improvements (T1-1 through T2-2 + T2-5)
  - T1-1: Typography lift (text-sm → text-base throughout)
  - T1-2: Streak color red → amber (no shame)
  - T1-3: Ring tracks — category color at 15% opacity (not gray)
  - T1-4: "Board" → "Household Pulse", rank medals removed
  - T1-5: Empty states with possibility language
  - T1-6: "Log Meal" → "Log" (tab crowding reduction)
  - T2-1: Track progressive disclosure — collapse categories, today's checkbox visible
  - T2-2: Import tab removed (6→5 tabs), embedded in Plan tab
  - T2-5: Ring affirmation labels (Starting/Building/Halfway/Almost/Done)
- **Phase 12 (Session 17):** Shopping list UX + receipt scanner
  - Color-coded left-border accents on shopping list items (green=meal plan, amber=low stock, blue=custom)
  - Sub-headers per item type within each store section
  - Smart package-size hints for 35 common ingredients (e.g. "Buy 1 family pack · uses 2 of 3 lbs")
  - Deduplication: custom/low-stock items hidden if already covered by a meal plan item
  - Meal planner day tiles color-coded by meal type (breakfast=amber, lunch=blue, dinner=green, snack=purple)
  - Receipt scanner: photo → Claude vision → fuzzy match against cart → bulk remove checked items

### ✅ Phase 8 tested and working (2026-04-28)
Migration 011 + seed confirmed run. Catalog browse, filter, add-to-plan, and missing-items drawer all verified locally.

### What is broken / not yet done
1. **Migration 012** — must be run in Supabase SQL Editor before pantry photos work
2. **pantry-photos Storage bucket** — must be created manually in Supabase Dashboard (see migration 012 header)
3. **Thursday design session** — no code, full UI/UX audit of every screen
4. **Remaining backlog items** — see Section 10

### User feedback from Phase 8 test (implement Phase 9)
Three specific requests captured after live testing:

**1. Cart multi-select flow** (`ShoppingList.tsx` + `/api/cart`)
Current: tap item → confirm modal → enter qty → save (slow, one item at a time).
Requested: checkbox-select multiple items → tap "Done" → enter quantities for all at once → single save.
- Add `selectedItems: Set<string>` state for checkboxes
- Replace confirm modal with a batch-edit bottom drawer: list of selected items each with qty input
- Single `Promise.all` POST to `/api/cart` for all selected items
- Goal: fewer taps, faster perceived speed

**2. Cart saves too slowly**
The pantry `mark-bought` call + cart persistence happen sequentially. Optimise by running them in parallel (`Promise.all`) and showing optimistic UI updates (mark checked immediately, revert on error).

**3. Pantry photos** (`PantryTab.tsx` + pantry schema)
Add an optional `image_url TEXT` column to `pantry_items` (migration 012).
UI: camera icon on each `PantryItemCard` → opens file picker or camera → uploads to Supabase Storage `pantry-photos` bucket → saves URL to DB.
Show thumbnail on the card (small rounded square, 40×40px).

**4. Smarter photo log — use meal plan + pantry as AI context** (`/api/meal-log/analyze-photo/route.ts`)
When a user uploads a photo of a cooked meal, the current route sends the image to Claude with no context. Enhance it to pass three pieces of context alongside the photo:
- **The photo** (already sent)
- **Current pantry items** — so Claude knows what ingredients were available, making identification more accurate and deduction quantities more realistic
- **This week's planned meals** — so Claude can cross-reference the photo against what was actually planned (e.g. "You planned Chicken Stir Fry on Monday — is this it?") to increase dish recognition confidence

Changes needed:
- `POST /api/meal-log/analyze-photo`: fetch `pantry_items` (household-scoped, top 30 by quantity) + current week's `meal_plan_entries` with `recipe_json` before calling Claude
- Inject into the Claude prompt as structured context: `"Pantry contains: ..."` and `"This week's planned meals: ..."` — this guides the model toward likely matches
- If the identified dish matches a planned meal with high confidence (`dishConfidence >= 0.75`), pre-populate the ingredient list from that recipe's `recipe_json.ingredients` instead of asking Claude to estimate from the photo alone (more accurate deductions)
- No schema changes required — output shape (`MealPhotoAnalysis`) stays the same; only the prompt and pre-population logic change

### ⚡ Thursday — UI/UX Design Session (2026-05-01)
**Do not write feature code on Thursday.** Instead run a dedicated design session:
- Audit every screen in the app for layout, spacing, color, information hierarchy
- Review mobile vs desktop layouts (bottom nav vs sidebar)
- Define a consistent design language: card shadows, border radii, color palette per feature area
- Identify any screens that feel cluttered or have confusing flows
- Produce a design spec / decision log for implementing in a follow-up session
- Topics to cover: meals tab information density, pantry card layout, suggestion card visual polish, onboarding flow, profile page

### Next session priorities (2026-05-13)
| Priority | Goal | Scope |
|----------|------|-------|
| **1 — Must** | Receipt scanner → pantry | `receipt/route.ts` + `ReceiptScanner.tsx` — see plan Part 1 |
| **2 — Must** | API timeout fixes | `analyze-photo/route.ts` + `meal-suggestions/route.ts` — see plan Part 2 |
| **3 — Must** | Component lifecycle fixes | `MealPlanTab`, `SuggestionsTab`, `LogMealTab`, `PantryTab` — mountedRef + AbortController |
| **4 — Should** | Extract getWeekStart utility | New `src/lib/meals/utils.ts`, update 3 callers |
| **5 — Nice** | T2-3/T2-4/T2-6 UX items | Board badges, streak grace period, vibe badge tooltip |

**Plan file for items 1–4:** `C:\Users\andre\.claude\plans\lets-build-out-option-sleepy-pretzel.md`

### Pickup checklist for next session
```
1. Read PROGRESS.md (this file)
2. git log --oneline -6  (in main)
3. git log --oneline origin/main..HEAD  (in worktree)
4. git status --short  (in worktree — confirm clean)
5. Say "continue" — start with cart multi-select (Priority 1)
```

---

## Index

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Database Schema](#3-database-schema)
4. [Pages & Routes](#4-pages--routes)
5. [UI Components](#5-ui-components)
6. [Meals Feature File Map](#6-meals-feature-file-map)
7. [Session Log](#7-session-log)
8. [Known Issues & Fixes](#8-known-issues--fixes)
9. [Deployment](#9-deployment)
10. [Backlog & Future Ideas](#10-backlog--future-ideas)

---

## Phase 6 — Shopping cart (committed 2026-04-28)

**Commits:** `87f57f7` + `1463b7c` + `369ae3a` + `f7bb907`

**Files changed:** migration 009, `/api/cart`, `/api/cart/[id]`, `/api/cart/instacart`, `ShoppingList.tsx`, `MealPlanTab.tsx`, `PROGRESS.md`

**Known gap (fix Day 1):** `MealPlanTab` does not yet forward `userId`/`householdId` to `ShoppingList` — Realtime filter will be `undefined` until patched.

### What to build next: Suggestions + History tabs

**Context:** Phases 1–6 fully committed and type-check clean. Branch `claude/jolly-euclid`. `/meals` has 4 tabs; `SuggestionsTab` and `HistoryTab` are still stubs.

### Phase 7 task order

#### 7A — SQL to run in Supabase before testing (if not done)
```sql
-- Pantry decrement RPC (needed by Phase 4 confirm route)
create or replace function decrement_pantry_quantity(
  p_item_id uuid, p_amount numeric
) returns void language sql security definer as $$
  update pantry_items set quantity = greatest(0, quantity - p_amount), updated_at = now()
  where id = p_item_id;
$$;
```

#### 7B — Suggestions Tab
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

#### 7C — LogMealTab pre-fill from Suggestions (small wiring)
In `src/components/meals/LogMealTab.tsx`, add at the top of the component:
```tsx
const searchParams = useSearchParams()
const router = useRouter()
const dishIdParam = searchParams.get('dishId')
useEffect(() => {
  if (dishIdParam && stage.kind === 'idle') {
    handleDishSelect({ id: parseInt(dishIdParam), title: '' })
    const p = new URLSearchParams(searchParams.toString())
    p.delete('dishId')
    router.replace(`/meals?${p.toString()}`)
  }
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [dishIdParam])
```

#### 7D — History Tab
1. **`GET /api/meal-history`** route:
   - Query `meal_photos` for user/household, `order by created_at desc`, limit 20
   - Query `recipe_imports` where `status = 'confirmed'`, `order by created_at desc`, limit 20
   - Merge + sort by date
   - Return `{ items: [{ id, type: 'photo'|'recipe', title, imageUrl|null, date, ingredientCount }] }`

2. **`HistoryTab.tsx`** UI (replace stub):
   - Fetch `/api/meal-history` on mount
   - Date section headers: "Today", "Yesterday", then formatted date strings
   - `HistoryCard`: thumbnail (or green dish icon), title, date, ingredient count badge
   - Empty state: "No meals logged yet — photo a meal or import a recipe to get started"
   - Tap card → expandable inline detail with ingredient list (from `analysis_json` or `recipe_json`)

#### 7E — Commit + PROGRESS.md update

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

Users set weekly goals, check off daily progress, and compete on a household leaderboard. Week runs **Saturday → Friday**.

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
| Hosting | Vercel (auto-deploys from `main`) |
| Repo | GitHub — andrewmeyer35/Function_Four |

**CRITICAL: Next.js 14.2.0 NOT 15. App Router. No Prisma — raw Supabase JS client only.**

**Key config:**
- `app/frontend/postcss.config.js` — required for Tailwind
- `app/frontend/next.config.js` — webpack `@shared/*` alias
- `app/frontend/tsconfig.json` — `@/*` and `@shared/*` path aliases
- `.gitignore` — excludes `.env.local`, `node_modules`, `.next/`

**Environment variables (`.env.local` + Vercel dashboard):**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
ANTHROPIC_API_KEY          ← Phases 3 & 4 (vision + LLM fallback)
SPOONACULAR_API_KEY        ← Phases 4 & 5 (dish search + suggestions)
INSTACART_API_KEY          ← Phase 6 stretch, not blocking
CRON_SECRET                ← future cron jobs
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

### Migration 005 — Meals Tables (run manually in Supabase SQL Editor)
```sql
pantry_items (id, user_id, household_id, name, aliases TEXT[], quantity NUMERIC(10,3),
              unit, min_quantity NUMERIC, package_size NUMERIC(10,3), package_unit TEXT,
              category, expiration_date DATE, auto_reorder BOOLEAN, created_at, updated_at)

consumption_logs (id, user_id, household_id, pantry_item_id FK, ingredient_name TEXT,
                  quantity_consumed NUMERIC(10,3), unit, source_type TEXT, confidence NUMERIC(4,3),
                  meal_photo_id, created_at)

meal_photos (id, user_id, household_id, image_url TEXT, dish_name TEXT, dish_confidence NUMERIC(4,3),
             cuisine, estimated_servings INT, analysis_json JSONB, created_at)

recipe_imports (id, user_id, household_id, source_url TEXT, source_type TEXT, source_image_url TEXT,
                recipe_json JSONB, extraction_confidence NUMERIC(4,3),
                pantry_deductions JSONB, cart_items JSONB,
                status TEXT DEFAULT 'confirmed', confirmed_at TIMESTAMPTZ, created_at)

meal_preference_profiles (id, user_id, household_id, dietary_restrictions TEXT[], allergens TEXT[],
                           preferred_cuisines TEXT[], disliked_ingredients TEXT[],
                           max_cook_time_minutes INT, serving_size INT DEFAULT 2,
                           inferred_favorites JSONB, inferred_ingredient_preferences JSONB,
                           onboarding_completed_at TIMESTAMPTZ, updated_at)

recipe_suggestions (id, household_id, user_id, suggestions_json JSONB, pantry_snapshot JSONB,
                    generated_at TIMESTAMPTZ, expires_at TIMESTAMPTZ DEFAULT now()+interval '6 hours')
-- RLS on all 6 tables: USING (true) WITH CHECK (true)
```

**Storage bucket:**
```
bucket name: meal-photos (public)
Policy — run in SQL Editor (UI has a bug with the policy builder):
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

### Migration 006 — Meal Planning
```sql
meal_plans (id, user_id, household_id, week_start DATE, created_at)
  UNIQUE(user_id, week_start)

meal_plan_entries (id, meal_plan_id FK, day_of_week SMALLINT 0-6, recipe_import_id FK,
                   servings, meal_type TEXT, custom_dish_name TEXT, created_at)
  UNIQUE(meal_plan_id, day_of_week, meal_type)
-- RLS on both: USING (true) WITH CHECK (true)
```

### Migration 007 — Package/Container Tracking
```sql
ALTER TABLE pantry_items
  ADD COLUMN IF NOT EXISTS package_size NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS package_unit TEXT;
```

### Migration 008 — User Preferences
```sql
user_preferences (id, user_id UUID UNIQUE, household_id UUID,
                  dietary_restrictions TEXT[] DEFAULT '{}',
                  disliked_ingredients TEXT[] DEFAULT '{}',
                  cuisine_preferences TEXT[] DEFAULT '{}',
                  household_size INT DEFAULT 2,
                  weekly_cooking_time TEXT DEFAULT 'medium',
                  default_servings INT DEFAULT 2,
                  created_at TIMESTAMPTZ DEFAULT now(),
                  updated_at TIMESTAMPTZ DEFAULT now())
-- RLS: USING (true) WITH CHECK (true)
```

### Migration 010 — Suggestion Cache (Phase 7)
```sql
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS cached_suggestions    JSONB,
  ADD COLUMN IF NOT EXISTS last_suggestion_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pantry_snapshot_hash  TEXT;
```

### Migration 011 — Catalog Recipes (Phase 8)
```sql
catalog_recipes (id UUID PRIMARY KEY, title TEXT, description TEXT, image_url TEXT,
                 cuisines TEXT[] DEFAULT '{}', dietary_tags TEXT[] DEFAULT '{}',
                 recipe_json JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT now())
-- GIN indexes on cuisines + dietary_tags
-- RLS: FOR SELECT USING (true)
```
Seed: `app/backend/seeds/001_catalog_recipes.sql` — 25 curated recipes.

### Migration 009 — Cart Items (Phase 6)
```sql
cart_items (id UUID PRIMARY KEY, user_id UUID NOT NULL, household_id UUID,
            name TEXT NOT NULL, quantity NUMERIC, unit TEXT, checked_at TIMESTAMPTZ,
            source TEXT NOT NULL DEFAULT 'custom' CHECK (source IN ('custom', 'override')),
            week_start DATE, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())
-- Indexes: user_id, household_id, week_start
-- RLS: USING (true) WITH CHECK (true)
-- ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;
```

> ⚠️ All migrations run manually in Supabase SQL Editor — NOT auto-applied.
> After each: `NOTIFY pgrst, 'reload schema';`

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
| `/meals/preferences` | Auth | Dietary preferences form |
| `/meals/share` | System | PWA Web Share Target fallback |
| `/auth/callback` | System | Supabase magic link callback |

### API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/goals` | GET/POST | Goals CRUD |
| `/api/daily-logs` | GET/POST | Daily log CRUD |
| `/api/households` | POST | Create household |
| `/api/households/join` | POST | Join via invite code |
| `/api/pantry` | GET | Fetch all pantry items (household-scoped) |
| `/api/pantry` | POST | Add pantry item |
| `/api/pantry/[id]` | PATCH | Update pantry item fields |
| `/api/pantry/[id]` | DELETE | Delete pantry item (ownership verified) |
| `/api/pantry/mark-bought` | POST | Mark item bought → upsert pantry |
| `/api/meal-plan` | GET | Fetch week plan + entries `?weekStart=YYYY-MM-DD` |
| `/api/meal-plan` | POST | Add meal plan entry |
| `/api/meal-plan/[id]` | DELETE | Remove a meal plan entry |
| `/api/shopping-list` | GET | Compute shopping list `?weekStart=YYYY-MM-DD` — unit-normalized, pantry-subtracted, meal-attributed, store-section-grouped |
| `/api/recipe-import/from-url` | GET | JSON-LD + LLM recipe extract |
| `/api/recipe-import/from-image` | POST | Claude vision OCR |
| `/api/recipe-import/confirm` | POST | Save recipe_imports row |
| `/api/meal-log/analyze-photo` | POST | Claude vision + Fuse.js match |
| `/api/meal-log/search-dish` | GET | Spoonacular autocomplete |
| `/api/meal-log/dish-ingredients` | GET | Spoonacular recipe + pantry match |
| `/api/meal-log/confirm` | POST | Write DB, decrement pantry |
| `/api/preferences` | GET/PUT | User dietary preferences |
| `/api/meal-suggestions` | GET | Expiry-aware + Claude AI ranked suggestions |
| `/api/meal-history` | GET | Unified meal history (photos + imports) |
| `/api/cart` | GET/POST | Fetch / add custom cart items |
| `/api/cart/[id]` | PATCH/DELETE | Edit, check-off, or remove a cart item |
| `/api/cart/instacart` | GET | Build Instacart share link (clipboard fallback) |
| `/api/catalog-recipes` | GET | Catalog browse: `?cuisine=` `?dietary=`, pantry-scored, sorted by match % |
| `/api/catalog-recipes/[id]` | POST | Add catalog recipe to plan: dedup recipe_imports, upsert plan, return missing ingredients |
| `/api/recipe-import/history` | GET | Confirmed recipe imports for current user (fixes RecipePicker) |

---

## 5. UI Components

### Core app components (`src/components/ui/`)

| Component | Description |
|-----------|-------------|
| `LifeScoreHero` | 4 rings (0–100% per category), stats grid, 7-week bar chart |
| `WeeklyTracker` | Daily checkbox grid per goal. Workout detail panel (intensity 1–7, distance) |
| `GoalSetter` | Toggle + stepper UI for configuring weekly goals |
| `HomeBreakdown` | Per-category progress bars on home page |
| `BoardClient` | Interactive household leaderboard with expandable per-category breakdown |
| `InvitePanel` | Phone number input → opens native SMS app with invite link |
| `Podium` | Compact leaderboard list (used on home page) |
| `Sidebar` | Desktop fixed sidebar (hidden on mobile) |
| `BottomNav` | Mobile bottom tab bar (hidden on desktop) |

### Layout
- Mobile: bottom nav, single column
- Desktop (md+): fixed 224px sidebar, 2-column grid on home page

---

## 6. Meals Feature File Map

```
src/
  lib/meals/
    types.ts              ← all shared TS types (ShoppingItem, MealSuggestion, RecipeJSON, ...)
    matchPantry.ts        ← Fuse.js matching utility (threshold 0.4, alias expansion)
    storeSection.ts       ← maps ingredient names → 9 store sections (Produce, Meat, Dairy, ...)
    normalizeUnits.ts     ← unit normalization (volume→ml, weight→g, friendly display)

  app/
    (app)/meals/
      page.tsx            ← server: auth guard + household lookup
      preferences/page.tsx ← server: auth guard + fallback defaults
      share/route.ts      ← PWA Web Share Target fallback
    api/
      recipe-import/from-url/route.ts    ← JSON-LD → LLM fallback
      recipe-import/from-image/route.ts  ← Claude vision OCR
      recipe-import/confirm/route.ts     ← save recipe_imports
      meal-log/analyze-photo/route.ts    ← vision + parallel pantry + Fuse.js
      meal-log/search-dish/route.ts      ← Spoonacular autocomplete
      meal-log/dish-ingredients/route.ts ← Spoonacular info + Fuse.js
      meal-log/confirm/route.ts          ← DB writes + pantry decrement
      shopping-list/route.ts             ← unit-normalize + pantry subtract + section group
      meal-plan/route.ts                 ← GET/POST week plan
      meal-plan/[id]/route.ts            ← DELETE entry
      pantry/route.ts                    ← GET/POST pantry items
      pantry/[id]/route.ts               ← PATCH/DELETE pantry items
      pantry/mark-bought/route.ts        ← upsert pantry on buy
      preferences/route.ts               ← GET/PUT user preferences
      meal-suggestions/route.ts          ← Spoonacular + Claude scoring + caching
      cart/route.ts                      ← GET/POST cart items
      cart/[id]/route.ts                 ← PATCH/DELETE cart items
      cart/instacart/route.ts            ← Instacart Connect link or clipboard

  components/meals/
    MealsClient.tsx          ← tab state via URL params
    MealsTabs.tsx            ← 4-tab pill bar
    SuggestionsTab.tsx       ← AI suggestions + catalog browser (Phase 8 complete)
    LogMealTab.tsx           ← full (photo/search → confirm → save)
    ImportRecipeTab.tsx      ← full (URL/screenshot/share → preview → save)
    HistoryTab.tsx           ← ⚠️ STUB → Phase 9 (next)
    MealPlanTab.tsx          ← 7-day grid, RecipePicker modal, ShoppingList inline
    PantryTab.tsx            ← pantry CRUD, low-stock + expiry banners
    MealPhotoCapture.tsx     ← camera + gallery, preview thumbnail
    DishSearch.tsx           ← debounced Spoonacular autocomplete
    ServingsScaler.tsx       ← +/− stepper, rescales deductions
    IngredientConfirmation.tsx ← toggle + qty editor, color-coded confidence
    RecipeUrlInput.tsx       ← URL paste + validation
    RecipeScreenshotUpload.tsx ← drag-drop + file picker
    ShareLanding.tsx         ← reads from SW Cache API
    RecipePreview.tsx        ← editable display, confirm/back
    RecipePicker.tsx         ← modal to pick saved recipe for meal plan
    MealPlanDay.tsx          ← single day card in 7-day grid
    ShoppingList.tsx         ← store-section grouped, cart items, undo toast, Instacart
    CatalogBrowser.tsx       ← cuisine/dietary filter chips + recipe grid (Phase 8)
    CatalogRecipeCard.tsx    ← recipe card with pantry match bar (Phase 8)
    AddToPlanDrawer.tsx      ← bottom-sheet: day/meal/servings picker (Phase 8)
    MissingIngredientsDrawer.tsx ← bottom-sheet: missing items → cart (Phase 8)
    AddPantryForm.tsx        ← inline add form for PantryTab
    PantryItemCard.tsx       ← pantry item display + edit + delete
    PreferencesForm.tsx      ← dietary chips, cuisine chips, household stepper, cooking time radio

public/
  manifest.json  ← PWA share_target config
  sw.js          ← intercepts POST /meals/share, caches file, redirects
```

---

## 7. Session Log

### Session 17 — Phase 12: Shopping list color coding + receipt scanner (2026-05-13)

Built visual improvements to the shopping list and meal planner, plus a new receipt-scanning feature.

**Commit:** `248c23c` — 4 files, 514 insertions

**ShoppingList.tsx:**
- Each store-section group now shows color-coded sub-headers: "This week's meals" (green), "Running low" (amber), "Added by you" (blue)
- Items have a matching 4px left-border accent stripe in the same color
- `getPurchaseSuggestion()` looks up 35 common ingredients in a STORE_UNITS table and returns a hint like "Buy 1 dozen · uses 6 of 12" to help users grab the right package size
- `buildSections()` deduplicates: custom items and low-stock items are hidden from their sub-sections if a meal-plan item already covers the same ingredient name (normalized match)
- Added "Scan" button in list header that opens ReceiptScanner drawer

**MealPlanDay.tsx:**
- `MEAL_COLORS` lookup: breakfast=amber, lunch=blue, dinner=green, snack=purple
- Each filled tile uses the meal-type bg/border/dot color; meal type label shown next to colored dot

**ReceiptScanner.tsx (new):**
- Bottom-sheet drawer with state machine: idle → loading → review → removing → done | error
- User takes/selects a photo; `POST /api/cart/receipt` runs Claude vision to extract item names
- Review screen shows matched cart items with checkboxes; user can uncheck false positives
- Confirmed items are batch-deleted from cart

**api/cart/receipt/route.ts (new):**
- Auth-gated POST; validates file type (JPEG/PNG/WebP/GIF) and size (max 10 MB)
- Fetches unchecked cart items scoped to household or user
- Calls `claude-sonnet-4-6` vision with 15s timeout to extract receipt item names as JSON array
- Fuzzy-matches receipt names against cart items (normalize → stem → substring)

**No new SQL migrations.** No new env vars required.

---

### Sessions 1–4 — Core app (pre-2026-04-22)
Auth, goals, daily logs, leaderboard, workout tracking, invite system, Vercel deployment.

**Session 1:** Rebuilt UI — rings, stats grid, leaderboard, breakdown cards. Created `postcss.config.js` + `next.config.js`. Fixed SWC JSX parser bug. Responsive layout (mobile bottom nav + desktop sidebar).

**Session 2:** Created `user_goals` + `daily_logs` tables (migration 003). Goals page, Track page. Week system Sat→Fri. Optimistic checkbox UI. API routes `/api/goals`, `/api/daily-logs`.

**Session 3:** Added `workout_intensity` + `workout_distance` (migration 004). `WeeklyTracker` workout detail panel. `/board` page with ranked leaderboard + expandable per-category scores.

**Session 4 (2026-04-21):** Fixed `useTransition` + async bug (→ `useState`). Built invite system: `InvitePanel`, SMS URI, Web Share API, `/profile` page, `?invite=` param in onboarding, `?next=` param through magic link. Updated Home page to use `daily_logs`/`user_goals` (0–100% scores). Deployed to Vercel; fixed TS build + CSS errors; configured Supabase Auth.

---

### Session 5 — Smart Grocery & Pantry App Research (2026-04-21)

Conducted deep 3-workstream research for the Smart Grocery & Pantry Management feature concept.

**API Integration findings:**
- Amazon Fresh / Whole Foods: **no public API** — scraping violates TOS
- **Primary:** Instacart Developer Platform (IDP) — link-based order flow; apply at instacart.com/company/business/developers; sandbox at `connect.dev.instacart.tools`
- **Secondary:** Kroger Cart API (`developer.kroger.com`) — OAuth2 PKCE, direct `PUT /v1/cart/add`, sandbox available
- Architecture: Vercel Cron generates list → calls IDP server-side → stores link in DB → user reviews → opens Instacart to checkout

**Pantry algorithm findings:**
- Consumption tracking: rolling 30-day average (MVP) → LSTM per-category model (Phase 2, min 10 events)
- Reorder triggers: below threshold, predicted runout within 7 days, expiring within 3 days
- Shelf life: bundled USDA JSON + Open Food Facts lookup
- Cron schedule: `0 8 * * *` daily reorder check; `0 7 * * *` expiration alerts

**UX design findings:**
- PWA (responsive, mobile-first) — single Next.js codebase, no native app for MVP
- Competitive gaps: AnyList (no auto-reorder), Pantry Check (overwhelming onboarding), Instacart (no pantry tracking)
- Notification design: 1 digest/day max, delay push permission until 3+ items logged
- Key open risks: iOS Safari lacks native BarcodeDetector (use `@zxing/browser`), OFF data quality gaps

---

### Session 6 — Meal Intelligence Layer Research (2026-04-21)

**Meal Photo Recognition:**
- Recommended: Claude Sonnet 4.6 vision (~$0.007/photo)
- NEVER auto-deduct — always require user confirmation step
- Pantry deduction uses Fuse.js fuzzy matching (threshold 0.4); upgrades to pgvector in Phase 2
- `isEstimated: true` items weighted at 0.6x in reorder rolling average

**AI Meal Suggestions:**
- Primary recipe data: Spoonacular API (`/recipes/findByIngredients`) — $29/mo plan, 365K+ recipes
- Scoring formula: pantryMatch (45%) + expiryUrgency (35%) + preferenceMatch (20%)
- LLM enrichment: Claude Sonnet 4.6 for suggestion ranking and `whyNow` text
- Preference learning: nightly inference job (dish/ingredient frequency from ConsumptionLog)

**Social Recipe Import:**
- Instagram Basic Display API: **DEAD** (shutdown late 2024). Do NOT build around Instagram API.
- MVP Path A: URL paste/share → JSON-LD extraction (zero LLM cost, 631 sites) → LLM fallback
- MVP Path B: Screenshot upload → Claude vision OCR → recipe parse
- Ingredient lists are not copyrightable (US law); recipe steps are — extract ingredients only

**Cost at 10K DAU:** ~$130/day / ~$4K/month

---

### Session 7 — Meals Feature Technical Spec (2026-04-21)

**Web Share Target API:**
- Full support: Android Chrome. **No support: iOS Safari** (WebKit bug open since 2019, no ETA)
- manifest.json `share_target` config: POST + multipart/form-data, accepts image/*, url, text, title
- Service worker intercept: SW catches POST to `/meals/share`, stores file in Cache API, redirects to `/meals?tab=import&shareId=...`
- iOS fallback: URL paste input + file picker (no install required)

**`/meals` page architecture decided:**
- Replace "Goals" in bottom nav with "Meals" (center slot). Goals stays in sidebar + Profile page link for mobile.
- 4-tab structure: Suggestions (default) | Log Meal | Import Recipe | History
- Tab state in URL params — enables share target deep links (`?tab=import&shareId=...`)
- All 4 tabs fully wireframed

---

### Session 8 — Meals Feature: Full Build + Store Section Grouping (2026-04-22)

Full meals feature stack built. All code lives in `claude/jolly-euclid` worktree.

- Fixed `recipe_imports.recipe_json` column name mismatch (migration 005b)
- Fixed `DROP POLICY IF EXISTS` pattern in migration 005
- Built full pantry CRUD: `GET/POST /api/pantry`, `PATCH/DELETE /api/pantry/[id]`
- Built mark-as-bought API (`POST /api/pantry/mark-bought`) with Fuse.js fuzzy match
- Built unit normalization library (`src/lib/meals/normalizeUnits.ts`) — volume→ml, weight→g
- Built meal planning API (`GET/POST /api/meal-plan`, `DELETE /api/meal-plan/[id]`)
- Built shopping list API with unit normalization + meal attribution + pantry subtraction
- Built meal suggestions API using expiry urgency scoring + Claude Sonnet 4.6 reasoning
- Rewrote SuggestionsTab with real data (expiry badges, suggestion cards, low-stock list)
- Built MealPlanTab (7-day grid, RecipePicker modal, shopping list inline)
- Built PantryTab with low-stock + expiry alert banners, AddPantryForm, PantryItemCard
- Added package/container tracking fields (`package_size`, `package_unit`) across all layers
- **Shopping list grouped by 9 store sections** (`src/lib/meals/storeSection.ts`)
- Copy-list button produces section-headered text

**Commits:** `9643510` (Phase 1), `be39eb8` (Phase 2), `af19ee3` (Phase 3), `6744579` (Phase 4)

---

### Session 9 — User Preferences + Preference Integration (2026-04-22)

- Migration 008 SQL: `user_preferences` table (dietary_restrictions TEXT[], disliked_ingredients TEXT[], cuisine_preferences TEXT[], household_size INT, weekly_cooking_time TEXT, default_servings INT)
- `src/lib/meals/preferences.ts` — TypeScript types + DIETARY_OPTIONS/CUISINE_OPTIONS arrays
- `src/app/api/preferences/route.ts` — GET (returns defaults if no DB row) + PUT (validates all fields, upserts)
- `src/app/(app)/meals/preferences/page.tsx` — server component auth guard + fallback defaults
- `src/components/meals/PreferencesForm.tsx` — 5-section form (dietary chips, cuisine chips, household stepper, cooking time radio, disliked ingredient tag input); mountedRef-guarded auto-save
- Wired preferences into `GET /api/meal-suggestions`: filters recipes containing disliked ingredients, injects dietary + cuisine preferences into Claude prompt; sanitizes free-text before LLM injection
- Fixed Claude model in meal-suggestions: `claude-haiku-4-5-20251001` → `claude-sonnet-4-6`
- Added preferences gear icon link to MealsClient header
- Peer review: all 3 critical + 5 warning issues resolved. TypeScript: 0 errors.

**User still needs to run in Supabase SQL Editor:**
- Migration 008: `user_preferences` table (`app/backend/migrations/008_user_preferences.sql`)
- Also 006 + 007 if not yet run
- After each: `NOTIFY pgrst, 'reload schema';`

---

### Session 14 — Phase 9: Cart multi-select, Pantry photos, HistoryTab, Smarter photo log (2026-04-30)

Completed all 4 Phase 9 priorities plus fixed the Instagram import bug. Session also captured a large new product backlog (Instagram recipe flow, community recipe repository, expiry-driven suggestions, weekly meal plan automation, Switch Up pivot, Auto Instructions, AI dish images).

**Commits:** 6 feature commits + 1 bug fix + 1 ARCHITECTURE.md to main

**P1 — Cart multi-select (`ShoppingList.tsx`):**
- Replaced single-item confirm modal with checkbox multi-select flow
- Selected items show filled green checkbox; sticky "N items selected · Done" bar appears
- Done → batch-edit drawer with qty+unit input per item, all pre-filled
- "Save all" fires `Promise.all` to `/api/pantry/mark-bought` simultaneously
- Optimistic UI: items disappear immediately, revert on error
- Partial failure: reverts failed items, shows only failures in drawer for retry, clears succeeded keys from selection
- Peer review: stale closure snapshot fix (C1), partial failure key cleanup (C2), instacart `res.ok` check (C3), UUID validation in Realtime filter (W1), `finally` for `batchSaving` (W2), instacartMsg timer ref (W3), inputs disabled during save (W4), stale-key cleanup in handleOpenBatch (W5)

**P2 — Pantry photos:**
- Migration 012: `ALTER TABLE pantry_items ADD COLUMN IF NOT EXISTS image_url TEXT`
- `PantryItemCard.tsx`: 40×40 thumbnail (left of card) + camera button overlay
  - Tap camera → file picker (mobile: opens camera via `capture="environment"`)
  - Upload to Supabase Storage `pantry-photos/{userId}/{itemId}.ext`, upsert
  - Cache-bust URL with `?t=timestamp`; PATCH `/api/pantry/[id]` to persist URL
  - Uploading spinner + inline error
- `PATCH /api/pantry/[id]`: `image_url` added to allowed fields
- `GET/POST /api/pantry`: `image_url` included in select

**P3 — HistoryTab:**
- `GET /api/meal-history`: parallel fetch of `meal_photos` + confirmed `recipe_imports`, merged + sorted by date DESC, returns `HistoryItem[]`
- `HistoryTab.tsx`: date-grouped timeline (Today / Yesterday / MMM D)
- Each card: thumbnail if `imageUrl` else type icon (blue for logged meal, green for recipe), title, time-ago, ingredient count badge
- Tap to expand ingredient list inline
- Loading, error, and empty states

**P4 — Smarter photo log (`analyze-photo/route.ts`):**
- Phase 1 (parallel): storage upload + pantry fetch (top 30 by quantity) + meal plan fetch
- Injects context into Claude prompt: pantry contents string + week's planned meals list
- Post-processing: if `dishConfidence >= 0.75` and dish name matches a planned meal title → replace Claude's estimated ingredients with recipe's exact `recipe_json.ingredients`

**Bug fix:** Instagram URL import now returns clear error message directing user to Screenshot tab.

**User actions required:**
1. Run `app/backend/migrations/012_pantry_photos.sql` in Supabase SQL Editor
2. Create `pantry-photos` bucket in Supabase Dashboard: Storage → New bucket → Name: `pantry-photos`, Public: true
3. Run this SQL to add RLS policy:
   ```sql
   CREATE POLICY "pantry photos open" ON storage.objects
   FOR ALL USING (bucket_id = 'pantry-photos') WITH CHECK (bucket_id = 'pantry-photos');
   ```
4. `npm run dev` and test: cart multi-select in Plan tab, camera button on pantry items, History tab, photo log with a meal that matches this week's plan

---

### Session 13 — Phase 8: Recipe Catalog (2026-04-28)

Built the complete recipe catalog feature on top of the existing suggestions tab.

**Commit:** `ca5b41a` — 10 files, 1804 insertions

**Backend:**
- Migration 011: `catalog_recipes` table with `cuisines TEXT[]`, `dietary_tags TEXT[]`, `recipe_json JSONB`, GIN indexes on both array columns, RLS select-all policy
- Seed: 25 INSERT statements (`app/backend/seeds/001_catalog_recipes.sql`) — 6 cuisines (italian, asian, mexican, mediterranean, american, breakfast), 4 dietary tags (vegetarian, vegan, gluten_free, dairy_free), realistic 5-8 ingredients + 3-5 steps each
- `GET /api/catalog-recipes` — auth, cuisine/dietary filter via `.contains()`, household-scoped pantry fetch, Fuse.js match per recipe → `pantryMatchPct` + `missingCount`, sorted by match % descending
- `POST /api/catalog-recipes/[id]` — auth, UUID/date/mealType/servings validation, dedup `recipe_imports` by `source_url = 'catalog:id'`, upsert `meal_plans` + `meal_plan_entries`, scaled missing ingredient computation
- `GET /api/recipe-import/history` — new file, fixes silent breakage in RecipePicker

**Frontend:**
- `CatalogRecipeCard` — title, cook time/servings badges, dietary tag pills (green=veg/vegan, blue=gluten_free), pantry match progress bar (green/amber/red), Add to Plan button
- `CatalogBrowser` — cuisine + dietary single-select filter chips (disabled during load), `useEffect` with cancellation flag, 1–2 col grid, loading/error/empty states
- `AddToPlanDrawer` — bottom-sheet, day picker (Sat–Fri), meal type (Breakfast/Lunch/Dinner/Snack), servings stepper, state resets on recipe change (W1 fix)
- `MissingIngredientsDrawer` — bottom-sheet, fan-out POST to `/api/cart`, auto-close 400ms after done, skip link
- `SuggestionsTab` — catalog section below AI picks, `useMemo` weekStart (W3 fix), `r.ok` check on suggestions fetch (W2 fix), noPantry state no longer blocks catalog

**Peer review fixes applied:** input validation (C2), drawer state reset (W1), r.ok check (W2), weekStart useMemo (W3), servings range guard (W4), chips disabled during load (W5).

**User actions required:**
1. Run `011_catalog_recipes.sql` in Supabase SQL Editor
2. Run `seeds/001_catalog_recipes.sql`
3. After each: `NOTIFY pgrst, 'reload schema';`

---

### Session 11 — Peer review fixes + PROGRESS.md merge (2026-04-28)

Applied all outstanding peer-review fixes to `ShoppingList.tsx`:
- **W2** — wired `userId`/`householdId` props into the Supabase Realtime channel filter (`household_id=eq.X` or `user_id=eq.X`) so household members only receive relevant change events
- **W1** — added `mountedRef.current` guards to `handleConfirmBuy`: after `await fetch`, in the `catch` block, and in `finally` (now uses `if (mountedRef.current) setSaving(false)`)
- **W3** — `handleCheckCustom` and `handleDeleteCustom` now check `res.ok` before calling `fetchCustomItems()`
- **m2** — changed qty input `min="0"` → `min="0.001"` to match server validation

`tsc --noEmit`: 0 errors. All Phase 6 commits pushed to `claude/jolly-euclid`.

Also merged PROGRESS.md: added full Index, UI Components section, Sessions 5–9 research archives, complete API route table (25 routes), expanded backlog with detailed checklists. Pushed as commit `f7bb907`.

**Identified gap (not yet fixed):** `MealPlanTab.tsx` receives `userId`/`householdId` as `_userId`/`_householdId` (unused) and does not forward them to `<ShoppingList>`. This means the Realtime subscription filter is `undefined` and household sync won't filter correctly. Fix is 2 lines — scheduled for Day 1 (2026-04-29).

---

### Session 10 — Shopping Cart Phase 6 (2026-04-27)

**Phase 6** (`87f57f7` + `1463b7c`): Persistent shopping cart with real-time household sync.

- Migration 009: `cart_items` table with RLS + Supabase Realtime publication
- `GET/POST /api/cart` — custom cart items, household-scoped, weekStart-validated
- `PATCH/DELETE /api/cart/[id]` — edit name/qty/unit, check-off (checked_at), delete
- `GET /api/cart/instacart` — Instacart Connect share link; clipboard fallback if no key
- `ShoppingList.tsx` full rewrite: add-item form (name + qty + unit), per-section custom items (indigo border), Supabase Realtime subscription filtered by household_id or user_id, 5s undo toast after check-off, collapsible "In your cart ✓" zone, Instacart + copy-list header buttons, mountedRef guards on all post-await setState, res.ok checks in check/delete handlers
- `MealPlanTab.tsx` updated to pass `weekStart` prop
- All peer-review critical + warning fixes applied; `tsc --noEmit` clean

**User must run in Supabase SQL Editor:**
- Migration 009: `app/backend/migrations/009_cart_items.sql`
- After: `NOTIFY pgrst, 'reload schema';`

---

## 8. Known Issues & Fixes

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
| PostgREST filter injection | Raw query param in `.or()` filter | Validate with WEEK_START_RE regex first |

---

## 9. Deployment

- **Live URL:** https://function-four.vercel.app
- **Root directory:** `app/frontend`
- **Auto-deploy:** push to `main`
- **Required Vercel env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`, `SPOONACULAR_API_KEY`
- **Supabase Auth:** Site URL + Redirect URL = `https://function-four.vercel.app(/auth/callback)`

**To deploy meals feature:**
```bash
git checkout main && git merge claude/jolly-euclid && git push
```
Then add `ANTHROPIC_API_KEY` + `SPOONACULAR_API_KEY` to Vercel environment variables if not already set.

---

## 10. Backlog & Future Ideas

### Core app
- [ ] Push notifications when roommate logs a workout
- [ ] Weekly summary email (Sunday recap)
- [ ] Streak freeze / grace day feature
- [ ] Historical weekly view — browse past weeks in Track tab
- [ ] Goal suggestions based on category performance
- [ ] Dark mode
- [ ] Custom goal creation (beyond 10 preset options)
- [ ] Upgrade Next.js from 14.2.0 (flagged security advisory)

### Meals feature — next phases
- [x] Suggestions tab — AI picks + catalog browse (Phase 8 complete)
- [x] Recipe catalog — 25 curated recipes, pantry-scored, add to plan (Phase 8 complete)
- [x] Claude API caching — 6h suggestion cache keyed on pantry hash (Phase 7 complete)
- [ ] History tab — `GET /api/meal-history` + `HistoryTab.tsx` (Phase 9, next)
- [ ] Cart multi-select UX — batch qty + optimistic UI (Phase 9, next)
- [ ] Pantry photos — `image_url TEXT`, camera upload, thumbnail card (Phase 9, next)
- [ ] Smarter photo log — pass pantry + meal plan context to Claude analyze-photo (Phase 9)
- [ ] LogMealTab pre-fill from Suggestions (`?dishId=` param wiring)
- [ ] Barcode scan for pantry items (`@zxing/browser` + Open Food Facts)
- [ ] Receipt OCR import (Mindee API) → auto-add to pantry
- [ ] Apply for Instacart IDP key (instacart.com/company/business/developers)
- [ ] TikTok recipe import via Supadata transcript API → Claude recipe parse
- [ ] Nightly preference inference job (dish/ingredient frequency from consumption logs)
- [ ] Store layout customization — let user assign items to their store's specific aisles
- [ ] pgvector upgrade for semantic pantry matching (Phase 2, after Fuse.js proves insufficient)
- [ ] Multi-store category customization (AnyList-style per-store aisle sets)
- [ ] Price tracking / running cart total in ShoppingList
- [ ] Presence indicators in ShoppingList ("partner is shopping now")
- [ ] Merge `claude/jolly-euclid` → `main` + Vercel deployment when stable

### Product features — user-requested (2026-04-30)

**Instagram Recipe Insertion**
User sees an Instagram story/reel with a recipe → sends screenshot or link to the app.
- Screenshot path: already works (OCR via ImportRecipeTab). **Note: Instagram Basic Display API is dead (late 2024). No programmatic access to Instagram content.** For stories/reels, user must screenshot → upload image.
- Enhancement needed: after import, suggest which week it fits into (this week vs next) based on pantry match, expiry items, and grocery shop day preference. Prompt user to add to meal plan immediately after import.
- If added to this week: show day recommendations + list missing ingredients → offer to add to mid-week cart
- If added to next week: add to next week's plan + Sunday grocery list
- Known bug (2026-04-30): URL-based recipe import failed for Instagram URL (blocked by Instagram scraper protection). Fix: detect instagram.com URLs and redirect user to screenshot path with a helpful message.

**Top Recipes / Community Repository**
- All confirmed recipe_imports go into a shared `catalog_recipes`-style table (or extend existing), tagged as user-contributed vs platform-curated
- Popularity tracked via `meal_plan_entries` count + `consumption_logs` count
- Leaderboard by popularity: filter by "My recipes" / "Household" / "All users"
- Foundation for social recipe discovery within user communities
- Requires: community privacy model (do users consent to sharing recipes?)

**Smarter Expiry-Driven Recipe Suggestions**
- Already partially in `meal-suggestions` route (expiry items flagged)
- Enhancement: if user hasn't logged a planned meal by end of day, app prompts "Did you make [meal]?" 
  - Yes → confirm as logged; No → suggest replacing/rescheduling
  - Auto-adjust following weeks if item is skipped repeatedly
- Limit suggestion frequency: don't nag more than once/day per missed meal
- Goal: reduce manual plan maintenance

**Meal Plan Weekly Suggestions**
- Full auto-generated weekly plan based on: food preferences, workout schedule, pantry items, near-expiry items, past consumption patterns, and imported-but-not-cooked recipes
- Sunday (or user's chosen grocery day) triggers: finalize next week's plan → generate shopping cart
- Distinguish user-uploaded recipes vs platform catalog in suggestions (prefer user's own imports)
- Factor in Instagram Recipe Insertions as candidates for the week

**Switch Up / Pivot Feature**
- "I don't feel like [planned meal] tonight" → suggest alternatives:
  1. First: another already-planned meal from later in the week (no new ingredients needed)
  2. Second: new recipe from catalog/imports based on current pantry
- If switch alters rest-of-week ingredient availability: show quick inline impact summary ("Switching changes Tuesday's Stir Fry — you'll be short on chicken")
- Frictionless: 2 taps max to swap a meal

**Auto Instructions**
- For recipes in `recipe_imports` where `recipe_json.steps` is empty or only 1 step:
  - Call Claude to generate step-by-step cooking instructions from the ingredient list + title
  - Cache in `recipe_json.steps` — only generate once
  - Show "AI-generated instructions" badge on the recipe

**AI-Generated Dish Images**
- For catalog recipes without an `image_url`: call an image generation API to create a plated dish photo
- Cache the URL in `catalog_recipes.image_url` (migration needed: `ALTER TABLE catalog_recipes ADD COLUMN image_url TEXT`)
- Show thumbnail in `CatalogRecipeCard` and `HistoryTab`

### Smart pantry app (future standalone concept)
- [ ] Apply for Instacart Developer Platform API key
- [ ] Register app at developer.kroger.com (sandbox available immediately)
- [ ] Build barcode scan flow (`@zxing/browser` + Open Food Facts)
- [ ] Build receipt OCR flow (Mindee API)
- [ ] Build Instacart IDP link-generation server action
- [ ] Set up Vercel Cron jobs for daily reorder + expiration checks
- [ ] Configure Web Push (VAPID) notifications