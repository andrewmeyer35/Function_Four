-- Migration 002 — Add structured scores + tags to checkins.
-- The existing *_text columns remain as the optional free-text note per F.
-- Scores are 1-10 when set; NULL means the user skipped that F this week.
-- Tags are small, curated arrays (see shared/types.ts for the canonical list per F).

alter table public.checkins
  add column if not exists financial_score smallint,
  add column if not exists financial_tags  text[] not null default '{}',
  add column if not exists fitness_score   smallint,
  add column if not exists fitness_tags    text[] not null default '{}',
  add column if not exists fun_score       smallint,
  add column if not exists fun_tags        text[] not null default '{}',
  add column if not exists flirt_score     smallint,
  add column if not exists flirt_tags      text[] not null default '{}';

-- Keep scores sane (1..10 when non-null).
do $$ begin
  alter table public.checkins
    add constraint checkins_financial_score_range check (financial_score is null or financial_score between 1 and 10);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.checkins
    add constraint checkins_fitness_score_range check (fitness_score is null or fitness_score between 1 and 10);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.checkins
    add constraint checkins_fun_score_range check (fun_score is null or fun_score between 1 and 10);
exception when duplicate_object then null; end $$;

do $$ begin
  alter table public.checkins
    add constraint checkins_flirt_score_range check (flirt_score is null or flirt_score between 1 and 10);
exception when duplicate_object then null; end $$;

-- Helpful index for the household feed / leaderboard queries.
create index if not exists idx_checkins_household_week
  on public.checkins (household_id, week_start desc);
