-- Seed demo roles AFTER creating Auth users in Dashboard.
-- 1) Authentication → Users → Add user (email + password demo1234, auto-confirm)
-- 2) Apply migrations through 010_multi_school_prep.sql
-- 3) Run this script in SQL Editor

-- Assign roles
update public.profiles p
set
  role = v.role,
  display_name = coalesce(nullif(p.display_name, ''), v.display_name)
from auth.users u
join (
  values
    ('student@demo.moodful.app',    'student',      '陳小明'),
    ('student2@demo.moodful.app',   'student',      '學生 B'),
    ('teacher@demo.moodful.app',    'teacher',      '陳老師'),
    ('counsellor@demo.moodful.app', 'counsellor',   '李輔導'),
    ('parent@demo.moodful.app',     'parent',       '王太'),
    ('school@demo.moodful.app',     'school_admin', '校長')
) as v(email, role, display_name) on lower(u.email) = v.email
where p.id = u.id;

-- Demo school memberships (needed for adult community / alerts same_school)
insert into public.schools (id, name)
values ('00000000-0000-4000-8000-000000000001', 'Demo School')
on conflict (id) do nothing;

insert into public.school_memberships (school_id, user_id, role, is_primary)
select
  '00000000-0000-4000-8000-000000000001'::uuid,
  u.id,
  p.role,
  true
from auth.users u
join public.profiles p on p.id = u.id
where u.email like '%@demo.moodful.app'
on conflict (school_id, user_id) do update
set role = excluded.role,
    is_primary = true;

-- Keep profile.school_id aligned (010 trigger also does this)
update public.profiles p
set school_id = '00000000-0000-4000-8000-000000000001'::uuid
from auth.users u
where p.id = u.id
  and u.email like '%@demo.moodful.app';

insert into public.school_policies (school_id)
values ('00000000-0000-4000-8000-000000000001')
on conflict (school_id) do nothing;

-- Verify
select u.email, p.role, p.display_name, p.school_id
from public.profiles p
join auth.users u on u.id = p.id
where u.email like '%@demo.moodful.app'
order by u.email;
