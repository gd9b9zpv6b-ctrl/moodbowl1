-- ============================================================================
-- MoodBowl · Supabase schema
-- Tables: profiles, diaries, relax_games_history
-- Features: RLS · auto-profile trigger · updated_at · indexes
-- ============================================================================

-- ---------- 0 · Extensions ---------------------------------------------------
create extension if not exists "pgcrypto";     -- gen_random_uuid()

-- ---------- 1 · profiles -----------------------------------------------------
-- One row per auth.users row · created automatically via trigger below.
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  display_name   text,
  role           text        not null default 'student'
                             check (role in ('student','teacher','counsellor','parent','school_admin')),
  class_name     text,
  school_id      uuid,
  is_premium     boolean     not null default false,
  avatar_url     text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table  public.profiles is 'Public user profile · 1:1 with auth.users';
comment on column public.profiles.role is 'App role · student/teacher/counsellor/parent/school_admin';

-- ---------- 2 · diaries ------------------------------------------------------
-- One row per completed ritual (or quick diary entry).
create table if not exists public.diaries (
  id                   uuid        primary key default gen_random_uuid(),
  user_id              uuid        not null references auth.users(id) on delete cascade,

  -- Ritual answers
  soup                 text        check (soup in
                                     ('hot_milk_tea','cold_lemon_tea','curry',
                                      'plain_congee','sweet_soup','no_appetite')),
  body_chips           text[]      not null default '{}',
  bowl_emotion_key     text,                          -- e.g. 'angry','hollow'
  bowl_color_tint      text,                          -- hex e.g. '#FBEBEB'
  bowl_size            text        default 'M'
                                    check (bowl_size in ('S','M','L','XL')),
  bowl_steam           text,                          -- v2 · nullable

  -- Diary text
  diary_text           text,

  -- Meta
  check_in_type        text        not null default 'full'
                                    check (check_in_type in
                                      ('full','hug_only','skipped','quick_diary')),
  time_spent_sec       integer,
  smile_completed      boolean     not null default false,
  ritual_version       text        default 'v1',

  -- Sharing (all default false · opt-in only)
  is_public            boolean     not null default false,
  shared_with_class    boolean     not null default false,
  shared_with_family   boolean     not null default false,

  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.diaries is 'MoodBowl ritual entries · one per completed check-in';

-- ---------- 3 · relax_games_history -----------------------------------------
-- Log of regulation activities completed during a ritual (or standalone).
create table if not exists public.relax_games_history (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  diary_id          uuid        references public.diaries(id) on delete set null,
  activity_key      text        not null,       -- 'breath_4_7_8','punch_bag',etc
  state_detected    text        check (state_detected in
                                  ('sympathetic_fire','sympathetic_anxious',
                                   'dorsal_sad','dorsal_freeze',
                                   'ventral_regulated','unspoken')),
  completed         boolean     not null default false,
  duration_sec      integer,
  created_at        timestamptz not null default now()
);

comment on table public.relax_games_history is 'Log of regulation activity completions';

-- ============================================================================
-- INDEXES · performance for common queries
-- ============================================================================
create index if not exists idx_diaries_user_created
  on public.diaries (user_id, created_at desc);

create index if not exists idx_diaries_user_checkin
  on public.diaries (user_id, check_in_type);

create index if not exists idx_diaries_public_created
  on public.diaries (created_at desc)
  where is_public = true;

create index if not exists idx_relax_user_created
  on public.relax_games_history (user_id, created_at desc);

create index if not exists idx_relax_diary
  on public.relax_games_history (diary_id);

create index if not exists idx_profiles_role
  on public.profiles (role);

-- ============================================================================
-- FUNCTIONS · updated_at auto-bump
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_diaries_updated_at on public.diaries;
create trigger trg_diaries_updated_at
  before update on public.diaries
  for each row execute function public.set_updated_at();

-- ============================================================================
-- FUNCTIONS · auto-create profile on auth.users insert
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles            enable row level security;
alter table public.diaries             enable row level security;
alter table public.relax_games_history enable row level security;

-- ---------- profiles policies -----------------------------------------------
drop policy if exists "profiles_select_own"       on public.profiles;
drop policy if exists "profiles_update_own"       on public.profiles;
drop policy if exists "profiles_insert_own"       on public.profiles;

create policy "profiles_select_own"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  using  (auth.uid() = id)
  with check (auth.uid() = id);

-- Trigger already creates the row · this policy is for safety on manual insert.
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- ---------- diaries policies ------------------------------------------------
drop policy if exists "diaries_select_own"        on public.diaries;
drop policy if exists "diaries_select_public"     on public.diaries;
drop policy if exists "diaries_insert_own"        on public.diaries;
drop policy if exists "diaries_update_own"        on public.diaries;
drop policy if exists "diaries_delete_own"        on public.diaries;

create policy "diaries_select_own"
  on public.diaries
  for select
  using (auth.uid() = user_id);

-- Public entries readable by any authenticated user.
create policy "diaries_select_public"
  on public.diaries
  for select
  using (is_public = true and auth.role() = 'authenticated');

create policy "diaries_insert_own"
  on public.diaries
  for insert
  with check (auth.uid() = user_id);

create policy "diaries_update_own"
  on public.diaries
  for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "diaries_delete_own"
  on public.diaries
  for delete
  using (auth.uid() = user_id);

-- ---------- relax_games_history policies ------------------------------------
drop policy if exists "relax_select_own" on public.relax_games_history;
drop policy if exists "relax_insert_own" on public.relax_games_history;
drop policy if exists "relax_update_own" on public.relax_games_history;
drop policy if exists "relax_delete_own" on public.relax_games_history;

create policy "relax_select_own"
  on public.relax_games_history
  for select
  using (auth.uid() = user_id);

create policy "relax_insert_own"
  on public.relax_games_history
  for insert
  with check (auth.uid() = user_id);

create policy "relax_update_own"
  on public.relax_games_history
  for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "relax_delete_own"
  on public.relax_games_history
  for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- GRANTS · restrict anon · allow authenticated (RLS still filters rows)
-- ============================================================================
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on public.profiles            to authenticated;
grant select, insert, update, delete on public.diaries             to authenticated;
grant select, insert, update, delete on public.relax_games_history to authenticated;

-- End of schema.sql
