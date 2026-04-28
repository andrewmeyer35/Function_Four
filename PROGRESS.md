# Four Fs — Project Progress Log

Live URL: https://function-four.vercel.app
Repo: https://github.com/andrewmeyer35/Function_Four
Supabase: project configured with RLS policies
Last updated: 2026-04-28
Working branch: `claude/jolly-euclid` (git worktree at `C:\Users\andre\Function_4\.claude\worktrees\jolly-euclid`)

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

## ⚡ PHASE 6 COMPLETE — START HERE NEXT SESSION

### What was built: Shopping cart feature (Phase 6)

**Commits:** `87f57f7` (cart feature) + `1463b7c` (migration 009)

**Files added/modified:**
- `app/backend/migrations/009_cart_items.sql` — run in Supabase SQL Editor before testing
- `app/frontend/src/app/api/cart/route.ts` — GET/POST custom cart items
- `app/frontend/src/app/api/cart/[id]/route.ts` — PATCH/DELETE individual items
- `app/frontend/src/app/api/cart/instacart/route.ts` — Instacart Connect link or clipboard fallback
- `app/frontend/src/components/meals/ShoppingList.tsx` — full rewrite with cart UX
- `app/frontend/src/components/meals/MealPlanTab.tsx` — passes weekStart to ShoppingList

**User must run in Supabase SQL Editor before testing:**
```sql
-- from app/backend/migrations/009_cart_items.sql
CREATE TABLE IF NOT EXISTS cart_items (...);
ALTER PUBLICATION supabase_realtime ADD TABLE cart_items;
NOTIFY pgrst, 'reload schema';
```

### What to build next: Suggestions tab + History tab

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
    SuggestionsTab.tsx       ← ⚠️ STUB → Phase 7
    LogMealTab.tsx           ← full (photo/search → confirm → save)
    ImportRecipeTab.tsx      ← full (URL/screenshot/share → preview → save)
    HistoryTab.tsx           ← ⚠️ STUB → Phase 7
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
    AddPantryForm.tsx        ← inline add form for PantryTab
    PantryItemCard.tsx       ← pantry item display + edit + delete
    PreferencesForm.tsx      ← dietary chips, cuisine chips, household stepper, cooking time radio

public/
  manifest.json  ← PWA share_target config
  sw.js          ← intercepts POST /meals/share, caches file, redirects
```

---

## 7. Session Log

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
- [ ] Suggestions tab (Phase 7A/7B above)
- [ ] History tab (Phase 7D above)
- [ ] LogMealTab pre-fill from Suggestions (Phase 7C above)
- [ ] Claude API caching: cache suggestions 6h if pantry unchanged (saves ~80–90% of Claude calls)
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

### Smart pantry app (future standalone concept)
- [ ] Apply for Instacart Developer Platform API key
- [ ] Register app at developer.kroger.com (sandbox available immediately)
- [ ] Build barcode scan flow (`@zxing/browser` + Open Food Facts)
- [ ] Build receipt OCR flow (Mindee API)
- [ ] Build Instacart IDP link-generation server action
- [ ] Set up Vercel Cron jobs for daily reorder + expiration checks
- [ ] Configure Web Push (VAPID) notifications