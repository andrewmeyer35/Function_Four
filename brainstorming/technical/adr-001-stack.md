# ADR 001 — Tech Stack Choice

**Status**: Accepted  
**Date**: 2026-04-21

## Context
We need to build a web MVP fast (weeks not months), keep costs at zero initially, and ensure the stack migrates to iOS without a full rewrite.

## Decision
Next.js + Supabase + Vercel + Prisma.

## Reasoning
- **Next.js**: Fullstack in one repo. API routes handle the backend until we need to extract. App Router works well with React Query. Logic is reusable in Expo.
- **Supabase**: Free Postgres + auth + real-time subscriptions. Magic link auth is 10 lines of code. Real-time handles live feed updates.
- **Vercel**: One `git push` deploys both frontend and API. Free tier is enough for a household.
- **Prisma**: Type-safe DB queries. Schema lives in the repo. Migrations are version-controlled.

## Trade-offs
- Supabase free tier has limits (500MB DB, 50k MAU auth). Fine for Phase 1; upgrade if needed.
- Next.js API routes aren't ideal for long-running jobs (email reminders). Solution: use Vercel Cron Jobs or Supabase Edge Functions for scheduled reminders.
