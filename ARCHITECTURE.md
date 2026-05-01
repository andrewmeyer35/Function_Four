# Four Fs — Repository Architecture

> **Purpose:** Team reference for how the codebase is structured, what every component does, and how data flows end-to-end.
> Last updated: 2026-04-28

---

## What this app is

**Four Fs** is a household accountability web app for tracking four life pillars: Financial, Fitness, Fun, and Flirt/Ferveur. Users set weekly goals, log daily progress, compete on a household leaderboard, and manage their home cooking with a full meal-planning and pantry system.

Live: **https://function-four.vercel.app**

---

## 1. Git Topology

```
GitHub (origin)
  └─ main ──────────────────────────── auto-deploys to Vercel on every push
       └─ claude/jolly-euclid ─────── feature branch (meals v2, NOT yet deployed)

Local machine:
  C:\Users\andre\Function_4\                                        ← main working tree (branch: main)
  C:\Users\andre\Function_4\.claude\worktrees\jolly-euclid\        ← feature worktree (branch: claude/jolly-euclid)
```

**Rule:** All feature work goes in the worktree. The main directory is production — never commit half-finished work there.

The feature branch (`claude/jolly-euclid`) is currently **16 commits ahead of main** and contains the full meals v2 feature set (recipe catalog, user preferences, enhanced shopping cart, suggestion caching). It will be merged to main once HistoryTab is complete.

---

## 2. Top-Level Directory Structure

```
Function_4/
├── app/
│   ├── frontend/                Next.js 14.2 app — this is the Vercel deployment root
│   │   ├── src/
│   │   │   ├── app/             Next.js App Router pages + API routes
│   │   │   ├── components/      React components
│   │   │   └── lib/             Utility libraries (Supabase clients, scoring, meals logic)
│   │   ├── public/              Static assets (PWA manifest, service worker)
│   │   ├── package.json         Dependencies
│   │   └── tsconfig.json        Path aliases: @/* → src/, @shared/* → ../shared/
│   │
│   ├── backend/
│   │   └── migrations/          SQL files — run MANUALLY in Supabase SQL Editor (never auto-applied)
│   │       seeds/               Seed data SQL files
│   │
│   └── shared/                  Shared TypeScript types (referenced via @shared/*)
│
├── brainstorming/               Product docs, design notes, research
│   ├── design/
│   ├── product/
│   ├── research/
│   └── technical/
│
├── ARCHITECTURE.md              This file
├── PROGRESS.md                  Session-by-session progress log + START HERE block
└── CLAUDE.md                    Instructions for AI assistant (session protocols, code standards)
```

---

## 3. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js App Router | 14.2.0 |
| UI | React | 18.3 |
| Styling | Tailwind CSS | v3 |
| Database + Auth | Supabase (PostgreSQL + RLS + Realtime) | JS client v2.43 |
| AI (vision + LLM) | Anthropic Claude | claude-sonnet-4-6 |
| Recipe data | Spoonacular API | — |
| Fuzzy matching | Fuse.js | v7 |
| Hosting | Vercel | auto-deploy from main |
| Repo | GitHub | andrewmeyer35/Function_Four |

**Critical constraints:**
- Next.js 14.2 — NOT 15. Never use Next.js 15 APIs.
- No Prisma, no ORM — raw Supabase JS client only.
- No Shadcn, no Radix — raw Tailwind utility classes only.
- TypeScript strict mode — `npx tsc --noEmit` must pass before every commit.

---

## 4. Database Schema

> All tables have RLS enabled with `USING (true) WITH CHECK (true)`. User-scoping is enforced in application logic, not DB policies.
> All migrations run manually in Supabase SQL Editor. After each: `NOTIFY pgrst, 'reload schema';`

### Core 4Fs Tables (Migrations 001–004)

