-- Four Fs — Phase 1 initial schema
-- Column naming: snake_case (matches existing API route code)
-- RLS: enabled with permissive "any authenticated user" policies for Phase 1.
--      Phase 1.1 will tighten to same-household members only.

-- ---------- public.users : profile mirror of auth.users ----------
create table if not exists public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text unique not null,
  name       text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- Auto-create a profile row when a new auth.user signs up via magic link
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- public.households ----------
create table if not exists public.households (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  invite_code text unique not null default substr(md5(random()::text || clock_timestamp()::text), 1, 10),
  created_at  timestamptz not null default now()
);

-- ---------- public.household_members ----------
create table if not exists public.household_members (
  user_id      uuid not null references public.users(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  role         text not null default 'member',
  joined_at    timestamptz not null default now(),
  primary key (user_id, household_id)
);

-- ---------- public.checkins ----------
create table if not exists public.checkins (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  household_id   uuid not null references public.households(id) on delete cascade,
  week_start     date not null,
  financial_text text,
  fitness_text   text,
  fun_text       text,
  flirt_text     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, household_id, week_start)
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists checkins_set_updated_at on public.checkins;
create trigger checkins_set_updated_at
  before update on public.checkins
  for each row execute function public.set_updated_at();

-- ---------- public.reactions ----------
create table if not exists public.reactions (
  id         uuid primary key default gen_random_uuid(),
  checkin_id uuid not null references public.checkins(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  emoji      text not null,
  created_at timestamptz not null default now(),
  unique (checkin_id, user_id, emoji)
);

-- ---------- Row Level Security (Phase 1 permissive) ----------
alter table public.users             enable row level security;
alter table public.households        enable row level security;
alter table public.household_members enable row level security;
alter table public.checkins          enable row level security;
alter table public.reactions         enable row level security;

-- users
drop policy if exists "auth read users" on public.users;
create policy "auth read users" on public.users
  for select using (auth.role() = 'authenticated');

drop policy if exists "user updates self" on public.users;
create policy "user updates self" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- households
drop policy if exists "auth read households" on public.households;
create policy "auth read households" on public.households
  for select using (auth.role() = 'authenticated');

drop policy if exists "auth insert households" on public.households;
create policy "auth insert households" on public.households
  for insert with check (auth.role() = 'authenticated');

-- household_members
drop policy if exists "auth read members" on public.household_members;
create policy "auth read members" on public.household_members
  for select using (auth.role() = 'authenticated');

drop policy if exists "user joins household as self" on public.household_members;
create policy "user joins household as self" on public.household_members
  for insert with check (auth.uid() = user_id);

-- checkins
drop policy if exists "auth read checkins" on public.checkins;
create policy "auth read checkins" on public.checkins
  for select using (auth.role() = 'authenticated');

drop policy if exists "user writes own checkins" on public.checkins;
create policy "user writes own checkins" on public.checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- reactions
drop policy if exists "auth read reactions" on public.reactions;
create policy "auth read reactions" on public.reactions
  for select using (auth.role() = 'authenticated');

drop policy if exists "user writes own reactions" on public.reactions;
create policy "user writes own reactions" on public.reactions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
