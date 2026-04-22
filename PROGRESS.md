# Four Fs — Project Progress Log

Live URL: https://function-four.vercel.app  
Repo: https://github.com/andrewmeyer35/Function_Four  
Supabase: project configured with RLS policies  
Last updated: 2026-04-21 (Session 5)

---

## Index

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Database Schema](#3-database-schema)
4. [Pages & Routes](#4-pages--routes)
5. [Components](#5-components)
6. [Session Log](#6-session-log)
7. [Known Issues & Fixes](#7-known-issues--fixes)
8. [Deployment](#8-deployment)
9. [Next Steps / Ideas](#9-next-steps--ideas)

---

## 1. Project Overview

Four Fs is a lifestyle accountability web app for households. It tracks four life pillars:

- 💰 **Financial** — saving, avoiding impulse spending, eating at home
- 💪 **Fitness** — workouts, sleep, nutrition
- 🎉 **Fun/Friends** — social activity, meaningful connections
- 💘 **Flirt/Fervier** — dating activity, self care

Users set weekly goals, check off daily progress, and compete on a household leaderboard. Week runs **Saturday → Friday**.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS v3 |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Auth | Supabase magic link (email OTP) |
| Hosting | Vercel (auto-deploys from GitHub main branch) |
| Repo | GitHub — andrewmeyer35/Function_Four |

**Key config files:**
- `app/frontend/postcss.config.js` — required for Tailwind to compile
- `app/frontend/next.config.js` — webpack alias for `@shared/*` path
- `app/frontend/tsconfig.json` — path aliases `@/*` and `@shared/*`
- `.gitignore` — excludes `.env.local`, `node_modules`, `.next/`

---

## 3. Database Schema

### Migration 001 — Initial (users, households, household_members)
```sql
users (id, email, name, created_at)
households (id, name, invite_code, created_at)
household_members (id, user_id, household_id, role, joined_at)
```

### Migration 002 — Scores and Tags (checkins — legacy)
```sql
checkins (id, user_id, household_id, week_start, financial_score, fitness_score,
          fun_score, flirt_score, financial_tags, fitness_tags, fun_tags, flirt_tags,
          financial_text, fitness_text, fun_text, flirt_text, created_at)
```

### Migration 003 — Goals and Daily Logs ⭐ (current system)
```sql
user_goals (id, user_id, category, metric_key, label, target, is_active,
            created_at, updated_at)
  UNIQUE(user_id, metric_key)
  RLS: USING (true) WITH CHECK (true)

daily_logs (id, user_id, household_id, log_date, week_start,
            saved_toward_goal, no_impulse_spend, meals_ate_in,
            worked_out, sleep_7plus, good_nutrition,
            had_social_activity, quality_connection,
            dating_activity, self_care,
            notes, created_at, updated_at)
  UNIQUE(user_id, log_date)
  RLS: USING (true) WITH CHECK (true)
```

### Migration 004 — Workout Details
```sql
ALTER TABLE daily_logs
  ADD COLUMN workout_intensity SMALLINT CHECK (workout_intensity BETWEEN 1 AND 7),
  ADD COLUMN workout_distance  NUMERIC(6,2);
```

> ⚠️ Migrations must be run manually in Supabase SQL Editor — they are NOT auto-applied.

---

## 4. Pages & Routes

| Route | Type | Description |
|-------|------|-------------|
| `/login` | Public | Magic link login |
| `/onboarding` | Auth required | Create or join a household. Accepts `?invite=CODE` to pre-fill |
| `/household` | Auth required | Home page — hero rings, leaderboard, breakdown |
| `/log` | Auth required | Weekly tracker — daily checkbox grid |
| `/goals` | Auth required | Goal setter — toggle and configure weekly targets |
| `/board` | Auth required | Household leaderboard with per-category breakdown |
| `/profile` | Auth required | User info + invite panel |
| `/auth/callback` | System | Supabase magic link callback. Accepts `?next=` param |

### API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/goals` | GET | Fetch current user's goals |
| `/api/goals` | POST | Upsert a single goal `{ metric_key, target, is_active }` |
| `/api/daily-logs` | GET | Fetch week's logs `?weekStart=YYYY-MM-DD` |
| `/api/daily-logs` | POST | Upsert one field `{ log_date, metric_key, value }` |
| `/api/households` | POST | Create a new household |
| `/api/households/join` | POST | Join via invite code `{ code }` |

---

## 5. Components

### UI Components (`src/components/ui/`)

| Component | Description |
|-----------|-------------|
| `LifeScoreHero` | 4 rings (0-100% per category), stats grid, 7-week bar chart |
| `WeeklyTracker` | Daily checkbox grid per goal. Workout detail panel (intensity 1-7, distance) |
| `GoalSetter` | Toggle + stepper UI for configuring weekly goals |
| `HomeBreakdown` | Per-category progress bars on home page |
| `BoardClient` | Interactive household leaderboard with expandable category breakdown |
| `InvitePanel` | Phone number input → opens native SMS app with invite link |
| `Podium` | Compact leaderboard list (used on home page) |
| `Sidebar` | Desktop fixed sidebar (hidden on mobile) |
| `BottomNav` | Mobile bottom tab bar (hidden on desktop) |

### Layout
- Mobile: bottom nav, single column
- Desktop (md+): fixed 224px sidebar, 2-column grid on home page

---

## 6. Session Log

### Session 1 — Initial Build
- Reviewed existing codebase
- Rebuilt UI to match modern design (rings, stats grid, leaderboard, breakdown cards)
- Created `postcss.config.js` and `next.config.js` (were missing — caused zero CSS output)
- Fixed SWC JSX parser bug: bare `>` comparisons misread as JSX closing tags
- Added responsive layout: mobile bottom nav + desktop sidebar

### Session 2 — Goals & Tracking System
- Created `user_goals` and `daily_logs` tables (migration 003)
- Built Goals page (`/goals`) with `GoalSetter` component
- Built Track page (`/log`) with `WeeklyTracker` component
- Week system: Saturday (day 1) → Friday (day 7) using `date-fns`
- Optimistic UI for checkbox toggles
- API routes: `/api/goals` and `/api/daily-logs`

### Session 3 — Workout Details + Board Page
- Added `workout_intensity` (1-7) and `workout_distance` columns (migration 004)
- `WeeklyTracker` now shows collapsible detail panel per workout day
- Updated API to handle numeric fields (not force Boolean)
- Built `/board` page with `BoardClient` — ranked leaderboard, expandable per-category scores

### Session 4 — Bug Fixes & Invite System (2026-04-21)
- **Fixed goals not saving:** `useTransition` with async doesn't work in React 18 — replaced with plain `useState`. Added `router.refresh()` after save so Track tab shows fresh data
- **Surfaced real error:** Added proper error message display showing actual API error text
- **Root cause found:** Migration 003 + 004 had not been run in Supabase → "table not found" error
- **Built invite system:**
  - `InvitePanel` component with phone number input + native SMS via `sms:` URI
  - Web Share API button on supported devices
  - `/profile` page with household info and invite panel
  - `OnboardingPage` now passes `?invite=CODE` param → auto-fills join form
  - Login page carries `?next=` param through magic link so invite code survives auth flow
- **Updated Home page** to use new `daily_logs`/`user_goals` system:
  - `LifeScoreHero` now uses 0-100% scores (not old 0-10 checkin scores)
  - Inline leaderboard shows weekly % per member with progress bars
  - `HomeBreakdown` replaces old `WeeklyBreakdown` (checkin-based)
  - 7-week history computed from daily_logs
  - Streak = consecutive weeks with any logged activity
- **Deployed to Vercel:**
  - Repo pushed to GitHub (andrewmeyer35/Function_Four)
  - Fixed TypeScript build error: `as unknown as DailyLog[]` for partial select
  - Fixed invalid `ringColor` CSS property in WeeklyTracker
  - Added Supabase env vars to Vercel project settings
  - Added live URL to Supabase Auth → URL Configuration + Redirect URLs

### Session 5 — Smart Grocery & Pantry App Research (2026-04-21)

Conducted deep 3-workstream research for a new **Smart Grocery & Pantry Management** app concept. Full output available in conversation history. Summary of key findings:

**API Integration (Workstream 1):**
- Amazon Fresh / Whole Foods: **no public API** — scraping violates TOS
- **Primary:** Instacart Developer Platform (IDP) — link-based order flow; apply at instacart.com/company/business/developers; sandbox at `connect.dev.instacart.tools`
- **Secondary:** Kroger Cart API (`developer.kroger.com`) — OAuth2 PKCE, direct `PUT /v1/cart/add`, sandbox at `api-ce.kroger.com`
- Architecture: Vercel Cron generates list → calls IDP server-side → stores link in DB → user reviews → opens Instacart to checkout

**Pantry Algorithm (Workstream 2):**
- Full Prisma schema designed: `PantryItem`, `ConsumptionLog`, `MealLog`, `Order`, `OrderLineItem`, `ShelfLifeReference`
- Ingestion: barcode scan (`@zxing/browser` + Open Food Facts), receipt OCR (Mindee API), manual
- Consumption tracking: rolling 30-day average (MVP) → LSTM per-category model (Phase 2, min 10 events)
- Reorder triggers: below threshold, predicted runout within 7 days, expiring within 3 days
- Shelf life: bundled USDA JSON + Open Food Facts lookup
- Cron schedule: `0 8 * * *` daily reorder check; `0 7 * * *` expiration alerts

**UX Design (Workstream 3):**
- PWA (responsive, mobile-first) — single Next.js codebase, no native app for MVP
- Stack: Next.js 15 + Shadcn/UI + Tailwind + Zustand + React Query + Supabase
- Key screens designed: Dashboard, Pantry Inventory (expiration color-coding), Barcode Scan, Order Review, Onboarding (5 steps)
- Competitive gaps exploited: AnyList (no auto-reorder), Pantry Check (overwhelming onboarding), Instacart (no pantry tracking)
- Notification design: 1 digest/day max, delay push permission until 3+ items logged

**Recommended MVP features (in order):**
1. Auth (Supabase magic link)
2. Pantry CRUD + barcode scan
3. Expiration tracking + alerts (Web Push)
4. Low stock threshold alerts
5. Shopping list auto-generation → Instacart link
6. Receipt OCR import (Mindee)

**Open risks:** Instacart/Kroger TOS require user review step before cart submission (architecture complies); iOS Safari lacks native BarcodeDetector (use `@zxing/browser` polyfill); OFF data quality gaps on expiry data; LSTM cold start for new users.

---

## 7. Known Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| No CSS rendered | Missing `postcss.config.js` | Created the file |
| `@shared/*` not resolved | Missing `next.config.js` webpack alias | Created the file |
| SWC parse error on `>` | Bare `>` misread as JSX closing tag | Use `>=` or module-level functions |
| Goals not saving silently | `useTransition` doesn't track async in React 18 | Replaced with `useState` |
| Track tab shows stale data | Next.js server cache not invalidated | Added `router.refresh()` after save |
| Table not found error | Migrations 003/004 not run in Supabase | Run SQL manually in Supabase SQL Editor |
| Vercel build error (TypeScript) | Partial select type mismatch | Cast via `as unknown as DailyLog[]` |
| Vercel build error (CSS) | `ringColor` not a valid CSS property | Removed the invalid style |
| Magic link not arriving | Live URL not added to Supabase auth config | Added to Site URL + Redirect URLs |

---

## 8. Deployment

### Vercel
- **Live URL:** https://function-four.vercel.app
- **Auto-deploy:** Every push to `main` triggers a new deployment
- **Root directory:** `app/frontend`
- **Environment variables required:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Supabase Auth Configuration
- **Site URL:** `https://function-four.vercel.app`
- **Redirect URLs:** `https://function-four.vercel.app/auth/callback`

### Deploying updates
```cmd
git add .
git commit -m "describe what changed"
git push
```
Vercel picks it up automatically within ~2 minutes.

---

## 9. Next Steps / Ideas

- [ ] Push notifications when a roommate logs a workout
- [ ] Weekly summary email (Sunday recap)
- [ ] Streak freeze / grace day feature
- [ ] Historical weekly view — browse past weeks in the Track tab
- [ ] Goal suggestions based on category performance
- [ ] Dark mode
- [ ] Custom goal creation (beyond the 10 preset options)
- [ ] Upgrade Next.js to latest (current 14.2.0 has a flagged security advisory)

### Session 6 — Meal Intelligence Layer Research (2026-04-21)

Conducted deep 3-workstream research for the Meal Intelligence Layer features. Summary:

**Meal Photo Recognition (Workstream 1):**
- Recommended: Claude Sonnet 4.6 vision for ingredient extraction (~$0.007/photo)
- Full prompt engineering spec designed; returns structured MealPhotoAnalysis JSON
- Pantry deduction uses Fuse.js fuzzy matching (threshold 0.4); upgrades to pgvector in Phase 2
- NEVER auto-deduct — always require user confirmation step
- Estimated items flagged as `isEstimated: true`; weighted at 0.6x in reorder rolling average
- New DB model: `MealPhoto` (stores image URL, raw LLM analysis JSONB, match results, user decisions)

**AI Meal Suggestions (Workstream 2):**
- Primary recipe data: Spoonacular API (`/recipes/findByIngredients`) — $29/mo plan, 365K+ recipes
- Scoring formula: pantryMatch (45%) + expiryUrgency (35%) + preferenceMatch (20%)
- LLM for suggestion enrichment: Claude Haiku 4.5 (~$0.004/session) or GPT-4o-mini (~$0.0005/session)
- Manual entry: Spoonacular autocomplete → ingredient list pre-fill → servings scaler → pantry deduct
- Preference learning: nightly inference job (dish frequency + ingredient frequency from ConsumptionLog)
- New DB models: `MealPreferenceProfile`, `RecipeSuggestion`

**Social Recipe Import (Workstream 3):**
- Instagram Basic Display API: DEAD (shutdown late 2024). Instagram Graph API: own account only, stories inaccessible to third parties. Do NOT build around Instagram API.
- MVP Path A: URL paste/share → JSON-LD extraction (zero LLM cost, 631 sites) → LLM fallback
- MVP Path B: Screenshot upload → Google Cloud Vision OCR → Claude Haiku recipe parse
- Phase 2: TikTok transcript via Supadata API → Claude recipe parse
- Recipe → Cart: match ingredients to pantry (deduct what you have) → generate Instacart link for missing items only
- New DB model: `RecipeImport`

**Cost at 10K DAU:** ~$130/day / ~$4K/month (reducible by switching suggestions to GPT-4o-mini)

**Key legal notes:** Never scrape Instagram/TikTok automatically. All import flows must be user-initiated. Ingredient lists are not copyrightable (US law); recipe steps are — extract ingredients only.

**New API routes needed:**
- POST /api/meal-photo/upload → /analyze → /confirm
- GET /api/meal-suggestions
- POST /api/recipe-import/from-url → /from-image → /confirm
- GET|PUT /api/preferences

### Smart Pantry App (new project concept — research complete 2026-04-21)
- [ ] Apply for Instacart Developer Platform API key
- [ ] Register app at developer.kroger.com (sandbox available immediately)
- [ ] Initialize new Next.js 15 repo with Supabase + Prisma + Shadcn/UI
- [ ] Implement Prisma schema (PantryItem, ConsumptionLog, Order, etc.)
- [ ] Build barcode scan flow (@zxing/browser + Open Food Facts)
- [ ] Build receipt OCR flow (Mindee API)
- [ ] Build Instacart IDP link-generation server action
- [ ] Set up Vercel Cron jobs for daily reorder + expiration checks
- [ ] Configure Web Push (VAPID) notifications

### Session 7 — Meals Feature Technical Spec (2026-04-21)

Produced full technical spec for PWA Web Share Target API + /meals page architecture. Spec saved to `brainstorming/technical/meals-feature-spec.md`.

**Part 1 — Web Share Target API:**
- Full browser support matrix: Android Chrome YES, iOS Safari NO (WebKit bug open since 2019, no ETA)
- manifest.json `share_target` config: POST + multipart/form-data, accepts image/* files + url + text + title params
- Service worker intercept pattern: SW catches POST to /meals/share, stores file in Cache API, redirects to /meals?tab=import&shareId=...
- Next.js route handler at `src/app/(app)/meals/share/route.ts`: server-side fallback that uploads images to Supabase Storage
- ShareLanding component: reads shareId from Cache API or sharedImageUrl/sharedUrl from query params
- InstallPrompt component: captures `beforeinstallprompt` event, shows banner on Meals page
- End-to-end UX flows documented for both image share (Flow A) and URL share (Flow B)
- iOS fallback: URL paste input + file picker (no install required)

**Part 2 — /meals Page Architecture:**
- Navigation: Replace "Goals" in bottom nav with "Meals" (center slot). Goals stays in sidebar + add link in Profile page for mobile.
- Nav icon: Chef hat SVG (no Lucide dep, matches existing custom SVG pattern)
- 4-tab structure: Suggestions (default) | Log Meal | Import Recipe | History
- Tab state in URL params — enables share target deep links (?tab=import&shareId=...)
- All 4 tabs fully wireframed with screen-by-screen descriptions
- Shared IngredientConfirmation screen: confidence-based pre-checking (green >0.8, amber 0.4–0.8, grey <0.4)
- 21 new components listed with file paths
- 6 new API routes listed
- Complete file tree additions documented

**Key implementation notes:**
- App is Next.js 14.2.0 (not 15) — all code written for Next.js 14 App Router
- Shadcn/UI not yet installed — recommend adding for Sheet + Dialog components
- Service worker must live at `public/sw.js`, registered in `providers.tsx`
- `meal-photos` Supabase Storage bucket needed for server-side image uploads

### Meal Intelligence Layer (research complete 2026-04-21)
- [ ] Add `MealPhoto`, `RecipeImport`, `MealPreferenceProfile`, `RecipeSuggestion` Prisma models
- [ ] Add `ConsumptionLog` with `source`, `isEstimated`, `dishContext`, `mealPhotoId`, `recipeImportId` fields
- [ ] Build meal photo upload → Claude Sonnet 4.6 vision → ingredient extraction pipeline
- [ ] Build Fuse.js pantry matcher (threshold 0.3–0.4; aliases field on PantryItem)
- [ ] Build user confirmation UI for pantry deductions (pre-check high-confidence, amber for low)
- [ ] Integrate Spoonacular API (recipe search, findByIngredients, autocomplete)
- [ ] Build pantry-aware meal suggestion scoring (pantryMatch 45% + expiryUrgency 35% + preference 20%)
- [ ] Build Claude Haiku meal suggestion LLM call (or GPT-4o-mini for cost)
- [ ] Build manual meal entry with Spoonacular autocomplete + servings scaler
- [ ] Build URL → JSON-LD recipe extraction (cheerio + schema.org/Recipe parser)
- [ ] Build LLM fallback recipe extraction for non-structured pages (Claude Haiku)
- [ ] Build screenshot OCR pipeline (Google Cloud Vision → Claude recipe parse)
- [ ] Build Recipe → Cart flow (pantry match deductions + Instacart link for missing items)
- [ ] Build nightly preference inference job (dish/ingredient frequency from ConsumptionLog)
- [ ] Add `meal-photos` Supabase Storage bucket with RLS

### /meals Page Implementation (spec complete 2026-04-21)
- [ ] Install Shadcn/UI (`npx shadcn-ui@latest init`) — needed for Sheet, Dialog
- [x] Create `public/manifest.json` with share_target config
- [x] Create `public/sw.js` service worker with share target intercept
- [ ] Create `public/icons/icon-192.png` and `icon-512.png` (PWA required — user must supply PNG files)
- [x] Add `<link rel="manifest">` and PWA meta tags to `src/app/layout.tsx`
- [x] Register service worker in `src/app/providers.tsx`
- [ ] Create `src/app/(app)/meals/page.tsx` server component
- [ ] Create `src/app/(app)/meals/share/route.ts` share target POST handler
- [ ] Build all 19 meal components in `src/components/meals/`
- [ ] Build `src/components/ui/InstallPrompt.tsx`
- [ ] Update `BottomNav.tsx`: replace Goals with Meals (center slot)
- [ ] Update `Sidebar.tsx`: add Meals entry
- [ ] Add Goals link to Profile page (so mobile users can still reach it)
- [ ] Create `meal-photos` Supabase Storage bucket + RLS policy  ← user does this in Supabase dashboard
- [ ] Build 6 new API routes under `src/app/api/`

### Phase 1 completed (2026-04-21)
Code changes done:
- [x] Installed: `@anthropic-ai/sdk`, `fuse.js`, `cheerio`, `@types/cheerio`
- [x] Created `public/manifest.json` (PWA manifest + share_target)
- [x] Created `public/sw.js` (service worker — share intercept + cache cleanup)
- [x] Created `public/icons/` directory (user must add icon-192.png + icon-512.png)
- [x] Updated `src/app/layout.tsx` — manifest link + PWA meta tags
- [x] Updated `src/app/providers.tsx` — SW registration on mount
- [x] Created `src/lib/meals/types.ts` — all shared TypeScript types
- [x] Created `.env.local.example` — documents all required env vars
- TypeScript check: clean (0 errors)

User still needs to do manually:
- [ ] Apply for Instacart IDP key (instacart.com/company/business/developers)
- [x] Sign up for Spoonacular — key in .env.local
- [x] Anthropic API key — key in .env.local
- [x] Copy `.env.local.example` → `.env.local` and fill in keys
- [ ] Add ANTHROPIC_API_KEY + SPOONACULAR_API_KEY to Vercel environment variables
- [x] Run 6 SQL migrations in Supabase SQL editor
- [x] Create `meal-photos` Storage bucket + RLS policy in Supabase
- [ ] Add `public/icons/icon-192.png` and `icon-512.png` (app logo PNGs)