```
households
  id UUID PK, name TEXT, invite_code TEXT UNIQUE, created_at

household_members
  id, user_id FK → auth.users, household_id FK → households, role TEXT, joined_at
  UNIQUE(user_id, household_id)

checkins
  id, user_id, household_id, week_start DATE
  financial_score, fitness_score, fun_score, flirt_score  (0.0–1.0 each)
  *_tags TEXT[], *_text TEXT, created_at

user_goals
  id, user_id, category TEXT, metric_key TEXT, label TEXT, target NUMERIC, is_active BOOLEAN
  UNIQUE(user_id, metric_key)

daily_logs
  id, user_id, household_id, log_date DATE, week_start DATE
  saved_toward_goal, no_impulse_spend, meals_ate_in, worked_out, sleep_7plus,
  good_nutrition, had_social_activity, quality_connection, dating_activity, self_care  (all BOOLEAN)
  workout_intensity SMALLINT (1–7), workout_distance NUMERIC
  notes TEXT, created_at, updated_at
  UNIQUE(user_id, log_date)
```

### Meals Tables (Migrations 005–011)

```
pantry_items
  id, user_id, household_id
  name TEXT, aliases TEXT[], quantity NUMERIC(10,3), unit TEXT
  min_quantity NUMERIC, package_size NUMERIC, package_unit TEXT
  category TEXT, expiration_date DATE
  created_at, updated_at

recipe_imports
  id, user_id, household_id
  source_url TEXT, source_type TEXT   ← 'url_jsonld'|'url_llm'|'screenshot_ocr'|'catalog'
  source_image_url TEXT
  recipe_json JSONB                   ← RecipeJSON shape (see types.ts)
  extraction_confidence NUMERIC(4,3)
  pantry_deductions JSONB, cart_items JSONB
  status TEXT DEFAULT 'confirmed'
  confirmed_at TIMESTAMPTZ, created_at

meal_photos
  id, user_id, household_id
  image_url TEXT, dish_name TEXT, dish_confidence NUMERIC(4,3)
  cuisine TEXT, estimated_servings INT
  analysis_json JSONB                 ← MealPhotoAnalysis shape
  created_at

consumption_logs
  id, user_id, household_id
  pantry_item_id FK → pantry_items, ingredient_name TEXT
  quantity_consumed NUMERIC(10,3), unit TEXT
  source_type TEXT, confidence NUMERIC(4,3)
  created_at

meal_plans
  id, user_id, household_id, week_start DATE, created_at
  UNIQUE(user_id, week_start)

meal_plan_entries
  id, meal_plan_id FK → meal_plans
  day_of_week SMALLINT 0–6   ← 0=Sat, 1=Sun, 2=Mon … 6=Fri
  meal_type TEXT             ← 'Breakfast'|'Lunch'|'Dinner'|'Snack'
  recipe_import_id FK → recipe_imports
  servings INT, custom_dish_name TEXT, created_at
  UNIQUE(meal_plan_id, day_of_week, meal_type)

user_preferences
  id, user_id UUID UNIQUE, household_id
  dietary_restrictions TEXT[]    ← 'vegetarian'|'vegan'|'gluten_free'|'dairy_free'|...
  disliked_ingredients TEXT[]
  cuisine_preferences TEXT[]
  household_size INT DEFAULT 2
  weekly_cooking_time TEXT DEFAULT 'medium'
  default_servings INT DEFAULT 2
  cached_suggestions JSONB           ← 6-hour suggestion cache
  last_suggestion_at TIMESTAMPTZ
  pantry_snapshot_hash TEXT          ← pantry hash to detect staleness
  created_at, updated_at

cart_items
  id, user_id, household_id
  name TEXT, quantity NUMERIC, unit TEXT
  checked_at TIMESTAMPTZ             ← null = unchecked, set = checked off
  source TEXT DEFAULT 'custom'       ← 'custom'|'override'
  week_start DATE
  created_at, updated_at
  ── Supabase Realtime enabled on this table for live household sync

catalog_recipes                      ← worktree only, not yet in main
  id UUID PK, title TEXT, description TEXT, image_url TEXT
  cuisines TEXT[]                    ← 'italian'|'asian'|'mexican'|'mediterranean'|'american'|'breakfast'
  dietary_tags TEXT[]                ← 'vegetarian'|'vegan'|'gluten_free'|'dairy_free'
  recipe_json JSONB
  created_at
  ── GIN indexes on cuisines + dietary_tags for fast array filtering
```

---

