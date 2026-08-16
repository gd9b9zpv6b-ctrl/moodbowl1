-- Multi-school tenancy prep (while data volume is still small).
-- Safe to re-run. Does NOT require a second school yet.
--
-- Goals:
-- 1) One primary school per user
-- 2) Stamp school_id on diaries (and prefer it for alerts)
-- 3) Sync profiles.school_id from primary membership
-- 4) Stub school_policies / family_links / invite_codes for later product work
--
-- Phase A can stay on a single Demo School after this migration.

-- ============================================================================
-- 1 · Membership · primary school flag
-- ============================================================================
alter table public.school_memberships
  add column if not exists is_primary boolean not null default true;

comment on column public.school_memberships.is_primary is
  'Exactly one primary membership per user · primary-school product rule';

-- If a user somehow has multiple rows, keep earliest as primary.
with ranked as (
  select
    id,
    row_number() over (partition by user_id order by created_at asc, id asc) as rn
  from public.school_memberships
)
update public.school_memberships m
set is_primary = (ranked.rn = 1)
from ranked
where m.id = ranked.id;

create unique index if not exists school_memberships_one_primary_per_user
  on public.school_memberships (user_id)
  where is_primary;

-- ============================================================================
-- 2 · Helpers
-- ============================================================================
create or replace function public.primary_school_id_for(p_user uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select m.school_id
  from public.school_memberships m
  where m.user_id = p_user
  order by m.is_primary desc, m.created_at asc
  limit 1;
$$;

create or replace function public.current_school_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select public.primary_school_id_for(auth.uid());
$$;

revoke all on function public.primary_school_id_for(uuid) from public;
revoke all on function public.current_school_id() from public;
grant execute on function public.primary_school_id_for(uuid) to authenticated;
grant execute on function public.current_school_id() to authenticated;

-- ============================================================================
-- 3 · diaries.school_id + stamp trigger
-- ============================================================================
alter table public.diaries
  add column if not exists school_id uuid references public.schools(id) on delete set null;

create index if not exists idx_diaries_school_created
  on public.diaries (school_id, created_at desc);

comment on column public.diaries.school_id is
  'Tenant key · stamped from primary membership at insert';

-- Backfill from author membership (primary first).
update public.diaries d
set school_id = public.primary_school_id_for(d.user_id)
where d.school_id is null
  and public.primary_school_id_for(d.user_id) is not null;

create or replace function public.stamp_diary_school_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.school_id is null then
    new.school_id := public.primary_school_id_for(new.user_id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_diaries_stamp_school on public.diaries;
create trigger trg_diaries_stamp_school
  before insert on public.diaries
  for each row
  execute function public.stamp_diary_school_id();

revoke all on function public.stamp_diary_school_id() from public, anon, authenticated;

-- Tighten community SELECT: prefer school_id match; keep same_school fallback
-- for rows that predate backfill / users mid-onboarding.
drop policy if exists "diaries_select_public" on public.diaries;
create policy "diaries_select_public"
  on public.diaries
  for select
  using (
    is_public = true
    and auth.role() = 'authenticated'
    and (
      auth.uid() = user_id
      or (
        school_id is not null
        and school_id = public.current_school_id()
      )
      or public.same_school(user_id)
    )
  );

-- ============================================================================
-- 4 · Sync profiles.school_id from primary membership
-- ============================================================================
-- profiles.school_id already exists in base schema (no FK historically).
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_school_id_fkey'
  ) then
    begin
      alter table public.profiles
        add constraint profiles_school_id_fkey
        foreign key (school_id) references public.schools(id)
        on delete set null;
    exception
      when others then
        -- Skip FK if orphan school_id values exist; backfill still runs.
        raise notice 'profiles_school_id_fkey skipped: %', sqlerrm;
    end;
  end if;
end $$;

update public.profiles p
set school_id = public.primary_school_id_for(p.id)
where public.primary_school_id_for(p.id) is not null
  and p.school_id is distinct from public.primary_school_id_for(p.id);

-- BEFORE: demote other primaries so unique index allows the new primary row.
create or replace function public.school_membership_before_primary()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_primary then
    update public.school_memberships
    set is_primary = false
    where user_id = new.user_id
      and id is distinct from new.id
      and is_primary;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_membership_before_primary on public.school_memberships;
create trigger trg_membership_before_primary
  before insert or update of is_primary
  on public.school_memberships
  for each row
  execute function public.school_membership_before_primary();

create or replace function public.sync_profile_school_from_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    update public.profiles
    set school_id = public.primary_school_id_for(old.user_id)
    where id = old.user_id;
    return old;
  end if;

  update public.profiles
  set school_id = public.primary_school_id_for(new.user_id)
  where id = new.user_id;

  return new;
end;
$$;

drop trigger if exists trg_membership_sync_profile_school on public.school_memberships;
create trigger trg_membership_sync_profile_school
  after insert or update of school_id, is_primary or delete
  on public.school_memberships
  for each row
  execute function public.sync_profile_school_from_membership();

revoke all on function public.school_membership_before_primary() from public, anon, authenticated;
revoke all on function public.sync_profile_school_from_membership() from public, anon, authenticated;

-- ============================================================================
-- 5 · Crisis alerts · prefer diary.school_id / primary membership
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

  v_school := coalesce(new.school_id, public.primary_school_id_for(new.user_id));

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

-- Staff alerts: also allow school_id match when membership join fails mid-migration.
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
        and (
          (alerts.school_id is not null and alerts.school_id = public.current_school_id())
          or public.same_school(alerts.user_id)
        )
    )
  );

