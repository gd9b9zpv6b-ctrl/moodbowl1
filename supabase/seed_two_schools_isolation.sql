-- OPTIONAL verification · two-school isolation smoke (SQL Editor).
-- Does NOT create Auth users. After you create:
--   school_a_student@demo.moodful.app
--   school_b_student@demo.moodful.app
--   (password any; auto-confirm)
-- run this script, then manually confirm community/alerts cannot cross schools.
--
-- Safe for empty projects: creates School A / School B and memberships when users exist.

insert into public.schools (id, name)
values
  ('00000000-0000-4000-8000-0000000000a1', '試用校 A'),
  ('00000000-0000-4000-8000-0000000000b2', '試用校 B')
on conflict (id) do update set name = excluded.name;

-- Attach A student
insert into public.school_memberships (school_id, user_id, role, is_primary)
select
  '00000000-0000-4000-8000-0000000000a1'::uuid,
  u.id,
  'student',
  true
from auth.users u
where lower(u.email) = 'school_a_student@demo.moodful.app'
on conflict (school_id, user_id) do update
set role = excluded.role, is_primary = true;

-- Attach B student
insert into public.school_memberships (school_id, user_id, role, is_primary)
select
  '00000000-0000-4000-8000-0000000000b2'::uuid,
  u.id,
  'student',
  true
from auth.users u
where lower(u.email) = 'school_b_student@demo.moodful.app'
on conflict (school_id, user_id) do update
set role = excluded.role, is_primary = true;

insert into public.school_policies (school_id)
values
  ('00000000-0000-4000-8000-0000000000a1'),
  ('00000000-0000-4000-8000-0000000000b2')
on conflict (school_id) do nothing;

-- Show membership map
select
  u.email,
  s.name as school,
  m.is_primary,
  p.school_id as profile_school_id
from auth.users u
join public.school_memberships m on m.user_id = u.id
join public.schools s on s.id = m.school_id
join public.profiles p on p.id = u.id
where lower(u.email) in (
  'school_a_student@demo.moodful.app',
  'school_b_student@demo.moodful.app'
)
order by u.email;

-- Manual check after each student posts is_public=true diary:
-- As A: select id, school_id, diary_text from diaries where is_public · should not see B rows.
-- As B: same.