## 5. API Routes

All routes require auth (`createClient()` + `getUser()` + 401 if no user) unless marked public.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| GET | `/auth/callback` | Supabase magic link OTP exchange → redirect to app |

### Households
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/households` | Create household, set creator as owner |
| POST | `/api/households/join` | Join via invite code |
| GET | `/api/households/[id]/feed` | Weekly activity feed for household members |

### Goals & Daily Tracking
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/goals` | Fetch active goals; upsert goal with target |
| GET/POST | `/api/daily-logs` | Fetch logs by week; upsert a single day's metrics |
| POST | `/api/checkins` | Upsert weekly 4F check-in (scores, tags, notes) |

### Pantry
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/pantry` | List pantry items (household-scoped); add item |
| PATCH/DELETE | `/api/pantry/[id]` | Update fields; delete item |
| POST | `/api/pantry/mark-bought` | Match shopping item → pantry; increment qty or create |

### Meal Logging
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/meal-log/analyze-photo` | Claude vision: photo → dish identification + ingredient extraction + Fuse.js pantry match |
| GET | `/api/meal-log/search-dish` | Spoonacular dish name autocomplete |
| GET | `/api/meal-log/dish-ingredients` | Spoonacular recipe details + Fuse.js pantry match |
| POST | `/api/meal-log/confirm` | Save meal_photos row; decrement pantry; insert consumption_logs |

### Recipe Import
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/recipe-import/from-url` | Fetch recipe page → JSON-LD extraction or Claude LLM fallback |
| POST | `/api/recipe-import/from-image` | Claude vision OCR → RecipeJSON |
| POST | `/api/recipe-import/confirm` | Save confirmed recipe_imports row |
| GET | `/api/recipe-import/history` | Return user's confirmed recipe imports |

### Meal Planning
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/meal-plan` | Fetch week entries; upsert single entry |
| DELETE | `/api/meal-plan/[id]` | Remove a meal plan entry |
| GET | `/api/shopping-list` | Aggregate plan ingredients → subtract pantry → group by store section |

### Shopping Cart
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/cart` | Fetch custom cart items; add/upsert item |
| PATCH/DELETE | `/api/cart/[id]` | Edit item; check off (sets checked_at); delete |
| GET | `/api/cart/instacart` | Build Instacart share link; clipboard fallback |

### Recipe Catalog *(feature branch only — not yet in main)*
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/catalog-recipes` | Browse 25 curated recipes; filter `?cuisine=` `?dietary=`; sorted by pantry match % |
| POST | `/api/catalog-recipes/[id]` | Add to plan: dedup recipe_imports, upsert plan entry, return missing ingredients |

