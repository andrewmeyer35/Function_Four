# Four Fs — Project Progress Log

Live URL: https://function-four.vercel.app  
Repo: https://github.com/andrewmeyer35/Function_Four  
Supabase: project configured with RLS policies  
Last updated: 2026-04-21

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
