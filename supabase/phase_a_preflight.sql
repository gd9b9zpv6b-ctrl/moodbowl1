-- Free pre-Phase A DB checklist · paste into Supabase SQL Editor → Run.
-- No paid tools. Fix any ❌ before inviting friends.

-- 1) Required columns / tables
select
  'diaries.notify_teacher' as check_item,
  exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='diaries' and column_name='notify_teacher'
  ) as ok
union all
select 'diaries.bowl_release',
  exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='diaries' and column_name='bowl_release'
  )
union all
select 'diaries.school_id',
  exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='diaries' and column_name='school_id'
  )
union all
select 'school_memberships.is_primary',
  exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='school_memberships' and column_name='is_primary'
  )
union all
select 'table school_policies',
  exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='school_policies'
  )
order by check_item;

-- 2) Demo accounts still one school (Phase A = single school)
select
  u.email,
  p.role,
  p.school_id as profile_school,
  m.school_id as membership_school
from auth.users u
join public.profiles p on p.id = u.id
left join public.school_memberships m on m.user_id = u.id
where u.email like '%@demo.moodful.app'
order by u.email;

-- Expect: every demo user has a membership_school, and all the same UUID.