### Suggestions & Preferences
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/meal-suggestions` | Expiry-aware suggestions + Claude AI ranking; 6h cache keyed on pantry hash |
| GET/PUT | `/api/preferences` | User dietary/cuisine preferences CRUD |

---

## 6. Pages

| Route | Server/Client | Auth | Description |
|-------|--------------|------|-------------|
| `/` | Server | No | Landing / redirect |
| `/login` | Server | No | Magic link email input |
| `/auth/callback` | Route | No | Supabase OTP exchange |
| `/onboarding` | Server | Yes | Create or join household |
| `/household` | Server | Yes | Home: hero rings, leaderboard, breakdown |
| `/log` | Server | Yes | Daily log entry form |
| `/goals` | Server | Yes | Goal setter (10 preset metrics) |
| `/board` | Server | Yes | Household leaderboard with per-F breakdown |
| `/profile` | Server | Yes | User info + household invite panel |
| `/checkin` | Server | Yes | Weekly 4F check-in wizard |
| `/meals` | Server | Yes | Meals hub — 6 tabs |
| `/meals/preferences` | Server | Yes | Dietary/cuisine preference form |
| `/meals/share` | Route | No | PWA Web Share Target fallback |

---

## 7. Meals Feature — Component Tree

The `/meals` page is the most complex part of the app. All state is driven by `?tab=` URL param.

```
/meals?tab=suggestions|log|import|plan|pantry|history
│
└─ MealsClient.tsx
     Owns tab switching via URL param.
     Passes userId + householdId to all tabs.
     │
     ├─ MealsTabs.tsx
     │    6-pill tab bar at top of page.
     │
     ├─ [tab=suggestions]  SuggestionsTab.tsx
     │    Fetches /api/meal-suggestions on mount.
     │    Shows: expiry alert pills → AI suggestion cards → low-stock pills → catalog browser.
     │    │
     │    ├─ CatalogBrowser.tsx  ← feature branch
     │    │    Cuisine filter chips (All/Italian/Asian/Mexican/Mediterranean/American/Breakfast)
     │    │    Dietary filter chips (All/Vegetarian/Vegan/Gluten-Free)
     │    │    Fetches /api/catalog-recipes on filter change. Cancels stale requests.
     │    │    Renders 1–2 column grid of cards.
     │    │    └─ CatalogRecipeCard.tsx  ← feature branch
     │    │         Title, cook time badge, servings badge.
     │    │         Dietary tag pills (green=veg/vegan, blue=gluten-free).
     │    │         Pantry match progress bar (green ≥60%, amber 30–59%, red <30%).
     │    │         "Add to Plan" button → calls onAddToPlan(recipe).
     │    │
     │    ├─ AddToPlanDrawer.tsx  ← feature branch
     │    │    Bottom-sheet (fixed inset + backdrop).
     │    │    Day picker (Sat–Fri pills), meal type picker, servings stepper.
     │    │    POSTs to /api/catalog-recipes/[id].
     │    │    State resets when recipe prop changes.
     │    │
     │    └─ MissingIngredientsDrawer.tsx  ← feature branch
     │         Bottom-sheet. Lists missing ingredients with qty + unit.
     │         "Add all to shopping list" → parallel POST /api/cart.
     │         Auto-closes 400ms after all items saved.
     │
     ├─ [tab=log]  LogMealTab.tsx
     │    3-stage state machine: idle → analyzing → confirming → saving → done.
     │    │
     │    ├─ MealPhotoCapture.tsx
     │    │    Camera + gallery file input. Preview thumbnail. Uploads to Supabase Storage.
     │    │
     │    ├─ DishSearch.tsx
     │    │    Debounced Spoonacular autocomplete (300ms). Fallback to typed name.
     │    │
     │    ├─ ServingsScaler.tsx
     │    │    +/− stepper. Rescales all ingredient deduction quantities proportionally.
     │    │
     │    └─ IngredientConfirmation.tsx
     │         Toggle per ingredient (include/exclude). Inline qty editor.
     │         Color-coded by match confidence (high=green, medium=amber, low=gray).
     │
     ├─ [tab=import]  ImportRecipeTab.tsx
     │    3-path flow: URL paste | screenshot upload | PWA share.
     │    │
     │    ├─ RecipeUrlInput.tsx       URL paste + validation
     │    ├─ RecipeScreenshotUpload.tsx   Drag-drop + file picker
     │    ├─ ShareLanding.tsx         Reads file cached by service worker
     │    └─ RecipePreview.tsx        Editable preview of extracted recipe. Confirm / back.
     │
     ├─ [tab=plan]  MealPlanTab.tsx
     │    7-day grid (Sat–Fri). Shopping list below. weekStart computed with local date (not UTC).
     │    │
     │    ├─ MealPlanDay.tsx
     │    │    Single day card. States: empty (+ button), filled (recipe title + remove button).
     │    │
     │    ├─ RecipePicker.tsx
     │    │    Modal overlay. Fetches /api/recipe-import/history.
     │    │    Lists confirmed recipe imports. Tap to assign to day.
     │    │
     │    └─ ShoppingList.tsx
     │         Grouped by 9 store sections (Produce, Meat, Dairy, Bakery, Frozen, Canned,
     │         Dry Goods, Beverages, Other).
     │         Each item: ingredient name, need qty, have qty, buy qty.
     │         Custom cart items (from /api/cart) shown inline with indigo border.
     │         Supabase Realtime subscription: live updates when household member checks off.
     │         5-second undo toast after check-off.
     │         Instacart share button. Copy-list button.
     │         Collapsible "In your cart ✓" zone.
     │
     ├─ [tab=pantry]  PantryTab.tsx
     │    Full pantry inventory. Low-stock alert banner. Expiry alert banner.
     │    │
     │    ├─ AddPantryForm.tsx   Inline form: name, qty, unit, expiry date, category.
     │    └─ PantryItemCard.tsx  Display + inline edit + delete. Swipe-to-delete on mobile.
     │
     └─ [tab=history]  HistoryTab.tsx
          ⚠️ STUB — Phase 9 (next session)
          Will show: merged timeline of meal_photos + recipe_imports, grouped by date.