-- ============================================================================
-- 6 · Stub tables for one-school-one-set product surface
-- ============================================================================
create table if not exists public.school_policies (
  school_id               uuid primary key references public.schools(id) on delete cascade,
  community_enabled       boolean not null default true,
  family_notify_enabled   boolean not null default false,
  teacher_notify_enabled  boolean not null default true,
  crisis_keywords         text[]  not null default array['自殺', '跳樓', '不想活', '了結生命', '自殺念頭'],
  updated_at              timestamptz not null default now()
);

comment on table public.school_policies is
  'Per-school product policy · one row per school';

create table if not exists public.family_links (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references public.schools(id) on delete cascade,
  parent_user_id   uuid not null references auth.users(id) on delete cascade,
  student_user_id  uuid not null references auth.users(id) on delete cascade,
  created_at       timestamptz not null default now(),
  unique (parent_user_id, student_user_id)
);

create index if not exists idx_family_links_school
  on public.family_links (school_id);

create index if not exists idx_family_links_parent
  on public.family_links (parent_user_id);

create index if not exists idx_family_links_student
  on public.family_links (student_user_id);

comment on table public.family_links is
  'Parent↔student link · always scoped to one school';

create table if not exists public.invite_codes (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.schools(id) on delete cascade,
  code         text not null,
  role         text not null default 'student'
               check (role in ('student','teacher','counsellor','parent','school_admin')),
  class_id     uuid references public.classes(id) on delete set null,
  max_uses     integer,
  uses_count   integer not null default 0,
  expires_at   timestamptz,
  created_at   timestamptz not null default now(),
  unique (school_id, code)
);

create index if not exists idx_invite_codes_school
  on public.invite_codes (school_id);

comment on table public.invite_codes is
  'School-scoped invite codes · uniqueness is per school, not global';

alter table public.school_policies enable row level security;
alter table public.family_links    enable row level security;
alter table public.invite_codes    enable row level security;

-- Read own school only · writes remain service-role / future Edge Functions.
drop policy if exists "school_policies_select_member" on public.school_policies;
create policy "school_policies_select_member"
  on public.school_policies
  for select
  using (school_id = public.current_school_id());

drop policy if exists "family_links_select_party" on public.family_links;
create policy "family_links_select_party"
  on public.family_links
  for select
  using (
    school_id = public.current_school_id()
    and (
      parent_user_id = auth.uid()
      or student_user_id = auth.uid()
      or exists (
        select 1 from public.profiles p
        where p.id = auth.uid()
          and p.role in ('counsellor', 'school_admin')
      )
    )
  );

drop policy if exists "invite_codes_select_admin" on public.invite_codes;
create policy "invite_codes_select_admin"
  on public.invite_codes
  for select
  using (
    school_id = public.current_school_id()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role = 'school_admin'
    )
  );

grant select on public.school_policies to authenticated;
grant select on public.family_links    to authenticated;
grant select on public.invite_codes    to authenticated;

-- Seed empty policy row for every existing school.
insert into public.school_policies (school_id)
select s.id from public.schools s
on conflict (school_id) do nothing;

-- ============================================================================
-- 7 · Classes unique per school (name collision across schools is OK)
-- ============================================================================
create unique index if not exists classes_school_name_unique
  on public.classes (school_id, name);

-- End of 010_multi_school_prep.sql
