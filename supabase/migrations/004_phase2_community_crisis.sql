-- Phase 2 · community reactions, crisis alerts, tenancy scaffolding, ritual RPC.
-- Safe to re-run (IF NOT EXISTS / drop-if-exists / create or replace).

-- ============================================================================
-- 0 · Ensure diaries legacy columns from 003
-- ============================================================================
alter table public.diaries
  add column if not exists entry_date date;

alter table public.diaries
  add column if not exists emotions text[] not null default '{}';

alter table public.diaries
  add column if not exists energy_level integer;

alter table public.diaries
  add column if not exists is_secret boolean not null default false;

alter table public.diaries
  add column if not exists hearts integer not null default 0;

update public.diaries
set entry_date = (created_at at time zone 'utc')::date
where entry_date is null;

alter table public.diaries
  alter column entry_date set default ((now() at time zone 'utc')::date);

create index if not exists idx_diaries_user_entry_date
  on public.diaries (user_id, entry_date desc);

-- ============================================================================
-- 1 · Tenancy scaffolding
-- ============================================================================
create table if not exists public.schools (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  created_at timestamptz not null default now()
);

create table if not exists public.school_memberships (
  id         uuid        primary key default gen_random_uuid(),
  school_id  uuid        not null references public.schools(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  role       text        not null default 'student',
  created_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create table if not exists public.classes (
  id         uuid        primary key default gen_random_uuid(),
  school_id  uuid        not null references public.schools(id) on delete cascade,
  name       text        not null,
  created_at timestamptz not null default now()
);

create table if not exists public.class_memberships (
  id         uuid        primary key default gen_random_uuid(),
  class_id   uuid        not null references public.classes(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (class_id, user_id)
);

create index if not exists idx_school_memberships_user
  on public.school_memberships (user_id);

create index if not exists idx_school_memberships_school
  on public.school_memberships (school_id);

create index if not exists idx_class_memberships_user
  on public.class_memberships (user_id);

create index if not exists idx_classes_school
  on public.classes (school_id);

-- ============================================================================
-- 2 · diary_reactions · community hearts (unique per user per diary)
-- ============================================================================
create table if not exists public.diary_reactions (
  id         uuid        primary key default gen_random_uuid(),
  diary_id   uuid        not null references public.diaries(id) on delete cascade,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (diary_id, user_id)
);

create index if not exists idx_diary_reactions_diary
  on public.diary_reactions (diary_id);

create index if not exists idx_diary_reactions_user
  on public.diary_reactions (user_id);

-- ============================================================================
-- 3 · alerts · crisis keyword hits (staff-only reads · trigger writes)
-- ============================================================================
create table if not exists public.alerts (
  id                uuid        primary key default gen_random_uuid(),
  diary_id          uuid        references public.diaries(id) on delete set null,
  user_id           uuid        not null references auth.users(id) on delete cascade,
  matched_keywords  text[]      not null default '{}',
  alert_type        text        not null default 'crisis_keyword',
  school_id         uuid        references public.schools(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists idx_alerts_user_created
  on public.alerts (user_id, created_at desc);

create index if not exists idx_alerts_school_created
  on public.alerts (school_id, created_at desc);

-- ============================================================================
-- 4 · Helper · same_school(other)
-- ============================================================================
create or replace function public.same_school(other uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.school_memberships a
    join public.school_memberships b
      on a.school_id = b.school_id
    where a.user_id = auth.uid()
      and b.user_id = other
  );
$$;

revoke all on function public.same_school(uuid) from public;
grant execute on function public.same_school(uuid) to authenticated;

-- ============================================================================
-- 5 · Replace dangerous diaries_select_public
-- ============================================================================
drop policy if exists "diaries_select_public" on public.diaries;

create policy "diaries_select_public"
  on public.diaries
  for select
  using (
    is_public = true
    and auth.role() = 'authenticated'
    and (auth.uid() = user_id or public.same_school(user_id))
  );

-- ============================================================================
-- 6 · RLS · tenancy (minimal read for members)
-- ============================================================================
alter table public.schools             enable row level security;
alter table public.school_memberships  enable row level security;
alter table public.classes             enable row level security;
alter table public.class_memberships   enable row level security;

drop policy if exists "schools_select_member" on public.schools;
create policy "schools_select_member"
  on public.schools
  for select
  using (
    exists (
      select 1
      from public.school_memberships m
      where m.school_id = schools.id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "school_memberships_select_peer" on public.school_memberships;
create policy "school_memberships_select_peer"
  on public.school_memberships
  for select
  using (user_id = auth.uid() or public.same_school(user_id));

drop policy if exists "classes_select_member" on public.classes;
create policy "classes_select_member"
  on public.classes
  for select
  using (
    exists (
      select 1
      from public.school_memberships m
      where m.school_id = classes.school_id
        and m.user_id = auth.uid()
    )
  );

drop policy if exists "class_memberships_select_peer" on public.class_memberships;
create policy "class_memberships_select_peer"
  on public.class_memberships
  for select
  using (
    user_id = auth.uid()
    or exists (
      select 1
      from public.class_memberships mine
      where mine.class_id = class_memberships.class_id
        and mine.user_id = auth.uid()
    )
  );

-- ============================================================================
-- 7 · RLS · diary_reactions
-- ============================================================================
alter table public.diary_reactions enable row level security;

drop policy if exists "diary_reactions_select_visible" on public.diary_reactions;
create policy "diary_reactions_select_visible"
  on public.diary_reactions
  for select
  using (
    exists (
      select 1
      from public.diaries d
      where d.id = diary_reactions.diary_id
        and (
          d.user_id = auth.uid()
          or (
            d.is_public = true
            and (auth.uid() = d.user_id or public.same_school(d.user_id))
          )
        )
    )
  );

drop policy if exists "diary_reactions_insert_own" on public.diary_reactions;
create policy "diary_reactions_insert_own"
  on public.diary_reactions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "diary_reactions_delete_own" on public.diary_reactions;
create policy "diary_reactions_delete_own"
  on public.diary_reactions
  for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- 8 · RLS · alerts (no student select · staff same-school only · no client insert)
-- ============================================================================
alter table public.alerts enable row level security;

drop policy if exists "alerts_select_staff_same_school" on public.alerts;
create policy "alerts_select_staff_same_school"
  on public.alerts
  for select
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role in ('counsellor', 'school_admin', 'teacher')
        and public.same_school(alerts.user_id)
    )
  );

-- No insert/update/delete policies for authenticated · trigger / definer only.

revoke all on public.alerts from anon, authenticated;
grant select on public.alerts to authenticated;

-- ============================================================================
-- 9 · Crisis scan trigger (server-side only · never exposed to client writers)
-- ============================================================================
create or replace function public.scan_diary_crisis()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  keywords text[] := array['自殺', '跳樓', '不想活', '了結生命', '自殺念頭'];
  matched  text[] := '{}';
  kw       text;
  haystack text;
  v_school uuid;
begin
  if new.check_in_type = 'hug_only' then
    return new;
  end if;

  if new.diary_text is null or btrim(new.diary_text) = '' then
    return new;
  end if;

  haystack := lower(new.diary_text);

  foreach kw in array keywords loop
    if position(lower(kw) in haystack) > 0 then
      matched := array_append(matched, kw);
    end if;
  end loop;

  if coalesce(array_length(matched, 1), 0) = 0 then
    return new;
  end if;

  select m.school_id into v_school
  from public.school_memberships m
  where m.user_id = new.user_id
  order by m.created_at asc
  limit 1;

  insert into public.alerts (
    diary_id,
    user_id,
    matched_keywords,
    alert_type,
    school_id
  ) values (
    new.id,
    new.user_id,
    matched,
    'crisis_keyword',
    v_school
  );

  return new;
end;
$$;

drop trigger if exists trg_diaries_scan_crisis on public.diaries;
create trigger trg_diaries_scan_crisis
  after insert or update of diary_text
  on public.diaries
  for each row
  execute function public.scan_diary_crisis();

revoke all on function public.scan_diary_crisis() from public, anon, authenticated;

-- ============================================================================
-- 10 · RPC · save_ritual_entry (atomic diary + regulation history)
-- ============================================================================
create or replace function public.save_ritual_entry(
  p_soup               text    default null,
  p_body_chips         text[]  default '{}',
  p_bowl_emotion_key   text    default null,
  p_bowl_color_tint    text    default null,
  p_bowl_size          text    default 'M',
  p_bowl_steam         text    default null,
  p_diary_text         text    default null,
  p_check_in_type      text    default 'full',
  p_time_spent_sec     integer default null,
  p_smile_completed    boolean default false,
  p_ritual_version     text    default 'v1',
  p_is_public          boolean default false,
  p_shared_with_class  boolean default false,
  p_shared_with_family boolean default false,
  p_entry_date         date    default null,
  p_emotions           text[]  default '{}',
  p_energy_level       integer default null,
  p_is_secret          boolean default false,
  p_regulation_keys    text[]  default '{}'
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid   uuid := auth.uid();
  v_diary public.diaries;
  v_key   text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  insert into public.diaries (
    user_id,
    soup,
    body_chips,
    bowl_emotion_key,
    bowl_color_tint,
    bowl_size,
    bowl_steam,
    diary_text,
    check_in_type,
    time_spent_sec,
    smile_completed,
    ritual_version,
    is_public,
    shared_with_class,
    shared_with_family,
    entry_date,
    emotions,
    energy_level,
    is_secret
  ) values (
    v_uid,
    p_soup,
    coalesce(p_body_chips, '{}'),
    p_bowl_emotion_key,
    p_bowl_color_tint,
    coalesce(p_bowl_size, 'M'),
    p_bowl_steam,
    p_diary_text,
    coalesce(p_check_in_type, 'full'),
    p_time_spent_sec,
    coalesce(p_smile_completed, false),
    coalesce(p_ritual_version, 'v1'),
    coalesce(p_is_public, false) and not coalesce(p_is_secret, false),
    coalesce(p_shared_with_class, false),
    coalesce(p_shared_with_family, false),
    coalesce(p_entry_date, (now() at time zone 'utc')::date),
    coalesce(p_emotions, '{}'),
    p_energy_level,
    coalesce(p_is_secret, false)
  )
  returning * into v_diary;

  if p_regulation_keys is not null then
    foreach v_key in array p_regulation_keys loop
      if v_key is not null and btrim(v_key) <> '' then
        insert into public.relax_games_history (
          user_id,
          diary_id,
          activity_key,
          completed
        ) values (
          v_uid,
          v_diary.id,
          v_key,
          true
        );
      end if;
    end loop;
  end if;

  return to_json(v_diary);
end;
$$;

revoke all on function public.save_ritual_entry(
  text, text[], text, text, text, text, text, text, integer, boolean, text,
  boolean, boolean, boolean, date, text[], integer, boolean, text[]
) from public;
grant execute on function public.save_ritual_entry(
  text, text[], text, text, text, text, text, text, integer, boolean, text,
  boolean, boolean, boolean, date, text[], integer, boolean, text[]
) to authenticated;

-- ============================================================================
-- 11 · Grants
-- ============================================================================
grant select on public.schools             to authenticated;
grant select on public.school_memberships  to authenticated;
grant select on public.classes             to authenticated;
grant select on public.class_memberships   to authenticated;

grant select, insert, delete on public.diary_reactions to authenticated;

-- End of 004_phase2_community_crisis.sql