```

---

## 8. Library Utilities (`src/lib/`)

### Supabase Clients
| File | Use case |
|------|----------|
| `lib/supabase/server.ts` | All API routes + server components. Cookie-based session. |
| `lib/supabase/client.ts` | Client components only (e.g. ShoppingList Realtime subscription). |

**Pattern — every API route:**
```ts
import { createClient } from '@/lib/supabase/server'
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### Core App Utilities
| File | What it does |
|------|-------------|
| `lib/scoring.ts` | Weekly life score (0–100%), member streak, household leaderboard ranking |
| `lib/goals.ts` | Goal definitions, week helpers (Sat→Fri), progress % computation |
| `lib/design.ts` | Per-F colour tokens, Tailwind gradient classes, ring colour stops |
| `lib/week.ts` | `getWeekStart()` (Monday-based), week label formatting |

### Meals Utilities
| File | What it does |
|------|-------------|
| `lib/meals/types.ts` | All shared TypeScript types: `RecipeJSON`, `PantryItem`, `MealSuggestion`, `PantryMatchResult`, `RecipeIngredient`, `MealPhotoAnalysis`, `CartItem`, `MealPreferenceProfile` |
| `lib/meals/matchPantry.ts` | **Core matching engine.** Fuse.js fuzzy match: recipe ingredients → pantry items. Threshold 0.4 (0=exact, 1=anything). Expands aliases. Returns `PantryMatchResult[]` with confidence + method. |
| `lib/meals/normalizeUnits.ts` | Convert all volume units → ml, weight → g. Aggregates same ingredient across multiple recipes for shopping list. |
| `lib/meals/storeSection.ts` | Maps ingredient names → 9 grocery sections. Used to group ShoppingList by aisle. |
| `lib/meals/preferences.ts` | `DietaryRestriction` + `CuisinePreference` types and option arrays. Used by PreferencesForm + meal-suggestions. |

---

## 9. Key Data Flows

### Flow A — Log a cooked meal (photo → pantry deduction)

```
User opens LogMealTab
  → MealPhotoCapture: selects/captures photo
      Uploads to Supabase Storage bucket: meal-photos/{userId}/{timestamp}.jpg
  → POST /api/meal-log/analyze-photo
      Reads image from storage URL
      Calls Claude Sonnet 4.6 vision API with image
      Claude returns: dish name, confidence, estimated ingredients[]
      matchIngredientsToPantry (Fuse.js) → PantryMatchResult[] per ingredient
      Returns: { dish, dishConfidence, ingredients[], pantryMatches[] }
  → LogMealTab: shows IngredientConfirmation UI
      User toggles each ingredient (include/exclude)
      User edits quantities with ServingsScaler
  → POST /api/meal-log/confirm
      INSERT INTO meal_photos (dish_name, image_url, analysis_json, ...)
      For each confirmed ingredient with a pantry match:
        CALL decrement_pantry_quantity(pantry_item_id, qty) RPC
      INSERT INTO consumption_logs (one row per ingredient)
      Returns: { mealPhotoId }
  → LogMealTab: shows success state
```

### Flow B — Browse catalog → add to meal plan

```
User opens SuggestionsTab → scrolls past AI picks to catalog section
  → CatalogBrowser fetches GET /api/catalog-recipes?cuisine=X&dietary=Y
      Supabase query: SELECT from catalog_recipes WHERE cuisines @> ARRAY['X']
      For each recipe: matchIngredientsToPantry → pantryMatchPct (0–100)
      Sort by pantryMatchPct DESC (most achievable first)
      Returns: { recipes: CatalogRecipe[] }
  → CatalogRecipeCard renders each recipe with pantry match bar
  → User taps "Add to Plan"
  → AddToPlanDrawer slides up: user picks day / meal type / servings
  → POST /api/catalog-recipes/[id]
      Check: does recipe_imports row exist with source_url = 'catalog:{id}'?
      If not: INSERT recipe_imports (source_type='catalog', status='confirmed')
      UPSERT meal_plans for current week
      UPSERT meal_plan_entries for chosen day + meal type
      Scale ingredients: qty × (requestedServings / recipe.servings)
      matchIngredientsToPantry → find items where matchMethod = 'none'
      Returns: { planEntryId, missingIngredients[] }
  → AddToPlanDrawer closes → MissingIngredientsDrawer opens
      Lists missing ingredients with qty + unit
  → User taps "Add all to shopping list"
      Promise.all → POST /api/cart for each missing item
  → MissingIngredientsDrawer auto-closes after 400ms
```

### Flow C — Shopping list generation

```
MealPlanTab mounts → GET /api/shopping-list?weekStart=YYYY-MM-DD
  Fetch meal_plan_entries for week (JOIN recipe_imports for recipe_json)
  For each entry:
    scale = entry.servings / recipe.servings
    For each ingredient: scaledQty = ingredient.qty × scale
    Skip optional ingredients (isOptional: true)
    Accumulate into ingredientsByName map (aggregate same ingredient across days)
  normalizeUnits: convert all to common units (ml, g) for deduplication
  matchIngredientsToPantry:
    For each ingredient: find pantry match, subtract haveQty from neededQty
    buyQty = max(0, neededQty - haveQty)
  getStoreSection: assign each ingredient to 1 of 9 store sections
  Also: SELECT pantry_items WHERE quantity < min_quantity → lowStockItems[]
  Returns: { shoppingItems[], lowStockItems[] }

ShoppingList.tsx renders:
  Header: copy-list button, Instacart button
  Per section (Produce, Meat, Dairy, Bakery, Frozen, Canned, Dry Goods, Beverages, Other):
    Section heading
    Each shopping item: name | have qty | buy qty | checkbox
    Each custom cart item (from /api/cart): name | qty | indigo border
  "In your cart ✓" collapsible zone for checked items
  Supabase Realtime subscription on cart_items table:
    Filtered by household_id (or user_id for solo users)
    Any cart_items INSERT/UPDATE/DELETE triggers re-fetch
```

### Flow D — Suggestion caching (saves ~80% of Claude API calls)

```
GET /api/meal-suggestions
  1. Fetch user's pantry items
  2. Compute pantry hash: sort item IDs + updated_at timestamps → join as string
  3. Fetch user_preferences: cached_suggestions, last_suggestion_at, pantry_snapshot_hash
  4. Cache hit check:
     IF last_suggestion_at within 6 hours AND hash matches stored hash:
       → Return cached_suggestions immediately (no Claude call)
     ELSE: continue
  5. Score recipes:
     Expiry urgency: items expiring within 3 days get urgency bonus
     Fuse.js match: find recipe_imports that use expiring ingredients
     Claude Sonnet 4.6: rank top 5 suggestions with "whyNow" reasoning
  6. Build response payload
  7. Cache write (non-blocking void):
     UPDATE user_preferences SET cached_suggestions = payload,
       last_suggestion_at = now(), pantry_snapshot_hash = hash
  8. Return response
```

---

## 10. Environment Variables

| Variable | Where used | Required |
|----------|-----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server — all Supabase calls | ✅ Always |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server — all Supabase calls | ✅ Always |
| `ANTHROPIC_API_KEY` | analyze-photo, recipe-import/from-image, meal-suggestions | ✅ For all AI features |
| `SPOONACULAR_API_KEY` | meal-log/search-dish, meal-log/dish-ingredients | ⚠️ Optional — graceful fallback |
| `INSTACART_API_KEY` | cart/instacart | ⚠️ Optional — clipboard fallback |
| `CRON_SECRET` | Future scheduled jobs | ❌ Not yet used |

Set in `.env.local` for local dev. Set in Vercel Dashboard → Settings → Environment Variables for production.

---

## 11. What's in the Feature Branch (Not Yet Deployed)

The `claude/jolly-euclid` branch is 16 commits ahead of main. Everything below exists in the worktree but is NOT live on Vercel yet.

| What | File(s) | Notes |
|------|---------|-------|
| User preferences | `src/app/(app)/meals/preferences/page.tsx`, `src/components/meals/PreferencesForm.tsx`, `src/lib/meals/preferences.ts`, `src/app/api/preferences/route.ts` | Dietary restrictions, cuisine preferences, household size |
| Suggestion cache | `app/backend/migrations/010_suggestion_cache.sql` | 3 new columns on user_preferences |
| Full cart API | `src/app/api/cart/route.ts`, `src/app/api/cart/[id]/route.ts`, `src/app/api/cart/instacart/route.ts` | GET/POST/PATCH/DELETE + Instacart link |
| Recipe catalog | `app/backend/migrations/011_catalog_recipes.sql`, `app/backend/seeds/001_catalog_recipes.sql` | New table + 25 seed recipes |
| Catalog API | `src/app/api/catalog-recipes/route.ts`, `src/app/api/catalog-recipes/[id]/route.ts` | Browse + add-to-plan |
| Catalog components | `CatalogBrowser.tsx`, `CatalogRecipeCard.tsx`, `AddToPlanDrawer.tsx`, `MissingIngredientsDrawer.tsx` | Full browse + add-to-plan UI |
| Recipe import history | `src/app/api/recipe-import/history/route.ts` | Fixes RecipePicker silent breakage |
| Updated SuggestionsTab | `src/components/meals/SuggestionsTab.tsx` | Catalog section below AI picks |
| Updated MealPlanTab | `src/components/meals/MealPlanTab.tsx` | Fixed userId/householdId prop forwarding, timezone-safe weekStart |
| Enhanced ShoppingList | `src/components/meals/ShoppingList.tsx` | Full rewrite with Realtime, cart items, undo toast |

**Pending Supabase migrations (must run before testing branch locally):**
```
1. app/backend/migrations/009_cart_items.sql      → NOTIFY pgrst, 'reload schema';
2. app/backend/migrations/010_suggestion_cache.sql → NOTIFY pgrst, 'reload schema';
3. app/backend/migrations/011_catalog_recipes.sql  → NOTIFY pgrst, 'reload schema';
4. app/backend/seeds/001_catalog_recipes.sql
```

---

## 12. Merge to Main Checklist

When ready to deploy the feature branch:

```bash
# From repo root (main working tree)
git checkout main
git merge claude/jolly-euclid
git push origin main
# Vercel deploys automatically in ~2 minutes
```

Before merging, confirm:
- [ ] All 4 pending SQL items run in Supabase SQL Editor
- [ ] `npx tsc --noEmit` → 0 errors (in app/frontend)
- [ ] `npm run dev` → smoke-test all 6 tabs end-to-end
- [ ] HistoryTab no longer a stub
- [ ] PROGRESS.md updated with session log
- [ ] Peer-review agent run on any new files since last review

After merging:
- [ ] Add `ANTHROPIC_API_KEY` to Vercel env vars (if not set)
- [ ] Add `SPOONACULAR_API_KEY` to Vercel env vars (if not set)
- [ ] Verify live URL: https://function-four.vercel.app

---

## 13. Coming Next (Phase 9)

| Feature | Description |
|---------|-------------|
| **Cart multi-select** | Checkbox-select multiple items → batch qty input → single save. Replaces slow one-at-a-time confirm flow. |
| **Pantry photos** | Optional photo per pantry item. Camera icon → upload to Supabase Storage → thumbnail on card. |
| **HistoryTab** | Merged timeline of meal photos + imported recipes, grouped by date. |
| **Smarter photo log** | Pass pantry items + weekly meal plan as context to Claude analyze-photo. If identified dish matches a planned meal (≥75% confidence), pre-populate ingredients from recipe_json instead of estimating from photo. |
| **Thursday: UI/UX design session** | No code — full audit of every screen, define design language, produce spec. |
